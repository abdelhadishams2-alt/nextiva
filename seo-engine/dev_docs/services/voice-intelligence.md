# Voice Intelligence Service

> **Service #9** | **Layer 3** | **Priority: P1** | **Status: Planning**
> **Last Updated:** 2026-03-28
> **Spec Depth:** DEEP (target >= 9/10)

---

## 1. Overview

The Voice Intelligence Service is Layer 3 of ChainIQ's 6-layer intelligence architecture. It answers the question that separates an AI content tool from a content intelligence platform: "Who writes for this site, and how exactly do they write?" Without this layer, every AI-generated article sounds like every other AI-generated article -- competent, fluent, and utterly generic. With it, ChainIQ produces content indistinguishable from the client's own best human writers.

The anti-slop thesis is the philosophical foundation. The problem with AI-generated content is not that it sounds "robotic" -- modern LLMs produce prose that is grammatically flawless and structurally coherent. The problem is that it sounds like "a human," a generic averaged-out human, rather than like THIS human. A writer who opens every article with a one-line provocation. A writer who uses em-dashes sparingly but drops contractions constantly. A writer who averages 14.2 words per sentence with a variance of 8.7. Voice Intelligence captures those fingerprints and enforces them during generation. The thesis: "Write like THIS human, not like a human."

The service performs four core functions: (1) crawling a client's website to collect 50-100+ articles as a stylometric corpus, (2) classifying each article as HUMAN, HYBRID, or AI_GENERATED using six statistical signals with specific thresholds, (3) clustering human-written articles by writing style fingerprint using HDBSCAN to discover distinct writer voices without knowing how many writers exist, and (4) generating structured persona profiles (voice DNA) that the draft-writer agent consumes as quantified style constraints during article generation.

This service sits between Data Ingestion (Layer 1) and the Generation Pipeline (Layer 4). It consumes the content inventory URLs discovered by the Content Crawler, performs deep stylometric analysis on extracted article text, and outputs writer personas stored in the `writer_personas` table. The draft-writer agent receives a persona's `voice_profile` JSONB and uses it to constrain tone, cadence, vocabulary, and structure during generation. The Quality Gate (Layer 5) then scores the generated article against the target persona using stylometric distance, completing the feedback loop.

**6-layer fit:**
- Layer 1 (Data Ingestion) provides the URL corpus via `content_inventory`
- Layer 2 (Content Intelligence) consumes voice personas for content gap recommendations
- **Layer 3 (Voice Intelligence) -- THIS SERVICE -- produces writer personas and voice profiles**
- Layer 4 (Generation Pipeline) consumes `voice_profile` JSONB as draft-writer constraint
- Layer 5 (Quality Gate) scores voice match between generated article and target persona
- Layer 6 (Feedback Loop) tracks which voice personas produce higher-performing articles over time

**Primary users and their interactions:**

- **James (Editorial Director):** Obsessed with brand voice consistency across a 12-writer team. Connects his blog, triggers "Analyze Site," reviews the detected personas, and sets the default voice for all generated content. Checks voice match scores weekly, flags any generated article that scored below 0.70 for manual review. His nightmare: a generated article that "sounds AI" goes live and damages the brand.

- **Nadia (Content Operations Manager):** Manages 40+ writers across three content verticals (news, opinion, technical). Needs automated enforcement because manual style review does not scale. Uses voice personas to assign the right voice to the right content type automatically. When a new writer joins, she can assign them to an existing persona or wait for the next re-analysis to detect them as a new cluster.

- **Yousef (Arabic Content Lead):** Manages Arabic prose where the style spectrum is wider than English -- MSA formal news versus dialectal conversational blog versus hybrid corporate. His writers shift registers within a single article. He needs the system to understand that Arabic sentence length norms differ from English, that morphological root patterns carry style information, and that tashkeel (diacritical marks) usage is itself a formality signal.

- **Draft Writer Agent (system consumer):** Receives the `voice_profile` JSONB as a structured constraint. Does not interpret it creatively -- follows the quantified metrics as hard constraints (max passive voice ratio, min TTR, forbidden phrases) and the qualitative descriptions as soft guidance (humor style, analogy frequency).

- **Quality Gate (system consumer):** After generation, computes stylometric distance between the generated article and the target persona profile. Produces a voice match score (0.0-1.0) that contributes 15% to the overall quality rubric. Articles scoring below 0.70 voice match are flagged for revision.

**Day-in-the-life simulation:** James opens the ChainIQ dashboard Monday morning. He connected his BMW tuning blog last week and sees the Voice Intelligence panel. The system crawled 87 articles, classified 71 as HUMAN, 12 as HYBRID, and 4 as AI_GENERATED. HDBSCAN found 2 natural clusters. The first cluster (47 articles) is named "The Technical Explainer" -- avg sentence length 14.2, TTR 0.72, low formality, high contraction frequency, teaches through analogy. The second cluster (18 articles) is named "The Thought Leader" -- avg sentence length 22.1, TTR 0.58, higher formality, more passive voice, fewer contractions, opinion-driven argumentation. Six articles were noise (guest posts with unique styles, assigned cluster -1). James clicks "Set Default" on "The Technical Explainer" because that is the voice he wants all new articles to follow. He then clicks into "The Thought Leader" and tweaks the persona name to "The Industry Analyst" because that better describes the content type. Over the next week, ChainIQ generates 5 articles using the Technical Explainer voice. James reviews the voice match scores: 0.83, 0.79, 0.91, 0.74, 0.88. The 0.74 article used too much passive voice -- he clicks into it and sees the Quality Gate flagged "passive_voice_ratio: 0.14 vs target max 0.10." He sends it back for revision with one click.

**Competitive positioning:** Zero of 9 assessed competitors offer true writer fingerprinting. SurferSEO's "Custom Voice" accepts a 200-word paste and matches tone -- configuration, not intelligence. Writer.com offers brand voice governance -- manual rules, not detection. Originality.ai detects AI content but answers "is this AI?" not "who wrote this and how do they write?" ChainIQ is the only tool that analyzes 50-100+ articles per writer, uses 6 stylometric signals for classification, clusters by natural writer groups, and generates persistent quantified persona profiles. For Arabic content, the competitive gap is absolute -- no tool in any category analyzes Arabic writing style.

---

## 2. Entities & Data Model

### 2.1 writer_personas

Represents a single detected (or manually created) writer persona derived from corpus analysis. One row per persona per user. This is the primary output of the Voice Intelligence pipeline and the primary input to the draft-writer agent.

| Field | Type | Constraints | Nullable | Default | Description |
|-------|------|-------------|----------|---------|-------------|
| id | UUID | PRIMARY KEY | NOT NULL | `gen_random_uuid()` | Unique persona identifier |
| user_id | UUID | FK `auth.users(id)` ON DELETE CASCADE | NOT NULL | -- | Owning user |
| name | TEXT | -- | NOT NULL | -- | Persona name, auto-generated or user-edited (e.g., "The Technical Explainer") |
| is_default | BOOLEAN | -- | NOT NULL | `false` | If true, this persona is used when no specific persona is selected for generation |
| language | TEXT | -- | NOT NULL | `'en'` | Primary language of the corpus that produced this persona (ISO 639-1) |
| source | TEXT | CHECK IN (`auto`, `manual`, `reference`) | NOT NULL | `'auto'` | How this persona was created: `auto` (from corpus analysis), `manual` (user-created brand voice), `reference` (from external reference URLs when all site content was AI) |
| avg_sentence_length | NUMERIC(5,1) | CHECK > 0 | NOT NULL | -- | Mean sentence word count across corpus articles in this cluster (e.g., 14.2) |
| sentence_length_variance | NUMERIC(5,1) | CHECK >= 0 | NOT NULL | -- | Standard deviation of sentence word counts (e.g., 8.7). High variance = more human-like prose rhythm |
| vocabulary_richness | NUMERIC(4,3) | CHECK >= 0 AND <= 1 | NOT NULL | -- | Type-token ratio (TTR) on first 1000 words. Unique words / total words (e.g., 0.720) |
| formality_score | NUMERIC(5,2) | CHECK >= 0 AND <= 100 | NOT NULL | -- | 0-100 formality index. 0 = casual blog, 100 = academic paper. Computed from passive voice, nominalizations, third-person usage |
| passive_voice_ratio | NUMERIC(4,3) | CHECK >= 0 AND <= 1 | NOT NULL | -- | Fraction of sentences using passive voice (e.g., 0.08) |
| avg_paragraph_length | NUMERIC(5,1) | CHECK > 0 | NOT NULL | -- | Mean sentences per paragraph |
| paragraph_length_variance | NUMERIC(5,2) | CHECK >= 0 | NOT NULL | -- | Standard deviation of sentences per paragraph. High = varied paragraph rhythm |
| heading_style | TEXT | CHECK IN (`question`, `declarative`, `how-to`, `mixed`) | NOT NULL | `'mixed'` | Dominant heading style across corpus |
| tone | TEXT | CHECK IN (`formal`, `conversational`, `technical`, `casual`, `authoritative`, `educational`) | NOT NULL | `'conversational'` | Dominant tone classification |
| corpus_urls | TEXT[] | -- | NOT NULL | `'{}'` | Array of article URLs used to derive this persona |
| corpus_size | INTEGER | CHECK >= 0 | NOT NULL | 0 | Number of articles in the corpus for this persona |
| confidence | TEXT | CHECK IN (`high`, `medium`, `low`, `very_low`) | NOT NULL | `'medium'` | Persona reliability based on cluster cohesion. HIGH = intra-cluster distance < 0.25, MEDIUM = 0.25-0.50, LOW = 0.50-0.75, VERY_LOW = < 30 articles |
| voice_profile | JSONB | -- | NOT NULL | -- | Complete structured profile for agent consumption (see Section 2.5) |
| metadata | JSONB | -- | NOT NULL | `'{}'::jsonb` | `{ cluster_id, silhouette_score, analysis_session_id, intra_cluster_distance, created_method }` |
| created_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Creation timestamp |
| updated_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Last modification timestamp. Auto-updated by trigger |

**Unique constraint:** `UNIQUE (user_id, name)` -- one persona name per client. Prevents confusion when selecting personas for generation.

**Indexes:**
- `idx_personas_user_default` on `(user_id, is_default)` WHERE `is_default = true` -- fast lookup of default persona during generation. Partial index keeps it tiny.
- `idx_personas_user_created` on `(user_id, created_at DESC)` -- chronological listing on dashboard
- `idx_personas_user_language` on `(user_id, language)` -- filter personas by language for multi-language sites

**RLS Policies:**
- `Users read own personas`: SELECT WHERE `auth.uid() = user_id`
- `Users insert own personas`: INSERT WITH CHECK `auth.uid() = user_id`
- `Users update own personas`: UPDATE USING/WITH CHECK `auth.uid() = user_id`
- `Users delete own personas`: DELETE WHERE `auth.uid() = user_id`

**Trigger:** `BEFORE UPDATE` fires `update_updated_at()` to set `updated_at = now()`.

### 2.2 analysis_sessions

Tracks each voice analysis pipeline execution for progress reporting, auditing, and result retrieval.

| Field | Type | Constraints | Nullable | Default | Description |
|-------|------|-------------|----------|---------|-------------|
| id | UUID | PRIMARY KEY | NOT NULL | `gen_random_uuid()` | Session identifier |
| user_id | UUID | FK `auth.users(id)` ON DELETE CASCADE | NOT NULL | -- | Owning user |
| site_url | TEXT | -- | NOT NULL | -- | Root URL being analyzed |
| status | TEXT | CHECK IN (`queued`, `crawling`, `classifying`, `clustering`, `generating`, `completed`, `failed`, `cancelled`) | NOT NULL | `'queued'` | Current pipeline stage |
| trigger_type | TEXT | CHECK IN (`auto_connect`, `manual`, `scheduled`) | NOT NULL | `'manual'` | What initiated this analysis |
| articles_discovered | INTEGER | CHECK >= 0 | NOT NULL | 0 | Total articles found in corpus |
| articles_classified | INTEGER | CHECK >= 0 | NOT NULL | 0 | Articles that have been classified |
| articles_human | INTEGER | CHECK >= 0 | NOT NULL | 0 | Articles classified as HUMAN |
| articles_hybrid | INTEGER | CHECK >= 0 | NOT NULL | 0 | Articles classified as HYBRID |
| articles_ai | INTEGER | CHECK >= 0 | NOT NULL | 0 | Articles classified as AI_GENERATED |
| clusters_found | INTEGER | CHECK >= 0 | NOT NULL | 0 | Number of writer clusters detected |
| personas_generated | INTEGER | CHECK >= 0 | NOT NULL | 0 | Number of personas successfully generated |
| corpus_data | JSONB | -- | NOT NULL | `'[]'::jsonb` | Array of CorpusArticle objects (transient analysis data). Purged 30 days after completion |
| error | TEXT | -- | YES | NULL | Error message if failed |
| started_at | TIMESTAMPTZ | -- | YES | NULL | Pipeline start time |
| completed_at | TIMESTAMPTZ | -- | YES | NULL | Pipeline completion time |
| created_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Session creation time |

