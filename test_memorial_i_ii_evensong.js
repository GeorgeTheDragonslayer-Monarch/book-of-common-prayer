// Task #184 verification: "Memorials are commemorated during I Evensong
// and Mattins, but not II Evensong."
//
// This site's own per-date Evensong page is that date's SECOND Evensong
// (the evening closing out the day itself - see pickLectionarySlot's doc
// comment in js/app.js and the task #172 fix it describes: "today's
// Evensong" defaults to a festival's own evensongII text, falling back to
// evensongI only in the anticipation/eveningDisplacement case). Before
// this fix, a Memorial's commemoration (the ordinary `other`
// season-vs-sanctorale pairing in renderCommemoratedOration) showed
// unconditionally whenever currentHour === "evensong," meaning it always
// appeared at what is structurally the Memorial's own SECOND Evensong,
// never at its First. Two further bugs compounded this: (1)
// classifyVespersCategory (js/ranking.js) could only ever classify a day
// as "memorial" when that day's Sanctorale entry WON outright
// (winner === "feast") - but a Memorial (RANK_TIER tier 2) can never
// win any classification in this file (every one requires at least tier
// 3), so the "memorial" branch was permanently dead code; and (2) even
// setting that aside, resolveEveningConcurrence's own `tomorrowEntry`
// lookup only ever read `tomorrowResolution.sanctorale` when
// `tomorrowResolution.winner === "feast"` - again, never true for a
// Memorial - so TABLE2_TODAY_WINS's own pre-existing "memorial" columns
// (sunday/firstDouble/secondDouble/greaterDouble/lesserDouble) could
// never actually surface a Memorial's Collect even on the rare day they
// were reached.
const fs = require("fs");
const { JSDOM } = require("jsdom");

function runOnDate(isoDateNoonUTC, hash) {
  const html = fs.readFileSync("index.html", "utf8");
  const dom = new JSDOM(html, { url: `http://localhost/${hash}`, runScripts: "outside-only", pretendToBeVisual: true });
  const { window } = dom;
  const FixedDate = class extends Date {
    constructor(...args) {
      if (args.length === 0) { super(isoDateNoonUTC); }
      else { super(...args); }
    }
    static now() { return new Date(isoDateNoonUTC).getTime(); }
  };
  window.Date = FixedDate;
  const scriptSrcs = [...dom.window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"));
  const combined = scriptSrcs.map((src) => fs.readFileSync(src, "utf8")).join("\n;\n");
  try {
    window.eval(combined);
  } catch (e) {
    console.log("ERROR evaluating combined scripts:", e.message);
  }
  return dom;
}

let failed = false;
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + ": " + label);
  if (!cond) failed = true;
}

function bodyOn(iso, hash) {
  const dom = runOnDate(iso, hash);
  return dom.window.document.getElementById("officeBody").textContent;
}

// Case 1: an ordinary plain feria (25 Aug 2026) followed by a plain
// Memorial (Pope St. Zephyrinus, 26 Aug 2026) sharing no Sunday/Double
// with either day.
check(
  "Zephyrinus (Memorial, 26 Aug) IS commemorated at 25 Aug Evensong (his true First Evensong)",
  bodyOn("2026-08-25T12:00:00Z", "#office/evensong").includes("Zephyrinus")
);
check(
  "Zephyrinus IS commemorated at his own day's Mattins (26 Aug)",
  bodyOn("2026-08-26T12:00:00Z", "#office/mattins").includes("Zephyrinus")
);
check(
  "Zephyrinus is NOT commemorated at his own day's Evensong (26 Aug, his Second Evensong)",
  !bodyOn("2026-08-26T12:00:00Z", "#office/evensong").includes("Zephyrinus")
);

// Case 2: a Sunday (11 Jan 2026) immediately followed by a Memorial
// (St. Benedict Biscop, 12 Jan 2026) - exercises the
// TABLE2_TODAY_WINS.sunday.memorial = 4 cell specifically (previously
// unreachable - see the two bugs described above).
check(
  "Benedict Biscop (Memorial, 12 Jan) IS commemorated at the preceding Sunday's Evensong (11 Jan, his First Evensong)",
  bodyOn("2026-01-11T12:00:00Z", "#office/evensong").includes("Benedict Biscop")
);
check(
  "Benedict Biscop IS commemorated at his own day's Mattins (12 Jan)",
  bodyOn("2026-01-12T12:00:00Z", "#office/mattins").includes("Benedict Biscop")
);
check(
  "Benedict Biscop is NOT commemorated at his own day's Evensong (12 Jan, his Second Evensong)",
  !bodyOn("2026-01-12T12:00:00Z", "#office/evensong").includes("Benedict Biscop")
);
check(
  "The preceding Sunday's own Mattins is unaffected (does not pre-announce tomorrow's Memorial)",
  !bodyOn("2026-01-11T12:00:00Z", "#office/mattins").includes("Benedict Biscop")
);

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
