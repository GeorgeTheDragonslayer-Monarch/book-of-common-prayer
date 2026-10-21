// George's consolidated 10/7 list, item 10: "Finally (I think, for now),
// the calendar button is still making most of the days the same colour of
// the day, as in the last picture sent."
//
// Investigation found `resolveLiturgicalColor` itself was never the
// problem here - both calendar grids (`renderCalendarPopover`'s
// `.cal-day` squares and `renderCalendarPage`'s `.cal-page-day` squares)
// already resolve and apply a distinct, correct per-day color (confirmed
// live across a real month: green/white/red all present as expected,
// matching the season/feast on each date). The actual bug was in the CSS:
// task #217/item #14 deliberately rendered that per-day color as only a
// 3px `border-top` hairline, specifically to keep the "feast" red-text/
// border styling legible on top of it - but that hairline alone is too
// subtle to read as "this day has its own colour" at a glance, so the
// whole grid still looked like one uniform colour to George, even though
// the underlying data was already correct.
//
// Fixed by adding a second CSS custom property, `--day-color-rgb` (an
// "r, g, b" triplet, via the same `hexToRgbTriplet` helper already used
// for `--accent-rgb` elsewhere on this site), set alongside the existing
// `--day-color` at both render sites (`renderCalendarPopover` and
// `renderCalendarPage`, js/app.js), and used in `css/style.css` to add a
// low-alpha (0.16) background WASH of that same color underneath the
// existing hairline - light enough that the "feast" red text/border
// signal (a different, unrelated flag - which days are red-letter
// feasts) still reads clearly on top, but visible enough that each day's
// own liturgical colour is now actually noticeable.
//
// This also required updating the pre-existing `test_calendar_popover_color.js`
// (task #217/item #14's own test), since its exact-equality checks against
// `--day-color:<hex>` alone no longer match the inline style string, which
// now also carries the new `--day-color-rgb:<r, g, b>` segment.
const fs = require("fs");
const { JSDOM } = require("jsdom");

function openPopoverForMonth(isoDateNoonUTC, toggleId, gridId) {
  const html = fs.readFileSync("index.html", "utf8");
  const dom = new JSDOM(html, { url: "http://localhost/", runScripts: "outside-only", pretendToBeVisual: true });
  const { window } = dom;
  const FixedDate = class extends Date {
    constructor(...args) {
      if (args.length === 0) { super(isoDateNoonUTC); }
      else { super(...args); }
    }
    static now() { return new Date(isoDateNoonUTC).getTime(); }
  };
  window.Date = FixedDate;
  const scriptSrcs = [...window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"));
  const combined = scriptSrcs.map((src) => fs.readFileSync(src, "utf8")).join("\n;\n");
  try {
    window.eval(combined);
  } catch (e) {
    console.log("ERROR evaluating combined scripts:", e.message);
  }
  const doc = window.document;
  doc.getElementById(toggleId).dispatchEvent(new window.Event("click", { bubbles: true }));
  return { window, doc, grid: doc.getElementById(gridId) };
}

let failed = false;
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + ": " + label);
  if (!cond) failed = true;
}

const RED_RGB = "138, 31, 31";
const WHITE_GOLD_RGB = "138, 109, 29";
const VIOLET_RGB = "91, 58, 110";
const GREEN_RGB = "47, 107, 63";

// 1. The Office page's popover (#calendarPopover/#calendarGrid, `.cal-day`
// squares): each day now carries a --day-color-rgb triplet alongside
// --day-color, and distinct days really do get distinct triplets (not
// all the same value, confirming this isn't a flat/static fallback).
{
  const { grid } = openPopoverForMonth("2026-08-10T12:00:00Z", "calendarToggle", "calendarGrid");
  const dayStyle = (d) => {
    const btn = grid.querySelector(`[data-cal-day="${d}"]`);
    return btn ? btn.getAttribute("style") : null;
  };
  check("10 August (St. Lawrence, Martyr): --day-color-rgb is red's triplet", (dayStyle(10) || "").indexOf(`--day-color-rgb:${RED_RGB}`) !== -1);
  check("14 August (Vigil of the Assumption): --day-color-rgb is violet's triplet", (dayStyle(14) || "").indexOf(`--day-color-rgb:${VIOLET_RGB}`) !== -1);
  check("15 August (the Assumption): --day-color-rgb is white/gold's triplet", (dayStyle(15) || "").indexOf(`--day-color-rgb:${WHITE_GOLD_RGB}`) !== -1);
  check("12 August (an ordinary feria): --day-color-rgb is green's triplet", (dayStyle(12) || "").indexOf(`--day-color-rgb:${GREEN_RGB}`) !== -1);
  check("Distinct days get distinct --day-color-rgb values (10th vs 15th)", dayStyle(10) !== dayStyle(15));
  check("Distinct days get distinct --day-color-rgb values (12th vs 14th)", dayStyle(12) !== dayStyle(14));
}

// 2. The full #calendar page's own grid (`renderCalendarPage`,
// `.cal-page-day` squares) gets the identical treatment, not just the
// smaller popover - confirming the fix was applied at both of this
// site's two separate calendar-grid implementations.
{
  const { doc } = openPopoverForMonth("2026-08-10T12:00:00Z", "calendarToggle", "calendarGrid");
  const win = doc.defaultView;
  win.location.hash = "#calendar";
  win.dispatchEvent(new win.Event("hashchange"));
  const grid = doc.querySelector(".cal-page-days");
  const dayStyle = (d) => {
    const btn = Array.from(grid.querySelectorAll("[data-cal-page-day]")).find((b) => parseInt(b.dataset.calPageDay, 10) === d);
    return btn ? btn.getAttribute("style") : null;
  };
  check("Full #calendar page: 10 August also carries red's --day-color-rgb triplet", (dayStyle(10) || "").indexOf(`--day-color-rgb:${RED_RGB}`) !== -1);
  check("Full #calendar page: 15 August also carries white/gold's --day-color-rgb triplet", (dayStyle(15) || "").indexOf(`--day-color-rgb:${WHITE_GOLD_RGB}`) !== -1);
}

// 3. The CSS itself: .cal-day and .cal-page-day each now reference
// --day-color-rgb in a background rule (the low-alpha wash), not just
// the pre-existing border-top hairline - confirms the fix landed in the
// stylesheet, not only in the JS that sets the custom properties.
{
  const css = fs.readFileSync("css/style.css", "utf8");
  const calDayBlock = css.slice(css.indexOf(".cal-day {"), css.indexOf(".cal-day:hover"));
  check("css/style.css: .cal-day has a background rule using --day-color-rgb", /background:\s*rgba\(var\(--day-color-rgb/.test(calDayBlock));
  check("css/style.css: .cal-day keeps its pre-existing border-top hairline too", /border-top:\s*3px solid var\(--day-color/.test(calDayBlock));
  const calPageDayBlock = css.slice(css.indexOf(".cal-page-day {"), css.indexOf(".cal-page-day:hover"));
  check("css/style.css: .cal-page-day has a background rule using --day-color-rgb", /background:[^;]*rgba\(var\(--day-color-rgb/.test(calPageDayBlock));
  check("css/style.css: .cal-page-day keeps its pre-existing border-top hairline too", /border-top:\s*3px solid var\(--day-color/.test(calPageDayBlock));
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