**Indexes:**
- `idx_analysis_user_status` on `(user_id, status)` -- find active/recent sessions
- `idx_analysis_user_created` on `(user_id, created_at DESC)` -- chronological listing

**RLS:** Same user_id pattern as writer_personas.

### 2.3 voice_match_scores

Records voice match scores for every generated article. One row per generated article. Used by the Quality Gate for pass/fail decisions and by the Feedback Loop for tracking voice quality trends over time.

| Field | Type | Constraints | Nullable | Default | Description |
|-------|------|-------------|----------|---------|-------------|
| id | UUID | PRIMARY KEY | NOT NULL | `gen_random_uuid()` | Score record identifier |
| user_id | UUID | FK `auth.users(id)` ON DELETE CASCADE | NOT NULL | -- | Owning user |
| article_id | UUID | -- | NOT NULL | -- | Generated article identifier (FK to generation pipeline output) |
| persona_id | UUID | FK `writer_personas(id)` ON DELETE SET NULL | YES | NULL | Target persona. NULL if persona was deleted after generation |
| overall_score | NUMERIC(4,3) | CHECK >= 0 AND <= 1 | NOT NULL | -- | Composite voice match score (0.000 = no match, 1.000 = perfect match) |
| passed | BOOLEAN | -- | NOT NULL | -- | True if `overall_score >= 0.70` (the pass threshold) |
| signal_scores | JSONB | -- | NOT NULL | -- | Per-signal breakdown: `{ sentence_length: {target, actual, score}, ttr: {...}, passive_voice: {...}, formality: {...}, hedging: {...}, cliche: {...}, paragraph_rhythm: {...} }` |
| revision_guidance | TEXT | -- | YES | NULL | Human-readable guidance if score < 0.70 (e.g., "Reduce passive voice from 0.14 to below 0.10. Increase sentence length variance.") |
| created_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Score creation time |

**Indexes:**
- `idx_match_user_article` on `(user_id, article_id)` -- lookup score for a specific article
- `idx_match_persona_score` on `(persona_id, overall_score)` -- persona quality tracking
- `idx_match_user_created` on `(user_id, created_at DESC)` -- recent scores for dashboard

**RLS:** Same user_id pattern.

### 2.4 corpus_articles (transient, stored in analysis_sessions.corpus_data JSONB)

Not a dedicated table. Each CorpusArticle is a JSON object within the `corpus_data` array on `analysis_sessions`. This avoids creating a high-churn table for data that is only needed during analysis and for 30 days after. Raw article text is NOT persisted beyond the analysis session -- only extracted features survive.

**CorpusArticle JSON structure:**

```json
{
  "url": "https://example.com/blog/n54-hpfp-symptoms",
  "content_id": "uuid-linking-to-content-inventory",
  "author": "Mike T.",
  "word_count": 2847,
  "sentence_count": 198,
  "language": "en",
  "classification": "HUMAN",
  "classification_confidence": 0.87,
  "classification_signals": {
    "sentence_length_variance": { "value": 9.4, "normalized_score": 0.91, "signal": "human" },
    "vocabulary_richness": { "value": 0.71, "normalized_score": 0.82, "signal": "human" },
    "hedging_frequency": { "value": 0.8, "normalized_score": 0.88, "signal": "human" },
    "cliche_density": { "value": 0.3, "normalized_score": 0.94, "signal": "human" },
    "em_dash_frequency": { "value": 1.2, "normalized_score": 0.78, "signal": "neutral" },
    "paragraph_rhythm_variance": { "value": 2.1, "normalized_score": 0.85, "signal": "human" }
  },
  "composite_score": 0.87,
  "style_fingerprint": [0.72, 0.83, 0.71, 0.38, 0.06, 0.62, 0.04, 0.01, 0.18, 0.12, 0.67, 0.03],
  "cluster_id": 0,
  "extracted_at": "2026-03-28T14:30:00Z"
}
```

Note: `raw_text` is deliberately absent. Raw article text is held in memory during analysis and discarded. Only computed features and the style fingerprint vector are persisted in the corpus_data JSONB. This is a security and storage design decision -- see Section 13.

### 2.5 voice_profile JSONB Schema

The `voice_profile` field on `writer_personas` is the primary output consumed by the draft-writer agent. It is a structured JSON document that combines quantitative metrics (hard constraints) with qualitative descriptions (soft guidance). The draft-writer treats numeric fields as targets to hit within tolerance and text descriptions as stylistic direction.

**Complete schema with real example (derived from a BMW tuning blog corpus):**

```json
{
  "schema_version": "1.0",
  "persona_name": "The Technical Explainer",
  "summary": "Conversational-authoritative voice that teaches through analogy. Punchy openers followed by deep technical explanation. Never hedges, never uses AI cliches. Contextualizes every number with real-world meaning.",

  "voice": {
    "primary_tone": "conversational-authoritative",
    "secondary_tone": "educational",
    "register": "informal-expert",
    "description": "Teaches through analogy and direct experience. Uses 'here's the thing' as a transition device. Contextualizes every number ('145 bar -- barely enough for cold start'). Addresses the reader as 'you' constantly. Never talks down, never over-explains fundamentals, assumes the reader is an enthusiast."
  },

  "cadence": {
    "avg_sentence_length": 14.2,
    "sentence_length_variance": 8.7,
    "short_sentence_ratio": 0.28,
    "long_sentence_ratio": 0.15,
    "avg_sentences_per_paragraph": 3.2,
    "paragraph_length_variance": 1.8,
    "description": "Short-medium sentences with occasional long explanatory runs. Punchy openers (1-5 words) followed by 2-3 medium sentences. Never more than 2 long sentences in sequence. Single-sentence emphasis paragraphs appear every 4-5 paragraphs. Paragraph rhythm is deliberately irregular -- never a wall of same-length blocks."
  },

  "structure": {
    "opener_style": "real-world scenario or provocative question",
    "closer_style": "actionable takeaway, no fluff, no 'in conclusion'",
    "heading_style": "mixed -- questions for problem sections, declarative for solutions",
    "uses_lists": true,
    "list_style": "short punchy items, no full sentences, dashes not bullets for inline",
    "uses_tables": true,
    "table_style": "comparison tables for specs, not decorative",
    "uses_blockquotes": false,
    "section_rhythm": "problem -> context -> solution -> evidence -> takeaway"
  },

  "vocabulary": {
    "ttr": 0.72,
    "formality_score": 38,
    "jargon_comfort": "high -- uses technical terms without over-explaining, assumes enthusiast audience",
    "favorite_transitions": ["here's the thing", "in practice", "the short answer", "what actually happens", "the fix is"],
    "avoids": ["it's worth noting", "it's important to remember", "delve", "landscape", "leverage", "in conclusion", "without further ado", "at the end of the day", "in today's world"],
    "signature_phrases": ["here's the thing", "let me explain", "the real question is"],
    "contraction_frequency": "high -- always 'don't', 'won't', 'it's', never 'do not', 'will not'"
  },

  "quirks": {
    "passive_voice_ratio": 0.06,
    "em_dash_frequency": "low (< 1.5 per 1000 words)",
    "exclamation_frequency": "rare (< 0.5 per 1000 words)",
    "parenthetical_frequency": "occasional -- used for asides and humor, not clarification",
    "humor_style": "dry, occasional, never forced. Usually through unexpected analogies or self-deprecating asides.",
    "number_style": "always contextualized ('145 bar -- barely enough for cold start', '2.3L -- not exactly a muscle car')",
    "analogy_frequency": "high -- at least one per major section, drawn from everyday experience",
    "question_frequency": "moderate -- uses rhetorical questions to set up explanations, never more than 2 per section"
  },

  "constraints": {
    "max_passive_voice_ratio": 0.10,
    "max_hedging_density": 0.002,
    "max_cliche_density": 0.001,
    "min_ttr": 0.65,
    "max_consecutive_same_length": 3,
    "min_sentence_length_variance": 6.0,
    "max_paragraph_uniformity": 0.8,
    "forbidden_phrases": [
      "it's worth noting", "it's important to remember", "it should be noted",
      "at the end of the day", "without further ado", "in conclusion",
      "delve", "landscape", "leverage", "navigate", "tapestry",
      "game-changer", "elevate", "streamline", "holistic", "robust"
    ]
  },

  "reference_urls": [
    "https://example.com/blog/n54-hpfp-symptoms",
    "https://example.com/blog/b58-tuning-guide",
    "https://example.com/blog/mhd-flash-review",
    "https://example.com/blog/walnut-blasting-diy",
    "https://example.com/blog/jb4-vs-mhd-comparison"
  ],

  "corpus_stats": {
    "total_articles_analyzed": 87,
    "human_articles_in_cluster": 47,
    "analysis_date": "2026-03-28T14:30:00Z",
    "analysis_session_id": "uuid-of-session",
    "cluster_id": 0,
    "silhouette_score": 0.73,
    "intra_cluster_distance": 0.18
  }
}
```

**Schema versioning:** The `schema_version` field allows future evolution without breaking existing personas. Version `1.0` is the launch schema. When adding new fields, increment to `1.1` and ensure backward compatibility (new fields are optional, old consumers ignore them).

---

## 3. API Endpoints

### 3.1 Voice Analysis

**`POST /api/voice/analyze`**

Triggers the full voice analysis pipeline on a connected site. Long-running -- returns immediately with a job ID and streams progress via SSE.

- **Auth:** User (Bearer token)
- **Request body:**
```json
{
  "site_url": "https://example.com",
  "max_articles": 100,
  "min_articles": 50,
  "force_reanalyze": false
}
```
- **Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "status": "queued",
    "estimated_duration_minutes": 8,
    "message": "Voice analysis queued. Crawling site for article corpus."
  }
}
```
- **Side effects:** Creates row in `analysis_sessions` with `status: 'queued'`. Queues pipeline job.
- **Error codes:** 401 Unauthorized, 400 Bad Request (invalid URL), 409 Conflict (analysis already running for this user -- max 1 concurrent), 429 Too Many Requests (max 3 analysis runs per day per user)
- **Validation:** `site_url` must be a valid HTTPS URL. `max_articles` must be 10-500 (default 100). `min_articles` must be 10-100 (default 50). `min_articles <= max_articles`. If `force_reanalyze` is false and a completed analysis exists within the last 7 days, return 409 with `"message": "Recent analysis exists. Set force_reanalyze: true to override."`

**`GET /api/voice/analyze/progress/:sessionId`**

SSE (Server-Sent Events) stream for real-time pipeline progress.

- **Auth:** User (Bearer token)
- **Response:** SSE stream with events:
```
data: {"stage":"crawling","progress":34,"total":87,"message":"Extracting article 34/87","percent":15}

data: {"stage":"classifying","progress":87,"total":87,"message":"Classifying articles","percent":45}

data: {"stage":"clustering","progress":1,"total":1,"message":"Running HDBSCAN clustering","percent":58}

data: {"stage":"generating","progress":2,"total":2,"message":"Generating persona 2/2","percent":82}

data: {"stage":"completed","personas":[{"id":"uuid","name":"The Technical Explainer","corpus_size":47,"is_default":true}],"percent":100}
```
- **Error codes:** 401, 404 (session not found or belongs to another user)
- **Behavior:** Connection auto-closes when pipeline completes or fails. If client disconnects, pipeline continues running in the background.

**`GET /api/voice/analyze/status`**

Non-SSE status check for the most recent analysis session.

- **Auth:** User (Bearer token)
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "status": "completed",
    "articles_discovered": 87,
    "articles_human": 71,
    "articles_hybrid": 12,
    "articles_ai": 4,
    "clusters_found": 2,
    "personas_generated": 2,
    "started_at": "2026-03-28T14:22:00Z",
    "completed_at": "2026-03-28T14:30:00Z"
  }
}
```

### 3.2 Persona Management

**`GET /api/voice/personas`**

