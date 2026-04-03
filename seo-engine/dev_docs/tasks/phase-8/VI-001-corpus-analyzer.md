# VI-001: Corpus Analyzer (Crawl + AI vs Human Classification)

> **Phase:** 8 | **Priority:** P1 | **Status:** NOT STARTED
> **Effort:** XL (16h) | **Type:** feature
> **Sprint:** 6 (Weeks 11-12)
> **Backlog Items:** Voice Intelligence — Corpus Collection + Classification
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `PROJECT-BRIEF.md` — Section "Layer 3: Voice Intelligence" for full spec
3. `bridge/ingestion/crawler.js` — existing content crawler (if built in Phase 5/6, otherwise build from scratch)
4. `bridge/server.js` — endpoint patterns, auth middleware
5. `supabase-setup.sql` — schema reference (PROTECTED)
6. `bridge/key-manager.js` — AES-256-GCM encryption pattern for token storage

## Objective
Build the corpus analysis engine that crawls a client's site, extracts article text, runs stylometric analysis to classify each article as HUMAN/HYBRID/AI-GENERATED, and stores results in the database. This is the foundation for writer clustering (VI-002) and the voice analyzer agent (VI-003). Minimum 50 articles required for statistical significance; fall back to manual persona creation if the corpus is too small.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `bridge/intelligence/voice-analyzer.js` | Corpus crawler, text extraction, stylometric analysis, AI/Human classification |
| CREATE | `migrations/011-writer-personas.sql` | writer_personas table with voice_profile JSONB column |
| MODIFY | `bridge/server.js` | Add `/api/voice/analyze` trigger endpoint and `/api/voice/corpus/:userId` status endpoint |
| CREATE | `tests/voice-analyzer.test.js` | Unit and integration tests for corpus analysis and classification |

## Sub-tasks

### Sub-task 1: Corpus Crawler (~4h)
- Create `bridge/intelligence/voice-analyzer.js` with a `CorpusAnalyzer` class
- **Site crawling strategy:**
  1. Start from site root or sitemap.xml (prefer sitemap for efficiency)
  2. If sitemap available: parse XML, filter for blog/article URLs (heuristic: paths containing `/blog/`, `/articles/`, `/posts/`, `/news/`, or CMS-specific patterns)
  3. If no sitemap: crawl from root, follow internal links, respect robots.txt, max depth 3
  4. Rate limit: maximum 2 requests/second to avoid overloading client sites
  5. Timeout: 10 seconds per page, skip on timeout
  6. Maximum 500 pages per crawl (configurable)
- **Text extraction:**
  - Fetch each URL with native `fetch()` (zero deps)
  - Parse HTML to find main content area: look for `<article>`, `<main>`, `[role="main"]`, `.post-content`, `.entry-content`, `.article-body` selectors (regex-based)
  - Strip navigation, sidebar, footer, ads, comments (common class/id patterns)
  - Preserve paragraph structure (split on `<p>`, `<br>`, double newlines)
  - Extract metadata: title, author (from byline, meta author, schema.org), publish date, word count
  - Store raw text and metadata per article in `content_inventory` table
- **Progress tracking:**
  - Crawl runs as a background job (use existing pipeline job queue pattern)
  - Track: total URLs found, URLs crawled, URLs extracted, errors
  - Report progress via SSE on `/api/voice/analyze/progress/:jobId`

### Sub-task 2: Stylometric Feature Extraction (~4h)
- For each extracted article, compute 6 stylometric signals:

| Signal | Calculation | Human Pattern | AI Pattern |
|--------|------------|---------------|------------|
| Sentence length variance | Standard deviation of words-per-sentence | High (stdev > 6) | Low (stdev < 4) |
| Type-Token Ratio (TTR) | Unique words / total words (first 500 words to normalize) | Higher (> 0.65) | Lower (< 0.55) |
| Hedging frequency | Count of hedging phrases per 1000 words: "it's worth noting", "it's important to", "it should be noted", "generally speaking", "in most cases" | Low (< 3 per 1000) | High (> 5 per 1000) |
| Cliche density | Count of AI-typical phrases per 1000 words: "delve", "landscape", "leverage", "tapestry", "multifaceted", "navigate", "robust", "comprehensive", "streamline" | Low (< 2 per 1000) | High (> 4 per 1000) |
| Em-dash frequency | Count of em-dashes (U+2014) per 1000 words | Varies (0-3) | High (> 4) |
| Paragraph rhythm variance | Standard deviation of words-per-paragraph | High (stdev > 15) | Low (stdev < 8) |

- Store all 6 signals as a feature vector per article
- Compute a composite AI probability score (0-1):
  ```
  ai_probability = (
    normalize_inverse(sentence_var, 2, 10) * 0.20 +
    normalize_inverse(ttr, 0.45, 0.80) * 0.20 +
    normalize(hedging, 0, 10) * 0.15 +
    normalize(cliche_density, 0, 8) * 0.20 +
    normalize(emdash_freq, 0, 8) * 0.10 +
    normalize_inverse(paragraph_var, 5, 25) * 0.15
  )
  ```
- Classification thresholds: HUMAN (< 0.35), HYBRID (0.35-0.65), AI-GENERATED (> 0.65)

