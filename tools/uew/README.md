# `tools/uew` — the Umoya Elementor widget compiler

Turns each section HTML file into a native Elementor widget, and proves the
conversion lost nothing.

This replaces `tools/build-elementor-widgets.mjs` for the Founder's Circle
sections. That generator rewrote markup with regular expressions and had no way
to check its own work, which is why sections came back from the editor with
pieces missing.

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
| Read the stylesheet | `lib/css.mjs` | design tokens, flex/grid detection, inline-style splitting |
| Decide what is editable | `lib/derive.mjs` | content fields, repeaters, style parts |
| Write the plugin files | `lib/emit.mjs` | PHP template, section CSS/JS, widget class, schema |
| Orchestrate & verify | `build.mjs` | plus the byte-fidelity assertion |

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

**PHP's built-in server is single-threaded.** On Windows it refuses new
connections once its backlog fills, and one Elementor page — ~48 scripts and
stylesheets — can do that by itself. It shows up as a one-off
`ERR_CONNECTION_REFUSED` partway through a run, not as a real failure, so both
browser checks retry a refused navigation. If a whole run dies, restart the
server and run it again rather than hunting for a widget bug.

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
