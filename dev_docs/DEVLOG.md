# Development Log

Chronological record of significant changes to the Mansati project.

---

## 2026-04-09

### Rating Scale Standardization
**Scope:** messages/en.json, 4 page files, 2 SEO engine agent files
**Why:** Blog articles had mixed rating scales — CRM, HR, PM articles used /10 while POS, Foodics, Odoo, Website Builders used /5. The POS page also had a bug where scores were /5 but the bar width calculation divided by 10, showing bars at ~45% instead of ~90%.
**What changed:**
- Converted all s11 scores from /10 to /5 (CRM, HR, PM articles)
- Converted all s3Row table ratings from /10 to /5 (CRM: 7 tools, PM: 10 tools)
- Changed `s11ScoreMax` from `/10` to `/ 5` in CRM, HR, PM namespaces
- Fixed bar width calculation in all 4 comparison pages: `parseFloat(...) / 10` -> `parseFloat(...) / 5`
- Added RATING SCALE enforcement rule to seo-engine draft-writer.md (Phase B) and article-architect.md (concept rules)
**Build:** Passes

### Performance & Polish (committed)
- `bf16b40` fix performance
- `77dfa58` fix color
- `9ad1e54` fix image size

---

## 2026-04-08

### Bug Fixes & Polish (committed)
- `3ac98f1` fix FAQ
- `de6ae00` fix the nav
- `d401882` add the fix blogs page
- `d8689de` performance optimization done
- `ec5c67f` fix performance

---

## 2026-04-07

### Site Completion (committed)
- `2bd4382` website done — core pages, components, and styling complete
- `096fc59` fix the website
- `cf0321f` done
- `4f340a0` done

---

## 2026-04-06

### Article Pipeline (committed)
- `ef0d6ce` CRM article completed
- `d34cc34` ZATCA article added
- `56dcff6` plugin images
- `bb4788a` add one more blog article
- `5626184` update pages
- `b0ab3a4` add commit card

---

## 2026-04-05

### Bulk Content (committed)
- `df66a9f` three articles done

---

## 2026-04-04

### Feature Additions (committed)
- `75e5e4a` pricing section added + Shopify article

---

## 2026-04-03

### SEO Engine Integration (committed)
- `6b8db61` SEO engine pipeline — article types, /out/ redirects, CTA placement, internal linking, image orchestration
- `5a324fe` added SEO engine
- `fd80bc5` add SEO engine

---

## 2026-03-30

### Repository Cleanup (committed)
- `cb4daae` remove article-engine embedded repo from tracking — transitioned to plugin architecture
