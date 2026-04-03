# ChainIQ — Protection List

> **Step 16.4 Artifact**
> **Last Updated:** 2026-03-28
> **Rule:** Do NOT modify protected files without explicit user approval.

---

## Protected Files

| File | Reason | Added |
|------|--------|-------|
| `config/structural-component-registry.md` | 193 component blueprints — core IP, extensively tested through article generation | 2026-03-26 |
| `supabase-setup.sql` | Full database schema with RLS policies, production-verified | 2026-03-26 |
| `bridge/server.js` auth middleware | Multi-layer security validation — any weakening creates vulnerabilities | 2026-03-26 |
| `bridge/server.js` path validation logic | 4-layer path traversal prevention — security-critical | 2026-03-26 |
| Agent pipeline sequence in `skills/article-engine/SKILL.md` | 4-agent orchestration order is proven — extend, don't reorder | 2026-03-26 |
| `bridge/key-manager.js` | 351-line AES-256-GCM encryption module — cryptographic code, no casual edits | 2026-03-28 |
| `bridge/prompt-guard.js` | 13-pattern prompt injection defense — security-critical, 21 tests | 2026-03-28 |

## When to Add to This List

Add a file when:
1. It contains security-critical logic (auth, encryption, input validation)
2. It represents core IP (component registry, scoring algorithms)
3. It has been extensively tested and is production-verified
4. Modifying it could break multiple downstream systems
5. It contains database schema that other systems depend on

## When to Remove from This List

Remove a file when:
1. It has been replaced by a new implementation (mark old as deprecated first)
2. The system it protects has been redesigned
3. User explicitly approves removal

## Modification Protocol

To modify a protected file:
1. State which file and what change
2. Explain why the change is necessary
3. Describe the testing plan (how you'll verify no regression)
4. Get explicit user approval before editing
