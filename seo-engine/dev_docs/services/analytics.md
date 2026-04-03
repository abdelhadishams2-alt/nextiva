# Analytics Service

> **Type:** New (gap #4)
> **Priority:** P1 — Tier 2 (Week 5-6)
> **Owner:** Solo developer
> **Dependencies:** Auth & Bridge, Dashboard API, Supabase

---

## 1. Overview

The Analytics service collects, stores, and queries metrics about article generation, user activity, error rates, and system health. It feeds the dashboard analytics panel with charts and KPIs.

**Design decision:** Analytics is event-driven — pipeline stages emit events to a Supabase table, and the dashboard queries aggregated views. No separate analytics server; all queries run through the Dashboard API.

---

## 2. Business Context

Enterprise publishers need visibility into their content pipeline — how many articles generated, success/failure rates, which topics perform best, usage by team member.

**Business rules:**
1. Every pipeline stage emits an analytics event (start, complete, error)
2. Events are append-only — never update or delete historical data
3. Aggregations are computed at query time (no pre-aggregation in Phase 1)
4. Usage metrics respect user's subscription plan quotas
5. Error tracking includes full error context (stage, message, stack trace summary)
6. Analytics data retained for 90 days (configurable per plan)
7. All timestamps in UTC; dashboard converts to user's timezone
8. Rate of generation = articles per day/week/month by user

---

## 3. Data Model

### analytics_events (new Supabase table)
```sql
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    event_type VARCHAR(50) NOT NULL,      -- generation_started, generation_completed, generation_failed,
                                           -- edit_started, edit_completed, edit_failed,
                                           -- login, signup, config_changed
    event_data JSONB DEFAULT '{}',         -- flexible payload per event type
    article_id UUID,                       -- nullable, only for article-related events
    session_id VARCHAR(100),               -- correlate events within a generation session
    duration_ms INTEGER,                   -- for timed events (generation, edit)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_user_time ON analytics_events(user_id, created_at DESC);
CREATE INDEX idx_analytics_type_time ON analytics_events(event_type, created_at DESC);
CREATE INDEX idx_analytics_article ON analytics_events(article_id) WHERE article_id IS NOT NULL;

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own events" ON analytics_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System insert events" ON analytics_events FOR INSERT WITH CHECK (true);
```

---

## 4. Event Types

| Event | Trigger | Payload |
|-------|---------|---------|
| `generation_started` | Pipeline begins | `{ topic, language, framework }` |
| `generation_completed` | Draft writer finishes | `{ word_count, image_count, component_count, duration_ms }` |
| `generation_failed` | Any pipeline stage errors | `{ stage, error_message, error_code }` |
| `edit_started` | User clicks edit on section | `{ article_id, section_id }` |
| `edit_completed` | Claude CLI finishes edit | `{ article_id, section_id, duration_ms, word_count_delta }` |
| `edit_failed` | Edit subprocess error | `{ article_id, section_id, error_message }` |
| `login` | User authenticates | `{ method }` |
| `signup` | New user registers | `{ plan }` |
| `config_changed` | Admin updates config | `{ changed_fields }` |

---

## 5. API Endpoints (via Dashboard API)

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/analytics/overview` | Bearer | Total articles, success rate, avg generation time, active users |
| GET | `/api/analytics/generation` | Bearer | Generation stats grouped by day/week/month |
| GET | `/api/analytics/errors` | Bearer | Error breakdown by type, stage, frequency |
| GET | `/api/analytics/usage` | Bearer + Admin | Usage by user, plan utilization, quota status |
| GET | `/api/analytics/trends` | Bearer | Topic trends, language distribution, framework distribution |

### Query Parameters
- `period`: `7d`, `30d`, `90d` (default: `30d`)
- `group_by`: `day`, `week`, `month` (default: `day`)
- `user_id`: filter by specific user (admin only)

---

## 6. Dashboard Metrics (KPIs)

| Metric | Calculation | Display |
|--------|-------------|---------|
| Total Articles | COUNT(generation_completed) | Number |
| Success Rate | completed / (completed + failed) * 100 | Percentage |
| Avg Generation Time | AVG(duration_ms) WHERE type = generation_completed | Duration |
| Active Users (7d) | COUNT(DISTINCT user_id) WHERE created_at > now() - 7d | Number |
| Error Rate (24h) | failed / total * 100 WHERE created_at > now() - 24h | Percentage |
| Edits Per Article | COUNT(edit_completed) / COUNT(DISTINCT article_id) | Ratio |
| Top Languages | GROUP BY language, ORDER BY count DESC, LIMIT 5 | Bar chart |
| Top Frameworks | GROUP BY framework, ORDER BY count DESC, LIMIT 5 | Bar chart |

---

## 7. Error Handling

| Code | Error | Trigger | Recovery |
|------|-------|---------|----------|
| ANA_QUERY_001 | Invalid period | Period param not in allowed list | Use default (30d) |
| ANA_QUERY_002 | Query timeout | Aggregation too slow | Add index, reduce period |
| ANA_EVENT_001 | Event write failed | Supabase insert error | Log to stderr, continue (non-blocking) |
| ANA_PERM_001 | Unauthorized usage query | Non-admin querying other users | Return 403 |

---

## 8. Tasks

| ID | Task | Type | Effort | Tier |
|----|------|------|--------|------|
| T2-08 | Analytics dashboard (backend + UI) | new | 2d | 2 |
| T2-16 | Structured logging (feeds analytics) | gap | 1d | 2 |
