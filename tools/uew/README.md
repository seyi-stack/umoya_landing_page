# `tools/uew` — the Umoya Elementor widget compiler

Turns each section HTML file into a native Elementor widget, proves the
conversion lost nothing, and proves every control it offers actually works.

It compiles **63 sections** across eight Elementor categories:

| Category | Registry | Source folder | Widgets |
|---|---|---|---|
| Umoya - Site-wide | `sections/site.mjs` | `shared/` | 6 — nav, footer, 404, Travel Essentials, Privacy, Cookie |
| Umoya - Founder's Circle | `sections/founders-circle.mjs` | `founders-circle-revamp/` | 12 |
| Umoya - Homepage | `sections/homepage.mjs` | `homepage-revamp/` | 13 |
| Umoya - Signature Journey | `sections/signature-journey.mjs` | `signature-journey/` | 8 |
| Umoya - Private & Tailormade | `sections/private-tailormade.mjs` | `private-tailormade/` | 5 |
| Umoya - About Us | `sections/about.mjs` | `about/` | 8 |
| Umoya - For Groups | `sections/for-groups.mjs` | `for-groups/` | 8 |
| Umoya - Contact | `sections/contact.mjs` | `contact/` | 3 |

`sections/index.mjs` lists the families in the order their categories appear in
Elementor's panel. Each registry declares its own category; the build emits
`categories.json`, so adding a page family is a registry file and a line in
`index.mjs`, never a PHP change. The build refuses two sections sharing a key,
widget name or class name.

A registry lists what should **ship**, not what is on disk. Deliberately not
compiled, each for a documented reason:

- `signature-journey/section-07-cta.html` — removed from the page at the client's request.
- `shared/page-email-preferences.html` — superseded by the footer's opt-out popup; kept unpublished.
- `shared/color-scheme-lock.html` — not a section (a style block and a script, no element).
- `shared/section-00-nav - backup.html` — a backup copy.

Read the page's `_NOTES.md` before adding entries.

It replaced `tools/build-elementor-widgets.mjs`, now deleted. That generator
rewrote markup with regular expressions and had no way to check its own work,
which is why sections came back from the editor with pieces missing. It also
read the superseded `founders-circle/` and `homepage/` folders, so re-running it
reverted months of work.

---

## Commands

```powershell
# One-time: build the local WordPress + Elementor harness in local-env/
node tools/uew/setup-local-env.mjs

# Start it (leave running in its own terminal)
node tools/uew/setup-local-env.mjs --serve

# Build the whole site on it for testing by hand: 11 pages at their live
# slugs, every widget once, homepage as the front page. Re-run to reset them.
node tools/uew/make-site.mjs

# Compile the sections into the plugin (fails if fidelity is lost)
node tools/uew/build.mjs
node tools/uew/build.mjs --only=fc_hero,fc_form

# Change every control and list, and check where each change lands (no server)
node tools/uew/edit-check.mjs

# Render every section through real Elementor and diff against the source
node tools/uew/render-check.mjs

# Set every style panel, token and row colour, read them back in a browser
node tools/uew/control-check.mjs

# Lengthen and shorten every list, click through every control, watch for errors
node tools/uew/behaviour-check.mjs

# Compare each widget against the same section pasted into an HTML widget
node tools/uew/browser-check.mjs
node tools/uew/browser-check.mjs --shots      # also writes screenshots

# Open every section in the real Elementor editor, edit it live, check it is usable
node tools/uew/editor-check.mjs

# All seven, in order -- cheapest and most fundamental first
npm --prefix tools/uew run check
```

Every check takes `--only=key,key`. All but the build and the edit check need
the harness server running.

The harness lives in `local-env/` and is git-ignored: portable PHP 8.2 with
OPcache, WordPress on SQLite, Elementor pinned to **4.2.4** — the version the
live site runs. No MySQL, no Docker, no admin rights, nothing installed
system-wide. `umoya-elementor-widgets/` is linked into it, so edits are live.
OPcache matters: without it every request recompiled WordPress and Elementor,
and a page took 4.4 s instead of 1.3 s.

Admin: <http://127.0.0.1:8765/wp-admin/> — `admin` / `admin`.

---

## How the compilation works

