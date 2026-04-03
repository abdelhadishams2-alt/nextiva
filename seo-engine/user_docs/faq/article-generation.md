# FAQ — Article Generation

> **Category:** Article Generation
> **Last Updated:** 2026-03-28

---

## General Questions

### Q: How long does it take to generate an article?

**A:** Typical generation time is 3-8 minutes, depending on:
- **Content length** — Brief (~2 min), Standard (~4 min), Long-form (~7 min)
- **Image generation** — Adds 30-60 seconds if enabled
- **Research depth** — Complex technical topics may take longer due to 6-round research
- **Quality gate** — If enabled, adds 1-2 minutes for scoring and optional auto-revision

The real-time progress indicator on the Generate page shows which pipeline stage is active.

### Q: What languages are supported for article generation?

**A:** ChainIQ supports 11 languages: Arabic (with full RTL support), English, French, Spanish, German, Italian, Portuguese, Dutch, Turkish, Japanese, and Korean. Language is either auto-detected from your topic keyword or manually selected in the generation options. Arabic articles include proper right-to-left layout, Arabic typography with appropriate font stacks, and CSS logical properties for correct rendering.

### Q: Can I generate articles in multiple languages from the same topic?

**A:** Yes. Generate the article once in your primary language, then use the Generate page again with the same topic but a different language selection. Each generation is independent — the research engine re-runs in the target language to ensure culturally relevant content and locally appropriate examples.

### Q: What makes ChainIQ different from other AI writing tools?

**A:** ChainIQ is purpose-built for publishers, not general text generation:
1. **4-agent pipeline** — Research, architecture, and writing are handled by specialized agents, not a single prompt
2. **193-component registry** — Articles use professional structural components (hero sections, comparison tables, FAQ blocks), not just paragraphs
3. **Framework-native output** — Generates actual Next.js `.tsx`, Vue `.vue`, or SvelteKit `+page.svelte` files, not generic text
4. **Design token injection** — Matches your existing project's colors, fonts, and spacing automatically
5. **7-signal quality gate** — Scores every article for E-E-A-T, readability, AI detection avoidance, and more
6. **Content Intelligence** — Recommends topics based on your GSC/GA4 data, not guesswork

---

## Content Quality

### Q: How do I improve the quality of generated articles?

**A:** Several factors improve quality:
- **Specific topics** — "Best CRM for B2B SaaS startups under 50 employees" produces better results than "CRM software"
- **Enable the quality gate** — Auto-revision passes catch and fix low-scoring signals
- **Configure a voice profile** — The Voice Intelligence feature analyzes your existing content to match your brand's writing style
- **Use inline editing** — Refine specific sections with targeted instructions

### Q: Are the generated articles detectable as AI-written?

**A:** ChainIQ actively works to minimize AI detection:
- The quality gate includes an "AI Detection" signal that scores naturalness
- Articles use varied sentence structures, concrete examples, and domain-specific language
- The 193-component registry creates diverse article structures that don't follow repetitive AI patterns
- Voice profiles match your brand's unique writing style, further differentiating output

However, no AI generation tool can guarantee 100% undetectability. We recommend human review and light editing of all generated content before publishing.

### Q: Can I set minimum quality thresholds for articles?

**A:** Yes. In **Settings → Preferences → Quality Gate**, you can:
- Set a minimum quality score (default: 70%)
- Enable/disable auto-revision (up to 2 passes)
- Choose which quality signals matter most for your content (adjust weights)
- Flag articles below threshold for manual review instead of auto-publishing

---

## Technical Questions

### Q: What output formats does ChainIQ support?

**A:** ChainIQ generates articles in framework-native formats:

| Framework | Output | Features |
|-----------|--------|----------|
| Next.js | `.tsx` page component | `next/image` for images, App Router conventions, TypeScript |
| Vue | `.vue` single-file component | Scoped CSS, Composition API, `<template>`/`<script>`/`<style>` |
| Svelte | `+page.svelte` | SvelteKit page conventions, scoped styles |
| WordPress | PHP with WordPress functions | `wp_get_attachment_image()`, theme compatibility |
| Plain HTML | Standalone `.html` | Inline CSS, self-contained, works anywhere |

Auto-detection analyzes your project directory to choose the right format automatically.

### Q: How does the component system work?

**A:** ChainIQ's Article Architect selects from 193 structural components to build each article. Components are categorized by purpose:
- **Content blocks** — Hero sections, text blocks, pull quotes, code snippets
- **Data presentation** — Comparison tables, statistics grids, pricing tables, feature matrices
- **Interactive elements** — FAQ accordions, tabbed content, image galleries
- **Navigation** — Table of contents, breadcrumbs, related articles
- **SEO elements** — Schema markup, meta descriptions, structured data

The architect selects 10-30 components per article based on the topic, content length, and what best serves the information architecture.

### Q: Can I use my own components instead of ChainIQ's registry?

**A:** Yes. ChainIQ operates in three adaptation modes:
1. **EXISTING** — If your project already has components (e.g., a React component library), the Project Analyzer detects them and the Draft Writer uses your components
2. **REGISTRY** — Uses ChainIQ's 193 built-in component blueprints (default)
3. **FALLBACK** — Generates simple HTML components from scratch if neither option is available

Mode selection is automatic based on what the Project Analyzer finds in your codebase.

### Q: How are images generated?

**A:** Images are generated by Google's Gemini model during the pipeline's Image Generation stage:
- 4-6 images per article by default (configurable in Settings)
- Images are contextually relevant to the article topic and surrounding text
- Output format: PNG (WebP conversion planned for future optimization)
- Images are embedded directly in the article HTML
- No external image hosting required — everything is self-contained

---

## Editing & Versioning

### Q: Can I edit specific sections of a generated article?

**A:** Yes. Every generated article includes an inline edit UI:
1. Open the article in your browser
2. Hover over any section to reveal the **Edit** button
3. Click Edit, describe the change in plain language
4. ChainIQ rewrites only that section while preserving the rest
5. Changes are saved as a new version automatically

You can edit sections as many times as needed, and revert to any previous version.

### Q: Is there a limit on how many edits I can make?

**A:** There is no hard limit on edits per article. However, each edit uses the bridge server's edit pipeline, which is rate-limited:
- Starter: 5 edits/minute
- Professional: 15 edits/minute
- Enterprise: 30 edits/minute

In practice, this is rarely a bottleneck since each edit takes 15-60 seconds to process.

### Q: How does version history work?

**A:** Every change to an article (initial generation and each edit) creates a version in the `article_versions` table:
- Versions are immutable — once created, they cannot be modified
- You can view the full version history from the Articles page
- Revert to any previous version with one click
- Version metadata includes: timestamp, editor user ID, section edited, and edit instruction
