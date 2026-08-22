# The Signature Journey — Build Notes

Standalone landing page for Umoya's flagship **Signature Journey** (the
10-day, 3-chapter itinerary). Built from the client mockup
`3__umoya_signature_journey_mockup_FINAL.html`.

The mockup was used as a **layout reference only**. Fonts and colours were
NOT taken from it — every section inherits the theme typography
(`font-family: inherit`) and uses the brand palette. The mockup's off-brand
tokens were mapped to ours:

| Mockup | → | Brand token |
|---|---|---|
| `#4A3526` brown | → | `#4B2E2B` |
| `#B05A3A` terracotta | → | `#D97E53` |
| `#F5EFE6` / `#FBF8F2` cream/paper | → | `#F5F0EB` cream / `#FFFFFF` white |
| Cormorant Garamond + Mulish (Google Fonts) | → | theme fonts via `inherit` |

Same house standards as the Founder's Circle files: scoped CSS under each
section's root ID, `sj-` class prefix, ES5 IIFE scripts with
`IntersectionObserver` fallbacks, WCAG AA (12px floor, 44px touch targets,
ARIA on carousels), and four breakpoints (desktop · 1024 · 768 · 420).

---

## Elementor section order (8 HTML widgets)

| # | File | Section | Anchor ID |
|---|------|---------|-----------|
| 1 | `section-00-nav.html` | Top nav (fixed, always visible — homepage-style) | — |
| 2 | `section-01-hero.html` | Hero — "One Journey, in Three Chapters" (image only) | `sj-hero` |
| 3 | `section-02-intro.html` | Intro copy, then the overview stat bar | `sj-overview` |
| 4 | `section-03-journey-chapters.html` | The three chapters (History · Safari · Cape) | `sj-journey` |
| 5 | `section-04-extensions.html` | Optional extensions (Vic Falls · Chobe) — dark band | `sj-extensions` |
| 6 | `section-05-stays.html` | Where You Stay — 3 hotel slideshows | `sj-stays` |
| 7 | `section-06-inclusions-offers.html` | Inclusions grid + sticky Offers panel | `sj-inclusions` |
| 8 | `section-08-form-popup.html` | Inquiry popup (renders nothing until opened) | — |

