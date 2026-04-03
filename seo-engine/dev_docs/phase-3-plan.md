# ChainIQ Phase 3 — Dashboard-Plugin Integration Plan

> **Date:** 2026-03-26
> **Prerequisite:** Phase 0-2 complete (composite score 7.5/10, 136 tests)
> **Goal:** Full dashboard control over the plugin — quotas, API keys, framework-aware output, settings sync
> **Estimated Effort:** 4-5 weeks (solo developer)

---

## The Gap Today

| What Exists | What's Missing |
|-------------|----------------|
| Dashboard writes user settings to memory (per-session) | Settings don't persist to Supabase or flow to plugin |
| SKILL.md has hardcoded quota (4/day free, unlimited paid) | No dashboard UI to set per-plan limits |
| SKILL.md reads local `.usage.json` for quota | No server-side quota enforcement via Supabase |
| auto-config.js detects framework (Next.js, Vue, etc.) | Pipeline generates HTML-only — doesn't output framework-specific code |
| 3 framework adapters exist (html, react, vue) | Adapters only wrap HTML — don't generate native components (pages, SFCs) |
| Admin can approve/revoke users | No plan-based quota management, no API key management |
| Bridge server has `/api/settings` (in-memory) | Settings lost on restart, not linked to Supabase user profile |
| Plugin uses `config/.auth-session.json` for auth | No real-time sync with dashboard subscription changes |

---

## Architecture: How Dashboard Controls Plugin

```
┌─────────────────────────────────────────────────────────┐
│                    DASHBOARD (Next.js)                    │
│                                                           │
│  Admin Panel          User Settings       Generation UI   │
│  ┌──────────┐        ┌──────────┐        ┌──────────┐   │
│  │ Quotas   │        │ Language │        │ New      │   │
│  │ API Keys │        │ Framework│        │ Article  │   │
│  │ Plans    │        │ Theme    │        │ Topic    │   │
│  └────┬─────┘        └────┬─────┘        └────┬─────┘   │
│       │                   │                   │           │
└───────┼───────────────────┼───────────────────┼───────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│              BRIDGE SERVER (localhost:19847)              │
│                                                           │
│  NEW ENDPOINTS:                                           │
│  ├── PUT /api/admin/plans/:userId    (set plan + quotas) │
│  ├── GET/PUT /api/admin/api-keys     (manage API keys)   │
│  ├── GET /api/quota                  (check user quota)  │
│  ├── PUT /api/settings (persisted)   (save to Supabase)  │
│  ├── GET /api/project-config         (auto-detected)     │
│  └── POST /api/generate              (trigger pipeline)  │
│                                                           │
│  SETTINGS SYNC SERVICE:                                   │
│  ├── Reads user prefs from Supabase on pipeline start    │
│  ├── Merges with auto-detected project config            │
│  └── Passes unified config to SKILL.md orchestrator      │
│                                                           │
└───────────────────────────┬───────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 PLUGIN (SKILL.md Pipeline)                │
│                                                           │
│  Step 0.5: Quota Check ──► Bridge /api/quota (NOT local) │
│  Step 5:   Project Analyzer ──► auto-config.js + prefs   │
│  Step 10:  Draft Writer ──► Framework Adapter Router      │
│                              ├── html-adapter (default)   │
│                              ├── react-adapter (JSX/TSX)  │
│                              ├── vue-adapter (SFC)        │
│                              ├── next-adapter (pages/app) │
│                              ├── svelte-adapter (.svelte) │
│                              └── astro-adapter (.astro)   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Work Streams (3 parallel tracks)

### Stream A: Settings Sync & Quota Enforcement
### Stream B: API Key Management & Admin Controls
### Stream C: Framework-Aware Output Engine

---

## Stream A: Settings Sync & Quota Enforcement

**Goal:** User preferences and plan limits flow from dashboard → Supabase → bridge → plugin in real-time.

### A1: Supabase Schema Extensions
**Effort:** 2h | **Priority:** P0

Add columns/tables for persistent settings and quota tracking:

```sql
-- User preferences (persisted, not in-memory)
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_language TEXT DEFAULT 'en',
  preferred_framework TEXT DEFAULT 'auto',  -- 'auto', 'next', 'react', 'vue', 'svelte', 'html'
  preferred_css TEXT DEFAULT 'auto',        -- 'auto', 'tailwind', 'inline', 'css-modules'
  default_domain TEXT,                       -- e.g., 'technology', 'sports'
  rtl_enabled BOOLEAN DEFAULT false,
  image_style TEXT DEFAULT 'realistic',
  max_images INTEGER DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plan-based quotas (admin-configurable per plan)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS articles_per_month INTEGER DEFAULT 4,
  ADD COLUMN IF NOT EXISTS edits_per_day INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_languages INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS allowed_frameworks TEXT[] DEFAULT ARRAY['html'],
  ADD COLUMN IF NOT EXISTS api_keys_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS quota_override JSONB;  -- per-user overrides

