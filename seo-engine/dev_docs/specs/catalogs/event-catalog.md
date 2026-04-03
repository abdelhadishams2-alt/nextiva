# ChainIQ Event Catalog

> Cross-cutting catalog of every system event for analytics, audit logging, and monitoring.
> Total: 127 events across 3 categories.

## Event Envelope Schema

```typescript
interface SystemEvent {
  event_id: string;        // UUID v4
  event_name: string;      // e.g., "article.generated"
  category: 'analytics' | 'audit' | 'system';
  timestamp: string;       // ISO 8601
  user_id: string | null;  // null for system events
  session_id: string | null;
  org_id: string | null;
  payload: Record<string, any>;
  metadata: {
    source_service: string;
    source_version: string;
    ip_address: string | null;
    user_agent: string | null;
  };
}
```

---

## 1. Analytics Events (User Behavior & Feature Usage)

| # | Event Name | Trigger | Payload Schema |
|---|-----------|---------|---------------|
| 1 | `page.viewed` | User navigates to any screen | `{ screen: string, referrer: string, load_time_ms: number }` |
| 2 | `page.time_spent` | User leaves a screen | `{ screen: string, duration_ms: number, scroll_depth_pct: number }` |
| 3 | `feature.used` | User invokes any tracked feature | `{ feature_id: string, service: string, context: string }` |
| 4 | `search.performed` | User searches within platform | `{ query: string, result_count: number, screen: string }` |
| 5 | `filter.applied` | User applies a filter on any list view | `{ filter_type: string, filter_value: string, screen: string }` |
| 6 | `article.generation_started` | User clicks "Generate Article" | `{ brief_id: string, keyword: string, persona_id: string }` |
| 7 | `article.generated` | Article generation completes | `{ article_id: string, word_count: number, generation_time_ms: number, model_version: string }` |
| 8 | `article.generation_failed` | Article generation errors out | `{ brief_id: string, error_code: string, retry_count: number }` |
| 9 | `article.edited` | User manually edits generated article | `{ article_id: string, edit_type: string, chars_changed: number }` |
| 10 | `article.regenerated` | User requests article regeneration | `{ article_id: string, reason: string }` |
| 11 | `article.published` | Article successfully published to CMS | `{ article_id: string, platform: string, publish_type: 'immediate' \| 'scheduled' }` |
| 12 | `article.publish_failed` | Publish attempt fails | `{ article_id: string, platform: string, error_code: string }` |
| 13 | `article.scheduled` | Article scheduled for future publish | `{ article_id: string, platform: string, scheduled_date: string }` |
| 14 | `article.deleted` | User deletes an article | `{ article_id: string }` |
| 15 | `brief.created` | Content brief generated | `{ brief_id: string, keyword: string, word_count_target: number }` |
| 16 | `brief.edited` | User edits a content brief | `{ brief_id: string, fields_changed: string[] }` |
| 17 | `brief.deleted` | User deletes a content brief | `{ brief_id: string }` |
| 18 | `keyword.analyzed` | Keyword analysis run | `{ domain: string, keyword_count: number, source: string }` |
| 19 | `keyword.exported` | Keywords exported to CSV/sheet | `{ count: number, format: string }` |
| 20 | `gap.analysis_run` | Content gap analysis triggered | `{ domain: string, competitors: number, gaps_found: number }` |
| 21 | `decay.analysis_run` | Content decay detection triggered | `{ domain: string, pages_analyzed: number, decaying_count: number }` |
| 22 | `cannibalization.analysis_run` | Cannibalization check triggered | `{ domain: string, clusters_affected: number }` |
| 23 | `cluster.viewed` | User views topic cluster map | `{ domain: string, cluster_count: number }` |
| 24 | `cluster.recalculated` | Topic clusters recalculated | `{ domain: string, cluster_count: number, calc_time_ms: number }` |
| 25 | `voice.analysis_run` | Voice analysis triggered | `{ domain: string, sample_count: number }` |
| 26 | `voice.persona_created` | New persona created | `{ persona_id: string, persona_name: string }` |
| 27 | `voice.persona_edited` | Persona settings changed | `{ persona_id: string, fields_changed: string[] }` |
| 28 | `voice.persona_recalibrated` | Persona model recalibrated | `{ persona_id: string, confidence_before: number, confidence_after: number }` |
| 29 | `voice.samples_uploaded` | Voice samples uploaded | `{ persona_id: string, sample_count: number, total_words: number }` |
| 30 | `quality.check_run` | Quality gate check triggered | `{ article_id: string, score: number, passed: boolean }` |
| 31 | `quality.override` | Admin overrides quality gate | `{ article_id: string, original_score: number, reason: string }` |
| 32 | `quality.threshold_changed` | Quality thresholds updated | `{ old_threshold: number, new_threshold: number }` |
| 33 | `performance.checkpoint_viewed` | User views 30/60/90 day checkpoint | `{ article_id: string, checkpoint_days: number }` |
| 34 | `performance.report_exported` | Performance report exported | `{ domain: string, date_range: string, format: string }` |
| 35 | `performance.recalibration_triggered` | Model recalibration triggered | `{ domain: string, articles_count: number }` |
| 36 | `dashboard.customized` | Dashboard layout changed | `{ widgets_added: string[], widgets_removed: string[] }` |
| 37 | `dashboard.widget_interacted` | User interacts with dashboard widget | `{ widget_id: string, action: string }` |
| 38 | `connection.wizard_started` | User starts connection wizard | `{ platform: string }` |
| 39 | `connection.wizard_completed` | Connection wizard completed | `{ platform: string, duration_ms: number }` |
| 40 | `connection.wizard_abandoned` | User leaves wizard without completing | `{ platform: string, step_abandoned: number }` |
| 41 | `onboarding.step_completed` | User completes onboarding step | `{ step: number, step_name: string }` |
| 42 | `onboarding.completed` | Full onboarding flow completed | `{ total_duration_ms: number }` |
| 43 | `onboarding.skipped` | User skips onboarding | `{ step_skipped: number }` |
| 44 | `export.initiated` | Any data export started | `{ export_type: string, format: string, record_count: number }` |
| 45 | `export.completed` | Data export ready for download | `{ export_type: string, file_size_bytes: number }` |
| 46 | `notification.clicked` | User clicks a notification | `{ notification_id: string, channel: string }` |
| 47 | `notification.dismissed` | User dismisses a notification | `{ notification_id: string }` |
| 48 | `notification.preferences_changed` | User updates notification prefs | `{ changes: Record<string, any> }` |

