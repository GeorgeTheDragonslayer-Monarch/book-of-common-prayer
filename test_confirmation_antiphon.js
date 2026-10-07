// Task #198 verification: George's corrections doc, Sacrament of
// Confirmation section: "The text from the gabc file should be
// provided."
//
// Confirmation.tex's own rubric names an Antiphon ("Confirm, O Lord;
// what thou hast wrought in us, from thy holy temple, which is in
// Jerusalem"), said or sung while the Bishop washes his hands,
// "repeated after the Gloria Patri, as in the Introit" - but the site
// had only ever noted that its plainchant setting isn't reproduced
// (correct - no musical notation is rendered anywhere on this site),
// without ever transcribing the antiphon's own WORDS, even though
// resources/gabc/Confirmation/ConfirmationChant.gabc (English) and
// ConfirmationChantLatin.gabc (Latin) both embed the full bilingual
// text inline with the neume markup. Added as one bilingual "text"
// section, following the exact Introit convention (task #192):
// Antiphon, then the inline Gloria Patri, then the antiphon repeated.
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

const dom = runOnDate("2026-07-08T12:00:00Z", "#confirmation");
const body = dom.window.document.getElementById("confirmationBody").innerHTML;

check(
  "The antiphon's English text is present",
  body.includes("Confirm, O Lord, what thou hast wrought in us, from thy holy temple, which is in Jerusalem.")
);
check(
  "The antiphon's English text is repeated (appears twice, once at the start and once after the Gloria Patri)",
  (body.match(/Confirm, O Lord, what thou hast wrought in us, from thy holy temple, which is in Jerusalem\./g) || []).length === 2
);
check(
  "The inline Gloria Patri text is present, matching the sitewide Introit convention",
  body.includes("Glory be to the Father, and to the Son, and to the Holy Ghost: * as it was in the beginning, is now and ever shall be, world without end. Amen.")
);
check(
  "The still-accurate 'plainchant setting is not reproduced' rubric remains (musical notation genuinely isn't rendered)",
  body.includes("The traditional plainchant setting for this Antiphon is not reproduced here")
);

// Latin (languageMode "both") - confirm the underlying template data
// carries the Latin text too, matching the page's own bilingual
// convention throughout.
{
  const template = dom.window.CONFIRMATION_TEMPLATE;
  const antiphonSec = template.sections.find((s) => s.text && s.text.startsWith("Confirm, O Lord"));
  check("The Latin antiphon text is present in the template data", !!antiphonSec && antiphonSec.textLatin.includes("Confírma hoc, Déus, quod operátus es in nóbis"));
  check("The Latin text is also repeated after its own Gloria Patri", !!antiphonSec && (antiphonSec.textLatin.match(/Confírma hoc, Déus, quod operátus es in nóbis/g) || []).length === 2);
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
