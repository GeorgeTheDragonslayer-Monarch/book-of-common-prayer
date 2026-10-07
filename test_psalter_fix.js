const { JSDOM } = require('jsdom');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf-8');
// runScripts:"dangerously" + real <script> elements, not window.eval per
// file: top-level `const`/`let` declared in one indirect eval() call
// doesn't persist into a later, separate eval() call, so
// js/liturgical-color.js's `const LITURGICAL_COLORS` was invisible to
// js/app.js under the old harness. Real <script> tags share one global
// lexical environment, matching an actual browser.
const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'dangerously' });
const { window } = dom;

const scripts = ['js/data-psalter.js','js/data-kalendar.js','js/data-lectionary.js',
  'js/data-evensong-template.js','js/data-mattins-template.js','js/data-compline-template.js',
  'js/data-prime-template.js','js/data-terce-template.js','js/data-sext-template.js','js/data-none-template.js',
  'js/data-collects-temporale.js','js/data-collects-sanctorale.js','js/data-kjv.js','js/data-apocrypha.js',
  'js/data-marian-anthems.js','js/data-athanasian-creed.js','js/data-great-litany.js','js/data-litany-saints.js',
  'js/data-mass-ordinary.js','js/data-confession.js','js/data-communion-sick.js',
  'js/computus.js','js/calendar.js','js/psalms.js','js/liturgical-color.js','js/office-variants.js',
  'js/ranking.js','js/scripture.js','js/app.js'];
for (const s of scripts) {
  const el = window.document.createElement('script');
  el.textContent = fs.readFileSync(s, 'utf-8');
  window.document.body.appendChild(el);
}

const doc = window.document;

// Force a date where Mattins uses the Monthly Psalter (not a Proper), e.g. April 15 -> Day 15.
window.location.hash = '#office/mattins';
window.dispatchEvent(new window.Event('hashchange'));

const body = doc.getElementById('officeBody').innerHTML;
console.log('contains raw LaTeX artifact (\\\\textit or unescaped brace in h4):',
  /<h4>[^<]*\\textit/.test(body) || /<h4>Psalm \d+\.\s*Psalm \d+\./.test(body));
console.log('contains "Iwill"/"OGod"-style glued word:', /Iwill|Ihate|Iwaited|OGod|OLord|Ogive|Osing/.test(body));
console.log('contains <\\em> typo:', body.includes('<\\em>'));
console.log('sample h4 headings:', [...body.matchAll(/<h4>(.*?)<\/h4>/g)].map(m => m[1]).slice(0,5));
