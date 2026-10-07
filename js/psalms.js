/**
 * Helpers for resolving which psalms to say at a given Office, and for
 * rendering their text from data/psalter.json.
 */

/**
 * Parses a lectionary "psalms" field like "8,50", "89:1-30,110,132", or
 * "[15,24,26]" (Ember Day bracket notation) into a list of
 * { num, range } entries. `range`, if present, is the verse-range suffix
 * as printed (e.g. "1-30"). Every range suffix actually present in
 * data/lectionary-temporale.json is a simple "start-end" digit pair (no
 * compound/comma-joined ranges, no "N-end" style - unlike the scripture
 * citation parser in js/scripture.js, which does need to handle those for
 * Bible readings). `renderPsalmHtml` uses `range` to truncate the
 * rendered verses to just the cited span; see there for the slicing logic.
 */
function parsePsalmField(str) {
  if (!str) return [];
  const cleaned = str.replace(/[[\]]/g, "").trim();
  return cleaned.split(",").map((tok) => {
    tok = tok.trim();
    const m = tok.match(/^(\d+)(?::(.+))?$/);
    if (!m) return { num: tok, range: null };
    return { num: parseInt(m[1], 10), range: m[2] || null };
  }).filter((p) => p.num);
}

/**
 * Given a resolved liturgical day (from calendar.js) and the office's
 * slot key (e.g. "evensongII", "mattins"), returns the list of psalm
 * numbers to use: the Proper's psalms if specified, otherwise the
 * Monthly Psalter cycle for that calendar date.
 *
 * `monthlySlot` should be "morning" or "evening".
 *
 * `properPsalmsField` is the already-resolved Proper's "psalms" string
 * for today's specific Hour (e.g. app.js's pickLectionarySlot(resolved).
 * psalms), not something this function derives itself. It used to read
 * `resolved.lectionary.psalms` directly here, but that flat field never
 * actually exists on this site's lectionary data (the real shape nests
 * psalms per-Hour under .mattins/.evensongI/.evensongII - see
 * calendar.js) - so the Temporale's own Proper Psalms silently never
 * displayed at all, on every single day, always falling back to the
 * Monthly Psalter cycle below instead. See ROADMAP.md.
 */
function resolvePsalmsForDay(resolved, psalterData, monthlySlot, properPsalmsField) {
  if (properPsalmsField) {
    return { source: "proper", entries: parsePsalmField(properPsalmsField) };
  }
  const dom = resolved.date.getUTCDate();
  const cycleDay = dom === 31 ? 30 : dom; // Rubric: 31-day months repeat Day 30's psalms.
  const cycle = psalterData.monthlyCycle[String(cycleDay)];
  if (!cycle) return { source: "monthly", entries: [] };
  let nums = cycle[monthlySlot] || [];
  // Day 19's morning cycle is [95, 96, 97] - but Psalm 95 (Venite,
  // exsultemus) is already said as Mattins' fixed daily Invitatory before
  // the Monthly Psalter even begins (see the "Venite" section of
  // mattins-template.json). Without this, Day 19 would say the same
  // Psalm twice in a row. Only the morning slot is affected: Evensong has
  // no Venite, and no other day's cycle repeats it.
  if (monthlySlot === "morning") {
    nums = nums.filter((n) => n !== 95);
  }
  // Most monthlyCycle entries are plain psalm-number integers. Psalm 119
  // (176 verses) is the one exception the traditional 30-day Psalter table
  // itself subdivides: Day 24 Evening through Day 26 Evening each say only
  // one portion of it (vv. 1-32, 33-72, 73-104, 105-144, 145-176 - see
  // pages/Psalter/Psal.tex's own section breaks), never the whole psalm at
  // once. Those five slots are stored as { num, range } objects in
  // data/psalter.json instead of bare numbers so renderPsalmHtml can
  // truncate to the cited portion, same mechanism parsePsalmField already
  // uses for the Lectionary's own Proper Psalms. See ROADMAP.md.
  return {
    source: "monthly",
    cycleDay,
    entries: nums.map((n) => (typeof n === "object" ? { num: n.num, range: n.range || null } : { num: n, range: null })),
  };
}

/**
 * Resolves which antiphon(s) apply to a given psalm/range/weekday, per
 * Psal.tex's own antiphon markup (see ROADMAP.md, task #119). Returns a
 * list of { incipit, text, range } entries (range is null except for
 * Psalm 119's per-section antiphons) - a list because Psalm 119's stored
 * portions each span several of the Psalter's traditional 8-verse
 * antiphon-sections, and none of that data should be silently dropped.
 * Returns [] if this psalm has no sourced antiphon (there is no fallback
 * text - see ROADMAP.md on Psalm 95, which is deliberately never resolved
 * here since renderPsalmHtml's caller already filters it out of the
 * Monthly Psalter before this ever runs).
 */
