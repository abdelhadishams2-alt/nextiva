# DR Playbook: Secret Key Compromise

> **Severity:** SEV1
> **RTO (Recovery Time Objective):** 1 hour (service restoration after key rotation)
> **RPO (Recovery Point Objective):** N/A (no data loss expected from key rotation)
> **Last Tested:** [Update after each drill]
> **Owner:** Solo Developer

---

## 1. Overview

A secret key compromise occurs when any credential used by the ChainIQ platform is exposed to unauthorized parties. This is always a SEV1 event because compromised credentials can lead to data exfiltration, unauthorized API usage, financial loss (LLM API billing), and complete platform takeover. The solo developer context means speed is paramount — there is no security team to delegate to, so this playbook must be executed sequentially and completely.

### Key Inventory

The following secrets are used across ChainIQ and must all be considered during a compromise event:

| Key | Location | Blast Radius |
|-----|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Coolify env vars | Full database access bypassing RLS — highest risk |
| `SUPABASE_ANON_KEY` | Coolify env vars, Dashboard client | Public-facing, limited by RLS, but rotation still required |
| `SUPABASE_DB_PASSWORD` | Coolify env vars | Direct PostgreSQL access, complete data exposure |
| `SUPABASE_JWT_SECRET` | Coolify env vars | Can forge authentication tokens for any user |
| `OPENAI_API_KEY` | Coolify env vars | Unauthorized LLM usage, financial exposure |
| `ANTHROPIC_API_KEY` | Coolify env vars | Unauthorized LLM usage, financial exposure |
| `COOLIFY_API_TOKEN` | Coolify dashboard | Can redeploy, modify, or delete all applications |
| `CLOUDFLARE_API_TOKEN` | Coolify env vars | DNS hijacking, CDN cache poisoning |
| `BRIDGE_API_KEYS` | Coolify env vars, client configs | Unauthorized API access to all 48 endpoints |
| `CRISP_API_KEY` | Dashboard env vars | Access to customer support conversations |
| SSH private keys | Local machine, CI/CD | Full server access |

---

## 2. Detection

### Automated Detection

1. **Gitleaks CI alert** — Gitleaks runs in the CI pipeline and scans every commit for secret patterns. An alert means a key was committed to version control.
2. **GitHub Secret Scanning** — If the repository is on GitHub, their built-in secret scanning will alert on known credential patterns and may auto-revoke some (e.g., certain cloud provider keys).
3. **Unusual API billing spikes** — OpenAI/Anthropic dashboards show unexpected usage. Set up billing alerts at thresholds (e.g., $50/day).
4. **Supabase audit logs** — Unusual query patterns, access from unfamiliar IPs, or bulk data exports.

### Manual Detection

1. **Unexpected behavior** — Articles being generated that nobody requested, unknown users appearing, data modifications you didn't make.
2. **Third-party notification** — A security researcher, customer, or service provider reports finding your credentials.
3. **Self-discovery** — You find credentials in a public repository, paste bin, log file, or error message.

### Severity Assessment

| Scenario | Severity | Immediate Risk |
|----------|----------|----------------|
| Key committed to public GitHub repo | SEV1 — CRITICAL | Automated scrapers find exposed keys within minutes |
| Key committed to private repo | SEV1 — HIGH | Any contributor (current or future) has access |
| Key found in application logs | SEV1 — HIGH | Log aggregation services, log files may be accessible |
| Key exposed in client-side code | SEV1 — CRITICAL | Every user's browser has received the key |
| Key shared via insecure channel (Slack, email) | SEV2 — MODERATE | Limited exposure but rotation still required |

---

## 3. Immediate Response (0-30 minutes)

**CRITICAL: Do not waste time investigating scope before rotating. Rotate first, investigate after.**

### Step 1: Rotate ALL Supabase Keys (Priority 1)

Even if only one key was compromised, rotate all Supabase keys because they are interdependent:

1. **Log into Supabase Dashboard** → Project Settings → API
2. **Generate new `anon` key and `service_role` key:**
   - Go to Settings → API → Regenerate API Keys
   - Copy both new keys immediately to your password manager
3. **Rotate the database password:**
   - Go to Settings → Database → Connection String
   - Click "Reset Database Password"
   - Save the new password to your password manager
4. **Rotate JWT secret** (if compromised):
   - Go to Settings → API → JWT Settings
   - Generate a new JWT secret
   - WARNING: This will invalidate ALL existing user sessions

### Step 2: Update Coolify Environment Variables

```bash
# SSH into the Hetzner server
ssh root@[HETZNER_IP]

# Update via Coolify dashboard (preferred):
# 1. Open Coolify admin panel
# 2. Navigate to the bridge server application
# 3. Go to Environment Variables
# 4. Update each compromised key with the new value
# 5. Click "Save" and "Redeploy"

# Alternative: Update via Docker directly (if Coolify is inaccessible)
docker exec [CONTAINER_ID] sh -c "cat > /app/.env.override << 'EOF'
SUPABASE_SERVICE_ROLE_KEY=[NEW_KEY]
SUPABASE_ANON_KEY=[NEW_KEY]
SUPABASE_DB_PASSWORD=[NEW_PASSWORD]
EOF"
docker restart [CONTAINER_ID]
```

### Step 3: Update Dashboard Environment Variables

If the Dashboard is deployed separately (Next.js):

1. Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the Dashboard's Coolify env vars.
2. Redeploy the Dashboard application.
3. Purge the Cloudflare CDN cache to ensure no clients receive stale JavaScript bundles with the old key:
   ```bash
   curl -X POST "https://api.cloudflare.com/client/v4/zones/[ZONE_ID]/purge_cache" \
     -H "Authorization: Bearer [CLOUDFLARE_API_TOKEN]" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'
   ```

### Step 4: Rotate LLM API Keys

1. **OpenAI:** https://platform.openai.com/api-keys → Delete compromised key → Create new key
2. **Anthropic:** https://console.anthropic.com/settings/keys → Delete compromised key → Create new key
3. Update Coolify environment variables with new keys.

### Step 5: Rotate Other Keys As Needed

- **Cloudflare API Token:** Cloudflare Dashboard → My Profile → API Tokens → Roll
- **Coolify API Token:** Coolify → Settings → API → Regenerate
- **SSH Keys:** Generate new key pair, update authorized_keys on server, update CI/CD
- **Bridge API Keys:** Generate new keys, distribute to all clients

### Step 6: Invalidate All Active Sessions

```sql
-- Run in Supabase SQL Editor (if JWT secret was rotated, this happens automatically)
-- Otherwise, manually clear sessions:
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
```

This will force all users to re-authenticate with the new keys.

---

## 4. Containment (30-60 minutes)

### Step 1: Remove the Exposed Secret

If the key was committed to version control:

```bash
# If the commit is only local (not pushed)
git reset HEAD~1
# Remove the file containing the secret, add to .gitignore

# If the commit was pushed to a PRIVATE repo
# Rewrite history to remove the secret
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch [FILE_WITH_SECRET]" \
  --prune-empty --tag-name-filter cat -- --all
git push --force-with-lease

# If the commit was pushed to a PUBLIC repo
# THE KEY IS PERMANENTLY COMPROMISED regardless of history rewrite
# History rewrite is still good practice but does NOT undo exposure
# Ensure rotation (Step 3 above) is complete
```

If the key was exposed in logs:
```bash
# Delete the log entries containing the secret
# In Coolify: clear application logs
# On server: find and redact log files
grep -rl "[SECRET_PATTERN]" /var/log/ | xargs sed -i 's/[SECRET_PATTERN]/[REDACTED]/g'
```

### Step 2: Audit Access Logs

Check what the compromised key was used for during the exposure window:

```sql
-- Check Supabase auth logs for unusual activity
SELECT * FROM auth.audit_log_entries
WHERE created_at > '[EXPOSURE_START_TIME]'
ORDER BY created_at DESC;

-- Check for data access from unusual sources
SELECT * FROM auth.sessions
WHERE created_at > '[EXPOSURE_START_TIME]'
AND ip NOT IN ('[YOUR_KNOWN_IPS]');
```

```bash
# Check bridge server access logs for unusual API calls
docker logs [CONTAINER_ID] 2>&1 | grep -E "POST|PUT|DELETE" | grep -v "[YOUR_KNOWN_IPS]"

# Check OpenAI usage during exposure window
# Navigate to: https://platform.openai.com/usage
# Look for usage spikes outside your normal patterns
```

### Step 3: Assess Data Exposure

1. If `service_role` key was compromised: assume all database data was accessible. Check for evidence of bulk exports.
2. If `anon` key was compromised: exposure is limited to what RLS policies allow. Lower risk but still rotate.
3. If LLM API keys were compromised: check for financial impact (usage billing).

---

## 5. Communication

### Internal (Incident Log)

Document everything in the incident log with timestamps: what was compromised, how it was discovered, what was rotated, audit findings.

### Customer-Facing

If user data was potentially accessed:

1. Update status page: **"Security Incident — We detected unauthorized access to our systems. We have rotated all credentials and are investigating the scope of impact."**
2. Prepare individual notifications for affected users (if PII was exposed).
3. Consult legal counsel regarding data breach notification requirements (especially for MENA region regulations).

### Vendor Notification

- If Supabase keys were compromised, notify Supabase support so they can monitor for unusual activity on their side.
- If LLM API keys were used by attackers, notify OpenAI/Anthropic — they may be able to provide usage logs.

---

## 6. Post-Incident (Within 48 Hours)

### Step 1: Postmortem

Write a blameless postmortem documenting:
- How the key was exposed (root cause)
- Timeline of detection, rotation, and containment
- What data was potentially accessed
- Action items to prevent recurrence

### Step 2: Strengthen Preventive Controls

1. **Update `.gitignore`** to include all secret file patterns.
2. **Verify Gitleaks** is running on every commit (pre-commit hook) and in CI.
3. **Audit all environment variable usage** — ensure no secrets are logged, included in error messages, or sent to the frontend.
4. **Enable GitHub secret scanning** if not already active.
5. **Review `SECURITY.md`** and update with lessons learned.
6. **Consider implementing:**
   - Secret rotation schedule (quarterly)
   - Runtime secret injection (e.g., Vault, Doppler) instead of .env files
   - IP allowlisting for Supabase direct connections
   - API key usage alerts/thresholds

### Step 3: Verify All Systems Operational

Run through a complete checklist:
- [ ] Bridge server healthy with new keys
- [ ] Dashboard loading with new anon key
- [ ] User authentication working
- [ ] Article generation pipeline functional
- [ ] Analytics recording events
- [ ] Publishing endpoints responding
- [ ] All external API integrations verified (OpenAI, Anthropic, Cloudflare)
- [ ] CDN cache purged
- [ ] Old keys confirmed revoked (test with old key, expect 401)
