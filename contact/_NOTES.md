# Contact Page — build notes

Built 2026-08-29 from
`Mockups (footer, contact)/Umoya_Contact_Page_Mockup.html`, with routing
context from `Mockups (footer, contact)/Umoya_Footer_Routing_and_Implementation.docx`.

Target URL: **`/contact/`**.

> **RESOLVED 2026-08-22 — this page is live.** See the status section at the
> bottom of this file.
>
> For history: when these sections were built, `/contact/` and `/contact-us/`
> both existed as Tevily demo templates — "Lorem ipsum", "88 Broklyn Street
> NY, USA", phone "666 888 0000", a fake "+27 12 345 6789". `/contact/` has
> since been replaced with these sections and `/contact-us/` now 404s, so
> the footer's Contact link no longer competes with a stale twin.

---

## Sections

Paste in this order as Elementor HTML widgets:

| # | File | Root ID | Notes |
|---|---|---|---|
| — | `shared/section-00-nav.html` | `#umoyaSiteNavMount` | site-wide nav, always first |
| 01 | `section-01-hero.html` | `#umoya-contact-hero` | eyebrow · "Talk to Us" · rule · lead |
| 02 | `section-02-forms.html` | `#umoya-contact-forms` | the two panels |
| 03 | `section-03-direct.html` | `#umoya-contact-direct` | email / media / office band |
| — | `shared/section-99-footer.html` | `#umoya-footer` | site-wide footer, always last |

Anchors worth keeping: `#ct-plan` and `#ct-general` link straight to a panel.

---

## HubSpot

Two dedicated forms, created 2026-08-29 with
`node tools/hubspot-sync.mjs create-forms`:

| Panel | HubSpot form | GUID | `source` |
|---|---|---|---|
| Plan a Journey | Contact Page Journey Inquiry | `1e38d41f-3e99-4605-94cc-9057857a4e82` | `contact_page_journey` |
| General & Media | Contact Page General & Media Inquiry | `ffececd7-b401-43cb-8ee2-858b5d62892c` | `contact_page_general` |

Separate forms so "plan my trip" and "I am a journalist" never land in the
same conversion number — the same reasoning that gave every other page its
own form on 2026-08-11.

### New contact property

`enquiry_type` (enumeration/select) was created for panel 2. Its options are
the panel's own `<option>` list, verbatim — an enumeration rejects any value
that is not an exact match, so **the two lists must be edited together**:

```
Travel advisor or agency partnership
Group leader: reunions, churches, alumni & organisations
Wedding or event planner
Press and media
Existing booking
General question
```

It is deliberately **not required** on the HubSpot form, even though the page
requires it. A required custom field is exactly what broke For Groups on
2026-08-12: the pages were re-pasted before the plugin was re-uploaded, so the
server still mapped `merge2 → country` and HubSpot rejected every submission
with `Required field 'group_type' is missing`. Optional means a deploy in the
wrong order degrades to a missing field rather than a rejected lead.

### Property mapping

| Slot | `contact_page_journey` | `contact_page_general` |
|---|---|---|
| MERGE1 | `salutation` | — |
| FNAME / LNAME | `firstname` / `lastname` | `firstname` / `lastname` (split from Full name) |
| EMAIL / PHONE | `email` / `phone` | `email` |
| MERGE2 | `country` | **`enquiry_type`** |
| MERGE3 | `city` | **`organization`** |
| MERGE4 / MERGE5 | `preferred_travel_season` / `preferred_travel_year` | — |
| MERGE6 | `party_size` | — |
| MERGE7 | `founders_circle_message` | `founders_circle_message` |

Implemented **twice** — browser (`hubspotFieldMap` in the section script) and
server (`$source_aliases` in `class-submissions.php`). Both are asserted by
`node tools/verify-alias-mapping.mjs`.

### Verified end-to-end