-- RLS for user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**Plan defaults:**
| Plan | Articles/Mo | Edits/Day | Languages | Frameworks | API Keys |
|------|-------------|-----------|-----------|------------|----------|
| free | 4 | 5 | 1 (en) | html only | No |
| starter | 50 | 30 | 3 | html, react, vue | No |
| professional | 200 | unlimited | 11 (all) | all | Yes |
| enterprise | unlimited | unlimited | 11 (all) | all + custom | Yes |

### A2: Bridge Server — Settings Persistence
**Effort:** 4h | **Priority:** P0

Replace in-memory `/api/settings` with Supabase-backed persistence:

**Modified endpoints:**
- `GET /api/settings` — read from `user_settings` table (create default row if missing)
- `PUT /api/settings` — write to `user_settings` table, validate against plan limits

**New endpoints:**
- `GET /api/quota` — return current usage vs. plan limits:
  ```json
  {
    "success": true,
    "data": {
      "plan": "starter",
      "articles": { "used": 12, "limit": 50, "remaining": 38 },
      "edits_today": { "used": 3, "limit": 30, "remaining": 27 },
      "languages": { "allowed": ["en", "ar", "fr"], "limit": 3 },
      "frameworks": { "allowed": ["html", "react", "vue"] }
    }
  }
  ```

**New supabase-client.js functions:**
- `getUserSettings(userId)` — read from `user_settings`
- `upsertUserSettings(userId, settings)` — upsert with validation
- `getUserQuota(userId)` — compute used/remaining from `usage_logs` + `subscriptions`
- `checkQuota(userId, action)` — returns `{ allowed: bool, reason: string }`

### A3: Plugin Quota Integration
**Effort:** 3h | **Priority:** P0

Replace SKILL.md's local `.usage.json` quota with server-side enforcement:

**Changes to SKILL.md Step 0.5:**
```
OLD: Read config/.usage.json → check count >= 4
NEW: Call bridge GET /api/quota → check articles.remaining > 0
     If bridge unavailable → fall back to local .usage.json (offline mode)
```

**Changes to SKILL.md Step 5 (Project Analyzer):**
```
OLD: auto-config.js detects framework → config object
NEW: auto-config.js detects framework → MERGE with user_settings from bridge
     User preference overrides auto-detection (e.g., user says "always React" → use React even in Vue project)
     If preferred_framework = 'auto' → use auto-detected value
```

### A4: Dashboard — Settings UI Enhancement
**Effort:** 4h | **Priority:** P1

Enhance the existing settings page with persistent preferences:

**New settings sections:**
1. **Generation Preferences** — preferred language, framework, CSS, image count, image style
2. **Quota Usage** — visual progress bars (articles used/limit, edits used/limit)
3. **Project Detection Override** — "Always use [framework]" toggle vs. auto-detect

**New dashboard component:** `QuotaCard` — shows plan limits with progress bars, "Upgrade" CTA for free/starter users.

### A5: Dashboard — Admin Quota Management
**Effort:** 4h | **Priority:** P1

Add to admin panel:
1. **Per-user quota override** — admin can give specific users custom limits
2. **Plan editor** — modify default limits for each plan tier
3. **Usage analytics** — which users are hitting limits, generation trends

**New admin endpoints:**
- `PUT /api/admin/plans/:userId` — set plan + custom quotas
- `GET /api/admin/quota-stats` — aggregate quota usage across all users

---

## Stream B: API Key Management & Admin Controls

**Goal:** Admins manage API keys (Gemini, Supabase) from the dashboard. Users never see raw keys.

### B1: Supabase Schema — API Keys
**Effort:** 1h | **Priority:** P0

