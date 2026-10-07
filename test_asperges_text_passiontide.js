// Task #190 verification: George's corrections doc, Eucharistic Devotions
// section: "The text for the Asperges, me is missing. Instead of the
// rubric about Passiontide, the change should automatically be made
// during Passiontide."
//
// data/asperges.json previously named the "Asperges, me" antiphon and its
// Psalm 51 verse only via rubric ("beginning the Antiphon {{Thou shalt
// purge me.}} ... the Psalm {{Have mercy upon me, O God.}}"), with no
// actual sung text - even though the referenced chant file
// (resources/gabc/Asperges.gabc) embeds the real bilingual text inline
// with its musical notation. That text is now transcribed as two `text`
// sections. Separately, the static rubric "The following Gloria Patri is
// omitted in Passiontide, the psalm simply being repeated" has been
// replaced with an automatic swap: the Gloria Patri now renders outside
// Passiontide, and the same psalm verse repeats in its place during
// Passiontide (isPassiontideToday, js/app.js, reusing seasonKeyFor's
// existing "passiontide" bucket).
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
  const dom = runOnDate(iso, "#asperges");
  return dom.window.document.getElementById("aspergesBody").textContent;
}

// The page always contains BOTH the "Asperges, me" section and the
// (always-rendered, season-independent) "Vidi Aquam" section below it,
// including Vidi Aquam's own unconditional Gloria Patri - so any check
// scoped to the *Asperges-specific* Gloria Patri/psalm-repeat swap must
// only look at the text before the "Vidi Aquam" heading, or it will pick
// up Vidi Aquam's own unrelated Gloria Patri too.
function aspergesPortion(fullBody) {
  const idx = fullBody.indexOf("Vidi Aquam");
  return idx === -1 ? fullBody : fullBody.slice(0, idx);
}

// An ordinary Sunday well outside Passiontide: 2026-08-30, Trinity XI.
const ordinaryBody = bodyOn("2026-08-30T12:00:00Z");
check(
  "Ordinary Sunday: the 'Asperges, me' antiphon text is now present",
  ordinaryBody.includes("Thou shalt purge me, O Lord, with hyssop, and I shall be clean")
);
check(
  "Ordinary Sunday: the psalm verse text is now present",
  ordinaryBody.includes("Have mercy upon me, O God, after thy great goodness")
);
// The page defaults to English-only display (languageMode), and
// page-asperges isn't one of the pages the language-toggle click handler
// re-renders live - so rather than fight that unrelated, pre-existing
// gap, check the Latin text directly on the underlying template data
// (which the page *would* render correctly once in "both"/"latin" mode,
// per every other bilingual "text" section sitewide).
{
  const dom = runOnDate("2026-08-30T12:00:00Z", "#asperges");
  const template = dom.window.ASPERGES_TEMPLATE;
  const antiphonSec = template.sections.find((s) => s.text && s.text.startsWith("Ant. Thou shalt purge me"));
  const psalmSec = template.sections.find((s) => s.text && s.text.startsWith("Have mercy upon me") && !s.seasonalOnly);
  check(
    "Ordinary Sunday: the Latin antiphon is present in the template data",
    !!antiphonSec && antiphonSec.textLatin.includes("Aspérges me, Dómine, hyssópo, et mundábor")
  );
  check(
    "Ordinary Sunday: the Latin psalm verse is present in the template data",
    !!psalmSec && psalmSec.textLatin.includes("Miserére méi, Déus, secúndum mágnam misericórdiam túam")
  );
}
const ordinaryAspergesOnly = aspergesPortion(ordinaryBody);
check(
  "Ordinary Sunday: the Gloria Patri is shown (in the Asperges section itself)",
  ordinaryAspergesOnly.includes("Glory be to the Father, and to the Son, and to the Holy Ghost")
);
check(
  "Ordinary Sunday: the psalm verse is NOT doubled (Gloria Patri shown instead of a repeat)",
  (ordinaryAspergesOnly.match(/Have mercy upon me, O God, after thy great goodness/g) || []).length === 1
);
check(
  "Ordinary Sunday: the old static Passiontide rubric is gone",
  !ordinaryBody.includes("is omitted in Passiontide")
);

// Passion Sunday itself (5th Sunday in Lent) - 2026-03-29, per this
// site's own Paschalion (Orthodox reckoning: Easter 2026 falls April 12,
// one week after the Western date, confirmed via getLiturgicalYearAnchors).
const passionSundayFull = bodyOn("2026-03-29T12:00:00Z");
const passionSundayBody = aspergesPortion(passionSundayFull);
check(
  "Passion Sunday: the antiphon text is still present",
  passionSundayBody.includes("Thou shalt purge me, O Lord, with hyssop, and I shall be clean")
);
check(
  "Passion Sunday: the Gloria Patri is NOT shown (Asperges section only, not Vidi Aquam's own below)",
  !passionSundayBody.includes("Glory be to the Father, and to the Son, and to the Holy Ghost")
);
check(
  "Passion Sunday: the psalm verse is repeated instead (appears twice)",
  (passionSundayBody.match(/Have mercy upon me, O God, after thy great goodness/g) || []).length === 2
);

// A weekday within Passiontide but before Palm Sunday - 2026-04-01
// (Wednesday of Passion Week).
const passionWeekdayBody = aspergesPortion(bodyOn("2026-04-01T12:00:00Z"));
check(
  "Passion Week Wednesday: the Gloria Patri is NOT shown",
  !passionWeekdayBody.includes("Glory be to the Father, and to the Son, and to the Holy Ghost")
);
check(
  "Passion Week Wednesday: the psalm verse is repeated instead (appears twice)",
  (passionWeekdayBody.match(/Have mercy upon me, O God, after thy great goodness/g) || []).length === 2
);

// Palm Sunday - 2026-04-05 - seasonKeyFor's "passiontide" bucket matches
// both "Passion Sunday" and "Palm Sunday" leads, so this should behave
// the same as Passion Sunday above.
const palmSundayBody = aspergesPortion(bodyOn("2026-04-05T12:00:00Z"));
check(
  "Palm Sunday: the Gloria Patri is NOT shown",
  !palmSundayBody.includes("Glory be to the Father, and to the Son, and to the Holy Ghost")
);
check(
  "Palm Sunday: the psalm verse is repeated instead (appears twice)",
  (palmSundayBody.match(/Have mercy upon me, O God, after thy great goodness/g) || []).length === 2
);

// Regression: Eastertide's pre-existing Vidi Aquam section (and its own
// Gloria Patri, unrelated to the new seasonalOmit flag) must be
// unaffected - Easter Day 2026-04-12 (this site's own Paschalion).
const easterBody = bodyOn("2026-04-12T12:00:00Z");
check(
  "Easter Day: Vidi Aquam heading is present",
  easterBody.includes("Vidi Aquam")
);
check(
  "Easter Day: Vidi Aquam's own antiphon text is present",
  easterBody.includes("I beheld water") && easterBody.includes("issuing out from the temple")
);
check(
  "Easter Day: Vidi Aquam's own Gloria Patri still appears (unaffected by the new Asperges-specific flag)",
  (easterBody.match(/Glory be to the Father, and to the Son, and to the Holy Ghost/g) || []).length >= 1
);
check(
  "Easter Day: the ordinary Asperges antiphon/psalm text is also still present (both are always shown, per the source's own structure)",
  easterBody.includes("Thou shalt purge me, O Lord, with hyssop, and I shall be clean")
);

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
