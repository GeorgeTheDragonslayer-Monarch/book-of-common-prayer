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
    "js/data-marian-anthems.js","js/data-athanasian-creed.js","js/data-great-litany.js","js/data-litany-saints.js",
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

// Advent I (2026-11-29, confirmed Sunday) - Mattins Benedictus antiphon,
// sourced from pages/Propers/Temporale.tex's \properantiphon{Ben.} for
// this exact feast.
run("Advent I Mattins (2026-11-29) - Benedictus antiphon before + after", 2026, 10, 29, "#office/mattins", (body) => {
  const idx = body.indexOf(">Benedictus<");
  const gloriaIdx = body.indexOf("Then shall be said the");
  const window_ = body.slice(idx, gloriaIdx > idx ? gloriaIdx : idx + 3000);
  const tags = (window_.match(/<p class="antiphon">(.*?)<\/p>/g) || []);
  console.log("antiphon tags around Benedictus:", tags);
  console.log("count (expect 2 - incipit before, full after):", tags.length);
  console.log("incipit before is 'The Holy Ghost':", tags[0] === '<p class="antiphon">The Holy Ghost</p>');
  console.log("full after is the complete sourced text:", tags[1] === '<p class="antiphon">The Holy Ghost shall come upon thee, Mary; fear not, thou shalt bear in thy womb the Son of God, alleluia.</p>');
});

// 29 November 2026 is Advent I - but also, per this site's own
// pre-existing Table 2 concurrence logic (task #91), the eve of St.
// Andrew (30 November), whose First Evensong outranks Advent I's own
// Second Evensong and is shown instead (confirmed directly against the
// live render: the Collect on this page already reads "Collect: St.
// Andrew" with Advent I merely commemorated, and the page's own
// rubric-fine note says so explicitly). The Magnificat antiphon case
// reuses the exact same resolveMassPropersWinner() decision the Collect
// does, so it should likewise show St. Andrew's antiphon here, not
// Advent I's own - this is a positive confirmation that the antiphon
// stays in agreement with whichever Collect is actually showing, not a
// site bug. (An initial version of this test wrongly assumed Advent I's
// own text would show here - caught by checking the live Collect first.)
run("Advent I Evensong, displaced by St. Andrew (2026-11-29) - antiphon agrees with the Collect", 2026, 10, 29, "#office/evensong", (body) => {
  const idx = body.indexOf(">Magnificat<");
  const nextHeadingIdx = body.indexOf("The Second Lesson");
  const window_ = body.slice(idx, nextHeadingIdx > idx ? nextHeadingIdx : idx + 3000);
  const tags = (window_.match(/<p class="antiphon">(.*?)<\/p>/g) || []);
  console.log("antiphon tags around Magnificat:", tags);
  console.log("Collect on this page reads 'Collect: St. Andrew':", /Collect: St\. Andrew/.test(body));
  console.log("Magnificat antiphon likewise shows St. Andrew's own text ('When blessed Andrew'), matching the Collect:", tags.some((t) => t.includes("When blessed Andrew")));
});

// Advent II (2026-12-06), by contrast, is NOT displaced (verified: no
// "First Evensong of..." rubric-fine note on this page) - a clean,
// undisplaced Sunday evening showing Advent II's own Magnificat
// antiphon.
run("Advent II Evensong, undisplaced (2026-12-06) - Magnificat antiphon before + after", 2026, 11, 6, "#office/evensong", (body) => {
  console.log("not displaced (no 'First Evensong of' note):", !/First Evensong of/.test(body.slice(0, 600)));
  const idx = body.indexOf(">Magnificat<");
  const nextHeadingIdx = body.indexOf("The Second Lesson");
  const window_ = body.slice(idx, nextHeadingIdx > idx ? nextHeadingIdx : idx + 3000);
  const tags = (window_.match(/<p class="antiphon">(.*?)<\/p>/g) || []);
  console.log("antiphon tags:", tags);
  console.log("count (expect 2):", tags.length);
  console.log("incipit before is 'Blessed art thou,':", tags[0] === '<p class="antiphon">Blessed art thou,</p>');
});

