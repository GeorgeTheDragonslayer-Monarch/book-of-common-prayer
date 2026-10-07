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
function getMattinsBody(win, doc) {
  win.location.hash = "#office/mattins";
  win.dispatchEvent(new win.Event("hashchange"));
  return doc.getElementById("officeBody").innerHTML;
}
function getEvensongBody(win, doc) {
  win.location.hash = "#office/evensong";
  win.dispatchEvent(new win.Event("hashchange"));
  return doc.getElementById("officeBody").innerHTML;
}

function run(label, y, m0, d, checks) {
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, y, m0, d);
  console.log(`=== ${label} ===`);
  checks(win, doc);
  console.log();
}

// 2028-01-03 is a Monday (per earlier task #124 research: unmasked by
// co-occurring feasts, plain ferial day) - month is 0-indexed (0=Jan).
run("Monday 2028-01-03 mattins: Invitatory vs Office Hymn distinct", 2028, 0, 3, (win, doc) => {
  const body = getMattinsBody(win, doc);
  console.log("has Invitatory Hymn (Monday) heading:", /Invitatory Hymn \(Monday\)/.test(body));
  console.log("has Office Hymn (Monday Mattins) heading:", /Office Hymn \(Monday Mattins\)/.test(body));
  console.log("has Invitatory first line \"ur limbs\" (post-dropcap-O):", />O<\/span>ur limbs refresh'd with slumber now/.test(body));
  console.log("no stray 'already said above' note:", !/already said above/.test(body));
  console.log("no missing-text placeholder:", !/No (Invitatory|Office) Hymn text is prescribed/.test(body));
  const invIdx = body.indexOf("Invitatory Hymn (Monday)");
  const offIdx = body.indexOf("Office Hymn (Monday Mattins)");
  const benedictusIdx = body.indexOf("Benedictus");
  console.log("Invitatory appears before Office Hymn:", invIdx >= 0 && offIdx >= 0 && invIdx < offIdx);
  console.log("Both appear before Benedictus:", invIdx >= 0 && offIdx >= 0 && benedictusIdx >= 0 && invIdx < benedictusIdx && offIdx < benedictusIdx);
  console.log("Invitatory and Office Hymn texts are actually different:", body.slice(invIdx, offIdx) !== body.slice(offIdx, benedictusIdx));
});

run("Sunday in Summer (2028-07-16)", 2028, 6, 16, (win, doc) => {
  const body = getMattinsBody(win, doc);
  console.log("Sunday Summer Invitatory heading present:", /Invitatory Hymn \(Sunday in Summer\)/.test(body));
  console.log("Sunday Summer Invitatory first line (post-dropcap-F):", />F<\/span>ather we praise thee, now the night is over/.test(body));
});

run("Sunday in Winter (2028-01-02)", 2028, 0, 2, (win, doc) => {
  const body = getMattinsBody(win, doc);
  console.log("Sunday Winter Invitatory heading present:", /Invitatory Hymn \(Sunday in Winter\)/.test(body));
  console.log("Sunday Winter Invitatory first line (post-dropcap-T):", />T<\/span>his day the first of days was made/.test(body));
});

run("Tuesday 2028-01-04: O-space fix", 2028, 0, 4, (win, doc) => {
  const body = getMattinsBody(win, doc);
  console.log("has 'O Light of Light' (spaced, post-dropcap-O):", />O<\/span> Light of Light, O Dayspring bright/.test(body));
  console.log("no fused 'OLight':", !/OLight/.test(body));
});

run("Friday 2028-01-07: O-space fix", 2028, 0, 7, (win, doc) => {
  const body = getMattinsBody(win, doc);
  console.log("has 'O Three in One' (spaced, post-dropcap-O):", />O<\/span> Three in One, and One in Three/.test(body));
  console.log("no fused 'OThree':", !/OThree/.test(body));
});

run("Evensong unaffected (2028-01-03)", 2028, 0, 3, (win, doc) => {
  const body = getEvensongBody(win, doc);
  console.log("Evensong has Office Hymn (Monday Evensong):", /Office Hymn \(Monday Evensong\)/.test(body));
  console.log("Evensong has NO Invitatory Hymn heading:", !/Invitatory Hymn/.test(body));
});
