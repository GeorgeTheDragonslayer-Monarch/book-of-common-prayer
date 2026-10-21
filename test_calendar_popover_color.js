// Pending-corrections fix (10/3, task #217, item #14): "Per an attached
// screenshot of the calendar month-picker popover: every individual
// day-square in that popover should be coloured with its own particular
// day's liturgical colour (implying the squares currently don't each
// reflect their own day's colour correctly)."
//
// Investigation found there are TWO separate calendar UIs in this site:
// the full #calendar page's own day grid (`renderCalendarPage`, class
// `.cal-page-day`), which already resolves and shows each day's real
// liturgical color (set as a `--day-color` CSS variable, applied as a
// 3px top accent) - and a second, smaller "calendar month-picker
// popover" (`#calendarPopover`/`#massCalendarPopover`, opened from the
// date-navigation toolbar on the Office and Mass pages, built by
// `renderCalendarPopover` inside `setupDateToolbar`, class `.cal-day`).
// This second popover is what George's screenshot shows: its day
// squares had NO liturgical-color computation of any kind - only a
// plain-text "feast" flag (red text/border for any red-letter day,
// regardless of what color that day actually is), confirmed by reading
// `.cal-day`'s CSS rules directly (no `--day-color` reference existed
// anywhere for this class before this fix).
//
// Fixed by reusing the exact same resolveLiturgicalDay/
// resolveFeastRankToday/resolveLiturgicalColor pipeline the full
// #calendar page's grid already uses, inside `renderCalendarPopover`'s
// per-day loop, and giving `.cal-day` the same `border-top: 3px solid
// var(--day-color, transparent)` treatment `.cal-page-day` already has -
// consistent with this site's one existing convention for showing a
// day's liturgical color, rather than inventing a second one. The
// existing "feast" class (red text for red-letter days) is untouched -
// a different, already-correct signal (which days have a principal
// Feast at all), now simply shown alongside the day's own color rather
// than instead of it.
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

const RED = "#8a1f1f";
const WHITE_GOLD = "#8a6d1d";
const VIOLET = "#5b3a6e";
const GREEN = "#2f6b3f";

// George's consolidated 10/7 note, item 10: the 3px-top-accent-only
// treatment these squares used to get (--day-color alone) read as "most
// of the days [are] the same colour" - too subtle to notice. Fixed by
// also setting a --day-color-rgb triplet (same hexToRgbTriplet pattern
// as --accent-rgb) so the CSS can show a low-alpha background wash of
// the day's color too, not just the hairline. So the inline style string
// now reads "--day-color:<hex>;--day-color-rgb:<r, g, b>" - checked here
// by matching just the --day-color segment at the front, rather than the
// old exact-equality check against --day-color alone.
function hasDayColor(style, hex) {
  return !!style && style.indexOf(`--day-color:${hex}`) === 0;
}

// The Office page's own popover (#calendarPopover / #calendarGrid),
// opened while viewing a date in August 2026.
{
  const { doc, grid } = openPopoverForMonth("2026-08-10T12:00:00Z", "calendarToggle", "calendarGrid");
  const dayStyle = (d) => {
    const btn = grid.querySelector(`[data-cal-day="${d}"]`);
    return btn ? btn.getAttribute("style") : null;
  };
  check("Popover is visible after clicking its toggle", doc.getElementById("calendarPopover").hidden === false);
  check("10 August (St. Lawrence, Martyr) is red", hasDayColor(dayStyle(10), RED));
  check("14 August (Vigil of the Assumption) is violet", hasDayColor(dayStyle(14), VIOLET));
  check("15 August (the Assumption) is white/gold", hasDayColor(dayStyle(15), WHITE_GOLD));
  check("9 August (an ordinary Trinitytide Sunday) is green", hasDayColor(dayStyle(9), GREEN));
  check("12 August (an ordinary feria) is green", hasDayColor(dayStyle(12), GREEN));
  // The pre-existing red-letter "feast" flag (a different, unrelated
  // signal) must still work exactly as before this fix.
  const btn10 = grid.querySelector('[data-cal-day="10"]');
  const btn12 = grid.querySelector('[data-cal-day="12"]');
  check("St. Lawrence (a red-letter day) still gets the 'feast' class", btn10.classList.contains("feast"));
  check("An ordinary feria does not get the 'feast' class", !btn12.classList.contains("feast"));
}

// The Mass page's own, separate popover (#massCalendarPopover /
// #massCalendarGrid) must show the identical colors for the same dates -
// confirming the fix wasn't only wired into one of the two copies.
{
  const { doc, grid } = openPopoverForMonth("2026-08-10T12:00:00Z", "massCalendarToggle", "massCalendarGrid");
  const dayStyle = (d) => {
    const btn = grid.querySelector(`[data-cal-day="${d}"]`);
    return btn ? btn.getAttribute("style") : null;
  };
  check("Mass page's popover is visible after clicking its toggle", doc.getElementById("massCalendarPopover").hidden === false);
  check("Mass page's popover: 14 August is violet too", hasDayColor(dayStyle(14), VIOLET));
  check("Mass page's popover: 15 August is white/gold too", hasDayColor(dayStyle(15), WHITE_GOLD));
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
