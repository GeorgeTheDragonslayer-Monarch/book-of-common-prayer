// Pending-corrections fix (10/3, task #215, item #12): "When the Day is
// a Day within an Octave, its liturgical colour should be the colour of
// the Feast Day (the Octave's own feast), not whatever the current
// default-color logic computes."
//
// Investigation: `resolveFeastRankToday` (js/app.js) already correctly
// identifies which Kalendar entry wins a given day via
// `Ranking.decideCollectWinner`, and `resolveLiturgicalColor`
// (js/liturgical-color.js) already correctly colors a winning feast red
// when `feastInfo.isMartyr` is true, white otherwise - so a Day within
// an Octave whose winning Kalendar entry is "Day N within the Octave of
// St. George" (etc.) was ALREADY being treated as the day's "feast"
// correctly; the actual bug was narrower: `isMartyr` was computed by
// testing /martyr/i against that winning entry's own `name`/`rank`
// strings only. The auto-generated Octave-day entry names ("Day II
// within the Octave of St. George", "Octave Day of St. George") never
// contain the word "martyr" themselves (only the Feast Day's own entry,
// "St. George, Martyr (Common Octave)", does) - so every Day within a
// Martyr's Octave was incorrectly falling through to white instead of
// inheriting the Feast's own red, exactly as this item describes.
//
// Audited all 71 "Octave"-related entries in data/kalendar.json against
// pages/Front/Ranking.tex's own Common/Simple Octave lists (lines 60-88)
// and found only 3 Octaves in this dataset are Martyr-based: St. George,
// St. Stephen, and St. Lawrence. Every other Octave (Epiphany, the BVM
// feasts, St. John Baptist's Nativity, St. John Evangelist, Sts. Peter &
// Paul, All Hallows, the Compassion of Our Lord) is non-martyr and was
// already correctly white with no mismatch - confirmed below with the
// Assumption's Octave as a representative non-martyr control.
//
// Fixed with a small `MARTYR_OCTAVE_NAMES` list and an `isMartyrEntry`
// helper (js/app.js, just above `resolveFeastRankToday`) rather than a
// more general cross-date Kalendar search, since the general approach is
// fragile here: e.g. "Octave Day of Sts. Peter & Paul" doesn't literally
// match either of that Feast's own split Kalendar entries ("St. Peter,
// Apostle" and the separate St. Paul commemoration), so a
// name-similarity search would need its own special-casing anyway, with
// no corresponding payoff since that Octave isn't a martyr's Octave in
// the first place.
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

const RED_RGB = "rgb(138, 31, 31)";
const WHITE_GOLD_RGB = "rgb(138, 109, 29)";

// St. George's Octave, 2026: Feast Day 23 April, Octave Day 30 April.
// 25 April (St. Mark) and 26 April (Easter II, which outranks the
// Octave in 2026) interrupt the Octave per the site's existing ranking
// logic - not touched by this fix, and not asserted on here beyond
// confirming they're simply *not* part of the Octave (their own
// established colors are a separate concern).
{
  const dom = runOnDate("2026-04-23T12:00:00Z", "#mass");
  const dot = dom.window.document.getElementById("massColorDot");
  check("23 April 2026 (St. George's Feast Day) is red", dot && dot.getAttribute("style").includes(RED_RGB));
}
for (const d of ["2026-04-24", "2026-04-27", "2026-04-28", "2026-04-29"]) {
  const dom = runOnDate(d + "T12:00:00Z", "#mass");
  const label = dom.window.document.getElementById("massSeasonLabel").textContent;
  const dot = dom.window.document.getElementById("massColorDot");
  check(`${d} (a Day within the Octave of St. George) is labeled as such`, /within the Octave of St\. George/.test(label));
  check(`${d} (a Day within the Octave of St. George) is red, inheriting the Feast's own color`, dot && dot.getAttribute("style").includes(RED_RGB));
}
{
  const dom = runOnDate("2026-04-30T12:00:00Z", "#mass");
  const label = dom.window.document.getElementById("massSeasonLabel").textContent;
  const dot = dom.window.document.getElementById("massColorDot");
  check('30 April 2026 is labeled "Octave Day of St. George"', label === "Octave Day of St. George, Greater Double" || /Octave Day of St\. George/.test(label));
  check("The Octave Day itself is also red", dot && dot.getAttribute("style").includes(RED_RGB));
}

// Control: the Assumption's Octave (a non-martyr Common Octave) must
// remain unaffected - already correctly white before this fix, and
// still white after it.
{
  const dom = runOnDate("2026-08-15T12:00:00Z", "#mass");
  const dot = dom.window.document.getElementById("massColorDot");
  check("15 August 2026 (the Assumption's Feast Day) is white/gold", dot && dot.getAttribute("style").includes(WHITE_GOLD_RGB));
}
{
  const dom = runOnDate("2026-08-16T12:00:00Z", "#mass");
  const label = dom.window.document.getElementById("massSeasonLabel").textContent;
  const dot = dom.window.document.getElementById("massColorDot");
  check("16 August 2026 (a Day within the Assumption's Octave) stays white/gold, no regression", dot && dot.getAttribute("style").includes(WHITE_GOLD_RGB));
}
{
  const dom = runOnDate("2026-08-22T12:00:00Z", "#mass");
  const label = dom.window.document.getElementById("massSeasonLabel").textContent;
  const dot = dom.window.document.getElementById("massColorDot");
  check('22 August 2026 is labeled "Octave Day of the Assumption"', /Octave Day of the Assumption/.test(label));
  check("The Assumption's Octave Day stays white/gold, no regression", dot && dot.getAttribute("style").includes(WHITE_GOLD_RGB));
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
