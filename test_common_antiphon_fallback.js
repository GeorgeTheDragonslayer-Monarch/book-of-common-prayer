// Task #185 verification: "Hymns/Versicles/Antiphons should always come
// from the Day (Feria vs Feast sourcing) - if it [the Feast] lack
// anything, then its listed Common should be used."
//
// The Office Hymn slot already implemented this Feast -> Common -> Ferial
// priority chain (pickFeastCommonHymnLabel, task #90), but the group
// Psalm antiphon (festalPsalmAntiphon in js/app.js) and the
// Benedictus/Magnificat antiphon slot skipped straight from "feast's own
// sourced antiphon" to the plain ferial cycle, with no Common-fallback
// tier in between - meaning nearly every winning Feast without its own
// individually-transcribed antiphon (the large majority of
// collects-sanctorale.json's entries) wrongly showed that day's plain
// ferial-weekday antiphon instead of its Common's antiphon.
//
// St. Matthias, Apostle (24 Feb, 2nd Double - collects-sanctorale.json
// key "2-24") has no psalmAntiphon/benedictusAntiphon/
// secondEvensongMagnificatAntiphon of his own, but his name matches
// pickFeastCommonHymnLabel's "Apostle" pattern -> CommonApostles, whose
// six antiphon fields were newly sourced from Commons.tex this task.
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

function bodyOn(iso, hash) {
  const dom = runOnDate(iso, hash);
  return dom.window.document.getElementById("officeBody").textContent;
}

// 2026-02-24 is a plain Tuesday, well before Ash Wednesday 2026 (18 Feb
// is actually before this - double check season isn't Lenten). St.
// Matthias (2nd Double) should win the day outright.
let dom = runOnDate("2026-02-24T12:00:00Z", "#office/mattins");
let doc = dom.window.document;
let seasonLabel = doc.getElementById("seasonLabel") ? doc.getElementById("seasonLabel").textContent : "";
console.log("(seasonLabel on 2026-02-24: " + seasonLabel + ")");
let mattinsBody = doc.getElementById("officeBody").textContent;
check("St. Matthias wins his own day (24 Feb 2026) at Mattins", mattinsBody.includes("Matthias"));
check(
  "Mattins Psalm antiphon falls back to CommonApostles's psalmAntiphon (\"Greater love hath no man\")",
  mattinsBody.includes("Greater love hath no man")
);
check(
  "Benedictus antiphon falls back to CommonApostles's benedictusAntiphon (\"Ye which have forsaken all\")",
  mattinsBody.includes("Ye which have forsaken all")
);

dom = runOnDate("2026-02-24T12:00:00Z", "#office/evensong");
doc = dom.window.document;
let evensongBody = doc.getElementById("officeBody").textContent;
check(
  "Evensong Psalm antiphon falls back to CommonApostles's secondEvensongPsalmAntiphon (\"Firmly stablished\")",
  evensongBody.includes("Firmly stablished")
);
check(
  "Magnificat antiphon falls back to CommonApostles's secondEvensongMagnificatAntiphon (\"Be ye valiant in warfare\")",
  evensongBody.includes("Be ye valiant in warfare")
);

// Control 1: a Feast WITH its own sourced antiphon is unaffected by the
// new fallback tier (must still show its own text, not the Common's).
// St. Andrew (30 Nov) has psalmAntiphon "He was fain to attain unto God
// by the passion of the Cross" per Sanctorale.tex - confirm it still
// shows its own, not CommonApostles's fallback text.
dom = runOnDate("2026-11-30T12:00:00Z", "#office/mattins");
doc = dom.window.document;
let andrewBody = doc.getElementById("officeBody").textContent;
check(
  "St. Andrew (has his own sourced antiphon) is unaffected - does not show CommonApostles's fallback text",
  !andrewBody.includes("Greater love hath no man")
);

// Control 2: an ordinary plain feria (25 Aug 2026, per task #184's own
// test file, a plain weekday with no winning Feast) is unaffected -
// still shows the ferial-cycle antiphon, not any Common's.
dom = runOnDate("2026-08-25T12:00:00Z", "#office/mattins");
doc = dom.window.document;
let feriaBody = doc.getElementById("officeBody").textContent;
check(
  "An ordinary plain feria (25 Aug 2026) is unaffected - does not show CommonApostles's fallback text",
  !feriaBody.includes("Greater love hath no man") && !feriaBody.includes("Ye which have forsaken all")
);

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