```sql
-- Encrypted API key storage
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_name TEXT NOT NULL,              -- 'gemini', 'custom_llm', etc.
  key_value_encrypted TEXT NOT NULL,    -- AES-256 encrypted
  key_hint TEXT,                        -- last 4 chars for display
  scope TEXT DEFAULT 'global',          -- 'global' or user_id
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only admins can access API keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins only" ON public.api_keys
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = auth.uid() AND role = 'admin')
  );
```

### B2: Bridge Server — Key Management
**Effort:** 6h | **Priority:** P0

**New module:** `bridge/key-manager.js`
- Encrypts keys using `crypto.createCipheriv` with AES-256-GCM
- Encryption key derived from `BRIDGE_ENCRYPTION_KEY` env var (or auto-generated on first run)
- Never returns full key values — only hints (`****abcd`)
- Injects active keys into environment before spawning Claude CLI subprocess

**New endpoints:**
- `GET /api/admin/api-keys` — list keys (name + hint only, never values)
- `POST /api/admin/api-keys` — add new key (admin only)
- `PUT /api/admin/api-keys/:id` — rotate key (admin only)
- `DELETE /api/admin/api-keys/:id` — revoke key (admin only)
- `POST /api/admin/api-keys/:id/test` — test key validity (e.g., ping Gemini API)

**Key types supported:**
| Key Name | Used By | Purpose |
|----------|---------|---------|
| `gemini_api_key` | Research engine, image gen | Gemini MCP access |
| `custom_llm_key` | Future: alternative LLM | Non-Claude LLM access |
| `webhook_signing_key` | Webhook system | HMAC signing |

### B3: Plugin Key Integration
**Effort:** 2h | **Priority:** P1

Before the pipeline starts, bridge server resolves the active Gemini API key:

```
Pipeline Start → Bridge resolves API keys → Sets env vars →
Claude CLI subprocess inherits env → Gemini MCP reads GEMINI_API_KEY
```

No key files on disk. No keys in SKILL.md. Keys flow from Supabase → bridge → env → subprocess.

### B4: Dashboard — API Key Management UI
**Effort:** 4h | **Priority:** P1

New admin page section or dedicated page: `/admin` → "API Keys" tab

**UI components:**
- Key list with masked values (`gemini_api_key: ****a1b2`)
- "Add Key" dialog (key name, value, scope)
- "Rotate" action (enter new value, old one invalidated)
- "Test" button (pings the service to verify key works)
- Status indicator (active/inactive/expired)

---

## Stream C: Framework-Aware Output Engine

**Goal:** When the project is Next.js, generate Next.js pages. When Vue, generate Vue SFCs. Not just HTML wrapped in JSX.

### C1: Framework Adapter Architecture
**Effort:** 2h | **Priority:** P0

Redesign the adapter system from "HTML wrappers" to "native output generators":

```
Current:  draft-writer → HTML → react-adapter wraps in JSX → done
New:      draft-writer → structural blueprint → framework router → native output
```

**New module:** `engine/framework-router.js`

```javascript
// Maps detected framework to output strategy
const OUTPUT_STRATEGIES = {
  // Next.js App Router
  next: {
    fileExtension: '.tsx',
    outputPath: 'app/articles/[slug]/page.tsx',
    wrapper: 'NextPageWrapper',
    imports: ['next/image', 'next/link'],
    cssStrategy: 'tailwind',  // or css-modules based on project
    imageComponent: 'next/image',
    features: ['metadata', 'generateStaticParams', 'server-component']
  },

  // Vue 3 SFC
  vue: {
    fileExtension: '.vue',
    outputPath: 'src/views/ArticlePage.vue',
    wrapper: 'VueSFCWrapper',
    imports: [],
    cssStrategy: 'scoped',
    imageComponent: 'img',
    features: ['script-setup', 'scoped-css', 'defineProps']
  },

  // Svelte
  svelte: {
    fileExtension: '.svelte',
    outputPath: 'src/routes/articles/[slug]/+page.svelte',
    wrapper: 'SveltePageWrapper',
    imports: [],
    cssStrategy: 'scoped',
    imageComponent: 'img',
    features: ['load-function', 'scoped-css']
  },

  // Astro
  astro: {
    fileExtension: '.astro',
    outputPath: 'src/pages/articles/[slug].astro',
    wrapper: 'AstroPageWrapper',
    imports: [],
    cssStrategy: 'scoped',
    imageComponent: 'Image',
    features: ['frontmatter', 'island-architecture']
  },

  // WordPress
  wordpress: {
    fileExtension: '.php',
    outputPath: 'wp-content/themes/[theme]/template-article.php',
    wrapper: 'WordPressTemplate',
    imports: [],
    cssStrategy: 'inline',
    imageComponent: 'img',
    features: ['wp-functions', 'the-content', 'custom-fields']
  },

  // Plain HTML (default — current behavior)
  html: {
    fileExtension: '.html',
    outputPath: 'articles/[slug].html',
    wrapper: 'StandaloneHTML',
    imports: [],
    cssStrategy: 'inline',
    imageComponent: 'img',
    features: ['standalone', 'inline-css', 'inline-js']
  }
};
```

