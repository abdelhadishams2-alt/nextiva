# ChainIQ Notification Catalog

> Cross-cutting catalog of every notification trigger across all 12 services and 6 layers.
> Total: 68 notifications

## Channels

| Channel | Code | Description |
|---------|------|-------------|
| Toast | `T` | In-app transient notification (auto-dismiss 5s) |
| Email | `E` | Email to user's registered address |
| Badge | `B` | Persistent badge counter on nav item |
| Push | `P` | Browser push notification (if permitted) |

## Severity Levels

| Level | Code | Description |
|-------|------|-------------|
| Info | `I` | Informational, no action required |
| Warning | `W` | Attention recommended |
| Error | `ERR` | Action required |
| Critical | `C` | Immediate action required |

---

## 1. Connection Events (Data Ingestion Layer)

| # | Notification ID | Trigger Condition | Severity | Channels | Message Template |
|---|----------------|-------------------|----------|----------|-----------------|
| 1 | `CONN_CONNECTED` | OAuth flow completes successfully for any platform | I | T | "{platform} connected successfully." |
| 2 | `CONN_EXPIRED` | OAuth token refresh fails after 3 retries | ERR | T, E, B | "{platform} connection expired. Please reconnect." |
| 3 | `CONN_ERROR` | API call returns auth error (401/403) mid-session | ERR | T, B | "{platform} connection error. Check credentials." |
| 4 | `CONN_RECONNECTED` | Previously expired connection re-authenticated | I | T | "{platform} reconnected successfully." |
| 5 | `CONN_SYNC_COMPLETE` | Scheduled or manual data sync finishes without errors | I | T | "{platform} data sync complete. {count} records updated." |
| 6 | `CONN_SYNC_FAILED` | Data sync encounters unrecoverable error | ERR | T, E | "{platform} sync failed: {reason}." |
| 7 | `CONN_QUOTA_WARNING` | API quota usage exceeds 80% of daily limit | W | T, B | "{platform} API quota at {pct}%. Throttling may occur." |
| 8 | `CONN_QUOTA_EXHAUSTED` | API quota hits 100% | ERR | T, E, B | "{platform} API quota exhausted. Sync paused until reset." |
| 9 | `CONN_RATE_LIMITED` | Rate limit hit on external API | W | T | "{platform} rate limited. Retrying in {delay}s." |
| 10 | `CONN_NEW_PROPERTY` | New GSC/GA4 property detected during sync | I | T, B | "New property detected: {property}. Add to monitoring?" |

## 2. Content Events (Content Intelligence Layer)

| # | Notification ID | Trigger Condition | Severity | Channels | Message Template |
|---|----------------|-------------------|----------|----------|-----------------|
| 11 | `CONTENT_CRAWL_COMPLETE` | Site crawl finishes for a connected property | I | T | "Crawl complete for {domain}. {pages} pages analyzed." |
| 12 | `CONTENT_CRAWL_FAILED` | Crawler encounters >50% error rate | ERR | T, E | "Crawl failed for {domain}: {reason}." |
| 13 | `CONTENT_DECAY_DETECTED` | Content decay algorithm flags pages losing >15% traffic over 30 days | W | T, E, B | "{count} pages showing content decay on {domain}." |
| 14 | `CONTENT_DECAY_CRITICAL` | Single page loses >40% traffic in 14 days | ERR | T, E, B | "Critical decay: '{title}' lost {pct}% traffic." |
| 15 | `CONTENT_NEW_OPPORTUNITIES` | Keyword gap analysis finds unserved topics | I | T, B | "{count} new content opportunities found for {domain}." |
| 16 | `CONTENT_CANNIBALIZATION` | Two or more pages compete for same keyword cluster | W | T, E, B | "Cannibalization detected: {count} keyword clusters affected." |
| 17 | `CONTENT_BRIEF_READY` | AI content brief generation completes | I | T, B | "Content brief ready: '{title}'." |
| 18 | `CONTENT_CLUSTER_UPDATED` | Topic cluster model re-calculated | I | T | "Topic clusters updated for {domain}." |
| 19 | `CONTENT_GAP_CLOSED` | Previously identified gap now has published content | I | T | "Content gap closed: '{keyword}' now covered." |
| 20 | `CONTENT_SERP_SHIFT` | Monitored keyword moves >5 positions | W | T, B | "SERP shift: '{keyword}' moved {delta} positions." |

## 3. Voice Events (Voice Intelligence Layer)

