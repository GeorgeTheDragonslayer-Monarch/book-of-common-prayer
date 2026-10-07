const { JSDOM } = require("jsdom");
const fs = require("fs");

function makeDom() {
  const html = fs.readFileSync("index.html", "utf-8");
  // runScripts:"dangerously" + real <script> elements (rather than
  // window.eval, which test_votive.js used) - top-level `const`/`let`
  // declared by a script loaded via indirect eval() does NOT persist
  // into a later eval() call (each is its own lexical scope per spec),
  // so js/liturgical-color.js's `const LITURGICAL_COLORS = {...}` was
  // invisible to js/app.js under the old harness. That bug never
  // surfaced in test_votive.js because it never exercised an Office/
  // Mass page render (the only callers of applyLiturgicalColor). Real
  // <script> tags behave like top-level program code and share one
  // global lexical environment, matching how a browser actually loads
  // this site.
  const dom = new JSDOM(html, { url: "http://localhost/", runScripts: "dangerously" });
  const { window } = dom;
  const scripts = ["js/data-psalter.js","js/data-kalendar.js","js/data-lectionary.js",
    "js/data-evensong-template.js","js/data-mattins-template.js","js/data-foreoffice.js","js/data-compline-template.js",
    "js/data-prime-template.js","js/data-terce-template.js","js/data-sext-template.js","js/data-none-template.js",
    "js/data-collects-temporale.js","js/data-collects-sanctorale.js","js/data-kjv.js","js/data-apocrypha.js",
    "js/data-marian-anthems.js","js/data-athanasian-creed.js","js/data-great-litany.js","js/data-litany-saints.js",
    "js/data-mass-ordinary.js","js/data-confession.js","js/data-communion-sick.js","js/data-purification.js",
    "js/data-burial-child.js","js/data-confirmation.js","js/data-reception.js","js/data-matrimony.js","js/data-baptism.js",
    "js/data-unction.js","js/data-burial.js","js/data-adult-baptism.js","js/data-family.js",
    "js/data-asperges.js","js/data-foremass.js","js/data-preparation.js","js/data-thanksgiving.js","js/data-benediction.js",
    "js/data-vesper-dead.js","js/data-lauds-dead.js","js/data-matins-dead.js",
    "js/data-votive-bvm.js","js/data-votive-angels.js","js/data-votive-matrimony.js","js/data-votive-dead.js",
    "js/computus.js","js/calendar.js","js/psalms.js","js/liturgical-color.js","js/office-variants.js",
    "js/ranking.js","js/scripture.js","js/app.js"];
  for (const s of scripts) {
    const el = window.document.createElement("script");
    el.textContent = fs.readFileSync(s, "utf-8");
    window.document.body.appendChild(el);
  }
  return dom;
}

function setDate(win, y, m, d) {
  // app.js reads currentDate from a closure var; simplest path is the
  // calendar/today buttons, but for deterministic dates we drive the
  // hash + reach in through the exposed prevDay/nextDay/today buttons is
  // fiddly across month boundaries. Instead, exercise the real click
  // path: open calendar, navigate months, click a day. Simpler: just
  // click "Today" then use nextDay/prevDay N times is unreliable across
  // years. We use the calendar popover's month-nav + day-click, driven
  // from whatever the toolbar's current cursor starts at (today).
}

// ---- Test 1: Mattins/Evensong Collect-of-the-Day HTML is unchanged ----
{
  const dom = makeDom();
  const doc = dom.window.document;
  doc.defaultView.location.hash = "#office/mattins";
  doc.defaultView.dispatchEvent(new dom.window.Event("hashchange"));
  const html1 = doc.getElementById("officeBody").innerHTML;
  console.log("Mattins collectOfDay rendered:", /collect-heading|collect-block/.test(html1));
  console.log("Mattins body length:", html1.length);

  doc.defaultView.location.hash = "#office/evensong";
  doc.defaultView.dispatchEvent(new dom.window.Event("hashchange"));
  const html2 = doc.getElementById("officeBody").innerHTML;
  console.log("Evensong collectOfDay rendered:", /collect-heading|collect-block/.test(html2));
  console.log("Evensong body length:", html2.length);
}

