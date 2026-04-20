# Structural Component Registry v1.0

Ingested from: `article-components.html` (one-time extraction)
Ingestion date: 2026-03-11

**This registry stores STRUCTURE ONLY — no brand colors, fonts, or visual identity.**

All visual styling (colors, fonts, shadows, radii, spacing tokens) is applied at runtime by the **Runtime Visual Adapter** based on the active project's design system.

---

## How to Use This Registry

1. The **Article Architect** references these blueprints when mapping sections to components
2. The **Draft Writer** uses the structural patterns to generate HTML — then applies the active project's design tokens
3. Components are identified by `blueprint_id` (e.g., `bp-stats-cards`)
4. Each blueprint defines WHAT elements exist and HOW they relate — not how they look
5. The registry is the structural source of truth; the active project provides the visual layer

---

## ARTICLE SHELL BLUEPRINT

```
blueprint_id: bp-article-shell
blueprint_name: Article Page Shell
category: shell
article_role: page-wrapper

structural_pattern:
  - page wrapper (full viewport)
  - hero section (full-width, above content grid)
  - content container (max-width constrained, centered)
  - two-column article layout:
    - main content column (~70% width)
    - sticky sidebar column (~30% width)
  - main content contains: inline TOC (mobile) + article sections stacked vertically
  - sidebar contains: sticky TOC panel
  - section edit overlay (single instance, before closing body)
  - edit prompt generation script (before closing body)

slot_definitions:
  - PAGE_TITLE: document title
  - META_DESCRIPTION: meta description tag
  - META_KEYWORDS: meta keywords tag
  - FONT_CDN: Google Fonts or other CDN link
  - CSS_TOKENS: :root custom properties block
  - ARTICLE_HERO: full-width hero section (above grid)
  - ARTICLE_TOC_INLINE: mobile-only collapsible TOC
  - ARTICLE_CONTENT: sections 2+ stacked in main column
  - ARTICLE_TOC_SIDEBAR: sticky sidebar TOC inner HTML
  - SECTION_EDIT_OVERLAY: edit modal overlay HTML
  - EDIT_PROMPT_SCRIPT: JavaScript for edit prompt generation

layout_relationships:
  - hero is full-width, sits above the two-column grid
  - main column and sidebar are siblings in a grid/flex container
  - sidebar is sticky (position: sticky) on desktop
  - on mobile (< 768px): sidebar hides, inline TOC shows
  - sections stack vertically with consistent spacing rhythm

responsive_behavior:
  - desktop: two-column (main + sticky sidebar)
  - tablet (< 1024px): two-column with narrower sidebar
  - mobile (< 768px): single column, sidebar hidden, inline TOC visible
```

---

## HERO BLUEPRINT

```
blueprint_id: bp-hero
blueprint_name: Article Hero
category: hero
article_role: Sets visual tone, introduces topic, displays metadata

structural_pattern:
  - outer container (full-width, no side padding)
  - inner container (rounded, overflow hidden, min-height constrained)
  - background layer: full-cover image
  - overlay layer: gradient (dark bottom to transparent top)
  - content layer (positioned above overlay):
    - breadcrumb navigation (optional)
    - category/tag badge (pill shape)
    - h1 title (large, prominent)
    - metadata row: author, date, reading time

slot_definitions:
  - HERO_IMAGE: background image (full cover, object-fit: cover)
  - BREADCRUMB: navigation path (e.g., Home > Blog > Category)
  - CATEGORY_TAG: topic category label
  - TITLE: h1 article title
  - META_AUTHOR: author name with avatar/icon
  - META_DATE: publication date
  - META_READING_TIME: estimated reading time

hierarchy:
  hero-outer > hero-inner > [bg-image + overlay + content]
  content > [breadcrumb? + tag + h1 + meta-row]

required_elements: [HERO_IMAGE, TITLE, at least 1 meta item]
optional_elements: [BREADCRUMB, CATEGORY_TAG, META_AUTHOR, META_DATE, META_READING_TIME]

responsive_behavior:
  - desktop: min-height ~420px, large title, spacious padding
  - tablet: reduced min-height, smaller title
  - mobile: compact min-height ~280px, small title, tight padding
```

---

## ARTICLE PROSE BLUEPRINT

```
blueprint_id: bp-article-prose
blueprint_name: Article Prose Typography
category: typography
article_role: Base typography rules for all article text content

structural_pattern:
  - wrapper class applied to article body sections
  - defines heading hierarchy (h2, h3)
  - defines paragraph, list, link, and emphasis styles
  - h2: section-level heading with bottom border separator
  - h3: subsection heading
  - p: body text with comfortable line height
  - ul/ol: indented lists
  - strong: emphasis
  - a: inline links

hierarchy:
  prose-wrapper > [h2 + p + h3 + p + ul/ol + blockquote + ...]

responsive_behavior:
  - font sizes scale down on mobile
  - spacing reduces proportionally
```

---

## COMPONENT BLUEPRINTS

### BP-01: Stats Cards Row

```
blueprint_id: bp-stats-cards
blueprint_name: Stats Cards Row
category: data-visualization
article_role: Display key metrics/statistics in a scannable grid

structural_pattern:
  - section heading (h2) with optional intro paragraph
  - grid container (4 columns desktop, 2 tablet, 1 mobile)
  - each card:
    - card container (bordered, padded, centered text)
    - stat number (large, prominent, heading font)
    - stat label (small, muted description)

slot_definitions:
  - SECTION_HEADING: h2 section title
  - INTRO_TEXT: optional paragraph before the grid
  - CARDS[]: array of {number, label} pairs (typically 4)

hierarchy:
  section > [h2 + p? + grid > card*4]
  card > [stat-number + stat-label]

required_elements: [at least 2 cards with number + label]
optional_elements: [SECTION_HEADING, INTRO_TEXT]

responsive_behavior:
  - desktop: 4-column grid
  - tablet: 2-column grid
  - mobile: 1-column stack

image_compatibility: none (data-focused component)
sidebar_compatibility: works in main column
toc_compatibility: heading appears in TOC if present
```

### BP-02: Comparison Table

```
blueprint_id: bp-comparison-table
blueprint_name: Comparison Table
category: data-visualization
article_role: Present structured comparison data in tabular format

structural_pattern:
  - section heading (h2) with optional context paragraph
  - full-width table:
    - thead with column headers (uppercase, bordered bottom)
    - tbody with data rows (bordered, hover highlight)
    - optional highlight cells for emphasis

slot_definitions:
  - SECTION_HEADING: h2 section title
  - CONTEXT_TEXT: optional paragraph explaining the comparison
  - TABLE_HEADERS[]: column header labels
  - TABLE_ROWS[][]: rows of cell values
  - HIGHLIGHT_CELLS: which cells deserve emphasis

hierarchy:
  section > [h2 + p? + table > thead + tbody]
  thead > tr > th*N
  tbody > tr*N > td*N

required_elements: [TABLE_HEADERS, at least 2 TABLE_ROWS]
optional_elements: [SECTION_HEADING, CONTEXT_TEXT, HIGHLIGHT_CELLS]

responsive_behavior:
  - desktop: full table visible
  - mobile: horizontal scroll or stacked layout

image_compatibility: none
sidebar_compatibility: works in main column (may need full width)
```

### BP-03: Step-by-Step Process

```
blueprint_id: bp-step-process
blueprint_name: Step-by-Step Process
category: sequential-content
article_role: Guide reader through an ordered process or sequence

structural_pattern:
  - section heading (h2) with optional intro
  - ordered list with vertical connector line:
    - each step:
      - step number (circular badge, positioned on the connector line)
      - step content container:
        - step title (h4, bold)
        - step description (paragraph)

slot_definitions:
  - SECTION_HEADING: h2 section title
  - INTRO_TEXT: optional paragraph
  - STEPS[]: array of {title, description} (typically 3-6)

hierarchy:
  section > [h2 + p? + step-list]
  step-list > [connector-line + step*N]
  step > [step-number + step-content > (h4 + p)]

required_elements: [at least 3 STEPS with title + description]
optional_elements: [SECTION_HEADING, INTRO_TEXT]

responsive_behavior:
  - consistent across breakpoints (single-column by nature)
  - connector line and badges scale down slightly on mobile

image_compatibility: none (process-focused)
sidebar_compatibility: works in main column
```

### BP-04: Pull Quote

```
blueprint_id: bp-pull-quote
blueprint_name: Pull Quote
category: editorial
article_role: Highlight expert insight, key statement, or memorable quote

structural_pattern:
  - blockquote container:
    - left accent border
    - decorative opening quote mark (large, translucent)
    - quote text (italic, larger than body text)
    - citation/attribution (small, colored)

slot_definitions:
  - QUOTE_TEXT: the quoted statement
  - CITATION: attribution (person name, title, organization)

hierarchy:
  blockquote > [decorative-mark + quote-text + cite]

required_elements: [QUOTE_TEXT]
optional_elements: [CITATION]

responsive_behavior:
  - consistent across breakpoints
  - padding reduces on mobile

image_compatibility: none
sidebar_compatibility: works in main column or can be pulled wider
```

### BP-05: Data Table

```
blueprint_id: bp-data-table
blueprint_name: Data Table
category: data-visualization
article_role: Present structured data with sortable/scannable rows

structural_pattern:
  - section heading (h2) with optional context paragraph
  - full-width table:
    - thead with column headers (muted background, bordered bottom)
    - tbody with data rows (alternating or bordered, hover highlight)
    - optional highlight cells for key values

slot_definitions:
  - SECTION_HEADING: h2 section title
  - CONTEXT_TEXT: optional paragraph explaining the data
  - TABLE_HEADERS[]: column header labels
  - TABLE_ROWS[][]: rows of cell values
  - HIGHLIGHT_CELLS: which cells deserve emphasis

hierarchy:
  section > [h2? + p? + table > thead + tbody]
  thead > tr > th*N
  tbody > tr*N > td*N

required_elements: [TABLE_HEADERS, at least 2 TABLE_ROWS]
optional_elements: [SECTION_HEADING, CONTEXT_TEXT, HIGHLIGHT_CELLS]

responsive_behavior:
  - desktop: full table visible
  - mobile: horizontal scroll or stacked layout

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-06: Before/After Comparison

```
blueprint_id: bp-before-after
blueprint_name: Before/After Comparison
category: comparison
article_role: Show contrast between two states, options, or perspectives

structural_pattern:
  - section heading (h2) with optional context
  - two-column grid:
    - "before" column (card with muted header):
      - column header (h4, uppercase, with status color)
      - bulleted list of items OR paragraph
    - "after" column (card with accent header):
      - column header (h4, uppercase, with accent color)
      - bulleted list of items OR paragraph

slot_definitions:
  - SECTION_HEADING: h2 section title
  - BEFORE_LABEL: header for "before" side (e.g., "Before", "Problem", "Old Way")
  - BEFORE_ITEMS[]: list of items or paragraph text
  - AFTER_LABEL: header for "after" side (e.g., "After", "Solution", "New Way")
  - AFTER_ITEMS[]: list of items or paragraph text

hierarchy:
  section > [h2? + grid > (before-col + after-col)]
  column > [h4 + ul/p]

required_elements: [BEFORE_LABEL, BEFORE_ITEMS, AFTER_LABEL, AFTER_ITEMS]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - desktop: two-column side by side
  - mobile: stacked vertically (before on top)

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-07: Highlight Callout

```
blueprint_id: bp-highlight-callout
blueprint_name: Highlight Callout
category: data-visualization
article_role: Emphasize a single key metric or statistic with context

structural_pattern:
  - horizontal card (flex row):
    - large number/metric (prominent, heading font)
    - text block:
      - title (h4, bold)
      - description (paragraph)

slot_definitions:
  - HIGHLIGHT_NUMBER: the key metric (e.g., "73%", "$2.4B", "150+")
  - HIGHLIGHT_TITLE: what the number represents
  - HIGHLIGHT_DESCRIPTION: context/explanation

hierarchy:
  callout-card > [number + text-block > (h4 + p)]

required_elements: [HIGHLIGHT_NUMBER, HIGHLIGHT_TITLE]
optional_elements: [HIGHLIGHT_DESCRIPTION]

responsive_behavior:
  - desktop: horizontal flex (number left, text right)
  - mobile: stacked vertically

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-08: Key Takeaways Panel

```
blueprint_id: bp-key-takeaways
blueprint_name: Key Takeaways Panel
category: summary
article_role: Provide scannable key points or takeaways for the reader

structural_pattern:
  - bordered card container:
    - panel heading (h4, with accent bottom border)
    - unordered list with custom bullet indicators:
      - each item: short takeaway statement

slot_definitions:
  - PANEL_HEADING: title (e.g., "Key Takeaways", "Quick Summary")
  - TAKEAWAYS[]: array of short text items (typically 4-6)

hierarchy:
  panel > [h4 + ul > li*N]

required_elements: [PANEL_HEADING, at least 3 TAKEAWAYS]
optional_elements: []

responsive_behavior:
  - consistent across breakpoints
  - can appear in sidebar or main column

image_compatibility: none
sidebar_compatibility: excellent — designed for sidebar or inset use
```

### BP-09: Checklist Block

```
blueprint_id: bp-checklist
blueprint_name: Checklist Block
category: actionable-content
article_role: Present actionable items the reader can check off or verify

structural_pattern:
  - section heading (h2) with optional context
  - unordered list with check icons:
    - each item:
      - check icon (square with checkmark)
      - item text

slot_definitions:
  - SECTION_HEADING: h2 section title
  - CHECKLIST_ITEMS[]: array of text items (typically 5-8)

hierarchy:
  section > [h2? + ul > li*N]
  li > [check-icon + text]

required_elements: [at least 3 CHECKLIST_ITEMS]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-10: Timeline Block

```
blueprint_id: bp-timeline
blueprint_name: Timeline Block
category: chronological-content
article_role: Present events, milestones, or history in chronological order

structural_pattern:
  - section heading (h2) with optional intro
  - vertical timeline with gradient connector line:
    - each milestone:
      - timeline dot (circular, positioned on the line)
      - time label (small, uppercase, accent color)
      - milestone title (h4)
      - milestone description (paragraph)

slot_definitions:
  - SECTION_HEADING: h2 section title
  - INTRO_TEXT: optional paragraph
  - MILESTONES[]: array of {time_label, title, description} (typically 4-8)

hierarchy:
  section > [h2? + p? + timeline-container]
  timeline > [connector-line + milestone*N]
  milestone > [dot + label + h4 + p]

required_elements: [at least 3 MILESTONES with time_label + title]
optional_elements: [SECTION_HEADING, INTRO_TEXT, description per milestone]

responsive_behavior:
  - consistent across breakpoints (single-column vertical)
  - spacing reduces on mobile

image_compatibility: can pair with images between milestones
sidebar_compatibility: works in main column
```

### BP-11: Section Heading + Lead Paragraph

```
blueprint_id: bp-section-heading
blueprint_name: Section Heading + Lead Paragraph
category: typography
article_role: Introduce a new section with heading and opening context

structural_pattern:
  - uses article prose base typography
  - h2 heading with bottom border separator
  - lead paragraph(s)
  - optional h3 subheadings with more paragraphs

slot_definitions:
  - HEADING: h2 section title
  - LEAD_TEXT: opening paragraph(s)
  - SUBHEADINGS[]: optional h3 + paragraph pairs

hierarchy:
  section > [h2 + p + (h3 + p)*]

required_elements: [HEADING, at least 1 LEAD_TEXT paragraph]
optional_elements: [SUBHEADINGS]

responsive_behavior:
  - inherits prose responsive behavior

image_compatibility: can include inline images between paragraphs
sidebar_compatibility: works in main column
```

### BP-12: Numbered Triggers List

```
blueprint_id: bp-numbered-list
blueprint_name: Numbered Triggers List
category: sequential-content
article_role: Present ordered key points, triggers, reasons, or factors

structural_pattern:
  - section heading (h2) with optional intro
  - ordered list with circular number badges:
    - each item:
      - auto-incrementing number badge (CSS counter)
      - item text (can be multi-line)

slot_definitions:
  - SECTION_HEADING: h2 section title
  - INTRO_TEXT: optional paragraph
  - ITEMS[]: array of text items (typically 5-10)

hierarchy:
  section > [h2? + p? + ol > li*N]
  li > [number-badge(auto) + text]

required_elements: [at least 3 ITEMS]
optional_elements: [SECTION_HEADING, INTRO_TEXT]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-13: Warning / Tip Callout

```
blueprint_id: bp-callout
blueprint_name: Warning / Tip Callout
category: editorial
article_role: Alert reader to important warnings, tips, or notes

structural_pattern:
  - horizontal card (flex row):
    - icon container (square with background tint):
      - warning icon (amber) OR tip icon (accent color)
    - text body:
      - callout title (h4)
      - callout description (paragraph)
      - optional bullet list

slot_definitions:
  - CALLOUT_TYPE: "warning" or "tip" (determines icon and color treatment)
  - CALLOUT_TITLE: h4 heading
  - CALLOUT_TEXT: description paragraph
  - CALLOUT_ITEMS[]: optional bullet list

hierarchy:
  callout > [icon-container + body > (h4 + p + ul?)]

required_elements: [CALLOUT_TYPE, CALLOUT_TITLE, CALLOUT_TEXT]
optional_elements: [CALLOUT_ITEMS]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-14: Image with Caption

```
blueprint_id: bp-image-caption
blueprint_name: Image with Caption
category: media
article_role: Display a contextual image with descriptive caption

structural_pattern:
  - figure container (rounded, overflow hidden, shadow):
    - image (full-width, constrained height, object-fit: cover)
    - figcaption (padded, below image, muted background):
      - caption text (small, can include bold source attribution)

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: accessible alt text
  - CAPTION_TEXT: descriptive caption
  - CAPTION_SOURCE: optional source attribution (bold)

hierarchy:
  figure > [img + figcaption > (text + source?)]

required_elements: [IMAGE_SRC, IMAGE_ALT]
optional_elements: [CAPTION_TEXT, CAPTION_SOURCE]

responsive_behavior:
  - image scales to container width
  - caption text size may reduce on mobile

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-15: FAQ Accordion

```
blueprint_id: bp-faq-accordion
blueprint_name: FAQ Accordion (Premium Editorial)
category: interactive
article_role: Present frequently asked questions with expandable answers in a premium numbered style

structural_pattern:
  - section heading (h2) with accent bar
  - faq list container (.shopify-guide__faq-list):
    - each FAQ item (native <details> element, .shopify-guide__faq-item):
      - <summary> with flex layout:
        - question wrapper (.shopify-guide__faq-question):
          - zero-padded number (.shopify-guide__faq-number): "01", "02", etc.
          - question text (bold, dark)
        - chevron circle (.shopify-guide__faq-chevron): pure CSS down-arrow in circle
      - <p> answer text (indented under number, muted color)
  - On open: item elevates with shadow, border goes transparent, number turns blue, chevron rotates 180deg and turns blue

slot_definitions:
  - SECTION_HEADING: h2 section title (e.g., "Frequently Asked Questions")
  - FAQ_ITEMS[]: array of {question, answer} pairs (typically 4-8)

hierarchy:
  section > [h2 + .shopify-guide__faq-list > details.shopify-guide__faq-item*N]
  details > [summary > (.shopify-guide__faq-question > (.shopify-guide__faq-number + text) + .shopify-guide__faq-chevron) + p]

html_example: |
  <details class="shopify-guide__faq-item">
    <summary>
      <span class="shopify-guide__faq-question">
        <span class="shopify-guide__faq-number">01</span>
        Question text here?
      </span>
      <span class="shopify-guide__faq-chevron"></span>
    </summary>
    <p>Answer text here.</p>
  </details>

required_elements: [at least 3 FAQ_ITEMS with question + answer, numbered sequentially]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - consistent across breakpoints
  - padding and gap reduce on mobile
  - number size reduces slightly

interaction_pattern:
  - native <details>/<summary> toggle (no JavaScript needed)
  - chevron rotates 180deg on open via CSS [open] selector
  - item elevates with box-shadow on open
  - number color changes to accent blue on open

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-16: Icon Feature Grid

```
blueprint_id: bp-feature-grid
blueprint_name: Icon Feature Grid
category: feature-display
article_role: Showcase features, benefits, or key aspects in a card grid

structural_pattern:
  - section heading (h2) with optional intro
  - grid container (3 columns desktop, 2 tablet, 1 mobile):
    - each feature card:
      - icon container (square with tinted background)
      - feature title (h4)
      - feature description (paragraph)

slot_definitions:
  - SECTION_HEADING: h2 section title
  - INTRO_TEXT: optional paragraph
  - FEATURES[]: array of {icon, title, description} (typically 3-6)

hierarchy:
  section > [h2? + p? + grid > card*N]
  card > [icon + h4 + p]

required_elements: [at least 3 FEATURES with title + description]
optional_elements: [SECTION_HEADING, INTRO_TEXT, icons]

responsive_behavior:
  - desktop: 3-column grid
  - tablet: 2-column grid
  - mobile: 1-column stack

image_compatibility: icons only (SVG or emoji)
sidebar_compatibility: works in main column
```

### BP-17: Problem-Solution Block

```
blueprint_id: bp-problem-solution
blueprint_name: Problem → Solution Block
category: comparison
article_role: Contrast a problem with its solution in a clear visual split

structural_pattern:
  - bordered container (rounded, shadow):
    - three-column grid:
      - problem column (muted background):
        - column header (h4, uppercase, with icon)
        - problem text (paragraph or list)
      - arrow separator (centered, accent color)
      - solution column (slightly different background):
        - column header (h4, uppercase, accent color, with icon)
        - solution text (paragraph or list)

slot_definitions:
  - PROBLEM_TEXT: problem description (paragraph or bullet list)
  - SOLUTION_TEXT: solution description (paragraph or bullet list)
  - PROBLEM_LABEL: optional custom label (default: "Problem")
  - SOLUTION_LABEL: optional custom label (default: "Solution")

hierarchy:
  container > [problem-col + arrow + solution-col]
  column > [h4 + p/ul]

required_elements: [PROBLEM_TEXT, SOLUTION_TEXT]
optional_elements: [PROBLEM_LABEL, SOLUTION_LABEL]

responsive_behavior:
  - desktop: three-column horizontal (problem | arrow | solution)
  - mobile: stacked vertically with arrow rotated 90°

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-18: Inline CTA Card

```
blueprint_id: bp-inline-cta
blueprint_name: Inline CTA Card
category: conversion
article_role: Drive reader action with a prominent call-to-action

structural_pattern:
  - dark-background card (full-width within column):
    - flex row (text left, actions right):
      - text area:
        - CTA heading (h4, white)
        - CTA description (paragraph, semi-transparent white)
      - actions area:
        - primary button
        - optional secondary button (outline/ghost)

slot_definitions:
  - CTA_HEADING: persuasive title
  - CTA_DESCRIPTION: supporting text
  - PRIMARY_BUTTON: {label, url}
  - SECONDARY_BUTTON: optional {label, url}

hierarchy:
  cta-card > [text-area > (h4 + p) + actions > (btn-primary + btn-secondary?)]

required_elements: [CTA_HEADING, PRIMARY_BUTTON]
optional_elements: [CTA_DESCRIPTION, SECONDARY_BUTTON]

responsive_behavior:
  - desktop: horizontal flex (text left, buttons right)
  - mobile: stacked vertically, centered text

image_compatibility: none
sidebar_compatibility: works in main column (full-width recommended)
```

### BP-19: Two-Column Text Block

```
blueprint_id: bp-two-col-text
blueprint_name: Two-Column Text Block
category: content-layout
article_role: Present two parallel aspects, perspectives, or content areas

structural_pattern:
  - section heading (h2) with optional intro
  - two-column grid:
    - left column:
      - column heading (h4, with accent bottom border)
      - paragraph text OR bullet list
    - right column:
      - column heading (h4, with accent bottom border)
      - paragraph text OR bullet list

slot_definitions:
  - SECTION_HEADING: h2 section title
  - LEFT_HEADING: h4 for left column
  - LEFT_CONTENT: paragraph or list
  - RIGHT_HEADING: h4 for right column
  - RIGHT_CONTENT: paragraph or list

hierarchy:
  section > [h2? + grid > (left-col + right-col)]
  column > [h4 + p/ul]

required_elements: [LEFT_HEADING, LEFT_CONTENT, RIGHT_HEADING, RIGHT_CONTENT]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - desktop: two-column side by side
  - mobile: stacked vertically

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-20: Mini Comparison Cards

```
blueprint_id: bp-mini-cards
blueprint_name: Mini Comparison Cards
category: comparison
article_role: Compare 3+ options, categories, or items in card format

structural_pattern:
  - section heading (h2) with optional intro
  - grid container (3 columns desktop, 2 tablet, 1 mobile):
    - each card (centered text):
      - category badge (pill, small, uppercase)
      - card title (h4)
      - card description (paragraph)
      - optional tag/label at bottom

slot_definitions:
  - SECTION_HEADING: h2 section title
  - INTRO_TEXT: optional paragraph
  - CARDS[]: array of {badge, title, description, tag?} (typically 3-6)

hierarchy:
  section > [h2? + p? + grid > card*N]
  card > [badge + h4 + p + tag?]

required_elements: [at least 3 CARDS with title + description]
optional_elements: [SECTION_HEADING, INTRO_TEXT, badge, tag per card]

responsive_behavior:
  - desktop: 3-column grid
  - tablet: 2-column grid
  - mobile: 1-column stack

image_compatibility: none (card-based, text-focused)
sidebar_compatibility: works in main column
```

---

### BP-194: Pricing Cards — Single Product Tiered Plans

