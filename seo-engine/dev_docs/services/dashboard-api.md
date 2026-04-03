# Dashboard API Service

> **Type:** New (gap #1)
> **Priority:** P1 — Tier 2 (Week 3-6)
> **Owner:** Solo developer
> **Dependencies:** Auth & Bridge (existing), Supabase

---

## 1. Overview

The Dashboard API provides RESTful endpoints for all dashboard operations — article management, user administration, analytics queries, plugin configuration, and pipeline control. It serves as the backend for the ChainIQ dashboard web application.

**Design decision:** The Dashboard API extends the existing bridge server rather than creating a separate service. This maintains the zero-dependency philosophy and avoids running multiple servers.

---

## 2. Business Context

The dashboard is how enterprise publishers interact with ChainIQ beyond the Claude Code plugin. It replaces CLI-only operations with visual management.

**Business rules:**
1. All dashboard endpoints require authentication (no public API)
2. Admin endpoints require service_role verification (same as existing admin pattern)
3. API responses follow consistent envelope: `{ success, data, meta?, message? }`
4. Pagination defaults to 20 items, max 100
5. All list endpoints support search, filter, and sort parameters
6. Rate limiting applies (shared with bridge server limits)
7. Dashboard API is read-heavy — optimize for queries, not writes
8. All timestamps returned in ISO 8601 UTC format

---

## 3. API Endpoints

### Articles
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/articles` | Bearer | List articles (paginated, filterable) |
| GET | `/api/articles/:id` | Bearer | Get article details + version history |
| POST | `/api/articles` | Bearer | Queue new article generation |
| PUT | `/api/articles/:id` | Bearer | Update article metadata |
| DELETE | `/api/articles/:id` | Bearer + Admin | Delete article |
| GET | `/api/articles/:id/versions` | Bearer | List version history |
| POST | `/api/articles/:id/rollback` | Bearer | Rollback to specific version |

### Pipeline
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/pipeline/status` | Bearer | Current pipeline status (idle/running) |
| GET | `/api/pipeline/queue` | Bearer | List queued article requests |
| POST | `/api/pipeline/cancel` | Bearer + Admin | Cancel running generation |
| GET | `/api/pipeline/history` | Bearer | Generation history with outcomes |

### Configuration
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/config` | Bearer + Admin | Get plugin configuration |
| PUT | `/api/config` | Bearer + Admin | Update plugin configuration |
| GET | `/api/config/blueprints` | Bearer | List available component blueprints |
| GET | `/api/config/blueprints/:id` | Bearer | Get blueprint details |

### Analytics (see analytics.md for full spec)
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/analytics/overview` | Bearer | Dashboard overview metrics |
| GET | `/api/analytics/generation` | Bearer | Generation stats over time |
| GET | `/api/analytics/errors` | Bearer | Error rates and types |
| GET | `/api/analytics/usage` | Bearer | Usage by user/plan |

---

## 4. Data Model

### articles (new Supabase table)
```sql
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    framework VARCHAR(50) DEFAULT 'html',
    status VARCHAR(20) DEFAULT 'draft',  -- draft, generating, published, archived
    file_path TEXT,                        -- relative path to generated HTML
    word_count INTEGER,
    image_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',          -- flexible metadata (domain, components used, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- RLS: users see only their own articles; admins see all
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own articles" ON articles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own articles" ON articles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own articles" ON articles FOR UPDATE USING (auth.uid() = user_id);
```

### article_versions (new Supabase table)
```sql
CREATE TABLE article_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    section_edited TEXT,                  -- which section was changed
    content_snapshot TEXT,                -- full HTML at this version
    word_count_delta INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, version_number)
);

ALTER TABLE article_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own versions" ON article_versions FOR SELECT
    USING (article_id IN (SELECT id FROM articles WHERE user_id = auth.uid()));
```

### pipeline_jobs (new Supabase table)
```sql
CREATE TABLE pipeline_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    article_id UUID REFERENCES articles(id),
    topic TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    framework VARCHAR(50) DEFAULT 'html',
    status VARCHAR(20) DEFAULT 'queued',  -- queued, running, completed, failed, cancelled
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pipeline_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own jobs" ON pipeline_jobs FOR SELECT USING (auth.uid() = user_id);
```

---

## 5. Error Handling

| Code | Error | Trigger | Recovery |
|------|-------|---------|----------|
| DASH_AUTH_001 | Unauthorized | Missing/invalid Bearer token | Re-authenticate |
| DASH_AUTH_002 | Forbidden | Non-admin accessing admin endpoint | Use admin account |
| DASH_ART_001 | Article not found | Invalid article ID | Check ID |
| DASH_ART_002 | Article locked | Edit in progress on this article | Wait for edit to complete |
| DASH_PIPE_001 | Pipeline busy | Generation already running | Queue or wait |
| DASH_PIPE_002 | Queue full | Max queued jobs reached | Wait for completion |
| DASH_CFG_001 | Invalid config | Validation failed on config update | Fix input |
| DASH_RATE_001 | Rate limited | Too many requests | Wait, retry with backoff |

---

## 6. Integration Points

- **Auth & Bridge:** Shares authentication middleware and Supabase client
- **Article Pipeline:** Triggers generation via queue; reads pipeline status
- **Analytics:** Writes events on article CRUD operations
- **Universal Engine:** Passes language/framework params to pipeline
- **Supabase:** All persistent data stored via Supabase client SDK

---

## 7. Tasks

| ID | Task | Type | Effort | Tier |
|----|------|------|--------|------|
| T2-01 | Choose dashboard tech stack | new | 2h | 2 |
| T2-02 | Scaffold dashboard app | new | 4h | 2 |
| T2-03 | Build Dashboard API endpoints | new | 2d | 2 |
| T2-09 | Plugin configuration panel API | new | 1d | 2 |
| T3-01 | Article generation queue | new | 2d | 3 |
| T3-02 | Webhook/event system | new | 1d | 3 |
