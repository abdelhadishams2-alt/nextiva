# Test Requirements Card: {{TASK_ID}}

> **Feature:** {{FEATURE_NAME}}
> **Characteristics:** {{C1, C3, C6, ...}}
> **Minimum test types:** {{N}}

---

## Required Tests

| # | Test Type | Count | File | Status |
|---|-----------|-------|------|--------|
| 1 | Unit Tests | {{N}} | `tests/{{module}}.test.js` | ☐ |
| 2 | Integration Tests | {{N}} | `tests/integration/{{module}}.test.js` | ☐ |
| 3 | Security Tests | {{N}} | `tests/{{module}}.test.js` (auth section) | ☐ |
| 4 | ... | | | ☐ |

## Proof Artifacts Required

- [ ] Console output of `npm test` showing all tests pass
- [ ] Test count matches or exceeds the minimum above
- [ ] No skipped tests (`.skip` or `.todo` not counted)

## Acceptance Criteria (from task file)

1. {{AC_1}}
2. {{AC_2}}
3. {{AC_3}}

## Edge Cases to Test

1. {{EDGE_1}}
2. {{EDGE_2}}
3. {{EDGE_3}}
