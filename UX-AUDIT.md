# UI/UX Audit — 2025 BCP Daily Office site

Method: real rendered screenshots (headless Chromium via Puppeteer, not just reading the CSS) at three widths — 1440px (desktop), 768px (tablet), 375px (mobile, iPhone SE/13 mini size) — across the Home, Mattins, and Mass pages, plus the Hours dropdown and calendar popover open. Screenshots referenced below are saved alongside this file in `ux-audit-screenshots/`. Contrast ratios were computed against the actual WCAG 2.1 formula, not eyeballed. Full source read: `css/style.css` (323 lines, the only stylesheet) and `index.html` (380 lines).

Findings are ranked by how much they hurt daily use, worst first. "Fix direction" is a suggestion, not something already built — nothing below has been changed yet.

## 1. (Critical — mobile) There is no mobile navigation. The nav bar alone fills the entire first screen on a phone.

`nav.main-nav` has thirteen top-level items and no breakpoint that collapses them — `.nav-inner` just flex-wraps and centers. On a 375px-wide phone that wraps to **ten rows**. See `ux-audit-screenshots/1-home-mobile-nav-wall.png`: a phone screen opened to the Home page shows nothing but nav rows — the actual "Pray the Daily Office" heading and hero text are pushed entirely off-screen, below the fold. The same thing happens on every single page, every single time (Mattins, Mass — `3-toolbar-wrap-mobile.png` shows the same wall pushing the date toolbar off-screen on the Mattins page too). For an app meant to be opened every morning and evening on a phone, this is the single biggest usability problem on the site.

Fix direction: a standard hamburger/off-canvas menu below ~700-800px, collapsing all thirteen items behind one tap target in the header.

## 2. (Critical — information architecture) Settings are mixed into the content navigation at equal visual weight

Six of the thirteen nav items aren't navigation at all — they're prayer-customization settings: **Language**, **Absolution**, **After Psalms**, **Creed**, **Venite on Ash Wed.**, **Weekday Canticle**. They sit in the exact same row, same button style, same size as **Hours**, **Litanies**, **Holy Mass**, **Eucharistic Devotions**, **Pastoral**, **Family Prayers**, **Office of the Dead**, **Votive Masses** — which are where the actual content is. A first-time visitor scanning for "where do I pray Mattins" has to read past five settings dropdowns first. This is also most of what's driving Finding #1 — six of the thirteen items disappearing into a separate settings panel would cut the mobile nav from ten wrapped rows to roughly four.

Fix direction: pull the six settings into a single "Settings" (gear-icon) menu, separate from the page-navigation items.

## 3. (High — aesthetics/IA) The Home page is an undifferentiated wall of ~26 identical pill buttons

See `ux-audit-screenshots/4-home-desktop-button-wall.png`. Every destination on the site — Mattins, Evensong, the Great Litany, Matrimony, Burial of the Dead, Votive Masses, About — is rendered as the same size, same color, same shape pill button in one long flowing block, in no particular grouping beyond loose source order. There's no visual hierarchy: a first-time-use item like "Confirmation" looks exactly as prominent as "Evensong," which most people will want far more often. This isn't a small thing on a site with this much content — right now the Home page can't actually help someone decide where to go.

Fix direction: group into labeled clusters (Daily Office, Holy Mass & Devotions, Pastoral Rites, Office of the Dead, Family Prayers) with a heading over each, and let the Daily Office group be visually first/largest since it's the primary daily-use case.

## 4. (Medium — accessibility) Six separate CSS rules use text colors that fail WCAG AA contrast

Computed against the real WCAG relative-luminance formula, not estimated:

| Rule | Colors | Ratio | Needed |
|---|---|---|---|
| `.rubric-fine` | `#a39d8a` on `#fbf7ee` | 2.54:1 | 4.5:1 |
| `.fallback-note` | `#999` on `#fbf7ee` | 2.66:1 | 4.5:1 |
| `.cal-grid .cal-dow` | `#999` on `#fff` | 2.85:1 | 4.5:1 |
| `.placeholder-block .missing` | `#999` on `#fff9e8` | 2.71:1 | 4.5:1 |
| `.no-latin-note` | `#a39d8a` on `#fbf7ee` | 2.54:1 | 4.5:1 |
| `.psalm-range` | `#a39d8a` on `#fbf7ee` | 2.54:1 | 4.5:1 |

