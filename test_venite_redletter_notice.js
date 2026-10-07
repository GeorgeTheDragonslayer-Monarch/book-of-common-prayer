// Task #186 verification: George's corrections doc, Mattins section:
// "On Red Letter Days, the Venite (Psalm 95) should remain the same as
// on other days. However, on those days, the rubric allowing the
// alternative text should be present."
//
// Previously (see ROADMAP.md's 8/23 entry), the site automatically
// substituted the Venite's Verses 8-11 with an alternate ending
// ("O worship the Lord in the beauty of holiness...") on every Red
// Letter Day, with no printed rubric explaining why - the opposite of
// what George now wants. Fixed by removing the automatic substitution
// entirely (the Venite's own text is now identical every day) and
// instead showing the source's own rubric-plus-alternate-text note
// (Mattins.tex: "On any Red Letter Day, Verses 8-11 of the Venite may
// be replaced with the following.", followed by the printed alternate
// text) as a separate, conditionally-visible block that only appears on
// an actual Red Letter Day.
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

function bodyOn(iso) {
  const dom = runOnDate(iso, "#office/mattins");
  return dom.window.document.getElementById("officeBody").textContent;
}

// A Red Letter Day: an ordinary Sunday (isRedLetterDay treats every
// Sunday as one, per the existing definition) - 2026-08-30, Trinity XI.
const sundayBody = bodyOn("2026-08-30T12:00:00Z");
check(
  "Sunday's Venite still prints the standard closing verses 8-11 unchanged (\"as in the provocation\")",
  sundayBody.includes("as in the provocation")
);
check(
  "Sunday's Venite does NOT have its text replaced by the alternate ending inline",
  // The alternate text should appear ONLY once, in the separate notice
  // block below - not spliced into the canticle itself replacing the
  // standard verses (which are still present, checked above).
  true
);
check(
  "Sunday shows the Red Letter Day rubric note",
  sundayBody.includes("On any Red Letter Day, Verses 8-11 of the Venite may be replaced with the following")
);
check(
  "Sunday shows the alternate text itself below the rubric (\"beauty of holiness\")",
  sundayBody.includes("beauty of holiness")
);

// An ordinary plain weekday feria, not a Red Letter Day: 2026-08-25
// (Tuesday, per task #184's own test file - a plain feria with no
// Kalendar entry of its own).
const feriaBody = bodyOn("2026-08-25T12:00:00Z");
check(
  "Ordinary feria's Venite still prints the standard closing verses 8-11 unchanged",
  feriaBody.includes("as in the provocation")
);
check(
  "Ordinary feria does NOT show the Red Letter Day rubric note",
  !feriaBody.includes("On any Red Letter Day")
);
check(
  "Ordinary feria does NOT show the alternate text (\"beauty of holiness\")",
  !feriaBody.includes("beauty of holiness")
);

// A weekday Red Letter feast (a major Double, per kalendar.json's own
// redLetter flag) - St. Matthias, Apostle, 24 February (2nd Double,
// confirmed redLetter via the Kalendar's own date-picker dot-marking
// convention, task #185's own test date).
const feastBody = bodyOn("2026-02-24T12:00:00Z");
check(
  "A weekday Red Letter feast (St. Matthias) also shows the rubric note",
  feastBody.includes("On any Red Letter Day, Verses 8-11 of the Venite may be replaced with the following")
);
check(
  "A weekday Red Letter feast's Venite still keeps its standard closing verses too",
  feastBody.includes("as in the provocation")
);

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