---

## 2. Audit Events (Security, Compliance & Data Governance)

| # | Event Name | Trigger | Payload Schema |
|---|-----------|---------|---------------|
| 49 | `auth.signup` | New user registration | `{ method: 'email' \| 'google' \| 'github', email_domain: string }` |
| 50 | `auth.login` | Successful login | `{ method: string, mfa_used: boolean }` |
| 51 | `auth.login_failed` | Failed login attempt | `{ method: string, reason: string, attempt_count: number }` |
| 52 | `auth.logout` | User logs out | `{ session_duration_ms: number }` |
| 53 | `auth.password_changed` | Password updated | `{ initiated_by: 'user' \| 'admin' \| 'reset_flow' }` |
| 54 | `auth.password_reset_requested` | Password reset email sent | `{ email_domain: string }` |
| 55 | `auth.mfa_enabled` | MFA turned on | `{ mfa_type: string }` |
| 56 | `auth.mfa_disabled` | MFA turned off | `{ mfa_type: string, disabled_by: string }` |
| 57 | `auth.session_invalidated` | Session forcefully ended | `{ reason: string, invalidated_by: string }` |
| 58 | `connection.created` | New platform connection established | `{ platform: string, scopes: string[] }` |
| 59 | `connection.updated` | Connection settings modified | `{ platform: string, fields_changed: string[] }` |
| 60 | `connection.deleted` | Connection removed | `{ platform: string }` |
| 61 | `connection.token_refreshed` | OAuth token refreshed | `{ platform: string, expires_in: number }` |
| 62 | `connection.token_refresh_failed` | Token refresh failed | `{ platform: string, error: string }` |
| 63 | `apikey.created` | New API key generated | `{ key_prefix: string, scopes: string[] }` |
| 64 | `apikey.rotated` | API key rotated | `{ key_prefix: string, old_key_prefix: string }` |
| 65 | `apikey.revoked` | API key revoked | `{ key_prefix: string, revoked_by: string }` |
| 66 | `role.changed` | User role modified | `{ target_user_id: string, old_role: string, new_role: string, changed_by: string }` |
| 67 | `user.deleted` | User account deleted | `{ deleted_by: 'self' \| 'admin', data_purged: boolean }` |
| 68 | `user.suspended` | User account suspended | `{ reason: string, suspended_by: string }` |
| 69 | `user.reactivated` | Suspended user reactivated | `{ reactivated_by: string }` |
| 70 | `data.exported` | User data export completed | `{ export_type: string, record_count: number, file_size_bytes: number }` |
| 71 | `data.purged` | User data purged (GDPR) | `{ tables_affected: string[], records_deleted: number }` |
| 72 | `subscription.created` | New subscription created | `{ plan: string, billing_cycle: string }` |
| 73 | `subscription.upgraded` | Plan upgraded | `{ old_plan: string, new_plan: string }` |
| 74 | `subscription.downgraded` | Plan downgraded | `{ old_plan: string, new_plan: string, effective_date: string }` |
| 75 | `subscription.cancelled` | Subscription cancelled | `{ plan: string, effective_date: string, reason: string }` |
| 76 | `subscription.payment_failed` | Payment attempt failed | `{ plan: string, failure_reason: string, retry_count: number }` |
| 77 | `subscription.payment_succeeded` | Payment processed | `{ plan: string, amount_cents: number, currency: string }` |
| 78 | `quota.warning_triggered` | Usage hit 80% of limit | `{ resource: string, usage_pct: number, limit: number }` |
| 79 | `quota.exceeded` | Usage exceeded limit | `{ resource: string, usage: number, limit: number }` |
| 80 | `permission.denied` | Access denied to a resource | `{ permission_code: string, resource: string, reason: string }` |
| 81 | `permission.escalation` | User attempts action above their role | `{ attempted_action: string, required_role: string, user_role: string }` |
| 82 | `settings.updated` | Account or org settings changed | `{ setting_key: string, old_value: string, new_value: string }` |
| 83 | `feature_flag.toggled` | Feature flag changed | `{ flag_name: string, old_state: boolean, new_state: boolean, toggled_by: string }` |
| 84 | `ip.suspicious_detected` | Unusual IP access pattern | `{ ip: string, country: string, risk_score: number }` |
| 85 | `rls.violation_attempted` | RLS policy blocked a query | `{ table: string, operation: string, user_id: string }` |

