# ChainIQ Permission Catalog

> Cross-cutting catalog of every role x operation permission across all 12 services.
> Total: 74 permissions mapped across 3 roles.

## Roles

| Role | Supabase Claim | Description |
|------|---------------|-------------|
| `user` | `role: 'user'` | Standard authenticated user. Scoped to own data via RLS `auth.uid() = user_id`. |
| `admin` | `role: 'admin'` | Full platform access. Can view/manage all users' data. |
| `service_role` | `role: 'service_role'` | Background scheduler, cron jobs, system tasks. No UI session. Uses service key. |

## Permission Legend

| Symbol | Meaning |
|--------|---------|
| Y | Allowed |
| N | Denied |
| O | Own data only (RLS-enforced) |
| A | Admin-only |
| S | Service-role only |

---

## 1. Auth Service (AUTH)

| # | Operation | Code | user | admin | service_role |
|---|-----------|------|------|-------|-------------|
| 1 | Sign up / sign in | `AUTH:login` | Y | Y | N |
| 2 | Read own profile | `AUTH:profile.read` | O | Y | S |
| 3 | Update own profile | `AUTH:profile.update` | O | Y | N |
| 4 | Delete own account | `AUTH:profile.delete` | O | Y | N |
| 5 | List all users | `AUTH:users.list` | N | A | S |
| 6 | Assign roles | `AUTH:roles.assign` | N | A | N |
| 7 | Rotate API keys | `AUTH:keys.rotate` | O | Y | S |
| 8 | Invalidate sessions | `AUTH:sessions.invalidate` | O | A | S |

## 2. Data Ingestion Service (DI)

| # | Operation | Code | user | admin | service_role |
|---|-----------|------|------|-------|-------------|
| 9 | Create connection (OAuth) | `DI:connection.create` | O | Y | N |
| 10 | Read own connections | `DI:connection.read` | O | Y | S |
| 11 | Update connection settings | `DI:connection.update` | O | Y | N |
| 12 | Delete connection | `DI:connection.delete` | O | Y | N |
| 13 | Trigger manual sync | `DI:sync.trigger` | O | Y | S |
| 14 | Read sync history | `DI:sync.history.read` | O | Y | S |
| 15 | Configure sync schedule | `DI:sync.schedule.update` | O | Y | S |
| 16 | Read raw API data | `DI:data.raw.read` | O | Y | S |
| 17 | Purge cached data | `DI:cache.purge` | N | A | S |

## 3. Content Intelligence Service (CI)

| # | Operation | Code | user | admin | service_role |
|---|-----------|------|------|-------|-------------|
| 18 | Run keyword analysis | `CI:keywords.analyze` | O | Y | S |
| 19 | Read keyword data | `CI:keywords.read` | O | Y | S |
| 20 | Run content gap analysis | `CI:gaps.analyze` | O | Y | S |
| 21 | Read content gaps | `CI:gaps.read` | O | Y | S |
| 22 | Run cannibalization check | `CI:cannibalization.analyze` | O | Y | S |
| 23 | Read cannibalization report | `CI:cannibalization.read` | O | Y | S |
| 24 | Run decay detection | `CI:decay.analyze` | O | Y | S |
| 25 | Read decay alerts | `CI:decay.read` | O | Y | S |
| 26 | Generate content brief | `CI:brief.create` | O | Y | S |
| 27 | Read content briefs | `CI:brief.read` | O | Y | S |
| 28 | Update content brief | `CI:brief.update` | O | Y | N |
| 29 | Delete content brief | `CI:brief.delete` | O | Y | N |
| 30 | Read topic clusters | `CI:clusters.read` | O | Y | S |
| 31 | Recalculate clusters | `CI:clusters.recalculate` | O | Y | S |

## 4. Voice Intelligence Service (VI)

| # | Operation | Code | user | admin | service_role |
|---|-----------|------|------|-------|-------------|
| 32 | Run voice analysis | `VI:analysis.run` | O | Y | S |
| 33 | Read voice analysis | `VI:analysis.read` | O | Y | S |
| 34 | Create persona | `VI:persona.create` | O | Y | N |
| 35 | Read personas | `VI:persona.read` | O | Y | S |
| 36 | Update persona | `VI:persona.update` | O | Y | N |
| 37 | Delete persona | `VI:persona.delete` | O | Y | N |
| 38 | Recalibrate persona | `VI:persona.recalibrate` | O | Y | S |
| 39 | Upload voice samples | `VI:samples.upload` | O | Y | N |

## 5. Article Generation Service (AG)

