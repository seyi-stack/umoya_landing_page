# Founder's Circle — v4 Revamp Notes

Working copy of the Founder's Circle page, updated per
`Founder's_Circle_Page_Feedback_v4.docx`. The original
`founders-circle/` files are untouched.

The HTML mockup (`2__umoya_founders_circle_mockup.html`) was used as a
**layout reference only**. Fonts and colours were NOT taken from it —
every section still inherits the theme typography (`font-family: inherit`)
and uses the brand palette. Dark mockup backgrounds were mapped to brand
brown `#4B2E2B`; off-whites to brand cream `#F5F0EB`.

---

## Recommended Elementor section order (changed)

Place the HTML widgets in this order. The form stays mid-page and Early
Access now sits **below** the Journey, per the feedback.

| # | File | Section |
|---|------|---------|
| 1 | `section-00-nav.html` | Sticky nav + table-of-contents bar |
| 2 | `section-01-hero.html` | Hero |
| 3 | `section-02-invitation.html` | Invitation — "The first to travel with us." |
| 4 | `section-03-membership-privileges.html` | Membership Privileges (image on the right) |
| 5 | `section-04-inquiry-form.html` | Sign-up / inquiry form (kept mid-page) |
| 6 | `section-05-journey.html` | Your Journey Begins Here (tiles) |
| 7 | `section-06-early-access.html` | Exclusive Early Access (below Journey) |
| 8 | `section-07-founding-offer.html` | The Founding Offer (brown, no bg image) |
| 9 | `section-08-our-approach.html` | Our Approach (copy + video) |
| 10 | `section-09-why-umoya.html` | Why Umoya Afrika Tours (4 pillars) |
| 11 | `section-10-travel-essentials.html` | Travel Essentials (accordion) |
| 12 | `section-11-closing-cta.html` | Speak With a Travel Expert (closing) |

Files were renamed to reflect content + reading order (the originals in
`founders-circle/` keep the old names). The table-of-contents bar (00) order
was aligned to this flow (Membership precedes the form).

---

## v4.1 refinements (latest round)

- **Invitation (03):** "Become a Founding Member" button is now a lighter
  outline that fills on hover, instead of a solid brown block.
- **Founding Offer (08 in feedback / file `section-07-founding-offer.html`):**
  confirmed present and matching the mockup — brown section, **no background
  image**, brand fonts/colours, "Reserve Your Place". The old
  `section-05a-pricing.html` filename was the source of the "missing" confusion.
- **Journey (05):** tile image height + body padding reduced so cards take
  less vertical space.
- **Our Approach (08):** left copy and right video are balanced to the same
  height on desktop (grid stretches; the video fills the copy height); on
  stacked layouts the video reverts to a 16/10 banner.
- **Why Umoya (09):** new four-pillar copy (African-Led · Special Guests who
  know South Africa Best · Premium Accommodations · Looked After End to End,
  incl. the Thompsons Africa line). Overlay darkened for the longer copy, and
  **mobile now stacks vertically** (the swipe carousel is disabled — it did
  not suit the longer text).
- **Travel Essentials (10):** copy replaced with the five current items
  (item 4 keeps "three movements"); the "Still have questions?" footer CTA was
  removed — the closing section (11) covers it. This section is the original
  icon-box accordion (restored on disk); copy was updated in place.
- **Mobile:** every section carries 1024 / 768 / 420 breakpoints; the pillars
  rework above was the main mobile fix this round.

---

## What changed per section

- **Nav (00):** kept the TOC bar; reordered Membership before the form.
  The global site header ("Ways to Travel ▸ Group Trips" etc.) is a
  theme-level header, not part of these files — build it at the header
  template level when all pages exist.
- **Hero (01):** single CTA only; eyebrow "An Invitation to Our Guests",
  headline "Join the Founders Circle", new sub-line, button "Reserve Your Place".
- **Intro (02):** added an eyebrow; new "The first to travel with us." copy.
- **Membership Privileges (04):** image moved to the right; removed the
  guest-limit bullet; 5 new privilege lines.
