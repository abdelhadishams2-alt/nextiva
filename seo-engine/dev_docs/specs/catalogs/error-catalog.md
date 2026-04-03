# ChainIQ Error Catalog

> Standardized error codes for every error scenario across all services.
> Format: `CHAINIQ-{SERVICE}-{NUMBER}`
> Total: 104 error codes.

## Error Response Envelope

```typescript
interface ErrorResponse {
  error: {
    code: string;           // e.g., "CHAINIQ-AUTH-001"
    status: number;         // HTTP status code
    message: string;        // Developer-facing message
    user_message: string;   // Safe for UI display
    details?: Record<string, any>;
    recovery?: string;      // Suggested recovery action
    doc_url?: string;       // Link to error documentation
    request_id: string;     // For support tickets
    timestamp: string;      // ISO 8601
  };
}
```

---

## 1. AUTH — Authentication & Authorization (001-015)

| # | Code | HTTP | Message Template | User-Facing Message | Recovery Action |
|---|------|------|-----------------|---------------------|----------------|
| 1 | `CHAINIQ-AUTH-001` | 401 | Invalid or expired JWT token | "Your session has expired. Please sign in again." | Redirect to login |
| 2 | `CHAINIQ-AUTH-002` | 401 | Missing Authorization header | "Authentication required." | Include Bearer token |
| 3 | `CHAINIQ-AUTH-003` | 403 | Insufficient permissions for {operation} | "You don't have permission to perform this action." | Contact admin for role upgrade |
| 4 | `CHAINIQ-AUTH-004` | 401 | Invalid API key | "Invalid API key. Please check your credentials." | Regenerate API key in settings |
| 5 | `CHAINIQ-AUTH-005` | 429 | Too many login attempts from {ip} | "Too many sign-in attempts. Please try again in {minutes} minutes." | Wait for cooldown |
| 6 | `CHAINIQ-AUTH-006` | 409 | Email already registered | "An account with this email already exists." | Use password reset or sign in |
| 7 | `CHAINIQ-AUTH-007` | 400 | Password does not meet complexity requirements | "Password must be at least 8 characters with a number and symbol." | Adjust password |
| 8 | `CHAINIQ-AUTH-008` | 401 | MFA code invalid or expired | "Invalid verification code. Please try again." | Request new MFA code |
| 9 | `CHAINIQ-AUTH-009` | 403 | Account suspended | "Your account has been suspended. Contact support." | Contact support |
| 10 | `CHAINIQ-AUTH-010` | 403 | Account in grace period (subscription expired) | "Your subscription has expired. Renew to regain access." | Navigate to billing page |
| 11 | `CHAINIQ-AUTH-011` | 401 | Session invalidated by admin | "Your session was ended by an administrator." | Sign in again |
| 12 | `CHAINIQ-AUTH-012` | 400 | Invalid OAuth state parameter | "Connection attempt failed. Please try again." | Restart OAuth flow |
| 13 | `CHAINIQ-AUTH-013` | 401 | Service role key mismatch | "Internal authentication error." | Verify service key config |
| 14 | `CHAINIQ-AUTH-014` | 403 | IP address not in allowlist | "Access denied from your location." | Contact admin to update allowlist |
| 15 | `CHAINIQ-AUTH-015` | 401 | Token refresh failed; refresh token expired | "Your session could not be renewed. Please sign in again." | Full re-authentication |

## 2. DI — Data Ingestion (016-030)

