# ChainIQ — Security Audit Logging Strategy

> **Step 14 Artifact** — Security Hardening
> **Last Updated:** 2026-03-28
> **Applies to:** Bridge Server (logger.js), Supabase audit_logs table

---

## 1. Security Event Taxonomy

All security-relevant events are classified into four categories. Each event has a defined severity, retention period, and whether it requires PII redaction.

### Category 1: Authentication Events

| Event | Severity | Trigger | Data Captured | PII Redaction |
|-------|----------|---------|---------------|---------------|
| `auth.login.success` | INFO | Successful login | user_id, email (hashed), IP, user_agent | Email → SHA-256 hash |
| `auth.login.failure` | WARN | Failed login attempt | email (hashed), IP, user_agent, reason | Email → SHA-256 hash |
| `auth.login.lockout` | WARN | Account locked after 5 failures | email (hashed), IP, lockout_duration | Email → SHA-256 hash |
| `auth.signup.success` | INFO | New account created | user_id, IP | None needed |
| `auth.signup.failure` | WARN | Signup attempt failed | IP, reason (e.g., duplicate email) | No email logged |
| `auth.token.verified` | DEBUG | JWT verified (cache miss) | user_id, token_hash (first 8 chars) | Token → truncated hash |
| `auth.token.expired` | INFO | Expired JWT rejected | user_id (if extractable), IP | None |
| `auth.session.revoked` | INFO | Session invalidated | user_id, reason | None |
| `auth.api_key.validated` | DEBUG | API key authentication | key_id (not the key itself), IP | Key → ID only |
| `auth.api_key.rejected` | WARN | Invalid API key used | IP, key_prefix (first 8 chars) | Key → prefix only |

### Category 2: Authorization Events

| Event | Severity | Trigger | Data Captured | PII Redaction |
|-------|----------|---------|---------------|---------------|
| `authz.admin.access` | INFO | Admin endpoint accessed | user_id, endpoint, IP | None |
| `authz.admin.denied` | WARN | Non-admin attempted admin endpoint | user_id, endpoint, IP | None |
| `authz.quota.exceeded` | WARN | User exceeded tier quota | user_id, quota_type, current_usage, limit | None |
| `authz.resource.denied` | WARN | User attempted to access another user's resource | user_id, resource_type, resource_id | None |
| `authz.tier.upgrade_needed` | INFO | User hit feature requiring higher tier | user_id, feature, current_tier | None |

### Category 3: Security Threat Events

| Event | Severity | Trigger | Data Captured | PII Redaction |
|-------|----------|---------|---------------|---------------|
| `security.rate_limit.exceeded` | WARN | Rate limit triggered | IP, user_id, endpoint, limit, window | None |
| `security.path_traversal.blocked` | ERROR | Path traversal attempt detected | user_id, IP, attempted_path | None |
| `security.prompt_injection.blocked` | ERROR | Prompt injection pattern matched | user_id, IP, pattern_matched, input_preview (first 100 chars) | Input → truncated |
| `security.cors.rejected` | WARN | Request from non-allowed origin | IP, origin, endpoint | None |
| `security.body.too_large` | WARN | Request body exceeded 64KB | IP, content_length | None |
| `security.subprocess.timeout` | WARN | Claude CLI subprocess exceeded 600s | user_id, job_id | None |
| `security.subprocess.output_exceeded` | WARN | Subprocess output exceeded 4MB | user_id, job_id, output_size | None |
| `security.secret_scan.alert` | ERROR | Potential secret detected in commit | file_path, pattern_type | Secret → redacted |

### Category 4: Data Lifecycle Events

