# Homepage — v4 Revamp Notes

Working copy of the homepage, updated per `Home_Page_Updates_&_Feedback.docx`.
The original `homepage/` files are untouched.

Per the client: **the current homepage structure is the foundation** — the
mockup (`1__umoya_homepage_mockup.html`) contributed the cultural-custodians
section, the award callout, and the Thompsons Africa credibility marker, plus
two brand-new sections. The mockup was a **layout reference only**: fonts stay
inherited (`font-family: inherit`) and all colours are brand tokens (cream
`#F5F0EB`, brown `#4B2E2B`, terracotta `#D97E53`).

---

## Elementor section order (files sort in this order)

| # | File | Section |
|---|------|---------|
| 1 | `homepage-section-00-nav.html` | Sticky nav (now includes "Ways to Travel" link) |
| 2 | `homepage-section-01-hero.html` | Hero — single Founder's Circle ask |
| 3 | `homepage-section-02-about.html` | About Umoya (unchanged, directly below hero) |
| 4 | `homepage-section-03-signature-journey.html` | Our Flagship Experience (3-slide chapter carousel) |
| 5 | `homepage-section-04-ways-to-travel.html` | **NEW** — Ways to Travel card carousel |
| 6 | `homepage-section-05-legends.html` | **NEW** — Signature Moments Guided by South African Legends |
| 7 | `homepage-section-06-hotel-stays.html` | Hotel Stays Worthy of the Journey |
| 8 | `homepage-section-07-founders-circle.html` | Join the Founder's Circle (condensed invitation) |
| 9 | `homepage-section-08-film-award.html` | **NEW** — Brand film + ITFFA award |
| 10 | `homepage-section-09-why-umoya.html` | Why Umoya Afrika Tours (4 pillars) |
| 11 | `homepage-section-10-travel-essentials.html` | Travel Essentials FAQ (5 items) |
| 12 | `homepage-section-11-speak-with-expert.html` | **NEW file** — Speak with an Expert (extracted from FAQ footer) |
| — | `homepage-form-popup.html` | Shared inquiry popup (fields synced with the FC page form) — must be on the page; all `data-umoya-form-popup` buttons open it |

---

## What changed per section

- **Hero (01):** single CTA only (no Watch-the-Film); sub-copy → "Premier
  tailor-made journeys for those ready to experience South Africa through rare
  and exclusive access."; button → "Join the Founder's Circle" (links to the FC page).
- **About (02):** untouched per feedback ("keep as is").
- **Signature Journey (03):** kicker → "Our Flagship Experience"; heading →
  "Our Signature Journey: Into the Heart of Southern Africa"; stats → 10 Days ·
  3 Immersive Chapters · 2 Optional Extensions · 7 Signature Moments (guest count
  removed; 2×2 on mobile); carousel cut to **3 slides** with chapter captions
  (History & Culture / Safari Game Drives / The Cape — the safari and boat-with-flag
  images kept as instructed, Gauteng image used for Chapter 1); new summary paragraph;
  at-a-glance line updated to match the new itinerary.
- **Ways to Travel (04, NEW):** scroll-snap card carousel with arrows (A&K /
  Harmony Mauritius direction) — 6 cards: Large Groups, Solo Travel, Couples
  Getaway, World Wonders, Safari, Winelands, all with the client's copy.
  "Plan Your Journey" opens the inquiry popup. 3 cards per view desktop, 2 tablet,
  1 + peek on mobile. Images are CDN placeholders (★ SWAP).
- **Legends (05, NEW):** "Signature Moments Guided by South African Legends" +
  intro + 4 custodian cards (Lucia Motloung, Antoinette Sithole, Christo Brand,
  Ntsiki Biyela). Per the client, images are **branded monogram placeholders**
  until Wilson gathers photos — each has a ★ SWAP comment.
- **Hotel Stays (06):** header → "Hotel Stays Worthy of the Journey" + new
  body copy; gallery reduced to the 3 named properties with caption overlays
  (The Da Vinci · MalaMala · Cape Grace); the external Unsplash image removed.
- **Founder's Circle (07):** condensed centered invitation — eyebrow "The
  Invitation", heading "Join the Founder's Circle", single paragraph, button
  "Become a Founding Member" (popup). No bullets, no guest limit, no departure
  dates, per feedback.
- **Film + Award (08, NEW):** "Where Intentional Travel Meets Award-Winning
  Storytelling" + 3-paragraph copy; click-to-load YouTube embed of *Let Your
  Story Begin* (no iframe until pressed — fast page load); award callout card
  with a placeholder laurel icon (★ SWAP for the official ITFFA badge).
