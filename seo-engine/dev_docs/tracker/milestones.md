# ChainIQ — Milestones

> **Last Updated:** 2026-03-28

## Milestone Index

| # | Milestone | Target Sprint | Gate Criteria |
|---|-----------|--------------|---------------|
| M1 | Data Pipeline Connected | S2 | GSC + GA4 pulling data, content inventory populated |
| M2 | Intelligence Active | S5 | Decay alerts firing, topic recommendations generated |
| M3 | Quality Automated | S5 | 60-point SEO checklist + 7-signal scoring working |
| M4 | Voice Matched | S7 | Writer personas generated, voice-matched articles |
| M5 | One-Click Publish | S9 | WordPress + Shopify publishing from dashboard |
| M6 | Full Loop Closed | S10 | 30/60/90 day tracking + auto-recalibration |

---

## Milestone Details

### M1: Data Pipeline Connected (Sprint 2, ~Week 4)

- **Gate criteria:**
  - [ ] Google OAuth flow completes without errors
  - [ ] GSC connector returns search performance data for test property
  - [ ] GA4 connector returns engagement metrics
  - [ ] Content crawler builds inventory from sitemap
  - [ ] All tokens encrypted at rest (AES-256-GCM)
- **Go/No-Go:** Can the user see their GSC data in the dashboard?
- **Stakeholder comms:** "Data connections are live — you can now see your search performance and content inventory."
- **Optimistic:** Week 3 | **Expected:** Week 4 | **Pessimistic:** Week 5

---

### M2: Intelligence Active (Sprint 5, ~Week 10)

- **Gate criteria:**
  - [ ] Decay detection algorithm identifies declining pages with >80% precision
  - [ ] Decay alerts fire in dashboard and via email/webhook
  - [ ] Topic gap analysis returns actionable cluster recommendations
  - [ ] Topic recommender generates prioritized content briefs
  - [ ] Cannibalization detector flags conflicting pages with suggested resolution
- **Go/No-Go:** Does the system surface a real content decay issue the user didn't know about?
- **Stakeholder comms:** "Intelligence layer is live — ChainIQ now detects content decay and recommends topics automatically."
- **Optimistic:** Week 9 | **Expected:** Week 10 | **Pessimistic:** Week 12

---

### M3: Quality Automated (Sprint 5, ~Week 10)

- **Gate criteria:**
  - [ ] 60-point SEO checklist runs on any URL or draft article
  - [ ] 7-signal content scoring returns a composite quality score (0-100)
  - [ ] Checklist flags are actionable (clear fix instructions per item)
  - [ ] Scoring calibrated against manual review of 20+ articles
  - [ ] Quality scores stored historically for trend tracking
- **Go/No-Go:** Does the quality score correlate with actual SERP performance on test set?
- **Stakeholder comms:** "Quality engine is live — every article gets a 60-point SEO audit and 7-signal score before publish."
- **Optimistic:** Week 9 | **Expected:** Week 10 | **Pessimistic:** Week 12

---

### M4: Voice Matched (Sprint 7, ~Week 14)

- **Gate criteria:**
  - [ ] Voice analyzer ingests 10+ existing articles and extracts style fingerprint
  - [ ] Writer personas table populated with tone, vocabulary, and structure attributes
  - [ ] Generated articles pass blind test (indistinguishable from existing author voice)
  - [ ] Persona editor allows manual tuning of voice parameters
  - [ ] Multi-persona support (different voices for different content types)
- **Go/No-Go:** Can a client editor read a generated article and confirm it "sounds like us"?
- **Stakeholder comms:** "Voice matching is live — generated articles now match each brand's writing style."
- **Optimistic:** Week 13 | **Expected:** Week 14 | **Pessimistic:** Week 16

---

### M5: One-Click Publish (Sprint 9, ~Week 18)

- **Gate criteria:**
  - [ ] WordPress REST API integration publishes draft/scheduled/live posts
  - [ ] Shopify Storefront API integration publishes blog articles
  - [ ] Image handling (featured image, inline images) works across both CMS
  - [ ] Category/tag mapping between ChainIQ taxonomy and CMS taxonomy
  - [ ] Publish preview shows exactly what will appear on the live site
  - [ ] Rollback capability (unpublish or revert within 24 hours)
- **Go/No-Go:** Can the user go from generated article to live published page in under 60 seconds?
- **Stakeholder comms:** "One-click publishing is live — articles go from ChainIQ to your site with a single button."
- **Optimistic:** Week 17 | **Expected:** Week 18 | **Pessimistic:** Week 19

---

### M6: Full Loop Closed (Sprint 10, ~Week 20)

- **Gate criteria:**
  - [ ] 30-day performance tracker pulls GSC/GA4 data for published articles
  - [ ] 60-day performance tracker compares against initial projections
  - [ ] 90-day performance tracker triggers recalibration recommendations
  - [ ] Auto-recalibration adjusts scoring weights based on actual performance
  - [ ] Feedback loop data feeds back into topic recommender and quality scorer
  - [ ] Performance dashboard shows ROI metrics per article and per campaign
- **Go/No-Go:** Can the system show that its recommendations improved over 90 days based on real data?
- **Stakeholder comms:** "The full feedback loop is closed — ChainIQ learns from every published article and gets smarter over time."
- **Optimistic:** Week 19 | **Expected:** Week 20 | **Pessimistic:** Week 22

---

## Milestone Dependencies

```
M1 ──► M2 (Intelligence needs data pipeline)
M1 ──► M3 (Quality engine needs content inventory)
M2 + M3 ──► M4 (Voice needs intelligence + quality baseline)
M4 ──► M5 (Publishing needs voice-matched content)
M5 ──► M6 (Feedback loop needs published articles to track)
```

## Risk Register (by Milestone)

| Milestone | Top Risk | Mitigation |
|-----------|----------|------------|
| M1 | Google OAuth quota limits | Apply for higher quota early; cache aggressively |
| M2 | Decay detection false positives | Calibrate on 50+ known-decayed pages before launch |
| M3 | Scoring subjectivity | Anchor scores to measurable SERP signals, not opinion |
| M4 | Voice match quality | Use client blind review as acceptance gate |
| M5 | CMS API breaking changes | Pin API versions; integration tests on CI |
| M6 | Insufficient data for recalibration | Set minimum article threshold (20) before enabling |
