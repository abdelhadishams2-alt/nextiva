# ChainIQ — Changelog

All notable changes to ChainIQ are documented here. This changelog follows [Keep a Changelog](https://keepachangelog.com/) format.

---

## [4.6.8] — 2026-03-28

### Added
- **Dashboard Foundation** — Full Next.js 16 dashboard with shadcn/ui (base-ui variant), dark theme with gold accents, and sidebar navigation
- **Article Pipeline UI** — View and manage generated articles from the dashboard with real-time pipeline status
- **Admin Panel** — User management, subscription management, and quota override controls
- **API Key Management** — Create, rotate, and revoke API keys from the dashboard with AES-256-GCM encryption
- **Universal Engine** — Auto-detect project framework and generate native output (Next.js `.tsx`, Vue `.vue`, Svelte `+page.svelte`, WordPress PHP, plain HTML)
- **Multi-language Support** — Generate articles in 11 languages: Arabic, English, French, Spanish, German, Italian, Portuguese, Dutch, Turkish, Japanese, Korean
- **RTL Support** — Full right-to-left layout support for Arabic and Hebrew with CSS logical properties and appropriate font stacks
- **Job Queue** — Supabase-backed job queue replacing the global edit mutex for reliable concurrent operations
- **Webhook System** — HMAC-SHA256 signed webhook delivery with exponential backoff for article lifecycle events
- **Blueprint Gallery** — Browse and search the 193-component blueprint registry with categories and detail panels
- **Edit Progress Indicator** — Real-time stage display and progress bar for section editing via SSE
- **Edit Overlay Accessibility** — Focus trap, Escape key handling, and ARIA attributes for the edit overlay
- **User Settings API** — Per-user settings with sanitized input and server-side persistence
- **Database Migration Strategy** — Versioned SQL migrations with rollback support
- **Publisher Hub** — Content publishing endpoints and dashboard integration with user analytics
- **Generate Command** — Simplified `/generate` command for quick article creation from Claude Code

### Security
- Moved `service_role` key from disk file to environment variable (P0 fix)
- Removed access token persistence to disk (P0 fix)
- Added prompt injection guard with 13 pattern categories and 21 tests
- Added structured logging with security event tracking
- Added rate limiting on auth endpoints (10/min per IP)
- Added path traversal prevention (4-layer validation)
- Added request body size limit (64KB max)
- Added subprocess output limit (4MB max with process kill)

### Testing
- Added test infrastructure with `node:test` (228 tests across 13 suites)
- Auth middleware tests (14), path validation (14), rate limiter (7)
- Prompt guard tests (21), universal engine tests (59)
- Job queue tests (7), webhook tests (15), blueprint parser tests (12)
- Key manager tests (21), pipeline integration tests (16)
- Generate API tests (13), edit SSE tests (9), publisher hub tests (20)

### Documentation
- Added README.md with setup instructions and architecture overview
- Added BRIDGE-API.md documenting all 48 endpoints
- Added SETUP-ADMIN.md with deployment guide
- Added SECURITY.md with threat model and security architecture
- Added TROUBLESHOOTING.md with 10 common issues

---

## [4.6.6] — 2026-03-15

### Initial Release
- 4-agent article generation pipeline (project-analyzer → research-engine → article-architect → draft-writer)
- Bridge server with Supabase auth integration
- Inline section editing via Claude CLI subprocess
- 193 structural component blueprints
- Basic edit UI with section-level editing
- Supabase database schema with RLS policies

---

## Version History

| Version | Date | Milestone |
|---------|------|-----------|
| 4.6.8 | 2026-03-28 | Dashboard + Universal Engine + Security Hardening |
| 4.6.6 | 2026-03-15 | Initial article-engine plugin release |