- **Why Umoya (09):** new 4-pillar copy (African-Led & African-Owned · Special
  Guests who know South Africa Best · Premium Accommodations [content kept as
  is] · Looked After End to End incl. Thompsons Africa / since 1901). Overlay
  darkened for the longer copy; mobile now stacks vertically (swipe carousel
  disabled — MOBILE_BP = 0).
- **Travel Essentials (10):** 5 FAQ items aligned with the Founder's Circle
  page copy (item 4 keeps "three movements" per the supplied text); the
  "Still have questions" footer block removed from this file.
- **Speak with an Expert (11, NEW file):** brown background kept per the
  client's note; "Still Have Questions?" as a small eyebrow, "We'd love to
  speak with you." on its own line, transparent cream-outline button that
  fills on hover; opens the inquiry popup.
- **Nav (00):** added "Ways to Travel" to the desktop links, mobile dropdown,
  and the active-section tracking array. Everything else unchanged.
- **Form popup:** synced with the Founder's Circle page form — overlay now
  "Your Umoya Experience Awaits", heading "Begin Your Journey"; "When are you
  hoping to travel" is Month + Year side-by-side dropdowns (12 months,
  2026–2028, "Not sure yet" — stays two-up on mobile); travel-style field
  replaced by "How many guests will be traveling?" (5 group-size options);
  two POPIA consent checkboxes added (required + optional marketing, not
  pre-ticked) with submit gating; consent + marketing opt-in recorded in the
  WordPress backup payload (`consent_to_process`, `marketing_opt_in`); consent
  text updated on the form attributes. The Privacy Policy link in the
  consent line is `href="#"` — point it at the live policy URL.

  **Updated 2026-08-13/14 (see CLAUDE.md Section 21 for the full story):**
  this form no longer shares a HubSpot form with Founder's Circle. It now
  posts to its own dedicated **Homepage Popup Inquiry** form
  (`a9e947b4-cb2e-45da-b2c7-b83b4228dfb5`), because the shared form was
  found to be **silently discarding** travel month/year, guest count and the
  message on every submission (it never declared those fields, and two were
  typed as Ticket properties, not Contact). `MERGE6` now maps to
  `party_size`, not `preferred_journey_length` — the field is literally
  "How Many Guests Will Be Traveling?", and no history was lost by
  correcting it because the old target never existed as a property. The
  form also now carries `data-hs-do-not-collect="true"` so HubSpot's
  tracking script does not additionally file it as a duplicate
  "non-HubSpot / collected" form. **The `marketing_opt_in` checkbox is
  captured into the WordPress payload but is not yet wired to anything in
  HubSpot** — traced end-to-end and logged as an open item in CLAUDE.md
  Section 16/21; nobody who ticks it is currently added to a list.

## Removed

- **`homepage-section-05a-pricing.html`** ($12,500 / Save $2,500 card) — not
  in the client's outlined section order, and it contradicts the new direction
  where the founding rate is shared personally on a consultation call (see the
  FC page's Founding Offer). The original remains in `homepage/`. Reinstate
  only if the client decides to publish pricing again.

---

## Responsiveness / Elementor notes

- Every section is scoped under its root ID, ES5 IIFE scripts, IntersectionObserver
  with fallbacks, `font-family: inherit`, no external requests beyond the Umoya
  CDN and the click-to-load YouTube embed.
- Breakpoints per section: ~1024px (2-up grids), 768px (single column), 420px
  (compact). Ways-to-Travel uses native scroll-snap so touch swiping needs no JS.
- The 4-stat journey row wraps 2×2 below 760px.
- The shared popup file is required on the page for every `data-umoya-form-popup`
  button (journey, ways-to-travel, hotel stays, founders circle, speak-with-expert).

## Open items

- ★ SWAP images: Ways-to-Travel tiles (6), Legends portraits (4, awaiting
  Wilson), ITFFA award badge, and confirm the three hotel photos match the
  named properties (Da Vinci / MalaMala / Cape Grace).
- The film section links to YouTube ID `4ZtbEvETrBU` (from the mockup) —
  confirm this is the final cut of *Let Your Story Begin*.
- Footer newsletter form (Elementor widget) is outside these files.
  `shared/section-99-footer.html` now exists with its own dedicated
  **Footer Newsletter Signup** HubSpot form
  (`40d535ad-fc91-4831-8231-eddc05208624`) built and verified 2026-08-13 —
  but check CLAUDE.md for its current status, since the footer has had at
  least one further rebuild pass since (2026-08-29) that this note predates.
- When approved: sync `tools/build-elementor-widgets.mjs` to the new file
  names/sections (including the three new sections + removed pricing), re-run
  the generator, and rebuild the plugin zip.
