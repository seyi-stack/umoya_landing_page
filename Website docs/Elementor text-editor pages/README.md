# Elementor Text Editor pages

Paste-ready copy for the four legal / information pages that are built with
Elementor's **Text Editor** widget, not an HTML widget.

| File | Page | Version |
|---|---|---|
| `Privacy Policy.html` | `/privacy/` | v1.1, effective 1 June 2026 |
| `Cookie Policy.html` | `/cookie-policy/` | v1.2, effective 1 June 2026, updated 26 Aug 2026 |
| `Terms and Conditions.html` | `/terms-and-conditions/` | v1.1, effective 1 June 2026 |
| `Travel Essentials.html` | `/travel-essentials/` | Verified August 2026 |

---

## How to paste one

1. Open the page in Elementor and select the **Text Editor** widget.
2. In the widget panel, switch from **Visual** to **Code**.
3. Select everything already in the box and delete it.
4. Paste the entire contents of the file.
5. Go to the widget's **Advanced** tab → **Custom CSS**, and paste
   `document-page-styling (widget Custom CSS).css`.
6. Switch back to **Visual** to eyeball it, then **Update**.

Step 5 is what makes it readable. Without it the page falls back to the
theme's defaults, which are wrong for long-form reading — see below.

**Use the Code tab, not Visual.** Pasting HTML into the Visual tab makes
TinyMCE escape the tags, and you end up with `<h2>` printed on the page as
literal text.

> `/travel-essentials/` does not exist yet — create the page first. The
> other three already exist, so **replace the content of the existing page**
> rather than making a new one. New slugs would break the footer, the
> Privacy Policy's own section 12, and the footer signup's redirect.

---

## What is in these files, and what is deliberately not

Only the tags a Text Editor handles cleanly:

`h1` `h2` `h3` `p` `ul` `li` `strong` `em` `a` `br` `code`

No `<style>`, no `<div>`, no ids, no inline styles. Three paragraphs carry a
class so they can be styled distinctly — `doc-standfirst` (the line under the
title on Travel Essentials), `doc-meta` (effective date / version) and
`doc-stamp` ("Verified August 2026"). Nothing else has one.

Internal links are root-relative (`/privacy/`, `/cookie-policy/`,
`/terms-and-conditions/`). External links carry `target="_blank"
rel="noopener"`.

Three things were dropped on purpose when these were generated from the
styled versions in `shared/`:

- **The Privacy Policy's contents list.** It relies on `id` anchors on each
  heading, and Elementor's editor is not reliable about preserving those.
  A contents list whose links do nothing is worse than none.
- **The Cookie Policy's "Cookie Settings" button.** Not because of the
  class — classes survive fine — but because TinyMCE is unreliable about
  `<button>` elements and may strip or mangle one. The footer's Cookie
  Settings button still works and is what section 4 of that policy points
  you to, so nothing is lost.
- **Decorative eyebrow labels** ("Legal", "Before You Travel") and rules.

---

## Styling — two files, pick one

| File | Where it goes | Notes |
|---|---|---|
| **`document-page-styling (widget Custom CSS).css`** | Text Editor widget → **Advanced → Custom CSS** | **Use this one.** No CSS class needed; `selector` is Elementor's token for the widget. Paste it on each of the four pages. |
| `document-page-styling.css` | **Site Settings → Custom CSS** | One copy for all four pages, but each widget must also be given the CSS class `umoya-doc` (Advanced → CSS Classes). |

> **Do not replace the word `selector`** in the widget version — Elementor
> substitutes it for that widget's own ID.

> **Paste the whole file.** A partial paste produces
> `Expected LBRACE at line 1, col 11` — that error means the editor received
> a selector with no `{` after it, i.e. the paste was cut short. The widget
> version is deliberately small (3.6 KB, plain ASCII, no long comment
> banner) to make that less likely.

Either way, the three `doc-*` classes the CSS references are already in the
`.html` files, so there is nothing extra to add by hand.

The theme's defaults make these pages hard to read, and the reason is not
mainly the spacing:

| | Theme default | Fixed |
|---|---|---|
| **Measure** | ~110 characters a line | ~68 |
| Line-height | ~1.9 | 1.7 |
| Space above vs below a heading | roughly equal | ~3:1 |
| h2 vs h3 | nearly the same size | clearly distinct |

**Measure is the big one.** Comfortable reading is 60–75 characters; past
about 90 the eye starts losing its place on the return sweep. That is what
made the page feel badly spaced even though the individual numbers were not
extreme — capping the column fixes more than any margin change.

The heading spacing was a proximity problem: with equal space above and
below, a heading floats between two blocks instead of introducing the one
underneath it. And h2/h3 were rendering at almost the same size, so
"Visas and entry" and "South Africa" read as the same level.

Fonts are untouched — everything still inherits the theme's typefaces.

## Two versions exist — pick deliberately

| | These files | `shared/page-*.html` |
|---|---|---|
| Widget | **Text Editor** | HTML widget |
| Styling | `document-page-styling.css` + theme | brand-styled, self-contained CSS |
| Extras | — | contents list, CookieYes button, brand cards |

Both carry **identical copy**. Use whichever matches how the page is built.
If you switch a page from one to the other, delete the old widget — do not
leave both on the page.

---

## Copy fidelity

The copy is verbatim from the client's source documents:

- `Revised footer docs/Umoya_Privacy_Policy (final).txt`
- `Revised footer docs/Umoya_Cookie_Policy (v2).txt`
- `Revised footer docs/Umoya_Travel_Essentials_Page_Copy.txt`
- `Website docs/Umoya_Terms_and_Conditions.txt`

Asserted by a sentence-level diff against each source — zero unmatched
sentences across all four. Word counts match exactly for Privacy and Terms;
the two small deltas are accounted for:

- **Travel Essentials, −14 words.** The source opens with an internal
  document-header line ("Website page copy | Combines the former Visa &
  Entry Information and Travel Insurance Guide pages | Verified August
  2026"). The first two clauses are production notes, not guest-facing copy,
  so only *Verified August 2026* is kept, as a currency stamp.
- **Cookie Policy, +4 words.** The lead-in "Or change them here:" survives
  from the styled version, where it introduces the settings button.

### Two rules when editing these

1. **British spellings are correct here.** "Travellers", "recognised",
   "authorised". These are the client's own legal drafting. The
   US-English convention applies to marketing copy on the rest of the site,
   **not** to these documents.
2. **Bump the version and the date together.** Both policies previously sat
   live for months showing the literal placeholder
   `Effective date: [INSERT DATE]`. If the text changes, the header at the
   top of the file changes with it.

Headings are Title Case here; the source files shout them in ALL CAPS, which
is a plain-text convention rather than an instruction about how the page
should read.

---

## Superseded

`Website docs/Elementor HTML snippets/` holds the **2026-07-20** versions of
the same documents. Those are v1.0, still contain `[INSERT DATE]`, and
predate the revised copy. They are kept as a record of the original brief —
do not paste them.
