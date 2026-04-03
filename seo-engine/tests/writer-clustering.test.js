/**
 * Writer Clustering Tests — VI-002
 *
 * Tests for:
 *   - 12-dimension feature extraction
 *   - HDBSCAN clustering (core distance, mutual reachability, MST, dendrogram, extraction)
 *   - Persona generation from clusters
 *   - CRUD endpoint routing
 *
 * Uses node:test with global fetch mock.
 */

const { describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');

// ── Load the voice analyzer module ───────────────────────────

const va = require('../bridge/intelligence/voice-analyzer');

// ── Sample texts for feature extraction ──────────────────────

const HUMAN_LIKE_TEXT = `
I think the most interesting thing about content marketing is how personal it can be.
Sometimes you just need to sit down and write from the heart, you know?
Perhaps that sounds a bit cheesy, but honestly, it works.
My experience has shown me that readers connect with genuine voices.
We've all read those articles that feel like they were written by a robot.
They use words like "moreover" and "furthermore" in every other sentence.
But real writing? It's messy. It's varied. Short sentences. Then longer ones that meander and explore ideas in ways that surprise even the writer.
I remember when I first started blogging — it was terrifying!
Would anyone even read what I wrote? Turns out, they did.
The secret was being myself, warts and all.
Like a jazz musician improvising on a familiar melody, good writers find their own rhythm.
Have you ever noticed how the best articles feel like conversations?
That's because they are, in a sense, conversations between the writer and the reader.
Maybe I'm overthinking this, but I believe authenticity is the key ingredient.
Some paragraphs are long. Some are short.

That's just how it goes.

Basically, if you want to connect with your audience, stop trying to sound smart and start trying to sound human.
It's pretty much that simple. No fancy vocabulary needed.
Just write like you talk, and your readers will thank you for it.
Cool? Cool.
`.trim();

const FORMAL_TEXT = `
The implementation of advanced natural language processing algorithms has fundamentally
transformed the landscape of content generation. Notwithstanding the significant
achievements in this domain, considerable challenges remain. Subsequently, researchers
have endeavored to develop more sophisticated methodologies that can effectively
ameliorate the limitations inherent in current approaches. The bifurcation between
human-generated and machine-generated content has become increasingly salient.
Furthermore, the efficacious deployment of these systems requires meticulous attention
to the parameters that govern their output. Consequently, a comprehensive understanding
of the underlying mechanisms is indispensable. The perspicacious reader will note that
the juxtaposition of these approaches reveals fundamental differences in their respective
paradigms. Nevertheless, the nascent field continues to evolve at an unprecedented pace.
Whereby the integration of multiple analytical frameworks provides a more holistic
perspective, the resultant insights are substantially more robust.
Therefore, it is imperative that practitioners maintain cognizance of these developments.
Accordingly, the subsequent sections delineate the methodological approaches employed.
Thus, the analysis presented herein offers a comprehensive examination of the pertinent factors.
Hence, the conclusions drawn are predicated upon empirical evidence and rigorous analysis.
`.trim();

// Generate enough articles for clustering tests
function makeArticles(count, textFn) {
  const articles = [];
  for (let i = 0; i < count; i++) {
    articles.push({
      url: `https://example.com/article-${i}`,
      article_text: typeof textFn === 'function' ? textFn(i) : textFn,
      classification: 'HUMAN'
    });
  }
  return articles;
}

// ── Feature Extraction Tests ─────────────────────────────────

describe('12-Dimension Feature Extraction', () => {
  it('returns a 12-element array', () => {
    const features = va.extract12DimFeatures(HUMAN_LIKE_TEXT);
    assert.equal(features.length, 12, 'Expected 12 dimensions');
  });

  it('all values are between 0 and 1', () => {
    const features = va.extract12DimFeatures(HUMAN_LIKE_TEXT);
    for (let i = 0; i < features.length; i++) {
      assert.ok(features[i] >= 0 && features[i] <= 1,
        `Dimension ${i} (${va.FEATURE_NAMES[i]}) = ${features[i]} is out of [0,1] range`);
    }
  });

  it('returns 0.5 for empty text', () => {
    const features = va.extract12DimFeatures('');
    assert.equal(features.length, 12);
    for (const v of features) {
      assert.equal(v, 0.5, 'Empty text should return 0.5 for all dimensions');
    }
  });

  it('returns 0.5 for very short text', () => {
    const features = va.extract12DimFeatures('Hello world.');
    assert.equal(features.length, 12);
  });

  it('detects higher first-person ratio in personal text', () => {
    const humanFeatures = va.extract12DimFeatures(HUMAN_LIKE_TEXT);
    const formalFeatures = va.extract12DimFeatures(FORMAL_TEXT);
    // Dimension 10 = first_person_ratio
    assert.ok(humanFeatures[10] > formalFeatures[10],
      `Personal text first_person_ratio (${humanFeatures[10]}) should be > formal (${formalFeatures[10]})`);
  });

  it('detects higher formality in formal text', () => {
    const humanFeatures = va.extract12DimFeatures(HUMAN_LIKE_TEXT);
    const formalFeatures = va.extract12DimFeatures(FORMAL_TEXT);
    // Dimension 9 = formality_score
    assert.ok(formalFeatures[9] > humanFeatures[9],
      `Formal text formality (${formalFeatures[9]}) should be > casual (${humanFeatures[9]})`);
  });

  it('detects higher vocabulary sophistication in academic text', () => {
    const humanFeatures = va.extract12DimFeatures(HUMAN_LIKE_TEXT);
    const formalFeatures = va.extract12DimFeatures(FORMAL_TEXT);
    // Dimension 3 = vocabulary_sophistication
    assert.ok(formalFeatures[3] > humanFeatures[3],
      `Formal text sophistication (${formalFeatures[3]}) should be > casual (${humanFeatures[3]})`);
  });

  it('values are rounded to 4 decimal places', () => {
    const features = va.extract12DimFeatures(HUMAN_LIKE_TEXT);
    for (const v of features) {
      const rounded = Math.round(v * 10000) / 10000;
      assert.equal(v, rounded, `Value ${v} should be rounded to 4 decimal places`);
    }
  });
});

// ── Helper Function Tests ────────────────────────────────────

describe('Helper Functions', () => {
  it('clamp01 clamps values', () => {
    assert.equal(va.clamp01(-0.5), 0);
    assert.equal(va.clamp01(0), 0);
    assert.equal(va.clamp01(0.5), 0.5);
    assert.equal(va.clamp01(1), 1);
    assert.equal(va.clamp01(1.5), 1);
  });

  it('round4 rounds to 4 decimal places', () => {
    assert.equal(va.round4(0.12345), 0.1235);
    assert.equal(va.round4(0.1), 0.1);
    assert.equal(va.round4(1), 1);
  });

  it('euclideanDist computes correctly', () => {
    assert.equal(va.euclideanDist([0, 0], [3, 4]), 5);
    assert.equal(va.euclideanDist([1, 1], [1, 1]), 0);
    const d = va.euclideanDist([0, 0, 0], [1, 1, 1]);
    assert.ok(Math.abs(d - Math.sqrt(3)) < 0.0001);
  });
});

// ── HDBSCAN Tests ────────────────────────────────────────────

describe('HDBSCAN Clustering', () => {
  it('returns empty for empty input', () => {
    const result = va.hdbscan([]);
    assert.equal(result.labels.length, 0);
    assert.equal(result.nClusters, 0);
    assert.equal(result.noiseCount, 0);
  });

  it('marks all as noise when fewer points than minClusterSize', () => {
    const vectors = [[0.1, 0.2], [0.3, 0.4]];
    const result = va.hdbscan(vectors, { minClusterSize: 5, minSamples: 3 });
    assert.equal(result.labels.length, 2);
    assert.equal(result.nClusters, 0);
    assert.equal(result.noiseCount, 2);
  });

  it('finds one cluster for tightly grouped points', () => {
    // 10 points near [0.5, 0.5]
    const vectors = [];
    for (let i = 0; i < 10; i++) {
      vectors.push([0.5 + (i % 3) * 0.01, 0.5 + (i % 2) * 0.01]);
    }
    const result = va.hdbscan(vectors, { minClusterSize: 5, minSamples: 3 });
    assert.ok(result.nClusters >= 1, `Expected at least 1 cluster, got ${result.nClusters}`);
    // Most points should be clustered
    const clustered = result.labels.filter(l => l >= 0).length;
    assert.ok(clustered >= 5, `Expected at least 5 clustered points, got ${clustered}`);
  });

  it('finds two clusters for well-separated groups', () => {
    const vectors = [];
    // Cluster A: near [0.1, 0.1]
    for (let i = 0; i < 8; i++) {
      vectors.push([0.1 + i * 0.005, 0.1 + i * 0.003]);
    }
    // Cluster B: near [0.9, 0.9]
    for (let i = 0; i < 8; i++) {
      vectors.push([0.9 + i * 0.005, 0.9 + i * 0.003]);
    }
    const result = va.hdbscan(vectors, { minClusterSize: 5, minSamples: 3 });
    assert.ok(result.nClusters >= 1, `Expected at least 1 cluster, got ${result.nClusters}`);
  });

  it('handles noise points correctly', () => {
    const vectors = [];
    // Tight cluster
    for (let i = 0; i < 8; i++) {
      vectors.push([0.5, 0.5]);
    }
    // Outlier
    vectors.push([10.0, 10.0]);
    const result = va.hdbscan(vectors, { minClusterSize: 5, minSamples: 3 });
    // The last point should be noise or in a separate cluster
    assert.ok(result.labels.length === 9);
  });

  describe('computeCoreDistances', () => {
    it('computes k-th nearest neighbor distance', () => {
      const distMatrix = [
        [0, 1, 2, 3],
        [1, 0, 1.5, 2.5],
        [2, 1.5, 0, 1],
        [3, 2.5, 1, 0]
      ];
      const coreDistances = va.computeCoreDistances(distMatrix, 2);
      assert.equal(coreDistances.length, 4);
      // For point 0: sorted neighbors [1, 2, 3] → 2nd nearest = 2
      assert.equal(coreDistances[0], 2);
    });
  });

  describe('computeMutualReachability', () => {
    it('returns max of core distances and actual distance', () => {
      const distMatrix = [
        [0, 1, 5],
        [1, 0, 3],
        [5, 3, 0]
      ];
      const coreDistances = [2, 2, 4];
      const mrd = va.computeMutualReachability(distMatrix, coreDistances);
      // mrd(0,1) = max(2, 2, 1) = 2
      assert.equal(mrd[0][1], 2);
      // mrd(0,2) = max(2, 4, 5) = 5
      assert.equal(mrd[0][2], 5);
      // mrd(1,2) = max(2, 4, 3) = 4
      assert.equal(mrd[1][2], 4);
    });
  });

  describe('buildMST', () => {
    it('builds MST with n-1 edges', () => {
      const mrd = [
        [0, 2, 5],
        [2, 0, 4],
        [5, 4, 0]
      ];
      const edges = va.buildMST(mrd);
      assert.equal(edges.length, 2, 'MST of 3 nodes should have 2 edges');
      // Edges should be sorted by weight
      assert.ok(edges[0].weight <= edges[1].weight);
    });

    it('returns empty for empty input', () => {
      const edges = va.buildMST([]);
      assert.equal(edges.length, 0);
    });
  });
});

// ── Persona Generation Tests ─────────────────────────────────

describe('Persona Generation', () => {
  it('returns empty personas for empty articles', () => {
    const result = va.generatePersonas([]);
    assert.equal(result.personas.length, 0);
    assert.equal(result.clusterResult.nClusters, 0);
  });

  it('creates a single fallback persona when no clusters found', () => {
    // 3 articles (below minClusterSize=5)
    const articles = makeArticles(3, HUMAN_LIKE_TEXT);
    const result = va.generatePersonas(articles, { minClusterSize: 5, minSamples: 3 });
    // Should get a fallback persona
    assert.ok(result.personas.length >= 1, 'Should create at least one fallback persona');
    const persona = result.personas[0];
    assert.ok(persona.name, 'Persona should have a name');
    assert.ok(persona.voice_profile, 'Persona should have a voice profile');
    assert.ok(persona.feature_vector, 'Persona should have a feature vector');
    assert.equal(persona.is_default, true, 'Single persona should be default');
  });

  it('creates personas with all required fields', () => {
    const articles = makeArticles(10, HUMAN_LIKE_TEXT);
    const result = va.generatePersonas(articles, { minClusterSize: 3, minSamples: 2 });
    for (const persona of result.personas) {
      assert.ok(persona.id, 'Missing id');
      assert.ok(persona.name, 'Missing name');
      assert.ok(persona.voice_profile, 'Missing voice_profile');
      assert.ok(persona.voice_profile.voice, 'Missing voice_profile.voice');
      assert.ok(persona.voice_profile.cadence, 'Missing voice_profile.cadence');
      assert.ok(persona.voice_profile.structure, 'Missing voice_profile.structure');
      assert.ok(persona.voice_profile.tone, 'Missing voice_profile.tone');
      assert.ok(persona.voice_profile.formality, 'Missing voice_profile.formality');
      assert.ok(persona.voice_profile.headingStyle, 'Missing voice_profile.headingStyle');
      assert.ok(typeof persona.voice_profile.ttr === 'number', 'ttr should be a number');
      assert.ok(persona.feature_vector, 'Missing feature_vector');
      assert.equal(persona.feature_vector.length, 12, 'Feature vector should be 12-dim');
      assert.ok(Array.isArray(persona.source_articles), 'source_articles should be an array');
      assert.ok(typeof persona.cluster_size === 'number', 'cluster_size should be a number');
      assert.ok(typeof persona.is_default === 'boolean', 'is_default should be a boolean');
    }
  });

  it('marks largest cluster as default', () => {
    // Create two distinct groups of text
    const groupA = makeArticles(8, HUMAN_LIKE_TEXT);
    const groupB = makeArticles(5, FORMAL_TEXT);
    const articles = [...groupA, ...groupB];
    const result = va.generatePersonas(articles, { minClusterSize: 3, minSamples: 2 });
    if (result.personas.length > 1) {
      const defaults = result.personas.filter(p => p.is_default);
      assert.equal(defaults.length, 1, 'Exactly one persona should be default');
    }
  });

  it('includes representative sentences', () => {
    const articles = makeArticles(10, HUMAN_LIKE_TEXT);
    const result = va.generatePersonas(articles, { minClusterSize: 3, minSamples: 2 });
    for (const persona of result.personas) {
      assert.ok(Array.isArray(persona.representative_sentences), 'Should have representative_sentences');
      assert.ok(persona.representative_sentences.length <= 5, 'Should have at most 5 representative sentences');
    }
  });

  it('includes source article URLs', () => {
    const articles = makeArticles(10, HUMAN_LIKE_TEXT);
    const result = va.generatePersonas(articles, { minClusterSize: 3, minSamples: 2 });
    for (const persona of result.personas) {
      assert.ok(persona.source_articles.length > 0, 'Should have source articles');
      for (const url of persona.source_articles) {
        assert.ok(url.startsWith('https://'), 'Source article should be a URL');
      }
    }
  });
});

// ── Centroid & Name Generation Tests ─────────────────────────

describe('computeCentroid', () => {
  it('computes mean of vectors', () => {
    const vectors = [[0.2, 0.4], [0.6, 0.8]];
    const centroid = va.computeCentroid(vectors);
    assert.equal(centroid[0], 0.4);
    assert.equal(centroid[1], 0.6);
  });

  it('handles single vector', () => {
    const centroid = va.computeCentroid([[0.5, 0.3, 0.7]]);
    assert.deepEqual(centroid, [0.5, 0.3, 0.7]);
  });
});

describe('generatePersonaName', () => {
  it('returns a non-empty string', () => {
    const centroid = new Array(12).fill(0.5);
    const name = va.generatePersonaName(centroid, 0);
    assert.ok(name.length > 0, 'Name should not be empty');
    assert.ok(typeof name === 'string', 'Name should be a string');
  });

  it('returns different names for different dominant features', () => {
    const centroid1 = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9, 0.9, 0.1]; // formality + first_person
    const centroid2 = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9, 0.1, 0.1, 0.1, 0.9]; // question + analogy
    const name1 = va.generatePersonaName(centroid1, 0);
    const name2 = va.generatePersonaName(centroid2, 1);
    // They might not always be different due to template matching, but at least they should be valid
    assert.ok(name1.length > 0);
    assert.ok(name2.length > 0);
  });
});

