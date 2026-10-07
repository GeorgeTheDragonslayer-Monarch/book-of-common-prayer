// Pending-corrections fix (10/3, task #214, item #11): "The Feast of
// the Compassion of Jesus Christ is missing from the Kalendar
// entirely."
//
// Investigation found this was never a missing-source problem (unlike
// item #8b's Mass of the Presanctified): PropSeas.tex places "Compassion
// of Our Lord Jesus Christ" (feastday "Divine Compassion") at "Friday
// after Trinity I" (Second Class Double, Simple Octave), and this site
// already had a COMPLETE "Compassion of Our Lord" entry in both
// data/collects-temporale.json (full Mass propers: Introit, Collect,
// Epistle, Gradual/Alleluia/Tract, Gospel, Offertory, Secret, Communion,
// Postcommunion) and data/lectionary-temporale.json (Office lessons for
// 3 days: the Feast Day itself - labeled "Sunday", this data's generic
// anchor-day label, same convention Corpus Christi's own Thursday Feast
// Day uses - plus "Friday" and "Saturday"). js/app.js even already had
// dedicated code expecting this periodKey to exist (the Mass Preface
// lookup, `if (periodKey === "Compassion of Our Lord") return
// window.MASS_PREFACES["Compassion of Our Lord"];`). The ONLY missing
// piece was an anchor in js/calendar.js's buildAnchorList - with none,
// resolveLiturgicalDay could never actually reach this periodKey on any
// date, so none of this already-sourced, already-wired data was ever
// reachable - "missing from the Kalendar entirely" in the sense George
// meant, even though the underlying material was already complete.
//
// Fixed by adding one anchor, mirroring Corpus Christi's own (Trinity
// Sunday + 4): `addDaysLocal(anchors.trinity[0], 5)` (Trinity I + 5 =
// the Friday of that week), given the periodKey name "Compassion of Our
// Lord". Fixing this surfaced two further gaps, both one-line additions
// to existing allow-lists rather than new logic: (1) the liturgical
// color (js/liturgical-color.js's seasonBaseColor had no rule for this
// periodKey, so it fell through to the green default, despite
// PropSeas.tex marking it "{FestiveWhite}" - same bug class as task
// #213's Corpus Christi fix, caught immediately after by testing it
// live); (2) an unwanted ad-libitum second/third Collect
// (resolveSecondThirdCollectRule's trinitytide bucket had no exclusion
// for this periodKey, so every Mass on this Feast was getting the
// generic "Of the Saints"/"ad libitum" bonus Collect that PropSeas.tex's
// own entry never calls for - added alongside Corpus Christi/Trinity
// Sunday/Whitsunday in that bucket's existing exclusion list).
//
// Left out of scope for this fix, not attempted here: the Octave Day
// itself (8 days after the Feast - PropSeas.tex's own rubric, "On the
// Octave Day of the Compassion of Our Lord (Simple), Mass is said as on
// the Feast") falls within what would otherwise be "Trinity II"'s own
// week under this one-anchor fix, and showing the Feast's Mass there
// too would need a second, date-relative override this pass didn't
// build. Per Ranking.tex's own "Simple Octave" rule ("The Days within
// the Octave are not commemorated"), the six days between the Feast and
// its Octave Day correctly show nothing at all related to this Feast,
// which is exactly what this one-anchor fix already produces without
// any further work.
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

// Trinity Sunday 2026 is 7 June; Trinity I is 14 June; the Feast of the
// Compassion of Our Lord (Friday after Trinity I) is therefore 19 June,
// with its Saturday on 20 June.
{
  const dom = runOnDate("2026-06-19T12:00:00Z", "#mass");
  const label = dom.window.document.getElementById("massSeasonLabel").textContent;
  const dot = dom.window.document.getElementById("massColorDot");
  const html = dom.window.document.getElementById("massBody").innerHTML;
  check('19 June 2026 is labeled "Compassion of Our Lord"', label === "Compassion of Our Lord");
  check("Its own Introit text renders (\"The thoughts of his Heart\")", dom.window.document.getElementById("massBody").textContent.includes("thoughts of his Heart"));
  check("Its liturgical colour is white/gold, not green", dot && dot.getAttribute("style").includes(WHITE_GOLD_RGB));
  check("No unwanted ad-libitum second/third Collect leaks in", !html.includes("ad libitum") && !html.includes("Of the Saints"));
  check("No literal 'undefined' anywhere on the page", !html.includes("undefined"));

  const domOffice = runOnDate("2026-06-19T12:00:00Z", "#office/mattins");
  check('The Daily Office also resolves this date to "Compassion of Our Lord"', domOffice.window.document.getElementById("seasonLabel").textContent === "Compassion of Our Lord");
}
{
  const dom = runOnDate("2026-06-20T12:00:00Z", "#mass");
  const label = dom.window.document.getElementById("massSeasonLabel").textContent;
  const dot = dom.window.document.getElementById("massColorDot");
  check('20 June 2026 (the Saturday after) is labeled "Saturday in Compassion of Our Lord"', label === "Saturday in Compassion of Our Lord");
  check("That Saturday is also white/gold", dot && dot.getAttribute("style").includes(WHITE_GOLD_RGB));
}

// Controls: the day before (an ordinary Trinity I Thursday) and the
// following Sunday (Trinity II) should be completely unaffected.
{
  const dom = runOnDate("2026-06-18T12:00:00Z", "#mass");
  const label = dom.window.document.getElementById("massSeasonLabel").textContent;
  check("18 June 2026 (the day before) is an ordinary Trinity I weekday, not this Feast", label !== "Compassion of Our Lord" && !label.includes("Compassion"));
}
{
  const dom = runOnDate("2026-06-21T12:00:00Z", "#mass");
  const label = dom.window.document.getElementById("massSeasonLabel").textContent;
  check('21 June 2026 is correctly "The Second Sunday after Trinity"', label === "The Second Sunday after Trinity");
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
