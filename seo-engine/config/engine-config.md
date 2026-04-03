# Article Engine Configuration v4.5

This configuration is project-agnostic. Most values auto-detect from the current project.
Override any value to customize behavior. Leave as `auto` or `__PLACEHOLDER__` for auto-detection.

## Research Stack

### Gemini MCP (Primary)
- api_provider: gemini
- api_key: __PLACEHOLDER__
- model: __PLACEHOLDER__
- fallback_behavior: degrade to WebSearch if MCP unavailable

### WebSearch (Supplement)
- use_for: verification, content landscape scanning, fact-checking
- max_queries_per_round: 3

### Context7 (Library Docs)
- use_for: framework/library documentation only
- trigger: when article topic involves a specific technology

## Domain Integrity

### Classification
- classify_before_research: true
- domain_lock_enforcement: strict
- drift_detection: automatic (all agents)
- drift_threshold: 20%

### Website Industry
- website_industry: auto (detected from project analysis)
- note: "used ONLY for drift detection, never for content shaping"

## Project Adaptation

### Shell Detection
- shell_detection: auto
- shell_hint: auto (user can override with "use X as the shell")
- fallback_shell: config/article-shell-template.html

### Component Detection
- component_detection: auto
- component_file: auto (user can override with "use X as the components file")
- adaptation_modes: [existing, registry, fallback]
- auto_select_mode: true
- internal_registry: config/structural-component-registry.md

### Adaptation Priority
1. Explicit user-provided component file (overrides everything)
2. Existing project article shell + project's own component library → **existing** mode
3. Project shell detected + no project components → **registry** mode (internal blueprints + project visual tokens)
4. No project shell detected → **fallback** mode (internal blueprints + fallback shell + fallback design tokens)

## Structural Component Registry

### Registry Settings
- registry_file: config/structural-component-registry.md
- registry_source: article-components.html (one-time ingestion, not needed at runtime)
- total_blueprints: 193 (190 content blueprints + hero + shell + prose)
- stores_structure_only: true
- stores_visual_identity: false

### Ingestion Record

```
STRUCTURAL_INGESTION:
  source_component_file: article-components.html
  ingestion_mode: one-time (completed 2026-03-11)
  registry_output_path: config/structural-component-registry.md
  style_stripping_rules:
    - strip all hex color values
    - strip all font-family declarations
    - strip all exact spacing tokens
    - strip all border-radius values
    - strip all box-shadow values
    - strip all brand-specific class names
    - preserve layout relationships
    - preserve content slot definitions
    - preserve hierarchy and nesting
    - preserve responsive breakpoint logic
  blueprint_normalization_rules:
    - each blueprint has: id, name, category, role, structural_pattern, slots, hierarchy
    - no visual styling frozen into blueprints
    - responsive behavior described abstractly
    - slot definitions are content-type-aware
```

### Article Shell Registry

```
ARTICLE_SHELL_INGESTION:
  source_shell_reference: article-components.html + article-shell-template.html
  shell_registry_output_path: included in structural-component-registry.md (bp-article-shell)
  shell_normalization_rules:
    - preserve two-column layout structure
    - preserve hero → content → sidebar relationship
    - preserve sticky sidebar behavior
    - preserve mobile collapse to single column
    - strip all brand-specific styling
```

### Runtime Adaptation Settings

```
RUNTIME_ADAPTATION:
  visual_adaptation_mode: auto (detect from project)
  project_shell_priority: project shell > fallback shell
  structural_source_priority: internal registry > project components (unless user overrides)
  topic_sensitivity_rules:
    - data-heavy topics: prefer stats, tables, highlight callouts
    - how-to topics: prefer step-process, checklist, numbered-list
    - narrative topics: prefer timeline, pull-quote, image-caption
    - comparison topics: prefer before-after, mini-cards, problem-solution
  fallback_visual_style_mode: use design token fallback defaults (see below)
```

### Structural Registry Validation

```
REGISTRY_VALIDATION:
  verify_structure_retention: true
  verify_style_stripping: true
  verify_runtime_independence: true
  verify_blueprint_quality: true
  verify_visual_adaptation: true
  verify_shell_reuse: true
  verify_cross_project_reuse: true
```

## Gemini MCP Integration (Portable)

### Resolution Strategy

The skill resolves Gemini image generation through a **flexible, multi-strategy resolver**.
It does NOT assume a specific project, repo, folder, environment, or tool name.

**CRITICAL: The skill NEVER depends on one exact tool name.** It uses the Gemini Tool Resolver to check multiple known names, aliases, patterns, and config overrides.

