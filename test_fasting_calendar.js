const { JSDOM } = require("jsdom");
const fs = require("fs");

function makeDom() {
  const html = fs.readFileSync("index.html", "utf-8");
  const dom = new JSDOM(html, { url: "http://localhost/", runScripts: "dangerously", pretendToBeVisual: true });
  const { window } = dom;
  const scripts = ["js/data-psalter.js","js/data-kalendar.js","js/data-lectionary.js","js/data-lectionary-festivals.js",
    "js/data-evensong-template.js","js/data-mattins-template.js","js/data-foreoffice.js",
    "js/data-compline-template.js","js/data-prime-template.js","js/data-terce-template.js","js/data-sext-template.js","js/data-none-template.js",
    "js/data-collects-temporale.js","js/data-collects-sanctorale.js","js/data-kjv.js","js/data-apocrypha.js",
    "js/data-marian-anthems.js","js/data-athanasian-creed.js","js/data-great-litany.js","js/data-litany-saints.js",
    "js/data-mass-ordinary.js","js/data-confession.js","js/data-communion-sick.js","js/data-purification.js",
    "js/data-burial-child.js","js/data-confirmation.js","js/data-reception.js","js/data-matrimony.js","js/data-baptism.js",
    "js/data-unction.js","js/data-burial.js","js/data-adult-baptism.js","js/data-family.js",
    "js/data-asperges.js","js/data-foremass.js","js/data-preparation.js","js/data-thanksgiving.js","js/data-benediction.js",
    "js/data-vesper-dead.js","js/data-lauds-dead.js","js/data-matins-dead.js","js/data-votive.js",
    "js/computus.js","js/fasting.js","js/calendar.js","js/psalms.js","js/liturgical-color.js","js/office-variants.js",
    "js/ranking.js","js/scripture.js","js/app.js"];
  for (const s of scripts) {
    const el = window.document.createElement("script");
    el.textContent = fs.readFileSync(s, "utf-8");
    window.document.body.appendChild(el);
  }
  return dom;
}

console.log("=== Fasting + Home-today + Calendar-page test ===\n");
const dom = makeDom();
const doc = dom.window.document;
const win = dom.window;

// 1. Nav has a Calendar link
const calNavLink = doc.querySelector('[data-nav-link="calendar"]');
console.log("[1] Calendar nav link exists:", !!calNavLink);
console.log("[1] Calendar nav link points to #calendar:", calNavLink && calNavLink.getAttribute("href") === "#calendar");

// 2. Home page "Today" card renders with real content on initial load (default route is #home)
console.log("\n[2] page-home visible by default:", doc.getElementById("page-home").hidden === false);
const todayDateLabel = doc.getElementById("todayDateLabel").textContent.trim();
console.log("[2] todayDateLabel populated:", todayDateLabel.length > 0 && todayDateLabel !== "");
console.log("[2] todaySeasonLabel populated (not stuck on 'Loading...'):", doc.getElementById("todaySeasonLabel").textContent !== "Loading…");
const commemHtml = doc.getElementById("todayCommemorations").innerHTML;
const readingsHtml = doc.getElementById("todayReadings").innerHTML;
console.log("[2] todayReadings has some content:", readingsHtml.length > 0);
console.log("[2] commemorations block did not throw / is a string:", typeof commemHtml === "string");

// 3. Navigate to the Calendar page and check the grid renders
win.location.hash = "#calendar";
win.dispatchEvent(new win.Event("hashchange"));
console.log("\n[3] page-calendar now visible:", doc.getElementById("page-calendar").hidden === false);
const dayButtons = doc.querySelectorAll("[data-cal-page-day]");
console.log("[3] calendar grid has >= 28 day cells:", dayButtons.length >= 28);
console.log("[3] month label populated:", doc.getElementById("calPageMonthLabel").textContent.trim().length > 0);

// 4. Clicking a day cell sets currentDate and navigates to Mattins
// Note: jsdom (unlike real browsers) doesn't auto-fire 'hashchange' when a
// script sets location.hash, so the manual dispatch below mirrors the same
// pattern test_ux_fixes.js already uses - this matches the site's existing,
// already-shipped convention of plain onclick="location.hash='#...'" buttons
// on the Home page, which rely on the browser's real (automatic) hashchange
// firing in production.
const firstDay = dayButtons[0];
firstDay.click();
win.dispatchEvent(new win.Event("hashchange"));
console.log("\n[4] clicking a day navigates to office/mattins:", win.location.hash === "#office/mattins");
console.log("[4] page-office now visible:", doc.getElementById("page-office").hidden === false);

// 5. Month navigation works
win.location.hash = "#calendar";
win.dispatchEvent(new win.Event("hashchange"));
const monthBefore = doc.getElementById("calPageMonthLabel").textContent;
doc.getElementById("calPageNextMonth").click();
const monthAfter = doc.getElementById("calPageMonthLabel").textContent;
console.log("\n[5] next-month button changes the displayed month:", monthBefore !== monthAfter);
doc.getElementById("calPagePrevMonth").click();
const monthBack = doc.getElementById("calPageMonthLabel").textContent;
console.log("[5] prev-month button returns to the original month:", monthBack === monthBefore);

// 6. js/fasting.js classification spot checks (cross-validated against the 2026 Ordo - see ROADMAP.md)
console.log("\n=== fasting.js spot checks ===");
const checks = [
  ["2026-02-27", true, true],   // Friday after Ash Wed - fasting + Friday abstinence
  ["2026-03-01", false, true],  // Lent I Sunday - abstinence only
  ["2026-05-30", true, false],  // Vigil of Pentecost (Sat) - fasting only
  ["2026-08-14", true, true],   // Vigil of the Assumption (Fri) - both
  ["2026-10-31", true, false],  // Vigil of All Saints (Sat) - fasting only
  ["2026-12-24", true, true],   // Christmas Eve (Thu 2026) - both, regardless of weekday
  ["2026-12-25", false, false], // Christmas Day (Fri 2026) - Friday-abstinence exception
  ["2026-09-16", true, false],  // Ember Wednesday in September - fasting only
];
let allPass = true;
for (const [ds, expectFast, expectAbst] of checks) {
  const [y, m, d] = ds.split("-").map(Number);
  const r = win.getFastingStatus(new Date(Date.UTC(y, m - 1, d)));
  const pass = r.isFasting === expectFast && r.isAbstinence === expectAbst;
  if (!pass) allPass = false;
  console.log(`  ${ds} -> fasting=${r.isFasting} abstinence=${r.isAbstinence} [${pass ? "OK" : "FAIL, expected fasting=" + expectFast + " abstinence=" + expectAbst}]`);
}
console.log("[6] all fasting.js spot checks pass:", allPass);

// 7. Ember-day anchors added to computus.js are present and internally consistent
const anchors2026 = win.getLiturgicalYearAnchors(new Date(Date.UTC(2026, 2, 1))); // liturgical yr containing Mar 2026
console.log("\n[7] emberWedLent/emberFriLent/emberSatLent are Wed/Fri/Sat:",
  anchors2026.emberWedLent.getUTCDay() === 3 && anchors2026.emberFriLent.getUTCDay() === 5 && anchors2026.emberSatLent.getUTCDay() === 6);
console.log("[7] vigilOfPentecost is the day before whitsunday:",
  (anchors2026.whitsunday - anchors2026.vigilOfPentecost) === 86400000);

console.log("\n=== done ===");
