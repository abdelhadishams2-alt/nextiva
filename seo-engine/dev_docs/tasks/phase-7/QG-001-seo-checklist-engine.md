# QG-001: SEO Checklist Engine (60-Point Quality Gate)

> **Phase:** 7 | **Priority:** P1 | **Status:** NOT STARTED
> **Effort:** XL (16h) | **Type:** feature
> **Sprint:** 3 (Weeks 5-6) — can parallel with DI-005/DI-006
> **Backlog Items:** Quality Gate — SEO Checklist + E-E-A-T Scoring
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `PROJECT-BRIEF.md` — Section 5 "Quality & SEO Scoring Gate" for full 60-point checklist spec
3. `bridge/server.js` — current endpoint patterns and auth middleware
4. `supabase-setup.sql` — schema reference (PROTECTED)
5. `config/engine-config.md` — adaptation modes, language detection patterns
6. `../old-seo-blog-checker/lib/seo-analyzer.ts` — source ContentMetrics (40+ metrics) to port
7. `../old-seo-blog-checker/lib/seo-checklist.ts` — source 60-point checklist logic to port
8. `../old-seo-blog-checker/lib/seo-suggestions.ts` — source suggestion generation to port

## Objective
Create the SEO quality gate engine that scores every generated article against a 60-point checklist across 8 categories, calculates an E-E-A-T rubric score (10 dimensions, 0-3 each), and exposes API endpoints for scoring and checklist retrieval. This engine is the foundation for the quality-gate agent (QG-002) and the dashboard quality page (QG-003).

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `engine/quality-gate.js` | Main scoring engine — 60-point checklist across 8 categories, E-E-A-T 10-dimension rubric, overall score calculation |
| CREATE | `engine/quality-suggestions.js` | Suggestion generator — produces actionable fix instructions per failed/warning checklist item |
| MODIFY | `bridge/server.js` | Add `/api/quality/score/:articleId` and `/api/quality/checklist/:articleId` endpoints |
| CREATE | `tests/quality-gate.test.js` | Unit and integration tests for scoring engine |

## Sub-tasks

### Sub-task 1: Port ContentMetrics from seo-analyzer.ts (~4h)
- Create `engine/quality-gate.js` with a `ContentMetrics` class
- Port the 40+ metric extraction functions from `../old-seo-blog-checker/lib/seo-analyzer.ts` into pure Node.js (no npm deps)
- Metrics to extract from article HTML:
  - `wordCount` — total words in body text (strip HTML tags first)
  - `headingCounts` — count of H1, H2, H3, H4, H5, H6 elements
  - `headingTexts` — array of all heading text content with level
  - `paragraphCount` — total `<p>` elements
  - `avgParagraphLength` — average words per paragraph
  - `sentenceCount` — split on `.!?` with abbreviation handling
  - `avgSentenceLength` — words per sentence
  - `internalLinkCount` — `<a>` elements with relative href or same-domain
  - `externalLinkCount` — `<a>` elements with absolute href to other domains
  - `imageCount` — `<img>` elements
  - `imagesWithAlt` — images with non-empty `alt` attribute
  - `imagesWithTitle` — images with `title` attribute
  - `hasTOC` — boolean, detects table of contents (nav/ul with anchor links)
  - `hasFAQ` — boolean, detects FAQ section (heading containing "FAQ" or "Frequently Asked")
  - `hasQuickAnswer` — boolean, detects summary/answer box near top
  - `tableCount` — `<table>` elements
  - `listCount` — `<ul>` and `<ol>` elements
  - `boldCount` — `<strong>` and `<b>` elements
  - `ctaCount` — elements with CTA-like text ("learn more", "get started", "contact", "buy", "sign up")
  - `metaTitle` — content of `<title>` or og:title
  - `metaDescription` — content of meta description tag
  - `keywordDensity(keyword)` — occurrences / total words * 100
  - `keywordInTitle` — boolean
  - `keywordInFirstParagraph` — boolean
  - `keywordInH2s` — count of H2s containing keyword
  - `introWordCount` — words before first H2
  - `conclusionWordCount` — words after last H2
  - `hasSourcesSection` — boolean, detects "Sources" or "References" heading
