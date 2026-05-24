<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Makanjom — agent guidelines

## Mobile-first (required)

Makanjom is a **mobile-focused** web app. Design and build for phones first; desktop is an enhancement.

Read `GEMINI.md` for full product mandates. Apply these rules on **every** new feature, page, or component:

### Layout
- Default to single column (`flex-col`, `grid-cols-1`). Add `sm:` / `md:` / `lg:` only to expand.
- Use `px-4` base page padding; avoid wide fixed layouts on small screens.
- Respect safe areas: `env(safe-area-inset-*)` for notched devices (see `globals.css` utilities).
- Primary navigation on mobile is the **bottom tab bar** (`MobileNav`), not the header.

### Touch & ergonomics
- Minimum touch target: **44×44px** — use the `.touch-target` utility class.
- Place primary CTAs in the **thumb zone** (lower half of screen). Use sticky/fixed bottom actions on key flows.
- Use `active:scale-95` or Framer Motion `whileTap` for tactile feedback.
- Call `haptics.light()` / `haptics.success()` from `@/lib/haptics` on important taps (spin, submit, game actions).

### Typography & content
- Headings: `text-3xl` on mobile, scale up with `sm:` / `md:`.
- Body: `text-base` minimum, `leading-relaxed` for readability.
- Short hero copy on mobile; longer descriptions can expand on `md:`.

### Performance
- Prefer Next.js `Image` for photos when adding new image-heavy UI.
- Lazy-load below-the-fold sections. Keep first paint fast on 4G.

### Before marking UI complete
- Verify at **375px width** (iPhone SE) and **390px** (standard phone).
- Confirm nothing is hidden behind the bottom nav (`pb-28` on main content).
- Confirm horizontal scroll is intentional (e.g. filter chips), not layout overflow.

### Shell components
- Wrap consumer pages in `AppShell` (header + main + footer + `MobileNav`).
- Hide or simplify `Footer` on mobile — links live in bottom nav.