- **Form (02):** overlay now reads "Your Umoya Experience Awaits"; right
  heading "Begin Your Journey"; "When are you hoping to travel" is now
  Month + Year side-by-side dropdowns (12 months, 2026–2028, "Not sure
  yet"); the travel-style field became "How many guests will be travelling?";
  two POPIA consent checkboxes added (required + optional marketing).
- **Journey (05):** rebuilt as tiles — 3 immersive-chapter tiles plus a new
  "Experiences Beyond South Africa" sub-section with Victoria Falls and Chobe
  as two separate extension tiles. Stats now 10 Days · 3 Immersive Chapters ·
  2 Optional Extensions. The Leaflet route map was removed.
- **Early Access (03):** new two-paragraph copy (flagship + tailor-made).
- **Founding Offer (05a):** brown section, no price shown — "pricing held
  for personal consultation."
- **Our Approach (06):** kept the copy-left / video-right layout; new
  "A new company, built on long relationships." copy.
- **Why Umoya (06b):** 4 new pillars (African-Led & African-Owned, Named
  Hosts, Intimate by Design, Looked After End to End).
- **Travel Essentials (07):** flatter accordion (small terracotta descriptor
  over a serif topic, + → × toggle); 5 new items; footer CTA removed.
- **Closing (05b):** centered "We'd love to speak with you" with a
  transparent outline button that fills on hover.

---

## Decisions / assumptions to confirm

1. **Hero headline punctuation** — rendered "Join the Founders Circle"
   (no apostrophe, no period) per the note "no punctuation is needed in
   header." Elsewhere the brand keeps "Founder's Circle." Confirm if the
   hero should keep the apostrophe.
2. **Button label** — standardised on "Reserve Your Place" (the feedback
   wrote "Reserve Your Space" once for the hero, but the mockup, nav, and
   offer all use "Place").
3. **Form right heading** — the feedback retired "South Africa Awaits" but
   gave no replacement; used "Begin Your Journey." Swap if preferred.
4. **Guest-limit consistency** — the guest cap was removed from Membership
   Privileges (per the recommendation), but the feedback still keeps
   "Eighteen guests at most…" in the Why-Umoya pillar and "limited to
   eighteen places" in the Founding Offer. Implemented exactly as written
   per section — flagging the slight inconsistency for a final call.
5. **"Movements" vs "immersive chapters"** — Travel Essentials item 4 used
   "three immersive chapters" to match the global rename, even though that
   feedback line literally said "three movements." Revert if "movements"
   was intentional there.

---

## Open items

- ✅ **HubSpot mapping — resolved 2026-08-13/14, see CLAUDE.md Section 21.**
  `MERGE4 → preferred_travel_season` is unchanged, but `MERGE6` now maps to
  `party_size`, not `preferred_journey_length` — the field is literally
  "How Many Guests Will Be Traveling?". This correction was free: the old
  target had never existed as a HubSpot property, so no submitted value was
  ever lost by the rename. More importantly, this form no longer shares
  HubSpot's `Umoya Website Form Submissions` form with every other page — it
  now posts to its own dedicated **Founder's Circle Inquiry** form
  (`b3c06e8a-9bbc-44e1-bc67-00e35528b9b9`), created after the shared form was
  found to be silently discarding travel month/year, guest count and the
  message on every submission across the whole site. It also carries
  `data-hs-do-not-collect="true"` so HubSpot's tracking script stops filing a
  duplicate "non-HubSpot / collected" copy of every submission. Consent +
  marketing opt-in are still recorded in the WordPress backup payload
  (`consent_to_process`, `marketing_opt_in`), but **the marketing checkbox
  itself is not yet wired to any HubSpot property or list** — traced
  end-to-end and logged as an open item in CLAUDE.md Section 16/21.
- **Privacy Policy link** in the form consent is still `href="#"` — point it
  at the live policy URL.
- **Images:** Victoria Falls and Chobe tiles use CDN placeholders marked with
  `★ SWAP` — replace with final approved images.
- **Plugin sync (when approved):** update the FC `source:` paths in
  `tools/build-elementor-widgets.mjs` to `founders-circle-revamp/…` (or copy
  the approved files back into `founders-circle/`), re-run the generator, and
  rebuild `umoya-elementor-widgets.zip`.