- **Auth:** User (Bearer token)
- **Query params:** `language` (optional filter, ISO 639-1), `source` (optional filter: `auto`, `manual`, `reference`)
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "personas": [
      {
        "id": "uuid",
        "name": "The Technical Explainer",
        "is_default": true,
        "language": "en",
        "source": "auto",
        "corpus_size": 47,
        "confidence": "high",
        "avg_sentence_length": 14.2,
        "vocabulary_richness": 0.72,
        "formality_score": 38,
        "tone": "conversational",
        "created_at": "2026-03-28T14:30:00Z",
        "updated_at": "2026-03-28T14:30:00Z"
      }
    ],
    "total": 2
  }
}
```
- **Note:** List endpoint returns summary fields only. Full `voice_profile` JSONB is returned only by the single-persona endpoint (to keep list responses lightweight).

**`GET /api/voice/personas/:id`**

- **Auth:** User (Bearer token)
- **Response (200):** Full `writer_personas` row including complete `voice_profile` JSONB
- **Error codes:** 401, 404

**`POST /api/voice/personas`**

Manual persona creation (brand voice mode). Used when a client wants to define a voice from scratch rather than derive it from corpus analysis.

- **Auth:** User (Bearer token)
- **Request body:**
```json
{
  "name": "Brand Voice",
  "language": "en",
  "tone": "formal",
  "voice_profile": {
    "voice": { "primary_tone": "authoritative", "register": "formal-expert" },
    "cadence": { "avg_sentence_length": 18.0, "sentence_length_variance": 6.5 },
    "vocabulary": { "ttr": 0.65, "formality_score": 72 },
    "constraints": { "forbidden_phrases": ["gonna", "kinda", "sorta"] }
  }
}
```
- **Response (201):** Created persona record
- **Side effects:** Sets `source: 'manual'`. Fills missing numeric fields with neutral defaults (avg_sentence_length: 16.0, vocabulary_richness: 0.60, formality_score: 50, passive_voice_ratio: 0.10, avg_paragraph_length: 4.0, paragraph_length_variance: 1.5, sentence_length_variance: 6.0).
- **Error codes:** 401, 400 (missing `name`), 409 (persona with this name already exists)

**`PUT /api/voice/personas/:id`**

- **Auth:** User (Bearer token)
- **Request body:** Partial update. Any field from `writer_personas` except `id`, `user_id`, `created_at`. Supports nested `voice_profile` patching (deep merge, not replace).
- **Response (200):** Updated persona record
- **Error codes:** 401, 404, 400 (invalid field values), 409 (name conflict)
- **Deep merge behavior:** If request includes `{ "voice_profile": { "vocabulary": { "ttr": 0.68 } } }`, only `voice_profile.vocabulary.ttr` is updated. All other `voice_profile` fields are preserved. This allows tweaking individual metrics without re-submitting the entire profile.

**`DELETE /api/voice/personas/:id`**

- **Auth:** User (Bearer token)
- **Response (200):** `{ "success": true, "message": "Persona deleted" }`
- **Error codes:** 401, 404, 409 Conflict (cannot delete the default persona if other personas exist -- user must set a different default first)
- **Behavior:** If this is the ONLY persona and it is default, deletion is allowed (user returns to "no personas" state). If other personas exist and this is the default, return 409 with `"message": "Cannot delete the default persona. Set another persona as default first."`

**`POST /api/voice/personas/:id/set-default`**

- **Auth:** User (Bearer token)
- **Response (200):** `{ "success": true, "data": { "id": "uuid", "name": "The Technical Explainer", "is_default": true } }`
- **Side effects:** Sets `is_default = true` on the target persona and `is_default = false` on all other personas for this user (single SQL transaction).
- **Error codes:** 401, 404

### 3.3 Single Article Classification

**`POST /api/voice/classify`**

Classify a single article URL as HUMAN, HYBRID, or AI_GENERATED. Useful for one-off checks outside of full corpus analysis.

- **Auth:** User (Bearer token)
- **Request body:**
```json
{
  "url": "https://example.com/blog/my-article"
}
```
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "url": "https://example.com/blog/my-article",
    "word_count": 1847,
    "classification": "HUMAN",
    "confidence": 0.87,
    "composite_score": 0.83,
    "signals": {
      "sentence_length_variance": { "value": 9.4, "normalized_score": 0.91, "signal": "human", "weight": 0.20 },
      "vocabulary_richness": { "value": 0.71, "normalized_score": 0.82, "signal": "human", "weight": 0.20 },
      "hedging_frequency": { "value": 0.8, "normalized_score": 0.88, "signal": "human", "weight": 0.15 },
      "cliche_density": { "value": 0.3, "normalized_score": 0.94, "signal": "human", "weight": 0.15 },
      "em_dash_frequency": { "value": 1.2, "normalized_score": 0.78, "signal": "neutral", "weight": 0.10 },
      "paragraph_rhythm_variance": { "value": 2.1, "normalized_score": 0.85, "signal": "human", "weight": 0.20 }
    },
    "thresholds": {
      "human": ">= 0.65",
      "hybrid": "0.35 - 0.64",
      "ai_generated": "< 0.35"
    }
  }
}
```
- **Error codes:** 401, 400 (invalid URL), 422 (URL returned non-200, non-HTML, or article too short -- under 300 words), 429 (rate limited: 30 requests per minute per user)

### 3.4 Voice Match Scoring

**`POST /api/voice/match-score`**

Score a piece of text against a target persona. Used by the Quality Gate after article generation, and available as a standalone endpoint for manual checks.

- **Auth:** User (Bearer token)
- **Request body:**
```json
{
  "persona_id": "uuid",
  "text": "The full generated article text...",
  "article_id": "uuid-optional"
}
```
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "overall_score": 0.83,
    "passed": true,
    "signals": {
      "sentence_length": { "target": 14.2, "actual": 15.1, "distance": 0.06, "score": 0.94 },
      "sentence_variance": { "target": 8.7, "actual": 7.2, "distance": 0.17, "score": 0.83 },
      "ttr": { "target": 0.72, "actual": 0.68, "distance": 0.06, "score": 0.94 },
      "formality": { "target": 38, "actual": 42, "distance": 0.04, "score": 0.96 },
      "passive_voice": { "target_max": 0.10, "actual": 0.07, "within_limit": true, "score": 1.00 },
      "hedging_density": { "target_max": 0.002, "actual": 0.001, "within_limit": true, "score": 1.00 },
      "cliche_density": { "target_max": 0.001, "actual": 0.000, "within_limit": true, "score": 1.00 },
      "paragraph_rhythm": { "target_variance": 1.8, "actual_variance": 1.4, "distance": 0.22, "score": 0.78 }
    },
    "revision_guidance": null
  }
}
```
- **Error codes:** 401, 400 (missing persona_id or text), 404 (persona not found), 422 (text too short -- under 200 words)
- **Side effects:** If `article_id` is provided, stores result in `voice_match_scores` table.

---

## 4. Business Rules

**BR-01: Minimum Corpus Size for Clustering.** The statistical significance threshold for reliable HDBSCAN clustering is 50 articles classified as HUMAN. Below this threshold, clustering behavior degrades:
- 30-49 HUMAN articles: Clustering proceeds but all generated personas are marked `confidence: 'low'`. Dashboard displays an amber warning: "Limited corpus -- persona profiles may not be reliable."
- 10-29 HUMAN articles: Clustering is skipped. A single aggregate persona is generated from all HUMAN articles without style differentiation. Marked `confidence: 'very_low'`.
- Fewer than 10 HUMAN articles: Automated analysis is skipped entirely. User is redirected to the manual persona creation form. Analysis session status is set to `completed` with `personas_generated: 0` and `error: "Insufficient human content for analysis. Only N human-written articles found (minimum 10 required)."`

**BR-02: AI Classification Thresholds.** The composite score from 6 weighted signals determines classification:
- HUMAN: composite >= 0.65 (high confidence human-written)
- HYBRID: composite 0.35-0.64 (mixed signals -- likely human-edited AI or AI-assisted human)
- AI_GENERATED: composite < 0.35 (high confidence AI-generated)
These thresholds are hardcoded in `bridge/intelligence/stylometrics.js` as named constants. Changing them requires a code deploy, not configuration -- to prevent accidental threshold drift.

**BR-03: Only Human Content Feeds Clustering.** Articles classified as HYBRID or AI_GENERATED are excluded from the HDBSCAN clustering input. Personas must derive from genuine human writing only. Including AI content would contaminate the voice fingerprint with LLM artifacts (uniform paragraph rhythm, hedging phrases, limited vocabulary variance). HYBRID articles are logged in the analysis report so the client can review them, but they do not influence persona generation.

**BR-04: Default Persona Auto-Selection.** When an analysis session completes and generates personas:
- If the user has NO existing personas, the persona from the largest cluster (most articles) is automatically set as `is_default = true`.
- If the user HAS existing personas, new personas are added alongside them with `is_default = false`. The existing default is preserved.
- If `force_reanalyze` was set, existing auto-generated personas from the previous analysis are replaced (deleted and re-created). Manual personas are never deleted by re-analysis.

**BR-05: Persona Naming Conventions.** Auto-generated persona names follow the template "The [Adjective] [Noun]" with 15 predefined combinations mapped to dominant stylometric traits:
- High formality + high technical depth = "The Academic Expert"
- Low formality + high humor markers + high contraction frequency = "The Casual Conversationalist"
- Medium formality + high analogy frequency = "The Technical Storyteller"
- High formality + low TTR + high passive voice = "The Corporate Voice"
- Low formality + high question frequency = "The Curious Explorer"
- High formality + long sentences + low humor = "The Industry Analyst"
- Low formality + short sentences + high exclamation = "The Enthusiast"
- Medium formality + balanced metrics = "The Versatile Writer"
Users can rename personas at any time via `PUT /api/voice/personas/:id`.

**BR-06: Voice Match Minimum Score.** Generated articles must score >= 0.70 voice match against the target persona to pass the Quality Gate voice signal. Articles scoring 0.60-0.69 receive a "soft fail" with revision guidance. Articles scoring below 0.60 receive a "hard fail" and are automatically sent back for revision with specific metric-level feedback (e.g., "passive voice ratio 0.18 exceeds target max 0.10").

**BR-07: One Active Analysis Per User.** Only one voice analysis session can be in a non-terminal state (`queued`, `crawling`, `classifying`, `clustering`, `generating`) per user at any time. Attempting to trigger a second analysis returns 409. The user can cancel a running analysis via dashboard action, which sets `status: 'cancelled'`.

**BR-08: Analysis Cooldown.** A maximum of 3 analysis runs per user per day to prevent abuse of crawling infrastructure. Each completed or failed analysis counts toward the daily limit. Cancelled analyses within the first 60 seconds do not count (they consumed negligible resources).

**BR-09: Corpus URL Deduplication.** If the content inventory contains multiple URLs pointing to the same content (e.g., `https://example.com/blog/post` and `https://example.com/blog/post/`), deduplicate by canonical URL before analysis. If no canonical URL is available, normalize by stripping trailing slashes, query parameters, and fragment identifiers.

**BR-10: Author Metadata as Weak Signal.** If content inventory includes author names, they are used as a soft validation layer after clustering. If HDBSCAN clusters align with known authors (e.g., cluster 0 contains 90% articles by "Mike T."), the persona inherits the author name in metadata. If a single author's articles span multiple clusters, log a discrepancy: "Author 'Mike T.' appears in 2 style clusters -- possible ghost writer, style evolution, or editorial changes." Author metadata never overrides clustering -- stylometric signals are the ground truth.

**BR-11: Stale Persona Warning.** If the most recent analysis session for a user is older than 90 days and the user generates content, display a dashboard warning: "Voice profiles are 90+ days old. Consider re-analyzing to detect any style changes." The warning is informational only -- it does not block generation.

**BR-12: Multi-Language Persona Separation.** If a site's content inventory contains articles in multiple languages, the analysis pipeline splits the corpus by detected language BEFORE classification and clustering. Each language group produces its own set of personas. A site with 60 English articles and 40 Arabic articles generates English personas and Arabic personas independently. Personas include the `language` field and are filtered by language when the draft-writer selects a persona for generation.

**BR-13: Forbidden Phrase Enforcement.** The `constraints.forbidden_phrases` array in voice_profile is a hard constraint. The draft-writer agent MUST NOT use any phrase in this list. The Quality Gate checks for forbidden phrase violations. Any violation is an automatic quality fail regardless of the overall voice match score.

**BR-14: Manual Persona Protection.** Personas with `source: 'manual'` are never modified or deleted by automated analysis runs. Re-analysis only affects personas with `source: 'auto'`. This protects brand voice definitions that users have carefully crafted.

---

## 5. Modules

### 5.1 Corpus Crawler (`bridge/intelligence/voice-analyzer.js` -- crawl phase)

Collects article text from the client's website for stylometric analysis. Reuses URL discovery from the Data Ingestion Content Crawler but performs deeper text extraction optimized for prose analysis rather than metadata extraction.

**Input:** User ID, site URL, max_articles, min_articles.

**Process:**