```
blueprint_id: bp-pricing-cards
blueprint_name: Pricing Cards — Tiered Plans with Monthly/Annual Toggle
category: conversion
article_role: Present a single product's pricing tiers as interactive pricing cards with a Monthly/Annual toggle, a "Popular" featured plan, per-plan feature checklists, and a CTA per tier. Used when the article is promoting ONE product and needs to show its pricing plans cleanly.

use_when:
  - Article is a single-product guide, review, or promotion (e.g., "How to Build a Shopify Store", "Foodics Review")
  - Section explicitly covers that one product's pricing plans
  - 2-4 tiers available (not more — cards get cramped)
  - The product has monthly AND annual pricing (required — the toggle is central)

do_not_use_when:
  - Comparing multiple products' pricing (use bp-comparison-table or bp-others-list)
  - Listing secondary/runner-up products each with own pricing (use bp-others-list)
  - Only one pricing tier exists (use a simple pricing statement instead)
  - No annual option exists (the toggle would be dead UI)

structural_pattern:
  - Header: optional badge pill + h2 heading + description paragraph
  - Toggle row: Monthly/Annual switch with "Save X%" hint on the annual side
  - Grid of cards (2-4), one can be marked as .pricing-cards__card--popular (dark featured treatment with star badge):
    - Popular badge (if featured)
    - Plan name (small uppercase)
    - Price row: large price + "/mo" period
    - Billing note ("billed monthly" / "billed annually")
    - Plan description
    - Divider
    - Feature checklist (each with check icon)
    - CTA button (full-width, styled differently for popular card)
  - Mobile: horizontal snap-scroll with pagination dots; popular card centered on load

slot_definitions:
  - SECTION_HEADING: h2 (e.g., "Choose Your Shopify Plan")
  - DESCRIPTION: paragraph under heading
  - BADGE: optional small pill above heading (e.g., "Pricing")
  - MONTHLY_LABEL: toggle label (default "Monthly")
  - YEARLY_LABEL: toggle label (default "Annual")
  - SAVE_LABEL: annual-savings hint (e.g., "Save 25%")
  - PLANS[]: array of { name, monthlyPrice, yearlyPrice, description, isPopular?, features[], ctaText, ctaUrl }
    - exactly ONE plan should have isPopular=true (the featured recommendation)
    - features should be 4-6 per plan — keep parity across plans for scannability
    - ctaUrl should be an affiliate-safe path (e.g., /out/{partner}-pricing)

required_elements: [SECTION_HEADING, DESCRIPTION, 2-4 PLANS each with name + monthlyPrice + yearlyPrice + features + ctaText + ctaUrl]
optional_elements: [BADGE, one PLANS[].isPopular flag]

required_component (Next.js projects with /components/ui/PricingCards):
  ```jsx
  import PricingCards from '@/components/ui/PricingCards';

  <PricingCards
    heading="Choose Your Plan"
    description="All plans include a free trial."
    badge="Pricing"
    monthlyLabel="Monthly"
    yearlyLabel="Annual"
    saveLabel="Save 25%"
    plans={[
      { name: 'Basic', monthlyPrice: '$27', yearlyPrice: '$19', description: '...', isPopular: true, features: [...], ctaText: 'Start Free Trial', ctaUrl: '/out/partner-pricing' },
      { name: 'Grow', monthlyPrice: '$72', yearlyPrice: '$54', description: '...', features: [...], ctaText: 'Start Free Trial', ctaUrl: '/out/partner-pricing' },
      // ...
    ]}
  />
  ```

required_html (projects without the React component):
  Use `.pricing-cards` as the section wrapper with `.pricing-cards__header`, `.pricing-cards__toggle`, `.pricing-cards__grid` > `.pricing-cards__card` (plus `--popular` modifier on one). See `src/styles/pricing-cards.css` in the nextiva repo for the full class list.

responsive_behavior:
  - desktop: 3-column grid (or 2/4 depending on plan count)
  - tablet: 2-column or scrollable grid
  - mobile: horizontal snap-scroll carousel with pagination dots; popular card auto-centered on load

image_compatibility: none (card-based)
sidebar_compatibility: works in main column only (cards need full article width)
```

---

### BP-193: Others Worth Considering List

```
blueprint_id: bp-others-list
blueprint_name: Others Worth Considering — Horizontal Row List
category: comparison
article_role: Present 3-5 secondary/niche product options that didn't make the top picks but each has a specific-use-case strength. Each product gets a full-width row with product name, summary, "Best for" highlight, and structured pricing tiers.

use_when:
  - Article section is explicitly framed as secondary/runner-up products ("More X Options Worth Considering", "Also Worth Mentioning", "Niche Alternatives")
  - 3-5 products to list (NOT the main comparison — those belong in the comparison table)
  - Each product has: a name, a 2-4 sentence summary, a "best-for" positioning, AND structured pricing tiers

do_not_use_when:
  - Primary product comparison (use comparison table)
  - Feature grid for a single product (use feature-grid)
  - When products have no pricing tier data
  - Fewer than 3 or more than 6 products (layout breaks — use comparison table or mini-cards)

structural_pattern:
  - Section wrapper uses standard .article-section
  - h2 heading + intro paragraph
  - Vertical stack of full-width rows (.article-others-list)
  - Each row (.article-others-row) has a 2-col internal grid on desktop:
    - LEFT (main): h3 product name, summary paragraph, "Best for" callout (styled with left border + tinted blue background)
    - RIGHT (pricing): small "PRICING" label, bulleted list of pricing tiers
  - At ≤1024px, row collapses to single column; pricing moves below separated by a top border

slot_definitions:
  - SECTION_HEADING: h2 section title (e.g., "More X Options Worth Considering")
  - INTRO_TEXT: paragraph explaining why these are worth a look but not top picks
  - PRODUCTS[]: array of { name, summary, verdict, pricing_tiers[] }
    - name: product name (short)
    - summary: 2-4 sentence description
    - verdict: "Best for X team who want Y..." — short positioning sentence
    - pricing_tiers: array of strings, one per tier (e.g., ["Free — unlimited users", "Basic $49/mo", "Pro $199/mo"]). If the source data is a pipe-delimited string like "Free | Basic $49 | Pro $199", the writer MUST split on `|` and trim each piece — NEVER render the raw pipe-delimited string.

required_elements: [SECTION_HEADING, INTRO_TEXT, at least 3 PRODUCTS each with name + summary + verdict + at least 2 pricing_tiers]

required_html:
  ```html
  <section class="article-section">
    <h2>{SECTION_HEADING}</h2>
    <p>{INTRO_TEXT}</p>
    <div class="article-others-list">
      <!-- repeat per product -->
      <article class="article-others-row">
        <div class="article-others-main">
          <h3>{PRODUCT_NAME}</h3>
          <p class="article-others-summary">{PRODUCT_SUMMARY}</p>
          <p class="article-others-verdict">{PRODUCT_VERDICT}</p>
        </div>
        <aside class="article-others-pricing">
          <span class="article-others-pricing-label">Pricing</span>
          <ul class="article-others-pricing-list">
            <li>{TIER_1}</li>
            <li>{TIER_2}</li>
            <li>{TIER_3}</li>
          </ul>
        </aside>
      </article>
    </div>
  </section>
  ```

responsive_behavior:
  - desktop (default): 2-col internal split per row; main left, pricing right with vertical separator
  - tablet (≤1024px): row collapses to single column; pricing moves below with top border separator
  - mobile (≤768px): tighter padding; h3 smaller

image_compatibility: none (text-focused editorial list)
sidebar_compatibility: works in main column
```

---

### BP-192: Factors Grid (Numbered Criteria)

```
blueprint_id: bp-factors-grid
blueprint_name: Factors Grid — Numbered Criteria
category: decision-support
article_role: Present 4-6 decision-driving factors, selection criteria, or evaluation dimensions for a "How to Choose X" or "What to Look For" section. Each factor gets a zero-padded numbered badge inline with the title, breaking up text walls and giving scan anchors.

use_when:
  - Article section explicitly frames evaluation criteria ("How to Choose", "What to Look For", "Key Factors", "Buying Criteria")
  - You have 4-6 distinct factors/criteria (not 3, not 10 — 4-6 is the sweet spot for 3-col grid)
  - Each factor has a short title (2-5 words) and 2-4 sentence explanation

do_not_use_when:
  - Items are product comparisons (use bp-mini-cards)
  - Items are features of a single product (use bp-feature-grid)
  - Items are sequential steps (use bp-step-process)
  - Items need statistics or metrics (use bp-stats-cards)

structural_pattern:
  - Section wrapper uses standard .article-section (light background, dark text)
  - h2 heading + optional lead paragraph
  - Grid container: `.article-factors-grid` — 3 columns desktop, 2 tablet, 1 mobile
  - Each card: `.article-factor-card`
    - Header row: `.article-factor-header` (flex, baseline-aligned)
      - Zero-padded number: `.article-factor-number` ("01", "02", … — always 2 digits)
      - Title: h3
    - Description: p

slot_definitions:
  - SECTION_HEADING: h2 title (e.g., "How to Choose the Right CRM")
  - INTRO_TEXT: optional lead paragraph
  - FACTORS[]: array of { title, description } — 4 to 6 items

required_elements: [SECTION_HEADING, at least 4 FACTORS]
optional_elements: [INTRO_TEXT]

responsive_behavior:
  - desktop (default): 3-column grid
  - tablet (≤1024px): 2-column grid
  - mobile (≤768px): 1-column stack, reduced card padding

required_html:
  ```html
  <section class="article-section">
    <h2>{SECTION_HEADING}</h2>
    <p class="lead-paragraph">{INTRO_TEXT}</p>
    <div class="article-factors-grid">
      <!-- repeat per factor -->
      <div class="article-factor-card">
        <div class="article-factor-header">
          <span class="article-factor-number">01</span>
          <h3>{FACTOR_TITLE}</h3>
        </div>
        <p>{FACTOR_DESCRIPTION}</p>
      </div>
    </div>
  </section>
  ```

image_compatibility: none (text-focused)
sidebar_compatibility: works in main column
```

---

## COMPONENT CLASSIFICATION INDEX

| Blueprint ID | Name | Category | Best For |
|---|---|---|---|
| bp-stats-cards | Stats Cards Row | data-visualization | Key metrics, statistics, numbers |
| bp-comparison-table | Comparison Table | data-visualization | Structured data comparison |
| bp-step-process | Step-by-Step Process | sequential-content | How-to guides, processes |
| bp-pull-quote | Pull Quote | editorial | Expert quotes, key statements |
| bp-data-table | Data Table | data-visualization | Raw data display |
| bp-before-after | Before/After Comparison | comparison | State changes, improvements |
| bp-highlight-callout | Highlight Callout | data-visualization | Single key metric emphasis |
| bp-key-takeaways | Key Takeaways Panel | summary | Quick-scan summaries |
| bp-checklist | Checklist Block | actionable-content | Action items, requirements |
| bp-timeline | Timeline Block | chronological-content | History, milestones, events |
| bp-section-heading | Section Heading + Lead | typography | Section introductions |
| bp-numbered-list | Numbered Triggers List | sequential-content | Reasons, factors, triggers |
| bp-callout | Warning / Tip Callout | editorial | Alerts, tips, important notes |
| bp-image-caption | Image with Caption | media | Contextual images |
| bp-faq-accordion | FAQ Accordion | interactive | Q&A sections |
| bp-feature-grid | Icon Feature Grid | feature-display | Features, benefits |
| bp-problem-solution | Problem → Solution | comparison | Problem/solution contrast |
| bp-inline-cta | Inline CTA Card | conversion | Call-to-action |
| bp-two-col-text | Two-Column Text | content-layout | Parallel content areas |
| bp-mini-cards | Mini Comparison Cards | comparison | Multi-option comparison |
| bp-section-heading-v2 | Section Heading + Lead (V2) | typography | Section introductions (variant) |
| bp-pull-quote-editorial | Pull Quote — Editorial | editorial | Editorial-style quotes |
| bp-article-summary-box | Article Summary Box | summary | At-a-glance summaries |
| bp-lead-drop-cap | Lead Text with Drop Cap | typography | Article openers with drop cap |
| bp-editorial-two-col | Editorial Two-Column Text | content-layout | Magazine-style text layout |
| bp-key-insight | Key Insight Callout | editorial | Important findings |
| bp-chapter-intro | Chapter Intro Block | typography | Chapter/section introductions |
| bp-blockquote-highlight | Blockquote with Highlight | editorial | Quotes with emphasis |
| bp-article-excerpt | Article Excerpt Card | editorial | Article teasers |
| bp-side-annotation | Text with Side Annotation | content-layout | Margin notes |
| bp-hero-image-gradient | Hero Image with Gradient | media | Hero images with overlay |
| bp-offset-image-text | Offset Image + Text | media | Asymmetric image layouts |
| bp-stacked-image-stats | Stacked Image + Stats | media | Image with stats bar |
| bp-mosaic-grid | Mosaic Image Grid | media | Multi-image mosaic |
| bp-fullbleed-pill-caption | Full-Bleed + Pill Caption | media | Full-width images with captions |
| bp-image-bottom-strip | Image + Bottom Strip | media | Image cards with text strip |
| bp-overlapping-image-quote | Overlapping Image + Quote | media | Image with quote overlay |
| bp-horizontal-gallery | Horizontal Scroll Gallery | media | Scrollable image galleries |
| bp-image-comparison-slider | Image Comparison Slider | interactive | Before/after image comparison |
| bp-image-feature-list | Image Feature List | media | Image with feature bullets |
| bp-rounded-image-tag | Rounded Image + Tag | media | Images with floating tags |
| bp-image-steps-stack | Image + Steps Stack | media | Image with process steps |
| bp-glassmorphism-card | Glassmorphism Image Card | media | Premium glass-effect images |
| bp-image-testimonial | Image + Testimonial | media | Split image/testimonial |
| bp-asymmetric-duo | Asymmetric Duo | media | Layered image composition |
| bp-parallax-banner | Parallax-Style Banner | media | Section divider banners |
| bp-image-tiles | Image Tiles + Labels | media | Circular image grid |
| bp-image-inline-metrics | Image + Inline Metrics | media | Image with overlaid stats |
| bp-accent-border-frame | Accent Border Frame | media | Gradient-framed images |
| bp-bento-grid | Image Bento Grid | media | Bento-box image layout |
| bp-kpi-row-four | Four-Column KPI Row | data-visualization | KPI dashboards |
| bp-metric-highlights-three | Three-Column Metrics | data-visualization | Metric highlight cards |
| bp-big-stat-callout | Single Big Stat | data-visualization | Maximum impact stat |
| bp-stat-before-after | Stat Before/After | data-visualization | Metric comparisons |
| bp-progress-bars | Progress Bar Stats | data-visualization | Percentage visualizations |
| bp-metric-trend-cards | Metric Trend Cards | data-visualization | Stats with trends |
| bp-six-stat-grid | Six-Stat Grid | data-visualization | Compact stat grids |
| bp-circular-progress | Circular Progress | data-visualization | Donut-style indicators |
| bp-stat-banner | Stat Banner Strip | data-visualization | Full-width stat bars |
| bp-metric-comparison-cards | Metric Comparison Cards | data-visualization | Category metric comparison |
| bp-full-width-image | Full Width Image | media | Simple full-width images |
| bp-image-caption-v2 | Image with Caption (V2) | media | Captioned images (variant) |
| bp-image-side-text | Image with Side Text | media | Image/text columns |
| bp-two-image-grid | Two Image Grid | media | Paired images |
| bp-three-image-grid | Three Image Grid | media | Triple image layout |
| bp-image-gallery-row | Image Gallery Row | media | Horizontal gallery |
| bp-image-highlight-block | Image Highlight Block | media | Emphasized images |
| bp-article-figure | Article Figure Block | media | Figure with full caption |
| bp-image-quote-overlay | Image + Quote Overlay | media | Image with quote |
| bp-image-comparison | Image Comparison | media | Side-by-side images |
| bp-horizontal-process-flow | Horizontal Process Flow | sequential-content | Horizontal step flows |
| bp-vertical-timeline-v2 | Vertical Timeline (V2) | chronological-content | Alternating timeline |
| bp-numbered-steps | Numbered Steps | sequential-content | Step-by-step with badges |
| bp-horizontal-milestones | Horizontal Milestones | chronological-content | Milestone progress bar |
| bp-decision-flowchart | Decision Flowchart | sequential-content | Decision trees |
| bp-circular-process | Circular Process Diagram | sequential-content | Cyclical processes |
| bp-accordion-process | Accordion Process | sequential-content | Expandable process steps |
| bp-gantt-timeline | Gantt-Style Timeline | chronological-content | Project timelines |
| bp-two-track-process | Two-Track Process | sequential-content | Parallel workflows |
| bp-process-cards-grid | Process Cards Grid | sequential-content | Process step cards |
| bp-classic-accordion | Classic Accordion FAQ | interactive | Standard FAQ — MANDATORY for all articles. Uses native details/summary with shopify-guide__faq-list + shopify-guide__faq-item classes. No other FAQ pattern allowed. |
| bp-problem-approach-results | Problem→Approach→Results | comparison | Three-phase case studies |
| bp-case-study-before-after | Case Study Before/After | comparison | Case study metrics |
| bp-testimonial-results | Testimonial + Results | comparison | Quote with metrics |
| bp-compact-case-study | Compact Case Study | comparison | Brief case study cards |
| bp-outcome-banner | Outcome Metrics Banner | data-visualization | Results banners |
| bp-client-success | Client Success Story | comparison | Full case studies |
| bp-impact-highlight | Impact Highlight | data-visualization | Single impact metric |
| bp-three-phase-case | Three-Phase Case Study | comparison | Phased case studies |
| bp-results-dashboard | Results Dashboard | data-visualization | Multi-metric dashboards |
| bp-mini-case-studies | Mini Case Studies Grid | comparison | Case study grids |
| bp-standard-checklist | Standard Checklist | actionable-content | Feature checklists |
| bp-do-dont-panel | Do/Don't Panel | comparison | Guidance panels |
| bp-takeaways-box | Key Takeaways Box | summary | Takeaway callouts |
| bp-numbered-best-practices | Numbered Best Practices | actionable-content | Best practice lists |
| bp-warning-checklist | Warning Checklist | actionable-content | Warning item lists |
| bp-red-flags | Quick-Fire Red Flags | actionable-content | Red flag grids |
| bp-action-items | Action Items Panel | actionable-content | Action item lists |
| bp-tip-cards | Tip Cards Grid | actionable-content | Tip card grids |
| bp-dos-strip | Do's Summary Strip | actionable-content | Horizontal do's pills |
| bp-evaluation-scorecard | Evaluation Scorecard | data-visualization | Scoring/rating cards |
| bp-capability-comparison | Capability Comparison | comparison | Provider comparisons |
| bp-feature-matrix | Feature Matrix Table | data-visualization | Feature check matrices |
| bp-regional-data | Regional Data Cards | data-visualization | Location-based data |
| bp-classification-table | Classification Table | data-visualization | Type/category tables |
| bp-services-table | Services Table | data-visualization | Service comparison |
| bp-service-type-cards | Service Type Cards | feature-display | Service type display |
| bp-payment-comparison | Payment Comparison | data-visualization | Method comparison tables |
| bp-use-case-table | Use Case Table | data-visualization | Use case matrices |
| bp-technique-table | Technique Table | data-visualization | Method comparison |
| bp-setup-steps-table | Setup Steps Table | sequential-content | Implementation tables |
| bp-related-articles-grid | Related Articles Grid | navigation | Content discovery |
| bp-author-box | Author Box | trust | Author credibility |
| bp-reading-meta-bar | Reading Time & Meta | trust | Article metadata |
| bp-breadcrumb | Breadcrumb Navigation | navigation | Navigation context |
| bp-tags-cloud | Article Tags Cloud | navigation | Tag collections |
| bp-related-sidebar | Related Articles Sidebar | navigation | Sidebar recommendations |
| bp-series-navigator | Article Series Navigator | navigation | Series navigation |
| bp-author-share-bar | Author + Share Bar | trust | Combined author/share |
| bp-footer-meta | Article Footer Meta | trust | Footer metadata |
| bp-content-recommendations | Content Recommendations | navigation | Content suggestions |
| bp-image-key-takeaway | Image + Key Takeaway | media | Image with takeaway |
| bp-image-stat-overlay | Image + Stat Overlay | media | Stat-overlaid images |
| bp-image-description-card | Image + Description | media | Described images |
| bp-editorial-image | Editorial Image | media | Editorial-style images |
| bp-hero-style-image | Hero Style Image | media | Large hero images |
| bp-background-image-section | Background Image Section | media | Content over images |
| bp-framed-image | Framed Image | media | Decorative frames |
| bp-image-bullets | Image + Bullet Points | media | Image with bullets |
| bp-image-process | Image + Process | media | Image with steps |
| bp-image-callout | Image + Callout | media | Image with callout |
| bp-stats-dashboard | Stats Dashboard Row | data-visualization | Dashboard stat rows |
| bp-service-comparison | Service Comparison Table | data-visualization | Service comparison |
| bp-four-step-guide | 4-Step Process Guide | sequential-content | Four-step processes |
| bp-faq-accordion-section | FAQ Accordion Section | interactive | Full FAQ sections |
| bp-checklist-v2 | Checklist (Interactive) | actionable-content | Toggleable checklists |
| bp-horizontal-bar-chart | Horizontal Bar Chart | data-visualization | Bar chart visualization |
| bp-resource-links | Resource Links Card | navigation | Resource link lists |
| bp-kpi-grid | KPI Metrics Grid | data-visualization | KPI dashboards |
| bp-feature-matrix-v2 | Feature Matrix (V2) | data-visualization | Detailed feature matrices |
| bp-vertical-timeline-v3 | Vertical Timeline (V3) | chronological-content | Clean vertical timeline |
| bp-highlighted-quote | Highlighted Quote Box | editorial | Decorated quotes |
| bp-expandable-faq | Expandable FAQ List | interactive | Minimal FAQ lists |
| bp-takeaway-summary | Key Takeaway Summary | summary | Compact takeaways |
| bp-progress-indicators | Progress Indicator Bars | data-visualization | Progress bars |
| bp-pricing-tiers | Pricing Tier Comparison | comparison | Plan comparisons |
| bp-numbered-guide | Numbered Guide Steps | sequential-content | Detailed step guides |
| bp-decorative-blockquote | Decorative Blockquote | editorial | Styled blockquotes |
| bp-two-col-faq | Two-Column FAQ | interactive | Two-column FAQ layout |
| bp-image-text-side | Image + Text Side | media | 50/50 image/text |
| bp-donut-charts | Percentage Donut Charts | data-visualization | Donut chart grids |
| bp-faq-category-icons | FAQ + Category Icons | interactive | Icon-categorized FAQ |
| bp-summary-highlights | Summary Highlights Box | summary | Key finding summaries |
| bp-comparison-data-bars | Comparison Data Bars | data-visualization | Opposing bar charts |
| bp-milestone-timeline | Milestone Timeline | chronological-content | Milestone displays |
| bp-tabbed-faq-v2 | Tabbed FAQ (V2) | interactive | Pill-tabbed FAQ |
| bp-stacked-area-chart | Stacked Area Chart | data-visualization | Trend area charts |
| bp-icon-stat-row | Icon Stat Row | data-visualization | Icon + stat rows |
| bp-pie-chart | Pie Chart SVG | data-visualization | Pie chart distributions |
| bp-countdown-metrics | Countdown Metrics | data-visualization | Timer-style stats |
| bp-card-steps | Card-Based Steps | sequential-content | Step card grids |

---

## TOPIC-AWARE COMPOSITION GUIDE

Different topic types benefit from different component mixes:

| Topic Type | Recommended Components | Why |
|---|---|---|
| **Data-heavy** (economics, science) | stats-cards, data-table, comparison-table, highlight-callout, progress-bars, kpi-grid, donut-charts, horizontal-bar-chart, pie-chart, stacked-area-chart, stat-banner, circular-progress | Numbers need visual emphasis |
| **How-to / Guide** | step-process, checklist, callout, numbered-list, numbered-steps, four-step-guide, card-steps, numbered-guide, accordion-process, decision-flowchart, numbered-best-practices | Sequential flow |
| **Historical / Narrative** | timeline, pull-quote, image-caption, section-heading, vertical-timeline-v2, horizontal-milestones, gantt-timeline, milestone-timeline, chapter-intro | Chronological storytelling |
| **Comparison / Review** | before-after, comparison-table, mini-cards, problem-solution, do-dont-panel, capability-comparison, feature-matrix, pricing-tiers, comparison-data-bars, service-comparison | Side-by-side contrast |
| **Feature / Product** | feature-grid, mini-cards, inline-cta, highlight-callout, service-type-cards, image-feature-list, tip-cards, icon-stat-row | Benefits and conversion |
| **FAQ / Informational** | classic-accordion (details/summary), key-takeaways, callout, two-col-text | Scannable answers — ALL articles MUST use the same accordion FAQ (shopify-guide__faq-list) |
| **Opinion / Editorial** | pull-quote, section-heading, image-caption, callout, pull-quote-editorial, decorative-blockquote, highlighted-quote, blockquote-highlight, key-insight, lead-drop-cap | Voice and emphasis |
| **Case Study / Results** | problem-approach-results, client-success, compact-case-study, three-phase-case, results-dashboard, mini-case-studies, testimonial-results, impact-highlight, outcome-banner | Evidence and proof |
| **Visual / Media-rich** | hero-image-gradient, mosaic-grid, bento-grid, horizontal-gallery, glassmorphism-card, image-testimonial, parallax-banner, asymmetric-duo, image-tiles, image-comparison-slider | Visual storytelling |
| **Navigation / Trust** | related-articles-grid, author-box, breadcrumb, tags-cloud, series-navigator, reading-meta-bar, footer-meta, content-recommendations, resource-links | Credibility and discovery |

All articles should include at minimum:
- 1 hero (bp-hero)
- 1-2 section headings (bp-section-heading)
- 1 key takeaways or summary component
- 1 CTA (bp-inline-cta) or closing action
- 8+ unique component types total

---

## VISUAL ADAPTATION RULES

When generating HTML from these blueprints, the **Runtime Visual Adapter** applies:

1. **Colors**: from the active project's design tokens (--primary, --accent, --foreground, etc.)
2. **Fonts**: from the active project's font stack (heading + body)
3. **Spacing**: from the active project's rhythm (section gaps, padding, margins)
4. **Border radius**: from the active project's radius tokens
5. **Shadows**: from the active project's shadow tokens
6. **Container width**: from the active project's max-width

If the active project has no design tokens, use the fallback defaults from engine-config.md.

**Never freeze Axiom-specific values** (green palette, Alexandria/Poppins fonts, specific radii) into generated articles. These are runtime choices.
## EXTENDED COMPONENT BLUEPRINTS (BP-21 to BP-70)

### BP-21: Section Heading + Lead Paragraph (Variant 2)

```
blueprint_id: bp-section-heading-v2
blueprint_name: Section Heading + Lead Paragraph (Variant 2)
category: typography
article_role: Introduce a new section with editorial heading style and opening context

structural_pattern:
  - section container with article prose wrapper
  - h2 heading with accent bottom border
  - lead paragraph with larger font size
  - optional follow-up paragraphs at body text size

slot_definitions:
  - HEADING: h2 section title
  - LEAD_TEXT: opening paragraph (styled larger)
  - BODY_TEXT: optional follow-up paragraphs

hierarchy:
  section > [h2 + p.lead + p*]

required_elements: [HEADING, LEAD_TEXT]
optional_elements: [BODY_TEXT]

responsive_behavior:
  - desktop: full-width in main column, generous spacing
  - mobile: reduced heading size and spacing

image_compatibility: can include inline images between paragraphs
sidebar_compatibility: works in main column
```

### BP-22: Pull Quote — Editorial

```
blueprint_id: bp-pull-quote-editorial
blueprint_name: Pull Quote — Editorial
category: editorial
article_role: Display an editorial-style pull quote with decorative treatment

structural_pattern:
  - blockquote container with left accent border
  - large decorative opening quote mark (translucent, positioned)
  - quote text (italic, larger than body)
  - em dash separator
  - citation line (author name, title)

slot_definitions:
  - QUOTE_TEXT: the editorial statement
  - CITATION_NAME: author or speaker name
  - CITATION_TITLE: role or organization

hierarchy:
  blockquote > [decorative-mark + quote-text + separator + citation]

required_elements: [QUOTE_TEXT]
optional_elements: [CITATION_NAME, CITATION_TITLE]

responsive_behavior:
  - desktop: generous left padding, large quote mark
  - mobile: reduced padding and quote mark size

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-23: Article Summary Box

```
blueprint_id: bp-article-summary-box
blueprint_name: Article Summary Box
category: summary
article_role: Provide a compact article summary with key points in a bordered card

