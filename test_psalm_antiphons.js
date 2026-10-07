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

// Day 1 of the month (Sept 1 2026, a Tuesday, only Memorial-rank
// commemorations - the season wins, so this is NOT a Double+ Feast day)
// - Mattins says Psalms 1-5 via the plain Monthly Psalter, each with its
// own single fixed antiphon. George's 9/2 note (task #138): the heading
// ("Psalm N. Latin name") prints first, with the antiphon following it.
run("Day 1 Mattins (2026-09-01) - heading first, then antiphon (incipit before/full after)", 2026, 8, 1, "#office/mattins", (body) => {
  const blocks = (body.match(/<div class="psalm-block">[\s\S]*?<\/div>/g) || []);
  const psalm1Block = blocks.find((b) => b.includes("Psalm 1."));
  console.log("found a Psalm 1 block:", !!psalm1Block);
  if (psalm1Block) {
    console.log("antiphon count in block (expect 2 - incipit before, full after):", (psalm1Block.match(/class="antiphon"/g) || []).length);
    console.log("heading <h4> appears before the incipit 'The Lord knoweth':", psalm1Block.indexOf("<h4>") < psalm1Block.indexOf("The Lord knoweth"));
    console.log("'before' antiphon is the short incipit, not the full text (not a Double+ day):", /<p class="antiphon">The Lord knoweth<\/p>/.test(psalm1Block));
    console.log("full text 'exercise himself in his law day and night' appears after the heading:", psalm1Block.indexOf("exercise himself in his law day and night") > psalm1Block.indexOf("<h4>"));
  }
});

// St. Andrew (2026-11-30, kalendar.json rank "2nd Double" - RANK_TIER 6,
// well above the Double(4) threshold) - George's 9/2 note (task #139):
// on a Double+ Feast, the Psalm antiphon is said in FULL both before and
// after, not incipit-before. UPDATED for task #141 (9/2 note: "If it's a
// feast day it should pull the festal antiphons for the Psalms"): St.
// Andrew has his own proper group Psalm antiphon sourced from
// Sanctorale.tex's \psalmAntiphon{} ("Blessed Andrew prayed saying...",
// ONE antiphon covering the whole group of Psalms for the Hour), which
// now REPLACES Psal.tex's individual per-psalm antiphon
// ("Blessed be the Lord my strength...") that this test originally
// checked - the per-psalm antiphon is deliberately suppressed inside
// each Psalm block whenever a group antiphon is showing instead. Psalm
// 144's own block should therefore have none of its own; the group
// antiphon's full-text-before/after behavior is covered by its own
// dedicated test in test_benedictus_magnificat_antiphon.js (the "Task
// #141" section).
run("St. Andrew Mattins (2026-11-30, 2nd Double) - per-psalm antiphon suppressed in favor of the group antiphon (task #141)", 2026, 10, 30, "#office/mattins", (body) => {
  const blocks = (body.match(/<div class="psalm-block">[\s\S]*?<\/div>/g) || []);
  const block = blocks.find((b) => b.includes("Psalm 144."));
  console.log("found a Psalm 144 block:", !!block);
  if (block) {
    const tags = (block.match(/<p class="antiphon">(.*?)<\/p>/g) || []);
    console.log("antiphon tags inside the Psalm 144 block itself (expect none - suppressed):", tags, tags.length === 0);
  }
  console.log("St. Andrew's own group antiphon appears elsewhere on the page, in full:", body.includes('<p class="antiphon">Blessed Andrew prayed saying: O Lord King of eternal glory, sustain me, as I hang upon the tree.</p>'));
});

// Day 10 of the month - Mattins includes Psalm 51, whose antiphon varies
// by weekday. Note: Sundays on this site carry their own Proper Psalms
// (which pre-empt the Monthly Cycle entirely - see resolvePsalmsForDay),
// so a Day-10 Sunday never actually renders Psalm 51 via this path at
// all; that's a separate, correct behavior, not something this test can
// exercise. 2026-11-10 (Tuesday) and 2026-09-10 (Thursday) both land on
// weekdays with no Proper-Psalms override, so each shows the Monthly
// Cycle's Psalm 51 with a different, distinctly-sourced antiphon.
run("Day 10 Mattins, Tuesday (2026-11-10) - Psalm 51 Tuesday antiphon", 2026, 10, 10, "#office/mattins", (body) => {
  const blocks = (body.match(/<div class="psalm-block">[\s\S]*?<\/div>/g) || []);
  const psalm51Block = blocks.find((b) => b.includes("Psalm 51."));
  console.log("found a Psalm 51 block:", !!psalm51Block);
  if (psalm51Block) {
    const antiphonTags = (psalm51Block.match(/<p class="antiphon">(.*?)<\/p>/g) || []);
    console.log("antiphon tags:", antiphonTags);
    console.log("has Tuesday antiphon text 'Do away, O Lord, mine offences':", antiphonTags.some((t) => /Do away, O Lord, mine offences/.test(t)));
    console.log("does NOT have Sunday's antiphon 'The bones which thou hast broken shall rejoice in the Lord' as an antiphon tag (only inside the psalm's own v.8 text, which legitimately overlaps in wording):", !antiphonTags.some((t) => /shall rejoice in the Lord/.test(t)));
  }
});

