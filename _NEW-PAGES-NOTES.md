# New Pages — Build Notes

Three new pages built from the client mockups in
`Umoya website mockups-20260729T043502Z-1-001/`, plus one shared
site-wide navigation widget.

The mockups were used as **layout / content / design reference only**.
Their fonts and colours were NOT carried over — every section inherits
the theme typography (`font-family: inherit`, verified 146×, zero font
imports) and uses the brand palette:

| Mockup token | → | Brand token |
|---|---|---|
| `#4A3526` brown | → | `#4B2E2B` |
| `#B05A3A` terracotta | → | `#D97E53` |
| `#F5EFE6` / `#FBF8F2` | → | `#F5F0EB` cream / `#FFFFFF` white |
| Cormorant Garamond + Mulish (Google Fonts) | → | theme fonts via `inherit` |

Same house standards throughout: scoped CSS under each section's root
ID, per-page class prefix, ES5 IIFE scripts with IntersectionObserver
fallbacks, WCAG AA (12px floor, 44px touch targets, 16px input floor to
stop iOS zoom, ARIA on carousels), and four breakpoints
(desktop · 1024 · 768 · 420).

---

## Shared navigation

`shared/section-00-nav.html` — **place this FIRST on every page**,
including the existing Signature Journey / Founder's Circle / Homepage
pages if you want one nav everywhere.

**Scroll behaviour — three states:**

1. **Docked** — at the very top the bar sits in normal document flow and
   the hero stacks *below* it. No overlap. It scrolls away with the page.
2. **Stuck** — once scrolled past, it detaches (`position: fixed`) and
   hides on a downward scroll, so it never covers what you're reading.
3. **Recalled** — any upward scroll slides it back in.

The mount wrapper reserves the bar's height at all times, so detaching
never shifts the layout. `--nav-h` on the mount is the single source of
truth for that height (64px desktop / 58px ≤1024px); the CSS and the JS
both read it, so changing it in one place is enough.

> **The hamburger breakpoint moved 900px → 1024px on 2026-08-22**, when
> Contact became the fifth link. Logo + five nav items + the CTA need
> roughly 970px on one line, so the row collided with the CTA between 900
> and 970px. 1024px is also where the Tevily header swaps
> `.header_default_screen` for `.header-mobile`, so our bar and the
> theme's now change state together instead of 124px apart. Reverting is
> a one-line change if the inline nav is wanted down to 900px again —
> but shorten a link label first.

The bar never hides while the mobile menu is open, and opening the menu
reveals it. Anchor jumps clear the floating bar via `scroll-padding-top`.

### Theme-header takeover (Tevily)

The site has **two** header systems depending on the page's Elementor
template:

| Template | Theme header? | What renders |
|---|---|---|
| Elementor **Canvas** (homepage, Founder's Circle) | No — bypassed entirely | Only the nav pasted into page content |
| Elementor **Full Width** (Signature Journey etc.) | Yes — `header.php` → `header-builder.php` | Theme header wrapping this widget |

On Full Width pages the Tevily header renders two sibling blocks:
`.header_default_screen` (holds this widget, hidden **≤1024px**) and
`.header-mobile` (the theme's own menu, shown **≤1024px**). So at
1024px and below the theme swapped this nav out for its own menu,
which pulls from the WP `primary` menu location and was showing stale
links (Tours & Packages, Sacred Origins, old tour listings…).

The widget now hides the theme's block and keeps its own visible at
every width. Those two rules are the only selectors in the file that
reach outside its own root — unavoidable, because the targets are the
widget's *ancestor* and *sibling*. They're gated behind a
`.umoya-nav-takeover` marker class that the JS adds only to a theme
header that actually contains this nav, so Canvas pages are untouched.

Verified live and in an isolated harness at 375 / 1024 / 1400px:
theme menu suppressed, correct nav shown (hamburger ≤1024px as of
2026-08-22, ≤900px when that harness run was done), hero
stacks below with no overlap, dock/stick/hide-on-scroll still works
inside the theme header, and on a Canvas-style page the marker is
never applied.
- Links: **The Signature Journey · Private & Tailormade · For Groups ·
  About**, plus the **Join the Founder's Circle** CTA.
- Links are absolute site URLs, so the one widget works on every page.
- The current page's link is marked active automatically by matching
  `window.location.pathname` against each item's `data-path`.

**Confirm the page slugs match** the `data-path` / `href` values:

| Nav item | Assumed URL |
|---|---|
| The Signature Journey | `/signature-journey/` |
| Private & Tailormade | `/private-and-tailormade/` |
| For Groups | `/for-groups/` |
| About | `/about/` |
| CTA | `/founders-circle/` |

If a real slug differs (e.g. `/private-tailormade/`), update both the
`href` and the `data-path` on that item.

---

## Page 1 — Private & Tailormade (`private-tailormade/`)

| # | File | Section | Anchor |
|---|------|---------|--------|
| 1 | `section-01-hero.html` | Hero — "A Journey Entirely Your Own" | `pt-hero` |
| 2 | `section-02-intro.html` | Make It Your Own | `pt-intro` |
| 3 | `section-03-trip-types.html` | Trip Types rail (6 cards + blank) | `pt-trip-types` |
| 4 | `section-04-how-it-works.html` | How Tailoring Works (3 steps) | `pt-how` |
| 5 | `section-05-design-form.html` | Design Your Journey form | `pt-design` |

## Page 2 — About Us (`about/`)

| # | File | Section | Anchor |
|---|------|---------|--------|
| 1 | `section-01-hero.html` | Hero (video-ready) | `ab-hero` |
| 2 | `section-02-who-we-are.html` | Who We Are + photo carousel | `ab-who` |
| 3 | `section-03-mission.html` | Our Mission — dark band | `ab-mission` |
| 4 | `section-04-our-story.html` | Our Story (Wilson Nyah) | `ab-story` |
| 5 | `section-05-how-we-choose.html` | How We Choose | `ab-choose` |
| 6 | `section-06-hosts.html` | Meet Our Hosts (6 cards) | `ab-hosts` |
| 7 | `section-07-difference.html` | The Umoya Difference (4 cards) | `ab-difference` |
| 8 | `section-08-cta.html` | Closing CTA | `ab-cta` |

## Page 3 — For Groups (`for-groups/`)

| # | File | Section | Anchor |
|---|------|---------|--------|
| 1 | `section-01-hero.html` | Hero — "Bring Your Circle" | `fg-hero` |
| 2 | `section-02-intro.html` | Traveling Together | `fg-intro` |
| 3 | `section-03-who-travels.html` | Who Travels With Us (4 cards) | `fg-who` |
| 4 | `section-04-for-the-organizer.html` | For the Organizer — dark band | `fg-organizer` |
| 5 | `section-05-how-it-works.html` | Planning for Your Group (4 steps) | `fg-how` |
| 6 | `section-06-journey-teaser.html` | Ten Days, Three Chapters | `fg-journey` |
| 7 | `section-07-sizes.html` | Travel Fit for Any Size | `fg-sizes` |
| 8 | `section-08-plan-form.html` | Plan a Group Journey form | `fg-plan` |

The **footer** is a theme-level element (like the site header) and is
intentionally not part of these section widgets.

---

## Images

13 images were extracted from the mockups' embedded base64 and uploaded
to the synced folder
(`…/Mountain Duck/…/wp-content/uploads/2026/optimized/`). **Nothing was
deleted or overwritten** — the folder went from 246 → 259 files.

| File | Used by |
|---|---|
| `umoya_pt_wedding.jpg` | P&T — The Wedding |
| `umoya_pt_honeymoon.jpg` | P&T — The Honeymoon |
| `umoya_pt_family.jpg` | P&T — The Family Journey |
| `umoya_pt_groups_reunions.jpg` | P&T — Groups & Reunions |
| `umoya_pt_milestone.jpg` | P&T — Milestone Celebrations |
| `umoya_pt_friends.jpg` | P&T — A Friends Getaway |
| `umoya_about_eyethu_heritage_hall.jpg` | About — Eyethu Heritage Hall host card |
| `umoya_groups_hero.jpg` | For Groups — hero |
| `umoya_groups_sororities.jpg` | For Groups — Sororities & Fraternities |
| `umoya_groups_churches.jpg` | For Groups — Churches & Faith Communities |
| `umoya_groups_alumni.jpg` | For Groups — Alumni & Professional Networks |
| `umoya_groups_families.jpg` | For Groups — Families & Friends |
| `umoya_groups_chapter1_history.jpg` | For Groups — Chapter I |

All 21 image URLs referenced across the three pages were verified to
resolve to real files in that folder.

### Still needing photography (★ SWAP)

The mockups supplied no images for these — they render as clean,
brand-toned labelled placeholders naming the intended subject:

- **About — Our Story:** Wilson Nyah portrait.
- **About — Meet Our Hosts:** 5 of 6 cards (Lucia Motloung, Antoinette
  Sithole, Christo Brand, Ntsiki Biyela, Senzart911). Eyethu has its photo.
- **About — Who We Are carousel:** currently reuses existing Umoya CDN
  trip photography; swap for the final 4–6 frame selection.
- **About — hero video:** points at the existing brand film; ★ SWAP the
  `<source>` for the final film, or delete the `<video>` to keep the still.

To drop a photo into a placeholder, replace the `.…-ph` block with an
`<img class="…-pic" src="…" alt="…" loading="lazy">`.

---

## Forms

Both new forms (P&T "Design My Journey", For Groups "Plan Our Journey")
use the **same integration as the Founder's Circle form**:

1. POST to `/wp-json/umoya/v1/submissions` — WordPress stores the
   submission and forwards it to HubSpot.
2. If WordPress is unreachable, the browser falls back to the HubSpot
   Forms API directly and queues the WP backup in `localStorage`.
3. POPIA: required consent checkbox (not pre-ticked) + optional
   marketing opt-in, both recorded in the backup payload.

They reuse the existing `MERGE*` field aliases so **no backend change is
needed**:

| Field | Alias | HubSpot property | Carries |
|---|---|---|---|
| Occasion (P&T) / Group type (FG) | `MERGE2` | `country` | occasion / group type |
| Organization (FG) | `MERGE3` | `city` | organization |
| Month | `MERGE4` | `preferred_travel_season` | travel month |
| Year | `MERGE5` | `preferred_travel_year` | travel year |
| Guests (P&T) / Size (FG) | `MERGE6` | `preferred_journey_length` | party size |
| Message | `MERGE7` | `founders_circle_message` | the brief |

**Open item:** the aliases are semantically stretched (occasion in the
`country` slot, etc.). For cleaner reporting, create dedicated HubSpot
properties (`trip_occasion`, `group_type`, `party_size`, `organization`)
and update both the map in each form's script and the aliases in
`umoya-elementor-widgets/includes/class-submissions.php`.

Both forms currently share the Founder's Circle Portal ID / Form GUID
(`246097317` / `cb87d460-…`). Confirm whether they should have their own
HubSpot forms instead.

---

## Verified

- 22 section files across 4 folders; all render.
- `font-family: inherit` ×146; **zero** mockup fonts or colours leaked
  (grepped for Cormorant, Mulish, googleapis, and all 7 mockup hex values).
- All 21 image URLs resolve to files in the synced uploads folder.
- Zero broken images on all three assembled pages.
- Structure counts confirmed in-browser: P&T 5 sections / 7 trip cards /
  2 arrows / scrollable rail; About 8 sections / 4 carousel slides /
  6 host cards / 4 difference cards; For Groups 8 sections / 4 who-cards /
  4 organizer items / 4 steps / 3 chapters / 19 form fields.
- Nav renders the four specified links + Founder's Circle CTA.

## Deployment status

**None of these three pages has been deployed.** They exist only as source
files in this repo. To publish one:

1. Create the WordPress page at the slug the nav expects (see table above).
2. Set its template — **Elementor Canvas** is preferred, since it bypasses
   the Tevily theme header entirely and avoids the two-header conflict.
   If Elementor Full Width is used instead, the shared nav's takeover rules
   handle the theme's stale mobile menu automatically.
3. Add one Elementor **HTML widget per section file**, in numbered order,
   with `shared/section-00-nav.html` first.
4. Preview at desktop / 1024 / 768 / 420.

Editing a file here does **not** change the live site until it is re-pasted.

The shared nav *has* been pasted into the live Signature Journey page's
header slot (confirmed in the DOM as `#umoyaSiteNav`), but that was an
older revision — re-paste it to pick up the dock/stick/hide-on-scroll
behaviour and the theme-header takeover.

## Open items

- ✅ Page slugs assumed by the nav are all confirmed live (2026-08-22,
  uncached 200s). The Signature Journey has moved onto
  `/signature-journey/`, so the old `-unpublished` caveat is closed.
  `Contact` was added as a fifth link on 2026-08-22 → `/contact/`.
- Confirm the Privacy Policy URL used in both consent lines
  (`/privacy/`).
- The P&T hero reuses an existing Cape image — swap if a dedicated hero
  shot is preferred.
- Decide whether these pages should be registered in the Elementor widget
  generator, or stay as hand-pasted HTML widgets. Currently they are **not**
  registered, and the generator's source paths are stale.
- The About Us hero is video-ready but points at the existing brand film —
  swap the `<source>` or delete the `<video>` block to ship the still.
