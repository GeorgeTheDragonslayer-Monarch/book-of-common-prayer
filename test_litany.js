const { JSDOM } = require('jsdom');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf-8');
// runScripts:"dangerously" + real <script> elements, not window.eval per
// file: top-level `const`/`let` declared in one indirect eval() call
// doesn't persist into a later, separate eval() call, so
// js/liturgical-color.js's `const LITURGICAL_COLORS` was invisible to
// js/app.js under the old harness (surfaced by this file's own
// Compline-navigation regression check, below). Real <script> tags
// share one global lexical environment, matching an actual browser.
const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'dangerously' });
const { window } = dom;

// Load every script tag referenced by index.html, in order, so we
// don't have to hand-maintain a duplicate list here.
const scriptSrcs = [...dom.window.document.querySelectorAll('script[src]')].map(s => s.getAttribute('src'));
for (const s of scriptSrcs) {
  const el = window.document.createElement('script');
  el.textContent = fs.readFileSync(s, 'utf-8');
  window.document.body.appendChild(el);
}

const doc = window.document;
window.location.hash = '#litany';
window.dispatchEvent(new window.Event('hashchange'));

console.log('page-litany hidden:', doc.getElementById('page-litany').hidden);
console.log('page-home hidden:', doc.getElementById('page-home').hidden);
const body = doc.getElementById('litanyBody');
console.log('title:', doc.querySelector('.office-title').textContent.trim());
console.log('body innerHTML length:', body.innerHTML.length);
console.log('rubric count:', body.querySelectorAll('.rubric').length);
console.log('versicle count:', body.querySelectorAll('.versicle').length);
console.log('response count:', body.querySelectorAll('.response').length);
console.log('collect-block count:', body.querySelectorAll('.collect-block').length);
console.log('end-mark:', body.querySelector('.end-mark') ? body.querySelector('.end-mark').textContent.trim() : 'MISSING');
console.log('contains "null":', body.innerHTML.includes('>null<') || /\bnull\b/.test(body.textContent));
console.log('contains raw backslash macro leftover:', /\\[a-zA-Z]/.test(body.textContent));

// Nav link should be marked current
console.log('nav current:', [...doc.querySelectorAll('[data-nav-link]')].find(el => el.classList.contains('current'))?.dataset.navLink);

// Spot-check a few known lines of text actually appear
const text = body.textContent;
['O God the Father, Creator of heaven and earth', 'Have mercy upon us', 'Good Lord, deliver us',
 'We humbly beseech thee, O Father', 'Here Endeth the Great Litany',
 'pious custom to pray this Litany upon Sundays, Wednesdays, and Fridays',
 'Queen Camilla', 'The President of the United States'].forEach(snippet => {
  console.log(`contains "${snippet}":`, text.includes(snippet));
});

// Now test Both language mode doesn't crash and shows the no-Latin note
doc.querySelector('#languageMenu button[data-lang="both"]').click();
console.log('after Both mode, body length:', doc.getElementById('litanyBody').innerHTML.length);
console.log('no-latin notes present:', doc.getElementById('litanyBody').querySelectorAll('.no-latin-note').length);

// Switch back to English and test office page still works (regression check)
doc.querySelector('#languageMenu button[data-lang="english"]').click();
window.location.hash = '#office/compline';
window.dispatchEvent(new window.Event('hashchange'));
console.log('compline still works, title:', doc.querySelector('.office-title').textContent.trim());
console.log('compline body length:', doc.getElementById('officeBody').innerHTML.length);