### Gemini Tool Resolution

```
gemini_tool_resolution:
  # Preferred tool name (optional — tried first if set)
  preferred_image_tool_name: __PLACEHOLDER__

  # Known compatible Gemini image tool names (checked in order at runtime)
  # The resolver scans available tools against ALL of these
  known_image_tool_aliases:
    - mcp__gemini__gemini-generate-image
    - mcp__gemini__generate-image
    - mcp__gemini__generate_image
    - mcp__gemini__image-generation
    - mcp__gemini__create-image
    - mcp__gemini__createImage
    - mcp__gemini__generateImage

  # User-configured custom aliases (add your own if your MCP uses a different name)
  allowed_image_tool_aliases: __PLACEHOLDER__

  # Namespace pattern matching (if no exact alias matches, try these patterns)
  # Patterns are case-insensitive and match against all available tools
  namespace_patterns:
    - "mcp__*gemini*__*image*"
    - "mcp__*gemini*__*generat*"

  # Provider namespace (the MCP server namespace prefix)
  provider_namespace: mcp__gemini__

  # Tool capability mapping (maps generic capabilities to tool names)
  tool_capability_mapping:
    image_generation: resolved_at_runtime
    research_query: resolved_at_runtime
    search: resolved_at_runtime

  # Override permissions
  project_local_override_allowed: true
  global_override_allowed: true

  # Fallback behavior when ALL resolution strategies fail
  fallback_behavior: placeholder_and_prompts
```

### Known Research Tool Aliases

```
gemini_research_resolution:
  known_query_tool_aliases:
    - mcp__gemini__gemini-query
    - mcp__gemini__query
    - mcp__gemini__gemini_query
  known_search_tool_aliases:
    - mcp__gemini__gemini-search
    - mcp__gemini__search
    - mcp__gemini__gemini_search
```

### Gemini MCP Config Placeholders

These settings allow users to explicitly configure Gemini MCP in their own projects.
Leave as `__PLACEHOLDER__` to use auto-detection (recommended for most users).

```
gemini_mcp:
  # Explicit MCP server configuration (optional — overrides auto-detection)
  mcp_server_command: __PLACEHOLDER__
  mcp_server_args: __PLACEHOLDER__
  mcp_server_env: __PLACEHOLDER__
  mcp_server_transport: __PLACEHOLDER__
  mcp_server_config_path: __PLACEHOLDER__

  # Resolution behavior
  project_local_override_allowed: true
  global_fallback_allowed: true
  runtime_tool_detection: true

  # API key resolution (checked in order)
  api_key_sources:
    - skill_config (api_key field above)
    - environment_variable (GEMINI_API_KEY)
    - project_local_mcp_config
    - global_mcp_config
```

### Resolution Priority Order

The Gemini Tool Resolver checks these strategies in order. It stops at the FIRST success:

| Priority | Strategy | What it does |
|---|---|---|
| 1 | **Config override** | If `preferred_image_tool_name` is set, try that exact name |
| 2 | **Known alias scan** | Scan available tools against `known_image_tool_aliases` list |
| 3 | **Custom alias scan** | Scan against user-configured `allowed_image_tool_aliases` |
| 4 | **Pattern match** | Scan available tools against `namespace_patterns` (wildcard) |
| 5 | **Project .mcp.json** | Check `{cwd}/.mcp.json` for gemini server config |
| 6 | **Global config** | Check `~/.claude/.mcp.json` for global gemini config |
| 7 | **Fallback** | Only if ALL above fail — skip images, export prompts |

### Fallback Behavior

Fallback activates ONLY after the full resolver chain has been exhausted.

| Fallback Level | Behavior |
|---|---|
| **Level 1: Placeholder HTML** | Insert `<!-- IMAGE PLACEHOLDER: [description] -->` comments in HTML. Article generates normally. |
| **Level 2: Prompt Export** | Output the 4-6 image prompts as a structured list so the user can generate images manually with any tool. |
| **Level 3: Skip Silently** | If `fallback_behavior` is set to `silent`, skip images entirely and note in the delivery report. |

Default fallback: Level 1 + Level 2 combined (placeholder comments + exported prompts).

### Diagnostic Output

When image generation runs, produce a diagnostic block showing ALL resolution steps:

