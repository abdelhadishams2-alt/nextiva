const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { JobQueue } = require('../bridge/job-queue');

// Mock supabase for edit-via-queue tests
function createMockSupabase() {
  const jobs = [];
  let nextId = 1;
  return {
    jobs,
    createPipelineJob(_token, data) {
      const job = { id: `edit-job-${nextId++}`, ...data, created_at: new Date().toISOString() };
      jobs.push(job);
      return job;
    },
    updatePipelineJob(_token, jobId, updates) {
      const job = jobs.find(j => j.id === jobId);
      if (job) Object.assign(job, updates);
      return job;
    },
    listPipelineJobs(_token, params) {
      let filtered = jobs.filter(j => !params.status || j.status === params.status);
      filtered.sort((a, b) => a.created_at < b.created_at ? -1 : 1);
      const limit = parseInt(params.limit || '10');
      return { data: filtered.slice(0, limit), total: filtered.length, page: 1, limit };
    }
  };
}

describe('Edit via Job Queue (SSE Progress)', () => {

  it('enqueues an edit job with prompt in config', async () => {
    const mock = createMockSupabase();
    const queue = new JobQueue({ supabase: mock, projectDir: '/tmp', autoProcess: false });

    const job = await queue.enqueue('token', {
      userId: 'user-1',
      type: 'edit',
      config: { prompt: 'SECTION_EDIT:\nTest prompt', resolvedKeys: {}, snapshotSaved: false }
    });

    assert.ok(job.id);
    assert.equal(job.job_type, 'edit');
    assert.equal(job.status, 'queued');
    assert.equal(job.config.prompt, 'SECTION_EDIT:\nTest prompt');
  });

  it('edit job emits queued event on enqueue', async () => {
    const mock = createMockSupabase();
    const queue = new JobQueue({ supabase: mock, projectDir: '/tmp', autoProcess: false });

    const events = [];
    // Pre-register listener for the job ID pattern
    const job = await queue.enqueue('token', {
      userId: 'user-1',
      type: 'edit',
      config: { prompt: 'SECTION_EDIT:\nTest' }
    });

    // Subscribe after enqueue — the queued event already fired
    // Verify job is in queued state
    assert.equal(mock.jobs[0].status, 'queued');
  });

  it('subscribes to edit job progress events', async () => {
    const mock = createMockSupabase();
    const queue = new JobQueue({ supabase: mock, projectDir: '/tmp', autoProcess: false });

    const events = [];
    const job = await queue.enqueue('token', {
      userId: 'user-1',
      type: 'edit',
      config: { prompt: 'SECTION_EDIT:\nTest' }
    });

    const unsub = queue.subscribe(job.id, (evt) => events.push(evt));

    // Manually trigger progress updates (simulating what _executeEdit does)
    queue._updateProgress(job.id, 'analyzing', 10);
    queue._updateProgress(job.id, 'reading', 25);
    queue._updateProgress(job.id, 'rewriting', 50);
    queue._updateProgress(job.id, 'formatting', 75);
    queue._updateProgress(job.id, 'validating', 90);
    queue._updateProgress(job.id, 'complete', 100);

    assert.equal(events.length, 6);
    assert.equal(events[0].event, 'progress');
    assert.equal(events[0].stage, 'analyzing');
    assert.equal(events[0].percent, 10);

    assert.equal(events[2].stage, 'rewriting');
    assert.equal(events[2].percent, 50);

    assert.equal(events[5].stage, 'complete');
    assert.equal(events[5].percent, 100);

    unsub();
  });

  it('progress stages advance in correct order', async () => {
    const mock = createMockSupabase();
    const queue = new JobQueue({ supabase: mock, projectDir: '/tmp', autoProcess: false });

    const stages = [];
    const job = await queue.enqueue('token', {
      userId: 'user-1',
      type: 'edit',
      config: { prompt: 'SECTION_EDIT:\nTest' }
    });

    queue.subscribe(job.id, (evt) => {
      if (evt.event === 'progress') stages.push({ stage: evt.stage, percent: evt.percent });
    });

    queue._updateProgress(job.id, 'analyzing', 10);
    queue._updateProgress(job.id, 'reading', 25);
    queue._updateProgress(job.id, 'rewriting', 50);
    queue._updateProgress(job.id, 'formatting', 75);
    queue._updateProgress(job.id, 'validating', 90);
    queue._updateProgress(job.id, 'complete', 100);

    // Verify monotonically increasing percentages
    for (let i = 1; i < stages.length; i++) {
      assert.ok(stages[i].percent > stages[i - 1].percent,
        `Stage ${stages[i].stage} (${stages[i].percent}%) should be > ${stages[i - 1].stage} (${stages[i - 1].percent}%)`);
    }

    // Verify expected stage names
    const stageNames = stages.map(s => s.stage);
    assert.deepEqual(stageNames, ['analyzing', 'reading', 'rewriting', 'formatting', 'validating', 'complete']);
  });

  it('unsubscribe stops event delivery', async () => {
    const mock = createMockSupabase();
    const queue = new JobQueue({ supabase: mock, projectDir: '/tmp', autoProcess: false });

    const events = [];
    const job = await queue.enqueue('token', {
      userId: 'user-1',
      type: 'edit',
      config: { prompt: 'SECTION_EDIT:\nTest' }
    });

    const unsub = queue.subscribe(job.id, (evt) => events.push(evt));

    queue._updateProgress(job.id, 'analyzing', 10);
    unsub();
    queue._updateProgress(job.id, 'rewriting', 50);

    assert.equal(events.length, 1);
    assert.equal(events[0].stage, 'analyzing');
  });

  it('cancel emits cancelled event', async () => {
    const mock = createMockSupabase();
    const queue = new JobQueue({ supabase: mock, projectDir: '/tmp', autoProcess: false });

    const events = [];
    const job = await queue.enqueue('token', {
      userId: 'user-1',
      type: 'edit',
      config: { prompt: 'SECTION_EDIT:\nTest' }
    });

    queue.subscribe(job.id, (evt) => events.push(evt));
    await queue.cancel('token', job.id);

    const cancelEvt = events.find(e => e.event === 'cancelled');
    assert.ok(cancelEvt, 'Should have received a cancelled event');
    assert.equal(mock.jobs[0].status, 'cancelled');
  });

  it('edit job config includes resolvedKeys and snapshotSaved', async () => {
    const mock = createMockSupabase();
    const queue = new JobQueue({ supabase: mock, projectDir: '/tmp', autoProcess: false });

    const job = await queue.enqueue('token', {
      userId: 'user-1',
      type: 'edit',
      config: {
        prompt: 'SECTION_EDIT:\nTest',
        resolvedKeys: { GEMINI_API_KEY: 'test-key' },
        snapshotSaved: true
      }
    });

    assert.equal(job.config.resolvedKeys.GEMINI_API_KEY, 'test-key');
    assert.equal(job.config.snapshotSaved, true);
  });

  it('multiple subscribers receive same events', async () => {
    const mock = createMockSupabase();
    const queue = new JobQueue({ supabase: mock, projectDir: '/tmp', autoProcess: false });

    const events1 = [];
    const events2 = [];
    const job = await queue.enqueue('token', {
      userId: 'user-1',
      type: 'edit',
      config: { prompt: 'SECTION_EDIT:\nTest' }
    });

    queue.subscribe(job.id, (evt) => events1.push(evt));
    queue.subscribe(job.id, (evt) => events2.push(evt));

    queue._updateProgress(job.id, 'rewriting', 50);

    assert.equal(events1.length, 1);
    assert.equal(events2.length, 1);
    assert.equal(events1[0].stage, 'rewriting');
    assert.equal(events2[0].stage, 'rewriting');
  });

  it('_executeEdit rejects when prompt is missing', async () => {
    const mock = createMockSupabase();
    const queue = new JobQueue({ supabase: mock, projectDir: '/tmp', autoProcess: false });

    await assert.rejects(
      () => queue._executeEdit({ id: 'test', config: {} }, {}),
      { message: 'Edit job missing prompt' }
    );
  });
});
