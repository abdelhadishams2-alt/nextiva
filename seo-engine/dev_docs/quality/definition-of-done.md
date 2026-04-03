# ChainIQ — Definition of Done

> **Last Updated:** 2026-03-28
> **Applies to:** All tasks during GSD execution

---

## Task-Level Definition of Done

A task is **Done** when ALL of the following are true:

### Code Quality

- [ ] Code follows ChainIQ conventions (see CLAUDE.md Section 10)
- [ ] No `fs.readFileSync` or `fs.writeFileSync` in request handlers (async I/O mandatory)
- [ ] No secrets hardcoded or written to disk
- [ ] File paths validated with 4-layer traversal prevention
- [ ] Zero npm dependencies added (bridge server) — justify any exception
- [ ] Error responses use consistent JSON format with `sendError()`

### Security

- [ ] New endpoints have auth middleware (`verifyAuth()` or `requireAdmin()`)
- [ ] New database tables have RLS policies (`auth.uid() = user_id`)
- [ ] User input validated and sanitized before processing
- [ ] Security events logged via `logger.logSecurity()`
- [ ] No new prompt injection surface introduced

### Testing

- [ ] New functionality has `node:test` tests
- [ ] Tests run and pass: `npm test`
- [ ] Edge cases covered (empty input, invalid data, auth failures)
- [ ] No tests skipped or commented out

### Documentation

- [ ] New endpoints documented in BRIDGE-API.md (if applicable)
- [ ] User-facing changes reflected in user_docs/ (if applicable)
- [ ] SECURITY.md updated if security model changed

### State Files

- [ ] STATUS.md updated (task checkbox toggled)
- [ ] handoff.md updated (what was done + what's next)
- [ ] DEVLOG.md appended (session entry)

---

## Feature-Level Definition of Done

A feature (spanning multiple tasks) is Done when:

- [ ] All constituent tasks meet task-level DoD
- [ ] Integration tests pass across service boundaries
- [ ] Feature works end-to-end from dashboard UI to database
- [ ] RTL layout verified for Arabic content (if UI feature)
- [ ] Performance within SLO targets (p95 < 500ms for API, < 3s for page load)
- [ ] User documentation skeleton exists in user_docs/

---

## Phase-Level Definition of Done

A phase is Done when:

- [ ] All features in the phase meet feature-level DoD
- [ ] Completeness dashboard updated (dev_docs/completeness/dashboard.md)
- [ ] No P0 findings in quality audit
- [ ] All 228+ tests passing
- [ ] handoff.md updated with phase summary
- [ ] ARCH-ANCHOR.md updated if architecture changed
