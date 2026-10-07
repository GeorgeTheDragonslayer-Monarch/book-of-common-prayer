// Task #197 verification: George's corrections doc, Reception of
// Converts section: "The stanzas of the Veni, Creator Spiritus should
// be formatted distinctly."
//
// The full seven-stanza hymn had previously been transcribed as one
// "canticle"-type block whose text ran all 28 lines together with only
// bare "\n" separators - no visual grouping distinguishing one stanza
// (four lines) from the next. Converted to the sitewide "hymnStanzas"
// type (task #169's own convention, used for Office Hymns, Benediction's
// O Salutaris/Tantum Ergo): each stanza now renders as its own
// <p class="hymn-stanza"> block (four lines joined by <br/>), with an
// ordinary paragraph gap between stanzas and the dropcap applied only
// to the very first stanza's first letter.
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

const dom = runOnDate("2026-07-08T12:00:00Z", "#reception");
const body = dom.window.document.getElementById("receptionBody").innerHTML;
const headingIdx = body.indexOf(">Veni, Creator Spiritus<");
check("Veni, Creator Spiritus heading found", headingIdx !== -1);
const afterHeading = body.slice(headingIdx);
const nextSectionIdx = afterHeading.indexOf('class="versicle"');
const hymnSlice = afterHeading.slice(0, nextSectionIdx === -1 ? 3000 : nextSectionIdx);

const stanzaParas = hymnSlice.match(/<p class="hymn-stanza">[\s\S]*?<\/p>/g) || [];
check("Exactly seven separate .hymn-stanza paragraphs render (one per stanza)", stanzaParas.length === 7);
check(
  "The first stanza's first letter is dropcapped",
  stanzaParas.length > 0 && /<span class="dropcap-letter">C<\/span>ome, Holy Ghost/.test(stanzaParas[0])
);
check(
  "The first stanza has exactly three internal <br/> line breaks (four lines)",
  stanzaParas.length > 0 && (stanzaParas[0].match(/<br\s*\/?>/g) || []).length === 3
);
check(
  "No other stanza's first letter is dropcapped",
  stanzaParas.slice(1).every((p) => !p.includes('class="dropcap-letter"'))
);
check(
  "The final stanza ends with the hymn's own closing 'Amen.'",
  stanzaParas.length === 7 && /Amen\.<\/p>$/.test(stanzaParas[6])
);
check(
  "All 28 lines of the hymn are present and in original order (spot-check first and last line of each of the 7 stanzas)",
  hymnSlice.includes("ome, Holy Ghost, Creator blest,") &&
    hymnSlice.includes("And fill the hearts which thou hast made.") &&
    hymnSlice.includes("To thee, the Comforter, we cry,") &&
    hymnSlice.includes("The sev'n-fold gifts of grace are thine,") &&
    hymnSlice.includes("Drive far away our wily foe,") &&
    hymnSlice.includes("Make thou to us the Father known;") &&
    hymnSlice.includes("The gifts that from the Spirit flow! Amen.")
);
check(
  "No stray run-on '.canticle'-class paragraph remains for this hymn",
  !hymnSlice.includes('<p class="canticle-line">') && !hymnSlice.includes('<p class="plain-text">Come, Holy Ghost')
);

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
