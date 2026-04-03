# VI-002: Writer Clustering (HDBSCAN + Persona Generation)

> **Phase:** 8 | **Priority:** P1 | **Status:** NOT STARTED
> **Effort:** L (12h) | **Type:** feature
> **Sprint:** 6 (Weeks 11-12)
> **Backlog Items:** Voice Intelligence — Writer Clustering + Persona Generation
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `PROJECT-BRIEF.md` — Section "Layer 3: Voice Intelligence", Steps 3-4 (Clustering + Persona Generation)
3. `bridge/intelligence/voice-analyzer.js` — corpus analyzer from VI-001 (must be complete)
4. `migrations/011-writer-personas.sql` — writer_personas table schema from VI-001
5. `bridge/server.js` — endpoint patterns, auth middleware
6. `supabase-setup.sql` — schema reference (PROTECTED)

## Objective
Implement HDBSCAN-based clustering on HUMAN-classified articles using a 12-dimension stylometric feature vector to discover natural writer groups. For each cluster, generate a structured writer persona with voice profile, cadence, vocabulary characteristics, and sample references. Store personas in the `writer_personas` table and expose CRUD endpoints.

## File Plan

| Action | Path | What |
|--------|------|------|
| MODIFY | `bridge/intelligence/voice-analyzer.js` | Add 12-dimension feature extraction, HDBSCAN clustering, persona generation |
| MODIFY | `bridge/server.js` | Add `/api/voice/personas` CRUD endpoints (GET list, GET by id, POST create, PUT update, DELETE) |
| CREATE | `tests/writer-clustering.test.js` | Unit and integration tests for clustering and persona generation |

## Sub-tasks

### Sub-task 1: 12-Dimension Feature Vector Extraction (~3h)
- In `bridge/intelligence/voice-analyzer.js`, create `extractFullFeatureVector(articleText)` function
- 12 dimensions (all normalized to 0-1 range for clustering):

| # | Feature | Calculation |
|---|---------|-------------|
| 1 | Avg sentence length | Mean words per sentence / 40 (normalize) |
| 2 | Sentence length variance | Stdev of words per sentence / 15 |
| 3 | Type-Token Ratio | Unique words / total words (first 500 words) |
| 4 | Vocabulary sophistication | Ratio of words > 3 syllables / total words |
| 5 | Passive voice ratio | Passive constructions / total sentences (regex: "was/were/been/being + past participle") |
| 6 | Avg paragraph length | Mean words per paragraph / 150 |
| 7 | Paragraph rhythm variance | Stdev of paragraph lengths / 50 |
| 8 | Question frequency | Questions per 1000 words / 10 |
| 9 | Exclamation frequency | Exclamations per 1000 words / 5 |
| 10 | Formality score | 1 - (contractions + colloquialisms) / total words. Contractions: "'t", "'re", "'ve", "'ll", "'d". Colloquialisms: "gonna", "wanna", "kinda", "gotta", etc. |
| 11 | First-person ratio | ("I", "me", "my", "we", "our") / total words * 100 / 5 |
| 12 | Analogy/metaphor density | Simile markers ("like a", "as if", "similar to", "resembles") per 1000 words / 5 |

- Process only HUMAN-classified articles (from VI-001 classification)
- Return array of `{ url, author, features: number[12] }` objects

