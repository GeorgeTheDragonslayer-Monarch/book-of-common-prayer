// Task #181 verification: a 1st/2nd Double transferred away from a
// First-Class Sunday (Lent I-IV, per FIRST_CLASS_SUNDAY_PERIODS in
// ranking.js) must no longer appear on that Sunday's own Kalendar line,
// since decideCollectWinner's "first-class-sunday" classification is a
// hard block and the pre-existing transfer machinery (resolveTransferCluster
// et al., tasks #92/#109) already relocates it elsewhere. renderKalendarLine
// previously never consulted Ranking.requiresTransfer at all, so the
// transferred-away feast still wrongly printed on the blocked Sunday.
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

// 2021-03-21 = Lent IV (Laetare), a First-Class Sunday. St. Benedict, Abbot
// (21 March, 2nd Double) is hard-blocked and transferred to 22 March.
let dom = runOnDate("2021-03-21T12:00:00Z", "#office/mattins");
let doc = dom.window.document;
let kalendarLine = doc.getElementById("kalendarLine").textContent;
check(
  "St. Benedict no longer prints on the blocked Lent IV Sunday's Office Kalendar line",
  !kalendarLine.includes("Benedict")
);

dom = runOnDate("2021-03-21T12:00:00Z", "#mass");
doc = dom.window.document;
let massKalendarLine = doc.getElementById("massKalendarLine") ? doc.getElementById("massKalendarLine").textContent : "";
check(
  "St. Benedict no longer prints on the blocked Lent IV Sunday's Mass Kalendar line",
  !massKalendarLine.includes("Benedict")
);

// The transfer target day (22 March 2021) is unaffected by this fix (the
// transferred-in feast is rendered via the separate transfer-notice
// machinery in the office body, not via the Kalendar line) - confirm the
// pre-existing transfer notice itself still fires, i.e. this fix didn't
// regress task #92/#109's own mechanism.
dom = runOnDate("2021-03-22T12:00:00Z", "#office/mattins");
doc = dom.window.document;
let officeBody = doc.getElementById("officeBody").textContent;
check(
  "St. Benedict's transfer notice still appears on 22 March 2021 (transfer destination)",
  officeBody.includes("Benedict") && officeBody.includes("Transferred here from")
);

// Control: an ordinary feria with a lesser (non-transfer-bound, tier < 6)
// commemoration must still show it on the Kalendar line - this fix must not
// hide anything beyond what genuinely requires transfer.
dom = runOnDate("2026-08-26T12:00:00Z", "#office/mattins");
doc = dom.window.document;
let controlLine = doc.getElementById("kalendarLine").textContent;
check(
  "An ordinary Memorial-rank commemoration on a plain feria still prints on the Kalendar line (control, unaffected by this fix)",
  controlLine.includes("Zephyrinus")
);

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