1. **Query content inventory.** Fetch all URLs from `content_inventory` for this user where `word_count >= 300` and `status IN ('ok', 'thin')` and `language IS NOT NULL`. Order by `word_count DESC` to prioritize longer articles (more stylometric signal). Limit to `max_articles`.

2. **Check corpus sufficiency.** If content inventory has fewer than `min_articles` qualifying URLs, trigger a targeted supplemental crawl of `/blog/*`, `/articles/*`, `/news/*`, `/posts/*`, `/magazine/*`, `/insights/*`, `/resources/*` paths on the site. This catches blog content that may not have been indexed in the initial Data Ingestion crawl.

3. **Fetch and extract article text.** For each URL, fetch the page with polite crawling settings (max 3 concurrent requests, 500ms minimum delay between sequential requests to same host, respect `robots.txt`, User-Agent `ChainIQ-Bot/1.0`). Extract article body text using DOM analysis:
   - Find primary content container: `<article>`, `<main>`, `[role="main"]`, `#content`, `.post-content`, `.entry-content`, `.article-body` (in priority order)
   - Strip non-content elements: `<nav>`, `<footer>`, `<aside>`, `<header>`, `.sidebar`, `.comments`, `.related-posts`, `.author-bio`, `.social-share`, `.breadcrumbs`, `.pagination`
   - Remove inline scripts, styles, ad containers (`<ins>`, `.ad-`, `.advertisement`, `.sponsored`, `[data-ad]`)
   - Preserve paragraph boundaries (`<p>` tags become `\n\n`)
   - Preserve heading structure (`<h1>`-`<h6>` tagged as `[H1]...[/H1]` markers for later heading style analysis)
   - Strip all remaining HTML tags, decode HTML entities

4. **Detect author.** Check these sources in priority order and use the first non-empty result:
   - `content_inventory.author` field (already extracted by Data Ingestion)
   - `<meta name="author" content="...">` tag
   - JSON-LD `Person` schema `name` field
   - Byline CSS patterns: `.author`, `.byline`, `.posted-by`, `.written-by`, `.author-name`
   - WordPress API author endpoint (if site is WordPress, detectable via `<meta name="generator">`)

5. **Filter by word count.** Skip articles under 300 words after extraction. This threshold exists because stylometric analysis requires sufficient text for statistical significance. A 300-word article provides approximately 20 sentences -- the minimum for meaningful sentence length variance calculation.

6. **Detect language per article.** Use Unicode range detection as primary signal:
   - Arabic: U+0600-U+06FF characters comprise > 40% of text
   - Hebrew: U+0590-U+05FF
   - CJK: U+4E00-U+9FFF, U+3040-U+309F, U+30A0-U+30FF
   - Latin-based: default. Further discrimination via common word frequency (English, Spanish, French, German, etc.)
   Supplement with `<html lang>` attribute from content inventory when Unicode detection is ambiguous.

**Output:** Array of CorpusArticle objects stored in `analysis_sessions.corpus_data` JSONB.

**Performance:** For a typical site with 100 qualifying articles, corpus crawling takes 2-5 minutes (bottlenecked by polite crawling delays, not computation). Articles already in content inventory with `content_hash` matching the last crawl can have their text re-extracted from cached pages if the Data Ingestion crawler stored them, reducing fetch time.

### 5.2 AI vs Human Classifier (`bridge/intelligence/stylometrics.js`)

Runs stylometric analysis on each extracted article to classify it as HUMAN, HYBRID, or AI_GENERATED. This step filters out AI-written content before clustering, ensuring personas are derived only from genuine human writing.

**Six classification signals with specific thresholds:**

| # | Signal | Metric | Human Range | AI Range | Neutral Zone | Weight |
|---|--------|--------|-------------|----------|-------------|--------|
| 1 | Sentence Length Variance | Standard deviation of words-per-sentence | >= 6.0 | < 4.0 | 4.0-5.9 | 0.20 |
| 2 | Vocabulary Richness (TTR) | Unique words / total words (first 1000 words) | >= 0.62 | < 0.55 | 0.55-0.61 | 0.20 |
| 3 | Hedging Frequency | Hedge phrases per 1000 words | < 3.0 | >= 6.0 | 3.0-5.9 | 0.15 |
| 4 | Cliche Density | AI-cliche phrases per 1000 words | < 2.0 | >= 5.0 | 2.0-4.9 | 0.15 |
| 5 | Em-Dash Frequency | Em-dashes per 1000 words | < 1.5 | >= 4.0 | 1.5-3.9 | 0.10 |
| 6 | Paragraph Rhythm Variance | Std deviation of sentences-per-paragraph | >= 1.2 | < 0.7 | 0.7-1.1 | 0.20 |

**Signal 1 -- Sentence Length Variance (weight: 0.20):**

Human writers naturally vary sentence length based on thought flow -- a 4-word punchy opener, a 28-word complex explanation, a 12-word transition. AI models (especially at temperature 0.7-1.0) produce sentences that cluster tightly around 15-20 words. The standard deviation of words-per-sentence across all sentences in an article is the most reliable single signal.

Calculation: Split text into sentences using regex `(?<=[.!?])\s+(?=[A-Z\u0600-\u06FF])` (handles both English and Arabic sentence boundaries). Count words per sentence. Compute standard deviation. Normalize to 0-1 score using linear interpolation: `score = clamp((value - 4.0) / (6.0 - 4.0), 0, 1)` where 4.0 maps to 0.0 and >= 6.0 maps to 1.0.

**Signal 2 -- Vocabulary Richness / TTR (weight: 0.20):**

Type-Token Ratio measures lexical diversity. Human writers use more varied vocabulary, including domain-specific jargon, colloquialisms, and unusual word choices. AI tends toward a narrower vocabulary with high-frequency synonyms.

Calculation: Tokenize to words (lowercase, strip punctuation). Take the first 1000 words (TTR is length-sensitive -- comparing a 500-word article to a 5000-word article is invalid without normalization). Count unique tokens. TTR = unique / total. For articles shorter than 1000 words, use all available words but flag as `low_confidence_ttr: true`. Normalize: `score = clamp((value - 0.55) / (0.62 - 0.55), 0, 1)`.

**Signal 3 -- Hedging Frequency (weight: 0.15):**

AI-generated text uses hedging phrases at 2-5x human frequency. These are "safety" phrases the model inserts to sound balanced or authoritative, but humans rarely use them.

Hedge phrase dictionary (50+ phrases, case-insensitive matching):
`"it's worth noting"`, `"it's important to remember"`, `"it should be noted"`, `"one might argue"`, `"it goes without saying"`, `"needless to say"`, `"it bears mentioning"`, `"in today's fast-paced world"`, `"in the ever-evolving landscape"`, `"it's no secret that"`, `"it's safe to say"`, `"arguably"`, `"it remains to be seen"`, `"there's no denying"`, `"it cannot be overstated"`, `"one could argue"`, `"it would be remiss"`, `"it's widely acknowledged"`, `"it's commonly understood"`, `"it's generally accepted"`, `"for all intents and purposes"`, `"at the same time"`, `"on the other hand"`, `"having said that"`, `"that being said"`, `"with that in mind"`, `"all things considered"`, `"by and large"`, `"to a large extent"`, `"in many ways"`, `"in no small measure"`, `"to say the least"`, `"to put it mildly"`, `"in a nutshell"`, `"the fact of the matter is"`, `"at the risk of oversimplifying"`, `"it's worth pointing out"`, `"it merits attention"`, `"it's fair to say"`, `"in all likelihood"`, `"for what it's worth"`, `"it stands to reason"`, `"as a matter of fact"`, `"truth be told"`, `"in point of fact"`, `"as it turns out"`, `"interestingly enough"`, `"surprisingly enough"`, `"importantly"`, `"significantly"`.

Calculation: Count phrase matches per article. Divide by word count, multiply by 1000. Normalize: `score = clamp(1.0 - (value - 3.0) / (6.0 - 3.0), 0, 1)` (inverse -- lower hedging = higher score).

**Signal 4 -- Cliche Density (weight: 0.15):**

AI models, particularly GPT-4 and Claude, have characteristic vocabulary preferences that function as stylometric fingerprints. These are words and phrases that appear at dramatically higher frequency in AI text than in human text.

AI cliche dictionary (40+ terms, context-aware matching):
`"delve"` (verb, not noun), `"landscape"` (metaphorical, not geographic), `"leverage"` (verb), `"navigate"` (metaphorical), `"tapestry"`, `"multifaceted"`, `"holistic"`, `"paradigm"`, `"synergy"`, `"robust"`, `"cutting-edge"`, `"game-changer"`, `"elevate"`, `"streamline"`, `"harness"`, `"empower"`, `"foster"`, `"spearhead"`, `"unlock"` (metaphorical), `"pivotal"`, `"cornerstone"`, `"underscores"`, `"encompasses"`, `"realm"`, `"myriad"`, `"plethora"`, `"embark"`, `"dive deep"`, `"shed light"`, `"pave the way"`, `"a testament to"`, `"serves as a"`, `"plays a crucial role"`, `"is a key component"`, `"is essential for"`, `"stands out as"`, `"is poised to"`, `"is set to"`, `"reshaping"`, `"revolutionizing"`, `"transformative"`.

Context-aware matching: `"landscape"` in a geography article ("the desert landscape") is not an AI cliche. Context detection uses a 5-word window around the match. If the surrounding words are domain-specific to the article's topic (detected via heading analysis), the match is discounted by 50%.

Calculation: Count context-aware matches per article. Divide by word count, multiply by 1000. Normalize: `score = clamp(1.0 - (value - 2.0) / (5.0 - 2.0), 0, 1)`.

**Signal 5 -- Em-Dash Frequency (weight: 0.10):**

AI models (especially Claude and GPT-4) use em-dashes at 3-5x human frequency. This is the weakest individual signal (hence lowest weight) but is useful as a confirming signal alongside stronger ones.

Calculation: Count Unicode em-dash (U+2014) and double-hyphen `--` occurrences. Divide by word count, multiply by 1000. Normalize: `score = clamp(1.0 - (value - 1.5) / (4.0 - 1.5), 0, 1)`.

**Signal 6 -- Paragraph Rhythm Variance (weight: 0.20):**

AI models produce remarkably uniform paragraph structures -- typically 3-4 sentences per paragraph, repeating consistently. Human writers vary paragraph length based on thought flow: a single-sentence emphasis paragraph, a 7-sentence detailed argument, a 2-sentence transition. The standard deviation of sentences-per-paragraph captures this rhythm.

Calculation: Split text into paragraphs (double newline `\n\n` boundary). Count sentences per paragraph. Compute standard deviation. Normalize: `score = clamp((value - 0.7) / (1.2 - 0.7), 0, 1)`.

**Composite scoring:**

Each signal produces a normalized 0.0-1.0 score where 1.0 = strongly human. The composite is a weighted sum:

```
composite = (slv_score * 0.20) + (ttr_score * 0.20) + (hedge_score * 0.15)
          + (cliche_score * 0.15) + (emdash_score * 0.10) + (rhythm_score * 0.20)
```

Weights sum to 1.00. The composite score is the `classification_confidence` stored in the CorpusArticle.

**Classification thresholds:**

| Classification | Composite Score | Meaning |
|----------------|----------------|---------|
| HUMAN | >= 0.65 | High confidence human-written |
| HYBRID | 0.35 - 0.64 | Mixed signals -- likely human-edited AI, AI-assisted human, or formulaic human writing |
| AI_GENERATED | < 0.35 | High confidence AI-generated |

### 5.3 Writer Clustering (`bridge/intelligence/hdbscan.js`)

Takes only HUMAN-classified articles and clusters them by writing style fingerprint using HDBSCAN (Hierarchical Density-Based Spatial Clustering of Applications with Noise).

**Why HDBSCAN over k-means:**
1. No need to predefine number of writers. K-means requires specifying k. For a new site, we do not know how many writers exist. HDBSCAN discovers the natural cluster count.
2. Handles noise/outliers naturally. Guest posts, one-off contributors, and stylistically unique articles are assigned cluster -1 (noise) rather than being forced into an ill-fitting cluster.
3. Works with varying cluster sizes. A site might have one prolific writer (60 articles) and two occasional contributors (8 articles each). HDBSCAN handles this asymmetry; k-means tends to split the large cluster.
4. Density-based clustering matches the problem domain. Writers have consistent styles (dense feature space regions), not just proximity.

**Style fingerprint feature vector (12 dimensions):**

