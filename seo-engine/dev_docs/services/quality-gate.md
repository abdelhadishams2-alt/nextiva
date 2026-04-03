# Quality Gate Service — Deep Specification

> **Service #10** | **Layer 4 — Post-Generation** | **Priority: P0** | **Status: Implementation-Ready**
> **Last Updated:** 2026-03-28 | **Spec Depth:** DEEP (15 sections)
> **Owner:** ChainIQ Platform Engineer
> **Port Sources:** `old-seo-blog-checker/lib/seo-analyzer.ts`, `seo-checklist.ts`, `seo-suggestions.ts`, `Master Kit 36-seo/content-seo-scoring.md`

---

## Table of Contents

1. [Overview](#1-overview)
2. [Entities & Data Model](#2-entities--data-model)
3. [API Endpoints](#3-api-endpoints)
4. [Business Rules](#4-business-rules)
5. [60-Point SEO Checklist](#5-60-point-seo-checklist)
6. [7-Signal Scoring Rubric](#6-7-signal-scoring-rubric)
7. [E-E-A-T 10-Dimension Rubric](#7-e-e-a-t-10-dimension-rubric)
8. [Auto-Revision Loop](#8-auto-revision-loop)
9. [Arabic Quality Adjustments](#9-arabic-quality-adjustments)
10. [Auth & Permissions](#10-auth--permissions)
11. [Validation Rules](#11-validation-rules)
12. [Error Handling](#12-error-handling)
13. [Edge Cases](#13-edge-cases)
14. [Performance](#14-performance)
15. [Testing Requirements](#15-testing-requirements)

---

## 1. Overview

### What It Is

The Quality Gate Service is ChainIQ's post-generation scoring and enforcement layer. Every article produced by the Draft Writer agent passes through the Quality Gate before delivery to clients or publication to a CMS. The service evaluates content against three complementary assessment frameworks: a deterministic 60-point SEO checklist (engine-powered, reproducible), a 7-signal weighted scoring rubric (agent-powered, semantic), and a 10-dimension E-E-A-T rubric (agent-powered, authority-focused). The combined output is a composite quality score on a 0-10 scale, a detailed checklist report with per-item pass/fail status, and a prioritized list of actionable improvement suggestions.

The Quality Gate is not a binary pass/fail gate in the traditional sense. Every article passes through --- no content is silently blocked or deleted. Instead, articles scoring below threshold are automatically routed through a revision loop (max 2 passes) where the Draft Writer receives targeted fix instructions and produces an improved version. Articles that still fall below threshold after 2 revision passes are flagged for human review with a complete diagnostic summary. The dashboard displays the full quality breakdown for every article regardless of pass/fail status, giving operators complete visibility into content quality across their portfolio.

### Why It Exists

Without a quality gate, ChainIQ is indistinguishable from every other AI article generator on the market. The generation pipeline (project-analyzer, research-engine, article-architect, draft-writer) produces content. The Quality Gate ensures that content meets a measurable, auditable, reproducible quality floor before it reaches production. This is the "anti-slop" mechanism --- the service that prevents AI-generated content from diluting a publisher's domain authority or triggering Google's helpful content classifier.

The Quality Gate exists for three specific reasons:

1. **Client trust.** Enterprise publishers (starting with SRMG) need proof that generated content meets their editorial standards. A numeric score backed by 60 specific checks and 7 semantic signals provides that proof. The quality report is a deliverable --- it ships with every article.

2. **Auto-correction.** Most quality issues in AI-generated content are fixable with targeted instructions. A missing FAQ section, insufficient keyword density, poor heading hierarchy --- these are mechanical problems that the Draft Writer can fix when told specifically what to fix. The auto-revision loop captures 80-90% of quality issues without human intervention.

3. **Continuous improvement data.** Quality scores tracked over time reveal patterns: which topics produce higher-quality articles, which personas lead to better voice match scores, which keyword clusters consistently fail topical completeness checks. This data feeds into the Feedback Loop service and the Performance Predictor.

### Who Uses It

| Actor | Interaction | Frequency |
| --- | --- | --- |
| Generation Pipeline (automated) | Invokes Quality Gate after every Draft Writer output; processes revision loop automatically | Every article generation (~5-50x/day per user) |
| Content Operators (dashboard) | View quality reports, checklist breakdowns, signal scores; trigger manual re-scoring | Daily dashboard review |
| Publishing Service (automated) | Checks quality gate pass status before auto-publishing to CMS | Every publish event |
| Platform Admin | Monitor platform-wide quality metrics, identify quality regression trends, configure global thresholds | Weekly quality review |
| External API consumers | Score arbitrary HTML content via standalone scoring API | On-demand |

### Standalone Scoring Capability

The Quality Gate operates in two modes:

1. **Pipeline mode (default).** Integrated into the SKILL.md generation pipeline as Step 7 (post-draft, pre-delivery). Receives article HTML from Draft Writer, scores it, optionally triggers revision, and returns the final scored article to the pipeline for delivery.

2. **Standalone mode.** Any authenticated user can submit arbitrary article HTML to the scoring API and receive the full quality assessment. This enables scoring of externally-written content, competitor content analysis, and retrospective quality audits of previously published articles. Standalone mode does not trigger the auto-revision loop --- it returns scores and suggestions only.

### Architecture Split: Engine vs Agent

The Quality Gate is split between deterministic engine code and LLM-powered agent evaluation:

| Component | Type | File | What It Does |
| --- | --- | --- | --- |
| 60-point SEO checklist | Engine (deterministic) | `engine/quality-gate.js` | Parses HTML, counts elements, validates structure, checks thresholds. Zero LLM involvement. Identical inputs always produce identical outputs. |
| Suggestion generator | Engine (deterministic) | `engine/quality-suggestions.js` | Maps checklist failures to prioritized, actionable fix instructions. Template-based generation. |
| E-E-A-T 10-dimension rubric | Agent (LLM) | `agents/quality-gate.md` | Semantic evaluation of authority signals, expertise markers, trust elements. Requires LLM interpretation. |
| Topical completeness | Agent (LLM) | `agents/quality-gate.md` | Compares article subtopic coverage against competitor SERP data. Requires semantic similarity judgment. |
| Voice match scoring | Agent (LLM) | `agents/quality-gate.md` | Measures stylometric distance from target persona. Requires stylistic analysis. |
| AI detection scoring | Agent (LLM) | `agents/quality-gate.md` | Evaluates sentence variance, vocabulary diversity, cliche density. Heuristic + LLM hybrid. |
| Freshness evaluation | Agent (LLM) | `agents/quality-gate.md` | Validates recency of statistics, examples, and citations. Requires temporal reasoning. |
| Readability scoring | Engine (deterministic) | `engine/quality-gate.js` | Flesch-Kincaid computation for English; Arabic-calibrated readability for Arabic content. Pure math. |
| Technical SEO scoring | Engine (deterministic) | `engine/quality-gate.js` | Derived from checklist results for heading hierarchy, schema, meta, images, links. Pure aggregation. |

This split is intentional. The engine handles everything that can be measured objectively and deterministically. The agent handles everything that requires semantic understanding. When the LLM is unavailable, the engine continues to function independently, providing checklist-only scoring as a degraded but still useful fallback.

### Dependencies

**Depends On:**
- Auth & Bridge Server --- authentication, user context, article access, API routing
- Supabase --- database storage, RLS enforcement, article table foreign keys
- Draft Writer Agent --- receives revision instructions, produces revised articles (pipeline mode only)
- Voice Intelligence Service --- writer persona data for voice match scoring (Phase 2; defaults to 0.5 until available)
- Data Ingestion Service --- SERP competitor data for topical completeness comparison (Phase 2; keyword intent match fallback)
- LLM API (Claude) --- for 7-signal rubric evaluation via Quality Gate agent
- old-seo-blog-checker codebase --- source material for ported checklist logic and suggestion generation

**Depended On By:**
- Generation Pipeline --- Quality Gate is Step 7, final gate before delivery
- Publishing Service --- only articles that pass Quality Gate (or are flagged for human review with override) can be auto-published
- Dashboard --- Quality Report tab displays scores, checklist results, suggestions for every article
- Feedback Loop --- quality scores are tracked alongside performance predictions for model calibration
- Performance Predictor --- quality scores are an input signal for traffic/ranking predictions

---

## 2. Entities & Data Model

### Table: `quality_scores`

The primary storage for quality assessments. One row per article per revision pass. This table captures the complete output of both the engine (checklist) and the agent (rubric) evaluation.

```sql
CREATE TABLE quality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL DEFAULT 0,

  -- Composite score
  overall_score NUMERIC(4,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 10),
  passed BOOLEAN NOT NULL DEFAULT false,
  flagged_for_review BOOLEAN NOT NULL DEFAULT false,

  -- 7-signal individual scores (each 0-10)
  eeat_score NUMERIC(4,2) CHECK (eeat_score >= 0 AND eeat_score <= 10),
  topical_completeness_score NUMERIC(4,2) CHECK (topical_completeness_score >= 0 AND topical_completeness_score <= 10),
  voice_match_score NUMERIC(4,2) CHECK (voice_match_score >= 0 AND voice_match_score <= 10),
  ai_detection_score NUMERIC(4,2) CHECK (ai_detection_score >= 0 AND ai_detection_score <= 10),
  freshness_score NUMERIC(4,2) CHECK (freshness_score >= 0 AND freshness_score <= 10),
  technical_seo_score NUMERIC(4,2) CHECK (technical_seo_score >= 0 AND technical_seo_score <= 10),
  readability_score NUMERIC(4,2) CHECK (readability_score >= 0 AND readability_score <= 10),

  -- Checklist summary
  checklist_passed INTEGER NOT NULL DEFAULT 0,
  checklist_failed INTEGER NOT NULL DEFAULT 0,
  checklist_warnings INTEGER NOT NULL DEFAULT 0,
  checklist_total INTEGER NOT NULL DEFAULT 60,
  checklist_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,

  -- Detailed results (JSONB for flexibility)
  checklist_results JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Array of: { id, category, label, status, expected, actual, suggestion, priority_weight }

  rubric_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- { eeat: { dimensions: [...], grade, total },
  --   topical: { coverage_percent, missing_subtopics: [...], competitor_count },
  --   voice: { distance, persona_id, metrics: { avg_sentence_length, ttr, ... } },
  --   ai_detection: { human_probability, flags: [...] },
  --   freshness: { oldest_data_months, stale_items: [...] },
  --   technical: { checklist_derived_score, issues: [...] },
  --   readability: { flesch_kincaid_grade, avg_sentence_length, avg_paragraph_length, ... } }

  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Array of: { category, item_id, issue, fix, impact, effort }

  -- Revision context
  revision_instructions JSONB,
  -- { failing_signals: [...], checklist_failures: [...], general_notes }
  -- NULL for revision_number 0 (first score). Populated when revision triggered.

  -- Metadata
  scoring_mode TEXT NOT NULL DEFAULT 'pipeline' CHECK (scoring_mode IN ('pipeline', 'standalone', 'bulk')),
  engine_duration_ms INTEGER,
  agent_duration_ms INTEGER,
  total_duration_ms INTEGER,
  agent_model TEXT,
  language_detected TEXT DEFAULT 'en',
  word_count INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique: one score per article per revision pass
CREATE UNIQUE INDEX idx_qs_article_revision ON quality_scores (article_id, revision_number);

-- Query patterns: user's scores, recent scores, flagged articles
CREATE INDEX idx_qs_user_id ON quality_scores (user_id);
CREATE INDEX idx_qs_user_article ON quality_scores (user_id, article_id);
CREATE INDEX idx_qs_flagged ON quality_scores (user_id, flagged_for_review) WHERE flagged_for_review = true;
CREATE INDEX idx_qs_created ON quality_scores (user_id, created_at DESC);
CREATE INDEX idx_qs_overall ON quality_scores (user_id, overall_score);

-- RLS
ALTER TABLE quality_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own scores" ON quality_scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own scores" ON quality_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own scores" ON quality_scores
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins read all scores" ON quality_scores
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_quality_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_quality_scores_updated_at
  BEFORE UPDATE ON quality_scores
  FOR EACH ROW EXECUTE FUNCTION update_quality_scores_updated_at();
```

### Table: `quality_revisions`

Tracks the revision history for articles that entered the auto-revision loop. This table provides an audit trail of what was wrong, what instructions were given, and whether the revision improved the article.

```sql
CREATE TABLE quality_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  quality_score_id UUID NOT NULL REFERENCES quality_scores(id) ON DELETE CASCADE,

  revision_number INTEGER NOT NULL CHECK (revision_number IN (1, 2)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'timed_out')),

  -- What triggered the revision
  triggering_signals JSONB NOT NULL,
  -- Array of: { signal, score, threshold, gap }
  triggering_checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Array of: { id, label, status }

  -- Instructions sent to Draft Writer
  revision_instructions JSONB NOT NULL,
  -- { failing_signals: [{ signal, score, threshold, instructions }],
  --   checklist_failures: [{ id, label, suggestion }],
  --   general_notes: "..." }

  -- Results after revision
  pre_revision_score NUMERIC(4,2) NOT NULL,
  post_revision_score NUMERIC(4,2),
  score_delta NUMERIC(4,2),
  signals_improved JSONB,
  -- Array of: { signal, before, after, improved: boolean }
  signals_degraded JSONB,
  -- Array of: { signal, before, after }

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- If revision failed or timed out
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_qr_user_article ON quality_revisions (user_id, article_id);
CREATE INDEX idx_qr_status ON quality_revisions (user_id, status);
CREATE UNIQUE INDEX idx_qr_article_revision ON quality_revisions (article_id, revision_number);

-- RLS
ALTER TABLE quality_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own revisions" ON quality_revisions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own revisions" ON quality_revisions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own revisions" ON quality_revisions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins read all revisions" ON quality_revisions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );
```

### JSONB Structure: `checklist_results` Item Schema

Each element in the `checklist_results` JSONB array follows this structure:

```json
{
  "id": "content_structure_01",
  "category": "Content Structure",
  "label": "Content length 1,200-2,500 words",
  "status": "pass",
  "expected": "1,200-2,500 words",
  "actual": "1,847 words",
  "suggestion": null,
  "priority_weight": "CRITICAL",
  "score_contribution": 1.0
}
```

**Status values:**
- `pass` --- meets criteria. Contributes 1.0 to passed count.
- `fail` --- does not meet criteria. Contributes 0.0. Blocks delivery if priority_weight is CRITICAL.
- `warning` --- below optimal but acceptable. Contributes 0.5 to passed count for scoring. Does not block delivery.
- `info` --- informational only. Contributes 1.0 to passed count. No impact on delivery.

**Priority weights:**
- `CRITICAL` --- must pass for article delivery. Failure triggers auto-revision.
- `HIGH` --- should pass. Failure contributes to revision trigger if multiple HIGH items fail.
- `MEDIUM` --- recommended. Generates suggestions but does not trigger revision alone.
- `LOW` --- nice-to-have. Informational.

### JSONB Structure: `rubric_details` Schema

```json
{
  "eeat": {
    "dimensions": [
      { "name": "Primary keyword targeting", "score": 3, "max": 3, "notes": "Keyword in title, H1, first paragraph, meta description" },
      { "name": "Secondary keyword integration", "score": 2, "max": 3, "notes": "LSI keywords present but distribution uneven" }
    ],
    "total": 24,
    "max": 30,
    "grade": "B",
    "normalized_score": 8.0
  },
  "topical_completeness": {
    "coverage_percent": 82,
    "subtopics_found": 14,
    "subtopics_expected": 17,
    "missing_subtopics": ["installation cost comparison", "warranty implications"],
    "competitor_count": 5,
    "data_source": "serp_analysis"
  },
  "voice_match": {
    "distance": 0.22,
    "persona_id": "uuid-of-persona",
    "persona_name": "SRMG Editorial Voice",
    "metrics": {
      "avg_sentence_length": { "target": 14.2, "actual": 16.8, "delta": 2.6 },
      "type_token_ratio": { "target": 0.68, "actual": 0.71, "delta": 0.03 },
      "passive_voice_ratio": { "target": 0.08, "actual": 0.12, "delta": 0.04 },
      "formality_score": { "target": 62, "actual": 58, "delta": -4 }
    }
  },
  "ai_detection": {
    "human_probability": 89,
    "flags": [
      { "type": "cliche_density", "value": 0.02, "threshold": 0.05, "status": "pass" },
      { "type": "sentence_variance", "value": 4.2, "threshold": 3.0, "status": "pass" },
      { "type": "vocabulary_diversity", "value": 0.71, "threshold": 0.60, "status": "pass" },
      { "type": "paragraph_opener_variety", "value": 0.85, "threshold": 0.70, "status": "pass" }
    ]
  },
  "freshness": {
    "oldest_data_months": 2,
    "stale_items": [],
    "statistics_count": 8,
    "all_current": true
  },
  "technical_seo": {
    "checklist_derived_score": 9.2,
    "issues": ["H3 count slightly below target (9 vs 10 minimum)"],
    "schema_present": true,
    "schema_types": ["Article", "FAQ"]
  },
  "readability": {
    "flesch_kincaid_grade": 9.4,
    "avg_sentence_length": 16.8,
    "avg_paragraph_length": 3.2,
    "syllables_per_word": 1.6,
    "complex_word_percentage": 12.4,
    "language": "en",
    "readability_method": "flesch_kincaid"
  }
}
```

### JSONB Structure: `suggestions` Schema

```json
[
  {
    "category": "Content Structure",
    "item_id": "content_structure_11",
    "issue": "FAQ section missing",
    "fix": "Add a FAQ section with 8-12 questions relevant to the primary keyword. Use question-based H3 headings with concise 2-3 sentence answers. Include FAQ schema markup.",
    "impact": "high",
    "effort": "medium",
    "signal_affected": "technical_seo",
    "estimated_score_improvement": 0.4
  }
]
```

### Migration File

`migrations/013-quality-scores.sql` --- creates both tables, indexes, RLS policies, and trigger functions. Runs as a standard Supabase migration. No changes to existing tables required.

---

## 3. API Endpoints

### Endpoint Summary

| Method | Path | Auth | Mode | Description |
| --- | --- | --- | --- | --- |
| GET | `/api/quality/score/:articleId` | User | Read | Get the latest quality score for an article |
| GET | `/api/quality/checklist/:articleId` | User | Read | Get the full 60-point checklist results |
| GET | `/api/quality/suggestions/:articleId` | User | Read | Get prioritized improvement suggestions |
| POST | `/api/quality/bulk` | User | Write | Score multiple articles in batch |
| POST | `/api/quality/revise/:articleId` | User | Write | Manually trigger auto-revision loop |
| GET | `/api/quality/history/:articleId` | User | Read | Get revision history for an article |
| POST | `/api/quality/score` | User | Write | Score arbitrary HTML (standalone mode) |

### GET `/api/quality/score/:articleId`

Returns the latest composite quality score and all 7 signal scores for the specified article. "Latest" means the highest revision_number for that article_id.

**Request:**
```
GET /api/quality/score/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "score-uuid",
    "article_id": "550e8400-e29b-41d4-a716-446655440000",
    "overall_score": 8.4,
    "passed": true,
    "flagged_for_review": false,
    "revision_number": 1,
    "signals": {
      "eeat": { "score": 8.7, "weight": 0.20, "grade": "B", "eeat_total": 26 },
      "topical_completeness": { "score": 8.2, "weight": 0.20, "coverage_percent": 82 },
      "voice_match": { "score": 7.8, "weight": 0.15, "distance": 0.22 },
      "ai_detection": { "score": 8.9, "weight": 0.15, "human_probability": 89 },
      "freshness": { "score": 9.0, "weight": 0.10, "oldest_data_months": 2 },
      "technical_seo": { "score": 9.2, "weight": 0.10, "checklist_pass_rate": 92 },
      "readability": { "score": 7.5, "weight": 0.10, "flesch_kincaid_grade": 9.4 }
    },
    "checklist_summary": {
      "passed": 52,
      "failed": 3,
      "warnings": 5,
      "info": 0,
      "total": 60,
      "percentage": 90.83
    },
    "language_detected": "en",
    "word_count": 1847,
    "scoring_mode": "pipeline",
    "scored_at": "2026-03-28T14:22:00Z"
  }
}
```

**Error (404):**
```json
{
  "error": "Not Found",
  "message": "No quality score exists for article 550e8400-e29b-41d4-a716-446655440000"
}
```

**Error (403):**
```json
{
  "error": "Forbidden",
  "message": "Article does not belong to authenticated user"
}
```

### GET `/api/quality/checklist/:articleId`

Returns the full 60-point checklist with per-item results. Includes all metadata needed to render the checklist accordion in the dashboard.

**Request:**
```
GET /api/quality/checklist/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "article_id": "550e8400-e29b-41d4-a716-446655440000",
    "revision_number": 1,
    "checklist": [
      {
        "id": "content_structure_01",
        "category": "Content Structure",
        "label": "Content length 1,200-2,500 words",
        "status": "pass",
        "expected": "1,200-2,500 words",
        "actual": "1,847 words",
        "suggestion": null,
        "priority_weight": "CRITICAL"
      },
      {
        "id": "keyword_optimization_01",
        "category": "Keyword Optimization",
        "label": "Primary keyword frequency 8-15 mentions",
        "status": "warning",
        "expected": "8-15 mentions",
        "actual": "7 mentions",
        "suggestion": "Add 1-2 more natural mentions of the primary keyword in body sections.",
        "priority_weight": "HIGH"
      }
    ],
    "summary": {
      "passed": 52,
      "failed": 3,
      "warnings": 5,
      "info": 0,
      "total": 60
    },
    "categories": {
      "Content Structure": { "passed": 14, "failed": 2, "warnings": 1, "total": 17 },
      "Keyword Optimization": { "passed": 5, "failed": 0, "warnings": 2, "total": 7 },
      "Metadata": { "passed": 4, "failed": 0, "warnings": 0, "total": 4 },
      "Internal Linking": { "passed": 4, "failed": 1, "warnings": 0, "total": 5 },
      "External Links": { "passed": 4, "failed": 0, "warnings": 1, "total": 5 },
      "Images": { "passed": 5, "failed": 0, "warnings": 1, "total": 6 },
      "Technical Formatting": { "passed": 6, "failed": 0, "warnings": 0, "total": 6 },
      "Internationalization": { "passed": 4, "failed": 0, "warnings": 0, "total": 4 }
    }
  }
}
```

### GET `/api/quality/suggestions/:articleId`

Returns prioritized, actionable suggestions grouped by impact level. Generated by `engine/quality-suggestions.js` from checklist failures and rubric weaknesses.

**Request:**
```
GET /api/quality/suggestions/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "article_id": "550e8400-e29b-41d4-a716-446655440000",
    "suggestions": {
      "critical": [
        {
          "category": "Content Structure",
          "item_id": "content_structure_11",
          "issue": "FAQ section missing",
          "fix": "Add a FAQ section with 8-12 questions relevant to the primary keyword. Use question-based H3 headings with concise 2-3 sentence answers. Include FAQ schema markup.",
          "impact": "high",
          "effort": "medium",
          "signal_affected": "technical_seo",
          "estimated_score_improvement": 0.4
        }
      ],
      "recommended": [
        {
          "category": "Keyword Optimization",
          "item_id": "keyword_optimization_01",
          "issue": "Primary keyword mentioned only 7 times (target: 8-15)",
          "fix": "Add 2-3 natural mentions in body sections. Avoid keyword stuffing --- integrate into existing sentences where contextually appropriate.",
          "impact": "medium",
          "effort": "low",
          "signal_affected": "technical_seo",
          "estimated_score_improvement": 0.2
        }
      ],
      "optional": []
    },
    "total_suggestions": 2,
    "estimated_total_score_improvement": 0.6
  }
}
```

### POST `/api/quality/bulk`

Score multiple articles in a single request. Articles are queued and processed sequentially. Returns immediately with a batch ID for polling.

**Request:**
```json
{
  "article_ids": ["uuid1", "uuid2", "uuid3"],
  "include_checklist": false,
  "include_suggestions": true
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "batch_id": "batch-uuid",
    "total": 3,
    "status": "processing",
    "results": [
      { "article_id": "uuid1", "status": "queued" },
      { "article_id": "uuid2", "status": "queued" },
      { "article_id": "uuid3", "status": "queued" }
    ],
    "poll_url": "/api/quality/bulk/batch-uuid",
    "estimated_completion_seconds": 90
  }
}
```

**Polling Response (200) --- partial completion:**
```json
{
  "success": true,
  "data": {
    "batch_id": "batch-uuid",
    "total": 3,
    "completed": 2,
    "status": "processing",
    "results": [
      { "article_id": "uuid1", "overall_score": 8.4, "passed": true, "status": "completed" },
      { "article_id": "uuid2", "overall_score": 6.1, "passed": false, "status": "completed" },
      { "article_id": "uuid3", "status": "processing" }
    ]
  }
}
```

**Limits:** Max 10 articles per bulk request. Rate limited to 5 bulk requests per minute per user.

### POST `/api/quality/revise/:articleId`

Manually trigger the auto-revision loop for a specific article. Only valid for articles that have been scored but not yet passed. Respects the max 2 revision passes limit.

**Request:**
```json
{
  "force": false,
  "custom_instructions": null
}
```

- `force: true` --- trigger revision even if current revision_number is already 2 (resets to revision pass 1). Requires admin role.
- `custom_instructions` --- optional string appended to the generated revision instructions. Allows operators to inject specific editorial directions.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "revision_id": "revision-uuid",
    "article_id": "article-uuid",
    "revision_number": 1,
    "status": "in_progress",
    "pre_revision_score": 5.8,
    "failing_signals": ["voice_match", "topical_completeness"],
    "estimated_completion_seconds": 120
  }
}
```

**Error (409 Conflict):**
```json
{
  "error": "Conflict",
  "message": "Article has already completed 2 revision passes. Use force=true with admin role to reset."
}
```

### GET `/api/quality/history/:articleId`

Returns the full revision history for an article, including all quality scores across revision passes and the delta between them.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "article_id": "article-uuid",
    "total_revisions": 2,
    "current_status": "passed",
    "history": [
      {
        "revision_number": 0,
        "overall_score": 5.8,
        "passed": false,
        "signals": { "eeat": 7.2, "voice_match": 4.1, "topical_completeness": 5.9 },
        "scored_at": "2026-03-28T14:00:00Z"
      },
      {
        "revision_number": 1,
        "overall_score": 7.9,
        "passed": false,
        "signals": { "eeat": 8.0, "voice_match": 6.8, "topical_completeness": 8.2 },
        "score_delta": 2.1,
        "signals_improved": ["voice_match", "topical_completeness", "eeat"],
        "signals_degraded": [],
        "scored_at": "2026-03-28T14:05:00Z"
      },
      {
        "revision_number": 2,
        "overall_score": 8.4,
        "passed": true,
        "signals": { "eeat": 8.7, "voice_match": 7.8, "topical_completeness": 8.2 },
        "score_delta": 0.5,
        "signals_improved": ["voice_match", "eeat"],
        "signals_degraded": [],
        "scored_at": "2026-03-28T14:10:00Z"
      }
    ]
  }
}
```

### POST `/api/quality/score` (Standalone Scoring)

Score arbitrary HTML content without linking to an existing article. Used for external content analysis, competitor auditing, and pre-import quality checks.

**Request:**
```json
{
  "html": "<article>...</article>",
  "target_keyword": "best HVAC systems 2026",
  "target_persona_id": "persona-uuid",
  "site_url": "https://example.com",
  "language_hint": "en"
}
```

Only `html` is required. All other fields are optional but improve scoring accuracy when provided.

**Response (200):** Same structure as GET `/api/quality/score/:articleId` but with `scoring_mode: "standalone"` and no `article_id` linkage.

---

## 4. Business Rules

### BR-01: Universal Pass-Through

Every article passes through the Quality Gate. No article is silently blocked, deleted, or discarded. The Quality Gate scores and reports --- it does not prevent delivery except through the auto-revision loop (which itself has a max 2-pass limit). After 2 revision passes, even failing articles are delivered with a quality report and a `flagged_for_review` marker.

**Rationale:** Content operators need to see everything. A hidden rejection creates a black box. The dashboard shows every article with its quality breakdown, and the operator decides whether a flagged article is acceptable.

### BR-02: Minimum Composite Score Threshold

An article "passes" the Quality Gate when its `overall_score >= 7.0` AND no individual signal scores below `7.0`. Both conditions must be true. An article with an overall score of 8.5 but a voice_match score of 6.2 does NOT pass.

**Rationale:** The composite score can hide individual signal weakness due to weight averaging. A 6.2 voice match with strong E-E-A-T and technical scores could still average to 7.5+, but the article still sounds wrong. The per-signal floor catches this.

### BR-03: Auto-Revision Trigger

Auto-revision is triggered when any individual signal scores below 7.0 during pipeline mode scoring. The revision targets ONLY the failing signals --- it does not regenerate the entire article. The Draft Writer receives specific instructions for each failing signal and checklist item.

**Rationale:** Targeted revision is faster and less destructive than full regeneration. Rewriting an entire article because the FAQ section is missing wastes tokens, time, and risks degrading sections that were already good.

### BR-04: Maximum 2 Revision Passes

The auto-revision loop executes a maximum of 2 revision passes (revision_number 1 and 2). If the article still fails after revision_number 2, it is marked `flagged_for_review = true` and delivered with its current quality score. No further automatic revisions occur.

**Rationale:** Diminishing returns. Data from old-seo-blog-checker shows that ~70% of quality issues are fixed in revision 1, ~20% more in revision 2. The remaining 10% typically require editorial judgment that an LLM cannot reliably provide. A 3rd pass risks degradation (the agent starts hallucinating fixes or over-correcting).

### BR-05: Voice Match Minimum Enforcement

Voice match is the only signal with a dynamic threshold. When a writer persona is available (Voice Intelligence Service active), the minimum voice match score is 6.0/10 (slightly relaxed from the standard 7.0) during Phase 1, rising to 7.0 in Phase 2 when the Voice Intelligence layer is fully calibrated.

When no writer persona is configured, the voice match signal defaults to 5.0/10 (neutral) and is excluded from the pass/fail evaluation. Its weight (15%) is redistributed equally to E-E-A-T (25%) and Topical Completeness (25%).

**Rationale:** Voice match scoring depends on having a calibrated persona profile. Penalizing articles when no persona exists creates false failures. The 6.0 Phase 1 threshold acknowledges that initial persona profiles may be imprecise.

### BR-06: Arabic Scoring Adjustments

When Arabic content is detected (>= 30% of characters in Unicode range U+0600-U+06FF):

1. Flesch-Kincaid readability is replaced with Arabic-calibrated readability (see Section 9).
2. Keyword density calculations use morphological root-form matching, not exact string matching.
3. Heading structure thresholds are relaxed by 20% (Arabic prose tends toward longer, fewer headings).
4. Content length thresholds are adjusted: 1,000-2,200 words (Arabic text is ~15% more compact than English for equivalent content).
5. All i18n checklist items (51-54) are elevated from `info` to `CRITICAL` priority.

**Rationale:** Applying English-calibrated metrics to Arabic text produces systematically lower scores. Arabic morphology means a single root can appear in dozens of surface forms --- exact-match keyword density is meaningless. Arabic editorial tradition uses fewer, longer headings than English SEO convention.

### BR-07: Checklist Category Weights

Not all checklist categories contribute equally to the technical_seo signal score. Category weights for technical_seo derivation:

| Category | Weight | Items | Max Contribution |
| --- | --- | --- | --- |
| Content Structure | 25% | 17 | 2.50 |
| Keyword Optimization | 20% | 7 | 2.00 |
| Metadata | 10% | 4 | 1.00 |
| Internal Linking | 15% | 5 | 1.50 |
| External Links | 5% | 5 | 0.50 |
| Images | 10% | 6 | 1.00 |
| Technical Formatting | 10% | 6 | 1.00 |
| Internationalization | 5% | 4 | 0.50 |

Technical SEO signal score = sum of (category_pass_rate * category_weight * 10). Example: if Content Structure has 14/17 passed (82.4%), its contribution is 0.824 * 0.25 * 10 = 2.06.

### BR-08: Standalone Mode Limitations

Standalone scoring (POST `/api/quality/score` with raw HTML) has the following limitations compared to pipeline mode:

1. No auto-revision loop. Returns scores and suggestions only.
2. No topical completeness scoring against SERP competitors (no keyword context). Falls back to structural completeness analysis.
3. No voice match scoring unless `target_persona_id` is explicitly provided.
4. No freshness scoring (no generation context for when statistics were sourced).
5. Article is not stored in the `articles` table. Score is stored in `quality_scores` with `article_id = NULL` and `scoring_mode = 'standalone'`.

### BR-09: Bulk Scoring Queue Order

Bulk scoring processes articles in the order provided in the `article_ids` array. Processing is sequential (one at a time) to avoid overwhelming the LLM API. Each article in the batch receives the full scoring treatment (engine + agent) unless `checklist_only: true` is specified, in which case only the deterministic engine runs (faster, but no rubric signals).

### BR-10: Score Caching and Re-scoring

Quality scores are cached in the `quality_scores` table and returned on subsequent GET requests without re-evaluation. Scores do NOT expire automatically. To get a fresh score, the user must explicitly call POST `/api/quality/revise/:articleId` or POST `/api/quality/score` (standalone).

**Rationale:** Quality scoring involves LLM calls (~15-25 seconds each). Caching is mandatory. Re-scoring on every GET would be prohibitively slow and expensive. Articles are immutable after generation (edits create new article_versions), so scores remain valid until the article content changes.

### BR-11: Revision Degradation Guard

After each revision pass, the Quality Gate compares the post-revision scores against the pre-revision scores signal by signal. If ANY signal degrades by more than 1.0 point, the revision is flagged with a `degradation_warning` and the degraded signals are logged in the `quality_revisions.signals_degraded` field.

If overall_score degrades (post-revision < pre-revision), the system reverts to the pre-revision article version and marks the revision as `failed` with the reason "revision_degraded_quality".

**Rationale:** Auto-revision can make articles worse. The Draft Writer might over-correct on voice match and destroy E-E-A-T signals, or add keywords at the expense of readability. The degradation guard prevents the revision loop from producing a net-negative outcome.

### BR-12: CRITICAL Checklist Item Override

If any checklist item with `priority_weight: CRITICAL` has status `fail`, the article cannot pass the Quality Gate regardless of overall_score. CRITICAL items are:

- `content_structure_01` --- Content length (too short to be useful)
- `content_structure_02` --- H1 count (fundamental SEO requirement)
- `content_structure_06` --- Table of contents (required for ChainIQ articles)
- `content_structure_11` --- FAQ section (required for featured snippet targeting)
- `keyword_optimization_01` --- Primary keyword frequency (fundamental to article purpose)
- `keyword_optimization_04` --- Keyword in title (fundamental SEO)
- `metadata_01` --- Title tag length (fundamental SEO)
- `metadata_02` --- Meta description (fundamental SEO)
- `metadata_03` --- Focus keyphrase (fundamental SEO)
- `images_01` --- Featured image (required for social sharing and CMS)
- `images_03` --- Alt text presence (accessibility and SEO)
- `internationalization_02` --- RTL attribute (only CRITICAL when Arabic detected)

### BR-13: Scoring Consistency Requirement

The engine (60-point checklist) must produce identical results for identical inputs. Given the same article HTML and the same configuration, running the checklist engine 100 times must produce 100 identical outputs. This is a hard requirement enforced by deterministic implementation (regex/DOM parsing, no LLM involvement).

The agent (7-signal rubric) is inherently non-deterministic due to LLM variability. To mitigate: the agent runs with temperature 0.0, uses structured output format with explicit scoring criteria, and the Quality Gate computes a rolling average of the last 3 agent evaluations for the same article (if available) to smooth variance.

### BR-14: Feature Flag Gating

The Quality Gate Service is gated behind `FEATURE_QUALITY_GATE=true` in environment variables. When the flag is false:

- All `/api/quality/*` endpoints return `503 Service Unavailable` with message "Quality Gate service is not enabled".
- The generation pipeline skips Step 7 (Quality Gate) and delivers articles directly.
- The dashboard Quality tab is hidden.
- No quality scores are computed or stored.

This enables staged rollout: internal testing first, then SRMG pilot, then general availability.

---

## 5. 60-Point SEO Checklist

The complete checklist ported from `old-seo-blog-checker/lib/seo-checklist.ts` and `seo-analyzer.ts`. The engine (`engine/quality-gate.js`) parses article HTML and evaluates each item deterministically. No LLM involvement. Items are grouped into 8 categories totaling 60 checks.

### Content Structure (17 items)

| # | ID | Check | Criteria | Pass | Fail | Warning | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `content_structure_01` | Content length | 1,200-2,500 words | 1,200-2,500 words | <1,200 or >3,000 words | 2,501-3,000 words | CRITICAL |
| 2 | `content_structure_02` | H1 count | Exactly 1 H1 tag | Exactly 1 | 0 or >1 | N/A | CRITICAL |
| 3 | `content_structure_03` | H2 count | 6-10 H2 tags | 6-10 | <4 or >12 | 4-5 or 11-12 | HIGH |
| 4 | `content_structure_04` | H3 count | 10-15 H3 tags | 10-15 | <8 or >18 | 8-9 or 16-18 | HIGH |
| 5 | `content_structure_05` | Keyword in headings | 30-40% of H2/H3 include primary keyword | 30-40% | <25% | 25-29% | HIGH |
| 6 | `content_structure_06` | Table of contents | TOC with anchor links present | TOC found with >= 5 anchor links | No TOC detected | TOC found but < 5 anchor links | CRITICAL |
| 7 | `content_structure_07` | Quick answer box | Summary/answer box near top (first 300 words) | Answer box/summary detected in first 300 words | N/A | Missing (warning only) | MEDIUM |
| 8 | `content_structure_08` | Metric highlight boxes | 2-4 data/statistic highlight boxes | 2-4 boxes detected | N/A | <2 (warning), >4 (info) | LOW |
| 9 | `content_structure_09` | Comparison tables | 2-3 tables (at least one comparison) | 2-3 `<table>` elements, >= 1 with comparison structure | 0 tables | 1 table only | HIGH |
| 10 | `content_structure_10` | Quote boxes | At least 1 quote/callout box | >= 1 `<blockquote>` or callout element | N/A | Missing (warning only) | MEDIUM |
| 11 | `content_structure_11` | FAQ section | FAQ section with 8-12 questions | FAQ section detected, 8-12 Q&A pairs | No FAQ section | FAQ with <8 or >12 questions | CRITICAL |
| 12 | `content_structure_12` | CTA placement | 2-3 calls to action | 2-3 CTAs detected | N/A | <2 or >4 CTAs | MEDIUM |
| 13 | `content_structure_13` | Intro length | 200-250 words | 200-250 words in first section | N/A | <180 or >300 words | MEDIUM |
| 14 | `content_structure_14` | Conclusion length | 150-200 words | 150-200 words in last section | N/A | <130 or >250 words | MEDIUM |
| 15 | `content_structure_15` | Sources section | Sources/references section present | Section with "sources", "references", or "citations" heading found | N/A | Missing (warning only) | MEDIUM |
| 16 | `content_structure_16` | Paragraph variety | Mix of short (1-2 sentences) and long (3-4 sentences) paragraphs | Coefficient of variation in paragraph length >= 0.3 | N/A | All paragraphs within +/- 1 sentence of mean | LOW |
| 17 | `content_structure_17` | Section balance | No section exceeds 30% of total word count | All sections <= 30% | N/A | Any section 31-40% (warning) | MEDIUM |

**Detection methods:**
- Content length: Strip HTML tags, count whitespace-delimited tokens. Exclude TOC, FAQ schema, navigation.
- H1/H2/H3: Regex match `<h[1-3][^>]*>` tags. Count occurrences.
- TOC: Detect elements with id/class containing "toc", "table-of-contents", or "contents". Count internal anchor links (`<a href="#..."`).
- FAQ: Detect section with heading containing "FAQ", "frequently asked", or elements with `itemtype="https://schema.org/FAQPage"`.
- Tables: Count `<table>` elements. Comparison detection: table has >= 2 columns and header row with product/option names.
- Intro/Conclusion: First section = content before second H2. Last section = content after last H2.

### Keyword Optimization (7 items)

| # | ID | Check | Criteria | Pass | Fail | Warning | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 18 | `keyword_optimization_01` | Primary keyword frequency | 8-15 natural mentions | 8-15 occurrences | <5 or >20 | 5-7 or 16-20 | CRITICAL |
| 19 | `keyword_optimization_02` | Keyword density | Maximum 2.5% of total words | <= 2.5% | > 2.5% | 2.1-2.5% | HIGH |
| 20 | `keyword_optimization_03` | LSI keyword mentions | 15-25 LSI/related keyword mentions | 15-25 unique LSI terms found | N/A | <12 or >30 | MEDIUM |
| 21 | `keyword_optimization_04` | Keyword in title | Primary keyword in article title/H1 | Exact or close match in title | Not found in title | Partial match only | CRITICAL |
| 22 | `keyword_optimization_05` | Keyword in first paragraph | Primary keyword in first 100 words | Found in first 100 words | Not found in first 100 words | Found in words 101-200 | HIGH |
| 23 | `keyword_optimization_06` | Keyword in H2 headings | Primary keyword in at least 2 H2s | Found in >= 2 H2 headings | N/A | Found in only 1 H2 | HIGH |
| 24 | `keyword_optimization_07` | Keyword in conclusion | Primary keyword in conclusion section | Found in last section | N/A | Missing from conclusion | MEDIUM |

**Detection methods:**
- Keyword frequency: Case-insensitive regex match for exact keyword phrase. Count non-overlapping occurrences in body text (excluding HTML tags, attributes, script, style).
- Keyword density: `(keyword_count * keyword_word_count) / total_word_count * 100`.
- LSI keywords: Requires `target_keyword` parameter. If SERP data available, LSI terms are extracted from competitor content. If not, use a static LSI lookup table (built from keyword research data) or skip with `info` status.
- Arabic keyword matching: Uses morphological root-form matching (see Section 9).

### Metadata (4 items)

| # | ID | Check | Criteria | Pass | Fail | Warning | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | `metadata_01` | Title tag length | 50-60 characters | 50-60 chars | Missing entirely | <50 or >60 chars | CRITICAL |
| 26 | `metadata_02` | Meta description length | 145-154 characters | 145-154 chars | Missing entirely | <145 or >160 chars | CRITICAL |
| 27 | `metadata_03` | Focus keyphrase set | Focus keyphrase defined in SEO fields or meta tags | Keyphrase found in meta tags or front matter | Not found anywhere | N/A | CRITICAL |
| 28 | `metadata_04` | SEO title optimized | SEO title includes primary keyword and is compelling | Keyword present in title, title is not truncated | N/A | Keyword missing from SEO title | HIGH |

**Detection methods:**
- Title: Extract from `<title>` tag or `<meta property="og:title">`. Measure character length (not byte length).
- Meta description: Extract from `<meta name="description">`. Measure character length.
- Focus keyphrase: Check `<meta name="keywords">`, front matter YAML, or JSON-LD `"keywords"` field.
- SEO title: If separate from `<title>`, check for keyword inclusion and length.

### Internal Linking (5 items)

| # | ID | Check | Criteria | Pass | Fail | Warning | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 29 | `internal_linking_01` | Internal link count | 8-12 internal links | 8-12 internal links | <5 | 5-7 or 13-15 | HIGH |
| 30 | `internal_linking_02` | Natural integration | Links woven into sentences, not listed | No paragraph contains >3 links | N/A | Any paragraph has >3 links | MEDIUM |
| 31 | `internal_linking_03` | Relevant anchor text | Anchor text describes target page content | No generic anchors detected | N/A | Generic anchors found ("click here", "read more", "this article", "here") | HIGH |
| 32 | `internal_linking_04` | Early placement | At least 1 internal link in first 200 words | Link found in first 200 words | N/A | No link in first 200 words | MEDIUM |
| 33 | `internal_linking_05` | No link clustering | Links distributed across article sections | No single section contains >50% of all internal links | N/A | >50% of links in one section | MEDIUM |

**Detection methods:**
- Internal links: Links where `href` starts with `/`, `#`, or matches the `site_url` parameter domain. Exclude navigation, footer, sidebar links (if detectable by container element).
- Generic anchors: Regex match against blocklist: `/^(click here|read more|here|this|learn more|this article|this page|link)$/i`.
- Link distribution: Count links per H2-delimited section. Flag if any section has >50% of total.

### External Links (5 items)

| # | ID | Check | Criteria | Pass | Fail | Warning | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 34 | `external_links_01` | Authority link count | 2-3 external authority links | 2-3 external links | N/A | <2 or >5 | HIGH |
| 35 | `external_links_02` | Mixed follow attributes | Mix of dofollow and nofollow | At least 1 dofollow and 1 nofollow | N/A | All same type (info only) | LOW |
| 36 | `external_links_03` | Source authority | Links to authoritative domains | All external links point to recognized authority domains | N/A | Any link to unrecognized/low-authority domain | MEDIUM |
| 37 | `external_links_04` | Proper attribution | Citations and references formatted correctly | Sources mentioned in text have corresponding links | N/A | Source names mentioned without hyperlinks | MEDIUM |
| 38 | `external_links_05` | No broken links | All external URLs return 200 | All checked URLs return 2xx | Any URL returns 4xx/5xx | N/A | HIGH |

**Detection methods:**
- External links: Links where `href` starts with `http` and domain does not match `site_url`. Exclude social media share buttons and known ad/tracking URLs.
- Authority domains: Checked against a curated allowlist of ~500 high-DA domains (gov, edu, major publications, industry leaders). Links to unknown domains get `warning`.
- Broken link check: HTTP HEAD request to each external URL. Only performed at publish time (not during initial scoring) due to latency. Status stored separately and merged into checklist results.
- Attribution: Regex scan for patterns like "according to [Source]", "reported by [Source]", "[Source] found that" without a corresponding `<a>` tag.

### Images (6 items)

| # | ID | Check | Criteria | Pass | Fail | Warning | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 39 | `images_01` | Featured image | Featured image present, minimum 1200x628px | Featured image found with dimensions >= 1200x628 | No featured image | Featured image found but wrong dimensions | CRITICAL |
| 40 | `images_02` | Content image count | Minimum 4 content images | >= 4 images in article body | N/A | <4 images | HIGH |
| 41 | `images_03` | Alt text presence | All images have descriptive alt text | 100% of images have non-empty alt text | Any image missing alt text | Any alt text < 10 characters | CRITICAL |
| 42 | `images_04` | Keyword in alt text | At least 1 image alt includes primary keyword | >= 1 alt text contains keyword | N/A | No alt text contains keyword | MEDIUM |
| 43 | `images_05` | Descriptive filenames | Image filenames are keyword-descriptive | No generic filenames detected | N/A | Generic names found (IMG_, DSC_, screenshot_, image_, photo_) | MEDIUM |
| 44 | `images_06` | Title attributes | Images have title attributes | All images have title attribute | N/A | Some images missing title (info only) | LOW |

**Detection methods:**
- Featured image: Check for `<meta property="og:image">`, first `<img>` in header/hero area, or image with class/id containing "featured", "hero", "banner". Dimensions checked via width/height attributes or inline style.
- Alt text: Extract `alt` attribute from all `<img>` tags. Empty string or whitespace-only counts as missing.
- Filenames: Extract filename from `src` attribute. Match against generic pattern: `/^(img|image|photo|screenshot|dsc|pic|picture)[-_]?\d*/i`.

### Technical Formatting (6 items)

| # | ID | Check | Criteria | Pass | Fail | Warning | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 45 | `technical_formatting_01` | Heading hierarchy | No skipped heading levels | H1 > H2 > H3 in order, no H3 without preceding H2 | H3 appears before any H2, or H4 without H3 | N/A | HIGH |
| 46 | `technical_formatting_02` | Short paragraphs | 2-4 sentences per paragraph | Average paragraph 2-4 sentences | N/A | Any paragraph >5 sentences | HIGH |
| 47 | `technical_formatting_03` | List usage | At least 2 bullet or numbered lists | >= 2 `<ul>` or `<ol>` elements | N/A | <2 lists | MEDIUM |
| 48 | `technical_formatting_04` | Bold key facts | Key facts and figures bolded | >= 5 `<strong>` or `<b>` tags in body | N/A | Zero bold tags in body | MEDIUM |
| 49 | `technical_formatting_05` | Clear section headers | All sections have descriptive headers | No empty headings, no generic headings ("Section 1", "Part A") | N/A | Any empty or single-word heading | MEDIUM |
| 50 | `technical_formatting_06` | White space | No wall-of-text blocks exceeding 150 words | No continuous text block >150 words without a break element (heading, list, image, table, hr) | N/A | Any block >150 words without break | HIGH |

**Detection methods:**
- Heading hierarchy: Build ordered list of all headings (H1-H6). Walk the list; flag if any heading level increases by >1 (e.g., H2 followed by H4 without H3).
- Paragraph sentences: Split `<p>` content by sentence-ending punctuation (`.!?` followed by space or end). Count per paragraph.
- Wall-of-text: Measure word count between consecutive block-level elements (headings, lists, images, tables, `<hr>`). Flag blocks >150 words.
- Generic headings: Regex match against blocklist: `/^(section|part|chapter|heading|untitled|introduction|conclusion)\s*\d*$/i`. Also flag empty heading tags.

### Internationalization (4 items)

| # | ID | Check | Criteria | Pass | Fail | Warning | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 51 | `internationalization_01` | Arabic content detection | Detect Arabic text via Unicode U+0600-U+06FF range | Arabic ratio computed; if >= 30%, triggers i18n checks | N/A | N/A (info: reports ratio) | LOW (info) |
| 52 | `internationalization_02` | RTL attribute | `dir="rtl"` attribute on html or container element | `dir="rtl"` found when Arabic detected | Arabic detected without RTL attribute | N/A | CRITICAL (when Arabic) |
| 53 | `internationalization_03` | Arabic fonts | CSS references Cairo, Tajawal, or Amiri font families | Arabic font family found in style declarations when Arabic detected | N/A | Arabic content without Arabic font (warning) | HIGH (when Arabic) |
| 54 | `internationalization_04` | RTL text alignment | `text-align: right` or CSS logical properties used | RTL-appropriate alignment found when Arabic detected | N/A | Arabic content with explicit `text-align: left` | HIGH (when Arabic) |

**Items 55-60: Custom Client Checks**

| # | ID | Check | Criteria | Default Status |
| --- | --- | --- | --- | --- |
| 55 | `custom_01` | Custom check slot 1 | Configurable per user via `user_settings.quality_custom_checks` | `info` --- "No custom check configured" |
| 56 | `custom_02` | Custom check slot 2 | Configurable | `info` |
| 57 | `custom_03` | Custom check slot 3 | Configurable | `info` |
| 58 | `custom_04` | Custom check slot 4 | Configurable | `info` |
| 59 | `custom_05` | Custom check slot 5 | Configurable | `info` |
| 60 | `custom_06` | Custom check slot 6 | Configurable | `info` |

Custom checks are defined as JSON in the `user_settings` table:

```json
{
  "quality_custom_checks": [
    {
      "slot": 1,
      "label": "Brand mention count",
      "type": "text_count",
      "target_text": "SRMG",
      "min": 2,
      "max": 5,
      "priority": "MEDIUM"
    },
    {
      "slot": 2,
      "label": "Minimum video embeds",
      "type": "element_count",
      "selector": "iframe[src*='youtube'], iframe[src*='vimeo']",
      "min": 1,
      "priority": "LOW"
    }
  ]
}
```

### Checklist Scoring Formula

```
raw_passed = count(status == 'pass') + count(status == 'info')
weighted_passed = raw_passed + (count(status == 'warning') * 0.5)
checklist_percentage = (weighted_passed / checklist_total) * 100
```

Each item returns one of four statuses:
- **pass** --- meets criteria. Contributes 1.0 to passed count.
- **fail** --- does not meet criteria. Contributes 0.0.
- **warning** --- below optimal but acceptable. Contributes 0.5 for scoring.
- **info** --- informational only. Contributes 1.0. No delivery impact.

---

## 6. 7-Signal Scoring Rubric

The agent-powered evaluation layer. Each signal is scored 0-10. The weighted composite produces the `overall_score`. The Quality Gate agent (`agents/quality-gate.md`) evaluates signals requiring semantic analysis. The engine evaluates signals that can be computed deterministically.

### Signal Definitions and Weights

| # | Signal | Weight | Evaluation Method | Pass Threshold | What It Measures |
| --- | --- | --- | --- | --- | --- |
| 1 | E-E-A-T Signals | 20% | Agent (LLM) | >= 7/10 | Experience markers (first-person accounts, case studies), expertise depth (technical accuracy, jargon usage), authority signals (citations, credentials), trust elements (transparency, sources, balanced perspective) |
| 2 | Topical Completeness | 20% | Agent (LLM) | >= 8/10 (80% subtopic coverage) | Coverage of article topic vs top 5 SERP competitors' subtopics. Measures whether the article comprehensively addresses the topic or leaves gaps that competitors cover. |
| 3 | Voice Match | 15% | Agent (LLM) | <= 0.3 stylometric distance (7/10) | Stylometric distance from target writer persona. Measures sentence length distribution, type-token ratio, cadence patterns, passive voice usage, formality level, heading style. |
| 4 | AI Detection Score | 15% | Agent + Engine (hybrid) | >= 85% human probability (8.5/10) | Probability that the content would be classified as human-written. Measures sentence length variance, vocabulary diversity, cliche density, paragraph opener variety, hedging phrase frequency, repetitive structure patterns. |
| 5 | Freshness Signals | 10% | Agent (LLM) | All data <= 6 months old (7/10) | Recency of statistics, examples, case studies, and citations. Checks for outdated information, broken temporal references ("in 2024"), and stale data points. |
| 6 | Technical SEO | 10% | Engine (deterministic) | >= 9/10 | Derived from the 60-point checklist results. Weighted aggregation of all 8 checklist categories (see BR-07 for category weights). |
| 7 | Readability | 10% | Engine (deterministic) | Grade 8-12 Flesch-Kincaid (7/10) | Flesch-Kincaid grade level for English. Arabic-calibrated readability for Arabic (see Section 9). Also measures paragraph length, section structure, scanability (list/table ratio). |

### Weighted Composite Score Formula

```
overall_score = (eeat_score * 0.20) +
                (topical_completeness_score * 0.20) +
                (voice_match_score * 0.15) +
                (ai_detection_score * 0.15) +
                (freshness_score * 0.10) +
                (technical_seo_score * 0.10) +
                (readability_score * 0.10)
```

### Per-Signal Calculation Formulas

**E-E-A-T Score:**
```
eeat_score = (eeat_10_dimension_total / 30) * 10
```
Where `eeat_10_dimension_total` is the sum of 10 dimensions, each scored 0-3 (see Section 7). The agent evaluates each dimension against specific criteria and assigns integer scores.

**Topical Completeness Score:**
```
coverage_ratio = subtopics_found / subtopics_expected
topical_completeness_score = min(coverage_ratio * 10, 10)
```
Where `subtopics_expected` is derived from SERP competitor analysis (union of subtopics across top 5 ranking pages). If SERP data is unavailable, falls back to keyword intent-based subtopic estimation (reduced confidence, capped at 8/10 max).

**Voice Match Score:**
```
stylometric_distance = weighted_euclidean_distance(article_metrics, persona_metrics)
  where weights: sentence_length=0.25, ttr=0.20, passive_voice=0.15,
                 formality=0.15, paragraph_length=0.15, heading_style=0.10

voice_match_score = max(0, 10 - (stylometric_distance * 15))
```
Distance of 0.0 = perfect match (10/10). Distance of 0.3 = threshold (5.5/10). Distance of 0.67+ = 0/10. When no persona is available, defaults to 5.0/10 (neutral).

**AI Detection Score:**
```
sentence_variance_score = min(sentence_length_std_dev / 5.0, 1.0) * 2.5
vocabulary_score = min(type_token_ratio / 0.80, 1.0) * 2.5
cliche_score = max(0, 1 - (cliche_count / (word_count / 500))) * 2.5
opener_score = min(unique_openers / total_paragraphs, 1.0) * 2.5

ai_detection_score = sentence_variance_score + vocabulary_score + cliche_score + opener_score
```
Each sub-score contributes up to 2.5 points for a total of 10. The engine computes sentence variance, vocabulary diversity, and cliche density deterministically. The agent supplements with semantic analysis of hedging patterns and structure repetition.

Cliche list (partial): "it's important to note", "in today's world", "at the end of the day", "when it comes to", "it goes without saying", "needless to say", "in conclusion", "without further ado", "in this article we will", "let's dive in", "buckle up", "the landscape of", "a game changer", "leverage", "utilize", "cutting-edge", "state-of-the-art", "seamlessly", "robust".

**Freshness Score:**
```
if all_statistics_current (< 6 months): freshness_score = 9.0 + bonus
if some_stale (6-12 months): freshness_score = 7.0 - (stale_count * 0.5)
if any_very_stale (> 12 months): freshness_score = max(3.0, 7.0 - (very_stale_count * 1.5))
bonus: +0.5 for "2026" references, +0.5 for "updated" or "latest" markers
```
The agent identifies temporal references in the text (years, "recent", "latest", "updated"), validates recency of cited statistics, and checks for anachronistic references.

**Technical SEO Score:**
```
technical_seo_score = sum(
  for each category:
    (category_pass_rate * category_weight * 10)
)
```
See BR-07 for category weights. Entirely derived from the 60-point checklist results. No LLM involvement.

**Readability Score (English):**
```
flesch_kincaid_grade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59

if grade >= 8 AND grade <= 12: readability_score = 8.0 + adjustment
if grade >= 6 AND grade < 8: readability_score = 7.0
if grade > 12 AND grade <= 14: readability_score = 6.5
if grade < 6 or grade > 14: readability_score = 5.0

adjustment: +1.0 if avg_paragraph_length <= 4 sentences
            +0.5 if list_count >= 3
            +0.5 if table_count >= 1
```
Capped at 10.0. See Section 9 for Arabic readability formula.

### Weight Redistribution Rules

When a signal cannot be evaluated (missing dependency, unavailable data), its weight is redistributed:

| Missing Signal | Redistribution |
| --- | --- |
| Voice Match (no persona) | +7.5% to E-E-A-T (27.5%), +7.5% to Topical Completeness (27.5%) |
| Topical Completeness (no SERP data) | +10% to E-E-A-T (30%), +10% to AI Detection (25%) |
| Freshness (standalone mode) | +5% to Technical SEO (15%), +5% to Readability (15%) |
| AI Detection (agent unavailable) | +7.5% to Technical SEO (17.5%), +7.5% to Readability (17.5%) |
| E-E-A-T (agent unavailable) | +10% to Technical SEO (20%), +10% to Readability (20%) |
| Multiple signals unavailable | Engine-only mode: Technical SEO 50%, Readability 50%. Overall pass threshold relaxed to checklist_percentage >= 85%. |

---

## 7. E-E-A-T 10-Dimension Rubric

Ported from Master Kit 36-seo `content-seo-scoring.md`. Each dimension is scored 0-3 by the Quality Gate agent. Total of 30 points, normalized to a 0-10 scale for the `eeat_score` signal.

### Dimension Definitions

| # | Dimension | Score 0 | Score 1 | Score 2 | Score 3 |
| --- | --- | --- | --- | --- | --- |
| 1 | **Primary keyword targeting** | Keyword absent from title, H1, and meta description | Keyword in title OR H1 but not both; missing from meta description | Keyword in title AND H1; present in meta description; appears in first paragraph | Keyword in title, H1, first paragraph, meta description, URL slug, and at least 2 H2s. Natural integration, no stuffing. |
| 2 | **Secondary keyword integration** | No LSI or related keywords detected | <10 LSI terms; distribution clustered in one section | 10-20 LSI terms; distributed across 3+ sections; some feel forced | 15-25 LSI terms; naturally woven throughout; diverse semantic field; covers synonyms, related concepts, and long-tail variations |
| 3 | **Content depth vs SERP competitors** | Significantly shallower than competitors (covers <50% of subtopics) | Covers 50-70% of competitor subtopics; missing major sections | Covers 70-90% of competitor subtopics; comparable depth | Covers >90% of competitor subtopics; adds unique insights, data, or perspectives not found in competitors |
| 4 | **Readability & formatting** | Wall-of-text presentation; no lists, tables, or visual breaks; grade level >16 | Some formatting effort; 1-2 lists; paragraphs too long; grade level 14-16 | Good formatting; 3+ lists; short paragraphs; grade level 10-14 | Excellent scanability; mix of lists, tables, images, callouts; grade level 8-10; visual hierarchy clear |
| 5 | **Internal linking** | Zero internal links | 1-4 internal links; generic anchor text; clustered | 5-7 internal links; mostly relevant anchors; some distribution | 8-12 internal links; descriptive anchors; distributed across sections; contextually relevant; link in first 200 words |
| 6 | **External link quality** | Zero external links or links to low-quality sources only | 1 external link; source authority unclear | 2-3 external links to recognized authority domains; basic attribution | 2-3 links to high-authority domains (gov, edu, major publications); proper attribution format; mix of dofollow/nofollow |
| 7 | **Structured data** | No schema markup | Basic Article schema only | Article + one additional schema (FAQ, HowTo, or BreadcrumbList) | Article + FAQ + BreadcrumbList schema; all validated; rich snippet eligible |
| 8 | **Mobile rendering** | Fixed-width elements; images overflow; no responsive design signals | Some responsive elements; most images have width attributes; basic mobile compatibility | Responsive images (max-width: 100%); readable font sizes; adequate spacing | Fully responsive; lazy loading; appropriate touch targets (>= 44px); no horizontal scroll; optimized viewport meta |
| 9 | **Page speed signals** | Large unoptimized images; excessive inline CSS/JS; no lazy loading | Some image optimization; moderate inline CSS; no lazy loading | Optimized images (WebP/AVIF); minimal inline CSS; lazy loading on below-fold images | All images optimized with modern formats; critical CSS inlined, non-critical deferred; lazy loading everywhere; preconnect hints for external resources |
| 10 | **Media optimization** | Images missing alt text; generic filenames; no title attributes | Some alt text present but generic ("image", "photo"); some generic filenames | All images have descriptive alt text; most filenames descriptive; title attributes on key images | All images have keyword-rich descriptive alt text; all filenames SEO-friendly; title attributes present; captions where appropriate; image dimensions specified |

### Grade Thresholds

| Grade | Score Range | Label | Action |
| --- | --- | --- | --- |
| **A** | 27-30 | Excellent | No E-E-A-T improvements needed. Article demonstrates strong authority signals. |
| **B** | 22-26 | Good | Minor improvements possible. Article is competitive with top-ranking content. |
| **C** | 16-21 | Below Average | Significant gaps in E-E-A-T signals. Multiple dimensions need improvement. Likely triggers auto-revision. |
| **D** | 10-15 | Poor | Major E-E-A-T deficiencies. Article unlikely to rank competitively. Auto-revision mandatory. |
| **F** | 0-9 | Failing | Fundamental quality issues. May indicate generation failure. Flag for human review. |

### Normalization to 0-10 Scale

```
eeat_score = (eeat_total / 30) * 10
```

Examples: 27/30 = 9.0, 22/30 = 7.33, 16/30 = 5.33, 10/30 = 3.33, 9/30 = 3.0.

### Agent Evaluation Protocol

The Quality Gate agent evaluates E-E-A-T using the following structured prompt pattern:

```markdown
## E-E-A-T Evaluation Task

Evaluate the following article against 10 E-E-A-T dimensions. For each dimension, assign a score of 0, 1, 2, or 3 based on the criteria below. Return ONLY the JSON structure.

### Article
{article_html}

### Target Keyword
{target_keyword}

### Competitor Subtopics (if available)
{competitor_subtopics}

### Scoring Criteria
[10-dimension rubric inserted here]

### Required Output Format
{
  "dimensions": [
    { "name": "Primary keyword targeting", "score": <0-3>, "notes": "<specific evidence>" },
    ...
  ],
  "total": <sum>,
  "grade": "<A/B/C/D/F>",
  "top_improvement": "<single most impactful improvement>"
}
```

The agent runs at temperature 0.0 with structured output enforcement. The `notes` field must cite specific evidence from the article (not generic statements). This enables auditability --- an operator can verify why each dimension received its score.

---

## 8. Auto-Revision Loop

### Flow Diagram

```
Draft Writer Output (HTML)
    |
    v
[Quality Gate: Engine Evaluation]  ──  60-point checklist (< 2 seconds)
    |
    v
[Quality Gate: Agent Evaluation]   ──  7-signal rubric (15-25 seconds)
    |
    v
[Composite Score Calculation]
    |
    ├── overall_score >= 7.0 AND all signals >= 7.0 AND no CRITICAL fails
    |       |
    |       v
    |   *** PASS *** ──> Deliver to client / publish to CMS
    |
    └── Any signal < 7.0 OR any CRITICAL checklist fail
            |
            v
        [Generate Revision Instructions]
            |
            v
        [Check revision_number]
            |
            ├── revision_number < 2
            |       |
            |       v
            |   [Send instructions to Draft Writer]
            |       |
            |       v
            |   [Draft Writer produces revised HTML]
            |       |
            |       v
            |   [Increment revision_number]
            |       |
            |       v
            |   [Re-enter Quality Gate evaluation] ──> (loop back to top)
            |
            └── revision_number >= 2
                    |
                    v
                *** FLAG FOR HUMAN REVIEW ***
                    |
                    v
                Deliver with flagged_for_review = true
                Quality report attached with unresolved issues
```

### Revision Instruction Generation

When the Quality Gate determines that revision is needed, it generates a structured instruction payload. This payload is sent to the Draft Writer agent via the SKILL.md pipeline (not via API --- this is an internal agent-to-agent handoff).

**Instruction Template:**

```json
{
  "article_id": "uuid",
  "revision_pass": 1,
  "pre_revision_score": 5.8,
  "target_score": 7.0,
  "mode": "targeted_revision",
  "preserve_sections": ["intro", "conclusion", "faq"],
  "failing_signals": [
    {
      "signal": "voice_match",
      "score": 5.8,
      "threshold": 7.0,
      "gap": 1.2,
      "instructions": "Reduce average sentence length from 22.4 to approximately 14 words to match the target persona's cadence. Replace formal hedging phrases ('it is important to note that', 'one should consider') with direct statements. Add 2-3 short punchy sentences (5-8 words) per section. The target persona uses conversational transitions, not academic ones.",
      "specific_fixes": [
        { "section": "H2: Installation Process", "issue": "All sentences >20 words", "fix": "Break the 3 longest sentences. Add a 1-sentence summary at section start." },
        { "section": "H2: Cost Comparison", "issue": "Passive voice dominant", "fix": "Convert 'The system is installed by...' to 'Technicians install the system...'" }
      ]
    },
    {
      "signal": "topical_completeness",
      "score": 6.2,
      "threshold": 7.0,
      "gap": 0.8,
      "instructions": "Missing subtopics identified in competitor analysis: 'installation cost comparison by region', 'warranty implications for DIY vs professional', 'seasonal pricing trends'. Add H2 or H3 sections covering these gaps. Each new section should be 150-250 words with at least one internal link.",
      "specific_fixes": [
        { "action": "add_section", "heading": "Installation Cost Comparison by Region", "placement": "after H2: Cost Comparison", "min_words": 200 },
        { "action": "add_section", "heading": "Warranty Implications", "placement": "before H2: FAQ", "min_words": 150 }
      ]
    }
  ],
  "checklist_failures": [
    {
      "id": "content_structure_06",
      "label": "Table of contents",
      "status": "fail",
      "suggestion": "Add a TOC with anchor links after the introduction. Include all H2 headings as TOC entries. Use smooth scroll anchor links.",
      "priority": "CRITICAL"
    },
    {
      "id": "images_03",
      "label": "Alt text presence",
      "status": "fail",
      "suggestion": "Image at position 3 (hero-banner.jpg) is missing alt text. Add descriptive alt text including the primary keyword.",
      "priority": "CRITICAL"
    }
  ],
  "general_notes": "This is revision pass 1 of 2. Focus on the failing signals and CRITICAL checklist items. Do NOT rewrite sections that are currently passing. Preserve the existing FAQ section, introduction, and conclusion structure."
}
```

### Revision Constraints

1. **Targeted, not total.** The Draft Writer in revision mode only modifies sections identified in the instructions. It does not regenerate the entire article. This preserves sections that are already passing and reduces token consumption.

2. **Section preservation.** The `preserve_sections` array lists sections that must not be modified. The Draft Writer must output these sections verbatim (or with minimal whitespace changes).

3. **Additive bias.** When the instruction is to add missing content (new subtopics, missing FAQ, TOC), the Draft Writer adds without removing existing content. When the instruction is to modify existing content (voice adjustment, keyword density), the Draft Writer modifies in place.

4. **5-minute timeout per revision pass.** If the Draft Writer does not produce revised HTML within 5 minutes, the revision is marked as `timed_out` and the pre-revision article is kept. The article is flagged for human review with the timeout noted.

5. **Degradation guard.** After each revision pass, the Quality Gate compares post-revision scores against pre-revision scores. If overall_score decreases, the revision is rolled back and marked as `failed` with reason `revision_degraded_quality` (see BR-11).

### Revision Pass Behavior

| Pass | Trigger | Expected Outcome | If Still Failing |
| --- | --- | --- | --- |
| **Pass 0 (initial)** | Article generated by Draft Writer | First quality score computed | Triggers revision pass 1 |
| **Pass 1** | Any signal < 7.0 or CRITICAL checklist failure | Fix 70-80% of quality issues. Most articles should pass after this. | Triggers revision pass 2 with escalated instructions |
| **Pass 2** | Still failing after pass 1 | Fix remaining 10-20% of issues. Escalated instructions include more specific section-level fixes. | Flag for human review. No more automatic revision. |

### Escalation Between Passes

Pass 2 instructions are more aggressive than pass 1:

- **More specific.** Instead of "reduce sentence length", pass 2 says "rewrite the following 5 specific sentences: [quoted text]".
- **More structural.** Pass 2 may instruct section reordering, paragraph splitting, or heading restructuring that pass 1 avoids.
- **Explicit targets.** Pass 2 includes the exact current metric values and the exact target values: "Current keyword density: 3.1%. Target: <= 2.5%. Remove 4 keyword mentions from sections X and Y."
- **Narrower scope.** Pass 2 focuses only on signals that are STILL failing after pass 1. Signals that improved to >= 7.0 in pass 1 are excluded from pass 2 instructions.

### Human Review Flagging

When an article is flagged for human review after 2 failed revision passes:

1. `quality_scores.flagged_for_review` is set to `true`.
2. The article is still delivered to the dashboard but marked with a visible "Needs Review" badge.
3. The quality report includes a "Review Summary" section listing:
   - Which signals are still below threshold and by how much.
   - What revision instructions were given (pass 1 and pass 2).
   - Whether any revision pass caused degradation.
   - The agent's assessment of why the article resists improvement.
4. The article is NOT auto-published to any CMS. Publishing requires manual operator approval.
5. An email/webhook notification is sent to the user (if configured) alerting them to the flagged article.

---

## 9. Arabic Quality Adjustments

### The Problem

Standard content quality metrics are calibrated for English. Applying them directly to Arabic text produces systematically lower and misleading scores:

1. **Flesch-Kincaid is meaningless for Arabic.** The formula depends on syllable counting, which does not map to Arabic phonology. Arabic words have complex morphology (root + pattern system) where a single "word" can contain what English would express in 3-4 words. Flesch-Kincaid applied to Arabic text produces artificially high grade levels (typically 14-18) that incorrectly suggest the text is unreadable.

2. **Keyword density is inflated.** Arabic morphology means the same root appears in multiple surface forms (conjugations, derivations, broken plurals). Exact-match counting misses most keyword occurrences. A keyword density of 0.5% by exact match might be 2.8% when morphological variants are included.

3. **Heading structure norms differ.** Arabic editorial tradition uses fewer, longer headings. English SEO convention (6-10 H2s, 10-15 H3s) forces an unnatural structure on Arabic content. Arabic readers expect 4-7 major sections with 6-10 subsections.

4. **Word count differs.** Arabic is ~15% more compact than English for equivalent semantic content. An Arabic article of 1,000 words conveys roughly the same information as a 1,200-word English article. Requiring 1,200 minimum words forces unnecessary padding.

5. **RTL layout failures.** Missing `dir="rtl"` attributes, left-aligned text, and non-Arabic fonts render content unreadable even if the text itself is high quality.

### Arabic Content Detection

Detection threshold: >= 30% of text characters fall within Unicode range U+0600-U+06FF (Arabic block). This covers Arabic script letters, Arabic-Indic digits, and common Arabic punctuation.

```javascript
function detectArabic(text) {
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  const ratio = totalChars > 0 ? arabicChars / totalChars : 0;
  return {
    isArabic: ratio >= 0.30,
    ratio: ratio,
    arabicCharCount: arabicChars,
    totalCharCount: totalChars
  };
}
```

Mixed content (30-70% Arabic) triggers Arabic adjustments but with reduced confidence. The quality report notes the mixed-language detection.

### Arabic-Calibrated Readability (ARI-AR)

Since Flesch-Kincaid is inappropriate for Arabic, the Quality Gate uses an Arabic Readability Index (ARI-AR) calibrated for Modern Standard Arabic (MSA) and Gulf Arabic editorial content:

```
ARI-AR = (4.71 * (chars_per_word)) + (0.5 * (words_per_sentence)) - 21.43
```

Where:
- `chars_per_word` = total characters (excluding spaces and diacritics) / total words
- `words_per_sentence` = total words / total sentences
- Diacritics (tashkeel: U+064B-U+065F) are stripped before character counting

**Grade mapping (ARI-AR to 0-10 score):**

| ARI-AR Grade | Equivalent Reading Level | Readability Score |
| --- | --- | --- |
| 1-4 | Elementary | 6.0 (too simple for editorial) |
| 5-8 | General audience (target) | 8.0-9.0 |
| 9-12 | Advanced / academic | 7.0-7.5 |
| 13+ | Very complex | 5.0-6.0 |

The target range for Arabic content is ARI-AR 5-8 (general audience), with optimal being 6-7. This corresponds to content readable by educated Arabic speakers without requiring domain expertise.

### Morphological Keyword Density

Arabic keyword matching uses a simplified morphological approach that recognizes common root patterns:

1. **Extract the triliteral root** from the target keyword (most Arabic words derive from 3-consonant roots).
2. **Generate surface forms** by applying common patterns:
   - Active/passive participles
   - Verbal nouns (masdar)
   - Plural forms (sound and broken)
   - Definite article prefix (al-)
   - Common preposition prefixes (bi-, li-, wa-)
3. **Count all morphological variants** in the text.
4. **Calculate density** using variant count instead of exact match count.

```javascript
function arabicKeywordDensity(text, keyword) {
  const root = extractArabicRoot(keyword);  // Triliteral root extraction
  const variants = generateArabicVariants(root);  // Common morphological forms
  const pattern = new RegExp(variants.join('|'), 'g');
  const matches = (text.match(pattern) || []).length;
  const wordCount = text.split(/\s+/).length;
  return (matches / wordCount) * 100;
}
```

**Implementation note:** Full Arabic morphological analysis (like BAMA or AraMorph) is beyond scope for Phase 1. The simplified approach covers ~70% of morphological variants. Phase 2 may integrate a proper Arabic lemmatizer.

### Arabic-Adjusted Thresholds

| Check | English Threshold | Arabic Threshold | Reason |
| --- | --- | --- | --- |
| Content length | 1,200-2,500 words | 1,000-2,200 words | Arabic ~15% more compact |
| H2 count | 6-10 | 4-8 | Arabic uses fewer, longer sections |
| H3 count | 10-15 | 6-12 | Fewer subsections in Arabic editorial |
| Keyword in headings | 30-40% | 20-35% | Arabic headings are more descriptive/literary |
| Keyword density max | 2.5% | 3.5% (morphological) | Morphological counting inflates density |
| Intro length | 200-250 words | 170-220 words | Arabic compactness |
| Conclusion length | 150-200 words | 130-180 words | Arabic compactness |
| Paragraph sentences | 2-4 max | 2-5 max | Arabic sentences carry more information per sentence |

### RTL Validation Checks

When Arabic content is detected, the following checks become CRITICAL priority:

1. **`dir="rtl"` attribute** --- must be present on `<html>`, `<body>`, or the primary content container element. Checked via attribute regex, not CSS direction.

2. **Arabic font families** --- CSS must reference at least one of: Cairo, Tajawal, Amiri, Noto Sans Arabic, Noto Kufi Arabic, IBM Plex Arabic, Almarai, Changa, El Messiri, Lateef, Scheherazade, or Harmattan. Checked in `<style>` blocks and inline style attributes.

3. **Text alignment** --- no explicit `text-align: left` on content elements when Arabic detected. Either `text-align: right`, `text-align: start` (with RTL direction), or no explicit alignment (browser defaults to RTL).

4. **CSS logical properties** --- warning (not fail) if `margin-left`, `padding-left`, `float: left` used instead of `margin-inline-start`, `padding-inline-start`, `float: inline-start`.

5. **Numeral handling** --- info check for Arabic-Indic numerals vs Western Arabic numerals. Both are acceptable; the check reports which are used for consistency.

---

## 10. Auth & Permissions

### Role Matrix

| Action | Anonymous | Authenticated User | Admin |
| --- | --- | --- | --- |
| GET `/api/quality/score/:articleId` | Denied (401) | Own articles only (RLS) | All articles |
| GET `/api/quality/checklist/:articleId` | Denied (401) | Own articles only | All articles |
| GET `/api/quality/suggestions/:articleId` | Denied (401) | Own articles only | All articles |
| POST `/api/quality/bulk` | Denied (401) | Own articles only, max 10 | All articles, max 50 |
| POST `/api/quality/revise/:articleId` | Denied (401) | Own articles, max 2 passes | All articles, force reset allowed |
| GET `/api/quality/history/:articleId` | Denied (401) | Own articles only | All articles |
| POST `/api/quality/score` (standalone) | Denied (401) | Allowed (no article_id link) | Allowed |
| View platform-wide quality metrics | Denied (401) | Denied (403) | Allowed |
| Modify scoring thresholds | Denied (401) | Denied (403) | Allowed |
| Configure custom checklist items (55-60) | Denied (401) | Own custom checks only | All users' custom checks |
| Override flagged_for_review (force publish) | Denied (401) | Denied (403) | Allowed |

### Authentication Flow

1. All `/api/quality/*` requests require `Authorization: Bearer <jwt_token>` header.
2. Bridge server validates JWT against Supabase Auth.
3. User ID extracted from JWT claims.
4. Supabase RLS policies enforce row-level access on `quality_scores` and `quality_revisions` tables.
5. Admin role is determined by `raw_user_meta_data->>'role' = 'admin'` on the `auth.users` record.

### Rate Limiting

| Endpoint | User Limit | Admin Limit |
| --- | --- | --- |
| GET endpoints (read) | 60 requests/minute | 300 requests/minute |
| POST `/api/quality/score` (standalone) | 10 requests/minute | 60 requests/minute |
| POST `/api/quality/bulk` | 5 requests/minute, max 10 articles per batch | 20 requests/minute, max 50 articles per batch |
| POST `/api/quality/revise/:articleId` | 5 requests/minute | 30 requests/minute |

Rate limiting is enforced in-memory on the bridge server (sufficient for localhost/single-instance). Production deployment requires Redis-backed rate limiting.

---

## 11. Validation Rules

### VR-01: Article HTML Required

All scoring endpoints that accept HTML input require non-empty HTML string. Minimum 100 characters. Maximum 500,000 characters (prevents abuse with massive payloads). Returns 400 if invalid.

### VR-02: Article ID Format

All `:articleId` path parameters must be valid UUID v4 format. Regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`. Returns 400 if malformed.

### VR-03: Article Ownership

Before scoring, verify that `articles.user_id` matches the authenticated user. Supabase RLS enforces this at the database level, but the bridge server also validates before invoking the engine/agent to avoid unnecessary computation. Returns 403 if not owned.

### VR-04: Bulk Article Limit

POST `/api/quality/bulk` rejects requests with `article_ids` array length > 10 (50 for admin). Also rejects duplicate article_ids within a single request. Returns 400 with specific message.

### VR-05: Revision Number Bounds

`revision_number` must be 0, 1, or 2. Any attempt to create a quality_score with revision_number > 2 is rejected (database CHECK constraint). POST `/api/quality/revise` rejects requests when current revision_number is already 2 (unless `force: true` with admin role).

### VR-06: Score Range Enforcement

All signal scores must be 0.00-10.00 (database CHECK constraints). The composite formula is validated to confirm it produces a result in this range before storing. If any signal score is null (unavailable), it is excluded from the composite and weights are redistributed.

### VR-07: Keyword Parameter for Full Scoring

If `target_keyword` is not provided in standalone mode, the following checks return `info` status instead of pass/fail: keyword frequency, keyword density, keyword in title, keyword in first paragraph, keyword in H2, keyword in conclusion, LSI keywords. The technical_seo signal is computed without keyword-dependent items.

### VR-08: Persona Parameter for Voice Match

If `target_persona_id` is provided, it must reference an existing `writer_personas` record owned by the authenticated user. Returns 400 if persona not found. Voice match scoring proceeds only with a valid persona.

### VR-09: Language Hint Validation

If `language_hint` is provided, it must be a valid ISO 639-1 code (2-letter). Accepted values: `en`, `ar`, `fr`, `es`, `de`, `tr`, `ur`. The system auto-detects language from content regardless, but the hint biases detection for mixed-language content.

### VR-10: Checklist Results Integrity

Before storing `checklist_results` JSONB, validate that the array contains exactly `checklist_total` items (default 60). Each item must have all required fields: `id`, `category`, `label`, `status`. Status must be one of: `pass`, `fail`, `warning`, `info`. Reject storage if integrity check fails (indicates engine bug).

### VR-11: HTML Sanitization

Article HTML passed to the scoring engine is NOT sanitized for rendering (it never reaches a browser via the scoring path). However, the engine validates that the HTML does not contain `<script>` tags or event handler attributes (`onclick`, `onerror`, etc.) that could indicate injection. If detected, the article is scored with a warning note but not rejected.

### VR-12: Concurrent Scoring Prevention

Only one scoring operation per article_id can run at a time. If a scoring request arrives while another is in progress for the same article, the second request receives 409 Conflict with message "Scoring already in progress for this article". Enforced via in-memory lock map in the bridge server.

---

## 12. Error Handling

### EH-01: LLM API Unavailable

**Trigger:** Claude API returns 5xx, timeout (>30s), or rate limit (429) during agent evaluation.

**Impact:** Cannot evaluate 5 of 7 rubric signals (E-E-A-T, Topical Completeness, Voice Match, AI Detection, Freshness). Technical SEO and Readability are engine-computed and unaffected.

**Response:**
1. Fall back to engine-only scoring (checklist + Technical SEO + Readability signals).
2. Mark unavailable signals as `null` in the response with `"status": "unavailable"` and `"reason": "llm_api_error"`.
3. Compute composite score from available signals only (Technical SEO 50%, Readability 50%).
4. Set `passed = true` if checklist_percentage >= 85% (relaxed threshold for degraded mode).
5. Log the LLM error with full context for debugging.
6. Retry agent evaluation once after 10-second backoff. If retry also fails, return engine-only results.
7. Include `"degraded_mode": true` in the response metadata.

### EH-02: Article HTML Malformed

**Trigger:** HTML parsing (regex-based) encounters structure it cannot parse: unclosed tags, deeply nested malformed elements, binary content in HTML string.

**Impact:** Some checklist items may return incorrect results due to parser confusion.

**Response:**
1. Run checklist on best-effort basis. Parse what is parseable.
2. For each unparseable section, the affected checklist items return status `warning` with actual value `"unable to evaluate - malformed HTML"`.
3. Add a top-level warning to the response: `"html_quality": "degraded"` with list of unparseable sections.
4. Do NOT fail the article solely due to malformed HTML (it may be a parser limitation, not an article quality issue).
5. Log the malformed HTML pattern for parser improvement.

### EH-03: Writer Persona Not Found

**Trigger:** `target_persona_id` is provided but the persona record does not exist in `writer_personas`, or the Voice Intelligence Service is not yet deployed (Phase 1).

**Impact:** Voice match signal cannot be evaluated.

**Response:**
1. Set `voice_match_score = 5.0` (neutral).
2. Exclude voice match from pass/fail evaluation (the 7.0 threshold does not apply).
3. Redistribute voice match weight: E-E-A-T gets +7.5% (total 27.5%), Topical Completeness gets +7.5% (total 27.5%).
4. Include `"voice_match_status": "persona_unavailable"` in rubric_details.

### EH-04: Revision Loop Timeout

**Trigger:** A single revision pass (Draft Writer re-generation + Quality Gate re-evaluation) exceeds 5-minute timeout.

**Impact:** Auto-revision cannot complete. Article remains at pre-revision quality level.

**Response:**
1. Cancel the Draft Writer subprocess if still running.
2. Keep the pre-revision article version (do not use partially-generated revision).
3. Mark the revision as `status: "timed_out"` in `quality_revisions` table.
4. If this was revision pass 1: attempt revision pass 2 (different instructions, fresh attempt).
5. If this was revision pass 2: flag for human review.
6. Include timeout information in the quality report.
7. Log timeout duration and article metadata for capacity planning.

### EH-05: Bulk Scoring Queue Backup

**Trigger:** Bulk scoring queue has more than 50 pending articles across all users.

**Impact:** New bulk requests may experience significant delays.

**Response:**
1. New bulk requests receive 202 Accepted with `estimated_completion_seconds` based on queue depth.
2. Process in FIFO order --- no priority between users (fair scheduling).
3. If queue depth exceeds 100, reject new bulk requests with 503 and `Retry-After` header.
4. Admin endpoint `/api/quality/admin/queue-status` shows current queue depth and estimated drain time.

### EH-06: Competitor SERP Data Unavailable

**Trigger:** Data Ingestion Service has no cached SERP data for the target keyword. Occurs when the keyword is new or the ingestion pipeline has not yet processed it.

**Impact:** Topical completeness cannot compare against actual competitors.

**Response:**
1. Fall back to keyword intent-based subtopic estimation. The agent generates expected subtopics based on keyword semantics rather than actual SERP data.
2. Cap topical completeness score at 8.0 maximum (reduced confidence --- cannot know if competitors cover more).
3. Mark the signal with `"data_source": "intent_estimation"` instead of `"data_source": "serp_analysis"`.
4. Include suggestion: "SERP competitor data unavailable. Score may improve when competitor analysis completes."

### EH-07: Database Write Failure

**Trigger:** Supabase returns error when attempting to INSERT/UPDATE quality_scores or quality_revisions.

**Impact:** Score was computed (expensive operation) but cannot be persisted.

**Response:**
1. Return the computed score in the API response (user still gets their results).
2. Retry the database write 3 times with exponential backoff (1s, 3s, 9s).
3. If all retries fail, log the full score payload to the structured logger with level `error` and tag `quality_score_write_failure`.
4. Include `"persisted": false` in the response metadata so the client knows to avoid caching this response.
5. Admin alert: if more than 5 write failures occur in 10 minutes, trigger platform health alert.

### EH-08: Score Calculation Overflow/NaN

**Trigger:** Division by zero (zero sentences, zero words, zero paragraphs) or arithmetic overflow in scoring formulas.

**Impact:** One or more signal scores produce NaN or Infinity.

**Response:**
1. Any signal that produces NaN or Infinity is set to 0.0 with status `"calculation_error"`.
2. The composite score is calculated excluding errored signals (weight redistribution).
3. The article is flagged for human review with `"reason": "scoring_calculation_error"`.
4. Log the specific formula, inputs, and output for debugging.
5. This indicates an article with extreme characteristics (zero-length content, single sentence, etc.) or an engine bug.

---

## 13. Edge Cases

### EC-01: Very Short Articles (< 500 words)

Articles under 500 words are too short for meaningful keyword density, topical completeness, or structural analysis. The engine:
- Fails `content_structure_01` (minimum 1,200 words).
- Sets topical completeness to max 5.0/10 (insufficient content to assess coverage).
- Skips paragraph variety and section balance checks (insufficient data).
- Reduces minimum internal link count to 3 (proportional to length).
- Still evaluates metadata, images, heading hierarchy, and other structural checks normally.
- Notes in the response: `"article_length_class": "short"`.

### EC-02: Very Long Articles (> 5,000 words)

Articles over 5,000 words receive additional checks:
- Section balance becomes more important (risk of "mega-sections").
- H2 count minimum scales: 5,000-7,500 words expects 10-14 H2s; 7,500+ expects 14-18 H2s.
- H3 count minimum scales proportionally.
- Content length check returns `warning` (not fail) for >3,000 words and `info` for >5,000.
- Agent evaluation may take longer (25-40 seconds). Timeout extended proportionally.
- Keyword density thresholds remain constant (percentage-based, self-scaling).

### EC-03: Multilingual Articles (Mixed Arabic/English)

Articles with both Arabic and English content (Arabic ratio 30-70%):
- Arabic readability (ARI-AR) computed on Arabic text portions only.
- English readability (Flesch-Kincaid) computed on English text portions only.
- Final readability score = weighted average by character count proportion.
- Keyword density computed separately for each language using appropriate method (morphological for Arabic, exact-match for English).
- RTL checks are triggered (Arabic threshold met) but the engine validates that RTL applies only to Arabic sections, not English sections (bidirectional layout support).
- `language_detected` is set to `"mixed:ar:en"` with the Arabic ratio.

### EC-04: Articles With No Target Keyword

When no `target_keyword` is provided (standalone mode without keyword context):
- All keyword-dependent checklist items (18-24) return `info` status with message "No target keyword provided".
- Keyword density, keyword frequency, keyword in title/headings/conclusion are not evaluated.
- E-E-A-T dimension 1 (Primary keyword targeting) scores 0 but is excluded from the total (9 dimensions, max 27).
- Topical completeness falls back to structural completeness: evaluates subtopic diversity by heading variance rather than keyword coverage.
- Technical SEO score is computed without keyword-dependent category items (Keyword Optimization weight redistributed to Content Structure).

### EC-05: Image-Heavy Articles

Articles with image count > 2x the word-to-image ratio (more than 1 image per 150 words):
- Image checklist items are evaluated normally (alt text, filenames, etc.).
- Content length check counts words only (image captions are included, alt text is not).
- Readability score is not penalized for frequent image interruptions in text flow.
- Additional info check: "High image-to-text ratio. Ensure images are content-relevant, not decorative filler."
- Page speed signals dimension (E-E-A-T #9) is more strictly evaluated --- many images require lazy loading and optimization.

### EC-06: Code-Heavy Articles (Technical/Developer Content)

Articles with significant code blocks (detected by `<pre><code>`, `<code>`, or triple backtick fenced blocks):
- Code blocks are excluded from word count, sentence count, and readability calculations.
- Code blocks are excluded from keyword density calculations (keywords in code are not "natural mentions").
- Heading count thresholds are relaxed by 20% (code-heavy articles tend to have fewer prose sections).
- A code-heavy article is detected when code blocks constitute >20% of total content by character count.
- Paragraph length checks exclude paragraphs that are entirely or primarily code.
- The quality report notes `"content_type": "technical"` for operator awareness.

### EC-07: Articles With Embedded Video

Articles containing `<iframe>` elements pointing to YouTube, Vimeo, or other video platforms:
- Video embeds count toward "media richness" but not toward image counts.
- Content image count check (images_02) is relaxed: minimum 2 images (instead of 4) when 2+ videos are present.
- Page speed signals dimension evaluates whether video embeds use lazy loading (iframe with `loading="lazy"` or facade/thumbnail pattern).
- Additional info note: "Consider adding video transcript for accessibility and SEO."

### EC-08: Empty or Minimal HTML

HTML input that produces < 50 words after tag stripping:
- All 60 checklist items return `fail` status.
- All 7 signal scores are set to 0.0.
- `passed = false`, `flagged_for_review = true`.
- Response includes: `"error_class": "insufficient_content"`.
- Auto-revision is NOT triggered (nothing to revise --- this indicates a generation failure).
- The Dashboard shows this as a "Generation Failure" rather than a quality issue.

### EC-09: HTML Without Standard Structure

HTML that lacks `<html>`, `<head>`, or `<body>` tags (common for article fragments or CMS content that is body-only):
- Engine treats entire input as body content.
- Metadata checks (title tag, meta description) return `fail` if the metadata is truly absent, or `info` with "Metadata evaluation requires full HTML document. Fragment mode: metadata checks skipped."
- Heading hierarchy check starts from whatever heading level appears first (if first heading is H2, that is acceptable for a fragment).
- The response notes `"input_type": "fragment"` to distinguish from full HTML documents.

### EC-10: Rapid Re-scoring (Same Article, Multiple Requests)

When the same article is scored multiple times in quick succession (race condition):
- The concurrent scoring lock (VR-12) prevents simultaneous engine+agent runs.
- If a user submits 5 rapid re-score requests, the first executes, requests 2-4 receive 409 Conflict, and request 5 receives 409 Conflict.
- Cached results are returned by GET endpoints without re-evaluation.
- POST `/api/quality/revise` is similarly locked per article_id.

### EC-11: Articles With Custom HTML Components

Articles containing Web Components (`<custom-element>`), Vue/React-rendered HTML, or non-standard HTML elements:
- The engine ignores unknown elements (does not fail on them).
- Content inside custom elements is included in word count and text analysis if it contains visible text.
- Custom elements with shadow DOM are opaque to the engine (content inside shadow DOM is not analyzed).
- The quality report notes: `"custom_elements_detected": ["custom-chart", "data-widget"]` for operator awareness.

### EC-12: Scoring an Article That Was Already Manually Edited

When a user edits an article via the bridge server's edit UI and then re-scores:
- A new quality_score row is created with `revision_number = 0` (manual edit resets the revision counter).
- The previous score chain (revision 0, 1, 2) remains in the database for historical reference.
- The history endpoint shows the manual edit boundary.
- This is a new scoring cycle, not a continuation of the auto-revision loop.

---

## 14. Performance

### Latency Targets

| Operation | Target | Maximum | Notes |
| --- | --- | --- | --- |
| Engine-only scoring (60-point checklist) | < 500ms | 2 seconds | Pure HTML parsing and math. No network calls. |
| Agent evaluation (7-signal rubric) | < 20 seconds | 30 seconds | Dominated by LLM API call. Single Claude request with structured output. |
| Full scoring (engine + agent) | < 25 seconds | 30 seconds | Engine and agent run in parallel. Total = max(engine, agent) + overhead. |
| Standalone scoring (no SERP data) | < 25 seconds | 30 seconds | Same as full scoring but skips SERP-dependent signals. |
| Bulk scoring (per article) | < 30 seconds | 45 seconds | Sequential processing. Total batch time = N * per-article time. |
| Revision loop (per pass) | < 3 minutes | 5 minutes | Draft Writer regeneration (~2 min) + Quality Gate re-score (~25 sec). |
| GET endpoints (cached read) | < 100ms | 500ms | Database read only. No computation. |

### Parallel Execution Strategy

Engine and agent evaluation run in parallel to minimize total latency:

```javascript
async function scoreArticle(html, options) {
  // Phase 1: Parallel execution
  const [engineResults, agentResults] = await Promise.all([
    runEngine(html, options),      // 60-point checklist + readability + technical SEO
    runAgent(html, options)         // E-E-A-T + topical + voice + AI detection + freshness
  ]);

  // Phase 2: Merge results (< 10ms)
  const compositeScore = computeComposite(engineResults, agentResults);
  const suggestions = generateSuggestions(engineResults, agentResults);

  return { engineResults, agentResults, compositeScore, suggestions };
}
```

If the agent fails or times out, the engine results are returned immediately (degraded mode). The agent failure does not delay the engine response.

### Caching Strategy

1. **Score caching:** Quality scores are persisted to the database on first computation. All subsequent GET requests return cached data. No automatic cache invalidation (scores are valid until article content changes).

2. **SERP data caching:** Competitor SERP data is cached for 7 days per keyword in the Data Ingestion Service. The Quality Gate does not re-fetch SERP data --- it reads from the cache. Stale SERP data (>7 days) triggers a background refresh but the current cached data is used for scoring.

3. **Agent evaluation caching:** LLM evaluations are cached per article content hash (SHA-256 of HTML). If the same article HTML is scored again (e.g., after a failed write to DB), the cached agent evaluation is reused. Cache TTL: 24 hours.

4. **Engine result caching:** Engine results are deterministic. Same input = same output. Cached by content hash indefinitely. Cache is in-memory (LRU, max 500 entries) for the bridge server process.

### Batch Scoring Optimization

Bulk scoring optimizes by:
1. Pre-fetching all article HTML in a single database query (batch read).
2. Processing articles sequentially (LLM rate limit consideration) but with engine results computed in parallel across all articles.
3. Sharing SERP data across articles targeting the same keyword within the batch.
4. Returning partial results as they complete (SSE/polling, not waiting for entire batch).

### Resource Consumption

| Resource | Per-Article | At Scale (50 articles/day) |
| --- | --- | --- |
| LLM tokens (input) | ~8,000-15,000 (article HTML + evaluation prompt) | ~400,000-750,000/day |
| LLM tokens (output) | ~2,000-4,000 (structured evaluation response) | ~100,000-200,000/day |
| Database rows | 1-3 (1 score + 0-2 revisions) | 50-150/day |
| Database storage | ~5-15 KB per score (JSONB heavy) | ~250-750 KB/day |
| Memory (engine) | ~2-5 MB per article (HTML parsing) | Released after scoring |
| Memory (cache) | ~50-100 KB per cached score | ~25-50 MB for 500-entry LRU |

---

## 15. Testing Requirements

### Unit Tests: Engine --- `test/quality-gate-engine.test.js`

#### Content Structure Checks (17 tests)

| Test Name | Description |
| --- | --- |
| `engine_cs01_content_length_pass` | HTML with 1,847 words returns `pass` for content_structure_01 |
| `engine_cs01_content_length_fail_short` | HTML with 800 words returns `fail` for content_structure_01 |
| `engine_cs01_content_length_fail_long` | HTML with 3,500 words returns `fail` for content_structure_01 |
| `engine_cs01_content_length_warn` | HTML with 2,800 words returns `warning` for content_structure_01 |
| `engine_cs02_h1_count_pass` | HTML with exactly 1 H1 returns `pass` |
| `engine_cs02_h1_count_fail_zero` | HTML with 0 H1 returns `fail` |
| `engine_cs02_h1_count_fail_multiple` | HTML with 3 H1 returns `fail` |
| `engine_cs03_h2_count_pass` | HTML with 8 H2 returns `pass` |
| `engine_cs03_h2_count_fail` | HTML with 2 H2 returns `fail` |
| `engine_cs04_h3_count_pass` | HTML with 12 H3 returns `pass` |
| `engine_cs06_toc_present_pass` | HTML with TOC element and 6 anchor links returns `pass` |
| `engine_cs06_toc_missing_fail` | HTML without TOC element returns `fail` |
| `engine_cs09_tables_pass` | HTML with 2 tables (1 comparison) returns `pass` |
| `engine_cs11_faq_pass` | HTML with FAQ section, 10 questions returns `pass` |
| `engine_cs11_faq_missing_fail` | HTML without FAQ section returns `fail` |
| `engine_cs13_intro_length_pass` | HTML with 230-word intro returns `pass` |
| `engine_cs17_section_balance_pass` | HTML with no section >30% of total returns `pass` |

#### Keyword Optimization Checks (7 tests)

| Test Name | Description |
| --- | --- |
| `engine_kw01_frequency_pass` | Keyword appears 12 times, returns `pass` |
| `engine_kw01_frequency_fail_low` | Keyword appears 3 times, returns `fail` |
| `engine_kw01_frequency_fail_high` | Keyword appears 25 times, returns `fail` |
| `engine_kw02_density_pass` | Keyword density 1.8%, returns `pass` |
| `engine_kw02_density_fail` | Keyword density 3.2%, returns `fail` |
| `engine_kw04_in_title_pass` | Keyword present in `<title>` tag, returns `pass` |
| `engine_kw05_first_paragraph_pass` | Keyword in first 100 words, returns `pass` |

#### Metadata Checks (4 tests)

| Test Name | Description |
| --- | --- |
| `engine_md01_title_length_pass` | Title tag 55 characters, returns `pass` |
| `engine_md01_title_length_warn` | Title tag 65 characters, returns `warning` |
| `engine_md02_meta_desc_pass` | Meta description 150 characters, returns `pass` |
| `engine_md02_meta_desc_fail_missing` | No meta description tag, returns `fail` |

#### Internal Linking Checks (5 tests)

| Test Name | Description |
| --- | --- |
| `engine_il01_count_pass` | 10 internal links, returns `pass` |
| `engine_il01_count_fail` | 2 internal links, returns `fail` |
| `engine_il03_generic_anchors_warn` | Links with "click here" anchor, returns `warning` |
| `engine_il04_early_placement_pass` | Internal link in first 150 words, returns `pass` |
| `engine_il05_no_clustering_pass` | Links distributed across sections, returns `pass` |

#### External Links Checks (3 tests)

| Test Name | Description |
| --- | --- |
| `engine_el01_authority_count_pass` | 3 external links to authority domains, returns `pass` |
| `engine_el02_mixed_follow_pass` | Mix of dofollow and nofollow, returns `pass` |
| `engine_el03_authority_check_warn` | Link to unknown domain, returns `warning` |

#### Images Checks (4 tests)

| Test Name | Description |
| --- | --- |
| `engine_img01_featured_pass` | Featured image 1200x628, returns `pass` |
| `engine_img01_featured_fail` | No featured image, returns `fail` |
| `engine_img03_alt_text_pass` | All images have alt text, returns `pass` |
| `engine_img03_alt_text_fail` | Image missing alt text, returns `fail` |

#### Technical Formatting Checks (4 tests)

| Test Name | Description |
| --- | --- |
| `engine_tf01_heading_hierarchy_pass` | H1>H2>H3 in order, returns `pass` |
| `engine_tf01_heading_hierarchy_fail` | H3 before any H2, returns `fail` |
| `engine_tf02_short_paragraphs_pass` | Average 3 sentences per paragraph, returns `pass` |
| `engine_tf06_white_space_warn` | 200-word block without break, returns `warning` |

#### Internationalization Checks (5 tests)

| Test Name | Description |
| --- | --- |
| `engine_i18n01_arabic_detection_true` | 60% Arabic characters, returns `isArabic: true` |
| `engine_i18n01_arabic_detection_false` | English text, returns `isArabic: false` |
| `engine_i18n01_arabic_detection_mixed` | 35% Arabic, returns `isArabic: true` (above 30% threshold) |
| `engine_i18n02_rtl_attribute_fail` | Arabic content without `dir="rtl"`, returns `fail` |
| `engine_i18n03_arabic_fonts_warn` | Arabic content without Arabic font family, returns `warning` |

### Unit Tests: Scoring Formula --- `test/quality-scoring.test.js`

| Test Name | Description |
| --- | --- |
| `scoring_composite_known_values` | Known signal inputs produce expected composite score (exact math verification) |
| `scoring_composite_all_perfect` | All signals 10.0, composite = 10.0 |
| `scoring_composite_all_zero` | All signals 0.0, composite = 0.0 |
| `scoring_composite_boundary_7_0` | Signals at exactly 7.0 each, composite = 7.0 |
| `scoring_weights_sum_to_one` | Signal weights 0.20+0.20+0.15+0.15+0.10+0.10+0.10 = 1.00 |
| `scoring_eeat_normalization` | E-E-A-T total 24/30 normalizes to 8.0/10 |
| `scoring_eeat_grade_A_boundary` | E-E-A-T total 27 maps to grade "A" |
| `scoring_eeat_grade_B_boundary` | E-E-A-T total 22 maps to grade "B" |
| `scoring_eeat_grade_C_boundary` | E-E-A-T total 16 maps to grade "C" |
| `scoring_eeat_grade_D_boundary` | E-E-A-T total 10 maps to grade "D" |
| `scoring_eeat_grade_F_boundary` | E-E-A-T total 9 maps to grade "F" |
| `scoring_technical_seo_category_weights` | Technical SEO from checklist uses correct category weights (BR-07) |
| `scoring_readability_fk_known_text` | Known English text produces expected Flesch-Kincaid grade |
| `scoring_readability_target_range` | FK grade 9.5 produces readability_score ~8.0 |
| `scoring_ai_detection_formula` | Known sub-score inputs produce expected AI detection score |
| `scoring_voice_match_distance_to_score` | Distance 0.0 = 10.0, distance 0.3 = 5.5, distance 0.67 = 0.0 |
| `scoring_checklist_percentage_with_warnings` | Checklist with 50 pass, 3 fail, 5 warning, 2 info: (50+2+(5*0.5))/60 = 89.17% |
| `scoring_weight_redistribution_no_voice` | Without voice persona, E-E-A-T=27.5%, Topical=27.5% |
| `scoring_weight_redistribution_no_serp` | Without SERP data, E-E-A-T=30%, AI Detection=25% |

### Unit Tests: Auto-Revision --- `test/quality-revision.test.js`

| Test Name | Description |
| --- | --- |
| `revision_triggers_when_signal_below_7` | Article with voice_match 5.8 triggers revision |
| `revision_does_not_trigger_when_all_pass` | Article with all signals >= 7.0 does not trigger revision |
| `revision_max_2_passes_enforced` | After revision_number 2, no further revision triggered |
| `revision_flags_for_review_after_2_fails` | Article failing after 2 passes has flagged_for_review = true |
| `revision_instructions_include_failing_signals` | Instructions contain only signals scoring < 7.0 |
| `revision_instructions_include_checklist_failures` | Instructions contain CRITICAL checklist failures |
| `revision_pass_2_more_specific_than_pass_1` | Pass 2 instructions include section-level specific fixes |
| `revision_degradation_guard_triggers` | Revision that decreases overall_score is rolled back |
| `revision_degradation_guard_signal_check` | Revision where any signal drops >1.0 triggers warning |
| `revision_timeout_at_5_minutes` | Revision exceeding 5 minutes is cancelled and marked timed_out |
| `revision_preserves_passing_sections` | Revision instructions include preserve_sections for passing content |
| `revision_critical_item_triggers_regardless_of_score` | CRITICAL checklist fail triggers revision even if overall > 7.0 |

### Unit Tests: Arabic Quality --- `test/quality-arabic.test.js`

| Test Name | Description |
| --- | --- |
| `arabic_detection_30_percent_threshold` | Text with exactly 30% Arabic characters returns isArabic: true |
| `arabic_detection_29_percent_below` | Text with 29% Arabic characters returns isArabic: false |
| `arabic_readability_ari_ar_computation` | Known Arabic text produces expected ARI-AR grade |
| `arabic_readability_not_flesch_kincaid` | Arabic text uses ARI-AR, not Flesch-Kincaid |
| `arabic_keyword_density_morphological` | Arabic keyword with root "k-t-b" matches conjugated forms |
| `arabic_thresholds_content_length` | Arabic content uses 1,000-2,200 word range |
| `arabic_thresholds_h2_count` | Arabic content uses 4-8 H2 range |
| `arabic_thresholds_h3_count` | Arabic content uses 6-12 H3 range |
| `arabic_rtl_validation_critical` | RTL check is CRITICAL priority when Arabic detected |
| `arabic_font_validation_warn` | Missing Arabic font is WARNING when Arabic detected |
| `arabic_mixed_content_separate_readability` | Mixed Arabic/English computes separate readability per language |

### Integration Tests: API --- `test/quality-api.test.js`

| Test Name | Description |
| --- | --- |
| `api_score_returns_200_valid_article` | GET `/api/quality/score/:id` returns 200 with correct structure |
| `api_score_returns_404_unknown_article` | GET with non-existent article_id returns 404 |
| `api_score_returns_401_no_auth` | GET without auth header returns 401 |
| `api_score_returns_403_other_user` | GET for another user's article returns 403 |
| `api_checklist_returns_60_items` | GET `/api/quality/checklist/:id` returns exactly 60 checklist items |
| `api_suggestions_grouped_by_impact` | GET `/api/quality/suggestions/:id` returns critical/recommended/optional groups |
| `api_bulk_max_10_articles` | POST `/api/quality/bulk` with 11 articles returns 400 |
| `api_bulk_returns_202_accepted` | POST `/api/quality/bulk` with 5 articles returns 202 with batch_id |
| `api_revise_returns_409_after_2_passes` | POST `/api/quality/revise/:id` after 2 passes returns 409 |
| `api_revise_admin_force_reset` | POST `/api/quality/revise/:id` with force=true as admin succeeds |
| `api_standalone_score_returns_200` | POST `/api/quality/score` with raw HTML returns 200 |
| `api_standalone_no_keyword_info_status` | Standalone without keyword returns keyword checks as `info` |
| `api_rate_limit_enforcement` | 11th request in 1 minute returns 429 |
| `api_concurrent_scoring_prevention` | Second scoring request for same article returns 409 |
| `api_history_returns_revision_chain` | GET `/api/quality/history/:id` returns all revisions in order |

### Integration Tests: LLM Degradation --- `test/quality-degradation.test.js`

| Test Name | Description |
| --- | --- |
| `degradation_llm_unavailable_returns_engine_only` | When LLM returns 500, response includes engine scores with degraded_mode: true |
| `degradation_llm_unavailable_technical_seo_intact` | Technical SEO signal computed normally in degraded mode |
| `degradation_llm_unavailable_readability_intact` | Readability signal computed normally in degraded mode |
| `degradation_llm_unavailable_relaxed_threshold` | Degraded mode uses checklist_percentage >= 85% for pass |
| `degradation_agent_timeout_returns_partial` | Agent timeout returns engine results within 30 seconds total |

### Test Fixtures

All tests use shared HTML fixture files in `test/fixtures/`:

| Fixture | Description |
| --- | --- |
| `perfect-article.html` | Article passing all 60 checks and all 7 signals at >= 8.0 |
| `failing-article.html` | Article failing 12 checklist items and 3 signals below 7.0 |
| `minimal-article.html` | 200-word article testing short content edge case |
| `arabic-article.html` | Full Arabic article for i18n testing |
| `mixed-language-article.html` | 50/50 Arabic/English for mixed content testing |
| `code-heavy-article.html` | Developer tutorial with >20% code blocks |
| `image-heavy-article.html` | Article with 15 images and minimal text |
| `no-metadata-article.html` | Body-only HTML fragment without head/meta |
| `malformed-article.html` | Deliberately malformed HTML for parser resilience testing |

---

## Files

| File | Purpose |
| --- | --- |
| `engine/quality-gate.js` | 60-point SEO checklist engine. Parses HTML, evaluates all 60 checks, computes readability, Arabic detection, technical SEO score. Port from `old-seo-blog-checker/lib/seo-analyzer.ts` + `seo-checklist.ts`. |
| `engine/quality-suggestions.js` | Actionable fix suggestion generator. Groups suggestions by impact/effort, generates specific rewrite instructions. Port from `old-seo-blog-checker/lib/seo-suggestions.ts`. |
| `agents/quality-gate.md` | Quality Gate agent prompt. Evaluates 7-signal rubric using LLM. Structured output for E-E-A-T, topical completeness, voice match, AI detection, freshness. |
| `bridge/routes/quality.js` | API route handlers for all `/api/quality/*` endpoints. Orchestrates engine + agent evaluation, manages revision loop, handles bulk scoring. |
| `migrations/013-quality-scores.sql` | quality_scores table, quality_revisions table, RLS policies, indexes, trigger functions. |
| `test/quality-gate-engine.test.js` | Unit tests for the 60-point checklist engine. |
| `test/quality-scoring.test.js` | Unit tests for scoring formulas and weight calculations. |
| `test/quality-revision.test.js` | Unit tests for auto-revision loop logic. |
| `test/quality-arabic.test.js` | Unit tests for Arabic quality adjustments. |
| `test/quality-api.test.js` | Integration tests for API endpoints. |
| `test/quality-degradation.test.js` | Integration tests for LLM degradation fallback. |
| `test/fixtures/*.html` | HTML fixture files for testing. |

---

## Metrics

| Metric | Target |
| --- | --- |
| First-pass quality rate | >= 60% of articles pass on first evaluation (no revision needed) |
| Post-revision pass rate | >= 90% of articles pass after 1-2 revision passes |
| Human review flag rate | <= 10% of articles flagged for human review |
| Checklist evaluation time (engine only) | < 500ms per article |
| Full evaluation time (engine + agent) | < 25 seconds per article |
| Revision loop total time | < 5 minutes per revision pass |
| Scoring consistency (engine) | 100% identical results for identical inputs |
| Agent scoring variance | < 0.5 point standard deviation across 5 evaluations of same article |
| Average overall score (delivered articles) | >= 7.5 |
| Revision degradation rate | < 5% of revisions produce lower overall_score |