| Event | Severity | Trigger | Data Captured | PII Redaction |
|-------|----------|---------|---------------|---------------|
| `data.user.deleted` | INFO | User account deletion (GDPR) | user_id, deleted_by (admin_id), tables_cleaned | None |
| `data.export.requested` | INFO | Data export request (GDPR Art. 15/20) | user_id, export_format | None |
| `data.export.completed` | INFO | Data export completed | user_id, file_size, tables_included | None |
| `data.oauth.connected` | INFO | OAuth connection established | user_id, provider, scopes | None |
| `data.oauth.disconnected` | INFO | OAuth connection removed | user_id, provider, reason | None |
| `data.oauth.token_refreshed` | DEBUG | OAuth token proactively refreshed | user_id, provider | None |
| `data.encryption.key_rotated` | INFO | Encryption key rotation completed | rotation_id, records_re_encrypted | None |
| `data.retention.purged` | INFO | Data purged per retention policy | table, rows_deleted, retention_period | None |

---

## 2. Structured Log Format

All security events use a consistent JSON structure:

```json
{
  "timestamp": "2026-03-28T14:30:00.123Z",
  "level": "warn",
  "category": "security",
  "event": "security.rate_limit.exceeded",
  "service": "bridge-server",
  "version": "4.6.8",
  "request_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "ip": "203.0.113.42",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "endpoint": "/generate",
    "method": "POST",
    "limit": 5,
    "window_ms": 60000,
    "current_count": 6
  },
  "environment": "production"
}
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `timestamp` | ISO 8601 | Yes | Event time in UTC |
| `level` | string | Yes | debug, info, warn, error, fatal |
| `category` | string | Yes | auth, authz, security, data |
| `event` | string | Yes | Dot-separated event identifier |
| `service` | string | Yes | bridge-server, dashboard, scheduler |
| `version` | string | Yes | Service version for debugging |
| `request_id` | UUID | Yes (if HTTP) | Correlation ID from X-Request-ID header |
| `ip` | string | Yes (if HTTP) | Client IP (from X-Forwarded-For or socket) |
| `user_id` | UUID | If authenticated | Authenticated user's ID |
| `data` | object | No | Event-specific payload |
| `environment` | string | Yes | development, staging, production |

---

## 3. PII Redaction Rules

ChainIQ handles PII from multiple jurisdictions (MENA, EU). All security logs must redact PII to comply with data minimization requirements.

### Redaction Functions

```javascript
/**
 * PII redaction utilities for security logging.
 * Applied before any log entry is written.
 */