The template **is** the section file. `lib/html.mjs` parses it with parse5 and
keeps every node's byte offsets in the original source, so rewriting is a set of
offset-anchored splices. Whatever we do not deliberately replace is copied
through byte for byte: comments, entities, SVG, whitespace, attribute order.

| Stage | File | What it does |
|---|---|---|
| Parse & locate | `lib/html.mjs` | parse5 wrapper, a small CSS-selector subset, non-overlapping splices |
| Separate markup from assets | `lib/split.mjs` | shared by the build and the render check, so they cannot disagree |
| Read the stylesheet | `lib/css.mjs` | design tokens, flex/grid detection, inline-style splitting |
| Decide what is editable | `lib/derive.mjs` | content fields, repeaters, style parts |
| Write the plugin files | `lib/emit.mjs` | PHP template, section CSS/JS, widget class, schema |
| Orchestrate & verify | `build.mjs` | plus the byte-fidelity assertion |
| Test pages | `lib/pages.php`, `make-test-pages.php`, `make-pages.php` | Elementor pages per section, raw-HTML references, and pages with explicit control values |
| Browser plumbing | `lib/browser.mjs` | Chrome, CDN stubs, connection retries, settling — shared by every browser check |

### Which element is the root

A section file can have more than one top-level element — the homepage journey
section is preceded by a bare `<span id="umoya-journey-anchor">` scroll target.
The root is the top-level element with the **most descendants**, not the first
one: taking the first made that anchor the styling root and pointed every style
selector at an empty span. Anything outside the root is styled from the widget
wrapper instead, and the build reports when a section has more than one.

### How things get named

Panels are named the way Elementor names its own — **Header**, **Title**,
**Icon**, **Content** — not after whatever class happens to be on the element.
`lib/derive.mjs` maps class stems and tags onto that vocabulary, then makes each
name unique using the shortest form that still distinguishes it: the bare role,
then the parent's role in front of it (`Header Title`), then a number. Generic
ancestors — Container, Column, Wrapper, Section, Content — are never used as a
prefix, because `Container Title` says no more than `Title`.

Control labels are the property alone (`Poster`, `Alt Text`, `Link`, `Preload`);
the panel already says which element they belong to. Inside each panel the
controls are grouped under headings — Typography, Background & Border, Spacing,
Size, Effects, States — as Elementor's Accordion widget separates *Title* from
*Icon*.

The copy preview that used to be appended to a panel header now sits **inside**
the panel as a quiet descriptor line, so the panel list stays scannable and two
`Title` panels are still tellable apart.

Lists are named for what they hold, pluralised: Slides, Cards, **Steps**,
**Offers** — and a run of paragraphs is **Paragraphs**, not "Texts".

**Content-tab panels fold together only within one region.** One panel per
element would make a Content tab of forty one-field panels, so a single-control
panel folds into the panel before it — but only when it sits in the same region
(its nearest named ancestor is the same) or inside an element that panel already
holds. The merged panel takes that region's name, or **Content** when the
region is unnamed. Folding across regions is what used to name the panel after
the wrong one: eight heroes kept their headline and button in a panel called
"Background" or "Logo", because the title happened to follow the video or the
logo in the markup. A panel that only took in what sits inside its own first
element — a Button and its Label — keeps that element's name. Control ids do
not depend on any of this, so regrouping panels never loses a saved value.

**A link is typed; an image is chosen.** `src` becomes an image picker only on
an image. A video file, a `<source>`, and whatever an `<iframe>` loads get a
plain link field: the homepage film is a YouTube embed, and a Media Library
picker left no way to paste a new film's address at all.

### Native options, not raw attributes

Boolean attributes carry no value, so an attribute-by-value binding cannot see
them — which is why the hero's video had no autoplay, mute or loop control at
all. Each is bound as a switcher named the way Elementor's Video widget names
it (**Autoplay**, **Mute**, **Play On Mobile**, **Loop**, **Player Controls**),
and a flag the element *supports but does not currently carry* is offered too,
defaulting to off so the markup is unchanged until someone switches it on.
`FLAGS_BY_TAG` in `lib/derive.mjs` holds the vocabulary.

The switcher stores the whitespace that preceded the attribute in the source,
not a plain space: the hero's `<video>` puts every attribute on its own line,
and assuming a space would fold them together.