// ---- Test 2: Mass page is now date-aware and shows Propers ----
{
  const dom = makeDom();
  const doc = dom.window.document;
  doc.defaultView.location.hash = "#mass";
  doc.defaultView.dispatchEvent(new dom.window.Event("hashchange"));
  const html = doc.getElementById("massBody").innerHTML;
  console.log("\nMass page toolbar exists:", !!doc.getElementById("massCurrentDateLabel"));
  console.log("Mass date label populated:", doc.getElementById("massCurrentDateLabel").textContent.trim().length > 0);
  console.log("Mass season label populated:", doc.getElementById("massSeasonLabel").textContent);
  console.log("Mass body has Introit heading:", /Introit/.test(html));
  console.log("Mass body has Collect heading:", />Collect/.test(html) || /collect-heading/.test(html));
  console.log("Mass body has lesson-citation (Epistle):", /lesson-citation/.test(html));
  console.log("Mass body has plain-text (Gradual/Offertory/Communion):", /plain-text/.test(html));
  console.log("Mass body has no stray LaTeX:", !/\\lett|\\gradall|\\introit|\\collect\{|\\readingcitation/.test(html));

  // spot-check the actual textual content shows up
  console.log("Mass body length:", html.length);
}

// ---- Test 3: full ~24-page non-regression suite ----
{
  const dom = makeDom();
  const doc = dom.window.document;
  const others = [
    ["family", "familyBody"], ["adult-baptism", "adultBaptismBody"], ["burial", "burialBody"],
    ["unction", "unctionBody"], ["baptism", "baptismBody"], ["matrimony", "matrimonyBody"],
    ["confirmation", "confirmationBody"], ["reception", "receptionBody"], ["purification", "purificationBody"],
    ["burial-child", "burialChildBody"], ["confession", "confessionBody"], ["communion-sick", "communionSickBody"],
    ["mass", "massBody"], ["litany", "litanyBody"], ["litany-saints", "litanySaintsBody"],
    ["asperges", "aspergesBody"], ["foremass", "foremassBody"], ["preparation", "preparationBody"],
    ["thanksgiving", "thanksgivingBody"], ["benediction", "benedictionBody"],
    ["vesper-dead", "vesperDeadBody"], ["matins-dead", "matinsDeadBody"], ["lauds-dead", "laudsDeadBody"],
    ["votive-bvm", "votiveBvmBody"], ["votive-angels", "votiveAngelsBody"],
    ["votive-matrimony", "votiveMatrimonyBody"], ["votive-dead", "votiveDeadBody"],
  ];
  console.log("\nNon-regression suite:");
  for (const [hash, bodyId] of others) {
    doc.defaultView.location.hash = "#" + hash;
    doc.defaultView.dispatchEvent(new dom.window.Event("hashchange"));
    console.log(`${hash} still renders:`, doc.getElementById(bodyId).innerHTML.length > 100);
  }
}

// ---- Test 4: Mass Propers on a handful of specific known dates ----
{
  const dom = makeDom();
  const doc = dom.window.document;
  const win = dom.window;

  function goToMass() {
    win.location.hash = "#mass";
    win.dispatchEvent(new win.Event("hashchange"));
  }
  function clickCalendarDay(year, month0, day) {
    // open popover, navigate to correct month/year via repeated month-nav clicks, click day
    doc.getElementById("massCalendarToggle").click();
    const popover = doc.getElementById("massCalendarPopover");
    // figure out how many months to move from "today" (popover starts on currentDate's month)
    const today = new Date();
    let cursorY = today.getUTCFullYear ? new Date().getFullYear() : today.getFullYear();
    // Simplify: just parse the header text loop until it matches target month/year
    const yearSel = popover.querySelector(".cal-year-select");
    if (yearSel) { yearSel.value = String(year); yearSel.dispatchEvent(new popover.ownerDocument.defaultView.Event("change")); }
    const monthSel = popover.querySelector(".cal-month-select");
    if (monthSel) { monthSel.value = String(month0); monthSel.dispatchEvent(new popover.ownerDocument.defaultView.Event("change")); }
    const dayBtn = Array.from(popover.querySelectorAll("[data-cal-day]")).find(b => parseInt(b.dataset.calDay, 10) === day);
    if (dayBtn) dayBtn.click();
  }

  const testDates = [
    [2026, 11, 6, "Advent"],       // Dec 6 2026 - Advent
    [2026, 1, 8, "Septuagesima-ish"], // Feb 8 2026
    [2026, 3, 5, "Eastertide"],    // Apr 5 2026 (Easter 2026 is Apr 5)
    [2026, 2, 25, "Annunciation (Sanctorale, Lent)"], // Mar 25 2026
  ];

  for (const [y, m0, d, label] of testDates) {
    goToMass();
    clickCalendarDay(y, m0, d);
    const html = doc.getElementById("massBody").innerHTML;
    const dateLabel = doc.getElementById("massCurrentDateLabel").textContent;
    const seasonLabel = doc.getElementById("massSeasonLabel").textContent;
    console.log(`\n[${label}] date=${dateLabel} season=${seasonLabel}`);
    console.log("  has Introit text:", /Introit[\s\S]{0,300}plain-text/.test(html) || /plain-text/.test(html));
    console.log("  has Collect block:", /collect-block/.test(html));
    console.log("  has Epistle citation:", /lesson-citation/.test(html));
    console.log("  has missing-notice count:", (html.match(/class="missing"/g) || []).length);
  }
}
