// Pending-corrections verification (10/2): "If commemorations are provided
// in the Collect, they should also be provided in the Secret and
// Postcommunion." Rubrics.tex:24 confirms the general rule explicitly:
// "Commemoration consists of praying the highest-ranking Feast Day's
// collect first followed by the lower ranking Feast Day(s)' collect. In
// the Mass, this also applies to the Secret and Postcommunion." The
// rendering mechanism (renderCommemoratedOration/renderSecondaryBlock in
// js/app.js) was already fully built to mirror a Collect-level
// `secondaryText`/`secondaryName` commemoration into the Secret and
// Postcommunion via `secretSecondaryText`/`postcommunionSecondaryText` -
// the actual bug was in the DATA, in three different shapes:
//
// 1. 31 Sanctorale entries had the secondary Secret/Postcommunion text
//    already transcribed, but under the wrong key name (`secretSecondary`/
//    `postcommunionSecondary`, missing the "Text" suffix every other field
//    in this schema uses) - so the code's `entry[secondaryField]` lookup
//    always found nothing. Renamed to match (plus one entry, `10-7`, with
//    the same mismatch at the tertiary level); 3 further entries (`5-3`,
//    `9-15`, `7-2`) had BOTH the correct and the stray wrong-key field
//    with identical text - the harmless duplicates were removed.
// 2. `1-25` (Conversion of St. Paul, commemorating St. Peter) had its
//    secondary Secret/Postcommunion text already transcribed, but
//    concatenated onto the end of the PRIMARY Secret/Postcommunion string
//    as one unsplit field, joined by the standard "Through." shorthand
//    marker (the same mid-series abbreviated ending task #202 dealt with
//    for single-prayer fields) - split into separate `secretText`/
//    `secretSecondaryText` (and the Postcommunion equivalent) fields, the
//    same way `text`/`secondaryText` were already correctly split for
//    this same date's Collect.
// 3. `Christmas I` (data/collects-temporale.json) had no secondary Secret/
//    Postcommunion text under ANY key - but PropSeas.tex's own rubric at
//    the Secret and Postcommunion (not just the Collect) explicitly reads
//    "Commemoration of Christmas from the Third Mass," cross-referencing
//    the Secret/Postcommunion already transcribed for the `Christmas`
//    periodKey (the Third Mass during the Day) rather than reprinting
//    them. Added `secretSecondaryText`/`postcommunionSecondaryText` to
//    `Christmas I`, copied verbatim from the already-sourced `Christmas`
//    entry's own `secretText`/`postcommunionText` - not new text, the
//    same reuse this rubric itself directs and the same `findLabelFor`
//    text-matching convention already used for the Sts. Paul/Peter pair.
//
// The remaining ~15 Sanctorale entries whose secondary commemoration has
// no Secret/Postcommunion text under any key, and no corresponding
// primary-source propers anywhere in this project's own .tex tree (the
// same gap documented for task #206's Commons.tex blocker and task #202's
// 8 untraceable Collect endings), are left unfixed and flagged in
// PENDING-CORRECTIONS.md rather than fabricated.
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

// 14 January 2026 - St. Hilary of Poitiers (a wrong-key-name fix),
// commemorating St. Felix of Nola.
{
  const dom = runOnDate("2026-01-14T12:00:00Z", "#mass");
  const html = dom.window.document.getElementById("massBody").innerHTML;
  check("St. Hilary's Mass is the day's winner", html.includes("Hilary"));
  check(
    "Secret shows the St. Felix of Nola commemoration (was silently dropped by the old wrong key name)",
    html.includes("Commemoration: St. Felix of Nola") && html.includes("that the same may avail for our perpetual succour")
  );
  check(
    "Postcommunion shows the same commemoration",
    html.includes("whose festival we celebrate")
  );
}

// 25 January 2026 - Conversion of St. Paul (the concatenated-text fix),
// commemorating St. Peter.
{
  const dom = runOnDate("2026-01-25T12:00:00Z", "#mass");
  const html = dom.window.document.getElementById("massBody").innerHTML;
  check("Conversion of St. Paul is mentioned (either as the day's own Mass or, on a year where a Sunday outranks it, as a commemoration)", html.includes("Conversion of St. Paul"));
  check(
    "The Collect's and Secret's St. Peter commemoration are both correctly labelled via the existing findLabelFor text-matching convention (matching 'Chair of St. Peter in Rome''s own already-sourced Collect/Secret text); the Postcommunion's own text doesn't happen to text-match any other entry, so it falls back to the generic 'Also commemorated' label - the same pre-existing fallback behavior this mechanism has always had, not a regression",
    (html.match(/Commemoration: Chair of St\. Peter in Rome/g) || []).length === 2 &&
      html.includes("Also commemorated within this Postcommunion")
  );
  check("Secret's split-out St. Peter commemoration text is present", html.includes("blessed Peter the Apostle may commend unto thee"));
  check("Postcommunion's split-out St. Peter commemoration text is present", html.includes("proclaim thy wonders in thine Apostle Peter"));
  check(
    "The primary Secret (St. Paul's own) now ends with a complete doxology rather than the bare 'Through.' marker it was split at",
    html.includes("by his prayer and advocacy. Through Jesus Christ thy Son our Lord, who liveth and reigneth with thee, in the unity of the Holy Ghost, God.")
  );
}

// 31 December 2023 - a Sunday within the Octave of Christmas (Christmas I)
// not itself outranked by any fixed feast that year, so its own Collect/
// Secret/Postcommunion - and the new Christmas-commemoration fix - render
// instead of some other day's winning Mass.
{
  const dom = runOnDate("2023-12-31T12:00:00Z", "#mass");
  const html = dom.window.document.getElementById("massBody").innerHTML;
  check("Christmas I's own Introit wins the day", html.includes("quiet silence"));
  check(
    "Secret now shows 'Commemoration: Christmas' (previously nothing - no secondary Secret existed under any key)",
    html.includes("Commemoration: Christmas")
  );
  check(
    "That commemoration's text is the Third Mass's own already-transcribed Secret, reused per PropSeas.tex's own 'from the Third Mass' rubric",
    html.includes("anctify, O Lord, by the new Birth of thine only-begotten Son")
  );
  check(
    "The Postcommunion shows the same Third Mass commemoration",
    (html.match(/operation of this mystery, O Lord, avail for the cleansing of our sins/g) || []).length === 1
  );
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
