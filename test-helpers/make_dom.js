// Generic jsdom harness builder. Reads index.html's own <script src="js/..."> tags
// (in document order) and loads exactly those into a fresh JSDOM window, so this
// never drifts out of sync with the real site the way a hand-maintained script
// list in an individual test file can. Run from the office-book-web directory.
const { JSDOM } = require("jsdom");
const fs = require("fs");

function scriptListFromIndex(indexPath = "index.html") {
  const html = fs.readFileSync(indexPath, "utf-8");
  const re = /<script src="([^"]+)"><\/script>/g;
  const scripts = [];
  let m;
  while ((m = re.exec(html))) scripts.push(m[1]);
  return scripts;
}

function makeDom(indexPath = "index.html") {
  const html = fs.readFileSync(indexPath, "utf-8");
  const dom = new JSDOM(html, { url: "http://localhost/", runScripts: "dangerously" });
  const { window } = dom;
  const scripts = scriptListFromIndex(indexPath);
  for (const s of scripts) {
    if (!fs.existsSync(s)) { console.log("WARN missing script:", s); continue; }
    const el = window.document.createElement("script");
    el.textContent = fs.readFileSync(s, "utf-8");
    window.document.body.appendChild(el);
  }
  return dom;
}

module.exports = { makeDom, scriptListFromIndex };
