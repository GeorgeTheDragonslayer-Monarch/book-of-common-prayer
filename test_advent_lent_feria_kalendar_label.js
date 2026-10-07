// Task #182 verification: "Advent Ferias and Lenten Ferias should be
// listed as such on the Kalendar, unless outranked... 'Feria' should be
// listed, instead of the Memorial. 'Ash Wednesday' should be listed,
// instead of anything else on that day."
//
// Investigation found this already correctly implemented by task #178's
// broader fix earlier the same day (9/8): renderCalendarPage's per-day
// grid cell already shows `resolved.seasonLabel` (e.g. "Tuesday in Advent
// I") whenever `feastInfo.winner !== "feast"`, and ranking.js's
// GREATER_FERIA_KEYS/SECOND_CLASS_FERIA_KEYS classifications already
// require tier >= 6 (a 1st or 2nd Double) for a Feast to outrank an
// Advent/Lenten weekday - a Memorial (tier 2) never wins there, so the
// season always shows instead. Ash Wednesday's own anchor day is in
// ranking.js's ALWAYS_SEASON_KEYS (a hard block, tier-independent), so
// nothing - not even a 1st Double - can ever displace it. This test
// exists to lock that already-correct behavior in place, not because a
// code change was needed for this task.
const fs = require("fs");
const { JSDOM } = require("jsdom");

function buildWindow(isoDateNoonUTC) {
  const html = fs.readFileSync("index.html", "utf8");
  const dom = new JSDOM(html, { url: "http://localhost/#calendar", runScripts: "outside-only", pretendToBeVisual: true });
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
  return window;
}

function feastInfoFor(resolved, win) {
  let winner = { winner: "season", tier: 0, name: null, rank: null };
  for (const e of resolved.kalendar || []) {
    if (!e.rank) continue;
    const decision = win.Ranking.decideCollectWinner(resolved, e.rank);
    const tier = win.Ranking.RANK_TIER[e.rank] || 0;
    if (decision.winner === "feast" && tier > winner.tier) {
      winner = { winner: "feast", tier, name: e.name, rank: e.rank };
    }
  }
  return winner;
}

let failed = false;
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + ": " + label);
  if (!cond) failed = true;
}

const win = buildWindow("2026-01-01T12:00:00Z");

// 2 December 2025: Advent I Tuesday, with St. Bibiana (Virgin Martyress,
// unranked-below-Memorial in this Kalendar's data) present. The Feria
// must win and show its own descriptive label, not the commemoration.
let resolved = win.resolveLiturgicalDay(new Date("2025-12-02T12:00:00Z"), win.LECTIONARY_DATA, win.KALENDAR_DATA);
let feastInfo = feastInfoFor(resolved, win);
check("2 Dec 2025 (Advent I Tuesday + Memorial): season wins, not the Memorial", feastInfo.winner === "season");
check("2 Dec 2025: seasonLabel names the Advent feria", resolved.seasonLabel === "Tuesday in Advent I");

// 1 March 2026: Lent I Sunday (also St. David of Wales, Memorial rank) -
// First Class Sunday, must win outright.
resolved = win.resolveLiturgicalDay(new Date("2026-03-01T12:00:00Z"), win.LECTIONARY_DATA, win.KALENDAR_DATA);
feastInfo = feastInfoFor(resolved, win);
check("1 Mar 2026 (Lent I Sunday + Memorial): season wins", feastInfo.winner === "season");

// 2 March 2026: Lent I Monday (St. Chad, Memorial rank) - Second Class
// Feria, tier>=6 required to outrank; a Memorial (tier 2) must lose.
resolved = win.resolveLiturgicalDay(new Date("2026-03-02T12:00:00Z"), win.LECTIONARY_DATA, win.KALENDAR_DATA);
feastInfo = feastInfoFor(resolved, win);
check("2 Mar 2026 (Lent I Monday + Memorial): season wins", feastInfo.winner === "season");
check("2 Mar 2026: seasonLabel names the Lenten feria", resolved.seasonLabel === "Monday in Lent I");

// 25 February 2026: Ash Wednesday itself (also St. Walburga present in
// the Kalendar that date) - must always show "Ash Wednesday," full stop.
resolved = win.resolveLiturgicalDay(new Date("2026-02-25T12:00:00Z"), win.LECTIONARY_DATA, win.KALENDAR_DATA);
feastInfo = feastInfoFor(resolved, win);
check("Ash Wednesday 2026: season wins outright (hard block)", feastInfo.winner === "season");
check("Ash Wednesday 2026: seasonLabel is exactly 'Ash Wednesday'", resolved.seasonLabel === "Ash Wednesday");

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
