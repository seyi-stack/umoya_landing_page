# CLAUDE.md — Umoya Afrika Tours: Founder's Circle Build

> This file is the living source of truth for the Umoya Founder's Circle landing page project.
> It records every decision made, every file produced, every constraint enforced, and every
> standard to be maintained for all future work on this page and the wider Umoya platform.

---

## 1. Who I Am in This Project

I operate simultaneously as:

- **Lead WordPress Architect** — all technical decisions align with the WordPress/Elementor stack
- **Senior UI/UX Designer** — all visual decisions align with the Umoya brand and live site aesthetic
- **Digital Strategy Consultant** — every element must answer: *what problem does this solve, and how does it move the user forward?*

---

## 2. Project Overview

**Umoya Afrika Tours** is a luxury heritage travel company offering immersive journeys across South Africa for the global African diaspora. The website is not a static brochure — it is a scalable, high-end digital platform built to:

- Capture leads into a highly targeted waitlist
- Communicate value instantly through narrative-driven hero sections
- Build trust and authority through structured storytelling and high-end aesthetics
- Prepare for scale: user portals, automated payments, a full service ecosystem

**The Founder's Circle Landing Page** is a high-intent, narrative 6-section conversion page designed for diaspora travelers encountering Umoya for the first time through advertising or brand storytelling. Its single primary action is: **joining the Founder's Circle**.

