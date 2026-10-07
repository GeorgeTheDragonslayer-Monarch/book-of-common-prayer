// Task #199 verification: George's corrections doc, Burial of the Dead
// section - four separate items:
//   1. "At the end of each Psalm, the 'Rest eternal' etc. should be
//      provided, instead of before all of the Psalms."
//   2. "A button should be put in the Lesson section allowing for easy
//      selection of the preferred Lesson option, instead of the rubric
//      there. 1 Corinthians 5:20 should be the default." (read as a typo
//      for the source's own "1 Corinthians 15:20" - see ROADMAP.md.)
//   3. "In the rubric after the Lesson, 'Apostles' should be in normal
//      rubric font colour."
//   4. "At the Grave, a button should replace the 'or' rubric."
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

const dom = runOnDate("2026-07-08T12:00:00Z", "#burial");
const win = dom.window;
const doc = win.document;
const body = doc.getElementById("burialBody").innerHTML;

// --- Fix 1: Rest eternal after each Psalm, not before all ---
const restEternalCount = (body.match(/Rest eternal grant unto them, O Lord\./g) || []).length;
check("The 'Rest eternal' versicle appears exactly 6 times (once per Psalm Selection)", restEternalCount === 6);

const psalm39Idx = body.indexOf(">Psalm 39.");
const psalm90Idx = body.indexOf(">Psalm 90.");
const firstRestEternalIdx = body.indexOf("Rest eternal grant unto them, O Lord.");
check(
  "The first 'Rest eternal' versicle comes AFTER Psalm 39's heading, not before it (i.e. no longer printed once before all the Psalms)",
  psalm39Idx !== -1 && firstRestEternalIdx > psalm39Idx
);
check(
  "The first 'Rest eternal' versicle comes BEFORE Psalm 90's heading (i.e. it's tied to Psalm 39, not orphaned at the end)",
  psalm90Idx !== -1 && firstRestEternalIdx < psalm90Idx
);

// --- Fix 2: Lesson selector button, 1 Cor 15:20 default ---
check("A burialLesson inline-toggle group is present with all three Lesson options", body.includes('data-inline-toggle="burialLesson"') && body.includes("1 Corinthians 15:20") && body.includes("Romans 8:14-39") && body.includes("John 14:1-6"));
check("1 Corinthians 15:20 is selected by default", /data-inline-toggle="burialLesson" data-value="1cor15" class="selected"/.test(body));
check("The default Lesson's own text (KJV 1 Cor 15:20-58, resolved live) is present, matching the previously hand-transcribed passage", body.includes("and become the firstfruits of them that slept") && body.includes("your labour is not in vain in the Lord"));
check("No leftover 'Note, Either Romans 8:14-39 or John 14:1-6 may be said instead.' static rubric remains", !body.includes("Note, Either Romans 8:14-39 or John 14:1-6 may be said instead."));

// --- Fix 3: 'Apostles' in normal rubric colour (no black-rubric-inline span) ---
const apostlesIdx = body.indexOf("Apostles");
check("'Apostles' appears in the post-Lesson rubric", apostlesIdx !== -1);
const aroundApostles = body.slice(Math.max(0, apostlesIdx - 60), apostlesIdx + 20);
check("'Apostles' is NOT wrapped in a rubric-black-inline span (renders in normal/uniform rubric red, not black)", !aroundApostles.includes("rubric-black-inline"));

// --- Fix 4: At the Grave 'or,' -> button ---
check("A burialGraveSentence inline-toggle group is present with both alternatives", body.includes('data-inline-toggle="burialGraveSentence"') && body.includes("Man, that is born of a woman") && body.includes("All that the Father giveth me"));
check("'Man, that is born of a woman' (first alternative) is selected by default", /data-inline-toggle="burialGraveSentence" data-value="manOfWoman" class="selected"/.test(body));
check("The default alternative's own text ('Man, that is born of a woman...') is present", body.includes("hath but a short time to live, and is full of misery"));
check("The non-default alternative's text ('All that the Father giveth me...') is NOT present until toggled", !body.includes("shall come to me: and him that cometh to me I will in no wise cast out"));
check("No leftover plain 'or,' rubric divider remains between the two alternatives", !/<p class="rubric">\s*or,\s*<\/p>/.test(body));

// --- Toggle interactivity: click the burialGraveSentence "allThatFather" button and confirm re-render ---
const toggleBtn = [...doc.querySelectorAll('[data-inline-toggle="burialGraveSentence"]')].find((b) => b.dataset.value === "allThatFather");
check("The 'All that the Father...' toggle button exists in the DOM", !!toggleBtn);
if (toggleBtn) {
  toggleBtn.dispatchEvent(new win.Event("click", { bubbles: true }));
  const bodyAfter = doc.getElementById("burialBody").innerHTML;
  check("After clicking, the 'All that the Father...' text now renders", bodyAfter.includes("shall come to me: and him that cometh to me I will in no wise cast out"));
  check("After clicking, the 'Man, that is born of a woman...' text no longer renders", !bodyAfter.includes("hath but a short time to live, and is full of misery"));
}

// --- Toggle interactivity: click the burialLesson "rom8" button and confirm re-render pulls live KJV text ---
const lessonBtn = [...doc.querySelectorAll('[data-inline-toggle="burialLesson"]')].find((b) => b.dataset.value === "rom8");
check("The 'Romans 8:14-39' toggle button exists in the DOM", !!lessonBtn);
if (lessonBtn) {
  lessonBtn.dispatchEvent(new win.Event("click", { bubbles: true }));
  const bodyAfter = doc.getElementById("burialBody").innerHTML;
  check("After clicking, Romans 8's own opening text ('as many as are led by the Spirit of God') now renders", bodyAfter.includes("led by the Spirit of God"));
  check("After clicking, the 1 Corinthians 15 text no longer renders", !bodyAfter.includes("is become the firstfruits of them that slept"));
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
