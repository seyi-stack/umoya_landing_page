# `tools/uew` — the Umoya Elementor widget compiler

Turns each section HTML file into a native Elementor widget, and proves the
conversion lost nothing.

It compiles **33 sections** across three Elementor categories: twelve Founder's
Circle from `founders-circle-revamp/`, thirteen homepage from
`homepage-revamp/`, and eight Signature Journey from `signature-journey/`.
Registries live in `sections/`, one file per page family, and each declares its
own category — the build emits `categories.json`, so adding a page family needs
no PHP change.

A registry lists what should **ship**, not what is on disk. The Signature
Journey folder has nine section files and eight entries: `section-07-cta.html`
was removed at the client's request and is kept only for history. Read the
page's `_NOTES.md` before adding entries.

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

# Compile the sections into the plugin (fails if fidelity is lost)
node tools/uew/build.mjs
node tools/uew/build.mjs --only=fc_hero,fc_form

# Render every section through real Elementor and diff against the source
node tools/uew/render-check.mjs

# Compare each widget against the same section pasted into an HTML widget
node tools/uew/browser-check.mjs
node tools/uew/browser-check.mjs --shots      # also writes screenshots

# Open every section in the real Elementor editor and check it is usable
node tools/uew/editor-check.mjs

# All four, in order
npm --prefix tools/uew run check
```

The harness lives in `local-env/` and is git-ignored: portable PHP 8.2,
WordPress on SQLite, Elementor pinned to **4.2.4** — the version the live site
runs. No MySQL, no Docker, no admin rights, nothing installed system-wide.
`umoya-elementor-widgets/` is linked into it, so edits are live.

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

### Three rules the compiler keeps

1. **Styling never touches markup.** Every style control is an Elementor
   `selectors` entry. The section's own stylesheet stays the baseline; controls
   layer CSS on top of it. An empty control means "leave the stylesheet alone".

2. **No style control carries a default read out of the CSS.** Seeding
   `font-size: 0.75rem` from a desktop rule would emit un-mediaqueried CSS at
   higher specificity and silently defeat the section's own 768px override.
   Content controls do carry defaults — those are literal text.

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
"fully editable" only counts if the panel still opens promptly.

---

## Traps worth knowing

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
`ERR_CONNECTION_REFUSED` partway through a run, not as a real failure, so both
browser checks retry a refused navigation. If a whole run dies, restart the
server and run it again rather than hunting for a widget bug.

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

1. Edit the section HTML in `founders-circle-revamp/`.
2. `node tools/uew/build.mjs`
3. `npm --prefix tools/uew run check` (build + all three checks)
4. `python tools/build-plugin-zip.py` — never `Compress-Archive`, which writes
   backslash paths WordPress cannot install.

Run the checks with nothing else heavy on the machine. Two browser checks at
once will fight for the single-threaded PHP server and produce failures that
say more about the harness than the widgets.

To register a new section, add an entry to `sections/founders-circle.mjs`. A
section entry may carry a `spec`:

```js
spec: {
    noRepeat: [ 'div.fc-f2-field' ],   // keep these as individual style parts
    hideParts: [ '.fc-decorative' ],   // no style panel for these
    overrides: {
        '.fc-h1-title': { label: 'Headline', features: [ 'typography', 'spacing' ] },
    },
}
```

`noRepeat` is rarely needed, because the compiler already refuses a repeater
whose rows would collapse into raw markup: if the divergent subtree exceeds 600
characters on any row, the run is rejected and its items stay individual style
panels. That is what keeps the inquiry form's six field rows separate — one of
them holds a 200-option country list, which has no business inside a textarea.
Reach for `noRepeat` when a run is small enough to pass that guard but should
still not be repeatable.