structural_pattern:
  - bordered card container with muted background
  - panel heading (h4) with accent bottom border
  - summary paragraph (concise overview)
  - unordered list with key points (3-5 items)

slot_definitions:
  - PANEL_HEADING: title (e.g., "Article Summary", "At a Glance")
  - SUMMARY_TEXT: brief overview paragraph
  - KEY_POINTS[]: array of bullet point items

hierarchy:
  panel > [h4 + p + ul > li*N]

required_elements: [PANEL_HEADING, at least 3 KEY_POINTS]
optional_elements: [SUMMARY_TEXT]

responsive_behavior:
  - consistent across breakpoints
  - can appear in sidebar or main column

image_compatibility: none
sidebar_compatibility: excellent — designed for sidebar or inset use
```

### BP-24: Lead Text with Drop Cap

```
blueprint_id: bp-lead-drop-cap
blueprint_name: Lead Text with Drop Cap
category: typography
article_role: Open an article section with a large decorative drop cap letter

structural_pattern:
  - paragraph container
  - first letter styled as drop cap:
    - oversized first character (float left, 3-4 lines tall)
    - heading font family
    - accent or primary color
  - remaining text flows around drop cap

slot_definitions:
  - LEAD_TEXT: full paragraph (first letter auto-styled as drop cap)

hierarchy:
  p.drop-cap > [first-letter + text]

required_elements: [LEAD_TEXT]
optional_elements: []

responsive_behavior:
  - desktop: drop cap floats left, 3-4 lines tall
  - mobile: drop cap slightly smaller, 2-3 lines

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-25: Editorial Two-Column Text

```
blueprint_id: bp-editorial-two-col
blueprint_name: Editorial Two-Column Text
category: content-layout
article_role: Present editorial content in a magazine-style two-column layout

structural_pattern:
  - section heading (h2) with optional intro
  - two-column grid:
    - left column: paragraphs with optional subheading (h3)
    - right column: paragraphs with optional subheading (h3)
  - optional accent divider between columns

slot_definitions:
  - SECTION_HEADING: h2 title
  - LEFT_HEADING: optional h3
  - LEFT_CONTENT: paragraphs
  - RIGHT_HEADING: optional h3
  - RIGHT_CONTENT: paragraphs

hierarchy:
  section > [h2? + grid > (left-col + right-col)]
  column > [h3? + p*]

required_elements: [LEFT_CONTENT, RIGHT_CONTENT]
optional_elements: [SECTION_HEADING, LEFT_HEADING, RIGHT_HEADING]

responsive_behavior:
  - desktop: two-column side by side
  - mobile: stacked vertically

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-26: Key Insight Callout

```
blueprint_id: bp-key-insight
blueprint_name: Key Insight Callout
category: editorial
article_role: Highlight a key insight or important finding in a styled card

structural_pattern:
  - card container (bordered, muted background, padded)
  - icon or emoji indicator (lightbulb or similar)
  - callout heading (h4, "Key Insight")
  - insight text (paragraph, slightly larger)

slot_definitions:
  - CALLOUT_ICON: icon or emoji (e.g., lightbulb)
  - CALLOUT_HEADING: h4 title
  - INSIGHT_TEXT: the key insight paragraph

hierarchy:
  card > [icon + h4 + p]

required_elements: [CALLOUT_HEADING, INSIGHT_TEXT]
optional_elements: [CALLOUT_ICON]

responsive_behavior:
  - consistent across breakpoints
  - padding reduces on mobile

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-27: Chapter Intro Block

```
blueprint_id: bp-chapter-intro
blueprint_name: Chapter Intro Block
category: typography
article_role: Introduce a major article chapter with decorative number and heading

structural_pattern:
  - container with accent top border or decorative line
  - chapter number (large, muted, heading font)
  - chapter title (h2, prominent)
  - intro paragraph (larger font, muted color)

slot_definitions:
  - CHAPTER_NUMBER: decorative number (e.g., "01", "Part 1")
  - CHAPTER_TITLE: h2 heading
  - INTRO_TEXT: opening paragraph

hierarchy:
  section > [chapter-number + h2 + p]

required_elements: [CHAPTER_TITLE]
optional_elements: [CHAPTER_NUMBER, INTRO_TEXT]

responsive_behavior:
  - desktop: generous spacing, large chapter number
  - mobile: reduced sizing

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-28: Blockquote with Highlight

```
blueprint_id: bp-blockquote-highlight
blueprint_name: Blockquote with Highlight
category: editorial
article_role: Display a blockquote with highlighted/emphasized key phrase

structural_pattern:
  - blockquote with left accent border
  - quote text with one phrase marked/highlighted (background tint)
  - optional attribution line

slot_definitions:
  - QUOTE_TEXT: full quote text
  - HIGHLIGHT_PHRASE: the emphasized portion (styled with background tint)
  - ATTRIBUTION: optional source/author

hierarchy:
  blockquote > [p > (text + mark + text) + cite?]

required_elements: [QUOTE_TEXT, HIGHLIGHT_PHRASE]
optional_elements: [ATTRIBUTION]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-29: Article Excerpt Card

```
blueprint_id: bp-article-excerpt
blueprint_name: Article Excerpt Card
category: editorial
article_role: Display a styled excerpt or teaser from another article

structural_pattern:
  - bordered card (rounded, shadow)
  - optional category tag (pill)
  - excerpt title (h4)
  - excerpt text (2-3 lines, muted)
  - "Read more" link or button

slot_definitions:
  - CATEGORY_TAG: optional category label
  - EXCERPT_TITLE: h4 heading
  - EXCERPT_TEXT: teaser paragraph
  - READ_MORE_LINK: link URL and label

hierarchy:
  card > [tag? + h4 + p + link]

required_elements: [EXCERPT_TITLE, EXCERPT_TEXT]
optional_elements: [CATEGORY_TAG, READ_MORE_LINK]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: can include thumbnail
sidebar_compatibility: works in main column or sidebar
```

### BP-30: Text with Side Annotation

```
blueprint_id: bp-side-annotation
blueprint_name: Text with Side Annotation
category: content-layout
article_role: Display main text with a side annotation or margin note

structural_pattern:
  - two-column layout (wide main + narrow annotation):
    - main column (~75%): body paragraphs
    - annotation column (~25%): small annotation text with accent top border
  - annotation positioned beside relevant paragraph

slot_definitions:
  - MAIN_TEXT: body paragraph(s)
  - ANNOTATION_TEXT: side note or margin comment
  - ANNOTATION_LABEL: optional label (e.g., "Note", "Editor")

hierarchy:
  container > [main-col > p* + annotation-col > (label? + text)]

required_elements: [MAIN_TEXT, ANNOTATION_TEXT]
optional_elements: [ANNOTATION_LABEL]

responsive_behavior:
  - desktop: two-column with side annotation
  - mobile: annotation moves below text as a styled callout

image_compatibility: none
sidebar_compatibility: works in main column only (needs width)
```

### BP-31: Hero Image with Gradient Fade

```
blueprint_id: bp-hero-image-gradient
blueprint_name: Hero Image with Gradient Fade
category: media
article_role: Display a full-width hero image with gradient overlay and text content

structural_pattern:
  - container (full-width, rounded, constrained height)
  - background image (object-fit cover)
  - gradient overlay (dark bottom to transparent top)
  - content positioned at bottom:
    - optional category badge
    - title (h3/h4)
    - description text (muted white)

slot_definitions:
  - IMAGE_SRC: background image path
  - IMAGE_ALT: alt text
  - CATEGORY_TAG: optional category label
  - TITLE: heading text
  - DESCRIPTION: overlay description

hierarchy:
  container > [img + gradient-overlay + content > (tag? + h3 + p)]

required_elements: [IMAGE_SRC, IMAGE_ALT, TITLE]
optional_elements: [CATEGORY_TAG, DESCRIPTION]

responsive_behavior:
  - desktop: tall hero (~420px), large text
  - mobile: shorter (~280px), reduced text

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-32: Offset Image + Text Card

```
blueprint_id: bp-offset-image-text
blueprint_name: Offset Image + Text Card
category: media
article_role: Display image and text in an asymmetric offset layout

structural_pattern:
  - two-column grid (image column + text column):
    - image column: rounded image, slightly offset/overlapping
    - text column: heading (h4), description paragraph, optional link
  - visual offset creates depth and movement

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - HEADING: h4 title
  - DESCRIPTION: text paragraph
  - LINK: optional action link

hierarchy:
  grid > [image-col > img + text-col > (h4 + p + link?)]

required_elements: [IMAGE_SRC, IMAGE_ALT, HEADING, DESCRIPTION]
optional_elements: [LINK]

responsive_behavior:
  - desktop: two-column with offset overlap
  - mobile: stacked, offset removed

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-33: Stacked Image with Stats Bar

```
blueprint_id: bp-stacked-image-stats
blueprint_name: Stacked Image with Stats Bar
category: media
article_role: Display an image with a stats/metrics bar below or overlaid

structural_pattern:
  - card container (rounded, shadow):
    - image section (full-width, constrained height)
    - stats bar below image:
      - horizontal flex row of 3-4 stat items
      - each stat: number (large) + label (small)
      - dividers between stats

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - STATS[]: array of {number, label} pairs (3-4 items)

hierarchy:
  card > [img + stats-bar > stat*N]
  stat > [number + label]

required_elements: [IMAGE_SRC, IMAGE_ALT, at least 3 STATS]
optional_elements: []

responsive_behavior:
  - desktop: stats in horizontal row below image
  - mobile: stats wrap to 2-column grid

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-34: Mosaic Image Grid

```
blueprint_id: bp-mosaic-grid
blueprint_name: Mosaic Image Grid
category: media
article_role: Display multiple images in an asymmetric mosaic/masonry layout

structural_pattern:
  - grid container with varied cell sizes:
    - one large image spanning 2 rows or 2 columns
    - 2-3 smaller images filling remaining space
    - all images: rounded, overflow hidden, object-fit cover
  - optional caption or label per image

slot_definitions:
  - IMAGES[]: array of {src, alt, size} (size: "large" or "small")
  - CAPTIONS[]: optional array of caption text per image

hierarchy:
  grid > [large-cell > img + small-cell*N > img]

required_elements: [at least 3 IMAGES]
optional_elements: [CAPTIONS]

responsive_behavior:
  - desktop: asymmetric grid (e.g., 2x2 with one large)
  - tablet: simplified grid
  - mobile: stacked vertically

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-35: Full-Bleed Image with Pill Caption

```
blueprint_id: bp-fullbleed-pill-caption
blueprint_name: Full-Bleed Image with Pill Caption
category: media
article_role: Display a full-width image with a floating pill-shaped caption

structural_pattern:
  - full-width container (rounded, overflow hidden)
  - image (full cover, object-fit)
  - gradient overlay (subtle)
  - floating pill caption (positioned bottom-left or bottom-center):
    - pill-shaped container (rounded-full, blurred background)
    - caption text (small, white)

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - CAPTION_TEXT: pill caption content
  - CAPTION_POSITION: bottom-left or bottom-center

hierarchy:
  container > [img + gradient + pill-caption > text]

required_elements: [IMAGE_SRC, IMAGE_ALT]
optional_elements: [CAPTION_TEXT]

responsive_behavior:
  - desktop: full-width with floating pill
  - mobile: pill caption may move to below image

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-36: Image Card with Bottom Strip

```
blueprint_id: bp-image-bottom-strip
blueprint_name: Image Card with Bottom Strip
category: media
article_role: Display an image card with a text strip below containing stats or description

structural_pattern:
  - card container (rounded, shadow):
    - image section (top, constrained height, gradient overlay)
    - bottom strip (white background, padded):
      - description text or metric highlights
      - optional source attribution

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - STRIP_CONTENT: description text or metrics
  - SOURCE: optional attribution

hierarchy:
  card > [image-section > (img + gradient) + strip > (content + source?)]

required_elements: [IMAGE_SRC, IMAGE_ALT, STRIP_CONTENT]
optional_elements: [SOURCE]

responsive_behavior:
  - consistent across breakpoints
  - strip text may wrap on mobile

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-37: Overlapping Image + Quote

```
blueprint_id: bp-overlapping-image-quote
blueprint_name: Overlapping Image + Quote
category: media
article_role: Display an image with an overlapping quote card for testimonials or callouts

structural_pattern:
  - relative container:
    - background image (full-width, rounded)
    - overlapping card (positioned to overlap image edge):
      - decorative quote mark
      - quote text (italic)
      - attribution line

slot_definitions:
  - IMAGE_SRC: background image
  - IMAGE_ALT: alt text
  - QUOTE_TEXT: the quoted text
  - ATTRIBUTION: author/source

hierarchy:
  container > [img + quote-card > (quote-mark + text + attribution)]

required_elements: [IMAGE_SRC, IMAGE_ALT, QUOTE_TEXT]
optional_elements: [ATTRIBUTION]

responsive_behavior:
  - desktop: card overlaps image edge
  - mobile: card sits below image (no overlap)

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-38: Horizontal Scroll Gallery

```
blueprint_id: bp-horizontal-gallery
blueprint_name: Horizontal Scroll Gallery
category: media
article_role: Display a horizontally scrollable row of images

structural_pattern:
  - section heading (h2) with optional intro
  - horizontal scroll container (overflow-x auto, snap):
    - row of image cards (flex, no wrap):
      - each card: image + optional caption below
      - scroll snap alignment per card
  - optional scroll indicators (arrows or dots)

slot_definitions:
  - SECTION_HEADING: h2 title
  - IMAGES[]: array of {src, alt, caption?} (4-8 items)

hierarchy:
  section > [h2? + scroll-container > card*N > (img + caption?)]

required_elements: [at least 3 IMAGES]
optional_elements: [SECTION_HEADING, captions per image]

responsive_behavior:
  - all breakpoints: horizontal scroll with snap
  - mobile: cards may be slightly narrower

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-39: Image Comparison Slider

```
blueprint_id: bp-image-comparison-slider
blueprint_name: Image Comparison Slider
category: interactive
article_role: Compare two images side-by-side with a draggable slider

structural_pattern:
  - container (rounded, overflow hidden, relative):
    - "before" image (full cover, clipped by slider position)
    - "after" image (full cover, behind)
    - draggable slider handle (vertical line + circle grip)
    - labels: "Before" (left), "After" (right)

slot_definitions:
  - BEFORE_IMAGE: first image path
  - AFTER_IMAGE: second image path
  - BEFORE_LABEL: label for left side
  - AFTER_LABEL: label for right side

hierarchy:
  container > [after-img + before-img(clipped) + slider-handle + labels]

required_elements: [BEFORE_IMAGE, AFTER_IMAGE]
optional_elements: [BEFORE_LABEL, AFTER_LABEL]

responsive_behavior:
  - consistent across breakpoints
  - touch-friendly slider on mobile

interaction_pattern:
  - drag slider to reveal before/after
  - default position: 50%

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-40: Image Feature List

```
blueprint_id: bp-image-feature-list
blueprint_name: Image Feature List
category: media
article_role: Display an image alongside a list of features or points

structural_pattern:
  - two-column layout:
    - image column (~50%): full-height image, rounded
    - feature list column (~50%):
      - heading (h3)
      - list of features with check/bullet icons
      - each item: icon + text

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - HEADING: h3 title
  - FEATURES[]: array of feature text items (4-6)

hierarchy:
  grid > [image-col > img + list-col > (h3 + ul > li*N)]
  li > [icon + text]

required_elements: [IMAGE_SRC, IMAGE_ALT, at least 3 FEATURES]
optional_elements: [HEADING]

responsive_behavior:
  - desktop: two-column side by side
  - mobile: stacked (image on top)

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-41: Rounded Image with Floating Tag

```
blueprint_id: bp-rounded-image-tag
blueprint_name: Rounded Image with Floating Tag
category: media
article_role: Display a rounded image with floating category/info tags

structural_pattern:
  - container (rounded, overflow hidden, relative):
    - image (full cover)
    - gradient overlay (subtle)
    - floating tags (positioned top-left):
      - pill-shaped tags with blurred background
      - tag text (small, uppercase)
    - optional floating stat (positioned top-right):
      - number + label

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - TAGS[]: array of tag labels
  - FLOATING_STAT: optional {number, label}

hierarchy:
  container > [img + gradient + tags > pill*N + stat?]

required_elements: [IMAGE_SRC, IMAGE_ALT]
optional_elements: [TAGS, FLOATING_STAT]

responsive_behavior:
  - consistent across breakpoints
  - tags may wrap on mobile

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-42: Vertical Stack — Image + Steps

```
blueprint_id: bp-image-steps-stack
blueprint_name: Vertical Stack — Image + Steps
category: media
article_role: Split card with image on one side and vertical process steps on the other

structural_pattern:
  - two-column card (rounded, shadow):
    - image column (~50%): image with dark overlay, title text
    - steps column (~50%): white background
      - vertical connector line
      - numbered steps (3-4):
        - circular number badge on connector line
        - step title (h4, bold)
        - step description (small paragraph)

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - IMAGE_TITLE: heading overlaid on image
  - IMAGE_SUBTITLE: description on image
  - STEPS[]: array of {title, description} (3-5 items)

hierarchy:
  card > [image-col > (img + overlay + text) + steps-col > (connector + step*N)]
  step > [number-badge + content > (h4 + p)]

required_elements: [IMAGE_SRC, IMAGE_ALT, at least 3 STEPS]
optional_elements: [IMAGE_TITLE, IMAGE_SUBTITLE]

responsive_behavior:
  - desktop: two-column horizontal
  - mobile: stacked (image on top, steps below)

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-43: Glassmorphism Image Card

```
blueprint_id: bp-glassmorphism-card
blueprint_name: Glassmorphism Image Card
category: media
article_role: Immersive image with layered glassmorphism elements and floating content

structural_pattern:
  - container (rounded, overflow hidden, relative, tall):
    - background image (full cover)
    - radial gradient overlay
    - floating tags (top-left, glassmorphism pills)
    - floating stat (top-right, glassmorphism card)
    - centered content card (glassmorphism):
      - heading (h4)
      - description text
      - action button (pill-shaped)

slot_definitions:
  - IMAGE_SRC: background image
  - IMAGE_ALT: alt text
  - TAGS[]: floating tag labels
  - FLOATING_STAT: {number, label}
  - CARD_HEADING: centered card title
  - CARD_DESCRIPTION: centered card text
  - ACTION_BUTTON: {label, url}

hierarchy:
  container > [img + overlay + tags + stat + center-card > (h4 + p + button)]

required_elements: [IMAGE_SRC, IMAGE_ALT, CARD_HEADING]
optional_elements: [TAGS, FLOATING_STAT, CARD_DESCRIPTION, ACTION_BUTTON]

responsive_behavior:
  - desktop: full layout with all floating elements
  - mobile: simplified, smaller floating elements

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-44: Two-Column Image + Testimonial

```
blueprint_id: bp-image-testimonial
blueprint_name: Two-Column Image + Testimonial
category: media
article_role: Split layout with image and testimonial panel for social proof

structural_pattern:
  - two-column card (grid 1fr 1fr, rounded, shadow):
    - image column: full-height image (object-fit cover)
    - testimonial column (padded, accent left border):
      - decorative quote mark (large, translucent)
      - quote text (italic, larger)
      - attribution:
        - accent bar
        - author name (bold)
        - author role (small, muted)

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - QUOTE_TEXT: testimonial text
  - AUTHOR_NAME: person name
  - AUTHOR_ROLE: title/organization

hierarchy:
  card > [image-col > img + testimonial-col > (quote-mark + text + attribution)]
  attribution > [bar + info > (name + role)]

required_elements: [IMAGE_SRC, IMAGE_ALT, QUOTE_TEXT, AUTHOR_NAME]
optional_elements: [AUTHOR_ROLE]

responsive_behavior:
  - desktop: two-column horizontal
  - mobile: stacked (image on top, testimonial below), border moves to top

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-45: Asymmetric Duo

```
blueprint_id: bp-asymmetric-duo
blueprint_name: Asymmetric Duo
category: media
article_role: Layered composition with main image and overlapping thumbnail cards

structural_pattern:
  - relative container:
    - main large image (rounded, shadow, ~80% width):
      - gradient overlay (bottom)
      - title and description at bottom
    - overlapping small card 1 (positioned top-right):
      - thumbnail image with label
    - overlapping small card 2 (positioned bottom-right):
      - thumbnail image with label

slot_definitions:
  - MAIN_IMAGE: primary large image
  - MAIN_TITLE: heading on main image
  - MAIN_DESCRIPTION: text on main image
  - THUMBNAILS[]: array of {src, alt, label} (2-3 items)

hierarchy:
  container > [main-image > (img + overlay + text) + thumbnail*N > (img + label)]

required_elements: [MAIN_IMAGE, at least 2 THUMBNAILS]
optional_elements: [MAIN_TITLE, MAIN_DESCRIPTION]

responsive_behavior:
  - desktop: layered with overlapping cards
  - mobile: stacked vertically, no overlap

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-46: Parallax-Style Banner

```
blueprint_id: bp-parallax-banner
blueprint_name: Parallax-Style Banner
category: media
article_role: Bold section divider with background image and centered editorial content

structural_pattern:
  - container (rounded, overflow hidden, medium height):
    - background image (full cover)
    - gradient overlay (angled, semi-opaque)
    - centered content:
      - category badge (pill with dot indicator)
      - heading (h2, white)
      - description text (muted white)

slot_definitions:
  - IMAGE_SRC: background image
  - IMAGE_ALT: alt text
  - CATEGORY_BADGE: category label
  - HEADING: h2 title
  - DESCRIPTION: supporting text

hierarchy:
  container > [img + gradient + center-content > (badge + h2 + p)]

required_elements: [IMAGE_SRC, IMAGE_ALT, HEADING]
optional_elements: [CATEGORY_BADGE, DESCRIPTION]

responsive_behavior:
  - desktop: tall banner with spacious text
  - mobile: shorter, text scales down

image_compatibility: this IS the image component
sidebar_compatibility: works in main column (full-width recommended)
```

### BP-47: Image Tiles with Hover Labels

```
blueprint_id: bp-image-tiles
blueprint_name: Image Tiles with Hover Labels
category: media
article_role: Circular image tiles with labels showing capabilities or team members

structural_pattern:
  - grid container (4 columns):
    - each tile (centered, staggered heights):
      - circular image (aspect-ratio 1:1, rounded-full, border, shadow)
      - title label (heading font, bold)
      - description (small, muted)
      - accent bar (short, centered)
    - alternating tiles offset vertically for stagger effect

slot_definitions:
  - TILES[]: array of {src, alt, title, description} (4 items)

hierarchy:
  grid > tile*4
  tile > [circular-img + title + description + accent-bar]

required_elements: [at least 3 TILES with image + title]
optional_elements: [description per tile]

responsive_behavior:
  - desktop: 4-column with staggered heights
  - tablet: 2-column grid
  - mobile: 1-column stack

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-48: Image with Inline Metrics Row

```
blueprint_id: bp-image-inline-metrics
blueprint_name: Image with Inline Metrics Row
category: media
article_role: Image with metrics overlaid at bottom and description strip below

structural_pattern:
  - card container (rounded, shadow):
    - image section (constrained height):
      - image (full cover)
      - gradient overlay (bottom)
      - metrics row (positioned at bottom, overlaid):
        - 3-4 metric items separated by vertical dividers
        - each: large value + small label
    - text strip below (white background):
      - description paragraph

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - METRICS[]: array of {value, label} (3-4 items)
  - DESCRIPTION: text below image

hierarchy:
  card > [image-section > (img + gradient + metrics-row > metric*N) + text-strip > p]
  metric > [value + label]

required_elements: [IMAGE_SRC, IMAGE_ALT, at least 3 METRICS]
optional_elements: [DESCRIPTION]

responsive_behavior:
  - desktop: metrics in horizontal row
  - mobile: metrics wrap to 2-column

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-49: Image with Accent Border Frame

```
blueprint_id: bp-accent-border-frame
blueprint_name: Image with Accent Border Frame
category: media
article_role: Display an image with a decorative gradient border frame

structural_pattern:
  - outer container (gradient border using padding trick):
    - gradient background (primary to accent)
    - inner container (rounded, overflow hidden):
      - image (full cover)
      - gradient overlay (bottom)
      - bottom content:
        - text and stats positioned at bottom
        - optional tags

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - BOTTOM_CONTENT: text or stats at bottom
  - TAGS[]: optional tag labels

hierarchy:
  outer(gradient-border) > inner > [img + gradient + content]

required_elements: [IMAGE_SRC, IMAGE_ALT]
optional_elements: [BOTTOM_CONTENT, TAGS]

responsive_behavior:
  - consistent across breakpoints
  - border frame width remains consistent

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-50: Image Bento Grid

```
blueprint_id: bp-bento-grid
blueprint_name: Image Bento Grid
category: media
article_role: Display images in a modern bento-box asymmetric grid layout

structural_pattern:
  - grid container with varied cell sizes (bento layout):
    - large cell (spans 2 cols or 2 rows)
    - medium cells (1x1)
    - small cells (1x1)
  - each cell: image with rounded corners, optional label overlay
  - overall layout creates visual rhythm through size contrast

slot_definitions:
  - IMAGES[]: array of {src, alt, size, label?} (4-6 items)

hierarchy:
  bento-grid > [cell*N > (img + label?)]

required_elements: [at least 4 IMAGES with varied sizes]
optional_elements: [labels per image]

responsive_behavior:
  - desktop: asymmetric bento grid
  - tablet: simplified 2-column
  - mobile: stacked single column

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-51: Four-Column KPI Row

```
blueprint_id: bp-kpi-row-four
blueprint_name: Four-Column KPI Row
category: data-visualization
article_role: Display four key performance indicators in a horizontal row

structural_pattern:
  - section heading (h2) with optional intro
  - four-column grid:
    - each KPI card (bordered, padded, centered):
      - large metric number (heading font, accent color)
      - metric label (small, muted)
      - optional trend indicator or icon

slot_definitions:
  - SECTION_HEADING: h2 title
  - KPI_ITEMS[]: array of {number, label, trend?} (4 items)

hierarchy:
  section > [h2? + grid > kpi-card*4]
  kpi-card > [number + label + trend?]

required_elements: [4 KPI_ITEMS with number + label]
optional_elements: [SECTION_HEADING, trend indicators]

responsive_behavior:
  - desktop: 4-column horizontal row
  - tablet: 2-column grid
  - mobile: 2-column or stacked

image_compatibility: none (data-focused)
sidebar_compatibility: works in main column
```

### BP-52: Three-Column Metric Highlights

```
blueprint_id: bp-metric-highlights-three
blueprint_name: Three-Column Metric Highlights
category: data-visualization
article_role: Showcase three key metrics with descriptions in highlight cards