const piiRedactor = {
  /**
   * Hash email for logging — preserves correlation without exposing address.
   * Uses SHA-256 with a per-deployment salt (from env var).
   */
  hashEmail(email) {
    const salt = process.env.LOG_PII_SALT || 'chainiq-default-salt';
    return crypto.createHash('sha256')
      .update(salt + email.toLowerCase().trim())
      .digest('hex')
      .slice(0, 16); // First 16 hex chars = 64-bit identifier
  },

  /**
   * Truncate sensitive input for logging.
   * Shows enough context for debugging without full content.
   */
  truncateInput(input, maxLength = 100) {
    if (!input || input.length <= maxLength) return input;
    return input.slice(0, maxLength) + `... [truncated, ${input.length} chars total]`;
  },

  /**
   * Mask API key — show prefix only for identification.
   */
  maskApiKey(key) {
    if (!key || key.length < 12) return '[invalid-key]';
    return key.slice(0, 8) + '...';
  },

  /**
   * Mask JWT token — show type and expiry hint only.
   */
  maskToken(token) {
    if (!token) return '[no-token]';
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return `[jwt:exp=${new Date(payload.exp * 1000).toISOString()}]`;
    } catch {
      return '[jwt:invalid]';
    }
  },

  /**
   * Redact file paths — remove user-specific directory prefixes.
   */
  redactPath(filePath) {
    if (!filePath) return '[no-path]';
    // Keep only the relative portion within PROJECT_DIR
    const projectDir = process.env.PROJECT_DIR || '';
    if (filePath.startsWith(projectDir)) {
      return filePath.slice(projectDir.length);
    }
    return path.basename(filePath); // Just filename if outside project
  },
};
```

---

## 4. Retention Policy

| Log Category | Retention (Raw) | Retention (Aggregated) | Storage | Rationale |
|-------------|-----------------|----------------------|---------|-----------|
| Authentication events | 90 days | 12 months (counts only) | Structured JSON files + Supabase | GDPR Art. 5(1)(e) — storage limitation |
| Authorization events | 90 days | 12 months (counts only) | Structured JSON files + Supabase | Compliance audit trail |
| Security threat events | 180 days | 24 months (counts + patterns) | Structured JSON files + Supabase | Incident investigation, pattern analysis |
| Data lifecycle events | 365 days | Permanent (event + timestamp only) | Supabase audit_logs table | GDPR proof of deletion, consent management |
| Debug logs | 7 days | Not retained | Local files only | Development troubleshooting |

### Purge Schedule

```
Daily:   Delete debug logs older than 7 days
Weekly:  Aggregate auth/authz events older than 90 days → monthly counts
Monthly: Aggregate security events older than 180 days → monthly patterns
Yearly:  Review data lifecycle events, verify GDPR compliance
```

### Supabase audit_logs Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  category TEXT NOT NULL CHECK (category IN ('auth', 'authz', 'security', 'data')),
  event TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('debug', 'info', 'warn', 'error', 'fatal')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip INET,
  request_id UUID,
  data JSONB,
  environment TEXT NOT NULL DEFAULT 'production',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying by user (GDPR data access requests)
CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id, timestamp DESC);

-- Index for querying by category + severity (security monitoring)
CREATE INDEX idx_audit_logs_category_severity ON audit_logs (category, severity, timestamp DESC);

-- Index for querying by event type (pattern analysis)
CREATE INDEX idx_audit_logs_event ON audit_logs (event, timestamp DESC);

-- RLS: Only admins can read audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit logs" ON audit_logs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- Service role inserts (server-side only, no user can insert directly)
CREATE POLICY "Service role inserts audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);
-- Note: INSERT policy applies to service_role key only since no user-facing INSERT exists
```

---

## 5. Integration with Existing Logger

ChainIQ's bridge server already has `bridge/logger.js` with `logger.security()`. Extend it to write to both file and Supabase:

```javascript
/**
 * Extended security logger that writes to:
 * 1. Structured JSON file (immediate, local)
 * 2. Supabase audit_logs table (async, durable)
 *
 * File logging is synchronous-safe (append-only).
 * Supabase logging is fire-and-forget with retry.
 */
class SecurityAuditLogger {
  constructor({ supabase, logDir, environment }) {
    this.supabase = supabase;
    this.logDir = logDir;
    this.environment = environment || process.env.NODE_ENV || 'development';
    this.pendingWrites = [];
    this.flushInterval = setInterval(() => this.flushToSupabase(), 10000); // Batch every 10s
  }

  /**
   * Log a security event.
   * Writes to file immediately, batches Supabase writes.
   */
  async log(event, severity, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: severity,
      category: event.split('.')[0], // e.g., 'auth' from 'auth.login.success'
      event,
      service: 'bridge-server',
      version: process.env.npm_package_version || '4.6.8',
      request_id: data.request_id || null,
      ip: data.ip || null,
      user_id: data.user_id || null,
      data: this.redactPII(data),
      environment: this.environment,
    };

    // 1. Write to file (immediate)
    this.writeToFile(entry);

    // 2. Queue for Supabase (batched)
    this.pendingWrites.push(entry);
  }

  writeToFile(entry) {
    const date = entry.timestamp.split('T')[0]; // YYYY-MM-DD
    const filePath = path.join(this.logDir, `security-${date}.jsonl`);
    fs.promises.appendFile(filePath, JSON.stringify(entry) + '\n').catch(err => {
      console.error('Failed to write security log:', err.message);
    });
  }

  async flushToSupabase() {
    if (this.pendingWrites.length === 0) return;

    const batch = this.pendingWrites.splice(0, 100); // Max 100 per batch
    try {
      await this.supabase.insertAuditLogs(batch);
    } catch (err) {
      // Re-queue failed writes (max 3 retries tracked per entry)
      for (const entry of batch) {
        entry._retries = (entry._retries || 0) + 1;
        if (entry._retries < 3) {
          this.pendingWrites.push(entry);
        }
        // After 3 retries, the entry is in the file log but not in Supabase
      }
    }
  }

  redactPII(data) {
    const redacted = { ...data };
    if (redacted.email) redacted.email = piiRedactor.hashEmail(redacted.email);
    if (redacted.token) redacted.token = piiRedactor.maskToken(redacted.token);
    if (redacted.api_key) redacted.api_key = piiRedactor.maskApiKey(redacted.api_key);
    if (redacted.input) redacted.input = piiRedactor.truncateInput(redacted.input);
    if (redacted.file_path) redacted.file_path = piiRedactor.redactPath(redacted.file_path);
    return redacted;
  }

  destroy() {
    clearInterval(this.flushInterval);
    this.flushToSupabase(); // Final flush
  }
}
```

