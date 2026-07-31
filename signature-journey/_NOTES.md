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
| 3 | `section-02-intro.html` | Overview stat bar + intro | `sj-overview` |
| 4 | `section-03-journey-chapters.html` | The three chapters (History · Safari · Cape) | `sj-journey` |
| 5 | `section-04-extensions.html` | Optional extensions (Vic Falls · Chobe) — dark band | `sj-extensions` |
| 6 | `section-05-stays.html` | Where You Stay — 3 hotel slideshows | `sj-stays` |
| 7 | `section-06-inclusions-offers.html` | Inclusions grid + sticky Offers panel | `sj-inclusions` |
| 8 | `section-07-cta.html` | Closing CTA | `sj-cta` |

**Anchor IDs must not change** — the nav observer watches `sj-hero`; nav
links and the offers-panel CTA point at the section IDs above. Place
`section-00-nav.html` FIRST (immediately before the hero) and do not wrap it
in an Elementor section with `overflow: hidden`.

The **footer** is a theme-level element (like the global site header) and is
intentionally not one of these widgets. The nav (00) is fixed to the top of
the page at all times (homepage-style), so the hero sits beneath it.

---

## Image swap list (★ SWAP)

The user will supply image preferences — every image slot is marked with a
`★ SWAP` comment. Current placeholders:

| Section | Slot | Current placeholder |
|---|---|---|
| 01 Hero | background image (no video) | `umoya_compressed_SAT000922.jpeg` |
| 03 Chapter 1 | lead image | `compressed_gauteng.jpg` |
| 03 Chapter 1 | 3 moment cards | labelled placeholder tiles (welcome dinner · Hector Pieterson · Mandela House/Apartheid Museum) |
| 03 Chapter 2 | lead image | `umoya_compressed_img001238.jpeg` |
| 03 Chapter 2 | 3 moment cards | labelled tiles (Big Five drive · MalaMala · community) |
| 03 Chapter 3 | lead image | `umoya_compressed_img1777576366.jpeg` |
| 03 Chapter 3 | 3 moment cards | labelled tiles (Robben Island · Winelands · closing dinner) |
| 04 Extensions | Victoria Falls | `umoya_compressed_img233195226.jpeg` |
| 04 Extensions | Chobe | `umoya_compressed_img1949173199.jpeg` |
| 05 Stays | 3 hotels × 3 slides | labelled placeholder slides (Da Vinci · MalaMala · Cape Grace) |
| 07 CTA | background | `compressed_dsc05243.jpg` |

**Moment cards & hotel slides** currently render as clean, brand-toned
labelled placeholder tiles (subject named on each). To drop in a real photo:
- *Moment card:* replace the `.sj-ch-mom-ph` block with
  `<img class="sj-ch-mom-pic" src="…" alt="…" loading="lazy">`.
- *Hotel slide:* set the slide's `background-image` and remove its
  `.sj-stay-ph` child (aim for 3 images per property).

Image shorthand (`NAME.ext`) expands per the CLAUDE.md convention to
`…/2026/optimized/umoya_compressed_NAME.ext`.

---

## Open items / to confirm

- **Brochure link:** hero + closing-CTA "Download the Brochure" buttons are
  `href="#"` — point at the brochure PDF when ready.
- **Enquiry link:** "Speak With a Travel Expert" buttons are `href="#sj-cta"`
  (closing section) / `href="#"` on the final CTA — wire to the real
  contact/enquiry destination.
- **Copy:** all page body copy is verbatim from the mockup, including the
  moment-card / hotel-slide placeholder labels (only the internal
  "placeholder · for Seyi" working annotation is omitted).
- **Global nav + footer:** the mockup's global nav (The Signature Journey ·
  Private & Tailormade · Experiences · For Groups · About · Join the
  Founder's Circle) and its footer are NOT built into these widgets — they
  are treated as theme-level, matching the Founder's Circle convention. The
  nav widget (00) is instead an in-page table-of-contents. Confirm if the
  client wants the mockup's exact global nav + footer built into the page.
