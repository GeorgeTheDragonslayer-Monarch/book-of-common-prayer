// Pending-corrections fix (10/2-10/3, task #212): "In Holy Week, the
// proper titles should be used (e.g., 'Good Friday,' not 'Friday in
// [Holy/Palm Sunday] week')."
//
// Root cause: Holy Week (the Monday-Saturday following Palm Sunday)
// shares the single "Palm Sunday" periodKey bucket with the rest of
// that liturgical week in this site's data model (see app.js's
// isVeniteOmittedToday, which already has to compute Maundy Thursday/
// Good Friday/Easter Even directly from Easter's date for exactly this
// reason), so js/calendar.js's describeSeason generic fallback was
// printing "Thursday/Friday/Saturday in Palm Sunday" for the Triduum
// and "Monday/Tuesday/Wednesday in Palm Sunday" for the rest of the
// week - never a proper title for any day of this week.
//
// The fix needed no invented names: data/lectionary-temporale.json's
// own "Palm Sunday" bucket already keys its seven days "Sunday",
// "Holy Monday", "Holy Tuesday", "Spy Wednesday", "Maundy Thursday",
// "Good Friday", "Easter Even" (confirmed directly in the JSON) - the
// same six weekday names js/ranking.js's ALWAYS_SEASON_KEYS set and
// js/office-variants.js's Regina Caeli table already build their own
// "periodKey|dayLabel" lookups from. js/calendar.js's
// resolveLiturgicalDay already resolved this exact string into
// `dayLabel` for every day of this week; describeSeason just wasn't
// receiving it. Fixed by threading `dayLabel` into describeSeason and,
// for offsets 1-6 of the "Palm Sunday" periodKey, returning it directly
// instead of falling through to the generic "weekday in periodKey" form.
//
// Note on naming: this book's own Propers name the day before Easter
// "Easter Even," not "Holy Saturday" - see its own printed chapter
// title, pages/Propers/EasterEvenCover.tex:
// `\caption{\textsc{\Huge{Easter Even}}}`. "Holy Saturday" is used
// informally elsewhere in this codebase's own comments as a loose
// synonym for the same day, but the data-driven (and now
// screen-visible) name is "Easter Even", kept consistent with the rest
// of the site.
//
// Second half of this PENDING item - "Good Friday does not have a true
// Mass; the Mass of the Presanctified should be provided instead" -
// remains BLOCKED. Exhaustively grepped this project's entire .tex
// source tree for "Presanctified", "Veneration of the Cross", and
// "Adoration of the Cross" (also searched for any file named for Holy
// Week/Triduum/Presanctified): zero matches anywhere. PropSeas.tex's
// own Maundy Thursday/Good Friday sections contain only the plain
// 1928-BCP-style Collects (no Introit/Epistle/Gospel/Gradual/
// Offertory/Communion propers, and no description of the Presanctified
// rite itself). Building a full Mass of the Presanctified here would
// require fabricating liturgical text this project does not have -
// the same category of blocker as task #206's Commons.tex gap. See
// ROADMAP.md task #212 and PENDING-CORRECTIONS.md item #8.
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

// Holy Week 2026: Palm Sunday is 2026-04-05 (already established by
// test_asperges_text_passiontide.js), so Monday-Saturday following it
// are 2026-04-06 through 2026-04-11.
const expected = {
  "2026-04-05": "Palm Sunday", // offset 0 - unaffected by this fix, sanity check
  "2026-04-06": "Holy Monday",
  "2026-04-07": "Holy Tuesday",
  "2026-04-08": "Spy Wednesday",
  "2026-04-09": "Maundy Thursday",
  "2026-04-10": "Good Friday",
  "2026-04-11": "Easter Even",
};

for (const [dateStr, expectedLabel] of Object.entries(expected)) {
  const dom = runOnDate(dateStr + "T12:00:00Z", "#office/mattins");
  const label = dom.window.document.getElementById("seasonLabel").textContent;
  check(`${dateStr} seasonLabel is "${expectedLabel}"`, label === expectedLabel);
}

// Control: an ordinary week well outside Holy Week should be completely
// unaffected by this fix (still uses the generic "weekday in periodKey"
// form, since only the "Palm Sunday" periodKey got the new branch).
{
  const dom = runOnDate("2026-06-16T12:00:00Z", "#office/mattins"); // Tuesday after Trinity I, an ordinary week with no competing feast
  const label = dom.window.document.getElementById("seasonLabel").textContent;
  check(
    `An ordinary weekday outside Holy Week is unaffected (got "${label}")`,
    /after the .+ Sunday after Trinity$/.test(label)
  );
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