| # | Feature | Extraction Method | Normalization |
|---|---------|------------------|---------------|
| 1 | avg_sentence_length | Mean words per sentence | Min-max to 0-1 across corpus |
| 2 | sentence_length_variance | Std deviation of words per sentence | Min-max to 0-1 |
| 3 | vocabulary_richness | TTR on first 1000 words | Already 0-1 |
| 4 | formality_score | Ratio of formal markers (passive voice, nominalizations, third person pronouns, Latin-derived words) | Min-max to 0-1 |
| 5 | passive_voice_ratio | Passive sentences / total sentences (detected via "was/were/is/are/been + past participle" pattern) | Already 0-1 |
| 6 | avg_paragraph_length | Mean sentences per paragraph | Min-max to 0-1 |
| 7 | question_frequency | Questions (sentences ending in `?`) per 1000 words | Min-max to 0-1 |
| 8 | exclamation_frequency | Exclamations (sentences ending in `!`) per 1000 words | Min-max to 0-1 |
| 9 | conjunction_start_ratio | Sentences starting with "And", "But", "So", "Or", "Yet" / total sentences | Already 0-1 |
| 10 | contraction_frequency | Contractions per 1000 words (regex: `\w+'(t|re|ve|ll|d|s|m)\b`) | Min-max to 0-1 |
| 11 | technical_depth | Domain-specific term density (terms extracted from heading analysis + TF-IDF top terms) | Min-max to 0-1 |
| 12 | humor_marker_frequency | Parenthetical asides + rhetorical questions + hyperbole markers per 1000 words | Min-max to 0-1 |

**Normalization:** Min-max normalization is computed PER CORPUS (not globally). Each feature is scaled to [0, 1] using the minimum and maximum values observed in the current corpus. This prevents a feature with a larger natural range (e.g., avg_sentence_length: 8-25) from dominating distance calculations over a feature with a smaller range (e.g., passive_voice_ratio: 0.02-0.15).

**HDBSCAN parameters:**
- `min_cluster_size`: 5 (minimum articles to form a writer cluster. Lower values create noisy micro-clusters; higher values miss minority writers.)
- `min_samples`: 3 (core point density threshold. Controls how conservative the algorithm is -- higher = fewer clusters, more noise points.)
- `metric`: Euclidean distance on normalized feature vectors
- `cluster_selection_method`: `eom` (Excess of Mass -- better than `leaf` for varying density clusters typical of publication data)

**K-means fallback:** If HDBSCAN produces 0 clusters (all articles assigned to noise -- rare but possible with highly heterogeneous corpora), fall back to k-means with silhouette-score-based k selection. Run k-means for k=2 through k=min(8, floor(n/5)). Select the k with the highest silhouette score. If the best silhouette score is below 0.30, fall back to single-persona mode (treat all articles as one cluster).

**Silhouette score validation:** After HDBSCAN clustering, compute the silhouette score for the result. The silhouette score measures how similar each article is to its own cluster versus neighboring clusters. Range: -1 to +1. Scores above 0.50 indicate well-separated clusters. Below 0.25 indicates overlapping clusters -- persona boundaries may be unreliable.

**Implementation note:** HDBSCAN is implemented as a pure JavaScript module in `bridge/intelligence/hdbscan.js` -- no Python dependency, no npm packages. For the 12-dimensional feature space with <200 data points (typical corpus size), runtime is <100ms. The implementation follows the original Campello et al. (2013) algorithm: (1) compute mutual reachability distances, (2) build minimum spanning tree, (3) construct cluster hierarchy, (4) extract clusters using EOM stability.

**Post-clustering output:**
- Each cluster represents a distinct writer or writing style
- Noise points (cluster_id = -1) are excluded from persona generation but logged in analysis report
- Cluster centroids (mean of all member feature vectors) are stored for voice match distance calculations
- If author metadata is available, validate clusters against known authors and log discrepancies

### 5.4 Persona Generation (`bridge/intelligence/voice-analyzer.js` -- persona phase)

For each cluster, generate a structured WriterPersona by aggregating the style fingerprints of all articles in the cluster and enriching with qualitative descriptions from the Voice Analyzer agent.

**Generation pipeline:**

1. **Compute aggregate metrics.** For each of the 12 fingerprint features, compute the weighted mean across all articles in the cluster. Weight by article word count -- longer articles contribute more signal because their stylometric measurements are more statistically reliable. For a cluster of 30 articles, a 3000-word article contributes 10x the signal of a 300-word article.

2. **Compute confidence score.** Based on cluster cohesion (average intra-cluster Euclidean distance in the 12-dimensional feature space):
   - HIGH: distance < 0.25 (tight cluster, very consistent writing style)
   - MEDIUM: distance 0.25-0.50 (reasonable consistency, some variation)
   - LOW: distance 0.50-0.75 (loose cluster, style may not be reliable)
   - VERY_LOW: distance > 0.75 or corpus < 30 articles
   LOW and VERY_LOW confidence personas are flagged on the dashboard with an amber badge.

3. **Select reference URLs.** Pick 5 articles closest to the cluster centroid (smallest Euclidean distance to centroid). These are the most representative articles of this writing style and serve as exemplars for the draft-writer agent.

4. **Auto-generate persona name.** Map the dominant traits to the name template lookup (see BR-05 in Business Rules). The name is a suggestion -- users can override it.

5. **Invoke Voice Analyzer agent.** Pass the quantitative metrics and 5 reference article excerpts (first 500 words each) to the LLM agent. The agent generates qualitative descriptions: `voice.description`, `cadence.description`, `quirks.humor_style`, `quirks.number_style`, `vocabulary.favorite_transitions`, `vocabulary.avoids`, persona summary. See Section 6 for full agent spec.

6. **Build voice_profile JSONB.** Assemble the complete profile by merging quantitative metrics (from step 1) with qualitative descriptions (from step 5) and constraints (derived from metrics with configurable tolerance margins -- e.g., `max_passive_voice_ratio` = observed ratio + 0.04, capped at 0.15).

7. **Set default persona.** If this is the first analysis for the client (no existing personas), the largest cluster's persona becomes `is_default = true`.

8. **Store in database.** Insert `writer_personas` records. If `force_reanalyze` was set, first delete all existing `source: 'auto'` personas for this user, then insert new ones. Manual personas are never touched.

---

## 6. Voice Analyzer Agent

### Agent Specification (`agents/voice-analyzer.md`)

The Voice Analyzer is an LLM agent (markdown-prompt-based, following the same pattern as `agents/draft-writer.md`) that generates the natural-language portions of the voice profile. The bridge server handles all quantitative analysis (TTR, classification, clustering). The agent handles qualitative interpretation -- turning numbers into actionable prose guidance.

**Agent input format:**

```json
{
  "task": "generate_voice_profile",
  "cluster_metrics": {
    "avg_sentence_length": 14.2,
    "sentence_length_variance": 8.7,
    "vocabulary_richness": 0.72,
    "formality_score": 38,
    "passive_voice_ratio": 0.06,
    "avg_paragraph_length": 3.2,
    "paragraph_length_variance": 1.8,
    "question_frequency": 4.2,
    "exclamation_frequency": 0.8,
    "conjunction_start_ratio": 0.18,
    "contraction_frequency": 12.3,
    "technical_depth": 0.67,
    "humor_marker_frequency": 3.1
  },
  "reference_excerpts": [
    { "url": "https://example.com/blog/n54-hpfp-symptoms", "text": "First 500 words of article..." },
    { "url": "https://example.com/blog/b58-tuning-guide", "text": "First 500 words of article..." },
    { "url": "https://example.com/blog/mhd-flash-review", "text": "First 500 words of article..." },
    { "url": "https://example.com/blog/walnut-blasting-diy", "text": "First 500 words of article..." },
    { "url": "https://example.com/blog/jb4-vs-mhd-comparison", "text": "First 500 words of article..." }
  ],
  "corpus_classification_summary": {
    "total_articles": 87,
    "human": 71,
    "hybrid": 12,
    "ai_generated": 4
  },
  "language": "en",
  "auto_generated_name": "The Technical Storyteller"
}
```

**Agent output format:**

```json
{
  "persona_name": "The Technical Explainer",
  "summary": "Conversational-authoritative voice that teaches through analogy...",
  "voice": {
    "primary_tone": "conversational-authoritative",
    "secondary_tone": "educational",
    "register": "informal-expert",
    "description": "Teaches through analogy and direct experience..."
  },
  "cadence": {
    "description": "Short-medium sentences with occasional long explanatory runs..."
  },
  "structure": {
    "opener_style": "real-world scenario or provocative question",
    "closer_style": "actionable takeaway, no fluff",
    "section_rhythm": "problem -> context -> solution -> evidence -> takeaway"
  },
  "vocabulary": {
    "jargon_comfort": "high -- uses technical terms without over-explaining",
    "favorite_transitions": ["here's the thing", "in practice", "the short answer"],
    "avoids": ["it's worth noting", "delve", "landscape"],
    "signature_phrases": ["here's the thing", "let me explain"],
    "contraction_frequency": "high -- always contractions"
  },
  "quirks": {
    "humor_style": "dry, occasional, never forced",
    "number_style": "always contextualized with real-world meaning",
    "analogy_frequency": "high -- at least one per major section",
    "question_frequency": "moderate -- rhetorical questions to set up explanations"
  }
}
```

**Agent constraints:**
- The agent does NOT perform classification or clustering -- those are deterministic operations
- The agent MUST base all qualitative descriptions on the quantitative metrics and reference excerpts provided -- no hallucination or creative interpretation beyond what the data supports
- Output is validated against the voice_profile JSON schema before acceptance
- If the agent times out (60-second limit), the persona is stored with quantitative data only and `metadata.agent_enhanced: false`. The user can retry agent enrichment later.

**How voice profile is injected into draft-writer:**

When the draft-writer agent is invoked for article generation, the active persona's `voice_profile` JSONB is included in the agent prompt as a structured constraint block:

```
## VOICE CONSTRAINT (MANDATORY)

You MUST write in the following voice. These are not suggestions -- they are requirements.

**Target Persona:** The Technical Explainer
**Summary:** Conversational-authoritative voice that teaches through analogy...

**Hard Constraints (MUST follow):**
- Average sentence length: 14.2 words (tolerance: +/- 3)
- Minimum sentence length variance: 6.0 (mix short and long sentences)
- Minimum TTR: 0.65 (use varied vocabulary)
- Maximum passive voice ratio: 0.10
- Maximum hedging density: 0.002 per word
- Maximum cliche density: 0.001 per word
- FORBIDDEN PHRASES: "it's worth noting", "delve", "landscape", ...

**Soft Guidance (SHOULD follow):**
- Tone: conversational-authoritative, teaches through analogy
- Cadence: Punchy openers, never 2+ long sentences in sequence
- Humor: dry, occasional, through unexpected analogies
- Numbers: always contextualized with real-world meaning
- Structure: problem -> context -> solution -> evidence -> takeaway
```

**How voice match is scored:**

After the draft-writer produces an article, the Quality Gate calls `POST /api/voice/match-score` with the generated text and the target persona ID. The scoring algorithm:

1. Extract the same stylometric features from the generated text that are used in the fingerprint vector
2. For each feature, compute the absolute distance from the target persona's metric
3. Convert distances to scores (0-1) where 0 = maximum deviation, 1 = exact match
4. Weight and sum: sentence_length (0.15), sentence_variance (0.15), TTR (0.15), formality (0.10), passive_voice (0.10), hedging (0.10), cliche (0.10), paragraph_rhythm (0.15)
5. Apply hard constraint checks: if any forbidden phrase appears, score = min(score, 0.50)
6. The composite voice match score (0-1) is reported as part of the Quality Gate's 7-signal rubric with a 15% weight

---

## 7. Pipeline Integration

### Trigger Conditions

The voice analysis pipeline runs under three conditions:

1. **Auto on site connect.** When a client first connects their website via OAuth or manual URL entry AND the Data Ingestion Content Crawler has completed its initial crawl (content inventory populated), the voice analysis pipeline auto-triggers. This is coordinated via the pipeline job queue -- the Data Ingestion `crawl_completed` event triggers a Voice Intelligence `analysis_queued` job. Estimated delay from site connect to voice personas available: 8-15 minutes (5-8 minutes for crawl + 3-8 minutes for voice analysis).

2. **Manual trigger.** User clicks "Re-analyze Voice" on the Voice Profiles dashboard page or calls `POST /api/voice/analyze`. Subject to the cooldown rules (BR-07, BR-08).

3. **Scheduled re-analysis.** Optional monthly re-analysis to detect style drift. Disabled by default. When enabled via user settings, runs on the 1st of each month at 06:00 UTC. Creates a new analysis session and generates new personas alongside existing ones (does not replace unless the user explicitly confirms).

### Pipeline Stages and Progress Reporting

The full pipeline runs as a single analysis session tracked in the `analysis_sessions` table. Progress is reported via SSE to connected clients.

