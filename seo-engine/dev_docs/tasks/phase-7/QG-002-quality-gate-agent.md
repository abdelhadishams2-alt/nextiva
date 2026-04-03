# QG-002: Quality Gate Agent (7-Signal Scoring + Auto-Revision)

> **Phase:** 7 | **Priority:** P1 | **Status:** NOT STARTED
> **Effort:** L (12h) | **Type:** feature
> **Sprint:** 4 (Weeks 7-8)
> **Backlog Items:** Quality Gate — AI Agent + Auto-Revision Loop
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `PROJECT-BRIEF.md` — Section 5 "7-Signal Scoring Rubric" and auto-revision loop spec
3. `engine/quality-gate.js` — checklist engine from QG-001 (must be complete)
4. `engine/quality-suggestions.js` — suggestion generator from QG-001
5. `agents/draft-writer.md` — current draft writer agent (will receive revision instructions)
6. `skills/article-engine/SKILL.md` — pipeline orchestrator (will add quality-gate step)
7. `bridge/server.js` — endpoint patterns

## Objective
Create an AI agent that runs after the draft-writer as the final pipeline step, scoring the article against 7 weighted signals. If the score falls below 7/10, the agent generates structured fix instructions and routes back to the draft-writer for revision (maximum 2 passes). This closes the quality loop — no article is delivered without passing the gate.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `agents/quality-gate.md` | AI agent definition — 7-signal evaluation, structured scoring, revision instructions |
| MODIFY | `agents/draft-writer.md` | Add revision mode — accept `revision_instructions` parameter for targeted fixes |
| MODIFY | `skills/article-engine/SKILL.md` | Add quality-gate as final pipeline step (Step 11), add revision loop logic |
| MODIFY | `bridge/server.js` | Add `/api/quality/suggestions/:articleId` endpoint |
| CREATE | `tests/quality-gate-agent.test.js` | Tests for agent scoring and revision loop |

## Sub-tasks

### Sub-task 1: Create Quality Gate Agent (~4h)
- Create `agents/quality-gate.md` with standard agent frontmatter (name, description, tools)
- Agent receives: generated article HTML, target keyword, writer persona (if set), research report summary
- Agent evaluates 7 signals with weighted scoring:

| Signal | Weight | Source | Method |
|--------|--------|--------|--------|
| E-E-A-T Signals | 20% | `engine/quality-gate.js` runEEATScoring() | Programmatic — 10 dimensions, 0-3 each, normalize to 0-10 |
| Topical Completeness | 20% | AI evaluation | Agent compares article subtopics against research report's competitor subtopics. Coverage = subtopics addressed / subtopics in top 5 competitors. Normalize: 80%+ = 10, 60-79% = 7, <60% = 4 |
| Voice Match | 15% | AI + stylometric | If writer persona exists: compute stylometric distance (sentence length, TTR, cadence). Distance <= 0.3 = 10, 0.3-0.5 = 7, >0.5 = 4. No persona = auto-pass at 8 |
| AI Detection Risk | 15% | AI + heuristic | Evaluate 6 signals: sentence length variance (stdev), TTR, hedging frequency, cliche density, em-dash frequency, paragraph rhythm variance. High variance = more human = higher score |
| Freshness Signals | 10% | AI evaluation | Check for current year references, recent statistics, working link patterns. All data <= 6 months old = 10 |
| Technical SEO | 10% | `engine/quality-gate.js` runChecklist() | Use checklist score from Content Structure + Metadata + Internal Links categories. Normalize to 0-10 |
| Readability | 10% | Programmatic | Flesch-Kincaid grade approximation. Grade 8-12 = 10, 6-7 or 13-14 = 7, outside = 4 |

- Calculate weighted total: `sum(signal_score * weight)` — produces 0-10 scale
- Output structured JSON: `{ totalScore, signals: [{ name, score, weight, weightedScore, details }], pass: totalScore >= 7.0 }`

