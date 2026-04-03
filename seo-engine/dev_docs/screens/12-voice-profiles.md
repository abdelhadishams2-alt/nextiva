# Screen Spec: Voice Profiles

> **Route:** `/voice`
> **Service:** Voice Intelligence (Service #9, Layer 3)
> **Task:** T2-12
> **Type:** List + Detail (persona cards grid with slide-over detail panel)
> **Priority:** P1
> **Depth Target:** >= 8/10

---

## 1. Overview

The Voice Profiles screen is where brand voice transforms from an abstract editorial concept into a quantified, enforceable set of writing constraints. It surfaces the output of the Voice Intelligence Service's four-stage analysis pipeline (crawl, classify, cluster, generate) as interactive persona cards that users can inspect, customize, and assign as defaults for article generation.

This screen serves two fundamentally different user journeys. The first-time user has never analyzed their site -- they see an empty state with a single "Analyze Your Site" CTA and a brief explanation of what voice analysis does. The power user on their 100th visit has 2-5 persona cards, knows which one is their default, and opens the screen to check voice match scores on recently generated articles or tweak a persona parameter before their next content batch.

**Why this screen exists:** Without it, every ChainIQ-generated article sounds like "a competent AI writer" rather than like the client's actual brand voice. The Voice Profiles screen makes the anti-slop thesis tangible -- users can see exactly which stylometric fingerprints define their voice, which articles contributed to the persona, and how well generated content matches their style. Zero competitors offer this level of voice transparency. SurferSEO's "Custom Voice" is a 200-word paste. Writer.com's brand voice is manual rules. ChainIQ analyzes 50-100+ real articles and extracts quantified style DNA.

**Primary user personas and their goals on this screen:**

- **James (Editorial Director):** Opens Voice Profiles to verify the default persona after initial site analysis. Renames auto-generated persona names to match his brand terminology. Checks voice match scores on recent articles weekly. Adjusts passive voice ratio down after noticing generated articles sound too formal.

- **Nadia (Content Operations Manager):** Manages multiple personas for different content verticals (news, opinion, technical). Sets different defaults per content type. Needs to compare two personas side-by-side to decide which fits a new content category.

- **Yousef (Arabic Content Lead):** Verifies that Arabic-specific stylometric signals (MSA formality, tashkeel usage, morphological patterns) are captured correctly. Needs the system to understand that Arabic sentence length norms differ from English -- 25-word Arabic sentences are normal, not "verbose."

---

## 2. Screen Type

Grid list of persona cards with slide-over detail panel. Primary layout is a responsive card grid (2 columns on desktop, 1 on mobile). Clicking a card opens a slide-over from the right edge with full persona DNA, sample sentences, and source article list across three tabs.

---

## 3. ASCII Wireframe

```
┌─────┬───────────────────────────────────────────────────────────────┐
│     │  Voice Profiles                          [Analyze Site]       │
│  S  │───────────────────────────────────────────────────────────────│
│  I  │                                                               │
│  D  │  ┌──────────────────────────┐  ┌──────────────────────────┐  │
│  E  │  │  The Technical Explainer │  │  The Industry Analyst    │  │
│  B  │  │  ★ Default               │  │                          │  │
│  A  │  │                          │  │                          │  │
│  R  │  │  Tone: Conversational    │  │  Tone: Authoritative     │  │
│     │  │  TTR: 0.72               │  │  TTR: 0.58               │  │
│     │  │  Avg Sentence: 14.2w     │  │  Avg Sentence: 22.1w     │  │
│     │  │  Corpus: 47 articles     │  │  Corpus: 18 articles     │  │
│     │  │  Confidence: HIGH        │  │  Confidence: MEDIUM      │  │
│     │  │                          │  │                          │  │
│     │  │  [Set Default] [View ▸]  │  │  [Set Default] [View ▸]  │  │
│     │  └──────────────────────────┘  └──────────────────────────┘  │
│     │                                                               │
│     │  ┌──────────────────────────┐                                │
│     │  │  + Create Manual Persona │                                │
│     │  │  Define a voice without  │                                │
│     │  │  running site analysis   │                                │
│     │  └──────────────────────────┘                                │
│     │                                                               │
│     │  ┌───────────────────────────────────────────────────────┐   │
│     │  │  Last analysis: Mar 25, 2026 · 87 articles crawled   │   │
│     │  │  71 human · 12 hybrid · 4 AI · 2 clusters detected   │   │
│     │  │  [View Analysis History]                               │   │
│     │  └───────────────────────────────────────────────────────┘   │
│     │                                                               │
└─────┴───────────────────────────────────────────────────────────────┘

── Slide-over (right 480px) ──────────────────────────────────────────
│  ← Back    The Technical Explainer    [★ Default] [Edit] [Delete]  │
│────────────────────────────────────────────────────────────────────│
│  [Profile]  [Samples]  [Sources]                                   │
│────────────────────────────────────────────────────────────────────│
│  VOICE DNA                                                         │
│  ┌──────────────────────────────────────────────────────┐         │
│  │  Tone         conversational-authoritative           │         │
│  │  Register     informal-expert                        │         │
│  │  Formality    38 / 100                    ████░░░░░ │         │
│  │  Passive Voice 0.06                       ██░░░░░░░ │         │
│  │  TTR          0.72                        ██████░░░ │         │
│  │  Avg Sentence 14.2 words   variance 8.7             │         │
│  │  Avg Paragraph 3.2 sentences                        │         │
│  │  Heading Style mixed (questions + declarative)      │         │
│  │  Contractions  HIGH (always uses)                   │         │
│  └──────────────────────────────────────────────────────┘         │
│                                                                    │
│  CONSTRAINTS (enforced during generation)                          │
│  Max passive voice: 0.10  │  Max hedging: 0.002                   │
│  Min TTR: 0.65            │  Max cliche density: 0.001            │
│  Min sentence variance: 6.0                                       │
│                                                                    │
│  FORBIDDEN PHRASES                                                 │
│  "it's worth noting" · "delve" · "leverage" · "in conclusion"    │
│  "without further ado" · "at the end of the day" ...              │
│                                                                    │
│  SIGNATURE PHRASES                                                 │
│  "here's the thing" · "let me explain" · "the real question is"  │
│────────────────────────────────────────────────────────────────────│
│  [Samples] tab: 5-8 example sentences extracted from corpus       │
│  [Sources] tab: DataTable of 47 source articles (URL, author,    │
│    word count, classification, cluster distance)                   │
└────────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Fields

### Persona Card Fields

| Field | Type | Source | Display |
|-------|------|--------|---------|
| Name | text | `writer_personas.name` | Card title, editable inline |
| Default Badge | boolean | `writer_personas.is_default` | Star icon + "Default" label |
| Tone | enum | `writer_personas.tone` | Capitalized label |
| TTR | numeric(4,3) | `writer_personas.vocabulary_richness` | 2 decimal places |
| Avg Sentence Length | numeric(5,1) | `writer_personas.avg_sentence_length` | "{N}w" format |
| Corpus Size | integer | `writer_personas.corpus_size` | "{N} articles" |
| Confidence | enum | `writer_personas.confidence` | Badge: green=high, yellow=medium, orange=low, red=very_low |
| Language | text | `writer_personas.language` | ISO flag icon + language name |
| Source | enum | `writer_personas.source` | Icon: auto=robot, manual=pencil, reference=link |

### Slide-over Detail Fields (Profile Tab)

| Field | Type | Source |
|-------|------|--------|
| Voice Summary | text | `voice_profile.summary` |
| Primary Tone | text | `voice_profile.voice.primary_tone` |
| Secondary Tone | text | `voice_profile.voice.secondary_tone` |
| Register | text | `voice_profile.voice.register` |
| Formality Score | numeric | `writer_personas.formality_score` |
| Passive Voice Ratio | numeric | `writer_personas.passive_voice_ratio` |
| Vocabulary Richness (TTR) | numeric | `writer_personas.vocabulary_richness` |
| Avg Sentence Length | numeric | `writer_personas.avg_sentence_length` |
| Sentence Length Variance | numeric | `writer_personas.sentence_length_variance` |
| Avg Paragraph Length | numeric | `writer_personas.avg_paragraph_length` |
| Paragraph Length Variance | numeric | `writer_personas.paragraph_length_variance` |
| Heading Style | enum | `writer_personas.heading_style` |
| Contraction Frequency | text | `voice_profile.vocabulary.contraction_frequency` |
| Favorite Transitions | text[] | `voice_profile.vocabulary.favorite_transitions` |
| Avoided Phrases | text[] | `voice_profile.vocabulary.avoids` |
| Signature Phrases | text[] | `voice_profile.vocabulary.signature_phrases` |
| Constraints | object | `voice_profile.constraints` |
| Quirks | object | `voice_profile.quirks` |

### Slide-over Detail Fields (Samples Tab)

| Field | Type | Source |
|-------|------|--------|
| Sample Sentences | text[] | `voice_profile.sample_sentences` (5-8 representative sentences from corpus) |
| Sample Openers | text[] | `voice_profile.structure.opener_style` examples |
| Sample Closers | text[] | `voice_profile.structure.closer_style` examples |

### Slide-over Detail Fields (Sources Tab)

| Field | Type | Source | Sortable |
|-------|------|--------|----------|
| URL | text | `corpus_data[].url` | No |
| Author | text | `corpus_data[].author` | Yes |
| Word Count | integer | `corpus_data[].word_count` | Yes |
| Classification | enum | `corpus_data[].classification` | Yes |
| Confidence | numeric | `corpus_data[].classification_confidence` | Yes |
| Cluster Distance | numeric | computed from `style_fingerprint` | Yes |

---

## 5. Component Inventory

| Component | Source | Props / Config | Notes |
|-----------|--------|----------------|-------|
| Card | shadcn/ui | variant: "outline" | Persona card container. Border color changes: blue=default, zinc=others |
| Badge | shadcn/ui | variant: "default", "secondary", "outline", "destructive" | Confidence levels, default marker, source type |
| Button | shadcn/ui | variant: "default", "outline", "ghost", "destructive" | "Analyze Site", "Set Default", "View", "Delete" |
| Sheet | shadcn/ui | side: "right", width: "480px" | Slide-over detail panel. 480px on desktop, full-width on mobile |
| Tabs | shadcn/ui | defaultValue: "profile" | Profile / Samples / Sources tabs inside slide-over |
| DataTable | shadcn/ui | pagination: true, sortable: true | Sources tab article list |
| Progress | shadcn/ui | | Analysis progress bar (4 stages: crawling, classifying, clustering, generating) |
| Input | shadcn/ui | | Inline persona name editing |
| Slider | shadcn/ui | min, max, step | Persona parameter adjustment (passive voice ratio, formality target) |
| AlertDialog | shadcn/ui | | Delete persona confirmation |
| Dialog | shadcn/ui | | "Create Manual Persona" form, "Analyze Site" confirmation |
| Skeleton | shadcn/ui | | Card loading placeholders |
| Tooltip | shadcn/ui | | Confidence level explanations, metric definitions |
| Toast | shadcn/ui | | Success/error notifications for set-default, delete, edit |
| Alert | shadcn/ui | variant: "warning", "destructive" | Insufficient articles warning, all-AI-content warning |
| DropdownMenu | shadcn/ui | | Card overflow menu: Edit, Duplicate, Export JSON, Delete |
| HoverCard | shadcn/ui | | Preview voice match scores on hover over persona card |

---

## 6. States (10 total)

### 6.1 Loading State
```
Page header visible with disabled "Analyze Site" button.
Card grid area shows 2-3 skeleton cards with pulsing animation.
Each skeleton card: gray rectangle for name, 4 gray lines for metrics.
Analysis summary bar shows skeleton.
```

### 6.2 Empty State -- No Personas, No Analysis
```
Card grid area replaced by centered illustration + text:
  Illustration: Stylized waveform / voice fingerprint graphic
  "Discover Your Brand Voice"
  "ChainIQ analyzes your existing content to extract unique writing personas.
   We examine sentence structure, vocabulary richness, tone, and dozens of
   stylometric signals across 50-100+ articles to build a precise voice DNA."
  [Analyze Your Site] button (large, primary, prominent)
  "Or" divider
  [Create Manual Persona] link (text button, muted)

Below the CTA: 3-column feature explanation
  Column 1: "Crawl" icon + "We read 50-100+ articles from your site"
  Column 2: "Classify" icon + "Separate human writing from AI content"
  Column 3: "Generate" icon + "Build quantified voice personas"
```

### 6.3 Analyzing State -- 4-Stage Progress
```
Full-width progress section replaces empty state:
  ┌────────────────────────────────────────────────────────┐
  │  Analyzing yourdomain.com                              │
  │                                                        │
  │  ████████████████████░░░░░░░░░░░░░░░░░░  Stage 2/4    │
  │                                                        │
  │  ✓ Crawling         87 articles discovered     (12s)  │
  │  ● Classifying      43 / 87 articles processed (...)  │
  │  ○ Clustering        waiting...                        │
  │  ○ Generating        waiting...                        │
  │                                                        │
  │  Classification so far: 31 human · 8 hybrid · 4 AI    │
  │                                                        │
  │  [Cancel Analysis]                                     │
  └────────────────────────────────────────────────────────┘

Each stage transitions from ○ (pending) to ● (active, spinner) to ✓ (complete).
Stage timing shown in parentheses when complete.
Live counters update via polling (every 3 seconds) against
  GET /api/voice/analysis/:sessionId endpoint.
Progress bar is determinate for stages 1-2 (article count known),
  indeterminate for stages 3-4 (HDBSCAN and generation are opaque).
Cancel button triggers PUT /api/voice/analysis/:sessionId/cancel.
```

### 6.4 Complete State -- Persona Cards Grid
```
Header: "Voice Profiles" + "Analyze Site" button (outline variant, allows re-analysis)
Card grid: 2-3 persona cards (responsive: 2 columns desktop, 1 mobile)
Each card: name, default badge (if applicable), tone, TTR, avg sentence length,
  corpus size, confidence badge, source icon.
Card actions: "Set Default" (if not default), "View ▸" (opens slide-over)
Card overflow menu ("..."): Edit, Duplicate, Export JSON, Delete

Below cards: "+ Create Manual Persona" card (dashed border, ghost styling)

Analysis summary bar (bottom):
  "Last analysis: {date} · {N} articles crawled · {human} human · {hybrid} hybrid
   · {ai} AI · {clusters} clusters detected · [View Analysis History]"
```

### 6.5 Detail-Open State -- Slide-over Panel
```
Right slide-over (480px desktop, full-screen mobile) with:
  Header: Back arrow + persona name + [★ Default] [Edit] [Delete] actions
  3 tabs: Profile | Samples | Sources

  Profile tab:
    Voice DNA section: all quantified metrics with inline visual bars
    Constraints section: hard limits enforced during generation
    Forbidden Phrases: pill badges, removable
    Signature Phrases: pill badges, addable
    Voice Description: paragraph-length qualitative summary

  Samples tab:
    "Representative Sentences" -- 5-8 actual sentences from the corpus that
      best exemplify this persona's voice. Each with source URL attribution.
    "Opener Style" -- 2-3 example article openers
    "Closer Style" -- 2-3 example article closers

  Sources tab:
    DataTable of all articles in this persona's cluster.
    Columns: URL (truncated, link), Author, Words, Classification (badge),
      Confidence (%), Distance (from cluster centroid).
    Sortable by any column. Click URL to open in new tab.
    Shows total: "47 articles in this persona's corpus"
```

### 6.6 Editing State -- Inline Parameter Adjustment
```
User clicks "Edit" on slide-over header or card overflow menu.
Profile tab fields become editable:
  - Name: text input replaces static text
  - Formality score: slider (0-100) replaces static number
  - Passive voice ratio target: slider (0.00-0.30, step 0.01)
  - Max hedging density: number input
  - Max cliche density: number input
  - Forbidden phrases: pill badges with "x" remove button + "Add" input
  - Signature phrases: pill badges with "x" remove button + "Add" input
  - Voice description: textarea replaces static paragraph

Non-editable fields grayed out with "auto-detected" label:
  TTR, avg sentence length, sentence variance, corpus size, confidence
  (these are corpus-derived, not user-configurable)

Footer: [Cancel] [Save Changes] buttons. Save triggers
  PUT /api/voice/personas/:id with changed fields only.
Toast on success: "Persona updated. Changes apply to future articles."
```

### 6.7 Insufficient Articles Warning (<50)
```
Analysis completes but site has fewer than 50 articles.
Alert banner (warning variant) above persona cards:
  "⚠ Limited corpus: Only {N} articles found. Voice personas are more
   accurate with 50+ articles. Confidence level has been reduced."
Personas still generated but all marked confidence: "low" or "very_low".
Link: "Learn how corpus size affects accuracy →"
```

### 6.8 All-AI-Content Warning
```
Analysis completes and ALL articles classified as AI_GENERATED or HYBRID.
No HUMAN articles found to cluster.
Alert banner (destructive variant):
  "No human-written content detected. All {N} articles were classified as
   AI-generated or hybrid. Voice personas require human-written articles
   as training data."
Two CTAs below:
  [Create Manual Persona] -- opens dialog to define voice from scratch
  [Provide Reference URLs] -- opens dialog to paste 3-5 URLs of writing
    samples from other sites that represent the target voice
Manual persona source = "manual", reference persona source = "reference".
```

### 6.9 Error State -- Analysis Failed
```
Progress section shows failed stage with error:
  ┌────────────────────────────────────────────────────────┐
  │  Analysis Failed                                       │
  │                                                        │
  │  ✓ Crawling         87 articles discovered             │
  │  ✗ Classifying      Error: Rate limit exceeded         │
  │  ○ Clustering        skipped                           │
  │  ○ Generating        skipped                           │
  │                                                        │
  │  [Retry Analysis]  [View Error Details]                │
  └────────────────────────────────────────────────────────┘

"View Error Details" expands to show full error message and suggestion.
Common errors: rate limit (wait and retry), site unreachable (check URL),
  content extraction failed (check for JavaScript-rendered content).
```

### 6.10 Stale Analysis Warning
```
When the last analysis is > 90 days old and the user has published 20+ new
articles since the last analysis:
  Alert banner (info variant) below header:
    "Your voice analysis is {N} days old and {M} new articles have been published
     since. Re-analyze to update your personas with recent content."
    [Re-analyze Now] button
```

---

## 7. Interactions

| # | Trigger | Action | Feedback | API Call |
|---|---------|--------|----------|----------|
| 1 | Click "Analyze Your Site" (empty state) | Open dialog: enter site URL (pre-filled from connections if available), confirm | Dialog with URL input + "Start Analysis" button | POST `/api/voice/analyze` `{ site_url, trigger_type: "manual" }` |
| 2 | Analysis starts | Dialog closes, progress section appears with 4-stage tracker | Live progress updates every 3s | GET `/api/voice/analysis/:sessionId` (polling) |
| 3 | Analysis completes | Progress section fades, persona cards animate in (stagger 200ms) | Toast: "Analysis complete. {N} personas detected." | Automatic via polling detecting status = "completed" |
| 4 | Click persona card | Slide-over opens from right with Profile tab active | 300ms slide animation, backdrop dimming | GET `/api/voice/personas/:id` (full profile with voice_profile JSONB) |
| 5 | Click "Set Default" on card | Badge moves to clicked card, previous default loses badge | Optimistic UI: badge moves immediately, revert on error. Toast: "Default persona updated." | PUT `/api/voice/personas/:id/default` |
| 6 | Click "Edit" on slide-over | Fields become editable (name, formality, constraints, phrases) | Inline inputs replace static text. Save/Cancel footer appears | None until Save |
| 7 | Click "Save Changes" | Validate inputs, send update | Loading spinner on Save button. Toast on success. Fields revert to static | PUT `/api/voice/personas/:id` `{ name, formality_score, voice_profile.constraints, ... }` |
| 8 | Click "Delete" on slide-over | AlertDialog: "Delete '{name}'? Articles generated with this persona will retain their voice match scores but no longer link to a persona." | Destructive confirmation dialog. Slide-over closes on confirm | DELETE `/api/voice/personas/:id` |
| 9 | Click "+ Create Manual Persona" | Dialog with form: name, tone (select), formality (slider), description (textarea), forbidden phrases (tag input) | Multi-step dialog. Step 1: basics. Step 2: constraints. Step 3: review | POST `/api/voice/personas` `{ source: "manual", ... }` |
| 10 | Click article URL in Sources tab | Open URL in new browser tab | Standard link behavior | None |
| 11 | Click "Cancel Analysis" | Confirm dialog: "Cancel running analysis? Partial results will be discarded." | Analysis stops, progress section removed | PUT `/api/voice/analysis/:sessionId/cancel` |
| 12 | Hover over confidence badge | Tooltip explains confidence level: "HIGH: Cluster cohesion < 0.25. This persona is well-defined across {N} articles." | Tooltip appears after 500ms delay | None |
| 13 | Click "View Analysis History" | Navigate to `/voice/history` or open a dialog showing past analysis sessions | DataTable: date, articles crawled, clusters found, duration, status | GET `/api/voice/analysis/history` |
| 14 | Click "Export JSON" in card overflow | Download persona's `voice_profile` JSONB as formatted .json file | Browser download trigger | None (client-side from cached data) |
| 15 | Click "Duplicate" in card overflow | Create copy of persona with name "{original name} (Copy)" | Toast: "Persona duplicated." New card appears in grid | POST `/api/voice/personas` with cloned data |

---

## 8. API Integration

### Endpoints Used

| Method | Path | Purpose | Cache |
|--------|------|---------|-------|
| GET | `/api/voice/personas` | List all personas for current user | 60s stale-while-revalidate |
| GET | `/api/voice/personas/:id` | Full persona detail with voice_profile JSONB | 60s SWR |
| POST | `/api/voice/personas` | Create manual/reference persona | Invalidates list cache |
| PUT | `/api/voice/personas/:id` | Update persona name, constraints, phrases | Invalidates list + detail cache |
| PUT | `/api/voice/personas/:id/default` | Set persona as default | Invalidates list cache |
| DELETE | `/api/voice/personas/:id` | Delete persona | Invalidates list cache |
| POST | `/api/voice/analyze` | Start new site analysis | Returns session_id for polling |
| GET | `/api/voice/analysis/:sessionId` | Poll analysis progress | No cache (real-time) |
| PUT | `/api/voice/analysis/:sessionId/cancel` | Cancel running analysis | Invalidates analysis state |
| GET | `/api/voice/analysis/history` | List past analysis sessions | 5min SWR |
| GET | `/api/voice/match-scores?persona_id=X&limit=10` | Recent voice match scores for persona | 60s SWR |

### Data Fetching Strategy

```typescript
// Server component: initial persona list
// app/voice/page.tsx
async function VoiceProfilesPage() {
  const personas = await fetchPersonas(); // RSC fetch, cached 60s
  const latestAnalysis = await fetchLatestAnalysis(); // RSC fetch
  return (
    <VoiceProfilesClient
      initialPersonas={personas}
      latestAnalysis={latestAnalysis}
    />
  );
}

// Client component: handles mutations + polling
// Polling during analysis: setInterval 3000ms on analysis session endpoint
// Optimistic updates for set-default (revert on error)
// SWR revalidation after any mutation
```

---

## 9. Mobile Behavior

| Breakpoint | Layout Change |
|------------|---------------|
| >= 1024px | 2-column card grid. Slide-over is 480px from right edge |
| 768-1023px | 2-column card grid. Slide-over is 400px from right edge |
| < 768px | 1-column card grid (full width). Slide-over becomes full-screen sheet from bottom |
| < 768px | Analysis progress section: stages stack vertically, counters below each stage name |
| < 768px | Card overflow menu remains accessible (top-right "..." on each card) |
| < 768px | "Analyze Site" button moves into a floating bottom bar when scrolled past header |

**Touch targets:** All interactive elements minimum 44x44px. Slider handles enlarged to 48x48px on touch devices. Swipe-to-dismiss on mobile slide-over.

---

## 10. Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | Tab through persona cards, Enter to open slide-over, Escape to close. Arrow keys between tabs |
| Screen reader | Cards use `role="article"` with `aria-label="Persona: {name}, {tone} tone, {corpus_size} articles"`. Default badge announced as "Default voice persona" |
| Focus management | Opening slide-over traps focus inside panel. Closing returns focus to triggering card |
| Progress announcement | Analysis progress uses `aria-live="polite"` region. Stage transitions announced: "Stage 2 of 4: Classifying. 43 of 87 articles processed" |
| Color independence | Confidence levels use both color AND text label (not color alone). Pass/fail indicators use icons (checkmark/x) alongside color |
| Reduced motion | All card animations and slide-over transitions respect `prefers-reduced-motion`. Instant show/hide with no animation |
| Slider labels | Each slider has visible label, current value readout, and `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext` |
| RTL support | Full layout mirroring for Arabic: slide-over opens from left, card grid direction reversed, text alignment flipped |

---

## 11. Edge Cases

| # | Scenario | Handling |
|---|----------|----------|
| 1 | Site has exactly 50 articles but 48 are AI-generated | Only 2 HUMAN articles. HDBSCAN cannot cluster. Generate a single persona from the 2 articles with confidence "very_low". Show warning: "Only 2 human articles found. Persona may not be representative." |
| 2 | Analysis discovers 500+ articles | Crawling stage takes longer. Progress shows "Crawling... 234 articles discovered (still scanning)". Classify stage processes in batches of 50 with progress counter. Total analysis time 3-8 minutes |
| 3 | User deletes the default persona | AlertDialog warns: "This is your default persona. Deleting it means generated articles will use no voice persona until a new default is set." On confirm, delete and remove is_default. No auto-assignment to another persona |
| 4 | Two personas have identical names after user edit | PUT returns 409 Conflict. Toast: "A persona named '{name}' already exists. Choose a different name." Input field shows error ring |
| 5 | Arabic site with mixed MSA and dialectal content | HDBSCAN naturally separates formal MSA and conversational dialect into different clusters. Persona cards show language="ar" with formality score differentiating them. Arabic-specific metrics (tashkeel frequency, root pattern diversity) shown in profile |
| 6 | User triggers re-analysis while existing personas exist | Confirmation dialog: "Re-analyzing will replace existing auto-detected personas. Manual personas will be preserved. Continue?" On confirm, delete auto personas, start new analysis |
| 7 | Concurrent analysis attempts | POST `/api/voice/analyze` returns 409 if an analysis is already running for this user. Toast: "An analysis is already in progress." with link to view its status |
| 8 | Persona name contains special characters or emoji | Allow any Unicode text up to 100 characters. Trim whitespace. Display as-is. No sanitization beyond length |
| 9 | Slide-over open when underlying data changes | SWR revalidation detects data change. Slide-over content updates without closing. If persona was deleted by another session, slide-over shows "Persona no longer exists" and auto-closes after 3s |
| 10 | Voice match scores requested but no articles generated yet | Slide-over Profile tab shows "No articles generated with this persona yet. Voice match scores will appear here after your first article." |

---

## 12. Frustration Mitigation

Each frustration from the TTG brief is mapped to a specific design solution:

| Frustration | Root Cause | Solution |
|-------------|------------|----------|
| Can't tell WHICH articles influenced a persona | Persona cards only show aggregate metrics | Sources tab in slide-over shows every article in the persona's cluster with URL, author, classification, and cluster distance. Users can click any URL to read the original article and understand why it shaped the persona |
| Analysis takes too long with no feedback | Voice analysis crawls 50-100+ URLs, classifies each, runs HDBSCAN, generates profiles. Can take 2-8 minutes | 4-stage progress tracker with per-stage timing, live article counters, and determinate progress bars where possible. User sees exactly which stage is running and how many articles have been processed. Cancel button available at any time |
| Auto-generated name doesn't match brand terminology | HDBSCAN cluster names are generated by the LLM based on stylometric patterns, not brand knowledge | Persona name is the first editable field in the Edit state. Single click on the name in the slide-over header enters inline edit mode. Change is saved instantly on blur or Enter |
| Can't manually create a persona without running analysis | Some users (new sites, rebranding) have no existing content to analyze | "+ Create Manual Persona" card always visible below auto-detected personas. Opens a multi-step dialog: basics (name, tone, description), constraints (passive voice max, TTR min, forbidden phrases), and review. Source = "manual" |
| No way to compare two personas | Users managing multiple content verticals need to see differences side-by-side | Phase 1: open two browser tabs with different persona slide-overs. Phase 2 (planned): "Compare" action in card overflow menu opens a side-by-side comparison dialog with delta indicators for each metric |

---

## 13. Real-Time & Polling Behavior

| Scenario | Strategy | Interval | Termination |
|----------|----------|----------|-------------|
| Analysis in progress | Poll `GET /api/voice/analysis/:sessionId` | 3 seconds | Status transitions to `completed`, `failed`, or `cancelled` |
| Analysis completing | Final poll returns `completed` status with `personas_generated` count | -- | Invalidate persona list cache, fetch new personas, render cards |
| Idle browsing | SWR background revalidation on persona list | 60 seconds | Continuous while page is visible (document.visibilityState === "visible") |
| Tab hidden | Pause all polling and SWR revalidation | -- | Resume on `visibilitychange` event |

---

## 14. Dependencies

| Dependency | Type | Impact |
|------------|------|--------|
| Voice Intelligence Service (Service #9) | Backend | Provides all persona data, analysis pipeline, voice_profile JSONB |
| Auth & Bridge Server | Backend | JWT validation, user context for RLS |
| Quality Gate Service (Service #10) | Data | Voice match scores displayed in persona slide-over come from quality_scores.rubric_details.voice_match |
| Connections screen (Screen 9) | Navigation | "Analyze Your Site" URL may be pre-filled from connected site data |
| Article Pipeline (Screen 3) | Navigation | Persona "Set Default" affects which voice is used for new article generation |
| Supabase | Infrastructure | writer_personas, analysis_sessions, voice_match_scores tables + RLS |

**Blocks:** Article generation with voice persona support (voice_profile consumed by draft-writer agent)
**Blocked by:** Voice Intelligence Service API endpoints, Auth/Bridge Server

---

## 15. Testing Scenarios

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| 1 | First-time empty state | New user navigates to `/voice` | Empty state with "Discover Your Brand Voice" illustration, "Analyze Your Site" CTA, 3-column explanation. No skeleton flicker |
| 2 | Start analysis | Click "Analyze Your Site", enter URL, confirm | Dialog closes. 4-stage progress appears. Stage 1 (Crawling) active with spinner. Article counter incrementing |
| 3 | Analysis progress tracking | Observe progress during all 4 stages | Each stage transitions ○ → ● → ✓ with timing. Live counters update. Progress bar advances. Classification breakdown shows during stage 2 |
| 4 | Analysis complete | Wait for all 4 stages to complete | Progress fades. 2-3 persona cards animate in with stagger. Toast: "Analysis complete." Analysis summary bar appears at bottom |
| 5 | Set default persona | Click "Set Default" on non-default card | Badge moves optimistically. Toast: "Default persona updated." API call succeeds. Previous default card loses badge |
| 6 | Open persona detail | Click "View" or click persona card | Slide-over opens from right (300ms). Profile tab active. All voice DNA fields populated. Constraints section visible |
| 7 | Edit persona name | Click "Edit" in slide-over, change name, click Save | Name field becomes input. Type new name. Save button enables. On save, toast: "Persona updated." Field reverts to static text |
| 8 | Delete persona | Click "Delete" in slide-over | AlertDialog with warning text. Confirm deletes persona, closes slide-over, removes card from grid with fade animation |
| 9 | Create manual persona | Click "+ Create Manual Persona" | 3-step dialog. Fill basics, constraints, review. On complete, new card appears in grid with source="manual" icon |
| 10 | Cancel running analysis | Click "Cancel Analysis" during stage 2 | Confirmation dialog. On confirm, analysis stops. Progress section shows cancelled state. No partial personas created |
| 11 | Insufficient articles | Analyze site with 30 articles | Warning banner: "Limited corpus: Only 30 articles found." Personas created with low/very_low confidence badges |
| 12 | All AI content | Analyze site where all articles are AI-generated | Warning banner with "No human-written content detected." Two CTAs: Create Manual Persona, Provide Reference URLs |
| 13 | Mobile layout | View on 375px viewport | Single-column cards. Slide-over becomes full-screen bottom sheet. "Analyze Site" in floating bottom bar. Touch targets >= 44px |
| 14 | RTL layout | Switch to Arabic locale | Card grid mirrors. Slide-over opens from left. All text right-aligned. Metrics labels in Arabic where translated |
| 15 | Keyboard navigation | Tab through entire page without mouse | Focus ring visible on all interactive elements. Cards focusable. Enter opens slide-over. Escape closes. Tab cycles within trapped focus |
