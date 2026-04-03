# Persona 06: Elena Kowalski — WordPress Agency Developer

---

## 1. Who I Am

My name is Elena Kowalski. I'm the Lead Developer at Starter Spark, a WordPress agency in Chicago that builds 20-25 client sites per year. We're a team of 8 — 3 developers (including me), 2 designers, 1 project manager, 1 content manager, and the agency owner. I've been doing WordPress development for 9 years, the last 5 as lead dev at this agency.

My technical level is advanced WordPress — I write custom plugins, build custom themes, work directly with the REST API, and handle server-side configuration. I'm comfortable in PHP, JavaScript, React (for Gutenberg blocks), and I know enough DevOps to manage our staging/production deployment pipeline on WP Engine and Cloudways.

Here's what makes my job uniquely painful: our 20+ active client sites use at least 4 different page builders. Some clients are on Gutenberg with Full Site Editing. Some are on Elementor because a previous developer set it up that way. We have legacy clients on WPBakery (Visual Composer) and a couple still on Classic Editor with Advanced Custom Fields layouts. Every plugin I install has to work across all of them or I spend my weekends patching things.

---

## 2. My Daily Workflow

I start mornings in our project management tool (ClickUp) triaging support tickets and new development requests. On any given day I'm context-switching between 3-5 client sites.

By 9 AM I'm typically in my local development environment (LocalWP) pulling down a client site to work on. The first task is usually debugging something — a plugin conflict, a layout break after a WordPress core update, or a content block that renders differently in Elementor versus the frontend.

Mid-morning is feature development — building custom Gutenberg blocks, creating Elementor widgets, or extending WPBakery shortcodes. I hate that I have to know three completely different APIs to do essentially the same thing (render a content block), but that's the reality.

After lunch I handle content operations tasks — setting up new landing pages, migrating content between builders when clients rebrand, and configuring SEO plugins (Yoast or RankMath) across sites. This is where content management plugins come in and where things most frequently break.

Afternoon is deployment and testing. I push changes through our staging pipeline, test across browsers and devices, and pray that nothing breaks in production. I also handle plugin updates across all client sites — which is a 2-hour weekly ritual of updating, testing, and occasionally rolling back when something conflicts.

Late afternoon is documentation and client communication — writing up what was done, explaining technical decisions, and planning next sprints.

---

## 3. My Top 5 Pain Points

**Pain Point 1: Plugins that only work with Gutenberg.** The WordPress ecosystem has gone all-in on Gutenberg/blocks, which is great for new sites. But half my clients are on Elementor or WPBakery, and most new plugins — especially AI content plugins — only support Gutenberg. I've tested 6 AI content plugins in the last year. Four of them were Gutenberg-only. One claimed Elementor support but injected raw HTML that broke Elementor's flex containers. One crashed WPBakery entirely.

**Pain Point 2: Plugin conflicts are my biggest time sink.** I spend approximately 8 hours per week debugging plugin conflicts. Every new plugin I add is a risk. JavaScript conflicts, CSS specificity wars, REST API endpoint collisions, incompatible hooks. I need any new plugin to have a minimal footprint — load assets only where needed, namespace everything, and not hijack the admin experience.

**Pain Point 3: Content publishing workflows are fragmented.** Right now, the content team writes in Google Docs, I or the content manager manually copies it into WordPress, reformats it for the specific builder, adds SEO metadata, configures the featured image, sets categories and tags, and publishes. For sites with scheduled content calendars, this is 30-45 minutes per article. Multiply that by 15-20 articles per month across all clients and it's a substantial time drain.

**Pain Point 4: Multi-site management is chaos.** I manage plugins, themes, and content workflows across 20+ sites. There's no unified way to roll out a new plugin, configure it identically across sites, and monitor it. I use ManageWP for updates but configuration and content workflow management is all manual.

**Pain Point 5: AI plugins that don't respect existing content architecture.** I've seen AI content plugins that create their own custom post types, their own taxonomy structures, and their own meta fields — completely ignoring whatever content architecture is already in place. If a client has a carefully designed CPT structure with ACF fields, I need a plugin that works with that architecture, not one that tries to replace it.

---

## 4. My Deal-Breakers

- **Cross-builder compatibility**: The plugin must render content correctly in Gutenberg, Elementor, WPBakery, and Classic Editor. Not "mostly works" — actually tested and verified.
- **No layout injection**: Content must be delivered as clean, semantic HTML or native builder elements. No inline styles, no absolute positioning, no framework-specific CSS that conflicts with client themes.
- **Hooks and filters**: I need WordPress-standard hooks and filters to customize behavior per-site. If I can't modify the plugin's behavior through documented action/filter hooks, it's useless for agency work.
- **Multisite and white-label support**: I need to deploy this across 20+ sites. Per-site licensing at enterprise prices is a non-starter. Agency licensing or multisite keys are essential.
- **Performance**: The plugin must not add more than 50ms to page load. No loading 500KB of JavaScript on the frontend. Admin-side weight is acceptable; frontend weight is not.