### Sub-task 2: Implement Auto-Revision Loop (~3h)
- If `totalScore < 7.0`, the agent generates structured revision instructions:
  ```
  REVISION INSTRUCTIONS (Pass 1 of 2):

  Overall Score: 6.2/10 — BELOW THRESHOLD

  Priority Fixes:
  1. [E-E-A-T] Score 5/10 — Add first-hand experience markers in intro and case study sections. Include "In my experience" or similar authority signals.
  2. [Topical Completeness] Score 6/10 — Missing subtopics: installation cost ranges, warranty comparison, OEM vs aftermarket. Add H2 sections for each.
  3. [AI Detection] Score 5/10 — Sentence length too uniform (avg 16.2, stdev 2.1). Vary between 5-word punchy sentences and 25+ word complex ones. Reduce hedging phrases.

  Do NOT change:
  - Overall article structure and H2 order
  - Existing image placements
  - FAQ section (already strong)
  ```
- Route instructions back to `agents/draft-writer.md` with `revision_instructions` parameter
- Track revision count — maximum 2 passes
- After 2 passes, if still below 7.0: mark article as `needs_human_review` in database, include final score and remaining issues in article metadata
- Log each revision pass: `{ pass, scoreBefore, scoreAfter, fixesApplied }`

### Sub-task 3: Modify Draft Writer for Revision Mode (~2h)
- In `agents/draft-writer.md`, add a new section: "## Revision Mode"
- When `revision_instructions` is provided:
  - Do NOT regenerate the entire article
  - Parse the priority fixes list
  - Apply targeted changes to specific sections
  - Preserve all sections marked as "Do NOT change"
  - Return the revised HTML with a changelog (sections modified, additions, removals)
- The draft writer must understand it is refining, not rewriting — the goal is surgical improvement

### Sub-task 4: Integrate into SKILL.md Pipeline (~1.5h)
- In `skills/article-engine/SKILL.md`, add Step 11: Quality Gate
- After draft-writer (Step 10) completes:
  1. Run quality-gate agent on the generated HTML
  2. If score >= 7.0: proceed to delivery
  3. If score < 7.0: extract revision instructions, invoke draft-writer in revision mode
  4. Re-run quality-gate on revised article
  5. If score >= 7.0 or revision count == 2: proceed to delivery
- Add `quality_score` and `quality_details` to the article metadata stored in database
- Update pipeline job status to include quality gate stage: `quality_check` → `revising` → `complete`

### Sub-task 5: Suggestions Endpoint (~1.5h)
- Add `GET /api/quality/suggestions/:articleId` to `bridge/server.js`
- Auth required (Bearer token)
- Fetches the latest quality gate results for the article
- Returns: `{ suggestions: [...], totalScore, signals: [...], revisionHistory: [{ pass, scoreBefore, scoreAfter }] }`
- If quality gate has not been run, returns 404 with message "Quality gate not yet run for this article"
- Rate limited (general bucket)

## Testing Strategy

### Unit Tests (`tests/quality-gate-agent.test.js`)
- Test 7-signal scoring with a high-quality article (expect >= 7.0)
- Test 7-signal scoring with a deliberately poor article (expect < 7.0)
- Test revision instruction generation — verify all failing signals produce fix instructions
- Test weighted score calculation (verify weights sum to 1.0, verify math)
- Test revision count tracking — verify max 2 passes enforced

### Integration Tests
- Test full pipeline with quality gate: generate article → quality gate → verify score stored
- Test revision loop: generate low-quality article → verify draft-writer re-invoked → verify score improves
- Test `/api/quality/suggestions/:articleId` returns correct data
- Test 404 when quality gate not yet run

## Acceptance Criteria
- [ ] `agents/quality-gate.md` evaluates 7 signals with correct weights summing to 100%
- [ ] Weighted score calculated on 0-10 scale with >= 7.0 pass threshold
- [ ] Auto-revision loop sends structured fix instructions to draft-writer
- [ ] Draft writer revision mode applies targeted fixes without full regeneration
- [ ] Maximum 2 revision passes enforced — third attempt flags for human review
- [ ] SKILL.md pipeline includes quality-gate as Step 11 with revision loop
- [ ] `/api/quality/suggestions/:articleId` returns suggestions and revision history
- [ ] Quality score and details stored in article metadata in database
- [ ] Pipeline job status reflects quality gate stages
- [ ] All tests pass (`npm test`)

## Dependencies
- Blocked by: QG-001 (needs quality-gate.js engine)
- Blocks: QG-003 (dashboard quality page)