- Use regex-based HTML parsing (no DOM library) to maintain zero-dependency philosophy
- Handle both English and Arabic content (Unicode-aware word counting)

### Sub-task 2: Implement 60-Point Checklist (~5h)
- In `engine/quality-gate.js`, create a `runChecklist(html, keyword, options)` function
- Each check returns: `{ id, category, label, status: 'pass'|'fail'|'warning'|'info', value, expected, message }`
- Implement 8 categories with specific checks:

**Content Structure (17 items):**
1. Content length 1200-2500 words (warning if 1000-1200 or 2500-3000, fail outside)
2. Exactly 1 H1 tag
3. 6-10 H2 tags (warning if 4-5 or 11-13)
4. 10-15 H3 tags (warning if 7-9 or 16-20)
5. 30-40% of H2/H3 headings include primary keyword
6. Table of contents with anchor links present
7. Quick answer box in first 300 words
8. 2-4 metric highlight boxes (data-type="metric" or similar)
9. 2-3 tables present (one should be comparison-style)
10. Quote boxes present (blockquote elements)
11. FAQ section with 8-12 questions
12. 2-3 CTA elements
13. Intro paragraph 200-250 words
14. Conclusion paragraph 150-200 words
15. Sources/References section present
16. Proper heading hierarchy (no skipped levels: H1 > H2 > H3)
17. No empty headings

**Keyword Optimization (7 items):**
18. Primary keyword appears 8-15 times naturally
19. Keyword density <= 2.5%
20. LSI/related keywords 15-25 mentions
21. Keyword in title tag
22. Keyword in first paragraph
23. Keyword appears in at least 2 H2s
24. Keyword appears in at least 3 H3s

**Metadata (4 items):**
25. Title tag 50-60 characters
26. Meta description 145-154 characters
27. Focus keyphrase set (meta tag present)
28. SEO title optimized (contains keyword, power words)

**Internal Linking (5 items):**
29. 8-12 internal links present
30. Links naturally integrated in sentences (not bare URLs)
31. Relevant anchor text (not "click here")
32. At least 1 internal link in first 200 words
33. Links distributed across article (not clustered in one section)

**External Links (5 items):**
34. 2-3 authority external links
35. Mix of dofollow/nofollow attributes
36. Links point to authoritative sources (.gov, .edu, established domains)
37. Proper attribution text near links
38. No broken external links (check format only, not availability)

**Images (6 items):**
39. Featured image present (first image or og:image)
40. Minimum 4 content images
41. All images have descriptive alt text
42. At least 1 image alt text contains keyword
43. Image file names are descriptive (not random hashes)
44. Images have title attributes

**Technical Formatting (6 items):**
45. Proper heading hierarchy (no level skips)
46. Short paragraphs (2-4 sentences each, warning if >5)
47. At least 3 bullet/numbered lists
48. Bold/strong used on key facts (minimum 5 instances)
49. Clear section headers (no generic "Section 1" text)
50. Adequate white space (no single block >300 words without break)

**Internationalization (4 items):**
51. Arabic content detection (Unicode range U+0600-U+06FF, >30% of text)
52. `dir="rtl"` attribute present when Arabic detected
53. Arabic-appropriate font specified (Cairo, Tajawal, Amiri, Noto Kufi Arabic)
54. RTL text alignment (text-align: right or CSS logical properties)

- Calculate overall score: `(passed / total) * 100`
- Return grouped results by category with category-level scores

### Sub-task 3: E-E-A-T 10-Dimension Rubric (~3h)
- Create `runEEATScoring(html, keyword)` function in `engine/quality-gate.js`
- 10 dimensions, each scored 0-3:
  1. **Primary keyword targeting** — keyword placement quality (title, H1, intro, conclusion)
  2. **Secondary keyword integration** — LSI/semantic keyword variety and natural usage
  3. **Content depth vs SERP** — word count, subtopic coverage, FAQ depth
  4. **Readability & formatting** — Flesch-Kincaid approximation, paragraph length, lists, bold
  5. **Internal linking** — count, distribution, anchor text quality
  6. **External link quality** — authority of linked domains, relevance
  7. **Structured data** — JSON-LD schema presence (Article, FAQ, HowTo, BreadcrumbList)
  8. **Mobile rendering** — viewport meta, responsive hints, no fixed-width elements
  9. **Page speed signals** — image optimization hints, no inline base64 >10KB, lazy loading
  10. **Media optimization** — image count, alt text quality, variety of media types
