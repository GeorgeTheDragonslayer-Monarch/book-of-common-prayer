// Task #189 verification: George's corrections doc, Preparation for Holy
// Communion section: "The differences in the Prayers depending on if the
// person is a Priest or not should not be noted by 'or, for a Priest,'.
// Rather, based on the Layman/Deacon/Priest setting, it should
// automatically put in the correct text."
//
// data/preparation.json's "Prayer of St. Ambrose" cycle had five spots
// where a Priest's own wording differs from everyone else's, all
// previously transcribed as always-shown "(or, for a Priest: ...)"
// parentheticals. Re-encoded as `{{priest:default::priest}}` markers,
// resolved against `ministerRank` inside `escapeHtml` (js/app.js).
const fs = require("fs");
const { JSDOM } = require("jsdom");

function makeDom() {
  const html = fs.readFileSync("index.html", "utf8");
  const dom = new JSDOM(html, { url: "http://localhost/#preparation", runScripts: "outside-only", pretendToBeVisual: true });
  const { window } = dom;
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

function setMinister(doc, rank) {
  const btn = doc.querySelector(`#ministerMenu button[data-minister="${rank}"]`);
  if (!btn) throw new Error(`no minister button for ${rank}`);
  btn.click();
}

// The Prayer of St. Ambrose (task #168) defaults to showing only
// *today's* weekday portion, not all seven - since the five priest/
// non-priest wording differences are scattered across different
// weekdays (Sunday, Tuesday, Friday, and the standalone "I intend..."
// prayer), the test needs the "full" toggle so every occurrence is on
// the page regardless of which real-world weekday the suite happens to
// run on.
function showFullAmbrose(doc) {
  const btn = doc.querySelector('[data-inline-toggle="ambrosePortion"][data-value="full"]');
  if (!btn) throw new Error("no ambrosePortion full-mode button found");
  btn.click();
}

function bodyText(doc) {
  return doc.getElementById("preparationBody").textContent;
}

// Default (Layman): every occurrence should show the ordinary wording,
// with no leftover "(or, for a Priest" note anywhere, and no doubled-up
// whitespace from the substitution.
{
  const dom = makeDom();
  const doc = dom.window.document;
  showFullAmbrose(doc);
  const body = bodyText(doc);
  check("Layman: no leftover '(or, for a Priest' note anywhere on the page", !body.includes("or, for a Priest"));
  check("Layman: 'to approach so great a Mystery' (ordinary wording, not 'handle')", body.includes("to approach so great a Mystery"));
  check("Layman: 'grant me to assist at the Solemnity of the Mass' (ordinary wording)", body.includes("grant me to assist at the Solemnity of the Mass"));
  check("Layman: 'Who can worthily assist at this Sacrifice' (ordinary wording)", body.includes("Who can worthily assist at this Sacrifice"));
  check("Layman: 'teach us, thy unworthy servants to treat' (ordinary wording)", body.includes("teach us, thy unworthy servants to treat"));
  check("Layman: 'receive this sacrifice for the well-being of all' (no 'at my hands' addition)", body.includes("receive this sacrifice for the well-being of all"));
  check("Layman: 'I intend to assist at this celebration of the Mass and at the consecration of the Body' (ordinary wording)", body.includes("I intend to assist at this celebration of the Mass and at the consecration of the Body"));
  check("Layman: the Priest's own addition ('teach me, thy unworthy servant...priestly office') is absent", !body.includes("thou hast deigned to call to the priestly office"));
  check("Layman: no double-space artifacts from an empty substitution (e.g. 'sacrifice  for')", !body.includes("sacrifice  for"));
}

// Priest: every occurrence should show the Priest's own wording instead.
{
  const dom = makeDom();
  const doc = dom.window.document;
  showFullAmbrose(doc);
  setMinister(doc, "priest");
  const body = bodyText(doc);
  check("Priest: no leftover '(or, for a Priest' note anywhere on the page", !body.includes("or, for a Priest"));
  check("Priest: 'to handle so great a Mystery' (Priest's own wording)", body.includes("to handle so great a Mystery"));
  check("Priest: 'grant me to celebrate the Solemnity of the Mass' (Priest's own wording)", body.includes("grant me to celebrate the Solemnity of the Mass"));
  check("Priest: 'Who can worthily celebrate this Sacrifice' (Priest's own wording)", body.includes("Who can worthily celebrate this Sacrifice"));
  check("Priest: 'teach us, me thy unworthy priest, to treat' (Priest's own wording)", body.includes("teach us, me thy unworthy priest, to treat"));
  check("Priest: 'receive this sacrifice at my hands for the well-being of all' (Priest's addition present)", body.includes("receive this sacrifice at my hands for the well-being of all"));
  check("Priest: 'I intend to celebrate Mass and to consecrate the Body' (Priest's own wording)", body.includes("I intend to celebrate Mass and to consecrate the Body"));
  check("Priest: the inserted clause ('teach me, thy unworthy servant...priestly office') is present", body.includes("thou hast deigned to call to the priestly office"));
  check("Priest: the surrounding sentence still reads coherently ('office; teach me, I pray thee')", body.includes("priestly office; teach me, I pray thee"));
  // Note: "to approach so great a Mystery" also occurs, unrelated to
  // this marker, in Tuesday's own separate prayer ("I am unworthy to
  // approach so great a Mystery, by reason of my numberless sins...") -
  // so the real regression check is that Sunday's own "Holy Spirit, to"
  // phrase is followed by "handle," not "approach," specifically.
  check("Priest: Sunday's own phrase reads '...Holy Spirit, to handle...', not '...to approach...'", body.includes("by thy Holy Spirit, to handle so great a Mystery") && !body.includes("by thy Holy Spirit, to approach so great a Mystery"));
}

// Deacon: George's note names only Priest-vs-not, so Deacon should
// behave like everyone else (ordinary wording), not like a Priest.
{
  const dom = makeDom();
  const doc = dom.window.document;
  showFullAmbrose(doc);
  setMinister(doc, "deacon");
  const body = bodyText(doc);
  check("Deacon: shows the ordinary wording, not the Priest's ('to approach', not 'to handle')", body.includes("to approach so great a Mystery") && !body.includes("to handle so great a Mystery"));
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
