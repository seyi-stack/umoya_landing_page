# CLAUDE.md - Umoya Afrika Tours Project Handoff

Last updated: 2026-09-01
Workspace: `C:\Users\MOVING_SURFACE\Downloads\UM_Claude`
Remote: `https://github.com/seyi-stack/umoya_landing_page.git`
Current local branch: `codex/elementor-widget-sync` (pushed through `1b62ef9`)

This file is the living handoff for the Umoya Afrika Tours website work. It should help any future assistant, developer, or editor understand what has been built, why it was built, how the pieces connect, and what still needs attention.

It intentionally covers the project in sequence:

1. Brand and product intent.
2. The original Founder's Circle landing page.
3. The HubSpot and WordPress submission infrastructure.
4. The homepage rebuild.
5. The custom Elementor widget plugin.
6. Legal and footer documentation.
7. Footer newsletter form routing.
8. The revamp folders, the Signature Journey page, and three new pages.
9. The shared site-wide navigation and the Tevily theme-header conflict.
10. Current workflow rules, validation, and open tasks.

Use this file before making further changes. The project has moved beyond standalone HTML snippets; it now includes a generated Elementor plugin, HubSpot forwarding, WordPress backup submissions, legal content snippets, homepage sections, four page-section folders built from client mockups, a shared navigation widget, and GitHub sync expectations.

> **Read Phases 9–14 (Section 5) first if you are picking this up cold.**
> They cover everything built after the widget-generator work, including
> the two competing header systems on the live site and an unresolved
> live-site stability problem.

### Companion notes files

`CLAUDE.md` is the index. Per-area detail lives in these, and they should
be kept in sync when their area changes:

| File | Covers |
|---|---|
| `_NEW-PAGES-NOTES.md` | Private & Tailormade, About Us, For Groups + the shared nav |
| `signature-journey/_NOTES.md` | The Signature Journey page |
| `contact/_NOTES.md` | The Contact page + its two HubSpot forms |
| `founders-circle-revamp/_REVAMP-NOTES.md` | Founder's Circle v4/v5 revamp |
| `homepage-revamp/_REVAMP-NOTES.md` | Homepage revamp |

The three footer content pages (`shared/page-travel-essentials.html`,
`page-privacy-policy.html`, `page-cookie-policy.html`) have no separate
notes file - Phase 19 below is their documentation, and each file carries a
header comment explaining its own decisions.

---

## 1. Project Identity

### Business

Umoya Afrika Tours is a luxury heritage travel company focused on immersive, high-touch journeys across South Africa, especially for the global African diaspora. The brand voice is premium, warm, culturally grounded, and intentionally different from generic tourism language.

### Strategic Website Goal

The website is not just a brochure. It is being shaped into a conversion and trust platform that can support:

- Founder's Circle lead capture.
- Newsletter and early-access signups.
- High-end narrative storytelling.
- Legal compliance and trust pages.
- HubSpot CRM capture.
- Future payment, booking, and client portal infrastructure.

### Audience

The primary audience is discerning diaspora travelers who want a luxury experience with emotional, cultural, and ancestral meaning. The user experience should feel personal, cinematic, calm, and intentional. It should not feel like a stock travel template.

---

## 2. Standing Collaboration Rules

These preferences come from the way the project has evolved and should be treated as durable unless the user overrides them.

- Act directly in the local workspace when a concrete path is given.
- Preserve visual fidelity first when converting HTML into Elementor widgets.
- Preserve useful explanatory comments in code; remove only noisy or misleading comments.
- When the user asks for entire code or copy-paste content, provide full replacement code, not small fragments.
- For responsive CTA/layout issues, preserve the intended visual style first. If a button background should contain text and icon, fix sizing and padding before changing typography or stacking layout.
- For Elementor work, keep homepage and Founder's Circle widgets grouped separately.
- When generating widgets, expose broad editability without breaking the exact source layout.
- Stage only intentional files in git. The worktree often contains unrelated QA/profile artifacts.
- The user previously asked to always sync with GitHub after repo changes. When doing that, use a scoped branch and do not blanket-add unrelated files.
- When a prompt refers to an image by a short filename (e.g. `img6406.jpg`), it is shorthand — expand it per the **Image Link Shorthand** convention below before writing it into any `src`, `poster`, `background-image`, or `<source>`.

---

## Image Link Shorthand (Prompt Convention)

To avoid retyping long media URLs, the user references images in **short form** — just the filename, without the folder path or the shared filename prefix. **Always expand a short reference to the full URL before writing it into any `src`, `href`, `poster`, `background-image`, or `<source>`.**

### Expansion rule

A bare image filename `NAME.ext` expands to:

```
https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/umoya_compressed_NAME.ext
```

That is: prepend the fixed base directory and the fixed filename prefix `umoya_compressed_`.

| Piece | Fixed value |
|---|---|
| Base directory | `https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/` |
| Filename prefix | `umoya_compressed_` |

### Examples

| Given in a prompt | Written in the code |
|---|---|
| `XXXX.jpg` | `https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/umoya_compressed_XXXX.jpg` |
| `ABCD.png` | `https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/umoya_compressed_ABCD.png` |
| `img6406.jpg` | `https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/umoya_compressed_img6406.jpg` |

### Rules & edge cases

- **Only applies to bare filenames** — a token with no `http` and no `/`. If a full URL or any path is provided, use it exactly as given (do not re-expand).
- **Preserve the extension exactly** as written (`.jpg`, `.jpeg`, `.png`, `.webp`, …). Do not "correct" `.jpeg` ↔ `.jpg` — they are different files on the server.
- **Default prefix is `umoya_compressed_`.** A few older assets in the same folder use the shorter prefix `compressed_` (no `umoya_`), e.g. `compressed_dsc05243.jpg`. If an expanded `umoya_compressed_` link 404s, retry with the `compressed_` prefix — but expand to `umoya_compressed_` first.
- The optimized-asset folder is fixed at `2026/optimized/`. Legacy assets under `2025/10/`, `2025/12/`, etc. are **not** produced by this shorthand — reference those with their full URLs.

---

## Image Processing Procedure (client-supplied images)

Follow this whenever the client sends images — usually as Google Drive
links in a feedback doc. It is the established method for this project.

### 0. Check whether we already have it — DO THIS FIRST

The client frequently re-sends links to photos already on the server, and
often labels the same file two different ways. Always resolve a Drive link
to its **original filename** before downloading:

```bash
curl -sIL "https://drive.google.com/uc?export=download&id=<FILE_ID>" \
  | grep -i content-disposition
```

Then check the uploads folder / CDN for that stem (e.g. `ZAV_6354`,
`AdobeStock_371169908`). If it exists, **reuse it and tell the user** —
do not create a duplicate. Roughly half of every batch so far has already
been on the server.

Where the mount is slow, a direct CDN probe is faster than listing:

```bash
curl -s -o /dev/null -w "%{http_code}" \
  "https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/<NAME>"
```

### 1. Download

Drive files are shared publicly, so no OAuth is needed:

```
https://drive.google.com/uc?export=download&id=<FILE_ID>
```

Guard against Drive returning an HTML permission/quota page instead of
image bytes — check the first byte is a real image magic number.

### 2. Optimize — this is mandatory, not optional

Sources are full-resolution Lightroom/stock exports. Real examples: a
4040×6064 portrait at **14.9 MB**, a 6720×4480 at 12.4 MB. One batch of 15
totalled **131 MB**. Dropping those in raw would be unacceptable on a site
already showing ~4s TTFB and intermittent 520s.

| Setting | Value | Why |
|---|---|---|
| Max long edge | **2400 px** | Ample for full-bleed retina; card images never need more |
| Format | JPEG | Matches the folder's convention |
| Quality | **82** | Lands 300–800 KB, in line with existing assets |
| `optimize` + `progressive` | on | Smaller files, nicer perceived load |
| EXIF | **apply rotation, then strip** | Order matters — see below |

**EXIF order is load-bearing.** Call `ImageOps.exif_transpose()` *before*
saving without an `exif=` argument. Applying rotation first keeps portraits
upright (Wilson and Vivian both came through correctly as 1600×2400);
stripping afterwards removes camera and GPS metadata from what are personal
photographs, and saves bytes. Do not skip either half.

Typical result: **131 MB → 8.5 MB (≈94% smaller)** with no visible loss.

### 3. Name and place

- Folder: `.../Mountain Duck/<mount>/wp-content/uploads/2026/optimized/`
- Name: `umoya_compressed_<descriptive_slug>.jpg`
  (e.g. `umoya_compressed_about_host_vivian.jpg`)
- **Never overwrite** an existing file — if the target name exists, report
  and skip.
- **Never delete anything**, including superseded files. The old
  `umoya_groups_sororities.jpg` still sits beside its replacement.
- Keep the untouched original locally so the step is repeatable.

Mountain Duck syncs to the live server, so files are usually reachable at
their public URL within a minute. Verify with an HTTP 200 check before
wiring them into HTML.

### 4. Wire into the HTML and verify

Reference via the standard URL, then confirm in a browser that every image
actually decodes — `naturalWidth > 0`, not merely "no 404". Note that
`loading="lazy"` images report `complete === false` until scrolled into
view, so force-load them before judging:

```js
document.images.forEach(i => { i.loading='eager'; i.src = i.src; });
```

### Adjusting framing instead of replacing

When the client says an image is "cut off" or should be "more centered",
the fix is usually `object-position`, not a new asset. Download the source,
look at it, work out where the subject sits, and compute the shift —
don't guess. Applied examples:

| Case | Fix |
|---|---|
| For Groups families — person clipped at right edge | `object-position: 70% center` |
| Signature Journey wine — glasses clipped at bottom | `object-position: center 82%` |

### Brightening

"Too dark" is fixable in-place. Use a **gamma lift** (`gamma ≈ 0.72`), which
raises midtones and shadows while protecting highlights — a flat brightness
multiply clips skies. Save under a NEW name; leave the original alone.
Example: `umoya_about_eyethu_heritage_hall.jpg` (mean 112) →
`umoya_compressed_about_tshabalala_family.jpg` (mean 133).

### Identity safety — do not guess who is in a photo

Client link lists frequently contain copy-paste errors. One batch had the
same Drive ID under both "Lucia" and "Eyethu", and that file (`ZAV_6406`)
turned out to be neither — Lucia was actually `ZAV_6354`.

**If it is unclear which real person a photo shows, do not place it.** Leave
the placeholder, upload the processed file so the client can view it, and
ask. Publishing one named person under another's name is a factual claim
about a real individual and is not recoverable by a later fix. The same
applies in reverse: if a photo swap requires a name change (Ntsiki →
Vivian), make both together or neither.

### Resolved identities (do not re-litigate)

| Subject | Correct file | Note |
|---|---|---|
| Lucia Motloung | `umoya_compressed_ZAV_6354.png` | An early link pointed at ZAV_6406 — that is the Eyethu building, not her |
| Eyethu / Tshabalala Family | `umoya_compressed_ZAV_6406.png` | The **only** approved Eyethu image; used site-wide (About hosts + the FC journey Soweto tile) |
| Vivian Kleynhans | `umoya_compressed_about_host_vivian.jpg` | Replaced Ntsiki Biyela; name, copy and photo always change together |

Superseded files remain on the server because nothing is ever deleted.
Do **not** reference these:
`umoya_about_eyethu_heritage_hall.jpg`,
`umoya_compressed_about_tshabalala_family.jpg`,
`umoya_compressed_about_host_lucia.jpg` (actually ZAV_6406 — misnamed).

---

## 3. Technical Stack and Non-Negotiables

| Layer | Current / Intended Technology | Notes |
|---|---|---|
| CMS | WordPress | Core deployment target. |
| Builder | Elementor + Elementor Pro | Primary page-building surface. |
| Custom plugin | `umoya-elementor-widgets` | Main reusable section/widget infrastructure. |
| Theme context | Tevily child theme / live Umoya theme context | Avoid conflicting global styles. |
| CRM | HubSpot | Form submissions and tracking. |
| Network / security | Cloudflare | Referenced in legal docs and performance strategy. |
| Forms | Custom HTML forms plus Elementor default form widget | Custom forms already route to WordPress and HubSpot; footer newsletter form is currently a default Elementor form. |
| Legal/content snippets | Plain text source docs converted to Elementor HTML snippets | Stored under `Website docs`. |
| Git remote | `origin` -> `https://github.com/seyi-stack/umoya_landing_page.git` | Previous widget sync pushed to `codex/elementor-widget-sync`. |

### Technical Rules

- Prefer lightweight HTML/CSS/JS over extra Elementor add-ons.
- Keep custom CSS scoped to section roots.
- Avoid external font imports inside section snippets or widgets.
- Prefer `font-family: inherit` so typography follows the theme/Elementor global settings.
- Keep scripts section-scoped and collision-safe.
- Do not rely on blanket global selectors when a section root can scope behavior.
- Avoid destructive git operations. Preserve unrelated local artifacts.

---

## 4. Brand and Design System

The design system is earthy luxury: cream, deep brown, terracotta, olive, editorial spacing, cinematic imagery, and restrained motion.

### Core Palette

```css
--cream: #F5F0EB;
--brown: #4B2E2B;
--terra: #D97E53;
--terra-dk: #C06840;
--olive: #708238;
--white: #FFFFFF;
--text: #4B2E2B;
```

### Visual Principles

- Cream is the dominant page background.
- Deep brown is used as a premium accent, not as every section background.
- Terracotta is the primary CTA and accent color.
- Layouts should feel spacious and editorial.
- Photography should be real, specific, and inspectable.
- Buttons should remain crisp and premium; avoid cramped labels.
- On branded pages, the brand signal should be immediate and visible in the first viewport.
- Avoid generic SaaS cards, stock-template rhythm, and one-note palettes.

### CTA Lesson Learned

A prior mobile CTA issue was fixed by letting the button background grow to the content:

```css
width: max-content;
max-width: none;
white-space: nowrap;
text-transform: uppercase;
```

The user specifically preferred preserving uppercase text and the original button feel, instead of stacking the label or shrinking it too aggressively.

---

## 5. Project Chronology and Progress

### Phase 1 - Founder's Circle Landing Page

The early project centered on a Founder's Circle landing page built as separate standalone HTML sections for pasting into Elementor HTML widgets.

Original purpose:

- Create a premium, narrative landing page for early Umoya guests.
- Capture high-intent Founder's Circle inquiries.
- Present the inaugural South Africa journey.
- Communicate exclusivity, cultural depth, and small-group luxury.

Main standalone files:

| File | Purpose |
|---|---|
| `section-00-nav.html` | Founder's Circle navigation. |
| `section-01-hero.html` | Full hero section. |
| `section-02-intro.html` | Introductory section. |
| `section-02-form.html` | Main inquiry form with HubSpot/WordPress integration. |
| `section-03-be-first.html` | Early access / exclusivity section. |
| `section-04-benefits.html` | Member benefits section. |
| `section-05-journey.html` | Journey section. |
| `section-05-journey-interactive-map-image.html` | Journey map/image variant. |
| `section-05-journey-map-snapshot.html` | Journey map snapshot variant. |
| `section-05-journey-no-map.html` | Journey variant without map. |
| `section-05-map.html` | Route map section. |
| `section-05a-pricing.html` | Pricing section. |
| `section-05b-cta.html` | CTA section. |
| `section-06-why.html` | Why Umoya section. |
| `section-06b-pillars.html` | Pillars section. |
| `section-07-details.html` | Travel essentials / accordion section. |

### Phase 2 - Section 02 HubSpot Brief and Integration