| # | Code | HTTP | Message Template | User-Facing Message | Recovery Action |
|---|------|------|-----------------|---------------------|----------------|
| 16 | `CHAINIQ-DI-001` | 400 | Missing required OAuth scopes for {platform} | "Additional permissions needed for {platform}." | Re-authenticate with correct scopes |
| 17 | `CHAINIQ-DI-002` | 401 | OAuth token expired for {platform} | "{platform} connection expired." | Reconnect via connection settings |
| 18 | `CHAINIQ-DI-003` | 502 | {platform} API returned unexpected error: {status} | "{platform} is temporarily unavailable." | Retry later or check platform status |
| 19 | `CHAINIQ-DI-004` | 429 | {platform} API rate limit exceeded | "{platform} rate limit reached. Data will sync when available." | Wait for rate limit reset |
| 20 | `CHAINIQ-DI-005` | 409 | Connection already exists for {platform}:{property} | "This {platform} property is already connected." | Use existing connection |
| 21 | `CHAINIQ-DI-006` | 404 | Property {property_id} not found on {platform} | "The selected property was not found on {platform}." | Verify property exists in platform |
| 22 | `CHAINIQ-DI-007` | 422 | Sync data validation failed: {field} invalid | "Imported data contained errors. {count} records skipped." | Review sync log for details |
| 23 | `CHAINIQ-DI-008` | 500 | Sync job crashed: {reason} | "Data sync encountered an error. Our team has been notified." | Auto-retry scheduled |
| 24 | `CHAINIQ-DI-009` | 503 | {platform} API is down (health check failed) | "{platform} is currently unreachable." | Check platform status page |
| 25 | `CHAINIQ-DI-010` | 400 | Invalid date range for data request | "The selected date range is invalid." | Adjust date range |
| 26 | `CHAINIQ-DI-011` | 413 | Sync response exceeds maximum payload size | "Too much data for a single sync. Narrowing date range." | Auto-split into smaller batches |
| 27 | `CHAINIQ-DI-012` | 408 | Sync request timed out after {timeout}ms | "Data sync timed out. Retrying with a smaller batch." | Auto-retry with reduced scope |
| 28 | `CHAINIQ-DI-013` | 422 | Duplicate sync job already running for {property} | "A sync is already in progress for this property." | Wait for current sync to complete |
| 29 | `CHAINIQ-DI-014` | 403 | Insufficient plan quota for additional connection | "Your plan allows {max} connections. Upgrade for more." | Upgrade subscription |
| 30 | `CHAINIQ-DI-015` | 500 | Token encryption/decryption failed | "Connection error. Please reconnect {platform}." | Delete and recreate connection |

## 3. CI — Content Intelligence (031-047)

| # | Code | HTTP | Message Template | User-Facing Message | Recovery Action |
|---|------|------|-----------------|---------------------|----------------|
| 31 | `CHAINIQ-CI-001` | 400 | Insufficient data for keyword analysis (min {min} keywords) | "Not enough data yet. Connect more sources or wait for sync." | Ensure data sources are connected and synced |
| 32 | `CHAINIQ-CI-002` | 422 | Content gap analysis requires at least 1 competitor | "Add at least one competitor domain to run gap analysis." | Add competitor domains |
| 33 | `CHAINIQ-CI-003` | 500 | Clustering algorithm failed: {reason} | "Topic clustering encountered an error. Retrying." | Auto-retry; contact support if persistent |
| 34 | `CHAINIQ-CI-004` | 422 | Decay detection requires >30 days of data | "Need more historical data for decay detection." | Wait for sufficient data accumulation |
| 35 | `CHAINIQ-CI-005` | 500 | NLP model inference timeout | "Analysis is taking longer than expected. Please wait." | Auto-retry with extended timeout |
| 36 | `CHAINIQ-CI-006` | 422 | Brief generation missing required field: {field} | "Please fill in all required fields for the content brief." | Complete the form |
| 37 | `CHAINIQ-CI-007` | 500 | Brief generation AI error | "Brief generation failed. Retrying with fallback model." | Auto-retry with fallback |
| 38 | `CHAINIQ-CI-008` | 404 | Brief {brief_id} not found | "Content brief not found." | Verify brief still exists |
| 39 | `CHAINIQ-CI-009` | 429 | Analysis rate limit: max {max} analyses per hour | "You've reached the analysis limit. Try again in {minutes} min." | Wait for cooldown |
| 40 | `CHAINIQ-CI-010` | 422 | Cannibalization check requires >{min} indexed pages | "Not enough indexed pages for cannibalization analysis." | Wait for more pages to be indexed |
| 41 | `CHAINIQ-CI-011` | 500 | SERP data fetch failed for {keyword} | "Couldn't retrieve search results for '{keyword}'." | Retry or check keyword validity |
| 42 | `CHAINIQ-CI-012` | 422 | Domain {domain} has no connected data sources | "Connect a data source for {domain} before running analysis." | Connect GSC or analytics |
| 43 | `CHAINIQ-CI-013` | 400 | Invalid keyword: empty or exceeds {max} characters | "Invalid keyword. Must be 1-{max} characters." | Fix keyword input |
| 44 | `CHAINIQ-CI-014` | 500 | Content scoring model unavailable | "Scoring service temporarily unavailable." | Auto-retry in 30s |
| 45 | `CHAINIQ-CI-015` | 422 | Competitor domain unreachable: {domain} | "Competitor domain '{domain}' is unreachable." | Verify domain URL |
| 46 | `CHAINIQ-CI-016` | 413 | Analysis scope too large: {count} pages exceeds max {max} | "Too many pages selected. Reduce scope to {max} pages." | Narrow analysis scope |
| 47 | `CHAINIQ-CI-017` | 409 | Analysis already running for {domain} | "An analysis is already in progress for this domain." | Wait for current run to finish |

