const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { JobQueue } = require('../bridge/job-queue');

// Mock supabase for queue tests
function createMockSupabase() {
  const jobs = [];
  let nextId = 1;
  return {
    jobs,
    createPipelineJob(_token, data) {
      const job = { id: `job-${nextId++}`, ...data, created_at: new Date().toISOString() };
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
      return {
        data: filtered.slice(0, limit),
        total: filtered.length,
        page: 1,
        limit
      };
    }
  };
}

describe('JobQueue', () => {
  it('creates a queue instance', () => {
    const queue = new JobQueue({ supabase: createMockSupabase(), projectDir: '/tmp', autoProcess: false });
    assert.ok(queue);
    assert.equal(queue.processing, false);
  });

  it('enqueues a job', async () => {
    const mock = createMockSupabase();
    const queue = new JobQueue({ supabase: mock, projectDir: '/tmp', autoProcess: false });

    const job = await queue.enqueue('token', {
      userId: 'user-1',
      type: 'generate',
      config: { topic: 'AI' }
    });

    assert.ok(job.id);
    assert.equal(job.status, 'queued');
    assert.equal(job.job_type, 'generate');
    assert.equal(mock.jobs.length, 1);
  });

  it('reports idle status when no jobs', () => {
    const queue = new JobQueue({ supabase: createMockSupabase(), projectDir: '/tmp', autoProcess: false });
    const status = queue.getStatus();
    assert.equal(status.processing, false);
    assert.equal(status.currentJob, null);
  });

  it('cancels a queued job', async () => {
    const mock = createMockSupabase();
    const queue = new JobQueue({ supabase: mock, projectDir: '/tmp', autoProcess: false });

    const job = await queue.enqueue('token', { userId: 'user-1', type: 'generate' });
    await queue.cancel('token', job.id);

    assert.equal(mock.jobs[0].status, 'cancelled');
  });

  it('subscribes to job events', async () => {
    const mock = createMockSupabase();
    const queue = new JobQueue({ supabase: mock, projectDir: '/tmp', autoProcess: false });

    const events = [];
    const job = await queue.enqueue('token', { userId: 'user-1', type: 'generate' });

    // Subscribe after enqueue — we'll test cancel event
    const unsub = queue.subscribe(job.id, (e) => events.push(e));
    await queue.cancel('token', job.id);

    assert.ok(events.some(e => e.event === 'cancelled'));
    unsub();
  });

  it('unsubscribes correctly', async () => {
    const mock = createMockSupabase();
    const queue = new JobQueue({ supabase: mock, projectDir: '/tmp', autoProcess: false });

    const events = [];
    const job = await queue.enqueue('token', { userId: 'user-1', type: 'generate' });

    const unsub = queue.subscribe(job.id, (e) => events.push(e));
    unsub();
    await queue.cancel('token', job.id);

    // Should have no events after unsubscribe
    assert.equal(events.filter(e => e.event === 'cancelled').length, 0);
  });

  it('enqueues multiple jobs', async () => {
    const mock = createMockSupabase();
    const queue = new JobQueue({ supabase: mock, projectDir: '/tmp', autoProcess: false });

    await queue.enqueue('token', { userId: 'user-1', type: 'generate', config: { topic: 'A' } });
    await queue.enqueue('token', { userId: 'user-1', type: 'generate', config: { topic: 'B' } });
    await queue.enqueue('token', { userId: 'user-1', type: 'edit', config: { prompt: 'test' } });

    assert.equal(mock.jobs.length, 3);
    assert.equal(mock.jobs[0].job_type, 'generate');
    assert.equal(mock.jobs[2].job_type, 'edit');
  });
});
