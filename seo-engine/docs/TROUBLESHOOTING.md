# ChainIQ Troubleshooting Guide

## 1. Bridge Server Won't Start

**Symptom:** `Port 19847 is already in use`

**Fix:**
```bash
# Find the existing process
# macOS/Linux:
lsof -i :19847
# Windows:
netstat -ano | findstr 19847

# Kill it, then restart
kill <PID>                    # macOS/Linux
taskkill /PID <PID> /F        # Windows

# Or use a different port
BRIDGE_PORT=19848 node bridge/server.js
```

## 2. "Authentication required" on Every Request

**Symptom:** All authenticated endpoints return 401.

**Causes:**
- Missing or expired Bearer token in `Authorization` header
- Supabase URL or anon key misconfigured

**Fix:**
1. Check `.env` has correct `SUPABASE_URL` and `SUPABASE_ANON_KEY`
2. Verify the token hasn't expired (default 1 hour)
3. Re-login via `/auth/login` to get a fresh token
4. Check bridge server logs for `auth_invalid_token` events

## 3. "Account is pending approval"

**Symptom:** Login succeeds but returns 403 with "pending approval" message.

**Fix:**
1. An admin must approve the user via the dashboard or API:
   ```bash
   curl -X POST http://127.0.0.1:19847/admin/approve \
     -H "Authorization: Bearer <admin-token>" \
     -H "Content-Type: application/json" \
     -d '{"user_id": "<user-uuid>"}'
   ```
2. Or use the Admin panel in the dashboard UI

## 4. Edit Fails with "Cannot connect to bridge server"

**Symptom:** Clicking "Apply Edit" in the article shows the fallback prompt.

**Causes:**
- Bridge server not running
- Wrong port
- CORS blocking (if article served from a domain)

**Fix:**
1. Start the bridge: `npm run bridge` or `node bridge/server.js <project-dir>`
2. Verify it's running: `curl http://127.0.0.1:19847/health`
3. Check browser console for network errors
4. If using a custom port, update `BRIDGE_URL` in the article's JavaScript

## 5. Edit Hangs / Times Out

**Symptom:** Edit shows "Sending..." indefinitely, then times out after 10 minutes.

**Causes:**
- Claude CLI not installed or not in PATH
- Claude CLI session conflict
- Very complex edit on a large section

**Fix:**
1. Verify Claude CLI is available: `claude --version`
2. Check that no other Claude Code session is active (the CLAUDECODE env var is stripped automatically, but conflicts can occur)
3. Check bridge server logs for subprocess errors
4. For large sections, try a more specific edit instruction

## 6. "Subprocess output exceeded 4MB limit"

**Symptom:** Edit returns HTTP 413.

**Cause:** Claude CLI generated an unexpectedly large response.

**Fix:**
1. Make the edit instruction more specific (e.g., "change the heading" instead of "rewrite everything")
2. If the section is very large, consider splitting it into smaller sections
3. This is a safety limit — it prevents memory exhaustion

## 7. Rate Limited (429 Too Many Requests)

**Symptom:** `Too many attempts. Please wait a minute.`

**Fix:**
1. Wait 60 seconds — rate limits reset per minute
2. Rate limits are per endpoint and per IP/email:
   - Auth endpoints: 10/minute
   - Edit endpoint: 10/minute
3. Rate limiter resets on server restart (in-memory only)

## 8. Dashboard Shows "No articles found"

**Symptom:** Dashboard pages are empty despite generated articles.

**Causes:**
- Articles were generated before the dashboard tables existed
- User doesn't have an active subscription (RLS blocks access)
- Wrong Supabase project

**Fix:**
1. Check that migration `002-dashboard-tables.sql` has been run
2. Verify the user's subscription is `active` (not `pending`)
3. Check `SUPABASE_URL` points to the correct project
4. Try creating an article via the API to verify the pipeline works:
   ```bash
   curl -X POST http://127.0.0.1:19847/api/articles \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"title": "Test Article", "topic": "test"}'
   ```

## 9. Prompt Injection Blocked

**Symptom:** `Edit prompt rejected: <reason>`

**Cause:** The prompt guard detected a potential injection pattern in the edit input.

**Fix:**
1. Rephrase the edit without using system-level language
2. Avoid phrases like "ignore instructions", "you are now", "execute command"
3. Focus on content changes: "make this more concise", "add statistics", "change tone to formal"
4. The guard scans only the "User requested change:" section — the rest of the prompt is trusted

## 10. WebSocket/SSE Progress Not Working

**Symptom:** Edit progress indicator doesn't update.

**Cause:** The SSE endpoint requires an active subscription and valid token.

**Fix:**
1. Verify authentication is working (`/auth/verify` returns 200)
2. Check that the browser supports `EventSource` (SSE)
3. The progress endpoint is `/api/queue/job/<id>/progress`
4. Progress updates are best-effort — the edit will still complete even without progress feedback

## Getting Help

- Check bridge server logs (stdout for info, stderr for errors)
- Set `LOG_LEVEL=debug` for verbose logging
- File issues at the project repository
