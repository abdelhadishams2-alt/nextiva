# INT-003: API Key Manager

**Type:** API
**Effort:** L (8h)
**Priority:** P0
**Dependencies:** INT-001
**Sprint:** S12

## Description

Build encrypted API key management module for the bridge server. Keys are stored encrypted in Supabase, never returned in full via API, and injected into environment before Claude CLI subprocess spawning.

## Context Header

- `bridge/server.js` — add admin endpoints
- `bridge/supabase-client.js` — key storage queries
- `dev_docs/phase-3-plan.md` — Streams B2 + B3

## Acceptance Criteria

- [ ] New module `bridge/key-manager.js` created
- [ ] Encrypts keys using `crypto.createCipheriv` with AES-256-GCM
- [ ] Encryption key derived from `BRIDGE_ENCRYPTION_KEY` env var (auto-generated on first run, logged once to console)
- [ ] `encryptKey(plaintext)` returns `{ encrypted, iv, authTag }` — all base64
- [ ] `decryptKey(encrypted, iv, authTag)` returns plaintext
- [ ] `resolveKeys()` returns all active keys decrypted for environment injection
- [ ] Never returns full key values via API — only hints (`****abcd`, last 4 chars)
- [ ] `GET /api/admin/api-keys` — list keys (name + hint + status, never values). Admin only.
- [ ] `POST /api/admin/api-keys` — add new key (name, value, scope). Admin only.
- [ ] `PUT /api/admin/api-keys/:id` — rotate key (new value, old invalidated). Admin only.
- [ ] `DELETE /api/admin/api-keys/:id` — soft-delete (set is_active=false). Admin only.
- [ ] `POST /api/admin/api-keys/:id/test` — test key validity (ping target service). Admin only.
- [ ] Key types supported: `gemini_api_key`, `custom_llm_key`, `webhook_signing_key`
- [ ] Pipeline integration: before Claude CLI subprocess spawn, `resolveKeys()` called and keys set as env vars
- [ ] No key files written to disk — keys flow from Supabase → bridge → env → subprocess
- [ ] Tests: encrypt/decrypt roundtrip, key CRUD, admin-only access, hint generation, key rotation
- [ ] Zero new npm dependencies (use Node.js `crypto` built-in)
