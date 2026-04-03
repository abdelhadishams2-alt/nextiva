# VI-003: Voice Analyzer Agent

> **Phase:** 8 | **Priority:** P1 | **Status:** NOT STARTED
> **Effort:** L (12h) | **Type:** feature
> **Sprint:** 7 (Weeks 13-14)
> **Backlog Items:** Voice Intelligence — AI Agent + Pipeline Integration
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `PROJECT-BRIEF.md` — Section "Layer 3: Voice Intelligence" and "Layer 4: Generation Pipeline" (7-agent table)
3. `bridge/intelligence/voice-analyzer.js` — corpus analyzer + clustering from VI-001 and VI-002
4. `agents/draft-writer.md` — current draft writer agent (will accept voice_profile)
5. `skills/article-engine/SKILL.md` — pipeline orchestrator (will add voice analyzer step)
6. `bridge/server.js` — endpoint patterns

## Objective
Create the voice analyzer AI agent that takes corpus analysis results and produces a refined, structured voice profile suitable for injection into the draft-writer. Modify the draft-writer to accept and enforce voice profile constraints during article generation. Integrate the voice analyzer as an optional step in the SKILL.md pipeline, running before the research engine when a voice profile is needed.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `agents/voice-analyzer.md` | AI agent — refines corpus analysis into structured voice profile with style constraints |
| MODIFY | `agents/draft-writer.md` | Accept `voice_profile` parameter, enforce style constraints during generation |
| MODIFY | `skills/article-engine/SKILL.md` | Add optional voice analyzer step (Step 4.5) before research engine |
| MODIFY | `bridge/server.js` | Add `/api/voice/analyze` trigger endpoint for agent-based analysis |
| CREATE | `tests/voice-analyzer-agent.test.js` | Tests for agent integration and pipeline modification |

## Sub-tasks

### Sub-task 1: Create Voice Analyzer Agent (~4h)
- Create `agents/voice-analyzer.md` with standard agent frontmatter
- **Agent input:**
  - Corpus analysis summary (from `voice-analyzer.js`): total articles, classification breakdown, author info
  - Cluster data (from VI-002): cluster feature averages, cluster sizes, sample sentences
  - Raw stylometric features for each cluster
  - (Optional) User-specified preferences: "more formal", "inject humor", "avoid first person"