run("Day 10 Mattins, Thursday (2026-09-10) - Psalm 51 Thursday antiphon (distinct from Tuesday's)", 2026, 8, 10, "#office/mattins", (body) => {
  const blocks = (body.match(/<div class="psalm-block">[\s\S]*?<\/div>/g) || []);
  const psalm51Block = blocks.find((b) => b.includes("Psalm 51."));
  console.log("found a Psalm 51 block:", !!psalm51Block);
  if (psalm51Block) {
    const antiphonTags = (psalm51Block.match(/<p class="antiphon">(.*?)<\/p>/g) || []);
    console.log("antiphon tags:", antiphonTags);
    console.log("has Thursday antiphon text 'Against thee only have I sinned, O Lord; have mercy upon me.':", antiphonTags.some((t) => /Against thee only have I sinned, O Lord; have mercy upon me\./.test(t)));
  }
});

// Day 24 Evensong, Day 25 & 26 Mattins - Psalm 119's three stored
// portions, each of which should show ALL antiphons for the traditional
// 8-verse sections it spans (not just one, and not silently dropped).
// Day 24 Evensong's Psalm 119 portion is that Evensong's own LAST (and
// only) Psalm, so per George's 9/2 note (task #143) its "after" antiphon
// is deliberately deferred out of this block entirely, appearing instead
// right after the Gloria in excelsis/Gloria Patri choice further down
// the page (still ahead of the First Lesson) - checked separately below.
run("Day 24 Evensong (2026-09-24) - Psalm 119 vv.1-32 antiphons (expect 4 sections, 'before' only)", 2026, 8, 24, "#office/evensong", (body) => {
  const blocks = (body.match(/<div class="psalm-block">[\s\S]*?<\/div>/g) || []);
  const block = blocks.find((b) => b.includes("Psalm 119."));
  console.log("found a Psalm 119 block:", !!block);
  if (block) {
    console.log("antiphon count within the Psalm block itself (expect 4 - 'before' only, 'after' deferred):", (block.match(/class="antiphon"/g) || []).length);
    console.log("has first section's incipit 'Blessed are they that walk':", /Blessed are they that walk/.test(block));
    console.log("has fourth section's incipit 'Make me to understand':", /Make me to understand/.test(block));
    console.log("does NOT have a fifth-section antiphon like 'Make me to go' (that's section 5, outside 1-32):", !/Make me to go, /.test(block));
  }
  // The deferred "after" antiphons: between the Gloria choice section
  // (identifiable by its "Gloria in excelsis"/"Gloria Patri" toggle
  // buttons) and "The First Lesson" heading that follows it.
  const gloriaIdx = body.indexOf("Gloria in excelsis");
  const firstLessonIdx = body.indexOf("The First Lesson");
  const deferredWindow = body.slice(gloriaIdx, firstLessonIdx > gloriaIdx ? firstLessonIdx : gloriaIdx + 4000);
  const deferredTags = (deferredWindow.match(/<p class="antiphon">(.*?)<\/p>/g) || []);
  console.log("deferred 'after' antiphon tags found between Gloria choice and First Lesson (expect 4, all full text):", deferredTags.length, deferredTags);
  console.log("deferred set has all 4 full-text sections (1-32), e.g. 'Blessed are they that walk in the law of the Lord.':", deferredTags.some((t) => t.includes("Blessed are they that walk in the law of the Lord.")));
});

run("Day 25 Mattins (2026-09-25) - Psalm 119 vv.33-72 antiphons (expect 5 sections)", 2026, 8, 25, "#office/mattins", (body) => {
  const blocks = (body.match(/<div class="psalm-block">[\s\S]*?<\/div>/g) || []);
  const block = blocks.find((b) => b.includes("Psalm 119."));
  console.log("found a Psalm 119 block:", !!block);
  if (block) {
    console.log("antiphon count (expect 10 = 5 sections x before+after):", (block.match(/class="antiphon"/g) || []).length);
    console.log("has section 5's antiphon 'Make me to go':", /Make me to go, /.test(block));
    console.log("has section 9's antiphon 'Thou art good and gracious':", /Thou art good and gracious/.test(block));
  }
});

console.log("=== Done ===");
