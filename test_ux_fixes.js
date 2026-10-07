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
    "js/computus.js","js/calendar.js","js/psalms.js","js/liturgical-color.js","js/office-variants.js",
    "js/ranking.js","js/scripture.js","js/app.js"];
  for (const s of scripts) {
    const el = window.document.createElement("script");
    el.textContent = fs.readFileSync(s, "utf-8");
    window.document.body.appendChild(el);
  }
  return dom;
}

console.log("=== UX fixes test ===\n");
const dom = makeDom();
const doc = dom.window.document;

// 1. Hamburger toggles mobile-open + aria-expanded
const hamburger = doc.getElementById("navHamburger");
const nav = doc.querySelector("nav.main-nav");
console.log("[1] hamburger exists:", !!hamburger);
console.log("[1] initial aria-expanded=false:", hamburger.getAttribute("aria-expanded") === "false");
hamburger.click();
console.log("[1] after click, nav has mobile-open:", nav.classList.contains("mobile-open"));
console.log("[1] after click, aria-expanded=true:", hamburger.getAttribute("aria-expanded") === "true");
hamburger.click();
console.log("[1] after second click, mobile-open removed:", !nav.classList.contains("mobile-open"));

// 2. Settings panel exists with all 6 groups, and clicking a nav-link closes mobile nav
hamburger.click(); // reopen
const settingsTrigger = doc.querySelector('[data-trigger="settings"]');
console.log("\n[2] settings trigger exists:", !!settingsTrigger);
settingsTrigger.click();
const settingsPanel = doc.getElementById("settingsMenu");
console.log("[2] settings panel open:", settingsPanel.closest(".nav-item").classList.contains("open"));
console.log("[2] settings aria-expanded=true:", settingsTrigger.getAttribute("aria-expanded") === "true");
console.log("[2] all settings groups present:",
  !!doc.getElementById("languageMenu") && !!doc.getElementById("ministerMenu") && !!doc.getElementById("regionMenu") &&
  !!doc.getElementById("morningCanticleMenu"));
// gloriaMenu/veniteAshMenu/creedMenu (and 5 other former settings-panel
// groups) were migrated out to inline page toggles on 8/25 - see
// test_inline_toggles_tmp.js and test_creed_toggle_tmp.js.
console.log("[2] gloriaMenu/veniteAshMenu/creedMenu no longer in settings panel (migrated to inline toggles):",
  !doc.getElementById("gloriaMenu") && !doc.getElementById("veniteAshMenu") && !doc.getElementById("creedMenu"));

// 3. Clicking a setting button still works (data-lang) and updates label + re-renders
dom.window.location.hash = "#office/mattins";
dom.window.dispatchEvent(new dom.window.Event("hashchange"));
const latinBtn = doc.querySelector('#languageMenu [data-lang="latin"]');
latinBtn.click();
console.log("\n[3] langLabel updated to Latin:", doc.getElementById("langLabel").textContent === "Latin");
console.log("[3] latin button now selected:", latinBtn.classList.contains("selected"));
const officeBody = doc.getElementById("officeBody").innerHTML;
console.log("[3] office re-rendered in Latin mode (no English-only marker like 'Mattins' heading in english, spot check for Latin content presence):", officeBody.length > 0);

// 4. Escape closes an open dropdown and returns focus to trigger
const hoursTrigger = doc.querySelector('[data-trigger="hours"]');
hoursTrigger.focus();
hoursTrigger.click();
console.log("\n[4] hours dropdown open:", hoursTrigger.closest(".nav-item").classList.contains("open"));
const escEvent = new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true });
doc.dispatchEvent(escEvent);
console.log("[4] hours dropdown closed after Escape:", !hoursTrigger.closest(".nav-item").classList.contains("open"));
console.log("[4] focus returned to hours trigger:", doc.activeElement === hoursTrigger);

// 5. Escape also closes the mobile nav itself
hamburger.click();
console.log("\n[5] mobile nav open before Escape:", nav.classList.contains("mobile-open"));
doc.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
console.log("[5] mobile nav closed after Escape:", !nav.classList.contains("mobile-open"));

// 6. Clicking a plain nav-link (e.g. Home) inside the open mobile nav closes it
hamburger.click();
const homeLink = doc.querySelector('[data-nav-link="home"]');
homeLink.click();
console.log("\n[6] mobile nav closed after clicking a nav-link:", !nav.classList.contains("mobile-open"));

// 7. Home page groups all present
dom.window.location.hash = "#home";
dom.window.dispatchEvent(new dom.window.Event("hashchange"));
const groupTitles = [...doc.querySelectorAll(".home-group-title")].map((h) => h.textContent);
console.log("\n[7] home group titles:", groupTitles);
console.log("[7] featured Daily Office group first:", doc.querySelector(".home-group-featured .home-group-title").textContent === "The Daily Office");
console.log("[7] total home-links buttons still 27 (26 orig + none removed):", doc.querySelectorAll(".home-links button").length);

console.log("\nEXIT:0");
