// Task #188 verification: George's corrections doc, Prime section: "The
// 'Lord be with you' in the Commemoration for the Faithful Departed
// should not be provided if the layman setting is on."
//
// CommemorationDeparted.tex's own "The Lord be with you. / And with thy
// spirit." pair (inside Prime's collapsible Pretiosa & Commemoration of
// the Faithful Departed group) has no printed Layman alternative the way
// several other sitewide "Lord be with you" occurrences do - so unlike
// the general swap-to-"O Lord, hear our prayer" rule (task #21), this
// one is simply omitted outright for a Layman.
const fs = require("fs");
const { JSDOM } = require("jsdom");

function makeDom() {
  const html = fs.readFileSync("index.html", "utf8");
  const dom = new JSDOM(html, { url: "http://localhost/#office/prime", runScripts: "outside-only", pretendToBeVisual: true });
  const { window } = dom;
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

function setMinister(doc, rank) {
  const btn = doc.querySelector(`#ministerMenu button[data-minister="${rank}"]`);
  if (!btn) throw new Error(`no minister button for ${rank}`);
  btn.click();
}

// Default state: ministerRank defaults to "layman".
{
  const dom = makeDom();
  const doc = dom.window.document;
  const body = doc.getElementById("officeBody").textContent;
  check(
    "Layman (default): Commemoration's own Collect and its surrounding text are still present",
    body.includes("O God, the Giver of pardon and the Author of man's salvation")
  );
  check(
    "Layman (default): the bare \"The Lord be with you.\"/\"And with thy spirit.\" pair is omitted",
    !(body.includes("The Lord be with you.") && body.includes("And with thy spirit."))
  );
}

// Switch to Priest: the versicle should now appear.
{
  const dom = makeDom();
  const doc = dom.window.document;
  setMinister(doc, "priest");
  const body = doc.getElementById("officeBody").textContent;
  check(
    "Priest: the \"The Lord be with you.\"/\"And with thy spirit.\" pair is present",
    body.includes("The Lord be with you.") && body.includes("And with thy spirit.")
  );
}

// Switch to Deacon: the versicle should also appear (George's note names
// only the "layman setting," not Deacon).
{
  const dom = makeDom();
  const doc = dom.window.document;
  setMinister(doc, "deacon");
  const body = doc.getElementById("officeBody").textContent;
  check(
    "Deacon: the \"The Lord be with you.\"/\"And with thy spirit.\" pair is present",
    body.includes("The Lord be with you.") && body.includes("And with thy spirit.")
  );
}

// Regression: the Athanasian Creed's own unrelated "Glory be to the
// Father..." versicle, and every other Pretiosa/Commemoration versicle,
// must still render normally for a Layman - only this one specific pair
// is targeted.
{
  const dom = makeDom();
  const doc = dom.window.document;
  const body = doc.getElementById("officeBody").textContent;
  check(
    "Layman: the unrelated \"Right dear in the sight of the Lord\" Pretiosa versicle is unaffected",
    body.includes("Right dear in the sight of the Lord")
  );
  check(
    "Layman: the unrelated \"May the Divine Assistance remain always with us\" versicle is unaffected",
    body.includes("May the Divine Assistance remain always with us")
  );
  check(
    "Layman: the Commemoration's closing \"Rest eternal grant unto them\" versicle is unaffected",
    body.includes("Rest eternal grant unto them, O Lord")
  );
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