// St. Andrew (fixed date, 30 November, kalendar.json rank "2nd Double" -
// RANK_TIER 6, above the Double(4) threshold) - Sanctorale-sourced
// Benedictus antiphon, keyed via the site's own kalendarKey "11-30"
// mapping (built from Sanctorale.tex's \feastdate{30}{November}). Sliced
// up through the Apostles' Creed rubric that follows, since the
// Benedictus canticle's own text is long enough that a short
// fixed-length slice can cut off before reaching the "after" antiphon
// (an early version of this test did exactly that, and wrongly read it
// as a missing "after" antiphon). George's 9/2 note (task #139): on this
// Double+ Feast, the antiphon is said in FULL both before and after, not
// incipit-before - the same rule already applied to the Psalter's own
// antiphons (task #138/139).
run("St. Andrew Mattins (2026-11-30, 2nd Double) - Benedictus antiphon in FULL before and after", 2026, 10, 30, "#office/mattins", (body) => {
  const idx = body.indexOf(">Benedictus<");
  const nextIdx = body.indexOf("Then shall be said the");
  const window_ = body.slice(idx, nextIdx > idx ? nextIdx : idx + 3000);
  const tags = (window_.match(/<p class="antiphon">(.*?)<\/p>/g) || []);
  console.log("antiphon tags:", tags);
  console.log("count (expect 2):", tags.length);
  console.log("BOTH tags show the full text (not the short incipit 'Yield up to us') on this Double+ day:", tags.every((t) => t === '<p class="antiphon">Yield up to us a man so righteous, restore to us a man so holy: destroy not a man so dear to God, righteous, dutiful, and gentle.</p>'));
});

// Trinity II (2026-06-21, confirmed Sunday) - an ordinary-time Sunday
// whose antiphons print with no explicit Hour markers in the source
// (just three bare \properantiphon entries in a fixed Mag/Ben/Mag
// order) - confirms the positional-inference fallback in the parser
// worked, not just the explicit-marker path used by Advent/Sanctorale.
run("Trinity II Mattins (2026-06-21) - Benedictus antiphon via positional parsing", 2026, 5, 21, "#office/mattins", (body) => {
  const idx = body.indexOf(">Benedictus<");
  const nextIdx = body.indexOf("Then shall be said the");
  const window_ = body.slice(idx, nextIdx > idx ? nextIdx : idx + 3000);
  const tags = (window_.match(/<p class="antiphon">(.*?)<\/p>/g) || []);
  console.log("antiphon tags:", tags);
  console.log("count (expect 2):", tags.length);
  console.log("has 'A certain man' incipit:", tags.some((t) => t === '<p class="antiphon">A certain man</p>'));
  console.log("full text after includes 'for all things are now ready':", tags.some((t) => t.includes("for all things are now ready")));
});
run("Trinity II Evensong (2026-06-21) - Magnificat antiphon via positional parsing", 2026, 5, 21, "#office/evensong", (body) => {
  const idx = body.indexOf(">Magnificat<");
  const nextHeadingIdx = body.indexOf("The Second Lesson");
  const window_ = body.slice(idx, nextHeadingIdx > idx ? nextHeadingIdx : idx + 3000);
  const tags = (window_.match(/<p class="antiphon">(.*?)<\/p>/g) || []);
  console.log("antiphon tags:", tags);
  console.log("has 'Go out quickly' (the second, not first, of the two Mag antiphons):", tags.some((t) => t.includes("Go out quickly")));
});

// A plain weekday within a Sunday/season week (no Sanctorale/Sunday-
// proper antiphon of its own) - UPDATED for task #141 (George's 9/2
// note: "if it's a feria you'll get the antiphon from the ferial
// hymns"). Previously rendered nothing at all here (documented as a
// deliberate no-fabrication gap); now falls through to FerialHymns.tex's
// own plain Tuesday Benedictus antiphon instead of staying silent, and -
// separately - no longer wrongly carries over that week's Sunday-proper
// antiphon either (see the dedicated task #141 section below for that
// specific regression check).
run("Plain Trinitytide Tuesday (2026-06-02) - ferial Benedictus antiphon now shown (task #141)", 2026, 5, 2, "#office/mattins", (body) => {
  const idx = body.indexOf(">Benedictus<");
  const gloriaIdx = body.indexOf("Then shall be said the");
  const window_ = body.slice(idx, gloriaIdx > idx ? gloriaIdx : idx + 3000);
  const tags = (window_.match(/<p class="antiphon">(.*?)<\/p>/g) || []);
  console.log("antiphon tags:", tags);
  console.log("count (expect 2):", tags.length, tags.length === 2);
  console.log("incipit before is 'The Lord hath raised up for us':", tags[0] === '<p class="antiphon">The Lord hath raised up for us</p>');
  console.log("full after is FerialHymns.tex's own Tuesday text:", tags[1] === '<p class="antiphon">The Lord hath raised up for us an horn of salvation in the house of his servant David.</p>');
});

