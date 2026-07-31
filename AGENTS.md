# AGENTS.md — Umoya Afrika Tours

Instructions for **any** AI coding tool working in this repository. The full
project handoff lives in **[CLAUDE.md](./CLAUDE.md)** — read it before making
changes. This file surfaces conventions that apply regardless of which tool is
used, so they are not missed by tools that don't read `CLAUDE.md`.

---

## Image Link Shorthand (prompt convention)

The user references images in prompts by a **short filename only**, to avoid
retyping long URLs. **Expand every short reference to the full URL** before
writing it into any `src`, `poster`, `background-image`, `href`, or `<source>`.

**Rule** — a bare filename `NAME.ext` means:

```
https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/umoya_compressed_NAME.ext
```

i.e. prepend the fixed base directory
`https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/`
and the fixed filename prefix `umoya_compressed_`.

**Examples**

| Prompt says | Use in code |
|---|---|
| `XXXX.jpg` | `https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/umoya_compressed_XXXX.jpg` |
| `ABCD.png` | `https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/umoya_compressed_ABCD.png` |
| `img6406.jpg` | `https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/umoya_compressed_img6406.jpg` |

**Edge cases**

- Applies **only** to bare filenames (no `http`, no `/`). Full URLs / paths are used exactly as given.
- Keep the extension exactly as written — `.jpg` and `.jpeg` are **different files** on the server; never swap them.
- Default prefix is `umoya_compressed_`. A few older assets in the same folder use the shorter `compressed_` prefix (e.g. `compressed_dsc05243.jpg`); if the `umoya_compressed_` URL 404s, that is the fallback to try.
- The optimized-asset folder is fixed at `2026/optimized/`. Legacy assets (`2025/10/`, `2025/12/`, …) are referenced by their full URLs, not this shorthand.

---

## Where things live

| Path | Role |
|---|---|
| `CLAUDE.md` | Source-of-truth project handoff — read first. |
| `founders-circle-revamp/section-*.html` | Founder's Circle revamp sections (current). |
| `homepage-revamp/homepage-section-*.html` | Homepage revamp sections (current). |
| `umoya-elementor-widgets/` | Custom Elementor plugin (widgets + HubSpot/WordPress submission backend). |
| `Old files/` | Superseded; do not treat as current source. |

## Working rules (see CLAUDE.md for the full set)

- Section `*.html` files are pasted into Elementor HTML widgets; keep CSS/JS
  scoped to each section's root ID so sections can't override one another.
- Use `font-family: inherit` (fonts come from the theme); use only the brand
  color tokens defined in `CLAUDE.md`.
- Do **not** use blanket `git add .` — the worktree carries unrelated
  QA/screenshot/browser-profile artifacts. Stage only intended files.