function resolvePsalmAntiphons(psalm, range, weekdayName) {
  if (psalm.antiphonByWeekday) {
    const a = weekdayName && psalm.antiphonByWeekday[weekdayName];
    return a ? [{ incipit: a.incipit, text: a.text, range: null }] : [];
  }
  if (psalm.antiphonSections) {
    // Match every stored section whose verse-range falls within the
    // portion actually being shown (or all 22, if no range was given -
    // i.e. Psalm 119 is somehow being shown whole, which the Monthly
    // Psalter never does, but this keeps the function honest either way).
    let lo = 1, hi = psalm.verses.length;
    if (range) {
      const m = range.match(/^(\d+)-(\d+)$/);
      if (m) { lo = parseInt(m[1], 10); hi = parseInt(m[2], 10); }
    }
    return psalm.antiphonSections
      .filter((s) => {
        const m = s.range.match(/^(\d+)-(\d+)$/);
        if (!m) return false;
        const sStart = parseInt(m[1], 10), sEnd = parseInt(m[2], 10);
        return sStart <= hi && sEnd >= lo;
      })
      .map((s) => ({ incipit: s.incipit, text: s.text, range: s.range }));
  }
  if (psalm.antiphon) {
    return [{ incipit: psalm.antiphon.incipit, text: psalm.antiphon.text, range: null }];
  }
  return [];
}

/**
 * Renders one or more antiphon entries as a block of `.antiphon`
 * paragraphs. `before` selects incipit vs. full text (see
 * resolvePsalmAntiphons) for the pre-psalm placement - UNLESS
 * `fullBefore` is true (George's 9/2 note: "When a feast day's rank is
 * Double or higher, the antiphon for the psalms and canticles is said in
 * full before and after the psalm or canticle"), in which case the full
 * text is used even for the "before" placement too. The "after"
 * placement (`before` false) is always the full text regardless, per the
 * antiphon's ordinary convention.
 */
function renderAntiphonBlock(antiphons, before, fullBefore) {
  if (!antiphons.length) return "";
  return antiphons.map((a) => {
    const shown = (before && !fullBefore) ? a.incipit : a.text;
    return `<p class="antiphon">${escapeHtml(shown)}</p>`;
  }).join("");
}

/**
 * Renders a single psalm's HTML block. If `range` is given (e.g. "1-30",
 * from parsePsalmField), truncates the verses to that inclusive 1-indexed
 * span instead of the whole psalm, and notes the citation in the heading.
 * Falls back to the full psalm if the range doesn't parse or is out of
 * bounds, rather than silently rendering nothing.
 *
 * `weekdayName` (George's 9/1 note, "Is it possible to provide the Psalm
 * Antiphons?" - task #119): lowercase weekday of the date being shown
 * (e.g. "sunday"), needed only for Psalm 51, whose antiphon varies by day
 * of the week rather than being fixed - see resolvePsalmAntiphons. Every
 * other psalm's antiphon comes straight from Psal.tex's per-psalm
 * `\psalmAntiphon{}` and ignores this parameter.
 *
 * `fullAntiphonBefore` (George's 9/2 note, task #139): true on a Double+
 * ranked Feast day, per the general rule that the antiphon is then said
 * in full both before and after, not just incipit-before - see
 * renderAntiphonBlock.
 *
 * `omitAfterAntiphon` (George's 9/2 note, task #143): Evensong's own last
 * Psalm skips printing its "after" antiphon here at all - app.js's
 * "psalms" case only ever passes this for that one Psalm, and prints the
 * antiphon itself immediately after the Gloria in excelsis/Gloria Patri
 * choice instead (still before the First Lesson), matching the same
 * "the closing doxology for the whole group is supplied afterward, not
 * per-Psalm" idea already established for `omitGloria`.
 */
