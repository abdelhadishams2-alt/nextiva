# VI-004: Dashboard Voice Profiles Page

> **Phase:** 8 | **Priority:** P1 | **Status:** NOT STARTED
> **Effort:** L (10h) | **Type:** feature
> **Sprint:** 7 (Weeks 13-14)
> **Backlog Items:** Voice Intelligence — Dashboard UI
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `PROJECT-BRIEF.md` — Section "Layer 3: Voice Intelligence" for persona format
3. `bridge/intelligence/voice-analyzer.js` — corpus analyzer + clustering (VI-001, VI-002)
4. `bridge/server.js` — `/api/voice/personas` CRUD endpoints from VI-002, `/api/voice/analyze` from VI-003
5. `dashboard/` — existing Next.js 16 dashboard structure, page conventions, shadcn/ui components
6. `dashboard/app/` — existing page layout patterns

## Objective
Build the Voice Profiles dashboard page at `/voice` displaying a grid of detected writer personas with tone, TTR, corpus size, and default status. Include a detail panel showing the full voice profile, sample sentences, and source articles. Provide "Analyze Site" and "Set as Default" actions to trigger voice analysis and manage persona preferences.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `dashboard/app/voice/page.tsx` | Main voice profiles page — server component, data fetching |
| CREATE | `dashboard/components/voice/persona-card.tsx` | Persona summary card with key metrics and default badge |
| CREATE | `dashboard/components/voice/persona-detail.tsx` | Full voice profile panel with tabs |
| CREATE | `dashboard/components/voice/analyze-dialog.tsx` | "Analyze Site" modal with URL input and progress |
| MODIFY | `dashboard/app/layout.tsx` | Add "Voice" item to main navigation sidebar |
| CREATE | `tests/dashboard-voice.test.js` | Component and integration tests |

## Sub-tasks

### Sub-task 1: Persona Card Component (~2h)
- Create `dashboard/components/voice/persona-card.tsx`
- Card layout (shadcn/ui Card component):
  - **Header:** Persona name (e.g., "The Technical Storyteller") + default badge (star icon, gold)
  - **Metrics row:** 4 compact stats:
    - Tone badge (conversational/formal/technical/casual) with color coding
    - TTR value (e.g., "0.72") with label "Vocabulary"
    - Corpus size (e.g., "34 articles") with label "Source"
    - Formality score bar (0-100 mini progress bar)
  - **Preview:** First 80 characters of the `voice` description, truncated with ellipsis
  - **Actions:** "Set as Default" button (disabled if already default), "View" button, overflow menu (Edit, Delete)
- Props: `{ persona: PersonaType, isDefault: boolean, onSetDefault, onView, onDelete }`
- Selected state: highlighted border when clicked/active
- Hover state: subtle shadow elevation
- RTL support: mirror layout for Arabic interface

### Sub-task 2: Persona Detail Panel (~3h)
- Create `dashboard/components/voice/persona-detail.tsx`
- Slide-over panel or full-width section below the grid (context-dependent on screen size)
- **Header:** Persona name, edit button (pencil icon), close button
- **Tabs:**
  1. **Profile tab:**
     - Voice description (full text)
     - Cadence details: avg sentence length, sentence mix percentages, opener style
     - Vocabulary: TTR, signature phrases list, avoid-list as red badges
     - Tone & Personality: humor style, authority level, engagement patterns
     - Formatting: heading style, list preferences, number style, bold usage
  2. **Samples tab:**
     - 5 representative sentences displayed as styled quote blocks
     - Each with source article URL link
     - "These sentences best represent this writer's voice" helper text
  3. **Sources tab:**
     - DataTable of source articles: title, URL, author, word count, AI probability score
     - Sortable by any column
     - Click to open article URL in new tab
     - Corpus summary stats at top: total articles, date range, authors
- **Edit mode:** Inline editing of persona name, voice description, avoid-list, signature phrases
- Save button calls `PUT /api/voice/personas/:id`
- Delete confirmation dialog with warning about impact on future generations

### Sub-task 3: Main Voice Page (~2.5h)
- Create `dashboard/app/voice/page.tsx`
- Server component that fetches personas from `GET /api/voice/personas`
- Layout:
  1. **Header row:** Page title "Voice Profiles", "Analyze Site" button (primary), corpus status indicator
  2. **Corpus status:** If no analysis run: "No voice analysis yet. Analyze your site to detect writer personas." with prominent CTA
  3. **Persona grid:** 2-3 columns of PersonaCard components, responsive (1 col on mobile)
  4. **Detail area:** PersonaDetail opens below/beside the selected card
- Empty state: illustration + "Analyze your site to discover your writers' voices" + CTA button
- Loading state: skeleton cards while fetching
- Add "Voice" to the main navigation sidebar in `dashboard/app/layout.tsx`

### Sub-task 4: Analyze Site Dialog (~2.5h)
- Create `dashboard/components/voice/analyze-dialog.tsx`
- Modal dialog triggered by "Analyze Site" button
- **Form fields:**
  - Site URL (required, validated format: must start with https://)
  - Max pages slider (50-500, default 200)
  - Preferences textarea (optional: "Describe any style preferences to enforce")
- **Submit:** Calls `POST /api/voice/analyze` with form data
- **Progress view:** After submit, dialog transforms into progress panel:
  - Stage indicator: Crawling (with page counter) → Classifying → Clustering → Profiling
  - Progress bar based on SSE events from `/api/voice/analyze/progress/:jobId`
  - Live stats: "Found 87 articles, 52 classified as human-written"
  - Cancel button (sends cancel request to job queue)
- **Completion:** Dialog shows summary of discovered personas with "View Profiles" button
- **Error handling:** If crawl fails (site unreachable, insufficient articles), show friendly error with suggestions

## Testing Strategy

### Component Tests (`tests/dashboard-voice.test.js`)
- Test PersonaCard renders all fields correctly (name, tone, TTR, corpus size, default badge)
- Test PersonaCard "Set as Default" button disabled when already default
- Test PersonaDetail tabs switch correctly and display appropriate content
- Test AnalyzeDialog form validation (URL format, required fields)
- Test empty state renders when no personas exist
- Test loading skeleton renders during data fetch

### Integration Tests
- Test voice page loads personas from API and displays grid
- Test clicking "Set as Default" calls PUT endpoint and updates UI
- Test "Analyze Site" triggers analysis and shows SSE progress
- Test persona detail panel opens with full profile data
- Test delete confirmation and API call
- Test RTL layout for Arabic interface

## Acceptance Criteria
- [ ] Voice Profiles page accessible at `/voice` with navigation link in sidebar
- [ ] Persona cards display name, tone badge, TTR, corpus size, and default badge
- [ ] Detail panel shows full voice profile with Profile, Samples, and Sources tabs
- [ ] "Set as Default" updates the default persona via API
- [ ] "Analyze Site" dialog accepts URL, shows SSE progress, displays results
- [ ] Empty state guides users to run their first analysis
- [ ] Inline editing of persona name, voice description, and avoid-list
- [ ] Delete confirmation prevents accidental deletion
- [ ] Responsive layout: grid collapses on mobile, detail panel stacks below
- [ ] RTL support for Arabic interface
- [ ] All tests pass (`npm test`)

## Dependencies
- Blocked by: VI-001 (corpus analyzer), VI-002 (clustering + CRUD endpoints), VI-003 (voice agent + trigger endpoint)
- Blocks: None
