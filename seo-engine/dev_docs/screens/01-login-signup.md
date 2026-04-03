# Screen Spec: Login / Signup

> **Route:** `/login`, `/signup`
> **Service:** Auth & Bridge
> **Task:** T2-07
> **Type:** Form
> **Priority:** P1

---

## 1. Overview

Authentication screens for ChainIQ dashboard. Handles user login (email + password) and new user registration. Uses Supabase Auth under the hood. After signup, users land in `pending` status until an admin approves their account.

---

## 2. Screen Type

Form / Authentication flow — two variants (login and signup) sharing the same layout with different form fields.

---

## 3. ASCII Wireframe

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              ┌─────────────────────┐                 │
│              │   ChainIQ Logo      │                 │
│              │                     │                 │
│              │  ┌───────────────┐  │                 │
│              │  │ Email         │  │                 │
│              │  └───────────────┘  │                 │
│              │  ┌───────────────┐  │                 │
│              │  │ Password      │  │                 │
│              │  └───────────────┘  │                 │
│              │                     │                 │
│              │  [    Log In     ]  │                 │
│              │                     │                 │
│              │  Don't have an      │                 │
│              │  account? Sign up   │                 │
│              └─────────────────────┘                 │
│                                                      │
│          Powered by ChainIQ v1.0                     │
└──────────────────────────────────────────────────────┘
```

**Signup variant** adds: Full Name field, Confirm Password field, and a note: "Your account will be reviewed by an admin before activation."

---

## 4. Data Fields

| Field | Type | Validation | Required | Error Message |
|-------|------|-----------|----------|---------------|
| Email | email | Valid email format, max 255 chars | Yes | "Please enter a valid email address" |
| Password | password | Min 8 chars, 1 uppercase, 1 number | Yes | "Password must be at least 8 characters with 1 uppercase and 1 number" |
| Full Name (signup) | text | Min 2 chars, max 100 chars | Yes | "Please enter your full name" |
| Confirm Password (signup) | password | Must match Password | Yes | "Passwords do not match" |

---

## 5. Component Inventory

| Component | Source | Props | Notes |
|-----------|--------|-------|-------|
| Card | shadcn/ui | className="w-[400px]" | Centers the form |
| Input | shadcn/ui | type, placeholder, value, onChange | Email and password fields |
| Button | shadcn/ui | type="submit", disabled, loading | Submit button with loading state |
| Label | shadcn/ui | htmlFor | Field labels |
| Alert | shadcn/ui | variant="destructive" | Error messages |
| Form | shadcn/ui + react-hook-form | onSubmit | Form validation wrapper |

---

## 6. States (8 total)

### Loading State
```
Card with shimmer skeleton replacing form fields.
Logo visible, no interactive elements.
Duration: until Supabase client initializes (~200ms).
```

### Error State — Invalid Credentials
```
Red Alert component above form: "Invalid email or password. Please try again."
Email field retains value, password field cleared.
Focus returns to password field.
```

### Error State — Network Failure
```
Red Alert: "Unable to connect to authentication service. Please check your internet connection and try again."
Retry button below alert.
Form fields retain all values.
```

### Error State — Account Pending
```
Amber Alert: "Your account is awaiting admin approval. You'll receive an email once activated."
No form shown — just the message with a "Back to Login" link.
```

### Error State — Account Revoked
```
Red Alert: "Your account has been suspended. Please contact your administrator."
No form shown — just the message with a support email link.
```

### Empty State (N/A — form is always present)

### Data-Present State — Login Form
```
Centered card with ChainIQ logo, email input, password input, "Log In" button.
"Don't have an account? Sign up" link below.
"Forgot password?" link below password field.
```

### Data-Present State — Signup Form
```
Centered card with ChainIQ logo, full name input, email input, password input,
confirm password input, "Create Account" button.
"Already have an account? Log in" link below.
Admin approval notice in muted text.
```

### Submitting State
```
Button shows spinner + "Logging in..." or "Creating account..."
All form fields disabled during submission.
No navigation allowed until complete or failed.
```

---

## 7. Interactions

1. **Submit login** → validate form → POST /auth/login → success → redirect to `/` (or `/onboarding` if first login) | failure → show error alert
2. **Submit signup** → validate form → POST /auth/signup → success → show "Account created, awaiting approval" message | failure → show error
3. **Toggle login/signup** → click link → client-side navigation, no page reload
4. **Forgot password** → click link → redirect to `/forgot-password` (Supabase magic link flow)
5. **Show/hide password** → click eye icon in password field → toggle input type
6. **Form validation** → on blur + on submit → inline error messages below fields
7. **Enter key submission** → pressing Enter in any field submits the form

---

## 8. Role Access Matrix

| Action | Anonymous | Pending | Active | Admin |
|--------|-----------|---------|--------|-------|
| View login page | Y | Y | Redirect to / | Redirect to / |
| Submit login | Y | Y (shows pending message) | Redirect to / | Redirect to / |
| View signup page | Y | Redirect to pending | Redirect to / | Redirect to / |
| Submit signup | Y | N/A | N/A | N/A |

---

## 9. API Endpoints

| Action | Method | Endpoint | Request | Response |
|--------|--------|----------|---------|----------|
| Login | POST | `/auth/login` | `{ email, password }` | `{ success, data: { access_token, user } }` |
| Signup | POST | `/auth/signup` | `{ email, password, full_name }` | `{ success, data: { user } }` |
| Verify | POST | `/auth/verify` | Bearer token | `{ success, data: { user } }` |

---

## 10. Mobile Behavior

- Card width: 100% on mobile (< 640px), 400px on desktop
- No sidebar on auth pages
- Touch-friendly input sizes (min 44px height)
- Keyboard: auto-focus email field, "next" button navigates to password, "go" submits

---

## 11. Accessibility (WCAG 2.1 AA)

- All form fields have associated `<label>` elements
- Error messages linked via `aria-describedby`
- Focus trapped within card on page load
- Color contrast ratio ≥ 4.5:1 for all text
- Password toggle announces state change via `aria-label`
- Form validation errors announced via `aria-live="polite"`

---

## 12. Edge Cases

1. **User already logged in** → redirect to `/` immediately, don't show form
2. **Session expired during form fill** → allow submission, re-authenticate
3. **Duplicate email on signup** → show "An account with this email already exists" error
4. **Extremely long email** → truncate display, validate max 255 chars
5. **Password manager autofill** → form must work with autofill, trigger validation on autofill

---

## 13. Dependencies

- **Blocks:** All authenticated screens (must exist before anything else)
- **Blocked by:** Bridge server running, Supabase configured
- **Service:** Auth & Bridge (auth-bridge.md)