// George's 9/2 note, task #141: "If it's a feast day it should pull the
// festal antiphons for the Psalms" plus "if it's a feria you'll get the
// antiphon from the ferial hymns" - three behaviors added together:
// (1) a Double+ Feast's own group Psalm antiphon (Temporale.tex/
// Sanctorale.tex's \psalmAntiphon{}, ONE antiphon covering the whole
// group of Psalms for the Hour) now shows before the first Psalm and in
// full after the last, replacing the individual per-psalm Psal.tex
// antiphons for that Hour; (2) plain ferias now get FerialHymns.tex's
// own Benedictus/Magnificat antiphon instead of silence; (3) a bug found
// while verifying (2) - a season week's Sunday-proper antiphon
// (Benedictus/Magnificat AND group Psalm antiphon alike) was wrongly
// carrying over onto every feria in that week instead of just the
// Sunday itself - is fixed here too.
console.log("=== Task #141: festal Psalm antiphon + ferial fallback + Sunday-only carryover ===");

run("St. Andrew Mattins (2026-11-30, 2nd Double) - group Psalm antiphon replaces per-psalm ones", 2026, 10, 30, "#office/mattins", (body) => {
  const psalmBlockIdx = body.indexOf('class="psalm-block"');
  const before = body.slice(0, psalmBlockIdx);
  const beforeTags = (before.match(/<p class="antiphon">(.*?)<\/p>/g) || []);
  console.log("group antiphon shown before Psalm 144 (full text, Double+ rule):", beforeTags[beforeTags.length - 1] === '<p class="antiphon">Blessed Andrew prayed saying: O Lord King of eternal glory, sustain me, as I hang upon the tree.</p>');
  const firstLessonIdx = body.indexOf("The First Lesson");
  const psalmSection = body.slice(psalmBlockIdx, firstLessonIdx);
  console.log("group antiphon repeated in full right after the last Psalm block:", psalmSection.slice(psalmSection.lastIndexOf("</div>")).includes("Blessed Andrew prayed saying"));
  const perPsalmCount = (psalmSection.match(/<h4>Psalm/g) || []).length;
  console.log("all 3 Psalms of the Hour present:", perPsalmCount === 3);
});

run("St. Andrew Evensong (2026-11-30, Second Evensong) - group Psalm antiphon deferred to Gloria position", 2026, 10, 30, "#office/evensong", (body) => {
  const psalmBlockIdx = body.indexOf('class="psalm-block"');
  const before = body.slice(0, psalmBlockIdx);
  const beforeTags = (before.match(/<p class="antiphon">(.*?)<\/p>/g) || []);
  console.log("group antiphon shown before the first Psalm:", beforeTags.some((t) => t.includes("overwhelmed in hell")));
  const firstLessonIdx = body.indexOf("The First Lesson");
  const deferredWindow = body.slice(psalmBlockIdx, firstLessonIdx);
  console.log("deferred 'after' text appears past the Gloria Patri rubric, before the First Lesson (task #143 placement):", deferredWindow.includes("Gloria Patri already said") && deferredWindow.lastIndexOf("overwhelmed in hell") > deferredWindow.indexOf("Gloria Patri already said"));
});

run("Ordinary Monday feria Mattins (2025-07-14, Trinity IV week) - Sunday's antiphon NOT carried over", 2025, 6, 14, "#office/mattins", (body) => {
  const idx = body.indexOf(">Benedictus<");
  const nextIdx = body.indexOf("Then shall be sung or said the Hymn following");
  const window_ = body.slice(idx, nextIdx);
  console.log("does NOT show Trinity IV Sunday's own antiphon ('Be ye therefore'):", !window_.includes("Be ye therefore"));
  console.log("shows FerialHymns.tex's own Monday antiphon instead ('Blessed be the Lord God of Israel.'):", body.includes("Blessed be the Lord God of Israel."));
});

run("Trinity IV Sunday itself (2025-07-13) - still shows its own proper antiphon", 2025, 6, 13, "#office/mattins", (body) => {
  const idx = body.indexOf(">Benedictus<");
  const nextIdx = body.indexOf("Then shall be sung or said the Hymn following");
  const window_ = body.slice(idx, nextIdx);
  console.log("shows Trinity IV's own proper antiphon ('Be ye therefore'):", window_.includes("Be ye therefore"));
});

run("Saturday feria Evensong (2025-07-19) - no sourced ferial Magnificat antiphon, honest silence, no crash", 2025, 6, 19, "#office/evensong", (body) => {
  console.log("page still rendered:", body.indexOf(">Magnificat<") >= 0);
});

console.log("=== Done ===");
