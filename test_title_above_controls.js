// Regression test for the "title first, controls below" layout fix (8/27,
// per Augustine's WebsiteNotes_2026-08-26.txt review: "Page structure:
// title first, content below. No navigation buttons or controls above the
// title."). The Office and Mass pages' date toolbar (Prev/Today/Next/
// Calendar) and season banner (color dot, season name, kalendar line) were
// static HTML positioned before #officeBody/#massBody, but the page's own
// title heading was being injected as the *first child* of officeBody/
// massBody on every render - so it always ended up rendering after both
// control bars, not before them. Fixed by giving the title its own static
// #officeTitle/#massTitle heading, positioned before the toolbar in
// index.html, and having app.js set its text directly instead of
// prepending an <h2> into the body div.
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
const doc = win.document;

let pass = 0, fail = 0;
function check(label, cond) { if (cond) { pass++; } else { fail++; console.log("FAIL:", label); } }

function precedesInDom(a, b) {
  const pos = a.compareDocumentPosition(b);
  return !!(pos & win.Node.DOCUMENT_POSITION_FOLLOWING);
}

// --- Office page (Mattins) ---
win.location.hash = "#office/mattins";
win.dispatchEvent(new win.Event("hashchange"));
{
  const titleEl = doc.getElementById("officeTitle");
  const toolbar = doc.querySelector("#page-office .office-toolbar");
  const banner = doc.querySelector("#page-office .season-banner");
  const officeBody = doc.getElementById("officeBody");
  check("Office: #officeTitle has the real title text", titleEl.textContent.includes("The Order for Daily Morning Prayer"));
  check("Office: title precedes the date toolbar in the DOM", precedesInDom(titleEl, toolbar));
  check("Office: title precedes the season banner in the DOM", precedesInDom(titleEl, banner));
  check("Office: title precedes #officeBody in the DOM", precedesInDom(titleEl, officeBody));
  check("Office: officeBody's own first child is no longer the h2 title", !/^h2$/i.test((officeBody.firstElementChild || {}).tagName || ""));
  check("Office: officeBody still has real content (not emptied)", officeBody.innerHTML.length > 500);
}

// --- Office page (Evensong) - confirm the title updates per-Hour ---
win.location.hash = "#office/evensong";
win.dispatchEvent(new win.Event("hashchange"));
check("Office: #officeTitle updates when switching Hours", doc.getElementById("officeTitle").textContent.includes("The Order for Daily Evening Prayer"));

// --- Mass page ---
win.location.hash = "#mass";
win.dispatchEvent(new win.Event("hashchange"));
{
  const titleEl = doc.getElementById("massTitle");
  const toolbar = doc.querySelector("#page-mass .office-toolbar");
  const banner = doc.querySelector("#page-mass .season-banner");
  const massBody = doc.getElementById("massBody");
  check("Mass: #massTitle has the real title text", titleEl.textContent.length > 0);
  check("Mass: title precedes the date toolbar in the DOM", precedesInDom(titleEl, toolbar));
  check("Mass: title precedes the season banner in the DOM", precedesInDom(titleEl, banner));
  check("Mass: title precedes #massBody in the DOM", precedesInDom(titleEl, massBody));
  check("Mass: massBody still has real content (not emptied)", massBody.innerHTML.length > 500);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exitCode = 1;