Attributes with a fixed set of legal values (`preload`, `loading`, `target`,
`method`…) become dropdowns rather than free-text boxes.

### Dialogs that move themselves to `<body>` (portals)

Every style control is scoped under the widget wrapper (`{{WRAPPER}}`). The
inquiry popups and the footer's opt-out dialog append themselves to `<body>` —
a `position: fixed` element inside a transformed ancestor is positioned against
that ancestor — and so leave the wrapper behind. Until 4.0.0 the popups' entire
Style tab did nothing at all, without a single error.

A section whose script moves something to `<body>` must declare it:

```js
spec: { portals: [ { selector: '#umoya-form-popup', trigger: '[data-umoya-form-popup]' } ] },
```

The build **refuses** to compile a section whose script calls
`document.body.appendChild()` without one. For each portal the template prints
`data-uew-for="<element id>"` on the element (nothing, in the fidelity check),
and every selector that starts at it gains a second branch,
`#id[data-uew-for="{{ID}}"]…`, which Elementor fills with the same id on the
page and in the editor. The attribute is repeated three times so the branch
carries exactly the wrapper branch's specificity. Tokens, per-row colours and
Custom CSS (`{{ID}}` works there too) follow the same rule.

In the editor every control change re-renders the widget, bringing a fresh copy
of the dialog while the old one is still in `<body>` with the old listeners. The
emitted script retires stale copies (hidden, id removed) before the section
script runs again, so a trigger opens one dialog, not two.

### Lists (repeaters)

A run of sibling items becomes an Elementor repeater — add, remove, reorder —
only when it can be proved to round-trip, as before. What counts as a list, and
how its rows stay correct when edited:

- **Position classes are not identity.** Items are grouped by their identifying
  classes; `fc-ss-on` (the active slide), `d2` (a stagger delay), `is-ghost`
  are rebuilt from the row's *position*: whichever row is first is the active
  one, delays follow position, and "Add Item" never copies row 1's active
  state. Rules: *first* (row 1 differs, the rest agree) or a *table* repeating
  with the list. The same applies to `aria-selected`, `aria-current`,
  `aria-expanded`, `tabindex` and to column-aligned whitespace between
  attributes. Any class difference that is not a position class rejects the
  list.
- **Counters follow position.** `fc-det-btn-3`…`-6`, `data-fci="0"`, "Slide 2"
  become expressions on `_uew_n`, from any starting number; a stated total
  ("2 of 5") becomes `_uew_count`. Both come from the loop, never from stored
  data, so ids stay unique and totals right however rows change.
- **Parallel lists are one repeater.** A slideshow's slides and its dots — or
  the homepage journey's images, captions and dots — are merged into a single
  repeater that renders in each place (`loops` in the schema), so a row is
  always a slide *and* its dot. Separate lists let an editor add a slide with no
  dot, and the Founder's Circle slideshow, which indexes its dots by slide
  number, threw on it.
- **Form fields are not a list.** A run whose items are or contain a named
  `input`/`select`/`textarea` stays individually editable: each field's `name`
  is a contract with the submission script and the CRM alias table, and "Add
  Item" would post a second `FNAME`. Option lists are lists, with a panel notice
  that each option's value is what is submitted (and a sharper one, from
  `spec.optionNotices`, where a HubSpot dropdown must match exactly).
- **Different behaviour hooks, different controls.** Items carrying different
  `data-*` attribute names (`data-wtt-prev` / `data-wtt-next`) are not a list.
- **Late attributes and notes.** An attribute only a later item carries (one
  photo's framing `style`, the brochure link's `target`/`rel`) gets a slot in
  the row template; a source comment only one item carries (which photo is the
  approved one) is the row's own, so it travels with its card. Comments are not
  part of an item's shape — counting them once turned six host photos into one
  raw HTML box.
- **What a row shows.** Wiring (role, ids, aria state, viewBox, lazy-loading)
  is kept per row but hidden. Content is labelled the way Elementor's widgets
  label it: "Choose Image", "Alt Text", "Link", a link's or button's own
  "Text", and the element's class where its role says little ("Role",
  "Description"). A `url()` in a row's style attribute is an image picker. A
  row is titled by its visible text, else its alt text.

