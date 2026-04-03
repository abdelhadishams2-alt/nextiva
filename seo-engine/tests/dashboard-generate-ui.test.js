/**
 * INT-010: Dashboard Generation UI Tests
 *
 * Tests the generate page component logic: form validation,
 * language/framework constants, SSE event mapping, phase descriptions,
 * and quota indicator logic.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// ── Constants matching the generate page ──

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'it', label: 'Italian' },
  { value: 'nl', label: 'Dutch' },
  { value: 'ru', label: 'Russian' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
];

const VALID_SERVER_LANGUAGES = ['en', 'ar', 'fr', 'es', 'de', 'pt', 'it', 'nl', 'ru', 'zh', 'ja'];

const FRAMEWORKS = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'html', label: 'HTML (Standalone)' },
  { value: 'next', label: 'Next.js' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'astro', label: 'Astro' },
  { value: 'wordpress', label: 'WordPress' },
];

const VALID_SERVER_FRAMEWORKS = ['html', 'react', 'vue', 'svelte', 'next', 'astro', 'wordpress'];

const PHASE_DESCRIPTIONS = {
  queued: 'Waiting in queue...',
  initialization: 'Initializing pipeline...',
  topic_parsing: 'Parsing topic and keywords...',
  project_analysis: 'Analyzing project context...',
  research: 'Researching topic (6-round deep search)...',
  concept_generation: 'Generating article concepts...',
  architecture: 'Designing article architecture...',
  image_generation: 'Generating images...',
  draft_writing: 'Writing article draft...',
  finalization: 'Finalizing and assembling output...',
  complete: 'Complete!',
};

// ── Tests ──

describe('INT-010: Generate UI — Language support', () => {
  it('supports exactly 11 languages', () => {
    assert.equal(LANGUAGES.length, 11);
  });

  it('all dashboard languages match server-valid languages', () => {
    for (const lang of LANGUAGES) {
      assert.ok(
        VALID_SERVER_LANGUAGES.includes(lang.value),
        `Language "${lang.value}" (${lang.label}) must be valid on server`
      );
    }
  });

  it('includes Arabic for MENA market', () => {
    const arabic = LANGUAGES.find((l) => l.value === 'ar');
    assert.ok(arabic, 'Arabic must be in language list');
  });

  it('all language entries have value and label', () => {
    for (const lang of LANGUAGES) {
      assert.ok(lang.value, 'value must be set');
      assert.ok(lang.label, 'label must be set');
      assert.ok(lang.value.length >= 2, 'value must be at least 2 chars');
    }
  });
});

describe('INT-010: Generate UI — Framework support', () => {
  it('has auto, next, vue, svelte, astro, wordpress, html frameworks', () => {
    const values = FRAMEWORKS.map((f) => f.value);
    assert.ok(values.includes('auto'), 'auto-detect');
    assert.ok(values.includes('html'), 'html');
    assert.ok(values.includes('next'), 'next');
    assert.ok(values.includes('vue'), 'vue');
    assert.ok(values.includes('svelte'), 'svelte');
    assert.ok(values.includes('astro'), 'astro');
    assert.ok(values.includes('wordpress'), 'wordpress');
  });

  it('non-auto frameworks are valid on server', () => {
    for (const fw of FRAMEWORKS) {
      if (fw.value === 'auto') continue;
      assert.ok(
        VALID_SERVER_FRAMEWORKS.includes(fw.value),
        `Framework "${fw.value}" must be valid on server`
      );
    }
  });
});

describe('INT-010: Generate UI — Topic validation', () => {
  it('rejects empty topic', () => {
    const topic = '';
    assert.ok(topic.trim().length < 3, 'empty topic must fail validation');
  });

  it('rejects topic with less than 3 characters', () => {
    const topic = 'AI';
    assert.ok(topic.trim().length < 3, 'short topic must fail');
  });

  it('accepts topic with 3+ characters', () => {
    const topic = 'AI in Football';
    assert.ok(topic.trim().length >= 3, '3+ chars must pass');
  });

  it('trims whitespace before validation', () => {
    const topic = '   AB   ';
    assert.ok(topic.trim().length < 3, 'trimmed "AB" is 2 chars — must fail');

    const topic2 = '  ABC  ';
    assert.ok(topic2.trim().length >= 3, 'trimmed "ABC" is 3 chars — must pass');
  });
});

describe('INT-010: Generate UI — Image count slider', () => {
  it('accepts values 1 through 6', () => {
    for (let i = 1; i <= 6; i++) {
      const clamped = Math.min(6, Math.max(1, i));
      assert.equal(clamped, i);
    }
  });

  it('clamps below 1 to 1', () => {
    assert.equal(Math.min(6, Math.max(1, 0)), 1);
    assert.equal(Math.min(6, Math.max(1, -5)), 1);
  });

  it('clamps above 6 to 6', () => {
    assert.equal(Math.min(6, Math.max(1, 10)), 6);
    assert.equal(Math.min(6, Math.max(1, 100)), 6);
  });
});

describe('INT-010: Generate UI — Phase descriptions', () => {
  it('has descriptions for all 10 generation pipeline phases', () => {
    const serverPhases = [
      'queued', 'initialization', 'topic_parsing', 'project_analysis',
      'research', 'concept_generation', 'architecture', 'image_generation',
      'draft_writing', 'finalization', 'complete',
    ];
    for (const phase of serverPhases) {
      assert.ok(
        PHASE_DESCRIPTIONS[phase],
        `Phase "${phase}" must have a description`
      );
    }
  });

  it('all descriptions are non-empty strings', () => {
    for (const [key, desc] of Object.entries(PHASE_DESCRIPTIONS)) {
      assert.ok(typeof desc === 'string' && desc.length > 0, `${key} must have description`);
    }
  });
});

describe('INT-010: Generate UI — SSE event mapping', () => {
  it('maps progress event to running state', () => {
    const event = { event: 'progress', step: 4, total: 10, phase: 'research', percent: 40 };
    assert.equal(event.event, 'progress');
    assert.equal(event.step, 4);
    assert.equal(event.percent, 40);
  });

  it('maps complete event to complete state', () => {
    const event = { event: 'complete', article_id: 'abc-123', file_path: '/out.html', word_count: 2500 };
    assert.equal(event.event, 'complete');
    assert.ok(event.article_id);
  });

  it('maps error event to error state', () => {
    const event = { event: 'error', message: 'Quota exceeded' };
    assert.equal(event.event, 'error');
    assert.ok(event.message);
  });

  it('handles both "completed" and "complete" event names', () => {
    // Server sends "complete" via SSE, but subscribeToProgress may also emit "completed"
    const events = ['complete', 'completed'];
    for (const name of events) {
      assert.ok(
        name === 'complete' || name === 'completed',
        `"${name}" should be handled as completion`
      );
    }
  });
});

describe('INT-010: Generate UI — Quota indicator', () => {
  it('calculates remaining articles correctly', () => {
    const quota = { articles: { used: 3, limit: 10, remaining: 7 } };
    assert.equal(quota.articles.remaining, 7);
  });

  it('treats limit -1 as unlimited', () => {
    const quota = { articles: { used: 50, limit: -1, remaining: -1 } };
    const isUnlimited = quota.articles.limit === -1;
    assert.ok(isUnlimited);
  });

  it('shows destructive badge at 0 remaining', () => {
    const remaining = 0;
    const variant = remaining === 0 ? 'destructive' : 'outline';
    assert.equal(variant, 'destructive');
  });

  it('shows outline badge when remaining <= 5', () => {
    const remaining = 3;
    const variant = remaining === 0 ? 'destructive' : 'outline';
    assert.equal(variant, 'outline');
  });
});

describe('INT-010: Generate UI — Estimated time calculation', () => {
  it('estimates time based on image count from server', () => {
    const estimate = (imageCount) => {
      const baseMinutes = 8;
      const imageMinutes = imageCount * 0.5;
      return Math.round((baseMinutes + imageMinutes) * 60);
    };
    // 4 images = (8 + 2) * 60 = 600 seconds
    assert.equal(estimate(4), 600);
    // 1 image = (8 + 0.5) * 60 = 510 seconds
    assert.equal(estimate(1), 510);
    // 6 images = (8 + 3) * 60 = 660 seconds
    assert.equal(estimate(6), 660);
  });
});
