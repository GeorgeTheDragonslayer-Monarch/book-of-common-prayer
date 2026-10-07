// Pending-corrections verification (10/2): "Passiontide is a sub-season
// of Lent, so the Gloria Patri (at the Introit) should not be said
// during Passiontide specifically - distinct rule from #6's Gloria in
// excelsis Lent-exclusion; need to verify Passiontide is modeled so this
// exclusion actually fires." Rubrics.tex's own "Gloria Patri" entry:
// "During Passiontide, the Gloria Patri is omitted in the Invitatory of
// Mattins, Responsory of the Minor Hours, Aspersion of the People,
// Introit, and Lavabo." The Introit's own "Introit" entry confirms the
// same for that specific case: "followed by the Gloria Patri (except in
// Passiontide) and the Introit repeated."
//
// Two places were found printing the Introit Mass's Gloria Patri
// unconditionally, with no Passiontide check at all (unlike Asperges's
// own Gloria Patri, already correctly gated per task #190):
//   1. introitOfDay (js/app.js) - the Introit's own inline Gloria Patri,
//      built under task #192.
//   2. The Lavabo (Psalm 26, data/mass-ordinary.json) - split into the
//      Psalm text and a separate Gloria Patri section, the latter now
//      flagged `seasonalOmit: "gloriaLavabo"` and checked the same way
//      as Asperges's own fix, via isPassiontideToday. Mass.tex gives no
//      Passiontide repeat-substitute for the Lavabo (unlike Asperges's
//      explicit "the psalm simply being repeated"), so none was added.
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

const GLORIA_PATRI = "Glory be to the Father, and to the Son, and to the Holy Ghost";

// Passion Sunday - 2026-03-29 (the same date already established as
// Passion Sunday by test_asperges_text_passiontide.js).
{
  const dom = runOnDate("2026-03-29T12:00:00Z", "#mass");
  const html = dom.window.document.getElementById("massBody").innerHTML;
  const introitIdx = html.indexOf("Introit</div>");
  const introitSlice = html.slice(introitIdx, introitIdx + 700);
  check(
    "Passion Sunday's Introit omits the Gloria Patri entirely",
    !introitSlice.includes(GLORIA_PATRI)
  );
  check(
    "Passion Sunday's Introit still repeats the Antiphon in full (just without the Gloria Patri between the two copies)",
    (introitSlice.match(/Give sentence with me, O God, and defend my cause against the ungodly people/g) || []).length === 2
  );
  const lavaboIdx = html.indexOf("Washing the Hands");
  const lavaboSlice = html.slice(lavaboIdx, lavaboIdx + 900);
  check(
    "Passion Sunday's Lavabo omits its Gloria Patri entirely",
    !lavaboSlice.includes(GLORIA_PATRI)
  );
  check(
    "Passion Sunday's Lavabo psalm text itself is still present and complete",
    lavaboSlice.includes("will wash my hands in innocency") && lavaboSlice.includes("will praise the Lord in the congregations.")
  );
}

// A weekday within Passiontide but before Palm Sunday - 2026-04-01 (same
// date already established by test_asperges_text_passiontide.js).
{
  const dom = runOnDate("2026-04-01T12:00:00Z", "#mass");
  const html = dom.window.document.getElementById("massBody").innerHTML;
  const introitIdx = html.indexOf("Introit</div>");
  const introitSlice = html.slice(introitIdx, introitIdx + 700);
  check(
    "A Passiontide weekday (1 April 2026) also omits the Introit's Gloria Patri",
    !introitSlice.includes(GLORIA_PATRI)
  );
}

// Control: Trinity IV (28 June 2026), well outside Passiontide - both
// the Introit's and the Lavabo's Gloria Patri should still print, to
// confirm the fix didn't overshoot into other seasons.
{
  const dom = runOnDate("2026-06-28T12:00:00Z", "#mass");
  const html = dom.window.document.getElementById("massBody").innerHTML;
  const introitIdx = html.indexOf("Introit</div>");
  const introitSlice = html.slice(introitIdx, introitIdx + 700);
  check(
    "An ordinary Sunday outside Passiontide (Trinity IV) still shows the Introit's Gloria Patri",
    introitSlice.includes(GLORIA_PATRI)
  );
  const lavaboIdx = html.indexOf("Washing the Hands");
  const lavaboSlice = html.slice(lavaboIdx, lavaboIdx + 900);
  check(
    "The same day's Lavabo still shows its own Gloria Patri",
    lavaboSlice.includes(GLORIA_PATRI)
  );
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
