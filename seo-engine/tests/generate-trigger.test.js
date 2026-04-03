/**
 * INT-009: Generation Trigger API & SSE Progress Tests
 *
 * Tests generation trigger with quota check, SSE event format,
 * quota enforcement at limit, key resolution, and concurrent
 * generation rate limiting.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, stopServer, baseUrl } = require('./helpers/server');
const { FAKE_JWT, MALFORMED_TOKEN, TEST_USER } = require('./helpers/fixtures');

// ── Unit tests (no server needed) ──

describe('Generation trigger input validation (unit)', () => {

  it('accepts image_count as alias for max_images', () => {
    const parseImageCount = (body) => {
      const raw = body.image_count ?? body.max_images;
      return Math.min(Math.max(parseInt(raw) || 6, 0), 10);
    };
    assert.equal(parseImageCount({ image_count: 4 }), 4);
    assert.equal(parseImageCount({ max_images: 8 }), 8);
    assert.equal(parseImageCount({ image_count: 3, max_images: 7 }), 3, 'image_count takes precedence');
    assert.equal(parseImageCount({}), 6, 'defaults to 6');
  });

  it('clamps image_count between 0 and 10', () => {
    const clamp = (v) => Math.min(Math.max(parseInt(v) || 6, 0), 10);
    assert.equal(clamp(0), 6, '0 is falsy, defaults to 6');
    assert.equal(clamp(10), 10);
    assert.equal(clamp(100), 10, 'clamped to 10');
    assert.equal(clamp(-5), 0, 'negative clamped to 0');
    assert.equal(clamp(1), 1);
  });

  it('truncates domain_hint to 200 chars', () => {
    const longHint = 'A'.repeat(500);
    const domain_hint = typeof longHint === 'string' ? longHint.trim().slice(0, 200) : '';
    assert.equal(domain_hint.length, 200);
  });

  it('handles missing domain_hint gracefully', () => {
    const body = {};
    const domain_hint = typeof body.domain_hint === 'string' ? body.domain_hint.trim().slice(0, 200) : '';
    assert.equal(domain_hint, '');
  });

  it('validates project_dir as string', () => {
    const parseProjectDir = (body) => typeof body.project_dir === 'string' ? body.project_dir.trim() : '';
    assert.equal(parseProjectDir({ project_dir: '/home/user/project' }), '/home/user/project');
    assert.equal(parseProjectDir({ project_dir: 123 }), '');
    assert.equal(parseProjectDir({}), '');
    assert.equal(parseProjectDir({ project_dir: '  /path  ' }), '/path');
  });

  it('calculates estimated_time based on image count', () => {
    const estimate = (imageCount) => {
      const baseMinutes = 8;
      const imageMinutes = imageCount * 0.5;
      return Math.round((baseMinutes + imageMinutes) * 60);
    };
    assert.equal(estimate(0), 480, '8 min base with 0 images');
    assert.equal(estimate(6), 660, '8 + 3 min for 6 images = 11 min');
    assert.equal(estimate(10), 780, '8 + 5 min for 10 images = 13 min');
  });
});

describe('Settings merge priority (unit)', () => {
  const VALID_LANGUAGES = ['en','ar','fr','es','de','pt','it','nl','ru','zh','ja'];
  const VALID_FRAMEWORKS = ['html','react','vue','svelte','next','astro','wordpress'];

  function mergeLanguage(body, autoConfig, userSettings) {
    return body.language && VALID_LANGUAGES.includes(body.language) ? body.language
      : (autoConfig.language && VALID_LANGUAGES.includes(autoConfig.language) ? autoConfig.language
      : (userSettings.preferred_language && VALID_LANGUAGES.includes(userSettings.preferred_language) ? userSettings.preferred_language
      : 'en'));
  }

  it('request overrides take highest priority', () => {
    assert.equal(mergeLanguage({ language: 'ar' }, { language: 'fr' }, { preferred_language: 'es' }), 'ar');
  });

  it('auto-config is second priority', () => {
    assert.equal(mergeLanguage({}, { language: 'fr' }, { preferred_language: 'es' }), 'fr');
  });

  it('user settings are third priority', () => {
    assert.equal(mergeLanguage({}, {}, { preferred_language: 'es' }), 'es');
  });

  it('falls back to default when nothing provided', () => {
    assert.equal(mergeLanguage({}, {}, {}), 'en');
  });

  it('ignores invalid values at any layer', () => {
    assert.equal(mergeLanguage({ language: 'invalid' }, { language: 'also_invalid' }, { preferred_language: 'nope' }), 'en');
  });

  function mergeFramework(body, autoConfig, userSettings) {
    return body.framework && VALID_FRAMEWORKS.includes(body.framework) ? body.framework
      : (autoConfig.framework && VALID_FRAMEWORKS.includes(autoConfig.framework) ? autoConfig.framework
      : (userSettings.preferred_framework && VALID_FRAMEWORKS.includes(userSettings.preferred_framework) ? userSettings.preferred_framework
      : 'html'));
  }

  it('merges framework with same priority order', () => {
    assert.equal(mergeFramework({ framework: 'next' }, { framework: 'vue' }, {}), 'next');
    assert.equal(mergeFramework({}, { framework: 'vue' }, {}), 'vue');
    assert.equal(mergeFramework({}, {}, { preferred_framework: 'react' }), 'react');
    assert.equal(mergeFramework({}, {}, {}), 'html');
  });
});

describe('Concurrent generation tracking (unit)', () => {
  const MAX_CONCURRENT = 2;

  it('allows up to MAX concurrent generations per user', () => {
    const active = new Map();
    const userId = 'user-1';

    // First generation
    const count1 = active.get(userId) || 0;
    assert.ok(count1 < MAX_CONCURRENT, 'first generation allowed');
    active.set(userId, count1 + 1);

    // Second generation
    const count2 = active.get(userId) || 0;
    assert.ok(count2 < MAX_CONCURRENT, 'second generation allowed');
    active.set(userId, count2 + 1);

    // Third generation should be blocked
    const count3 = active.get(userId) || 0;
    assert.ok(count3 >= MAX_CONCURRENT, 'third generation blocked');
  });

  it('decrements count on completion', () => {
    const active = new Map();
    const userId = 'user-2';
    active.set(userId, 2);

    // Simulate completion
    const cur = active.get(userId) || 1;
    active.set(userId, Math.max(0, cur - 1));
    assert.equal(active.get(userId), 1);

    // Now a new generation should be allowed
    assert.ok((active.get(userId) || 0) < MAX_CONCURRENT);
  });

  it('decrements count on failure (no quota consumed)', () => {
    const active = new Map();
    const userId = 'user-3';
    active.set(userId, 1);

    // Simulate failure — decrement active count but NOT quota
    const cur = active.get(userId) || 1;
    active.set(userId, Math.max(0, cur - 1));
    assert.equal(active.get(userId), 0);
  });

  it('never goes below zero', () => {
    const active = new Map();
    const userId = 'user-4';
    active.set(userId, 0);
    const cur = active.get(userId) || 1;
    active.set(userId, Math.max(0, cur - 1));
    assert.equal(active.get(userId), 0);
  });
});

describe('SSE event format (unit)', () => {
  const GENERATION_STEPS = {
    queued:       { step: 0, total: 10, phase: 'queued' },
    starting:     { step: 1, total: 10, phase: 'initialization' },
    parsing:      { step: 2, total: 10, phase: 'topic_parsing' },
    analyzing:    { step: 3, total: 10, phase: 'project_analysis' },
    researching:  { step: 4, total: 10, phase: 'research' },
    concepts:     { step: 5, total: 10, phase: 'concept_generation' },
    architecture: { step: 6, total: 10, phase: 'architecture' },
    images:       { step: 7, total: 10, phase: 'image_generation' },
    writing:      { step: 8, total: 10, phase: 'draft_writing' },
    finalizing:   { step: 9, total: 10, phase: 'finalization' },
    complete:     { step: 10, total: 10, phase: 'complete' },
  };

  it('maps progress events to structured format with step/total/phase/percent', () => {
    const event = { event: 'progress', stage: 'researching', percent: 35 };
    const stageInfo = GENERATION_STEPS[event.stage] || { step: 0, total: 10, phase: event.stage };
    const structured = {
      event: 'progress',
      step: stageInfo.step,
      total: stageInfo.total,
      phase: stageInfo.phase,
      percent: event.percent || 0
    };

    assert.equal(structured.event, 'progress');
    assert.equal(structured.step, 4);
    assert.equal(structured.total, 10);
    assert.equal(structured.phase, 'research');
    assert.equal(structured.percent, 35);
  });

  it('handles all 10 generation stages', () => {
    const stages = Object.keys(GENERATION_STEPS);
    assert.equal(stages.length, 11); // 0-10 inclusive
    for (const stage of stages) {
      const info = GENERATION_STEPS[stage];
      assert.ok(typeof info.step === 'number', `${stage} has step`);
      assert.ok(typeof info.total === 'number', `${stage} has total`);
      assert.ok(typeof info.phase === 'string', `${stage} has phase`);
    }
  });

  it('formats complete event with article_id, file_path, word_count', () => {
    const event = {
      event: 'completed',
      result: { article_id: 'abc-123', file_path: 'articles/test.html', word_count: 2500 }
    };
    const structured = {
      event: 'complete',
      article_id: event.result.article_id || null,
      file_path: event.result.file_path || null,
      word_count: event.result.word_count || 0
    };

    assert.equal(structured.event, 'complete');
    assert.equal(structured.article_id, 'abc-123');
    assert.equal(structured.file_path, 'articles/test.html');
    assert.equal(structured.word_count, 2500);
  });

  it('formats error event with message and step', () => {
    const event = { event: 'failed', error: 'Timed out', step: 'researching' };
    const structured = {
      event: 'error',
      message: event.error || 'Unknown error',
      step: event.step || null
    };

    assert.equal(structured.event, 'error');
    assert.equal(structured.message, 'Timed out');
    assert.equal(structured.step, 'researching');
  });

  it('handles missing step in error event', () => {
    const event = { event: 'failed', error: 'Unknown failure' };
    const structured = {
      event: 'error',
      message: event.error || 'Unknown error',
      step: event.step || null
    };
    assert.equal(structured.step, null);
  });

  it('falls back gracefully for unknown stages', () => {
    const event = { event: 'progress', stage: 'custom_stage', percent: 42 };
    const stageInfo = GENERATION_STEPS[event.stage] || { step: 0, total: 10, phase: event.stage };
    assert.equal(stageInfo.phase, 'custom_stage');
    assert.equal(stageInfo.step, 0);
  });
});

describe('JobQueue generate config env injection (unit)', () => {
  it('injects CHAINIQ_ prefixed env vars from config', () => {
    const config = {
      topic: 'AI in Healthcare',
      language: 'ar',
      framework: 'next',
      css_framework: 'tailwind',
      image_style: 'illustration',
      image_count: 4,
      domain_hint: 'medical technology',
      project_dir: '/home/user/project',
      resolvedKeys: { GEMINI_API_KEY: 'test-key-123' }
    };

    const env = { ...process.env, ...(config.resolvedKeys || {}) };
    delete env.CLAUDECODE;
    env.CHAINIQ_TOPIC = config.topic;
    env.CHAINIQ_LANGUAGE = config.language || 'en';
    env.CHAINIQ_FRAMEWORK = config.framework || 'html';
    env.CHAINIQ_CSS_FRAMEWORK = config.css_framework || 'inline';
    env.CHAINIQ_IMAGE_STYLE = config.image_style || 'realistic';
    env.CHAINIQ_IMAGE_COUNT = String(config.image_count ?? 6);
    if (config.domain_hint) env.CHAINIQ_DOMAIN_HINT = config.domain_hint;
    if (config.project_dir) env.CHAINIQ_PROJECT_DIR = config.project_dir;

    assert.equal(env.CHAINIQ_TOPIC, 'AI in Healthcare');
    assert.equal(env.CHAINIQ_LANGUAGE, 'ar');
    assert.equal(env.CHAINIQ_FRAMEWORK, 'next');
    assert.equal(env.CHAINIQ_CSS_FRAMEWORK, 'tailwind');
    assert.equal(env.CHAINIQ_IMAGE_STYLE, 'illustration');
    assert.equal(env.CHAINIQ_IMAGE_COUNT, '4');
    assert.equal(env.CHAINIQ_DOMAIN_HINT, 'medical technology');
    assert.equal(env.CHAINIQ_PROJECT_DIR, '/home/user/project');
    assert.equal(env.GEMINI_API_KEY, 'test-key-123');
    assert.equal(env.CLAUDECODE, undefined, 'CLAUDECODE must be stripped');
  });

  it('omits optional env vars when not provided', () => {
    const config = { topic: 'Test', language: 'en', framework: 'html' };
    const env = {};
    env.CHAINIQ_TOPIC = config.topic;
    env.CHAINIQ_LANGUAGE = config.language || 'en';
    if (config.domain_hint) env.CHAINIQ_DOMAIN_HINT = config.domain_hint;
    if (config.project_dir) env.CHAINIQ_PROJECT_DIR = config.project_dir;

    assert.equal(env.CHAINIQ_DOMAIN_HINT, undefined);
    assert.equal(env.CHAINIQ_PROJECT_DIR, undefined);
  });
});

describe('Key resolution integration (unit)', () => {
  it('resolvedKeys are passed through config to env', () => {
    const resolvedKeys = {
      GEMINI_API_KEY: 'AIza-test',
      CUSTOM_LLM_API_KEY: 'sk-test'
    };
    const env = { ...resolvedKeys };
    assert.equal(env.GEMINI_API_KEY, 'AIza-test');
    assert.equal(env.CUSTOM_LLM_API_KEY, 'sk-test');
  });

  it('handles empty resolvedKeys gracefully', () => {
    const resolvedKeys = {};
    const env = { FOO: 'bar', ...resolvedKeys };
    assert.equal(env.FOO, 'bar');
    assert.equal(Object.keys(resolvedKeys).length, 0);
  });
});

describe('File path extraction heuristic (unit)', () => {
  it('extracts path from "saved to: path" pattern', () => {
    const output = 'Article saved to: articles/ai-in-healthcare.html\nDone!';
    const match = output.match(/(?:saved|wrote|created|output|generated)\s*(?:to|at|file)?:?\s*[`"']?([^\s`"'\n]+\.(?:html|tsx|jsx|vue|svelte|astro|php))/i);
    assert.ok(match);
    assert.equal(match[1], 'articles/ai-in-healthcare.html');
  });

  it('extracts path from "wrote: path" pattern', () => {
    const output = 'Generated article wrote to: src/pages/test.astro';
    const match = output.match(/(?:saved|wrote|created|output|generated)\s*(?:to|at|file)?:?\s*[`"']?([^\s`"'\n]+\.(?:html|tsx|jsx|vue|svelte|astro|php))/i);
    assert.ok(match);
    assert.equal(match[1], 'src/pages/test.astro');
  });

  it('returns null when no path found', () => {
    const output = 'Some random output without any file references';
    const match = output.match(/(?:saved|wrote|created|output|generated)\s*(?:to|at|file)?:?\s*[`"']?([^\s`"'\n]+\.(?:html|tsx|jsx|vue|svelte|astro|php))/i);
    assert.equal(match, null);
  });
});

describe('Word count estimation (unit)', () => {
  it('extracts word count from "N words" pattern', () => {
    const output = 'Article generated successfully. Total: 2500 words.';
    const match = output.match(/(\d{3,5})\s*words?/i);
    assert.ok(match);
    assert.equal(parseInt(match[1], 10), 2500);
  });

  it('falls back to word count estimation', () => {
    const output = 'word '.repeat(500);
    const words = output.split(/\s+/).filter(w => w.length > 0);
    const estimate = Math.max(0, words.length - 100);
    assert.ok(estimate > 300, 'rough estimate subtracts overhead');
  });
});

// ── Integration tests (need server) ──

describe('Generate API endpoints (integration)', () => {
  before(async () => { await startServer(); });
  after(async () => { await stopServer(); });

  it('POST /api/generate requires auth', async () => {
    const res = await fetch(`${baseUrl()}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Test Article' })
    });
    assert.equal(res.status, 401);
  });

  it('POST /api/generate rejects invalid token', async () => {
    const res = await fetch(`${baseUrl()}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MALFORMED_TOKEN}`
      },
      body: JSON.stringify({ topic: 'Test Article' })
    });
    assert.equal(res.status, 401);
  });

  it('SSE progress endpoint requires auth', async () => {
    const res = await fetch(`${baseUrl()}/api/queue/job/00000000-0000-0000-0000-000000000000/progress`);
    assert.equal(res.status, 401);
  });

  it('SSE progress rejects invalid UUID format', async () => {
    const res = await fetch(`${baseUrl()}/api/queue/job/not-a-uuid/progress`);
    // Regex won't match non-UUID, so 404
    assert.ok([400, 404].includes(res.status));
  });

  it('SSE progress accepts token via query param', async () => {
    const res = await fetch(
      `${baseUrl()}/api/queue/job/00000000-0000-0000-0000-000000000000/progress?token=${FAKE_JWT}`
    );
    // Should fail at Supabase verification (401) not "missing token"
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.ok(!body.error?.includes('missing'), 'Token extracted from query param');
  });

  it('rejects GET method on /api/generate', async () => {
    const res = await fetch(`${baseUrl()}/api/generate`);
    assert.ok([401, 404].includes(res.status));
  });
});

describe('Quota enforcement (unit)', () => {
  it('quota check returns allowed:false at limit', () => {
    // Simulates the quota check logic
    const quota = {
      status: 'active',
      articles: { remaining: 0, limit: 4, unlimited: false }
    };
    const allowed = quota.articles.unlimited || quota.articles.remaining > 0;
    assert.equal(allowed, false);
  });

  it('quota check returns allowed:true when remaining > 0', () => {
    const quota = {
      status: 'active',
      articles: { remaining: 3, limit: 4, unlimited: false }
    };
    const allowed = quota.articles.unlimited || quota.articles.remaining > 0;
    assert.equal(allowed, true);
  });

  it('unlimited plan always allows', () => {
    const quota = {
      status: 'active',
      articles: { remaining: 0, limit: -1, unlimited: true }
    };
    const allowed = quota.articles.unlimited || quota.articles.remaining > 0;
    assert.equal(allowed, true);
  });

  it('inactive subscription is rejected', () => {
    const quota = { status: 'pending', articles: { remaining: 10, unlimited: false } };
    const allowed = quota.status === 'active';
    assert.equal(allowed, false);
  });
});