## 4. VI — Voice Intelligence (048-058)

| # | Code | HTTP | Message Template | User-Facing Message | Recovery Action |
|---|------|------|-----------------|---------------------|----------------|
| 48 | `CHAINIQ-VI-001` | 422 | Insufficient samples for voice analysis (min {min} docs) | "Upload at least {min} content samples for voice analysis." | Upload more samples |
| 49 | `CHAINIQ-VI-002` | 500 | Voice model training failed: {reason} | "Voice analysis encountered an error. Our team is investigating." | Auto-retry; contact support if persistent |
| 50 | `CHAINIQ-VI-003` | 404 | Persona {persona_id} not found | "Voice persona not found." | Verify persona exists |
| 51 | `CHAINIQ-VI-004` | 422 | Sample text too short (min {min} words) | "Content sample must be at least {min} words." | Provide longer sample |
| 52 | `CHAINIQ-VI-005` | 422 | Sample text too long (max {max} words) | "Content sample exceeds {max} word limit." | Split into multiple samples |
| 53 | `CHAINIQ-VI-006` | 409 | Persona name already exists: {name} | "A persona with this name already exists." | Choose a different name |
| 54 | `CHAINIQ-VI-007` | 422 | Recalibration requires >{min} new samples since last calibration | "Not enough new content for recalibration." | Upload more samples |
| 55 | `CHAINIQ-VI-008` | 500 | Tone detection model timeout | "Voice analysis is taking longer than expected." | Auto-retry |
| 56 | `CHAINIQ-VI-009` | 422 | Mixed languages detected in samples | "All samples must be in the same language." | Upload consistent language samples |
| 57 | `CHAINIQ-VI-010` | 429 | Persona generation rate limit: max {max} per day | "Daily persona limit reached. Try again tomorrow." | Wait 24h |
| 58 | `CHAINIQ-VI-011` | 403 | Persona limit reached for plan ({max} personas) | "Your plan allows {max} personas. Upgrade for more." | Upgrade subscription |

## 5. QG — Quality Gate (059-071)

| # | Code | HTTP | Message Template | User-Facing Message | Recovery Action |
|---|------|------|-----------------|---------------------|----------------|
| 59 | `CHAINIQ-QG-001` | 400 | Article content is empty | "Cannot score an empty article." | Add content to the article |
| 60 | `CHAINIQ-QG-002` | 422 | Article below minimum word count ({min} required) | "Article must be at least {min} words for quality check." | Expand article content |
| 61 | `CHAINIQ-QG-003` | 500 | Quality scoring model unavailable | "Quality check temporarily unavailable." | Auto-retry in 30s |
| 62 | `CHAINIQ-QG-004` | 422 | Plagiarism check failed: external service unavailable | "Plagiarism check unavailable. Article held pending check." | Retry when service recovers |
| 63 | `CHAINIQ-QG-005` | 403 | Quality gate override requires admin role | "Only admins can override quality gates." | Contact admin |
| 64 | `CHAINIQ-QG-006` | 422 | Fact-check found {count} unverifiable claims | "Article contains claims that couldn't be verified." | Review flagged claims |
| 65 | `CHAINIQ-QG-007` | 422 | SEO score below publishable threshold ({score} < {min}) | "SEO score too low for publishing." | Optimize SEO elements |
| 66 | `CHAINIQ-QG-008` | 422 | Readability score exceeds target audience level | "Content is too complex for the target audience." | Simplify language |
| 67 | `CHAINIQ-QG-009` | 400 | Invalid threshold configuration: {field} | "Invalid quality threshold settings." | Fix threshold values |
| 68 | `CHAINIQ-QG-010` | 500 | Auto-improvement pass failed | "Automatic improvements could not be applied." | Manual editing required |
| 69 | `CHAINIQ-QG-011` | 429 | Quality check rate limit: max {max} per hour | "Quality check limit reached. Try again shortly." | Wait for cooldown |
| 70 | `CHAINIQ-QG-012` | 422 | Article language not supported: {lang} | "Quality checks not available for {lang}." | Use supported language |
| 71 | `CHAINIQ-QG-013` | 409 | Quality check already running for article {article_id} | "A quality check is already in progress." | Wait for current check |