structural_pattern:
  - three-column grid:
    - each card (bordered, rounded, padded):
      - optional icon or emoji
      - metric number (large, heading font)
      - metric label (bold)
      - description paragraph (small, muted)

slot_definitions:
  - METRICS[]: array of {icon?, number, label, description} (3 items)

hierarchy:
  grid > card*3
  card > [icon? + number + label + description]

required_elements: [3 METRICS with number + label]
optional_elements: [icon, description per metric]

responsive_behavior:
  - desktop: 3-column grid
  - tablet: 3-column (narrower)
  - mobile: stacked single column

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-53: Single Big Stat Callout

```
blueprint_id: bp-big-stat-callout
blueprint_name: Single Big Stat Callout
category: data-visualization
article_role: Emphasize a single major statistic with maximum visual impact

structural_pattern:
  - card container (dark or accent background, padded, centered):
    - optional category badge
    - large stat number (very prominent, heading font, 48-64px)
    - stat label (h4)
    - description paragraph (muted)

slot_definitions:
  - STAT_NUMBER: the key metric (e.g., "73%", "$2.4B")
  - STAT_LABEL: what the number represents
  - DESCRIPTION: context/explanation
  - CATEGORY_BADGE: optional tag

hierarchy:
  card > [badge? + number + label + description]

required_elements: [STAT_NUMBER, STAT_LABEL]
optional_elements: [DESCRIPTION, CATEGORY_BADGE]

responsive_behavior:
  - desktop: large centered stat
  - mobile: slightly smaller number, tighter padding

image_compatibility: none
sidebar_compatibility: works in main column or sidebar
```

### BP-54: Stat Comparison (Before/After)

```
blueprint_id: bp-stat-before-after
blueprint_name: Stat Comparison (Before/After)
category: data-visualization
article_role: Compare two sets of statistics showing improvement or change

structural_pattern:
  - two-column grid or flex row:
    - "before" column (muted styling):
      - column label (e.g., "Before", "Old")
      - stat items (2-3 metrics with values)
    - arrow or divider between columns
    - "after" column (accent styling):
      - column label (e.g., "After", "New")
      - stat items (2-3 metrics with values, highlighted)

slot_definitions:
  - BEFORE_LABEL: header for before state
  - BEFORE_STATS[]: array of {metric, value}
  - AFTER_LABEL: header for after state
  - AFTER_STATS[]: array of {metric, value}

hierarchy:
  container > [before-col > (label + stat*N) + divider + after-col > (label + stat*N)]

required_elements: [BEFORE_STATS, AFTER_STATS with matching metrics]
optional_elements: [BEFORE_LABEL, AFTER_LABEL]

responsive_behavior:
  - desktop: two-column side by side
  - mobile: stacked vertically

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-55: Progress Bar Stats

```
blueprint_id: bp-progress-bars
blueprint_name: Progress Bar Stats
category: data-visualization
article_role: Display metrics as horizontal progress bars with labels and percentages

structural_pattern:
  - section heading (h2) with optional intro
  - list of progress bar items (stacked vertically):
    - each item:
      - label row: metric name (left) + percentage value (right)
      - progress bar track (full-width, muted background):
        - filled bar (width = percentage, accent/primary color)

slot_definitions:
  - SECTION_HEADING: h2 title
  - BARS[]: array of {label, percentage} (4-6 items)

hierarchy:
  section > [h2? + bar-list > bar-item*N]
  bar-item > [label-row > (name + value) + track > fill]

required_elements: [at least 3 BARS with label + percentage]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-56: Metric Cards with Trend Indicators

```
blueprint_id: bp-metric-trend-cards
blueprint_name: Metric Cards with Trend Indicators
category: data-visualization
article_role: Display metrics with up/down trend indicators showing change direction

structural_pattern:
  - grid container (3-4 columns):
    - each card (bordered, padded):
      - metric label (small, muted, uppercase)
      - metric value (large, bold)
      - trend indicator: arrow (up/down) + change percentage
        - green arrow up = positive
        - red arrow down = negative
      - optional sparkline or mini chart

slot_definitions:
  - METRIC_CARDS[]: array of {label, value, trend_direction, trend_value}

hierarchy:
  grid > card*N
  card > [label + value + trend > (arrow + change)]

required_elements: [at least 3 METRIC_CARDS with value + trend]
optional_elements: [sparkline]

responsive_behavior:
  - desktop: 3-4 column grid
  - tablet: 2-column
  - mobile: 2-column or stacked

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-57: Two-Row Six-Stat Grid

```
blueprint_id: bp-six-stat-grid
blueprint_name: Two-Row Six-Stat Grid
category: data-visualization
article_role: Display six statistics in a compact two-row grid layout

structural_pattern:
  - grid container (3 columns × 2 rows):
    - each stat cell (bordered, centered, padded):
      - stat number (large, heading font)
      - stat label (small, muted)

slot_definitions:
  - STATS[]: array of {number, label} (6 items)

hierarchy:
  grid > stat-cell*6
  stat-cell > [number + label]

required_elements: [6 STATS with number + label]
optional_elements: []

responsive_behavior:
  - desktop: 3-column × 2-row grid
  - tablet: 3-column × 2-row
  - mobile: 2-column × 3-row

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-58: Circular Progress Indicators

```
blueprint_id: bp-circular-progress
blueprint_name: Circular Progress Indicators
category: data-visualization
article_role: Display metrics as circular/donut progress indicators

structural_pattern:
  - grid container (3-4 columns):
    - each indicator (centered):
      - SVG circle (track + filled arc):
        - background circle (muted)
        - progress arc (accent/primary, stroke-dasharray)
        - percentage text (centered inside circle)
      - label below circle (small, muted)

slot_definitions:
  - INDICATORS[]: array of {percentage, label} (3-4 items)

hierarchy:
  grid > indicator*N
  indicator > [svg > (track-circle + progress-arc + text) + label]

required_elements: [at least 3 INDICATORS with percentage + label]
optional_elements: []

responsive_behavior:
  - desktop: horizontal row of circles
  - mobile: 2-column grid or smaller circles

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-59: Stat Banner Strip

```
blueprint_id: bp-stat-banner
blueprint_name: Stat Banner Strip
category: data-visualization
article_role: Full-width banner strip with key stats in a horizontal row

structural_pattern:
  - full-width container (dark or primary background):
    - horizontal flex row of stat items:
      - each stat: large number + label
      - dividers between stats (vertical line or dot)
    - centered layout within max-width container

slot_definitions:
  - STATS[]: array of {number, label} (3-5 items)
  - BACKGROUND_STYLE: dark, primary, or accent

hierarchy:
  banner > [stats-row > (stat + divider)*N]
  stat > [number + label]

required_elements: [at least 3 STATS]
optional_elements: [BACKGROUND_STYLE]

responsive_behavior:
  - desktop: horizontal row with dividers
  - mobile: 2-column grid, dividers hidden

image_compatibility: none
sidebar_compatibility: works as full-width section break
```

### BP-60: Metric Comparison Cards

```
blueprint_id: bp-metric-comparison-cards
blueprint_name: Metric Comparison Cards
category: data-visualization
article_role: Compare metrics across categories using side-by-side cards

structural_pattern:
  - section heading (h2) with optional intro
  - grid container (2-3 columns):
    - each card (bordered, shadow, padded):
      - card header (category name, accent border bottom)
      - list of metrics:
        - each: metric name (left) + value (right, bold)
      - optional highlight for best value

slot_definitions:
  - SECTION_HEADING: h2 title
  - CARDS[]: array of {category, metrics: [{name, value}]}

hierarchy:
  section > [h2? + grid > card*N]
  card > [header + metric-list > metric*N]
  metric > [name + value]

required_elements: [at least 2 CARDS with metrics]
optional_elements: [SECTION_HEADING, value highlighting]

responsive_behavior:
  - desktop: 2-3 column grid
  - mobile: stacked single column

image_compatibility: none
sidebar_compatibility: works in main column
```
### BP-61: Full Width Image

```
blueprint_id: bp-full-width-image
blueprint_name: Full Width Image
category: media
article_role: Display a simple full-width image with optional alt text

structural_pattern:
  - figure container (full-width):
    - image (100% width, rounded, object-fit cover)
    - optional figcaption (small, muted, centered)

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: accessible alt text
  - CAPTION: optional caption

hierarchy:
  figure > [img + figcaption?]

required_elements: [IMAGE_SRC, IMAGE_ALT]
optional_elements: [CAPTION]

responsive_behavior:
  - image scales to container width at all breakpoints

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-62: Image with Caption (Variant 2)

```
blueprint_id: bp-image-caption-v2
blueprint_name: Image with Caption (Variant 2)
category: media
article_role: Display an image with a styled caption block below

structural_pattern:
  - figure container (rounded, overflow hidden, shadow):
    - image (full-width, constrained height)
    - figcaption (padded, muted background):
      - caption text (small)
      - source attribution (bold, optional)

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - CAPTION_TEXT: descriptive caption
  - SOURCE: optional source credit

hierarchy:
  figure > [img + figcaption > (text + source?)]

required_elements: [IMAGE_SRC, IMAGE_ALT, CAPTION_TEXT]
optional_elements: [SOURCE]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-63: Image with Side Text

```
blueprint_id: bp-image-side-text
blueprint_name: Image with Side Text
category: media
article_role: Display an image beside descriptive text in two columns

structural_pattern:
  - two-column grid (50/50 or 60/40):
    - image column: rounded image (full height, object-fit cover)
    - text column (vertically centered):
      - heading (h3)
      - paragraph text
      - optional link

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - HEADING: h3 title
  - TEXT: description paragraph
  - LINK: optional action link

hierarchy:
  grid > [image-col > img + text-col > (h3 + p + link?)]

required_elements: [IMAGE_SRC, IMAGE_ALT, TEXT]
optional_elements: [HEADING, LINK]

responsive_behavior:
  - desktop: two-column side by side
  - mobile: stacked (image on top)

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-64: Two Image Grid

```
blueprint_id: bp-two-image-grid
blueprint_name: Two Image Grid
category: media
article_role: Display two images side by side in a balanced grid

structural_pattern:
  - two-column grid (equal):
    - each cell:
      - image (rounded, object-fit cover, equal height)
      - optional caption below each

slot_definitions:
  - IMAGE_1: {src, alt, caption?}
  - IMAGE_2: {src, alt, caption?}

hierarchy:
  grid > [cell*2 > (img + caption?)]

required_elements: [IMAGE_1, IMAGE_2]
optional_elements: [captions]

responsive_behavior:
  - desktop: two-column side by side
  - mobile: stacked vertically

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-65: Three Image Grid

```
blueprint_id: bp-three-image-grid
blueprint_name: Three Image Grid
category: media
article_role: Display three images in a grid layout

structural_pattern:
  - grid container (3 columns or 1 large + 2 small):
    - each cell:
      - image (rounded, object-fit cover)
      - optional caption or label overlay

slot_definitions:
  - IMAGES[]: array of 3 {src, alt, caption?}
  - LAYOUT: "equal" or "featured" (one large + two small)

hierarchy:
  grid > [cell*3 > (img + caption?)]

required_elements: [3 IMAGES]
optional_elements: [captions, LAYOUT]

responsive_behavior:
  - desktop: 3-column grid
  - mobile: stacked or 1+2 layout

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-66: Image Gallery Row

```
blueprint_id: bp-image-gallery-row
blueprint_name: Image Gallery Row
category: media
article_role: Display a row of images in a horizontal gallery

structural_pattern:
  - horizontal flex container (gap between items):
    - 3-5 images (equal width, rounded, object-fit cover)
    - all images same height
    - optional hover effect (slight zoom or shadow)

slot_definitions:
  - IMAGES[]: array of {src, alt} (3-5 items)

hierarchy:
  gallery-row > [img*N]

required_elements: [at least 3 IMAGES]
optional_elements: []

responsive_behavior:
  - desktop: horizontal row
  - mobile: horizontal scroll or 2-column grid

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-67: Image Highlight Block

```
blueprint_id: bp-image-highlight-block
blueprint_name: Image Highlight Block
category: media
article_role: Display an image with emphasis/highlight treatment

structural_pattern:
  - container (shadow, rounded, accent border or background):
    - image (full-width, rounded)
    - highlight strip below:
      - icon or badge
      - highlight text (bold, accent color)

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - HIGHLIGHT_TEXT: emphasis text
  - HIGHLIGHT_ICON: optional icon

hierarchy:
  container > [img + highlight-strip > (icon? + text)]

required_elements: [IMAGE_SRC, IMAGE_ALT, HIGHLIGHT_TEXT]
optional_elements: [HIGHLIGHT_ICON]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-68: Article Figure Block

```
blueprint_id: bp-article-figure
blueprint_name: Article Figure Block
category: media
article_role: Semantic figure element with detailed caption and source

structural_pattern:
  - figure element (semantic HTML):
    - image (full-width, rounded, shadow)
    - figcaption:
      - figure number/label (bold, "Figure 1:")
      - caption text (descriptive)
      - source citation (small, italic)

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - FIGURE_LABEL: figure number (e.g., "Figure 1")
  - CAPTION: descriptive caption
  - SOURCE: source citation

hierarchy:
  figure > [img + figcaption > (label + caption + source?)]

required_elements: [IMAGE_SRC, IMAGE_ALT, CAPTION]
optional_elements: [FIGURE_LABEL, SOURCE]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-69: Image with Quote Overlay

```
blueprint_id: bp-image-quote-overlay
blueprint_name: Image with Quote Overlay
category: media
article_role: Display an image with a quote overlaid on top

structural_pattern:
  - container (rounded, overflow hidden, relative):
    - image (full cover)
    - dark gradient overlay
    - quote overlay (positioned center or bottom):
      - decorative quote mark
      - quote text (white, italic)
      - attribution (muted white)

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - QUOTE_TEXT: overlaid quote
  - ATTRIBUTION: author/source

hierarchy:
  container > [img + gradient + quote-overlay > (mark + text + attribution)]

required_elements: [IMAGE_SRC, IMAGE_ALT, QUOTE_TEXT]
optional_elements: [ATTRIBUTION]

responsive_behavior:
  - consistent across breakpoints
  - text size may reduce on mobile

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-70: Image Comparison

```
blueprint_id: bp-image-comparison
blueprint_name: Image Comparison
category: media
article_role: Display two images side by side for visual comparison

structural_pattern:
  - two-column grid:
    - left image (rounded, labeled "Before" or custom):
      - image + label overlay at bottom
    - right image (rounded, labeled "After" or custom):
      - image + label overlay at bottom

slot_definitions:
  - LEFT_IMAGE: {src, alt, label}
  - RIGHT_IMAGE: {src, alt, label}

hierarchy:
  grid > [left-cell > (img + label) + right-cell > (img + label)]

required_elements: [LEFT_IMAGE, RIGHT_IMAGE]
optional_elements: [custom labels]

responsive_behavior:
  - desktop: two-column side by side
  - mobile: stacked vertically

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

## EXTENDED COMPONENT BLUEPRINTS (BP-71 to BP-120)

### BP-71: Horizontal Process Flow

```
blueprint_id: bp-horizontal-process-flow
blueprint_name: Horizontal Process Flow
category: sequential-content
article_role: Display a multi-step process in a horizontal flow with connectors

structural_pattern:
  - section heading (h2) with optional intro
  - horizontal flex container with connector arrows:
    - each step card (bordered, padded):
      - step number badge (circular, accent)
      - step icon or emoji
      - step title (h4, bold)
      - step description (paragraph)
    - arrow connectors between steps

slot_definitions:
  - SECTION_HEADING: h2 title
  - STEPS[]: array of {number, icon?, title, description} (4-6 items)

hierarchy:
  section > [h2? + flow-container > (step-card + arrow)*N]
  step-card > [badge + icon? + h4 + p]

required_elements: [at least 3 STEPS with title + description]
optional_elements: [SECTION_HEADING, icons]

responsive_behavior:
  - desktop: horizontal flow with arrows
  - tablet: 2-column grid
  - mobile: vertical stack, arrows rotate 90°

image_compatibility: can include icons
sidebar_compatibility: works in main column (needs full width)
```

### BP-72: Vertical Timeline (Variant 2)

```
blueprint_id: bp-vertical-timeline-v2
blueprint_name: Vertical Timeline (Variant 2)
category: chronological-content
article_role: Present events in a vertical timeline with alternating left/right cards

structural_pattern:
  - section heading (h2) with optional intro
  - vertical timeline with center line:
    - each event (alternating left/right of center line):
      - timeline dot (on center line)
      - event card:
        - date/time label (small, accent)
        - event title (h4)
        - event description (paragraph)

slot_definitions:
  - SECTION_HEADING: h2 title
  - EVENTS[]: array of {date, title, description} (4-8 items)

hierarchy:
  section > [h2? + timeline > event*N]
  event > [dot + card > (date + h4 + p)]

required_elements: [at least 3 EVENTS with date + title]
optional_elements: [SECTION_HEADING, description per event]

responsive_behavior:
  - desktop: alternating left/right cards along center line
  - mobile: all cards on one side, timeline line on left

image_compatibility: can pair with images in cards
sidebar_compatibility: works in main column
```

### BP-73: Numbered Steps

```
blueprint_id: bp-numbered-steps
blueprint_name: Numbered Steps
category: sequential-content
article_role: Present ordered steps with prominent number badges

structural_pattern:
  - section heading (h2) with optional intro
  - vertical list with connector line:
    - each step:
      - large circular number badge (accent background)
      - step content card (bordered, padded):
        - step title (h4)
        - step description (paragraph)
        - optional sub-items list

slot_definitions:
  - SECTION_HEADING: h2 title
  - STEPS[]: array of {title, description, sub_items?[]} (3-8 items)

hierarchy:
  section > [h2? + steps-list > step*N]
  step > [number-badge + card > (h4 + p + ul?)]

required_elements: [at least 3 STEPS with title + description]
optional_elements: [SECTION_HEADING, sub_items]

responsive_behavior:
  - consistent across breakpoints
  - badge and card spacing reduce on mobile

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-74: Horizontal Milestone Bar

```
blueprint_id: bp-horizontal-milestones
blueprint_name: Horizontal Milestone Bar
category: chronological-content
article_role: Display milestones in a horizontal bar/track layout

structural_pattern:
  - section heading (h2)
  - horizontal track (progress bar style):
    - track line (full-width, muted)
    - milestone markers positioned along track:
      - dot on track line
      - label above or below (alternating)
      - optional date/value

slot_definitions:
  - SECTION_HEADING: h2 title
  - MILESTONES[]: array of {label, date?, position_percent} (4-8 items)

hierarchy:
  section > [h2 + track > (track-line + marker*N)]
  marker > [dot + label + date?]

required_elements: [at least 4 MILESTONES with label]
optional_elements: [SECTION_HEADING, dates]

responsive_behavior:
  - desktop: horizontal bar with markers
  - mobile: converts to vertical list

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-75: Decision Flowchart

```
blueprint_id: bp-decision-flowchart
blueprint_name: Decision Flowchart
category: sequential-content
article_role: Guide reader through a decision tree with yes/no branches

structural_pattern:
  - section heading (h2)
  - vertical flowchart:
    - start node (rounded pill)
    - decision nodes (diamond/rounded with question):
      - "Yes" branch (right/down with label)
      - "No" branch (left/down with label)
    - action nodes (rectangular cards with instructions)
    - connector lines between nodes
    - end node (rounded pill)

slot_definitions:
  - SECTION_HEADING: h2 title
  - START_LABEL: starting text
  - DECISIONS[]: array of {question, yes_action, no_action}
  - END_LABEL: conclusion text

hierarchy:
  section > [h2 + flowchart > (start + decision*N + end)]
  decision > [question + yes-branch + no-branch]

required_elements: [at least 2 DECISIONS with question + branches]
optional_elements: [SECTION_HEADING, START_LABEL, END_LABEL]

responsive_behavior:
  - desktop: full flowchart with branches
  - mobile: simplified linear flow

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-76: Circular Process Diagram

```
blueprint_id: bp-circular-process
blueprint_name: Circular Process Diagram
category: sequential-content
article_role: Display a cyclical process as a circular/radial diagram

structural_pattern:
  - section heading (h2)
  - circular diagram (SVG or CSS):
    - center label (process name)
    - steps arranged in circle around center:
      - each step: numbered node + label
      - curved connector arrows between nodes
  - optional legend or description below

slot_definitions:
  - SECTION_HEADING: h2 title
  - CENTER_LABEL: central process name
  - STEPS[]: array of {number, label} (4-6 items, arranged circularly)

hierarchy:
  section > [h2 + diagram > (center + step-node*N + connectors)]

required_elements: [CENTER_LABEL, at least 4 STEPS]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - desktop: full circular diagram
  - mobile: linear list fallback or smaller circle

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-77: Accordion Process

```
blueprint_id: bp-accordion-process
blueprint_name: Accordion Process
category: sequential-content
article_role: Present process steps as expandable accordion sections

structural_pattern:
  - section heading (h2)
  - accordion container (bordered):
    - each step (separated by borders):
      - step header (clickable, flex row):
        - step number badge
        - step title (bold)
        - chevron icon (rotates on open)
      - step content panel (collapsible):
        - description paragraph
        - optional sub-steps or bullet list

slot_definitions:
  - SECTION_HEADING: h2 title
  - STEPS[]: array of {number, title, description, sub_items?[]}

hierarchy:
  section > [h2 + accordion > step*N]
  step > [header > (badge + title + chevron) + panel > (p + ul?)]

required_elements: [at least 3 STEPS with title + description]
optional_elements: [SECTION_HEADING, sub_items]

responsive_behavior:
  - consistent across breakpoints

interaction_pattern:
  - click to expand/collapse
  - chevron rotates on toggle

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-78: Gantt-Style Timeline

```
blueprint_id: bp-gantt-timeline
blueprint_name: Gantt-Style Timeline
category: chronological-content
article_role: Display overlapping phases or tasks in a Gantt chart format

structural_pattern:
  - section heading (h2)
  - Gantt chart container:
    - header row: time period labels (weeks/months)
    - task rows:
      - task label (left column)
      - bar (positioned across time columns, colored):
        - bar width = duration
        - bar position = start time
      - optional milestone markers

slot_definitions:
  - SECTION_HEADING: h2 title
  - TIME_LABELS[]: column headers
  - TASKS[]: array of {label, start, duration, color_category}

hierarchy:
  section > [h2 + gantt > (header-row + task-row*N)]
  task-row > [label + bar]

required_elements: [TIME_LABELS, at least 3 TASKS]
optional_elements: [SECTION_HEADING, milestones]

responsive_behavior:
  - desktop: full horizontal Gantt chart
  - mobile: simplified list or horizontal scroll

image_compatibility: none
sidebar_compatibility: works in main column (needs width)
```

### BP-79: Two-Track Process

```
blueprint_id: bp-two-track-process
blueprint_name: Two-Track Process
category: sequential-content
article_role: Show two parallel process tracks running simultaneously

structural_pattern:
  - section heading (h2)
  - two-column layout:
    - left track (labeled):
      - track header (h4)
      - vertical step list with connector line
    - right track (labeled):
      - track header (h4)
      - vertical step list with connector line
  - optional sync points connecting the two tracks

slot_definitions:
  - SECTION_HEADING: h2 title
  - LEFT_TRACK_LABEL: h4 track name
  - LEFT_STEPS[]: array of {title, description}
  - RIGHT_TRACK_LABEL: h4 track name
  - RIGHT_STEPS[]: array of {title, description}

hierarchy:
  section > [h2 + grid > (left-track + right-track)]
  track > [h4 + step-list > step*N]
  step > [dot + title + description]

required_elements: [LEFT_STEPS, RIGHT_STEPS with at least 3 each]
optional_elements: [SECTION_HEADING, track labels]

responsive_behavior:
  - desktop: two-column parallel tracks
  - mobile: stacked vertically (Track 1 then Track 2)

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-80: Process Cards Grid

```
blueprint_id: bp-process-cards-grid
blueprint_name: Process Cards Grid
category: sequential-content
article_role: Display process steps as a grid of numbered cards

structural_pattern:
  - section heading (h2) with optional intro
  - grid container (3 columns):
    - each card (bordered, padded, rounded):
      - step number (large, muted or accent)
      - step title (h4, bold)
      - step description (paragraph)
      - optional icon

slot_definitions:
  - SECTION_HEADING: h2 title
  - CARDS[]: array of {number, title, description, icon?} (6-9 items)

hierarchy:
  section > [h2? + grid > card*N]
  card > [number + h4 + p + icon?]

required_elements: [at least 4 CARDS with number + title + description]
optional_elements: [SECTION_HEADING, icons]

responsive_behavior:
  - desktop: 3-column grid
  - tablet: 2-column
  - mobile: single column stack

image_compatibility: icons only
sidebar_compatibility: works in main column
```

### BP-81: Classic Accordion FAQ

```
blueprint_id: bp-classic-accordion
blueprint_name: Classic Accordion FAQ
category: interactive
article_role: Standard FAQ accordion with expandable question/answer pairs

structural_pattern:
  - section heading (h2) with optional intro
  - accordion container (bordered, rounded):
    - each FAQ item (separated by borders):
      - question button (full-width, flex):
        - question text (bold)
        - plus/minus or chevron icon
      - answer panel (collapsible):
        - answer text (paragraph, muted)

slot_definitions:
  - SECTION_HEADING: h2 title
  - FAQ_ITEMS[]: array of {question, answer} (5-10 items)

hierarchy:
  section > [h2? + accordion > faq-item*N]
  faq-item > [question-btn > (text + icon) + answer-panel > p]

required_elements: [at least 3 FAQ_ITEMS]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - consistent across breakpoints

interaction_pattern:
  - click to toggle answer visibility
  - icon rotates/changes on toggle

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-82: Two-Column Q&A Grid

```
blueprint_id: bp-two-col-qa
blueprint_name: Two-Column Q&A Grid
category: interactive
article_role: Display FAQ items in a two-column grid layout

structural_pattern:
  - section heading (h2)
  - two-column grid:
    - each Q&A card (bordered, padded):
      - question (h4, bold, with Q icon)
      - answer (paragraph, muted)

slot_definitions:
  - SECTION_HEADING: h2 title
  - QA_ITEMS[]: array of {question, answer} (4-8 items)

hierarchy:
  section > [h2 + grid > qa-card*N]
  qa-card > [h4 + p]

required_elements: [at least 4 QA_ITEMS]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - desktop: 2-column grid
  - mobile: single column stack

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-83: Tabbed FAQ Categories

```
blueprint_id: bp-tabbed-faq
blueprint_name: Tabbed FAQ Categories
category: interactive
article_role: Organize FAQ items into tabbed categories for easy navigation

structural_pattern:
  - section heading (h2)
  - tab bar (horizontal pills/buttons):
    - each tab: category label (clickable)
  - tab content panels (one visible at a time):
    - each panel: accordion FAQ items for that category

slot_definitions:
  - SECTION_HEADING: h2 title
  - CATEGORIES[]: array of {label, items: [{question, answer}]}

hierarchy:
  section > [h2 + tab-bar > tab*N + tab-panels > panel*N > accordion]

