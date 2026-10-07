// Regression test for the liturgical-color fix (8/27, per Augustine's
// WebsiteNotes_2026-08-26.txt review: "a Sunday around the 30th [of
// August]... should be green" and "Today (August 26)... should show
// GREEN"). js/liturgical-color.js's resolveLiturgicalColor() used to
// independently re-scan the raw Kalendar array for any martyr-named entry
// with rank !== "Commemoration" and force red whenever the season's base
// color was green - completely ignoring whether that martyr actually won
// the day (per feastInfo/Ranking.decideCollectWinner). That fired even on
// Sundays and ferias where the martyr was merely listed, never observed.
const { JSDOM } = require("jsdom");
const fs = require("fs");

function makeDom() {
  const html = fs.readFileSync("index.html", "utf-8");
  const dom = new JSDOM(html, { url: "http://localhost/", runScripts: "dangerously" });
  const { window } = dom;
  const scripts = ["js/data-psalter.js","js/data-kalendar.js","js/data-lectionary.js",
    "js/data-evensong-template.js","js/data-mattins-template.js","js/data-foreoffice.js",
    "js/data-compline-template.js",
    "js/data-prime-template.js","js/data-terce-template.js","js/data-sext-template.js","js/data-none-template.js",
    "js/data-collects-temporale.js","js/data-collects-sanctorale.js","js/data-kjv.js","js/data-apocrypha.js",
    "js/data-marian-anthems.js","js/data-athanasian-creed.js","js/data-old-testament-odes.js","js/data-great-litany.js","js/data-litany-saints.js",
    "js/data-mass-ordinary.js","js/data-confession.js","js/data-communion-sick.js","js/data-purification.js",
    "js/data-burial-child.js","js/data-confirmation.js","js/data-reception.js","js/data-matrimony.js","js/data-baptism.js",
    "js/data-unction.js","js/data-burial.js","js/data-adult-baptism.js","js/data-family.js",
    "js/data-asperges.js","js/data-foremass.js","js/data-preparation.js","js/data-thanksgiving.js","js/data-benediction.js",
    "js/data-vesper-dead.js","js/data-lauds-dead.js","js/data-matins-dead.js","js/data-votive.js",
    "js/computus.js","js/calendar.js","js/psalms.js","js/liturgical-color.js","js/office-variants.js",
    "js/ranking.js","js/scripture.js","js/app.js"];
  for (const s of scripts) {
    const el = window.document.createElement("script");
    el.textContent = fs.readFileSync(s, "utf-8");
    window.document.body.appendChild(el);
  }
  return dom;
}

const dom = makeDom();
const win = dom.window;

// resolveFeastRankToday is defined inside app.js's own closure, not
// exposed globally - reimplemented here identically (see js/app.js) so
// this test can drive resolveLiturgicalColor exactly the way the real
// calendar dots/popover do.
function resolveFeastRankToday(resolved) {
  const none = { winner: "season", tier: 0, name: null, rank: null, isMartyr: false, transferred: false };
  if (!win.Ranking) return none;
  const kalEntries = resolved.kalendar || [];
  let best = null;
  for (const entry of kalEntries) {
    if (!entry.rank) continue;
    const decision = win.Ranking.decideCollectWinner(resolved, entry.rank);
    if (decision.winner !== "feast") continue;
    if (!best || decision.feastTier > best.tier) {
      best = {
        winner: "feast", tier: decision.feastTier, name: entry.name, rank: entry.rank,
        isMartyr: /martyr/i.test(entry.name || "") || /martyr/i.test(entry.rank || ""),
        transferred: false,
      };
    }
  }
  return best || none;
}

let pass = 0, fail = 0;
function check(label, cond) { if (cond) { pass++; } else { fail++; console.log("FAIL:", label); } }

const cases = [
  [2026, 7, 26, "green", "Aug 26 2026 (Wed, Trinity XI - Pope St. Zephyrinus merely commemorated, not observed)"],
  [2026, 7, 30, "green", "Aug 30 2026 (Sunday, Trinity XII - Sts. Felix & Adauctus merely commemorated)"],
  [2026, 7, 11, "green", "Aug 11 2026 (Tue, Trinity IX - Sts. Tiburtius & Susanna merely commemorated)"],
  [2026, 7, 1, "white", "Aug 1 2026 (Chains of St. Peter wins, non-martyr, despite Holy Maccabees also listed)"],
  [2026, 7, 5, "white", "Aug 5 2026 (Our Lady of the Snows wins, non-martyr, despite St. Oswald also listed)"],
  [2026, 7, 7, "white", "Aug 7 2026 (Most Holy Name of Jesus wins, non-martyr)"],
  [2026, 7, 10, "red", "Aug 10 2026 (St. Lawrence, Martyr - actually wins - positive control)"],
];

for (const [y, m0, d, expected, label] of cases) {
  const date = new Date(Date.UTC(y, m0, d));
  const resolved = win.resolveLiturgicalDay(date, win.LECTIONARY_TEMPORALE || win.LECTIONARY_DATA, win.KALENDAR_DATA);
  const feastInfo = resolveFeastRankToday(resolved);
  const colorKey = win.resolveLiturgicalColor(resolved, feastInfo);
  check(`${label} -> expected ${expected}, got ${colorKey}`, colorKey === expected);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exitCode = 1;