## 6. PB — Publishing Bridge (072-086)

| # | Code | HTTP | Message Template | User-Facing Message | Recovery Action |
|---|------|------|-----------------|---------------------|----------------|
| 72 | `CHAINIQ-PB-001` | 401 | CMS auth token expired for {platform} | "{platform} connection expired. Reconnect to publish." | Reconnect CMS |
| 73 | `CHAINIQ-PB-002` | 502 | CMS API error: {platform} returned {status} | "{platform} is temporarily unavailable." | Retry later |
| 74 | `CHAINIQ-PB-003` | 422 | Article missing required CMS fields: {fields} | "Fill in required fields before publishing: {fields}." | Complete article metadata |
| 75 | `CHAINIQ-PB-004` | 409 | Slug conflict on {platform}: '{slug}' already exists | "URL slug already in use on {platform}." | Choose different slug |
| 76 | `CHAINIQ-PB-005` | 413 | Article exceeds CMS content size limit | "Article too large for {platform}. Max {max} characters." | Shorten article |
| 77 | `CHAINIQ-PB-006` | 422 | Featured image upload failed: {reason} | "Image upload failed. Article published without featured image." | Re-upload image manually |
| 78 | `CHAINIQ-PB-007` | 400 | Invalid scheduled publish date (must be future) | "Scheduled date must be in the future." | Select a future date |
| 79 | `CHAINIQ-PB-008` | 404 | Target category/taxonomy not found on {platform} | "Category '{category}' not found on {platform}." | Create category on CMS or choose existing |
| 80 | `CHAINIQ-PB-009` | 503 | Publishing queue full ({count}/{max}) | "Publishing queue is full. Please wait." | Wait for queue to clear |
| 81 | `CHAINIQ-PB-010` | 500 | HTML conversion failed for article {article_id} | "Article formatting error." | Re-save and retry |
| 82 | `CHAINIQ-PB-011` | 422 | Article not yet approved by quality gate | "Article must pass quality check before publishing." | Run quality check first |
| 83 | `CHAINIQ-PB-012` | 408 | CMS publish request timed out after {timeout}ms | "Publishing timed out. Check {platform} for partial publish." | Verify on CMS; retry if needed |
| 84 | `CHAINIQ-PB-013` | 403 | CMS user lacks publish permission on {platform} | "Your {platform} account doesn't have publish permission." | Update CMS user permissions |
| 85 | `CHAINIQ-PB-014` | 422 | Webhook delivery failed: {url} returned {status} | "Post-publish webhook failed." | Check webhook endpoint |
| 86 | `CHAINIQ-PB-015` | 400 | Unsupported CMS platform: {platform} | "Publishing to {platform} is not supported." | Use a supported CMS |

## 7. FL — Feedback Loop (087-097)

