// Task #195 verification: George's corrections doc, Pastoral Rites
// section: Baptism of Infants - "'(he immerses)' should be in Rubric
// Red font colour." Baptism of Adults - "For the seven signings, the
// in-line rubric indicating the parts of the body should be in Rubric
// Red font colour. Parenthetical in-line rubrics should all be in
// Rubric Red font colour. The following rubric should all be in
// Rubric Red font colour: 'The Priest takes the Elect...' ... '(he
// immerses)' should be in Rubric Red font colour." Also: "The
// following should be normal font but centred and small caps: 'Hear
// the words of the Gospel, written by St. John, in the third Chapter,
// at the first Verse.'"
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

// Baptism of Infants
{
  const dom = runOnDate("2026-07-08T12:00:00Z", "#baptism");
  const body = dom.window.document.getElementById("baptismBody").innerHTML;
  check(
    "Infant Baptism: all three '(he immerses)' occurrences are rubric-red-inline",
    (body.match(/<span class="rubric-red-inline">\(he immerses\)<\/span>/g) || []).length === 3
  );
}

// Baptism of Adults
{
  const dom = runOnDate("2026-07-08T12:00:00Z", "#adult-baptism");
  const body = dom.window.document.getElementById("adultBaptismBody").innerHTML;
  const redCount = (needle) => (body.match(new RegExp('<span class="rubric-red-inline">' + needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + '</span>', "g")) || []).length;
  check("Adult Baptism: all three '(he immerses)' occurrences are rubric-red-inline", redCount("(he immerses)") === 3);
  check("Adult Baptism: '(On the ears:)' is rubric-red-inline", redCount("(On the ears:)") === 1);
  check("Adult Baptism: '(On the eyes:)' is rubric-red-inline", redCount("(On the eyes:)") === 1);
  check("Adult Baptism: '(On the nostrils:)' is rubric-red-inline", redCount("(On the nostrils:)") === 1);
  check("Adult Baptism: '(On the mouth:)' is rubric-red-inline", redCount("(On the mouth:)") === 1);
  check("Adult Baptism: '(On the breast:)' is rubric-red-inline", redCount("(On the breast:)") === 1);
  check("Adult Baptism: '(On the shoulders:)' is rubric-red-inline", redCount("(On the shoulders:)") === 1);
  check("Adult Baptism: all three '(To the Godfather:)' occurrences are rubric-red-inline", redCount("(To the Godfather:)") === 3);
  check("Adult Baptism: all three '(To the Godfather or Godmother:)' occurrences are rubric-red-inline", redCount("(To the Godfather or Godmother:)") === 3);
  check("Adult Baptism: all six '(To the Elect:)' occurrences are rubric-red-inline", redCount("(To the Elect:)") === 6);
  check(
    "Adult Baptism: the 'Hear the words of the Gospel...' line renders inside .solemn-declaration (normal font, centered, small caps), not .rubric",
    body.includes('<div class="solemn-declaration"><p class="plain-text">Hear the words of the Gospel, written by St. John, in the third Chapter, at the first Verse.</p></div>')
  );
  check(
    "Adult Baptism: the big 'Priest takes the Elect...' rubric is now fully Rubric Red, with no black-rubric-inline span around 'Trinity'",
    body.includes("thus invoking the Most Holy Trinity once only.") && !body.includes('<span class="rubric-black-inline">Trinity</span>')
  );
  check(
    "Adult Baptism: that same rubric is still a normal .rubric paragraph (i.e. still red overall, just without the black word)",
    /<p class="rubric">The Priest takes the Elect[\s\S]*?thus invoking the Most Holy Trinity once only\.<\/p>/.test(body)
  );
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
