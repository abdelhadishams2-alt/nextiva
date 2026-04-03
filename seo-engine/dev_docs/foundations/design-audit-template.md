# Design Audit Checklist — ChainIQ

> **Use per-screen** during development. Every dashboard screen must pass before marking task complete.
> **Source:** Anti-slop rulebook + ChainIQ design system tokens
> **Enforcement Gate 2:** Design Consistency

---

## Visual Consistency (8 checks)

- [ ] Background uses `bg-background` (zinc-950), not hardcoded hex
- [ ] Cards use `bg-card border-border rounded-lg`, not custom bg colors
- [ ] Primary actions use `bg-primary` (amber-500), not other accent colors
- [ ] Text hierarchy: `text-foreground` (primary) → `text-muted-foreground` (secondary) → `text-zinc-500` (muted)
- [ ] No inline styles for colors, spacing, or typography
- [ ] Badges use the status color system (emerald/yellow/red/blue/zinc), not arbitrary colors
- [ ] All borders use `border-border` (zinc-700), not custom grays
- [ ] Focus rings use `ring-ring` (amber-500), visible on all interactive elements

## Anti-Slop Rules (6 checks)

- [ ] No gratuitous gradients (only allowed on ScoreRing and chart fills)
- [ ] No box-shadow on cards (use border only — dark mode shadows are invisible)
- [ ] No rounded-full on rectangular containers (only on avatars, StatusDot)
- [ ] No text-white — use `text-foreground` (zinc-100) for dark mode safety
- [ ] No opacity < 0.5 on interactive elements (visibility issue on dark backgrounds)
- [ ] No generic "Learn more" or "Click here" link text — use descriptive labels

## Typography (5 checks)

- [ ] Page titles use `text-2xl font-semibold` (not bold, not 3xl)
- [ ] Body text uses `text-sm` (14px) for dense data screens, `text-base` (16px) for reading screens
- [ ] Data values use `font-mono text-sm` for numbers, UUIDs, timestamps
- [ ] No font-size classes below `text-xs` (12px minimum)
- [ ] Line height: `leading-relaxed` for paragraphs, default for UI text

## Spacing (4 checks)

- [ ] Page padding is `p-6` (consistent across all pages)
- [ ] Section gaps use `gap-6`, component gaps use `gap-4`
- [ ] No spacing values outside the Tailwind 4px scale (no `p-[13px]`)
- [ ] Card internal padding: `p-4` (compact) or `p-6` (spacious) — never `p-3` or `p-8`

## Responsive (4 checks)

- [ ] Content works at 375px (mobile), 768px (tablet), 1024px+ (desktop)
- [ ] DataTable converts to card layout on mobile (< 768px)
- [ ] Sidebar is hidden on mobile, shows hamburger menu
- [ ] Touch targets are 44x44px minimum on mobile

## Accessibility (5 checks)

- [ ] All images have `alt` text (decorative images: `alt=""`)
- [ ] All icon-only buttons have `aria-label`
- [ ] Color is not the sole indicator of state (use text/icon + color)
- [ ] Tab order is logical (left-to-right, top-to-bottom)
- [ ] Modals trap focus and return focus on close

## States (4 checks)

- [ ] Loading state shows Skeleton components (not spinners, not blank)
- [ ] Empty state shows descriptive message + primary action CTA
- [ ] Error state shows user-friendly message (not stack traces)
- [ ] Disabled state uses `opacity-50 cursor-not-allowed`, not color changes

---

**Total: 36 checks. All must pass for screen completion.**