### Sub-task 2: HDBSCAN Clustering Implementation (~4h)
- Implement HDBSCAN (Hierarchical Density-Based Spatial Clustering) in pure JavaScript (zero deps)
- Key algorithm steps:
  1. **Core distance computation:** For each point, compute distance to k-th nearest neighbor (k = minPoints, default 5)
  2. **Mutual reachability distance:** `max(core_dist(a), core_dist(b), euclidean_dist(a, b))`
  3. **Minimum spanning tree:** Build MST using mutual reachability distances (Prim's algorithm)
  4. **Cluster hierarchy:** Sort MST edges by weight, build dendrogram
  5. **Cluster extraction:** Use HDBSCAN stability-based extraction (excess of mass)
- Parameters: `{ minClusterSize: 5, minSamples: 3 }` (tuned for typical corpus of 30-100 human articles)
- Distance metric: Euclidean on the 12-dimension normalized vectors
- Handle noise points (articles that don't fit any cluster) — label as cluster -1
- If corpus has known authors: validate clusters against author labels (cluster purity metric)
- If all articles fall in one cluster: return single persona
- If no clusters found (all noise): fall back to aggregate persona from all human articles

### Sub-task 3: Persona Generation (~3h)
- For each cluster, generate a structured writer persona:
  ```javascript
  {
    name: "The Technical Storyteller",  // AI-generated descriptive name
    clusterSize: 34,
    avgFeatures: { /* 12-dim averages for this cluster */ },
    voice: "Conversational-authoritative. Teaches through analogy.",
    cadence: "Short-medium sentences (avg 14.2 words). Punchy openers.",
    structure: "Opens with a real-world scenario. Uses 'here's the thing.'",
    numbers: "Always contextualized ('145 bar — barely enough')",
    avoids: ["Passive voice", "em-dashes", "hedging phrases"],
    ttr: 0.72,
    humor: "Dry, occasional. Never forced.",
    formality: 42, // 0-100 scale
    headingStyle: "question", // or declarative, how-to, mixed
    tone: "conversational",
    sampleSentences: [/* 5 representative sentences from cluster articles */],
    sourceArticles: [/* URLs of articles in this cluster */]
  }
  ```
- Persona naming: use cluster characteristics to generate a descriptive name
  - High formality + technical vocabulary = "The Technical Authority"
  - Low formality + high analogy density = "The Conversational Storyteller"
  - High question frequency + short sentences = "The Engaging Educator"
  - (Define 8-10 name templates based on dominant features)
- Select 5 representative sentences: pick sentences closest to cluster centroid in feature space
- Set the largest cluster's persona as `is_default = true`
- Store each persona in `writer_personas` table via Supabase client

### Sub-task 4: CRUD Endpoints (~2h)
- Add to `bridge/server.js`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/voice/personas` | List all personas for authenticated user |
| GET | `/api/voice/personas/:id` | Get single persona with full voice profile |
| POST | `/api/voice/personas` | Create manual persona (for users without sufficient corpus) |
| PUT | `/api/voice/personas/:id` | Update persona (name, voice_profile, is_default) |
| DELETE | `/api/voice/personas/:id` | Delete persona (cannot delete if it's the only one and is_default) |

- All endpoints require auth (Bearer token)
- GET list returns: `{ personas: [{ id, name, tone, ttr, corpusSize, isDefault, createdAt }] }`
- GET single returns full persona including `voice_profile` JSONB, sample sentences, source articles
- POST create validates: name required, voice_profile must be valid JSON object
- PUT update: if setting `is_default = true`, unset previous default (single transaction)
- DELETE: prevent deletion of last remaining persona if it's set as default
- Rate limiting on all endpoints (general bucket)

## Testing Strategy

### Unit Tests (`tests/writer-clustering.test.js`)
- Test 12-dimension feature extraction with sample texts of known style
- Test HDBSCAN with synthetic 2D data (3 known clusters) — verify correct cluster assignment
- Test HDBSCAN with edge cases: all points identical, single point, two points
- Test persona naming logic: verify correct name template selected for feature combinations
- Test normalization: all features in 0-1 range
- Test single-cluster and no-cluster fallback behavior

### Integration Tests
- Test full pipeline: extract features → cluster → generate personas → store in DB
- Test CRUD endpoints: create, read, update, delete personas
- Test default persona logic: setting new default unsets old one
- Test delete prevention on last default persona
- Test auth required on all endpoints

## Acceptance Criteria
- [ ] 12-dimension feature vector extracted from each HUMAN article, all normalized to 0-1
- [ ] HDBSCAN clustering implemented in pure JavaScript (zero npm deps)
- [ ] Clusters discovered automatically — no need to predefine number of writers
- [ ] Noise points (unclustered articles) handled gracefully
- [ ] Structured persona generated per cluster with name, voice, cadence, avoids, TTR, humor, refs
- [ ] Largest cluster's persona set as default
- [ ] Personas stored in `writer_personas` table with full voice_profile JSONB
- [ ] CRUD endpoints at `/api/voice/personas` with auth and rate limiting
- [ ] Single-cluster and no-cluster fallback produces valid persona
- [ ] All tests pass (`npm test`)

## Dependencies
- Blocked by: VI-001 (corpus analyzer with AI/Human classification)
- Blocks: VI-003 (voice analyzer agent), VI-004 (dashboard voice page)
