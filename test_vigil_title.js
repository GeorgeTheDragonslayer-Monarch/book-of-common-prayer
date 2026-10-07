// Pending-corrections fix (10/3, task #216, item #13): "On 14 August
// 2026 (the Ferial Day, Friday after Trinity IX), the Ferial Day is
// wrongly trumping the Vigil (of the Assumption) in the ranking - the
// Vigil should be the primary celebration that day."
//
// Investigation found `decideCollectWinner` (ranking.js) was already
// behaving correctly per Ranking.tex - a Vigil's "common-vigil"/
// "privileged-vigil-1st"/"privileged-vigil-2nd" classification only
// decides whether some OTHER, differently-ranked Feast outranks the
// Vigil, and nothing was contending for 14 August 2026 (St. Eusebius,
// the day's only other entry, is a mere Memorial). The real bug: a
// Vigil's own Kalendar entry carries the literal rank string "Vigil"/
// "1st Vigil"/"2nd Vigil", none of which `RANK_TIER` assigns a tier
// above 0, so a Vigil can never itself win `decideCollectWinner` and
// become `resolveFeastRankToday`'s returned Feast - even when it's the
// only thing present that day. Title logic therefore always fell
// through to the plain season label whenever a Vigil was the only thing
// on the Kalendar, confirmed live across all 14 Vigils in
// data/kalendar.json (Christmas Even, the Epiphany's, and 12 ordinary
// Vigils), not unique to the Assumption's.
//
// Fixed with `findVigilKalendarEntry` (js/app.js, just above
// `resolveFeastRankToday`) - a title-only helper, deliberately NOT
// folded into `resolveFeastRankToday`/`decideCollectWinner` themselves,
// since those also drive Collect/Invitatory/canticle/Gloria selection,
// and (Christmas Even aside, flagged separately in ROADMAP.md as its
// own, much larger, out-of-scope gap) no Mass Proper text exists
// anywhere in this project for any of these 14 Vigils - the Mass
// actually said is, correctly, still the surrounding season's ordinary
// one; only the displayed title changes. Wired into `computeDayTitle`
// (the Office/Mass/Home page title), `renderKalendarLine` (so the Vigil
// entry isn't also duplicated in the commemoration line below the new
// title), and the calendar month-picker grid's own day-square label.
const fs = require("fs");
const { JSDOM } = require("jsdom");

function runOnDate(isoDateNoonUTC, hash) {
  const html = fs.readFileSync("index.html", "utf8");
  const dom = new JSDOM(html, { url: `http://localhost/${hash}`, runScripts: "outside-only", pretendToBeVisual: true });
  const { window } = dom;
  const FixedDate = class extends Date {
    constructor(...args) {
      if (args.length === 0) { super(isoDateNoonUTC); }
      else { super(...args); }
    }
    static now() { return new Date(isoDateNoonUTC).getTime(); }
  };
  window.Date = FixedDate;
  const scriptSrcs = [...dom.window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"));
  const combined = scriptSrcs.map((src) => fs.readFileSync(src, "utf8")).join("\n;\n");
  try {
    window.eval(combined);
  } catch (e) {
    console.log("ERROR evaluating combined scripts:", e.message);
  }
  return dom;
}

let failed = false;
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + ": " + label);
  if (!cond) failed = true;
}

const VIOLET_RGB = "rgb(91, 58, 110)";

// The Vigil of the Assumption, George's own named example.
{
  const dom = runOnDate("2026-08-14T12:00:00Z", "#mass");
  const label = dom.window.document.getElementById("massSeasonLabel").textContent;
  const dot = dom.window.document.getElementById("massColorDot");
  const kline = dom.window.document.getElementById("massKalendarLine").innerHTML;
  check('14 August 2026 is now titled "Vigil of the Assumption, Vigil"', label === "Vigil of the Assumption, Vigil");
  check("Its color is violet (a Vigil's own established color, unaffected by this fix)", dot && dot.getAttribute("style").includes(VIOLET_RGB));
  check("St. Eusebius (the day's other entry) still shows as a commemoration", kline.includes("St. Eusebius"));
  check("The Vigil of the Assumption itself is not ALSO duplicated in the commemoration line", !kline.includes("Vigil of the Assumption"));

  const domOffice = runOnDate("2026-08-14T12:00:00Z", "#office/mattins");
  check('The Daily Office also shows "Vigil of the Assumption, Vigil"', domOffice.window.document.getElementById("seasonLabel").textContent === "Vigil of the Assumption, Vigil");
}