| # | Notification ID | Trigger Condition | Severity | Channels | Message Template |
|---|----------------|-------------------|----------|----------|-----------------|
| 21 | `VOICE_ANALYSIS_COMPLETE` | Voice/tone analysis finishes for a domain | I | T | "Voice analysis complete for {domain}." |
| 22 | `VOICE_PERSONA_GENERATED` | New brand persona profile created | I | T, B | "Brand persona generated: '{persona_name}'." |
| 23 | `VOICE_LOW_CONFIDENCE` | Voice match confidence drops below 70% | W | T, B | "Low voice confidence ({score}%) for '{persona_name}'. Review recommended." |
| 24 | `VOICE_DRIFT_DETECTED` | Published content voice deviates >2 std from persona baseline | W | T, E | "Voice drift detected in '{title}'. Tone score: {score}." |
| 25 | `VOICE_CALIBRATION_NEEDED` | Persona model stale (>90 days since last calibration) | W | T, B | "Persona '{persona_name}' needs recalibration." |
| 26 | `VOICE_PERSONA_UPDATED` | Persona model re-trained with new samples | I | T | "Persona '{persona_name}' updated with {count} new samples." |

## 4. Quality Events (Quality Gate Layer)

| # | Notification ID | Trigger Condition | Severity | Channels | Message Template |
|---|----------------|-------------------|----------|----------|-----------------|
| 27 | `QUALITY_ARTICLE_SCORED` | Article passes through quality gate and receives score | I | T | "Article scored: '{title}' — {score}/100." |
| 28 | `QUALITY_REVISION_NEEDED` | Article score falls between threshold and minimum (50-70) | W | T, B | "Revision needed: '{title}' scored {score}/100." |
| 29 | `QUALITY_BELOW_THRESHOLD` | Article score below minimum threshold (<50) | ERR | T, E, B | "Quality alert: '{title}' scored {score}/100. Cannot publish." |
| 30 | `QUALITY_GATE_PASSED` | Article clears all quality gates | I | T | "'{title}' passed all quality gates." |
| 31 | `QUALITY_PLAGIARISM_FLAG` | Plagiarism check finds >10% similarity | ERR | T, E, B | "Plagiarism flag: '{title}' has {pct}% similarity." |
| 32 | `QUALITY_FACTCHECK_FAIL` | Fact-check module flags unverifiable claims | W | T, B | "Fact-check warning: {count} claims unverified in '{title}'." |
| 33 | `QUALITY_SEO_SCORE_LOW` | SEO optimization score below 60 | W | T, B | "SEO score low ({score}) for '{title}'." |
| 34 | `QUALITY_READABILITY_LOW` | Readability grade exceeds target audience level | W | T | "Readability too complex for target audience in '{title}'." |
| 35 | `QUALITY_AUTO_IMPROVED` | Auto-improvement pass completes on article | I | T | "Auto-improvements applied to '{title}'." |

## 5. Publishing Events (Publishing Bridge Layer)

| # | Notification ID | Trigger Condition | Severity | Channels | Message Template |
|---|----------------|-------------------|----------|----------|-----------------|
| 36 | `PUB_SUCCESS` | Article published to target CMS | I | T, E | "'{title}' published to {platform}." |
| 37 | `PUB_FAILED` | Publish API call returns error | ERR | T, E, B | "Publish failed: '{title}' to {platform}. {reason}." |
| 38 | `PUB_AUTH_EXPIRED` | CMS platform auth token expired | ERR | T, E, B | "{platform} auth expired. Reconnect to continue publishing." |
| 39 | `PUB_SCHEDULED` | Article scheduled for future publish | I | T | "'{title}' scheduled for {date} on {platform}." |
| 40 | `PUB_DRAFT_CREATED` | Draft created on target CMS | I | T | "Draft created: '{title}' on {platform}." |
| 41 | `PUB_MEDIA_UPLOAD_FAILED` | Image/media upload fails during publish | W | T, B | "Media upload failed for '{title}'. Article published without images." |
| 42 | `PUB_SLUG_CONFLICT` | Target URL slug already exists on CMS | W | T | "Slug conflict for '{title}' on {platform}. Auto-suffixed." |
| 43 | `PUB_QUEUE_FULL` | Publishing queue reaches max capacity | W | T, B | "Publishing queue full. {count} articles waiting." |

## 6. Performance / Feedback Loop Events