required_elements: [at least 2 CATEGORIES with FAQ items]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - desktop: horizontal tab bar
  - mobile: tabs may scroll horizontally or become dropdown

interaction_pattern:
  - click tab to switch category
  - active tab highlighted
  - FAQ items within each tab are expandable

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-84: FAQ Cards Grid

```
blueprint_id: bp-faq-cards-grid
blueprint_name: FAQ Cards Grid
category: interactive
article_role: Display Q&A pairs as individual cards in a grid

structural_pattern:
  - section heading (h2)
  - grid container (2-3 columns):
    - each card (bordered, rounded, padded, shadow):
      - question icon (? symbol, circular, accent)
      - question text (h4, bold)
      - answer text (paragraph, muted)

slot_definitions:
  - SECTION_HEADING: h2 title
  - FAQ_CARDS[]: array of {question, answer} (4-9 items)

hierarchy:
  section > [h2 + grid > card*N]
  card > [icon + h4 + p]

required_elements: [at least 4 FAQ_CARDS]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - desktop: 3-column grid
  - tablet: 2-column
  - mobile: single column

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-85: Inline Q&A List

```
blueprint_id: bp-inline-qa
blueprint_name: Inline Q&A List
category: editorial
article_role: Present Q&A pairs as a clean inline list without accordion behavior

structural_pattern:
  - section heading (h2)
  - list of Q&A pairs (stacked vertically):
    - each pair:
      - question (bold, with "Q:" prefix or icon)
      - answer (paragraph below, muted, indented)
      - separator line between pairs

slot_definitions:
  - SECTION_HEADING: h2 title
  - QA_PAIRS[]: array of {question, answer}

hierarchy:
  section > [h2 + qa-list > qa-pair*N]
  qa-pair > [question + answer + separator]

required_elements: [at least 3 QA_PAIRS]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-86: FAQ with Category Headers

```
blueprint_id: bp-faq-category-headers
blueprint_name: FAQ with Category Headers
category: interactive
article_role: Group FAQ items under category headings for organization

structural_pattern:
  - section heading (h2)
  - grouped FAQ sections:
    - each group:
      - category heading (h3, with accent border or icon)
      - accordion items within group:
        - question + answer (expandable)

slot_definitions:
  - SECTION_HEADING: h2 title
  - GROUPS[]: array of {category, items: [{question, answer}]}

hierarchy:
  section > [h2 + group*N]
  group > [h3 + accordion > faq-item*N]

required_elements: [at least 2 GROUPS with FAQ items]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-87: Single Featured Question

```
blueprint_id: bp-featured-question
blueprint_name: Single Featured Question
category: editorial
article_role: Highlight a single important question with a detailed answer

structural_pattern:
  - prominent card (bordered, accent left border, padded):
    - question icon or "Q" badge
    - question text (h3, bold)
    - detailed answer (paragraph, may include bullets)
    - optional source citation

slot_definitions:
  - QUESTION: the featured question
  - ANSWER: detailed answer text
  - SOURCE: optional citation

hierarchy:
  card > [icon + h3 + answer-content + source?]

required_elements: [QUESTION, ANSWER]
optional_elements: [SOURCE]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: none
sidebar_compatibility: works in main column or sidebar
```

### BP-88: FAQ Sidebar Panel

```
blueprint_id: bp-faq-sidebar
blueprint_name: FAQ Sidebar Panel
category: interactive
article_role: Compact FAQ panel designed for sidebar placement

structural_pattern:
  - panel container (bordered, rounded, compact padding):
    - panel heading (h4, with accent border)
    - compact accordion items:
      - question (smaller text, bold)
      - answer (smaller text, muted, collapsible)

slot_definitions:
  - PANEL_HEADING: h4 title
  - FAQ_ITEMS[]: array of {question, answer} (3-5 items)

hierarchy:
  panel > [h4 + accordion > faq-item*N]

required_elements: [PANEL_HEADING, at least 3 FAQ_ITEMS]
optional_elements: []

responsive_behavior:
  - consistent across breakpoints (already compact)

image_compatibility: none
sidebar_compatibility: excellent — designed for sidebar
```

### BP-89: Visual Q&A with Icons

```
blueprint_id: bp-visual-qa-icons
blueprint_name: Visual Q&A with Icons
category: interactive
article_role: FAQ items with category-specific icons for visual scanning

structural_pattern:
  - section heading (h2)
  - list of Q&A items:
    - each item (flex row):
      - icon container (square, tinted background, themed to topic)
      - content:
        - question (bold, clickable)
        - answer (collapsible, muted)

slot_definitions:
  - SECTION_HEADING: h2 title
  - QA_ITEMS[]: array of {icon, question, answer}

hierarchy:
  section > [h2 + qa-list > qa-item*N]
  qa-item > [icon-container + content > (question + answer)]

required_elements: [at least 3 QA_ITEMS with question + answer]
optional_elements: [SECTION_HEADING, icons]

responsive_behavior:
  - consistent across breakpoints
  - icon may hide on very small screens

image_compatibility: icons/emoji only
sidebar_compatibility: works in main column
```

### BP-90: FAQ Summary Table

```
blueprint_id: bp-faq-summary-table
blueprint_name: FAQ Summary Table
category: data-visualization
article_role: Present Q&A pairs in a structured table format for quick scanning

structural_pattern:
  - section heading (h2)
  - table:
    - thead: "Question" | "Answer" columns
    - tbody: rows of question-answer pairs
      - question column (bold)
      - answer column (regular text)
      - alternating row backgrounds

slot_definitions:
  - SECTION_HEADING: h2 title
  - QA_ROWS[]: array of {question, answer}

hierarchy:
  section > [h2 + table > (thead + tbody > tr*N)]

required_elements: [at least 3 QA_ROWS]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - desktop: full table
  - mobile: horizontal scroll or stacked

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-91: Problem → Approach → Results

```
blueprint_id: bp-problem-approach-results
blueprint_name: Problem → Approach → Results
category: comparison
article_role: Present a case study in three phases: problem, approach, results

structural_pattern:
  - three-column layout or three-section vertical:
    - Problem section (muted/red tint):
      - header with icon (⚠ or similar)
      - problem description
    - Approach section (neutral):
      - header with icon (🔧 or similar)
      - approach description
    - Results section (accent/green tint):
      - header with icon (✓ or similar)
      - results with metrics

slot_definitions:
  - PROBLEM_TITLE: header
  - PROBLEM_TEXT: description
  - APPROACH_TITLE: header
  - APPROACH_TEXT: description
  - RESULTS_TITLE: header
  - RESULTS_TEXT: description with metrics

hierarchy:
  container > [problem-section + approach-section + results-section]
  section > [header > (icon + title) + content]

required_elements: [PROBLEM_TEXT, APPROACH_TEXT, RESULTS_TEXT]
optional_elements: [custom titles, icons]

responsive_behavior:
  - desktop: three-column horizontal
  - mobile: stacked vertically

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-92: Before/After Comparison (Case Study)

```
blueprint_id: bp-case-study-before-after
blueprint_name: Before/After Comparison (Case Study)
category: comparison
article_role: Show case study results with before/after metrics and context

structural_pattern:
  - card container (bordered, shadow):
    - case study header (client name, industry tag)
    - two-column comparison:
      - "Before" column: metric cards with old values
      - "After" column: metric cards with new values (highlighted)
    - improvement indicators between columns

slot_definitions:
  - CLIENT_NAME: case study subject
  - INDUSTRY_TAG: category label
  - BEFORE_METRICS[]: array of {label, value}
  - AFTER_METRICS[]: array of {label, value}

hierarchy:
  card > [header + comparison > (before-col + after-col)]

required_elements: [BEFORE_METRICS, AFTER_METRICS]
optional_elements: [CLIENT_NAME, INDUSTRY_TAG]

responsive_behavior:
  - desktop: two-column side by side
  - mobile: stacked vertically

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-93: Testimonial + Results Row

```
blueprint_id: bp-testimonial-results
blueprint_name: Testimonial + Results Row
category: comparison
article_role: Combine a client testimonial with measurable results metrics

structural_pattern:
  - two-section layout:
    - testimonial section:
      - quote text (italic)
      - attribution (name, title, company)
    - results row:
      - 3-4 metric cards in horizontal row
      - each: number + label

slot_definitions:
  - QUOTE_TEXT: testimonial quote
  - AUTHOR_NAME: person name
  - AUTHOR_TITLE: role/company
  - RESULTS[]: array of {number, label} (3-4 items)

hierarchy:
  container > [testimonial > (quote + attribution) + results-row > metric*N]

required_elements: [QUOTE_TEXT, AUTHOR_NAME, at least 3 RESULTS]
optional_elements: [AUTHOR_TITLE]

responsive_behavior:
  - desktop: testimonial above, metrics row below
  - mobile: metrics wrap to 2-column grid

image_compatibility: optional author avatar
sidebar_compatibility: works in main column
```

### BP-94: Compact Case Study Card

```
blueprint_id: bp-compact-case-study
blueprint_name: Compact Case Study Card
category: comparison
article_role: Display a condensed case study with key details in a single card

structural_pattern:
  - card (bordered, rounded, padded):
    - header: client name + industry tag
    - challenge summary (1-2 sentences)
    - solution summary (1-2 sentences)
    - results row: 2-3 key metrics
    - optional CTA link

slot_definitions:
  - CLIENT_NAME: case study subject
  - INDUSTRY_TAG: category label
  - CHALLENGE: brief problem statement
  - SOLUTION: brief solution statement
  - RESULTS[]: array of {number, label}
  - CTA_LINK: optional read more link

hierarchy:
  card > [header + challenge + solution + results-row + cta?]

required_elements: [CHALLENGE, SOLUTION, at least 2 RESULTS]
optional_elements: [CLIENT_NAME, INDUSTRY_TAG, CTA_LINK]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: optional client logo
sidebar_compatibility: works in main column or sidebar
```

### BP-95: Outcome Metrics Banner

```
blueprint_id: bp-outcome-banner
blueprint_name: Outcome Metrics Banner
category: data-visualization
article_role: Full-width banner showcasing key outcomes with prominent metrics

structural_pattern:
  - full-width container (dark or accent background):
    - banner heading (centered, white)
    - horizontal row of outcome metrics:
      - each: large number (accent color) + label (white/muted)
      - dividers between metrics

slot_definitions:
  - BANNER_HEADING: title text
  - OUTCOMES[]: array of {number, label} (3-5 items)

hierarchy:
  banner > [heading + metrics-row > (metric + divider)*N]

required_elements: [at least 3 OUTCOMES]
optional_elements: [BANNER_HEADING]

responsive_behavior:
  - desktop: horizontal row
  - mobile: 2-column grid

image_compatibility: none
sidebar_compatibility: works as full-width section
```

### BP-96: Client Success Story

```
blueprint_id: bp-client-success
blueprint_name: Client Success Story
category: comparison
article_role: Full narrative case study with client context, challenge, solution, and outcomes

structural_pattern:
  - card container (bordered, shadow):
    - header: client name, logo space, industry
    - body sections:
      - "The Challenge" (h4 + paragraph)
      - "Our Approach" (h4 + paragraph or bullet list)
      - "The Results" (h4 + metric cards row)
    - optional client quote at bottom

slot_definitions:
  - CLIENT_NAME: company name
  - INDUSTRY: industry tag
  - CHALLENGE_TEXT: problem description
  - APPROACH_TEXT: solution description
  - RESULTS[]: array of {number, label}
  - CLIENT_QUOTE: optional testimonial

hierarchy:
  card > [header + challenge-section + approach-section + results-section + quote?]

required_elements: [CHALLENGE_TEXT, APPROACH_TEXT, RESULTS]
optional_elements: [CLIENT_NAME, INDUSTRY, CLIENT_QUOTE]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: optional client logo/image
sidebar_compatibility: works in main column
```

### BP-97: Impact Highlight

```
blueprint_id: bp-impact-highlight
blueprint_name: Impact Highlight
category: data-visualization
article_role: Emphasize a single impactful result with before/after context

structural_pattern:
  - card (accent background or bordered):
    - impact metric (very large number, centered)
    - impact description (what changed)
    - before/after context:
      - "From X" → "To Y" display
    - optional supporting text

slot_definitions:
  - IMPACT_NUMBER: the key change metric (e.g., "40% reduction")
  - IMPACT_DESCRIPTION: what the metric represents
  - FROM_VALUE: starting state
  - TO_VALUE: ending state

hierarchy:
  card > [impact-number + description + context > (from + arrow + to)]

required_elements: [IMPACT_NUMBER, IMPACT_DESCRIPTION]
optional_elements: [FROM_VALUE, TO_VALUE]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: none
sidebar_compatibility: works in main column or sidebar
```

### BP-98: Three-Phase Case Study

```
blueprint_id: bp-three-phase-case
blueprint_name: Three-Phase Case Study
category: comparison
article_role: Present a case study split into three chronological phases

structural_pattern:
  - section heading (h2)
  - three-phase layout (horizontal or vertical):
    - Phase 1 card: title, timeline, description
    - Phase 2 card: title, timeline, description
    - Phase 3 card: title, timeline, results metrics

slot_definitions:
  - SECTION_HEADING: h2 title
  - PHASES[]: array of {phase_label, title, timeline, description, metrics?[]}

hierarchy:
  section > [h2 + phase-container > phase-card*3]
  phase-card > [phase-label + h4 + timeline + p + metrics?]

required_elements: [3 PHASES with title + description]
optional_elements: [SECTION_HEADING, metrics in final phase]

responsive_behavior:
  - desktop: three-column horizontal
  - mobile: stacked vertically

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-99: Results Dashboard

```
blueprint_id: bp-results-dashboard
blueprint_name: Results Dashboard
category: data-visualization
article_role: Dashboard-style layout with multiple metric types showing results

structural_pattern:
  - section heading (h2)
  - dashboard grid:
    - large metric card (spans 2 columns, primary stat)
    - smaller metric cards (4-6, secondary stats)
    - each card: number + label + optional trend
    - optional chart or progress bar in cards

slot_definitions:
  - SECTION_HEADING: h2 title
  - PRIMARY_METRIC: {number, label, description}
  - SECONDARY_METRICS[]: array of {number, label, trend?}

hierarchy:
  section > [h2 + dashboard-grid > (primary-card + secondary-card*N)]

required_elements: [PRIMARY_METRIC, at least 4 SECONDARY_METRICS]
optional_elements: [SECTION_HEADING, trends, charts]

responsive_behavior:
  - desktop: dashboard grid with varied card sizes
  - mobile: stacked cards

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-100: Mini Case Studies Grid

```
blueprint_id: bp-mini-case-studies
blueprint_name: Mini Case Studies Grid
category: comparison
article_role: Display multiple brief case studies as a card grid

structural_pattern:
  - section heading (h2) with optional intro
  - grid container (3 columns):
    - each mini card (bordered, padded):
      - client/project name (h4)
      - industry badge (pill)
      - brief result (1-2 sentences)
      - key metric (number + label, highlighted)

slot_definitions:
  - SECTION_HEADING: h2 title
  - CASE_STUDIES[]: array of {name, industry, result, metric_number, metric_label}

hierarchy:
  section > [h2? + grid > card*N]
  card > [h4 + badge + result-text + metric]

required_elements: [at least 3 CASE_STUDIES]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - desktop: 3-column grid
  - tablet: 2-column
  - mobile: single column

image_compatibility: optional logos
sidebar_compatibility: works in main column
```

### BP-101: Standard Checklist

```
blueprint_id: bp-standard-checklist
blueprint_name: Standard Checklist
category: actionable-content
article_role: Present a comprehensive checklist with checkmark icons

structural_pattern:
  - section heading (h2) with optional intro
  - checklist container (bordered, padded):
    - items list:
      - each item: checkmark icon (square/circle) + text
      - items may be grouped by sub-heading

slot_definitions:
  - SECTION_HEADING: h2 title
  - INTRO_TEXT: optional description
  - CHECKLIST_ITEMS[]: array of text items (5-12)

hierarchy:
  section > [h2? + p? + checklist > item*N]
  item > [check-icon + text]

required_elements: [at least 5 CHECKLIST_ITEMS]
optional_elements: [SECTION_HEADING, INTRO_TEXT]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-102: Do/Don't Panel

```
blueprint_id: bp-do-dont-panel
blueprint_name: Do/Don't Panel
category: comparison
article_role: Present do's and don'ts side by side for clear guidance

structural_pattern:
  - section heading (h2)
  - two-column layout:
    - "Do" column (green/positive tint):
      - header with checkmark icon + "Do" label
      - list of positive items with check icons
    - "Don't" column (red/warning tint):
      - header with X icon + "Don't" label
      - list of negative items with X icons

slot_definitions:
  - SECTION_HEADING: h2 title
  - DO_ITEMS[]: array of positive practices
  - DONT_ITEMS[]: array of anti-patterns

hierarchy:
  section > [h2 + grid > (do-col + dont-col)]
  column > [header > (icon + label) + ul > li*N]

