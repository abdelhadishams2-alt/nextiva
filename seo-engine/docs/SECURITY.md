# ChainIQ Security Model

## Architecture Overview

ChainIQ uses a layered security model:

```
Browser → Bridge Server (localhost:19847) → Supabase Auth → Database (RLS)
                ↓
          Claude CLI subprocess (sandboxed edit execution)
```

## Authentication

### Supabase Auth
- JWT-based authentication via Supabase's GoTrue service
- Access tokens are short-lived (1 hour default)
- Refresh tokens handled by Supabase client-side SDK
- Tokens are **never** written to disk — stored only in browser `localStorage`

### Token Verification Cache
- Bridge server caches verified tokens for 30 seconds (SHA-256 hashed)
- Reduces Supabase API calls during rapid sequential requests
- Cache is in-memory only — cleared on server restart
- Maximum 200 cached entries with automatic eviction

### Anon Key vs Service Role Key

| Key | Purpose | Exposure |
|-----|---------|----------|
| `SUPABASE_ANON_KEY` | Client-side API access, subject to RLS policies | Safe to expose in browser code |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin operations, bypasses RLS | **Never expose** — server-side only |

The anon key is intentionally included in generated article HTML so the edit UI can authenticate users. This is Supabase's designed architecture — Row Level Security (RLS) policies protect all data.

The service role key is used only for:
- Admin user management (approve/revoke/delete users)
- Subscription status checks for privilege verification
- Usage logging that bypasses per-user RLS

## Row Level Security (RLS)

Every table has RLS enabled with policies that restrict access:

- **subscriptions**: Users can only read their own subscription
- **usage_logs**: Users can read/insert their own logs only
- **articles**: Users can CRUD their own articles only
- **article_versions**: Users can read versions of their own articles
- **pipeline_jobs**: Users can read their own jobs, insert new ones

Admin operations use the service role key to bypass RLS.

## Input Validation

### Path Traversal Prevention (4 layers)
1. Reject paths containing `..`
2. Reject absolute paths (Unix `/` and Windows `C:\`)
3. Whitelist `.html` extension only
4. Verify resolved path starts with `PROJECT_DIR`

### Prompt Injection Guard
13 pattern categories are scanned in user-controlled edit prompts:
- Role prefix injection (`system:`, `assistant:`)
- XML/HTML tag injection (`<system>`, `<instructions>`)
- Instruction override (`ignore previous`, `forget your instructions`)
- Identity reassignment (`you are now`, `act as`)
- Code execution attempts (`execute`, `run command`, `eval`)
- File system manipulation (`write file`, `delete`, `chmod`)
- Network access attempts (`curl`, `wget`, `fetch url`)
- Data exfiltration (`send to`, `upload`, `exfiltrate`)
- System prompt extraction (`show system prompt`, `reveal instructions`)
- Encoding obfuscation (`base64 decode`, `hex decode`)

Only the user-controlled portion of the prompt is scanned (the "User requested change:" section). Maximum user input length: 2000 characters.

### Request Size Limits
- Request body: 64KB max
- Subprocess output: 4MB max (process killed if exceeded)
- Edit prompt: 8000 characters max
- Rate limiting: 10 requests/minute per endpoint

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/signup` | 10/min | Per email + IP |
| `/auth/login` | 10/min | Per email + IP |
| `/auth/verify` | 10/min | Per IP |
| `/apply-edit` | 10/min | Per IP |

Rate limiter state is in-memory only. Resets on server restart. For production deployment, replace with Redis-backed rate limiting.

## Subprocess Security

Claude CLI is spawned with:
- Sandboxed to `PROJECT_DIR` via `cwd` option
- No shell environment variables leaked (CLAUDECODE stripped)
- 10-minute timeout with automatic SIGTERM
- 4MB output cap with automatic SIGTERM
- Prompt injection guard runs before spawn

## Key Rotation

### Rotating Supabase Keys
1. Generate new keys in Supabase dashboard → Settings → API
2. Update `SUPABASE_ANON_KEY` in environment
3. Update `SUPABASE_SERVICE_ROLE_KEY` in environment
4. Restart bridge server
5. Update any generated articles that embed the anon key

### Rotating Webhook Secrets
1. Update the secret via `POST /api/webhooks` (admin only)
2. Update the receiving endpoint to verify the new signature
3. Old webhooks in flight will fail signature verification (expected)

## CORS Policy

The bridge server sets `Access-Control-Allow-Origin: *` because generated articles are opened as `file://` URLs (Origin is `null`). For production deployment behind a domain, restrict CORS to specific origins.

## Threat Model

| Threat | Mitigation |
|--------|-----------|
| Token theft from disk | Tokens never written to disk (P0 fix applied) |
| Service role key exposure | Environment variable only, never in client code |
| Path traversal via edit | 4-layer path validation |
| Prompt injection via edit | 13-pattern guard + 2000 char limit |
| DoS via large responses | 4MB subprocess output cap |
| Brute force auth | Rate limiting on all auth endpoints |
| CSRF | Bearer token auth (not cookie-based) |
| XSS in generated articles | HTML escaping in all template outputs |