---

## 6. GDPR-Specific Audit Requirements

### Right to Erasure (Art. 17) — Deletion Audit Trail

When a user account is deleted, the system must:

1. **Log the deletion event** with timestamp, admin who performed it, and tables cleaned
2. **Retain the log entry** for 365 days (proof of compliance)
3. **Redact the user_id** from all other log entries after 30 days (the user no longer exists)
4. **Not retain** any PII beyond the audit trail entry

### Right to Access (Art. 15) — Access Log

When a user requests data access:

1. **Log the request** with timestamp and user_id
2. **Log the delivery** with export format and tables included
3. **Retain** for 365 days (proof of response within 30-day deadline)

### Data Breach Notification (Art. 33/34)

If a security incident is detected:

1. **Timestamp the detection** (Art. 33: 72 hours to notify authority)
2. **Log scope assessment** (which users affected, what data exposed)
3. **Log notification actions** (authority notified, users notified)
4. **Retain indefinitely** (breach records are permanent)

---

## 7. Monitoring Dashboard Queries

### Top Failed Logins (Last 24 Hours)

```sql
SELECT
  data->>'ip' AS ip,
  data->>'email' AS email_hash,
  COUNT(*) AS failures,
  MAX(timestamp) AS last_attempt
FROM audit_logs
WHERE event = 'auth.login.failure'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY data->>'ip', data->>'email'
ORDER BY failures DESC
LIMIT 20;
```

### Security Events by Severity (Last 7 Days)

```sql
SELECT
  severity,
  event,
  COUNT(*) AS count,
  MIN(timestamp) AS first_seen,
  MAX(timestamp) AS last_seen
FROM audit_logs
WHERE category = 'security'
  AND timestamp > NOW() - INTERVAL '7 days'
GROUP BY severity, event
ORDER BY
  CASE severity WHEN 'fatal' THEN 0 WHEN 'error' THEN 1 WHEN 'warn' THEN 2 ELSE 3 END,
  count DESC;
```

### GDPR Compliance Check (Deletion Coverage)

```sql
-- Verify all deleted users have complete deletion audit trails
SELECT
  al.user_id,
  al.timestamp AS deleted_at,
  al.data->>'tables_cleaned' AS tables_cleaned,
  CASE
    WHEN al.data->>'tables_cleaned' IS NULL THEN 'INCOMPLETE'
    WHEN jsonb_array_length(al.data->'tables_cleaned') < 7 THEN 'PARTIAL'
    ELSE 'COMPLETE'
  END AS deletion_status
FROM audit_logs al
WHERE al.event = 'data.user.deleted'
  AND al.timestamp > NOW() - INTERVAL '365 days'
ORDER BY al.timestamp DESC;
```
