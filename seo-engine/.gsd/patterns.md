# Sprint Patterns — Do Not Deviate

## File Naming [pinned]
- OAuth module: `bridge/oauth.js` — separate module consumed by server.js handlers
- Migrations: `migrations/NNN-descriptive-name.sql` — sequential numbering
- Tests: `tests/module-name.test.js` — mirrors module names

## Import Conventions [pinned]
- `const crypto = require('crypto');` — Node.js built-ins
- `const supabase = require('./supabase-client');` — local modules
- `const { encrypt, decrypt } = require('./key-manager');` — destructured exports
- `const logger = require('./logger');` — structured logging

## Error Handling [pinned]
- Retry with exponential backoff: 3 attempts [5s, 15s, 45s], early exit on unrecoverable errors (4xx)
- All errors logged via `logger.info/warn/error()` with structured data objects
- OAuth errors: redirect to dashboard with `?error=` query param, not JSON response
- API errors: `json(res, statusCode, { success: false, error: message })`

## Database [pinned]
- State for transient auth data stored in Supabase (not in-memory) via REST + service_role
- Token encryption at rest: `encrypt()` before DB write, `decrypt()` on retrieval, never plaintext
- Explicit column selection to exclude sensitive fields from list endpoints
- Migration SQL matches unified-schema.md exactly — copy DDL verbatim

## Ingestion Module Pattern [pinned]
- All connectors in `bridge/ingestion/` export `handleTrigger(userId, body)` and `handleStatus(userId, ...)`
- `getSupabaseAdmin()` helper for service_role operations: `{ config, serviceRoleKey }`
- Constants at top: API base URLs, batch sizes, retry delays, lookback windows
- `sleep(ms)` and `formatDate(date)` helper functions
- 500-row batch upserts for high-volume data
- ingestion_jobs table tracks sync progress with metadata JSONB
- Structured logging: `module_action_started`, `module_action_completed`, `module_action_failed`

## Server Endpoint Pattern [pinned]
- GSC/GA4/crawler endpoints follow identical structure: auth check, rate limit, try/catch, json response
- Rate limits: trigger endpoints 5/min, status endpoints 30/min, crawl trigger 3/min
- Import connector at top of server.js: `const module = require('./ingestion/module');`

## HTML Parsing (No DOMParser)
- Server-side HTML parsing uses regex only — no DOMParser in Node.js
- Content selectors: prioritize article, main, [role="main"] for body text
- Strip: script, style, nav, header, footer, .sidebar, .comments

## Quality Engine Pattern [pinned]
- Quality/scoring modules live in `engine/` directory, separate from bridge server
- Checklist definition: array of `{ id, category, label }` with evaluator returning `{ id, category, label, status, value, expected, message }`
- E-E-A-T scoring: dimension array with `{ name, score, maxScore, description }` and letter grades (A>=27, B>=22, C>=16, D>=10, F<10)
- Suggestion map: keyed by item ID with `{ suggestion, impact }`, capped at 15 results
- Article retrieval: `supabase.getArticle(token, id)` with fallback fields (html_content || content, keyword || topic)

## Intelligence Module Pattern [pinned]
- Intelligence modules live in `bridge/intelligence/` directory
- Export handler functions: `handleList(userId, query)`, `handleDetail(userId, id)`, etc.
- Use `getSupabaseAdmin()` for service_role DB queries
- Paginated fetch with 1000-row pages for large datasets
- Structured results with severity/score/metadata fields
- Fuzzy matching uses normalized lowercase comparison with keyword containment
- Cannibalization strategies: merge, redirect, differentiate, deoptimize — each with confidence score

## Library Decisions
- Zero npm dependencies — Node.js built-ins only (crypto, http, fs, path)
- PKCE: 64-byte verifier, SHA-256 challenge, base64url (RFC 7636)
- Token proactive refresh: 24h window before expiry
- Test mock pattern: global fetch mock with handler function, restored in afterEach
- URL validation: reject localhost, private IPs, non-HTTP(S)
- GA4 Data API v1beta for analytics (not Universal Analytics)
- GSC Search Analytics API v3 for search performance data
