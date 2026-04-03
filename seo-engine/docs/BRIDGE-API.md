# Bridge Server API Reference

Base URL: `http://127.0.0.1:19847`

All responses are JSON. CORS is enabled for all origins (localhost-only server).

## Authentication

Authenticated endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Tokens are obtained via `/auth/login`. Admin endpoints additionally require the user to have `role: 'admin'` in the subscriptions table.

## Rate Limiting

- `/auth/signup`, `/auth/login`: 10 requests/minute per email or IP
- `/auth/verify`: 10 requests/minute per IP
- `/apply-edit`: 10 requests/minute per IP

Rate-limited requests return `429 Too Many Requests`.

---

## Endpoints

### `GET /health`

Server health check. No authentication required.

**Response:**
```json
{ "status": "ok", "uptime": 1234 }
```

**Example:**
```bash
curl http://127.0.0.1:19847/health
```

---

### `POST /auth/signup`

Create a new user account. Account starts in `pending` status until an admin approves it.

**Request Body:**
```json
{ "email": "user@example.com", "password": "securepass" }
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Account created! Your access is pending admin approval.",
  "user": { "id": "uuid", "email": "user@example.com" }
}
```

**Errors:** `400` (missing fields, password < 6 chars), `429` (rate limited)

**Example:**
```bash
curl -X POST http://127.0.0.1:19847/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"securepass"}'
```

---

### `POST /auth/login`

Sign in with email and password. Returns an access token and subscription status.

**Request Body:**
```json
{ "email": "user@example.com", "password": "securepass" }
```

**Response (200):**
```json
{
  "status": "success",
  "access_token": "eyJ...",
  "user": { "id": "uuid", "email": "user@example.com" },
  "subscription": { "plan": "starter", "status": "active", "role": "user" }
}
```

**Errors:** `401` (invalid credentials), `429` (rate limited)

**Example:**
```bash
curl -X POST http://127.0.0.1:19847/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"securepass"}'
```

---

### `GET /auth/verify`

Verify a token and return user/subscription info. Uses a 30-second TTL cache to avoid redundant Supabase calls.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "status": "ok",
  "user": { "id": "uuid", "email": "user@example.com" },
  "subscription": { "plan": "starter", "status": "active" }
}
```

**Errors:** `401` (no token, invalid/expired token), `429` (rate limited)

**Example:**
```bash
curl http://127.0.0.1:19847/auth/verify \
  -H "Authorization: Bearer eyJ..."
```

---

### `POST /apply-edit`

Apply a section edit to an article via Claude CLI. Requires an active subscription. Only one edit can run at a time (global mutex).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "prompt": "SECTION_EDIT:\nArticle file: my-article.html\nSection ID: intro-1\nUser requested change: Make the introduction more engaging"
}
```

The prompt must:
- Include `SECTION_EDIT:` marker
- Include `Article file:`, `Section ID:`, and `User requested change:` fields
- Be under 8000 characters
- Reference a `.html` file within the project directory

**Response (200):**
```json
{ "status": "success", "output": "..." }
```

**Errors:**
- `400` — Invalid prompt format, missing fields, path traversal, non-HTML file, file not found
- `401` — Authentication required or invalid token
- `403` — Account pending approval
- `409` — Another edit is in progress (includes `Retry-After: 30` header)
- `413` — Subprocess output exceeded 4MB limit
- `429` — Rate limited
- `504` — Edit timed out (10 minute limit)

**Example:**
```bash
curl -X POST http://127.0.0.1:19847/apply-edit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ..." \
  -d '{"prompt":"SECTION_EDIT:\nArticle file: articles/my-post.html\nSection ID: intro\nUser requested change: Add a hook sentence"}'
```

---

### `GET /admin/users`

List all users and their subscriptions. Requires admin role.

**Headers:** `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "status": "ok",
  "users": [{ "id": "uuid", "email": "user@example.com", ... }],
  "subscriptions": [{ "user_id": "uuid", "plan": "starter", "status": "active", ... }]
}
```

**Errors:** `401` (no/invalid token), `403` (not admin)

---

### `POST /admin/approve`

