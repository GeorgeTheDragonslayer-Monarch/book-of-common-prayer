// Task #192 verification: George's corrections doc, Holy Mass section:
// "In the Introit, the Gloria Patri should be in line with the rest of
// the text, as well as the repeated sentence. Also, in the Introit, the
// 'Ps.' should be in italics."
//
// The Introit's Gloria Patri (task #161) and its repeated incipit had
// previously been rendered as visually separate elements - the Gloria
// Patri via renderVersicleLine (two versicle/response-styled <p>
// elements, the same dialogue look used for an actually-spoken versicle
// exchange) and the repeated incipit via its own separate `.antiphon`
// paragraph - even though the source prints the whole thing as one
// continuous sentence (Ant. Ps.verse. Gloria Patri. Ant.). All three
// pieces (Antiphon+Ps.verse, Gloria Patri, repeated incipit) now render
// inside a single `.plain-text` paragraph, and the literal "Ps."
// abbreviation itself is wrapped in <em>.
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

// An ordinary Sunday (Trinity XI, 30 August 2026) with a sourced Introit
// ("Haste thee, O God, unto my rescue...").
const dom = runOnDate("2026-08-30T12:00:00Z", "#mass");
const html = dom.window.document.getElementById("massBody").innerHTML;
const headingIdx = html.indexOf('<div class="section-heading">Introit</div>');
check("Introit section heading found", headingIdx !== -1);
// Narrow the slice to just the Introit's own paragraph (up to the next
// section heading or rubric), so checks don't accidentally pick up
// unrelated versicle/response markup elsewhere in the Mass further down
// the page.
const afterHeading = html.slice(headingIdx);
const nextTagIdx = afterHeading.indexOf("<p class=\"rubric\">", 40);
const introitSlice = afterHeading.slice(0, nextTagIdx === -1 ? 900 : nextTagIdx);

check(
  "The Introit's Antiphon+Ps.verse, Gloria Patri, and repeated Antiphon are all inside ONE <p class=\"plain-text\"> element (no separate versicle/response/antiphon <p> tags)",
  (() => {
    const m = introitSlice.match(/<p class="plain-text">([\s\S]*?)<\/p>/);
    if (!m) return false;
    const inner = m[1];
    // Pending-corrections fix (10/2): the repeated text at the end is now
    // the FULL Antiphon ("Haste thee ... that seek after my soul."), not
    // just its first colon-delimited clause - the paragraph should end
    // with the whole Antiphon repeated, past its second colon.
    return inner.includes("Haste thee, O God, unto my rescue")
      && inner.includes("Glory be to the Father, and to the Son, and to the Holy Ghost")
      && /that seek after my soul\.\s*<\/p>$/.test(m[0]);
  })()
);
check(
  "No separate versicle/response <p> elements remain for the Gloria Patri",
  !introitSlice.includes('<p class="versicle">') && !introitSlice.includes('<p class="response">')
);
check(
  "No separate '.antiphon'-class <p> remains for the repeated incipit",
  !introitSlice.includes('<p class="antiphon">')
);
check(
  "The literal 'Ps.' abbreviation is wrapped in <em>",
  introitSlice.includes("<em>Ps.</em>")
);
check(
  "The Psalm verse text itself follows immediately after the italicized 'Ps.'",
  introitSlice.includes("<em>Ps.</em> Let them be turned backward")
);
check(
  "The Gloria Patri's own text is present in full, not abbreviated",
  introitSlice.includes("as it was in the beginning, is now and ever shall be, world without end. Amen.")
);
check(
  "The repeated Antiphon ('Haste thee, O God, unto my rescue:') appears twice total on the page (opening + repeat)",
  (introitSlice.match(/Haste thee, O God, unto my rescue:/g) || []).length === 2
);
check(
  "The repeat is the FULL Antiphon, past its second colon ('...my deliverance: let mine enemies...'), not just the first clause - appears twice (opening + repeat)",
  (introitSlice.match(/let mine enemies be ashamed and confounded that seek after my soul\./g) || []).length === 2
);

// Regression: an Introit whose Antiphon has no colon at all should still
// render as one continuous paragraph and not crash, even though its
// "incipit" is its own full Antiphon text (task #161's own documented
// 12-exception case) - spot-check via Christmas Day, whose Introit
// ("Unto us a Child is born...") is a different text shape.
const domXmas = runOnDate("2025-12-25T12:00:00Z", "#mass");
const bodyXmas = domXmas.window.document.getElementById("massBody").textContent;
check(
  "Christmas Day's Introit still renders without crashing",
  bodyXmas.length > 0 && bodyXmas.includes("Introit")
);

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
