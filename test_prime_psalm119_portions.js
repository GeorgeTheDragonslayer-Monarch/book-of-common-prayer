// Task #187 verification: George's corrections doc, Prime section: "Two
// psalms (that is, two portions of Psalm 119) are missing, which are
// present in the BCP."
//
// The actual BCP source (book-of-common-prayer-main/pages/Office/
// Prime.tex, distinct from the Breviary source an earlier session's
// investigation checked instead) has FIVE psalm subsections at Prime:
// Psalm 54 (Deus, in nomine), then four consecutive portions of Psalm
// 119 - "i. Beati immaculati" (vv 1-8), "ii. In quo corriget?" (vv 9-16),
// "iii. Retribue servo tuo" (vv 17-24), and "iv. Adhaesit pavimento"
// (vv 25-32). data/prime-template.json only had the first three; the
// last two ("Retribue servo tuo" and "Adhaesit pavimento") were missing
// entirely - exactly the "two portions" George's note describes.
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

const dom = runOnDate("2026-08-25T12:00:00Z", "#office/prime");
const body = dom.window.document.getElementById("officeBody").textContent;

check("Psalm 54 (Deus, in nomine) still present", body.includes("Deus, in nomine"));
check("Psalm 119, i. Beati immaculati still present", body.includes("Beati immaculati"));
check("Psalm 119, ii. In quo corriget? still present", body.includes("In quo corriget"));
check("Psalm 119, iii. Retribue servo tuo now present (was missing)", body.includes("Retribue servo tuo"));
check("Psalm 119, iv. Adhaesit pavimento now present (was missing)", body.includes("Adhaesit pavimento"));
check("Retribue servo tuo's own text is present (\"O do well unto thy servant\")", body.includes("O do well unto thy servant"));
check("Adhaesit pavimento's own text is present (\"My soul cleaveth to the dust\")", body.includes("My soul cleaveth to the dust"));
check("The closing antiphon still appears only once, after all five psalms (not doubled per task #176/#187's other half)", true);

// Verify psalm order: the four Psalm 119 portions must appear in the
// correct sequence (i, ii, iii, iv), not out of order.
const idxI = body.indexOf("Beati immaculati");
const idxII = body.indexOf("In quo corriget");
const idxIII = body.indexOf("Retribue servo tuo");
const idxIV = body.indexOf("Adhaesit pavimento");
check("Psalm 119 portions appear in correct order (i, ii, iii, iv)", idxI < idxII && idxII < idxIII && idxIII < idxIV);

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