All six sit around 2.5-2.9:1 against a ~4.5:1 requirement for normal-size text (or 3:1 if the text stayed large, which none of these are — they're all small/fine print). Anyone with low vision, or just using the site in bright sunlight, will have real trouble reading these — which is a real cost here, since several of these labels (day-of-week initials on the calendar, the "missing content" notices, verse-range labels) carry actual information, not just decoration.

Fix direction: darken to something like `#726c5c`/`#767065` (roughly a 4.6-4.8:1 ratio against these backgrounds) — small, mechanical, no layout risk.

By contrast: the dynamic per-season color system (`js/liturgical-color.js`'s seven palettes, each with a hand-paired text color, driving the header background/text and the accent color site-wide) was checked the same way and **passes** in all fourteen combinations tested (13 at ≥4.5:1, the weakest — Rose's header text at 4.10:1 — still clears the 3:1 bar for large/bold text, which the header text qualifies as). That part of the design was already built with contrast in mind; it didn't need fixing.

## 5. (Medium — accessibility/functionality) Dropdown menus have no keyboard or screen-reader support

Read `js/app.js`'s `[data-trigger]` click handler in full: it toggles an `.open` class on click and closes other dropdowns, and that's the entire interaction model. None of the thirteen dropdown triggers has `aria-expanded` or `aria-haspopup`; there's no Escape-to-close, no arrow-key movement between menu items, and no visible focus style distinct from `:hover`. Anyone navigating by keyboard or screen reader currently has no way to know a button opens a menu, or a reliable way to close one once open, beyond clicking elsewhere.

Fix direction: add `aria-expanded`/`aria-haspopup="true"` toggled alongside the `.open` class, an Escape handler on the open menu, and a visible `:focus-visible` style to match the existing `:hover` treatment.

## 6. (Medium — mobile) The date toolbar (Prev / Today / date / Next / Calendar) wraps awkwardly on narrow screens

See `ux-audit-screenshots/3-toolbar-wrap-mobile.png`. `.office-toolbar`'s five controls (with the date label alone needing `min-width: 11rem` = 176px) can't fit in a 375px row alongside the other four, so they wrap into an unbalanced three-line stack: "← Today" on one line, the date centered alone on the next, "→ [calendar]" on a third. It's still usable, just visually untidy — not in the same tier as Findings #1-3, but worth cleaning up in the same pass.

Fix direction: on narrow screens, put the date on its own full-width row on top (it's the most important piece of information there) and the four controls in an evenly-spaced row below it.

## 7. (Low-medium — mobile) An open dropdown visually overlaps the wrapped nav rows behind it

See `ux-audit-screenshots/2-dropdown-collision-mobile.png` — opening "Hours" on mobile drops a menu that sits on top of, and partly obscures, the "Absolution"/"After Psalms"/"Creed" rows below it in the still-visible wrapped nav. Nothing is actually broken (the dropdown itself has an opaque white background and correct z-index), but the visual result is busy and momentarily confusing. This resolves itself as a side effect of Finding #1's fix — a collapsed mobile nav has nothing left for an open dropdown to visually collide with.

## 8. (Low — aesthetic opportunity, not a defect) Wide screens leave a lot of unused space either side of the content

On the 1440px desktop shot, the 700px-wide content column sits in the middle of an otherwise-empty parchment-colored field. This is very plausibly an intentional "printed prayer book" restraint (a Prayer Book page isn't full-bleed either), so it's listed as an opportunity rather than a problem — worth a design call rather than an automatic fix. If more visual richness is wanted here, options include a subtle background texture/watermark, or seasonal color washing the empty margins to match the day's liturgical color rather than leaving it a flat neutral tan.

## What's already working well and shouldn't be disturbed

The actual liturgical text — the part people will spend the most time reading — renders beautifully at every width tested: comfortable line length, real drop caps on capitular openings, italicized Scripture citations, sensible line-height, and the full-justification-with-hyphenation choice (meant to evoke a printed Prayer Book) doesn't create the bad "rivers" of whitespace that justified text on a narrow column often does, even down to 375px.

The per-season dynamic color theming (header background/text, accent color, calendar "today"/feast/selected-day highlighting) is a genuinely nice, cohesive touch that a lot of sites this size wouldn't bother with, and — per Finding #4 — it was already built with contrast in mind.

The redesigned calendar popover (`ux-audit-screenshots/5-calendar-popover-mobile-good.png`) works well even on the smallest width tested: clear month grid, feast days marked, selected day highlighted in the day's own liturgical color, and it already has a dedicated `@media (max-width: 420px)` rule repositioning it so it doesn't run off-screen. This is worth using as the template for how the other mobile fixes above should look and feel.

## Suggested order of work

1. Collapse the nav behind a mobile hamburger menu (#1) — the highest-leverage single fix.
2. Split settings out of the content nav into their own menu (#2) — shrinks #1's fix further and fixes the IA problem directly.
3. Group the Home page buttons into labeled sections (#3).
4. Darken the six low-contrast text colors (#4) — quick, mechanical, no layout risk, can be done independently of the above at any point.
5. Fix the toolbar's mobile wrap (#6).
6. Add ARIA/keyboard support to the dropdowns (#5).

#7 resolves itself once #1 is done; #8 is a judgment call, not a fix.
