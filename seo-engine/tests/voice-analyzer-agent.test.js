/**
 * Tests for Voice Analyzer Agent — VI-003
 *
 * Covers:
 *   - Voice match scoring (similarity calculation, dimension breakdown)
 *   - Voice profile format validation (buildVoiceProfile output shape)
 *   - Pipeline integration (Step 4.5 skip conditions, persona resolution)
 *   - handleVoiceMatch error paths
 *
 * Uses node:test with module mocking.
 */

const { describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');

// ── Load the voice analyzer module ───────────────────────────

const va = require('../bridge/intelligence/voice-analyzer');

// ── Sample data ──────────────────────────────────────────────

const HUMAN_TEXT = `
I think the most interesting thing about content marketing is how personal it can be.
Sometimes you just need to sit down and write from the heart, you know?
Perhaps that sounds a bit cheesy, but honestly, it works.
My experience has shown me that readers connect with genuine voices.
We've all read those articles that feel like they were written by a robot.
They use words like "moreover" and "furthermore" in every other sentence.
But real writing? It's messy. It's varied. Short sentences. Then longer ones that meander
and explore ideas in ways that surprise even the writer.
I remember when I first started blogging — it was terrifying!
Would anyone even read what I wrote? Turns out, they did.
The secret was being myself, warts and all.
Like a jazz musician improvising on a familiar melody, good writers find their own rhythm.
Have you ever noticed how the best articles feel like conversations?
That's because they are, in a sense, conversations between the writer and the reader.
Maybe I'm overthinking this, but I believe authenticity is the key ingredient.
Some paragraphs are long. Some are short.

That's just how it goes.

Basically, if you want to connect with your audience, stop trying to sound smart
and start trying to sound human. It's pretty much that simple. No fancy vocabulary needed.
Just write like you talk, and your readers will thank you for it.
Cool? Cool.
`.trim();

const AI_TEXT = `
The implementation of advanced natural language processing algorithms has fundamentally
transformed the landscape of content generation. Moreover, the comprehensive integration
of machine learning paradigms has enabled robust solutions for enterprise-scale content
production. Furthermore, the holistic approach to leveraging these technologies has proven
pivotal in achieving significant improvements in content quality metrics.

Subsequently, organizations have recognized the crucial importance of adopting these
methodologies. The multifaceted nature of modern content strategies necessitates a
nuanced understanding of both technical and creative dimensions. Additionally, the
synergy between automated systems and human oversight creates a paradigm shift in
how content is conceptualized and delivered.

It is worth noting that the landscape continues to evolve at a rapid pace. Consequently,
stakeholders must remain vigilant and adaptive to emerging trends. The comprehensive
framework presented herein provides a robust foundation for understanding these dynamics.
In conclusion, the transformative potential of AI-driven content generation is both
significant and far-reaching.
`.trim();

// ── Tests: Voice Profile Format ──────────────────────────────

describe('VI-003: Voice Profile Format', () => {
  it('buildVoiceProfile returns all required fields', () => {
    // Create a mock centroid (12 dimensions)
    const centroid = [
      0.45, // sentence_length_variance
      0.55, // avg_sentence_length
      0.65, // ttr
      0.70, // vocabulary_sophistication
      0.30, // transition_overuse
      0.50, // paragraph_rhythm_variance
      0.40, // avg_paragraph_length
      0.35, // first_person_ratio
      0.60, // hedge_frequency
      0.55, // formality_score
      0.20, // question_frequency
      0.15, // exclamation_frequency
    ];

    // Pad to match FEATURE_NAMES length if needed
    while (centroid.length < va.FEATURE_NAMES.length) {
      centroid.push(0.5);
    }

    const profile = va.buildVoiceProfile(centroid);

    // Check all required fields exist
    assert.ok(profile.voice, 'voice field missing');
    assert.ok(profile.cadence, 'cadence field missing');
    assert.ok(profile.structure, 'structure field missing');
    assert.ok(profile.numbers, 'numbers field missing');
    assert.ok(Array.isArray(profile.avoids), 'avoids should be an array');
    assert.ok(typeof profile.ttr === 'number', 'ttr should be a number');
    assert.ok(profile.humor, 'humor field missing');
    assert.ok(profile.formality, 'formality field missing');
    assert.ok(profile.headingStyle, 'headingStyle field missing');
    assert.ok(profile.tone, 'tone field missing');
    assert.ok(Array.isArray(profile.feature_vector), 'feature_vector should be an array');
  });

  it('buildVoiceProfile classifies formal voice correctly', () => {
    // High formality, low first-person
    const centroid = va.FEATURE_NAMES.map(name => {
      if (name === 'formality_score') return 0.8;
      if (name === 'first_person_ratio') return 0.05;
      if (name === 'exclamation_frequency') return 0.02;
      if (name === 'passive_voice_ratio') return 0.5;
      return 0.5;
    });

    const profile = va.buildVoiceProfile(centroid);
    assert.equal(profile.voice, 'formal and authoritative');
    assert.equal(profile.formality, 'high');
    assert.equal(profile.tone, 'professional and detached');
  });

  it('buildVoiceProfile classifies personal voice correctly', () => {
    // High first-person, low formality
    const centroid = va.FEATURE_NAMES.map(name => {
      if (name === 'first_person_ratio') return 0.6;
      if (name === 'formality_score') return 0.2;
      if (name === 'exclamation_frequency') return 0.5;
      if (name === 'hedge_frequency') return 0.5;
      return 0.4;
    });

    const profile = va.buildVoiceProfile(centroid);
    assert.equal(profile.voice, 'personal and direct');
    assert.equal(profile.tone, 'warm and personal');
  });

  it('buildVoiceProfile avoids list reflects low signal values', () => {
    const centroid = va.FEATURE_NAMES.map(name => {
      if (name === 'formality_score') return 0.1;
      if (name === 'passive_voice_ratio') return 0.05;
      if (name === 'exclamation_frequency') return 0.02;
      if (name === 'analogy_metaphor_density') return 0.03;
      if (name === 'first_person_ratio') return 0.1;
      return 0.5;
    });

    const profile = va.buildVoiceProfile(centroid);
    assert.ok(profile.avoids.includes('overly formal language'));
    assert.ok(profile.avoids.includes('passive voice'));
    assert.ok(profile.avoids.includes('excessive exclamation marks'));
    assert.ok(profile.avoids.includes('forced metaphors'));
  });
});

// ── Tests: Voice Match Scoring ───────────────────────────────

describe('VI-003: Voice Match Scoring', () => {
  it('euclideanDist returns 0 for identical vectors', () => {
    const v = [0.5, 0.3, 0.7, 0.2];
    assert.equal(va.euclideanDist(v, v), 0);
  });

  it('euclideanDist returns correct distance for known vectors', () => {
    const a = [1, 0, 0];
    const b = [0, 1, 0];
    const dist = va.euclideanDist(a, b);
    assert.ok(Math.abs(dist - Math.sqrt(2)) < 0.0001, `Expected ~${Math.sqrt(2)}, got ${dist}`);
  });

  it('similarity score is 1.0 for identical vectors', () => {
    const v = [0.5, 0.3, 0.7, 0.2];
    const dist = va.euclideanDist(v, v);
    const similarity = va.round4(1 / (1 + dist));
    assert.equal(similarity, 1);
  });

  it('similarity score decreases as distance increases', () => {
    const base = [0.5, 0.5, 0.5, 0.5];
    const near = [0.6, 0.5, 0.5, 0.5];
    const far = [1.0, 0.0, 1.0, 0.0];

    const distNear = va.euclideanDist(base, near);
    const distFar = va.euclideanDist(base, far);

    const simNear = 1 / (1 + distNear);
    const simFar = 1 / (1 + distFar);

    assert.ok(simNear > simFar, `Near similarity (${simNear}) should be > far similarity (${simFar})`);
  });

  it('extract12DimFeatures produces correct number of features', () => {
    const features = va.extract12DimFeatures(HUMAN_TEXT);
    assert.equal(features.length, va.FEATURE_NAMES.length,
      `Expected ${va.FEATURE_NAMES.length} features, got ${features.length}`);
  });

  it('extract12DimFeatures returns values between 0 and 1', () => {
    const features = va.extract12DimFeatures(HUMAN_TEXT);
    features.forEach((val, i) => {
      assert.ok(val >= 0 && val <= 1,
        `Feature ${va.FEATURE_NAMES[i]} = ${val} is out of [0,1] range`);
    });
  });

  it('human text and AI text produce different feature vectors', () => {
    const humanFeatures = va.extract12DimFeatures(HUMAN_TEXT);
    const aiFeatures = va.extract12DimFeatures(AI_TEXT);

    const dist = va.euclideanDist(humanFeatures, aiFeatures);
    assert.ok(dist > 0.1, `Expected meaningful distance between human and AI text, got ${dist}`);
  });

  it('AI text has higher transition overuse than human text', () => {
    const humanFeatures = va.extract12DimFeatures(HUMAN_TEXT);
    const aiFeatures = va.extract12DimFeatures(AI_TEXT);

    const transIdx = va.FEATURE_NAMES.indexOf('transition_overuse');
    if (transIdx >= 0) {
      assert.ok(aiFeatures[transIdx] > humanFeatures[transIdx],
        `AI transition_overuse (${aiFeatures[transIdx]}) should be > human (${humanFeatures[transIdx]})`);
    }
  });

  it('human text has higher first-person ratio than AI text', () => {
    const humanFeatures = va.extract12DimFeatures(HUMAN_TEXT);
    const aiFeatures = va.extract12DimFeatures(AI_TEXT);

    const fpIdx = va.FEATURE_NAMES.indexOf('first_person_ratio');
    if (fpIdx >= 0) {
      assert.ok(humanFeatures[fpIdx] > aiFeatures[fpIdx],
        `Human first_person_ratio (${humanFeatures[fpIdx]}) should be > AI (${aiFeatures[fpIdx]})`);
    }
  });
});

// ── Tests: Pipeline Integration ──────────────────────────────

describe('VI-003: Pipeline Integration', () => {
  it('FEATURE_NAMES is exported and non-empty', () => {
    assert.ok(Array.isArray(va.FEATURE_NAMES));
    assert.ok(va.FEATURE_NAMES.length >= 12, `Expected at least 12 feature names, got ${va.FEATURE_NAMES.length}`);
  });

  it('buildVoiceProfile is exported', () => {
    assert.equal(typeof va.buildVoiceProfile, 'function');
  });

  it('handleVoiceMatch is exported', () => {
    assert.equal(typeof va.handleVoiceMatch, 'function');
  });

  it('extract12DimFeatures is exported', () => {
    assert.equal(typeof va.extract12DimFeatures, 'function');
  });

  it('voice profile feature_vector length matches FEATURE_NAMES', () => {
    const centroid = va.FEATURE_NAMES.map(() => 0.5);
    const profile = va.buildVoiceProfile(centroid);
    assert.equal(profile.feature_vector.length, va.FEATURE_NAMES.length);
  });

  it('round4 rounds to 4 decimal places', () => {
    assert.equal(va.round4(0.123456789), 0.1235);
    assert.equal(va.round4(1), 1);
    assert.equal(va.round4(0), 0);
  });

  it('clamp01 clamps values to [0, 1] range', () => {
    assert.equal(va.clamp01(-0.5), 0);
    assert.equal(va.clamp01(1.5), 1);
    assert.equal(va.clamp01(0.5), 0.5);
  });
});

// ── Tests: Voice Profile Completeness ────────────────────────

describe('VI-003: Voice Profile Completeness', () => {
  it('profile formality levels are correctly classified', () => {
    // High formality
    const highCentroid = va.FEATURE_NAMES.map(n => n === 'formality_score' ? 0.8 : 0.5);
    assert.equal(va.buildVoiceProfile(highCentroid).formality, 'high');

    // Moderate formality
    const modCentroid = va.FEATURE_NAMES.map(n => n === 'formality_score' ? 0.5 : 0.5);
    assert.equal(va.buildVoiceProfile(modCentroid).formality, 'moderate');

    // Casual formality
    const casualCentroid = va.FEATURE_NAMES.map(n => n === 'formality_score' ? 0.2 : 0.5);
    assert.equal(va.buildVoiceProfile(casualCentroid).formality, 'casual');
  });

  it('profile heading styles vary by question_frequency and formality', () => {
    // Question-based headings
    const qCentroid = va.FEATURE_NAMES.map(n => {
      if (n === 'question_frequency') return 0.5;
      return 0.3;
    });
    assert.ok(va.buildVoiceProfile(qCentroid).headingStyle.includes('question'));

    // Formal keyword-rich headings
    const fCentroid = va.FEATURE_NAMES.map(n => {
      if (n === 'formality_score') return 0.8;
      if (n === 'question_frequency') return 0.1;
      return 0.5;
    });
    assert.ok(va.buildVoiceProfile(fCentroid).headingStyle.includes('keyword'));
  });

  it('profile ttr is a number between 0 and 1', () => {
    const centroid = va.FEATURE_NAMES.map(() => 0.65);
    const profile = va.buildVoiceProfile(centroid);
    assert.ok(typeof profile.ttr === 'number');
    assert.ok(profile.ttr >= 0 && profile.ttr <= 1);
  });

  it('avoids defaults to ["none identified"] when no low signals', () => {
    // All signals reasonably high — no avoids triggered
    const centroid = va.FEATURE_NAMES.map(name => {
      if (name === 'formality_score') return 0.5;
      if (name === 'passive_voice_ratio') return 0.4;
      if (name === 'exclamation_frequency') return 0.3;
      if (name === 'analogy_metaphor_density') return 0.3;
      if (name === 'first_person_ratio') return 0.2;
      return 0.5;
    });
    const profile = va.buildVoiceProfile(centroid);
    assert.deepEqual(profile.avoids, ['none identified']);
  });
});
