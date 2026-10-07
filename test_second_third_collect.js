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
    "js/data-feast-office-hymns.js","js/data-seasonal-prayers.js",
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
  return doc.getElementById("massBody").innerHTML;
}
function run(label, y, m0, d, checks) {
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, y, m0, d);
  console.log(`=== ${label} (${y}-${m0 + 1}-${d}) ===`);
  const body = getOfficeBody(win, doc, "#mass");
  checks(body);
  console.log();
}

// George's 9/2 note, task #145: "only show 2nd/3rd Collect when rubric
// calls for it." Old behavior: unconditional "For Devoted Friends" after
// every Mass Collect/Secret/Postcommunion. New behavior: season-bucket
// rule table sourced from PropSeas.tex/PropTime.tex's own per-Sunday
// rubrics, only active when a season Mass (not a winning Feast) is said.

run("Advent I: 2nd=Mary in Advent, 3rd=persecutors, no old 'For Devoted Friends'", 2026, 10, 29, (body) => {
  console.log("Second Collect heading present:", body.includes("Second Collect: Of St. Mary in Advent"));
  console.log("Third Collect = persecutors:", body.includes("Third Collect: Against the Persecutors of the Church"));
  console.log("NOT the old ad libitum default:", !body.includes("ad libitum: For Devoted Friends"));
});

run("Advent II (self-ref Advent I + Mary in Advent)", 2026, 11, 6, (body) => {
  console.log("Second Collect = self-ref Advent I:", body.includes("Second Collect: Advent I"));
  console.log("Third Collect = Mary in Advent:", body.includes("Third Collect: Of St. Mary in Advent"));
});

run("Trinitytide ordinary Sunday: 2nd=of Saints, 3rd=ad libitum(Devoted Friends)", 2026, 5, 28, (body) => {
  console.log("Second Collect = Of the Saints:", body.includes("Second Collect: Of the Saints"));
  console.log("Third Collect ad libitum = For Devoted Friends:", body.includes("ad libitum: For Devoted Friends"));
});

run("Trinity Sunday itself: no rule (major Feast of the Lord)", 2026, 5, 7, (body) => {
  console.log("No Second Collect heading:", !body.includes("Second Collect:"));
  console.log("No Third Collect heading:", !body.includes("Third Collect"));
});

run("Ash Wednesday: 2nd=of Saints, 3rd=Living and Departed", 2026, 1, 25, (body) => {
  console.log("Second Collect = Of the Saints:", body.includes("Second Collect: Of the Saints"));
  console.log("Third Collect = Living and Departed:", body.includes("Third Collect: For the Living and Departed"));
});

run("Lent I (self-ref Ash Wednesday + Living/Departed)", 2026, 2, 1, (body) => {
  console.log("Second Collect = self-ref Ash Wednesday:", body.includes("Second Collect: Ash Wednesday"));
  console.log("Third Collect = Living and Departed:", body.includes("Third Collect: For the Living and Departed"));
});

run("Passion Sunday: 2nd only (self-ref Ash Wednesday), no 3rd", 2026, 2, 29, (body) => {
  console.log("Second Collect = self-ref Ash Wednesday:", body.includes("Second Collect: Ash Wednesday"));
  console.log("No Third Collect heading:", !body.includes("Third Collect"));
});

run("Palm Sunday: no rule at all (Holy Week)", 2026, 3, 5, (body) => {
  console.log("No Second Collect heading:", !body.includes("Second Collect:"));
});

run("Easter Monday: 2nd only (self-ref Easter Day), no 3rd", 2026, 3, 13, (body) => {
  console.log("Second Collect = self-ref Easter Day:", body.includes("Second Collect: Easter Day"));
  console.log("No Third Collect heading:", !body.includes("Third Collect"));
});

run("Easter Wednesday: 2nd (self-ref Easter Day) + 3rd (persecutors)", 2026, 3, 15, (body) => {
  console.log("Second Collect = self-ref Easter Day:", body.includes("Second Collect: Easter Day"));
  console.log("Third Collect = persecutors:", body.includes("Third Collect: Against the Persecutors of the Church"));
});

run("Easter II: 2nd=Mary in Eastertide, 3rd=persecutors", 2026, 3, 26, (body) => {
  console.log("Second Collect = Mary in Eastertide:", body.includes("Second Collect: Of St. Mary in Eastertide"));
  console.log("Third Collect = persecutors:", body.includes("Third Collect: Against the Persecutors of the Church"));
});

run("A winning Feast day (Annunciation, 25 March): no 2nd/3rd Collect at all", 2026, 2, 25, (body) => {
  console.log("No Second Collect heading:", !body.includes("Second Collect:"));
  console.log("No old ad libitum default either:", !body.includes("ad libitum: For Devoted Friends"));
});


run("Epiphany II: 2nd=Mary after Christmas, 3rd=persecutors", 2026, 0, 18, (body) => {
  console.log("Second Collect = Mary after Christmas:", body.includes("Second Collect: Of St. Mary after Christmas"));
  console.log("Third Collect = persecutors:", body.includes("Third Collect: Against the Persecutors of the Church"));
});

run("Epiphany III: same rule as Epiphany II", 2026, 0, 25, (body) => {
  console.log("Second Collect = Mary after Christmas:", body.includes("Second Collect: Of St. Mary after Christmas"));
  console.log("Third Collect = persecutors:", body.includes("Third Collect: Against the Persecutors of the Church"));
});

run("Epiphany IV before 2 Feb (2026-2-1): still Mary after Christmas + persecutors", 2026, 1, 1, (body) => {
  console.log("Second Collect = Mary after Christmas:", body.includes("Second Collect: Of St. Mary after Christmas"));
  console.log("Third Collect = persecutors:", body.includes("Third Collect: Against the Persecutors of the Church"));
});

run("Epiphany IV after 2 Feb (2030-2-3): switches to Of the Saints + ad libitum", 2030, 1, 3, (body) => {
  console.log("Second Collect = Of the Saints:", body.includes("Second Collect: Of the Saints"));
  console.log("Third Collect ad libitum = For Devoted Friends:", body.includes("ad libitum: For Devoted Friends"));
});

run("Epiphany V: Of the Saints + ad libitum", 2027, 1, 7, (body) => {
  console.log("Second Collect = Of the Saints:", body.includes("Second Collect: Of the Saints"));
  console.log("Third Collect ad libitum = For Devoted Friends:", body.includes("ad libitum: For Devoted Friends"));
});

run("Septuagesima: Of the Saints + ad libitum", 2026, 1, 8, (body) => {
  console.log("Second Collect = Of the Saints:", body.includes("Second Collect: Of the Saints"));
  console.log("Third Collect ad libitum = For Devoted Friends:", body.includes("ad libitum: For Devoted Friends"));
});

console.log("=== Done ===");