- **Agent processing:**
  1. Analyze cluster data to understand each writer's style fingerprint
  2. For each cluster/persona, produce a refined voice profile:
     ```
     VOICE PROFILE: "The Technical Storyteller"

     VOICE: Conversational-authoritative. Explains complex topics through real-world
     analogies. Never talks down to the reader — assumes intelligence but not expertise.

     SENTENCE CADENCE:
     - Average length: 14.2 words (target range: 10-20)
     - Mix: 30% short punchy (5-8 words), 50% medium (12-18), 20% long complex (22-30)
     - Opener style: Often starts paragraphs with a short declarative or question

     PARAGRAPH STRUCTURE:
     - Average: 3.8 sentences per paragraph
     - Rhythm: Alternates between tight 2-sentence paragraphs and detailed 5-sentence ones
     - Never: 6+ sentence blocks

     VOCABULARY:
     - TTR target: 0.68-0.75 (rich but not pretentious)
     - Uses domain-specific jargon confidently (defines on first use)
     - Avoids: "delve", "landscape", "leverage", "comprehensive", "robust"
     - Signature phrases: "here's the thing", "the short answer is", "in practice"

     TONE & PERSONALITY:
     - Humor: Dry, occasional. One per 500 words maximum. Never forced puns.
     - Authority: States opinions as facts when backed by data. Uses "I" sparingly.
     - Engagement: Asks rhetorical questions (2-3 per article). Never "have you ever wondered?"

     FORMATTING PREFERENCES:
     - Headings: Question-style for H2, declarative for H3
     - Lists: Prefers short bullet lists (3-5 items) over long ones
     - Numbers: Always contextualized ("145 bar — barely enough for cold start")
     - Bold: Used for key terms on first mention, never for emphasis

     MUST AVOID:
     - Passive voice (< 5% of sentences)
     - Em-dash overuse (max 2 per article)
     - Hedging: "it's worth noting", "it's important to", "generally speaking"
     - AI tells: uniform sentence length, excessive transition words

     SOURCE ARTICLES: [url1, url2, url3, url4, url5]
     ```
  3. Validate the profile is internally consistent (e.g., "conversational" tone shouldn't have high formality score)
  4. If user preferences provided, merge them (preferences override detected patterns)

### Sub-task 2: Modify Draft Writer for Voice Constraints (~3h)
- In `agents/draft-writer.md`, add a new section: "## Voice Profile Constraints"
- When `voice_profile` is provided in the agent input:
  - **Sentence cadence:** Enforce the target sentence length distribution. After generating each paragraph, self-check: are sentence lengths within the mix percentages?
  - **Vocabulary:** Use the TTR target as a guide. Include signature phrases naturally (1-2 per article). Actively avoid the "MUST AVOID" word list.
  - **Tone:** Match the specified tone profile. If "conversational", use contractions and second person. If "formal", avoid contractions, use third person.
  - **Formatting:** Follow heading style, list preferences, number contextualization rules
  - **Self-check prompt:** After generating each major section, the agent should internally verify: "Does this paragraph sound like [persona name]? Check: sentence length variance, vocabulary, tone, avoid-list compliance."
- When `voice_profile` is NOT provided: generate in the default neutral-professional voice (current behavior, unchanged)
- Add `voice_profile_used` to article metadata so the quality gate can evaluate Voice Match signal

### Sub-task 3: Pipeline Integration (~2.5h)
- In `skills/article-engine/SKILL.md`, add Step 4.5: Voice Analyzer (optional)
- Pipeline decision logic:
  ```
  Step 4: Topic Parsing (existing)

  Step 4.5: Voice Profile Selection (NEW — optional)
  IF user has writer_personas in database:
    → Use default persona's voice_profile
    → Skip to Step 5 (Project Analyzer)
  ELSE IF user requests voice analysis AND site URL provided:
    → Run voice-analyzer agent
    → Store resulting persona(s) in writer_personas table
    → Use default persona's voice_profile
    → Continue to Step 5
  ELSE:
    → No voice_profile — draft-writer uses default neutral voice
    → Continue to Step 5

  Step 5: Project Analyzer (existing)
  ```
- Pass `voice_profile` through the pipeline to the draft-writer in Step 10
- The voice analyzer step is OPTIONAL — pipeline works without it (backward compatible)
- Log which voice profile was used in the pipeline job metadata

### Sub-task 4: Trigger Endpoint (~2.5h)
- Add `POST /api/voice/analyze` to `bridge/server.js`
  - Auth required (Bearer token)
  - Body: `{ siteUrl: string, options?: { maxPages?: number, preferences?: object } }`
  - Triggers the full voice analysis pipeline:
    1. Corpus crawl (VI-001)
    2. AI/Human classification (VI-001)
    3. Feature extraction + clustering (VI-002)
    4. Voice analyzer agent refinement (this task)
  - Returns: `{ jobId, status: 'queued' }`
  - Progress via SSE: `/api/voice/analyze/progress/:jobId`
  - On completion: personas stored in DB, SSE sends `complete` event with persona summary
- This endpoint orchestrates all three Voice Intelligence components end-to-end
- Idempotency: if analysis already running for this user, return existing jobId
- Rate limit: 1 concurrent voice analysis per user

## Testing Strategy

### Unit Tests (`tests/voice-analyzer-agent.test.js`)
- Test voice profile generation from cluster data — verify all fields present
- Test draft-writer voice constraint enforcement — generate sample text, verify cadence
- Test pipeline integration — verify voice_profile passed through to draft-writer
- Test voice profile merging with user preferences (preferences override detected patterns)
- Test backward compatibility — pipeline works without voice profile

### Integration Tests
- Test `/api/voice/analyze` triggers full pipeline and returns jobId
- Test SSE progress stream delivers all stages: crawling → classifying → clustering → profiling → complete
- Test resulting personas stored in writer_personas table
- Test idempotency: second call during active analysis returns same jobId
- Test auth required

## Acceptance Criteria
- [ ] `agents/voice-analyzer.md` produces structured voice profiles from corpus analysis data
- [ ] Voice profiles include: voice, cadence, vocabulary, tone, formatting, avoid-list, source articles
- [ ] `agents/draft-writer.md` accepts `voice_profile` parameter and enforces style constraints
- [ ] Draft writer self-checks cadence, vocabulary, and tone against profile during generation
- [ ] SKILL.md pipeline includes optional Step 4.5 for voice profile selection
- [ ] Pipeline is backward compatible — works without voice profile (default neutral voice)
- [ ] `/api/voice/analyze` triggers end-to-end voice analysis pipeline
- [ ] SSE progress stream covers all stages
- [ ] voice_profile_used stored in article metadata
- [ ] All tests pass (`npm test`)

## Dependencies
- Blocked by: VI-001 (corpus analyzer), VI-002 (writer clustering)
- Blocks: VI-004 (dashboard voice page)