Approve a pending user (set subscription status to `active`).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{ "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }
```

**Response (200):**
```json
{ "status": "success", "message": "User approved." }
```

**Errors:** `400` (invalid UUID), `401`, `403`

---

### `POST /admin/revoke`

Revoke a user's access (set subscription status to `pending`).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{ "user_id": "uuid" }
```

**Response (200):**
```json
{ "status": "success", "message": "User access revoked." }
```

---

### `POST /admin/delete`

Delete a user and their subscription permanently.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{ "user_id": "uuid" }
```

**Response (200):**
```json
{ "status": "success", "message": "User deleted." }
```

---

### `POST /admin/add-user`

Create a new user via admin API. User is auto-confirmed and auto-activated (no email verification).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{ "email": "newuser@example.com", "password": "securepass" }
```

**Response (200):**
```json
{
  "status": "success",
  "message": "User created and activated.",
  "user": { "id": "uuid", "email": "newuser@example.com" }
}
```

**Errors:** `400` (missing fields, password < 6 chars), `401`, `403`

---

### `GET /admin/usage`

Get the 50 most recent usage log entries.

**Headers:** `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "status": "ok",
  "logs": [
    { "id": 1, "user_id": "uuid", "action": "edit", "article_file": null, "created_at": "..." }
  ]
}
```

---

## Dashboard API

All dashboard endpoints require Bearer token authentication. Responses use the envelope `{ success, data, meta? }`.

---

### `GET /api/articles`

List the authenticated user's articles (paginated).

**Query params:** `page`, `limit` (max 100), `status`, `search`, `sort`, `order`

**Response (200):**
```json
{
  "success": true,
  "data": [{ "id": "uuid", "title": "...", "topic": "...", "status": "draft", ... }],
  "meta": { "total": 42, "page": 1, "limit": 20 }
}
```

---

### `GET /api/articles/:id`

Get a single article by ID.

**Response (200):** `{ "success": true, "data": { ... } }`

**Errors:** `404` (not found or not owned by user)

---

### `POST /api/articles`

Create a new article record.

**Request Body:**
```json
{ "title": "My Article", "topic": "AI in Healthcare", "language": "en", "framework": "html" }
```

**Response (201):** `{ "success": true, "data": { ... } }`

---

### `PUT /api/articles/:id`

Update article metadata. Only the article owner can update.

**Request Body:** Any subset of `{ title, topic, language, framework, status, file_path, word_count, image_count, metadata, published_at }`

**Response (200):** `{ "success": true, "data": { ... } }`

---

### `DELETE /api/articles/:id`

Delete an article. **Admin only.**

**Response (200):** `{ "success": true, "message": "Article deleted" }`

---

### `GET /api/articles/:id/versions`

Get version history for an article.

**Response (200):** `{ "success": true, "data": [{ "version_number": 1, "section_edited": "intro", ... }] }`

---

### `GET /api/pipeline/status`

Current pipeline status (`idle` or `running`).

**Response (200):** `{ "success": true, "data": { "status": "idle", "active_since": null } }`

---

### `GET /api/pipeline/queue`

List queued pipeline jobs.

**Response (200):** `{ "success": true, "data": [...], "meta": { "total": 3, "page": 1, "limit": 20 } }`

---

### `GET /api/pipeline/history`

List all pipeline jobs (paginated). Supports `page`, `limit`, `status` query params.

**Response (200):** `{ "success": true, "data": [...], "meta": { ... } }`

---

### `GET /api/analytics/overview`

Dashboard overview metrics for the authenticated user.

**Response (200):**
```json
{
  "success": true,
  "data": { "total_articles": 12, "total_jobs": 15, "edits_today": 3 }
}
```

---

## Error Response Format

All errors follow this structure:

```json
{
  "status": "error",
  "error": "Human-readable error message"
}
```

## Security

- Path traversal prevention: `..`, absolute paths, non-`.html` extensions, and out-of-boundary resolution are all blocked
- Request body limit: 64KB max
- Edit prompt limit: 8000 characters max
- Subprocess output limit: 4MB (killed with SIGTERM if exceeded)
- Edit timeout: 10 minutes
- Auth cache: 30-second TTL with SHA-256 hashed token keys
- Rate limiting: per-IP/email, resets every 60 seconds
