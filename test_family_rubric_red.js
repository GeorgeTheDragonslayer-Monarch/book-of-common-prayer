// Task #200 verification: George's corrections doc, Family Prayers
// section: "The parenthetical rubrics should be in Rubric Red font
// colour." Family.tex's own `\margrubleft{1}{...}` marginal note (Evening
// Prayer's Confession of Sins) is rendered inline as a parenthetical -
// this is the only such parenthetical stage direction in the whole file
// - and had never been colour-marked at all until now.
const fs = require("fs");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync("index.html", "utf8");
const dom = new JSDOM(html, { url: "http://localhost/#family", runScripts: "outside-only", pretendToBeVisual: true });
const scriptSrcs = [...dom.window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"));
const combined = scriptSrcs.map((src) => fs.readFileSync(src, "utf8")).join("\n;\n");
dom.window.eval(combined);
const body = dom.window.document.getElementById("familyBody").innerHTML;

let failed = false;
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + ": " + label);
  if (!cond) failed = true;
}

const idx = body.indexOf("Here let him who reads make a short pause");
check("The marginal-rubric parenthetical is present", idx !== -1);
const around = body.slice(Math.max(0, idx - 60), idx + 100);
check("It renders inside a rubric-red-inline span (not plain text)", around.includes("rubric-red-inline"));
check("The parenthesis marks themselves are inside the coloured span (the whole parenthetical, not just the words within)", /rubric-red-inline">\(Here let him who reads/.test(around));
check(
  "The surrounding sentence (before and after the parenthetical) still renders as ordinary plain text, unaffected",
  body.includes("acknowledging our manifold transgressions of thy righteous laws.") && body.includes("But, O gracious Father, who desirest not the death of a sinner")
);

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