---

## 3. System Events (Infrastructure, Scheduler & Monitoring)

| # | Event Name | Trigger | Payload Schema |
|---|-----------|---------|---------------|
| 86 | `scheduler.run_started` | Cron job begins execution | `{ job_name: string, schedule: string, run_id: string }` |
| 87 | `scheduler.run_completed` | Cron job finishes successfully | `{ job_name: string, run_id: string, duration_ms: number, records_processed: number }` |
| 88 | `scheduler.run_failed` | Cron job fails | `{ job_name: string, run_id: string, error: string, will_retry: boolean }` |
| 89 | `scheduler.run_skipped` | Cron job skipped (previous run still active) | `{ job_name: string, reason: string }` |
| 90 | `migration.started` | DB migration begins | `{ migration_id: string, version: string }` |
| 91 | `migration.applied` | DB migration succeeds | `{ migration_id: string, version: string, duration_ms: number }` |
| 92 | `migration.failed` | DB migration fails | `{ migration_id: string, version: string, error: string, rolled_back: boolean }` |
| 93 | `migration.rolled_back` | DB migration rolled back | `{ migration_id: string, version: string, reason: string }` |
| 94 | `rate_limit.hit` | Client hits rate limit | `{ endpoint: string, user_id: string, limit: number, window_ms: number }` |
| 95 | `rate_limit.external_hit` | External API rate limit hit | `{ platform: string, endpoint: string, retry_after_ms: number }` |
| 96 | `cache.hit` | SHA-256 cache hit | `{ cache_key_prefix: string, ttl_remaining_ms: number }` |
| 97 | `cache.miss` | SHA-256 cache miss | `{ cache_key_prefix: string, source_queried: string }` |
| 98 | `cache.evicted` | Cache entry evicted | `{ cache_key_prefix: string, reason: 'ttl' \| 'manual' \| 'memory' }` |
| 99 | `cache.invalidated` | Cache bulk invalidation | `{ pattern: string, entries_cleared: number, reason: string }` |
| 100 | `bridge.request_received` | Bridge server receives request | `{ method: string, path: string, user_id: string }` |
| 101 | `bridge.response_sent` | Bridge server sends response | `{ method: string, path: string, status_code: number, duration_ms: number }` |
| 102 | `bridge.error` | Bridge server unhandled error | `{ method: string, path: string, error: string, stack_trace: string }` |
| 103 | `bridge.timeout` | Bridge request times out | `{ method: string, path: string, timeout_ms: number }` |
| 104 | `health.check_passed` | Health endpoint returns OK | `{ service: string, response_time_ms: number }` |
| 105 | `health.check_failed` | Health endpoint returns error | `{ service: string, error: string, consecutive_failures: number }` |
| 106 | `health.degraded` | Service latency >2x baseline | `{ service: string, avg_latency_ms: number, baseline_ms: number }` |
| 107 | `health.recovered` | Previously degraded service recovers | `{ service: string, downtime_ms: number }` |
| 108 | `external_api.call_started` | Outbound API call initiated | `{ platform: string, endpoint: string, method: string }` |
| 109 | `external_api.call_succeeded` | Outbound API call succeeds | `{ platform: string, endpoint: string, status_code: number, duration_ms: number }` |
| 110 | `external_api.call_failed` | Outbound API call fails | `{ platform: string, endpoint: string, status_code: number, error: string, will_retry: boolean }` |
| 111 | `external_api.circuit_opened` | Circuit breaker opens for external service | `{ platform: string, failure_count: number, cooldown_ms: number }` |
| 112 | `external_api.circuit_closed` | Circuit breaker closes (service recovered) | `{ platform: string, recovery_time_ms: number }` |
| 113 | `queue.job_enqueued` | Job added to processing queue | `{ queue_name: string, job_type: string, priority: number }` |
| 114 | `queue.job_started` | Job picked up by worker | `{ queue_name: string, job_type: string, wait_time_ms: number }` |
| 115 | `queue.job_completed` | Job processed successfully | `{ queue_name: string, job_type: string, duration_ms: number }` |
| 116 | `queue.job_failed` | Job processing failed | `{ queue_name: string, job_type: string, error: string, retry_count: number }` |
| 117 | `queue.job_dead_lettered` | Job moved to DLQ after max retries | `{ queue_name: string, job_type: string, total_attempts: number }` |
| 118 | `deploy.started` | Deployment initiated | `{ version: string, environment: string, deployer: string }` |
| 119 | `deploy.completed` | Deployment finished | `{ version: string, environment: string, duration_ms: number }` |
| 120 | `deploy.failed` | Deployment failed | `{ version: string, environment: string, error: string, rolled_back: boolean }` |
| 121 | `deploy.rollback` | Deployment rolled back | `{ from_version: string, to_version: string, reason: string }` |
| 122 | `storage.usage_warning` | Storage usage >80% of allocation | `{ current_bytes: number, limit_bytes: number, usage_pct: number }` |
| 123 | `storage.usage_critical` | Storage usage >95% of allocation | `{ current_bytes: number, limit_bytes: number }` |
| 124 | `webhook.dispatched` | Outbound webhook sent | `{ webhook_id: string, event_type: string, target_url: string }` |
| 125 | `webhook.delivery_failed` | Webhook delivery failed | `{ webhook_id: string, target_url: string, status_code: number, retry_count: number }` |
| 126 | `webhook.delivery_confirmed` | Webhook delivery acknowledged (2xx) | `{ webhook_id: string, target_url: string, response_time_ms: number }` |
| 127 | `startup.service_ready` | Service completes initialization | `{ service: string, boot_time_ms: number, version: string }` |

---

## Event Routing Rules

| Category | Destination | Retention | Real-time |
|----------|------------|-----------|-----------|
| Analytics | Analytics DB (aggregated) + Mixpanel/Amplitude | 2 years (raw 90 days) | No (batched 60s) |
| Audit | Audit log table (immutable) | 7 years (compliance) | Yes (sync write) |
| System | Monitoring service + alerting pipeline | 90 days | Yes (streaming) |

## Event Processing Pipeline

```
1. Event emitted by service
2. Envelope created with metadata
3. Written to events_buffer table (write-ahead)
4. Event router reads buffer:
   a. Analytics → batch insert to analytics_events (60s window)
   b. Audit → sync insert to audit_log (immutable, no delete policy)
   c. System → push to monitoring stream
5. Buffer entry marked as processed
6. Stale buffer entries cleaned after 24h
```

## Sampling Rules

- `page.viewed`, `cache.hit`, `cache.miss`: Sampled at 10% in production to reduce volume.
- `bridge.request_received`, `bridge.response_sent`: Sampled at 25% unless status >= 400.
- All audit events: Never sampled (100% capture).
- All system error events: Never sampled (100% capture).