required_elements: [at least 3 DO_ITEMS, at least 3 DONT_ITEMS]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - desktop: two-column side by side
  - mobile: stacked (Do's on top)

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-103: Key Takeaways Box

```
blueprint_id: bp-takeaways-box
blueprint_name: Key Takeaways Box
category: summary
article_role: Highlight key takeaways in a prominent bordered box

structural_pattern:
  - bordered card (accent left border, muted background):
    - heading (h4, with icon, "Key Takeaways")
    - bulleted list with custom markers:
      - each item: checkmark/arrow marker + text

slot_definitions:
  - HEADING: box title
  - TAKEAWAYS[]: array of takeaway items (4-6)

hierarchy:
  card > [h4 + ul > li*N]

required_elements: [HEADING, at least 3 TAKEAWAYS]
optional_elements: []

responsive_behavior:
  - consistent across breakpoints

image_compatibility: none
sidebar_compatibility: works in main column or sidebar
```

### BP-104: Numbered Best Practices

```
blueprint_id: bp-numbered-best-practices
blueprint_name: Numbered Best Practices
category: actionable-content
article_role: Present best practices as a numbered list with descriptions

structural_pattern:
  - section heading (h2)
  - ordered list with circular number badges:
    - each item:
      - number badge (CSS counter, accent)
      - best practice title (bold)
      - description paragraph (muted)

slot_definitions:
  - SECTION_HEADING: h2 title
  - PRACTICES[]: array of {title, description} (5-10 items)

hierarchy:
  section > [h2 + ol > li*N]
  li > [number-badge + title + description]

required_elements: [at least 5 PRACTICES with title]
optional_elements: [SECTION_HEADING, descriptions]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-105: Warning Checklist

```
blueprint_id: bp-warning-checklist
blueprint_name: Warning Checklist
category: actionable-content
article_role: Present warning items or red flags with alert styling

structural_pattern:
  - container (warning tint background, bordered):
    - heading with warning icon (⚠) + title
    - list of warning items:
      - each: warning icon (small) + text (bold key phrase + description)

slot_definitions:
  - WARNING_HEADING: title with icon
  - WARNING_ITEMS[]: array of warning text items (4-8)

hierarchy:
  container > [heading > (icon + text) + ul > li*N]
  li > [icon + text]

required_elements: [WARNING_HEADING, at least 3 WARNING_ITEMS]
optional_elements: []

responsive_behavior:
  - consistent across breakpoints

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-106: Quick-Fire Red Flags

```
blueprint_id: bp-red-flags
blueprint_name: Quick-Fire Red Flags
category: actionable-content
article_role: Display a rapid-fire list of red flags or warning signs

structural_pattern:
  - section heading (h2)
  - grid container (2-3 columns):
    - each flag card (compact, red/warning tint):
      - flag icon (🚩 or ⚠)
      - flag text (short, punchy, bold)

slot_definitions:
  - SECTION_HEADING: h2 title
  - FLAGS[]: array of short warning texts (6-12)

hierarchy:
  section > [h2 + grid > flag-card*N]
  flag-card > [icon + text]

required_elements: [at least 6 FLAGS]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - desktop: 3-column grid
  - tablet: 2-column
  - mobile: single column

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-107: Action Items Panel

```
blueprint_id: bp-action-items
blueprint_name: Action Items Panel
category: actionable-content
article_role: Present actionable items with priority or category indicators

structural_pattern:
  - panel container (bordered, padded):
    - panel heading (h4, "Action Items" or "Next Steps")
    - action items list:
      - each item:
        - priority indicator (color dot or tag)
        - action text (bold verb + description)
        - optional assignee or deadline

slot_definitions:
  - PANEL_HEADING: h4 title
  - ACTIONS[]: array of {priority?, text, deadline?}

hierarchy:
  panel > [h4 + action-list > action*N]
  action > [priority? + text + deadline?]

required_elements: [PANEL_HEADING, at least 3 ACTIONS]
optional_elements: [priority indicators, deadlines]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: none
sidebar_compatibility: works in main column or sidebar
```

### BP-108: Tip Cards Grid

```
blueprint_id: bp-tip-cards
blueprint_name: Tip Cards Grid
category: actionable-content
article_role: Display tips or advice as a grid of compact cards

structural_pattern:
  - section heading (h2)
  - grid container (2-3 columns):
    - each tip card (bordered, padded, rounded):
      - tip number or icon
      - tip title (h4, bold)
      - tip description (paragraph)

slot_definitions:
  - SECTION_HEADING: h2 title
  - TIPS[]: array of {number?, icon?, title, description} (4-9 items)

hierarchy:
  section > [h2 + grid > tip-card*N]
  tip-card > [number/icon + h4 + p]

required_elements: [at least 4 TIPS with title + description]
optional_elements: [SECTION_HEADING, numbers, icons]

responsive_behavior:
  - desktop: 3-column grid
  - tablet: 2-column
  - mobile: single column

image_compatibility: icons only
sidebar_compatibility: works in main column
```

### BP-109: Do's Summary Strip

```
blueprint_id: bp-dos-strip
blueprint_name: Do's Summary Strip
category: actionable-content
article_role: Compact horizontal strip of do's displayed as tag pills

structural_pattern:
  - container (muted background, padded):
    - heading (small, "Quick Do's" or similar)
    - horizontal flex wrap of pill tags:
      - each pill: checkmark icon + short text
      - pills wrap to multiple rows

slot_definitions:
  - HEADING: strip title
  - DO_ITEMS[]: array of short text items (6-12)

hierarchy:
  strip > [heading + pill-container > pill*N]
  pill > [check-icon + text]

required_elements: [at least 5 DO_ITEMS]
optional_elements: [HEADING]

responsive_behavior:
  - all breakpoints: pills wrap naturally

image_compatibility: none
sidebar_compatibility: works in main column or sidebar
```

### BP-110: Evaluation Scorecard

```
blueprint_id: bp-evaluation-scorecard
blueprint_name: Evaluation Scorecard
category: data-visualization
article_role: Display evaluation criteria with scores or ratings

structural_pattern:
  - section heading (h2)
  - table or card-based layout:
    - each criterion row:
      - criterion name (left)
      - score/rating (stars, bars, or numbers)
      - optional description
    - overall score at bottom (highlighted)

slot_definitions:
  - SECTION_HEADING: h2 title
  - CRITERIA[]: array of {name, score, max_score?, description?}
  - OVERALL_SCORE: aggregate score

hierarchy:
  section > [h2 + scorecard > criterion*N + overall]
  criterion > [name + score-display + description?]

required_elements: [at least 4 CRITERIA with name + score]
optional_elements: [SECTION_HEADING, descriptions, OVERALL_SCORE]

responsive_behavior:
  - desktop: full table/card layout
  - mobile: stacked or compact view

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-111: Capability Comparison Cards

```
blueprint_id: bp-capability-comparison
blueprint_name: Capability Comparison Cards
category: comparison
article_role: Compare capabilities across providers or options using card columns

structural_pattern:
  - section heading (h2)
  - multi-column grid (3 columns typical):
    - each provider card (bordered, padded):
      - provider name (h4, header)
      - feature list with check/cross indicators:
        - ✓ = supported (accent)
        - ✗ = not supported (muted)
      - optional pricing or summary footer

slot_definitions:
  - SECTION_HEADING: h2 title
  - PROVIDERS[]: array of {name, features: [{feature, supported: bool}]}

hierarchy:
  section > [h2 + grid > provider-card*N]
  provider-card > [h4 + feature-list > feature*N]
  feature > [check/cross-icon + text]

required_elements: [at least 2 PROVIDERS with features]
optional_elements: [SECTION_HEADING, pricing]

responsive_behavior:
  - desktop: multi-column comparison
  - mobile: stacked cards or horizontal scroll

image_compatibility: optional logos
sidebar_compatibility: works in main column
```

### BP-112: Feature Matrix Table

```
blueprint_id: bp-feature-matrix
blueprint_name: Feature Matrix Table
category: data-visualization
article_role: Compare features across options in a matrix table with checkmarks

structural_pattern:
  - section heading (h2)
  - full-width table:
    - thead: "Feature" + option column headers
    - tbody: feature rows
      - feature name (left column)
      - check/cross per option column
    - optional highlight column (recommended option)

slot_definitions:
  - SECTION_HEADING: h2 title
  - OPTIONS[]: column header labels
  - FEATURES[]: array of {name, availability_per_option: [bool]}
  - HIGHLIGHTED_OPTION: optional recommended column index

hierarchy:
  section > [h2 + table > (thead + tbody)]
  thead > tr > (th.feature + th*N)
  tbody > tr*N > (td.feature + td.check*N)

required_elements: [OPTIONS, at least 5 FEATURES]
optional_elements: [SECTION_HEADING, HIGHLIGHTED_OPTION]

responsive_behavior:
  - desktop: full matrix table
  - mobile: horizontal scroll

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-113: Regional Data Cards

```
blueprint_id: bp-regional-data
blueprint_name: Regional Data Cards
category: data-visualization
article_role: Display data broken down by region/area in individual cards

structural_pattern:
  - section heading (h2)
  - grid container (2-3 columns):
    - each region card (bordered, padded):
      - region name (h4, with location pin icon)
      - key metrics (2-3 per region)
      - optional description

slot_definitions:
  - SECTION_HEADING: h2 title
  - REGIONS[]: array of {name, metrics: [{label, value}], description?}

hierarchy:
  section > [h2 + grid > region-card*N]
  region-card > [h4 + metric-list + description?]

required_elements: [at least 3 REGIONS with metrics]
optional_elements: [SECTION_HEADING, descriptions]

responsive_behavior:
  - desktop: 3-column grid
  - mobile: single column

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-114: Type Classification Table

```
blueprint_id: bp-classification-table
blueprint_name: Type Classification Table
category: data-visualization
article_role: Classify and compare different types/categories in a structured table

structural_pattern:
  - section heading (h2) with optional intro
  - full-width table:
    - thead: Type | Description | Key Features | Best For
    - tbody: rows with classification data
    - alternating row backgrounds
    - optional highlight rows

slot_definitions:
  - SECTION_HEADING: h2 title
  - TABLE_HEADERS[]: column labels
  - TABLE_ROWS[][]: rows of classification data

hierarchy:
  section > [h2? + table > (thead + tbody)]

required_elements: [TABLE_HEADERS, at least 3 TABLE_ROWS]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - desktop: full table
  - mobile: horizontal scroll

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-115: Services Table

```
blueprint_id: bp-services-table
blueprint_name: Services Table
category: data-visualization
article_role: Present service offerings in a structured comparison table

structural_pattern:
  - section heading (h2)
  - full-width table:
    - thead: Service | Description | Scope | Pricing Model
    - tbody: service rows
    - optional highlight for popular/recommended

slot_definitions:
  - SECTION_HEADING: h2 title
  - SERVICES[]: array of {name, description, scope, pricing}

hierarchy:
  section > [h2 + table > (thead + tbody > tr*N)]

required_elements: [at least 3 SERVICES]
optional_elements: [SECTION_HEADING, highlight]

responsive_behavior:
  - desktop: full table
  - mobile: horizontal scroll or card view

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-116: Service Type Cards

```
blueprint_id: bp-service-type-cards
blueprint_name: Service Type Cards
category: feature-display
article_role: Display different service types as descriptive cards

structural_pattern:
  - section heading (h2)
  - grid container (3 columns):
    - each card (bordered, padded):
      - type icon or emoji
      - type name (h4)
      - description (paragraph)
      - key features list (3-4 bullets)

slot_definitions:
  - SECTION_HEADING: h2 title
  - TYPES[]: array of {icon?, name, description, features[]}

hierarchy:
  section > [h2 + grid > card*N]
  card > [icon + h4 + p + ul > li*N]

required_elements: [at least 3 TYPES with name + description]
optional_elements: [SECTION_HEADING, icons, features]

responsive_behavior:
  - desktop: 3-column grid
  - mobile: single column

image_compatibility: icons only
sidebar_compatibility: works in main column
```

### BP-117: Payment/Method Comparison Table

```
blueprint_id: bp-payment-comparison
blueprint_name: Payment/Method Comparison Table
category: data-visualization
article_role: Compare payment methods, tools, or approaches in a structured table

structural_pattern:
  - section heading (h2)
  - table with rich cells:
    - thead: Method | Pros | Cons | Best For
    - tbody: rows with text + optional badges
    - alternating rows

slot_definitions:
  - SECTION_HEADING: h2 title
  - METHODS[]: array of {name, pros, cons, best_for}

hierarchy:
  section > [h2 + table > (thead + tbody > tr*N)]

required_elements: [at least 3 METHODS]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - desktop: full table
  - mobile: horizontal scroll

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-118: Use Case Table

```
blueprint_id: bp-use-case-table
blueprint_name: Use Case Table
category: data-visualization
article_role: Present use cases with context, requirements, and outcomes

structural_pattern:
  - section heading (h2)
  - table or card list:
    - each row: Use Case | Industry | Requirements | Expected Outcome
    - alternating backgrounds
    - optional badges for industry

slot_definitions:
  - SECTION_HEADING: h2 title
  - USE_CASES[]: array of {name, industry?, requirements, outcome}

hierarchy:
  section > [h2 + table > (thead + tbody > tr*N)]

required_elements: [at least 3 USE_CASES]
optional_elements: [SECTION_HEADING, industry badges]

responsive_behavior:
  - desktop: full table
  - mobile: horizontal scroll or stacked cards

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-119: Technique/Method Table

```
blueprint_id: bp-technique-table
blueprint_name: Technique/Method Table
category: data-visualization
article_role: Compare different techniques or methodologies in a structured table

structural_pattern:
  - section heading (h2)
  - full-width table:
    - thead: Technique | Description | Advantages | Limitations
    - tbody: technique rows
    - optional highlight cells for key advantages

slot_definitions:
  - SECTION_HEADING: h2 title
  - TECHNIQUES[]: array of {name, description, advantages, limitations}

hierarchy:
  section > [h2 + table > (thead + tbody > tr*N)]

required_elements: [at least 3 TECHNIQUES]
optional_elements: [SECTION_HEADING, highlights]

responsive_behavior:
  - desktop: full table
  - mobile: horizontal scroll

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-120: Setup Steps Table

```
blueprint_id: bp-setup-steps-table
blueprint_name: Setup Steps Table
category: sequential-content
article_role: Present setup/implementation steps in a structured table with details

structural_pattern:
  - section heading (h2)
  - full-width table:
    - thead: Step # | Action | Details | Timeline | Status
    - tbody: step rows with progress indicators
    - optional status badges (complete, in-progress, pending)

slot_definitions:
  - SECTION_HEADING: h2 title
  - STEPS[]: array of {number, action, details, timeline?, status?}

hierarchy:
  section > [h2 + table > (thead + tbody > tr*N)]

required_elements: [at least 4 STEPS with action + details]
optional_elements: [SECTION_HEADING, timeline, status badges]

responsive_behavior:
  - desktop: full table
  - mobile: horizontal scroll or accordion

image_compatibility: none
sidebar_compatibility: works in main column
```
## EXTENDED COMPONENT BLUEPRINTS (BP-121 to BP-170)

### BP-121: Related Articles Grid

```
blueprint_id: bp-related-articles-grid
blueprint_name: Related Articles Grid
category: navigation
article_role: Display related article cards in a grid for content discovery

structural_pattern:
  - section heading (h2, "Related Articles" or similar)
  - grid container (3 columns):
    - each article card (bordered, rounded, shadow):
      - thumbnail image (top, constrained height)
      - category badge (pill, overlaid or below image)
      - article title (h4)
      - excerpt (small paragraph, 2-line clamp)
      - date or reading time (small, muted)

slot_definitions:
  - SECTION_HEADING: h2 title
  - ARTICLES[]: array of {image, category, title, excerpt, date, url}

hierarchy:
  section > [h2 + grid > article-card*N]
  article-card > [img + badge + h4 + excerpt + meta]

required_elements: [at least 3 ARTICLES with title + url]
optional_elements: [SECTION_HEADING, images, excerpts, dates]

responsive_behavior:
  - desktop: 3-column grid
  - tablet: 2-column
  - mobile: single column or horizontal scroll

image_compatibility: thumbnail images per card
sidebar_compatibility: works in main column or as full-width section
```

### BP-122: Author Box

```
blueprint_id: bp-author-box
blueprint_name: Author Box
category: trust
article_role: Display author information for credibility and trust

structural_pattern:
  - card container (bordered, rounded, padded):
    - flex row:
      - author avatar (circular image, left)
      - author info (right):
        - author name (bold, heading font)
        - author title/role (small, muted)
        - author bio (paragraph, 2-3 sentences)
        - social links row (optional icons)

slot_definitions:
  - AVATAR_SRC: author image path
  - AUTHOR_NAME: full name
  - AUTHOR_TITLE: role/expertise
  - AUTHOR_BIO: short biography
  - SOCIAL_LINKS[]: optional array of {platform, url}

hierarchy:
  card > [avatar + info > (name + title + bio + social?)]

required_elements: [AUTHOR_NAME]
optional_elements: [AVATAR_SRC, AUTHOR_TITLE, AUTHOR_BIO, SOCIAL_LINKS]

responsive_behavior:
  - desktop: horizontal flex (avatar left, text right)
  - mobile: stacked (avatar centered above text)

image_compatibility: author avatar image
sidebar_compatibility: works in main column or sidebar
```

### BP-123: Reading Time & Meta Bar

```
blueprint_id: bp-reading-meta-bar
blueprint_name: Reading Time & Meta Bar
category: trust
article_role: Display article metadata including reading time, date, and category

structural_pattern:
  - horizontal bar (flex row, muted background, padded):
    - reading time (clock icon + "X min read")
    - publication date (calendar icon + date)
    - category tag (pill badge)
    - optional share button
    - dividers between items

slot_definitions:
  - READING_TIME: estimated minutes
  - PUBLISH_DATE: date string
  - CATEGORY: category label
  - SHARE_BUTTON: optional share action

hierarchy:
  bar > [reading-time + divider + date + divider + category + share?]

required_elements: [READING_TIME, PUBLISH_DATE]
optional_elements: [CATEGORY, SHARE_BUTTON]

responsive_behavior:
  - desktop: single row
  - mobile: may wrap to two lines

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-124: Breadcrumb Navigation

```
blueprint_id: bp-breadcrumb
blueprint_name: Breadcrumb Navigation
category: navigation
article_role: Display breadcrumb trail for navigation context

structural_pattern:
  - nav container (semantic breadcrumb):
    - ordered list (horizontal flex):
      - each crumb: link text + separator (> or /)
      - last crumb: current page (not linked, bold)

slot_definitions:
  - BREADCRUMBS[]: array of {label, url} (last item has no url)

hierarchy:
  nav > ol > li*N > (a + separator)

required_elements: [at least 2 BREADCRUMBS]
optional_elements: []

responsive_behavior:
  - desktop: full breadcrumb trail
  - mobile: may truncate middle items with ellipsis

image_compatibility: none
sidebar_compatibility: works in main column (typically at top)
```

### BP-125: Article Tags Cloud

```
blueprint_id: bp-tags-cloud
blueprint_name: Article Tags Cloud
category: navigation
article_role: Display article tags as a cloud or pill collection

structural_pattern:
  - container (optional heading):
    - flex wrap row of tag pills:
      - each tag: pill-shaped button with tag text
      - tags are clickable (link to tag page)
      - varying emphasis (some tags larger/bolder based on relevance)

slot_definitions:
  - HEADING: optional section label (e.g., "Tags", "Topics")
  - TAGS[]: array of {label, url?, weight?}

hierarchy:
  container > [heading? + tag-cloud > tag-pill*N]

required_elements: [at least 3 TAGS]
optional_elements: [HEADING, urls, weight]

responsive_behavior:
  - all breakpoints: pills wrap naturally

image_compatibility: none
sidebar_compatibility: excellent — works in sidebar or main column
```

### BP-126: Related Articles Sidebar

```
blueprint_id: bp-related-sidebar
blueprint_name: Related Articles Sidebar
category: navigation
article_role: Compact list of related articles for sidebar placement

structural_pattern:
  - panel container (bordered, padded):
    - panel heading (h4, with accent border)
    - compact article list:
      - each item:
        - optional small thumbnail (left)
        - article title (bold, small)
        - category or date (tiny, muted)

slot_definitions:
  - PANEL_HEADING: h4 title
  - ARTICLES[]: array of {title, url, thumbnail?, category?, date?}

hierarchy:
  panel > [h4 + list > item*N]
  item > [thumbnail? + title + meta]

required_elements: [PANEL_HEADING, at least 3 ARTICLES with title + url]
optional_elements: [thumbnails, categories, dates]

responsive_behavior:
  - designed for sidebar width
  - compact layout at all breakpoints

image_compatibility: small thumbnails
sidebar_compatibility: excellent — designed for sidebar
```

### BP-127: Article Series Navigator

```
blueprint_id: bp-series-navigator
blueprint_name: Article Series Navigator
category: navigation
article_role: Navigate between articles in a series with previous/next links

structural_pattern:
  - container (bordered, padded):
    - series header: "Part X of Y" or series name
    - navigation row:
      - previous article link (← label + title)
      - series overview link (center)
      - next article link (title + label →)

slot_definitions:
  - SERIES_NAME: series title
  - CURRENT_PART: current position (e.g., "3 of 7")
  - PREV_ARTICLE: {title, url}
  - NEXT_ARTICLE: {title, url}
  - OVERVIEW_LINK: optional series index url

hierarchy:
  container > [series-header + nav-row > (prev + overview? + next)]

required_elements: [CURRENT_PART]
optional_elements: [SERIES_NAME, PREV_ARTICLE, NEXT_ARTICLE, OVERVIEW_LINK]

responsive_behavior:
  - desktop: horizontal row with prev/next
  - mobile: stacked (prev on top, next below)

image_compatibility: none
sidebar_compatibility: works in main column (typically at bottom)
```

### BP-128: Author + Share Bar

```
blueprint_id: bp-author-share-bar
blueprint_name: Author + Share Bar
category: trust
article_role: Combined author info and social share buttons in one bar

structural_pattern:
  - horizontal bar (flex row, space-between):
    - author section (left):
      - small avatar (circular)
      - author name (bold)
      - publish date (small, muted)
    - share section (right):
      - share buttons row (social media icons)

slot_definitions:
  - AVATAR_SRC: author image
  - AUTHOR_NAME: name
  - PUBLISH_DATE: date
  - SHARE_PLATFORMS[]: array of {platform, url, icon}

hierarchy:
  bar > [author-section > (avatar + name + date) + share-section > btn*N]

required_elements: [AUTHOR_NAME]
optional_elements: [AVATAR_SRC, PUBLISH_DATE, SHARE_PLATFORMS]

responsive_behavior:
  - desktop: single row
  - mobile: stacked (author above, share below)

image_compatibility: author avatar
sidebar_compatibility: works in main column
```

### BP-129: Article Footer Meta

```
blueprint_id: bp-footer-meta
blueprint_name: Article Footer Meta
category: trust
article_role: Article footer with metadata, tags, sources, and last updated date

structural_pattern:
  - container (top border separator):
    - last updated date
    - tags row (pill tags)
    - sources/references section:
      - numbered list of source links
    - optional disclaimer text

slot_definitions:
  - LAST_UPDATED: date string
  - TAGS[]: array of tag labels
  - SOURCES[]: array of {title, url}
  - DISCLAIMER: optional legal/editorial note

hierarchy:
  footer > [updated-date + tags-row + sources-section + disclaimer?]

required_elements: [LAST_UPDATED]
optional_elements: [TAGS, SOURCES, DISCLAIMER]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: none
sidebar_compatibility: works in main column (full-width)
```

### BP-130: Content Recommendations

```
blueprint_id: bp-content-recommendations
blueprint_name: Content Recommendations
category: navigation
article_role: AI-style content recommendations with personalized labels

structural_pattern:
  - section container:
    - heading (h3, "You May Also Like" or "Recommended")
    - horizontal scroll or grid of recommendation cards:
      - each card:
        - thumbnail image
        - recommendation tag (e.g., "Popular", "New", "Trending")
        - title (h4)
        - brief description

slot_definitions:
  - HEADING: section title
  - RECOMMENDATIONS[]: array of {image?, tag?, title, description, url}

hierarchy:
  section > [h3 + card-container > card*N]
  card > [img? + tag? + h4 + p]

required_elements: [at least 3 RECOMMENDATIONS with title + url]
optional_elements: [HEADING, images, tags, descriptions]

responsive_behavior:
  - desktop: 3-column grid or horizontal scroll
  - mobile: horizontal scroll or stacked

image_compatibility: thumbnail images
sidebar_compatibility: works in main column or full-width
```

### BP-131: Image with Key Takeaway

```
blueprint_id: bp-image-key-takeaway
blueprint_name: Image with Key Takeaway
category: media
article_role: Display an image paired with a key takeaway callout

structural_pattern:
  - two-section layout:
    - image (full-width, rounded)
    - takeaway card (overlapping or below, accent border):
      - icon (lightbulb or key)
      - takeaway heading (bold)
      - takeaway text

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - TAKEAWAY_HEADING: callout title
  - TAKEAWAY_TEXT: key insight text

hierarchy:
  container > [img + takeaway-card > (icon + heading + text)]

required_elements: [IMAGE_SRC, IMAGE_ALT, TAKEAWAY_TEXT]
optional_elements: [TAKEAWAY_HEADING]

responsive_behavior:
  - desktop: takeaway may overlap image edge
  - mobile: stacked, no overlap

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-132: Image with Statistic Overlay

```
blueprint_id: bp-image-stat-overlay
blueprint_name: Image with Statistic Overlay
category: media
article_role: Display an image with a prominent statistic overlaid

structural_pattern:
  - container (rounded, overflow hidden, relative):
    - image (full cover)
    - gradient overlay
    - stat overlay (positioned center or bottom):
      - large stat number (white, heading font)
      - stat label (muted white)
      - optional description

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - STAT_NUMBER: overlaid metric
  - STAT_LABEL: metric label
  - DESCRIPTION: optional context

hierarchy:
  container > [img + gradient + stat-overlay > (number + label + description?)]

required_elements: [IMAGE_SRC, IMAGE_ALT, STAT_NUMBER, STAT_LABEL]
optional_elements: [DESCRIPTION]

responsive_behavior:
  - consistent across breakpoints
  - stat size may reduce on mobile

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-133: Image with Description Card

```
blueprint_id: bp-image-description-card
blueprint_name: Image with Description Card
category: media
article_role: Image with an attached description card below or beside

structural_pattern:
  - card container (rounded, shadow):
    - image section (top, rounded top corners)
    - description section (below, padded):
      - title (h4)
      - description paragraph
      - optional tags or metadata

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - TITLE: h4 heading
  - DESCRIPTION: text paragraph
  - TAGS[]: optional tag labels

hierarchy:
  card > [image-section > img + description-section > (h4 + p + tags?)]

required_elements: [IMAGE_SRC, IMAGE_ALT, TITLE, DESCRIPTION]
optional_elements: [TAGS]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-134: Editorial Image Section

```
blueprint_id: bp-editorial-image
blueprint_name: Editorial Image Section
category: media
article_role: Full-width editorial image with elegant caption treatment

structural_pattern:
  - figure container (full-width):
    - image (full-width, rounded, shadow)
    - figcaption (elegant, centered or left-aligned):
      - caption text (italic, muted)
      - source attribution (small, bold)

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - CAPTION: descriptive caption
  - SOURCE: photo/image credit

hierarchy:
  figure > [img + figcaption > (caption + source?)]

required_elements: [IMAGE_SRC, IMAGE_ALT]
optional_elements: [CAPTION, SOURCE]

responsive_behavior:
  - image scales to container width
  - consistent treatment across breakpoints

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-135: Hero Style Image

```
blueprint_id: bp-hero-style-image
blueprint_name: Hero Style Image
category: media
article_role: Large hero-style image section with centered text overlay

structural_pattern:
  - container (full-width, tall, rounded):
    - image (full cover)
    - dark gradient overlay
    - centered content:
      - category badge (pill)
      - heading (h2, large, white)
      - description (muted white)
      - optional CTA button

slot_definitions:
  - IMAGE_SRC: background image
  - IMAGE_ALT: alt text
  - CATEGORY: badge text
  - HEADING: h2 title
  - DESCRIPTION: subtitle text
  - CTA_BUTTON: optional {label, url}

hierarchy:
  container > [img + gradient + center-content > (badge + h2 + p + button?)]

required_elements: [IMAGE_SRC, IMAGE_ALT, HEADING]
optional_elements: [CATEGORY, DESCRIPTION, CTA_BUTTON]

responsive_behavior:
  - desktop: tall with large text
  - mobile: shorter, smaller text

image_compatibility: this IS the image component
sidebar_compatibility: works in main column (full-width recommended)
```

### BP-136: Background Image Section

```
blueprint_id: bp-background-image-section
blueprint_name: Background Image Section
category: media
article_role: Content section with a background image and overlay

structural_pattern:
  - section container (background image, fixed or scroll):
    - dark overlay
    - content container (centered, max-width):
      - heading (h2, white)
      - paragraphs (muted white)
      - optional CTA or action items

slot_definitions:
  - IMAGE_SRC: background image
  - HEADING: h2 title
  - CONTENT: paragraph text
  - CTA: optional call-to-action

hierarchy:
  section > [bg-image + overlay + content > (h2 + p* + cta?)]

required_elements: [IMAGE_SRC, HEADING, CONTENT]
optional_elements: [CTA]

responsive_behavior:
  - desktop: full background image
  - mobile: may use gradient fallback

image_compatibility: background image
sidebar_compatibility: works as full-width section
```

### BP-137: Framed Image Layout

```
blueprint_id: bp-framed-image
blueprint_name: Framed Image Layout
category: media
article_role: Display an image with a decorative frame or border treatment

structural_pattern:
  - outer frame (padding creates decorative border effect):
    - muted background or shadow frame
    - inner image (rounded, shadow):
      - image (object-fit cover)
    - optional caption below frame

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - CAPTION: optional caption text

hierarchy:
  frame > [inner > img + caption?]

required_elements: [IMAGE_SRC, IMAGE_ALT]
optional_elements: [CAPTION]

responsive_behavior:
  - consistent across breakpoints
  - frame proportions maintained

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-138: Image + Bullet Points

```
blueprint_id: bp-image-bullets
blueprint_name: Image + Bullet Points
category: media
article_role: Image alongside a bullet list of key points

structural_pattern:
  - two-column layout:
    - image column (~45%): rounded image
    - content column (~55%):
      - heading (h3)
      - bullet list with check/arrow icons
      - each item: icon + text

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - HEADING: h3 title
  - BULLET_POINTS[]: array of text items (4-6)

hierarchy:
  grid > [image-col > img + content-col > (h3 + ul > li*N)]

required_elements: [IMAGE_SRC, IMAGE_ALT, at least 3 BULLET_POINTS]
optional_elements: [HEADING]

responsive_behavior:
  - desktop: two-column
  - mobile: stacked (image on top)

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-139: Image + Process Explanation

```
blueprint_id: bp-image-process
blueprint_name: Image + Process Explanation
category: media
article_role: Image with a process explanation including numbered steps

structural_pattern:
  - two-column layout:
    - image column: contextual image
    - process column:
      - heading (h3)
      - numbered steps (3-4):
        - step number badge
        - step title (bold)
        - step description

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - HEADING: h3 title
  - STEPS[]: array of {title, description} (3-4 items)

hierarchy:
  grid > [image-col > img + process-col > (h3 + steps > step*N)]
  step > [badge + title + description]

required_elements: [IMAGE_SRC, IMAGE_ALT, at least 3 STEPS]
optional_elements: [HEADING]

responsive_behavior:
  - desktop: two-column
  - mobile: stacked

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-140: Image + Callout Block

```
blueprint_id: bp-image-callout
blueprint_name: Image + Callout Block
category: media
article_role: Image paired with a prominent callout or insight box

structural_pattern:
  - two-section layout:
    - image (full-width or column, rounded)
    - callout block (accent border, tinted background):
      - callout icon
      - callout heading (h4)
      - callout text (paragraph)

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - CALLOUT_ICON: icon or emoji
  - CALLOUT_HEADING: h4 title
  - CALLOUT_TEXT: insight text

hierarchy:
  container > [img + callout > (icon + h4 + p)]

required_elements: [IMAGE_SRC, IMAGE_ALT, CALLOUT_TEXT]
optional_elements: [CALLOUT_ICON, CALLOUT_HEADING]

responsive_behavior:
  - desktop: image and callout side by side or stacked
  - mobile: stacked

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-141: Stats Dashboard Row

```
blueprint_id: bp-stats-dashboard
blueprint_name: Stats Dashboard Row
category: data-visualization
article_role: Dashboard-style row of stat cards with labels and descriptions

structural_pattern:
  - grid container (4 columns):
    - each stat card (bordered, padded):
      - stat icon or category label (small, muted)
      - stat number (large, heading font, accent)
      - stat description (small, muted)

slot_definitions:
  - STATS[]: array of {icon?, label, number, description?} (4 items)

hierarchy:
  grid > stat-card*4
  stat-card > [icon? + number + label + description?]

required_elements: [4 STATS with number + label]
optional_elements: [icons, descriptions]

responsive_behavior:
  - desktop: 4-column row
  - tablet: 2-column
  - mobile: 2-column or stacked

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-142: Service Comparison Table

```
blueprint_id: bp-service-comparison
blueprint_name: Service Comparison Table
category: data-visualization
article_role: Compare services across multiple criteria in a feature comparison table

structural_pattern:
  - section heading (h2)
  - full-width table:
    - thead: Criteria + service name columns
    - tbody: criteria rows with values per service
    - optional "recommended" column highlight
    - alternating row backgrounds

slot_definitions:
  - SECTION_HEADING: h2 title
  - SERVICE_NAMES[]: column headers
  - CRITERIA[]: array of {name, values_per_service[]}
  - RECOMMENDED: optional highlighted column

hierarchy:
  section > [h2 + table > (thead + tbody)]

required_elements: [SERVICE_NAMES, at least 5 CRITERIA]
optional_elements: [SECTION_HEADING, RECOMMENDED]

responsive_behavior:
  - desktop: full table
  - mobile: horizontal scroll

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-143: 4-Step Process Guide

```
blueprint_id: bp-four-step-guide
blueprint_name: 4-Step Process Guide
category: sequential-content
article_role: Guided process with exactly four clear steps

structural_pattern:
  - section heading (h2)
  - four-column grid or horizontal flow:
    - each step card (bordered, numbered):
      - large step number (accent)
      - step title (h4, bold)
      - step description (paragraph)
      - optional icon

slot_definitions:
  - SECTION_HEADING: h2 title
  - STEPS[]: exactly 4 {number, title, description, icon?}

hierarchy:
  section > [h2 + grid > step-card*4]
  step-card > [number + h4 + p + icon?]

required_elements: [4 STEPS with title + description]
optional_elements: [SECTION_HEADING, icons]

responsive_behavior:
  - desktop: 4-column horizontal
  - tablet: 2-column
  - mobile: single column stack

image_compatibility: icons only
sidebar_compatibility: works in main column
```

### BP-144: FAQ Accordion Section

```
blueprint_id: bp-faq-accordion-section
blueprint_name: FAQ Accordion Section
category: interactive
article_role: Full FAQ section with heading, intro, and accordion items

structural_pattern:
  - section container:
    - section heading (h2)
    - intro paragraph
    - accordion container (bordered):
      - FAQ items (expandable)

slot_definitions:
  - SECTION_HEADING: h2 title
  - INTRO_TEXT: introductory paragraph
  - FAQ_ITEMS[]: array of {question, answer}

hierarchy:
  section > [h2 + p + accordion > faq-item*N]

required_elements: [SECTION_HEADING, at least 3 FAQ_ITEMS]
optional_elements: [INTRO_TEXT]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-145: Checklist Block (Variant 2)

```
blueprint_id: bp-checklist-v2
blueprint_name: Checklist Block (Variant 2)
category: actionable-content
article_role: Interactive checklist with toggleable checkboxes

structural_pattern:
  - card container (bordered, padded):
    - heading (h4, "Checklist")
    - checklist items:
      - each: checkbox input + label text
      - checked items get strikethrough styling

slot_definitions:
  - HEADING: checklist title
  - ITEMS[]: array of text items (5-10)

hierarchy:
  card > [h4 + list > item*N]
  item > [checkbox + label]

required_elements: [HEADING, at least 5 ITEMS]
optional_elements: []

responsive_behavior:
  - consistent across breakpoints

interaction_pattern:
  - click checkbox to toggle completion
  - visual strikethrough on completed items

image_compatibility: none
sidebar_compatibility: works in main column or sidebar
```

### BP-146: Horizontal Bar Chart

```
blueprint_id: bp-horizontal-bar-chart
blueprint_name: Horizontal Bar Chart
category: data-visualization
article_role: Display data as horizontal bars for easy comparison

structural_pattern:
  - section heading (h2)
  - chart container:
    - each bar row:
      - label (left)
      - bar track (full-width background):
        - filled bar (width proportional to value, colored)
      - value label (right of bar or inside)

slot_definitions:
  - SECTION_HEADING: h2 title
  - BARS[]: array of {label, value, max_value?} (4-8 items)

hierarchy:
  section > [h2 + chart > bar-row*N]
  bar-row > [label + track > fill + value]

required_elements: [at least 3 BARS with label + value]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - consistent across breakpoints (bars scale naturally)

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-147: Resource Links Card

```
blueprint_id: bp-resource-links
blueprint_name: Resource Links Card
category: navigation
article_role: Display a curated list of resource links in a styled card

structural_pattern:
  - card container (bordered, padded):
    - heading (h4, "Resources" or "Further Reading")
    - links list:
      - each item:
        - link icon (external link, document, etc.)
        - link title (bold, clickable)
        - link description (small, muted)
        - optional domain/source label

slot_definitions:
  - HEADING: card title
  - RESOURCES[]: array of {title, url, description?, source?}

hierarchy:
  card > [h4 + link-list > link-item*N]
  link-item > [icon + title + description? + source?]

required_elements: [HEADING, at least 3 RESOURCES with title + url]
optional_elements: [descriptions, source labels]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: none
sidebar_compatibility: excellent — designed for sidebar or main column
```

### BP-148: KPI Metrics Grid

```
blueprint_id: bp-kpi-grid
blueprint_name: KPI Metrics Grid
category: data-visualization
article_role: Display KPI metrics with trend indicators in a grid layout

structural_pattern:
  - section heading (h2)
  - grid container (2-3 columns):
    - each KPI card (bordered, padded):
      - KPI label (small, uppercase, muted)
      - KPI value (large, bold)
      - trend line or indicator (small chart or arrow)
      - change value (green up / red down)

slot_definitions:
  - SECTION_HEADING: h2 title
  - KPIS[]: array of {label, value, trend_direction, change_value}

hierarchy:
  section > [h2 + grid > kpi-card*N]
  kpi-card > [label + value + trend + change]

required_elements: [at least 4 KPIS with label + value]
optional_elements: [SECTION_HEADING, trends]

responsive_behavior:
  - desktop: 3-column grid
  - tablet: 2-column
  - mobile: 2-column

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-149: Feature Matrix Table

```
blueprint_id: bp-feature-matrix-v2
blueprint_name: Feature Matrix Table
category: data-visualization
article_role: Detailed feature comparison matrix with rich cell content

structural_pattern:
  - section heading (h2)
  - table (full-width, bordered):
    - thead: Feature | columns for each option/tier
    - tbody: feature rows with descriptive cells
    - optional tier headers with pricing
    - highlight column for recommended tier

slot_definitions:
  - SECTION_HEADING: h2 title
  - TIER_HEADERS[]: column headers with optional pricing
  - FEATURES[]: array of {name, values_per_tier[]}

hierarchy:
  section > [h2 + table > (thead + tbody)]

required_elements: [TIER_HEADERS, at least 5 FEATURES]
optional_elements: [SECTION_HEADING, pricing, highlight]

responsive_behavior:
  - desktop: full matrix
  - mobile: horizontal scroll

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-150: Vertical Timeline (Variant 3)

```
blueprint_id: bp-vertical-timeline-v3
blueprint_name: Vertical Timeline (Variant 3)
category: chronological-content
article_role: Clean vertical timeline with cards and connecting line

structural_pattern:
  - section heading (h2)
  - vertical timeline:
    - center connector line (gradient)
    - each event card (alternating sides or single-sided):
      - connector dot (on line)
      - card (bordered, padded):
        - date badge (small, accent)
        - title (h4)
        - description (paragraph)

slot_definitions:
  - SECTION_HEADING: h2 title
  - EVENTS[]: array of {date, title, description}

hierarchy:
  section > [h2 + timeline > event*N]
  event > [dot + card > (date + h4 + p)]

required_elements: [at least 3 EVENTS]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - desktop: alternating or single-sided cards
  - mobile: all cards on one side

image_compatibility: optional images in cards
sidebar_compatibility: works in main column
```

### BP-151: Highlighted Quote Box

```
blueprint_id: bp-highlighted-quote
blueprint_name: Highlighted Quote Box
category: editorial
article_role: Display a quote in a highlighted/bordered box with decorative treatment

structural_pattern:
  - card (accent left border, muted background, padded):
    - large decorative quote mark
    - quote text (italic, larger font)
    - attribution (author name, bold + role, muted)
    - optional accent bar separator

slot_definitions:
  - QUOTE_TEXT: the quoted text
  - AUTHOR_NAME: attribution name
  - AUTHOR_ROLE: title/organization

hierarchy:
  card > [quote-mark + text + separator? + attribution]

required_elements: [QUOTE_TEXT]
optional_elements: [AUTHOR_NAME, AUTHOR_ROLE]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-152: Expandable FAQ List

```
blueprint_id: bp-expandable-faq
blueprint_name: Expandable FAQ List
category: interactive
article_role: Clean expandable FAQ list without card borders

structural_pattern:
  - section heading (h2)
  - list of FAQ items (divider lines between):
    - each item:
      - question row (clickable): question text + toggle icon
      - answer (collapsible, indented, muted)

slot_definitions:
  - SECTION_HEADING: h2 title
  - FAQ_ITEMS[]: array of {question, answer}

hierarchy:
  section > [h2 + faq-list > faq-item*N]
  faq-item > [question-row + answer-panel]

required_elements: [at least 3 FAQ_ITEMS]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - consistent across breakpoints

interaction_pattern:
  - click to expand/collapse answer

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-153: Key Takeaway Summary

```
blueprint_id: bp-takeaway-summary
blueprint_name: Key Takeaway Summary
category: summary
article_role: Compact summary of key takeaways with emphasis styling

structural_pattern:
  - bordered card (accent top border):
    - heading with icon (📌 or 💡, "Key Takeaway")
    - summary text (1-2 sentences, slightly larger font)
    - optional supporting bullet points

slot_definitions:
  - HEADING: section title
  - SUMMARY_TEXT: main takeaway text
  - SUPPORTING_POINTS[]: optional bullet items

hierarchy:
  card > [heading + summary + bullets?]

required_elements: [HEADING, SUMMARY_TEXT]
optional_elements: [SUPPORTING_POINTS]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: none
sidebar_compatibility: works in main column or sidebar
```

### BP-154: Progress Indicator Bars

```
blueprint_id: bp-progress-indicators
blueprint_name: Progress Indicator Bars
category: data-visualization
article_role: Display progress metrics with labeled bars and percentage fills

structural_pattern:
  - section heading (h2)
  - list of progress items:
    - each item:
      - metric label (bold)
      - progress bar:
        - track (full-width, muted bg)
        - fill (width = percentage, gradient or accent)
        - percentage label (at end of fill)

slot_definitions:
  - SECTION_HEADING: h2 title
  - PROGRESS_ITEMS[]: array of {label, percentage} (3-6 items)

hierarchy:
  section > [h2 + list > item*N]
  item > [label + bar > (track > fill + percentage)]

required_elements: [at least 3 PROGRESS_ITEMS]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-155: Pricing Tier Comparison

```
blueprint_id: bp-pricing-tiers
blueprint_name: Pricing Tier Comparison
category: comparison
article_role: Compare pricing tiers or plans side by side

structural_pattern:
  - section heading (h2)
  - grid container (3 columns typical):
    - each tier card (bordered, padded):
      - tier name (h4)
      - price (large, bold, heading font)
      - price period (small, muted)
      - feature list (check icons + text)
      - CTA button
    - optional "popular" or "recommended" badge on one tier

slot_definitions:
  - SECTION_HEADING: h2 title
  - TIERS[]: array of {name, price, period, features[], cta_label, highlighted?}

hierarchy:
  section > [h2 + grid > tier-card*N]
  tier-card > [h4 + price + features > item*N + button]

required_elements: [at least 2 TIERS with name + price + features]
optional_elements: [SECTION_HEADING, highlighted tier]

responsive_behavior:
  - desktop: 3-column grid
  - mobile: stacked or horizontal scroll

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-156: Numbered Guide Steps

```
blueprint_id: bp-numbered-guide
blueprint_name: Numbered Guide Steps
category: sequential-content
article_role: Step-by-step guide with large numbers and detailed descriptions

structural_pattern:
  - section heading (h2)
  - numbered steps list:
    - each step:
      - large step number (oversized, accent, heading font)
      - step title (h3, bold)
      - step description (paragraph, may be multi-paragraph)
      - optional tip or note callout within step

slot_definitions:
  - SECTION_HEADING: h2 title
  - STEPS[]: array of {number, title, description, tip?}

hierarchy:
  section > [h2 + steps > step*N]
  step > [number + h3 + p + callout?]

required_elements: [at least 3 STEPS with title + description]
optional_elements: [SECTION_HEADING, tips per step]

responsive_behavior:
  - consistent across breakpoints
  - number size reduces on mobile

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-157: Decorative Blockquote

```
blueprint_id: bp-decorative-blockquote
blueprint_name: Decorative Blockquote
category: editorial
article_role: Stylized blockquote with full decorative treatment

structural_pattern:
  - blockquote (full-width, accent background):
    - large decorative quote mark (oversized, translucent)
    - quote text (white/light, italic, large)
    - horizontal rule
    - attribution (author name, role)

slot_definitions:
  - QUOTE_TEXT: the quoted text
  - AUTHOR_NAME: attribution
  - AUTHOR_ROLE: title/org

hierarchy:
  blockquote > [quote-mark + text + rule + attribution]

required_elements: [QUOTE_TEXT]
optional_elements: [AUTHOR_NAME, AUTHOR_ROLE]

responsive_behavior:
  - desktop: generous padding, large text
  - mobile: reduced padding and text size

image_compatibility: none
sidebar_compatibility: works in main column (full-width)
```

### BP-158: Two-Column FAQ

```
blueprint_id: bp-two-col-faq
blueprint_name: Two-Column FAQ
category: interactive
article_role: FAQ split into two columns for space efficiency

structural_pattern:
  - section heading (h2)
  - two-column grid:
    - left column: accordion FAQ items (first half)
    - right column: accordion FAQ items (second half)

slot_definitions:
  - SECTION_HEADING: h2 title
  - FAQ_ITEMS[]: array split evenly across columns

hierarchy:
  section > [h2 + grid > (left-col > accordion + right-col > accordion)]

required_elements: [at least 6 FAQ_ITEMS]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - desktop: two-column
  - mobile: single column (all items stacked)

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-159: Image + Text Side-by-Side

```
blueprint_id: bp-image-text-side
blueprint_name: Image + Text Side-by-Side
category: media
article_role: Clean image and text layout in two equal columns

structural_pattern:
  - two-column grid (50/50):
    - image column: rounded image (full height)
    - text column (vertically centered):
      - heading (h3)
      - paragraphs
      - optional bullet list or CTA

slot_definitions:
  - IMAGE_SRC: image path
  - IMAGE_ALT: alt text
  - HEADING: h3 title
  - TEXT_CONTENT: paragraph(s)
  - CTA: optional action link/button

hierarchy:
  grid > [image-col > img + text-col > (h3 + p + cta?)]

required_elements: [IMAGE_SRC, IMAGE_ALT, HEADING, TEXT_CONTENT]
optional_elements: [CTA]

responsive_behavior:
  - desktop: two-column side by side
  - mobile: stacked (image on top)

image_compatibility: this IS the image component
sidebar_compatibility: works in main column
```

### BP-160: Percentage Donut Charts

```
blueprint_id: bp-donut-charts
blueprint_name: Percentage Donut Charts
category: data-visualization
article_role: Display multiple metrics as donut/ring charts in a grid

structural_pattern:
  - section heading (h2)
  - grid container (3-4 columns):
    - each chart (centered):
      - SVG donut ring:
        - background ring (muted)
        - progress ring (stroke-dasharray, accent)
        - percentage text (center)
      - label below (small, muted)

slot_definitions:
  - SECTION_HEADING: h2 title
  - CHARTS[]: array of {percentage, label} (3-4 items)

hierarchy:
  section > [h2 + grid > chart*N]
  chart > [svg > (bg-ring + progress-ring + text) + label]

required_elements: [at least 3 CHARTS with percentage + label]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - desktop: horizontal row
  - mobile: 2-column grid

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-161: FAQ with Category Icons

```
blueprint_id: bp-faq-category-icons
blueprint_name: FAQ with Category Icons
category: interactive
article_role: FAQ items with category icons for visual categorization

structural_pattern:
  - section heading (h2)
  - FAQ list:
    - each item:
      - category icon (left, themed)
      - question (bold, clickable)
      - answer (collapsible, muted)
      - category tag (small pill)

slot_definitions:
  - SECTION_HEADING: h2 title
  - FAQ_ITEMS[]: array of {icon, category, question, answer}

hierarchy:
  section > [h2 + faq-list > item*N]
  item > [icon + content > (question + answer) + category-tag]

required_elements: [at least 3 FAQ_ITEMS with question + answer]
optional_elements: [SECTION_HEADING, icons, categories]

responsive_behavior:
  - consistent across breakpoints

image_compatibility: icons only
sidebar_compatibility: works in main column
```

### BP-162: Summary Highlights Box

```
blueprint_id: bp-summary-highlights
blueprint_name: Summary Highlights Box
category: summary
article_role: Compact summary box with highlighted key findings

structural_pattern:
  - bordered card (accent top border):
    - heading (h4, "Summary" or "Key Findings")
    - highlighted items list:
      - each: bullet marker (accent) + bold key phrase + description

slot_definitions:
  - HEADING: box title
  - HIGHLIGHTS[]: array of {key_phrase, description} (3-6 items)

hierarchy:
  card > [h4 + list > item*N]
  item > [marker + bold-phrase + description]

required_elements: [HEADING, at least 3 HIGHLIGHTS]
optional_elements: []

responsive_behavior:
  - consistent across breakpoints

image_compatibility: none
sidebar_compatibility: works in main column or sidebar
```

### BP-163: Comparison Data Bars

```
blueprint_id: bp-comparison-data-bars
blueprint_name: Comparison Data Bars
category: data-visualization
article_role: Compare two data sets using opposing horizontal bars

structural_pattern:
  - section heading (h2)
  - comparison rows:
    - each row:
      - left bar (extends left from center, one color)
      - center label (metric name)
      - right bar (extends right from center, different color)
      - value labels at bar ends

slot_definitions:
  - SECTION_HEADING: h2 title
  - LEFT_LABEL: data set A name
  - RIGHT_LABEL: data set B name
  - ROWS[]: array of {metric, left_value, right_value}

hierarchy:
  section > [h2 + legend + rows > row*N]
  row > [left-bar + center-label + right-bar]

required_elements: [LEFT_LABEL, RIGHT_LABEL, at least 3 ROWS]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - desktop: full opposing bars
  - mobile: simplified or stacked

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-164: Milestone Timeline

```
blueprint_id: bp-milestone-timeline
blueprint_name: Milestone Timeline
category: chronological-content
article_role: Display key milestones with dates along a timeline

structural_pattern:
  - section heading (h2)
  - horizontal or vertical timeline:
    - each milestone:
      - date marker (prominent)
      - milestone title
      - brief description
      - achievement icon or badge

slot_definitions:
  - SECTION_HEADING: h2 title
  - MILESTONES[]: array of {date, title, description, badge?}

hierarchy:
  section > [h2 + timeline > milestone*N]
  milestone > [date + title + description + badge?]

required_elements: [at least 3 MILESTONES with date + title]
optional_elements: [SECTION_HEADING, descriptions, badges]

responsive_behavior:
  - desktop: horizontal timeline with markers
  - mobile: vertical list

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-165: Tabbed FAQ (Variant 2)

```
blueprint_id: bp-tabbed-faq-v2
blueprint_name: Tabbed FAQ (Variant 2)
category: interactive
article_role: FAQ organized by tabs with pill-style tab buttons

structural_pattern:
  - section heading (h2)
  - tab navigation (pill-style buttons, horizontal):
    - each tab: category label (pill button)
  - tab content panels:
    - each panel: list of Q&A pairs (expandable or inline)

slot_definitions:
  - SECTION_HEADING: h2 title
  - TABS[]: array of {label, qa_items: [{question, answer}]}

hierarchy:
  section > [h2 + tab-nav > tab*N + panels > panel*N]

required_elements: [at least 2 TABS with Q&A items]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - desktop: horizontal tab pills
  - mobile: scrollable tabs or dropdown

interaction_pattern:
  - click tab to switch category
  - active tab visually highlighted

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-166: Stacked Area Chart

```
blueprint_id: bp-stacked-area-chart
blueprint_name: Stacked Area Chart
category: data-visualization
article_role: Display trends over time using a stacked area chart (SVG)

structural_pattern:
  - section heading (h2)
  - SVG chart container:
    - axes (x: time periods, y: values)
    - stacked area paths (each layer a different shade)
    - legend (color swatches + labels)
  - optional description below

slot_definitions:
  - SECTION_HEADING: h2 title
  - X_LABELS[]: time period labels
  - DATA_SERIES[]: array of {name, values[], color_category}
  - LEGEND: auto-generated from data series

hierarchy:
  section > [h2 + chart > (svg > (axes + areas*N) + legend)]

required_elements: [X_LABELS, at least 2 DATA_SERIES]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - chart scales with container width
  - mobile: may simplify labels

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-167: Icon Stat Row

```
blueprint_id: bp-icon-stat-row
blueprint_name: Icon Stat Row
category: data-visualization
article_role: Display stats with prominent icons in a horizontal row

structural_pattern:
  - horizontal flex row (3-4 items):
    - each item (centered):
      - icon (large, accent background circle)
      - stat number (bold, heading font)
      - stat label (small, muted)

slot_definitions:
  - STATS[]: array of {icon, number, label} (3-4 items)

hierarchy:
  row > stat*N
  stat > [icon-circle + number + label]

required_elements: [at least 3 STATS with icon + number + label]
optional_elements: []

responsive_behavior:
  - desktop: horizontal row
  - mobile: 2-column grid

image_compatibility: icons (SVG or emoji)
sidebar_compatibility: works in main column
```

### BP-168: Pie Chart SVG

```
blueprint_id: bp-pie-chart
blueprint_name: Pie Chart SVG
category: data-visualization
article_role: Display data distribution as an SVG pie chart with legend

structural_pattern:
  - section heading (h2)
  - two-column layout:
    - chart column: SVG pie chart with segments
    - legend column:
      - each item: color dot + label + percentage

slot_definitions:
  - SECTION_HEADING: h2 title
  - SEGMENTS[]: array of {label, percentage, color_category}

hierarchy:
  section > [h2 + layout > (chart-col > svg + legend-col > item*N)]

required_elements: [at least 3 SEGMENTS]
optional_elements: [SECTION_HEADING]

responsive_behavior:
  - desktop: chart left, legend right
  - mobile: stacked (chart above legend)

image_compatibility: none
sidebar_compatibility: works in main column
```

### BP-169: Countdown Metrics

```
blueprint_id: bp-countdown-metrics
blueprint_name: Countdown Metrics
category: data-visualization
article_role: Display metrics in a countdown/timer-style format

structural_pattern:
  - horizontal flex row:
    - each metric box (dark background, centered):
      - large number (monospace or heading font, accent)
      - unit label (small, uppercase)
    - colon or divider between boxes

slot_definitions:
  - METRICS[]: array of {value, unit} (3-5 items)

hierarchy:
  row > (box + divider)*N
  box > [value + unit]

required_elements: [at least 3 METRICS]
optional_elements: []

responsive_behavior:
  - desktop: horizontal row
  - mobile: smaller boxes, still horizontal

image_compatibility: none
sidebar_compatibility: works in main column or sidebar
```

### BP-170: Card-Based Steps

```
blueprint_id: bp-card-steps
blueprint_name: Card-Based Steps
category: sequential-content
article_role: Display process steps as distinct cards in a grid layout

structural_pattern:
  - section heading (h2)
  - grid container (3 columns):
    - each step card (bordered, padded, shadow):
      - step number (top-left corner badge)
      - step icon (centered, large)
      - step title (h4, centered)
      - step description (paragraph, centered)
      - optional arrow/connector to next card

slot_definitions:
  - SECTION_HEADING: h2 title
  - STEPS[]: array of {number, icon?, title, description} (3-6 items)

hierarchy:
  section > [h2 + grid > step-card*N]
  step-card > [badge + icon? + h4 + p]

required_elements: [at least 3 STEPS with title + description]
optional_elements: [SECTION_HEADING, icons, connectors]

responsive_behavior:
  - desktop: 3-column grid
  - tablet: 2-column
  - mobile: single column

image_compatibility: icons only
sidebar_compatibility: works in main column
```

---

### BP-171: Overlapping Image Cards

```
blueprint_id: bp-overlapping-image-cards
blueprint_name: Overlapping Image Cards
category: visual-content
article_role: Display overlapping image cards with text overlays for visual storytelling

structural_pattern:
  - section container
  - overlapping card stack (2-3 cards):
    - each card (positioned with offset/overlap):
      - background image (cover)
      - gradient overlay (bottom)
      - card content overlay:
        - label/tag (small, uppercase)
        - title (h3/h4)
        - short description (paragraph)

slot_definitions:
  - CARDS[]: array of {image_url, label?, title, description?} (2-3 items)

hierarchy:
  section > card-stack > card*N
  card > [image + gradient-overlay + content > (label? + h3 + p?)]

required_elements: [at least 2 CARDS with image and title]
optional_elements: [labels, descriptions, gradient overlays]

responsive_behavior:
  - desktop: overlapping layout with offset positioning
  - tablet: reduced overlap
  - mobile: stacked vertically, no overlap

image_compatibility: requires images
sidebar_compatibility: works in main column
```

---

### BP-172: Line Chart SVG

```
blueprint_id: bp-line-chart-svg
blueprint_name: Line Chart SVG
category: data-visualization
article_role: Display trend data as an SVG line chart with labeled axes

structural_pattern:
  - section heading (h2)
  - chart container (bordered, padded):
    - SVG element:
      - x-axis with labels
      - y-axis with labels
      - grid lines (horizontal)
      - line path (data series)
      - data point markers (circles)
      - optional tooltip markers
    - optional legend below chart

slot_definitions:
  - SECTION_HEADING: h2 title
  - CHART_DATA: {x_labels[], y_labels[], data_points[]}
  - LEGEND?: array of {color, label}

hierarchy:
  section > [h2 + chart-container > svg + legend?]
  svg > [axes + gridlines + path + markers]

required_elements: [SVG with at least one data series, axis labels]
optional_elements: [SECTION_HEADING, legend, tooltips, grid lines]

responsive_behavior:
  - desktop: full-width chart
  - tablet: scaled proportionally
  - mobile: horizontal scroll or simplified view

image_compatibility: none (SVG-based)
sidebar_compatibility: works in main column
```

---

### BP-173: Regulatory Requirements Table

```
blueprint_id: bp-regulatory-requirements-table
blueprint_name: Regulatory Requirements Table
category: tabular-data
article_role: Present regulatory or compliance requirements in a structured table format

structural_pattern:
  - section heading (h2)
  - descriptive paragraph
  - table container (bordered, striped rows):
    - table header row (dark background):
      - columns: Requirement, Description, Status/Compliance, Deadline
    - table body rows:
      - requirement name (bold)
      - description text
      - status indicator (badge/icon)
      - deadline or date

slot_definitions:
  - SECTION_HEADING: h2 title
  - DESCRIPTION?: introductory paragraph
  - TABLE_HEADERS[]: column header labels
  - TABLE_ROWS[]: array of {requirement, description, status, deadline?}

hierarchy:
  section > [h2 + p? + table-container > table > thead + tbody]
  tbody > tr*N > td*columns

required_elements: [table with headers and at least 3 data rows]
optional_elements: [SECTION_HEADING, DESCRIPTION, status badges]

responsive_behavior:
  - desktop: full table layout
  - tablet: horizontal scroll
  - mobile: horizontal scroll or card-based layout

image_compatibility: status icons only
sidebar_compatibility: works in main column
```

---

### BP-174: Integration Pipeline

```
blueprint_id: bp-integration-pipeline
blueprint_name: Integration Pipeline
category: process-flow
article_role: Visualize a multi-stage integration or data pipeline with connected nodes

structural_pattern:
  - section heading (h2)
  - pipeline container (horizontal flow):
    - pipeline stages (3-5 nodes):
      - each stage node (bordered, padded):
        - stage icon or number
        - stage title (h4)
        - stage description (short)
      - connector arrow between stages
    - optional data flow labels on connectors

slot_definitions:
  - SECTION_HEADING: h2 title
  - STAGES[]: array of {icon?, number?, title, description} (3-5 items)
  - CONNECTOR_LABELS?[]: labels for arrows between stages

hierarchy:
  section > [h2 + pipeline > (stage-node + connector)*N]
  stage-node > [icon/number + h4 + p]

required_elements: [at least 3 STAGES with titles, connectors between them]
optional_elements: [SECTION_HEADING, icons, connector labels, descriptions]

responsive_behavior:
  - desktop: horizontal pipeline with arrows
  - tablet: horizontal with reduced spacing
  - mobile: vertical pipeline with downward arrows

image_compatibility: icons only
sidebar_compatibility: works in main column
```

---

### BP-175: Stat Quote Hybrid

```
blueprint_id: bp-stat-quote-hybrid
blueprint_name: Stat Quote Hybrid
category: emphasis-content
article_role: Combine a large statistic with a supporting quote for maximum impact

structural_pattern:
  - section container (accent background or bordered):
    - two-column layout:
      - left column (stat side):
        - large number/percentage (oversized font)
        - stat label (small text below)
      - right column (quote side):
        - blockquote text (large, italic)
        - attribution (name, title, company)

slot_definitions:
  - STAT_VALUE: large number or percentage
  - STAT_LABEL: description of what the stat measures
  - QUOTE_TEXT: supporting quote text
  - ATTRIBUTION: {name, title?, company?}

hierarchy:
  section > two-col > [stat-col > (number + label)] + [quote-col > (blockquote + attribution)]

required_elements: [STAT_VALUE, STAT_LABEL, QUOTE_TEXT]
optional_elements: [ATTRIBUTION, accent background]

responsive_behavior:
  - desktop: two-column side by side
  - tablet: two-column with reduced widths
  - mobile: stacked (stat on top, quote below)

image_compatibility: none
sidebar_compatibility: works in main column
```

---

### BP-176: Benefit Highlights Grid

```
blueprint_id: bp-benefit-highlights-grid
blueprint_name: Benefit Highlights Grid
category: feature-showcase
article_role: Display key benefits or features in an icon-driven grid layout

structural_pattern:
  - section heading (h2)
  - optional subheading paragraph
  - grid container (3-column):
    - each benefit card (padded, optional border):
      - icon (top, centered or left-aligned)
      - benefit title (h4)
      - benefit description (paragraph)

slot_definitions:
  - SECTION_HEADING: h2 title
  - SUBHEADING?: introductory paragraph
  - BENEFITS[]: array of {icon, title, description} (3-9 items)

hierarchy:
  section > [h2 + p? + grid > benefit-card*N]
  benefit-card > [icon + h4 + p]

required_elements: [at least 3 BENEFITS with title and description]
optional_elements: [SECTION_HEADING, SUBHEADING, icons]

responsive_behavior:
  - desktop: 3-column grid
  - tablet: 2-column grid
  - mobile: single column

image_compatibility: icons only
sidebar_compatibility: works in main column
```

---

### BP-177: Gauge Chart

```
blueprint_id: bp-gauge-chart
blueprint_name: Gauge Chart
category: data-visualization
article_role: Display a single metric as a semi-circular gauge/meter visualization

structural_pattern:
  - section container:
    - optional heading (h3)
    - gauge container (centered):
      - SVG semi-circle arc:
        - background arc (gray/muted)
        - value arc (colored, partial fill)
        - center value text (large number)
        - unit label (below number)
      - optional min/max labels at arc ends
    - optional description paragraph below

slot_definitions:
  - HEADING?: h3 title
  - GAUGE_VALUE: current value (number)
  - GAUGE_MAX: maximum value
  - UNIT_LABEL?: unit text (%, pts, etc.)
  - DESCRIPTION?: explanatory paragraph

hierarchy:
  section > [h3? + gauge-container > svg + description?]
  svg > [bg-arc + value-arc + center-text + labels?]

required_elements: [SVG gauge with value arc and center number]
optional_elements: [HEADING, UNIT_LABEL, min/max labels, DESCRIPTION]

responsive_behavior:
  - desktop: centered gauge, medium size
  - tablet: scaled proportionally
  - mobile: full-width gauge

image_compatibility: none (SVG-based)
sidebar_compatibility: works in main column or sidebar
```

---

### BP-178: Decision Tree

```
blueprint_id: bp-decision-tree
blueprint_name: Decision Tree
category: interactive-content
article_role: Display a decision-making flowchart with branching yes/no paths

structural_pattern:
  - section heading (h2)
  - tree container:
    - root question node (highlighted, centered):
      - question text
    - branch connectors (lines/arrows):
      - yes branch (left or right)
      - no branch (opposite side)
    - child decision nodes:
      - question or outcome text
      - further branches or terminal nodes
    - terminal/outcome nodes (distinct style):
      - result text
      - optional icon (checkmark, x, etc.)

slot_definitions:
  - SECTION_HEADING: h2 title
  - ROOT_QUESTION: starting question text
  - BRANCHES[]: recursive array of {question, yes_path, no_path}
  - OUTCOMES[]: terminal results

hierarchy:
  section > [h2 + tree > root-node > (branch > child-node)*N]
  child-node > [question + yes/no branches] OR [outcome]

required_elements: [ROOT_QUESTION, at least 2 branches, at least 2 OUTCOMES]
optional_elements: [SECTION_HEADING, icons on outcomes, connector labels]

responsive_behavior:
  - desktop: full tree layout with branches
  - tablet: simplified tree or vertical layout
  - mobile: vertical step-by-step layout

image_compatibility: icons only
sidebar_compatibility: works in main column only
```

---

### BP-179: Map Infographic

```
blueprint_id: bp-map-infographic
blueprint_name: Map Infographic
category: data-visualization
article_role: Display geographic data using a stylized map with data markers

structural_pattern:
  - section heading (h2)
  - map container (bordered):
    - SVG or image map:
      - region shapes or map background
      - data markers/pins at locations:
        - marker icon
        - tooltip or label
      - optional legend/key
    - optional stats sidebar or bottom strip:
      - location-based statistics

slot_definitions:
  - SECTION_HEADING: h2 title
  - MAP_IMAGE: SVG map or background image
  - MARKERS[]: array of {location, label, value?, icon?}
  - LEGEND?: color/icon key
  - STATS[]?: location-based statistics

hierarchy:
  section > [h2 + map-container > (map + markers + legend?)]
  map-container > [svg/img + marker*N + legend? + stats-strip?]

required_elements: [map visual with at least 3 MARKERS]
optional_elements: [SECTION_HEADING, LEGEND, STATS, tooltips]

responsive_behavior:
  - desktop: full map with all markers visible
  - tablet: scaled map
  - mobile: simplified map or list view of locations

image_compatibility: requires map image or SVG
sidebar_compatibility: works in main column only
```

---

### BP-180: Vertical Bar Chart

```
blueprint_id: bp-vertical-bar-chart
blueprint_name: Vertical Bar Chart
category: data-visualization
article_role: Display comparative data as vertical bars with labeled axes

structural_pattern:
  - section heading (h2)
  - chart container (bordered, padded):
    - SVG or CSS-based chart:
      - y-axis with value labels
      - x-axis with category labels
      - vertical bars (colored, varying heights):
        - bar fill (proportional to value)
        - value label (on top or inside bar)
      - optional grid lines (horizontal)
    - optional legend for multi-series data

slot_definitions:
  - SECTION_HEADING: h2 title
  - CHART_DATA: {categories[], values[], colors?[]}
  - Y_AXIS_LABEL?: axis description
  - LEGEND?: array of {color, label} for multi-series

hierarchy:
  section > [h2 + chart-container > chart + legend?]
  chart > [y-axis + x-axis + bars*N + gridlines?]

required_elements: [at least 3 bars with category labels and values]
optional_elements: [SECTION_HEADING, Y_AXIS_LABEL, legend, grid lines]

responsive_behavior:
  - desktop: full-width chart
  - tablet: scaled proportionally
  - mobile: horizontal scroll or simplified bars

image_compatibility: none (SVG/CSS-based)
sidebar_compatibility: works in main column
```

---

### BP-181: Revenue Breakdown Metrics

```
blueprint_id: bp-revenue-breakdown-metrics
blueprint_name: Revenue Breakdown Metrics
category: data-display
article_role: Display revenue or financial breakdown with large numbers and category splits

structural_pattern:
  - section heading (h2)
  - metrics container:
    - hero metric (centered, large):
      - large number (total revenue/value)
      - label text
    - breakdown grid (3-4 columns):
      - each category card:
        - category icon or color indicator
        - category label
        - amount/value (bold)
        - percentage or change indicator

slot_definitions:
  - SECTION_HEADING: h2 title
  - HERO_METRIC: {value, label}
  - BREAKDOWN[]: array of {icon?, label, value, percentage?} (3-6 items)

hierarchy:
  section > [h2 + hero-metric + breakdown-grid > card*N]
  card > [icon? + label + value + percentage?]

required_elements: [HERO_METRIC, at least 3 BREAKDOWN categories]
optional_elements: [SECTION_HEADING, icons, percentage indicators]

responsive_behavior:
  - desktop: hero metric above, 3-4 column grid below
  - tablet: 2-column breakdown grid
  - mobile: single column, stacked cards

image_compatibility: icons only
sidebar_compatibility: works in main column
```

---

### BP-182: Bordered Quote Card

```
blueprint_id: bp-bordered-quote-card
blueprint_name: Bordered Quote Card
category: emphasis-content
article_role: Display a prominent quote with decorative border treatment

structural_pattern:
  - quote container (thick left border or full border, padded):
    - optional quote icon (large quotation marks)
    - quote text (large, italic or weighted)
    - attribution line:
      - author name (bold)
      - author title/role
      - optional company

slot_definitions:
  - QUOTE_TEXT: the quote content
  - AUTHOR_NAME: attribution name
  - AUTHOR_TITLE?: role or title
  - COMPANY?: organization name

hierarchy:
  blockquote > [quote-icon? + p.quote-text + footer > (name + title? + company?)]

required_elements: [QUOTE_TEXT, AUTHOR_NAME]
optional_elements: [quote icon, AUTHOR_TITLE, COMPANY, decorative border]

responsive_behavior:
  - desktop: padded with generous margins
  - tablet: reduced padding
  - mobile: full-width with left border accent

image_compatibility: none
sidebar_compatibility: works in main column or sidebar
```

---

### BP-183: Warehouse Capacity Table

```
blueprint_id: bp-warehouse-capacity-table
blueprint_name: Warehouse Capacity Table
category: tabular-data
article_role: Display warehouse or facility capacity data in a structured comparison table

structural_pattern:
  - section heading (h2)
  - optional description paragraph
  - table container (bordered):
    - table header row (dark/accent background):
      - columns: Location, Capacity, Utilization, Type, Status
    - table body rows (alternating stripes):
      - location name (bold)
      - capacity metric (number + unit)
      - utilization bar or percentage
      - facility type
      - status badge (active/planned/full)

slot_definitions:
  - SECTION_HEADING: h2 title
  - DESCRIPTION?: introductory paragraph
  - TABLE_HEADERS[]: column header labels
  - TABLE_ROWS[]: array of {location, capacity, utilization, type, status}

hierarchy:
  section > [h2 + p? + table-container > table > thead + tbody]
  tbody > tr*N > td*columns

required_elements: [table with headers and at least 3 data rows]
optional_elements: [SECTION_HEADING, DESCRIPTION, utilization bars, status badges]

responsive_behavior:
  - desktop: full table layout
  - tablet: horizontal scroll
  - mobile: horizontal scroll or stacked card layout

image_compatibility: none
sidebar_compatibility: works in main column
```

---

### BP-184: Industry Benchmark Table

```
blueprint_id: bp-industry-benchmark-table
blueprint_name: Industry Benchmark Table
category: tabular-data
article_role: Compare industry benchmarks or KPIs against actual performance

structural_pattern:
  - section heading (h2)
  - optional description paragraph
  - table container (bordered):
    - table header row:
      - columns: Metric, Industry Average, Your Performance, Gap, Rating
    - table body rows:
      - metric name
      - industry average value
      - actual performance value
      - gap/difference (color-coded: green=above, red=below)
      - rating indicator (stars, grade, or icon)

slot_definitions:
  - SECTION_HEADING: h2 title
  - DESCRIPTION?: introductory paragraph
  - TABLE_HEADERS[]: column header labels
  - TABLE_ROWS[]: array of {metric, industry_avg, performance, gap, rating}

hierarchy:
  section > [h2 + p? + table-container > table > thead + tbody]
  tbody > tr*N > td*columns

required_elements: [table with headers, at least 4 metrics with benchmark and performance values]
optional_elements: [SECTION_HEADING, DESCRIPTION, color-coded gaps, rating indicators]

responsive_behavior:
  - desktop: full table layout
  - tablet: horizontal scroll
  - mobile: horizontal scroll or metric cards

image_compatibility: rating icons only
sidebar_compatibility: works in main column
```

---

### BP-185: Hub-and-Spoke Diagram

```
blueprint_id: bp-hub-spoke-diagram
blueprint_name: Hub-and-Spoke Diagram
category: relationship-visualization
article_role: Display a central concept connected to surrounding related elements

structural_pattern:
  - section heading (h2)
  - diagram container (centered):
    - central hub node (larger, prominent):
      - hub icon or image
      - hub label (bold)
    - spoke connectors (lines radiating outward):
      - connecting lines from hub to spokes
    - spoke nodes (arranged in circle around hub):
      - spoke icon
      - spoke label
      - optional spoke description

slot_definitions:
  - SECTION_HEADING: h2 title
  - HUB: {icon?, label, description?}
  - SPOKES[]: array of {icon?, label, description?} (4-8 items)

hierarchy:
  section > [h2 + diagram > hub-node + connector*N + spoke-node*N]
  hub-node > [icon? + label]
  spoke-node > [icon? + label + description?]

required_elements: [HUB with label, at least 4 SPOKES with labels]
optional_elements: [SECTION_HEADING, icons, descriptions, connector labels]

responsive_behavior:
  - desktop: circular spoke arrangement around center hub
  - tablet: reduced spacing, smaller diagram
  - mobile: vertical list with hub at top

image_compatibility: icons only
sidebar_compatibility: works in main column only
```

---

### BP-186: Testimonial Image Banner

```
blueprint_id: bp-testimonial-image-banner
blueprint_name: Testimonial Image Banner
category: social-proof
article_role: Display a testimonial with a full-width background image and quote overlay

structural_pattern:
  - banner container (full-width, background image):
    - dark gradient overlay
    - content overlay (centered):
      - large quotation mark icon
      - testimonial text (large, light color)
      - attribution row:
        - author photo (circular avatar)
        - author name (bold)
        - author title and company
      - optional company logo

slot_definitions:
  - BACKGROUND_IMAGE: banner background image URL
  - QUOTE_TEXT: testimonial text
  - AUTHOR_NAME: person's name
  - AUTHOR_TITLE?: role/title
  - COMPANY?: company name
  - AUTHOR_PHOTO?: avatar image URL
  - COMPANY_LOGO?: logo image URL

hierarchy:
  banner > [bg-image + gradient + content > (quote-icon + blockquote + attribution)]
  attribution > [avatar? + name + title? + company?]

required_elements: [BACKGROUND_IMAGE, QUOTE_TEXT, AUTHOR_NAME]
optional_elements: [AUTHOR_PHOTO, AUTHOR_TITLE, COMPANY, COMPANY_LOGO, quotation icon]

responsive_behavior:
  - desktop: full-width banner with centered overlay
  - tablet: reduced height, same layout
  - mobile: taller banner, text stacked

image_compatibility: requires background image, optional avatar
sidebar_compatibility: full-width only (breaks out of main column)
```

---

### BP-187: Freight Rate Comparison Table

```
blueprint_id: bp-freight-rate-comparison-table
blueprint_name: Freight Rate Comparison Table
category: tabular-data
article_role: Compare freight rates, shipping costs, or logistics pricing across routes or providers

structural_pattern:
  - section heading (h2)
  - optional description paragraph
  - table container (bordered):
    - table header row (accent background):
      - columns: Route/Provider, Mode, Weight Range, Rate, Transit Time, Notes
    - table body rows (alternating stripes):
      - route or provider name
      - shipping mode (air, sea, road)
      - weight range
      - rate/cost (highlighted)
      - transit time
      - additional notes

slot_definitions:
  - SECTION_HEADING: h2 title
  - DESCRIPTION?: introductory paragraph
  - TABLE_HEADERS[]: column header labels
  - TABLE_ROWS[]: array of {route, mode, weight_range?, rate, transit_time, notes?}

hierarchy:
  section > [h2 + p? + table-container > table > thead + tbody]
  tbody > tr*N > td*columns

required_elements: [table with headers, at least 3 route/rate rows]
optional_elements: [SECTION_HEADING, DESCRIPTION, mode icons, highlighted rates]

responsive_behavior:
  - desktop: full table layout
  - tablet: horizontal scroll
  - mobile: horizontal scroll or card layout

image_compatibility: mode icons only
sidebar_compatibility: works in main column
```

---

### BP-188: Social Share Sidebar

```
blueprint_id: bp-social-share-sidebar
blueprint_name: Social Share Sidebar
category: navigation-utility
article_role: Provide a sticky social media sharing sidebar alongside article content

structural_pattern:
  - sticky sidebar container (fixed position, left or right):
    - share label (vertical text or small heading)
    - social icon buttons (vertical stack):
      - each button (circular or square, branded color):
        - social media icon (LinkedIn, Twitter/X, Facebook, WhatsApp, Email)
        - optional tooltip with platform name
    - optional share count badge
    - optional copy-link button at bottom

slot_definitions:
  - SHARE_LABEL?: text like "Share" or "Share this"
  - SOCIAL_LINKS[]: array of {platform, icon, url_template}
  - COPY_LINK_BUTTON?: boolean

hierarchy:
  aside.sticky > [label? + icon-stack > button*N + copy-btn?]
  button > [icon + tooltip?]

required_elements: [at least 3 social media icon buttons]
optional_elements: [SHARE_LABEL, tooltips, share count, COPY_LINK_BUTTON]

responsive_behavior:
  - desktop: sticky sidebar, vertical icon stack
  - tablet: horizontal bar at top or bottom
  - mobile: horizontal bar fixed at bottom

image_compatibility: social media icons only
sidebar_compatibility: IS a sidebar element
```

---

### BP-189: Donut Chart with Legend

```
blueprint_id: bp-donut-chart-legend
blueprint_name: Donut Chart with Legend
category: data-visualization
article_role: Display proportional data as a donut/ring chart with an adjacent legend

structural_pattern:
  - section heading (h2)
  - chart layout (two-column):
    - left: donut chart (SVG):
      - circle segments (colored, proportional arcs)
      - center text (total value or label)
      - optional percentage labels on segments
    - right: legend list:
      - each legend item:
        - color swatch (matching segment)
        - category label
        - value and/or percentage

slot_definitions:
  - SECTION_HEADING: h2 title
  - CENTER_TEXT?: total or summary text for donut center
  - SEGMENTS[]: array of {label, value, percentage?, color} (3-8 items)

hierarchy:
  section > [h2 + chart-layout > (donut-svg + legend)]
  donut-svg > [segment-arcs + center-text?]
  legend > [legend-item*N > (swatch + label + value)]

required_elements: [SVG donut with at least 3 segments, legend with matching items]
optional_elements: [SECTION_HEADING, CENTER_TEXT, percentage labels on segments]

responsive_behavior:
  - desktop: side-by-side (chart left, legend right)
  - tablet: side-by-side with reduced sizes
  - mobile: chart on top, legend below

image_compatibility: none (SVG-based)
sidebar_compatibility: works in main column
```

---

### BP-190: Futurist Quote

```
blueprint_id: bp-futurist-quote
blueprint_name: Futurist Quote
category: emphasis-content
article_role: Display a forward-looking or visionary quote with futuristic styling

structural_pattern:
  - quote container (dark/gradient background, padded):
    - decorative element (geometric shapes, lines, or glow effect)
    - quote text (large, light-colored, modern font weight)
    - attribution line:
      - author name (bold, accent color)
      - author title/role
      - optional year or context
    - optional decorative bottom border or accent line

slot_definitions:
  - QUOTE_TEXT: visionary/forward-looking quote
  - AUTHOR_NAME: attribution name
  - AUTHOR_TITLE?: role, title, or affiliation
  - CONTEXT?: year, event, or publication

hierarchy:
  section.futurist-quote > [decorative? + blockquote > (p.quote + footer > attribution)]
  attribution > [name + title? + context?]

required_elements: [QUOTE_TEXT, AUTHOR_NAME]
optional_elements: [AUTHOR_TITLE, CONTEXT, decorative elements, gradient background]

responsive_behavior:
  - desktop: centered with generous padding and decorative elements
  - tablet: reduced padding, same layout
  - mobile: full-width, simplified decorative elements

image_compatibility: none
sidebar_compatibility: works in main column or sidebar
```

---

### BP-191: Verdict Section

```
blueprint_id: bp-verdict-section
blueprint_name: Verdict Section
category: summary
article_role: Final verdict with overall score, category breakdowns, and closing recommendation. Uses dark navy gradient background (.article-section--verdict) for maximum visual prominence — impossible to scroll past without noticing.

variants:
  - variant: single-product-scorecard
    use_when: Article is a single-product review (e.g., foodics-review, odoo-zatca-compliance)
    structural_pattern:
      - Section wrapper uses .article-section--verdict + .article-section--verdict-bg modifiers
      - Verdict badge (.article-verdict__badge) with "Our Verdict" text before the h2
      - h2 heading (white on dark)
      - Single verdict card with:
        - Large overall score number + "/5" max label
        - Breakdown rows: label + progress bar + individual score (3-6 categories)
      - Summary paragraphs (2-3 closing paragraphs)
    slot_definitions:
      - VERDICT_HEADING: h2 title (e.g., "Final Verdict: 4.5 out of 5")
      - OVERALL_SCORE: numeric score (e.g., "4.5")
      - SCORE_MAX: scale label (always "/ 5")
      - BREAKDOWN_CATEGORIES[]: array of { label, score, width_percent }
      - SUMMARY_PARAGRAPHS[]: 2-3 closing paragraphs with recommendation

  - variant: multi-product-merged-cards
    use_when: Article is a multi-product comparison ("Best X for Y") and each "Best for [segment]" card maps 1:1 to a scored product. DO NOT render a separate score list below the cards — scores go INSIDE each card to avoid height bloat and content duplication.
    do_not_use_when:
      - Cards recommend 2+ products each (keep cards without inline scores)
      - Single product per article (use single-product-scorecard instead)
      - 2-product head-to-head (use large product-cards, no scores)
      - Product cards without a duplicate scores list already (already compact)
    structural_pattern:
      - Section wrapper uses .article-section--verdict + .article-section--verdict-bg modifiers
      - Verdict badge + h2 + lead paragraph
      - 2-column grid of merged verdict cards, each containing:
        1. Label: "Best for [Segment]" (small uppercase)
        2. Product row: product name (large) + score "4.5/5" (right-aligned)
        3. Horizontal progress bar (white fill on translucent white track)
        4. Reasoning paragraph (the "why", prefix-stripped)
    slot_definitions:
      - VERDICT_HEADING: h2 title
      - VERDICT_INTRO: lead paragraph
      - VERDICT_CARDS[]: array of { segment_label, product_name, score, score_max, width_percent, reasoning }
    partial_merge_rule:
      - If a card's recommended product has no score, render that card without the score row and progress bar (just label + product name + reasoning). Never invent a score.
    required_elements: [VERDICT_HEADING, at least 3 VERDICT_CARDS]

hierarchy:
  section.article-section--verdict > [badge + h2 + (scorecard | verdict-grid) + p*N]
  merged-card > [label + product-row + score-bar + reasoning]

responsive_behavior:
  - desktop: 2-column grid of merged cards; side-by-side score + breakdown on single-product
  - tablet: 2-column grid stays
  - mobile: grid collapses to 1-column, card padding preserved

image_compatibility: background image supported via .article-section--verdict-bg
sidebar_compatibility: works in main column
```


### BP-195: Case Study Article Pattern

```
blueprint_id: bp-case-study
blueprint_name: Illustrative Case Study (narrative customer story)
category: article-type
article_role: full-article-pattern
added: 2026-04-20

purpose:
  A complete, reusable article pattern for case studies — customer stories,
  composite scenarios, or post-implementation retrospectives. Narrative structure
  built from 9 sub-components. Designed to be visually distinct from Best-Of
  comparison articles without sacrificing professionalism.

when_to_use:
  - Topic is a single-customer story or composite illustrative scenario
  - Article arc is challenge → solution → timeline → results → lessons
  - NOT for comparison content (use BP-192/193/194 article types instead)

ethical_framing:
  - If the subject is composite/illustrative (no single named real customer), the
    article MUST include a .case-disclosure box immediately after the profile card
    stating this clearly
  - Every metric MUST sit inside a published outcome range (cite source on request)
  - Pull-quote attribution MUST NOT invent a named person if the subject is composite —
    attribute to "composite founder persona" or equivalent honest framing

color_discipline:
  - NEVER use bright red (#d04444, #ff0000, or equivalents) on card borders or
    number badges. Red reads as alarm/error and is unprofessional for editorial
    content. Use the project's brand-blue or brand-navy token for all accents.
  - The ONLY legitimate place for a red/green semantic pair is inside the
    before/after comparison grid, and even there colors must be de-saturated
    to ≤8% background opacity.
  - Disclosure box uses warm amber (not red) to signal "note" not "error"
  - Avoid more than 2 accent colors in the entire article — otherwise it looks
    like a dashboard, not editorial content

sub_components:
  1. hero: article-hero (same as other article types)
  2. case-disclosure: amber-accented illustrative/composite disclaimer box
  3. case-profile: 3-column facts grid on a navy background
     { Company | Industry | Size | Location | Tool | Timeline | HeadlineResult }
  4. case-challenge-list: numbered cards (red/alarm styling PROHIBITED — use brand-blue)
     5-item list for the "pre-solution" pain points
     3-item list for the "honest challenges post-implementation"
  5. case-timeline: vertical timeline with dot markers
     6 deployment milestones (Week/Month labels)
  6. case-pullquote: large navy-background quote with giant serif open-mark
     Includes attribution (composite persona if illustrative)
  7. case-ba-grid: before/after table, 3-column (metric | before | after)
     Use muted semantic palette (≤8% red/green bg) — not full-saturation
  8. case-metrics: big-number tile grid, 3-col desktop
     6 tiles × { value, label, subtext with source range }
  9. case-lessons: 2-col grid of numbered takeaway cards (brand-blue circle number)
  10. case-cta: gradient navy closing CTA block linking to related review/guide

article_structure:
  - Hero
  - Disclosure (if composite/illustrative)
  - Profile card
  - Section 2: The Challenge (5 pain points)
  - Inline image
  - Section 3: The Solution (2 paragraphs)
  - Section 4: Timeline (6 milestones)
  - Inline image
  - Pull quote
  - Section 6: Before/After table (6 metrics)
  - Inline image
  - Section 7: Headline Results (6 metric tiles)
  - Inline image
  - Section 8: Honest Challenges (3 cards)
  - Section 9: Lessons Learned (5 cards)
  - Section 10: Closing CTA

css_namespace: .case-* (all case-study components scoped under this prefix)
required_stylesheet: article-case-study.css (scoped component library)

responsive_behavior:
  - desktop (>1024px): profile 3-col, metrics 3-col, lessons 2-col, before/after 3-col table
  - tablet (max-width: 1024px): profile 2-col, metrics 2-col, lessons 2-col, before/after STACKS to vertical cards (metric → before → after per row). 3-col tables are too cramped inside a sidebar-constrained article column.
  - mobile (max-width: 768px): ALL grids collapse to 1-col. Challenge cards collapse flex to column. Pull quote reduces to 1rem body + 3.5rem open-quote mark. CTA padding tightens.

responsive_discipline_MANDATORY:
  1. NEVER use inline `style={{ gridColumn: 'span N' }}` on grid items — the N is fixed and doesn't adapt when grid-template-columns changes at breakpoints. This creates implicit extra columns that break layout at tablet/mobile.
     Correct: use a CSS modifier class that applies `grid-column: 1 / -1` so the item always spans the full current column count, whatever it is.
  2. NEVER collapse a 3-column table only at 768px. Inside an article column (sidebar + TOC + main), tablet widths (768–1024px) leave roughly 500–700px of usable width. A 3-column table in that space produces cramped, hard-to-read cells. Collapse 3-col tables to stacked cards at 1024px, not 768px.
  3. When stacking a 3-column table to vertical cards, use `::before { content: attr(data-label); }` on the value cells to show "Before" / "After" labels per card, and add `data-label="..."` attributes in the JSX. Hide the original thead label cells.
  4. Every custom grid component MUST declare behavior at all three breakpoints: desktop, tablet (≤1024), phone (≤768). Missing the tablet breakpoint is the most common responsive bug.
  5. Case study hero uses an extra `.article-hero__subtitle` paragraph that Best-Of articles do not. Mobile-specific rules are MANDATORY when you add the subtitle: reduce it to ~14px font-size, ~1.5 line-height, ~14px bottom margin; bump `.article-hero__content` top padding to ~80px so the hero badge clears the transparent navbar; tighten the badge to ~11px / 0.06em letter-spacing on phones. Without these, the subtitle dominates the mobile hero at desktop sizing and the badge collides with the navbar logo.

image_compatibility:
  - 5 images recommended: hero, POS close-up, branch/map, waste/inventory detail,
    dashboard flat-lay
  - All inline images use figure.article-image--contextual wrapper

sidebar_compatibility: works with TOCSidebar + AffiliateSidebar as normal
faq_compatibility: optional; most case studies do not need an FAQ section
```