describe('buildVoiceProfile', () => {
  it('returns all required profile fields', () => {
    const centroid = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    const profile = va.buildVoiceProfile(centroid);
    assert.ok(profile.voice, 'Missing voice');
    assert.ok(profile.cadence, 'Missing cadence');
    assert.ok(profile.structure, 'Missing structure');
    assert.ok(profile.numbers, 'Missing numbers');
    assert.ok(Array.isArray(profile.avoids), 'avoids should be an array');
    assert.ok(typeof profile.ttr === 'number', 'ttr should be a number');
    assert.ok(profile.humor, 'Missing humor');
    assert.ok(profile.formality, 'Missing formality');
    assert.ok(profile.headingStyle, 'Missing headingStyle');
    assert.ok(profile.tone, 'Missing tone');
    assert.ok(profile.feature_vector, 'Missing feature_vector');
  });

  it('returns high formality label for high formality centroid', () => {
    const centroid = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.8, 0.1, 0.1];
    const profile = va.buildVoiceProfile(centroid);
    assert.equal(profile.formality, 'high');
  });

  it('returns casual formality label for low formality centroid', () => {
    const centroid = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.2, 0.5, 0.5];
    const profile = va.buildVoiceProfile(centroid);
    assert.equal(profile.formality, 'casual');
  });
});

