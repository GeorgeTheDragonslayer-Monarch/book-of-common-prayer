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

// First, scan 2026 to find a concrete "other-sunday" and a "first-class-sunday"
// date, using the app's own classifySeasonDay + resolveCalendarDay, so the
// test doesn't guess dates by hand.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  win.eval("window.__testResolve = function(y,m0,d){ return resolveLiturgicalDay(new Date(Date.UTC(y,m0,d)), window.LECTIONARY_DATA, window.KALENDAR_DATA); };");
  let otherSundayDate = null, firstClassSundayDate = null, secondClassSundayDate = null;
  for (let m0 = 0; m0 < 12 && (!otherSundayDate || !firstClassSundayDate); m0++) {
    const daysInMonth = new Date(2026, m0 + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(Date.UTC(2026, m0, d));
      if (date.getUTCDay() !== 0) continue;
      const resolved = win.__testResolve(2026, m0, d);
      if (!resolved) continue;
      const cls = win.Ranking.classifySeasonDay(resolved);
      const hasPsalms = resolved.lectionary && resolved.lectionary.mattins && resolved.lectionary.mattins.psalms;
      if (cls === "other-sunday" && !otherSundayDate && hasPsalms) otherSundayDate = { y: 2026, m0, d };
      if (cls === "first-class-sunday" && !firstClassSundayDate && hasPsalms) firstClassSundayDate = { y: 2026, m0, d };
      if (cls === "second-class-sunday" && !secondClassSundayDate && hasPsalms) secondClassSundayDate = { y: 2026, m0, d };
    }
  }
  console.log("=== Scan results ===");
  console.log("other-sunday date found:", otherSundayDate);
  console.log("first-class-sunday date found:", firstClassSundayDate);
  console.log("second-class-sunday date found:", secondClassSundayDate);
  fs.writeFileSync("/tmp/t170_dates.json", JSON.stringify({ otherSundayDate, firstClassSundayDate, secondClassSundayDate }));
}

const { otherSundayDate, firstClassSundayDate, secondClassSundayDate } = JSON.parse(fs.readFileSync("/tmp/t170_dates.json", "utf-8"));

// 1. Other-class Sunday: toggle appears, defaults to 30-Day Psalter (Proper text hidden), switching shows Proper.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, otherSundayDate.y, otherSundayDate.m0, otherSundayDate.d);
  console.log("\n=== Other-class Sunday (" + JSON.stringify(otherSundayDate) + ") - Mattins ===");
  let body = getOfficeBody(win, doc, "#office/mattins");
  console.log("toggle present:", body.includes('data-inline-toggle="sundayPsalter"'));
  console.log("'30-Day Psalter' option shown:", body.includes("30-Day Psalter"));
  console.log("'Sunday Psalms' option shown:", body.includes("Sunday Psalms"));
  const monthlyBtn = doc.querySelector('button[data-inline-toggle="sundayPsalter"][data-value="monthly"]');
  const properBtn = doc.querySelector('button[data-inline-toggle="sundayPsalter"][data-value="proper"]');
  console.log("monthly (default) button is selected:", monthlyBtn && monthlyBtn.classList.contains("selected"));
  console.log("proper button NOT selected by default:", properBtn && !properBtn.classList.contains("selected"));
  const monthlyHeadings = Array.from(doc.querySelectorAll(".psalm-block h4")).map((e) => e.textContent).join(" | ");
  console.log("Psalm heading(s) shown under 30-Day default:", monthlyHeadings);
  if (properBtn) properBtn.click();
  body = doc.getElementById("officeBody").innerHTML;
  console.log("after switching to 'proper': proper button now selected:", doc.querySelector('button[data-inline-toggle="sundayPsalter"][data-value="proper"]').classList.contains("selected"));
  const properHeadings = Array.from(doc.querySelectorAll(".psalm-block h4")).map((e) => e.textContent).join(" | ");
  console.log("Psalm heading(s) shown under Sunday Psalms (should be Psalm 47 and 48):", properHeadings);
}

// 2. First Class Sunday: no toggle shown, Proper always used.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, firstClassSundayDate.y, firstClassSundayDate.m0, firstClassSundayDate.d);
  console.log("\n=== First Class Sunday (" + JSON.stringify(firstClassSundayDate) + ") - Mattins ===");
  const body = getOfficeBody(win, doc, "#office/mattins");
  console.log("no sundayPsalter toggle shown:", !body.includes('data-inline-toggle="sundayPsalter"'));
}

// 3. Second Class Sunday: toggle shown (same as other-sunday branch).
if (secondClassSundayDate) {
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, secondClassSundayDate.y, secondClassSundayDate.m0, secondClassSundayDate.d);
  console.log("\n=== Second Class Sunday (" + JSON.stringify(secondClassSundayDate) + ") - Mattins ===");
  const body = getOfficeBody(win, doc, "#office/mattins");
  console.log("toggle present:", body.includes('data-inline-toggle="sundayPsalter"'));
}

// 4. Plain weekday: no toggle (no Proper to choose from).
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  // Monday after the other-sunday date found above (plain feria in Trinitytide-like season)
  const d = new Date(Date.UTC(otherSundayDate.y, otherSundayDate.m0, otherSundayDate.d));
  d.setUTCDate(d.getUTCDate() + 1);
  clickCalendarDay(win, doc, d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  console.log("\n=== Plain weekday after that Sunday - Mattins ===");
  const body = getOfficeBody(win, doc, "#office/mattins");
  console.log("no sundayPsalter toggle shown:", !body.includes('data-inline-toggle="sundayPsalter"'));
}

// 5. A day a Feast wins outright over an otherwise-optional Sunday: All
// Saints' Day (Nov 1, always First Class, always wins) falls on a Sunday
// in 2026 that would otherwise classify as "other-sunday." The Feast's
// own dedicated Psalms must show, unaffected by the toggle, and no
// sundayPsalter toggle should appear (isSundayPsalmsOptional returns
// false whenever resolveFeastRankToday's winner is "feast").
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 10, 1); // 1 Nov 2026, All Saints
  console.log("\n=== All Saints' Day (falls on a Sunday, 1 Nov 2026) - Mattins ===");
  const body = getOfficeBody(win, doc, "#office/mattins");
  console.log("Feast's own Psalm antiphon shows (confirms the Feast, not the Sunday, is providing the Psalms here):", body.includes("The Lord is glorious in his saints"));
  console.log("no sundayPsalter toggle shown (Feast's own Psalms are not this toggle's concern):", !body.includes('data-inline-toggle="sundayPsalter"'));
}

console.log("\n=== Done ===");
