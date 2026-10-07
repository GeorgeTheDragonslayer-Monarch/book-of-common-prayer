// Task #191 verification: George's corrections doc, Prayers at the Foot
// of the Altar section: "Instead of the rubric about changes during
// Passiontide and Requiem Masses, the text should be automatically be
// changed during those times." Also: "'(Strike breast thrice.)' and
// '(Ministers rise.)' should be in Rubric Red font colour."
//
// ForeMass.tex's own rubric ("In Masses for the Dead, and in Masses of
// the Season from Passion Sunday to Holy Saturday exclusive, the
// following Psalm [Judica me] is omitted together with [Gloria Patri]
// and the repetition of the Antiphon") was previously just printed as
// static informational text, with the Judica me Psalm and the repeated
// Antiphon always shown regardless of date. The static rubric is now
// gone; the Psalm/Antiphon repeat is auto-omitted instead, based on
// shouldOmitForeMassPsalm (Passiontide via seasonKeyFor, the manual
// massDayChoice Requiem toggle, or automatically on All Souls' Day).
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

function domOn(iso) {
  return runOnDate(iso, "#foremass");
}

// An ordinary Sunday well outside Lent/Passiontide - 2026-08-30 (Trinity
// XI), and NOT a Requiem: the Judica me Psalm and its repeated Antiphon
// should print normally, and the old static rubric should be gone.
{
  const dom = domOn("2026-08-30T12:00:00Z");
  const body = dom.window.document.getElementById("foremassBody").textContent;
  check(
    "Ordinary Sunday: Judica me Psalm's opening verse is shown",
    body.includes("Give sentence with me, O God")
  );
  check(
    "Ordinary Sunday: the repeated Antiphon ('I will go unto the altar of God:') is shown",
    (body.match(/I will go unto the altar of God/g) || []).length === 2
  );
  check(
    "Ordinary Sunday: the old static Passiontide/Requiem rubric is gone",
    !body.includes("is omitted together with")
  );
  check(
    "Ordinary Sunday: 'Our help is in the Name' still follows",
    body.includes("Our help is in the Name")
  );
}

// Passion Sunday (this site's own Paschalion: Easter 2026 falls 12
// April, so Passion Sunday is 29 March) - the Psalm and the repeated
// Antiphon should now be auto-omitted, jumping straight to "Our help."
{
  const dom = domOn("2026-03-29T12:00:00Z");
  const body = dom.window.document.getElementById("foremassBody").textContent;
  check(
    "Passion Sunday: Judica me Psalm's opening verse is NOT shown",
    !body.includes("Give sentence with me, O God")
  );
  check(
    "Passion Sunday: the Antiphon appears only once (the opening statement, not repeated)",
    (body.match(/I will go unto the altar of God/g) || []).length === 1
  );
  check(
    "Passion Sunday: 'Our help is in the Name' still present, immediately usable",
    body.includes("Our help is in the Name")
  );
}

// A weekday within Passiontide before Palm Sunday - 2026-04-01.
{
  const dom = domOn("2026-04-01T12:00:00Z");
  const body = dom.window.document.getElementById("foremassBody").textContent;
  check(
    "Passion Week Wednesday: Judica me Psalm is NOT shown",
    !body.includes("Give sentence with me, O God")
  );
}

// Palm Sunday itself - 2026-04-05 - still within the "Passion Sunday to
// Holy Saturday exclusive" span per the rubric's own wording (exclusive
// of Holy Saturday only, so Palm Sunday itself is included).
{
  const dom = domOn("2026-04-05T12:00:00Z");
  const body = dom.window.document.getElementById("foremassBody").textContent;
  check(
    "Palm Sunday: Judica me Psalm is NOT shown",
    !body.includes("Give sentence with me, O God")
  );
}

// Regression: Easter Day itself (12 April 2026) is well past Passiontide
// - normal Psalm/Antiphon should be restored.
{
  const dom = domOn("2026-04-12T12:00:00Z");
  const body = dom.window.document.getElementById("foremassBody").textContent;
  check(
    "Easter Day: Judica me Psalm is shown again (outside Passiontide)",
    body.includes("Give sentence with me, O God")
  );
}

// All Souls' Day (2 November) - a Mass for the Dead by nature, so the
// Psalm/Antiphon should be auto-omitted even with no manual Requiem
// toggle touched.
{
  const dom = domOn("2026-11-02T12:00:00Z");
  const body = dom.window.document.getElementById("foremassBody").textContent;
  check(
    "All Souls' Day: Judica me Psalm is NOT shown (a Mass for the Dead by nature)",
    !body.includes("Give sentence with me, O God")
  );
}

// Manual Requiem toggle - an ordinary summer Sunday, well outside
// Passiontide, but with the Mass Ordinary page's own "Requiem Mass"
// massDay toggle clicked first: the Psalm/Antiphon should be omitted on
// the Foot-of-the-Altar page too, since massDayChoice is a single
// shared setting consulted regardless of which page is showing.
{
  const dom = runOnDate("2026-08-30T12:00:00Z", "#mass");
  const win = dom.window;
  const doc = win.document;
  const requiemBtn = Array.from(doc.querySelectorAll("button")).find((b) => b.textContent.trim() === "Requiem Mass");
  check("Requiem Mass toggle button found on the Mass page", !!requiemBtn);
  if (requiemBtn) requiemBtn.click();
  win.location.hash = "#foremass";
  win.dispatchEvent(new win.Event("hashchange"));
  const body = doc.getElementById("foremassBody").textContent;
  check(
    "Requiem Mass chosen: Judica me Psalm is NOT shown on the Foot-of-the-Altar page, even on an ordinary summer date",
    !body.includes("Give sentence with me, O God")
  );
}

// Rubric-red formatting: "(Strike breast thrice.)" (both Confiteor
// occurrences) and "(Ministers rise.)" should render with the
// rubric-red-inline styling class, matching the pre-existing
// "(The Priest rises. The Ministers bow.)" convention one line below.
{
  const dom = domOn("2026-08-30T12:00:00Z");
  const html = dom.window.document.getElementById("foremassBody").innerHTML;
  const strikeBreastMatches = html.match(/<span class="rubric-red-inline">\(Strike breast thrice\.\)<\/span>/g) || [];
  check(
    "Both '(Strike breast thrice.)' occurrences (Priest's and Ministers' Confiteor) render as rubric-red-inline",
    strikeBreastMatches.length === 2
  );
  check(
    "'(Ministers rise.)' renders as rubric-red-inline",
    html.includes('<span class="rubric-red-inline">(Ministers rise.)</span>')
  );
  check(
    "The pre-existing '(The Priest rises. The Ministers bow.)' rubric-red note is unaffected",
    html.includes('<span class="rubric-red-inline">(The Priest rises. The Ministers bow.)</span>')
  );
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