| # | Notification ID | Trigger Condition | Severity | Channels | Message Template |
|---|----------------|-------------------|----------|----------|-----------------|
| 44 | `PERF_30DAY_CHECKPOINT` | 30 days since article publish | I | T, E | "30-day report ready for '{title}': {clicks} clicks, position {pos}." |
| 45 | `PERF_60DAY_CHECKPOINT` | 60 days since article publish | I | T, E | "60-day report ready for '{title}': {clicks} clicks, position {pos}." |
| 46 | `PERF_90DAY_CHECKPOINT` | 90 days since article publish | I | T, E | "90-day report ready for '{title}': {clicks} clicks, position {pos}." |
| 47 | `PERF_ACCURACY_ALERT` | Prediction accuracy drops below 60% for a domain | ERR | T, E, B | "Prediction accuracy alert for {domain}: {pct}% accuracy." |
| 48 | `PERF_RECALIBRATION_AVAILABLE` | Enough data collected to improve prediction model | I | T, B | "Model recalibration available for {domain}." |
| 49 | `PERF_OVERPERFORMING` | Article exceeds predicted traffic by >50% | I | T | "'{title}' overperforming: {actual} vs {predicted} predicted clicks." |
| 50 | `PERF_UNDERPERFORMING` | Article achieves <50% of predicted traffic at 30 days | W | T, E, B | "'{title}' underperforming: {actual} vs {predicted} predicted clicks." |
| 51 | `PERF_RANKING_GAINED` | Article enters top 10 for target keyword | I | T, B | "'{title}' now ranking #{pos} for '{keyword}'." |
| 52 | `PERF_RANKING_LOST` | Article drops out of top 20 for target keyword | W | T, E, B | "'{title}' dropped to #{pos} for '{keyword}'." |
| 53 | `PERF_ROI_MILESTONE` | Article reaches positive ROI based on cost vs traffic value | I | T, E | "'{title}' reached positive ROI: {roi}% return." |
| 54 | `PERF_BATCH_REPORT_READY` | Weekly/monthly performance batch report generated | I | T, E | "{period} performance report ready for {domain}." |

## 7. Admin / Account Events

| # | Notification ID | Trigger Condition | Severity | Channels | Message Template |
|---|----------------|-------------------|----------|----------|-----------------|
| 55 | `ADMIN_USER_CREATED` | New user signs up or is invited | I | E | "Welcome to ChainIQ! Your account is ready." |
| 56 | `ADMIN_USER_INVITED` | Admin invites a team member | I | E | "You've been invited to {org} on ChainIQ." |
| 57 | `ADMIN_QUOTA_WARNING` | Usage reaches 80% of plan limit | W | T, E, B | "Usage at {pct}% of your {plan} plan limit." |
| 58 | `ADMIN_QUOTA_EXCEEDED` | Usage exceeds plan limit | ERR | T, E, B | "Plan limit exceeded. Upgrade or wait for reset." |
| 59 | `ADMIN_SUB_CHANGED` | Subscription plan upgraded/downgraded | I | T, E | "Subscription changed to {plan}." |
| 60 | `ADMIN_SUB_EXPIRING` | Subscription expires in <7 days | W | T, E | "Subscription expires on {date}. Renew to avoid interruption." |
| 61 | `ADMIN_SUB_EXPIRED` | Subscription expired, account in grace period | C | T, E, B | "Subscription expired. {grace_days} days remaining before data deletion." |
| 62 | `ADMIN_PAYMENT_FAILED` | Payment processor returns failure | ERR | T, E | "Payment failed for {plan}. Please update billing info." |
| 63 | `ADMIN_API_KEY_ROTATED` | API key rotation triggered (manual or scheduled) | I | T, E | "API key rotated. Update integrations using the old key." |
| 64 | `ADMIN_EXPORT_READY` | Data export file is ready for download | I | T, E | "Your data export is ready. Download within 48 hours." |
| 65 | `ADMIN_ROLE_CHANGED` | User role modified by admin | I | T, E | "Your role changed to {role} by {admin}." |

## 8. System / Scheduler Events (service_role only)

| # | Notification ID | Trigger Condition | Severity | Channels | Message Template |
|---|----------------|-------------------|----------|----------|-----------------|
| 66 | `SYS_MAINTENANCE_SCHEDULED` | Scheduled maintenance window approaching | W | T, E | "Maintenance scheduled for {date}. Expect brief downtime." |
| 67 | `SYS_MIGRATION_COMPLETE` | Database migration applied successfully | I | T | "System update complete. New features available." |
| 68 | `SYS_DEGRADED_PERFORMANCE` | System health check detects latency >2x baseline | W | T | "System performance degraded. Some operations may be slow." |

---

## Notification Preferences Schema

```typescript
interface NotificationPreferences {
  user_id: string;
  channel_overrides: Record<string, {
    toast: boolean;
    email: boolean;
    badge: boolean;
    push: boolean;
  }>;
  quiet_hours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "08:00"
    timezone: string;
  };
  digest_mode: 'instant' | 'hourly' | 'daily';
  muted_categories: string[]; // e.g., ["CONN", "SYS"]
}
```

## Delivery Rules

1. **Critical (C)**: Always delivered immediately, ignores quiet hours and digest mode.
2. **Error (ERR)**: Delivered immediately unless digest mode is `daily`; still ignores quiet hours.
3. **Warning (W)**: Respects quiet hours; batched in digest if configured.
4. **Info (I)**: Respects quiet hours and digest mode; lowest delivery priority.
5. **Email channel**: Rate-limited to max 10 emails/hour per user; excess queued.
6. **Badge channel**: Persistent until user clicks through; count resets on view.
7. **Duplicate suppression**: Same notification ID + same entity not re-sent within 1 hour.
