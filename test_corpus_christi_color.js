// Pending-corrections fix (10/3, task #213, item #10): "Corpus Christi
// is currently shown in green; it should be white/gold."
//
// Corpus Christi (Trinity Sunday + 4, a Thursday) has its own
// "Corpus Christi" periodKey (see js/calendar.js's buildAnchorList),
// but js/liturgical-color.js's seasonBaseColor had no rule naming it at
// all - unlike Christmas/Easter/Whitsunday/Trinity Sunday, which are all
// matched by one regex - so it fell through that function's generic
// green default, the same color an ordinary Trinitytide feria gets.
// Corpus Christi is a 1st Double Feast of Our Lord, so it should take
// the same white/gold every other such Feast on that line gets. Added
// an explicit `periodKey === "Corpus Christi"` check returning "white".
//
// This periodKey also covers the Feast's own privileged days
// immediately following it (the Friday and Saturday - see
// js/ranking.js's PRIVILEGED_OCTAVE_2ND_KEYS comment: "Corpus
// Christi|Sunday" is the Feast Day itself, a Thursday, "Sunday" being
// this data's own anchor-day label; "|Friday"/"|Saturday" are the two
// days after it), so those are checked too.
//
// Out of scope for this fix (PENDING-CORRECTIONS item #12, a separate,
// still-open item): the rest of Corpus Christi's Octave, which shares
// its periodKey with "Trinity I" per calendar.js's own comment - that's
// the general "Octave Day colour should follow the Feast's own colour"
// rule, not specific to Corpus Christi, and is intentionally left
// untouched here.
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

const WHITE_GOLD_RGB = "rgb(138, 109, 29)";
const GREEN_RGB = "rgb(47, 107, 63)";

function colorOf(dateStr) {
  const dom = runOnDate(dateStr + "T12:00:00Z", "#mass");
  const label = dom.window.document.getElementById("massSeasonLabel").textContent;
  const dot = dom.window.document.getElementById("massColorDot");
  return { label, style: dot ? dot.getAttribute("style") : null };
}

// Corpus Christi 2026 falls on 11 June under this site's own
// (Orthodox-Pascha-based) computus: Trinity Sunday is 7 June 2026, so
// Corpus Christi (+4) is 11 June, with its privileged Friday/Saturday
// on 12/13 June.
{
  const { label, style } = colorOf("2026-06-11");
  check('11 June 2026 is labeled "Corpus Christi"', label === "Corpus Christi");
  check("Corpus Christi itself is now white/gold, not green", style.includes(WHITE_GOLD_RGB));
}
{
  const { label, style } = colorOf("2026-06-12");
  check('12 June 2026 is labeled "Friday in Corpus Christi"', label === "Friday in Corpus Christi");
  check("The Friday within Corpus Christi's privileged days is also white/gold", style.includes(WHITE_GOLD_RGB));
}
{
  const { label, style } = colorOf("2026-06-13");
  check('13 June 2026 is labeled "Saturday in Corpus Christi"', label === "Saturday in Corpus Christi");
  check("The Saturday within Corpus Christi's privileged days is also white/gold", style.includes(WHITE_GOLD_RGB));
}

// Control: an ordinary Trinitytide weekday (well outside Corpus
// Christi's own periodKey) should still be green, confirming the fix
// didn't overshoot into the rest of Trinitytide.
{
  const { label, style } = colorOf("2026-06-16");
  check('16 June 2026 is an ordinary Trinitytide weekday ("Tuesday after the First Sunday after Trinity")', label === "Tuesday after the First Sunday after Trinity");
  check("That ordinary Trinitytide weekday is still green", style.includes(GREEN_RGB));
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