The file `HubSpot Section 02 Integration Brief.docx` was created to explain the preferred approach:

- Keep the custom-designed form experience.
- Submit to HubSpot behind the scenes.
- Avoid replacing the form with a generic HubSpot embed.
- Use Portal ID, Form GUID, field mappings, consent text, and tracking context.

The integration now exists in `section-02-form.html` and in the generated plugin assets.

Current known HubSpot configuration in source files:

```text
Portal ID: 246097317
Form GUID: cb87d460-fb2d-4c53-8c32-7daaa05067d7
HubSpot endpoint: https://api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formId}
WordPress backup endpoint: /wp-json/umoya/v1/submissions
```

### Phase 3 - Homepage Build

The homepage section family was added under `homepage/`.

Current homepage source files:

| File | Root / role |
|---|---|
| `homepage/homepage-form-popup.html` | Reusable popup inquiry form. |
| `homepage/homepage-section-00-nav.html` | Homepage navigation. |
| `homepage/homepage-section-01-hero.html` | Homepage hero, `#umoya-hero`. |
| `homepage/homepage-section-02-about.html` | About / story section, `#umoya-about`. |
| `homepage/homepage-section-03-homecoming.html` | Signature journey carousel, `#umoya-journey`. |
| `homepage/homepage-section-04-founder-cta.html` | Founder's Circle CTA. |
| `homepage/homepage-section-05a-pricing.html` | Pricing section. |
| `homepage/homepage-section-06-accommodations.html` | Accommodations section. |
| `homepage/homepage-section-06b-pillars.html` | Why Umoya pillars. |
| `homepage/homepage-section-07-details.html` | Travel essentials / details. |

The homepage uses `data-umoya-form-popup` triggers to open `homepage-form-popup.html`. Those triggers appear in CTA sections, pricing, accommodations, details, and the homepage nav.

### Phase 4 - Homecoming Carousel Comment Restoration

The file `homepage/homepage-section-03-homecoming.html` had a specific cleanup pass where useful comments were restored. This matters because the user values comments that explain how complex sections work.

Useful comment anchors that should remain:

- `Section shell and shared design tokens`
- `Main carousel frame`
- `Left copy panel`
- `Render with textContent so slide copy stays safe and predictable.`
- `Fade the carousel in once it enters the viewport.`

Important technical note: this file previously had a hidden UTF-8 BOM issue. If an `apply_patch` appears to fail on the first line even though the visible text matches, check for and remove a hidden BOM before retrying.

### Phase 5 - Widget Generator and Plugin Sync

The project shifted from manually pasting standalone snippets into Elementor toward a generated custom Elementor widget plugin.

The generator is:

```text
tools/build-elementor-widgets.mjs
```

It takes the latest root HTML sources and generates:

- Clean per-section HTML templates.
- Per-section CSS files.
- Per-section JS files.
- Widget classes.
- PHP wrapper templates.
- The registry manifest at `umoya-elementor-widgets/includes/section-definitions.json`.

This generator was built because the user wanted the Elementor widgets to:

- Match the latest HTML sections exactly.
- Preserve the visual layout exactly as normal HTML.
- Expose text, media, links, styles, sizes, and common Elementor edit affordances.
- Group homepage and Founder's Circle sections separately.

### Phase 6 - GitHub Sync

The widget sync was committed and pushed to GitHub.

Known previous sync:

```text
Branch: codex/elementor-widget-sync
Commit: 042040d sync elementor widgets with html sections
Remote PR URL suggested by GitHub:
https://github.com/seyi-stack/umoya_landing_page/pull/new/codex/elementor-widget-sync
```

The environment did not have `gh`, so PR creation was left to the GitHub URL.

### Phase 7 - Legal and Footer Documentation

A `Website docs` folder was added with policy/legal/support content:

| Source file | Purpose |
|---|---|
| `Website docs/FOOTER URL MAP.pdf` | Footer link routing map. |
| `Website docs/Umoya_Cookie_Policy.txt` | Cookie policy. |
| `Website docs/Umoya_POPIA_Consent_Wording.txt` | POPIA notices, checkbox copy, newsletter, cookie banner, email footer copy. |
| `Website docs/Umoya_Privacy_Policy.txt` | Privacy policy. |
| `Website docs/Umoya_Terms_and_Conditions.txt` | Booking terms. |
| `Website docs/Umoya_Travel_Insurance_Guidance.txt` | Travel insurance guidance. |

Those were converted into paste-ready Elementor snippets under:

```text
Website docs/Elementor HTML snippets/
```

Generated snippet files:

| Output file | Notes |
|---|---|
| `FOOTER_URL_MAP.elementor.html` | HTML table decoded from the PDF routing map. |
| `Umoya_Cookie_Policy.elementor.html` | Adds policy headings, paragraphs, mailto links, and privacy link. |
| `Umoya_POPIA_Consent_Wording.elementor.html` | Includes checkboxes and form/cookie/email copy. |
| `Umoya_Privacy_Policy.elementor.html` | Adds headings, lists, email links, cookie policy link. |
| `Umoya_Terms_and_Conditions.elementor.html` | Adds headings, lists, privacy link, email links. |
| `Umoya_Travel_Insurance_Guidance.elementor.html` | Adds headings, lists, booking terms links, email link. |

Snippet generation verification that was performed:

- 6 files created.
- Headings, lists, tables, and links inserted.
- No nested links.
- No `href="#"`.
- No `undefined` values.

### Phase 8 - Footer Newsletter Form

The user added a default Elementor Form widget in the footer for newsletter signup. It currently appears to use Elementor's `Actions After Submit` controls with:

- `Collect Submissions`
- `Email`
- `MailChimp`

No native HubSpot action was visible in the screenshot.

Recommended routes discussed:

1. Fast no-code route:
   - Install/connect the official HubSpot WordPress plugin.
   - Enable HubSpot non-HubSpot form capture.
   - Give the Elementor form clear field IDs such as `firstname` or `name`, and `email`.
   - Keep Elementor `Collect Submissions` as a WordPress backup.

2. More reliable custom route:
   - Create a dedicated HubSpot form for the footer newsletter.
   - Get its Portal ID and Form GUID.
   - Add a WordPress hook or webhook bridge that forwards Elementor Form widget submissions to HubSpot.
   - Include POPIA/marketing consent text and source context.

The second route is cleaner for a production newsletter signup because it gives explicit field mapping and consent handling instead of relying on auto-captured non-HubSpot form behavior.

### Phase 9 - Revamp Folders and Stash Recovery

Two "revamp" folders were introduced as working copies driven by client
feedback documents, leaving the original folders untouched:

| Folder | Source feedback |
|---|---|
| `founders-circle-revamp/` | `Founder's_Circle_Page_Feedback_v4.docx`, `Founder's-Circle-Page-Feedback-v5.md` |
| `homepage-revamp/` | `Homepage feedback July 19th.docx` / `.pdf` |

The flat root `section-*.html` files were also moved into a
`founders-circle/` folder.

**Recovery note (important context for odd git history):** at the start of
this session these folders existed only inside a `git stash` created on
`codex/elementor-widget-sync`. A `git stash apply` was first attempted on
`main`, which conflicted because `main` predates the widget plugin. The
correct fix was to switch back to `codex/elementor-widget-sync` and apply
there. The revamp folders and several loose assets were recovered from
the stash's untracked-files commit (`stash@{3}^3`). Everything is now
committed, so the stashes are redundant.

### Phase 10 - Signature Journey Page

Built from `3__umoya_signature_journey_mockup_FINAL.html` into
`signature-journey/` (8 sections). Mockup used for layout/content only;
its fonts and colours were NOT carried over.

Later refinements, all applied:

- Nav sits at the top of the page rather than hiding until the hero passes.
- Hero is **image only** — the video element and its autoplay script were removed.
- "Chapter One/Two/Three" render in Title Case, not uppercase.
- Hotel carousels advance **together on one shared 5s clock** with an eased
  crossfade; dot spacing tightened.
- All `text-shadow` removed site-page-wide on this page.
- Mobile type scale and vertical rhythm reduced at 768 / 420.
- Hero height reduced from full-viewport to ~66dvh.
- Client image swaps applied throughout, plus new "Where You Rest /
  Your Home Along the Way" copy with per-hotel descriptions.

See `signature-journey/_NOTES.md` for the section table and the remaining
`★ SWAP` list (several moment photos are still placeholders because the
source files were RAW/TIFF and were never converted).

### Phase 11 - Three New Pages From Client Mockups

Built from the mockups in
`Umoya website mockups-20260729T043502Z-1-001/`:

| Folder | Page | Sections |
|---|---|---|
| `private-tailormade/` | Private & Tailormade | 5 |
| `about/` | About Us | 8 |
| `for-groups/` | For Groups | 8 |

13 images embedded as base64 in the mockups were extracted and uploaded to
the Mountain Duck synced uploads folder (`umoya_pt_*`, `umoya_about_*`,
`umoya_groups_*`). Nothing was overwritten — the folder went 246 → 259
files.

Both new forms (Private & Tailormade, For Groups) reuse the existing
`MERGE*` aliases so **no backend change was required**. This is
deliberate but semantically stretched — see Open Items.

Full detail in `_NEW-PAGES-NOTES.md`.

### Phase 12 - Shared Site-Wide Navigation

`shared/section-00-nav.html` is the single nav intended for every page.
Links: The Signature Journey · Private & Tailormade · For Groups · About,
plus the Join the Founder's Circle CTA. Uses absolute URLs so one widget
works everywhere, and marks the active page by matching `location.pathname`
against each item's `data-path`.

**Three scroll states** (this replaced an always-fixed bar that overlapped
the hero):

1. **Docked** — at the top it sits in normal flow; the hero stacks *below* it.
2. **Stuck** — once scrolled past it detaches (`position: fixed`) and hides on downward scroll.
3. **Recalled** — any upward scroll slides it back in.

The mount reserves the bar height permanently so detaching causes no
layout jump. `--nav-h` on the mount is the single source of truth
(64px desktop / 58px ≤1024px, raised from 900px in Phase 18) and the JS
reads it back.

> The older `signature-journey/section-00-nav.html` and
> `homepage-revamp/homepage-section-00-nav.html` are still the
> always-fixed versions with `height: 0` mounts and therefore still
> overlap their heroes. They were intentionally left alone; retire them
> in favour of the shared nav when convenient.

### Phase 13 - The Two Header Systems (live-site finding)

Investigating the live site revealed the header depends entirely on the
page's Elementor template:

| Template | Theme header? | What renders |
|---|---|---|
| Elementor **Canvas** (homepage, Founder's Circle) | Bypassed entirely | Only the nav pasted into page content |
| Elementor **Full Width** (Signature Journey) | Yes — `header.php` → `header-builder.php` | Tevily theme header wrapping the nav widget |

On Full Width pages the Tevily header renders two sibling blocks:
`.header_default_screen` (holds the nav widget, hidden **≤1024px**) and
`.header-mobile` (the theme's own menu, shown **≤1024px**, fed by the WP
`primary` menu location). Below 1024px — all tablets and small laptops,
not just phones — visitors were served a stale menu listing pages that no
longer reflect the site (Tours & Packages, Sacred Origins, old tour posts).

**Fix shipped:** `shared/section-00-nav.html` now hides the theme's mobile
block and keeps its own visible at every width. Those are the only
selectors in that file reaching outside its own root — unavoidable, since
the targets are the widget's *ancestor* and *sibling*. They are gated
behind a `.umoya-nav-takeover` marker class that the JS adds only to a
theme header that actually contains the nav, so Canvas pages are untouched.

**Optional deeper fix (not deployed):**
`theme-overrides/tevily_child/header.php` removes the theme header
entirely while keeping the footer. Upload to
`wp-content/themes/tevily_child/header.php`; delete to revert. It
reproduces the parent's document opening and **keeps `.wrapper-page` and
`#page-content` open**, because `footer.php` closes them — deleting those
would break every page. If used, the nav must be moved into page content.

### Phase 14 - Live Site Stability Investigation (UNRESOLVED)

The live site was throwing intermittent Cloudflare **520 / 525** errors.
Findings:

- Failures are **intermittent**, not constant. Six consecutive requests
  returned 520 (14s), 200 (4.5s), 525 (10.5s), 200, 200, timeout (40s).
- Even successful responses take **3.6–4.5s TTFB** — unhealthy.
- Static assets are fine (`cf-cache-status: HIT`, never touch origin);
  only origin-bound `BYPASS` requests fail.
- The intermittent 525 rules out a broken certificate — a real cert fault
  would fail every time. The TLS handshake is timing out under load.

### UPDATE 2026-08-13 — materially worse, and now proven server-level

Re-measured; the picture has changed and the earlier "static assets are fine"
finding no longer holds:

| Request | Result |
|---|---|
| `/founders-circle/` ×6 | 4× **522**, 2× 200 — every one ~20–21s TTFB |
| `/about-us/`, `/for-groups/` | **522** at ~20.5s |
| `/` (homepage) | 200 in **1.06s** — Cloudflare cache hit, never touches origin |
| A static `.jpg` in uploads ×4 | **522** 4/4 at ~20.4s |

**A static JPEG cannot invoke PHP.** It does not load WordPress, the theme, or
any plugin. Its failing 4/4 proves the fault is the origin web server not
completing connections — not WordPress, not a plugin, and not any code in this
repo. The ~20s is Cloudflare's origin-connect timeout, and its consistency
(20.32–21.75s across every failure) is a timeout being hit, not variable load.

The homepage answering in 1.06s is Cloudflare serving cache; it is masking how
unreachable the origin actually is.

TTFB on the requests that *do* succeed is now ~20s against the 3.6–4.5s
recorded above — roughly 5× worse. Treat this as an escalation, not the same
steady state.

**This is a hosting/server-level fault. It needs the host, not a code change.**
Ask them specifically: is the web server (LiteSpeed/Apache) accepting and
completing connections; are PHP workers/memory exhausted; is the disk full or
is I/O saturated; are there OOM kills in the system log.

The most likely underlying contributor is unchanged: `wp-content/plugins`
contains **50 plugin directories**, including genuinely duplicated functions —
**two page caches** (`litespeed-cache` + `speedycache`), two page builders
(Elementor + Pagelayer), two SEO suites (AIOSEO + SiteSEO), two image
optimizers, three booking/events plugins, and two Stripe integrations,
plus WooCommerce, RevSlider and Redux. This runs directly against the
project's own "minimal plugins, zero bloat" rule.

**The custom plugin was ruled out** — its only outbound HTTP call
(`wp_remote_post` in `class-submissions.php`) is inside `send_to_hubspot()`,
which fires on form submission only, never on page render.

Not confirmed from logs: `/error_log` (474KB) returned *permission denied*
over the Mountain Duck mount. It was last written 2026-07-25, which argues
against an active PHP fatal and for resource starvation. **Pull that log
via cPanel/SSH to confirm.** See Open Items.

### Phase 15 - Full outage, 2026-08-22 (RESOLVED)

The site returned WordPress's **"There has been a critical error on this
website"** on the homepage and on all of `/wp-admin/`.

**Cause: a broken install of The Events Calendar 6.17.3.** The plugin's own
bootstrap (`src/Tribe/Main.php:636`) registers
`Tribe\Events\Taxonomy\Taxonomy_Provider`, but
`the-events-calendar/src/Events/Taxonomy/` **did not exist in the installed
files**. That threw an uncaught `Not_Bound_Exception` on `plugins_loaded` —
i.e. on *every* request, before anything could render.

Nothing in this repo caused it and nothing had been deployed. The plugin
directory's own mtime (Aug 6) was later than its `src/` tree (Jul 23), which
points at an **auto-update that extracted incompletely** — consistent with an
origin that was already timing out and dropping connections under load.

**Fix applied:** the plugin folder was renamed to
`the-events-calendar.DISABLED-2026-08-22-broken-install`. WordPress's
`wp_get_active_network_plugins()` `file_exists()`-checks every entry, so a
renamed folder is simply skipped — no DB change, and reversible. Verified
afterwards that `/`, `/about-us/`, `/founders-circle/`,
`/signature-journey-unpublished/`, `/private-and-tailormade/`, `/for-groups/`,
`/contact/` and `/blog/` all return **200 with `x-litespeed-cache: miss`** —
freshly generated by PHP, not cache.

#### The trap: LiteSpeed made a dead site look half-alive

At the start, some pages returned 200 and some 500, which looked like a
content-specific bug. It was not. **Every single 200 carried
`x-litespeed-cache: hit`** — stale HTML from before the breakage. Nothing that
actually executed PHP worked. `wp-login.php` and `wp-json` were cached too.

> **Always check `x-litespeed-cache` before concluding a page "works".**
> A cached 200 says nothing about whether the origin can serve it.
>
> ```bash
> curl -s -D - -o /dev/null "https://umoyaafrikatours.co.za/" | grep -iE "^HTTP|x-litespeed"
> ```
>
> Add a random query string (`?nocache=$RANDOM`) to force a real render.

#### How to get the actual error next time

`/error_log` is unreadable over the Mountain Duck mount and was stale anyway
(last written Jul 25). `wp-config.php` and `mu-plugins/*.php` are also
permission-denied. **But the mount allows writes.** The way in:

1. Write a temporary PHP file to the web root that sets
   `ini_set('display_errors','1')`, registers a
   `register_shutdown_function` reading `error_get_last()`, then
   `require`s `wp-load.php`.
2. Fetch it over HTTPS. Mountain Duck takes **~30–90 seconds** to sync, so
   poll for it rather than assuming the first 404 is real.
3. **Delete it as soon as you have the answer** — an
   errors-visible bootstrap script on a production web root is a disclosure
   risk.

To test "would disabling plugin X fix this?" without committing to it, drop a
mu-plugin that filters the plugin out *only* when a constant the diagnostic
script defines is present — a strict no-op for normal traffic. On this
install it must filter **both** `option_active_plugins` **and**
`site_option_active_sitewide_plugins`; this is a multisite and most plugins
(including TEC) are network-activated, so filtering only the first does
nothing.

#### Also noticed, not fixed

- `wp-config.php:113` defines `WP_DEBUG` twice — every request emits
  `Warning: Constant WP_DEBUG already defined`. Harmless but noisy, and it
  pollutes any output-sensitive response.
- `wp-content/mu-plugins/elementor-safe-mode.php` (Jul 25) is Elementor Safe
  Mode left installed. It was not the cause. Worth removing once the editor
  is confirmed healthy.
- The plugin count is now **52 directories**. Unchanged advice: this is the
  underlying risk. A half-extracted auto-update is exactly the failure mode a
  bloated, duplicated plugin set invites.

### Phase 16 - Contact page + footer rebuild, 2026-08-29

Built from the client's two new mockups in `Mockups (footer, contact)/`,
with routing from `Umoya_Footer_Routing_and_Implementation.docx`.

**New `contact/` page** (3 sections, targets `/contact/`): centred hero,
two side-by-side enquiry panels, and a direct-contact band carrying the
office address. Detail in `contact/_NOTES.md`.

> ~~WARNING: `/contact/` AND `/contact-us/` both already exist live, and
> both are still the Tevily demo template.~~
> **RESOLVED 2026-08-22.** `/contact/` now serves the real page and
> `/contact-us/` 404s, so no redirect decision is needed. See Phase 18.

**Two new HubSpot forms** so contact leads report separately, plus one new
contact property `enquiry_type`. Both verified end-to-end. See Section 21.

**`shared/section-99-footer.html` rebuilt** to the footer mockup: brand
block, Journeys / Support / Legal columns, a "Join the Founder's Circle"
signup, and a bottom bar with the registration number, tagline and social
icons. Two behavioural changes worth knowing:

- **Cookie Settings is now a CookieYes trigger.** The routing doc confirms
  the site is standardising on CookieYes, which re-opens its preference
  centre for any element carrying `.cky-banner-element`. The previous
  guess-the-global JS is gone; a small guard only fires if CookieYes is
  absent at click time.
- **The newsletter consent model changed.** The old footer used a required,
  never-pre-ticked checkbox. The mockup and doc instead specify
  statement-style consent ("By subscribing you consent to...") with no
  checkbox, and require that wording verbatim. That is what shipped; the
  exact wording is still stored with every submission for the POPIA
  consent register. **Flag this to whoever owns POPIA compliance** - it is
  a deliberate client instruction, not an oversight.

**Slugs checked live** (2026-08-29), which closes a long-standing open item:
`/terms-and-conditions/` is the real page - the old FOOTER URL MAP's
`/booking-terms` 404s. `/travel-essentials/`, `/email-preferences/`,
`/travel-brochure.pdf` and `/paia-manual.pdf` do **not** exist yet.
*(Superseded 2026-09-01: both footer PDFs were renamed to the `umoya_`
prefix, and the PAIA manual was uploaded. See Phase 19.)*

**Also fixed:** the footer's full-bleed `width: 100vw` included the vertical
scrollbar, making it a scrollbar-width too wide and giving every page a
small horizontal scroll. It now uses a `--umoya-ft-vw` custom property set
from `documentElement.clientWidth`, with `100vw` as the no-JS fallback.

**`shared/page-email-preferences.html`** was added so the footer's Email
Opt-out link has somewhere to land - the copy is the routing doc's,
verbatim, with the HubSpot preference-centre button commented out until
that URL exists.


### Phase 17 - Signature Journey stat band + client copy corrections, 2026-08-22

**The stat band moved WITHIN section 02, not out of it.** Worth reading
before touching it, because the first attempt got this wrong.

The 10 Days / 3 Chapters / 2 Extensions row used to OPEN
`signature-journey/section-02-intro.html`, sitting directly under the hero
where it stated the shape of a journey the reader had not been introduced to
yet. The client asked for it "below the overview". That means section 02 now
holds two bands in this order: **intro copy first, stat bar second.** A
fourth stat, **7 Signature Moments**, was added at the same time.

> The first pass moved the band out of section 02 entirely and into the end
> of section 03. That was reverted in `6d8a369`; section 03 is byte-identical
> to its pre-change state. If a future request says "move the stats", check
> whether it means *within* section 02 before relocating anything.

Placement detail that is load-bearing: the bar is safe as section 02's last
band because **section 03 below is white** and the intro above is cream, so
the brown reads as a deliberate rule. At the end of section 03 it butted
straight against section 04 Extensions, which is *also* brand brown, and
needed a hairline to stop the two merging - the same problem previously
fixed between the homepage CTA and the footer.

On phones the four stats sit **2x2**, not in one row, and each label swaps to
a short form via `data-short` ("Immersive Chapters" -> "Chapters"). Four
columns crushed the labels at 360px.

**Client copy corrections applied the same day** (`178a049`), from the
"Overview of Edits for Mock ups" feedback doc:

| File | Change |
|---|---|
| `about/section-06-hosts.html` | Lucia Motloung - brand named as "Luc Mo Wine"; the dinner-hosting claim dropped |
| `about/section-06-hosts.html` | Antoinette Sithole - spells out what the 1976 photograph was rather than assuming recognition |
| `about/section-06-hosts.html` | Tshabalala Family - identifies Eyethu Heritage Hall by name, and as one of the first Black-owned cinemas in Soweto |
| `signature-journey/section-05-stays.html` | Cape Grace - "colour" -> "color"; site copy is US English |

> The US-English rule applies to **site copy**. It does NOT apply to the
> legal documents in `Revised footer docs/`, which are the client's own
> drafting and are reproduced verbatim, British spellings included
> ("travellers", "recognised", "authorised").

### Phase 18 - Contact added to the shared nav, 2026-08-22

`shared/section-00-nav.html` gained a fifth link, **Contact ->
`/contact/`**, in both the inline row and the mobile dropdown. Its
`data-path` is `/contact`, which deliberately does NOT match the retired
`/contact-us` - the active-state test is
`here === p || here.indexOf(p + '/') === 0`.

**The hamburger breakpoint moved 900px -> 1024px to make room.** Logo + five
nav items + the CTA need roughly 970px on one line, and the items are
`white-space: nowrap` inside a flex row with `flex-shrink: 0` on the logo and
CTA, so between 900 and 970px they would have pushed into the CTA rather than
shrinking. Dropping the type further was the alternative and was rejected:
tablet links are already `0.68rem` (~10.9px), under the project's own 12px
floor. 1024px is also where the Tevily header swaps
`.header_default_screen` for `.header-mobile`, so our bar and the theme's now
change state together instead of 124px apart.

Reverting is a one-line change if the inline nav is wanted down to 900px
again - but shorten a link label first.

**Two long-standing open items closed while verifying the destinations:**

- `/signature-journey/` now resolves. The page has moved off
  `/signature-journey-unpublished/`, so the slug the nav already assumed is
  correct.
- `/contact-us/` now 404s, and `/contact/` serves the real page
  (`umoya-contact-hero` / `-forms` / `-direct`), not the Tevily demo copy.

All six nav destinations return uncached 200s.

### Phase 19 - Footer content pages from the revised legal docs, 2026-09-01

`Revised footer docs/` holds the client's final copy. It became three
brand-styled Elementor HTML widgets in `shared/`:

| File | Publish at | Status |
|---|---|---|
| `page-travel-essentials.html` | `/travel-essentials/` | **New page.** The footer had been linking here against a 404 since August. Consolidates the former Visa & Entry Information and Travel Insurance Guide pages - redirect those here if they still exist. |
| `page-privacy-policy.html` | `/privacy/` | **v1.1**, replaces the live v1.0 |
| `page-cookie-policy.html` | `/cookie-policy/` | **v1.2**, replaces the live v1.0 |

**The main reason the policy pages matter:** the live `/privacy/` and
`/cookie-policy/` still render the literal string
`Effective date: [INSERT DATE]`. That placeholder has been public since July.
The revised docs supply real dates - both effective 1 June 2026, cookie
policy last updated 26 August 2026 - so pasting these in finally closes it.

Copy is **verbatim**, asserted by a sentence-level diff against each source
file (zero unmatched sentences across all three). Two deliberate departures,
both flagged in the files themselves:

1. Travel Essentials drops the internal document-header clauses
   ("Website page copy | Combines the former ... pages"), keeping only
   **"Verified August 2026"** as a currency stamp. Those clauses are
   production notes, not guest-facing copy.
2. The insurance minimum-cover sentence is rendered as a **list**. Every word
   is the source's; only the semicolons between items become markup. The
   lead-in already announces a list, and guests use it as a checklist
   against a quote.

The Cookie Policy also carries an **in-page CookieYes trigger** at the point
where the copy says you can change your preferences, reusing the footer's
`.cky-banner-element` hook and its at-click-time not-loaded guard. It is the
only page of the three with JS.

It also uses a monospace stack on cookie identifiers (`__cf_bm`, `_ga_*`) -
**the only `font-family` on these pages that is not `inherit`.** It is a
system stack, so nothing is imported, and cookie names are identifiers that
read badly in a serif. Flagged here so it is not mistaken for a slip.

#### The PAIA manual was already live - at the OTHER spelling

`/paia_manual.pdf` (**underscore**) returns 200 and is byte-identical to
`Revised footer docs/Umoya_PAIA_Manual (final).pdf`. The footer had been
pointing at `/paia-manual.pdf` (hyphen), which 404s.

**Renamed again on client request, same day:** both footer PDFs now use an
`umoya_` prefix — `/umoya_paia_manual.pdf` (uploaded and verified) and
`/umoya_travel_brochure.pdf` (still to be supplied). Older PAIA spellings
were left resolving rather than deleted.

> **Mount trap worth knowing.** Copying the file to
> `umoya_paia_manual.pdf` appeared to succeed but never reached the server —
> 404 after 25 polls — because a ghost entry already sat at that name in the
> Mountain Duck cache, so it saw nothing to upload. A *fresh* filename synced
> in two polls. The fix that worked: write under a throwaway name, confirm it
> serves, then `mv` it onto the target. Diagnose this by writing a
> differently-named file first — if that syncs and yours does not, the name
> is poisoned, not the mount.

A hyphenated entry *does* appear in the Mountain Duck listing at the same
byte size, but the server neither serves it (404, not 403) nor allows it to
be read over the mount. Treat it as a ghost listing. It was **left in place**,
not deleted, and the footer now points at the underscore URL.

> Generalisable: the mount's file listing is not proof a file is served.
> Confirm with an HTTP request before wiring a URL into markup.

### Phase 20 - Post-launch fixes and analytics findings, 2026-09-01

Follow-up pass on the contact page and footer after the client began
testing them. Two code fixes, three findings. Nothing here changed page
layout or copy.

#### Fixed: the footer's Instagram icon was not the Instagram mark

The glyph inherited from the footer mockup drew the camera lens as a
subpath wound the SAME direction as the outer squircle, so under SVG's
default **nonzero** fill rule it never punched through. It rendered as a
solid rounded square with a filled dot in the middle — no lens ring, no
corner dot. The lens radius was also 7.8 against the real mark's ~6.2, so
even the proportions were wrong.

Replaced with the official mark (Simple Icons), whose counters are wound
to cut out correctly. It is still a single filled path on `currentColor`,
so no CSS changed and it matches the weight of Facebook / TikTok /
LinkedIn beside it. Verified side by side at 17px (the real footer size)
and 64px.

The commented-out YouTube path came from the same mockup and was checked
at the same time — it is fine, its play triangle knocks out correctly.

> Lesson worth keeping: a hand-rolled brand glyph can look plausible in
> the file and render as a blob. Check icons at their ACTUAL size against
> their real neighbours, not just in isolation.

#### Fixed: resends and retries forwarded to HubSpot with no IP address

HubSpot flags a submission with no `context.ipAddress`
("This custom form submission didn't include an IP address. This could
affect your form analytics."). It is an analytics warning, not data loss.

`get_submission_from_meta()` rebuilt the submission without ever reading
`_umoya_ip_address`, so `send_to_hubspot()` was reading an undefined key.
Every **row-action resend, bulk resend and cron retry** therefore
forwarded with no IP — and emitted an `Undefined array key` warning each
time, up to 20 attempts per submission.

`ip_address` is now read back from meta alongside `page_uri` / `page_name`
/ `hutk`. Because the re-normalisation loop under it only overwrites
HubSpot *field* keys, a resend now carries the ORIGINAL submitter's IP
rather than nothing — and never the cron's. A new `valid_ip()` helper
gates it, since HubSpot would rather have the key absent than malformed.

Deliberately NOT accepted from `$payload['context']`: that arrives from
the browser, and trusting it would let a client write any IP it liked into
form analytics.

Full detail, including how to tell this cause apart from the browser
fallback, is in Section 21.

#### Finding: form "Page views" and "Submissions / page view" are always 0

Expected, not a misconfiguration. HubSpot only counts a page view for a
form it renders itself. Every Umoya form is hand-built HTML that merely
submits to the Forms API. Section 21 has the reasoning and the way to get
a conversion rate anyway.

#### Finding: /founders-circle/ is served without most plugin assets

Chased down after the tracking script appeared to be missing there. It is
missing — and so are Elementor's frontend JS, pro-elements, CF7, jQuery
UI, Stripe, tevily-themer and the HubSpot WordPress plugin. 18 script tags
against 47–48 on comparable pages, reproducible on forced cache misses.
**Unresolved, needs wp-admin.** Section 21.

#### Finding: CookieYes is not installed on the live site

The footer routing doc states it already is. It is not — `cdn-cookieyes.com`
appears on no live page; the site still runs `cookieadmin` + `cookieadmin-pro`.
The footer's Cookie Settings button degrades safely until it is. Section 21.

---

## 6. Repository Map

### Root-Level Working Files

| Path | Role |
|---|---|
| `CLAUDE.md` | This handoff and project source of truth. |
| `_NEW-PAGES-NOTES.md` | Detail for the three new pages + shared nav. |
| `shared/section-00-nav.html` | **Site-wide navigation.** Place FIRST on every page. |
| `shared/section-99-footer.html` | **Site-wide footer.** Rebuilt 2026-08-29 to the client mockup: brand block + Journeys/Support/Legal columns + Founder's Circle signup (HubSpot-wired) + legal bar. Place LAST on every page; replaces the Elementor Form newsletter widget. |
| `shared/page-email-preferences.html` | Small standalone page for `/email-preferences/`, the footer's Email Opt-out destination. |
| `shared/page-travel-essentials.html` | **New page** for `/travel-essentials/`. Consolidates the former Visa & Entry Information and Travel Insurance Guide pages. |
| `shared/page-privacy-policy.html` | Privacy Policy **v1.1** for `/privacy/`. Replaces the live v1.0, which still shows `[INSERT DATE]`. |
| `shared/page-cookie-policy.html` | Cookie Policy **v1.2** for `/cookie-policy/`. Replaces the live v1.0. Adds the named cookie inventory and an in-page CookieYes trigger. |
| `Revised footer docs/` | Client's final legal/essentials copy — the source for the three pages above, plus the final PAIA manual PDF. |
| `contact/` | Contact page — 3 sections + `_NOTES.md`. Targets `/contact/`. |
| `shared/color-scheme-lock.html` | Stops mobile browsers auto-darkening the palette. Only needed on pages that use neither the shared nav nor the shared footer — see Dark Mode below. |
| `founders-circle/` | Original Founder's Circle sections (was flat `section-*.html` at root). |
| `founders-circle-revamp/` | **Current** Founder's Circle working copy (v4/v5 feedback). |
| `homepage/` | Original homepage sections and popup form. |
| `homepage-revamp/` | **Current** homepage working copy (July 19 feedback). |
| `signature-journey/` | Signature Journey page — 8 sections + `_NOTES.md`. |
| `private-tailormade/` | Private & Tailormade page — 5 sections. |
| `about/` | About Us page — 8 sections. |
| `for-groups/` | For Groups page — 8 sections. |
| `theme-overrides/tevily_child/header.php` | Optional child-theme override removing the Tevily header. Not deployed. |
| `tools/build-elementor-widgets.mjs` | Generator that rebuilds plugin artifacts from source HTML. |
| `umoya-elementor-widgets/` | Custom Elementor plugin source. |
| `Website docs/` | Legal documents, footer URL map, and Elementor-ready legal snippets. |
| `hubspot-docx/` | Extracted Word document content for the HubSpot integration brief. |
| `HubSpot Section 02 Integration Brief.docx` | Original HubSpot handoff brief. |
| `*__umoya_*_mockup*.html` | Client mockups (layout/content reference only — never copy their fonts or colours). |
| `Umoya_Performance_Uptime_Audit_Report.docx` | Prior audit/report artifact. |
| `Old files/` | Superseded legacy files; do not treat as current source. |
| `_visual-check-*.png`, `.edge-visual-profile-*`, `.agents/` | QA artifacts, browser profile dumps, and third-party tool configs. **Deliberately untracked — do not commit.** The profile folders may contain cached cookies/session data. |

**Which folder is current?** For Founder's Circle and the homepage, the
`-revamp/` folders are the live working copies; the originals are kept
only for reference. The generator (`tools/build-elementor-widgets.mjs`)
still points at the ORIGINAL paths — see the Elementor Plugin open items.

### Current Custom Plugin Layout

```text
umoya-elementor-widgets/
  umoya-elementor-widgets.php
  includes/
    class-plugin.php
    class-base-widget.php
    class-section-registry.php
    class-submissions.php
    class-console-cleanup.php
    section-definitions.json
  widgets/
    class-*.php
  templates/
    section-*.php
    homepage-section-*.php
    html/
      *.html
  assets/
    css/
      fc-shared.css
      sections/*.css
    js/
      sections/*.js
```

### Plugin Bootstrap

`umoya-elementor-widgets/umoya-elementor-widgets.php`:

- Plugin name: `Umoya Elementor Widgets`
- Version: `1.1.0`
- Requires WordPress 5.8+, PHP 7.4+, Elementor.
- Initializes:
  - `Submissions`
  - `Console_Cleanup`
  - `Plugin` if Elementor is loaded.

`includes/class-plugin.php`:

- Registers Elementor categories.
- Registers widgets from the section registry.
- Registers per-section styles/scripts.
- Enqueues editor styles.

`includes/class-section-registry.php`:

- Loads `section-definitions.json`.
- Provides widgets, styles, scripts, and section config.

`includes/class-base-widget.php`:

- Uses registry config to render editable sections.
- Replaces generated placeholders with Elementor controls.
- Exposes grouped controls for:
  - Text fields.
  - Links and media.
  - Labels and attributes.
  - Form integrations.
  - Layout/style controls.
  - Design tokens.
  - Custom replacements.
  - Custom CSS.
  - Full HTML override.

---

## 7. Elementor Widget Registry

The plugin currently exposes 26 generated section widgets.

### Founder's Circle Category

Category: `Umoya - Founder's Circle`

| Key | Widget title | Source | Root |
|---|---|---|---|
| `fc_nav` | FC Navigation | `section-00-nav.html` | `#fcNavBar` |
| `fc_hero` | FC Hero | `section-01-hero.html` | `#fc-hero` |
| `fc_intro` | FC Intro | `section-02-intro.html` | `#fc-intro` |
| `fc_form` | FC Inquiry Form | `section-02-form.html` | `#fc-form-section` |
| `fc_be_first` | FC Be First | `section-03-be-first.html` | `#fc-be-first` |
| `fc_benefits` | FC Benefits | `section-04-benefits.html` | `#fc-benefits` |
| `fc_journey` | FC Journey | `section-05-journey.html` | `#fc-journey` |
| `fc_journey_interactive_map_image` | FC Journey Interactive Map Image | `section-05-journey-interactive-map-image.html` | `#fc-journey` |
| `fc_journey_map_snapshot` | FC Journey Map Snapshot | `section-05-journey-map-snapshot.html` | `#fc-journey` |
| `fc_journey_no_map` | FC Journey No Map | `section-05-journey-no-map.html` | `#fc-journey` |
| `fc_map` | FC Route Map | `section-05-map.html` | `#fc-route-map-section` |
| `fc_pricing` | FC Pricing | `section-05a-pricing.html` | `#fc-pricing` |
| `fc_cta` | FC CTA | `section-05b-cta.html` | `#fc-cta` |
| `fc_why` | FC Why Umoya | `section-06-why.html` | `#fc-why` |
| `fc_pillars` | FC Pillars | `section-06b-pillars.html` | `#fc-pillars` |
| `fc_details` | FC Travel Essentials | `section-07-details.html` | `#fc-details` |

### Homepage Category

Category: `Umoya - Homepage`

| Key | Widget title | Source | Root |
|---|---|---|---|
| `homepage_form_popup` | Homepage Form Popup | `homepage/homepage-form-popup.html` | `#umoya-form-popup` |
| `homepage_nav` | Homepage Navigation | `homepage/homepage-section-00-nav.html` | `#umoyaHomepageNavMount` |
| `homepage_hero` | Homepage Hero | `homepage/homepage-section-01-hero.html` | `#umoya-hero` |
| `homepage_about` | Homepage About | `homepage/homepage-section-02-about.html` | `#umoya-about` |
| `homepage_homecoming` | Homepage Homecoming Journey | `homepage/homepage-section-03-homecoming.html` | `#umoya-journey` |
| `homepage_founder_cta` | Homepage Founder CTA | `homepage/homepage-section-04-founder-cta.html` | `#umoya-founder-cta` |
| `homepage_pricing` | Homepage Pricing | `homepage/homepage-section-05a-pricing.html` | `#fc-pricing` |
| `homepage_accommodations` | Homepage Accommodations | `homepage/homepage-section-06-accommodations.html` | `#umoya-accommodations` |
| `homepage_pillars` | Homepage Pillars | `homepage/homepage-section-06b-pillars.html` | `#fc-pillars` |
| `homepage_details` | Homepage Travel Essentials | `homepage/homepage-section-07-details.html` | `#fc-details` |

### Important Registry Rule

The standalone source HTML files are the visual source of truth. If changing a section:

1. Edit the root HTML source file first.
2. Run the generator:

```powershell
node tools/build-elementor-widgets.mjs
```

3. Verify generated outputs.
4. Package or deploy the plugin if needed.

Avoid manually editing generated plugin templates unless the task is explicitly to hotfix the generated plugin only.

---

## 8. Form and HubSpot Infrastructure

### Custom Form Flow

The custom Founder's Circle and homepage popup forms are designed to submit through both WordPress and HubSpot.

Expected flow:

1. Browser gathers field values.
2. Browser includes `hubspotutk` when available.
3. Browser sends data to `/wp-json/umoya/v1/submissions`.
4. WordPress stores a private `umoya_submission` post.
5. WordPress forwards the normalized submission to HubSpot.
6. If the WordPress endpoint is unavailable, the browser can attempt direct HubSpot fallback.
7. Admin can resend failed submissions to HubSpot from the WordPress submission screen.

### WordPress REST Endpoint

Defined in:

```text
umoya-elementor-widgets/includes/class-submissions.php
```

Constants:

```php
POST_TYPE = 'umoya_submission'
REST_NAMESPACE = 'umoya/v1'
REST_ROUTE = '/submissions'
```

Endpoint:

```text
/wp-json/umoya/v1/submissions
```

### WordPress Submission Storage

The plugin registers a private admin-only post type:

```text
umoya_submission
```

Stored metadata includes:

- Submitted at.
- Source.
- First name.
- Last name.
- Email.
- Phone.
- Country.
- City.
- Preferred travel season.
- Preferred travel year.
- Preferred journey length.
- Founder's Circle message.
- Page URL.
- HubSpot status.
- HubSpot response code/body.
- Submission UUID.
- IP address.
- User agent.

Admin features:

- Custom columns for email, phone, source, HubSpot status, date.
- Status badges for `sent`, `failed`, `skipped`, `sent_direct_from_browser`, and `not attempted`.
- `Resend to HubSpot` row action on a single submission.
- **Bulk resend** from the submissions list, in two variants:
  - *Resend to HubSpot (failed only)* — skips rows already `sent`. Use this
    for a backlog; re-sending an already-sent row creates a duplicate
    submission record in HubSpot and skews that form's conversion numbers.
  - *Resend to HubSpot (all selected)* — no filtering, for deliberate retries.

  Capped at `MAX_BULK_RESEND` (25) per run, because each resend is a blocking
  HTTP call and this origin already has multi-second TTFB — an unbounded batch
  can hit `max_execution_time` and abort mid-list. Anything over the cap is
  reported as deferred; run the action again to continue. The result notice
  reports sent / failed / skipped / deferred.

  Both paths call the same `resend_one()`, so the bulk action inherits
  `get_submission_from_meta()`'s re-normalisation — which is what lets rows
  saved before the source-aware alias table succeed on retry.

### Automatic retry (self-healing)

A failed HubSpot send re-queues itself. Every send path — REST submit, row
action, bulk action, cron retry — funnels through `record_hubspot_result()`,
so a failure can never be recorded without also being scheduled for another
attempt.

**Backoff, not a fixed minute:** 1m → 2m → 5m → 15m → 30m → 1h → 3h → 6h →
12h → then daily, capped at `MAX_RETRY_ATTEMPTS` (20), spanning roughly ten
days. The first retry is quick because most failures are transient (5xx, rate
limit, a dropped connection to an origin with multi-second TTFB). The gaps
widen so a genuinely invalid payload — say HubSpot rejecting
`Required field 'group_type' is missing` — cannot hammer the API every minute
forever, while the long tail still lets a submission succeed by itself after a
deploy or a HubSpot form change fixes it.

Only `failed` retries. `sent`, `sent_direct_from_browser` and `skipped` all
clear the queue — `skipped` means the portal/form ID is missing, which no
amount of retrying fixes.

**Hourly sweep** (`sweep_failed_submissions`) re-queues any `failed` row that
has no pending retry. This covers rows that failed before this feature existed
and any whose scheduled event was lost to a cron flush, DB restore or
migration. Without it "fail proof" would only hold for new submissions.

The HubSpot column shows `retry 3/20 · next Aug 14, 09:12`, or
`auto-retry gave up after 20 attempts` — an exhausted row needs a manual
resend, so it must be visible rather than silently stuck.

Deactivation clears every scheduled retry and the sweep
(`clear_all_scheduled_events()` via `register_deactivation_hook`).

> ⚠ **This relies on WP-Cron**, which only fires on page requests. On a quiet
> site a "1 minute" retry can land much later, and if `DISABLE_WP_CRON` is
> true it never fires at all. For dependable timing, point a real system cron
> at `wp-cron.php` (e.g. every 5 minutes) and set
> `define( 'DISABLE_WP_CRON', true );`.

### Rate Limiting

The REST handler rate-limits by IP using a transient:

```text
8 submissions per 10 minutes
```

### HubSpot Tracking Code

`class-submissions.php` injects the HubSpot tracking script in `wp_footer`:

```text
https://js.hs-scripts.com/246097317.js
```

This is important for `hubspotutk` and visitor context.

### Field Mapping

The JS maps form fields to HubSpot property names:

| Form field / alias | Normalized HubSpot property |
|---|---|
| `MERGE1`, `title`, `salutation` | `salutation` |
| `FNAME`, `firstname` | `firstname` |
| `LNAME`, `lastname` | `lastname` |
| `EMAIL`, `email` | `email` |
| `PHONE`, `phone` | `phone` |
| `MERGE2`, `country` | `country` |
| `MERGE3`, `city` | `city` |
| `MERGE4`, `preferred_travel_season` | `preferred_travel_season` |
| `MERGE5`, `preferred_travel_year` | `preferred_travel_year` |
| `MERGE6`, `preferred_journey_length` | `preferred_journey_length` |
| `MERGE7`, `founders_circle_message` | `founders_circle_message` |

### Current Forms Using This Infrastructure

| Form | File | Source value |
|---|---|---|
| Founder's Circle Section 02 form | `section-02-form.html` | `founders_circle_page` |
| Homepage popup form | `homepage/homepage-form-popup.html` | `homepage_popup` |

Both currently use:

```text
Portal ID: 246097317
Form GUID: cb87d460-fb2d-4c53-8c32-7daaa05067d7
Consent text: I agree to be contacted by Umoya Afrika Tours about Founder's Circle membership and related travel experiences.
```

### POPIA Consent Requirements

From `Website docs/Umoya_POPIA_Consent_Wording.txt`:

- Marketing consent checkboxes must not be pre-ticked.
- Booking form confirmations must be separate checkboxes.
- Consent register should record who consented, what they consented to, date, and wording used.
- Every marketing email must contain a working unsubscribe link.
- Unsubscribes must be honored promptly.

---

## 9. Footer and Legal Routing

The footer URL map was decoded from `Website docs/FOOTER URL MAP.pdf` and converted into `FOOTER_URL_MAP.elementor.html`.

Current footer routes:

| Footer label | Destination |
|---|---|
> ⚠ **The table below is what `shared/section-99-footer.html` actually
> links to, as of 2026-09-01.** It is NOT the old `FOOTER URL MAP.pdf`,
> which is stale in several places — that doc still lists `/the-journey`,
> `/why-umoya`, `/our-story`, `/booking-terms`, `/visa-and-entry` and
> `/press`, none of which the footer uses. **Update the PDF to match this,
> not the other way round.** Its decoded copy at
> `Website docs/Elementor HTML snippets/FOOTER_URL_MAP.elementor.html` is
> equally stale and is kept only as a record of the original brief.

| Footer label | Destination | Live? |
|---|---|---|
| The Signature Journey | `/signature-journey/` | ✅ |
| Private & Tailormade | `/private-and-tailormade/` | ✅ |
| For Groups | `/for-groups/` | ✅ |
| About Us | `/about-us/` | ✅ |
| Travel Essentials | `/travel-essentials/` | ⏳ page built, not published |
| Travel Brochure | `/umoya_travel_brochure.pdf` | ❌ Ashley to supply |
| Contact | `/contact/` | ✅ |
| Terms & Conditions | `/terms-and-conditions/` | ✅ |
| Privacy Policy | `/privacy/` | ⚠ live but still v1.0 |
| Cookie Settings | CookieYes trigger — no URL | ⚠ CookieYes not installed yet |
| Email Opt-out | `/email-preferences/` | ⏳ page built, not published |
| PAIA Manual | `/umoya_paia_manual.pdf` | ✅ |

Both PDFs open in a new tab (`target="_blank" rel="noopener"`) and both use
the `umoya_` filename prefix.

### Legal Snippet Placeholders Still Open

The generated snippets intentionally preserve these placeholders:

```text
[INSERT DATE]
[INSERT_UNSUBSCRIBE_URL]
[INSERT_HUBSPOT_SUBSCRIPTION_PREFERENCES_URL]
```

Those should be replaced before publishing.

### Cookie Preferences

The footer `Cookie Preferences` link should trigger the active cookie consent tool/modal. It should not route to a normal page unless the cookie tool requires it.

The plugin includes a console cleanup / cookie admin shim:

```text
umoya-elementor-widgets/includes/class-console-cleanup.php
```

It creates hidden shim nodes/classes for `cookieadmin_*` selectors to reduce console noise when cookie admin scripts expect those elements.

---

## 10. Default Elementor Footer Newsletter Form

The footer newsletter form is currently a default Elementor Form widget, not one of the custom generated forms.

### Current UI State Observed

In Elementor editor, `Actions After Submit` showed:

- `Collect Submissions`
- `Email`
- `MailChimp`

No HubSpot action was visible in the screenshot.

### Recommended Production Path

Preferred robust setup:

1. Create a dedicated HubSpot form named something like `Footer Newsletter Signup`.
2. Use fields:
   - `email` required.
   - `firstname` or `name` optional, depending on the HubSpot property strategy.
   - Marketing consent checkbox if the form is for newsletter/marketing.
3. Copy the HubSpot Portal ID and Form GUID.
4. Add a small WordPress hook or webhook integration to forward this Elementor form to HubSpot.
5. Preserve Elementor `Collect Submissions` as local backup.
6. Store source as something like `footer_newsletter`.

### Fast No-Code Option

Use the official HubSpot WordPress plugin and enable non-HubSpot form capture. Then:

- Give the Elementor form a clear name.
- Use clean field IDs such as `email` and `firstname`.
- Submit a test lead.
- Confirm it appears in HubSpot.

This can be fast, but it is less explicit than a custom Forms API bridge.

### Why Not Rely Only on MailChimp

MailChimp can collect newsletter contacts, but the project already uses HubSpot as the CRM and the legal docs refer to HubSpot as a customer relationship management platform. The cleaner long-term source of truth is HubSpot.

---

## 11. Generator Workflow

Use this when updating source sections and keeping the plugin synchronized.

### Edit Flow

1. Edit the relevant source HTML:
   - Founder's Circle: root `section-*.html`.
   - Homepage: `homepage/*.html`.
2. Run:

```powershell
node tools/build-elementor-widgets.mjs
```

3. Review generated changes:

```powershell
git diff -- umoya-elementor-widgets tools/build-elementor-widgets.mjs
```

4. Check for whitespace:

```powershell
git diff --check
```

5. If packaging is needed, refresh:

```powershell
python tools/build-plugin-zip.py
```

> ### ⛔ Never use `Compress-Archive` for the plugin zip
> Windows PowerShell 5.1 writes ZIP entry names with **backslash**
> separators (`umoya-elementor-widgets\includes\…`). The ZIP spec requires
> forward slashes, so Linux/WordPress does not see them as directories, the
> archive extracts to mangled flat filenames, and installing it fails with
> **"Plugin file does not exist."** Every zip built this way — including the
> one committed before 2026-08-13 — has this defect.
>
> `tools/build-plugin-zip.py` writes correct forward-slash entries and then
> re-opens the archive to assert: no backslashes, a single top-level folder,
> `umoya-elementor-widgets/umoya-elementor-widgets.php` present, and no
> corrupt entries.

Use PowerShell-native commands on Windows for other tasks. Avoid shell write
tricks for manual file edits.

### Generator Guarantees

The generator:

- Removes hidden BOMs from source input.
- Splits `<style>` and `<script>` into plugin asset files.
- Masks comments so comments do not become editable Elementor text fields.
- Performs round-trip validation on placeholders.
- Creates registry entries with fields and design tokens.
- Writes normalized line endings and strips trailing spaces.

### Prior Validation Achieved

During the widget sync rollout:

- `node tools/build-elementor-widgets.mjs` generated 26 widgets.
- JS syntax check passed for generated section scripts.
- A temporary Node-installed PHP parser parsed 58 PHP files.
- Coverage check confirmed manifest/template/asset consistency.
- `git diff --check` passed.

---

## 12. Deployment and Elementor Editing Guidance

### ⏳ Pending Elementor deployments (as of 2026-09-01)

Nothing in this repo reaches the live site until someone pastes it into an
Elementor HTML widget. This is the current backlog, most urgent first.

| # | Paste | Into | Why it matters |
|---|---|---|---|
| 1 | `shared/page-privacy-policy.html` | the EXISTING `/privacy/` page | The live page still shows `Effective date: [INSERT DATE]` publicly |
| 2 | `shared/page-cookie-policy.html` | the EXISTING `/cookie-policy/` page | Same placeholder; also the URL CookieYes should point at |
| 3 | `shared/page-travel-essentials.html` | a NEW page at `/travel-essentials/` | The footer has linked here against a 404 since August |
| 4 | `shared/page-email-preferences.html` | a NEW page at `/email-preferences/` | Footer Email Opt-out currently 404s |
| 5 | `shared/section-00-nav.html` | the nav widget on EVERY page | Contact link + the 1024px breakpoint |
| 6 | `shared/section-99-footer.html` | LAST widget on EVERY page | Then delete the old Elementor Form newsletter widget |
| 7 | `signature-journey/section-02-intro.html` | Signature Journey | Stat bar reordered + 7 Signature Moments |
| 8 | `homepage-revamp/homepage-form-popup.html` | homepage | Still on the retired lossy HubSpot GUID `cb87d460` |
| 9 | `umoya-elementor-widgets.zip` (re-upload) | Network Admin → Plugins | `contact_page_general` field forwarding + the resend IP fix |

> ⚠ **Items 1 and 2 replace the CONTENT of pages that already exist.** Do not
> create new pages for them — the footer, the Privacy Policy's own section 12,
> and the footer signup's redirect all point at `/privacy/` and
> `/cookie-policy/`. New slugs would break those links.

> Item 3 consolidates the former **Visa & Entry Information** and **Travel
> Insurance Guide** pages. If either still exists, redirect it to
> `/travel-essentials/`.

### For Standalone HTML Widgets

If using raw HTML snippets manually:

1. Open the page in Elementor.
2. Add an HTML widget.
3. Paste the entire file content.
4. Update the page.
5. Preview desktop, tablet, and mobile.

### For Custom Plugin Widgets

Preferred ongoing route:

1. Install or update `umoya-elementor-widgets.zip`.
2. In Elementor, use the section widgets from:
   - `Umoya - Homepage`
   - `Umoya - Founder's Circle`
3. Edit text/media/link values through widget controls where possible.
4. Use the widget's custom replacement/custom CSS controls for isolated changes.
5. Use full HTML override only when a section needs a deliberate local divergence.

### Do Not Change These Anchors Carelessly

| Anchor | Role |
|---|---|
| `#fc-form-section` | Main Founder's Circle form target. |
| `#fc-hero` | Founder's Circle hero target. |
| `#fc-be-first` | Hero "Learn More" target. |
| `#umoya-hero` | Homepage top section. |
| `#umoya-about` | Homepage story section. |
| `#umoya-journey-anchor` | Homepage nav scroll target for journey. |
| `#fc-pillars` | Why Umoya / pillars target in several sections. |
| `#fc-details` | Travel essentials target. |
| `#sj-hero` … `#sj-cta` | Signature Journey sections (`sj-overview`, `sj-journey`, `sj-extensions`, `sj-stays`, `sj-inclusions`). |
| `#pt-design` | Private & Tailormade form — every "Design Your Journey" / "Make it yours" CTA targets it. |
| `#pt-trip-types` | Private & Tailormade trip-types rail. |
| `#fg-plan` | For Groups form — every "Plan a Group Journey" CTA targets it. |
| `#fg-journey` | For Groups journey teaser. |
| `#ab-hero` … `#ab-cta` | About Us sections. |
| `#ct-plan` / `#ct-general` | Contact page panels — link straight to one form. |
| `#umoya-contact-hero` / `#umoya-contact-forms` / `#umoya-contact-direct` | Contact page section roots. |
| `#umoya-travel-essentials` | Travel Essentials page root. |
| `#umoya-privacy` | Privacy Policy page root. `#pv-1`…`#pv-15` are its contents-list anchors — renumbering a section means renumbering both. |
| `#umoya-cookie-policy` | Cookie Policy page root. |
| `#umoya-email-prefs` | Email Opt-out page root. |
| `#umoyaSiteNavMount` / `#umoyaSiteNav` | Shared nav mount + bar. The mount must keep its reserved height. |

### Page URL slugs assumed by the shared nav

`shared/section-00-nav.html` hardcodes these. If a real slug differs,
update BOTH the `href` and the `data-path` on that item, or the active
state will not highlight.

| Nav item | Assumed URL |
|---|---|
| The Signature Journey | `/signature-journey/` |
| Private & Tailormade | `/private-and-tailormade/` |
| For Groups | `/for-groups/` |
| About | `/about/` |
| Contact | `/contact/` |
| CTA | `/founders-circle/` |

**All six verified live 2026-08-22** (200, uncached). The Signature Journey
has moved off `/signature-journey-unpublished/` onto `/signature-journey/`,
so the nav's assumed slug is now correct and the old caveat is closed.

`Contact` was added to the nav on 2026-08-22. Note its `data-path` is
`/contact`, which deliberately does NOT match the retired `/contact-us`
(the active-state test is `here === p || here.indexOf(p + '/') === 0`).

---

## 13. Accessibility and Interaction Standards

Keep these standards for future changes:

- Use semantic section roots with `aria-label` where helpful.
- Keep interactive controls keyboard-accessible.
- Use 44px minimum touch targets for buttons, arrows, dots, and accordion triggers.
- Keep form inputs at 16px or above on mobile to avoid iOS zoom.
- Keep accordions and carousels ARIA-aware.
- Use no-JS fallbacks for reveal animations.
- Do not hide real content permanently behind JS-only behavior.
- Keep carousel copy inserted with `textContent` or safe templating.

---

## 13b. Dark Mode — the palette must never invert

Mobile browsers force-darken pages that never declare which colour schemes
they support: Chrome on Android ("Auto dark theme for web contents"), Samsung
Internet and Opera all do this. The cream (`#F5F0EB`) renders near-black and
the brand palette is lost. **Nothing in our CSS causes it** — a grep for
`prefers-color-scheme` across every section returns nothing, so we never asked
for a dark variant; the browser rewrites the colours unasked.

The opt-out is `color-scheme: only light`, which also keeps native form
controls rendering light instead of turning into dark inputs.

**Already applied to** `shared/section-00-nav.html`,
`shared/section-99-footer.html`, `signature-journey/section-00-nav.html`,
`founders-circle-revamp/section-00-nav.html`,
`homepage-revamp/homepage-section-00-nav.html` and `about/section-01-hero.html`
— i.e. the first widget of every current page. Any page using one of those is
covered.

**Best fix, once, for the whole site** (do this and the per-page copies become
belt-and-braces): **Elementor → Custom Code** in the WP admin sidebar (a
top-level Elementor Pro item, not under Site Settings — Site Settings only
exposes Custom *CSS*, which cannot hold a `<meta>` tag). Add a snippet:

```html
<meta name="color-scheme" content="only light">
```

Location: `<head>` (not Body Start/End). On **Publish**, a Conditions dialog
appears — set **Include → Entire Site**, or the snippet publishes but renders
nowhere. Purge LiteSpeed + Cloudflare afterward so the next load isn't served
from cache. If **Custom Code** isn't in the sidebar (Pro not active), the
fallback is a one-line `wp_head` hook in `tevily-child/functions.php`.
Verify with `Ctrl+U` → search `color-scheme` for the meta tag in `<head>`,
or turn on Chrome Android's dark theme and reload a page.

On a **multisite** install (confirmed the case here — see the plugin zip
Open Item below), Custom Code snippets are per-site; the child-theme
`wp_head` hook is the only route that covers every site in the network in
one place.

`shared/color-scheme-lock.html` is a standalone widget for any future page
that has none of the above as its first widget, and stays useful as a
fallback even after the sitewide meta tag is added.

> **Scope exception.** `color-scheme` only works on the root element, so these
> are `:root, html, body` rules rather than section-scoped — one of the few
> justified breaks from the house rule, alongside the nav's theme-header
> takeover.

Two caveats worth knowing:
- A user's **OS-level or extension-based** forced dark mode (Android's
  system-wide "Force dark on all websites" developer flag, Firefox's
  `browser.display.document_color_use`, high-contrast modes) overrides page
  intent by design and cannot be opted out of. That is correct behaviour —
  accessibility beats branding.
- Samsung Internet's older "Dark mode" honoured this inconsistently across
  versions. `only light` is the standard mechanism and covers Chrome Android,
  which is what produced the reported screenshot.

---

## 14. Styling Standards

- Scope CSS under the section root.
- Prefer section prefixes:
  - `fc-` for Founder's Circle.
  - `umoya-` for homepage/general brand sections.
- Keep `box-sizing: border-box` inside section scopes.
- Use `clamp()` thoughtfully for responsive typography and spacing.
- Do not scale everything purely with viewport width.
- Avoid negative letter spacing.
- Keep cards and framed elements intentional; do not nest cards inside cards.
- Avoid decorative gradient blobs/orbs.
- If a CTA is meant to stay one line, use intrinsic width and padding before changing the design.

---

## 15. JavaScript Standards

Most section scripts follow this shape:

```js
(function() {
  'use strict';
  var root = document.querySelector('#section-root');
  if (!root) return;
  // section-scoped behavior
}());
```

Guidelines:

- Prefer ES5 syntax for WordPress/Elementor compatibility.
- Query within the section root.
- Avoid global variable leakage.
- Add IntersectionObserver fallbacks.
- For form scripts, prevent duplicate submissions.
- For popup scripts, manage focus, escape key, close buttons, and `aria-hidden`.

---

## 16. Known Open Items

### ⚠ Live site stability (highest priority)

> **RESOLVED 2026-08-22 — full outage. Cause: a broken The Events Calendar
> install.** See Phase 15 below. This is a DIFFERENT fault from the 520/522
> work in Phase 14; those items are still open and are listed after it.

- Site throws intermittent Cloudflare **520 / 525**; successful page loads
  still take 3.6–4.5s TTFB. Diagnosed as origin resource exhaustion
  (Phase 14). Post-recovery TTFB measured 2.6–3.9s, so this is unchanged.
- **Pull `/error_log` via cPanel or SSH** — the Mountain Duck mount returns
  permission denied, so the root cause is not log-confirmed. (The mount also
  denies reads on `wp-config.php`, `mu-plugins/*.php` and theme files, while
  still allowing directory listings and **writes**. Writing a temporary
  diagnostic PHP script to the web root is the working way in — see Phase 15.)
- Ask the host to check PHP worker / memory limits.
- **Deactivate one of the two page caches** (`litespeed-cache` vs
  `speedycache`) — highest-impact, lowest-risk single change.
- Then retire duplicate builders / SEO / image plugins **on staging first**
  (removing a page builder can break existing layouts).
- Do not deploy new theme PHP while the origin is unstable — a PHP error on
  top of this would take the site fully down.

### ⚠ /founders-circle/ is served without most plugin assets (UNRESOLVED)

*Found 2026-09-01. Full evidence in Section 21.*

That page renders **freshly from PHP** and still comes back with 18
`<script src>` tags against 47–48 on `/contact/`, `/for-groups/` and `/`.
Missing: Elementor `frontend.min.js`, pro-elements, Contact Form 7, jQuery UI,
Stripe, `tevily-themer/main.min.js`, the HubSpot WordPress plugin loader and
our own `render_hubspot_tracking_code()` snippet.

Ruled out: stale cache (forced `x-litespeed-cache: miss` every time),
User-Agent sniffing, `wp_footer` not running, and our plugin.

- **Check page 8402's per-page asset settings in wp-admin first** — Asset
  CleanUp / Perfmatters / LiteSpeed page-specific JS exclusions are the most
  likely culprit on a 52-plugin install.
- Consequence: no `hubspotutk` on the site's highest-intent URL, so its
  submissions carry no visitor attribution and Traffic Analytics logs no page
  views for it — which also removes the denominator for the form conversion
  rate (Section 21).
- Consequence: CookieYes, once installed, will not load there either, so the
  footer's Cookie Settings button will hit its fallback on that page.
- **Lead capture is NOT affected** — the form's script is inline in the
  widget, and GUID `b3c06e8a` plus `/wp-json/umoya/v1/submissions` are both
  present in the rendered HTML.

### Decide what to do with the disabled Events Calendar

`wp-content/plugins/the-events-calendar.DISABLED-2026-08-22-broken-install`
is a renamed, **still network-activated** plugin folder. Two ways to close
this out, from Network Admin → Plugins:

1. **Delete it** (recommended). The site had **0 events, 0 venues,
   0 organizers**, and it is one of the duplicated booking/events plugins the
   audit already flagged. Deleting also clears the network activation.
2. **Reinstall it cleanly** if events are actually wanted — download a fresh
   copy rather than "updating" the broken one.

> ⚠ **Do not simply rename the folder back.** It is still network-activated
> in the DB, so restoring the folder re-enables the broken copy and takes the
> site straight back down.

### New pages and shared nav

- Confirm the page slugs the shared nav assumes (table in Section 12).
- Confirm the Privacy Policy URL used in both new consent lines (`/privacy/`).
- Decide whether to retire `signature-journey/section-00-nav.html` and
  `homepage-revamp/homepage-section-00-nav.html` in favour of the shared
  nav — both are still always-fixed and overlap their heroes.
- Decide whether to deploy `theme-overrides/tevily_child/header.php`.
  If deployed, the nav must move into page content on affected pages.
- The theme's WP `primary` menu still contains stale items. It is no longer
  displayed (the nav takeover hides it), but tidy it in
  **Appearance → Menus** so it is not a trap for future templates.

### Outstanding photography

- **Signature Journey:** 4–5 moment photos still placeholders — source
  files were RAW (`.NEF`) / TIFF and were never converted. See
  `signature-journey/_NOTES.md`.
- **About Us:** Wilson Nyah portrait, plus 5 of 6 host cards
  (Lucia Motloung, Antoinette Sithole, Christo Brand, Ntsiki Biyela,
  Senzart911). Eyethu Heritage Hall has its photo.
- **About Us:** hero video `<source>` still points at the existing brand
  film; carousel reuses existing CDN trip photography.
- Placeholders render as labelled brand-toned tiles naming the intended
  subject. To fill one, replace the `.…-ph` block with an
  `<img class="…-pic" src="…" alt="…" loading="lazy">`.

### Legal / Footer

- ✅ **`[INSERT DATE]` is resolved** — the revised docs give real dates
  (Privacy v1.1, effective 1 June 2026; Cookie v1.2, effective 1 June 2026,
  last updated 26 August 2026). Both are built as
  `shared/page-privacy-policy.html` and `shared/page-cookie-policy.html`.
  ⏳ **The live pages are still v1.0 and still render the placeholder** —
  they are only fixed once those two widgets are pasted in.
- ✅ **`/cookie-policy/` is confirmed** as its own live slug, and is the URL
  to set as the cookie policy link inside the CookieYes banner config.
- ✅ **Cookie Preferences is wired** — `.cky-banner-element` in the footer,
  and now also mid-page in the Cookie Policy where the copy tells the reader
  they can change their preferences.
- ✅ **The PAIA manual is live at `/umoya_paia_manual.pdf`** — uploaded
  2026-09-01, verified byte-identical to
  `Revised footer docs/Umoya_PAIA_Manual (final).pdf`. Older spellings
  (`/paia_manual.pdf`, `/Umoya_PAIA_Manual.pdf`) still resolve and were left
  in place; `/paia-manual.pdf` is a ghost listing and 404s. Nothing deleted.
- Replace `[INSERT_UNSUBSCRIBE_URL]`.
- Replace `[INSERT_HUBSPOT_SUBSCRIPTION_PREFERENCES_URL]`.
- ❌ **`/umoya_travel_brochure.pdf` still 404s** — Ashley to supply. It must
  be uploaded under exactly that name; the footer already links to it.

### ⚠ Redeploy required for the HubSpot fixes to reach the live site

The data-loss fix is complete in this repo but **inert until deployed**:

1. **Re-paste 5 HTML widgets** in Elementor (each now carries its own form
   GUID): `founders-circle-revamp/section-04-inquiry-form.html`,
   `homepage-revamp/homepage-form-popup.html`,
   `signature-journey/section-08-form-popup.html`,
   `private-tailormade/section-05-design-form.html`,
   `for-groups/section-08-plan-form.html`.
2. **Re-upload `umoya-elementor-widgets.zip`** for the source-aware alias
   change in `class-submissions.php`.
3. **Add `shared/section-99-footer.html`** as the last widget on every page,
   and delete the old Elementor Form newsletter widget.
4. **Paste the 3 `contact/` sections** at `/contact/`, replacing the Tevily
   demo content.

The plugin re-upload in step 2 now also delivers (added 2026-08-29 →
2026-09-01):
- `contact_page_journey` / `contact_page_general` source aliases and the
  `enquiry_type` field name, so the WordPress backup path writes the same
  properties as the direct path;
- the custom properties (`enquiry_type`, `trip_occasion`, `group_type`,
  `organization`, `party_size`) in the Umoya Submissions detail panel, which
  previously showed none of them;
- the IP-address fix, so resends and cron retries stop forwarding without
  `context.ipAddress`.

**Deployment status, checked live 2026-08-11 (by fetching each page and
grepping for the GUID):**

| Page | Deployed GUID | Status |
|---|---|---|
| `/founders-circle/` | `b3c06e8a` | ✅ live |
| `/private-and-tailormade/` | `28e4e3e3` | ✅ live |
| `/for-groups/` | `c201e387` | ✅ live |
| `/signature-journey/` | `71181d17` | ✅ live (the page moved off `/signature-journey-unpublished/` — confirmed 2026-08-22) |
| `/` (homepage popup) | `cb87d460` | ⚠️ still the retired form — re-paste `homepage-revamp/homepage-form-popup.html` |

Confirmed working: a real (non-test) submission on 2026-08-11 13:29 landed on
**Homepage Popup Inquiry** carrying `preferred_travel_season`,
`preferred_travel_year` and `founders_circle_message` — the exact fields that
were being discarded before. Note the homepage HTML may be served from cache,
so re-check after a cache purge.

### Footer (rebuilt 2026-08-29)

- ✅ **Built to the client mockup.** `shared/section-99-footer.html` — brand
  block, Journeys / Support / Legal columns, Founder's Circle signup, legal
  bar with social icons. The signup still posts to the dedicated
  **Footer Newsletter Signup** form (`40d535ad-fc91-4831-8231-eddc05208624`),
  `source="footer_newsletter"`, same WordPress-first / HubSpot-fallback path,
  and needs **no** PHP change (EMAIL + FNAME resolve through the default
  alias table — asserted in `verify-alias-mapping.mjs`).
- ⏳ **Deploy step:** paste it as the LAST widget on **every** page, Founder's
  Circle included (the routing doc names that page), then **delete the old
  Elementor Form newsletter widget** — otherwise the HubSpot WP plugin keeps
  auto-capturing it as `.elementor-form … converted (August 11, 2026)`
  (`b51b9251-…`).
- ✅ **Slugs verified live 2026-08-29.** `/terms-and-conditions/` replaces the
  FOOTER URL MAP's `/booking-terms`, which 404s. The nav's slugs
  (`/signature-journey/`, `/private-and-tailormade/`, `/for-groups/`,
  `/about-us/`) all resolve. **Update the FOOTER URL MAP doc to match.**
- ⏳ **Three footer destinations still 404**, down from four:
  `/travel-essentials/` (page BUILT — `shared/page-travel-essentials.html`),
  `/email-preferences/` (page BUILT — `shared/page-email-preferences.html`),
  and `/umoya_travel_brochure.pdf` (Ashley to supply; upload under exactly
  that name). The PAIA manual is now live at `/umoya_paia_manual.pdf`.
- ⏳ **CookieYes, two non-code steps** from the routing doc: replace the
  current CookieYes script with the one for the new Umoya account (emailed
  separately) so consent records live under Umoya's own account; and publish
  the Cookie Policy from the Drive, then set it as the cookie policy link
  inside the CookieYes banner configuration.
- ⚠ **Consent model changed** from a required checkbox to statement-style
  consent, on the client's explicit instruction ("the consent fine print
  under the form must ship exactly as written in the mockup"). Raise with
  whoever owns POPIA compliance before launch.
- Optional: rename the HubSpot form to match the new "Join the Founder's
  Circle" label, and point it at the Founder's Circle list/workflow. The GUID
  does not change, so no code change either.
- Test lead capture in HubSpot and Umoya Submissions once live.

### Contact page (built 2026-08-29)

- ✅ **Built.** `contact/` — 3 sections, two dedicated HubSpot forms, both
  verified end-to-end. Full detail in `contact/_NOTES.md`.
- ✅ **Published at `/contact/`** — confirmed live 2026-08-22: the page
  serves `umoya-contact-hero` / `umoya-contact-forms` / `umoya-contact-direct`
  with no Tevily demo copy left.
- ✅ **`/contact-us/` is gone** (404s as of 2026-08-22), so the duplicate
  demo page no longer needs a decision.
- ✅ **Linked from the shared nav** as of 2026-08-22.
- ⚠ **Re-upload the plugin** for `contact_page_general` to forward
  `enquiry_type` / `organization` from the WordPress backup path.

### HubSpot / Forms

> **Status 2026-08-11: dedicated forms built and verified end-to-end.**
> See Section 21 for the full HubSpot inventory and the data-loss bug that
> was found and fixed while doing it.

- ✅ Private & Tailormade and For Groups now each have their **own** HubSpot
  form and dedicated properties (`trip_occasion`, `party_size`, `group_type`,
  `organization`). They no longer borrow `country` / `city` /
  `preferred_journey_length`.
- ✅ `class-submissions.php` resolves `MERGE*` aliases **per source**, so the
  WordPress-backup path writes the same properties as the direct path.
- ⚠ **The plugin must be re-uploaded** for the PHP change to take effect —
  `umoya-elementor-widgets.zip` was rebuilt 2026-08-11.
- Confirm whether the Founder's Circle page and homepage popup should also
  move off the shared `Umoya Website Form Submissions` form onto dedicated
  forms (they still share GUID `cb87d460-…`).
- Confirm whether newsletter contacts should use a separate HubSpot form/list.
- ⚠ **The "I'd also like to receive Umoya journeys and stories" checkbox is
  fully wired client-side and goes nowhere** — traced end-to-end, zero
  references anywhere server-side, not even saved as its own field. No leads
  are lost and nobody is emailed without consent, but nobody who opts in is
  captured either. Full trace, the two fix options, and the required Private
  App scope for option (B) are in Section 21.
- Confirm final unsubscribe and subscription preferences URLs.

### Elementor Plugin

- **The generator is now out of sync with the current source.** Its
  `source:` paths still point at `founders-circle/` and `homepage/`, but the
  live working copies are `founders-circle-revamp/` and `homepage-revamp/`.
  The four newest folders (`signature-journey/`, `private-tailormade/`,
  `about/`, `for-groups/`) and `shared/` are not registered at all.
  Decide whether to repoint the generator or keep these as
  hand-pasted HTML widgets. **Until then, do not assume re-running the
  generator will pick up recent work.**
- Re-run generator after any source HTML change *that it covers*.
- Rebuild `umoya-elementor-widgets.zip` after plugin changes.
- If committing, stage only intentional plugin/source files.
- Consider adding a formal package/build command if this becomes recurring.

### Homepage / Founder's Circle

- Final pricing and offer values should be confirmed.
- Final image/video assets should be audited against the live media library.
- Review all CTA routes against live WordPress pages.
- Confirm any QA screenshots/profile folders that can be cleaned up.

### GitHub

- Current branch is `codex/elementor-widget-sync`, pushed through `8bcf974`.
- Recent history: `9b28240` (restore + three new pages + shared nav),
  `8bcf974` (revamp content fixes). Prior: `68e9cb7`, `042040d`.
- A PR into `main` has never been opened. `main` still predates the widget
  plugin, so a merge will be substantial — review before merging.
- If making a new kind of change, either continue this branch intentionally or create a new scoped branch.
- Because the worktree has many unrelated untracked artifacts, **never use
  blanket `git add .`**. In particular `.edge-visual-profile-*` (~5,900
  files, browser cache that may hold cookies/session data) and `.agents/`
  are deliberately untracked.
- 4 redundant `git stash` entries remain on this branch; their content is
  now committed and they can be dropped.

---

## 17. Quick Commands

```powershell
# Show current git branch
git branch --show-current

# Show status without touching unrelated files
git status --short

# Search fast
rg -n "HubSpot|hubspot|fc-form-section|umoya-form-popup"

# Rebuild generated Elementor plugin artifacts
node tools/build-elementor-widgets.mjs

# Check whitespace problems
git diff --check

# Rebuild plugin zip if needed (NOT Compress-Archive — it writes backslash
# paths that WordPress cannot install; see the Generator Workflow section)
python tools/build-plugin-zip.py
```

---

## 18. File-Specific Notes

### `section-02-form.html`

Main custom Founder's Circle form. It already contains:

- `action="/wp-json/umoya/v1/submissions"`
- HubSpot portal and form IDs.
- `data-umoya-form-source="founders_circle_page"`
- Hidden `hutk` input.
- JS form mapping and fallback logic.

### `homepage/homepage-form-popup.html`

Reusable homepage popup form. It already contains:

- Same HubSpot portal and form GUID.
- `data-umoya-form-source="homepage_popup"`
- Popup open/close behavior.
- Duplicate-submission prevention.
- WordPress backup and HubSpot fallback logic.

### `umoya-elementor-widgets/includes/class-submissions.php`

Core server-side submission infrastructure:

- Registers private submission post type.
- Registers REST endpoint.
- Normalizes field aliases.
- Saves submissions.
- Forwards to HubSpot.
- Injects HubSpot tracking script.
- Provides admin resend.

### `tools/build-elementor-widgets.mjs`

Do not delete. This is the sync bridge from source HTML to the plugin.
**Note:** its `source:` paths are currently stale — see Elementor Plugin
open items.

### `shared/section-99-footer.html`

The site-wide footer. Four things in it are load-bearing and easy to undo by
accident:

1. **`--umoya-ft-vw`, not `100vw`.** `100vw` includes the vertical scrollbar,
   so on any scrollable page the footer became a scrollbar-width too wide and
   gave the whole page a horizontal scrollbar (measured: viewport 822px,
   footer 838px, `left: -8px`). The JS sets the custom property from
   `documentElement.clientWidth`; `100vw` stays only as the no-JS fallback.
2. **The Instagram path is the official mark, deliberately not the mockup's.**
   The mockup's version does not punch out its lens under the nonzero fill
   rule and renders as a solid blob. See note 8 in the file's own `_NOTES`.
3. **The consent fine print is verbatim client copy** and doubles as the
   `consentText` sent with every submission. Editing the visible wording
   without editing the two `data-hubspot-consent-text` / hidden-input copies
   would silently desynchronise the POPIA consent register.
4. **Cookie Settings is a `<button class="cky-banner-element">`**, not a link.
   CookieYes binds itself to that class; the JS guard only fires when
   CookieYes is absent at click time, so it must stay a click-time check
   rather than a load-time one.

### `contact/section-02-forms.html`

Both contact panels in one widget, with the submit path written once and
instantiated twice via `wireForm(cfg)` — the two forms differ only in their
elements, field map and success wording.

- Panel 2's single "Full name" box is split into hidden `FNAME` / `LNAME`
  inputs on every keystroke, on the FIRST space, so compound surnames
  survive. Do not "tidy" the hidden inputs away.
- `enquiry_type` is a HubSpot **enumeration**: the `<option>` values here and
  the property's options in HubSpot must be edited together or submissions
  are rejected.
- The `@media (min-width: 901px)` flex chain on `#ct-general` is what lets the
  message box absorb the height difference between the two cards. It is
  scoped above the stacking breakpoint on purpose.

### `shared/section-00-nav.html`

The site-wide navigation. Three behaviours are load-bearing and easy to
break:

1. The mount must keep a real reserved height (`--nav-h`). Setting it to
   `0` reintroduces the hero-overlap bug.
2. The `no-anim` class suppresses the transition for the one frame where
   the bar switches docked↔stuck. Remove it and the state change visibly
   slides.
3. The `.umoya-nav-takeover` marker gates the only two selectors that
   reach outside the widget's root. It must be added by JS to the theme
   header — never applied globally.

The scroll throttle uses `requestAnimationFrame` **with a `setTimeout`
fallback**, because rAF never fires in non-compositing contexts and would
otherwise latch the throttle permanently.

**Five links since 2026-08-22** — The Signature Journey · Private &
Tailormade · For Groups · About · **Contact** — in BOTH the inline row and
the mobile dropdown. Adding a link means editing two lists, not one.

**The hamburger breakpoint is 1024px, not 900px.** Five links plus the logo
and CTA need ~970px on one line and cannot shrink (`white-space: nowrap`
items, `flex-shrink: 0` logo and CTA), so they collided in the 900–970px
band. See Phase 18 for why the type was not reduced instead. `--nav-h` drops
to 58px at the same breakpoint.

### `shared/page-travel-essentials.html`, `page-privacy-policy.html`, `page-cookie-policy.html`

The three footer content pages, built 2026-09-01 from `Revised footer docs/`.
Each is a self-contained Elementor HTML widget: nav first, the page widget,
footer last. Full rationale in Phase 19. Things not to undo:

- **The copy is verbatim and was diff-asserted.** If you edit wording, you
  are editing a legal document the client drafted — check with them first.
  British spellings are correct here and must NOT be Americanised the way
  site copy is.
- **The dates are real now.** `[INSERT DATE]` is gone. Privacy is v1.1,
  Cookie is v1.2 (last updated 26 August 2026). Bump the version and date
  together whenever the text changes.
- The Cookie Policy's monospace on `<code>` cookie names is the one
  deliberate non-`inherit` `font-family` in the set. It imports nothing.
- The Privacy Policy's contents list is plain anchors, no JS; the nav's
  `scroll-padding-top` is what stops the sticky bar covering the target.
- The Cookie Policy is the only one of the three with a `<script>` — the
  CookieYes not-loaded guard.

### `theme-overrides/tevily_child/header.php`

Not deployed. Removes the Tevily theme header while keeping the footer.
**Keeps `.wrapper-page` and `#page-content` open** because `footer.php`
closes them — do not "tidy" those away.

### `Website docs/Elementor HTML snippets/`

Paste-ready legal snippets for Elementor text/HTML editing. These are fragments, not full HTML pages.

---

## 19. Future Assistant Checklist

Before changing anything:

1. Read this `CLAUDE.md`, then the relevant companion notes file.
2. Check `git status --short`.
3. **Confirm which folder is current** — for Founder's Circle and the
   homepage, edit the `-revamp/` copies, not the originals.
4. Identify whether the change belongs to source HTML, generated plugin output, legal docs, or WordPress integration.
5. Preserve unrelated local files.
6. Make the smallest safe edit.
7. If source HTML changed, run the generator **only if it actually covers
   that folder** (see open items).
8. Verify with `rg`, `git diff --check`, and targeted file checks.
9. If syncing to GitHub, stage only the intended scope — never `git add .`.

### House rules that are easy to violate

These come from the brief and were enforced throughout; a new assistant
should not quietly break them:

- **Never copy fonts or colours from the client mockups.** Mockups are
  layout/content reference only. Every section uses `font-family: inherit`
  and the brand palette. Verify with a grep for `Cormorant`, `Mulish`,
  `googleapis`, and the mockup hex values before committing.
- **Preserve mockup copy verbatim.** An early pass paraphrased hero copy
  and added buttons the mockup did not have; this had to be reverted. If
  the copy seems awkward, flag it rather than improving it.
- **No blanket global selectors** when a section root can scope the
  behaviour. `scroll-padding-top` on the scroll container is preferred
  over an `[id]` rule.
- Scoped CSS under the section root, ES5 IIFE scripts, WCAG AA
  (12px floor, 44px targets, 16px input floor), four breakpoints.

After changing anything:

1. State exactly what files changed.
2. State what was verified.
3. Note any unresolved placeholders or external credentials/URLs needed.
4. If a GitHub sync was done, include branch and commit.

---

## 20. The Current Mental Model

Think of this project as five connected layers:

1. Brand/content layer:
   - Umoya's premium heritage travel narrative.
   - Client mockups as layout/content reference only — never their styling.
   - Legal policies and footer route map.

2. Source HTML layer (the main working surface):
   - `founders-circle-revamp/` and `homepage-revamp/` — current copies.
   - `signature-journey/`, `private-tailormade/`, `about/`, `for-groups/`
     — pages built from client mockups.
   - `shared/section-00-nav.html` — one nav for every page.
   - `founders-circle/` and `homepage/` — earlier originals, reference only.

3. Elementor plugin layer:
   - Generated widgets, controls, assets, and registry.
   - Two Elementor categories: homepage and Founder's Circle.
   - **Currently trails the source layer** — the newest folders are not
     registered and the generator's paths are stale.

4. WordPress/theme layer (lives on the server, not in this repo):
   - Two header systems depending on the Elementor template
     (Canvas bypasses the theme header; Full Width does not).
   - The Tevily theme and its `primary` menu.
   - 50 installed plugins with several duplicated functions.

5. CRM/compliance layer:
   - WordPress submission storage.
   - HubSpot Forms API forwarding (eight live forms, each page on its own
     GUID — the shared lossy form was retired; see Section 21).
   - HubSpot tracking code.
   - POPIA consent wording.
   - Footer newsletter and opt-out work still being completed.

When in doubt, preserve the source HTML visual behavior, then sync the
plugin layer, then verify HubSpot/legal implications.

**Deployment reality:** most of this work reaches the live site by pasting
a section file into an Elementor HTML widget — not through the plugin. So
editing a file here does not change the site until someone re-pastes it.
Say so explicitly when handing work over.

---

## 21. HubSpot Forms — Inventory & the Silent Data-Loss Bug

*Established 2026-08-11 by querying the live portal via the Marketing Forms
and CRM Properties APIs.*

### Do NOT use the HubSpot CLI for this

`@hubspot/cli` (`hs init`) targets **HubSpot CMS Hub** — themes and modules
hosted on HubSpot's own infrastructure. It has **no form-management
commands**. Umoya's forms live in WordPress/Elementor and submit *into*
HubSpot, so the correct surface is the **Marketing Forms API**. Tooling for
that lives in `tools/hubspot-*.mjs` and needs no CLI.

**Auth:** a Private App token in `.secrets/hubspot.env` (git-ignored —
`.gitignore` covers `.secrets/`, `.env*`). Scopes: `forms`,
`crm.schemas.contacts.*`, `crm.objects.contacts.*`. Portal **246097317**.

### The rule that governs whether a field is saved

> A submitted field is persisted only if it is **BOTH** a real contact
> property **AND** defined on that form. If either is missing, HubSpot
> returns **HTTP 200 and silently discards the value.**

A 200 response therefore proves nothing. Always read the contact back —
`tools/hubspot-verify-forms.mjs` does exactly this.

### The bug that was found (now fixed)

Every submission from all **five** live forms was **losing the travel month,
travel year, party size and the customer's own message**, because:

1. `preferred_travel_season`, `preferred_travel_year`,
   `preferred_journey_length` and `founders_circle_message` **did not exist
   as contact properties**.
2. On the legacy shared form, `when_would_you_like_to_travel` and
   `preferred_year` were defined with `objectTypeId: "0-5"` (**Ticket**)
   instead of `"0-1"` (**Contact**) — so they could never reach a contact.

Only name, email, phone, country and city were ever captured.

**Why the legacy form was replaced rather than patched:** it is a **v4 form**,
and `PATCH /marketing/v3/forms/{id}` returns `403 — The client is not
allowlisted to perform an operation to v4 forms`. It cannot be repaired via
this API. Every page therefore got its own API-created form instead, which is
also better for per-page conversion reporting.

### Current forms in the portal

| Form | GUID | Used by |
|---|---|---|
| Private & Tailormade Inquiry | `28e4e3e3-9a47-47a5-b3de-851981535664` | `private-tailormade/section-05-design-form.html` ✅ |
| Group Journey Inquiry | `c201e387-ca7b-4d73-9417-f060566bcf6a` | `for-groups/section-08-plan-form.html` ✅ |
| Founder's Circle Inquiry | `b3c06e8a-9bbc-44e1-bc67-00e35528b9b9` | `founders-circle-revamp/section-04-inquiry-form.html` ✅ |
| Homepage Popup Inquiry | `a9e947b4-cb2e-45da-b2c7-b83b4228dfb5` | `homepage-revamp/homepage-form-popup.html` ✅ |
| Signature Journey Inquiry | `71181d17-e836-43d6-aa6d-a46e73945504` | `signature-journey/section-08-form-popup.html` ✅ |
| Footer Newsletter Signup | `40d535ad-fc91-4831-8231-eddc05208624` | `shared/section-99-footer.html` ✅ |
| Contact Page Journey Inquiry | `1e38d41f-3e99-4605-94cc-9057857a4e82` | `contact/section-02-forms.html` (panel 1) ✅ |
| Contact Page General & Media Inquiry | `ffececd7-b401-43cb-8ee2-858b5d62892c` | `contact/section-02-forms.html` (panel 2) ✅ |
| Umoya Website Form Submissions | `cb87d460-…` | **Retired.** Lossy v4 form, no longer referenced by any source file. Leave in place for its historical submissions. |
| Inquiry Form (Founders Circle Page) | `643fb390-…` | **Nothing** — 3 fields only; abandoned. Left untouched. |
| `.elementor-form … converted (Aug 11 2026)` | `b51b9251-…` | Junk auto-capture of the footer newsletter by the HubSpot WP plugin |

✅ = every field verified to persist end-to-end via `hubspot-verify-forms.mjs`.

### Property mapping by source

| Page / source | MERGE2 | MERGE3 | MERGE6 |
|---|---|---|---|
| `founders_circle_page` | `country` | `city` | `party_size` |
| `homepage_popup` | `country` | `city` | `party_size` |
| `signature_journey_popup` | `country` | `city` | `party_size` |
| `contact_page_journey` | `country` | `city` | `party_size` |
| `contact_page_general` | `enquiry_type` | `organization` | — |
| `private_tailormade_page` | `trip_occasion` | — | `party_size` |
| `for_groups_page` | `group_type` | `organization` | `party_size` |

`MERGE1 → salutation`, `MERGE4 → preferred_travel_season`,
`MERGE5 → preferred_travel_year`, `MERGE7 → founders_circle_message`
on every source.

**MERGE6 is `party_size` everywhere**, including the three popups where it
used to point at `preferred_journey_length`. That select is literally
"How Many Guests Will Be Traveling?", and no history was lost by correcting
it because the old target never existed as a property, so it never held a
single value. `preferred_journey_length` now exists but is **unused** —
retained only as the fallback for any future form.

`contact_page_general` also sends no MERGE1/4/5 — it is a lean routing form
(full name, email, organisation, enquiry type, message). Its `enquiry_type`
is an **enumeration** created 2026-08-29, so its `<option>` values and the
property's options must be edited together or HubSpot rejects the value. It is
deliberately NOT required on the HubSpot form; see `contact/_NOTES.md` for why.

This table is implemented **twice** and the two must stay in step:
- browser side — `hubspotFieldMap` in each page's form `<script>`
- server side — `$source_aliases` in `class-submissions.php`
  (`tools/verify-alias-mapping.mjs` asserts the server side, including a
  regression guard for the untouched Founder's Circle mapping)

### ⚠ "failed" in Umoya Submissions on exactly two sources

*Diagnosed 2026-08-12 by replaying both payload shapes against the live forms.*

WordPress logged `failed` for **every** `for_groups_page` and
`private_tailormade_page` submission while `founders_circle_page`,
`homepage_popup` and `signature_journey_popup` all logged `sent`.

Reproduced verdicts:

```
For Groups → OLD plugin payload   400  Required field 'group_type' is missing
For Groups → NEW plugin payload   200  accepted
P&T        → OLD plugin payload   400  Required field 'trip_occasion' is missing
Founder's  → OLD plugin payload   200  accepted
```

**Cause.** The pages were re-pasted but **the plugin was not re-uploaded**, so
the browser sends `group_type` / `trip_occasion` while the server-side
`normalize_submission()` still maps `merge2 → country`. `group_type` and
`trip_occasion` are the only two **required** custom fields on any form, so
those two sources 400 and the other three pass.

Note the flow is WordPress-first: WordPress *saves* the lead, then forwards.
The save succeeds, so the browser never triggers its direct-to-HubSpot
fallback. **No lead was lost — they are all in Umoya Submissions**, they just
did not reach HubSpot.

**Fix:** re-upload `umoya-elementor-widgets.zip`.

> **If the upload fails with "Plugin file does not exist"** the zip was built
> with `Compress-Archive`, which writes backslash paths WordPress cannot read.
> Rebuild with `python tools/build-plugin-zip.py`. This is a **multisite**
> install, so activate from **Network Admin → Plugins → Network Activate**.
> If a mangled `wp-content/plugins/umoya-elementor-widgets/` folder is already
> there from a failed attempt, delete it before re-uploading.

**Recovering the already-failed rows:** a plain resend would *still* fail,
because those rows stored the group type under `_umoya_country` and left
`_umoya_group_type` empty. `get_submission_from_meta()` now re-normalises
from the untouched `_umoya_payload` instead of trusting meta, so
**Resend to HubSpot** works on them once the plugin is updated. Asserted by
the `for_groups_page` resend-recovery case in `verify-alias-mapping.mjs`.

### Why "Page views" and "Submissions / page view" are always 0

*Checked 2026-08-29 against the live portal.*

In **Marketing → Forms**, every Umoya form shows `0` page views and `0%`
submissions-per-page-view, while the **Form submissions** column is correct.
This is expected, not a misconfiguration.

HubSpot only counts a page view for a form it **renders itself** — through the
forms embed script (`js.hsforms.net/forms/embed/v2.js`) or on a HubSpot-hosted
page. Every Umoya form is hand-built HTML that merely *submits* to the Forms
API, so HubSpot never observes an impression and cannot compute a rate. The
"Appears on" column saying **"No HubSpot placements"** is HubSpot stating
exactly this. The occasional stray `1` is someone opening the form preview
inside HubSpot.

That is the direct consequence of the choice in the HubSpot Section 02
Integration Brief — keep the custom-designed form, submit behind the scenes,
do not drop in a generic embed. The submission counts are real; only the view
denominator is missing.

**Getting the conversion rate anyway (no code change).** The tracking script
IS installed, so *page* views are recorded per URL under
**Reports → Traffic Analytics → Pages**. Divide a form's submissions by the
page views of the URL it lives on. GA4 gives the same thing.

**Why not just re-enable form collection?** `collectedforms.js` does record
views and submissions for non-HubSpot forms — it is the only mechanism that
would populate these columns. But it files a **second, separate** form record
(`[captured] #ctPlanForm .ct-f-form`) beside the clean API form, splitting the
data across two objects. That is why every Umoya form carries
`data-hs-do-not-collect="true"`. Keep it that way; a split record is worse
than a missing denominator. There is no `_hsq` event for reporting a form
impression, so there is no third option short of replacing the forms with
HubSpot embeds.

**Submission counts include diagnostics.** `hubspot-verify-forms.mjs` submits
one payload per form. `hubspot-cleanup-tests.mjs` deletes the resulting
*contacts*, but HubSpot keeps the form *submission* records, so each verified
form carries one extra submission that was never a real lead.

### ⚠ /founders-circle/ is served without most plugin assets (UNRESOLVED)

*Established 2026-09-01. This supersedes the 2026-08-29 guess that it was
stale cache — it is not.*

`/founders-circle/` renders **freshly from PHP** (`x-litespeed-cache: miss`,
`cf-cache-status: MISS`, reproduced across several forced misses and with a
real browser User-Agent) and still comes back missing a large share of the
plugin JavaScript that comparable pages load.

| | `/founders-circle/` | `/contact/`, `/for-groups/`, `/` |
|---|---|---|
| `<script src>` tags | **18** | **47–48** |
| Elementor `frontend.min.js` | ✗ | ✓ |
| pro-elements | ✗ | ✓ |
| Contact Form 7 | ✗ | ✓ |
| jQuery UI (core, datepicker) | ✗ | ✓ |
| Stripe | ✗ | ✓ |
| `tevily-themer/main.min.js` | ✗ | ✓ |
| HubSpot WP plugin (`js-na2.hs-scripts.com/246097317.js`) | ✗ | ✓ |
| our `render_hubspot_tracking_code()` snippet | ✗ | ✓ |

What still works there: jQuery, the Tevily theme's own scripts, RevSlider,
`cookieadmin`, gtag — and **our Founder's Circle form**, because its script is
inline in the widget rather than enqueued. Form GUID `b3c06e8a` and
`/wp-json/umoya/v1/submissions` are both present in the rendered HTML.

**Ruled out:**
- *Stale cache* — forced `x-litespeed-cache: miss` every time.
- *User-Agent sniffing* — identical result with a Chrome UA.
- *`wp_footer` not running* — the page ends with `</body></html>` and the
  theme's own footer scripts print.
- *Our plugin being at fault* — `render_hubspot_tracking_code()` hooks
  `wp_footer` at priority 20 behind only an `is_admin()` guard, and it prints
  on every other page.

The page is Elementor Canvas (`body.elementor-template-canvas`,
`elementor-page-8402`), same template the homepage uses — and the homepage is
fine. So the template is not the discriminator.

**Most likely cause: a per-page asset-unload rule on post ID 8402** — Asset
CleanUp / Perfmatters / LiteSpeed page-specific JS exclusions, or similar.
With 52 plugins installed this is exactly the kind of thing that gets set once
and forgotten. **Check page 8402's asset settings in wp-admin first.**

**Why it matters:**
- No `hubspotutk` is set on that page, so submissions from the Founder's
  Circle form carry no visitor attribution, and HubSpot Traffic Analytics
  records no page view for the site's highest-intent URL.
- Elementor's frontend JS is absent, so any Elementor widget behaviour on
  that page (as opposed to our inline-scripted HTML widgets) is not running.
- Lead capture itself is NOT affected.

### ⚠ CookieYes is not actually installed yet

Also found 2026-09-01: `cdn-cookieyes.com` appears on **no** live page. The
cookie tool currently loading is `cookieadmin` + `cookieadmin-pro` (two
copies), which is what `class-console-cleanup.php` was written to quieten.

The footer routing doc states "You have already implemented CookieYes on the
site" — that is not the case on the live site today. The footer's
`Cookie Settings` button is built on CookieYes's `.cky-banner-element` trigger
per that doc, so it will not open a preference centre until CookieYes is
actually installed. It degrades safely in the meantime: the guard in
`shared/section-99-footer.html` checks for CookieYes **at click time** and
falls back to `/privacy/` when it is absent.

### "This submission didn't include an IP address"

*Diagnosed 2026-08-29 from a live test submission on the contact page.*

HubSpot shows this banner on a form submission whose `context.ipAddress` is
absent. It is an **analytics** warning, not data loss — every field still
lands on the contact; what HubSpot cannot do is derive `ip_city` /
`ip_country` or attribute the visit geographically.

There are two ways a submission arrives without one, and they need different
responses:

**1. The browser's direct-to-HubSpot fallback (by design, not fixable).**
When `/wp-json/umoya/v1/submissions` does not answer, every Umoya form falls
back to posting straight to the HubSpot Forms API. A browser cannot know its
own public IP, so that payload has none. On this origin — with its documented
522s and multi-second TTFB — this is the likely explanation for any one-off.

Tell them apart by looking for the lead in **Umoya Submissions**:

| In Umoya Submissions? | HubSpot column | What happened |
|---|---|---|
| Yes, `sent` | sent | went through WordPress — an IP *should* be present |
| Yes, `sent_direct_from_browser` | blue badge | fallback fired, backup flushed later |
| **Not there at all** | — | fallback fired and the backup is still queued in that browser's `localStorage`; it flushes on the visitor's next page view, within 3 days |

Do **not** try to back-fill the IP by resending such a row: the record is
already in HubSpot, and a resend would create a duplicate submission to gain
one analytics field.

**2. Resends and automatic retries (was a real bug — fixed 2026-08-29).**
`get_submission_from_meta()` rebuilt the submission without reading
`_umoya_ip_address`, so `send_to_hubspot()` read an undefined key. Every
**row-action resend, bulk resend and cron retry** therefore forwarded with no
IP — and emitted an `Undefined array key` warning each time, up to 20 attempts
per submission. `ip_address` is now read back from meta alongside
`page_uri` / `page_name` / `hutk`, so a resend carries the ORIGINAL
submitter's IP rather than nothing (and never the cron's).

`ipAddress` is now also run through `valid_ip()` — HubSpot would rather have
the key absent than malformed. It is deliberately **not** accepted from
`$payload['context']`: that arrives from the browser, and trusting it would
let a client write any IP it liked into form analytics.

`get_client_ip()` was already correct, and Cloudflare-aware
(`HTTP_CF_CONNECTING_IP` → `HTTP_X_FORWARDED_FOR` → `REMOTE_ADDR`) — without
that first header every lead would carry a Cloudflare edge IP instead of the
visitor's.

> Requires the rebuilt `umoya-elementor-widgets.zip` to be uploaded.

### ⚠ "I'd also like to receive Umoya journeys and stories by email" does nothing

*Traced end-to-end 2026-08-13/14. Not yet fixed — logged here as an open item.*

Every form's optional marketing checkbox (`MARKETING_CONSENT` on four forms,
inconsistently `marketingOptIn` on Private & Tailormade and For Groups) is
captured client-side into `rawFields.marketing_opt_in` — and then goes
nowhere. Traced the whole path with nothing assumed:

| Stage | Result |
|---|---|
| Browser sets `rawFields.marketing_opt_in` | ✅ captured |
| Present in any page's `hubspotFieldMap` | ❌ 0 of 6 forms — never sent to HubSpot |
| Referenced anywhere in `class-submissions.php` | ❌ zero occurrences |
| Saved as its own post meta | ❌ `save_submission_meta()` only loops the alias-table keys |
| Shown in the Umoya Submissions admin screen | ❌ not in the meta-box field list |
| Survives anywhere at all | ⚠️ only inside the raw `_umoya_payload` JSON blob |

So today: **no HubSpot list, no subscription, no property, no segmentable
record.** Nobody who ticks the box is added to anything, but — the reassuring
half — nobody is emailed who didn't ask to be, either. Nothing is leaking; the
gap is that consent is currently unrecoverable at scale (only visible by
opening one submission's raw JSON at a time), which is a weak record against
the POPIA consent-register requirement (Section 8) if it's ever challenged,
and there is no way to actually export "everyone who opted in" to mail them.

Related: the `legalConsentOptions.consentToProcess` sent to HubSpot on every
form carries the **processing** consent text, never the marketing wording —
and every form's HubSpot-side `legalConsentOptions` is `type: none` (matching
the pre-existing working form, deliberately — see the note in
`tools/hubspot-sync.mjs`), so HubSpot most likely discards that block anyway.