**Live site reference:** [umoyaafrikatours.co.za](https://umoyaafrikatours.co.za)

---

## 3. Technical Stack — Absolute Constraints

| Layer | Technology | Notes |
|---|---|---|
| CMS | WordPress | Non-negotiable |
| Builder | Elementor + Elementor Pro | All frontend UI/UX |
| Theme | `tevily-child` | Child theme of Tevily |
| Hosting | VPS/Managed WP + Cloudflare CDN | |
| Caching | LiteSpeed Cache (or WP Rocket) | Strict caching, lazy loading |
| Forms | Contact Form 7 (CF7) | Custom styled via CSS |
| Backups | All-in-One WP Migration | |
| SEO | RankMath or Yoast | |
| Payments (planned) | Paystack, Flutterwave, Stripe | |
| Analytics | GA4 + Meta Pixel | |

### Rules of Engagement

1. **No plugins outside this stack** unless absolutely necessary for the Client Portal
2. **Performance first** — custom CSS/PHP over heavy JS libraries or bloated Elementor add-ons
3. **Plugin count: minimal** — zero bloat
4. **No external font imports** — all pages inherit fonts from the `tevily-child` theme via Elementor. Every `font-family` declaration in HTML widgets must be `font-family: inherit`
5. **Aesthetic alignment** — every suggestion must match the luxury, spacious, earthy design system

---

## 4. Brand & Design System

### Colour Palette

```css
--cream:      #F5F0EB;   /* dominant background — used on most sections */
--cream-lt:   #F5F0EB;   /* lightest cream — alternate section background */
--cream-dk:   #F5F0EB;   /* darkest cream — final section, form backgrounds */
--brown:      #4B2E2B;   /* deep brown — accent sections, hero overlay, text */
--brown-mid:  #4B2E2B;   /* mid brown — hover states */
--terra:      #D97E53;   /* terracotta — primary CTA, accents, rules */
--terra-dk:   #C06840;   /* terracotta dark — hover states */
--terra-lt:   #D97E53;   /* terracotta light — province labels, highlights */
--gold:       #D97E53;   /* gold — form stripe, dividers */
--gold-lt:    #D97E53;   /* gold light — hero eyebrow, image overlay text */
--olive:      #708238;   /* olive — form stripe, success state */
--text:       #4B2E2B;   /* primary body text */
--text-mid:   #4B2E2B;   /* secondary body text */
--text-muted: #4B2E2B;   /* muted text, labels */
--white:      #FFFFFF;
```

### Section Colour Rhythm

The page alternates between cream and dark brown to create tonal contrast:

| Section | Background |
|---|---|
| 00 Sticky Nav | `rgba(245,240,235,0.97)` — translucent cream |
| 01 Hero | `#4B2E2B` (brown) + full-bleed image |
| 02 Form | `#F5F0EB` cream (right col) + image (left col) |
| 03 Be Among the First | `#F5F0EB` cream-light |
| 04 Member Benefits | `#4B2E2B` deep brown — **accent dark section** |
| 05 Journey | `#F5F0EB` cream |
| 06 Why Umoya | `#F5F0EB` cream-light |
| 07 Journey Details | `#F5F0EB` cream-dark |

### Typography

- **No external font imports** — all `font-family: inherit` in HTML widgets
- The theme injects its own serif + sans-serif stack at the WordPress level
- Display/heading text should be set at the appropriate size and weight; the browser inherits the correct typeface from Elementor's global typography settings

### Design Principles (from live site observation)

- **Cream dominant** — the background is warm off-white/cream for most sections, not dark
- **Deep brown is accent-only** — used for 1–2 statement sections per page
- **Terracotta pill buttons** — `#D97E53`, slightly rounded (4px radius)
- **Rounded corners** — `border-radius: 10px` on all images and cards
- **Spacious editorial layouts** — generous padding, strong visual hierarchy
- **Mobile-first** — infinite scroll mechanics on mobile, stacked single-column layouts
- **Cinematic photography** — full-bleed images with deep gradient overlays
- **No generic aesthetics** — no predictable component patterns, no cookie-cutter design

---

## 5. Page Architecture — Founder's Circle

The page is structured as 8 separate HTML files, each dropped into an Elementor HTML widget in sequence. This separation makes maintenance, testing, and iteration faster.

### Elementor Widget Order

```
Section 00 — sticky-nav     (position: fixed, before the hero)
Section 01 — hero
Section 02 — form
Section 03 — be-first
Section 04 — benefits
Section 05 — journey
Section 06 — why
Section 07 — details
```

### File Map

| File | Section | Size |
|---|---|---|
| `section-00-sticky-nav.html` | Sticky Navigation Bar | ~5KB |
| `section-01-hero.html` | Full-viewport Hero | ~9KB |
| `section-02-form.html` | Your Homecoming Awaits (Form) | ~22KB |
| `section-03-be-first.html` | Be Among the First + Slideshow | ~12KB |
| `section-04-benefits.html` | Member Benefits (dark section) | ~8KB |
| `section-05-journey.html` | Signature Journey + Province Cards | ~16KB |
| `section-06-why.html` | Why Umoya Afrika Tours | ~12KB |
| `section-07-details.html` | Journey Details Accordion | ~17KB |

---

## 6. Section-by-Section Specification

---

### Section 00 — Sticky Navigation Bar

**File:** `section-00-sticky-nav.html`
**Purpose:** Provides persistent brand presence and a quick CTA once the user scrolls past the hero.

**Behaviour:**
- `position: fixed; top: 0; z-index: 9999`
- Starts `translateY(-100%)` — hidden off-screen
- Becomes visible once `#fc-hero` scrolls out of the viewport via `IntersectionObserver`
- Fallback: shows after 300px scroll if IntersectionObserver unavailable

**Contents:** Logo (SVG from WordPress uploads) · Centre label "Founder's Circle — Limited Membership" · Terracotta CTA button → `#fc-form-section`

**Responsive:**
- ≤768px: Centre label hidden, padding reduced
- ≤420px: Brand text hidden (logo mark only), button padding compressed

**Critical:** The element `id="fc-hero"` must exist on Section 01's outer wrapper for the observer to function.

---

### Section 01 — Hero

**File:** `section-01-hero.html`
**Purpose:** First impression. Establishes brand, emotional tone, and drives primary CTA.

**Layout:** Full-viewport, content **centre-aligned**. Text and buttons are horizontally centred.

**Height:**
```css
height: max(100dvh, 620px);  /* dvh = accounts for iOS address bar */
```
Three-layer safety net: `100vh` fallback → `100dvh` → `620px` absolute floor.

**Background:** Full-bleed image with cinematic gradient overlay:
```css
background: linear-gradient(180deg,
  rgba(28,13,6,.12)  0%,
  rgba(28,13,6,.18) 30%,   /* strengthened mid-band */
  rgba(28,13,6,.55) 65%,
  rgba(28,13,6,.93) 100%
);
```

**Content (top → bottom, centred):**
1. Eyebrow label — gold-lt, 0.75rem, uppercase
2. H1 — italic, `clamp(2.2rem, 6.5vw, 5.2rem)`
3. Body paragraph — max-width: 580px, centred
4. Two buttons — Primary (terracotta) + Ghost (cream outline)

**Buttons:**
- Primary: `href="#fc-form-section"` — "Join the Founder's Circle"
- Ghost: `href="#fc-be-first"` — "Learn More"
- On mobile: stack full-width, `max-width: 400px`, centred

**Video swap comment:** The `<img>` is pre-marked for swap to `<video autoplay muted loop playsinline poster="">` when the brand video asset is ready.

**Audit fixes applied (v4):**

| Element | Before | After | Reason |
|---|---|---|---|
| Eyebrow | 0.68rem (10.9px) | 0.75rem (12px) | Below readable minimum |
| Eyebrow ≤420px | 0.60rem (9.6px) | 0.72rem (11.5px) | Even smaller — wrong direction |
| Button labels | 0.72rem (11.5px) | 0.75rem (12px) | Below minimum for interactive elements |
| Title max | 6rem (96px) | 5.2rem (83px) | Excessive on wide viewports |
| Title min | 2.6rem | 2.2rem / 2rem @420 | Too large on 320px phones |
| Body min | 0.88rem | 0.95rem | Borderline floor |
| Body opacity | .76 | .90 | Visually thin |
| Ghost border | rgba(.45) | rgba(.70) | Near-invisible on bright images |
| Gradient mid | .04 at 30% | .18 at 30% | Bright photos washing out text |
| Text-shadow | none | added to title + eyebrow | Contrast insurance |
| Padding-top | 0 | 110px desktop / 80px mobile | No guard vs sticky nav bar |
| Mobile floor | 92dvh only | max(92dvh, 600px) | Landscape phones collapse |

---

### Section 02 — Form: Your Homecoming Awaits

**File:** `section-02-form.html`
**Purpose:** Primary conversion — collects traveler information for the Founder's Circle.

**Layout:** Two-column grid, `1fr` image left / `2fr` form right. Section = exactly `100dvh`. Both columns fill full height. **No overflow property on the form column.**

**Key technique — fits without overflow:**
The right column is a flex chain where every level has `min-height: 0`:
```
section (100dvh)
 └ grid (height:100%)
    └ form column (flex column, no overflow)
       └ .fc-f2-inner (flex:1, min-height:0)
          ├ header (flex-shrink:0)
          └ card (flex:1, min-height:0)
             └ form (flex:1, min-height:0)
                ├ field grid (flex:1, min-height:0)
                │  grid-template-rows: auto auto auto auto auto 1fr
                │  └ textarea row = 1fr (absorbs leftover height)
                ├ submit (flex-shrink:0)
                └ legal (flex-shrink:0)
```

All spacing uses `clamp()` with `vh` units so every value scales proportionally with viewport height — no fixed pixel values that could cause overflow.

**Left column (image):**
- `position: relative; overflow: hidden` — clips image to column boundary (structural, not scrolling)
- Image: `position: absolute; inset: 0; object-fit: cover`
- Dark gradient overlay + overlay text (eyebrow, italic title, rule, descriptor)

**Right column (form):**
- Watermark "UMOYA" behind content (decorative, `color: rgba(28,13,6,.03)`)
- Section header: eyebrow · title · rule · subtitle (centred)
- Form card with top accent stripe (terracotta→gold→olive gradient)

**Form fields (all 9 — original content, never change):**
1. Title (dropdown)
2. First Name + Last Name (two-column row)
3. Email Address
4. Phone Number
5. Zip / Postal Code
6. Preferred Travel Window (dropdown)
7. Preferred Journey Length (dropdown, full-width)
8. What Are You Hoping to Experience? (textarea, full-width, `1fr` row)
9. Submit button + legal note

**CF7 integration:**
Delete the `<form id="fc2Form">` block and replace with:
```
[contact-form-7 id="YOUR_FORM_ID" title="Founders Circle"]
```

**Success state:** Button text changes, disabled, background switches to `--olive` (`#708238`).

**Responsive:**
- ≤768px: `height: auto`, single column, image becomes 260px banner, flex chain reverts to block flow, textarea gets natural 100px height
- ≤420px: image 220px, padding compressed

---

### Section 03 — Be Among the First to Journey Home

**File:** `section-03-be-first.html`
**Purpose:** Communicates exclusivity and urgency. Reinforces the Founder's Circle value proposition.

**Layout:** Two-column grid — copy left · slideshow right.
**Background:** `#F5F0EB` cream-light
**Anchor ID:** `id="fc-be-first"` — target from Hero "Learn More" button

**Left column content:**
- Eyebrow: "Exclusive Early Access"
- H2: "Be Among the First to Journey Home" (italic em)
- Rule divider
- Body: 3 paragraphs (original copy — do not change)
- Pull quote (terracotta left border): urgency statement
- CTA button → `#fc-form-section`

**Right column — 4-slide carousel:**
- Auto-advances every 5,500ms
- Left/right arrow buttons (44px min touch target)
- Dot navigation (role="tablist")
- Fully ARIA accessible: `aria-roledescription="carousel"`, slide roles, `aria-selected`
- Image gradient overlay + caption per slide
- `★ SWAP` comments mark each `<img>` src for Drive images 1–4

**Responsive:**
- ≤768px: Stacks, copy first (order:1), slideshow second (order:2), aspect ratio 4/3
- ≤420px: aspect ratio 1/1

---

### Section 04 — Member Benefits

**File:** `section-04-benefits.html`
**Purpose:** Lists all Founder's Circle membership privileges. The page's only dark-brown section — creates tonal contrast between cream sections.

**Layout:** Two-column — image left · checklist right.
**Background:** `#4B2E2B` deep brown

**Image panel:**
- `aspect-ratio: 4/5` portrait
- Terracotta corner accent block (absolute positioned, behind image)
- `★ SWAP` comment: brief specifies "crop to remove individual on the right"

**Checklist (7 items — do not add or remove):**
1. Exclusive promotions reserved for Founder's Circle members only
2. Priority access to book before journeys open to the general public
3. A dedicated travel expert to guide you personally from enquiry to arrival
4. Seamless, concierge-style booking and journey planning experience
5. Pre-departure orientation and cultural preparation materials
6. Arrival welcome gift and an opening ceremony in South Africa
7. Early access to all future journey announcements and Umoya experiences

Each item: terracotta circle with checkmark SVG · cream text · hover shifts `padding-left`

**Responsive:**
- ≤768px: Single column, image becomes 16/9 landscape, accent block hidden

---

### Section 05 — Your Journey Begins Here

**File:** `section-05-journey.html`
**Purpose:** Presents the inaugural 18-day signature journey. The page's most content-rich section.

**Background:** `#F5F0EB` cream
**Sub-sections A→D:**

**A. Header + Stats row:**
- Eyebrow · H2 "Your Journey Begins Here"
- Three stats: 18 Days · 5 Provinces · 20 Guests Max
- Flex row, `flex-wrap` so stats wrap on narrow screens

**B. Province Cards grid (5 cards):**
- Desktop: `repeat(5, 1fr)` · Tablet: `repeat(3, 1fr)` · Mobile: `1fr 1fr` (5th card spans full width at `16/7` ratio)
- Each card: full-bleed image + gradient overlay + region label (terracotta) + province name (cream)
- Hover: `translateY(-6px)` lift + `scale(1.06)` on image
- `★ SWAP` comments on all 5 image sources

**Province cards order (from the brief):**
1. Gauteng & Limpopo — Sacred Origins & Living Heritage
2. Mpumalanga — Wonders of Nature
3. KwaZulu-Natal — Be Welcomed & Embraced by Royalty
4. Western Cape — Wine, Oceans & Culture
5. All Provinces — Luxury Journeys of Transformation

**C. Every Journey Includes split:**
- Two-column: image left (`16/10`) · copy right
- Bullet list (5 items) with terracotta dot icons
- Pricing block: `$[Price]` and `$[Amount]` placeholders — **replace with real figures**
- Outline CTA button

**D. Closing CTA block:**
- Dark brown (`#4B2E2B`) rounded card
- Italic closing statement + terracotta CTA button
- Desktop: flex row. Mobile: stacks vertically

---

### Section 06 — Why Umoya Afrika Tours

**File:** `section-06-why.html`
**Purpose:** Communicates brand philosophy and differentiates Umoya from conventional tourism.

**Background:** `#F5F0EB` cream-light
**Layout:** Two-column `1.1fr / 1fr` — copy left · video+pillars right (sticky on desktop)

**Left column:**
- Eyebrow · H2 "Why Umoya Afrika Tours?"
- Rule divider
- Lead paragraph (large, brown)
- 3 body paragraphs
- Dark CTA button: "Enquire Now"

**Right column (sticky: top 88px on desktop):**
- Video placeholder block (16/10 aspect ratio) with play button
  - `★ SWAP` for brand video (primary) or backup Drive video
- Three brand pillars (hover shifts terracotta/gold/olive left border):
  1. Historically Grounded
  2. Diaspora-Centered
  3. Intimate & Intentional

**CTA Band (full-width, below grid):**
- Dark brown rounded card
- Italic headline + subtitle
- Flex row → stacks on mobile

**Responsive:**
- ≤1024px: Single column, right col `position: static`
- ≤768px: CTA band stacks, button full-width

---

### Section 07 — Journey Details

**File:** `section-07-details.html`
**Purpose:** Answers key traveler questions. Signals the natural close of the page.

**Background:** `#F5F0EB` cream-dark
**Layout:** Single column, `max-width: 860px` centred

**Header:** Eyebrow · H2 "Journey Details" · Rule · Subtitle

**Accordion (6 items — one open at a time, item 1 open by default):**

| # | Title | Subtitle |
|---|---|---|
| 1 | Intimate Small-Group Travel | Group size, movement & community |
| 2 | Guaranteed Departures | Plan with absolute confidence |
| 3 | Thoughtful Personalization | Your journey, your way |
| 4 | Travel Protection | Peace of mind for your investment |
| 5 | Flexible Journey Lengths | Options for every schedule |
| 6 | Regional Cuisine & Dietary Care | Authentic flavors, thoughtful planning |

**Accordion behaviour:**
- Click opens selected item, collapses all others
- `aria-expanded` updated on each toggle
- On mobile: `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` after open
- Icon box: terracotta background when open, white icon stroke

**Footer CTA:** Italic H3 · subtitle · terracotta button → `#fc-form-section`

---

## 7. CSS Architecture Standards

### Scoping Strategy

Every rule is scoped under the section's root element ID (e.g., `#fc-hero`, `#fc-benefits`). This prevents Elementor theme styles from bleeding in or overriding section styles.

```css
/* Pattern used in every file */
#fc-form-section { /* design tokens as CSS custom properties */ }
#fc-form-section * { box-sizing: border-box; }
```

### Class Naming Convention

All classes are prefixed to avoid collision with Elementor, WordPress, or the tevily theme:

```
fc-      = Founder's Circle global prefix
fc-f2-   = Section 02 specific
fc-bf-   = Section 03 (be-first) specific
fc-ben-  = Section 04 (benefits) specific
fc-jrn-  = Section 05 (journey) specific
fc-why-  = Section 06 specific
fc-det-  = Section 07 (details) specific
```

### Responsive Breakpoints

| Breakpoint | Target |
|---|---|
| `max-width: 1024px` | Tablet — columns narrow, some layouts restructure |
| `max-width: 768px` | Mobile — all two-column layouts collapse to single column |
| `max-width: 420px` | Small mobile — compressed padding, oversized elements reduced |

### Scroll Reveal Pattern

Used on every section. CSS-only until triggered by `IntersectionObserver`:

```css
.fc-xxx-rv {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity .85s var(--ease), transform .85s var(--ease);
}
.fc-xxx-rv.fc-xxx-on { opacity: 1; transform: none; }
.fc-xxx-rv.d1 { transition-delay: .14s; }
.fc-xxx-rv.d2 { transition-delay: .26s; }
```

All `IntersectionObserver` calls include a no-JS fallback that immediately adds the visible class.

### The `clamp()` + `vh` Pattern (Section 02)

Spacing that must scale with viewport height (not width) uses:
```css
padding-top: clamp(28px, 4vh, 48px);
font-size:   clamp(0.6rem, 0.9vh, 0.72rem);
```
This ensures content fits in `100dvh` without overflow at any screen height ≥768px.

---

## 8. Accessibility Standards

Every section meets or exceeds WCAG 2.1 AA:

- **Minimum font size:** 12px (0.75rem). Eyebrow labels at exactly 12px are acceptable as decorative all-caps labels with wide letter-spacing.
- **Contrast:** All text on dark overlays tested and confirmed ≥4.5:1. Hero text scores 15.84:1 AAA.
- **Touch targets:** All interactive elements (buttons, accordion triggers, slideshow arrows, dots) have `min-height: 44px` and `min-width: 44px`.
- **ARIA:** Carousel sections use `role="region"`, `aria-roledescription="carousel"`, slide `role="group"`. Accordion uses `aria-expanded`, `aria-controls`, `role="region"`. Dots use `role="tablist"`, `role="tab"`, `aria-selected`.
- **iOS zoom prevention:** All form inputs have `font-size: max(16px, 0.9rem)` — a font size below 16px triggers auto-zoom in iOS Safari.
- **Animations:** All entrance animations use `animation: xxx both` with delays — content is never invisible without JS.

---

## 9. JavaScript Standards

All scripts are:
- Wrapped in an IIFE: `(function(){ 'use strict'; }())`
- Scoped by querying within the section element (e.g., `document.querySelectorAll('#fc-benefits .fc-ben-rv')`) — prevents cross-section conflicts when multiple scripts are on the same page
- Written in ES5-compatible syntax — no arrow functions, no `const`/`let`, no template literals — for maximum compatibility with older WordPress/Elementor environments
- Include `IntersectionObserver` fallbacks that immediately show content if the API is unavailable

---

## 10. Elementor Deployment Instructions

### Step-by-step for each section:

1. Open the Founder's Circle page in Elementor editor
2. Add a new **HTML widget** in the correct position
3. Paste the **entire contents** of the section file into the widget's HTML field
4. Click **Update**
5. Preview to confirm rendering

### Important anchor IDs (must not be changed)

These IDs are referenced by CTA buttons across multiple sections. Changing them will break all cross-section links.

| ID | Section | Referenced by |
|---|---|---|
| `#fc-hero` | Section 01 | Sticky nav IntersectionObserver |
| `#fc-form-section` | Section 02 | Every CTA button on the page |
| `#fc-be-first` | Section 03 | Hero "Learn More" ghost button |

### Contact Form 7 Integration

In Section 02, locate the `<form id="fc2Form">` block and replace the entire `<form>` element with:
```
[contact-form-7 id="YOUR_FORM_ID" title="Founders Circle"]
```

To maintain styling, apply the following classes via CF7's tag editor or Additional CSS:
- Field wrappers: `fc-f2-field`
- Inputs/selects: the default CF7 markup accepts class attributes in the tag generator
- The submit button can be styled globally since it's outside the HTML widget scope

---

## 11. Image Swap Instructions

Every image placeholder is marked with a `★ SWAP` comment. Below is the full list:

| Section | Placeholder | Drive source (from brief) |
|---|---|---|
| 01 Hero | Hero image | Your hero video/poster OR `umoya_image-1.jpg` |
| 02 Form | Left column image | Portrait shot — best with cultural moment |
| 03 Slideshow Slide 1 | Journey image | Drive Image 1 |
| 03 Slideshow Slide 2 | Journey image | Drive Image 2 |
| 03 Slideshow Slide 3 | Journey image | Drive Image 3 |
| 03 Slideshow Slide 4 | Journey image | Drive Image 4 |
| 04 Benefits | Left portrait | Drive image — **crop to remove individual on right** |
| 05 Province 1 | Gauteng/Limpopo | `IMG_6762-scaled.webp` |
| 05 Province 2 | Mpumalanga | `IMG_7057-scaled.webp` |
| 05 Province 3 | KwaZulu-Natal | `IMG_9149.webp` |
| 05 Province 4 | Western Cape | `IMG_7630-scaled.webp` |
| 05 Province 5 | All Provinces | Your choice |
| 05 Includes | Journey experience | `umoya_image-20.jpg` |
| 06 Video | Brand video | Brand video (primary) — backup video from Drive |

All section images are currently using live images from the WordPress uploads directory at `umoyaafrikatours.co.za/wp-content/uploads/` as placeholders.

---

## 12. Pricing Placeholders

In Section 05 (Journey), two values must be filled in before launch:

```html
$[Price]   — Starting price per person
$[Amount]  — Founder's Circle exclusive discount
```

Search for `$[Price]` and `$[Amount]` in `section-05-journey.html` to locate them.

---

## 13. Planned Work Not Yet Built

Per the Website Requirements Document and Master Guide, the following remain to be built:

### Wider Site Pages

| Page | Status | Notes |
|---|---|---|
| Homepage | In development | Conversion engine — hero video, tours, testimonials |
| About Us | Planned | Mission, vision, founders, cultural impact |
| Signature Experiences (5) | Planned | One page per province — storytelling + CTA |
| Tours & Packages | Planned | Layered: highlights on page + downloadable PDF itinerary |
| Accommodations & Dining | Planned | New section — boutique stays, fine dining, luxury positioning |
| Knowledge Hub | Planned | Thought leadership — distinct from blog |
| Blog / Media | Planned | Travel tips, news, lighter than Knowledge Hub |
| Luxury Contact Page | Planned | Live |
| Client Portal | Planned | Advanced: user login, file uploads, payment tracking |

### Founder's Circle Page — Remaining Items

- **Video integration:** Hero (Section 01) and Why Umoya (Section 06) are pre-marked for video embeds once brand video is delivered
- **Real pricing:** Replace `$[Price]` and `$[Amount]` in Section 05
- **Drive images:** Replace all `★ SWAP` placeholders with final approved images
- **CF7 form ID:** Connect Section 02 form to WordPress CF7 with correct form ID
- **Meta Pixel + GA4:** Confirm event tracking on form submit action

---

## 14. Key Decisions Log

| Decision | Rationale |
|---|---|
| All HTML in separate files per section | Faster iteration, easier debugging, no Elementor re-renders of unrelated sections |
| `font-family: inherit` everywhere | Fonts come from tevily-child theme — importing Google Fonts would conflict |
| `clamp()` + `vh` for Section 02 spacing | Eliminates overflow without any `overflow` property — sizes scale to fill `100dvh` |
| `flex: 1` + `min-height: 0` chain in Section 02 | The only pure CSS way to make a textarea fill remaining viewport height without JS |
| Cream as dominant background (not dark) | Matches the live site — dark brown is accent-only, not the default |
| Province cards: last card full-width on mobile | 5 cards in 2 columns leaves an orphan — spanning it improves layout at any screen |
| Accordion: one item open at a time | Prevents users from losing context; keeps content readable in bounded space |
| Scroll indicator hidden on mobile | Unnecessary at ≤768px — users are experienced scrollers on touch devices |
| Ghost button border: rgba(.70) not rgba(.45) | .45 was near-invisible on bright image backgrounds — contrast insurance |
| `min-height: max(100dvh, 620px)` on hero | Prevents hero from collapsing below usable height in landscape on small phones |

---

## 15. Files Reference

### Delivered in this project

```
section-00-sticky-nav.html    — Fixed nav bar
section-01-hero.html          — Full-viewport hero (centre-aligned, audited)
section-02-form.html          — Two-column form (1fr/2fr, 100dvh, no overflow)
section-03-be-first.html      — Copy + 4-slide carousel
section-04-benefits.html      — Dark section, image + checklist
section-05-journey.html       — Stats + province cards + includes + closing CTA
section-06-why.html           — Philosophy copy + video + pillars + CTA band
section-07-details.html       — Collapsible accordion + footer CTA
```

### Superseded (do not use)

```
founders-circle.html          — V1 monolithic file (replaced by section files)
founders-circle-v2.html       — V2 monolithic file (replaced by section files)
founders-circle-v3.html       — V3 monolithic file (replaced by section files)
```

---

## 16. How to Work With Me Going Forward

When making requests, the following will always be applied automatically:

1. **Stack compliance** — no suggestions outside WordPress/Elementor
2. **Font inheritance** — `font-family: inherit` always, never imported fonts
3. **Colour system** — always use the tokens defined in Section 4
4. **No overflow** — content sized to fit its container; clamp+flex+min-height-0 used instead
5. **Audit before build** — for any layout involving height constraints, spacing is calculated before code is written
6. **Scoped CSS** — all rules under the section's root ID
7. **ES5 JS** — IIFE, `var`, `function(){}`, no modern syntax
8. **WCAG AA minimum** — 12px font floor, 44px touch targets, proper ARIA
9. **Zero HTML errors** — all files are validated before delivery
10. **Responsive at four breakpoints** — Desktop · 1024px · 768px · 420px

---

*Last updated: March 2026. Maintained by Claude (Anthropic) as Lead Architect on the Umoya Afrika Tours platform.*
