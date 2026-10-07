// Task #194 verification: George's corrections doc, Holy Mass section:
// "The following rubric should be in Rubric Red font colour: 'The
// Gradual and Alleluia (or Tract) and (if provided) Sequence is here
// chanted by the Choir.'" and "The following rubric should be omitted,
// since it is automatically generated: 'The Proper Preface is then
// here said, if there be one, concluding with the following.'"
//
// The Gradual/Alleluia rubric previously wrapped "Alleluia" in the
// black-rubric-inline convention ({{Alleluia}} in the source data),
// which is meant for literal quoted spoken/sung text embedded inside a
// stage direction - but "Alleluia" here just names the chant, so the
// whole sentence should print in the ordinary uniform Rubric Red
// (task #89's own sitewide rubric-color audit missed this one). The
// Proper Preface rubric was superseded by task #85's own automatic
// daily Preface selection (the placeholder immediately below it
// already prints the correct Preface every day), making the static
// explanatory rubric redundant, so it's removed outright.
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

// An ordinary Trinitytide weekday, 8 July 2026.
const dom = runOnDate("2026-07-08T12:00:00Z", "#mass");
const html = dom.window.document.getElementById("massBody").innerHTML;

check(
  "Gradual/Alleluia rubric prints as one plain '.rubric' paragraph with no black-rubric-inline span around 'Alleluia'",
  html.includes('<p class="rubric">The Gradual and Alleluia (or Tract) and (if provided) Sequence is here chanted by the Choir.</p>')
);
check(
  "No rubric-black-inline span wraps 'Alleluia' anywhere near the Gradual rubric",
  !html.includes('<span class="rubric-black-inline">Alleluia</span>')
);
check(
  "The old static 'Proper Preface is then here said' rubric is gone",
  !html.includes("Proper Preface is then here said")
);
check(
  "The automatically-generated Proper Preface content itself still appears (task #85 unaffected) - Sunday's own Preface of the Trinity follows immediately",
  /Sanctus<\/div>/.test(html) && html.includes("we laud and magnify thy glorious Name")
);

// Regression: a day WITH its own Proper Preface (Trinity Sunday itself,
// 2026-06-07 - the Sunday after Whitsunday/Pentecost, which per this
// site's own Paschalion falls 2026-05-31) should still show that
// Preface's own proper text, just without the now-removed static
// rubric introducing it.
{
  const dom2 = runOnDate("2026-06-07T12:00:00Z", "#mass");
  const html2 = dom2.window.document.getElementById("massBody").innerHTML;
  check(
    "Trinity Sunday: no static Proper Preface rubric",
    !html2.includes("Proper Preface is then here said")
  );
  check(
    "Trinity Sunday: its own Proper Preface text (task #85) still renders",
    html2.includes("with thine only-begotten Son, and the Holy Ghost, art one God, one Lord")
  );
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