**Two ways to close this, not mutually exclusive:**

- **(A) Contact property, quick.** Create a `marketing_opt_in` HubSpot
  property, add it to all six `hubspotFieldMap`s and to the server alias
  table, unify the input name (pick one of `MARKETING_CONSENT` /
  `marketingOptIn`), surface it in the admin meta box. Gives a segmentable
  Yes/No and a visible record. Does **not** manage sends or unsubscribes.
- **(B) Real HubSpot subscription type, correct long-term.** Register a
  subscription (e.g. "Umoya Journeys & Stories") via the Communication
  Preferences API and set it on submit. This is what should actually govern
  a marketing send and gives working unsubscribe handling — which would also
  finally resolve the long-open `[INSERT_HUBSPOT_SUBSCRIPTION_PREFERENCES_URL]`
  placeholder (Section 9) and the footer's Email Opt-out link (Section 16).
  Needs `communication_preferences.read_write` added to the Private App —
  the current token got `403` probing
  `communication-preferences/v3/definitions` without it.

Recommendation: do (A) now so nothing further is lost and there is a visible
record, then (B) before the first real marketing send goes out.

### "Non-HubSpot / collected forms" — why submissions appear twice

HubSpot's tracking script (`js.hscollectedforms.net/collectedforms.js`, loaded
by `js.hs-scripts.com/246097317.js`) watches the DOM for **any** form submit
and files it as a **captured / non-HubSpot form**, independently of the clean
Forms-API call our JS makes. So one submission produced two records, and the
HubSpot UI surfaced the ugly captured one:

```
[captured]  #umoyaPopupForm .umoya-popup-form
[captured]  #fgPlanForm .fg-pl-form
[captured]  #footer_subscribers .elementor-form
[captured]  .elementor-form, .elementor-form-waiting
```

**Fix applied:** every Umoya form now carries `data-hs-do-not-collect="true"`.
This is not a guess — the live script was downloaded and read:

```js
Le = "hs-do-not-collect";
e = el.hasAttribute(Le) || el.hasAttribute(`data-${Le}`);
r = el.className.indexOf(Le) > -1;
return !e && !r && !n;   // true == collect this form
```

Presence of the attribute (any value) makes the collector skip the form. A
class containing `hs-do-not-collect` works too.

Belt-and-braces, and the only thing that stops the **Elementor** footer form
being captured until the new footer widget is deployed: turn off
**Settings → Tracking & Analytics → Tracking Code → Collect data from website
forms** (also exposed by the HubSpot WordPress plugin). Do this only AFTER
`shared/section-99-footer.html` is live, or newsletter signups stop being
recorded entirely.

The existing `[captured]` form entries are historical records — leave them;
deleting them would discard past submissions.

### Tooling

```powershell
node tools/hubspot-sync.mjs info                 # whoami / portal check
node tools/hubspot-sync.mjs list-forms           # inventory
node tools/hubspot-sync.mjs list-props           # property inventory + what's missing
node tools/hubspot-sync.mjs create-props         # the 8 contact properties
node tools/hubspot-sync.mjs create-forms         # the 5 inquiry forms
node tools/hubspot-sync.mjs create-newsletter-form
node tools/hubspot-inspect-form.mjs <formId>     # dump a form's real field definition
node tools/hubspot-find-props.mjs <keywords>     # search the 404-property schema
node tools/hubspot-verify-forms.mjs              # end-to-end: submit, read back, assert
node tools/hubspot-verify-forms.mjs contact      # ...just the forms whose label matches
node tools/verify-alias-mapping.mjs              # assert the PHP alias table
node tools/hubspot-cleanup-tests.mjs             # remove example.com diagnostic contacts
node tools/hubspot-diagnose-capture.mjs          # all forms by type + submission counts
node tools/hubspot-diagnose-failed.mjs           # reproduce the old-vs-new payload 400s
```

`repair-shared-form` also exists but **cannot succeed** — it is kept only to
document the 403 v4-forms limitation described above.

**Gotchas worth knowing before editing these:**
- A form field group may hold **at most 3 fields**; the API rejects more. The
  legacy form had 11 in one group, which is why it also could not be patched.
- Creating a form requires `createdAt`/`updatedAt` even though it is a POST.
- `displayOptions.theme` must be one of
  `default_style | linear | canvas | legacy | sharp | round`.

`create-props` / `create-forms` are idempotent — they skip anything that
already exists rather than duplicating it. Diagnostic submissions always use
RFC-2606 `@example.com` addresses so they can never reach a real inbox.