### C2: Next.js Adapter (Native)
**Effort:** 1d | **Priority:** P0

Generate actual Next.js App Router pages:

**Output structure:**
```
app/articles/[slug]/
├── page.tsx          # Server component with article content
├── layout.tsx        # Article layout with sidebar TOC
└── opengraph-image.tsx  # Dynamic OG image (optional)
```

**page.tsx template:**
```tsx
// Auto-generated by ChainIQ Article Engine
import Image from 'next/image';
import Link from 'next/link';
import { ArticleTOC } from '@/components/article-toc';
import { EditOverlay } from '@/components/edit-overlay';

export const metadata = {
  title: '{{ARTICLE_TITLE}}',
  description: '{{ARTICLE_DESCRIPTION}}',
};

export default function ArticlePage() {
  return (
    <article className="{{LAYOUT_CLASSES}}">
      <header>
        <h1>{{TITLE}}</h1>
        {{HERO_COMPONENT}}
      </header>
      <div className="{{CONTENT_LAYOUT}}">
        <main>
          {{SECTIONS}}
        </main>
        <aside>
          <ArticleTOC sections={{{TOC_DATA}}} />
        </aside>
      </div>
      <EditOverlay bridgeUrl="{{BRIDGE_URL}}" />
    </article>
  );
}
```

**Key differences from HTML output:**
- Uses `next/image` instead of `<img>` (with width/height/alt)
- Uses `next/link` for internal links
- Exports `metadata` object for SEO
- Components use project's existing design system (Tailwind classes, shadcn/ui if present)
- Edit overlay loaded as client component (`'use client'`)
- CSS via Tailwind classes (if detected) or CSS Modules

### C3: Vue SFC Adapter (Native)
**Effort:** 1d | **Priority:** P1

Generate Vue 3 Single File Components:

```vue
<script setup lang="ts">
// Auto-generated by ChainIQ Article Engine
import { ref } from 'vue';
import ArticleTOC from '@/components/ArticleTOC.vue';

const sections = ref({{TOC_DATA}});
</script>

<template>
  <article class="{{LAYOUT_CLASSES}}">
    <header>
      <h1>{{ title }}</h1>
      {{HERO_TEMPLATE}}
    </header>
    <div class="{{CONTENT_LAYOUT}}">
      <main>
        {{SECTIONS}}
      </main>
      <aside>
        <ArticleTOC :sections="sections" />
      </aside>
    </div>
  </article>
</template>

<style scoped>
{{SCOPED_CSS}}
</style>
```

### C4: Svelte Adapter
**Effort:** 6h | **Priority:** P2

Generate SvelteKit pages with `+page.svelte` + `+page.ts` load function.

### C5: Astro Adapter
**Effort:** 6h | **Priority:** P2

Generate `.astro` pages with frontmatter and island architecture for interactive components.

### C6: WordPress Adapter
**Effort:** 6h | **Priority:** P2

Generate PHP template with WordPress functions (`get_header()`, `the_content()`, custom fields).

### C7: Draft Writer Integration
**Effort:** 4h | **Priority:** P0

Modify the draft-writer agent to use the framework router:

**Changes to `agents/draft-writer.md`:**
1. Accept `PROJECT_CONFIG.framework` as input
2. Call `framework-router.js` to get output strategy
3. Generate content using framework-specific templates
4. Output file with correct extension and path
5. Include framework-specific edit overlay (client component for Next.js, vanilla JS for HTML)

