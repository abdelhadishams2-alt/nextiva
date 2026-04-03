# Spec 05: Quality Gate — 60-Point SEO Checklist Engine

**Status:** Implementation-Ready
**Priority:** Must Have (MoSCoW #25, #26, #27, #46, #47)
**Phase:** B (Weeks 7-14)
**Effort:** Backend L (2-4 weeks), Frontend M (1-2 weeks)
**Dependencies:** None (standalone engine; voice match scoring deferred to Phase C)
**Owner:** ChainIQ Platform Engineer
**Port Source:** `old-seo-blog-checker/lib/seo-analyzer.ts`, `seo-checklist.ts`, `seo-suggestions.ts`

---

## 1. Feature Overview

### What

A deterministic scoring engine that evaluates any article HTML against 60 SEO checks across 8 categories, produces a composite quality score using a 7-signal weighted rubric, and generates actionable fix suggestions. When integrated into the generation pipeline, articles scoring below 7/10 on any signal trigger an auto-revision loop (max 2 passes). A dedicated Quality Gate agent (`agents/quality-gate.md`) orchestrates evaluation and revision decisions.

### Why

Quality scoring is the difference between "generates content" and "generates GOOD content." Every competitor offers generation; none offer a deterministic, auditable quality gate with auto-revision. The 60-point checklist is ported from a proven codebase (`old-seo-blog-checker`) and is the single most requested feature gap (feature-gap-matrix priority #1). The SRMG pilot requires measurable quality assurance before any content reaches production.

### Where

- **Backend:** `engine/quality-gate.js` (checklist engine + scoring), `engine/quality-suggestions.js` (fix generator)
- **Agent:** `agents/quality-gate.md` (SKILL.md orchestration)
- **API:** `bridge/routes/quality.js` (endpoints)
- **Frontend:** Quality Report tab on article detail page, score ring component, checklist accordion, suggestion cards

### Effort Breakdown

| Component | Effort | Lines (est.) |
|-----------|--------|-------------|
| ContentMetrics extraction | M | ~200 |
| 60-point checklist engine | L | ~400 |
| 7-signal weighted scoring | M | ~150 |
| E-E-A-T 10-dimension rubric | M | ~200 |
| Arabic/i18n detection | S | ~30 |
| Readability (Flesch-Kincaid) | S | ~40 |
| Fix suggestions engine | M | ~250 |
| Quality Gate agent (markdown) | S | ~100 |
| API endpoints (2) | S | ~80 |
| Auto-revision loop integration | M | ~120 |
| **Total backend** | **L** | **~1,570** |

---

## 2. User Stories

**US-5.1** — Given a generated article HTML, when the quality gate runs, then I receive a score breakdown across all 7 signals with pass/fail per check so I can assess article readiness.

**US-5.2** — Given an article scoring below 7/10 on E-E-A-T, when auto-revision is enabled, then the draft-writer is re-invoked with targeted fix instructions and the revised article is re-scored automatically (max 2 passes).

**US-5.3** — Given an Arabic article (Unicode U+0600-U+06FF), when the checklist runs, then internationalization checks (RTL attribute, Arabic fonts, alignment) are evaluated and scored correctly.

**US-5.4** — Given a completed quality report, when I view the article detail page, then I see a score ring with composite score, expandable checklist accordion (passed/failed), and actionable suggestion cards.

**US-5.5** — Given any article (generated or external URL), when I call `POST /api/quality/score`, then I receive the full 7-signal breakdown as JSON within 3 seconds for articles under 5,000 words.

**US-5.6** — Given an article that fails 2 auto-revision passes, when the loop exhausts, then the article is flagged for human review with a summary of unresolved issues.

**US-5.7** — Given the quality score API, when the publishing gate checks an article before CMS push, then articles below the configured threshold are blocked with a clear reason.

---

## 3. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| AC-1 | Engine evaluates all 60 checks across 8 categories (content structure, keyword optimization, metadata, internal links, external links, images, technical formatting, internationalization) | Unit test: pass article HTML, assert 60 results returned |
| AC-2 | Each check returns `{ id, category, name, passed: boolean, actual, expected, severity: critical|major|minor }` | Type assertion in tests |
| AC-3 | 7-signal composite score uses configured weights (E-E-A-T 20%, completeness 20%, voice 15%, AI detection 15%, freshness 10%, technical 10%, readability 10%) | Unit test with known inputs |
| AC-4 | E-E-A-T rubric scores 10 dimensions on 0-3 scale (total 30) and maps to grade A-F | Unit test: boundary values at 27, 22, 16, 10, 9 |
| AC-5 | Flesch-Kincaid readability grade computed correctly for English and returns N/A for Arabic | Unit test: known text samples |
| AC-6 | Arabic detection triggers i18n checks (dir="rtl", font-family, alignment) | Unit test: Arabic HTML fixture |
| AC-7 | Fix suggestions engine returns ordered list of actionable items sorted by impact | Unit test: failing article returns suggestions |
| AC-8 | `POST /api/quality/score` returns full breakdown within 3s for 5,000-word article | Integration test with timer |
| AC-9 | `GET /api/quality/report/:articleId` returns cached report from database | Integration test |
| AC-10 | Auto-revision loop re-invokes draft-writer max 2 times, stops if score >= 7/10 | Integration test with mock agent |
| AC-11 | Articles failing after 2 passes are marked `needs_human_review` in database | Integration test |
| AC-12 | Voice match and AI detection signals return placeholder scores (0.5) until Voice Intelligence ships in Phase C | Unit test: default values |

---

## 4. UI/UX Description

### Quality Report Tab (Article Detail Page)

```
+------------------------------------------------------------------+
|  Article: "N54 HPFP Failure Symptoms"          [Re-score] [Export]|
+------------------------------------------------------------------+
|                                                                    |
|   +------------------+    +------------------------------------+  |
|   |    [SCORE RING]  |    |  Signal Breakdown                  |  |
|   |                  |    |  E-E-A-T ............ 8.2/10  [==] |  |
|   |       8.4        |    |  Completeness ....... 9.0/10  [==] |  |
|   |      /10.0       |    |  Voice Match ........ 5.0/10  [--] |  |
|   |                  |    |  AI Detection ....... 8.5/10  [==] |  |
|   |   ● PASSED       |    |  Freshness .......... 7.0/10  [==] |  |
|   |                  |    |  Technical SEO ...... 9.5/10  [==] |  |
|   +------------------+    |  Readability ........ 8.0/10  [==] |  |
|                           +------------------------------------+  |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | ▼ Content Structure (14/17 passed)              [MAJOR ISSUE]| |
|  |   ✓ Content length: 2,840 words (target 1200-2500)          | |
|  |   ✓ H1 count: 1                                             | |
|  |   ✗ H2 count: 4 (target 6-10)                    [Fix ▶]   | |
|  |   ✗ H3 count: 6 (target 10-15)                   [Fix ▶]   | |
|  |   ✓ TOC present with anchor links                           | |
|  |   ...                                                        | |
|  +--------------------------------------------------------------+ |
|  | ▶ Keyword Optimization (6/7 passed)                          | |
|  +--------------------------------------------------------------+ |
|  | ▶ Metadata (4/4 passed)                           [ALL PASS] | |
|  +--------------------------------------------------------------+ |
|  | ▶ Internal Linking (3/5 passed)                [MINOR ISSUE] | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  Suggestions (3 items, sorted by impact)                          |
|  +--------------------------------------------------------------+ |
|  | ● Add 2-6 more H2 headings to improve content structure     | |
|  |   Impact: HIGH | Category: Content Structure                 | |
|  +--------------------------------------------------------------+ |
|  | ● Add 4-9 more H3 headings for sub-topic depth              | |
|  |   Impact: HIGH | Category: Content Structure                 | |
|  +--------------------------------------------------------------+ |
|  | ● Add 5 more internal links (currently 3, target 8-12)      | |
|  |   Impact: MEDIUM | Category: Internal Linking                | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

### Components

- **ScoreRing:** SVG circle with animated fill, composite score center, pass/fail label. Uses CSS `conic-gradient` fallback.
- **SignalBreakdown:** 7 rows with label, score, and horizontal bar. Red below 7.0, green at or above.
- **ChecklistAccordion:** 8 collapsible sections. Header shows category name, pass count, severity badge. Body lists individual checks with pass/fail icon and actual vs expected values.
- **SuggestionCard:** Ordered cards with description, impact level (HIGH/MEDIUM/LOW), and category tag.
- **Mobile:** Score ring stacks above signal breakdown. Accordion full-width. Suggestion cards scroll horizontally on small screens.

---

## 5. Database Changes

### New Table: `quality_reports`

```sql
CREATE TABLE quality_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  article_id UUID REFERENCES articles(id),
  composite_score NUMERIC(4,2) NOT NULL,
  signal_scores JSONB NOT NULL,
  -- { "eeat": 8.2, "completeness": 9.0, "voice": 5.0, "ai_detection": 8.5,
  --   "freshness": 7.0, "technical": 9.5, "readability": 8.0 }
  checklist_results JSONB NOT NULL,
  -- Array of 60 check results: [{ id, category, name, passed, actual, expected, severity }]
  suggestions JSONB,
  -- Array of suggestions: [{ text, impact, category }]
  eeat_breakdown JSONB,
  -- { dimensions: [{ name, score, max: 3 }], grade: "B", total: 24 }
  revision_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'scored' CHECK (status IN ('scored', 'revision_1', 'revision_2', 'passed', 'needs_human_review')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_qr_user_article ON quality_reports (user_id, article_id);
CREATE INDEX idx_qr_status ON quality_reports (user_id, status);

-- RLS
ALTER TABLE quality_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own reports" ON quality_reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own reports" ON quality_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Migration: `migrations/013-quality-reports.sql`

Standard migration file with the above DDL. No changes to existing tables.

---

## 6. API / Backend Changes

### Endpoints

**`POST /api/quality/score`** — Score an article

```
Request:
  Headers: Authorization: Bearer <token>
  Body: {
    html: string,                    // Required: article HTML
    articleId?: string,              // Optional: link to articles table
    targetKeyword?: string,          // Optional: for keyword checks
    targetPersonaId?: string,        // Optional: for voice match (Phase C)
    siteUrl?: string                 // Optional: for internal link validation
  }

Response (200):
  {
    success: true,
    data: {
      compositeScore: 8.4,
      passed: true,
      signals: { eeat: 8.2, completeness: 9.0, ... },
      eeat: { grade: "B", total: 24, dimensions: [...] },
      checklist: { total: 60, passed: 52, failed: 8, results: [...] },
      suggestions: [...],
      readability: { fleschKincaid: 9.2, avgSentenceLength: 16.4 }
    }
  }
```

**`GET /api/quality/report/:articleId`** — Retrieve cached report

```
Response (200): { success: true, data: <quality_reports row> }
Response (404): { error: "Not Found", message: "No quality report for this article" }
```

### Core Logic — `engine/quality-gate.js`

```javascript
// Public API
module.exports = {
  extractMetrics(html),         // Returns ContentMetrics object
  runChecklist(metrics, opts),  // Returns 60 CheckResult objects
  scoreSignals(metrics, opts),  // Returns 7-signal scores + composite
  scoreEEAT(html),             // Returns 10-dimension E-E-A-T breakdown
  computeReadability(text),     // Returns Flesch-Kincaid grade
  detectArabic(text),           // Returns boolean
  isPassingGate(scores, thresholds) // Returns boolean
};
```

**ContentMetrics extraction:** Parse HTML with regex (zero-dep). Extract: word count, sentence count, paragraph count, heading counts (H1-H6), heading texts, internal link count, external link count, image count, image alt texts, meta title, meta description, has TOC, has FAQ, has schema markup, keyword occurrences, Arabic ratio.

**Edge cases:**
- HTML with no `<body>` tag: treat entire input as body
- Empty HTML: return all-zero metrics, all checks fail
- Very long articles (>10,000 words): no upper limit, process normally
- Malformed HTML: regex extraction is best-effort, log warnings
- Articles with mixed Arabic/English: Arabic detection threshold at 30% of characters

### Core Logic — `engine/quality-suggestions.js`

```javascript
module.exports = {
  generateSuggestions(checklistResults, signalScores)
  // Returns sorted array of { text, impact: 'HIGH'|'MEDIUM'|'LOW', category }
};
```

Maps each failed check to a human-readable suggestion. Sorts by: severity (critical > major > minor), then by signal weight (higher-weighted signals first).

---

## 7. Frontend Components

### New Components

| Component | Path | Props |
|-----------|------|-------|
| `ScoreRing` | `components/quality/score-ring.tsx` | `score: number, passed: boolean, size?: 'sm' | 'lg'` |
| `SignalBreakdown` | `components/quality/signal-breakdown.tsx` | `signals: Record<string, number>, thresholds?: Record<string, number>` |
| `ChecklistAccordion` | `components/quality/checklist-accordion.tsx` | `results: CheckResult[], expandedCategories?: string[]` |
| `SuggestionCard` | `components/quality/suggestion-card.tsx` | `suggestion: Suggestion` |
| `QualityReportTab` | `components/quality/quality-report-tab.tsx` | `articleId: string` |

### Modified Components

| Component | Change |
|-----------|--------|
| Article detail page | Add "Quality" tab alongside existing tabs |
| Pipeline progress | Show quality score after generation completes |

### State Management

- `QualityReportTab` fetches report via `GET /api/quality/report/:articleId`
- Re-score button calls `POST /api/quality/score` and refetches
- Loading state: skeleton for score ring + accordion
- Error state: banner with retry button

### Data Fetching

```typescript
// api.ts additions
export async function scoreArticle(html: string, opts?: ScoreOptions): Promise<QualityReport>
export async function getQualityReport(articleId: string): Promise<QualityReport>
```

---

## 8. Test Plan

### Unit Tests — `test/quality-gate.test.js`

| Test | Description |
|------|-------------|
| `extractMetrics returns correct word count` | Known HTML, assert exact count |
| `extractMetrics counts headings correctly` | HTML with H1-H6, assert per-level counts |
| `extractMetrics counts internal vs external links` | Mix of relative and absolute URLs |
| `runChecklist returns 60 results` | Any HTML, assert array length = 60 |
| `runChecklist all pass for perfect article` | Fixture with all criteria met |
| `runChecklist flags missing H2s` | HTML with 0 H2, assert check #3 fails |
| `scoreSignals computes weighted composite` | Known signal values, assert math |
| `scoreSignals uses correct weights` | Verify sum of weights = 1.0 |
| `scoreEEAT returns 10 dimensions` | Assert array length and 0-3 range |
| `scoreEEAT grade boundaries` | Scores at 27, 22, 16, 10, 9 |
| `computeReadability English text` | Known FK grade reference text |
| `computeReadability Arabic returns null` | Arabic text, assert null |
| `detectArabic true for Arabic content` | Arabic HTML fixture |
| `detectArabic false for English content` | English HTML fixture |
| `detectArabic true for mixed 30%+ Arabic` | Mixed content above threshold |
| `isPassingGate true when all >= 7` | All signals at 7.0 |
| `isPassingGate false when any < 7` | One signal at 6.9 |

### Unit Tests — `test/quality-suggestions.test.js`

| Test | Description |
|------|-------------|
| `generateSuggestions returns suggestions for failed checks` | 5 failures, assert 5 suggestions |
| `generateSuggestions sorted by impact` | Mix of severities, assert HIGH first |
| `generateSuggestions empty for perfect article` | All pass, assert empty array |

### Integration Tests — `test/quality-api.test.js`

| Test | Description |
|------|-------------|
| `POST /api/quality/score returns 200 with valid HTML` | Full request/response cycle |
| `POST /api/quality/score returns 400 without html field` | Validation |
| `POST /api/quality/score completes within 3s` | Performance |
| `GET /api/quality/report/:id returns cached report` | After scoring |
| `GET /api/quality/report/:id returns 404 for unknown article` | Missing report |
| `POST /api/quality/score requires authentication` | No token = 401 |

---

## 9. Rollout Plan

### Feature Flag

`FEATURE_QUALITY_GATE=true` in environment variables. When false, the API endpoints return 503 and the dashboard tab is hidden.

### Phases

1. **Week 1:** Ship `engine/quality-gate.js` with 60-point checklist + readability + Arabic detection. All unit tests passing.
2. **Week 2:** Ship 7-signal scoring, E-E-A-T rubric, suggestions engine. API endpoints live behind feature flag.
3. **Week 3:** Ship frontend components (score ring, accordion, suggestion cards, report tab). Enable for internal testing.
4. **Week 4:** Integrate auto-revision loop into generation pipeline. Enable for SRMG pilot.

### Monitoring

- Log composite scores to structured logger for distribution analysis
- Alert if average score drops below 6.0 (indicates engine regression)
- Track auto-revision pass counts (target: 80% pass on first attempt)

### User Communications

- Dashboard banner: "Quality scoring is now active for all generated articles"
- Tooltip on score ring: "Score based on 60 SEO checks. Click to see details."

---

## 10. Accessibility & Mobile

### WCAG 2.1 AA Compliance

- Score ring: `role="img"` with `aria-label="Quality score 8.4 out of 10, passed"`
- Signal bars: `role="meter"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Accordion: `aria-expanded`, `aria-controls`, triggered by Enter/Space
- Color is never the sole indicator: pass/fail uses icons (checkmark/cross) alongside green/red
- Suggestion cards: semantic `<article>` elements with heading hierarchy

### Keyboard Navigation

- Tab through: score ring (focusable, shows tooltip) > signal rows > accordion headers > suggestion cards
- Enter/Space toggles accordion sections
- Escape closes expanded accordion

### RTL / Arabic

- Score ring renders correctly in RTL (SVG is direction-agnostic)
- Signal breakdown bars fill from right in RTL mode
- Checklist items and suggestions render RTL when Arabic detected
- All text uses CSS logical properties (`margin-inline-start` not `margin-left`)

### Mobile (< 768px)

- Score ring: centered, reduced to `size="sm"` (120px diameter)
- Signal breakdown: stacks below score ring, full width
- Accordion: full width, touch targets >= 44px
- Suggestion cards: vertical stack, no horizontal scroll