`node tools/hubspot-verify-forms.mjs contact` submits each form's real payload
and reads the contact back. Run 2026-08-29: **every field persisted** on both
forms, including `enquiry_type`. The diagnostic `@example.com` contacts were
removed afterwards with `node tools/hubspot-cleanup-tests.mjs`.

(The tool now takes an optional substring filter so re-verifying one form does
not re-submit the other seven.)

---

## Deviations from the mockup, and why

1. **Colours and fonts are the brand's, not the mockup's.** The routing doc
   says the mockup colours are illustrative. Every `font-family` is `inherit`;
   no Poppins, no Canela, no Google Fonts.

2. **Panel 2 has a required POPIA consent checkbox that the mockup omits.**
   Panel 2 processes personal data exactly as panel 1 does, and every other
   Umoya form carries this box. The wording is panel 1's, unchanged. If the
   client wants it gone, it is one block to delete — but the enquiry would
   then be processed without recorded consent.

3. **"Full name" is one visible field, as drawn**, but it is split into hidden
   `FNAME` / `LNAME` inputs on every keystroke, because HubSpot stores those
   separately. The split is on the FIRST space, so compound surnames survive
   ("Ada van der Merwe" → `Ada` / `van der Merwe`). A single word leaves
   `lastname` empty, which HubSpot accepts.

4. **The two panel cards are equal height**, with panel 2's message box
   absorbing the difference. The mockup's grid defaults to `stretch` too; the
   growing textarea just makes the extra room useful, and only applies at
   ≥901px where the panels sit side by side.

5. **Month / Year keep a shared group label** ("When are you hoping to
   travel?") with visually-hidden per-select labels, so each select still has
   an accessible name.

6. **Country uses the Founder's Circle list and its ISO values** (`US`, `ZA`,
   …), so the `country` property stays consistent across pages. Note this
   means HubSpot stores the code, not the name — pre-existing behaviour,
   unchanged here.

7. **The direct-contact band carries the office address**, which the mockup's
   band does not. Someone who does not want a form — a journalist on
   deadline — should not have to hunt for it. Address text matches the live
   site footer, including "Maude Street", which the mockup drops.

---

## Checks run

- `node --check` on every extracted `<script>` — clean.
- Tag balance, no `href="#"`, no mockup fonts/hexes leaked.
- Rendered locally at 1280 / 822 / 375 / 320: no horizontal overflow at any
  width, smallest input font 16px (iOS zoom floor), panels stack at ≤900px,
  month/year stay paired down to 320px.
- Consent gate: submitting panel 2 with a valid email but no consent tick
  makes **zero** network calls and shows "Please tick the consent box so we
  may reply."

---

## Status: LIVE

✅ **Published at `/contact/`** — verified 2026-08-22 by fetching the page
uncached: it serves `umoya-contact-hero`, `umoya-contact-forms`,
`umoya-contact-direct`, `ct-plan` and `ct-general`, with no Tevily demo copy
("Lorem ipsum", "88 Broklyn Street NY") remaining.

✅ **`/contact-us/` now 404s**, so the duplicate demo page needs no redirect
decision.

✅ **Linked from the shared nav** since 2026-08-22 — `Contact` is the fifth
item in `shared/section-00-nav.html`, in both the inline row and the mobile
dropdown. Its `data-path` is `/contact`, which deliberately does not match
the retired `/contact-us`. Adding that fifth link also moved the nav's
hamburger breakpoint from 900px to 1024px; see CLAUDE.md Phase 18.

---

## Still open

- The page inherits the live site's origin problems — see the stability
  section in `CLAUDE.md`. Nothing here changes that.
- The plugin must be re-uploaded for `contact_page_general` to forward
  `enquiry_type` / `organization` from the WordPress backup path. Until then
  those two submissions still **save** in Umoya Submissions (WordPress-first),
  they just reach HubSpot with the fields mapped by the old table. Rebuild
  with `python tools/build-plugin-zip.py` — never `Compress-Archive`.