| Stage | % Range | Description | Duration Estimate |
|-------|---------|-------------|-------------------|
| 1. Corpus Crawl | 0-30% | Fetch and extract article text from content inventory URLs | 2-5 min (100 articles) |
| 2. Classification | 30-50% | Run AI vs Human classifier on each extracted article | 10-30 sec (CPU-bound, no I/O) |
| 3. Clustering | 50-60% | HDBSCAN on HUMAN articles' feature vectors | < 1 sec |
| 4. Metrics Aggregation | 60-70% | Compute per-cluster aggregate fingerprints | < 1 sec |
| 5. Agent Analysis | 70-90% | Voice Analyzer agent generates qualitative profiles per cluster | 30-90 sec (LLM call per cluster) |
| 6. Persona Storage | 90-100% | Write personas to database, set defaults, cleanup | < 2 sec |

**Total estimated duration:** 3-8 minutes for a typical site with 50-100 articles. The bottleneck is stage 1 (network I/O for fetching articles) and stage 5 (LLM inference time). Stages 2-4 are pure computation and complete in under a minute even for large corpora.

### How Draft-Writer Consumes the Profile

1. During article generation, the pipeline fetches the user's default persona via `SELECT * FROM writer_personas WHERE user_id = $1 AND is_default = true`.
2. If no default persona exists, generation proceeds without voice constraints (generic quality-focused generation).
3. The `voice_profile` JSONB is serialized into the draft-writer agent prompt as the `VOICE CONSTRAINT` block (see Section 6).
4. The draft-writer treats numeric constraints as hard targets and qualitative descriptions as soft guidance.
5. The generated article is then scored by the Quality Gate via `POST /api/voice/match-score`.

### How Quality Gate Scores Voice Match

The Quality Gate's 7-signal rubric includes voice match as one signal at 15% weight:

| Signal | Weight | Source |
|--------|--------|--------|
| Domain Accuracy | 20% | Research verification |
| Content Depth | 20% | Word count, heading count, source density |
| SEO Structure | 15% | Title, meta, headings, internal links |
| **Voice Match** | **15%** | **Voice Intelligence voice_match_scores** |
| E-E-A-T Signals | 10% | Experience, expertise, authority markers |
| Component Variety | 10% | Structural component diversity |
| Image Relevance | 10% | Image-to-content alignment |

If voice match scores below 0.70, the Quality Gate returns `voice_match: "fail"` with the `revision_guidance` text. The generation pipeline can auto-retry with the guidance injected as an additional constraint, or surface the failure to the user for manual decision.

---

## 8. Arabic Voice Intelligence

Arabic voice intelligence is a total white-space opportunity -- zero competitors offer Arabic stylometric analysis. For ChainIQ's primary MENA market, this is the feature that closes enterprise deals.

### MSA vs Dialectal Detection

Arabic writing exists on a spectrum from Modern Standard Arabic (MSA, formal) to regional dialects (colloquial). This register detection is itself a voice signal unique to Arabic.