**Decision logic in SKILL.md Step 17:**
```
1. Read PROJECT_CONFIG.adapterFramework (from auto-config + user prefs)
2. If 'next' → dispatch draft-writer with next-adapter instructions
3. If 'vue' → dispatch draft-writer with vue-adapter instructions
4. If 'html' → dispatch draft-writer with html-adapter (current default)
5. Generate supporting files (layout, components) alongside main page
```

### C8: Auto-Config Enhancement
**Effort:** 3h | **Priority:** P1

Enhance `engine/auto-config.js` to detect more context:

**New detections:**
- Next.js App Router vs Pages Router (check for `app/` dir vs `pages/` dir)
- Nuxt 3 vs Nuxt 2 (check `nuxt.config.ts` vs `nuxt.config.js` + dependencies)
- Component library in use (shadcn/ui, Vuetify, Material UI, Chakra)
- Existing article/blog patterns (scan for `blog/`, `articles/`, `posts/` directories)
- TypeScript strictness (read `tsconfig.json` → `strict: true`)
- Image handling (next/image configured? lazy loading? WebP?)

**New output fields:**
```javascript
config.routerType = 'app';           // 'app' | 'pages' | null
config.componentLibrary = 'shadcn';  // 'shadcn' | 'vuetify' | 'material-ui' | null
config.existingBlogPattern = 'app/blog/[slug]/page.tsx';  // detected pattern
config.typescript = { enabled: true, strict: true };
config.imageStrategy = 'next-image'; // 'next-image' | 'lazy-img' | 'standard'
```

---

## Stream D: Dashboard Generation Trigger

**Goal:** "New Article" button in dashboard triggers the full pipeline and shows results.

### D1: Generation Trigger API
**Effort:** 4h | **Priority:** P1

**Enhanced endpoint:** `POST /api/generate`

```json
// Request
{
  "topic": "AI in Modern Football Scouting",
  "language": "en",
  "framework": "auto",     // or explicit: "next", "vue", etc.
  "image_count": 5,
  "domain_hint": "sports",
  "project_dir": "/path/to/project"  // optional override
}

// Response (immediate — job queued)
{
  "success": true,
  "data": {
    "job_id": "uuid",
    "status": "queued",
    "estimated_time": "12-20 minutes"
  }
}
```

The endpoint:
1. Validates quota (`checkQuota(userId, 'generate')`)
2. Resolves API keys from key manager
3. Merges user settings + auto-config + request overrides
4. Enqueues job via JobQueue
5. JobQueue spawns Claude CLI with full config as environment

### D2: Generation Progress SSE
**Effort:** 3h | **Priority:** P1

Enhance existing `GET /api/queue/job/:id/progress` SSE endpoint:

```
event: progress
data: {"step": 5, "total": 22, "phase": "Analyzing project design system", "percent": 23}

event: progress
data: {"step": 9, "total": 22, "phase": "Researching topic — this may take a few minutes", "percent": 41}

event: complete
data: {"article_id": "uuid", "file_path": "app/articles/ai-football-scouting/page.tsx", "word_count": 2847}
```

### D3: Dashboard — Generation UI
**Effort:** 6h | **Priority:** P1

New page or modal: "Generate Article"

**UI flow:**
1. Topic input (text field)
2. Language selector (dropdown — 11 languages)
3. Framework selector (auto-detect / manual override)
4. Image count slider (1-6)
5. "Generate" button → shows progress with SSE updates
6. On complete → navigates to article detail page

**Components:**
- `GenerateArticleDialog` — modal with form
- `GenerationProgress` — step-by-step progress with animated phases
- `ArticlePreview` — iframe or rendered preview of generated article

---

## Implementation Order

```
Week 1: Foundation
├── A1: Schema extensions (2h)
├── A2: Bridge settings persistence (4h)
├── B1: API keys schema (1h)
├── B2: Key manager module (6h)
└── Tests for all new modules

Week 2: Core Integration
├── A3: Plugin quota integration (3h)
├── B3: Plugin key integration (2h)
├── C1: Framework router architecture (2h)
├── C7: Draft writer integration (4h)
└── Tests for pipeline changes

Week 3: Framework Adapters
├── C2: Next.js adapter — native (1d)
├── C3: Vue SFC adapter — native (1d)
├── C8: Auto-config enhancement (3h)
└── Tests for adapter output

Week 4: Dashboard UI
├── A4: Settings UI enhancement (4h)
├── A5: Admin quota management (4h)
├── B4: API key management UI (4h)
├── D1: Generation trigger API (4h)
├── D3: Generation UI (6h)
└── Integration tests

Week 5: Polish & Edge Cases
├── C4: Svelte adapter (6h)
├── C5: Astro adapter (6h)
├── C6: WordPress adapter (6h)
├── D2: Generation progress SSE (3h)
└── End-to-end testing
```