### Sub-task 3: Classification Engine (~3h)
- Create `classifyCorpus(articles)` function
- Process each article through stylometric feature extraction
- Classify each: `{ url, title, author, classification: 'HUMAN'|'HYBRID'|'AI-GENERATED', aiProbability, features: { sentenceVar, ttr, hedging, clicheDensity, emdashFreq, paragraphVar } }`
- Generate corpus summary:
  ```javascript
  {
    totalArticles: 87,
    humanArticles: 52,
    hybridArticles: 18,
    aiArticles: 17,
    corpusSufficient: true, // >= 50 total, >= 30 human
    humanCorpusSize: 52,
    authorBreakdown: { "Mike T.": 34, "Sarah K.": 18, "Unknown": 35 },
    avgFeatures: { sentenceVar: 7.2, ttr: 0.68, ... }
  }
  ```
- If `humanArticles < 30`: set `corpusSufficient: false`, return recommendation to use manual persona creation
- Store classification results in `content_inventory.metadata` JSONB field (add `voice_classification`, `ai_probability`, `stylometric_features` keys)

### Sub-task 4: Database Migration (~1.5h)
- Create `migrations/011-writer-personas.sql`:
  ```sql
  CREATE TABLE writer_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    avg_sentence_length NUMERIC(5,2),
    vocabulary_richness NUMERIC(4,3),  -- TTR
    formality_score INTEGER CHECK (formality_score BETWEEN 0 AND 100),
    passive_voice_ratio NUMERIC(4,3),
    avg_paragraph_length NUMERIC(5,2),
    heading_style TEXT CHECK (heading_style IN ('question','declarative','how-to','mixed')),
    tone TEXT CHECK (tone IN ('formal','conversational','technical','casual')),
    corpus_urls TEXT[],
    corpus_size INTEGER DEFAULT 0,
    voice_profile JSONB NOT NULL DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );

  -- RLS policies
  ALTER TABLE writer_personas ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users see own personas" ON writer_personas FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users create own personas" ON writer_personas FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users update own personas" ON writer_personas FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Users delete own personas" ON writer_personas FOR DELETE USING (auth.uid() = user_id);

  -- Only one default per user
  CREATE UNIQUE INDEX idx_writer_personas_default ON writer_personas (user_id) WHERE is_default = true;
  ```
- Add migration to the migration runner sequence

### Sub-task 5: Bridge Server Endpoints (~3.5h)
- Add `POST /api/voice/analyze` — trigger corpus analysis for a site
  - Auth required
  - Body: `{ siteUrl: string, maxPages?: number }`
  - Creates a pipeline job for the crawl
  - Returns: `{ jobId, status: 'queued' }`
  - Validates URL format, rejects localhost/private IPs
- Add `GET /api/voice/corpus/:userId` — get corpus analysis status and summary
  - Auth required (user can only see own data)
  - Returns: `{ status, totalArticles, classified, humanCount, hybridCount, aiCount, corpusSufficient, lastAnalyzed }`
- Add `GET /api/voice/analyze/progress/:jobId` — SSE progress stream
  - Reuse existing SSE pattern from edit/generate endpoints
  - Events: `crawling` (url count), `extracting`, `classifying`, `complete`, `error`
- Rate limit: `/api/voice/analyze` limited to 1 concurrent analysis per user

## Testing Strategy

### Unit Tests (`tests/voice-analyzer.test.js`)
- Test text extraction from sample HTML (article, main, post-content patterns)
- Test stylometric feature extraction with known-human text (expect high variance, high TTR)
- Test stylometric feature extraction with known-AI text (expect low variance, high hedging)
- Test classification thresholds: verify HUMAN/HYBRID/AI boundaries
- Test corpus sufficiency check (>= 50 total, >= 30 human)
- Test TTR calculation with first-500-word normalization
- Test hedging and cliche pattern matching (case-insensitive, word boundaries)

### Integration Tests
- Test `/api/voice/analyze` creates a job and returns jobId
- Test `/api/voice/corpus/:userId` returns correct summary after analysis
- Test SSE progress stream delivers events in correct order
- Test rate limiting: second concurrent analyze request rejected
- Test auth required on all endpoints

## Acceptance Criteria
- [ ] Corpus crawler fetches articles from sitemap.xml or by following links (max 500 pages)
- [ ] Text extraction strips navigation, sidebar, footer, ads — preserves article content
- [ ] 6 stylometric signals computed per article with correct formulas
- [ ] Each article classified as HUMAN/HYBRID/AI-GENERATED with probability score
- [ ] Corpus summary generated with author breakdown and sufficiency check
- [ ] Falls back to manual persona recommendation when < 30 human articles
- [ ] `migrations/011-writer-personas.sql` creates table with RLS policies
- [ ] `/api/voice/analyze` triggers background crawl job with SSE progress
- [ ] `/api/voice/corpus/:userId` returns analysis summary
- [ ] Rate limited to 1 concurrent analysis per user
- [ ] Zero npm dependencies — pure Node.js
- [ ] All tests pass (`npm test`)

## Dependencies
- Blocked by: None (can start independently)
- Blocks: VI-002 (writer clustering), VI-003 (voice analyzer agent)