- Total: 30 points maximum
- Grade thresholds: A (27-30), B (22-26), C (16-21), D (10-15), F (0-9)
- Return: `{ dimensions: [...], total, grade, maxScore: 30 }`

### Sub-task 4: Suggestion Generator (~2h)
- Create `engine/quality-suggestions.js`
- Port suggestion generation logic from `../old-seo-blog-checker/lib/seo-suggestions.ts`
- `generateSuggestions(checklistResults, eeatResults)` function
- For each failed/warning checklist item, produce a structured suggestion:
  ```javascript
  {
    checkId: 'CS-01',
    severity: 'critical' | 'important' | 'minor',
    title: 'Content is too short',
    current: '850 words',
    target: '1200-2500 words',
    instruction: 'Expand sections X, Y, Z with additional detail. Add a comparison table and 2-3 more FAQ entries.',
    autoFixable: true
  }
  ```
- Prioritize suggestions by impact (content structure > keywords > metadata > links > images > formatting > i18n)
- Limit to top 15 suggestions to avoid overwhelming the user

### Sub-task 5: Bridge Server Endpoints (~2h)
- Add `GET /api/quality/score/:articleId` — returns overall score, category scores, E-E-A-T grade
  - Auth required (Bearer token)
  - Fetches article HTML from `articles` table
  - Runs `runChecklist()` and `runEEATScoring()`
  - Returns: `{ score, categoryScores, eeat: { total, grade, dimensions }, passCount, failCount, warningCount }`
- Add `GET /api/quality/checklist/:articleId` — returns full checklist with all 60 items
  - Auth required
  - Returns: `{ items: [...], categories: { name, score, items }[], suggestions: [...] }`
- Follow existing endpoint patterns in `bridge/server.js` (auth middleware, JSON response format, error handling)
- Add rate limiting to both endpoints (same bucket as general limiter)

## Testing Strategy

### Unit Tests (`tests/quality-gate.test.js`)
- Test `ContentMetrics` extraction with sample HTML (English and Arabic)
- Test each of the 8 checklist categories independently with crafted HTML
- Test E-E-A-T scoring with known-score articles
- Test Arabic detection with mixed-language content
- Test suggestion generation with various fail/warning combinations
- Test edge cases: empty HTML, HTML with no headings, extremely long content, no images

### Integration Tests
- Test `/api/quality/score/:articleId` with a real article in the database
- Test `/api/quality/checklist/:articleId` returns all 60 items grouped by category
- Test auth required (401 without token)
- Test 404 for non-existent article ID
- Test rate limiting on quality endpoints

## Acceptance Criteria
- [ ] `engine/quality-gate.js` extracts 40+ content metrics from HTML (English and Arabic)
- [ ] 60-point checklist runs across 8 categories with pass/fail/warning/info status per item
- [ ] Overall score calculated as `(passed / total) * 100`
- [ ] E-E-A-T rubric scores 10 dimensions (0-3 each), produces letter grade A-F
- [ ] Arabic content detected via Unicode U+0600-U+06FF range with >30% threshold
- [ ] RTL validation checks dir attribute, font family, and text alignment
- [ ] `engine/quality-suggestions.js` generates prioritized fix instructions for failed items
- [ ] `/api/quality/score/:articleId` returns score, category breakdown, and E-E-A-T grade
- [ ] `/api/quality/checklist/:articleId` returns all 60 items grouped with suggestions
- [ ] Both endpoints require auth and have rate limiting
- [ ] Zero npm dependencies — pure Node.js with regex-based HTML parsing
- [ ] All tests pass (`npm test`)

## Dependencies
- Blocked by: None (can start independently)
- Blocks: QG-002 (quality-gate agent), QG-003 (dashboard quality page)