---

## New Files Created

| File | Purpose |
|------|---------|
| `bridge/key-manager.js` | AES-256 key encryption/decryption, key resolution |
| `engine/framework-router.js` | Maps framework → output strategy + templates |
| `engine/adapters/next-adapter.js` | Next.js App Router page generation |
| `engine/adapters/vue-adapter.js` | Vue 3 SFC generation |
| `engine/adapters/svelte-adapter.js` | SvelteKit page generation |
| `engine/adapters/astro-adapter.js` | Astro page generation |
| `engine/adapters/wordpress-adapter.js` | WordPress template generation |
| `dashboard/src/app/(dashboard)/generate/page.tsx` | Article generation UI |
| `dashboard/src/components/quota-card.tsx` | Quota usage visualization |
| `dashboard/src/components/api-key-manager.tsx` | API key CRUD UI |
| `dashboard/src/components/generation-progress.tsx` | Real-time pipeline progress |
| `migrations/003-user-settings.sql` | user_settings table + subscription quota columns |
| `migrations/004-api-keys.sql` | api_keys table |
| `tests/key-manager.test.js` | Key encryption tests |
| `tests/framework-router.test.js` | Framework routing tests |
| `tests/quota.test.js` | Server-side quota enforcement tests |

---

## Modified Files

| File | Changes |
|------|---------|
| `bridge/server.js` | New endpoints: `/api/quota`, `/api/admin/api-keys`, `/api/admin/plans`, `/api/generate` |
| `bridge/supabase-client.js` | New functions: `getUserSettings`, `upsertUserSettings`, `getUserQuota`, `checkQuota` |
| `engine/auto-config.js` | Detect router type, component library, blog patterns, TS strictness |
| `skills/article-engine/SKILL.md` | Step 0.5: server-side quota. Step 5: merge user prefs. Step 17: framework router |
| `agents/draft-writer.md` | Accept framework config, dispatch to correct adapter |
| `dashboard/src/app/(dashboard)/settings/page.tsx` | Persistent preferences, quota display |
| `dashboard/src/app/(dashboard)/admin/page.tsx` | Quota management, API key tab |
| `dashboard/src/lib/api.ts` | New API functions for quota, keys, generation |
| `supabase-setup.sql` | Add user_settings table, subscription quota columns, api_keys table |

---

## Security Considerations

1. **API keys encrypted at rest** — AES-256-GCM, key from env var, never logged
2. **Keys never returned in full** — only hints (`****abcd`) via API
3. **Quota enforcement server-side** — local `.usage.json` is fallback only
4. **Framework adapter output sanitized** — no user input in generated code without escaping
5. **Admin-only endpoints** — role check on all `/api/admin/*` routes
6. **Key rotation** — old keys immediately invalidated on rotate

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Admin sets quota from dashboard → plugin enforces it | Working |
| Admin adds Gemini API key → pipeline uses it without disk files | Working |
| Next.js project → generates `.tsx` page with `next/image` | Working |
| Vue project → generates `.vue` SFC with scoped CSS | Working |
| User hits quota limit → dashboard shows upgrade CTA | Working |
| Settings persist across server restarts | Working |
| "Generate Article" button → pipeline runs → article appears in list | Working |
| All new code has tests | 100% coverage on new modules |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Framework adapters produce invalid code | Template-based generation + AST validation tests |
| Key encryption introduces complexity | Use Node.js built-in `crypto` only — no new deps |
| Quota race conditions (concurrent requests) | Supabase `SELECT ... FOR UPDATE` on quota check |
| Large schema migration breaks existing data | Versioned migrations with `IF NOT EXISTS` + rollback SQL |
| Plugin offline (no bridge access) | Graceful fallback to local `.usage.json` and HTML output |