> `section-07-cta.html` was **REMOVED** at client request (it duplicated the
> "Speak With a Travel Expert" button in Section 06's Offers panel). The file
> is kept for history but must NOT be pasted. `#sj-cta` no longer exists.
>
> Section 06's offers button is now a `data-umoya-form-popup` trigger, so
> **section-08-form-popup.html must be on the page** or that button does
> nothing. Its lead attribution is `signature_journey_popup`, distinct from
> the homepage's `homepage_popup`.

> **Stat bar reordered (client request).** Section 02 holds TWO bands. The
> 10 Days / 3 Chapters / 2 Extensions row used to come FIRST, directly under
> the hero, where it stated the shape of a journey the reader had not been
> introduced to yet. The intro copy now comes first and the stat bar closes
> the section. It also gained a fourth stat: **7 Signature Moments**.
>
> The bar is safe as the last band because section 03 below is white and the
> intro above is cream — the brown reads as a deliberate rule between them.
> Do NOT move it to the end of section 03: the Extensions section that
> follows *is* brand brown, and the two bands would merge into one block.

**Anchor IDs must not change** — the nav observer watches `sj-hero`; nav
links and the offers-panel CTA point at the section IDs above. Place
`section-00-nav.html` FIRST (immediately before the hero) and do not wrap it
in an Elementor section with `overflow: hidden`.

The **footer** is a theme-level element (like the global site header) and is
intentionally not one of these widgets.

> **Nav caveat:** `section-00-nav.html` in this folder is the OLD
> always-fixed bar with a `height: 0` mount, so it still overlaps the hero.
> The fixed version lives at `shared/section-00-nav.html` (docked → stuck →
> recalled, no overlap). Prefer the shared nav; this one is kept only so the
> page still works standalone.

---

## Behaviour applied after the first build

These were client-requested refinements — do not regress them:

- **Hero is image only.** The `<video>` element and its autoplay script were
  removed. Hero height reduced from full-viewport to `max(66dvh, 440px)`
  (58dvh / 56dvh at 768 / 420).
- **Chapter labels are Title Case** ("Chapter One"), not uppercase. The
  location and moment-role micro-labels remain uppercase, matching the mockup.
- **Hotel carousels advance together** off one shared 5,000 ms clock with an
  eased `opacity 1s ease-in-out` crossfade. Auto-advance is unconditional —
  it does not pause on hover and is not gated behind `prefers-reduced-motion`
  (that gate was the original reason they appeared not to move at all).
- **No `text-shadow` anywhere on this page.**
- Mobile type scale and vertical spacing reduced at 768 / 420.

---

## Images

Nearly everything is now filled with client-approved photography. The
`.sj-ch-mom-ph` / `.sj-stay-ph` CSS rules still exist but **no markup uses
them** — all 9 moment cards and all 9 hotel slides carry real images.

| Section | Slot | Image |
|---|---|---|
| 01 Hero | background | `umoya_compressed_img504253742.jpeg` |
| 03 Ch.1 | lead | `umoya_compressed_img88956217_(1).jpeg` |
| 03 Ch.2 | lead | `umoya_compressed_st_lucia_hippos_636379232.jpg` |
| 03 Ch.3 | lead | `umoya_compressed_img639400454.jpeg` |
| 04 Ext. | Victoria Falls | `umoya_compressed_img233195226.jpeg` |
| 04 Ext. | Chobe | `umoya_compressed_Chobe-Princess_Exterior_at-Sunset-709-1600x1066.jpg` |
| 05 Stays | Da Vinci ×3 | `Davinci_Outdoor_Pool_(3)` · `DAVINCI_Lounge_(2)` · `Da_Vinci_Room_801_002` |
| 05 Stays | Cape Grace ×3 | `Cape_Grace_Marina_View` · `Waterfront_Penthouse_5` · `Pool_at_Cape_Grace_4` |
| 07 CTA | background | `compressed_dsc05243.jpg` |

### Still awaiting converted files

These 5 moment/hotel images are **placeholders using older stand-in photos**,
because the client's source files were RAW (`.NEF`) or TIFF and were never
converted to web formats:

| Slot | Blocked on |
|---|---|
| Ch.1 — Lucia Motloung | `ZAV_6216.NEF` |
| Ch.1 — Antoinette Sithole | `ZAV_6880.NEF` |
| Ch.1 — Mandela House / Apartheid Museum | `ZAV_7105.NEF` |
| Ch.2 — "A Legacy Restored" (MalaMala) | `buffalo_maindeck2.tif` |
| Ch.3 — Christo Brand | `ZAV_1363.NEF` |
| 05 Stays — MalaMala ×3 | `buffalo_suite14` / `buffalo_maindeck5` / `buffalo_suite_3bathroom` `.tif` |

Image shorthand (`NAME.ext`) expands per the CLAUDE.md convention to
`…/2026/optimized/umoya_compressed_NAME.ext`.

---

## Open items / to confirm

- **Brochure link:** hero + closing-CTA "Download the Brochure" buttons are
  `href="#"` — point at the brochure PDF when ready.
- **Enquiry link:** "Speak With a Travel Expert" buttons are `href="#sj-cta"`
  (closing section) / `href="#"` on the final CTA — wire to the real
  contact/enquiry destination.
- **Copy:** all page body copy is verbatim from the mockup, with one
  deliberate client-requested exception — Section 05's header was changed
  from "Where You Stay / Hotel Stays Worthy of the Journey" to
  **"Where You Rest / Your Home Along the Way"**, with a new lead paragraph
  and a per-hotel description under each tile.

  > An early build paraphrased hero copy and invented extra buttons; that
  > was reverted. Treat mockup wording as fixed unless the client says
  > otherwise — flag awkward copy rather than improving it.

- **Global nav + footer:** the mockup's global nav and footer are NOT built
  into these widgets — they are theme-level. Since this page was built, a
  proper site-wide nav now exists at `shared/section-00-nav.html`; use that
  rather than the local `section-00-nav.html`.
- **Ntsiki image bug (fixed):** the Ch.3 "Black Route" card originally
  duplicated Christo Brand's `ZAV_1363` photo. It now correctly uses
  `img371169908`. Worth re-checking if that section is ever regenerated.
