# Article Generation — User Guide

> **Feature:** AI-powered article generation with real-time progress
> **Available to:** All authenticated users (subject to plan quotas)
> **Dashboard page:** Generate

---

## Overview

ChainIQ generates production-ready articles using a 4-agent AI pipeline. Each article is tailored to your project's tech stack, design system, and target language. Articles include SEO-optimized structure, inline images, and an interactive edit UI for section-level refinements.

---

## How Article Generation Works

### The 4-Agent Pipeline

When you click **Generate Article**, ChainIQ runs four specialized AI agents in sequence:

1. **Project Analyzer** — Detects your project's technology stack (React, Vue, Svelte, WordPress, plain HTML), design tokens (colors, fonts, spacing), component library, and shell environment. This ensures the generated article matches your project perfectly.

2. **Research Engine** — Conducts 6 rounds of research on your topic using multiple sources. Gathers facts, statistics, expert quotes, and competitive landscape information. Each round deepens understanding of the topic from different angles.

3. **Article Architect** — Transforms research into a structured article blueprint. Selects the optimal components from ChainIQ's 193-component registry (hero sections, comparison tables, FAQ blocks, code snippets, testimonials, etc.). Designs the article's information architecture.

4. **Draft Writer** — Assembles the final article as standalone HTML with inline CSS. Applies your project's design tokens, generates framework-native output (e.g., `.tsx` for Next.js, `.vue` for Vue), and embeds the interactive edit UI.

### Generation Progress

During generation, the dashboard shows real-time progress via Server-Sent Events (SSE):

| Stage | Description | Typical Duration |
|-------|-------------|-----------------|
| Initializing | Setting up project context | 5-10s |
| Analyzing Project | Detecting tech stack and design tokens | 10-20s |
| Researching | 6 rounds of topic research | 60-120s |
| Architecting | Building article structure and selecting components | 30-60s |
| Generating Images | Creating 4-6 relevant images via Gemini | 30-60s |
| Writing Draft | Assembling final HTML output | 60-120s |

**Total time:** 3-8 minutes depending on complexity.

---

## Generation Options

### Topic Input

Enter a topic keyword or phrase. ChainIQ works best with:
- **Specific topics**: "best CRM software for small businesses 2026" (good)
- **Broad categories**: "CRM" (too vague — ChainIQ will narrow it, but results may vary)
- **Long-tail keywords**: "how to migrate from Salesforce to HubSpot step by step" (excellent)

### Language Selection

Choose from 11 supported languages:

| Language | Code | RTL | Notes |
|----------|------|-----|-------|
| Arabic | ar | Yes | Full RTL support, Arabic typography, `dir="rtl"` |
| English | en | No | Default |
| French | fr | No | |
| Spanish | es | No | |
| German | de | No | |
| Italian | it | No | |
| Portuguese | pt | No | |
| Dutch | nl | No | |
| Turkish | tr | No | |
| Japanese | ja | No | CJK character support |
| Korean | ko | No | CJK character support |

**Auto-detect mode:** If you don't specify a language, ChainIQ detects the language from your topic keyword.

### Framework Selection

| Option | Output Format | When to Use |
|--------|--------------|-------------|
| Auto-detect (recommended) | Detects from your project | Let ChainIQ choose the best format |
| Next.js | `.tsx` with `next/image`, App Router conventions | Next.js 13+ projects |
| Vue | `.vue` SFC with scoped CSS | Vue 3 / Nuxt projects |
| Svelte | `+page.svelte` with SvelteKit conventions | SvelteKit projects |
| WordPress | PHP + WordPress functions | WordPress themes/plugins |
| Plain HTML | Standalone `.html` with inline CSS | Any project, email templates |

### Content Length

| Option | Word Count | Use Case |
|--------|-----------|----------|
| Brief | ~1,000 words | Quick overviews, news summaries |
| Standard | ~2,000 words | Standard blog posts, guides |
| Long-form | ~4,000 words | Comprehensive guides, pillar content |

### Image Generation

- **Enabled (default):** 4-6 AI-generated images relevant to the topic
- **Disabled:** Text-only article (faster generation)
- Images are generated as PNG and embedded inline in the article

---

## Editing Articles

After generation, you can refine any section using the inline edit UI:

1. Open the generated article in your browser
2. Hover over any section to see the **Edit** button
3. Click **Edit** and describe the change you want (e.g., "Make this section more concise" or "Add a comparison table for the top 3 tools")
4. ChainIQ rewrites that section while preserving the rest of the article
5. Changes appear in real-time via the progress indicator

### Edit Tips

- Be specific: "Add pricing information for each tool mentioned" works better than "improve this"
- You can edit the same section multiple times
- Article versions are saved automatically — you can revert to any previous version
- Maximum edit instruction length: 2,000 characters

---

## Quality Gate (Optional)

If enabled in Settings, each generated article is automatically scored by the 7-signal quality gate:

| Signal | What It Measures | Weight |
|--------|-----------------|--------|
| E-E-A-T | Experience, Expertise, Authority, Trust indicators | 20% |
| Completeness | Topic coverage depth, missing subtopics | 15% |
| Voice Match | Alignment with brand voice profile (if configured) | 15% |
| AI Detection | Naturalness score (avoid AI-detectable patterns) | 15% |
| Freshness | Data recency, current statistics | 10% |
| Technical SEO | Heading structure, meta data, schema markup | 15% |
| Readability | Grade level, sentence variety, engagement | 10% |

Articles scoring below 70% are flagged for review. The quality gate can automatically trigger up to 2 revision passes to improve low-scoring signals.

---

## Quotas and Limits

| Plan | Articles/Month | Edits/Article | API Keys |
|------|---------------|---------------|----------|
| Starter ($3K/mo) | 50 | Unlimited | 2 |
| Professional ($6K/mo) | 200 | Unlimited | 5 |
| Enterprise ($12K/mo) | Unlimited | Unlimited | 20 |

When you approach your quota (80% used), you'll see a warning banner on the Generate page. At 100%, generation is paused until the next billing cycle or until your admin increases the quota.

---

## Troubleshooting Generation Issues

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| Generation stuck at "Researching" | Research engine timeout | Wait 3 minutes, then refresh. If persistent, try a different topic keyword. |
| Article has no images | Image generation disabled or failed | Check Settings → Preferences → Image Generation is enabled. |
| Output is plain HTML instead of Next.js | Framework auto-detection missed | Explicitly select framework in generation options. |
| Article quality score is low | Broad topic, insufficient research data | Use a more specific topic keyword. Enable quality gate auto-revision. |
| "Quota exceeded" error | Monthly article limit reached | Contact your admin to increase quota or wait for next billing cycle. |
