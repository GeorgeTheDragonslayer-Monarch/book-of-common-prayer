const fs = require("fs");
const { JSDOM } = require("jsdom");

// George's 10/7 note (task #19): "Saturday did not have a Magnificat
// antiphon during I Evensong. For certain Sundays in Trinitytide, this
// is found in the Proper of Season."
//
// Root cause, traced through `resolveEveningDisplacement` (js/app.js):
// Table2_revision.pdf's own matrix (`TABLE2_TOMORROW_WINS`, js/ranking.js)
// has no row for a plain feria, because a plain feria never has a claim
// of its own to weigh against anything. Task #184 (the St. Gorazde fix)
// already added a carve-out for this - "today has no real claim, so
// tomorrow's Double-tier feast fully displaces today's Evensong" - but
// scoped its own `tomorrowIsDoubleTier` list to only the four Double
// tiers, never an ordinary Sunday, and its own `todayIsPlainFeria` guard
// only matched `todayResolution.winner === "season"`, never a winning
// Semidouble/Simple feast (also a `null`-category case, for the same
// reason: Semidouble/Simple are tier 1-3, below even a Lesser Double).
// So First Evensong of an ORDINARY Sunday (no competing Double-rank
// feast of its own) never fired this carve-out at all - the Evensong
// stayed on the civil Saturday's own ferial fallback, which has no
// sourced Magnificat antiphon (FerialHymns.tex's Saturday Evensong
// subsection has none), rendering nothing where the Sunday's own
// Proper-of-Season Magnificat antiphon (collects-temporale.json's
// `firstEvensongMagnificatAntiphon`/`secondEvensongMagnificatAntiphon`)
// should have shown.
//
// Confirmed live across every Saturday-before-an-ordinary-Trinity-Sunday
// in 2026: a TRUE plain feria (e.g. 26 Sept, nothing at all in the
// Kalendar) already worked by coincidence in some cases only because
// Trinity VIII/XII's own Saturdays (1 Aug, 29 Aug) happened to carry
// their OWN winning Double-tier feast (Chains of St. Peter, Decollation
// of St. John Baptist) that already had a `sunday` column in the main
// matrix - but a Saturday carrying only a losing Memorial or common
// Vigil (8 Aug, 22 Aug - "common-vigil" category) or even a WINNING
// Semidouble (4 July, within the Octave of Sts. Peter & Paul) never
// displaced at all.
//
// Fixed by broadening the carve-out in `resolveEveningDisplacement`:
// now fires (Table 2's own code 1, "nothing of today") whenever TODAY's
// category can't outrank at least a Lesser Double (`todayOutranksNothing`
// - covers null, "memorial", AND a winning Semidouble/Simple feast, all
// three of classifyVespersCategory's claim-less outcomes) and TOMORROW
// has a real First-Evensong claim (`tomorrowHasFirstEvensongClaim` - now
// includes plain "sunday" alongside the four Double tiers). A welcome
// side effect, confirmed in `test_saturday_office_of_our_lady.js`:
// Rubrics.tex's own "of a Sunday anticipated" exclusion for the Saturday
// Office of Our Lady - previously left unmodeled for exactly this reason
// - now applies correctly at Evensong for free, since `isOfficeOfOurLadyToday`
// already excludes anything that isn't a Saturday, and `renderResolved`
// becomes the Sunday itself the moment this fires.
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
let failed = false;
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + ": " + label);
  if (!cond) failed = true;
}

// 1. 8 Aug 2026 (Sat before Trinity IX, "common-vigil" category - Vigil
// of St. Lawrence + a losing Memorial, no Double-tier feast of its own):
// now correctly anticipates First Evensong of Trinity IX, with Trinity
// IX's own FIRST Evensong Magnificat antiphon showing (not its Second).
//
// George's 10/20 note (follow-up bug): corrected from this test's
// original expectation. Trinity IX's data/collects-temporale.json entry
// actually carries a genuinely distinct pair - firstEvensongMagnificatAntiphon
// ("Jehoash...", drawn from that week's own ongoing Mattins lectio
// continua, proper to tonight since Trinity IX's own Mass hasn't been
// said yet) and secondEvensongMagnificatAntiphon ("What shall I do?...",
// a paraphrase of Trinity IX's own Gospel, Luke 16:1 - proper only to
// Trinity IX's OWN Sunday evening, after that Mass has already been
// said). This test used to assert the Second Evensong text here, which
// was itself an instance of the exact bug George reported: "It uses the
// same ... Magnificat Antiphon (the 2nd Evensong one) both days." Now
// that js/app.js's `pickEvensongAntiphonVariant` consults
// `eveningDisplacement` (set here, confirmed by the banner check below)
// to prefer the First Evensong variant on a displaced/anticipated night,
// this correctly shows "Jehoash", not "What shall I do?".
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 7, 8); // 8 Aug 2026 (month 0-indexed: 7 = August)
  const body = getOfficeBody(win, doc, "#office/evensong");
  const banners = Array.from(doc.querySelectorAll(".rubric-fine")).map((e) => e.textContent);
  check("8 Aug 2026 (common-vigil Saturday): banner announces First Evensong of Trinity IX", banners.some((t) => /^This Evensong is First Evensong of Trinity IX\b/.test(t)));
  check("8 Aug 2026: Magnificat antiphon now shows Trinity IX's FIRST Evensong antiphon (Jehoash), not its Second", /Jehoash/.test(body) && !/What shall I do\?/.test(body));
  const text = doc.getElementById("officeBody").textContent;
  check("8 Aug 2026: First Lesson is still 8 Aug's own ferial continuation (Zechariah 14), not shifted to the 9th", /Zechariah 14(?!\d)/.test(text));
  const psalmHeadings = Array.from(doc.querySelectorAll(".psalm-block h4")).map((e) => e.textContent).join(" | ");
  check("8 Aug 2026: Psalms are day-8's own Monthly Psalter entry (41, 42, 43), not day-9's", /Psalm 41(?!\d)/.test(psalmHeadings) && /Psalm 42(?!\d)/.test(psalmHeadings) && /Psalm 43(?!\d)/.test(psalmHeadings));
}

