# Admin & User Management Service

> **Type:** New (gap #11)
> **Priority:** P1 — Tier 2 (Week 3-4)
> **Owner:** Solo developer
> **Dependencies:** Auth & Bridge (existing), Supabase, Dashboard API

---

## 1. Overview

The Admin & User Management service provides user lifecycle management, subscription administration, and access control through the dashboard. It extends the existing bridge server admin endpoints with full CRUD, approval workflows, and subscription plan management.

**Design decision:** Builds on the existing `/admin/*` endpoints in the bridge server. The dashboard provides the UI; the backend reuses and extends the existing Supabase admin pattern (service_role key for privileged operations).

---

## 2. Business Context

ChainIQ is a B2B SaaS product. Publishers sign up, get approved by admins, and receive access based on their subscription tier. Admins need to manage the full user lifecycle without touching the database directly.

**Business rules:**
1. New users start in `pending` status — admin must approve before they can generate articles
2. Subscription plans define quotas: articles/month, edits/month, languages, frameworks
3. Admins can approve, revoke, upgrade, downgrade, or delete users
4. Revoking a user preserves their data but blocks API access
5. Deleting a user removes their data (GDPR compliance — also delete usage_logs)
6. Admin actions are logged to analytics_events for audit trail
7. Only users with `is_admin: true` in Supabase auth metadata can access admin endpoints
8. Self-service signup is open; admin approval is required for activation
9. Plan changes take effect immediately (no billing cycle concept in Phase 1)

---

## 3. Existing Admin Endpoints (bridge server)

| Endpoint | Current Capability | Enhancement Needed |
|----------|-------------------|-------------------|
| `GET /admin/users` | Lists users with subscriptions | Add pagination, search, filter by status/plan |
| `POST /admin/approve` | Approves user subscription | Add plan selection, quota setting |
| `POST /admin/revoke` | Revokes user access | Add reason field, notification |
| `DELETE /admin/delete` | Deletes user | Add GDPR cleanup (usage_logs, articles, analytics) |
| `GET /admin/usage` | Gets usage logs | Add date range filter, export |

---

## 4. New API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/users` | Admin | List users with pagination, search, filter |
| GET | `/api/users/:id` | Admin | Get user details with subscription + usage |
| PUT | `/api/users/:id` | Admin | Update user metadata |
| POST | `/api/users/:id/approve` | Admin | Approve with plan selection |
| POST | `/api/users/:id/revoke` | Admin | Revoke with reason |
| POST | `/api/users/:id/upgrade` | Admin | Change subscription plan |
| DELETE | `/api/users/:id` | Admin | Delete user + GDPR cleanup |
| GET | `/api/plans` | Bearer | List available subscription plans |
| GET | `/api/users/:id/quota` | Bearer | Check remaining quota |

---

## 5. Data Model

### Subscription Plans (configuration, not table)
```javascript
const PLANS = {
    starter: {
        name: 'Starter',
        price: 3000,  // $3K/mo
        articles_per_month: 50,
        edits_per_month: 200,
        languages: ['en'],
        frameworks: ['html'],
        max_images_per_article: 4
    },
    professional: {
        name: 'Professional',
        price: 6000,  // $6K/mo
        articles_per_month: 200,
        edits_per_month: 1000,
        languages: ['en', 'ar', 'he', 'fr', 'es'],
        frameworks: ['html', 'react', 'vue'],
        max_images_per_article: 6
    },
    enterprise: {
        name: 'Enterprise',
        price: 12000,  // $12K/mo
        articles_per_month: -1,  // unlimited
        edits_per_month: -1,     // unlimited
        languages: '*',          // all supported
        frameworks: '*',         // all supported
        max_images_per_article: 8
    }
};
```

### subscriptions table (existing, extend)
```sql
-- Existing columns: id, user_id, plan, status, approved_by, created_at
-- Add columns:
ALTER TABLE subscriptions ADD COLUMN revoked_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN revoke_reason TEXT;
ALTER TABLE subscriptions ADD COLUMN quota_override JSONB;  -- per-user quota overrides
ALTER TABLE subscriptions ADD COLUMN plan_changed_at TIMESTAMPTZ;
```

---

## 6. User Lifecycle

```
Signup (pending) ──► Admin Approval (active) ──► Normal Use
                         │                            │
                         │                     Quota Exceeded
                         │                            │
                         ▼                            ▼
                    Rejected              Upgrade / Wait for Reset
                         │
                         ▼
                 Revoked (suspended) ──► Re-approval possible
                         │
                         ▼
                 Deleted (GDPR cleanup)
```

### Status States
| Status | Can Generate | Can Edit | Can Login | Data Retained |
|--------|-------------|----------|-----------|---------------|
| pending | No | No | Yes | Yes |
| active | Yes | Yes | Yes | Yes |
| revoked | No | No | Yes | Yes |
| deleted | N/A | N/A | No | No |

---

## 7. GDPR Compliance (User Deletion)

When an admin deletes a user, the following cleanup must occur:
1. Delete from `auth.users` (Supabase admin API)
2. Delete from `subscriptions` (CASCADE or manual)
3. Delete from `usage_logs` (currently missing — identified in audit)
4. Delete from `articles` (new table)
5. Delete from `article_versions` (CASCADE from articles)
6. Delete from `analytics_events` (new table)
7. Log deletion event to admin audit trail (separate from user's analytics)

---

## 8. Role Access Matrix

| Action | Regular User | Admin |
|--------|-------------|-------|
| View own profile | Y | Y |
| Check own quota | Y | Y |
| List all users | N | Y |
| View any user's details | N | Y |
| Approve users | N | Y |
| Revoke users | N | Y |
| Change plans | N | Y |
| Delete users | N | Y |
| View usage logs | Own only | All |

---

## 9. Error Handling

| Code | Error | Trigger | Recovery |
|------|-------|---------|----------|
| ADM_AUTH_001 | Not admin | Non-admin accessing admin endpoint | Use admin account |
| ADM_USER_001 | User not found | Invalid user_id | Check ID |
| ADM_USER_002 | Already approved | Approving an active user | No action needed |
| ADM_USER_003 | Already revoked | Revoking a revoked user | No action needed |
| ADM_PLAN_001 | Invalid plan | Plan slug not in PLANS | Use valid plan name |
| ADM_QUOTA_001 | Quota exceeded | User hit monthly limit | Upgrade plan or wait |
| ADM_DEL_001 | Deletion failed | Supabase admin API error | Retry or manual cleanup |

---

## 10. Onboarding Wizard (T2-10)

First-time admin experience:
1. **Welcome** — explain ChainIQ dashboard capabilities
2. **API Keys** — enter/confirm Supabase URL and keys
3. **First User** — approve self or invite first team member
4. **Test Generation** — generate a sample article to verify pipeline
5. **Done** — redirect to dashboard home

---

## 11. Tasks

| ID | Task | Type | Effort | Tier |
|----|------|------|--------|------|
| T2-04 | Admin panel: User management UI | new | 1d | 2 |
| T2-05 | Admin panel: Subscription management | new | 1d | 2 |
| T2-07 | Login/signup page with Supabase Auth | new | 4h | 2 |
| T2-10 | Onboarding wizard | new | 1d | 2 |
| T3-09 | User settings page | new | 4h | 3 |