**Detection signals:**
- **Morphological complexity:** MSA uses full case endings (i'rab), dual number forms, and complex verb conjugations. Dialectal Arabic simplifies or drops these. Presence of common MSA grammatical particles (`inna`, `anna`, `la`, `qad`) in their formal conjugated forms indicates MSA.
- **Lexical choice:** Dialect-specific vocabulary that does not appear in MSA (e.g., Egyptian `keda` / `ezay`, Levantine `hek` / `shu`, Gulf `chithee` / `wayed`). Presence of dialect-specific words = dialectal or hybrid register.
- **Code-switching patterns:** Many MENA publications use MSA for formal content but switch to dialect for quotations, social media commentary, and conversational asides. Detecting the ratio and location of code-switches is a style fingerprint.
- **Diacritical marks (tashkeel):** Full tashkeel = highly formal (academic, Quranic commentary). No tashkeel = modern informal/news. Partial tashkeel (only on ambiguous words) = standard editorial.

**Classification output:** Each Arabic article receives a register tag: `MSA`, `DIALECTAL`, `HYBRID_REGISTER`, appended to the CorpusArticle metadata. This tag becomes an additional clustering dimension for Arabic corpora.

### Arabic-Specific Stylometric Signals

The six classification signals require Arabic-specific calibration:

| Signal | English Baseline | Arabic Adjustment | Reason |
|--------|-----------------|-------------------|--------|
| Sentence Length Variance | >= 6.0 = human | >= 5.0 = human | Arabic sentences trend longer due to VSO structure and connective particles. Variance is naturally lower. |
| TTR | >= 0.62 = human | >= 0.55 = human | Arabic morphological richness means each root generates many surface forms, inflating TTR. Lower TTR threshold avoids false positives. |
| Hedging Frequency | dictionary-based | Arabic hedging dictionary | Different hedging expressions: `min al-jdir bil-dhikr` (it's worth mentioning), `la budda an nushir ila` (we must point out), `min al-muhimm` (it's important). Requires separate Arabic phrase list. |
| Cliche Density | dictionary-based | Arabic AI cliche dictionary | Different AI-characteristic phrases in Arabic. Requires calibration against Arabic LLM output. |
| Em-Dash Frequency | < 1.5 = human | N/A -- use kashida instead | Arabic uses kashida (tatweel) for emphasis rather than em-dashes. Measure kashida frequency as the equivalent signal. |
| Paragraph Rhythm Variance | >= 1.2 = human | >= 1.0 = human | Arabic editorial tradition favors longer paragraphs. Lower variance threshold. |

### Morphological Root Patterns

Arabic is a root-based language where words are formed by inserting vowels and affixes into trilateral (3-letter) or quadrilateral (4-letter) consonantal roots. Two surface words that look different may share the same root (e.g., `kataba` "he wrote", `kitab` "book", `maktaba` "library" all share root `k-t-b`).

For TTR calculation in Arabic, raw TTR (surface forms) overstates vocabulary richness because morphological variants of the same concept are counted as distinct tokens. The Arabic TTR calculation applies light stemming (removing common prefixes `al-`, `wa-`, `fa-`, `bi-`, `li-` and common suffixes `-at`, `-in`, `-un`, `-ha`, `-hum`) before counting unique tokens. This produces a TTR more comparable to English baselines.

### Arabic Typography Preferences

Persona profiles for Arabic content include additional typography fields in `voice_profile`:

```json
{
  "arabic_specific": {
    "register": "MSA",
    "tashkeel_usage": "minimal -- disambiguation only",
    "kashida_frequency": "moderate",
    "rhetorical_devices": ["saj (rhymed prose) in introductions", "tibaq (antithesis) for emphasis"],
    "numeral_style": "Arabic-Indic (٠١٢٣٤٥٦٧٨٩)",
    "quotation_style": "guillemets (<<>>)",
    "paragraph_direction": "rtl",
    "mixed_language_handling": "technical terms in English within Arabic prose, no transliteration"
  }
}
```

### RTL Prose Rhythm

Arabic prose rhythm analysis must account for right-to-left reading direction and the different cadence of Arabic sentence structures. Arabic naturally uses connective particles (`wa` = and, `fa` = then, `thumma` = then) to create long flowing sentences that read differently than English comma-spliced or period-terminated sentences. The sentence boundary detection regex for Arabic:

```
(?<=[.!?،؟])\s+(?=[\u0600-\u06FF])
```

This handles Arabic period (`.`), Arabic comma (`،`), Arabic question mark (`؟`), and standard punctuation used in Arabic text.

---

## 9. Auth & Permissions

### Role Matrix

| Action | Anonymous | User (Own Data) | User (Other's Data) | Admin |
|--------|-----------|----------------|---------------------|-------|
| POST /api/voice/analyze | DENY | ALLOW | DENY | ALLOW |
| GET /api/voice/analyze/progress/:id | DENY | ALLOW (own sessions only) | DENY | ALLOW |
| GET /api/voice/analyze/status | DENY | ALLOW | DENY | ALLOW |
| GET /api/voice/personas | DENY | ALLOW (own only) | DENY | ALLOW (all) |
| GET /api/voice/personas/:id | DENY | ALLOW (own only) | DENY | ALLOW (all) |
| POST /api/voice/personas | DENY | ALLOW | DENY | ALLOW |
| PUT /api/voice/personas/:id | DENY | ALLOW (own only) | DENY | ALLOW |
| DELETE /api/voice/personas/:id | DENY | ALLOW (own only) | DENY | ALLOW |
| POST /api/voice/personas/:id/set-default | DENY | ALLOW (own only) | DENY | ALLOW |
| POST /api/voice/classify | DENY | ALLOW | DENY | ALLOW |
| POST /api/voice/match-score | DENY | ALLOW (own personas only) | DENY | ALLOW |

**Auth implementation:** All endpoints use the existing auth middleware pattern (`const user = await verifyAuth(req); if (!user) return sendError(res, 401, 'Unauthorized');`). RLS policies on Supabase tables provide defense-in-depth -- even if auth middleware is bypassed, users cannot access other users' data.

**Admin access:** Admin role is determined by Supabase user metadata (`app_metadata.role === 'admin'`). Admins can view all personas across all users for support purposes but cannot modify or delete other users' personas without explicit action.

**Service-role access:** The scheduler and pipeline job worker use the `service_role` key to bypass RLS when writing analysis results to the database. This is necessary because analysis jobs run asynchronously outside the user's HTTP request context.

---

## 10. Validation Rules

**VR-01: Site URL format.** `site_url` must be a valid URL with `https://` scheme. HTTP (non-TLS) URLs are rejected. URL must resolve to a valid domain (no localhost, no private IPs). Validated with `new URL()` constructor plus hostname check.

**VR-02: Article word count minimum.** Articles with fewer than 300 words after extraction are excluded from analysis. The count is computed after HTML stripping, before any preprocessing. This threshold ensures sufficient text for meaningful stylometric analysis (approximately 20 sentences minimum).

**VR-03: Persona name length.** Persona names must be 2-100 characters. No leading/trailing whitespace. No control characters. Unicode letters, numbers, spaces, hyphens, and apostrophes are allowed.

**VR-04: Persona name uniqueness.** Persona names must be unique per user (case-insensitive comparison using `LOWER(name)`). "The Technical Explainer" and "the technical explainer" are considered duplicates.

**VR-05: Voice profile schema validation.** When manually creating or updating a persona, the `voice_profile` JSONB must pass schema validation:
- Numeric fields must be within expected ranges (TTR: 0-1, formality_score: 0-100, ratios: 0-1, sentence_length: > 0)
- `forbidden_phrases` array items must be non-empty strings, max 100 items
- `reference_urls` must be valid URLs, max 10 items
- `schema_version` must be a recognized version string

**VR-06: Match score text minimum.** Text submitted to `POST /api/voice/match-score` must be at least 200 words. Shorter texts do not produce reliable stylometric measurements.

**VR-07: Max articles cap.** `max_articles` parameter on `/api/voice/analyze` is capped at 500. Requests for more than 500 articles are silently capped (not rejected) to prevent excessive crawling.

**VR-08: Language code format.** Language fields must be valid ISO 639-1 codes (2 characters, lowercase). Invalid codes are rejected with 400.

**VR-09: Classify URL accessibility.** When classifying a single URL via `POST /api/voice/classify`, the URL must return HTTP 200 with `Content-Type: text/html`. Non-200 responses or non-HTML content types return 422 with a descriptive message.

**VR-10: Force reanalyze cooldown.** Even with `force_reanalyze: true`, a minimum 1-hour gap is required between analysis completions. This prevents accidental rapid re-analysis that wastes crawling resources.

**VR-11: Corpus article deduplication.** If two URLs in the corpus resolve to the same canonical URL (via `<link rel="canonical">`), only one instance is analyzed. The canonical URL is preferred.

**VR-12: Empty voice profile rejection.** A persona cannot be created with an entirely empty `voice_profile`. At minimum, one of `voice`, `cadence`, `vocabulary`, or `constraints` must be provided.

---

## 11. Error Handling

### Error Scenarios and Responses

**ERR-01: Insufficient Corpus.**
- **Trigger:** Fewer than 10 HUMAN-classified articles after crawling and classification.
- **User impact:** No personas can be generated.
- **Response:** Analysis session completes with `status: 'completed'`, `personas_generated: 0`, `error: 'Insufficient human content for analysis. Found N human articles (minimum 10 required). Consider creating a manual brand voice persona.'`
- **Dashboard:** Shows guidance panel: "Your site has too few human-written articles for automated voice detection. You can: (1) Create a manual brand voice, or (2) Provide 5-10 reference article URLs from other sites whose style you want to emulate."

**ERR-02: All-AI Content.**
- **Trigger:** Every article in the corpus classified as AI_GENERATED (composite < 0.35 for all articles).
- **User impact:** No human writing to base personas on.
- **Response:** Analysis session completes with `status: 'completed'`, `personas_generated: 0`, `error: 'No human-written content detected. All N articles classified as AI-generated.'`
- **Dashboard:** Shows specific guidance: "All content on your site appears to be AI-generated. To create a voice profile, provide 5-10 reference URLs from external sites whose writing style you want ChainIQ to emulate." Triggers the reference-mode workflow where external URLs are analyzed as a substitute corpus, and resulting personas are tagged `source: 'reference'`.

**ERR-03: Crawler Blocked.**
- **Trigger:** More than 50% of article URLs return 403, 401, or connection refused.
- **User impact:** Reduced corpus, potentially below minimum threshold.
- **Response:** Continue analysis with available articles. If remaining corpus is above minimum, proceed normally. If below minimum, trigger ERR-01.
- **Log:** Structured error: `{ error: 'crawler_blocked', urls_blocked: N, urls_succeeded: N, sample_errors: [{url, status, message}] }`
- **Dashboard warning:** "ChainIQ could not access N articles on your site. This may be due to IP-based blocking, WAF rules, or basic auth. If possible, whitelist the ChainIQ crawler (User-Agent: ChainIQ-Bot/1.0)."

**ERR-04: Clustering Failure (No Clusters).**
- **Trigger:** HDBSCAN assigns all articles to noise (cluster_id = -1).
- **User impact:** No distinct writer groups detected.
- **Response:** Fall back to k-means (see Section 5.3 k-means fallback). If k-means also fails (best silhouette < 0.30), create a single persona from all HUMAN articles without clustering. The persona represents the "average voice" of the site.
- **Dashboard:** "Voice analysis found no distinct writer groups. This typically means all content is written by one person or a team with a very consistent style. A single voice profile has been created."

**ERR-05: Voice Analyzer Agent Timeout.**
- **Trigger:** LLM agent does not respond within 60 seconds per persona.
- **User impact:** Quantitative profile available but qualitative descriptions missing.
- **Response:** Store persona with metrics only. Set `metadata.agent_enhanced: false`. Mark `voice_profile.voice.description: null`, `cadence.description: null`, etc.
- **Recovery:** User can retry agent enrichment via a "Regenerate Descriptions" button on the persona card, which calls the agent for just that persona.

**ERR-06: Supabase Connection Lost.**
- **Trigger:** Database write fails during persona storage (stage 6).
- **Response:** Retry with exponential backoff: 1s, 2s, 4s, max 60s. After 3 failures, mark analysis session as `status: 'failed'` and preserve all intermediate results in `corpus_data` JSONB so the pipeline can resume from the persona generation stage without re-crawling.
- **Recovery:** User can retry via "Resume Analysis" button which re-runs only stages 5-6 using cached data.

**ERR-07: Multiple Languages Without Sufficient Per-Language Corpus.**
- **Trigger:** Site has content in 3 languages but only 15 English, 12 Arabic, and 8 French articles.
- **Response:** Skip languages with fewer than 10 HUMAN articles. Generate personas only for languages meeting the threshold. Log: "Skipped voice analysis for French (8 articles, minimum 10 required)."

**ERR-08: Content Inventory Not Yet Available.**
- **Trigger:** User triggers voice analysis before Data Ingestion has completed its initial crawl.
- **Response:** Return 409 with `"message": "Content inventory is not yet available. Please wait for the initial site crawl to complete before running voice analysis."` Do not attempt to crawl independently -- rely on Data Ingestion's infrastructure.

---

## 12. Edge Cases

**EC-01: Fewer Than 50 Articles (Degraded Mode).**
The system handles sub-optimal corpus sizes gracefully rather than refusing to operate:
- 30-49 HUMAN articles: Full pipeline runs. All personas marked `confidence: 'low'`. Dashboard warning explains reduced reliability.
- 10-29 HUMAN articles: No clustering. Single aggregate persona from all articles. Marked `confidence: 'very_low'`. Recommend manual refinement.
- < 10 HUMAN articles: Skip automated analysis. Redirect to manual persona creation.

**EC-02: All AI Content (Reference Mode).**
When all site content is AI-generated, the user is prompted to provide 5-10 external reference URLs. These URLs are crawled, classified (should be HUMAN), and used as a substitute corpus. Resulting personas are tagged `source: 'reference'` and the dashboard clearly indicates "Based on reference articles, not your existing content."

**EC-03: Multiple Languages on Same Site.**
Corpus is split by detected language before classification and clustering. Each language produces independent personas. English and Arabic personas never cross-contaminate -- a site with 60 English and 40 Arabic articles generates English personas and Arabic personas separately. If a single article contains mixed languages (e.g., Arabic article with English technical terms), it is assigned to the majority language.

**EC-04: Ghost Writers.**
If author metadata indicates "Author A" but clustering groups their articles into two different style clusters, the system logs a discrepancy. Common causes: ghost writers (someone else writes under that name), editorial changes (editor heavily modifies drafts), or style evolution over time. The dashboard surfaces this as an informational notice, not an error.

**EC-05: Style Drift Over Time.**
If re-analysis produces different personas than a previous run:
- New personas are created alongside existing ones (not replacing) unless `force_reanalyze` is set
- Dashboard shows a comparison view: "Persona 'The Technical Explainer' has drifted since last analysis (90 days ago): avg sentence length changed from 14.2 to 16.8, formality score increased from 38 to 45."
- Users can choose to keep the old persona, adopt the new one, or merge them manually.

**EC-06: Translated Content.**
Articles that are translations (same content in multiple languages) would produce identical style fingerprints within each language group, which is correct behavior -- the translation voice IS a distinct voice. However, if the content inventory flags articles as translations (via `hreflang` tags), the system can optionally group them for the user's awareness without affecting clustering.

**EC-07: Very Short Articles (300-500 words).**
Articles between 300-500 words pass the minimum threshold but produce less reliable stylometric measurements. Their TTR is flagged as `low_confidence_ttr: true`. In weighted aggregation during persona generation, these articles receive 50% of the weight of longer articles, reducing their influence on the final persona profile.

**EC-08: Corporate Voice vs Individual Voice.**
Some sites have a strict corporate voice guide that makes all writers sound similar (low inter-author variance). HDBSCAN may produce only one cluster even with multiple known authors. This is correct behavior -- the corporate voice IS the persona. The system reports: "All content follows a consistent voice. 1 persona detected." If the user knows there should be multiple voices, they can adjust `min_cluster_size` down (via advanced settings) or create manual sub-personas.

**EC-09: Guest Posts With Unique Style.**
Guest posts, contributed articles, and syndicated content may have drastically different styles from the site's regular writers. HDBSCAN handles this naturally -- if a guest post's style does not fit any cluster, it becomes a noise point (cluster_id = -1). If multiple guest posts share a style, they may form their own cluster. The analysis report lists noise articles separately: "6 articles did not match any writer group (likely guest posts or one-off contributors)."

**EC-10: Sites Behind CDN/WAF Protection.**
Some sites (Cloudflare, Akamai) may challenge or block automated crawlers. The corpus crawler handles:
- Cloudflare challenge pages: Detected via `cf-mitigated: challenge` header. Logged as blocked, skipped.
- CAPTCHA pages: Detected via response body pattern matching. Logged as blocked, skipped.
- Rate limiting (429): Exponential backoff, then skip if persistent.
If >50% of URLs are blocked, ERR-03 triggers.

**EC-11: Single Author With No Variation.**
If all HUMAN articles are by one author with very consistent style (silhouette score = 1.0, one cluster), a single persona is created. This is normal behavior for personal blogs and is not degraded mode.

**EC-12: Newly Published Site (< 10 Total Articles).**
Insufficient content for any automated analysis. The system immediately offers the manual persona creation workflow and suggests: "Add more content to your site and re-analyze when you have at least 50 published articles for the best results."

---

## 13. Security

**SEC-01: No Raw Article Text Persisted.**
Article body text fetched during corpus crawling is processed in-memory and discarded after feature extraction. The `corpus_data` JSONB on `analysis_sessions` stores classification scores, feature vectors, and metadata -- NOT raw article text. The reference excerpts sent to the Voice Analyzer agent (5 x 500 words) are held in memory during the LLM call and not persisted. This design ensures that ChainIQ never stores third-party copyrighted content in its database.

**SEC-02: PII in Author Names.**
Author names extracted from articles (e.g., "Mike T.", "Sarah Johnson") are stored in CorpusArticle metadata and may appear in persona metadata. These are public information (published bylines on public websites) but are treated as user data under RLS. Author names are never exposed to other users. They are used solely for cluster validation and are displayed only to the site owner.

**SEC-03: Row-Level Security.**
All three tables (`writer_personas`, `analysis_sessions`, `voice_match_scores`) have RLS policies enforcing `auth.uid() = user_id`. The pipeline job worker uses `service_role` key to write results, but all user-facing reads go through RLS.

**SEC-04: Crawler Respect.**
The Corpus Crawler follows the same politeness rules as Data Ingestion's Content Crawler:
- Max 3 concurrent requests per host
- Minimum 500ms delay between sequential requests (or `Crawl-delay` from `robots.txt` if higher)
- User-Agent: `ChainIQ-Bot/1.0 (+https://chainiq.io/bot)`
- Respects `robots.txt` disallow directives
- 10-second timeout per request

**SEC-05: Rate Limiting.**
- `/api/voice/analyze`: 1 concurrent per user, 3 per day
- `/api/voice/classify`: 30 per minute per user
- `/api/voice/match-score`: 60 per minute per user
- `/api/voice/personas` (CRUD): 120 per minute per user (standard API rate limit)

**SEC-06: Input Sanitization.**
- `site_url`: Validated via `new URL()`, hostname checked against a blocklist (no `localhost`, `127.0.0.1`, `10.*`, `172.16.*`, `192.168.*`, `[::1]`).
- `text` (in match-score): No HTML allowed. Stripped before processing. Max 50,000 words (approximately 300KB).
- `name` (persona name): Sanitized for XSS (strip HTML tags). Stored as plain text.
- `voice_profile` (JSONB): Schema-validated. Unknown keys are stripped. Values are type-checked.

**SEC-07: No Cross-Client Data Leakage.**
API responses never include cross-client data. Even the analysis algorithm operates per-user -- there is no shared clustering across users. Each user's corpus is analyzed independently.

---

## 14. Performance

### Corpus Analysis Time Estimates

| Site Size (Articles) | Crawl Phase | Classification | Clustering | Agent | Total |
|---------------------|-------------|---------------|------------|-------|-------|
| 50 | 1-2 min | 5-10 sec | < 100ms | 30-60 sec | 2-4 min |
| 100 | 2-4 min | 10-20 sec | < 100ms | 30-90 sec | 3-6 min |
| 200 | 4-8 min | 20-40 sec | < 200ms | 60-120 sec | 6-12 min |
| 500 | 10-20 min | 50-100 sec | < 500ms | 60-180 sec | 14-25 min |

The crawl phase is always the bottleneck (network I/O with polite delays). Classification and clustering are CPU-bound and fast. Agent analysis scales with the number of clusters (typically 2-5), not the number of articles.

### Caching Strategy

**Voice profiles:** Persona `voice_profile` JSONB is loaded once per article generation and held in memory for the duration of the pipeline. No per-request caching needed -- the profile is small (~2KB) and database reads are fast (indexed by `user_id + is_default`).

**Stylometric dictionaries:** The hedge phrase dictionary (50+ entries) and AI cliche dictionary (40+ entries) are loaded into memory on bridge server startup and held as module-level constants. No per-request disk reads.

**Classification results:** Once an article is classified, its `classification` and `classification_confidence` are stored in the CorpusArticle within `analysis_sessions.corpus_data`. Re-analysis with `force_reanalyze: false` checks if a completed analysis exists within 7 days and returns the cached result.

**Feature vectors:** The 12-dimensional style fingerprint for each article is computed once during classification and reused during clustering. No redundant computation.

### Incremental Re-Analysis

When a user triggers re-analysis on a site that was previously analyzed:
1. Check `content_inventory` for new articles (published since last analysis, identified by `first_discovered_at > last_analysis_date`).
2. If fewer than 10 new articles, offer "incremental update" which only classifies and clusters new articles, then re-runs clustering on the combined corpus of old features + new features. This avoids re-crawling the entire site.
3. If 10+ new articles or `force_reanalyze: true`, run full pipeline.
4. Incremental updates complete in 1-3 minutes regardless of site size (only new articles are crawled).

### Database Performance

- `writer_personas` is a low-volume table (2-10 rows per user, ~100 users = ~500-1000 rows). No partitioning needed.
- `analysis_sessions` grows slowly (max 3 per user per day). Purge `corpus_data` JSONB from sessions older than 30 days to control table size.
- `voice_match_scores` grows with article generation volume. Partition by month if production volume exceeds 100K rows/month. Index on `(user_id, created_at DESC)` supports dashboard queries efficiently.

---

## 15. Testing Requirements

### Classifier Accuracy Tests (`test/voice-classifier.test.js`)

| Test Name | Description | Pass Criteria |
|-----------|-------------|---------------|
| `classifier_human_articles_score_above_threshold` | Classify 20 known-human articles from curated fixtures | All score >= 0.65 composite |
| `classifier_ai_articles_score_below_threshold` | Classify 20 known-AI articles (generated by GPT-4, Claude, Gemini) | All score < 0.35 composite |
| `classifier_hybrid_articles_fall_in_middle` | Classify 10 human-edited AI articles | All score 0.35-0.64 composite |
| `classifier_sentence_variance_human_text` | Known human sample with high sentence variation | Sentence variance >= 6.0 |
| `classifier_sentence_variance_ai_text` | Known AI sample with uniform sentence length | Sentence variance < 4.0 |
| `classifier_ttr_computed_correctly` | Known text with 137 unique words / 200 total | TTR = 0.685 |
| `classifier_ttr_first_1000_words_only` | 3000-word article, TTR computed on first 1000 only | TTR not influenced by words 1001-3000 |
| `classifier_hedging_all_phrases_detected` | Text containing all 50 hedge phrases | All 50 detected |
| `classifier_hedging_false_positive_rate` | Run against 20 known-human articles | False positive rate < 5% |
| `classifier_cliche_context_aware` | Text with "desert landscape" (geographic) | `landscape` not counted as AI cliche |
| `classifier_cliche_context_aware_metaphorical` | Text with "the competitive landscape" (metaphorical) | `landscape` counted as AI cliche |
| `classifier_emdash_count_accurate` | Text with 5 em-dashes and 3 double-hyphens | Count = 8 |
| `classifier_paragraph_rhythm_human` | Text with varied paragraph lengths (1, 4, 2, 6, 3) | Variance >= 1.2 |
| `classifier_paragraph_rhythm_ai` | Text with uniform paragraphs (3, 3, 4, 3, 3) | Variance < 0.7 |
| `classifier_composite_weights_sum_to_one` | Verify weight constants | Sum = 1.00 |
| `classifier_boundary_0_65_is_human` | Composite = 0.65 exactly | Classification = HUMAN |
| `classifier_boundary_0_64_is_hybrid` | Composite = 0.64 exactly | Classification = HYBRID |
| `classifier_boundary_0_35_is_hybrid` | Composite = 0.35 exactly | Classification = HYBRID |
| `classifier_boundary_0_34_is_ai` | Composite = 0.34 exactly | Classification = AI_GENERATED |

### Clustering Quality Tests (`test/voice-clustering.test.js`)

| Test Name | Description | Pass Criteria |
|-----------|-------------|---------------|
| `hdbscan_two_cluster_synthetic` | 40 articles from 2 synthetic writers (distinct styles) | Exactly 2 clusters detected |
| `hdbscan_single_writer_one_cluster` | 30 articles from 1 synthetic writer | Exactly 1 cluster (or 0 clusters + all noise, triggering fallback) |
| `hdbscan_noise_articles_excluded` | 30 cluster articles + 5 outlier articles | Outliers assigned cluster -1 |
| `hdbscan_min_cluster_size_enforced` | 3 articles with similar style (below min_cluster_size=5) | Not formed into cluster, assigned noise |
| `hdbscan_empty_input_returns_empty` | Empty article array | Returns empty cluster array, no error |
| `hdbscan_runtime_under_200ms` | 200 articles, 12 dimensions | Completes in < 200ms |
| `kmeans_fallback_activates` | Corpus where HDBSCAN produces all noise | K-means fallback runs, produces clusters |
| `kmeans_selects_optimal_k` | Synthetic 3-cluster data | Selects k=3 via silhouette score |
| `silhouette_score_range_valid` | Any clustering result | Score in range [-1, +1] |
| `silhouette_score_high_for_well_separated` | Well-separated synthetic clusters | Silhouette > 0.50 |
| `normalization_min_max_correct` | Known feature vectors with known min/max | Normalized values in [0, 1] |

### Persona Generation Tests (`test/voice-persona.test.js`)

| Test Name | Description | Pass Criteria |
|-----------|-------------|---------------|
| `persona_aggregate_metrics_correct` | Cluster with 3 articles, known metrics | Weighted mean matches hand calculation |
| `persona_longer_articles_weighted_more` | 1000-word and 3000-word articles in same cluster | 3000-word article has 3x influence |
| `persona_name_generation_technical` | High formality + high technical depth | Name matches "The Academic Expert" |
| `persona_name_generation_casual` | Low formality + high humor | Name matches "The Casual Conversationalist" |
| `persona_default_set_largest_cluster` | 3 clusters with sizes 30, 15, 8 | Cluster-30 persona is `is_default = true` |
| `persona_voice_profile_schema_valid` | Any generated persona | voice_profile passes JSON schema validation |
| `persona_voice_profile_all_required_fields` | Generated persona | All required fields present: persona_name, summary, voice, cadence, structure, vocabulary, quirks, constraints, reference_urls, corpus_stats |
| `persona_reference_urls_closest_to_centroid` | Known cluster with known distances | Selected 5 URLs are the 5 closest to centroid |
| `persona_confidence_high` | Intra-cluster distance 0.18 | confidence = 'high' |
| `persona_confidence_low` | Intra-cluster distance 0.55 | confidence = 'low' |
| `persona_manual_not_deleted_on_reanalyze` | Existing manual persona + force_reanalyze | Manual persona survives, auto personas replaced |

### Voice Match Scoring Tests (`test/voice-match.test.js`)

| Test Name | Description | Pass Criteria |
|-----------|-------------|---------------|
| `match_score_perfect_match` | Generated text matches persona exactly | Score >= 0.95 |
| `match_score_terrible_match` | Formal corporate text vs casual persona | Score < 0.40 |
| `match_score_forbidden_phrase_violation` | Text contains a forbidden phrase | Score capped at 0.50 regardless of other signals |
| `match_score_passed_above_threshold` | Score = 0.72 | `passed = true` |
| `match_score_failed_below_threshold` | Score = 0.68 | `passed = false` |
| `match_score_revision_guidance_generated` | Score < 0.70 | `revision_guidance` is non-null, contains specific metric guidance |
| `match_score_stores_in_database` | Request with article_id provided | Row inserted into voice_match_scores |
| `match_score_short_text_rejected` | 150-word text | Returns 422 |

### API Endpoint Tests (`test/voice-api.test.js`)

| Test Name | Description | Pass Criteria |
|-----------|-------------|---------------|
| `api_analyze_returns_202` | Valid POST /api/voice/analyze | Status 202, returns session_id |
| `api_analyze_rejects_concurrent` | Second analysis while first running | Status 409 |
| `api_analyze_rejects_unauthenticated` | No Bearer token | Status 401 |
| `api_personas_list_own_only` | User A queries, user B has personas | Response contains only user A's personas |
| `api_personas_create_manual` | POST with valid body | Status 201, source = 'manual' |
| `api_personas_update_deep_merge` | PUT with nested voice_profile patch | Only specified field updated, others preserved |
| `api_personas_delete_blocked_if_default` | Delete default when alternatives exist | Status 409 |
| `api_personas_delete_allowed_if_only` | Delete default when no alternatives | Status 200 |
| `api_set_default_unsets_others` | Set persona B as default | Persona A's is_default = false |
| `api_classify_returns_all_signals` | Valid URL | Response contains all 6 signals with values and scores |
| `api_classify_rate_limited` | 31 requests in 1 minute | 31st request returns 429 |
| `api_match_score_returns_breakdown` | Valid text + persona | Response contains per-signal breakdown |

### Performance Tests (`test/voice-performance.test.js`)

| Test Name | Description | Pass Criteria |
|-----------|-------------|---------------|
| `perf_classification_100_articles` | Classify 100 articles | Completes in < 30 seconds |
| `perf_hdbscan_100_vectors` | Cluster 100 12-dimensional vectors | Completes in < 200ms |
| `perf_hdbscan_200_vectors` | Cluster 200 12-dimensional vectors | Completes in < 500ms |
| `perf_full_pipeline_100_articles` | Full pipeline end-to-end (mocked HTTP) | Completes in < 120 seconds |
| `perf_match_score_single` | Score one article against one persona | Completes in < 100ms |
| `perf_persona_crud_p95` | 100 sequential persona CRUD operations | p95 < 200ms |

---

## Dependencies

### Depends On
- **Auth & Bridge Server** -- authentication, user context, Bearer token validation
- **Supabase** -- database storage for `writer_personas`, `analysis_sessions`, `voice_match_scores`, RLS enforcement
- **Data Ingestion Service (Layer 1)** -- `content_inventory` table provides the URL list for corpus crawling. Voice analysis depends on Data Ingestion having completed at least one crawl.
- **Content Crawler** (`bridge/ingestion/crawler.js`) -- reuses URL discovery, HTML extraction patterns, and polite crawling settings
- **Universal Engine** -- language detection for multi-language corpus splitting
- **Pipeline Job Queue** -- reuses existing Supabase-backed job queue for analysis orchestration and SSE progress reporting

### Depended On By
- **Draft Writer Agent** (`agents/draft-writer.md`) -- consumes `voice_profile` JSONB as style constraint during article generation
- **Quality Gate** (`engine/quality-gate.js`) -- uses `POST /api/voice/match-score` for the voice match signal (15% weight in 7-signal rubric)
- **Dashboard** -- Voice Profiles page displays personas, allows editing, shows analysis status and voice match trends
- **Generation Pipeline** -- `/api/voice/personas/:id` is called during generation to fetch the active persona
- **Feedback Loop (Layer 6)** -- tracks which voice personas produce higher-performing articles over time

---

## Files

| File | Purpose |
|------|---------|
| `bridge/intelligence/voice-analyzer.js` | Core module: corpus crawling orchestration, persona generation, pipeline coordination |
| `bridge/intelligence/stylometrics.js` | Shared stylometric utilities: TTR calculation, sentence parsing, hedge/cliche dictionaries, fingerprint extraction, composite scoring, classification |
| `bridge/intelligence/hdbscan.js` | Pure JavaScript HDBSCAN implementation (zero npm dependencies). ~300 lines. |
| `bridge/intelligence/voice-match.js` | Voice match scoring: stylometric distance calculation, revision guidance generation |
| `bridge/routes/voice.js` | API route handlers for all `/api/voice/*` endpoints |
| `agents/voice-analyzer.md` | LLM agent prompt: takes quantitative analysis output, generates qualitative voice profile descriptions |
| `migrations/011-writer-personas.sql` | `writer_personas` table + RLS policies + indexes |
| `migrations/015-analysis-sessions.sql` | `analysis_sessions` table + RLS policies + indexes |
| `migrations/016-voice-match-scores.sql` | `voice_match_scores` table + RLS policies + indexes |
| `dashboard/src/app/voice-profiles/page.tsx` | Voice Profiles dashboard page |
| `dashboard/src/components/voice/persona-card.tsx` | Persona display card component with radar chart |
| `dashboard/src/components/voice/persona-editor.tsx` | Manual persona creation/editing form with sliders and dropdowns |
| `dashboard/src/components/voice/classification-report.tsx` | AI vs Human classification results display with per-signal breakdown |
| `dashboard/src/components/voice/analysis-progress.tsx` | SSE-connected progress display for running analysis |

---

## Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Classification accuracy vs human-labeled test set | >= 85% agreement | Validation suite against 60-article labeled fixture set (20 human, 20 AI, 20 hybrid) |
| Persona generation success rate | >= 95% of sites with 50+ human articles produce at least 1 persona | Production monitoring |
| Full pipeline completion rate | >= 90% (accounting for crawl failures) | `analysis_sessions` where `status = 'completed'` / total |
| Pipeline duration (50-100 articles) | <= 8 minutes | `completed_at - started_at` on analysis_sessions |
| Classification throughput | >= 5 articles/second | CPU-bound measurement, no I/O |
| Voice match pass rate on generated articles | >= 80% of articles score >= 0.70 | `voice_match_scores` where `passed = true` / total |
| User persona override rate | < 30% of auto-generated personas require manual editing | Track `updated_at != created_at` on `source: 'auto'` personas |
| Corpus crawl politeness compliance | 100% robots.txt compliance, <= 3 concurrent, >= 500ms delay | Integration test + production log audit |
| API response time (persona CRUD) | p95 < 200ms | Request timing middleware |
| Analysis job retry success rate | >= 80% of failed jobs succeed on retry | `ingestion_jobs` retry tracking |
| Arabic classification accuracy | >= 75% agreement | Separate Arabic validation suite (lower target due to less training data initially) |
