# Screen Spec: User Management (Admin)

> **Route:** `/admin/users`
> **Service:** Admin & Users
> **Task:** T2-04, T2-05
> **Type:** List + CRUD
> **Priority:** P1
> **Access:** Admin only

---

## 1. Overview

Admin-only screen for managing ChainIQ users. Shows all registered users with their subscription status, plan, usage stats, and approval controls. Admins can approve pending users, change plans, revoke access, and delete accounts.

---

## 2. Screen Type

List / Table with inline actions and detail slide-out.

---

## 3. ASCII Wireframe

```
┌─────┬───────────────────────────────────────────────────────────┐
│     │  User Management                     [Pending: 3 ⚡]     │
│  S  │───────────────────────────────────────────────────────────│
│  I  │  [Search...        ] [Status ▾] [Plan ▾]                  │
│  D  │───────────────────────────────────────────────────────────│
│  E  │  Name          Email              Plan    Status   Actions │
│  B  │  ──────────────────────────────────────────────────────── │
│  A  │  John Doe      john@co.com       Pro     [Active]  [...]  │
│  R  │  Jane Smith    jane@co.com       Starter [Pending] [✓][✗] │
│     │  Ahmed Ali     ahmed@pub.sa      Enter.  [Active]  [...]  │
│     │  Sara Chen     sara@news.com     —       [Pending] [✓][✗] │
│     │  Mike Brown    mike@co.com       Pro     [Revoked] [...]  │
│     │                                                           │
│     │  Showing 1-5 of 12 users              [← 1 2 3 →]       │
└─────┴───────────────────────────────────────────────────────────┘
```

**Pending users** show approve (checkmark) and reject (X) inline buttons. Active/revoked users show action menu (...).

---

## 4. Data Fields

| Field | Type | Source | Sortable | Filterable |
|-------|------|--------|----------|------------|
| Name | text | `auth.users.raw_user_meta_data.full_name` | Yes | Search |
| Email | email | `auth.users.email` | Yes | Search |
| Plan | enum | `subscriptions.plan` | Yes | Dropdown |
| Status | enum | `subscriptions.status` | Yes | Dropdown |
| Articles Generated | integer | `COUNT(articles)` | Yes | No |
| Quota Used | percentage | `usage / plan_limit * 100` | No | No |
| Joined | datetime | `auth.users.created_at` | Yes | No |

---

## 5. Component Inventory

| Component | Source | Notes |
|-----------|--------|-------|
| DataTable | shadcn/ui | Sortable, filterable, paginated |
| Badge | shadcn/ui | Status (active=green, pending=amber, revoked=red) |
| DropdownMenu | shadcn/ui | Row action menu |
| Dialog | shadcn/ui | Approve (plan selection), Delete confirmation |
| Select | shadcn/ui | Plan selection in approve dialog |
| Sheet | shadcn/ui | User detail slide-out panel |
| Progress | shadcn/ui | Quota usage bar |
| AlertDialog | shadcn/ui | Delete confirmation with GDPR warning |

---

## 6. States (9 total)

### Loading State
```
Table header visible, 5 skeleton rows with avatar placeholders.
Filter dropdowns disabled. "Pending" count badge shows skeleton.
```

### Error State — API Failure
```
Alert: "Unable to load user data. Check bridge server connection."
Retry button. Sidebar remains functional.
```

### Empty State — No Users
```
"No users registered yet. Share the signup link to get started."
Copy signup URL button.
```

### Empty State — No Search Results
```
"No users matching your search. Try different keywords or clear filters."
[Clear Filters] button.
```

### Data-Present State
```
Full table with user data, status badges, action menus.
"Pending: N" badge in header glows amber when > 0.
```

### Approve Dialog State
```
Dialog: "Approve {user_name}?"
Plan selector: [Starter] [Professional] [Enterprise]
Quota display for selected plan.
[Cancel] [Approve] buttons. Approve shows loading on click.
```

### Revoke Dialog State
```
Dialog: "Revoke access for {user_name}?"
Reason textarea (required): "Please provide a reason for revocation."
[Cancel] [Revoke Access] buttons. Revoke button is red.
```

### Delete Dialog State
```
AlertDialog: "Permanently delete {user_name}?"
"This will remove ALL user data including articles, usage history, and analytics.
This action cannot be undone and is required for GDPR compliance."
[Cancel] [Delete Permanently] buttons. Delete is destructive red.
```

### User Detail Sheet State
```
Slide-out panel from right showing:
- User avatar + name + email
- Subscription plan + status
- Quota usage bar (articles used / limit)
- Activity summary (articles generated, last active)
- Admin actions: [Change Plan] [Revoke] [Delete]
```

---

## 7. Interactions

1. **Search users** → debounced (300ms) → filter by name or email
2. **Filter by status** → dropdown → show only matching status
3. **Approve pending user** → click checkmark → approve dialog → select plan → POST /api/users/:id/approve
4. **Reject pending user** → click X → "Reject {name}?" confirmation → DELETE or revoke
5. **Click row** → open user detail sheet from right
6. **Change plan** → in detail sheet → select new plan → POST /api/users/:id/upgrade → toast confirmation
7. **Revoke user** → revoke dialog → enter reason → POST /api/users/:id/revoke → toast
8. **Delete user** → delete dialog → confirm → DELETE /api/users/:id → GDPR cleanup → toast

---

## 8. Mobile Behavior

- Table converts to card layout: name, email, status badge per card
- Action buttons visible directly on each card (no overflow menu needed)
- Detail sheet becomes full-screen on mobile
- Filter controls collapse into sheet triggered by "Filter" button

---

## 9. Accessibility

- "Pending: N" badge has `aria-label="N users awaiting approval"`
- Approve/reject buttons have descriptive `aria-label` per user
- Detail sheet traps focus and has Escape-to-close
- Delete confirmation requires explicit "Delete Permanently" text or button interaction
- Status badges use color + text (not color alone)

---

## 10. Edge Cases

1. **Admin deletes themselves** → show warning "You cannot delete your own account"
2. **Last admin** → prevent revocation/deletion of the only admin user
3. **User has active generation** → show warning before revocation "User has an article generating"
4. **Rapid approve/reject** → debounce to prevent double submission
5. **Quota at 100%** → show red progress bar + "Quota exceeded" warning on user card

---

## 11. Dependencies

- **Blocks:** Nothing
- **Blocked by:** Login/Signup, Dashboard API, Admin API endpoints
- **Service:** Admin & Users (admin-users.md)