### Photos painted from the stylesheet

A real photo set in the section's CSS (`background: url(…)`, not a data-URI
texture) gets a **Background Image** control aimed at that exact rule,
pseudo-element included, filed under the element it paints. The Our Approach
video poster lives on `.fc-vid-ph::before`, so before this it could not be
changed at all — a Style-tab background on the button sits behind it.

The control writes back **every image layer** of the declaration with only the
photo replaced (`css_value` in the schema). The 404 paints
`radial-gradient(…), url(photo)` in one declaration; a first version wrote the
photo alone, which silently dropped the brown overlay that keeps the 404's copy
legible. The browser check caught it, and the control check now asserts that a
swapped photo keeps its overlay.

### Which CSS applies to which element

Layout controls (Flex, Grid) and animation handling depend on the rules that
apply to an element. Those are found by matching every stylesheet rule against
the section with the compiler's own selector engine — not by comparing selector
strings, which missed every rule not written from the root (`.fc-h1-brand`
rather than `#fc-hero .fc-h1-brand`) and withheld layout controls from 65 flex
and grid containers in the original 33 widgets.

An element whose own keyframe animation drives its opacity (the heroes' fade-up,
`fill-mode: both`) holds the last frame for good, and an animated value beats
any normal declaration. Its Opacity control writes `!important` — the only thing
that outranks an animation — and says so: "a value here replaces that fade".

### Escaping by context

`Value_Formatter` escapes each value for where it is printed. Unchanged values
the compiler produced are trusted and printed as written; anything an editor
changed is filtered unless they hold `unfiltered_html` (on this multisite, only
super admins).