| # | Code | HTTP | Message Template | User-Facing Message | Recovery Action |
|---|------|------|-----------------|---------------------|----------------|
| 87 | `CHAINIQ-FL-001` | 422 | Insufficient data for performance checkpoint (min {min} days) | "Not enough data for this performance checkpoint." | Wait for more data |
| 88 | `CHAINIQ-FL-002` | 500 | Prediction model inference failed | "Performance prediction temporarily unavailable." | Auto-retry |
| 89 | `CHAINIQ-FL-003` | 422 | Recalibration requires >{min} articles with >{days} days of data | "Not enough articles with sufficient history for recalibration." | Publish more content and wait |
| 90 | `CHAINIQ-FL-004` | 404 | Article performance data not found | "No performance data for this article." | Verify article was published and tracked |
| 91 | `CHAINIQ-FL-005` | 500 | Accuracy calculation error: division by zero (no predictions) | "No predictions available to measure accuracy." | Generate predictions first |
| 92 | `CHAINIQ-FL-006` | 429 | Recalibration rate limit: max {max} per day | "Recalibration limit reached for today." | Try again tomorrow |
| 93 | `CHAINIQ-FL-007` | 422 | Performance export date range too large (max {max} days) | "Export date range exceeds maximum." | Narrow date range |
| 94 | `CHAINIQ-FL-008` | 500 | Checkpoint report generation failed | "Report generation error. Retrying." | Auto-retry |
| 95 | `CHAINIQ-FL-009` | 404 | Domain {domain} has no published articles tracked | "No tracked articles for this domain." | Publish and track articles first |
| 96 | `CHAINIQ-FL-010` | 503 | GSC/GA4 data unavailable for performance comparison | "Search Console or Analytics data unavailable." | Check data source connections |
| 97 | `CHAINIQ-FL-011` | 422 | ROI calculation missing cost data | "Add content cost data to calculate ROI." | Enter cost per article |

## 8. DASH — Dashboard (098-104)

| # | Code | HTTP | Message Template | User-Facing Message | Recovery Action |
|---|------|------|-----------------|---------------------|----------------|
| 98 | `CHAINIQ-DASH-001` | 400 | Invalid dashboard layout configuration | "Dashboard layout is invalid." | Reset to default layout |
| 99 | `CHAINIQ-DASH-002` | 404 | Widget {widget_id} not found | "Dashboard widget not found." | Remove and re-add widget |
| 100 | `CHAINIQ-DASH-003` | 500 | Dashboard data aggregation timeout | "Dashboard is loading slowly. Some widgets may be delayed." | Refresh page |
| 101 | `CHAINIQ-DASH-004` | 422 | Report export format not supported: {format} | "Export format not supported." | Choose PDF, CSV, or XLSX |
| 102 | `CHAINIQ-DASH-005` | 413 | Report data too large for export | "Too much data for export. Narrow your filters." | Apply date or domain filters |
| 103 | `CHAINIQ-DASH-006` | 429 | Export rate limit: max {max} exports per hour | "Export limit reached. Try again in {minutes} minutes." | Wait for cooldown |
| 104 | `CHAINIQ-DASH-007` | 403 | Admin dashboard requires admin role | "Admin dashboard is restricted." | Contact admin |

---

## Error Handling Flow

```
1. Service catches error
2. Maps to CHAINIQ error code
3. Logs full error with stack trace (internal)
4. Returns ErrorResponse envelope to client
5. Client displays user_message
6. Client offers recovery action button if applicable
7. request_id available for support tickets
```

## HTTP Status Summary

| Status | Count | Usage |
|--------|-------|-------|
| 400 | 8 | Bad request / validation |
| 401 | 8 | Authentication failures |
| 403 | 8 | Authorization / permission |
| 404 | 6 | Resource not found |
| 408 | 2 | Request timeout |
| 409 | 5 | Conflict / duplicate |
| 413 | 4 | Payload too large |
| 422 | 28 | Semantic validation / business rules |
| 429 | 7 | Rate limiting |
| 500 | 17 | Internal server errors |
| 502 | 2 | Bad gateway (external API) |
| 503 | 3 | Service unavailable |

## Retry Policy by Error Type

| Error Category | Auto-Retry | Max Retries | Backoff |
|---------------|-----------|-------------|---------|
| 500 (internal) | Yes | 3 | Exponential (1s, 2s, 4s) |
| 502/503 (external) | Yes | 5 | Exponential (2s, 4s, 8s, 16s, 32s) |
| 429 (rate limit) | Yes | 1 | Wait for Retry-After header |
| 408 (timeout) | Yes | 2 | Linear (5s, 10s) |
| 4xx (client) | No | 0 | N/A — user must fix input |
