// Pending-corrections fix (10/3, task #212, item #9): "Candlemas (the
// Purification, and similar Festivals with their own ceremonial) should
// have the proper rites from the BCP and Missal included with the Mass
// (e.g., the candle-blessing/procession rite), not just an ordinary
// Mass."
//
// Unlike item #8b's Mass of the Presanctified, this one is NOT blocked:
// pages/Propers/PropTime.tex gives the Blessing of the Candles and the
// Procession for 2 February in full (five Collects for the blessing
// itself, the distribution antiphons built on the Nunc Dimittis, the
// procession antiphons, and the closing dialogue) - it was simply never
// rendered anywhere on this site. Transcribed verbatim into
// data/candlemas-rite.json and wired into js/app.js's renderMassPage via
// a new candlemasRiteHtml(resolved) helper, prepended before the
// ordinary Mass content.
//
// Per PropTime.tex's own rubric ("If it happen that this Feast be
// transferred, only the Blessing and Distribution of the Candles and
// the Procession take place today. Mass is said of the Office
// occurring"), this rite is tied to the fixed calendar date (2
// February, kalendarKey "2-2") rather than to whichever Office/Mass
// actually wins that day - so it renders unconditionally on 2 February
// regardless of ranking outcome, and not on any other date.
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

// Candlemas itself, 2 February 2026.
{
  const dom = runOnDate("2026-02-02T12:00:00Z", "#mass");
  const html = dom.window.document.getElementById("massBody").innerHTML;
  check("Candlemas Mass page shows the Blessing of the Candles heading", html.includes("Blessing and Distribution of the Candles"));
  check("Candlemas Mass page shows the Procession heading", html.includes("The Procession"));
  check("The blessing's own Collects are present (Simeon's petition)", html.includes("who on this day didst fulfil the petition of Simeon"));
  check("The Nunc Dimittis distribution antiphon is present", html.includes("A light to lighten the Gentiles"));
  check("The procession antiphon is present", html.includes("O Sion, adorn thy bride-chamber"));
  check("The closing procession dialogue is present", html.includes("Let us proceed in peace") && html.includes("In the name of Christ"));
  check("The ordinary Mass propers for the day still render after the rite (Introit)", dom.window.document.getElementById("massBody").textContent.includes("We have waited, O God"));
  check("No literal unrendered {{...}} black-rubric markup leaks through", !html.includes("{{"));
  check("No literal 'undefined' anywhere in the rendered rite", !html.includes("undefined"));
}

// Control: the day before and the day after Candlemas should show none
// of this rite's content.
{
  const domBefore = runOnDate("2026-02-01T12:00:00Z", "#mass");
  const htmlBefore = domBefore.window.document.getElementById("massBody").innerHTML;
  check("1 February does NOT show the Candlemas rite", !htmlBefore.includes("Blessing and Distribution of the Candles"));

  const domAfter = runOnDate("2026-02-03T12:00:00Z", "#mass");
  const htmlAfter = domAfter.window.document.getElementById("massBody").innerHTML;
  check("3 February does NOT show the Candlemas rite", !htmlAfter.includes("Blessing and Distribution of the Candles"));
}

// Non-regression: an ordinary day's Mass page (no rite involved at all)
// still renders normally.
{
  const dom = runOnDate("2026-06-28T12:00:00Z", "#mass");
  const html = dom.window.document.getElementById("massBody").innerHTML;
  check("An ordinary Sunday's Mass page still renders without the rite or any error", !html.includes("Blessing and Distribution of the Candles") && !html.includes("undefined"));
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