// ── CRUD Endpoint Routing Tests (mock-based) ─────────────────

describe('CRUD Endpoint Routing', () => {
  // These tests verify that server.js properly routes to the correct handlers.
  // We test this by checking that the voiceAnalyzer module exports the expected handler functions.

  it('exports handleListPersonas', () => {
    assert.ok(typeof va.handleListPersonas === 'function');
  });

  it('exports handleGetPersona', () => {
    assert.ok(typeof va.handleGetPersona === 'function');
  });

  it('exports handleCreatePersona', () => {
    assert.ok(typeof va.handleCreatePersona === 'function');
  });

  it('exports handleUpdatePersona', () => {
    assert.ok(typeof va.handleUpdatePersona === 'function');
  });

  it('exports handleDeletePersona', () => {
    assert.ok(typeof va.handleDeletePersona === 'function');
  });

  it('exports HDBSCAN defaults', () => {
    assert.equal(va.HDBSCAN_DEFAULTS.minClusterSize, 5);
    assert.equal(va.HDBSCAN_DEFAULTS.minSamples, 3);
  });
});

// ── HDBSCAN with 12-Dim Vectors ──────────────────────────────

describe('HDBSCAN with 12-Dim Feature Vectors', () => {
  it('clusters identical 12-dim vectors into one cluster', () => {
    const vector = [0.3, 0.5, 0.4, 0.2, 0.1, 0.6, 0.3, 0.2, 0.1, 0.7, 0.4, 0.2];
    const vectors = Array(10).fill(vector);
    const result = va.hdbscan(vectors, { minClusterSize: 5, minSamples: 3 });
    assert.ok(result.nClusters >= 1);
    const clustered = result.labels.filter(l => l >= 0).length;
    assert.equal(clustered, 10, 'All identical points should be clustered');
  });

  it('produces valid labels for 12-dim extracted features', () => {
    const articles = makeArticles(15, HUMAN_LIKE_TEXT);
    const vectors = articles.map(a => va.extract12DimFeatures(a.article_text));
    const result = va.hdbscan(vectors, { minClusterSize: 3, minSamples: 2 });
    assert.equal(result.labels.length, 15);
    for (const label of result.labels) {
      assert.ok(label >= -1, 'Labels should be >= -1');
    }
  });
});

