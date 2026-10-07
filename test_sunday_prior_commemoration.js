const { JSDOM } = require("jsdom");
const fs = require("fs");

function makeDom() {
  const html = fs.readFileSync("index.html", "utf-8");
  const dom = new JSDOM(html, { url: "http://localhost/", runScripts: "dangerously" });
  const { window } = dom;
  const scripts = ["js/data-psalter.js","js/data-kalendar.js","js/data-lectionary.js",
    "js/data-evensong-template.js","js/data-mattins-template.js","js/data-foreoffice.js","js/data-compline-template.js",
    "js/data-prime-template.js","js/data-terce-template.js","js/data-sext-template.js","js/data-none-template.js",
    "js/data-collects-temporale.js","js/data-collects-sanctorale.js","js/data-kjv.js","js/data-apocrypha.js",
    "js/data-marian-anthems.js","js/data-athanasian-creed.js","js/data-old-testament-canticles.js","js/data-great-litany.js","js/data-litany-saints.js",
    "js/data-mass-ordinary.js","js/data-mass-prefaces.js","js/data-confession.js","js/data-communion-sick.js","js/data-purification.js",
    "js/data-burial-child.js","js/data-confirmation.js","js/data-reception.js","js/data-matrimony.js","js/data-baptism.js",
    "js/data-unction.js","js/data-burial.js","js/data-adult-baptism.js","js/data-family.js",
    "js/data-asperges.js","js/data-foremass.js","js/data-preparation.js","js/data-thanksgiving.js","js/data-benediction.js",
    "js/data-vesper-dead.js","js/data-lauds-dead.js","js/data-matins-dead.js","js/data-votive.js",
    "js/data-feast-office-hymns.js",
    "js/computus.js","js/calendar.js","js/psalms.js","js/liturgical-color.js","js/office-variants.js",
    "js/ranking.js","js/scripture.js","js/app.js"];
  for (const s of scripts) {
    const el = window.document.createElement("script");
    el.textContent = fs.readFileSync(s, "utf-8");
    window.document.body.appendChild(el);
  }
  return dom;
}
function clickCalendarDay(win, doc, y, m0, day) {
  doc.getElementById("calendarToggle").click();
  const popover = doc.getElementById("calendarPopover");
  const yearSel = popover.querySelector(".cal-year-select");
  if (yearSel) { yearSel.value = String(y); yearSel.dispatchEvent(new popover.ownerDocument.defaultView.Event("change")); }
  const monthSel = popover.querySelector(".cal-month-select");
  if (monthSel) { monthSel.value = String(m0); monthSel.dispatchEvent(new popover.ownerDocument.defaultView.Event("change")); }
  const dayBtn = Array.from(popover.querySelectorAll("[data-cal-day]")).find((b) => parseInt(b.dataset.calDay, 10) === day);
  if (dayBtn) dayBtn.click();
}
function getOfficeBody(win, doc, hourHash) {
  win.location.hash = hourHash;
  win.dispatchEvent(new win.Event("hashchange"));
  return doc.getElementById("officeBody").innerHTML;
}
function run(label, y, m0, d, hourHash, checks) {
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, y, m0, d);
  console.log(`=== ${label} ===`);
  const body = getOfficeBody(win, doc, hourHash);
  checks(body);
  console.log();
}

// George's 9/2 note, task #142: "When the office is a feast day then the
// sunday prior is not commemorated." St. Gorazde of Prague (4 September
// 2026, a Friday, Double rank) wins outright over that week's ferial
// Office (periodKey "Trinity XII", the previous Sunday's own propers,
// which this site's data model carries across the whole following week -
// see task #141's ROADMAP entry). Previously his Collect/Mattins/Evensong
// each also commemorated "Trinity XII" underneath his own text - the
// Sunday prior, exactly what George's note means.
run("St. Gorazde Mass (4 September 2026, Friday, Double wins outright)", 2026, 8, 4, "#office/mass", (body) => {
  console.log("has St. Gorazde's own Collect:", /Collect:.*Gorazde/i.test(body));
  console.log("does NOT commemorate Trinity XII (the Sunday prior):", !/Commemoration: Trinity XII/.test(body));
});
run("St. Gorazde Mattins (4 September 2026)", 2026, 8, 4, "#office/mattins", (body) => {
  console.log("does NOT commemorate Trinity XII:", !/Commemoration: Trinity XII/.test(body));
});
run("St. Gorazde Evensong (4 September 2026)", 2026, 8, 4, "#office/evensong", (body) => {
  console.log("does NOT commemorate Trinity XII:", !/Commemoration: Trinity XII/.test(body));
});

// St. Andrew (30 November 2026, a Monday, 2nd Double) - same rule, a
// different week/season (Advent-adjacent) to confirm this isn't
// Trinitytide-specific.
run("St. Andrew Mass (30 November 2026, Monday, 2nd Double wins outright)", 2026, 10, 30, "#office/mass", (body) => {
  console.log("has St. Andrew's own Collect:", /Collect:.*Andrew/i.test(body));
  console.log("no season commemoration block at all:", !body.includes('collect-heading commemoration'));
});

// Candlemas/Purification (2 February 2025) lands ON a Sunday itself that
// year (Epiphany IV, a "Lesser Sunday" per Ranking.tex's own term) and
// wins outright (2nd Double beats a Lesser Sunday). This is NOT "the
// Sunday prior" - it's the actual Sunday being outranked today - so it
// should still be commemorated, confirming the fix is correctly scoped
// to ferias within a week, not every case where a season entry loses.
run("Candlemas Mass (2 February 2025, Sunday itself, 2nd Double wins over Epiphany IV)", 2025, 1, 2, "#office/mass", (body) => {
  console.log("has Candlemas' own Collect:", /Collect: Candlemas/.test(body));
  console.log("STILL commemorates Epiphany IV (today's own Sunday, not \"prior\"):", /Commemoration: Epiphany IV/.test(body));
});

// The reverse direction - a losing Feast (season wins) commemorated
// within the season's own Office - is a different pairing entirely and
// must stay untouched by this fix. 1 September 2026 (Tuesday, St. Giles,
// Memorial rank) doesn't win outright; the season's own Office is said,
// with St. Giles commemorated within it.
run("1 September 2026 (season wins, Memorial-rank St. Giles commemorated within it - untouched)", 2026, 8, 1, "#office/mattins", (body) => {
  console.log("St. Giles still commemorated within the season's Office (reverse direction unaffected):", /Commemoration: St\. Giles/.test(body));
});

// A Sunday genuinely at the top of the week (Easter III, 3 May 2026) with
// a nested sanctorale commemoration pair (Invention of the Cross / Sts.
// Alexander, Eventius, Theodulus, & Juvenalis) - confirms the season
// commemoration on an actual Sunday keeps showing alongside an unrelated
// nested secondary-collect pair, not swallowed by this fix.
run("3 May 2026 (Sunday itself, Easter III, nested commemoration pair - untouched)", 2026, 4, 3, "#office/mass", (body) => {
  const headings = [...body.matchAll(/Commemoration: ([^<]+)</g)].map((m) => m[1]);
  console.log("commemoration headings found:", headings);
  console.log("still shows Easter III (today's own Sunday):", headings.some((h) => h === "Easter III"));
});

console.log("=== Done ===");
