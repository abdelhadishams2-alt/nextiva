# Spec 06: Voice Intelligence — Corpus Crawler, AI/Human Classifier, Writer Clustering, Persona Generation

**Status:** Implementation-Ready
**Priority:** Should Have (MoSCoW #18-24)
**Phase:** C (Weeks 15-22)
**Effort:** Backend XL (4+ weeks), Frontend M (1-2 weeks)
**Dependencies:** #7 HTTP Content Crawler (Phase A), quality gate for voice match scoring
**Owner:** ChainIQ Platform Engineer

---

## 1. Feature Overview

### What

A 4-stage voice intelligence pipeline that: (1) crawls a client's site to collect 50-100+ articles as a corpus, (2) classifies each article as HUMAN, HYBRID, or AI-GENERATED using stylometric analysis, (3) clusters human-written articles by writing style fingerprint to discover distinct writer voices, and (4) generates structured persona profiles (JSON) that the draft-writer agent consumes as style constraints. The result: generated articles that sound like the client's best human writers, not generic AI output.

### Why

Voice matching is ChainIQ's strongest moat. Zero of 9 assessed competitors offer true writer fingerprinting. Enterprise publishers (SRMG) have distinct editorial voices per section (news, opinion, technology) and require generated content to match. Without voice intelligence, ChainIQ is indistinguishable from any AI writer.

### Where

- **Backend:** `bridge/intelligence/voice-analyzer.js` (all 4 stages)
- **Agent:** `agents/voice-analyzer.md` (markdown agent for profile narrative)
- **API:** `bridge/routes/voice.js` (endpoints)
- **Frontend:** Voice Profiles dashboard page
- **Database:** `writer_personas` table (existing migration #011)

### Effort Breakdown

| Component | Effort | Risk |
|-----------|--------|------|
| Corpus collection (site crawling) | L | Medium — rate limiting, JS-rendered pages |
| Stylometric feature extraction | L | Medium — NLP without npm deps |
| AI vs human classification | L | High — accuracy on short articles unknown |
| Writer clustering (k-means, zero-dep) | L | High — quality of clusters uncertain |
| Persona JSON generation | M | Low — structured output from analysis |
| Voice Analyzer agent (markdown) | S | Low — follows existing agent pattern |
| Draft-writer persona injection | M | Low — modify existing agent |
| Voice Profiles dashboard page | L | Medium — radar chart, persona editor |
| **Total** | **XL** | **High (clustering + classification)** |

---

## 2. User Stories

**US-6.1** — Given a connected client site, when I trigger voice analysis, then ChainIQ crawls 50-100 articles, extracts text, and stores the corpus in the database so stylometric analysis can proceed.

**US-6.2** — Given a collected corpus, when classification runs, then each article receives a label (HUMAN/HYBRID/AI-GENERATED) with a confidence score, so the clustering stage can filter to human-only articles.

**US-6.3** — Given the human-written subset of the corpus, when clustering runs, then distinct writer groups are detected automatically (2-8 clusters), each with a stylometric fingerprint.

**US-6.4** — Given detected writer clusters, when persona generation runs, then a structured JSON profile is produced per cluster containing: avg sentence length, vocabulary richness (TTR), formality score, tone, cadence, avoids list, and reference article URLs.

**US-6.5** — Given multiple writer personas, when I view the Voice Profiles page, then I see persona cards with radar charts showing key stylometric dimensions, and I can select a default persona for article generation.

**US-6.6** — Given a selected persona, when an article is generated, then the draft-writer agent receives the persona profile as a style constraint and the output matches the target voice (measured by stylometric distance).

**US-6.7** — Given a persona card, when I click "Edit," then I can manually adjust persona parameters (tone, formality, sentence length range) to fine-tune the generated voice.

**US-6.8** — Given a site with fewer than 20 articles, when voice analysis is triggered, then the system warns that the corpus is too small for reliable clustering and offers manual persona creation instead.

---

## 3. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| AC-1 | Corpus crawler collects at least 50 articles from a site with 100+ published pages | Integration test with mock HTTP server |
| AC-2 | Crawler respects robots.txt and applies 1-second delay between requests | Unit test: delay timing + robots.txt parsing |
| AC-3 | Stylometric features extracted per article: sentence count, avg sentence length, sentence length variance, TTR, passive voice ratio, paragraph length, hedging frequency, cliche density, em-dash frequency | Unit test: known text returns expected values |
| AC-4 | AI/Human classifier assigns HUMAN, HYBRID, or AI-GENERATED with confidence 0-1 | Unit test: known AI text scores > 0.7 AI |
| AC-5 | Classifier accuracy >= 75% on a labeled test set of 50 articles | Validation test against curated fixtures |
| AC-6 | K-means clustering produces 2-8 clusters from corpus of 50+ articles | Unit test: synthetic data with known clusters |
| AC-7 | Silhouette score used to select optimal k (best fit from k=2 to k=8) | Unit test: verify selection logic |
| AC-8 | Persona JSON matches schema: `{ name, avgSentenceLength, vocabularyRichness, formalityScore, passiveVoiceRatio, avgParagraphLength, headingStyle, tone, corpusUrls, corpusSize, voiceProfile }` | Schema validation test |
| AC-9 | Voice Profiles page renders persona cards with radar charts | E2E: navigate to page, assert card rendering |
| AC-10 | Default persona selection persists to database and is used by draft-writer | Integration test: set default, generate article, verify persona passed |
| AC-11 | Persona editing saves updated values to `writer_personas` table | Integration test: edit, save, reload, verify |
| AC-12 | Corpus collection supports sites behind basic auth (username:password in URL) | Unit test: auth header construction |
| AC-13 | Full pipeline (crawl + classify + cluster + generate) completes in < 5 minutes for 100 articles | Performance test |

---

## 4. UI/UX Description

### Voice Profiles Page

```
+------------------------------------------------------------------+
|  Voice Profiles                    [Analyze Site] [+ New Persona] |
+------------------------------------------------------------------+
|                                                                    |
|  Corpus Status: 87 articles collected | 61 human | 14 hybrid     |
|  | 12 AI-generated | Last analyzed: 2026-03-15                   |
|                                                                    |
|  +----------------------------+  +----------------------------+   |
|  | "The Technical Storyteller" |  | "The News Reporter"        |   |
|  | ★ Default                  |  |                            |   |
|  |                            |  |                            |   |
|  |   [RADAR CHART]            |  |   [RADAR CHART]            |   |
|  |  Sentence /  Vocab /       |  |  Sentence /  Vocab /       |   |
|  |  Formality / Passive /     |  |  Formality / Passive /     |   |
|  |  Paragraph                 |  |  Paragraph                 |   |
|  |                            |  |                            |   |
|  | Tone: Conversational       |  | Tone: Formal               |   |
|  | Articles: 34               |  | Articles: 21               |   |
|  | Avg words/sentence: 14.2   |  | Avg words/sentence: 22.7   |   |
|  | TTR: 0.72                  |  | TTR: 0.58                  |   |
|  |                            |  |                            |   |
|  | [Set Default] [Edit] [Del] |  | [Set Default] [Edit] [Del] |   |
|  +----------------------------+  +----------------------------+   |
|                                                                    |
|  +----------------------------+                                   |
|  | "The Casual Blogger"       |                                   |
|  |                            |                                   |
|  |   [RADAR CHART]            |                                   |
|  |  ...                       |                                   |
|  | Tone: Casual               |                                   |
|  | Articles: 6                |                                   |
|  | [Set Default] [Edit] [Del] |                                   |
|  +----------------------------+                                   |
|                                                                    |
+------------------------------------------------------------------+
```

### Persona Edit Modal

```
+------------------------------------------+
|  Edit Persona: "The Technical Storyteller"|
+------------------------------------------+
|  Name: [The Technical Storyteller      ]  |
|  Tone: [Conversational ▼]                |
|  Formality: [====|====] 45/100            |
|  Target sentence length: [12] - [18]      |
|  Passive voice limit: [10]%               |
|  Avoids: [em-dashes, "it's worth noting"] |
|  Reference articles: 34 (read-only)       |
|                                           |
|  [Cancel]                    [Save]       |
+------------------------------------------+
```

### Components

- **PersonaCard:** Card with radar chart (SVG, 5 axes), key stats, action buttons
- **RadarChart:** Pure SVG radar chart component, 5 dimensions, no library dependency
- **PersonaEditModal:** Form with sliders, dropdowns, text inputs for manual tuning
- **CorpusStatusBanner:** Shows crawl progress, article counts by classification
- **Mobile:** Persona cards stack vertically, radar charts scale down to 200px, edit modal becomes full-screen sheet

---

## 5. Database Changes

### Uses Existing Table: `writer_personas` (Migration #011)

No new table needed. The existing `writer_personas` table covers all fields. Additional columns to ensure are present:

```sql
-- Verify these columns exist in migration 011, add if missing:
ALTER TABLE writer_personas ADD COLUMN IF NOT EXISTS classification_confidence NUMERIC(3,2);
ALTER TABLE writer_personas ADD COLUMN IF NOT EXISTS cluster_id INTEGER;
ALTER TABLE writer_personas ADD COLUMN IF NOT EXISTS silhouette_score NUMERIC(4,3);
```

### New Table: `corpus_articles`

Stores crawled article text for re-analysis without re-crawling.

```sql
CREATE TABLE corpus_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  url TEXT NOT NULL,
  title TEXT,
  author TEXT,
  publish_date DATE,
  raw_text TEXT NOT NULL,
  word_count INTEGER,
  classification TEXT CHECK (classification IN ('human', 'hybrid', 'ai_generated', 'unclassified')),
  classification_confidence NUMERIC(3,2),
  cluster_id INTEGER,
  stylometric_features JSONB,
  -- { sentenceCount, avgSentenceLength, sentenceLengthVariance, ttr,
  --   passiveVoiceRatio, avgParagraphLength, hedgingFrequency,
  --   clicheDensity, emDashFrequency }
  crawled_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, url)
);

CREATE INDEX idx_corpus_user ON corpus_articles (user_id);
CREATE INDEX idx_corpus_classification ON corpus_articles (user_id, classification);

ALTER TABLE corpus_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own corpus" ON corpus_articles
  FOR ALL USING (auth.uid() = user_id);
```

### Migration: `migrations/014-corpus-articles.sql`

---

## 6. API / Backend Changes

### Endpoints

**`POST /api/voice/analyze`** — Trigger full voice analysis pipeline

```
Request:
  Headers: Authorization: Bearer <token>
  Body: {
    siteUrl: string,        // Required: target site URL
    maxArticles?: number,   // Default 100, max 200
    forceRecrawl?: boolean  // Default false
  }

Response (202):
  { success: true, data: { jobId: string, status: "queued" } }
  // Long-running: returns immediately, use SSE for progress
```

**`GET /api/voice/analyze/progress/:jobId`** — SSE progress stream

```
SSE events:
  { stage: "crawling", progress: 34, total: 100, message: "Crawling article 34/100" }
  { stage: "classifying", progress: 87, total: 87, message: "Classifying articles" }
  { stage: "clustering", progress: 1, total: 1, message: "Running k-means (k=2..8)" }
  { stage: "generating", progress: 3, total: 3, message: "Generating persona 3/3" }
  { stage: "complete", personas: [...] }
```

**`GET /api/voice/personas`** — List all personas for user

```
Response (200): { success: true, data: [PersonaRecord, ...] }
```

**`PUT /api/voice/personas/:id`** — Update persona

```
Request Body: { name?, tone?, formalityScore?, ... }
Response (200): { success: true, data: PersonaRecord }
```

**`PUT /api/voice/personas/:id/default`** — Set as default

```
Response (200): { success: true }
```

**`DELETE /api/voice/personas/:id`** — Delete persona

```
Response (200): { success: true }
```

### Core Logic — `bridge/intelligence/voice-analyzer.js`

```javascript
module.exports = {
  // Stage 1: Corpus Collection
  async crawlCorpus(siteUrl, maxArticles, onProgress),

  // Stage 2: Stylometric Feature Extraction
  extractFeatures(text),
  // Returns: { sentenceCount, avgSentenceLength, sentenceLengthVariance,
  //            ttr, passiveVoiceRatio, avgParagraphLength, hedgingFrequency,
  //            clicheDensity, emDashFrequency }

  // Stage 3: AI vs Human Classification
  classifyArticle(features),
  // Returns: { label: 'human'|'hybrid'|'ai_generated', confidence: 0.0-1.0 }

  // Stage 4: Writer Clustering
  clusterWriters(articles),
  // Returns: { clusters: [{ centroid, articleIds }], k, silhouetteScore }

  // Stage 5: Persona Generation
  generatePersona(cluster, articles),
  // Returns: WriterPersona object ready for DB insert
};
```

**Classification heuristics (zero-dep, pattern-based):**

| Signal | Weight | Human Indicator | AI Indicator |
|--------|--------|-----------------|--------------|
| Sentence length variance | 0.25 | StdDev > 8 | StdDev < 4 |
| Vocabulary richness (TTR) | 0.20 | TTR > 0.65 | TTR < 0.55 |
| Hedging frequency | 0.15 | < 2 per 1000 words | > 5 per 1000 words |
| Cliche density | 0.15 | < 1 per 1000 words | > 3 per 1000 words |
| Em-dash frequency | 0.10 | Varies | > 4 per 1000 words |
| Paragraph rhythm variance | 0.15 | High (irregular) | Low (uniform 3-4 sentences) |

Weighted score < 0.4 = HUMAN, 0.4-0.6 = HYBRID, > 0.6 = AI-GENERATED.

**K-means implementation (zero-dep):**

1. Normalize all stylometric features to 0-1 range
2. Run k-means for k=2 through k=8
3. Compute silhouette score for each k
4. Select k with highest silhouette score
5. Return cluster assignments and centroids

K-means is ~100 lines of JavaScript (Euclidean distance, centroid recalculation, convergence check). Max 50 iterations per k value.

**Edge cases:**
- Site returns 403/429: exponential backoff (1s, 2s, 4s), skip after 3 retries
- JS-rendered pages: extract what's available from raw HTML, log warning
- Fewer than 20 articles: warn user, skip clustering, offer manual persona creation
- All articles classified as AI: warn user, cannot generate human voice profiles
- Single-author site (k=1 optimal): return 1 persona, no clustering needed

---

## 7. Frontend Components

### New Components

| Component | Path | Props |
|-----------|------|-------|
| `VoiceProfilesPage` | `app/voice/page.tsx` | None (route page) |
| `PersonaCard` | `components/voice/persona-card.tsx` | `persona: WriterPersona, isDefault: boolean, onEdit, onDelete, onSetDefault` |
| `RadarChart` | `components/voice/radar-chart.tsx` | `dimensions: { label: string, value: number, max: number }[]` |
| `PersonaEditModal` | `components/voice/persona-edit-modal.tsx` | `persona: WriterPersona, onSave, onCancel` |
| `CorpusStatusBanner` | `components/voice/corpus-status-banner.tsx` | `stats: CorpusStats` |
| `AnalyzeProgress` | `components/voice/analyze-progress.tsx` | `jobId: string` |

### Modified Components

| Component | Change |
|-----------|--------|
| Dashboard sidebar | Add "Voice Profiles" nav item |
| Article generation form | Add persona selector dropdown |
| Draft-writer pipeline | Pass selected persona to agent |

### State Management

- `VoiceProfilesPage`: fetch personas on mount via `GET /api/voice/personas`
- Analysis trigger: POST to `/api/voice/analyze`, connect to SSE for progress
- Optimistic UI: set default immediately, revert on error

### Data Fetching

```typescript
export async function analyzeVoice(siteUrl: string, opts?: AnalyzeOptions): Promise<{ jobId: string }>
export async function getPersonas(): Promise<WriterPersona[]>
export async function updatePersona(id: string, data: Partial<WriterPersona>): Promise<WriterPersona>
export async function setDefaultPersona(id: string): Promise<void>
export async function deletePersona(id: string): Promise<void>
```

---

## 8. Test Plan

### Unit Tests — `test/voice-analyzer.test.js`

| Test | Description |
|------|-------------|
| `extractFeatures returns all 9 metrics` | Known text, assert all fields present |
| `extractFeatures sentence length variance high for human text` | Human sample, assert StdDev > 8 |
| `extractFeatures sentence length variance low for AI text` | AI sample, assert StdDev < 4 |
| `extractFeatures TTR computed correctly` | Known text with known unique/total ratio |
| `extractFeatures detects hedging phrases` | Text with hedging, assert count |
| `extractFeatures detects cliche phrases` | Text with AI cliches, assert count |
| `classifyArticle returns human for human text` | Known human fixture |
| `classifyArticle returns ai_generated for AI text` | Known AI fixture |
| `classifyArticle returns hybrid for mixed text` | Edited AI fixture |
| `classifyArticle confidence between 0 and 1` | Any input, assert range |
| `clusterWriters returns 2 clusters for bimodal data` | Synthetic 2-cluster data |
| `clusterWriters selects optimal k via silhouette` | Synthetic 3-cluster, assert k=3 |
| `clusterWriters handles single author (k=1)` | Uniform data, assert 1 cluster |
| `generatePersona produces valid schema` | Cluster input, validate output shape |
| `generatePersona computes correct averages` | Known cluster, assert arithmetic |

### Unit Tests — `test/voice-kmeans.test.js`

| Test | Description |
|------|-------------|
| `kmeans converges within 50 iterations` | Random data, assert convergence flag |
| `kmeans assigns all points to a cluster` | Assert no unassigned points |
| `silhouetteScore returns value in -1 to 1` | Known clusters, assert range |
| `silhouetteScore higher for well-separated clusters` | Good vs bad clusters |

### Integration Tests — `test/voice-api.test.js`

| Test | Description |
|------|-------------|
| `POST /api/voice/analyze returns 202 with jobId` | Valid request |
| `POST /api/voice/analyze returns 400 without siteUrl` | Missing field |
| `GET /api/voice/personas returns array` | After analysis |
| `PUT /api/voice/personas/:id updates persona` | Edit name, verify persistence |
| `PUT /api/voice/personas/:id/default sets default` | Set default, verify others unset |
| `DELETE /api/voice/personas/:id removes persona` | Delete, verify 404 on re-fetch |
| `SSE progress stream emits stage events` | Connect to progress endpoint |

---

## 9. Rollout Plan

### Feature Flag

`FEATURE_VOICE_INTELLIGENCE=true`. When false, Voice Profiles page shows "Coming Soon" with email signup for notification.

### Phases

1. **Week 1:** Ship corpus crawler + stylometric feature extraction. Unit tests for all 9 features.
2. **Week 2:** Ship AI/Human classifier. Validate against curated test set (50 labeled articles). Iterate on thresholds.
3. **Week 3:** Ship k-means clustering + persona generation. Test with real client data (SRMG).
4. **Week 4:** Ship Voice Profiles frontend + persona editor. Integrate persona injection into draft-writer.

### Monitoring

- Log classification distribution per site (expected: 40-70% human for established publishers)
- Alert if classification returns >90% AI for any site (likely miscalibration)
- Track corpus crawl success rate (target: 80%+ URLs successfully extracted)
- Log persona generation count per analysis (expected: 2-5 personas)

### User Communications

- Dashboard notification: "Voice analysis complete. 3 writer personas detected."
- Persona cards: "Based on analysis of 34 articles by this writer"

### Spike Required

AI vs human classification accuracy must be validated with a labeled test set before launch. Allocate 3-5 days for spike (per effort estimation framework). If accuracy < 70%, defer classification and launch with clustering-only (all articles treated as human input).

---

## 10. Accessibility & Mobile

### WCAG 2.1 AA Compliance

- Radar chart: `role="img"` with `aria-label` describing all 5 dimension values
- Persona cards: semantic `<article>` elements with `<h3>` headings
- Edit modal: focus trapped inside modal, Escape to close, `aria-modal="true"`
- Progress indicators: `role="progressbar"` with `aria-valuenow`
- Default star: `aria-label="Default persona"` on the star icon

### Keyboard Navigation

- Tab through persona cards, each card's buttons accessible
- Enter on "Edit" opens modal, Tab cycles through form fields
- Enter on "Set Default" toggles immediately
- Arrow keys within radar chart are not applicable (read-only visualization)

### RTL / Arabic

- Persona cards flow right-to-left in RTL mode (CSS `direction: rtl` + flexbox `row-reverse`)
- Radar chart is direction-agnostic (radial layout)
- Persona names and descriptions support Arabic text
- Edit modal fields align to the right in RTL

### Mobile (< 768px)

- Persona cards: single column, full width
- Radar chart: scales to card width (min 200px)
- Edit modal: full-screen bottom sheet on mobile
- Analysis progress: sticky banner at top of page
- Touch targets: all buttons >= 44px height
