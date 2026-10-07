// Task #193 verification: George's corrections doc, Holy Mass section:
// "In the Collect, the second Collect gets the introduction 'Let us
// pray.' The Second Collect does not get an ending ('Through . . . ').
// If there be a Commemoration, and the Seasonal Prayers are said, the
// Second Collect becomes the third, and the third is omitted. If there
// be two Commemorations, and the Seasonal Prayers are said, the
// Commemorations are made in order, and the Seasonal Prayers are
// omitted. If there be more than two Commemorations, the first two
// Commemorations are made, the rest omitted. This is true for the
// Collect, Secret, and Postcommunion in the Mass."
//
// Matches Rubrics.tex's own general "Collects" rule ("only the first
// and the last receive the full ending"; "the Lord be with you is only
// said to introduce the first and second collects") and its
// "Commemorations" rule ("Once three Collects... have been said,
// further Commemorations cease and are omitted").
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

function massHtml(iso) {
  const dom = runOnDate(iso, "#mass");
  return dom.window.document.getElementById("massBody").innerHTML;
}

// Case 0 (no Commemoration today): 8 July 2026, a plain Trinitytide
// weekday with no Kalendar entry of its own - the Season's own ad
// libitum "Second"/"Third" Collect both still show, now with the new
// intro/ending rules applied between them.
{
  const html = massHtml("2026-07-08T12:00:00Z");
  const collectIdx = html.indexOf(">Collect<");
  const slice = html.slice(collectIdx, collectIdx + 2500);
  check(
    "No commemoration: 'Let us pray' (full versicle) appears before the Second Collect",
    /And with thy spirit\.<\/p><p class="versicle">Let us pray\.<\/p><div class="collect-heading commemoration">Second Collect/.test(slice)
  );
  check(
    "No commemoration: the Second Collect's own ending is stripped (no 'Through' clause)",
    /Second Collect: Of the Saints<\/div><p class="collect-block commemoration">[\s\S]*?serve thee in freedom and quietness\.<\/p>/.test(slice)
  );
  check(
    "No commemoration: the Third Collect keeps its full ending",
    slice.includes("Third Collect, ad libitum: For Devoted Friends") &&
      /Third Collect, ad libitum: For Devoted Friends<\/div><p class="collect-block commemoration">[\s\S]*?world without end\. Amen\.<\/p>/.test(slice)
  );
  check(
    "No commemoration: the Third Collect does NOT get its own extra 'Let us pray' (only 2 total in this block)",
    (slice.match(/Let us pray\./g) || []).length === 1
  );
}

// Case 1 (exactly one Commemoration, Season Prayers also called for):
// 5 July 2026 (within the Octave of Sts. Peter & Paul, an ordinary
// Trinitytide Sunday) - the Commemoration becomes "the second Collect"
// (gets the intro, loses its ending) and the Season's own "second"
// becomes "the third" (keeps its ending, no intro of its own).
{
  const html = massHtml("2026-07-05T12:00:00Z");
  const collectIdx = html.indexOf(">Collect<");
  const slice = html.slice(collectIdx, collectIdx + 2700);
  check(
    "One commemoration: no 'Second Collect' heading appears at all (the Season's own second is now the third)",
    !slice.includes("Second Collect")
  );
  check(
    "One commemoration: 'Let us pray' precedes the Commemoration itself",
    /Let us pray\.<\/p><div class="collect-heading commemoration">Commemoration:/.test(slice)
  );
  check(
    "One commemoration: the Commemoration's own ending is stripped",
    /Commemoration: Day VII within the Octave of Sts\. Peter &amp; Paul<\/div><p class="collect-block commemoration">[\s\S]*?beginning of religion\.<\/p>/.test(slice)
  );
  check(
    "One commemoration: the Season's own ad libitum Collect is now labeled 'Third Collect' and keeps its full ending",
    /Third Collect: Of the Saints<\/div><p class="collect-block commemoration">[\s\S]*?world without end\. Amen\.<\/p>/.test(slice)
  );
  check(
    "One commemoration: exactly one 'Let us pray' appears in this block (only before the Commemoration, not again before the demoted third)",
    (slice.match(/Let us pray\./g) || []).length === 1
  );
}

// Case 2+ (two Commemorations already fill both remaining slots): 9
// August 2026 (St. Romanus, Martyr, with a built-in secondary
// commemoration of the Vigil of St. Lawrence baked into the same Mass
// Proper) - per George's rule, the Season's ad libitum Collects are
// omitted entirely, and both Commemorations keep their own endings with
// no extra "Let us pray" inserted (matching how the source itself
// prints this specific nested pair, unrelated to the Season ad libitum
// mechanism).
{
  const html = massHtml("2026-08-09T12:00:00Z");
  const collectIdx = html.indexOf(">Collect<");
  const slice = html.slice(collectIdx, collectIdx + 2200);
  check(
    "Two commemorations: both St. Romanus and the Vigil of St. Lawrence appear",
    slice.includes("Commemoration: St. Romanus, Martyr") && slice.includes("Commemoration: Vigil of St. Lawrence")
  );
  check(
    "Two commemorations: the Season's ad libitum Collect ('Of the Saints'/'For Devoted Friends') is omitted entirely",
    !slice.includes("Second Collect") && !slice.includes("Third Collect")
  );
  check(
    "Two commemorations: neither Commemoration's ending was stripped (both keep 'world without end. Amen.')",
    (slice.match(/world without end\. Amen\./g) || []).length >= 2
  );
}

// Regression: Feast-wins-the-day direction (a Feast outranks its own
// week's Sunday, which is then commemorated) is a completely different
// code path from George's rule (which only concerns the Season's own ad
// libitum Collects) and must remain fully untouched - 16 August 2026,
// St. Joachim outranking Trinity X.
{
  const html = massHtml("2026-08-16T12:00:00Z");
  const collectIdx = html.indexOf(">Collect<");
  const slice = html.slice(collectIdx, collectIdx + 1400);
  check(
    "Feast-wins direction: St. Joachim's own Collect keeps its full ending",
    /Collect: St\. Joachim<\/div><p class="collect-block">[\s\S]*?world without end\. Amen\.<\/p>/.test(slice)
  );
  check(
    "Feast-wins direction: the commemorated Sunday (Trinity X) also keeps its own full ending, unstripped",
    /Commemoration: Trinity X<\/div><p class="collect-block commemoration">[\s\S]*?world without end\. Amen\.<\/p>/.test(slice)
  );
  check(
    "Feast-wins direction: no extra 'Let us pray' was inserted anywhere in this block",
    !slice.includes('<p class="versicle">Let us pray.</p>')
  );
}

// Regression: the same rule must apply identically to the Secret and
// the Postcommunion (George: "This is true for the Collect, Secret, and
// Postcommunion in the Mass") - spot-check 5 July 2026's Secret.
{
  const dom = runOnDate("2026-07-05T12:00:00Z", "#mass");
  const html = dom.window.document.getElementById("massBody").innerHTML;
  const secretIdx = html.indexOf('section-heading">Secret Prayers<');
  check("Secret section heading found", secretIdx !== -1);
  const slice = html.slice(secretIdx, secretIdx + 2000);
  check(
    "Secret: no 'Second Secret' heading appears (demoted to third, same as the Collect)",
    !slice.includes("Second Secret")
  );
  check(
    "Secret: 'Let us pray' precedes the Secret's own Commemoration, if a Secret text exists for it",
    slice.includes("Commemoration:") ? /Let us pray\.<\/p><div class="collect-heading commemoration">Commemoration:/.test(slice) : true
  );
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
