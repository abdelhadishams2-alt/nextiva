# Sprint 7: Voice Completion + Publishing Foundation

> **Weeks:** 13-14 | **Capacity:** ~40h (20h/week) | **Committed:** 30h
> **Theme:** Complete voice intelligence pipeline and lay the publishing foundation

---

## Sprint Goal

Complete the voice intelligence layer with the voice analyzer agent and dashboard, then define the Universal Article Payload schema and image CDN pipeline that all CMS adapters will consume.

---

## Task List

| ID | Task | Effort | Phase | Dependencies | Priority |
| --- | --- | --- | --- | --- | --- |
| VI-003 | Voice Analyzer Agent + Pipeline Integration | L (12h) | P8 - Voice Intelligence | VI-001, VI-002 (corpus + clustering) | P1 |
| VI-004 | Dashboard: Voice Profiles Page | L (10h) | P8 - Voice Intelligence | VI-001, VI-002 (persona data) | P1 |
| PB-001 | Universal Article Payload + Image CDN Pipeline | L (8h) | P9 - Publishing | QG-001, QG-002 (quality scores for payload) | P1 |

### Execution Strategy

- VI-003 and VI-004 can start in parallel -- agent builds voice profiles while dashboard visualizes them
- PB-001 is independent of voice -- can start on Day 1
- Recommended order: VI-003 (Days 1-5) || PB-001 (Days 1-3) -> VI-004 (Days 4-8)
- 10h buffer provides breathing room after the tight Sprint 6

---

## Database Migrations

No new migrations in Sprint 7. Uses tables from migration 011 (Sprint 6).

---

## Key Deliverables

After this sprint, the developer can:

1. **Analyze voice** -- voice-analyzer.md agent produces refined voice profiles from cluster data
2. **Generate voice-constrained articles** -- draft-writer.md accepts voice profile with cadence, vocabulary, and tone constraints
3. **Backward compatible pipeline** -- articles still generate correctly without a voice profile
4. **View Voice Profiles page** -- persona grid with detail panel, voice characteristics, sample passages
5. **Trigger "Analyze Site" dialog** -- launch corpus analysis from the dashboard
6. **Define Universal Article Payload** -- JSON schema covering all fields needed by any CMS adapter
7. **Upload images to CDN** -- image pipeline processes local/generated images and replaces HTML src attributes

---

## Exit Criteria

All must pass before Sprint 7 is marked complete:

- [ ] voice-analyzer.md agent produces structured voice profiles from cluster data
- [ ] draft-writer.md modified to accept and enforce voice profile constraints
- [ ] Voice-constrained article noticeably differs in style from unconstrained article
- [ ] Pipeline backward compatibility: generate article without voice profile, verify no errors
- [ ] Voice Profiles page displays persona grid with cards showing key characteristics
- [ ] Detail panel shows: voice description, cadence pattern, vocabulary set, avoids list, sample text
- [ ] "Analyze Site" dialog accepts URL, triggers corpus crawl, shows progress
- [ ] Universal Article Payload JSON schema defined and validated with JSON Schema Draft 7
- [ ] Payload includes: title, body_html, meta_description, slug, categories, tags, images, schema_markup, quality_scores, voice_profile_id
- [ ] Image CDN pipeline uploads images and replaces src attributes in body_html
- [ ] Image pipeline handles: local files, generated images, external URLs (download + re-upload)

---

## Risk Flags

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Voice constraints produce unnatural-sounding text | Medium | Medium | Tune constraint strength; use "guide" rather than "force" in agent prompts |
| Image CDN costs unpredictable at scale | Low | Medium | Use Supabase Storage (included in plan) as primary; add external CDN later |
| Payload schema misses fields needed by specific CMS platforms | Medium | Low | Design for extensibility with `platform_meta` object for CMS-specific fields |

---

## Handoff Notes for Sprint 8

Sprint 8 (WordPress + Shopify) needs the following from Sprint 7:

- **Universal Article Payload** JSON schema finalized and documented
- **`buildPayload(articleId)`** function that assembles the payload from all data sources
- **Image CDN pipeline** functional with `uploadImage(buffer, filename)` returning a public URL
- **Payload validation** function that verifies a payload against the JSON schema
- **Sample payloads** -- at least 2 real articles converted to payload format for testing
- CMS-specific `platform_meta` extensibility pattern documented for WordPress/Shopify fields
