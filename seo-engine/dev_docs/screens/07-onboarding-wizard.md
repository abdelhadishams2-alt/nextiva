# Screen Spec: Onboarding Wizard

> **Route:** `/onboarding`
> **Service:** Admin & Users
> **Task:** T2-10
> **Type:** Wizard / Multi-step
> **Priority:** P1
> **Access:** Admin only (first-time setup)

---

## 1. Overview

Guided 4-step setup wizard shown to admins on first login. Walks through verifying Supabase connection, configuring defaults, generating a test article, and completing setup. After completion, redirects to dashboard and never shows again.

---

## 2. Screen Type

Wizard / Multi-step form with progress indicator.

---

## 3. ASCII Wireframe

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ChainIQ Setup                                           │
│                                                          │
│  Step 1 of 4: Verify Connection                          │
│  [●━━━━━━━●━━━━━━━○━━━━━━━○]                            │
│   Connect    Config   Test    Done                       │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │  Checking your Supabase connection...              │  │
│  │                                                    │  │
│  │  ✓ Supabase URL         Connected                  │  │
│  │  ✓ Anon Key             Valid                      │  │
│  │  ✓ Service Role Key     Valid                      │  │
│  │  ✓ Database Schema      Tables found               │  │
│  │  ✗ Bridge Server        Not running                │  │
│  │                                                    │  │
│  │  Run: npm run bridge                               │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│                              [Skip]     [Next →]         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Steps

### Step 1: Verify Connection
Automated checks with live status indicators:
- Supabase URL reachable
- Anon key valid (test auth call)
- Service role key valid (test admin call)
- Database schema exists (check tables)
- Bridge server running (health check)

Each check shows: spinner → checkmark (green) or X (red) with error message.
**Can proceed with warnings** (e.g., bridge not running) but not with errors (e.g., invalid keys).

### Step 2: Configure Defaults
Form with initial settings:
- Default language (select)
- Default framework (select)
- Images per article (select)
- Organization name (text input, for branding)

Pre-populated with sensible defaults. All optional — user can skip.

### Step 3: Test Generation
"Generate a sample article to verify everything works."
- Pre-filled topic: "Introduction to [Organization Name]"
- [Generate Test Article] button
- Shows pipeline progress: Analyzing → Researching → Architecting → Writing → Done
- On success: shows article preview thumbnail
- On failure: shows error with troubleshooting steps
- **Can be skipped** — not required for setup completion

### Step 4: Complete
"You're all set! Your ChainIQ dashboard is ready."
- Summary of configuration
- Quick links: Dashboard, Articles, Settings, Documentation
- [Go to Dashboard] button
- Sets `onboarding_complete: true` in user metadata

---

## 5. Component Inventory

| Component | Source | Notes |
|-----------|--------|-------|
| Progress (stepper) | Custom | 4-step horizontal progress bar |
| Card | shadcn/ui | Step content container |
| CheckCircle / XCircle | lucide-react | Status indicators |
| Spinner | Custom | Loading indicator for checks |
| Button | shadcn/ui | Next, Back, Skip navigation |
| Input | shadcn/ui | Configuration fields |
| Select | shadcn/ui | Language, framework dropdowns |
| Alert | shadcn/ui | Warnings and errors |

---

## 6. States (8 total)

### Loading State
```
Step indicator visible. Content area shows "Checking system requirements..."
with animated dots. No interactive elements yet.
```

### Error State — Critical Failure
```
Step 1 check shows red X: "Supabase connection failed."
Error details: "Cannot reach {SUPABASE_URL}. Verify your environment variables."
[Retry] button. Cannot proceed until fixed.
```

### Error State — Non-critical Warning
```
Step 1 check shows amber warning: "Bridge server not running."
"You can proceed, but article generation won't work until the bridge is started."
[Next →] button enabled (with warning).
```

### Empty State (N/A — wizard always has content)

### Data-Present State — Step Active
```
Current step highlighted in progress bar.
Step content visible with interactive elements.
[Back] [Skip] [Next →] navigation buttons at bottom.
```

### Testing State (Step 3)
```
Progress bar within the step showing pipeline stages:
"Analyzing project... → Researching topic... → Building architecture... → Writing article..."
Each stage: spinner → checkmark when complete.
Cancel button available.
```

### Test Success State
```
Green checkmark: "Sample article generated successfully!"
Article preview thumbnail (clickable to open).
[Go to Dashboard] or [Generate Another] buttons.
```

### Test Failure State
```
Red X: "Article generation failed at {stage}."
Error details + troubleshooting steps.
[Retry] [Skip] buttons.
```

---

## 7. Interactions

1. **Next** → validate current step → proceed to next step → animate transition
2. **Back** → return to previous step → preserve all inputs
3. **Skip** → skip current step → proceed (with "skipped" note)
4. **Retry check** → re-run failed verification → update status indicator
5. **Generate test article** → trigger pipeline → show progress → show result
6. **Complete setup** → set onboarding flag → redirect to dashboard
7. **Close/navigate away** → confirmation if mid-wizard → can resume on next login

---

## 8. Mobile Behavior

- Progress stepper becomes vertical on mobile
- Step content is full width
- Navigation buttons become fixed bottom bar
- Test article preview is smaller thumbnail

---

## 9. Accessibility

- Step progress has `aria-current="step"` on active step
- Check results announced via `aria-live="polite"` as they complete
- Skip/Next/Back buttons have clear `aria-label` with step context
- Focus moves to step content when transitioning between steps

---

## 10. Edge Cases

1. **Already completed** → redirect to dashboard immediately (check flag on mount)
2. **Environment variables missing** → Step 1 fails with clear instructions
3. **Bridge server stops mid-test** → test fails gracefully with "Bridge connection lost"
4. **User refreshes mid-wizard** → resume at last completed step (localStorage state)
5. **Non-admin reaches /onboarding** → redirect to dashboard (admins only)

---

## 11. Dependencies

- **Blocks:** Nothing (optional setup flow)
- **Blocked by:** Login/Signup, Bridge server health endpoint
- **Service:** Admin & Users (admin-users.md)