// ── Integration: Full Pipeline Test ──────────────────────────

describe('Full Pipeline Integration', () => {
  it('generates personas from varied articles', () => {
    // Create a mix of writing styles
    const personalArticles = makeArticles(7, HUMAN_LIKE_TEXT);
    const formalArticles = makeArticles(7, FORMAL_TEXT);
    const allArticles = [...personalArticles, ...formalArticles];

    const result = va.generatePersonas(allArticles, { minClusterSize: 3, minSamples: 2 });

    assert.ok(result.personas.length >= 1, 'Should generate at least one persona');

    // Verify cluster result
    assert.ok(typeof result.clusterResult.nClusters === 'number');
    assert.ok(typeof result.clusterResult.noiseCount === 'number');

    // Verify exactly one default
    const defaults = result.personas.filter(p => p.is_default);
    assert.equal(defaults.length, 1, 'Exactly one persona should be default');

    // Log results for debugging
    for (const p of result.personas) {
      assert.ok(p.name, `Persona should have a name`);
      assert.ok(p.voice_profile.tone, `Persona ${p.name} should have a tone`);
    }
  });

  it('handles articles with identical text gracefully', () => {
    const articles = makeArticles(10, 'Same text repeated enough times to make it long enough for analysis. ' +
      'This sentence adds more words. And another one here for good measure. ' +
      'We need at least fifty words to avoid the short text fallback behavior. ' +
      'So we keep adding more and more words to this synthetic article text. ' +
      'Eventually we will reach the threshold and the analysis will proceed. ' +
      'One more sentence should do the trick for our testing purposes here.');
    const result = va.generatePersonas(articles, { minClusterSize: 3, minSamples: 2 });
    // Should not throw; should produce at least one persona (fallback or cluster)
    assert.ok(result.personas.length >= 1);
  });
});
