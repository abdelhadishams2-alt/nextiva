# DASH-001: Scaffold Dashboard + Auth UI

> **Phase:** 1 | **Priority:** P1 | **Status:** NOT STARTED
> **Effort:** L (8h) | **Type:** new
> **Backlog Items:** T2-01, T2-02, T2-07
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `dev_docs/screens/_catalog.md` — navigation structure, shared components
3. `dev_docs/screens/01-login-signup.md` — auth screen spec
4. `dev_docs/services/dashboard-api.md` — API endpoints
5. `dev_docs/services/auth-bridge.md` — auth flow
6. `bridge/server.js` — existing auth endpoints
7. `bridge/supabase-client.js` — Supabase client patterns
8. `supabase-setup.sql` — auth schema

## Objective
Create the Next.js 16 dashboard application with shadcn/ui, Tailwind CSS, dark mode, and the login/signup pages. This is the foundation that all other dashboard screens build on.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `dashboard/` | Next.js 16 App Router project |
| CREATE | `dashboard/app/layout.tsx` | Root layout with dark mode, Geist fonts |
| CREATE | `dashboard/app/(auth)/login/page.tsx` | Login page |
| CREATE | `dashboard/app/(auth)/signup/page.tsx` | Signup page |
| CREATE | `dashboard/app/(auth)/layout.tsx` | Auth layout (no sidebar) |
| CREATE | `dashboard/app/(dashboard)/layout.tsx` | Dashboard layout with sidebar |
| CREATE | `dashboard/app/(dashboard)/page.tsx` | Dashboard home placeholder |
| CREATE | `dashboard/components/sidebar.tsx` | Persistent sidebar navigation |
| CREATE | `dashboard/lib/auth.ts` | Auth context, token management |
| CREATE | `dashboard/lib/api.ts` | API client for bridge server |

## Sub-tasks

### Sub-task 1: Project setup (~2h)
- Create Next.js 16 app: `npx create-next-app@latest dashboard --typescript --tailwind --app --src-dir=false`
- Install shadcn/ui: `npx shadcn@latest init` (dark mode, zinc theme)
- Add components: `npx shadcn@latest add card input button label form alert toast`
- Configure Geist fonts via `next/font`
- Set dark mode as default in layout

### Sub-task 2: Auth library (~2h)
- Create `lib/auth.ts`: AuthContext with token storage (memory, NOT localStorage)
- Create `lib/api.ts`: fetch wrapper that adds Bearer token, handles 401 redirect
- Bridge server URL from `NEXT_PUBLIC_BRIDGE_URL` env var (default: `http://localhost:19847`)
- Token refresh: if 401, clear auth state, redirect to /login

### Sub-task 3: Login/Signup pages (~2.5h)
- Implement login page per `01-login-signup.md` screen spec
- Implement signup page per same spec
- Form validation with react-hook-form + zod
- Error handling: invalid credentials, network failure, pending account
- Redirect to /onboarding or / on successful login

### Sub-task 4: Sidebar + Dashboard layout (~1.5h)
- Sidebar with nav items: Dashboard, Articles, Blueprints, Admin (admin-only), Settings
- Collapsible sidebar (stored in localStorage)
- User menu at bottom: profile info, logout
- Dashboard home page: placeholder with "Dashboard coming soon" + KPI card skeletons

## Acceptance Criteria
- [ ] `npm run dev` starts dashboard on port 3000
- [ ] Login page renders correctly with dark theme
- [ ] Signup page renders correctly with admin approval notice
- [ ] Authentication works end-to-end with bridge server
- [ ] Sidebar navigation renders with all menu items
- [ ] Admin-only nav items hidden for non-admin users
- [ ] Token stored in memory only (not localStorage, not cookies)
- [ ] Unauthorized users redirected to /login
- [ ] shadcn/ui components render with zinc dark theme

## Dependencies
- Blocked by: INFRA-001 (git init), SEC-001 (security fixes)
- Blocks: DASH-002, DASH-003, all other dashboard screens