---

## 5. My Feature Priority Rankings

| Feature Area | Score (1-10) | Rationale |
|---|---|---|
| Data Ingestion | 5 | Useful for clients who want data-backed content, but not my primary concern. |
| Content Intelligence | 6 | Helps the content team, which indirectly helps me by reducing revision cycles. |
| Voice Intelligence | 4 | Nice for multi-client consistency but not a development priority. |
| Article Generation | 5 | Only useful if output is clean HTML that doesn't break builders. |
| Universal Publishing | 10 | This is the killer feature. If it truly publishes to any CMS/builder correctly, it saves me hours per week. |
| Quality Assurance | 6 | Pre-publish validation that catches formatting issues before they hit production would be valuable. |
| Performance Tracking | 4 | That's the SEO team's domain, not mine. |
| Dashboard/Admin | 7 | Must be clean, fast, and not take over the WordPress admin. |
| CMS Integration | 10 | This is literally my entire evaluation criterion. Does the WordPress plugin work? |
| API & Developer Experience | 9 | I need REST API endpoints and WP-CLI commands for automation across client sites. |

---

## 6. My Wish List

1. **As a WordPress agency developer**, I want the ChainIQ plugin to detect which page builder is active on a given site and render content using that builder's native components, so that published articles don't break layouts regardless of whether the site uses Gutenberg, Elementor, WPBakery, or Classic Editor.

2. **As a WordPress agency developer**, I want WP-CLI commands for all major plugin operations (configure, publish, sync, update settings), so that I can script deployment and configuration across 20+ client sites without manually logging into each admin panel.

3. **As a WordPress agency developer**, I want the plugin to expose WordPress-standard action and filter hooks for every major operation (pre-publish, post-publish, content-transform, metadata-apply), so that I can customize behavior per-client through mu-plugins without forking the main plugin code.

4. **As a WordPress agency developer**, I want an agency licensing model with a single dashboard where I can manage all client site activations, push configuration templates, and monitor plugin health across my portfolio, so that I'm not managing 20 separate license keys and configurations.

5. **As a WordPress agency developer**, I want the plugin to respect and integrate with existing content architecture — custom post types, ACF fields, custom taxonomies, and SEO plugin metadata (Yoast/RankMath) — so that it enhances the current setup instead of requiring migration to a new content structure.

---

## 7. Competitor Envy

I've always been impressed by how Jetpack integrates with WordPress — it feels native, it respects the WordPress way of doing things, it has WP-CLI support, and it provides a unified management dashboard for multiple sites. Obviously Jetpack isn't an AI content tool, but its integration philosophy is what I want from ChainIQ's WordPress plugin. On the AI content side, SurferSEO's WordPress plugin is the closest I've seen to "just working" — it has a clean integration that doesn't fight the editor. But even Surfer doesn't handle Elementor or WPBakery. If ChainIQ could combine Jetpack's multi-site management philosophy with actual cross-builder content publishing, that would be genuinely unique.

---

## 8. If I Could Change ONE Thing

Build a universal content rendering layer that translates structured content into native builder markup for every major WordPress page builder. I don't want HTML that "sort of works" in Elementor. I want native Elementor widgets, native Gutenberg blocks, native WPBakery elements. One content source, four native output formats. This single capability would save me hundreds of hours per year and would be the reason I recommend ChainIQ to every WordPress agency I know.

---

## 9. What Would Make Me Evangelize

If I could install the ChainIQ plugin on a test site running Elementor, another running Gutenberg, another running WPBakery, and one on Classic Editor — publish the same article to all four — and have it render correctly, with native builder elements, proper responsive behavior, and zero layout breaks on each one... I would write a blog post about it, present it at WordCamp, and personally recommend it in every WordPress developer Slack community I'm in. Bonus points if I can do the entire install and configuration via WP-CLI. Double bonus if the plugin passes WordPress Plugin Check (PCP) standards.

---

## 10. Red Flags

- **Gutenberg-only support**: If the plugin only works with the block editor, it's immediately disqualified. Half my clients aren't on Gutenberg and won't be migrating anytime soon.
- **Heavy frontend assets**: If I see unminified JS or CSS loading on the public-facing site, adding weight to Core Web Vitals, the plugin gets deactivated immediately.
- **Custom database tables without cleanup**: If the plugin creates custom tables and doesn't provide a clean uninstall routine, it's irresponsible development.
- **No hooks or filters**: If I can't customize behavior without editing plugin source, it's not built for agency use.
- **Breaks on update**: If a plugin update changes configuration, breaks existing content, or resets settings, it tells me the development team doesn't test upgrade paths. That's a critical trust failure.
- **Requires phone-home for basic functionality**: If the plugin stops working when it can't reach an external API, it needs a graceful degradation mode so client sites don't break during outages.
- **Per-site enterprise pricing**: If the licensing model charges $500+/month per site, it's economically impossible for an agency managing 20+ sites. I need agency-tier pricing.