| # | Operation | Code | user | admin | service_role |
|---|-----------|------|------|-------|-------------|
| 40 | Generate article | `AG:article.generate` | O | Y | S |
| 41 | Read generated articles | `AG:article.read` | O | Y | S |
| 42 | Update article (edit) | `AG:article.update` | O | Y | N |
| 43 | Delete article | `AG:article.delete` | O | Y | N |
| 44 | Regenerate article | `AG:article.regenerate` | O | Y | N |
| 45 | Read generation history | `AG:history.read` | O | Y | S |

## 6. Quality Gate Service (QG)

| # | Operation | Code | user | admin | service_role |
|---|-----------|------|------|-------|-------------|
| 46 | Run quality check | `QG:check.run` | O | Y | S |
| 47 | Read quality scores | `QG:scores.read` | O | Y | S |
| 48 | Override quality gate | `QG:gate.override` | N | A | N |
| 49 | Configure thresholds | `QG:thresholds.update` | O | A | N |
| 50 | Read threshold config | `QG:thresholds.read` | O | Y | S |
| 51 | Run plagiarism check | `QG:plagiarism.run` | O | Y | S |
| 52 | Run fact-check | `QG:factcheck.run` | O | Y | S |

## 7. Publishing Bridge Service (PB)

| # | Operation | Code | user | admin | service_role |
|---|-----------|------|------|-------|-------------|
| 53 | Publish article | `PB:article.publish` | O | Y | S |
| 54 | Schedule publish | `PB:article.schedule` | O | Y | S |
| 55 | Cancel scheduled publish | `PB:article.cancel` | O | Y | N |
| 56 | Read publish history | `PB:history.read` | O | Y | S |
| 57 | Configure CMS mapping | `PB:mapping.update` | O | Y | N |
| 58 | Read CMS mapping | `PB:mapping.read` | O | Y | S |
| 59 | Test CMS connection | `PB:connection.test` | O | Y | N |

## 8. Feedback Loop Service (FL)

| # | Operation | Code | user | admin | service_role |
|---|-----------|------|------|-------|-------------|
| 60 | Read performance data | `FL:performance.read` | O | Y | S |
| 61 | Trigger recalibration | `FL:recalibrate.trigger` | O | Y | S |
| 62 | Read prediction accuracy | `FL:accuracy.read` | O | Y | S |
| 63 | Read checkpoint reports | `FL:checkpoints.read` | O | Y | S |
| 64 | Export performance data | `FL:data.export` | O | Y | N |

## 9. Dashboard Service (DASH)

| # | Operation | Code | user | admin | service_role |
|---|-----------|------|------|-------|-------------|
| 65 | Read own dashboard | `DASH:dashboard.read` | O | Y | N |
| 66 | Customize dashboard layout | `DASH:layout.update` | O | Y | N |
| 67 | Read admin analytics | `DASH:analytics.admin` | N | A | S |
| 68 | Export reports | `DASH:reports.export` | O | Y | N |

## 10. Admin Service (ADMIN)

| # | Operation | Code | user | admin | service_role |
|---|-----------|------|------|-------|-------------|
| 69 | Manage subscriptions | `ADMIN:subs.manage` | N | A | S |
| 70 | View system health | `ADMIN:health.read` | N | A | S |
| 71 | Manage quotas | `ADMIN:quotas.manage` | N | A | S |
| 72 | View audit logs | `ADMIN:audit.read` | N | A | S |
| 73 | Run database migrations | `ADMIN:migrations.run` | N | N | S |
| 74 | Manage feature flags | `ADMIN:flags.manage` | N | A | S |

---

## RLS Implementation Pattern

All tables with user-scoped data enforce:

```sql
CREATE POLICY "users_own_data" ON {table_name}
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "admin_full_access" ON {table_name}
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "service_role_access" ON {table_name}
  FOR ALL
  USING (auth.role() = 'service_role');
```

## Permission Check Flow

```
1. Request arrives with Bearer JWT
2. Supabase validates JWT, extracts auth.uid() and role claim
3. Bridge server middleware checks:
   a. Is route public? → allow
   b. Extract required permission code from route config
   c. Check role against permission matrix
   d. If role = 'user', RLS handles row-level scoping automatically
   e. If role = 'admin', bypass RLS row scoping
   f. If role = 'service_role', validate service key header
4. Denied → 403 Forbidden with CHAINIQ-AUTH-003
```

## Cache Integration

Permission lookups use SHA-256 cache key:
```
cache_key = SHA-256(`perm:${user_id}:${permission_code}`)
TTL = 300 seconds (5 minutes)
Invalidation: on role change, subscription change, or connection change
```