// 2. 22 Aug 2026 (Sat before Trinity XI, same "common-vigil" category -
// Vigil of St. Bartholomew + a losing Memorial): same fix, different
// Sunday, confirming it's not a one-off coincidence.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 7, 22);
  const body = getOfficeBody(win, doc, "#office/evensong");
  const banners = Array.from(doc.querySelectorAll(".rubric-fine")).map((e) => e.textContent);
  check("22 Aug 2026 (common-vigil Saturday): banner announces First Evensong of Trinity XI", banners.some((t) => /^This Evensong is First Evensong of Trinity XI\b/.test(t)));
  check("22 Aug 2026: Magnificat antiphon now shows (Trinity XI's own)", /This man went down to his house justified/.test(body));
}

// 3. 4 July 2026 (Sat before Trinity IV, a WINNING Semidouble feast -
// Day VI within the Octave of Sts. Peter & Paul - the other claim-less
// category classifyVespersCategory returns null for). Trinity IV also
// carries a genuinely distinct First/Second Evensong Magnificat antiphon
// pair ("Ye mountains of Gilboa..." / "Judge not,..."); same 10/20 fix as
// case 1 above - tonight is First Evensong, so "Ye mountains" is correct,
// not "Judge not," (Trinity IV's own Second Evensong antiphon).
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 6, 4); // 4 July 2026 (month 0-indexed: 6 = July)
  const body = getOfficeBody(win, doc, "#office/evensong");
  const banners = Array.from(doc.querySelectorAll(".rubric-fine")).map((e) => e.textContent);
  check("4 July 2026 (winning Semidouble Saturday): banner announces First Evensong of Trinity IV", banners.some((t) => /^This Evensong is First Evensong of Trinity IV\b/.test(t)));
  check("4 July 2026: Magnificat antiphon now shows Trinity IV's FIRST Evensong antiphon (Ye mountains), not its Second", /Ye mountains/.test(body) && !/Judge not,/.test(body));
}

// 4. A true plain feria Saturday (3 Oct 2026, nothing at all noted in
// the Kalendar) before an ordinary Sunday (Trinity XVII) - confirms the
// fix covers the baseline case too, not just the Vigil/Semidouble edge
// cases above.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 9, 3); // 3 Oct 2026 (month 0-indexed: 9 = October)
  getOfficeBody(win, doc, "#office/evensong");
  const banners = Array.from(doc.querySelectorAll(".rubric-fine")).map((e) => e.textContent);
  check("3 Oct 2026 (true plain feria Saturday): banner announces First Evensong of Trinity XVII", banners.some((t) => /^This Evensong is First Evensong of Trinity XVII\b/.test(t)));
}

// 5. Control: a day where this must NOT fire - a winning First/Second
// Double's own Second Evensong is never displaced by a mere ordinary
// Sunday the next day (nothing below Lesser Double can ever outrank a
// Sunday, but a First/Second Double always outranks an ordinary Sunday
// in turn). All Saints' Day (1 Nov 2026, 1st Double) falls on a Sunday;
// its own eve (31 Oct, a common Vigil) is covered by the general fix
// above, but All Saints' OWN Evensong that same night must stay All
// Saints' Second Evensong, not get displaced by 2 Nov (All Souls').
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 10, 1); // 1 Nov 2026 (month 0-indexed: 10 = November)
  const body = getOfficeBody(win, doc, "#office/evensong");
  const banners = Array.from(doc.querySelectorAll(".rubric-fine")).map((e) => e.textContent);
  check("1 Nov 2026 (All Saints', 1st Double): own Evensong is NOT displaced by All Souls'", !banners.some((t) => /^This Evensong is First Evensong of/.test(t)));
  check("1 Nov 2026: All Saints' own feast still shows", doc.getElementById("seasonLabel").textContent.indexOf("All") !== -1);
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