function renderPsalmHtml(num, psalterData, range, omitGloria, weekdayName, fullAntiphonBefore, omitAfterAntiphon, suppressOwnAntiphon) {
  const psalm = psalterData.psalms[String(num)];
  if (!psalm) {
    return `<div class="psalm-block"><h4>Psalm ${num}</h4><p class="missing">Text not found.</p></div>`;
  }
  let verseList = psalm.verses;
  let rangeLabel = null;
  if (range) {
    const m = range.match(/^(\d+)-(\d+)$/);
    if (m) {
      const start = parseInt(m[1], 10);
      const end = parseInt(m[2], 10);
      if (start >= 1 && end >= start && start <= psalm.verses.length) {
        const clampedEnd = Math.min(end, psalm.verses.length);
        verseList = psalm.verses.slice(start - 1, clampedEnd);
        rangeLabel = `${start}-${clampedEnd}`;
      }
    }
  }
  // The Psalter has no drop-cap markup of its own in the source data (it's
  // plain verse-by-verse text, unlike collects/canticles which carry a
  // "dropcap" flag) - so the first letter of the first verse *actually
  // rendered* (i.e. of the range, when one applies) gets one here to
  // match how every other opening line in this site is set.
  const verses = verseList.map((v, i) => `<p>${i === 0 ? withDropcap(escapeHtml(v)) : escapeHtml(v)}</p>`).join("");
  // psalm.title already includes the "Psalm N." prefix (e.g.
  // "Psalm 121. Levavi oculus"), so we split off just the Latin incipit
  // to italicize rather than re-prepending "Psalm N." a second time.
  let heading;
  if (psalm.title) {
    const m = psalm.title.match(/^(Psalm \d+\.)\s*(.*)$/);
    heading = m && m[2] ? `${escapeHtml(m[1])} <em>${escapeHtml(m[2])}</em>` : escapeHtml(psalm.title);
  } else {
    heading = `Psalm ${num}`;
  }
  // Per George's 8/24 note: don't print which verses are being cited
  // (e.g. "vv. 1-6") in the heading - the verse range is still used above
  // to truncate which verses actually render, just not announced in the
  // heading text itself. `rangeLabel` is otherwise unused now but left in
  // place in case a future citation-display need comes back.
  void rangeLabel;
  // The Gloria always follows in full, even when only part of the psalm
  // is cited - it's a fixed doxology, not part of the psalm text itself.
  // Rendered as a real versicle/response pair (the same ".versicle"/
  // ".response" CSS classes - and so the same "℣. "/"℟. " marks via
  // their ::before rules - that every other versicle in this site uses),
  // rather than one plain italicized paragraph as before.
  //
  // `omitGloria` (George's 9/1 note): Evensong's own Psalms section is
  // immediately followed by its Gloria in excelsis/Gloria Patri toggle
  // (see the "gloriaChoice" case in app.js), which supplies the closing
  // doxology for the whole group of Psalms just sung - so the LAST
  // Psalm in that group shouldn't also print its own individual Gloria
  // Patri right before it; that would just be the same "Glory be to the
  // Father..." said twice back to back (once here, once again a moment
  // later via the toggle, whichever of its two options is showing).
  // Every Psalm before the last one still gets its own, same as always -
  // only app.js's "psalms" case ever passes this, and only for
  // Evensong's own last entry.
  const gloriaHtml = omitGloria ? "" :
    `<p class="versicle">Glory be to the Father, and to the Son, and to the Holy Ghost;</p><p class="response">As it was in the beginning, is now, and ever shall be, world without end. Amen.</p>`;
  // Psalm Antiphons (George's 9/1 note, task #119): Psal.tex prints each
  // Monthly-Psalter psalm with its own proper antiphon, said in incipit
  // form before the psalm and in full after it/its Gloria Patri - the
  // same "before"/"after" convention already used for Compline's Psalm
  // and Nunc Dimittis antiphons (see the complinePsalmAntiphon case in
  // app.js). The source's header rubric also says that when the antiphon
  // is identical to the first half of the psalm's own first verse, that
  // repeated portion of the verse is dropped - a chant-performance nicety
  // for avoiding saying the same words twice in a row aloud. That isn't
  // applied here: it only affects a minority of psalms (most antiphons,
  // like Psalm 1's, are drawn from elsewhere in the text, not the
  // opening), and reproducing it would mean silently rewriting the
  // Psalter's own verse text against a fragile per-psalm string match.
  // Every verse of the underlying psalm is left exactly as sourced.
  // `suppressOwnAntiphon` (George's 9/2 note, task #141): on a day whose
  // winning Feast/season has its own proper Psalm antiphon (sourced from
  // Temporale.tex/Sanctorale.tex's `\psalmAntiphon{}`, distinct from
  // Psal.tex's per-psalm Monthly Psalter antiphon), that ONE antiphon
  // covers the WHOLE group of psalms for the Hour - said once before the
  // first Psalm and once (in full) after the last - replacing every
  // individual psalm's own antiphon for the day, not supplementing it.
  // The group-level rendering lives in app.js's "psalms" case; this flag
  // just tells this per-psalm renderer to skip its own antiphon(s)
  // entirely, since the group's antiphon already covers it.
  const antiphons = suppressOwnAntiphon ? [] : resolvePsalmAntiphons(psalm, range, weekdayName);
  const antiphonBefore = renderAntiphonBlock(antiphons, true, fullAntiphonBefore);
  const antiphonAfter = omitAfterAntiphon ? "" : renderAntiphonBlock(antiphons, false);
  // George's 9/2 note: "title first Psalm 19, the latin name, then the
  // antiphon" - the heading (which already carries both the psalm number
  // and its Latin incipit together) prints first, with the antiphon
  // following it, not before.
  return `<div class="psalm-block"><h4>${heading}</h4>${antiphonBefore}${verses}${gloriaHtml}${antiphonAfter}</div>`;
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Wraps the first letter of an already-HTML-escaped string in a drop-cap span, matching app.js's withDropcap. */
function withDropcap(escapedText) {
  const m = escapedText.match(/^([A-Za-z])(.*)$/s);
  if (!m) return escapedText;
  return `<span class="dropcap-letter">${m[1]}</span>${m[2]}`;
}

if (typeof module !== "undefined") {
  module.exports = { parsePsalmField, resolvePsalmsForDay, renderPsalmHtml, withDropcap, resolvePsalmAntiphons, renderAntiphonBlock };
}