| Context | Escape | Why |
|---|---|---|
| Element content | `post` — `wp_kses_post` | keeps `<em>`, `<strong>`, entities |
| Attribute value | `attr` / `url` | `esc_attr` / `esc_url` |
| Optional attribute in a start tag | `attrs` | rebuilt as clean `name="value"` pairs; `" onmouseover="…` has no tag in it and would sail through kses |
| Inside a comment | `comment` | cannot close the comment early |
| Markup (an icon's `<svg>`) | `raw` | `wp_kses` with the post list **plus SVG**, which kses would otherwise strip |
| Whitespace and comments between elements | `trivia` | reduced to whitespace if edited |
| URL inside a quoted CSS `url()` | `cssurl` | quotes percent-encoded so it cannot end the CSS string |

### Three rules the compiler keeps

1. **Styling never touches markup.** Every style control is an Elementor
   `selectors` entry. The section's own stylesheet stays the baseline; controls
   layer CSS on top of it. An empty control means "leave the stylesheet alone".

2. **No style control carries a default read out of the CSS.** Seeding
   `font-size: 0.75rem` from a desktop rule would emit un-mediaqueried CSS at
   higher specificity and silently defeat the section's own 768px override.
   Content controls do carry defaults — those are literal text. The one
   deliberate exception is a stylesheet photo's Background Image: its default is
   the stylesheet's own URL (so the editor sees the current picture) and writes
   the same image the rule already does — unless a media query swaps the image,
   in which case it starts empty.

3. **A repeater must prove itself.** Every item is re-rendered from its own
   extracted values and compared byte for byte with the original. An item that
   does not reproduce is rejected and the run stays flat markup. The build
   prints the reason.

---

## What the checks actually prove

**`build.mjs`** renders each template with its own defaults, in real PHP with
WordPress loaded — so `wp_kses_post`, `esc_attr` and `esc_url` are the functions
that will run in production — and asserts the output equals the section file.

A run reported as `OK (entity-normalised)` differs only in entity spelling:
`esc_attr` writes a literal `'` as `&#039;`. Browsers cannot tell those apart.
Structural loss still fails.

**`render-check.mjs`** builds a real Elementor page per section, fetches it over
HTTP, and compares the served section node-by-node with the source file. It also
asserts the section's CSS and JS are enqueued.

**`browser-check.mjs`** is the one that answers the original complaint. For each
section it opens two pages in the harness:

- `/uew-<section>/` — the compiled widget
- `/uew-<section>-raw/` — the identical section pasted into Elementor's own HTML
  widget, which is how every Umoya page is built today

and compares geometry and ~30 computed properties for every element at 1440,
768 and 390 px, plus console errors and whether the section's own JavaScript
ran. Markup can survive a conversion while the behaviour attached to it quietly
does not; this is what catches that.

External assets are stubbed with fixed responses, for two reasons: the live CDN
is intermittently unreachable, and several sections *react* to media — the hero
reveals its video once `play()` resolves. Letting one page load a photo the
other did not shifts every element after it and reports a difference that is not
there.

**`editor-check.mjs`** opens each section in the real Elementor editor and
asserts the canvas rendered it, its script initialised there (`data-uew-ready`),
selecting it opens its panel, and nothing threw. A section can look perfect on
the published page and be a dead husk in the editor, because widgets are
injected into the canvas long after DOMContentLoaded. It also times the panel:
"fully editable" only counts if the panel still opens promptly. Then it **edits
live**: it changes a text control through Elementor's own command, waits for the
canvas to show the new text with the section script initialised again on the
fresh markup, and — for a section with a portal — that exactly one live copy of
the dialog remains.

The four checks above all prove a widget's *defaults*. These three prove its
*controls*:

**`edit-check.mjs`** (no server) renders each widget through Elementor's real
code path once per control: every text, URL, image, dropdown option, switcher
and inline-style control is set to a probe, which must reach the markup, and
putting the default back must restore the default render byte for byte — so the
control changes its own spot and nothing else. Every list is saved as-is, a row
removed, a row added exactly as "Add Item" fills it (no duplicated ids, no copied
"active" state), reversed and emptied. Then hostile input goes into every field
at once — script tags, event handlers, `javascript:` URLs, a comment breakout —
and none may survive. Any PHP notice fails it.

**`control-check.mjs`** sets a different value on every style panel's Opacity,
every design token and every list's first-row colour, all at once, then reads
the computed styles back in a browser **after** the section's script has run and
any dialog has been opened (and so moved to `<body>`). A panel whose selector
matches nothing, or whose value never arrives, is named. Values that lose to an
inline `style` attribute are noted, not failed: those properties have their own
Inline Styles panel. Stylesheet photos are checked on their pseudo-element.

**`behaviour-check.mjs`** gives every list one more row (as "Add Item" would),
then one fewer, and on each page clicks through every arrow, dot, tab and
accordion trigger — buttons only, never links or submits — lets auto-advancing
slideshows turn, and fails on any page error. It also checks that each merged
list still renders the same number of items in every place.

---

## Traps worth knowing

**The harness's forms still talk to the real HubSpot portal.** Its
`wp-config.php` sets `WP_HTTP_BLOCK_EXTERNAL`, so WordPress cannot forward a
submission — but the browser is not blocked. Submitting a form pushes the typed
email to HubSpot's tracking script (`identify` + `trackPageView`), and if the
local save fails the form falls back to posting straight to the HubSpot form.
Test with `@example.com` addresses and clear them afterwards with
`node tools/hubspot-cleanup-tests.mjs`.

**A Windows file lock can stop the build.** `Error: UNKNOWN … open
'…\includes\sections\<key>.json'` (errno -4094) means another process held the
file for a moment. Nothing is half-written — the write never opened — but the
sections after it were not re-verified. Re-run the build on its own.

**PHP eats the newline after `?>`.** An echo at the end of a line would swallow
its own line break, closing tags would ride up, and the rendered markup would
stop matching the source. `guardPhpNewlines()` in `lib/emit.mjs` moves that
whitespace inside the PHP block. It captures the *whole* run of line breaks and
indentation — taking only the first leaves a second one for PHP to eat, which
costs a blank line.

**A regex must never be used to find `<style>` or `<script>`.** It cannot tell a
real tag from one named inside a comment, which is how the footer's opt-out
popup was destroyed (CLAUDE.md phase 21). `splitSection()` uses parser-reported
offsets.

**A failure is only believed if it reproduces — in both browser checks.**
Booting 33 editors in a row against a single-threaded PHP server drops the
occasional script, which surfaces as `wp is not defined` and an empty canvas.
That is a WordPress bootstrap race, not a widget fault: the section that failed
in the crowd passed twice in isolation immediately afterwards. `editor-check`
now re-inspects a failing section once and marks a recovered one
`[passed on retry]`.

**A geometry difference is only believed if it reproduces.** The browser check
measures a live browser against a single-threaded PHP server; images and fonts
settle at slightly different moments on the two pages, and a few pixels of drift
on centred text follows. Every difference chased this way vanished on a second
look — the same section differed on one run and was identical on the next. So a
difference is re-measured before being reported, and one that does not survive
is named as unstable rather than failed. Without that the check cries wolf, and
a check that cries wolf gets ignored.

**PHP's built-in server is single-threaded.** On Windows it refuses new
connections once its backlog fills, and one Elementor page — ~48 scripts and
stylesheets — can do that by itself. It shows up as a one-off
`ERR_CONNECTION_REFUSED` partway through a run, not as a real failure, so the
browser checks retry a refused navigation. If a whole run dies, restart the
server and run it again rather than hunting for a widget bug.

**Chrome or the server can die under a run** — the machine sleeping did both
once, and the browser check crashed with `Target closed`. The browser check now
takes such a section again on a fresh browser, and the editor check relaunches
and logs in again. A server that has died answers nothing at all: check
`curl http://localhost:8765/` before believing a wall of failures.

**A shell `tail` hides the exit code.** `node check.mjs > log; tail log` exits
with `tail`'s status. Read the log's last line, not the exit code.

**The harness makes no outbound HTTP** (`WP_HTTP_BLOCK_EXTERNAL`). After a
server restart the first admin page rebuilt WordPress's and Elementor's caches
from their remote APIs, and on a single-threaded server those calls blocked long
enough for the editor check's login to time out. Nothing the checks render needs
the internet; the browser checks stub the CDN on the browser side too.

**`--only` merges into the manifest, it does not replace it.**
`includes/sections/index.json` *is* the registry: a key missing from it is a
widget WordPress will not register. An early version of `build.mjs` wrote only
the sections it had just built, which silently unregistered the other eleven and
looked exactly like the widgets had broken.

**Some sections put `<style>` INSIDE the section root.** The homepage ones do.
A check that reads the raw section file therefore counts the stylesheet as
markup and reports every one of them as having lost content. `lib/split.mjs`
exists so the build and the render check separate markup from assets the same
way; neither reads the raw file directly.

**Elementor caches each element's rendered HTML in post meta**
(`Document::CACHE_META_KEY`, on by default). A page will happily keep serving
markup produced by the *previous* version of a widget, so a check measures stale
output and a deploy looks like it did nothing. `make-test-pages.php` disables
element caching in the harness and clears the meta on every rebuild. **On the
live site, purge Elementor's cache after re-uploading the plugin** —
Elementor → Tools → Regenerate CSS & Data.

---

## Adding or changing a section

1. Edit the section HTML in its folder (the table at the top says which).
2. `node tools/uew/build.mjs`
3. `npm --prefix tools/uew run check` — build and all seven checks
4. `python tools/build-plugin-zip.py` — never `Compress-Archive`, which writes
   backslash paths WordPress cannot install. The script also refuses a zip in
   which a registered widget is missing any of its files.

Run the checks with nothing else heavy on the machine. Two browser checks at
once will fight for the single-threaded PHP server and produce failures that
say more about the harness than the widgets.

To register a new section, add an entry to its family's registry in
`sections/`; a new family is a new registry file plus a line in
`sections/index.mjs`. A section entry may carry a `spec`:

```js
spec: {
    // Elements the section's script moves to <body>. Required whenever it does.
    portals: [ { selector: '#umoya-form-popup', trigger: '[data-umoya-form-popup]' } ],
    // Extra panel notice on a <select>'s option list, keyed by #id or name.
    optionNotices: { '#ptOccasion': 'These values must match HubSpot…' },
    noRepeat: [ 'div.fc-f2-field' ],   // keep these as individual style parts
    hideParts: [ '.fc-decorative' ],   // no style panel for these
    overrides: {
        '.fc-h1-title': { label: 'Headline', features: [ 'typography', 'spacing' ] },
    },
}
```

`noRepeat` is rarely needed. The compiler already refuses a repeater whose rows
would collapse into raw markup (a divergent subtree over 600 characters on any
row), whose items are form fields, or whose items carry different behaviour
hooks; it prints the reason for every list it turns down.