```
GEMINI INTEGRATION DIAGNOSTIC
━━━━━━━━━━━━━━━━━━━━━━━━━
Resolution steps attempted:
  1. Config override: [checked/skipped] — [result]
  2. Known alias scan: [checked] — [matched: tool_name / no match] — [N aliases checked]
  3. Custom alias scan: [checked/no custom aliases] — [result]
  4. Pattern match: [checked] — [matched: tool_name / no match]
  5. Project .mcp.json: [found/not found] — [gemini config: yes/no]
  6. Global config: [found/not found] — [gemini config: yes/no]

Resolved tool: [resolved_image_tool or "none — all strategies failed"]
Detection method: [config-override / known-alias / custom-alias / pattern-match / project-mcp / global-mcp / none]
Tool available: [yes / no]
Image generation: [succeeded / failed / skipped]
Images generated: [N of M planned]
Failure reason: [none / no compatible tool found / generation error / ...]
━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Image Generation

### Gemini Image Generation
- enabled: true
- tool: mcp__gemini__gemini-generate-image
- min_images_per_article: 4
- max_images_per_article: 6
- fallback: placeholder comments + exported prompts
- output_folder: images/
- naming_convention: article-{slug}-{N}.png
- image_fallback_behavior: __PLACEHOLDER__

### Image Output Location

Images are always saved relative to the CURRENT project root:
- Path: `{current_working_directory}/images/`
- Never hardcode to a specific absolute path
- Create the `images/` folder if it doesn't exist
- The Gemini MCP tool saves to its own output directory; the skill must COPY images from the MCP output path to the project's `images/` folder
- MCP output path is returned in the tool response — parse it dynamically, never assume a fixed path

### Image Style
- style: professional, modern, editorial
- no_text_overlay: true
- hero_aspect_ratio: 16:9
- inline_aspect_ratio: 4:3
- preferred_aspect_ratios: __PLACEHOLDER__

### Image Planning
- image_prompt_template: __PLACEHOLDER__
- output_image_folder: __PLACEHOLDER__
- image_naming_convention: __PLACEHOLDER__
- require_variety_check: true
- min_image_roles: [hero, contextual, supporting]
- image_types: [hero, contextual, atmospheric, infographic-like, supporting]

### Image Quality Rules
- no_repetitive_compositions: true
- no_generic_filler: true
- must_match_topic_domain: true
- must_fit_article_tone: true
- regenerate_weak_images: true
- max_regeneration_attempts: 2

## Table of Contents

### Sidebar TOC
- auto_generate: true
- min_sections_for_toc: 5
- placement: two-column layout — sidebar beside article content
- desktop_behavior: sticky sidebar
- mobile_behavior: collapsible inline block at top of article
- active_state_tracking: true (IntersectionObserver)
- smooth_scroll: true
- skip_hero: true

## Trust Layer

### Required Elements (minimum 4 per article)
- reading_time_indicator: true
- progress_bar: true
- author_box: true
- key_takeaways: true
- source_citations_block: true
- share_buttons: true
- last_updated_date: true
- expert_quote_callout: true

### Author Defaults
- author_name: __PLACEHOLDER__
- author_title: __PLACEHOLDER__
- author_avatar: __PLACEHOLDER__

## Section Editing

### Edit UI Configuration
- edit_ui_mode: __PLACEHOLDER__
- edit_ui_enabled: true
- edit_trigger_position: top-right
- edit_trigger_visibility: hover
- edit_overlay_style: modal

### Edit Prompt Configuration
- edit_prompt_template_override: __PLACEHOLDER__
- section_id_strategy: __PLACEHOLDER__
- section_metadata_output_format: __PLACEHOLDER__
- section_edit_scope_rules: __PLACEHOLDER__

### Section ID Rules
- pattern: section-{N}
- stability: IDs persist across edits unless sections are added/removed
- required_attributes: [data-section-id, data-section-type, data-section-role, data-section-heading, data-section-purpose]

### Edit Scope Defaults
- default_scope: section-local
- allow_toc_update: true
- allow_neighbor_adjustment: true (minimal only)
- require_explicit_scope_report: true

## Writing Samples

### Sample Detection
- auto_detect_directories: [files/, content/, posts/, articles/, docs/]
- supported_formats: [.docx, .pdf, .md, .txt]
- max_samples: 5
- fallback: infer style from website analysis

### Style Overrides
- style_rules_override: __PLACEHOLDER__
- forced_tone: none

## Banned Phrases
- list_file: config/banned-patterns.md

## Output Settings
- output_folder: . (project root)
- filename_convention: article-{slug}.html
- article_format: standalone HTML with detected or fallback shell

## Research Settings
- preferred_sources: __PLACEHOLDER__
- blocked_sources: __PLACEHOLDER__
- evidence_threshold: minimum 3 facts per article (aim for 8-10)
- citation_behavior: inline attribution
- max_research_rounds: 6

## Performance Limits
- max_article_ideas: 5
- max_research_rounds: 6
- max_writing_samples: 5
- min_components_per_article: 8
- min_trust_elements: 4
- min_images: 4
- max_images: 6
- reuse_project_analysis: true

## Validation Rules

### Section ID Stability Check
- verify_stable_ids: true
- id_pattern: section-{N}
- required_data_attributes: [data-section-id, data-section-type, data-section-role, data-blueprint]

### Section Edit Scope Check
- verify_scope_limit: true
- max_unintended_changes: 0

### Edit Prompt Quality Check
- verify_prompt_structure: true
- required_fields: [section_id, section_type, section_role, topic, user_instruction]

### Multi-Image Quality Check
- verify_image_count: true
- verify_non_repetitive: true
- verify_topic_relevance: true

### Image-Section Match Check
- verify_image_section_fit: true

### Professional UI Check
- verify_edit_ui_integration: true
- verify_no_design_breakage: true

### Gemini Portability Check
- verify_no_hardcoded_paths: true
- verify_no_single_tool_name_dependency: true
- verify_alias_resolution: true
- verify_resolver_chain_before_fallback: true
- verify_normalized_interface_usage: true
- verify_runtime_tool_detection: true
- verify_fallback_behavior: true
- verify_project_independence: true
- verify_diagnostic_output: true

## Design Token Fallback Defaults

When the project doesn't provide design tokens, use these neutral professional defaults:

```
color_primary: #2563EB
color_secondary: #1E293B
color_accent: #3B82F6
color_text: #1E293B
color_primary_hover: #1D4ED8
color_text_muted: #64748B
color_text_light: #94A3B8
color_background: #FFFFFF
color_card_bg: #F8FAFC
color_muted_bg: #F1F5F9
color_border: #E2E8F0
font_heading: Inter, sans-serif
font_body: Inter, sans-serif
font_cdn_url: https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap
radius_card: 12px
radius_button: 8px
shadow_card: 0 4px 12px rgba(0,0,0,0.08)
container_width: 1200px
container_padding: 24px
```

These defaults are neutral, modern, and broadly professional. They are overridden by any detected project tokens.

---

## First-Time Setup Gate

### Setup Status Tracking
- status_file: config/.setup-status.json
- first_run_check: true
- re_trigger_phrases: ["configure gemini", "setup gemini", "reconfigure article engine"]
- setup_gate_position: Step 0 (before pipeline)

### Setup Behavior
- on_first_run: prompt user for Gemini MCP configuration
- on_skip: proceed with fallback mode (web search + image placeholders)
- on_configure: write Gemini MCP to ~/.claude.json, require restart
- on_re_trigger: re-run setup regardless of existing status
- setup_file_location: config/.setup-status.json (relative to plugin root — resolve at runtime from the skill file location)

---

## Public Usage Guide

### For users installing this skill in their own project:

**First-time setup:** The first time you use the article engine, it will guide you through configuring Gemini MCP interactively. You can provide your API key or skip to use fallback mode.

**To enable Gemini image generation:**

1. **Easiest method (automatic):** Just run the article engine — it will prompt you on first use.

2. **Manual method:** Configure a Gemini MCP server in your project's `.mcp.json`:
   ```json
   {
     "mcpServers": {
       "gemini": {
         "command": "npx",
         "args": ["-y", "@rlabs-inc/gemini-mcp"],
         "env": { "GEMINI_API_KEY": "your-key-here" }
       }
     }
   }
   ```

3. **Or** configure it globally in `~/.claude/.mcp.json` so it's available in all projects.

4. **Or** set the `GEMINI_API_KEY` environment variable and configure the MCP server command.

**If Gemini is not configured:** The skill still works. Articles generate normally with image placeholders, and the image prompts are exported so you can generate images with any tool.

**The skill does NOT depend on one exact tool name.** It uses a flexible resolver that checks multiple known Gemini tool names, aliases, and namespace patterns. Whether your MCP exposes the tool as `mcp__gemini__gemini-generate-image`, `mcp__gemini__generate-image`, or any other compatible name, the skill will find and use it.

**Custom tool names:** If your Gemini MCP uses a non-standard tool name, add it to `gemini_tool_resolution.allowed_image_tool_aliases` in `config/engine-config.md`.

**Diagnostic output:** Every article delivery report includes a Gemini integration diagnostic showing exactly which resolution steps were tried and how the tool was detected (or why it wasn't). This makes troubleshooting easy.