// The other 13 Vigils in data/kalendar.json - confirms the fix is general,
// not special-cased to the Assumption's. Several of these land on a Sunday
// in 2026 and are correctly moved to the preceding Saturday by task #180's
// pre-existing "Vigils which fall on Sunday are moved back one day" rule
// (js/calendar.js) - tested at their actual, post-move date below, not the
// original Sunday (which this fix deliberately leaves alone - see the
// Sunday controls further down).
const otherVigils = [
  ["2026-01-05", "Vigil of the Epiphany, 2nd Vigil"],
  ["2026-02-23", "Vigil of St. Matthias, Vigil"],
  ["2026-06-23", "Vigil of St. John Baptist, Vigil"],
  ["2026-06-27", "Vigil of Sts. Peter & Paul, Vigil"], // moved from Sun 6-28
  ["2026-07-24", "Vigil of St. James, Vigil"],
  ["2026-08-08", "Vigil of St. Lawrence, Vigil"], // moved from Sun 8-9
  ["2026-10-27", "Vigil of Sts. Simon & Jude, Vigil"],
  ["2026-10-31", "Hallowe'en, Vigil"],
  ["2026-11-28", "Vigil of St. Andrew, Vigil"], // moved from Sun 11-29
  ["2026-12-19", "Vigil of St. Thomas, Vigil"], // moved from Sun 12-20
  ["2026-12-24", "Christmas Even, 1st Vigil"],
];
for (const [d, expected] of otherVigils) {
  const dom = runOnDate(d + "T12:00:00Z", "#mass");
  const label = dom.window.document.getElementById("massSeasonLabel").textContent;
  check(`${d} is titled "${expected}"`, label === expected);
}

// Two more of the 13, moved the same way, land on a Saturday that already
// has its own real Double-or-above Feast - Ranking.tex's own exception for
// a Common Vigil ("preferred over any Feast Day, except Doubles & above")
// correctly lets that Feast win outright instead, with no title change
// from this fix. Confirms this fix didn't disturb that pre-existing,
// already-correct precedence.
{
  const dom = runOnDate("2026-08-22T12:00:00Z", "#mass"); // Vigil of St. Bartholomew moved from Sun 8-23
  const label = dom.window.document.getElementById("massSeasonLabel").textContent;
  check("22 August 2026 still correctly shows the outranking Octave Day of the Assumption, not the moved Vigil", label === "Octave Day of the Assumption, Greater Double");
}
{
  const dom = runOnDate("2026-09-19T12:00:00Z", "#mass"); // Vigil of St. Matthew moved from Sun 9-20
  const label = dom.window.document.getElementById("massSeasonLabel").textContent;
  check("19 September 2026 still correctly shows the outranking Sts. Januarius & Companions, not the moved Vigil", label === "Sts. Januarius & Companions, Martyrs, Double");
}

// The original Sundays themselves (where a Vigil was moved off per task
// #180) must show the plain Sunday name, completely unaffected by this fix.
for (const d of ["2026-06-28", "2026-08-09", "2026-08-23", "2026-09-20", "2026-11-29", "2026-12-20"]) {
  const dom = runOnDate(d + "T12:00:00Z", "#mass");
  const label = dom.window.document.getElementById("massSeasonLabel").textContent;
  check(`${d} (a Sunday a Vigil was moved off of) shows no Vigil name`, !label.includes("Vigil") && label !== "Hallowe'en");
}

// Controls: the days immediately before/after the Assumption's Vigil, and
// an ordinary day with no Vigil at all, must be completely unaffected.
{
  const dom = runOnDate("2026-08-13T12:00:00Z", "#mass");
  const label = dom.window.document.getElementById("massSeasonLabel").textContent;
  check("13 August 2026 (the day before, a real Double-rank Feast) is unaffected", label === "St. Maximus of Constantinople, Confessor, Double");
}
{
  const dom = runOnDate("2026-08-15T12:00:00Z", "#mass");
  const label = dom.window.document.getElementById("massSeasonLabel").textContent;
  check("15 August 2026 (the Assumption itself, the day after its Vigil) is unaffected", label === "Assumption of the Blessed Virgin Mary (Common Octave), 1st Double");
}
{
  const dom = runOnDate("2026-08-12T12:00:00Z", "#mass");
  const label = dom.window.document.getElementById("massSeasonLabel").textContent;
  check('12 August 2026 (an ordinary feria with no Vigil present) still shows the plain season label', label === "Wednesday after the Ninth Sunday after Trinity");
}

// The calendar month-picker grid's own day-square label, fixed for
// consistency with the same root cause (George's separate item #14 is
// about the day-square COLOR specifically, left untouched here).
{
  const { JSDOM: JSDOM2 } = require("jsdom");
  const html = fs.readFileSync("index.html", "utf-8");
  const dom = new JSDOM2(html, { url: "http://localhost/", runScripts: "outside-only", pretendToBeVisual: true });
  const { window } = dom;
  const isoDateNoonUTC = "2026-08-10T12:00:00Z";
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
  window.eval(combined);
  const doc = window.document;
  window.location.hash = "#calendar";
  window.dispatchEvent(new window.Event("hashchange"));
  const day14 = doc.querySelector('[data-cal-page-day="14"]');
  const day15 = doc.querySelector('[data-cal-page-day="15"]');
  check('Calendar grid day-square for 14 August shows "Vigil of the Assumption"', day14 && day14.querySelector(".cal-page-feast") && day14.querySelector(".cal-page-feast").textContent === "Vigil of the Assumption");
  check("Calendar grid day-square for 15 August (the Feast itself) is unaffected", day15 && day15.querySelector(".cal-page-feast") && day15.querySelector(".cal-page-feast").textContent === "Assumption of the Blessed Virgin Mary (Common Octave)");
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
