/**
 * Front-end glue: hash-based routing between Home / an Office-by-Hour
 * page / About, dropdown menus for Hours and Language, the calendar
 * popover, liturgical color theming, and rendering the Office
 * templates. All seven canonical Hours (Mattins, Prime, Terce, Sext,
 * None, Evensong, Compline) have real content - see ROADMAP.md for
 * what's still approximate (ranking/precedence, scripture text, etc).
 */
(function () {
  const HOUR_LABELS = {
    mattins: "Mattins", prime: "Prime", terce: "Terce", sext: "Sext",
    none: "None", evensong: "Evensong", compline: "Compline",
  };
  const HOUR_TEMPLATES = {
    evensong: window.EVENSONG_TEMPLATE, mattins: window.MATTINS_TEMPLATE, compline: window.COMPLINE_TEMPLATE,
    prime: window.PRIME_TEMPLATE, terce: window.TERCE_TEMPLATE, sext: window.SEXT_TEMPLATE, none: window.NONE_TEMPLATE,
  };
  const HOUR_MONTHLY_SLOT = { mattins: "morning", prime: "morning", terce: "morning", sext: "morning", none: "evening", evensong: "evening", compline: "evening" };

  let lectionaryData = window.LECTIONARY_DATA;
  let kalendarData = window.KALENDAR_DATA;
  let psalterData = window.PSALTER_DATA;
  let collectsTemporaleData = window.COLLECTS_TEMPORALE || {};
  let collectsSanctoraleData = window.COLLECTS_SANCTORALE || {};
  let kjvData = window.KJV_DATA || {};
  let apocryphaData = window.APOCRYPHA_DATA || {};
  let marianAnthemsData = window.MARIAN_ANTHEMS || {};
  let athanasianCreedData = window.ATHANASIAN_CREED || {};
  let oldTestamentCanticlesData = window.OLD_TESTAMENT_CANTICLES || { weekdays: {} }; // pages/Office/OTCant.tex (task #140) - the 12 Ferial/Festal canticles this Breviary actually contains, replacing the previously-wrong "Nine Biblical Odes" scheme
  let foreOfficeData = window.FOREOFFICE_DATA || null;
  let lectionaryFestivalsData = window.LECTIONARY_FESTIVALS || {};

  let currentDate = todayUtc();
  let languageMode = "english"; // "english" | "latin" | "both"
  let ministerRank = "layman"; // "priest" | "deacon" | "layman" - who is leading the Office; drives the Absolution-vs-Collect choice (Fore-Office/Prime/Compline) and the "Lord be with you"-vs-"O Lord, hear our prayer" versicle choice, per Augustine's 8/22 answers. Layman by default, matching the old "No Priest Present" default.
  let region = "america"; // "america" | "commonwealth" - drives the Preces "O Lord, save the State/King" line and the Third Collect State prayer in Mattins/Evensong, per Augustine's 8/22 answer
  let gloriaChoice = "patri"; // "excelsis" | "patri" - which doxology Evensong prints after the Psalms, per the rubric's "Gloria Patri, or else the Gloria in excelsis" choice. "patri" is the default per Augustine's 9/5 answer ("during Evensong, the Gloria Patri should be the default, not the Gloria in excelsis") - previously defaulted to "excelsis", the reverse.
  let creedChoice = "apostles"; // "apostles" | "nicene" - which Creed is said at Mattins/Evensong when the Athanasian Creed doesn't automatically override it (per "the Nicene Creed may be said instead of the Apostles'")
  let sundayPsalterChoice = "monthly"; // "monthly" | "proper" - Augustine's 9/5 answer: "The Proper Psalms for Sundays Second Class or lower are optional," the 30-Day (Monthly) Psalter being the default. Every Sunday in data/lectionary-temporale.json carries its own Proper Psalms, same as a major Feast, but Ranking.tex's own three-tier Sunday scheme (First Class Sundays give place to no Feast; Second Class Sundays only to a 1st Double; "All Other Sundays" to a 1st or 2nd Double - see ranking.js's classifySeasonDay) only makes the Feast-level Propers genuinely optional at the bottom two tiers. First Class Sundays (Advent I, the Lent Sundays, Passion/Palm Sunday, Easter Day/I, Whitsunday) keep their own Proper Psalms mandatory, exactly as before this task - this toggle has no effect on them and isn't shown. "monthly" (the 30-Day Psalter) is the default per Augustine's explicit answer, the reverse of every other "Proper vs. fallback" choice on this site (which otherwise default to showing the fuller/proper text - see task #139's Double+ precedent) - here the terser choice is what he asked to be the default.
  let omitVeniteAshWednesday = false; // the Venite "may be omitted on Ash Wednesday" - optional, off by default; Maundy Thursday/Good Friday/Easter Even omit it unconditionally regardless of this setting
  // Weekday Canticle (8/25 note, per Augustine via George): the old
  // three-way Automatic/Te Deum/Benedicite manual override duplicated
  // pickMorningCanticle's own by-rule logic (a user could force either
  // canticle at will, second-guessing the automatic Sunday/feast-rank/
  // season pick). Replaced with a two-way choice instead: "automatic"
  // (Te Deum/Benedicite exactly as pickMorningCanticle already decides -
  // no manual override of *which* of those two, full stop) or
  // "oldTestament" - Mattins.tex's own named substitute for whichever of
  // Te Deum/Benedicite the day calls for (see the "morningCanticle" case
  // below and task #140's ROADMAP entry). Automatically shows today's
  // weekday's own Ferial or Festal Old Testament Canticle (OTCant.tex) -
  // no manual sub-choice of which one, matching how "automatic" itself
  // has no manual Te Deum/Benedicite override either.
  let morningCanticleMode = "automatic"; // "automatic" | "oldTestament"
  let matrimonyPsalmChoice = "128"; // "128" | "67" - Matrimony's Thanksgiving psalm, printed in the source as an inline "or," choice; Psalm 128 is the default per Augustine's 8/23 note
  let receptionPsalmChoice = "51"; // "51" | "130" - Reception of Converts' penitential psalm, printed in the source as an inline "(or Psalm 130)" choice; Psalm 51 is the default, the form printed first/named in the rubric
  let exhortationChoice = "long"; // "long" | "short" | "omitted" - the Fore-Office's Exhortation to Penitence, another inline "or," choice in the source; "long" (the form printed first) is the default
  let commandmentsChoice = "full"; // "full" | "summary" - Mass Ordinary's Ten Commandments vs. the Summary of the Law, per the source rubric ("The Ten Commandments may be omitted... the Minister shall say the Summary of the Law" - a real either/or, not both back to back); "full" (printed first) is the default
  let complineCollectChoice = "standard"; // "standard" | "memorial" - Compline's own inline "or," choice between its two Collects ("Visit, we beseech thee..." vs. "Lord Jesu Christ, Son of the living God..."); "standard" (printed first) is the default
  let litanyForm = "full"; // "full" | "shortened" - the Great Litany's own printed permission ("The Minister may, at his discretion, omit all that followeth, to the Prayer, We humbly beseech thee, O Father, etc.") turned into a toggle; "full" (the unshortened form) is the default
  let presidentPrayerChoice = "heavenlyFather"; // "heavenlyFather" | "governor" - Mattins' two alternate Prayers for the President ("O Lord, our heavenly Father..." / "O Lord our Governor...", pages/Prayers/PrayersThanksgivings.tex's "During Morning Prayer" / "or this, during Morning Prayer"). Evensong keeps no toggle and always prints a single fixed text, per Augustine's 8/26 review ("the presidential prayer in evening prayer should be a single, fixed option rather than a selection") - that part of the decision stands. What was wrong (task #144, George's 9/2 note: "the morning prayer is being used where the evening prayer should be; the prayer for the president should be in the evening prayer") was WHICH single text: `data/evensong-template.json` had been printing Mattins' own "O Lord, our heavenly Father..." text (Morning Prayer's first variant) verbatim, when the very same source section actually gives Evening Prayer its own third, genuinely distinct text right below the two Morning Prayer ones - explicitly marked "\P{ }During Evening Prayer." in pages/Prayers/PrayersThanksgivings.tex:34-41 - "Almighty God, whose kingdom is everlasting and power infinite...". An earlier session's 9/1 correction (task #126) actually found this exact text in an old code comment, wrongly dismissed it as "invented" without checking the source file it names, and rewrote the comment to describe the wrong shared text as confirmed-correct instead. Fixed 9/2 by sourcing the real Evening Prayer text into `data/evensong-template.json` in place of the copied Morning Prayer one - still a single fixed text, no toggle, exactly as Augustine's review specified, just the correct single text now. Confirmed live via jsdom for both America and Commonwealth regions (the Commonwealth side's own single "A Prayer for the King and the Royal Family" text has no separate Morning/Evening split in the source at all, so it's untouched and unaffected either way). "heavenlyFather" (printed first) remains Mattins' own default.
  let massDayChoice = "automatic"; // "automatic" | "memorial" | "requiem" - "memorial": on a day where a Memorial/Simple-rank saint is merely noted but the season/feria's own Mass wins by default, the Priest may instead choose to say the Memorial's own Votive Mass (8/26 note: "options should exist for the priest to select either the preceding Sunday or the memorial"); see applyMassDayChoice/massDayChoiceAvailable. "requiem": a Votive Requiem Mass, always offerable regardless of the day - this prototype doesn't have full Requiem Mass Propers text, so it only swaps the Gloria-omission rule, the Agnus Dei's "grant them rest" text (see the "collect" case's requiemText handling), and the Final Blessing's own Requiem dismissal (see pickFinalBlessingVariant); the Introit/Collect/Epistle/Gospel placeholders still show whatever the day's automatic winner is. "automatic" (the season/feria or automatically-winning Feast, matching prior behavior) is the default.
  let votiveThirdCollectChoice = "persecutors"; // "persecutors" | "chiefBishop" - Votive Masses' "Our Lady on Saturday" third Collect/Secret/Postcommunion, printed in the source as an either/or choice ("Against the Persecutors of the Church, or for the Chief Bishop"); manual toggle per Augustine's 8/29 answer (Q10 of the release-audit list). "persecutors" (printed first) is the default, matching this project's convention for every other such either/or choice.
  let matinsDeadNocturns = "three"; // "three" | "one" - Matins of the Dead's own rubric ("The Nocturns placed below, or one Nocturn only, may be said as noted") makes reciting all three Nocturns vs. just one a genuine either/or left to the Priest's discretion (except on a burial day or All Souls', where three is required - not modeled here since this static rite page carries no date context of its own); "three" (the fuller, more solemn form, matching this site's general preference for showing full text by default - see task #139's Double+ "doubled" antiphon precedent) is the default.
  let matinsDeadNocturnPick = ["Sunday","Monday","Thursday"].includes(["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()]) ? "1"
    : ["Tuesday","Friday"].includes(["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()]) ? "2" : "3";
  // "1" | "2" | "3" - which single Nocturn to show when matinsDeadNocturns
  // is "one"; the rubric ties this to the weekday (Nocturn I: Sunday,
  // Monday, & Thursday; II: Tuesday & Friday; III: Wednesday & Saturday -
  // see data/matins-dead.json's own per-Nocturn rubrics), so this defaults
  // from the real device date exactly once at load (matching task #97's
  // homepage-CTA precedent of a date-derived smart default that the user
  // can still freely override), rather than defaulting to a fixed "1"
  // that would silently mismatch on 6 days out of 7.
  let officeDeadCollectChoice = "allFaithful"; // which of data/collects-dead.json's 10 options is shown at Vespers/Matins/Lauds of the Dead's shared "The appropriate collect is here said (p. \pageref{dead})" cross-reference point (task #167) - none of the three rite files had ever actually carried the Collect text itself, just that one bare rubric, so this is a new selector rather than a toggle between two already-transcribed alternatives. "allFaithful" ("For All the Faithful Departed", printed first in the source's own list) is the default, matching this project's convention for every other such either/or choice.
  let ambrosePortion = "portion"; // "portion" | "full" - Preparation for Holy Communion's "Prayer of St. Ambrose" (task #168) is printed in the source as seven separate paragraphs, one headed by each day of the week (Sunday through Saturday) - the classic devotional practice of praying one portion per day rather than the whole prayer at once (that's the entire reason the source divides it by weekday heading in the first place, unlike e.g. Matins of the Dead's three Nocturns, where the FULLER form is the historically primary one - see matinsDeadNocturns above). "portion" is therefore the default here, the reverse of that other toggle's convention; "full" shows all seven days' text at once, unconditionally, exactly as this site printed it before this task.
  let ambroseDayPick = String(new Date().getDay()); // "0" (Sunday) - "6" (Saturday), matching JS's own Date.getDay() convention and this site's data/preparation.json weekdayPortion tags (kept as a string, like matinsDeadNocturnPick above, for simple strict-equality comparison against inline-toggle button values) - which single day's portion to show when ambrosePortion is "portion". Defaults from the real device date exactly once at load (same smart-default pattern as matinsDeadNocturnPick above), freely overridable by the user (e.g. to pray a missed day's portion, or look ahead).
  let selectedTimezone = "auto"; // "auto" (this device's own IANA zone, via Intl.DateTimeFormat().resolvedOptions().timeZone) or an explicit IANA zone name - used only to pick which Hour the Home page's "Pray [Hour] now" link suggests (see updateHomeCta()); nothing liturgical (the actual Office/Mass content, which date is "today," etc.) reads this.
  let burialLessonChoice = "1cor15"; // "1cor15" | "rom8" | "jn14" - task #199: Burial.tex's own Lesson rubric names one default reading ("1 Corinthians 15:20", printed with its full text) plus a permitted note ("Note, Either Romans 8:14-39 or John 14:1-6 may be said instead.") whose two alternatives were never actually transcribed anywhere on the site - George's corrections doc asked for "a button... allowing for easy selection of the preferred Lesson option, instead of the rubric there," with "1 Corinthians 5:20" named as the default (read as a typo for the source's own "1 Corinthians 15:20," since no such single-verse citation as "1 Corinthians 5:20" is named anywhere in Burial.tex, and 15:20 is what the site already had transcribed as the existing default). "1cor15" is therefore the default, matching both the source's own printed order and George's own note.
  let burialGraveSentenceChoice = "manOfWoman"; // "manOfWoman" | "allThatFather" - Burial.tex's "At the Grave" section prints two alternative sentences to be sung or said while the Body is made ready, joined by a plain "or," between them (the same inline-either/or shape as Matrimony's Psalm 128/67 choice, matrimonyPsalmChoice) - George's corrections doc: "At the Grave, a button should replace the 'or' rubric." "manOfWoman" (the first-printed "Man, that is born of a woman...") is the default, matching this project's convention for every other such either/or choice (the source's own first-listed option wins by default).
  let lastLiturgicalColorName = null; // the most recently applied LITURGICAL_COLORS key's .name (e.g. "White & Gold"), cached so updateFeastTitleColor() can re-derive --feast-title-color when the theme toggles without a full page re-render (applyThemeChoice runs before applyLiturgicalColor is even defined below, hence a plain module-level `let` here rather than a function-local cache).
  let currentHour = "evensong";
  // Set at the top of showPage() below - which top-level page is
  // currently visible ("office", "mass", "litany", etc., matching
  // parseRoute's own `page` vocabulary). Unlike currentHour (only ever
  // updated when route.page === "office", so it goes stale on every
  // other page), this is updated on every single navigation, which
  // renderCommemoratedOration needs to tell an actual Office page
  // (Mattins/Evensong) apart from the Mass page reusing the same
  // currentHour value left over from whichever Office was last visited -
  // see the Memorial-commemoration-timing rule there (Ranking.tex's
  // "Memorial" entry, pages/Front/Ranking.tex:17).
  let currentPage = "home";
  let currentTemplate = null; // set by renderOfficePage; read by renderPlaceholder for template-specific data (invitatory options, canticle choices)
  // Set by renderOfficePage, just before rendering the Evensong hour, to
  // the result of resolveEveningDisplacement(resolved) whenever Table 2
  // (window.Ranking.TABLE2_TOMORROW_WINS - codes 1/3/5) says tomorrow's
  // First Evensong claim displaces today's Office entirely; null every
  // other time (every other Hour, every other page, and Evensong itself
  // on a day the rule doesn't fire). Read back inside renderSection's
  // "collectOfDay" case so it can render a commemoration of TODAY's own
  // (now-displaced) Office within the swapped-in render of tomorrow's
  // Evensong - the mirror image of resolveEveningConcurrence's own
  // commemorate-tomorrow-within-today logic for the code 4 case. A
  // plain module-level flag (matching currentHour/currentPage/
  // currentTemplate just above) rather than a parameter threaded through
  // renderOfficeSections/renderSection, since every other placeholder
  // renderer already reads shared render-pass state this same way.
  let eveningDisplacement = null;

  function todayUtc() {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  function fmtDate(d) {
    return d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  }

  // "YYYY-MM-DD" - the format both read and written by <input type="date">
  // (used by the quick-jump date box - see setupDateToolbar).
  function toIsoDateString(d) {
    const y = String(d.getUTCFullYear()).padStart(4, "0");
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  /**
   * Site-wide rule (8/23 meeting notes): "N." name placeholders are
   * italicized everywhere they appear, including specifically for
   * Bishop/Metropolitan mentions. Centralized here rather than at each
   * of escapeHtml()'s ~99 call sites, since every render path already
   * funnels its text through this one function before turning it into
   * HTML - an exhaustive grep of the whole data/ corpus (see ROADMAP.md)
   * confirmed "N." never appears there for any reason other than the
   * rite's own name placeholder, so this is safe to apply unconditionally.
   * "N.N." (the solemn-oath "given name, surname" convention used once
   * in reception.json) is matched as a single unit rather than two
   * separate placeholders.
   */
  const NAME_PLACEHOLDER_RE = /\bN\.N\.|\bN\.(?=[^a-zA-Z]|$)/g;
  /**
   * `[[...]]` marks a red physical-action rubric embedded inline within
   * otherwise-plain spoken text (a "collect"/"text"/"canticle" section,
   * normally plain ink) - the mirror image of the pre-existing `{{...}}`
   * convention, which marks a *plain* segment within an otherwise-red
   * `.rubric` paragraph (see the "rubric" case in renderSection and
   * .rubric-black-inline in style.css). First use: Mass Ordinary's
   * inline stage directions printed mid-sentence in the Gloria in
   * Excelsis, Nicene Creed, and Sanctus source text ("(Bow head.)",
   * "(Everyone genuflects.)", "(He stands upright & signs himself.)")
   * - per the 8/23 note, physical-action instructions should always be
   * red, even when they're sitting inside a paragraph that's otherwise
   * said/sung aloud and therefore not itself a `.rubric`.
   */
  const RUBRIC_RED_INLINE_RE = /\[\[(.*?)\]\]/g;
  /**
   * `%%...%%` marks the Ten Commandments' own "inset" portions (the
   * elaborating clause after each Commandment's core prohibition,
   * printed smaller and indented in the source - "for I the Lord thy
   * God am a jealous God...", "Six days shalt thou labour...", etc. -
   * see pages/HolyMass/Mass.tex's `\leftskip=2em {\small{...}}` blocks)
   * that "the Priest may omit" per the page's own rubric. The 8/23 note
   * originally had the web version mark these with small-caps, standing
   * in for the print page's indent/smaller-font treatment (which
   * doesn't translate to a single-column web layout) - George's 9/1
   * correction: these optional phrases should read in plain text set
   * off by parentheses instead of small-caps, matching how an omittable
   * clause is conventionally marked elsewhere in this kind of text.
   */
  const SMALL_CAPS_INLINE_RE = /%%(.*?)%%/g;
  /**
   * `{{priest|default::priest}}` resolves a mid-sentence Priest-vs-
   * everyone-else wording difference against the current `ministerRank`
   * setting. George's 9/8 note, task #189: "The differences in the
   * Prayers depending on if the person is a Priest or not should not be
   * noted by 'or, for a Priest,'. Rather, based on the Layman/Deacon/
   * Priest setting, it should automatically put in the correct text."
   * Preparation.tex's "Prayer of St. Ambrose" cycle (data/preparation.json)
   * had been transcribed with these differences as always-shown, inline
   * "(or, for a Priest: ...)" parenthetical notes - correct as a literal
   * transcription of the source's `\margrub{}`/`\margrubleft{}` marginal-
   * note macros, but never actually wired to the site's own three-way
   * Priest/Deacon/Layman setting the way the sitewide "Lord be with you"
   * versicle swap (`resolveMinisterVersicleField`) already is. Unlike
   * that mechanism (which swaps an entire versicle line), these
   * differences sit mid-sentence inside ordinary prose, so this instead
   * marks the exact word/phrase span replaced by the Priest's own
   * wording. The `default` half is deliberately allowed to be empty: two
   * of the five occurrences in the source (`\margrub{9}{at my hands}`
   * and the unlabeled marginal note before "teach me, I pray thee...")
   * have no bracketed word of their own to replace - the Priest's
   * wording is a pure addition there, not a substitution - and an empty
   * `default` half renders as nothing for a Deacon/Layman, exactly
   * matching that. Deliberately resolved in `escapeHtml` itself (ahead
   * of the `&`/`<`/`>` escaping, alongside the other inline markers
   * below) so it works from any section type without new plumbing -
   * `{`/`}` are never escaped, so this survives untouched through every
   * other rendering path that doesn't use it. Uses `|` rather than `:`
   * as the prefix delimiter deliberately: a `{{priest:default::priest}}`
   * form is ambiguous the moment `default` is empty - `{{priest::text}}`
   * only has two colons where the pattern needs three (the prefix's own
   * colon, the empty `default`, and the `::` separator), so a lazy regex
   * silently skates past the intended empty match and glues together
   * with the next `{{priest:...}}` marker later in the same string
   * instead. `|` never appears as part of the "priest" prefix, so no
   * such ambiguity is possible.
   */
  const PRIEST_INLINE_RE = /\{\{priest\|([\s\S]*?)::([\s\S]*?)\}\}/g;
  function escapeHtml(s) {
    const withMinister = String(s).replace(PRIEST_INLINE_RE, (m, def, priest) => (ministerRank === "priest" ? priest : def));
    const esc = withMinister.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return esc.replace(NAME_PLACEHOLDER_RE, (m) => `<em class="name-placeholder">${m}</em>`)
      .replace(RUBRIC_RED_INLINE_RE, (m, inner) => `<span class="rubric-red-inline">${inner}</span>`)
      .replace(SMALL_CAPS_INLINE_RE, (m, inner) => `<span class="commandment-inset">(${inner})</span>`);
  }

  /**
   * Spells out a chapter number as an ordinal word ("First", "Twenty-
   * third", "Sixty-sixth"...), for the "Here beginneth the [Nth] Chapter
   * of [Book]" lesson framing (see Mattins.tex: "the Minister shall say,
   * Here beginneth (Verse of) such a Chapter of such a Book"). Covers
   * every chapter count actually cited by this Lectionary (Psalms 119 is
   * the longest chapter anywhere in the KJV, and no book has more than
   * 150 chapters).
   */
  function ordinalWords(n) {
    const ones = ["", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth"];
    const teens = ["Tenth", "Eleventh", "Twelfth", "Thirteenth", "Fourteenth", "Fifteenth", "Sixteenth", "Seventeenth", "Eighteenth", "Nineteenth"];
    const tensCardinal = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const tensOrdinal = ["", "", "Twentieth", "Thirtieth", "Fortieth", "Fiftieth", "Sixtieth", "Seventieth", "Eightieth", "Ninetieth"];
    if (n < 1) return String(n);
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const tens = Math.floor(n / 10);
      const rem = n % 10;
      return rem === 0 ? tensOrdinal[tens] : `${tensCardinal[tens]}-${ones[rem].toLowerCase()}`;
    }
    const hundreds = Math.floor(n / 100);
    const rem = n % 100;
    const hundredsWord = hundreds === 1 ? "Hundred" : `${ones[hundreds]} Hundred`;
    if (rem === 0) return `${hundredsWord}th`;
    return `${hundredsWord} and ${ordinalWords(rem)}`;
  }

  // ---------------- Routing ----------------
  function parseRoute() {
    const hash = (location.hash || "#home").replace(/^#/, "");
    if (hash.startsWith("office/")) {
      const hour = hash.split("/")[1];
      return { page: "office", hour: HOUR_LABELS[hour] ? hour : "evensong" };
    }
    if (hash === "about") return { page: "about" };
    if (hash === "calendar") return { page: "calendar" };
    if (hash === "litany") return { page: "litany" };
    if (hash === "penitential") return { page: "penitential" };
    if (hash === "litany-saints") return { page: "litany-saints" };
    if (hash === "mass") return { page: "mass" };
    if (hash === "confession") return { page: "confession" };
    if (hash === "communion-sick") return { page: "communion-sick" };
    if (hash === "purification") return { page: "purification" };
    if (hash === "burial-child") return { page: "burial-child" };
    if (hash === "confirmation") return { page: "confirmation" };
    if (hash === "reception") return { page: "reception" };
    if (hash === "matrimony") return { page: "matrimony" };
    if (hash === "baptism") return { page: "baptism" };
    if (hash === "unction") return { page: "unction" };
    if (hash === "burial") return { page: "burial" };
    if (hash === "adult-baptism") return { page: "adult-baptism" };
    if (hash === "family") return { page: "family" };
    if (hash === "asperges") return { page: "asperges" };
    if (hash === "foremass") return { page: "foremass" };
    if (hash === "preparation") return { page: "preparation" };
    if (hash === "thanksgiving") return { page: "thanksgiving" };
    if (hash === "benediction") return { page: "benediction" };
    if (hash === "vesper-dead") return { page: "vesper-dead" };
    if (hash === "matins-dead") return { page: "matins-dead" };
    if (hash === "lauds-dead") return { page: "lauds-dead" };
    if (hash === "votive-bvm") return { page: "votive-bvm" };
    if (hash === "votive-angels") return { page: "votive-angels" };
    if (hash === "votive-matrimony") return { page: "votive-matrimony" };
    if (hash === "votive-dead") return { page: "votive-dead" };
    return { page: "home" };
  }

  function showPage(page) {
    currentPage = page;
    document.getElementById("page-home").hidden = page !== "home";
    document.getElementById("page-calendar").hidden = page !== "calendar";
    document.getElementById("page-office").hidden = page !== "office";
    document.getElementById("page-litany").hidden = page !== "litany";
    document.getElementById("page-penitential").hidden = page !== "penitential";
    document.getElementById("page-litany-saints").hidden = page !== "litany-saints";
    document.getElementById("page-mass").hidden = page !== "mass";
    document.getElementById("page-confession").hidden = page !== "confession";
    document.getElementById("page-communion-sick").hidden = page !== "communion-sick";
    document.getElementById("page-purification").hidden = page !== "purification";
    document.getElementById("page-burial-child").hidden = page !== "burial-child";
    document.getElementById("page-confirmation").hidden = page !== "confirmation";
    document.getElementById("page-reception").hidden = page !== "reception";
    document.getElementById("page-matrimony").hidden = page !== "matrimony";
    document.getElementById("page-baptism").hidden = page !== "baptism";
    document.getElementById("page-unction").hidden = page !== "unction";
    document.getElementById("page-burial").hidden = page !== "burial";
    document.getElementById("page-adult-baptism").hidden = page !== "adult-baptism";
    document.getElementById("page-family").hidden = page !== "family";
    document.getElementById("page-asperges").hidden = page !== "asperges";
    document.getElementById("page-foremass").hidden = page !== "foremass";
    document.getElementById("page-preparation").hidden = page !== "preparation";
    document.getElementById("page-thanksgiving").hidden = page !== "thanksgiving";
    document.getElementById("page-benediction").hidden = page !== "benediction";
    document.getElementById("page-vesper-dead").hidden = page !== "vesper-dead";
    document.getElementById("page-matins-dead").hidden = page !== "matins-dead";
    document.getElementById("page-lauds-dead").hidden = page !== "lauds-dead";
    document.getElementById("page-votive-bvm").hidden = page !== "votive-bvm";
    document.getElementById("page-votive-angels").hidden = page !== "votive-angels";
    document.getElementById("page-votive-matrimony").hidden = page !== "votive-matrimony";
    document.getElementById("page-votive-dead").hidden = page !== "votive-dead";
    document.getElementById("page-about").hidden = page !== "about";
    document.querySelectorAll("[data-nav-link]").forEach((el) => {
      el.classList.toggle("current", el.dataset.navLink === page);
    });
  }

  function handleRoute() {
    const route = parseRoute();
    showPage(route.page);
    if (route.page === "home") {
      renderHomeToday();
    }
    if (route.page === "calendar") {
      renderCalendarPage();
    }
    if (route.page === "office") {
      currentHour = route.hour;
      renderOfficePage();
    }
    if (route.page === "litany") {
      renderLitanyPage();
    }
    if (route.page === "penitential") {
      renderPenitentialPage();
    }
    if (route.page === "litany-saints") {
      renderLitanySaintsPage();
    }
    if (route.page === "mass") {
      renderMassPage();
    }
    if (route.page === "confession") {
      renderConfessionPage();
    }
    if (route.page === "communion-sick") {
      renderCommunionSickPage();
    }
    if (route.page === "purification") {
      renderPurificationPage();
    }
    if (route.page === "burial-child") {
      renderBurialChildPage();
    }
    if (route.page === "confirmation") {
      renderConfirmationPage();
    }
    if (route.page === "reception") {
      renderReceptionPage();
    }
    if (route.page === "matrimony") {
      renderMatrimonyPage();
    }
    if (route.page === "baptism") {
      renderBaptismPage();
    }
    if (route.page === "unction") {
      renderUnctionPage();
    }
    if (route.page === "burial") {
      renderBurialPage();
    }
    if (route.page === "adult-baptism") {
      renderAdultBaptismPage();
    }
    if (route.page === "family") {
      renderFamilyPage();
    }
    if (route.page === "asperges") {
      renderAspergesPage();
    }
    if (route.page === "foremass") {
      renderForeMassPage();
    }
    if (route.page === "preparation") {
      renderPreparationPage();
    }
    if (route.page === "thanksgiving") {
      renderThanksgivingPage();
    }
    if (route.page === "benediction") {
      renderBenedictionPage();
    }
    if (route.page === "vesper-dead") {
      renderVesperDeadPage();
    }
    if (route.page === "matins-dead") {
      renderMatinsDeadPage();
    }
    if (route.page === "lauds-dead") {
      renderLaudsDeadPage();
    }
    if (route.page === "votive-bvm") {
      renderVotiveBvmPage();
    }
    if (route.page === "votive-angels") {
      renderVotiveAngelsPage();
    }
    if (route.page === "votive-matrimony") {
      renderVotiveMatrimonyPage();
    }
    if (route.page === "votive-dead") {
      renderVotiveDeadPage();
    }
    closeAllDropdowns();
  }

  window.addEventListener("hashchange", handleRoute);

  // ---------------- Nav dropdowns ----------------
  // UX-AUDIT.md Finding #5: aria-expanded on each trigger is kept in
  // sync with the "open" class (rather than just toggling a CSS class
  // with no ARIA equivalent), and Escape now closes whatever's open and
  // returns focus to the trigger that opened it, so a keyboard/screen-
  // reader user has both a way to tell a button opens a menu and a
  // reliable way to close one again.
  function closeAllDropdowns() {
    document.querySelectorAll(".nav-item.open").forEach((el) => {
      el.classList.remove("open");
      const trigger = el.querySelector("[data-trigger]");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
  }

  document.querySelectorAll("[data-trigger]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const item = btn.closest(".nav-item");
      const wasOpen = item.classList.contains("open");
      closeAllDropdowns();
      if (!wasOpen) {
        item.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
  document.addEventListener("click", closeAllDropdowns);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    // Close just the innermost open layer per keypress, not everything
    // at once - an open dropdown first (if any), otherwise the mobile
    // nav itself. Two Escape presses closes both in the order they were
    // opened, matching how a stack of overlays is normally expected to
    // behave, rather than one press silently collapsing the whole nav
    // out from under an open dropdown and stealing focus to the
    // hamburger instead of back to the dropdown's own trigger.
    const openItem = document.querySelector(".nav-item.open");
    if (openItem) {
      const trigger = openItem.querySelector("[data-trigger]");
      closeAllDropdowns();
      if (trigger) trigger.focus();
      return;
    }
    const nav = document.querySelector("nav.main-nav");
    if (nav && nav.classList.contains("mobile-open")) {
      nav.classList.remove("mobile-open");
      const hamburger = document.getElementById("navHamburger");
      if (hamburger) { hamburger.setAttribute("aria-expanded", "false"); hamburger.focus(); }
    }
  });

  // ---------------- Mobile nav hamburger (UX-AUDIT.md Finding #1) ----------------
  // Below the 900px breakpoint in css/style.css, .nav-inner is hidden
  // entirely unless nav.main-nav carries "mobile-open" - this is the
  // only thing that toggles it. Clicking an actual destination (a plain
  // [data-nav-link], or any link/button inside an open dropdown) closes
  // the mobile nav automatically, so navigating away doesn't leave it
  // sitting open over the new page.
  const navHamburger = document.getElementById("navHamburger");
  const navInner = document.getElementById("navInner");
  if (navHamburger && navInner) {
    navHamburger.addEventListener("click", (e) => {
      e.stopPropagation();
      const nav = navHamburger.closest("nav.main-nav");
      const isOpen = nav.classList.toggle("mobile-open");
      navHamburger.setAttribute("aria-expanded", String(isOpen));
      if (!isOpen) closeAllDropdowns();
    });
    navInner.addEventListener("click", (e) => {
      if (e.target.closest("[data-nav-link]") || e.target.closest(".nav-menu a") || e.target.closest(".nav-menu button:not(.settings-panel button)")) {
        navHamburger.closest("nav.main-nav").classList.remove("mobile-open");
        navHamburger.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.querySelectorAll("#languageMenu button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      languageMode = btn.dataset.lang;
      document.querySelectorAll("#languageMenu button").forEach((b) => b.classList.toggle("selected", b === btn));
      document.getElementById("langLabel").textContent = btn.textContent.trim();
      closeAllDropdowns();
      // Re-render whichever content page is currently showing, so a
      // language-mode change takes effect immediately rather than only
      // on the next navigation. Office was the only one wired here
      // originally; the Litanies and the Mass Ordinary are also
      // bilingual-capable and need the same treatment.
      if (!document.getElementById("page-office").hidden) renderOfficePage();
      if (!document.getElementById("page-litany").hidden) renderLitanyPage();
      if (!document.getElementById("page-penitential").hidden) renderPenitentialPage();
      if (!document.getElementById("page-litany-saints").hidden) renderLitanySaintsPage();
      if (!document.getElementById("page-mass").hidden) renderMassPage();
      if (!document.getElementById("page-confession").hidden) renderConfessionPage();
      if (!document.getElementById("page-communion-sick").hidden) renderCommunionSickPage();
      if (!document.getElementById("page-purification").hidden) renderPurificationPage();
      if (!document.getElementById("page-burial-child").hidden) renderBurialChildPage();
      if (!document.getElementById("page-confirmation").hidden) renderConfirmationPage();
      if (!document.getElementById("page-reception").hidden) renderReceptionPage();
      if (!document.getElementById("page-matrimony").hidden) renderMatrimonyPage();
      if (!document.getElementById("page-baptism").hidden) renderBaptismPage();
      if (!document.getElementById("page-unction").hidden) renderUnctionPage();
      if (!document.getElementById("page-burial").hidden) renderBurialPage();
      if (!document.getElementById("page-adult-baptism").hidden) renderAdultBaptismPage();
      if (!document.getElementById("page-family").hidden) renderFamilyPage();
      if (!document.getElementById("page-asperges").hidden) renderAspergesPage();
      if (!document.getElementById("page-foremass").hidden) renderForeMassPage();
      if (!document.getElementById("page-preparation").hidden) renderPreparationPage();
      if (!document.getElementById("page-thanksgiving").hidden) renderThanksgivingPage();
      if (!document.getElementById("page-benediction").hidden) renderBenedictionPage();
      if (!document.getElementById("page-vesper-dead").hidden) renderVesperDeadPage();
      if (!document.getElementById("page-matins-dead").hidden) renderMatinsDeadPage();
      if (!document.getElementById("page-lauds-dead").hidden) renderLaudsDeadPage();
      if (!document.getElementById("page-votive-bvm").hidden) renderVotiveBvmPage();
    });
  });

  document.querySelectorAll("#morningCanticleMenu button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      morningCanticleMode = btn.dataset.morningCanticleMode;
      document.querySelectorAll("#morningCanticleMenu button").forEach((b) => b.classList.toggle("selected", b === btn));
      document.getElementById("morningCanticleLabel").textContent = btn.textContent.trim();
      closeAllDropdowns();
      if (!document.getElementById("page-office").hidden) renderOfficePage();
    });
  });

  // Bidding Prayer show/hide (Mass Ordinary) - a single delegated
  // listener on the static massBody container, since the button and its
  // .optional-section live inside HTML that gets thrown away and
  // rebuilt on every render (renderStaticRitePage's innerHTML
  // assignment), unlike the settings-panel buttons above which are
  // static elements wired once.
  const massBodyEl = document.getElementById("massBody");
  if (massBodyEl) {
    massBodyEl.addEventListener("click", (e) => {
      const biddingBtn = e.target.closest("[data-bidding-toggle]");
      if (biddingBtn) {
        const section = biddingBtn.parentElement.nextElementSibling;
        if (!section || !section.classList.contains("optional-section")) return;
        section.hidden = !section.hidden;
        biddingBtn.textContent = section.hidden ? "Show the Bidding Prayer" : "Hide the Bidding Prayer";
        return;
      }
      // Generic collapsibleGroup show/hide (see officeBody's identical
      // listener below for the fuller comment) - Mass now has its own
      // use of this section type (the Pre-Communion Hymn), so this
      // listener needs the same handling, not just biddingPrayer's
      // bespoke one above.
      const collapsibleBtn = e.target.closest("[data-collapsible-toggle]");
      if (collapsibleBtn) {
        const section = collapsibleBtn.parentElement.nextElementSibling;
        if (!section || !section.classList.contains("optional-section")) return;
        section.hidden = !section.hidden;
        const showLabel = collapsibleBtn.dataset.showLabel || "Show";
        collapsibleBtn.textContent = section.hidden ? showLabel : showLabel.replace(/^Show\b/, "Hide");
        return;
      }
      const inlineBtn = e.target.closest("[data-inline-toggle]");
      if (inlineBtn) {
        const setter = INLINE_TOGGLE_SETTERS[inlineBtn.dataset.inlineToggle];
        if (setter) { setter(inlineBtn.dataset.value); renderMassPage(); }
      }
    });
  }

  // Generic `collapsibleGroup` show/hide (currently just Prime's
  // Pretiosa & Commemoration of the Faithful Departed) - same delegated-
  // listener pattern as the Bidding Prayer above, but on officeBody,
  // since that's the one shared container Mattins/Evensong/Prime/Terce/
  // Sext/None/Compline all render into (see currentHour/HOUR_TEMPLATES).
  // The button's own data-show-label carries its "Show ..." text, so a
  // future second collapsibleGroup elsewhere doesn't need a new listener
  // or hard-coded string here - only the "Hide"/"Show" verb is swapped.
  const officeBodyEl = document.getElementById("officeBody");
  if (officeBodyEl) {
    officeBodyEl.addEventListener("click", (e) => {
      const collapsibleBtn = e.target.closest("[data-collapsible-toggle]");
      if (collapsibleBtn) {
        const section = collapsibleBtn.parentElement.nextElementSibling;
        if (!section || !section.classList.contains("optional-section")) return;
        section.hidden = !section.hidden;
        const showLabel = collapsibleBtn.dataset.showLabel || "Show";
        collapsibleBtn.textContent = section.hidden ? showLabel : showLabel.replace(/^Show\b/, "Hide");
        return;
      }
      const inlineBtn = e.target.closest("[data-inline-toggle]");
      if (inlineBtn) {
        const setter = INLINE_TOGGLE_SETTERS[inlineBtn.dataset.inlineToggle];
        if (setter) { setter(inlineBtn.dataset.value); renderOfficePage(); }
      }
    });
  }

  // Great Litany's litanyForm toggle and Matrimony's matrimonyPsalm
  // toggle: unlike officeBody/massBody, these two static-rite containers
  // previously had no delegated click listener at all (nothing in either
  // page needed one until now).
  const litanyBodyEl = document.getElementById("litanyBody");
  if (litanyBodyEl) {
    litanyBodyEl.addEventListener("click", (e) => {
      const inlineBtn = e.target.closest("[data-inline-toggle]");
      if (!inlineBtn) return;
      const setter = INLINE_TOGGLE_SETTERS[inlineBtn.dataset.inlineToggle];
      if (setter) { setter(inlineBtn.dataset.value); renderLitanyPage(); }
    });
  }
  const matrimonyBodyEl = document.getElementById("matrimonyBody");
  if (matrimonyBodyEl) {
    matrimonyBodyEl.addEventListener("click", (e) => {
      const inlineBtn = e.target.closest("[data-inline-toggle]");
      if (!inlineBtn) return;
      const setter = INLINE_TOGGLE_SETTERS[inlineBtn.dataset.inlineToggle];
      if (setter) { setter(inlineBtn.dataset.value); renderMatrimonyPage(); }
    });
  }
  // Reception of Converts' receptionPsalm toggle (51/130) - same pattern
  // as litanyBody/matrimonyBody just above; this static-rite container
  // previously had no delegated click listener either.
  const receptionBodyEl = document.getElementById("receptionBody");
  if (receptionBodyEl) {
    receptionBodyEl.addEventListener("click", (e) => {
      const inlineBtn = e.target.closest("[data-inline-toggle]");
      if (!inlineBtn) return;
      const setter = INLINE_TOGGLE_SETTERS[inlineBtn.dataset.inlineToggle];
      if (setter) { setter(inlineBtn.dataset.value); renderReceptionPage(); }
    });
  }
  // Votive Masses' votiveThirdCollect toggle (Against the Persecutors of
  // the Church / For the Chief Bishop) - same pattern as litanyBody/
  // matrimonyBody/receptionBody above; this static-rite container
  // previously had no delegated click listener either (the whole page
  // was fully static until the bvmSeasonOption/votiveThirdCollect work).
  // Task #201: "Our Lady on Saturday" is now its own page (votiveBvmBody)
  // rather than one part of a single combined "votiveBody" - the
  // bvmSeasonOption/votiveThirdCollect toggles above are exclusive to
  // this one Votive Mass (Mass of the Angels/Holy Matrimony/Masses for
  // the Dead have no date-dependent or manually-toggled content), so
  // only this container needs the listener.
  const votiveBvmBodyEl = document.getElementById("votiveBvmBody");
  if (votiveBvmBodyEl) {
    votiveBvmBodyEl.addEventListener("click", (e) => {
      const inlineBtn = e.target.closest("[data-inline-toggle]");
      if (!inlineBtn) return;
      const setter = INLINE_TOGGLE_SETTERS[inlineBtn.dataset.inlineToggle];
      if (setter) { setter(inlineBtn.dataset.value); renderVotiveBvmPage(); }
    });
  }
  // Matins of the Dead's one-Nocturn-vs-three-Nocturns toggle (and, when
  // "one" is picked, its Nocturn I/II/III sub-choice) - same pattern as
  // litanyBody/matrimonyBody/receptionBody/votiveBody above; this
  // static-rite container previously had no delegated click listener.
  const matinsDeadBodyEl = document.getElementById("matinsDeadBody");
  if (matinsDeadBodyEl) {
    matinsDeadBodyEl.addEventListener("click", (e) => {
      const inlineBtn = e.target.closest("[data-inline-toggle]");
      if (!inlineBtn) return;
      const setter = INLINE_TOGGLE_SETTERS[inlineBtn.dataset.inlineToggle];
      if (setter) { setter(inlineBtn.dataset.value); renderMatinsDeadPage(); }
    });
  }
  // The Office-of-the-Dead Collect selector (task #167) also appears on
  // Vespers of the Dead and Lauds of the Dead - matinsDeadBody's own
  // toggle above shares the same officeDeadCollect setter, but each
  // static-rite container needs its own delegated listener to re-render
  // its own page.
  const vesperDeadBodyEl = document.getElementById("vesperDeadBody");
  if (vesperDeadBodyEl) {
    vesperDeadBodyEl.addEventListener("click", (e) => {
      const inlineBtn = e.target.closest("[data-inline-toggle]");
      if (!inlineBtn) return;
      const setter = INLINE_TOGGLE_SETTERS[inlineBtn.dataset.inlineToggle];
      if (setter) { setter(inlineBtn.dataset.value); renderVesperDeadPage(); }
    });
  }
  const laudsDeadBodyEl = document.getElementById("laudsDeadBody");
  if (laudsDeadBodyEl) {
    laudsDeadBodyEl.addEventListener("click", (e) => {
      const inlineBtn = e.target.closest("[data-inline-toggle]");
      if (!inlineBtn) return;
      const setter = INLINE_TOGGLE_SETTERS[inlineBtn.dataset.inlineToggle];
      if (setter) { setter(inlineBtn.dataset.value); renderLaudsDeadPage(); }
    });
  }
  // Preparation for Holy Communion's Prayer-of-St.-Ambrose portion-of-
  // day-vs-full toggle (task #168) - same pattern as every static-rite
  // container above; this one had no delegated click listener before.
  const preparationBodyEl = document.getElementById("preparationBody");
  if (preparationBodyEl) {
    preparationBodyEl.addEventListener("click", (e) => {
      const inlineBtn = e.target.closest("[data-inline-toggle]");
      if (!inlineBtn) return;
      const setter = INLINE_TOGGLE_SETTERS[inlineBtn.dataset.inlineToggle];
      if (setter) { setter(inlineBtn.dataset.value); renderPreparationPage(); }
    });
  }
  // Burial of the Dead's Lesson-selector (task #199, burialLessonChoice)
  // and "At the Grave" either/or sentence toggle (burialGraveSentenceChoice)
  // - same pattern as every static-rite container above; this one had no
  // delegated click listener before (the whole page was fully static
  // until this task).
  const burialBodyEl = document.getElementById("burialBody");
  if (burialBodyEl) {
    burialBodyEl.addEventListener("click", (e) => {
      const inlineBtn = e.target.closest("[data-inline-toggle]");
      if (!inlineBtn) return;
      const setter = INLINE_TOGGLE_SETTERS[inlineBtn.dataset.inlineToggle];
      if (setter) { setter(inlineBtn.dataset.value); renderBurialPage(); }
    });
  }

  // ---------------- Appearance (light/dark mode) ----------------
  // Same settings-toggle pattern as every other group above, but instead
  // of re-rendering a content page, this sets data-theme on <html> (see
  // css/style.css's html[data-theme="light"] block, which overrides the
  // dark-mode default token values). Persisted via localStorage so the
  // choice survives a reload; defaults to dark per the redesign spec.
  function applyThemeChoice(mode) {
    document.documentElement.setAttribute("data-theme", mode);
    document.querySelectorAll("#themeMenu button").forEach((b) => {
      b.classList.toggle("selected", b.dataset.themeChoice === mode);
    });
    const label = document.getElementById("themeLabel");
    if (label) label.textContent = mode === "light" ? "Light" : "Dark";
    try { localStorage.setItem("bcp-theme", mode); } catch (e) { /* ignore (private browsing, etc.) */ }
    // Re-derive --feast-title-color for the new theme without needing a
    // full page re-render - see updateFeastTitleColor() below (defined
    // later in this closure, but hoisted).
    updateFeastTitleColor(lastLiturgicalColorName);
  }
  document.querySelectorAll("#themeMenu button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      applyThemeChoice(btn.dataset.themeChoice);
      closeAllDropdowns();
    });
  });
  (function initTheme() {
    let saved = "dark";
    try { saved = localStorage.getItem("bcp-theme") || "dark"; } catch (e) { /* ignore */ }
    applyThemeChoice(saved);
  })();

  // ---------------- Text size (accessibility) ----------------
  // Same toggle pattern again: sets data-textsize on <html>, which
  // css/style.css scales the root font-size from (everything else in
  // that file is sized in rem, so this one attribute scales the whole
  // site's typography at once). Persisted via localStorage; defaults to
  // "normal".
  function applyTextSizeChoice(size) {
    document.documentElement.setAttribute("data-textsize", size);
    document.querySelectorAll("#textSizeMenu button").forEach((b) => {
      b.classList.toggle("selected", b.dataset.textsize === size);
    });
    const label = document.getElementById("textSizeLabel");
    if (label) label.textContent = size === "xlarge" ? "X-Large" : size === "large" ? "Large" : "Normal";
    try { localStorage.setItem("bcp-textsize", size); } catch (e) { /* ignore */ }
  }
  document.querySelectorAll("#textSizeMenu button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      applyTextSizeChoice(btn.dataset.textsize);
      closeAllDropdowns();
    });
  });
  (function initTextSize() {
    let saved = "normal";
    try { saved = localStorage.getItem("bcp-textsize") || "normal"; } catch (e) { /* ignore */ }
    applyTextSizeChoice(saved);
  })();

  // ---------------- Minister (Priest / Deacon / Layman) ----------------
  // Per Augustine's 8/22 answers: a Priest gets the Absolution after the
  // General Confession (Fore-Office, Prime, Compline) and says "The Lord
  // be with you"; a Deacon gets the substitute Collect (same as a
  // Layman) but still says "The Lord be with you"; a Layman always gets
  // the Collect and always says "O Lord, hear our prayer" instead.
  // Persisted via localStorage; defaults to "layman", matching the old
  // priestPresent setting's off-by-default stance.
  function applyMinisterChoice(rank) {
    ministerRank = rank;
    document.querySelectorAll("#ministerMenu button").forEach((b) => {
      b.classList.toggle("selected", b.dataset.minister === rank);
    });
    const label = document.getElementById("ministerLabel");
    if (label) label.textContent = rank === "priest" ? "Priest" : rank === "deacon" ? "Deacon" : "Layman";
    try { localStorage.setItem("bcp-minister", rank); } catch (e) { /* ignore */ }
  }
  document.querySelectorAll("#ministerMenu button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      applyMinisterChoice(btn.dataset.minister);
      closeAllDropdowns();
      // Every Hour (via the single page-office element) and the Office
      // of the Dead's Matins both read ministerRank.
      if (!document.getElementById("page-office").hidden) renderOfficePage();
      if (!document.getElementById("page-matins-dead").hidden) renderMatinsDeadPage();
      // George's 9/8 note, task #189: Preparation for Holy Communion's
      // "Prayer of St. Ambrose" cycle now also depends on ministerRank
      // (the inline `{{priest|default::priest}}` markers resolved in
      // escapeHtml) - previously this page had nothing rank-dependent on
      // it at all, so it was never added to this re-render list.
      const preparationPageEl = document.getElementById("page-preparation");
      if (preparationPageEl && !preparationPageEl.hidden) renderPreparationPage();
    });
  });
  (function initMinister() {
    let saved = "layman";
    try { saved = localStorage.getItem("bcp-minister") || "layman"; } catch (e) { /* ignore */ }
    applyMinisterChoice(saved);
  })();

  // ---------------- Region (America / British Commonwealth) ----------------
  // Per Augustine's 8/22 answer: America gets "O Lord, save the State"
  // in the Preces and the Prayer for the President after the Third
  // Collect; British Commonwealth gets "O Lord, save the King" and the
  // Prayer for the King and the Royal Family in the same two spots.
  // Persisted via localStorage; defaults to "america".
  function applyRegionChoice(r) {
    region = r;
    document.querySelectorAll("#regionMenu button").forEach((b) => {
      b.classList.toggle("selected", b.dataset.region === r);
    });
    const label = document.getElementById("regionLabel");
    if (label) label.textContent = r === "commonwealth" ? "British Commonwealth" : "America";
    try { localStorage.setItem("bcp-region", r); } catch (e) { /* ignore */ }
  }
  document.querySelectorAll("#regionMenu button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      applyRegionChoice(btn.dataset.region);
      closeAllDropdowns();
      if (!document.getElementById("page-office").hidden) renderOfficePage();
      // The Great Litany's own US/Commonwealth State petitions now read
      // this same setting too (8/25 - see ROADMAP.md), via regionOnly
      // flags on its own template sections rendered through the shared
      // renderOfficeSections filter.
      if (!document.getElementById("page-litany").hidden) renderLitanyPage();
    });
  });
  (function initRegion() {
    let saved = "america";
    try { saved = localStorage.getItem("bcp-region") || "america"; } catch (e) { /* ignore */ }
    applyRegionChoice(saved);
  })();

  // ---------------- Time Zone (Home page "Pray [Hour] now" link) ----------------
  // Per George's 8/29 note: the Home page's CTA should suggest whichever
  // Hour is actually being prayed right now, not always Evensong. This is
  // the only thing selectedTimezone is used for - it has no effect on
  // liturgical content, which date is "today," etc.
  //
  // The seven Hours, each with the local clock-hour range (24h, end
  // exclusive) during which the Home page CTA should suggest it, per
  // George's 8/29 note. Mapped onto this site's actual pages - "Mattins"
  // covers the Mattins & Lauds slot (Lauds has no separate page here),
  // and "Evensong" is this site's own name for Vespers. Defined (along
  // with getCurrentHourOfDay/updateHomeCta) before the timezone-select
  // wiring below, since that wiring calls updateHomeCta() immediately on
  // load and a `const` isn't usable before its own declaration runs,
  // unlike a hoisted function declaration.
  const HOUR_TIME_RANGES = [
    { start: 0, end: 6, key: "mattins", label: "Mattins" },
    { start: 6, end: 9, key: "prime", label: "Prime" },
    { start: 9, end: 12, key: "terce", label: "Terce" },
    { start: 12, end: 15, key: "sext", label: "Sext" },
    { start: 15, end: 18, key: "none", label: "None" },
    { start: 18, end: 21, key: "evensong", label: "Evensong" },
    { start: 21, end: 24, key: "compline", label: "Compline" },
  ];
  function getCurrentHourOfDay() {
    const tz = selectedTimezone === "auto"
      ? (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return null; } })()
      : selectedTimezone;
    if (tz) {
      try {
        const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).formatToParts(new Date());
        const hourPart = parts.find((p) => p.type === "hour");
        if (hourPart) {
          let h = parseInt(hourPart.value, 10);
          if (h === 24) h = 0; // some implementations format midnight as "24" under hour12:false
          if (!isNaN(h)) return h;
        }
      } catch (e) { /* fall through to local device time below */ }
    }
    return new Date().getHours();
  }
  function updateHomeCta() {
    const cta = document.getElementById("homeCta");
    if (!cta) return;
    const hour = getCurrentHourOfDay();
    const slot = HOUR_TIME_RANGES.find((r) => hour >= r.start && hour < r.end) || HOUR_TIME_RANGES[0];
    cta.href = "#office/" + slot.key;
    cta.textContent = "Pray " + slot.label + " now";
  }

  // A curated fallback list covers browsers without
  // Intl.supportedValuesOf (older browsers, and this project's own
  // jsdom test harness).
  const TIMEZONE_FALLBACK_LIST = [
    "America/New_York", "America/Chicago", "America/Denver", "America/Phoenix",
    "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu",
    "America/Toronto", "America/Vancouver", "America/Mexico_City",
    "Europe/London", "Europe/Dublin", "Europe/Paris", "Europe/Berlin",
    "Europe/Athens", "Europe/Moscow", "Africa/Cairo", "Africa/Johannesburg",
    "Asia/Jerusalem", "Asia/Dubai", "Asia/Kolkata", "Asia/Shanghai",
    "Asia/Tokyo", "Australia/Sydney", "Australia/Perth", "Pacific/Auckland",
    "UTC",
  ];
  function populateTimezoneSelect() {
    const sel = document.getElementById("timezoneSelect");
    if (!sel) return;
    let zones = [];
    try {
      if (typeof Intl.supportedValuesOf === "function") zones = Intl.supportedValuesOf("timeZone");
    } catch (e) { /* fall through to the curated list */ }
    if (!zones || !zones.length) zones = TIMEZONE_FALLBACK_LIST;
    // "UTC" itself isn't always part of Intl.supportedValuesOf('timeZone')'s
    // IANA-only list (varies by JS engine/ICU build), but it's too useful
    // a reference zone to leave out - make sure it's always offered.
    if (zones.indexOf("UTC") === -1) zones = ["UTC"].concat(zones);
    let deviceZone = "";
    try { deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { /* ignore */ }
    const autoLabel = deviceZone ? `Automatic (${deviceZone.replace(/_/g, " ")})` : "Automatic (this device)";
    const options = [`<option value="auto">${escapeHtml(autoLabel)}</option>`]
      .concat(zones.map((z) => `<option value="${escapeHtml(z)}">${escapeHtml(z.replace(/_/g, " "))}</option>`));
    sel.innerHTML = options.join("");
  }
  function applyTimezoneChoice(tz) {
    selectedTimezone = tz;
    const sel = document.getElementById("timezoneSelect");
    if (sel) sel.value = tz;
    const label = document.getElementById("timezoneLabel");
    if (label) label.textContent = tz === "auto" ? "Automatic" : tz.replace(/_/g, " ");
    try { localStorage.setItem("bcp-timezone", tz); } catch (e) { /* ignore */ }
    updateHomeCta();
  }
  populateTimezoneSelect();
  const timezoneSelectEl = document.getElementById("timezoneSelect");
  if (timezoneSelectEl) {
    timezoneSelectEl.addEventListener("change", (e) => {
      applyTimezoneChoice(e.target.value);
    });
  }
  (function initTimezone() {
    let saved = "auto";
    try { saved = localStorage.getItem("bcp-timezone") || "auto"; } catch (e) { /* ignore */ }
    applyTimezoneChoice(saved);
  })();

  // ---------------- Autoscroll ----------------
  // A slow, steady window.scrollBy() ticker - handy for praying an Hour
  // hands-free. Lives in the floating controls (index.html), not the
  // header nav. Two independent settings, both using the same toggle
  // pattern as everything above: on/off, and a speed preset applied to
  // the next tick (or immediately, if already running).
  //
  // Deliberately stops itself rather than fighting the person praying:
  // any manual wheel/touch scroll turns it off (so a hand on the
  // trackpad always wins), and navigating to a new page/Hour turns it
  // off too, since the page that was being scrolled through is about to
  // be replaced.
  const AUTOSCROLL_SPEEDS = { slow: 0.45, normal: 0.9, fast: 1.8 };
  let autoscrollEnabled = false;
  let autoscrollSpeed = "normal";
  let autoscrollTimer = null;
  // "Slow"'s 0.45px/tick is sub-pixel: window.scrollBy() rounds its
  // argument to a whole pixel, so a bare scrollBy(0, 0.45) rounds down
  // to 0 every single tick - the page never actually moves, which then
  // reads as "stuck at the bottom" and switches autoscroll off again on
  // its very first tick. Accumulating the fractional remainder across
  // ticks and only scrolling once it reaches a whole pixel fixes this
  // for every speed (Normal/Fast already cleared 1px most ticks anyway,
  // so this is a no-op change for them).
  let autoscrollRemainder = 0;

  function stopAutoscrollTimer() {
    if (autoscrollTimer) {
      clearInterval(autoscrollTimer);
      autoscrollTimer = null;
    }
    autoscrollRemainder = 0;
  }
  function startAutoscrollTimer() {
    stopAutoscrollTimer();
    autoscrollTimer = setInterval(() => {
      autoscrollRemainder += AUTOSCROLL_SPEEDS[autoscrollSpeed] || AUTOSCROLL_SPEEDS.normal;
      const px = Math.floor(autoscrollRemainder);
      if (px <= 0) return; // not enough accumulated yet - not the same as being stuck at the bottom
      autoscrollRemainder -= px;
      const before = window.scrollY;
      window.scrollBy(0, px);
      // Reached the bottom of the page (scrollY stopped advancing) -
      // switch itself off rather than spinning an interval forever.
      if (window.scrollY === before) setAutoscrollEnabled(false);
    }, 20);
    // Node's setInterval() returns a Timeout object with unref() (not a
    // plain number, unlike the browser); calling it tells Node this
    // timer alone shouldn't keep the process alive. Harmless/inert in a
    // real browser (a real browser's setInterval return value has no
    // unref method), but keeps a stray running interval from ever
    // hanging a script/test environment that loads this file under
    // Node/jsdom.
    if (autoscrollTimer && typeof autoscrollTimer.unref === "function") autoscrollTimer.unref();
  }
  function setAutoscrollEnabled(on) {
    autoscrollEnabled = on;
    if (on) startAutoscrollTimer(); else stopAutoscrollTimer();
    document.querySelectorAll("#autoscrollToggle button").forEach((b) => {
      b.classList.toggle("selected", (b.dataset.autoscroll === "on") === on);
    });
    const label = document.getElementById("autoscrollLabel");
    if (label) label.textContent = on ? "On" : "Off";
    const icon = document.getElementById("autoscrollIcon");
    if (icon) icon.textContent = on ? "⏸️" : "▶️"; // pause : play
    const btn = document.querySelector('[data-trigger="autoscroll"]');
    if (btn) {
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-label", on ? "Stop autoscroll" : "Autoscroll settings");
    }
  }
  document.querySelectorAll("#autoscrollToggle button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      setAutoscrollEnabled(btn.dataset.autoscroll === "on");
      closeAllDropdowns();
    });
  });
  document.querySelectorAll("#autoscrollSpeedMenu button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      autoscrollSpeed = btn.dataset.autoscrollSpeed;
      document.querySelectorAll("#autoscrollSpeedMenu button").forEach((b) => b.classList.toggle("selected", b === btn));
      const label = document.getElementById("autoscrollSpeedLabel");
      if (label) label.textContent = btn.textContent.trim();
      if (autoscrollEnabled) startAutoscrollTimer(); // restart at the new rate
      closeAllDropdowns();
    });
  });
  ["wheel", "touchstart"].forEach((evt) => {
    window.addEventListener(evt, () => {
      if (autoscrollEnabled) setAutoscrollEnabled(false);
    }, { passive: true });
  });
  window.addEventListener("hashchange", () => {
    if (autoscrollEnabled) setAutoscrollEnabled(false);
  });

  // ---------------- Scroll to top ----------------
  // 8/23 meeting note: "Add a scroll to top button to the interface."
  // A plain fab-btn with no dropdown panel, so none of the existing
  // [data-trigger]/closeAllDropdowns machinery needs to know about it.
  // Hidden until the reader has scrolled down a bit, so it doesn't sit
  // uselessly in the corner right at the top of the page.
  const scrollTopBtn = document.getElementById("scrollTopBtn");
  if (scrollTopBtn) {
    const SCROLL_TOP_SHOW_THRESHOLD = 400;
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    window.addEventListener("scroll", () => {
      scrollTopBtn.hidden = window.scrollY < SCROLL_TOP_SHOW_THRESHOLD;
    }, { passive: true });
  }

  // ---------------- Liturgical color ----------------
  // Converts a "#rrggbb" hex string to an "r, g, b" triplet string, for
  // --accent-rgb (see below) - lets CSS build rgba(var(--accent-rgb), a)
  // for the ambient glow and any other alpha-blended use of today's
  // liturgical color, since CSS custom properties can't do hex-to-rgba
  // math themselves.
  function hexToRgbTriplet(hex) {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }

  // Per Augustine's 8/29 answer (Q5 of the release-audit list): "The
  // Feast Days which have gold titles in the BCP should be white in the
  // dark mode of the website." White & Gold-ranked days print their
  // title in actual gold ink in the book; on this site, --accent (the
  // day's own liturgical color, used site-wide for buttons/nav/badges
  // too - see the --accent comment in style.css) carries that same gold
  // (#8a6d1d) as literal foreground text wherever a "title"-type element
  // sits directly on the page's own background with no contrasting fill
  // behind it (buttons/badges already pair --accent with --accent-text
  // and aren't affected). Against this site's dark paper that reads as
  // muddy/low-contrast, matching the underlying complaint even though
  // it's not literally invisible - and per Augustine, only the White &
  // Gold days need a dark-mode-specific swap to plain white; every other
  // liturgical color (and White & Gold in light mode, matching print)
  // is untouched. A separate --feast-title-color variable (rather than
  // just changing --accent itself) keeps this narrowly scoped to actual
  // title elements (.season-banner .season-label, .today-season) without
  // touching the toolbar/nav/badge uses of --accent, which Augustine
  // didn't flag and which already have adequate contrast.
  function updateFeastTitleColor(colorName) {
    if (colorName) lastLiturgicalColorName = colorName;
    const isDark = document.documentElement.getAttribute("data-theme") !== "light";
    const isGold = lastLiturgicalColorName === "White & Gold";
    const titleColor = (isDark && isGold)
      ? "#ffffff"
      : getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    document.documentElement.style.setProperty("--feast-title-color", titleColor || "");
  }

  function applyLiturgicalColor(resolved, dotElId) {
    // resolveFeastRankToday is defined later in this closure, but as a
    // hoisted function declaration it's already callable here.
    const feastInfo = resolveFeastRankToday(resolved);
    const key = resolveLiturgicalColor(resolved, feastInfo);
    const c = LITURGICAL_COLORS[key];
    document.documentElement.style.setProperty("--accent", c.hex);
    document.documentElement.style.setProperty("--accent-text", c.text);
    document.documentElement.style.setProperty("--accent-rgb", hexToRgbTriplet(c.hex));
    updateFeastTitleColor(c.name);
    const dot = document.getElementById(dotElId || "colorDot");
    if (dot) dot.style.background = c.hex;
    if (dot) dot.title = c.name + " (approximate - see ROADMAP.md)";
  }

  // ---------------- Date toolbar + calendar popover ----------------
  // Both the Office page and the (now date-aware) Mass page have their
  // own copy of this toolbar, sharing the single global `currentDate` -
  // navigating the date on one carries over to the other the next time
  // it's shown. `onDateChange` is called after currentDate changes so
  // each caller can re-render whichever date-aware page(s) are visible.
  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  function setupDateToolbar(ids, onDateChange) {
    let cursor = todayUtc(); // month currently shown in this toolbar's date-picker
    const toggle = document.getElementById(ids.calendarToggle);
    const popover = document.getElementById(ids.calendarPopover);
    // Merged calendar control (8/31, per George: the old standalone
    // quick-jump date box and this color-coded month-grid popover were two
    // separate controls doing overlapping jobs - "merge the two into one
    // function," keeping the grid's per-day feast-color highlighting AND
    // the native date input's ability to type a date or jump straight to
    // any month/year, rather than paging the grid one month at a time).
    // The date input now lives INSIDE the popover, as a fixed child that
    // survives grid re-renders - renderCalendarPopover() below writes only
    // into `grid` (a nested wrapper), never into `popover` itself, so this
    // input is never wiped out. Kept in sync with currentDate every time it
    // changes via any of this toolbar's OTHER controls too (see
    // syncQuickDateInput below), so it never shows a stale date.
    const quickDate = ids.calendarQuickDate ? document.getElementById(ids.calendarQuickDate) : null;
    const grid = ids.calendarGrid ? document.getElementById(ids.calendarGrid) : popover;

    // Plain MM/DD/YYYY formatting/parsing for the quick-date text field -
    // deliberately not <input type="date"> (see the 8/31 CSS comment on
    // .cal-header above for why: that native control's own calendar-icon
    // flyout can't be reliably suppressed across browsers).
    function formatMdy(d) {
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      return `${mm}/${dd}/${d.getUTCFullYear()}`;
    }
    function parseMdy(str) {
      const m = /^(\d{1,2})\/(\d{1,2})\/(\d{3,4})$/.exec((str || "").trim());
      if (!m) return null;
      const mm = parseInt(m[1], 10), dd = parseInt(m[2], 10), yyyy = parseInt(m[3], 10);
      if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yyyy < 100) return null;
      return { y: yyyy, m: mm, d: dd };
    }
    // Partial parse used while still typing (month/year present, day may
    // not be yet) - just enough to re-center the grid live without
    // requiring a complete, valid date.
    function parseMdyPartial(str) {
      const m = /^(\d{1,2})\/\d{0,2}\/?(\d{3,4})$/.exec((str || "").trim());
      if (!m) return null;
      const mm = parseInt(m[1], 10), yyyy = parseInt(m[2], 10);
      if (mm < 1 || mm > 12 || yyyy < 100) return null;
      return { y: yyyy, m: mm };
    }

    function syncQuickDateInput() {
      if (quickDate) quickDate.value = formatMdy(currentDate);
    }
    syncQuickDateInput();
    if (quickDate) {
      function commitQuickDate() {
        const parsed = parseMdy(quickDate.value);
        if (!parsed) { syncQuickDateInput(); return; } // invalid/incomplete - revert to last-known-good
        currentDate = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
        popover.hidden = true;
        onDateChange();
      }
      quickDate.addEventListener("change", commitQuickDate);
      quickDate.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); commitQuickDate(); quickDate.blur(); }
      });
      // Live re-center of the grid as soon as month+year are legible,
      // even before a day digit is typed, so the popover's color-coded
      // day view stays useful mid-edit rather than only updating once a
      // complete date commits.
      quickDate.addEventListener("input", () => {
        const partial = parseMdyPartial(quickDate.value);
        if (!partial) return;
        const wantCursor = new Date(Date.UTC(partial.y, partial.m - 1, 1));
        if (wantCursor.getTime() !== cursor.getTime()) {
          cursor = wantCursor;
          renderCalendarPopover();
        }
      });
    }

    function renderCalendarPopover() {
      const year = cursor.getUTCFullYear();
      const month = cursor.getUTCMonth();
      const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
      const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

      // Month/year dropdowns replace one-month-at-a-time arrow paging
      // (8/31, per George) - a fixed year range centered on today's real
      // year, not the cursor's, so the option list doesn't shift under
      // the user as they navigate.
      const thisYear = todayUtc().getUTCFullYear();
      const yearLo = thisYear - 100, yearHi = thisYear + 100;
      let monthOptions = MONTH_NAMES.map((name, i) =>
        `<option value="${i}"${i === month ? " selected" : ""}>${name}</option>`
      ).join("");
      let yearOptions = "";
      for (let y = yearLo; y <= yearHi; y++) {
        yearOptions += `<option value="${y}"${y === year ? " selected" : ""}>${y}</option>`;
      }
      let html = `<div class="cal-header">
        <select class="cal-month-select" aria-label="Select month">${monthOptions}</select>
        <select class="cal-year-select" aria-label="Select year">${yearOptions}</select>
      </div>`;
      html += `<div class="cal-grid">`;
      ["S","M","T","W","T","F","S"].forEach((d) => { html += `<div class="cal-dow">${d}</div>`; });
      for (let i = 0; i < firstWeekday; i++) html += `<div class="cal-day empty"></div>`;
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(Date.UTC(year, month, day));
        const isToday = daysBetween(d, todayUtc()) === 0;
        const isSelected = daysBetween(d, currentDate) === 0;
        // Only mark red-letter (principal) feasts, not every minor memorial -
        // the Kalendar has one on most days, which would make nearly the
        // whole month look "marked" and defeat the point of highlighting.
        const feast = (kalendarData[`${month + 1}-${day}`] || []).some((e) => e.name && e.redLetter);
        const classes = ["cal-day"];
        if (isToday) classes.push("today");
        if (isSelected) classes.push("selected");
        if (feast) classes.push("feast");
        // Pending-corrections fix (10/3, task #217, item #14): "every
        // individual day-square in that popover should be coloured with
        // its own particular day's liturgical colour." This popover's
        // `.cal-day` squares had no liturgical-color computation at all -
        // only the plain-text "feast" flag above (any red-letter day,
        // regardless of its actual color) - unlike the full #calendar
        // page's own `.cal-page-day` grid (`renderCalendarPage`), which
        // already resolves and shows each day's real color. Reusing that
        // same resolveLiturgicalDay/resolveFeastRankToday/
        // resolveLiturgicalColor pipeline here too, so this popover
        // agrees with the full calendar page for the same date.
        const resolved = resolveLiturgicalDay(d, lectionaryData, kalendarData);
        const feastInfo = resolveFeastRankToday(resolved);
        const colorKey = resolveLiturgicalColor(resolved, feastInfo);
        const color = (typeof LITURGICAL_COLORS !== "undefined" ? LITURGICAL_COLORS : {})[colorKey];
        // George's consolidated 10/7 note, item 10: "the calendar button is
        // still making most of the days the same colour of the day, as in
        // the last picture sent." Traced to the CSS, not this color
        // computation: resolveLiturgicalColor already returns a distinct,
        // correct color per day here (confirmed live across a real month -
        // green/white/red all present as expected), but .cal-day only ever
        // showed it as a 3px border-top hairline (task #217, item #14's own
        // deliberate choice, to keep the "feast" red-text styling legible
        // on top of it) - too subtle to read as "this day is colored" at a
        // glance, so the whole grid still looked like one uniform color.
        // Adding a low-alpha background WASH of the same color (via this
        // --day-color-rgb triplet, same hexToRgbTriplet pattern already
        // used for --accent-rgb) makes each day's color immediately
        // visible while staying light enough for the feast red text/border
        // to still read clearly on top - see the matching CSS change.
        const style = color ? ` style="--day-color:${color.hex};--day-color-rgb:${hexToRgbTriplet(color.hex)}"` : "";
        html += `<button class="${classes.join(" ")}" data-cal-day="${day}"${style}>${day}</button>`;
      }
      html += `</div>`;
      grid.innerHTML = html;

      const monthSel = grid.querySelector(".cal-month-select");
      const yearSel = grid.querySelector(".cal-year-select");
      if (monthSel) monthSel.addEventListener("change", () => {
        cursor = new Date(Date.UTC(cursor.getUTCFullYear(), parseInt(monthSel.value, 10), 1));
        renderCalendarPopover();
      });
      if (yearSel) yearSel.addEventListener("change", () => {
        cursor = new Date(Date.UTC(parseInt(yearSel.value, 10), cursor.getUTCMonth(), 1));
        renderCalendarPopover();
      });
      grid.querySelectorAll("[data-cal-day]").forEach((btn) => {
        btn.addEventListener("click", () => {
          currentDate = new Date(Date.UTC(year, month, parseInt(btn.dataset.calDay, 10)));
          popover.hidden = true;
          syncQuickDateInput();
          onDateChange();
        });
      });
    }

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = popover.hidden;
      popover.hidden = !willOpen;
      if (willOpen) {
        cursor = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1));
        syncQuickDateInput();
        renderCalendarPopover();
      }
    });
    popover.addEventListener("click", (e) => e.stopPropagation());
    document.addEventListener("click", () => { popover.hidden = true; });

    document.getElementById(ids.prevDay).addEventListener("click", () => { shiftDay(-1); syncQuickDateInput(); onDateChange(); });
    document.getElementById(ids.nextDay).addEventListener("click", () => { shiftDay(1); syncQuickDateInput(); onDateChange(); });
    document.getElementById(ids.todayBtn).addEventListener("click", () => { currentDate = todayUtc(); syncQuickDateInput(); onDateChange(); });
  }

  // Re-renders whichever date-aware page(s) happen to be visible right
  // now - mirroring the "re-render whichever page is currently showing"
  // pattern already used for language-mode switching above.
  function refreshDateAwarePages() {
    if (!document.getElementById("page-office").hidden) renderOfficePage();
    if (!document.getElementById("page-mass").hidden) renderMassPage();
    // George's 9/7 note, task #176 (found while verifying the antiphon-
    // doubling fix): Preparation/Thanksgiving/Benediction became
    // date-aware at task #175 (for the Eastertide Alleluia marker), and
    // Vesper/Matins/Lauds of the Dead became date-aware at task #176
    // (for the same "not doubled on Ferias/Semidoubles" rank check) -
    // but this function was never taught about any of them, so changing
    // the date via the calendar/prev-day/next-day/Today controls while
    // already on one of these pages silently kept showing the stale
    // date's content until the next full navigation. Votive Masses
    // (task #107, the original date-aware static rite) had the exact
    // same gap. Reusing the same "re-render whichever page is currently
    // showing" list already maintained for language-mode switching
    // above, rather than inventing a second list to keep in sync.
    if (!document.getElementById("page-preparation").hidden) renderPreparationPage();
    if (!document.getElementById("page-thanksgiving").hidden) renderThanksgivingPage();
    if (!document.getElementById("page-benediction").hidden) renderBenedictionPage();
    if (!document.getElementById("page-vesper-dead").hidden) renderVesperDeadPage();
    if (!document.getElementById("page-matins-dead").hidden) renderMatinsDeadPage();
    if (!document.getElementById("page-lauds-dead").hidden) renderLaudsDeadPage();
    if (!document.getElementById("page-votive-bvm").hidden) renderVotiveBvmPage();
  }

  // ---------------- Office rendering ----------------
  // George's 9/2 note (task #136): "Subtitles on Office Hours should
  // only be used for commemorations" - e.g. "St. Gorazde of Prague,
  // Bishop & Martyr, Double" was printing twice: once as the page's main
  // title (via computeDayTitle/seasonLabel) and again, identically, as
  // this subtitle line, whenever that one Kalendar entry WAS the winning
  // Feast and there was nothing else to commemorate alongside it. The
  // title and this subtitle used to be computed completely independently
  // - this one just dumped every entry in `resolved.kalendar` with no
  // awareness of which one (if any) the page's title already displayed.
  // Now takes the same `feastInfo` computeDayTitle itself derives (via
  // resolveFeastRankToday) and skips whichever entry is that winning
  // Feast - every other entry (a true commemoration - a Memorial
  // alongside a winning Double, or any entry when the season itself
  // wins the day and nothing here is "the title") still prints exactly
  // as before.
  // George's 9/7 note, task #181: "[On a Lent Sunday] a 1st or 2nd
  // Double is transferred to the next available day, not mentioned or
  // commemorated on the Sunday." Lent's four Sundays were already
  // correctly classified "first-class-sunday" in ranking.js (a genuine
  // hard block - decideCollectWinner already refuses to let ANY Feast
  // win there), and `resolveTransferCluster`/`findTransferredFeast`
  // (task #92/#109-era machinery) already correctly relocates a
  // colliding 1st/2nd Double to the next unhindered day. What this line
  // itself never checked is whether an entry it's about to print is
  // exactly one of those transfer-bound entries - `entries` came
  // straight from `resolved.kalendar` with no cross-reference to the
  // transfer decision at all, so a Double being transferred away still
  // showed up here as if it were an ordinary (untransferred)
  // commemoration, contradicting "not mentioned... on the Sunday."
  // `window.Ranking.requiresTransfer` (the exact same test
  // `resolveTransferCluster` itself uses to decide what needs moving)
  // is reused here per-entry, now that `resolved` (not just its
  // `kalendar` array) is passed in - scoped deliberately narrow to
  // ONLY the transfer-bound case, not the broader `commemorateOther`
  // flag decideCollectWinner also returns, since that flag is false in
  // several other, unrelated, already-correct situations (e.g. a
  // Vigil's own tier-0 self-entry) that were never part of this
  // complaint and shouldn't change here.
  function renderKalendarLine(resolved, feastInfo) {
    const entries = (resolved && resolved.kalendar) || [];
    if (!entries.length) return "";
    const winningName = feastInfo && feastInfo.winner === "feast" ? feastInfo.name : null;
    // Task #216, item #13: when the season wins and a Vigil entry is
    // present, computeDayTitle now shows that Vigil as the page's title
    // (see findVigilKalendarEntry) - skip it here too, the same way a
    // winning Feast is already skipped just below, so it isn't printed
    // twice (once as the title, again as its own commemoration line).
    const vigilEntry = winningName ? null : findVigilKalendarEntry(resolved);
    return entries.map((e) => {
      if (e.name === null) return e.note || "";
      if (winningName && e.name === winningName) return "";
      if (vigilEntry && e === vigilEntry) return "";
      if (e.rank && window.Ranking && resolved) {
        const tier = window.Ranking.RANK_TIER[e.rank] || 0;
        const decision = window.Ranking.decideCollectWinner(resolved, e.rank);
        if (window.Ranking.requiresTransfer(decision.classification, tier)) return "";
      }
      let s = escapeHtml(e.name);
      if (e.rank) s += `, ${escapeHtml(e.rank)}`;
      if (e.note) s += ` ${escapeHtml(e.note)}`;
      return s;
    }).filter(Boolean).join(" &nbsp;|&nbsp; ");
  }

  // The Lectionary's per-day entry can carry mattins / evensongI /
  // evensongII slots. evensongI is First Evensong of a Sunday/feast
  // (properly sung the evening before, but filed under that Sunday's
  // row in the source table) - on the Saturday itself, that's the only
  // evensong slot present. evensongII is Second Evensong, said on the
  // evening of the day itself. For "today's Evensong" we want whichever
  // one actually belongs to this evening: evensongII if this day has
  // its own, otherwise evensongI (the Saturday-anticipation case).
  function pickLectionarySlot(resolved) {
    // LectionaryFestivals.tex gives ~38 major fixed Feasts their own
    // dedicated Psalms/Lessons (I Evensong/Mattins/II Evensong) -
    // completely separate from, and until this fix never consulted
    // alongside, the Temporale's own weekly cycle (see ROADMAP.md and
    // Questions-for-Augustine.md - surfaced by a red-team audit). Only
    // used when the Feast actually WINS the day under Ranking.tex (the
    // same decideCollectWinner/resolveFeastRankToday result already
    // driving the Collect/color/canticle logic elsewhere) - a Feast
    // that is merely commemorated or hard-blocked keeps the season's own
    // Psalms/Lessons, matching how a commemoration never touches the
    // Office's own Psalms/Lessons in the classical Western Rite (only
    // the Collect/Secret/Postcommunion travel with a commemoration -
    // see renderCommemoratedOration above). A transferred feast (only
    // St. Joseph/St. Benedict/the Annunciation ever collide with a
    // hard-blocking day on this site's Kalendar) carries its own
    // Psalms/Lessons to its destination date too, looked up by its
    // original fixed date.
    const feastInfo = resolveFeastRankToday(resolved);
    if (feastInfo.winner === "feast") {
      let festivalKey = resolved.kalendarKey;
      if (feastInfo.transferred) {
        const transferred = findTransferredFeast(resolved.date);
        festivalKey = transferred ? `${transferred.fromDate.getUTCMonth() + 1}-${transferred.fromDate.getUTCDate()}` : null;
      }
      const festival = isChristTheKingToday(resolved) ? CHRIST_THE_KING_LECTIONARY : (festivalKey && lectionaryFestivalsData[festivalKey]);
      if (festival) {
        if (currentHour === "mattins") return festival.mattins || null;
        // George's 9/7 note: "It's pulling II Evensong Psalms and Lessons
        // for I Evensong this evening." Root cause: when
        // resolveEveningDisplacement (Table 2's "tomorrow wins" codes
        // 1/3/5 - see renderOfficePage) fires, the WHOLE render pass swaps
        // in tomorrow's own resolved day as `resolved` here, so this
        // function's `resolved`/`festival` is tomorrow's feast, not
        // today's - and tonight is by definition the EVE of that feast,
        // i.e. its First Evensong, never its Second (which belongs to
        // tomorrow evening instead). The old `evensongII || evensongI`
        // fallback order was only ever correct for the *undisplaced* case
        // (this evening genuinely is the resolved day's own evening - see
        // the comment above this function for the ordinary Saturday-
        // anticipation case, which relies on evensongI being stored
        // directly on Saturday's own dataset row instead). `eveningDisplacement`
        // (module-level, set once per render in renderOfficePage, already
        // trusted the same way by collectOfDay above) is exactly the flag
        // that tells us which situation we're in.
        if (currentHour === "evensong") return eveningDisplacement ? (festival.evensongI || festival.evensongII || null) : (festival.evensongII || festival.evensongI || null);
      }
    }
    // George's 10/8 note: "it had the Evensong lessons for tonight... I
    // think it's because it is correctly identifying last evening as I
    // Evensong of [a Red Letter feast]. However, when the Festival does
    // not have proper Psalms and Lessons..., the Psalms and Lessons are
    // ferial." Reached here precisely when `feastInfo.winner==="feast"`
    // (today's rendering has been displaced to a winning feast's own
    // day per resolveEveningDisplacement) but that feast has no
    // `lectionaryFestivalsData` entry of its own (the `festival` branch
    // above already returns early whenever one exists) - `resolved` at
    // this point IS the displacing feast's own full resolved day
    // (renderResolved in renderOfficePage), so its `.lectionary` is that
    // feast's own CIVIL date's row in the continuous ferial course-
    // reading table - one calendar day further along than tonight's own
    // row, which is the actual bug (Deuteronomy 31:30 instead of the
    // correct ~29-30 continuation). `eveningDisplacement.todayResolved`
    // (added alongside `tomorrowResolved` above) is the true civil
    // tonight's own undisplaced resolved day, whose `.lectionary` is the
    // right ferial row to fall back to instead.
    const usingDisplacedFerial = currentHour === "evensong" && eveningDisplacement && eveningDisplacement.todayResolved;
    const entry = usingDisplacedFerial ? eveningDisplacement.todayResolved.lectionary : resolved.lectionary;
    if (!entry) return null;
    if (currentHour === "mattins") return entry.mattins || null;
    if (currentHour === "evensong") {
      // Under this specific displaced-ferial fallback, `entry` is
      // already tonight's own civil-date row, not tomorrow's - a plain
      // feria has no First/Second Evensong distinction of its own (that
      // concept only exists for Sundays/feasts), so there's no
      // evensongI/II choice left to make here, just whichever of the
      // two the ferial data happens to carry.
      if (usingDisplacedFerial) return entry.evensongII || entry.evensongI || null;
      // Same displacement fix as the festival branch above - when tonight
      // is anticipating tomorrow's Office (e.g. a plain feria evening
      // before a Sunday whose own row happens to carry both evensongI and
      // evensongII), First Evensong is what's actually being prayed
      // tonight, not Second.
      return eveningDisplacement ? (entry.evensongI || entry.evensongII || null) : (entry.evensongII || entry.evensongI || null);
    }
    return null;
  }

  // Task #170: Augustine's 9/5 answer - "the Proper Psalms for Sundays
  // Second Class or lower are optional," the 30-Day (Monthly) Psalter
  // being the default. Scoped narrowly to a Sunday's OWN Temporale
  // Psalms (the plain `resolved.lectionary` branch above, reached only
  // when no Feast wins the day) - not to a winning FEAST's own
  // dedicated Psalms (pickLectionarySlot's earlier lectionary-
  // festivals.json branch, reached when resolveFeastRankToday's
  // winner is "feast"), which are a different kind of Proper this
  // toggle was never asked to touch: on a day a Feast actually wins,
  // it's the Feast's Office being prayed, not the Sunday's own. First
  // Class Sundays (Advent I, the Lent Sundays, Passion/Palm Sunday,
  // Easter Day/I, Whitsunday - see ranking.js's FIRST_CLASS_SUNDAY_PERIODS)
  // keep their own Sunday Propers mandatory, matching Ranking.tex's
  // three-tier scheme ("First Class Sundays give place to no Feast");
  // this toggle has no effect on them.
  function isSundayPsalmsOptional(resolved) {
    if (!window.Ranking || typeof window.Ranking.classifySeasonDay !== "function") return false;
    const feastInfo = resolveFeastRankToday(resolved);
    if (feastInfo.winner === "feast") return false;
    const cls = window.Ranking.classifySeasonDay(resolved);
    return cls === "second-class-sunday" || cls === "other-sunday";
  }

  // Shared by both the "psalms" placeholder and
  // renderDeferredLastPsalmAntiphon below, so the "which Psalms are
  // actually showing today" answer never drifts between the two -
  // the deferred antiphon's own "last Psalm" lookup must always agree
  // with whichever Psalm list (30-Day or Proper) is really on screen.
  function resolveEffectiveProperPsalms(resolved, lectionarySlot) {
    const rawProperPsalms = lectionarySlot && lectionarySlot.psalms;
    if (!rawProperPsalms) return null;
    if (isSundayPsalmsOptional(resolved) && sundayPsalterChoice !== "proper") return null;
    return rawProperPsalms;
  }

  // ---- Feast Day transfer (Ranking.tex: "A I or II Double Feast Day
  // falling on a Sunday of the First Class is transferred to the first
  // unhindered day") ----
  //
  // This only ever needs to look at fixed Sanctorale dates, since only
  // those have a stable "home" date to search backward/forward from; a
  // moveable Temporale entry never has its own Collect to transfer. It
  // walks back up to 20 days from `date` looking for a fixed I/II Double
  // that was hard-blocked (Ranking.isHardBlock) on its own calendar date
  // this year, then walks forward from that blocked date to find the
  // first day the same feast would actually win outright - skipping any
  // day that's already spoken for by an equal-or-higher-ranked fixed
  // feast of its own (a genuine collision between two transferred/
  // competing feasts on the same destination day isn't resolved here -
  // see ROADMAP.md). If that search lands on `date`, the feast is
  // transferred here.
  //
  // Verified with a full scan of 2000-2100 on this site's Kalendar
  // (8/24 - see ROADMAP.md's Calendar/ranking section): 328 total
  // requiresTransfer collisions in that range, needing a forward search
  // of at most 15 days. The 10-day backward-search cap this function
  // used to have was set after only checking the "first-class-sunday"/
  // "greater-feria" collisions (St. Joseph, St. Benedict, the
  // Annunciation, all in the Lent/Passiontide band, all resolving within
  // 1-3 days) - it missed an entire other category this same rule also
  // covers: fixed Doubles landing in Holy Week's or Easter
  // Monday/Tuesday's "always-season" block (St. Mark, St. George, Sts.
  // Philip & James, the Invention of the Holy Cross, St. Tikhon of
  // Moscow), where the blocked feast can sit up to 15 days before the
  // first day after Easter Week/Low Sunday that's actually free. Widened
  // to 20 to comfortably cover the observed maximum with margin.
  function addDaysUtc(date, n) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + n));
  }
  function isSameUtcDate(a, b) {
    return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
  }
  // 8/28 fix: transfer-destination collisions between two-or-more blocked
  // feasts. Previously `findFeastTransferDestination` only checked raw
  // Kalendar entries when deciding whether a candidate day was "occupied,"
  // with no knowledge that a DIFFERENT blocked feast's own forward search
  // might independently land on that same day. `findTransferredFeast`
  // then returned on the first (closest-origin) match it found scanning
  // backward, so whichever blocked feast happened to have the nearest
  // origin silently claimed the shared day and every other colliding
  // feast vanished outright - no display, no commemoration, nothing. A
  // full 2000-2100 scan found this is routine, not rare: in any year
  // needing an 11+ day gap, St. George (23 April), St. Mark (25 April),
  // Sts. Philip & James (1 May), and the Invention of the Holy Cross
  // (3 May) frequently all collide on the SAME first-free day at once
  // (confirmed in 2000, 2008, 2019, and 2030) - a four-way collision, not
  // just the two-way case this comment previously described. See
  // ROADMAP.md for the full investigation.
  //
  // Fixed by resolving every blocked feast for a given calendar year
  // together, in one pass (`resolveTransferCluster`), rather than one at
  // a time per rendered date: each candidate's forward search now also
  // treats a day already claimed by an EARLIER-RESOLVED, higher-priority
  // feast as occupied, so a lower-priority feast simply keeps searching
  // forward for its own free day - the same mechanism this code already
  // used for raw Kalendar occupancy, just extended to cover other
  // pending transfers too.
  //
  // Priority order for who gets first claim on a shared day: rank
  // (RANK_TIER) first, then earlier natural/origin date as the tie-break
  // among feasts of equal rank. This is a deliberate, provisional
  // interpretive call, not a transcribed rubric - Ranking.tex has no
  // stated rule for this exact scenario (two blocked feasts colliding on
  // the same transfer destination), and the previous "closest origin
  // wins" behavior wasn't a considered rule either, just an accident of
  // loop order. Rank-first was chosen because it's the same precedence
  // this entire site already applies to every other feast-vs-feast
  // decision (RANK_TIER is used throughout ranking.js and app.js) rather
  // than inventing a new rule just for this case - but like the Sunday-
  // abstinence interpretation (Q7, Questions-for-Augustine.md), this is
  // flagged here as worth Augustine confirming before being treated as
  // settled, since it can change which saint's feast is actually
  // displayed on a given real date (e.g. under this rule, St. George -
  // a 1st Double - now wins the shared day in 2000/2008/2019/2030
  // instead of the Invention of the Holy Cross, which had been winning
  // by accident).
  function findFeastTransferDestination(origDate, origResolved, entry, claimedDates) {
    const tier = window.Ranking.RANK_TIER[entry.rank] || 0;
    for (let fwd = 1; fwd <= 20; fwd++) {
      const candidate = addDaysUtc(origDate, fwd);
      const iso = candidate.toISOString().slice(0, 10);
      if (claimedDates && claimedDates.has(iso)) continue; // already spoken for by a higher-priority colliding feast
      const candResolved = resolveLiturgicalDay(candidate, lectionaryData, kalendarData);
      const occupied = (candResolved.kalendar || []).some(
        (e) => (window.Ranking.RANK_TIER[e.rank] || 0) >= tier && collectsSanctoraleData[candResolved.kalendarKey]
      );
      if (occupied) continue;
      const decision = window.Ranking.decideCollectWinner(candResolved, entry.rank);
      if (decision.winner === "feast") return { date: candidate, resolved: candResolved };
    }
    return null;
  }
  const transferClusterCache = new Map(); // calendar year -> resolved cluster array
  function resolveTransferCluster(year) {
    if (transferClusterCache.has(year)) return transferClusterCache.get(year);
    if (!window.Ranking || !window.Ranking.requiresTransfer) {
      transferClusterCache.set(year, []);
      return [];
    }
    // Scan a full calendar year of origins, plus a one-month lookback
    // into December of the prior year as a safety margin (no known real
    // collision spans a year boundary - every documented case sits in
    // the Lent-to-Trinity band - but a late-December origin could in
    // principle push a 20-day forward search into January, so this
    // guards against that rather than assuming it can't happen).
    const candidates = [];
    const start = addDaysUtc(new Date(Date.UTC(year, 0, 1)), -31);
    for (let i = 0; i < 366 + 31; i++) {
      const origDate = addDaysUtc(start, i);
      const origResolved = resolveLiturgicalDay(origDate, lectionaryData, kalendarData);
      for (const entry of origResolved.kalendar || []) {
        const collect = collectsSanctoraleData[origResolved.kalendarKey];
        if (!collect) continue; // nothing to transfer without a Collect to carry along
        const tier = window.Ranking.RANK_TIER[entry.rank] || 0;
        if (tier < 6) continue; // only I/II Doubles transfer, per Ranking.tex
        const origDecision = window.Ranking.decideCollectWinner(origResolved, entry.rank);
        if (!window.Ranking.requiresTransfer(origDecision.classification, tier)) continue;
        candidates.push({ name: entry.name, rank: entry.rank, tier, origDate, origResolved, collect });
      }
    }
    // Resolve in priority order (see comment above): rank descending,
    // then origin date ascending as the tie-break for equal ranks.
    candidates.sort((a, b) => b.tier - a.tier || a.origDate - b.origDate);
    const claimedDates = new Set();
    const results = [];
    for (const c of candidates) {
      const dest = findFeastTransferDestination(c.origDate, c.origResolved, { rank: c.rank }, claimedDates);
      if (dest) {
        claimedDates.add(dest.date.toISOString().slice(0, 10));
        results.push({ ...c, destDate: dest.date, destResolved: dest.resolved });
      }
      // If dest is null even after skipping claimed dates, this feast's
      // transfer genuinely has nowhere to land within 20 days - matches
      // the prior code's existing behavior of returning null in that case.
    }
    transferClusterCache.set(year, results);
    return results;
  }
  function findTransferredFeast(date) {
    if (!window.Ranking || !window.Ranking.requiresTransfer) return null;
    const cluster = resolveTransferCluster(date.getUTCFullYear());
    const match = cluster.find((c) => isSameUtcDate(c.destDate, date));
    if (!match) return null;
    return {
      name: match.name,
      rank: match.rank,
      text: match.collect.text,
      secondaryText: match.collect.secondaryText,
      fromDate: match.origDate,
      fromLabel: match.origResolved.seasonLabel,
    };
  }

  // ---- Epiphany VII/VIII overflow (PropSeas.tex, printed under
  // Epiphany VI's own entry): "If there be more than six Sundays of
  // Epiphany before Septuagesima, then the upcoming unused Sundays after
  // Trinity are used, the Introit, Gradual, Alleluia, Offertory, and
  // Communion being of Epiphany VI." A late-Easter year that needs a
  // 7th/8th Epiphany Sunday always has a correspondingly short
  // Trinitytide that same year (both spans are pinned to the same
  // Easter date), leaving some of Trinity XXIV's tail end unused - the
  // "upcoming" ones this rubric borrows, taken in order starting right
  // after however many actually got used that year. Only the parts the
  // rubric explicitly keeps put (Introit/Gradual/Alleluia/Tract/
  // Offertory/Communion) come from Epiphany VI; everything the rubric
  // doesn't name - Collect, Epistle, Gospel, Secret, Postcommunion, the
  // didactic parts that would otherwise be needlessly repeated two more
  // weeks running - comes from the borrowed Trinity Sunday instead,
  // matching how this same rubric works in the wider Sarum/Roman
  // tradition it's drawn from. Verified across 2000-2100 on this site's
  // Orthodox-Paschal computus: 27 years actually need this (about 1 in
  // 4), always borrowing from Trinity XXII-XXIV, comfortably inside the
  // 24 Trinity Sundays this site's data has - the fallback
  // `null` below (out-of-range or data missing) is defensive, not
  // something this site's real calendar range ever hits.
  function resolveEpiphanyOverflow(periodKey, date) {
    if (periodKey !== "Epiphany VII" && periodKey !== "Epiphany VIII") return null;
    const epiphanyVI = collectsTemporaleData["Epiphany VI"];
    if (!epiphanyVI) return null;
    const anchors = getLiturgicalYearAnchors(date);
    const usedCount = anchors.trinity.filter((d) => daysBetween(d, anchors.nextAdventSunday) > 0).length;
    const borrowIndex = periodKey === "Epiphany VII" ? usedCount + 1 : usedCount + 2;
    if (borrowIndex < 1 || borrowIndex > 24) return null;
    const borrowedKey = `Trinity ${toRoman(borrowIndex)}`;
    const trinityEntry = collectsTemporaleData[borrowedKey];
    if (!trinityEntry) return null;
    return {
      introit: epiphanyVI.introit,
      gradual: epiphanyVI.gradual,
      gradualAlleluia: epiphanyVI.gradualAlleluia,
      tract: epiphanyVI.tract,
      alleluia: epiphanyVI.alleluia,
      offertory: epiphanyVI.offertory,
      communion: epiphanyVI.communion,
      text: trinityEntry.text,
      secondaryText: trinityEntry.secondaryText,
      epistleCitation: trinityEntry.epistleCitation,
      epistleText: trinityEntry.epistleText,
      gospelCitation: trinityEntry.gospelCitation,
      gospelText: trinityEntry.gospelText,
      secretText: trinityEntry.secretText,
      secretSecondaryText: trinityEntry.secretSecondaryText,
      postcommunionText: trinityEntry.postcommunionText,
      postcommunionSecondaryText: trinityEntry.postcommunionSecondaryText,
      epiphanyOverflowFrom: borrowedKey,
    };
  }

  // ---- Mass Propers day resolution (shared by the Collect and every
  // other variable Mass part - Introit, Epistle, Gradual/Alleluia/Tract,
  // Gospel, Offertory, Secret, Communion, Postcommunion) ----
  //
  // This is the same Temporale-vs-Sanctorale ranking/Octave-
  // commemoration/feast-transfer logic that used to live inline inside
  // the "collectOfDay" placeholder branch, factored out into a plain
  // data function so every proper part can share one resolution of
  // "which Mass is actually said today" rather than re-deriving it
  // (and risking a different answer) once per part. Returns null only
  // when neither a Temporale nor a Sanctorale entry exists for today at
  // all; otherwise returns { winner, decision, seasonEntry, sanctorale,
  // transferred, octaveCommemoration } - winner is "feast" or "season"
  // (or "season" by default when there's no competing Sanctorale entry
  // to rank against), matching decideCollectWinner's own vocabulary.
  function resolveTemporaleSeasonEntry(resolved) {
    const bucket = collectsTemporaleData[resolved.periodKey];
    // George's consolidated 10/7 note: "Holy Week's Masses needs to be
    // replaced with what is in the Missal." Holy Monday through Easter
    // Even all share the single "Palm Sunday" periodKey bucket (same
    // periodKey/dayLabel pair js/calendar.js's describeSeason already
    // special-cases for the on-screen title, task #212) - but this
    // lookup used to return that one bucket object directly, with no
    // day-of-week awareness at all, so every day of Holy Week literally
    // showed Palm Sunday's own Mass (the Palm procession Gospel and the
    // Passion according to St. Matthew), Easter Even included, whose
    // true Mass is the entirely different Paschal Vigil. Fixed by
    // dereferencing one level deeper by `dayLabel` for this one
    // periodKey, matching data/collects-temporale.json's own new nested
    // shape (see that file's own "_note" on "Palm Sunday") - every other
    // periodKey's bucket is still a flat Mass-propers object, unchanged.
    if (resolved.periodKey === "Palm Sunday" && bucket && resolved.dayLabel && bucket[resolved.dayLabel]) {
      return bucket[resolved.dayLabel];
    }
    return bucket;
  }

  // George's 10/20 note: "The program struggles to make sense of feasts
  // with 2 Evensongs. It uses the same Psalm and Magnificat Antiphon (the
  // 2nd Evensong one) both days." Root cause: every place that picks
  // between a day's `firstEvensong...`/`secondEvensong...` antiphon pair
  // (the group Psalm antiphon and the Magnificat antiphon, both here and
  // in their Feast-then-Common fallback and the deferred last-Psalm-
  // antiphon cases below) always preferred the Second Evensong variant
  // outright, with no awareness of `eveningDisplacement` - the same
  // Table-2 mechanism (resolveEveningDisplacement, task #91) that
  // pickLectionarySlot already consults to tell First Evensong of a
  // feast (tonight anticipates tomorrow, which outranks today - code
  // 1/3/5) apart from the feast's own Second Evensong (no displacement
  // needed; tonight already IS the feast's evening). When displaced,
  // `resolved` throughout this render pass is already tomorrow's own
  // resolution (renderOfficePage's `renderResolved`), so `primaryEntry`
  // is the SAME feast entry on both nights - only which variant of its
  // antiphon pair is proper to say differs. Most sourced days only carry
  // one variant total, so the fallback direction simply reverses rather
  // than ever going without an antiphon a day does have.
  function pickEvensongAntiphonVariant(firstVariant, secondVariant) {
    const preferFirst = currentHour === "evensong" && !!eveningDisplacement;
    return preferFirst ? (firstVariant || secondVariant) : (secondVariant || firstVariant);
  }

  // George's 10/26 note: "Yesterday was the feast of Christ the King and
  // the online BCP did not reflect that in the relevant offices." See
  // js/calendar.js's own Kalendar-injection comment (the single choke
  // point that actually decides WHICH day this is) for the full root-
  // cause story: Christ the King has no \feastdate of its own
  // (PropTime.tex keeps it on "Last Sunday in October," a computed
  // civil date, not a fixed Kalendar entry), so it was never wired into
  // any of this site's data files at all - resolveLiturgicalDay now
  // injects a synthetic Kalendar entry for it whenever today genuinely
  // is that Sunday, tagged `isChristTheKing: true` so this one check
  // doesn't need to re-derive the same "last Sunday of October" date
  // arithmetic a second time.
  function isChristTheKingToday(resolved) {
    const kalEntries = (resolved && resolved.kalendar) || [];
    return kalEntries.some((e) => e.isChristTheKing);
  }

  // Transcribed verbatim from pages/Propers/PropTime.tex's "Our Lord
  // Jesus Christ the King" entry (manually inserted between Sts. Simon
  // & Jude and All Hallows - "First Class Double, Last Sunday in
  // October"). Every field matches data/collects-sanctorale.json's own
  // shape (see e.g. its "9-29" Michaelmas entry), so the exact same
  // rendering code that already shows a fixed Sanctorale entry's Mass
  // Propers/Opening Sentence can show this one too - substituted in
  // below wherever that code would otherwise look this feast up by its
  // (nonexistent) kalendarKey. The Collect/Secret/Postcommunion's
  // source-text "Who liveth." shorthand is expanded to "...who liveth
  // and reigneth with thee in the unity of the Holy Ghost, God,
  // throughout all ages, world without end. Amen." - the exact
  // expansion every other "Who liveth."-ending Collect already
  // transcribed into this site's data uses (e.g. the Conception, "12-8";
  // Sts. Philip & James, "5-1"; Candlemas, "2-2") - not new wording
  // invented for this entry. The source's three "Commemoration is made
  // of the Sunday occurring" rubrics (after the Collect/Secret/
  // Postcommunion) need no separate code at all: Christ the King always
  // falls ON a Sunday, so task #142's suppressSundayPriorCommemoration
  // guard (which only suppresses a commemoration on a WEEKDAY) never
  // fires here, and the pre-existing renderCommemoratedOration machinery
  // already commemorates that Sunday's own Collect/Secret/Postcommunion
  // automatically. The fourth rubric ("The Last Gospel is of the Sunday
  // occurring") has no corresponding substitution mechanism anywhere on
  // this site - Last Gospel isn't modeled as its own swappable Mass part
  // at all - so it's left unimplemented rather than guessed at; see
  // ROADMAP.md.
  const CHRIST_THE_KING_SANCTORALE = {
    name: "Christ the King",
    introit: "Worthy is the Lamb that was slain to receive power, and riches, and wisdom, and strength, and honour. To him be glory and dominion for ever and ever. Ps. Give the King thy judgments, O God: and thy righteousness unto the King's Son.",
    text: "Almighty and everlasting God, who in thy beloved Son, the King of all, hast been pleased to make all things new: mercifully grant; that all the families of the Gentiles, dispersed by the wounds of sin, may be made subject to his most gracious governance. Who liveth and reigneth with thee in the unity of the Holy Ghost, God, throughout all ages, world without end. Amen.",
    epistleCitation: "Colossians 1:12",
    epistleText: "Brethren: We give thanks unto the Father, which hath made us meet to be partakers of the inheritance of the saints in light: Who hath delivered us from the power of darkness, and hath translated us into the kingdom of his dear Son: In whom we have redemption through his blood, even the forgiveness of sins: Who is the image of the invisible God, the firstborn of every creature: For by him were all things created, that are in heaven, and that are in earth, visible and invisible, whether they be thrones, or dominions, or principalities, or powers: all things were created by him, and for him: And he is before all things, and by him all things consist. And he is the head of the body, the church: who is the beginning, the firstborn from the dead; that in all things he might have the preeminence. For it pleased the Father that in him should all fulness dwell; And, having made peace through the blood of his cross, by him to reconcile all things unto himself; by him, I say, whether they be things in earth, or things in heaven, in Christ Jesus our Lord.",
    gradual: "His dominion shall be from the one sea to the other, and from the flood unto the world's end. ℣. All kings shall fall down before him: all nations shall do him service.",
    gradualAlleluia: "Alleluia, alleluia. ℣. His dominion is an everlasting dominion, which shall not pass away: and his kingdom that which shall not be destroyed. Alleluia.",
    gospelCitation: "John 18:33",
    gospelText: "At that time: Pilate said unto Jesus: Art thou the King of the Jews? Jesus answered him, Sayest thou this thing of thyself, or did others tell it thee of me? Pilate answered, Am I a Jew? Thine own nation and the chief priests have delivered thee unto me: what hast thou done? Jesus answered, My kingdom is not of this world: if my kingdom were of this world, then would my servants fight, that I should not be delivered to the Jews: but now is my kingdom not from hence. Pilate therefore said unto him, Art thou a king then? Jesus answered, Thou sayest that I am a king. To this end was I born, and for this cause came I into the world, that I should bear witness unto the truth. Every one that is of the truth heareth my voice.",
    offertory: "Desire of me, and I shall give thee the heathen for thine inheritance, and the utmost parts of the earth for thy possession.",
    secretText: "We offer unto thee, O Lord, the victim of man's reconciliation: grant, we beseech thee; that he, whom we offer in these present sacrifices, may himself grant unto all nations the gifts of unity and peace, Jesus Christ thy Son our Lord. Who liveth and reigneth with thee in the unity of the Holy Ghost, God, throughout all ages, world without end. Amen.",
    communion: "The Lord remaineth a King for ever: the Lord shall give his people the blessing of peace.",
    postcommunionText: "O Lord, who hast bestowed on us the food of immortality, we beseech thee: that we, who glory to fight beneath the banner of Christ the King, may with him be enabled to reign for ever on the heavenly throne. Who liveth and reigneth with thee in the unity of the Holy Ghost, God, throughout all ages, world without end. Amen.",
    openingSentence: "All power is given unto me in heaven and in earth.",
    openingSentenceCitation: "Mt 28:18",
  };

  // Transcribed verbatim from pages/Lectionary/LectionaryFestivals.tex's
  // "Christ the King / Last Sunday in October" row - same shape as
  // data/lectionary-festivals.json's own fixed-date entries (see e.g.
  // its "9-29" entry), substituted into pickLectionarySlot below in
  // place of the normal (inapplicable, since this feast has no fixed
  // kalendarKey) lectionaryFestivalsData lookup.
  const CHRIST_THE_KING_LECTIONARY = {
    name: "Christ the King",
    evensongI: { psalms: "29,45,47", lesson1: "Jer 23:1-8", lesson2: "Lk 1:26-33" },
    mattins: { psalms: "2,8,24", lesson1: "Jer 10", lesson2: "Rev 19:1-16" },
    evensongII: { psalms: "48,72", lesson1: "Dan 4", lesson2: "1 Tim 6:1-16" },
  };

  function resolveMassPropersWinner(resolved) {
    const seasonEntry = resolveTemporaleSeasonEntry(resolved) || resolveEpiphanyOverflow(resolved.periodKey, resolved.date);
    let sanctorale = isChristTheKingToday(resolved) ? CHRIST_THE_KING_SANCTORALE : collectsSanctoraleData[resolved.kalendarKey];

    // Feast Day transfer (Ranking.tex: a I/II Double hard-blocked on its
    // own calendar date is transferred to the first unhindered day) -
    // see findTransferredFeast above.
    const transferred = findTransferredFeast(resolved.date);
    if (transferred) {
      sanctorale = {
        name: transferred.name,
        text: transferred.text,
        secondaryText: transferred.secondaryText,
        // A transferred feast only ever carries its Collect along in
        // this prototype (findTransferredFeast only captures
        // text/secondaryText from collectsSanctoraleData) - the other
        // Mass parts for a transferred feast aren't resolved here, so
        // introitOfDay etc. simply show nothing for a transferred day
        // rather than a wrong/mismatched part.
      };
    }

    // Common Octave days reuse the origin feast's Collect (and, here,
    // its other proper parts too) - see findCommonOctaveOrigin in
    // ranking.js and the fuller explanation this block used to carry
    // inline, preserved below.
    let octaveCommemoration = null;
    if (window.Ranking && window.Ranking.findCommonOctaveOrigin) {
      const kalEntries = resolved.kalendar || [];
      for (const e of kalEntries) {
        const octaveRef = window.Ranking.findCommonOctaveOrigin(e);
        if (!octaveRef) continue;
        const origin = collectsSanctoraleData[octaveRef.originKalendarKey];
        if (!origin) continue;
        if (!sanctorale) {
          // Deliberately carries every part (introit/epistle/etc.) from
          // the origin feast so the other seven Mass Propers placeholders
          // also resolve on a Common Octave day, but drops secondaryText
          // specifically - matching the original collectOfDay behavior,
          // which never showed a doubled commemoration paragraph for a
          // synthesized Octave Collect.
          sanctorale = Object.assign({}, origin, { name: octaveRef.name, secondaryText: undefined });
        } else if (sanctorale.name !== octaveRef.name) {
          octaveCommemoration = { name: `Octave of ${octaveRef.originName}`, text: origin.text };
        }
        break;
      }
    }

    if (!seasonEntry && !sanctorale) {
      return null;
    }

    // The Sanctorale entry's own inherent Kalendar rank (e.g. "1st
    // Double"), independent of whether it actually wins the day against
    // the season - renderCommemoratedOration needs this (as
    // `sanctoraleRank`) for the Memorial-commemoration-timing rule
    // (Ranking.tex's "Memorial" entry, pages/Front/Ranking.tex:17: a
    // Memorial nested as a secondaryText/secondaryName paragraph inside
    // a winning I/II Double's own Collect is commemorated at I Evensong
    // and Mattins normally, but that commemoration is dropped at
    // Evensong specifically when the Double is a II Double, and dropped
    // altogether when it's a I Double). `kalendar` (the raw per-day
    // array, each entry `{ name, rank, ... }`) is exposed too, so that
    // function can look up any nested secondary/tertiary saint's own
    // rank by name the same way.
    const kalEntriesAll = resolved.kalendar || [];
    let sanctoraleRank = null;
    if (sanctorale) {
      if (transferred) {
        sanctoraleRank = transferred.rank || null;
      } else {
        // Same name-match-with-fallback pattern as `matchedEntry` just
        // below (the one decideCollectWinner's own rank argument uses) -
        // deliberately kept in sync with it, since without the `||
        // kalEntriesAll[0]` fallback this silently returns null whenever
        // collects-sanctorale.json's own `.name` (a short/popular form
        // used for Collect headings - "Candlemas", "Michaelmas",
        // "Marymas", etc.) doesn't literally match kalendar.json's own
        // `.name` (the fuller liturgical form shown on the Kalendar line -
        // "Purification of the Blessed Virgin Mary", "St. Michael & All
        // Angels", "Nativity of the Blessed Virgin Mary..."). Found 8/31
        // while chasing why Table 2 (window.Ranking.classifyVespersCategory,
        // which reads sanctoraleRank) silently failed to classify Feb 2
        // (Purification/"Candlemas") as its real "2nd Double" rank - a
        // sitewide audit found 45 dates with this same short-name/
        // full-name mismatch, every one of which was silently losing its
        // `sanctoraleRank` (and, in turn, anything that reads it - this
        // function's own Memorial-commemoration-timing rule just below,
        // and both directions of Table 2) even though decideCollectWinner
        // itself was unaffected (its own `matchedEntry` already had this
        // fallback). See ROADMAP.md.
        const m = kalEntriesAll.find((e) => e.name === sanctorale.name) || kalEntriesAll[0];
        sanctoraleRank = m ? m.rank : null;
      }
    }

    let result;
    if (sanctorale && seasonEntry && window.Ranking) {
      const matchedEntry = transferred ? { rank: transferred.rank } : (kalEntriesAll.find((e) => e.name === sanctorale.name) || kalEntriesAll[0]);
      const rank = matchedEntry ? matchedEntry.rank : null;
      const decision = window.Ranking.decideCollectWinner(resolved, rank);
      result = { winner: decision.winner, decision, seasonEntry, sanctorale, transferred, octaveCommemoration, periodKey: resolved.periodKey, sanctoraleRank, kalendar: kalEntriesAll };
    } else if (sanctorale && !seasonEntry) {
      result = { winner: "feast", decision: null, seasonEntry, sanctorale, transferred, octaveCommemoration, periodKey: resolved.periodKey, sanctoraleRank, kalendar: kalEntriesAll };
    } else {
      result = { winner: "season", decision: null, seasonEntry, sanctorale, transferred, octaveCommemoration, periodKey: resolved.periodKey, sanctoraleRank, kalendar: kalEntriesAll };
    }
    return applyMassDayChoice(result);
  }

  /**
   * First/Second Evensong concurrence (Table 2 - "if there concur a...",
   * from Table2_revision.pdf, read and cross-checked 8/24 - see
   * ROADMAP.md). Looks one day ahead of `resolved` and, when today's own
   * rank should stay the primary Evensong per Table 2 (codes 2/4 - see
   * `window.Ranking.TABLE2_TODAY_WINS`), returns what to add: either
   * nothing (code 2 - today's Office wins outright, tomorrow isn't even
   * commemorated - this already matches what happens if this function
   * returns null, so code 2 is handled just by NOT returning a
   * commemoration) or tomorrow's own Collect as a Commemoration (code 4).
   *
   * Deliberately does NOT handle the cases where TOMORROW's Office
   * should displace TODAY's entirely (Table 2 codes 1/3/5-when-tied) -
   * see the long comment on TABLE2_TODAY_WINS in ranking.js for why.
   * Only ever called for the Evensong page's own Collect (see the
   * `collectOfDay` placeholder below) - Table 2 concerns Vespers
   * specifically, not Mattins or Mass.
   */
  function resolveEveningConcurrence(resolved) {
    if (!window.Ranking || typeof window.Ranking.classifyVespersCategory !== "function") return null;
    const todayResolution = resolveMassPropersWinner(resolved);
    const todayCategory = window.Ranking.classifyVespersCategory(
      resolved.weekdayName === "Sunday", todayResolution.sanctoraleRank, todayResolution.winner
    );

    const tomorrowDate = addDaysLocal(resolved.date, 1);
    const tomorrowResolved = resolveLiturgicalDay(tomorrowDate, lectionaryData, kalendarData);
    const tomorrowResolution = resolveMassPropersWinner(tomorrowResolved);
    const tomorrowCategory = window.Ranking.classifyVespersCategory(
      tomorrowResolved.weekdayName === "Sunday", tomorrowResolution.sanctoraleRank, tomorrowResolution.winner
    );
    if (!tomorrowCategory) return null;

    let code;
    if (todayCategory && window.Ranking.TABLE2_TODAY_WINS[todayCategory]) {
      code = window.Ranking.TABLE2_TODAY_WINS[todayCategory][tomorrowCategory];
    } else if ((!todayCategory || todayCategory === "memorial") && todayResolution.winner === "season" && resolved.weekdayName !== "Sunday" && tomorrowCategory === "memorial") {
      // George's 9/8 note, task #184: "Memorials are commemorated during
      // I Evensong and Mattins, but not II Evensong." Ranking.tex's own
      // "Memorial" rule only suppresses this commemoration on I/II
      // Doubles specifically (TABLE2_TODAY_WINS's own `memorial` columns
      // on the firstDouble/secondDouble rows, code 2) - an ordinary plain
      // feria (the vast majority of real days, and not one of Table
      // 2's 9 named row categories at all) always commemorates a
      // following day's Memorial at this Evensong instead, the same way
      // resolveEveningDisplacement above already carves out plain ferias
      // for the "Double displaces an empty ferial Evensong entirely"
      // rule. `todayCategory === "memorial"` is included here for the
      // same reason resolveEveningDisplacement's own carve-out was
      // widened above: today's own feria might separately note its own
      // (also-losing) Memorial without that changing today's status as
      // an otherwise-ordinary feria.
      code = 4;
    }
    if (code !== 4) return null; // code 2 (or no rule at all) - nothing to add, today's Office already wins outright

    // A Memorial never "wins" its own day outright against a plain feria
    // (RANK_TIER's tier 2 never clears the tier>=3 threshold any
    // classification in ranking.js requires) - so `tomorrowResolution.winner`
    // is `"season"`, not `"feast"`, even on the Memorial's own date. The
    // old `tomorrowResolution.winner === "feast" ? ... : null` gate below
    // meant this function could never actually surface a Memorial's
    // Collect at all, even though TABLE2_TODAY_WINS's own `memorial`
    // column already existed (see classifyVespersCategory's doc comment
    // in ranking.js) - reading `tomorrowResolution.sanctorale` directly
    // whenever `tomorrowCategory === "memorial"` fixes that.
    const tomorrowEntry = tomorrowCategory === "memorial"
      ? tomorrowResolution.sanctorale
      : (tomorrowResolution.winner === "feast" ? tomorrowResolution.sanctorale : null);
    if (!tomorrowEntry || !tomorrowEntry.text) return null; // nothing to actually show even though the rule fires
    return {
      name: tomorrowEntry.name || tomorrowResolution.periodKey,
      text: tomorrowEntry.text,
    };
  }

  /**
   * Mirror image of resolveEveningConcurrence above: Table 2 codes 1, 3,
   * and 5 (window.Ranking.TABLE2_TOMORROW_WINS - see the derivation
   * comment there and ROADMAP.md), where TOMORROW's First Evensong claim
   * displaces TODAY's Office entirely rather than just adding a
   * commemoration to it. When one of these codes fires, returns
   * { tomorrowResolved, tomorrowLabel, commemorateToday, todayName,
   * todayText, code } so renderOfficePage can swap `tomorrowResolved` in
   * for the whole Evensong render (Psalms, Lessons, Hymn, Collect -
   * everything, not just the Collect, per the scoping note on
   * TABLE2_TODAY_WINS in ranking.js) while `currentDateLabel` keeps
   * showing today's actual civil date. `commemorateToday` tells the
   * Collect placeholder (via the eveningDisplacement module flag) whether
   * to still show today's own Collect as a Commemoration within that
   * swapped-in render (codes 3 and 5) or not at all (code 1). Only ever
   * called for the Evensong page's own render pass (see renderOfficePage)
   * - Table 2 concerns Vespers specifically, not Mattins or Mass.
   */
  function resolveEveningDisplacement(resolved) {
    if (!window.Ranking || typeof window.Ranking.classifyVespersCategory !== "function" || !window.Ranking.TABLE2_TOMORROW_WINS) return null;
    const todayResolution = resolveMassPropersWinner(resolved);
    if (!todayResolution) return null;
    const todayCategory = window.Ranking.classifyVespersCategory(
      resolved.weekdayName === "Sunday", todayResolution.sanctoraleRank, todayResolution.winner
    );

    const tomorrowDate = addDaysLocal(resolved.date, 1);
    const tomorrowResolved = resolveLiturgicalDay(tomorrowDate, lectionaryData, kalendarData);
    const tomorrowResolution = resolveMassPropersWinner(tomorrowResolved);
    const tomorrowCategory = tomorrowResolution && window.Ranking.classifyVespersCategory(
      tomorrowResolved.weekdayName === "Sunday", tomorrowResolution.sanctoraleRank, tomorrowResolution.winner
    );
    if (!tomorrowCategory) return null;

    // George's 9/4 note via Augustine: "last night should have been First
    // Evensong for St. Gorazde" - 3 September 2026, a plain ferial
    // Thursday with no Kalendar entry of its own, the eve of St.
    // Gorazde's Double-rank feast on the 4th. Table2_revision.pdf's own 9
    // rows never include a plain "feria" (its rows are Sunday, Double I
    // Class, Double II Class, Privileged/Common Octave Day, Greater
    // Double, Lesser Double, Day in Privileged/Common Octave) -
    // classifyVespersCategory correctly returns null for a feria since it
    // has no row to classify it INTO, but the OLD code then treated that
    // null exactly like "no rule fires, keep today's Evensong as-is,"
    // which is backwards: a plain feria isn't a row in this table because
    // it has no Vespers claim of its own at all to weigh against
    // anything, not because nothing should happen. Per the general
    // Western Rite rule this table exists to codify - and per Augustine's
    // own description here, which asks for St. Gorazde's Office outright
    // with no mention of commemorating the ferial day at all - First
    // Vespers of ANY Double-or-higher feast (this codebase's four
    // classifiable Double tiers: lesserDouble/greaterDouble/secondDouble/
    // firstDouble) always displaces a genuinely empty ferial Evensong
    // entirely (Table 2's own code 1: "all of the following, nothing of
    // the preceding"). Deliberately scoped to ONLY a true plain feria
    // (todayResolution.winner === "season" and not a Sunday, i.e.
    // classifyVespersCategory's specific "ordinary Feria" branch) - a
    // winning Semidouble/Simple feast today (classifyVespersCategory's
    // OTHER null case, "no row or column in Table 2") used to be left out
    // of this carve-out on the theory that it was "a genuinely different,
    // more ambiguous situation" - George's 10/7 note shows that's not so:
    // "Saturday did not have a Magnificat antiphon during I Evensong. For
    // certain Sundays in Trinitytide, this is found in the Proper of
    // Season" describes exactly this gap, just with an ordinary Sunday
    // (not a Double-rank feast) as tomorrow's claim, which the carve-out's
    // `tomorrowIsDoubleTier` list never included either. Both gaps share
    // one root cause: `classifyVespersCategory` returns null/"memorial"
    // for ANY day whose own office can't outrank at least a Lesser
    // Double - a true plain feria, a feria noting only a losing Memorial
    // or Vigil (neither ever wins against the season), or even a winning
    // Semidouble/Simple feast (tier 1-3, still below Lesser Double's own
    // tier) - none of which have a row in Table2_revision.pdf because
    // none of them ever have a real claim to assert against a Sunday or
    // a Double-rank feast tomorrow. So instead of narrowing this carve-out
    // to "plain feria only" + "Double-tier tomorrow only" (both
    // accidentally too strict, confirmed by tracing live dates: 4 July
    // 2026, a winning Semidouble within the Octave of Sts. Peter & Paul,
    // and 8/22 August 2026, common Vigils of St. Lawrence/St.
    // Bartholomew, all failed to anticipate the following ordinary
    // Sunday's First Evensong before this fix), this now fires whenever
    // TODAY has no real claim (any category other than the four Double
    // tiers) and TOMORROW does (an ordinary Sunday or any Double tier) -
    // using the same code 1 ("nothing of today") the original Gorazde fix
    // already established as correct for a claim-less today, since
    // Table 2 itself gives a losing Memorial/Vigil/Semidouble no
    // commemoration slot to retain either.
    const todayOutranksNothing = !["lesserDouble", "greaterDouble", "secondDouble", "firstDouble"].includes(todayCategory);
    const tomorrowHasFirstEvensongClaim = ["sunday", "lesserDouble", "greaterDouble", "secondDouble", "firstDouble"].includes(tomorrowCategory);
    let code;
    if (todayCategory && window.Ranking.TABLE2_TOMORROW_WINS[todayCategory]) {
      code = window.Ranking.TABLE2_TOMORROW_WINS[todayCategory][tomorrowCategory];
    } else if (todayOutranksNothing && tomorrowHasFirstEvensongClaim) {
      code = 1;
    }
    if (!code) return null;

    // Today's own Collect text/name, to (maybe) carry into tomorrow's
    // displaced render as a Commemoration - Table 2's "today" categories
    // include a plain Sunday as well as a winning Sanctorale rank, so
    // this reads whichever of the two actually won today per
    // resolveMassPropersWinner, not just `sanctorale`.
    const todayText = todayResolution.winner === "feast"
      ? (todayResolution.sanctorale && todayResolution.sanctorale.text)
      : (todayResolution.seasonEntry && todayResolution.seasonEntry.text);
    const todayName = todayResolution.winner === "feast"
      ? ((todayResolution.sanctorale && todayResolution.sanctorale.name) || todayResolution.periodKey)
      : todayResolution.periodKey;
    const tomorrowLabel = tomorrowResolution.winner === "feast"
      ? ((tomorrowResolution.sanctorale && tomorrowResolution.sanctorale.name) || tomorrowResolution.periodKey)
      : tomorrowResolution.periodKey;

    return {
      tomorrowResolved,
      tomorrowLabel,
      commemorateToday: window.Ranking.commemoratesDisplacedToday(code) && !!todayText,
      todayName,
      todayText,
      code,
      // George's 10/8 note: "it had the Evensong lessons for tonight...
      // when the Festival does not have proper Psalms and Lessons... the
      // Psalms and Lessons are ferial." The civil TODAY's own resolved
      // day (pre-displacement), kept alongside `tomorrowResolved` so
      // pickLectionarySlot can fall back to TODAY's own ferial Psalms/
      // Lessons specifically when tomorrow's displacing feast has no
      // dedicated lectionaryFestivalsData entry of its own - see the
      // comment there.
      todayResolved: resolved,
    };
  }

  // "For Mass, options should exist for the priest to select either the
  // preceding Sunday [i.e. the ongoing feria] or the memorial" (8/26
  // note via George). Western Rite practice: a Memorial (or Simple) has
  // no Office/Mass of obligation - the season/feria's own Mass is said
  // by default, but the Priest MAY instead say the Memorial's own Votive
  // Mass. This is a pastoral choice, not a ranking fact, so it's a
  // manual toggle (`massDayChoice`) rather than anything ranking.js
  // decides on its own - and it only actually offers a real choice when
  // the season currently wins AND the noted Sanctorale entry is
  // Memorial/Simple tier (RANK_TIER < 3) with its own Mass Collect text
  // to switch to; a Semidouble-or-higher Feast Day already wins
  // automatically (see decideCollectWinner), so there's nothing to
  // toggle there. massDayChoiceAvailable() (below) answers the same
  // question for the toggle button's own visibility, so the two must
  // stay in agreement.
  function applyMassDayChoice(result) {
    if (massDayChoice !== "memorial" || !result || result.winner !== "season") return result;
    if (!result.sanctorale || !result.sanctorale.text) return result;
    const tier = (window.Ranking && result.sanctoraleRank) ? window.Ranking.RANK_TIER[result.sanctoraleRank] : null;
    if (tier === null || tier === undefined || tier >= 3) return result;
    return Object.assign({}, result, {
      winner: "feast",
      decision: { winner: "feast", commemorateOther: false, classification: "priest's-choice-memorial", feastTier: tier },
    });
  }

  // Read-side twin of applyMassDayChoice's own eligibility check, used
  // by renderMassPage to decide whether to print the toggle at all -
  // deliberately re-derives the *automatic* (massDayChoice-independent)
  // winner via resolveMassPropersWinner's own logic rather than calling
  // that function recursively (which would apply this file's current
  // massDayChoice and so never see the "season currently wins" case once
  // a user has already switched to "memorial").
  function massDayChoiceAvailable(resolved) {
    const saved = massDayChoice;
    massDayChoice = "automatic";
    const result = resolveMassPropersWinner(resolved);
    massDayChoice = saved;
    if (!result || result.winner !== "season" || !result.sanctorale || !result.sanctorale.text) return false;
    const tier = (window.Ranking && result.sanctoraleRank) ? window.Ranking.RANK_TIER[result.sanctoraleRank] : null;
    return tier !== null && tier !== undefined && tier < 3;
  }

  // ---- Feast rank/winner for a day, independent of Collect text ----
  //
  // js/liturgical-color.js and js/office-variants.js each need a quick
  // answer to "does a fixed feast actually govern the Office today, and
  // how highly ranked is it" - distinct from resolveMassPropersWinner
  // above, which also assembles the actual Collect/Introit/etc. text for
  // the Mass Propers placeholders. This only needs
  // Ranking.decideCollectWinner's classification (which needs nothing
  // but a rank string - see ranking.js) plus findTransferredFeast (which
  // does need Collect data, since only a feast with its own Collect is
  // tracked for transfer - see there).
  //
  // Before this helper existed, liturgical-color.js and office-
  // variants.js each asked their own simplified version of this question
  // by scanning resolved.kalendar directly for a Semidouble-or-higher
  // rank, with two real gaps this fixes: (1) a hard-blocked or merely-
  // commemorated fixed feast (one that loses to the season under
  // Ranking.tex) used to still count as "high rank present," even though
  // the season's own antiphon/canticle/color should apply, not the
  // losing feast's; (2) a feast transferred in from an earlier hard-
  // blocked date was invisible, since it has no entry of its own in
  // resolved.kalendar for the destination date. Now both files ask this
  // one function the same question the Mass Propers themselves already
  // answer, so the color/antiphon/canticle pickers and the actual Mass
  // Propers always agree on which feast (if any) is being kept today.
  /**
   * The historic "time of Alleluia": Easter Day through the Saturday in
   * Whitsun Ember Week, inclusive (per the Mass Gradual rubric in
   * PropSeas.tex, "From this day until Ember Saturday in Whitsun Week,
   * inclusive"). Used to gate the "(alleluia, alleluia.)" parenthetical
   * on Mattins/Evensong's closing "Let us bless the Lord" versicle.
   */
  function isAlleluiaSeason(resolved) {
    if (typeof getLiturgicalYearAnchors !== "function") return false;
    const anchors = getLiturgicalYearAnchors(resolved.date);
    return resolved.date >= anchors.easterDay && resolved.date <= anchors.emberSatWhitsun;
  }

  // George's 9/7 note, task #175: "'(Alleluia)' indicates that 'Alleluia'
  // should be said during Eastertide. Automatically put it in during
  // Eastertide (without the parentheses), and omit it otherwise" -
  // flagged specifically against Preparation/Thanksgiving/Benediction,
  // whose own antiphons and versicles carry this parenthetical marker
  // inline within a larger sentence (unlike Mattins/Evensong's own
  // alleluiaSuffix, a single fixed trailing phrase). Handles all three
  // shapes actually found in those three files' own text: a marker with
  // no surrounding period ("... heaven. (Alleluia)"), one with its own
  // period inside the parens at the very end of the string ("...
  // Sacrament. (Alleluia.)"), and one with the sentence's period sitting
  // OUTSIDE the parens ("...the Lord (Alleluia).") - captured as
  // `outerDot` so a real sentence-ending period already present isn't
  // duplicated or lost either way.
  //
  // Pending-corrections fix (10/2): wiring this same function up to the
  // Mass Introit/Offertory/Communion (see renderSimplePart) turned up a
  // second shape this function never handled - a DOUBLED
  // "(Alleluia, alleluia.)"/"(Alleluia, alleluia)" marker (confirmed
  // throughout data/collects-sanctorale.json/collects-temporale.json/
  // votive-angels.json/votive-matrimony.json), distinct from the single
  // "(Alleluia)" shape the three static rites above use. This doubled
  // parenthetical marker is a different printed convention from the
  // Office's own always-spoken alleluiaSuffix versicle ("alleluia,
  // alleluia." with no parens, gated by its own separate mechanism) -
  // it's the same bracketed-and-conditional shape as the single-word
  // marker, just with the Mass's own doubled "alleluia, alleluia" text
  // inside the parens, so it gets the identical swap-or-strip treatment,
  // tried first since it's the more specific pattern.
  function applyAlleluiaMarker(text, alleluiaSeason) {
    if (typeof text !== "string") return text;
    const swap = (word) => (match, outerDot) => (alleluiaSeason ? ` ${word}.` : (outerDot || ""));
    return text
      .replace(/ ?\(Alleluia, alleluia\.?\)(\.?)/g, swap("Alleluia, alleluia"))
      .replace(/ ?\(Allelúja, allelúja\.?\)(\.?)/g, swap("Allelúja, allelúja"))
      .replace(/ ?\(Alleluia\.?\)(\.?)/g, swap("Alleluia"))
      .replace(/ ?\(Allelúja\.?\)(\.?)/g, swap("Allelúja"));
  }

  // Pending-corrections fix (10/3, task #215, item #12): "When the Day
  // is a Day within an Octave, its liturgical colour should be the
  // colour of the Feast Day (the Octave's own feast), not whatever the
  // current default-color logic computes." The plain /martyr/i test
  // below (now moved into this helper) is correct for a Feast Day's own
  // Kalendar entry (e.g. "St. George, Martyr (Common Octave)"), but
  // every "Day N within the Octave of X" / "Octave Day of X" entry this
  // Kalendar generates for X's Octave only carries X's bare name, not
  // the "Martyr" qualifier the original Feast Day's own entry has - so
  // a Martyr's Octave Days and Days-within were showing white instead
  // of inheriting the Feast's own red (confirmed live: St. George's own
  // day, 23 April, is correctly red, but 24-30 April - "Day II within
  // the Octave of St. George" through "Octave Day of St. George" - were
  // all white). Checked against Ranking.tex's own two fixed Octave
  // lists (Common Octaves, Simple Octaves): of the Octaves this
  // Kalendar actually implements, only three are a Martyr's (St.
  // George, St. Stephen, St. Lawrence) - every other Octave in this
  // data (the Epiphany, the BVM feasts, St. John Baptist's Nativity,
  // St. John Evangelist, Sts. Peter & Paul, All Hallows, Divine
  // Compassion) is already correctly non-martyr/white under the plain
  // name/rank check, so this only needed to add those three names, not
  // rebuild the rule or cross-reference the Kalendar by date.
  const MARTYR_OCTAVE_NAMES = ["St. George", "St. Stephen", "St. Lawrence"];
  function isMartyrEntry(name, rank) {
    if (/martyr/i.test(name || "") || /martyr/i.test(rank || "")) return true;
    if (/(within the Octave of|Octave Day of)/i.test(name || "")) {
      return MARTYR_OCTAVE_NAMES.some((n) => (name || "").includes(n));
    }
    return false;
  }

  // Pending-corrections fix (10/3, task #216, item #13): "On 14 August
  // 2026 (the Ferial Day, Friday after Trinity IX), the Ferial Day is
  // wrongly trumping the Vigil (of the Assumption) in the ranking - the
  // Vigil should be the primary celebration that day." Investigation
  // found `decideCollectWinner` (ranking.js) itself was already behaving
  // correctly per Ranking.tex: a Vigil's "common-vigil"/"privileged-
  // vigil-1st"/"privileged-vigil-2nd" classification only exists to
  // decide whether some OTHER, differently-ranked Feast outranks the
  // Vigil (a Double-or-above beats a Common Vigil, nothing beats a
  // Vigil of the First Class, etc.), and nothing was actually contending
  // for 14 August 2026 - St. Eusebius, the day's only other entry, is a
  // mere Memorial. The real bug is one level down: a Vigil's own
  // Kalendar entry carries the literal rank string "Vigil"/"1st
  // Vigil"/"2nd Vigil", none of which `RANK_TIER` assigns a tier above
  // 0 - so a Vigil can never itself win `decideCollectWinner` and become
  // `resolveFeastRankToday`'s returned Feast, even when it's the only
  // thing present that day at all. Confirmed this isn't unique to the
  // Assumption's Vigil: all 14 Vigils in data/kalendar.json (Christmas
  // Even, the Epiphany's, and 12 ordinary Vigils) show the same wrong
  // generic ferial/season label today, live-tested across several of
  // them (14 Aug, 24 Dec, 5 Jan, 31 Oct, 23 Jun).
  //
  // Fixed with a small, title-only helper rather than folding this into
  // `resolveFeastRankToday`/`decideCollectWinner` themselves - those two
  // also feed the Collect/Invitatory/canticle/Gloria decisions
  // throughout this file, and exhaustively grepping PropSeas.tex/
  // PropTime.tex for "Vigil" found real, sourced Mass Proper text for
  // only ONE of these 14 Vigils (Christmas Even - a complete
  // `\seasonalFestival` entry never transcribed into this site's data at
  // all, a separate and much larger gap flagged in ROADMAP.md rather
  // than attempted here, since it wasn't what this item asked about).
  // The other 13 have no Mass Proper text anywhere in this project, so
  // there's nothing to make "win" in the Collect-selection sense - the
  // Mass actually said on those Vigil days is, correctly, still the
  // surrounding season's own ordinary Mass. Only the displayed title was
  // wrong, so only that is fixed here: `findVigilKalendarEntry` finds
  // today's Vigil entry (if any), and every place that already falls
  // back to the generic season label when no Feast wins now shows this
  // Vigil's own name instead, first.
  function findVigilKalendarEntry(resolved) {
    const entries = (resolved && resolved.kalendar) || [];
    return entries.find((e) => e.rank === "1st Vigil" || e.rank === "2nd Vigil" || e.rank === "Vigil");
  }

  // George's note: "today is a Saturday office of the BVM, but Matins
  // and Vespers is treating it as just a saturday." `pages/Front/
  // Rubrics.tex`'s own "Office of Our Lady on Saturday" entry: "On all
  // Saturdays - except in Advent, Septuagesimatide, Lent, and on Ember
  // Days - unless the Office be of a Double Feast (even transferred), or
  // of an occurrent Octave or Vigil, or of a Sunday anticipated according
  // to the rubrics, the Office is of St. Mary." This is a genuinely
  // separate rubric from the already-implemented "Votive Mass of Our
  // Lady on Saturday" (Rubrics.tex's very next entry, with a *different*
  // threshold that also excludes a Semidouble Feast - the "Votive Masses"
  // dropdown's own opt-in "Our Lady on Saturday" page, task #201, is that
  // Mass-only observance and is deliberately left untouched here). This
  // fix is about the actual Daily Office (Mattins/Evensong/the Little
  // Hours) on an unencumbered Saturday, which currently shows no sign at
  // all that the day is "of St. Mary" - no title, no distinct Collect -
  // even though Mattins.tex's own Te Deum rubric already separately names
  // "the Saturday Office of St. Mary" (office-variants.js's
  // pickMorningCanticle already has an approximation of that one piece,
  // predating this fix).
  //
  // Kept deliberately conservative versus a strict reading of "unless...
  // a Double Feast": any Feast actually winning the day today
  // (feastInfo.winner === "feast", at ANY rank, not just Double+) is
  // treated as hindering this too, not only a Double - safer than
  // overriding an already-correctly-displayed winning Simple/Semidouble
  // feast's own title/Collect with Our Lady's, in the rare case the two
  // would otherwise collide (a plain feria lets a Simple or Semidouble
  // feast win outright per ranking.js's own "feria" branch - Rubrics.tex
  // doesn't actually say which should prevail when that collides with an
  // unencumbered Saturday, so this errs toward not touching a feast
  // that's already winning rather than guessing).
  //
  // Scoped to what's actually sourced and determinable: the title (see
  // renderOfficePage) and the Collect of the Day (see
  // bvmSaturdayCollectText below, reusing the same seasonal Collect text
  // already transcribed for the Votive Mass's five seasonal forms -
  // data/votive-bvm.json for Epiphanytide/Septuagesimatide/Eastertide/
  // Trinitytide, data/seasonal-prayers.json's "maryInAdvent" entry for
  // the Advent form specifically, which Votive.tex's own Advent section
  // defers to by name rather than repeating). NOT attempted: the
  // Invitatory antiphon (Mattins.tex's own Invitatory-antiphon rubric, a
  // separate list a few lines above its Te Deum rubric, does NOT itself
  // name Saturday as a trigger - only Advent/Christmastide/.../"Feasts of
  // Our Lord & Our Lady"/"Other Feast Days of Semidouble or higher" - so
  // adding one here would be inventing a rule the primary source doesn't
  // actually state, not fixing a gap); full proper Psalms/Lessons/
  // Responsories for this Office (as opposed to the day's ordinary
  // ferial ones), which would need the Common of the Blessed Virgin Mary
  // - the same Commons.tex this project has already confirmed,
  // repeatedly, does not exist anywhere in this project (see
  // PENDING-CORRECTIONS.md's item #2 blocker); and the "Sunday
  // anticipated" exclusion clause, which this codebase has no existing
  // concept of modeling for Mattins (only Evensong's own, unrelated
  // First-Evensong-of-tomorrow mechanism, which already runs first and
  // would already change `resolved`/`feastInfo` before this is ever
  // reached, so no separate check is added for it here).
  function isOctaveOccurrentToday(resolved) {
    const entries = (resolved && resolved.kalendar) || [];
    if (entries.some((e) => e.name && /(within the Octave of|Octave Day of)/i.test(e.name))) return true;
    // A Sanctorale Octave (St. George's, the Assumption's, etc.) is
    // always a named Kalendar entry, caught above - but the four
    // Privileged Temporale Octaves (Easter, Whitsun, Ascension, Corpus
    // Christi) are modeled purely through periodKey/dayLabel, with no
    // Kalendar entry at all (see js/ranking.js's own
    // PRIVILEGED_OCTAVE_*_KEYS). Live-tested and caught live: "Saturday
    // in Easter Day" (Low Saturday, within Easter's own Octave) was
    // wrongly showing "(Office of Our Lady)" without this check, since
    // it has no Kalendar entry naming an Octave at all. Reusing
    // ranking.js's own classifySeasonDay - the exact function that
    // already identifies these four - rather than re-deriving which
    // periodKeys/dayLabels count a second time.
    if (window.Ranking && typeof window.Ranking.classifySeasonDay === "function") {
      const cls = window.Ranking.classifySeasonDay(resolved);
      if (/^privileged-octave/.test(cls)) return true;
    }
    return false;
  }

  function isOfficeOfOurLadyToday(resolved, feastInfo) {
    if (!resolved || resolved.weekdayName !== "Saturday") return false;
    const seasonKey = typeof seasonKeyFor === "function" ? seasonKeyFor(resolved.periodKey) : null;
    if (seasonKey === "advent" || seasonKey === "septuagesima" || seasonKey === "lent" || seasonKey === "passiontide") return false;
    // "Ember Saturday" is this codebase's own periodKey for the Whitsun
    // Ember Days only (js/calendar.js's buildAnchorList) - Advent's and
    // Lent's own Ember Saturdays are already excluded by the season check
    // above. September's Ember Saturday has no periodKey of its own to
    // check in this codebase at all (a separate, pre-existing gap - see
    // liturgical-color.js's own Ember-day comment), so it isn't excluded
    // here; flagged rather than guessed at.
    if (resolved.periodKey === "Ember Saturday") return false;
    if (feastInfo && feastInfo.winner === "feast") return false;
    if (isOctaveOccurrentToday(resolved)) return false;
    if (findVigilKalendarEntry(resolved)) return false;
    return true;
  }

  // The already-sourced seasonal Collect text for "Our Lady on Saturday"
  // (see isOfficeOfOurLadyToday above) - reuses `pickBvmSaturdaySeason`
  // (the exact picker the Votive Mass page already uses to choose among
  // its five seasonal forms) rather than re-deriving the season a second
  // way. Advent's form has no standalone Collect text of its own in
  // data/votive-bvm.json (Votive.tex's own Advent section defers to the
  // separately-printed "Of St. Mary in Advent" Collect by name/page
  // reference instead of repeating it) - that text is transcribed
  // separately, at data/seasonal-prayers.json's "maryInAdvent" entry, so
  // this checks there instead for that one season only.
  function bvmSaturdayCollectText(resolved) {
    const season = typeof pickBvmSaturdaySeason === "function" ? pickBvmSaturdaySeason(resolved) : "trinitytide";
    if (season === "advent") {
      return window.SEASONAL_PRAYERS && window.SEASONAL_PRAYERS.maryInAdvent && window.SEASONAL_PRAYERS.maryInAdvent.collect;
    }
    const sections = (window.VOTIVE_BVM_TEMPLATE && window.VOTIVE_BVM_TEMPLATE.sections) || [];
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      if (sec.type === "heading" && sec.bvmSeasonOption === season && (sec.text || "").trim() === "Collect") {
        const next = sections[i + 1];
        if (next && next.type === "text") return next.text;
      }
    }
    return null;
  }

  // George's consolidated 10/7 note: "Mattins and Evensong of All Souls'
  // Day should be the Office of the Dead with Double rite." All Souls
  // (2 November, kalendarKey "11-2") is a fixed Double-rank feast -
  // kalendar.json already carries it correctly as such - but winning the
  // day under Ranking.tex only ever drove the ordinary Daily Office's own
  // title/Collect/Psalms/Lessons before this, same as any other feast.
  // The actual Office of the Dead (Vespers/Matins/Lauds of the Dead,
  // `data/vesper-dead.json`/`matins-dead.json`/`lauds-dead.json`) has
  // only ever existed as three separate, date-blind static-rite pages
  // (task #176 made them date-AWARE for their own internal Double-rite
  // antiphon-doubling/Psalm-omission rules, but never substituted them
  // IN PLACE of the ordinary Office page on any specific day). This is
  // the missing link: on All Souls' Day specifically, `renderOfficePage`
  // now checks this and swaps in the Dead rite's own content instead of
  // the ordinary Mattins/Evensong templates. Scoped tightly to the exact
  // winning-feast case (not just any day with kalendarKey "11-2") so the
  // one acknowledged gap this project hasn't modeled - All Souls'
  // Sunday-transfer rule, which would move it to 3 November in years
  // where 2 November falls on a Sunday and a Sunday's Office would then
  // correctly win the civil 2nd - is left exactly as honest as it was
  // before (no Dead-rite override on a day All Souls didn't actually
  // win), rather than guessed at.
  function isAllSoulsOfficeOfTheDeadToday(resolved, feastInfo) {
    if (!resolved || resolved.kalendarKey !== "11-2") return false;
    if (!feastInfo || feastInfo.winner !== "feast") return false;
    const kalendarEntries = resolved.kalendar || [];
    return kalendarEntries.some((e) => e.name === "All Souls");
  }

  function resolveFeastRankToday(resolved) {
    const none = { winner: "season", tier: 0, name: null, rank: null, isMartyr: false, transferred: false };
    if (!window.Ranking) return none;

    const transferred = findTransferredFeast(resolved.date);
    if (transferred) {
      return {
        winner: "feast",
        tier: window.Ranking.RANK_TIER[transferred.rank] || 0,
        name: transferred.name,
        rank: transferred.rank,
        isMartyr: isMartyrEntry(transferred.name, transferred.rank),
        transferred: true,
      };
    }

    const kalEntries = resolved.kalendar || [];
    let best = null;
    for (const entry of kalEntries) {
      if (!entry.rank) continue;
      const decision = window.Ranking.decideCollectWinner(resolved, entry.rank);
      if (decision.winner !== "feast") continue; // hard-blocked, transferred away, or merely commemorated
      if (!best || decision.feastTier > best.tier) {
        best = {
          winner: "feast",
          tier: decision.feastTier,
          name: entry.name,
          rank: entry.rank,
          isMartyr: isMartyrEntry(entry.name, entry.rank),
          transferred: false,
        };
      }
    }
    return best || none;
  }

  // "Title for the Day" (George's 9/1 note): the season banner used to
  // print resolved.seasonLabel unconditionally, which never once
  // consulted whether a Feast actually wins the day - so a Double like
  // St. Gorazde (4 September) still showed the plain ferial season
  // label ("Friday after the Twelfth Sunday after Trinity") as if
  // nothing else were happening, and a Memorial that a Sunday correctly
  // outranks (e.g. Sts. Felix & Adauctus on a Trinity Sunday) had no
  // visible link between the (also-then-unformatted) season label and
  // the Kalendar line sitting right below it. resolveFeastRankToday
  // already computes the correct winner - Sunday/season vs. Feast - for
  // the Collect, color, and canticle elsewhere on this same page; this
  // just reuses that same decision for the headline text too, so what's
  // printed here always matches what actually renders underneath it.
  function computeDayTitle(resolved) {
    const feastInfo = resolveFeastRankToday(resolved);
    if (feastInfo.winner === "feast" && feastInfo.name) {
      return feastInfo.rank ? `${feastInfo.name}, ${feastInfo.rank}` : feastInfo.name;
    }
    // Task #216, item #13: when no Feast outranks the season but today's
    // Kalendar carries a Vigil, show the Vigil's own name/rank rather
    // than the generic season label - see findVigilKalendarEntry above.
    const vigilEntry = findVigilKalendarEntry(resolved);
    if (vigilEntry) {
      return vigilEntry.rank ? `${vigilEntry.name}, ${vigilEntry.rank}` : vigilEntry.name;
    }
    return resolved.seasonLabel;
  }

  // The Collect/Secret/Postcommunion are the three orations that
  // "travel together" with a commemoration in the classical Western
  // Rite - when one Mass wins the day but another is commemorated, all
  // three of that other Mass's orations of this kind are said too. (The
  // Introit/Epistle/Gradual/Gospel/Offertory/Communion are never
  // doubled this way - they always belong solely to whichever Mass won,
  // which is why those get the much simpler renderSimplePart below
  // instead of this function.) `label` is the heading word ("Collect",
  // "Secret", "Postcommunion"); `textField`/`secondaryField` are the
  // field names on the resolution's seasonEntry/sanctorale objects.
  // Per Augustine's 8/29 answer (Q7 of the release-audit list): "Default
  // the ad libitum third collect for Mass to 'for devoted friends.' ...
  // Fixed default is enough" - no selection toggle, just always show it.
  // George's 9/2 note, task #145: "only show 2nd/3rd Collect when the
  // rubric calls for it" - reverses task #105/Q7's "always show it,
  // fixed default" decision. Investigated pages/Propers/PropSeas.tex and
  // PropTime.tex directly rather than just flipping the old feature off:
  // it turns out nearly every season/Sunday Mass Proper in this Breviary
  // (72 of them, found by scanning every \feastday{} for a following
  // "\nth{2}...\&\nth{3}..." rubric) carries its OWN explicit 2nd/3rd
  // Collect instruction - sometimes a specific named Collect ("of St.
  // Mary in Advent," "of the Saints"), sometimes literally "ad libitum"
  // (free choice among the votive Collects at Seasonal.tex:93-580, of
  // which task #105 already fixed "For Devoted Friends" as this site's
  // own default), and on some days (Easter Monday/Tuesday, Passion
  // Sunday, and every day within a winning Feast's own self-contained
  // Mass) no 3rd Collect - or no 2nd/3rd Collect at all - is called for.
  // The old code ignored all of this and just always appended the same
  // fixed ad libitum block to every single Mass regardless of day.
  //
  // The 72 rubrics collapse into a small, clean set of rules once
  // grouped by the site's own existing seasonKeyFor() 9-way season
  // bucket (office-variants.js, already used for Invitatory/Office Hymn/
  // Votive-Saturday selection) plus a handful of named-day overrides -
  // see resolveSecondThirdCollectRule below. Critically, EVERY instance
  // of this rubric found in the source sits inside a SEASON's own Mass
  // Proper entry, never inside a winning Sanctorale Feast's - a Feast's
  // Mass is complete in itself and doesn't get an ad libitum bonus
  // Collect, matching the many major Feast days (Epiphany, Ascension,
  // Whitsunday, Trinity Sunday, Corpus Christi, Annunciation, etc.) that
  // have no such rubric anywhere near their own Mass Proper in the
  // source. So this now only fires when `resolution.decision.winner ===
  // "season"` - the ordinary Sunday/feria Mass is what's actually being
  // said today.
  //
  // Documented gap, not guessed at: Ascensiontide (Ascension Sunday
  // itself plus the one Sunday within its Octave) and the four days from
  // Whitsun-Ember-Wednesday through Whitsun-Ember-Saturday inclusive
  // have their own more complex worded rubrics in the source (in-Octave
  // exceptions, "from this day until the Saturday following" ranges)
  // that don't reduce to the same clean (name, name-or-"ad libitum")
  // pair as everywhere else - left showing no 2nd/3rd Collect rather
  // than invent a simplified version of a genuinely more complex rule,
  // a tiny fraction of the year (well under 2 weeks total).
  // George's 9/8 note, task #193: "The Second Collect does not get an
  // ending ('Through . . . ')." Matches Rubrics.tex's own general rule
  // (the "Collects" entry): "When several proper Collects (or Secrets,
  // or Postcommunions) are said, only the first and the last receive
  // the full ending." Applied only to whichever Collect/Secret/
  // Postcommunion actually lands in a non-final position once
  // Commemorations and the Season's own ad libitum second/third are
  // combined - see renderSecondThirdCollectBlock and the matching
  // branch inside renderCommemoratedOration below.
  //
  // Endings vary in exact wording across this book's roughly 1,000
  // sourced Collects/Secrets/Postcommunions - task #78's "Expand
  // abbreviated collect endings" filled most of them out from their
  // original abbreviated form, but not into one single fixed phrase;
  // this book uses whichever of the 5 wordings Rubrics.tex's own
  // "Conclusion of Collects" entry documents (varying by which Person
  // of the Trinity the Collect addresses), plus further real wording
  // variants found throughout the actual sourced text ("now and ever"
  // instead of "world without end," "he liveth" once the subject is
  // already established, etc). This regex recognizes the recurring
  // lead-in clauses common to all of them, anchored to require the
  // match run all the way to a final "Amen." - checked against this
  // site's entire sourced Collect/Secret/Postcommunion corpus at
  // roughly 98.5% coverage. The small remainder is either a genuinely
  // unique, non-formulaic ending (correctly left alone - not every
  // Collect's final clause is interchangeable boilerplate) or a
  // handful of endings task #78 never actually finished expanding,
  // still showing a literal "Through . . ." placeholder or trailing off
  // mid-clause (a real, separate defect found while building this
  // function - see ROADMAP.md's task #193 entry, tracked as task #202
  // rather than guessed at here). In both cases this function safely
  // leaves the text completely unchanged rather than risk mangling real
  // prose with an over-eager match.
  const COLLECT_ENDING_RE = /[,;:]?\s*(?:through (?:the same )?(?:Jesus|Jesu) Christ (?:our (?:Saviour|Lord)|thy Son our Lord)|through him who liveth|who liveth and reigneth|he liveth and reigneth|who livest and reignest|to whom,? with thee and the Holy Ghost,? be honour and glory)[\s\S]{0,120}?Amen\.\s*$/i;
  function stripCollectEnding(text) {
    if (!text) return text;
    const stripped = text.replace(COLLECT_ENDING_RE, "");
    return stripped === text ? text : stripped.trim();
  }

  // George's 9/8 note, task #193: "the second Collect gets the
  // introduction 'Let us pray.'" Rubrics.tex's own "Collects" entry:
  // "In the Mass, the Lord be with you is only said to introduce the
  // first and second collects" - the full versicle dialogue, matching
  // how the FIRST Collect's own introduction is already written out in
  // data/mass-ordinary.json (bare text, with no Priest/Layman "(or,
  // ...)" alternative - Mass inherently requires an ordained Priest to
  // celebrate at all, so the ministerRank swap that applies to this
  // same versicle elsewhere on the site, e.g. the Daily Office, isn't
  // relevant here - matching that same sibling occurrence exactly).
  function renderMassSecondCollectIntro() {
    return renderVersicleLine("The Lord be with you.", "℣. Dóminus vobíscum.", "versicle") +
      renderVersicleLine("And with thy spirit.", "℟. Et cum spíritu tuo.", "response") +
      renderVersicleLine("Let us pray.", "℣. Orémus.", "versicle");
  }

  // George's 9/8 note, task #193 - see renderSecondThirdCollectBlock and
  // the matching branch inside renderCommemoratedOration. Counts how
  // many genuine Commemoration Collects (of this one field - Collect,
  // Secret, or Postcommunion) actually render today on the Mass page,
  // so the Season's own ad libitum second/third can be demoted/dropped
  // per George's rule ("If there be a Commemoration... the Second
  // Collect becomes the third, and the third is omitted. If there be
  // two Commemorations... the Seasonal Prayers are omitted.") rather
  // than piling a 4th+ Collect onto the page. Only ever non-zero when
  // `resolution.decision.winner === "season"` (an ordinary Sunday/feria
  // outranking a weaker Sanctorale entry) - the pairing
  // resolveSecondThirdCollectRule itself already requires - so this
  // mirrors that same branch's own `other`/`otherEntry` derivation
  // exactly rather than guessing at a new one.
  function countMassCommemorations(resolution, textField, secondaryField) {
    if (currentPage !== "mass" || !resolution || !resolution.decision) return 0;
    const { decision, sanctorale } = resolution;
    if (decision.winner !== "season" || !decision.commemorateOther) return 0;
    if (!sanctorale || !sanctorale[textField]) return 0;
    const tertiaryField = secondaryField.replace(/Secondary/, "Tertiary").replace(/^secondary/, "tertiary");
    let count = 1;
    if (sanctorale[secondaryField]) count++;
    if (sanctorale[tertiaryField]) count++;
    return count;
  }

  function resolveSecondThirdCollectRule(resolved, resolution) {
    // resolveMassPropersWinner's own result shape puts `winner` at the
    // TOP level (`resolution.winner`), not nested under `.decision` -
    // `.decision` is null whenever there's no competing Sanctorale entry
    // at all today (the common case, e.g. an ordinary Sunday with no
    // fixed feast on the Kalendar that day), which is exactly when this
    // rule needs to fire, so checking resolution.decision.winner here
    // (rather than resolution.winner) would wrongly return null then.
    if (!resolved || !resolution || resolution.winner !== "season") return null;
    const pk = resolved.periodKey;
    const dl = resolved.dayLabel;
    const seasonKey = typeof seasonKeyFor === "function" ? seasonKeyFor(pk) : null;
    if (seasonKey === "advent") {
      if (pk === "Advent I") return { second: "maryInAdvent", third: "persecutorsOrChiefBishop" };
      return { second: "selfRef:Advent I", third: "maryInAdvent" };
    }
    if (seasonKey === "epiphany") {
      if (pk === "Epiphany II" || pk === "Epiphany III") return { second: "maryPostChristmas", third: "persecutorsOrChiefBishop" };
      if (pk === "Epiphany IV") {
        // "If it be after 2 February... Otherwise..." - the one genuine
        // date-conditional split found in the whole 72-entry survey.
        const afterCandlemas = resolved.date && (resolved.date.getUTCMonth() > 1 || (resolved.date.getUTCMonth() === 1 && resolved.date.getUTCDate() >= 2));
        return afterCandlemas
          ? { second: "ofSaints", third: "adLibitum" }
          : { second: "maryPostChristmas", third: "persecutorsOrChiefBishop" };
      }
      if (pk === "Epiphany V" || pk === "Epiphany VI") return { second: "ofSaints", third: "adLibitum" };
      return null; // Epiphany Day itself / Epiphany I: no rubric found
    }
    if (seasonKey === "septuagesima") return { second: "ofSaints", third: "adLibitum" };
    if (seasonKey === "lent") {
      if (pk === "Ash Wednesday") return { second: "ofSaints", third: "forLivingDeparted" };
      return { second: "selfRef:Ash Wednesday", third: "forLivingDeparted" }; // Lent I-IV, Lenten Ember days
    }
    if (seasonKey === "passiontide") {
      if (pk === "Passion Sunday") return { second: "selfRef:Ash Wednesday", third: null };
      return null; // Palm Sunday / Holy Week: no rubric found (the most solemn days of the year)
    }
    if (seasonKey === "eastertide") {
      if (pk === "Easter Day") {
        if (dl === "Sunday") return null; // Easter Day itself
        if (dl === "Easter Monday" || dl === "Easter Tuesday") return { second: "selfRef:Easter Day", third: null };
        return { second: "selfRef:Easter Day", third: "persecutorsOrChiefBishop" }; // Easter Wed-Sat
      }
      return { second: "maryInEastertide", third: "persecutorsOrChiefBishop" }; // Easter II-IV, Rogation Sunday/Days
    }
    if (seasonKey === "ascensiontide") return null; // documented gap, see comment above
    if (seasonKey === "trinitytide") {
      // Whitsunday/Trinity Sunday/Corpus Christi/Compassion of Our Lord
      // (major Feasts of the Lord - task #214 added "Compassion of Our
      // Lord" once that periodKey became reachable at all; its own
      // PropSeas.tex entry has no second/third-collect rubric either,
      // same as its three neighbors here); Trinity I/II (no rubric
      // found, likely still within Corpus Christi's own privileged
      // season); the Whitsun Ember days (documented gap, see comment
      // above) - everything else in this bucket (Trinity III-XXIV, the
      // Sunday next before Advent, and the Autumnal Ember days, which
      // nest under an ordinary Trinity Sunday's own periodKey) shares
      // the one uniform rule.
      if (["Whitsunday", "Trinity Sunday", "Corpus Christi", "Compassion of Our Lord", "Trinity I", "Trinity II", "Ember Wednesday", "Ember Friday", "Ember Saturday"].includes(pk)) return null;
      return { second: "ofSaints", third: "adLibitum" };
    }
    return null;
  }

  // Looks up the actual Collect/Secret/Postcommunion text for one side
  // (2nd or 3rd) of resolveSecondThirdCollectRule's answer. "adLibitum"
  // reuses task #105's own fixed default ("For Devoted Friends");
  // "persecutorsOrChiefBishop" reuses data/votive.json's own already-
  // sourced pair (task #107/Q10), defaulting to "Against the Persecutors
  // of the Church" - the same printed-first default this site already
  // uses for every other such either/or choice; a "selfRef:X" key reuses
  // periodKey X's own already-sourced primary Collect/Secret/
  // Postcommunion from collects-temporale.json rather than duplicating
  // it in data/seasonal-prayers.json; anything else is looked up
  // directly in data/seasonal-prayers.json by key.
  function lookupSecondThirdCollectSource(key) {
    if (!key) return null;
    if (key === "adLibitum") {
      const t = window.MASS_ORDINARY_TEMPLATE && window.MASS_ORDINARY_TEMPLATE.adLibitumThirdCollect;
      return t ? { name: t.heading, collect: t.collect, secret: t.secret, postcommunion: t.postcommunion } : null;
    }
    if (key === "persecutorsOrChiefBishop") {
      const e = window.SEASONAL_PRAYERS && window.SEASONAL_PRAYERS.againstPersecutors;
      return e ? { name: e.name, collect: e.collect, secret: e.secret, postcommunion: e.postcommunion } : null;
    }
    if (key.indexOf("selfRef:") === 0) {
      const pk = key.slice("selfRef:".length);
      const e = collectsTemporaleData[pk];
      return e ? { name: pk, collect: e.text, secret: e.secretText, postcommunion: e.postcommunionText } : null;
    }
    const e = window.SEASONAL_PRAYERS && window.SEASONAL_PRAYERS[key];
    return e ? { name: e.name, collect: e.collect, secret: e.secret, postcommunion: e.postcommunion } : null;
  }

  // Renders whichever of the 2nd/3rd Collect actually applies today, per
  // resolveSecondThirdCollectRule - replaces the old unconditional
  // renderAdLibitumThirdBlock. Mass-only (the historic "three Collects
  // at Low Mass" custom has no Daily Office equivalent - Mattins/
  // Evensong's own Collect never had a 2nd/3rd to begin with).
  // `commemCount` (George's 9/8 note, task #193 - see
  // countMassCommemorations above): how many genuine Commemoration
  // Collects/Secrets/Postcommunions already rendered today, ahead of
  // this block, via renderCommemoratedOration's own `other` branch.
  // Per George's rule ("If there be a Commemoration, and the Seasonal
  // Prayers are said, the Second Collect becomes the third, and the
  // third is omitted. If there be two Commemorations... the Seasonal
  // Prayers are omitted. If there be more than two... the rest
  // omitted."): one Commemoration demotes the Season's own "second" to
  // "third" (dropping the Season's own "third" outright, since a Low
  // Mass never says more than three Collects total per Rubrics.tex's
  // "Once three Collects... have been said, further Commemorations
  // cease and are omitted"); two or more Commemorations already fill
  // both remaining slots, so the Season's ad libitum Collects are
  // omitted entirely.
  function renderSecondThirdCollectBlock(field, label, resolved, resolution, commemCount) {
    if (currentPage !== "mass") return "";
    const rule = resolveSecondThirdCollectRule(resolved, resolution);
    if (!rule) return "";
    commemCount = commemCount || 0;
    if (commemCount >= 2) return "";
    if (commemCount === 1) {
      // The Season's own "second" becomes "third" here - no "Let us
      // pray" introduction (only the first and second Collects get
      // one), and it keeps its full ending (it's now the last of the
      // three, per Rubrics.tex's "only the first and the last receive
      // the full ending").
      const second = lookupSecondThirdCollectSource(rule.second);
      if (second && second[field]) {
        return `<div class="collect-heading commemoration">Third ${escapeHtml(label)}: ${escapeHtml(second.name)}</div><p class="collect-block commemoration">${withDropcap(second[field], true)}</p>`;
      }
      return "";
    }
    let html = "";
    const second = lookupSecondThirdCollectSource(rule.second);
    const third = lookupSecondThirdCollectSource(rule.third);
    const thirdHasField = !!(third && third[field]);
    if (second && second[field]) {
      // George's 9/8 note, task #193: the second Collect gets its own
      // "Let us pray" introduction, and - only when there's also a
      // third to follow it (otherwise this one IS the last) - no full
      // ending of its own.
      const text = thirdHasField ? stripCollectEnding(second[field]) : second[field];
      html += renderMassSecondCollectIntro();
      html += `<div class="collect-heading commemoration">Second ${escapeHtml(label)}: ${escapeHtml(second.name)}</div><p class="collect-block commemoration">${withDropcap(text, true)}</p>`;
    }
    if (thirdHasField) {
      const thirdLabel = rule.third === "adLibitum" ? `Third ${escapeHtml(label)}, ad libitum: ${escapeHtml(third.name)}` : `Third ${escapeHtml(label)}: ${escapeHtml(third.name)}`;
      html += `<div class="collect-heading commemoration">${thirdLabel}</div><p class="collect-block commemoration">${withDropcap(third[field], true)}</p>`;
    }
    return html;
  }

  function renderCommemoratedOration(resolution, textField, secondaryField, label, missingNote, eveningConcurrence, resolved) {
    if (!resolution) {
      return `<div class="placeholder-block"><span class="missing">${missingNote}</span></div>`;
    }
    const { seasonEntry, sanctorale, decision, octaveCommemoration, transferred } = resolution;
    const seasonText = seasonEntry && seasonEntry[textField];
    if (!seasonText && !(sanctorale && sanctorale[textField])) {
      return `<div class="placeholder-block"><span class="missing">${missingNote}</span></div>`;
    }

    // A handful of Collects (and occasionally Secrets/Postcommunions)
    // have a second \lett{}{} paragraph baked into the same Mass in the
    // source - a built-in commemoration of a related feast (e.g. St.
    // James/St. Christopher on 25 July - PropTime.tex:1881-1914). One
    // date (2 July) even nests two: St. John of San Francisco AND Sts.
    // Processus & Martinian (PropTime.tex:1748-1798) - hence a third
    // "tertiary" slot below, not just a secondary one.
    // findLabelFor() looks for that exact text elsewhere in this same
    // field across both Collect data sets to label it by feast/season
    // name when possible (this is how the original St. Paul/St. Peter
    // pair, 25 Jan/22 Feb, gets its label, since each's secondaryText is
    // literally the other's own primary Collect). For a commemorated
    // saint who never has a Collect of their own printed anywhere else
    // in the book (St. Christopher, Sts. Alexander/Eventius/Theodulus/
    // Juvenalis, St. John of San Francisco, Sts. Processus & Martinian,
    // Sts. Sixtus II/Felicissimus/Agapitus, St. Nicomedes - all Memorials
    // whose only text in this whole book is this nested paragraph), that
    // text-matching trick has nothing to find, so an explicit
    // secondaryName/tertiaryName field on the data entry is checked
    // first and takes priority when present - see ROADMAP.md.
    function findLabelFor(text) {
      if (!text) return null;
      for (const pk of Object.keys(collectsTemporaleData)) {
        if (collectsTemporaleData[pk] && collectsTemporaleData[pk][textField] === text) return pk;
      }
      for (const dk of Object.keys(collectsSanctoraleData)) {
        const e = collectsSanctoraleData[dk];
        if (e && e[textField] === text) return e.name || dk;
      }
      return null;
    }
    // "secondaryText" -> "tertiaryText", "secretSecondaryText" ->
    // "secretTertiaryText", "postcommunionSecondaryText" ->
    // "postcommunionTertiaryText" - derived rather than threaded through
    // every call site, since the 3 callers (collectOfDay/secretOfDay/
    // postcommunionOfDay) only ever pass the secondary field name.
    const tertiaryField = secondaryField.replace(/Secondary/, "Tertiary").replace(/^secondary/, "tertiary");
    // Per Ranking.tex's "Memorial" entry (pages/Front/Ranking.tex:17): "on
    // the day on which they are noted in the Kalendar, Commemoration only
    // is made of them at I Evensong and Mattins; except on II Doubles, on
    // which Commemoration of the Memorial is omitted at Evensong; and on I
    // Doubles, on which no Commemoration is made of Memorials." This site
    // treats "Evensong of day D" as I Evensong of D (see office-
    // variants.js's Marian Anthem doc comment), so that maps directly onto
    // this site's own Evensong/Mattins pages for day D with no extra
    // date-shifting needed. Only gates the two Office pages (currentPage
    // "office" with currentHour "mattins"/"evensong") - the rule as
    // written names only "I Evensong and Mattins," not Mass, and Mass's
    // own Collect keeps whatever nested commemoration paragraph the
    // Missal itself prints, unconditionally.
    function findKalendarRank(name) {
      if (!name || !resolution.kalendar) return null;
      const e = resolution.kalendar.find((k) => k.name === name);
      return e ? e.rank : null;
    }
    function renderExtraBlock(entry, field, nameField) {
      if (!entry || !entry[field]) return "";
      const text = entry[field];
      const foundLabel = (entry[nameField]) || findLabelFor(text);
      if (foundLabel && resolution.sanctoraleRank && findKalendarRank(foundLabel) === "Memorial") {
        const onOfficePage = currentPage === "office" && (currentHour === "mattins" || currentHour === "evensong");
        if (onOfficePage) {
          if (resolution.sanctoraleRank === "1st Double") return "";
          if (resolution.sanctoraleRank === "2nd Double" && currentHour === "evensong") return "";
        }
      }
      const heading = foundLabel ? `Commemoration: ${foundLabel}` : "Also commemorated within this " + label;
      return `<div class="collect-heading commemoration">${escapeHtml(heading)}</div><p class="collect-block commemoration">${withDropcap(text, true)}</p>`;
    }
    function renderSecondaryBlock(entry) {
      return renderExtraBlock(entry, secondaryField, "secondaryName") + renderExtraBlock(entry, tertiaryField, "tertiaryName");
    }
    function renderOctaveCommemorationBlock() {
      if (!octaveCommemoration || !octaveCommemoration[textField]) return "";
      return (
        `<div class="collect-heading commemoration">Commemoration: ${escapeHtml(octaveCommemoration.name)}</div>` +
        `<p class="collect-block commemoration">${withDropcap(octaveCommemoration[textField], true)}</p>` +
        `<p class="rubric-fine">A Double Feast occurring within a Common Octave has its Office with Commemoration of the Octave (Ranking.tex).</p>`
      );
    }
    function renderTransferNote() {
      if (!transferred) return "";
      return `<p class="rubric-fine">Transferred here from ${escapeHtml(fmtDate(transferred.fromDate))} (${escapeHtml(transferred.fromLabel)}), where it gave place entirely to the Office of the day this year, per Ranking.tex.</p>`;
    }
    function renderEpiphanyOverflowNote() {
      if (!seasonEntry || !seasonEntry.epiphanyOverflowFrom) return "";
      return `<p class="rubric-fine">This year has more than six Sundays of Epiphany before Septuagesima; per the rubric under Epiphany VI, the ${escapeHtml(label)} (and Epistle/Gospel) here is borrowed from ${escapeHtml(seasonEntry.epiphanyOverflowFrom)}, an otherwise-unused Sunday after Trinity this year, while the Introit/Gradual/Offertory/Communion remain those of Epiphany VI.</p>`;
    }
    // First/Second Evensong concurrence (Table 2 - see
    // resolveEveningConcurrence above and ROADMAP.md). Only ever passed
    // in for the Evensong page's own Collect - never for Secret/
    // Postcommunion (Mass-only concepts Table 2 doesn't concern) or for
    // Mattins/Mass's own Collect rendering.
    function renderEveningConcurrenceBlock() {
      if (!eveningConcurrence) return "";
      // Two different directions share this one block (see
      // resolveEveningConcurrence vs. resolveEveningDisplacement above):
      // ordinarily this is tomorrow's feast commemorated within today's
      // still-primary Evensong (code 4); when `.displaced` is set, the
      // whole render has been swapped to tomorrow's Office instead (code
      // 1/3/5) and this is TODAY's own Office being commemorated within
      // it - the note explaining what's being shown has to say which.
      const note = eveningConcurrence.displaced
        ? "This Evensong is First Evensong of the feast above, anticipated per the Table of Concurrence (Table2_revision.pdf); the Office otherwise proper to this civil day is commemorated here rather than said in full."
        : "Commemorated at this Evensong per the Table of Concurrence (Table2_revision.pdf), since tomorrow's own First Evensong claim does not outrank this day's Office.";
      return (
        `<div class="collect-heading commemoration">Commemoration: ${escapeHtml(eveningConcurrence.name)}</div>` +
        `<p class="collect-block commemoration">${withDropcap(eveningConcurrence.text, true)}</p>` +
        `<p class="rubric-fine">${note}</p>`
      );
    }

    if (sanctorale && seasonText && decision) {
      const primaryEntry = decision.winner === "feast" ? sanctorale : seasonEntry;
      const primary = decision.winner === "feast"
        ? { heading: `${label}: ${sanctorale.name || ""}`, text: sanctorale[textField] }
        : { heading: `The ${label}`, text: seasonText };
      const otherEntry = decision.winner === "feast" ? seasonEntry : sanctorale;
      const other = decision.winner === "feast"
        ? { heading: `Commemoration: ${resolution.periodKey}`, text: seasonText }
        : { heading: `Commemoration: ${sanctorale.name || ""}`, text: sanctorale[textField] };
      // Guard against a sanctorale entry that only has SOME of its three
      // orations (e.g. a Memorial with a Collect supplied but no Secret/
      // Postcommunion of its own, like St. Barbara - or a transferred
      // feast, which this prototype only ever carries a Collect for, per
      // findTransferredFeast above). Without this, escapeHtml(undefined)
      // would print the literal word "undefined" here instead of just
      // quietly having nothing to add for that part - seasonText already
      // covers the Office/Mass either way, so skipping is the right
      // fallback, not a placeholder-block warning.
      let html = primary.text
        ? `<div class="collect-heading">${escapeHtml(primary.heading)}</div><p class="collect-block">${withDropcap(primary.text, true)}</p>`
        : "";
      html += renderSecondaryBlock(primaryEntry);
      // George's 9/2 note, task #142: "When the office is a feast day
      // then the sunday prior is not commemorated." When a Feast wins the
      // day (`decision.winner === "feast"`) and today ISN'T itself a
      // Sunday, `other` here is the season/Temporale entry for whichever
      // periodKey today falls under - and in this site's own data model
      // (confirmed while fixing task #141's antiphon-carryover bug)
      // every such periodKey is anchored to, and spans the whole week
      // following, a single Sunday (e.g. "Trinity XII" covers that
      // Sunday itself plus the six ferias after it) - so on any weekday
      // feria, "the season" being commemorated here always IS literally
      // that week's Sunday, i.e. exactly "the Sunday prior" George's note
      // means. Suppressed only in that specific case; a Feast that
      // actually wins ON a Sunday itself (`resolved.date.getUTCDay() ===
      // 0`, e.g. a 2nd/1st Double outranking a Lesser Sunday) still
      // commemorates that Sunday as before, since it isn't "prior" to
      // anything - it's the very day being outranked, and the reverse
      // direction (a losing Feast commemorated within a winning season's
      // own Office, `decision.winner === "season"`) is untouched too,
      // since that's a different pairing entirely.
      const isSunday = !!(resolved && resolved.date && resolved.date.getUTCDay() === 0);
      const suppressSundayPriorCommemoration = decision.winner === "feast" && !isSunday;
      // George's 9/8 note, task #184: "Memorials are commemorated during
      // I Evensong and Mattins, but not II Evensong." This site's per-
      // date Evensong page is that date's own SECOND Evensong (the
      // evening closing out the day itself - see pickLectionarySlot's
      // doc comment and the task #172 fix it describes; a day's First
      // Evensong only ever renders on the PRECEDING day's Evensong page,
      // via resolveEveningConcurrence's Table-2-driven commemoration
      // block above). A Memorial reaches `other` here only when
      // `decision.winner === "season"` (an ordinary feria beating a
      // Memorial - see the `other` derivation above), so this is scoped
      // to exactly that pairing plus `resolution.sanctoraleRank ===
      // "Memorial"` (Ranking.tex's I/II-Evensong restriction is specific
      // to that one rank - nothing else carries it) and to the Evensong
      // Office page specifically (Mattins is untouched, and Mass has no
      // Evensong concept to gate against at all). The "I Evensong" half
      // of the rule this suppresses is handled separately: this same
      // fix added a plain-feria/Memorial carve-out to
      // resolveEveningConcurrence above, which now correctly surfaces
      // this same Memorial as a commemoration on the PRECEDING day's own
      // Evensong page (that Memorial's true First Evensong) instead.
      const suppressMemorialAtSecondEvensong =
        decision.winner === "season" && resolution.sanctoraleRank === "Memorial" &&
        currentPage === "office" && currentHour === "evensong";
      if (suppressMemorialAtSecondEvensong) {
        // Suppressed per task #184 above - render nothing more (this
        // Memorial is still commemorated at Mattins, and at the
        // preceding day's own Evensong per resolveEveningConcurrence).
      } else if (decision.commemorateOther && other.text && !suppressSundayPriorCommemoration) {
        // George's 9/8 note, task #193: when this Commemoration is the
        // ONLY one today (no built-in secondary/tertiary of its own -
        // see countMassCommemorations) and the Season would otherwise
        // also have called for its own ad libitum Collects
        // (resolveSecondThirdCollectRule non-null), this Commemoration
        // is effectively "the second Collect": it gets its own "Let us
        // pray" introduction and drops its full ending (the Season's
        // own "second," rendered afterward by renderSecondThirdCollectBlock,
        // becomes "the third" and keeps the ending instead). When there
        // IS a secondary/tertiary (countMassCommemorations counts >1),
        // or no Season ad libitum rule applies today at all, this
        // Commemoration renders exactly as before - unchanged.
        const hasOtherSecondaryOrTertiary = !!(otherEntry && (otherEntry[secondaryField] || otherEntry[tertiaryField]));
        const secondThirdRuleToday = currentPage === "mass" ? resolveSecondThirdCollectRule(resolved, resolution) : null;
        const isSoleMassCommemoration = !!secondThirdRuleToday && !hasOtherSecondaryOrTertiary;
        const otherText = isSoleMassCommemoration ? stripCollectEnding(other.text) : other.text;
        if (isSoleMassCommemoration) html += renderMassSecondCollectIntro();
        html += `<div class="collect-heading commemoration">${escapeHtml(other.heading)}</div><p class="collect-block commemoration">${withDropcap(otherText, true)}</p>`;
        html += renderSecondaryBlock(otherEntry);
      } else if (decision.commemorateOther && !suppressSundayPriorCommemoration) {
        // Nothing to show for this specific part (Secret/Postcommunion)
        // even though the Collect above did have a commemoration - stay
        // silent here rather than claim a commemoration with no text.
      } else if (suppressSundayPriorCommemoration) {
        // Suppressed per task #142 above - render nothing more.
      } else {
        html += `<p class="rubric">${escapeHtml(decision.winner === "feast" ? resolution.periodKey : (sanctorale.name || "This feast"))} ${decision.classification === "always-season" || decision.classification === "first-class-sunday" ? "gives way entirely today and is not commemorated" : "is not commemorated today"}, per the ranking rules in Ranking.tex (${escapeHtml(decision.classification)}).</p>`;
      }
      if (decision.winner === "feast") html += renderOctaveCommemorationBlock();
      html += renderEveningConcurrenceBlock();
      html += renderTransferNote();
      if (decision.winner === "season") html += renderEpiphanyOverflowNote();
      html += `<p class="rubric-fine">Automatically ranked by <code>js/ranking.js</code>, a partial implementation of Ranking.tex - see ROADMAP.md for what it does and doesn't cover.</p>`;
      return html;
    }
    if (sanctorale && sanctorale[textField] && !seasonText) {
      return (
        `<div class="collect-heading">${label}: ${escapeHtml(sanctorale.name || "")}</div>` +
        `<p class="collect-block">${withDropcap(sanctorale[textField], true)}</p>` +
        renderSecondaryBlock(sanctorale) +
        renderOctaveCommemorationBlock() +
        renderEveningConcurrenceBlock() +
        renderTransferNote()
      );
    }
    return `<p class="collect-block">${withDropcap(seasonText, true)}</p>` + renderSecondaryBlock(seasonEntry) + renderEveningConcurrenceBlock() + renderEpiphanyOverflowNote();
  }

  // Introit / Epistle / Gradual-Alleluia-Tract / Gospel / Offertory /
  // Communion - never doubled for a commemoration (see the comment
  // above renderCommemoratedOration), so this just reads the winning
  // Mass's own text for one field, with no secondary/commemoration
  // handling at all.
  //
  // Pending-corrections note (10/2): "the '(Alleluia)' in parentheses
  // should be omitted outside of Eastertide (currently appears to show
  // outside Eastertide too)." A direct corpus scan found a bracketed
  // "(Alleluia, alleluia.)"/"(Alleluia.)" marker baked directly into 71
  // Introit, 67 Offertory, and 62 Communion texts in
  // data/collects-sanctorale.json (plus 1 more Introit in
  // collects-temporale.json) - the same classical convention as the
  // Gradual's own "Greater Alleluia" swap just above, but printed
  // in-line within the antiphon text itself rather than as a separate
  // field, since many Propers only ever gain the Alleluia during
  // Paschaltide. introitOfDay/offertoryOfDay/communionOfDay never once
  // consulted the season before this, so these always rendered the
  // literal parenthesised marker verbatim, year-round. Reuses the same
  // applyAlleluiaMarker/isAlleluiaSeason task #175 already built for
  // Preparation/Thanksgiving/Benediction's own "(Alleluia)" markers -
  // swapped for a real spoken "Alleluia"/"Allelúja" (no parens) during
  // the historic time of Alleluia, stripped out entirely otherwise.
  function renderSimplePart(resolution, textField, missingNote, resolved) {
    if (!resolution) {
      return `<div class="placeholder-block"><span class="missing">${missingNote}</span></div>`;
    }
    const winnerEntry = resolution.winner === "feast" ? resolution.sanctorale : resolution.seasonEntry;
    let text = winnerEntry && winnerEntry[textField];
    if (!text) {
      return `<div class="placeholder-block"><span class="missing">${missingNote}</span></div>`;
    }
    if (resolved) text = applyAlleluiaMarker(text, isAlleluiaSeason(resolved));
    return `<p class="plain-text">${escapeHtml(text)}</p>`;
  }

  /**
   * Renders the whole Fore-Office block (pages/Office/ForeOffice.tex) -
   * Sentences of Scripture, the Exhortation, the General Confession,
   * the Declaration of Absolution, and the Lord's Prayer & Angelic
   * Salutation - from data/foreoffice.json, shared by Mattins and
   * Evensong via a single "foreOffice" placeholder in each template
   * rather than duplicating this large block of text into both. See
   * ROADMAP.md for the full writeup of what this replaces (previously
   * neither Hour had any of this at all).
   */
  function renderForeOffice(resolved) {
    if (!foreOfficeData) return "";
    const hourType = currentHour === "mattins" ? "morning" : "evening";
    const feastInfo = resolveFeastRankToday(resolved);
    const categoryKey = pickOpeningSentenceCategory(resolved, feastInfo, hourType);
    // George's 9/1 note: "The 'General' Opening Sentences should always
    // be provided. The 'Morning' or 'Evening' should always be provided.
    // Then, any other relevant Opening Sentences should also be
    // provided, depending on the Day." ForeOffice.tex's own Sentences of
    // Scripture section is genuinely organized this way - a permanent
    // "General" set, a Morning-only and an Evening-only set, and then a
    // long run of day/season/Common-of-Saints-specific sets (Advent,
    // Lent, a Martyr's day, etc.) - not a menu where the reader picks
    // just one bucket for the whole day. `pickOpeningSentenceCategory`
    // (unchanged - still finds the single best-matching day-specific
    // category, "morning"/"evening" on an ordinary day with nothing more
    // specific to offer) used to be the ONLY category shown, which meant
    // "general" (11 sentences, sourced but never displayed at all) and,
    // on any special day, the Hour's own Morning/Evening set were both
    // silently dropped in favor of just the day-specific set. Now
    // combines all three tiers, in George's own stated order, skipping a
    // later tier only when it would just repeat an earlier one (e.g. an
    // ordinary day with no more specific category than "morning" itself)
    // rather than printing the same sentences twice.
    const categoryKeys = ["general", hourType];
    if (categoryKey && !categoryKeys.includes(categoryKey)) categoryKeys.push(categoryKey);
    let html = "";

    // George's 9/2 note (task #137): the three Common-of-Saint sentence
    // categories (martyr, bishopConfessorDoctor, virginMartyressMatron)
    // each end with "Pray for us, O blessed N. That we may be made
    // worthy of the promises of Christ." - "N." is the standard
    // celebrant's-manual placeholder for "insert the commemorated
    // saint's name here," to be filled in with whichever Saint actually
    // wins the day (kalendar.json's own "name" field, e.g. "St. Titus,
    // Bishop & Confessor" - only the part before the first comma is the
    // Saint's own name; the rest is the office/title clause already
    // spoken elsewhere on the page). NOT the same "N." convention used
    // in Matrimony/Baptism/Burial/Unction/Reception/Litany of the
    // Saints, which is the celebrant's-manual placeholder for the
    // person's OWN name (bride, groom, the sick, the departed, a
    // Bishop) - that usage is correct as-is and out of scope here.
    const feastNameForSentence = feastInfo && feastInfo.winner === "feast" && feastInfo.name
      ? feastInfo.name.split(",")[0].trim()
      : null;
    html += `<p class="rubric">${renderRubricText(foreOfficeData.preRubric1)}</p>`;
    html += `<p class="rubric-fine">${escapeHtml(foreOfficeData.preRubric2)}</p>`;
    // George's 9/2 note (task #135): "Issue titles from the BCP for the
    // opening sentences for Mattins and Evensong." ForeOffice.tex prints
    // its own small centered red title (`\centerline{\color{RubricRed}
    // \small% General}`, etc.) directly above every one of its sentence
    // groups - previously dropped entirely, since the old code just
    // concatenated every category's sentences into one flat, unlabeled
    // list. `foreOfficeData.categoryTitles` (new field, sourced 1:1 from
    // those same source headings) now supplies the title for each
    // category actually being shown, printed once per category rather
    // than once per sentence.
    const categoryTitles = foreOfficeData.categoryTitles || {};
    html += categoryKeys.map((key) => {
      const catSentences = foreOfficeData.sentenceCategories[key] || [];
      if (!catSentences.length) return "";
      const title = categoryTitles[key];
      const heading = title ? `<p class="sentence-category-heading">${escapeHtml(title)}</p>` : "";
      const body = catSentences.map((s) => {
        const cite = s.citation ? ` <span class="sentence-citation">(${escapeHtml(s.citation)})</span>` : "";
        const text = feastNameForSentence ? s.text.replace(/\bN\.(?=\s|$)/, `${feastNameForSentence}.`) : s.text;
        return `<p class="plain-text">${escapeHtml(text)}${cite}</p>`;
      }).join("");
      return heading + body;
    }).join("");

    // George's 10/8 note: "The Opening Sentence for St. Michael is
    // still missing. Opening Sentences are sometimes found in the
    // Proper of the Saints." pages/Propers/PropTime.tex gives 17 fixed
    // Sanctorale feasts (St. Andrew, Conversion of St. Paul, Candlemas,
    // Chair of St. Peter at Antioch, the Annunciation, Sts. Philip &
    // James, Invention of the Cross, St. John Baptist, St. Peter,
    // Precious Blood, St. Mary Magdalene, the Transfiguration,
    // St. Lawrence, the Assumption ["Marymas"], Michaelmas, Walsingham,
    // and All Hallows) their own single `\textit{Opening Sentence.}`
    // line, printed right above that feast's own Mass propers - a
    // different, more specific thing than ForeOffice.tex's fixed
    // General/Morning/Evening/Common-of-Saint sentence categories
    // handled by the loop just above, which has no slot for an
    // individual feast's own one-off sentence at all. (Christ the King
    // also has one in the source - this WAS left for a follow-up, since
    // it's a movable feast with no \feastdate to key it by, until
    // George's 10/26 note that the live site wasn't observing the feast
    // at all; CHRIST_THE_KING_SANCTORALE above now supplies it, and the
    // `isChristTheKingToday` substitution just below picks it up the
    // same way a fixed feast's own sourced entry would be.) Newly
    // sourced onto the matching
    // `data/collects-sanctorale.json` entry (`openingSentence` +
    // optional `openingSentenceCitation`, parsed 1:1 from PropTime.tex)
    // and shown as one more tier, after the General/Morning-or-Evening/
    // Common-of-Saint sentences already printed above, exactly when
    // today's actual winning feast (not a merely-commemorated one) has
    // one sourced - every other day is completely unaffected.
    if (feastInfo && feastInfo.winner === "feast" && resolved.kalendarKey) {
      const sanctoraleEntry = isChristTheKingToday(resolved) ? CHRIST_THE_KING_SANCTORALE : collectsSanctoraleData[resolved.kalendarKey];
      if (sanctoraleEntry && sanctoraleEntry.openingSentence) {
        const cite = sanctoraleEntry.openingSentenceCitation
          ? ` <span class="sentence-citation">(${escapeHtml(sanctoraleEntry.openingSentenceCitation)})</span>`
          : "";
        html += `<p class="sentence-category-heading">${escapeHtml(sanctoraleEntry.name || feastInfo.name)}</p>`;
        html += `<p class="plain-text">${escapeHtml(sanctoraleEntry.openingSentence)}${cite}</p>`;
      }
    }

    // Exhortation to Penitence - the source prints this as an inline
    // "longer form ... or, shorter form ... [or, if omitted, this line
    // instead]" choice (8/23 note: replace with proper selection
    // buttons, matching the site-wide "no more inline or" rule; the
    // note describes three forms - this data only ever had two full
    // texts, but the "omitted" rubric already names its own one-line
    // substitute, which is naturally the third option rather than a
    // missing exhortation text to source separately). Default "long",
    // the form printed first in the source.
    const exLong = foreOfficeData.exhortationLong;
    const exShort = foreOfficeData.exhortationShort;
    // Per Augustine's 8/26 review: the heading should sit above the
    // Long/Short/Omit buttons (not the buttons above the heading), and it
    // should stay put no matter which option is chosen - previously it
    // came from whichever variant's own `heading` field was set, and only
    // exhortationLong had one, so switching to "Short" silently dropped
    // the title. The heading is a property of the section as a whole
    // ("Exhortation to Penitence"), not of one particular wording of it,
    // so it's now printed once, unconditionally, before the toggle.
    html += `<div class="section-heading">${escapeHtml(exLong.heading)}</div>`;
    html += renderInlineToggle("exhortation", [
      { value: "long", label: "Longer Form" },
      { value: "short", label: "Shorter Form" },
      { value: "omitted", label: "Omit" },
    ], exhortationChoice);
    if (exhortationChoice === "omitted") {
      // The one-line substitute is what's actually said in place of the
      // Exhortation - plain spoken text, not a rubric instruction
      // describing it (the instruction itself, "If the exhortation be
      // omitted, to be said in its place:", is redundant once the Omit
      // button has already been chosen).
      html += `<p class="plain-text">${escapeHtml(foreOfficeData.exhortationOmittedText)}</p>`;
    } else {
      const ex = exhortationChoice === "short" ? exShort : exLong;
      html += renderBilingualLine(ex.text, undefined, ex.dropcap, true);
    }

    const gc = foreOfficeData.generalConfession;
    html += `<div class="section-heading">${escapeHtml(gc.heading)}</div>`;
    html += `<p class="rubric">${renderRubricText(gc.rubric)}</p>`;
    html += renderBilingualLine(gc.text, undefined, gc.dropcap, true);

    const abs = foreOfficeData.absolution;
    html += `<div class="section-heading">${escapeHtml(abs.heading)}</div>`;
    if (ministerRank === "priest") {
      html += `<p class="rubric">${renderRubricText(abs.priestRubric)}</p>`;
      html += `<p class="rubric">${renderRubricText(abs.priestNoteRubric)}</p>`;
      html += renderBilingualLine(abs.fullText, undefined, true, true);
      html += `<p class="rubric">or,</p>`;
      html += renderBilingualLine(abs.shortText, undefined, true, true);
    } else {
      html += `<p class="rubric">${renderRubricText(abs.noPriestRubric)}</p>`;
      html += renderBilingualLine(abs.noPriestText, undefined, true, true);
    }

    const lp = foreOfficeData.lordsPrayerAndAve;
    html += `<div class="section-heading">${escapeHtml(lp.heading)}</div>`;
    html += `<p class="rubric">${renderRubricText(lp.rubric)}</p>`;
    html += renderBilingualLine(lp.lordsPrayerText, undefined, true, true);
    html += renderBilingualLine(lp.aveText, undefined, true, true);

    return html;
  }

  function renderPlaceholder(key, resolved, sec) {
    if (key === "foreOffice") return renderForeOffice(resolved);
    if (key === "invitatoryHymnSlot") {
      // George's 10/8 note: "When the Invitatory is omitted (the
      // Venite), the Invitatory Hymn is omitted." The Invitatory Hymn
      // is, by its own name and placement (Mattins.tex line 93's "After
      // the Venite, a Hymn may be sung"), an appendage to the Venite
      // itself, not an independent element - on the handful of days the
      // Venite is dropped outright (isVeniteOmittedToday: Maundy
      // Thursday/Good Friday/Easter Even unconditionally, Ash Wednesday
      // when that toggle is set), there is no Venite for it to follow,
      // so nothing is shown here either, matching the Venite slot's own
      // omission. Every other day is unaffected.
      if (resolved && typeof isVeniteOmittedToday === "function" && isVeniteOmittedToday(resolved)) return "";
      // George's 9/1 note: Mattins.tex line 93's "Note, After the Venite,
      // a Hymn may be sung" rubric (line 93-94 comment: "Rubric added to
      // permit the Invitatory Hymn") is a DIFFERENT hymn slot than the one
      // right before the Benedictus (see the "hymnSlot" case below) - the
      // Breviary's pages/FerialHymns/FerialHymns.tex has two entirely
      // separate `\section`s, "Invitatory Hymns" and "Office Hymns", each
      // with their own full set of 8 ferial texts (Sunday in Summer/
      // Winter, Monday-Saturday). This site used to render the SAME
      // "Office Hymns" text at both slots, because both placeholders
      // shared the key "hymnSlot" - the second occurrence was even
      // explicitly suppressed with a "no separate hymn here" note. That
      // was wrong: the Invitatory Hymns were never sourced or shown at
      // all. Fixed by giving this slot its own key + its own
      // invitatoryHymnOptions data (parsed from FerialHymns.tex's
      // "Invitatory Hymns" section, verified line-by-line against the
      // source), reusing pickOfficeHymnSeason(resolved, "mattins") since
      // the Summer/Winter Sunday rubric wording is identical between the
      // two sections.
      //
      // George's 9/4 note via Augustine (task #148): "The Invitatory
      // Hymn... should be of St. Gorazde [a Common-of-Martyrs feast]" -
      // this WAS an honest gap (the 9/1 comment above originally said "no
      // feast/season-proper Invitatory Hymn override exists in this
      // Breviary edition's data," which turned out to be wrong, not a
      // deliberate scope decision - pages/Commons/Commons.tex DOES give
      // each Common its own `\mattinsInvitatoryHymn`, parallel to the
      // `\mattinsOfficeHymn` the Office Hymn slot below was already using).
      // Mirrors that same slot's own priority logic (winner==="feast" ->
      // today's own proper text if sourced, else the matching Common's;
      // winner==="season" -> the periodKey's own proper text if sourced)
      // via the same `invitatoryHymn` field now added to a subset of
      // `data/feast-office-hymns.json`'s `commons` entries - NOT yet a
      // complete transcription of every Common (Commons.tex cross-
      // references several Invitatory Hymns as "same text as the Common's
      // own First Evensong Hymn" or "same as stanzas 4-5 of the Common of
      // Virgins" rather than printing an independent text, which needs
      // its own separate sourcing pass; see ROADMAP.md for exactly which
      // of the 11 Commons are covered so far: CommonApostles, CommonMartyrs
      // (+ CommonMartyrsEaster, which explicitly reuses CommonMartyrs' own
      // text per its own rubric), and CommonBVM). No Sanctorale entry (an
      // individually-sourced Saint, as opposed to a Common) has its own
      // separate Invitatory Hymn transcribed yet either - same honest gap,
      // not yet attempted. Falls through to the ferial cycle exactly as
      // before whenever no override is found, so every previously-correct
      // ferial day is completely unaffected.
      let invitatoryFeastEntry = null;
      if (window.FEAST_OFFICE_HYMNS) {
        const feastData = window.FEAST_OFFICE_HYMNS;
        const resolution = typeof resolveMassPropersWinner === "function" ? resolveMassPropersWinner(resolved) : null;
        if (resolution && resolution.winner === "feast" && resolved.kalendarKey) {
          const own = feastData.sanctorale[resolved.kalendarKey];
          if (own && own.invitatoryHymn) {
            invitatoryFeastEntry = own;
          } else {
            const shortName = (resolution.sanctorale && resolution.sanctorale.name) || "";
            const kalendarEntries = resolved.kalendar || [];
            const kalendarMatch = kalendarEntries.find((k) => k.name && shortName && k.name.indexOf(shortName) === 0);
            const feastName = (kalendarMatch && kalendarMatch.name) || shortName;
            const seasonKeyToday = typeof seasonKeyFor === "function" ? seasonKeyFor(resolved.periodKey) : null;
            const eastertideToday = seasonKeyToday === "eastertide" || seasonKeyToday === "ascensiontide";
            const commonLabel = typeof pickFeastCommonHymnLabel === "function" ? pickFeastCommonHymnLabel(feastName, eastertideToday) : null;
            const commonEntry = commonLabel && feastData.commons[commonLabel];
            if (commonEntry && commonEntry.invitatoryHymn) invitatoryFeastEntry = commonEntry;
          }
        } else if (resolution && resolution.winner === "season") {
          const seasonEntry = feastData.temporale[resolved.periodKey];
          if (seasonEntry && !seasonEntry.unreachable && seasonEntry.invitatoryHymn) invitatoryFeastEntry = seasonEntry;
        }
      }
      if (invitatoryFeastEntry) {
        let html = `<div class="section-heading">${escapeHtml("Invitatory Hymn (" + invitatoryFeastEntry.name + ")")}</div>`;
        html += invitatoryFeastEntry.invitatoryHymn.map((stanza, i) => renderHymnStanza(stanza, i === 0)).join("");
        return html;
      }

      const seasonKey = typeof pickOfficeHymnSeason === "function" ? pickOfficeHymnSeason(resolved, "mattins") : null;
      const h = (currentTemplate.invitatoryHymnOptions || []).find((o) => o.season === seasonKey);
      if (!h) return `<div class="placeholder-block"><span class="missing">No Invitatory Hymn text is prescribed by this Prayer Book here - the rubric permits "a Hymn" at the choice of the minister or congregation. See ROADMAP.md.</span></div>`;
      let html = `<div class="section-heading">${escapeHtml(h.heading)}</div>`;
      html += h.textLines.map((stanza, i) => renderHymnStanza(stanza, i === 0)).join("");
      return html;
    }
    if (key === "hymnSlot") {
      // pages/Office/Mattins.tex/Evensong.tex only say "a Hymn" may be
      // sung ("a," not "the" - the minister/congregation's own choice),
      // with no text of their own - but the Breviary (sourced 8/24, see
      // ROADMAP.md and Questions-for-Augustine.md Q5) does give a real
      // ferial Office Hymn per weekday per Hour, in
      // pages/FerialHymns/FerialHymns.tex. That's what's rendered here
      // now, via pickOfficeHymnSeason + mattinsHymnOptions/
      // evensongHymnOptions (mirroring Compline's existing seasonal-hymn
      // pattern). This is honestly only the FERIAL cycle, not yet a
      // feast/season-proper hymn override on days that would have one -
      // see Q5 in Questions-for-Augustine.md and the note in ROADMAP.md.
      //
      // Mattins genuinely has two distinct "a Hymn may be said" rubrics
      // in the source - "Note, After the Venite, a Hymn may be sung"
      // (Mattins.tex line 93-94, the Invitatory Hymn - see the
      // "invitatoryHymnSlot" case above, George's 9/1 fix) and "After
      // [the Second Lesson]... a Hymn" (line 279, right before
      // Benedictus, this Office Hymn) - NOT "after each Lesson" as an
      // earlier pass here wrongly assumed (8/26 fix, per Augustine's
      // review: the Office Hymn was misplaced after the First Lesson,
      // which has no rubric basis at all; moved to its correct place
      // right before the Benedictus, see mattins-template.json). The two
      // slots used to collide (both keyed "hymnSlot", second occurrence
      // suppressed) until the 9/1 fix gave the Venite slot its own key
      // and its own sourced Invitatory Hymn text.
      const hourKey = currentHour === "mattins" ? "mattins" : "evensong";
      const hymnField = hourKey + "Hymn"; // "mattinsHymn" / "evensongHymn" in data/feast-office-hymns.json

      // 8/28 feature: feast/season-proper Office Hymns, sourced from the
      // Breviary's Sanctorale.tex, Commons.tex, and PropSeas.tex (see
      // ROADMAP.md, "feast/season Office Hymns" entry, for the full
      // sourcing/verification trail and honest scope notes). Priority,
      // mirroring how resolveMassPropersWinner already distinguishes a
      // Sanctorale-feast day from a Temporale season/day:
      //   1. winner === "feast": today's own proper hymn (25 Sanctorale
      //      entries with real Breviary text) if it exists; else the
      //      matching Common of Saints' hymn (11 Commons, mapped from the
      //      feast's name via pickFeastCommonHymnLabel).
      //   2. winner === "season": today's periodKey's own proper hymn (16
      //      Temporale occasions - major feasts/Sundays of the Temporale
      //      cycle) if sourced.
      //   3. Neither found (the large majority of ordinary weekdays and
      //      lesser feasts with no proper hymn of their own in this
      //      source) - fall through to the existing ferial cycle below,
      //      unchanged.
      let feastEntry = null;
      if (window.FEAST_OFFICE_HYMNS) {
        const feastData = window.FEAST_OFFICE_HYMNS;
        const resolution = typeof resolveMassPropersWinner === "function" ? resolveMassPropersWinner(resolved) : null;
        if (resolution && resolution.winner === "feast" && resolved.kalendarKey) {
          const own = feastData.sanctorale[resolved.kalendarKey];
          if (own && own[hymnField]) {
            feastEntry = own;
          } else {
            // data/collects-sanctorale.json's own "name" field is often
            // truncated to just the proper name (e.g. "St. Andrew", with
            // no "Apostle"/"Bishop"/etc suffix) - data/kalendar.json's
            // "name" is fuller (e.g. "St. Andrew, Apostle") and is what
            // pickFeastCommonHymnLabel's regexes actually need. Kalendar
            // entries can list more than one commemoration for a date, so
            // match by prefix against the (shorter) collects name to find
            // the one that's actually today's winning feast.
            const shortName = (resolution.sanctorale && resolution.sanctorale.name) || "";
            const kalendarEntries = resolved.kalendar || [];
            const kalendarMatch = kalendarEntries.find((k) => k.name && shortName && k.name.indexOf(shortName) === 0);
            const feastName = (kalendarMatch && kalendarMatch.name) || shortName;
            const seasonKeyToday = typeof seasonKeyFor === "function" ? seasonKeyFor(resolved.periodKey) : null;
            const eastertideToday = seasonKeyToday === "eastertide" || seasonKeyToday === "ascensiontide";
            const commonLabel = typeof pickFeastCommonHymnLabel === "function" ? pickFeastCommonHymnLabel(feastName, eastertideToday) : null;
            const commonEntry = commonLabel && feastData.commons[commonLabel];
            if (commonEntry && commonEntry[hymnField]) feastEntry = commonEntry;
          }
        } else if (resolution && resolution.winner === "season") {
          const seasonEntry = feastData.temporale[resolved.periodKey];
          if (seasonEntry && !seasonEntry.unreachable && seasonEntry[hymnField]) feastEntry = seasonEntry;
        }
      }
      // George's 9/1 note: "The Versicle also needs to be provided after
      // the Office Hymn." FerialHymns.tex gives each of the 15 ferial
      // Office Hymn subsections (Sunday Mattins in Winter/Summer, Sunday
      // Evensong, Monday-Saturday Mattins/Evensong) its own trailing
      // ℣./℟. pair right after the hymn's last stanza - sourced and
      // added to mattinsHymnOptions/evensongHymnOptions as a `versicle`
      // field (English only; the source gives no Latin here, unlike the
      // Venite/Psalm versicles elsewhere in this Breviary). Note this
      // versicle is keyed by WEEKDAY, not by which hymn text is sung -
      // every non-Sunday weekday at a given Hour shares the identical
      // ℣./℟. (Mon-Fri at Evensong: "Lord, let my prayer be set forth...";
      // Mon-Sat at Mattins: "O satisfy us with thy mercy..."), only Sunday
      // and (at Evensong) Saturday differing - confirming it belongs to
      // the Hour's ferial weekday cycle itself, same as the Little Hours'
      // own fixed per-Hour versicles elsewhere on this site, rather than
      // to the particular hymn printed above it.
      //
      // George's 10/20 note: "In Evensong on Feast Days, the Versicle and
      // Response is missing after the Office Hymn." Root cause: this used
      // to `return` straight out of the `feastEntry` branch above before
      // ever reaching this lookup, so a winning Feast's own proper hymn
      // (or its Common's) always rendered with no trailing ℣./℟. at all -
      // the 52 feast/season-proper Office Hymn overrides (data/feast-
      // office-hymns.json, task #90) have never had a versicle of their
      // own sourced for them individually. Fixed by falling through to
      // this same by-weekday lookup regardless of which hymn text was
      // printed above, since (per the note just above) that versicle
      // isn't proper to the ferial hymn text anyway, but to the Hour and
      // weekday - so it's the honest, already-sourced text to show here
      // too, rather than silently showing nothing. A feast-specific
      // versicle of its own, if one is ever sourced, would simply take
      // priority by being added to feastEntry and checked first.
      const optList = hourKey === "mattins" ? currentTemplate.mattinsHymnOptions : currentTemplate.evensongHymnOptions;
      const seasonKey = typeof pickOfficeHymnSeason === "function" ? pickOfficeHymnSeason(resolved, hourKey) : null;
      const h = (optList || []).find((o) => o.season === seasonKey);
      const versicle = (feastEntry && feastEntry.versicle) || (h && h.versicle);
      let html;
      if (feastEntry) {
        html = `<div class="section-heading">${escapeHtml("Office Hymn (" + feastEntry.name + ")")}</div>`;
        html += feastEntry[hymnField].map((stanza, i) => renderHymnStanza(stanza, i === 0)).join("");
      } else if (h) {
        html = `<div class="section-heading">${escapeHtml(h.heading)}</div>`;
        html += h.textLines.map((stanza, i) => renderHymnStanza(stanza, i === 0)).join("");
      } else {
        return `<div class="placeholder-block"><span class="missing">No Office Hymn text is prescribed by this Prayer Book here - the rubric permits "a Hymn" at the choice of the minister or congregation. See ROADMAP.md.</span></div>`;
      }
      // No Latin equivalent given in the source (renderVersicleLine
      // already handles that honestly rather than fabricating one).
      if (versicle) {
        html += renderVersicleLine(versicle.v, undefined, "versicle");
        html += renderVersicleLine(versicle.r, undefined, "response");
      }
      return html;
    }
    if (key === "psalms") {
      const monthlySlot = HOUR_MONTHLY_SLOT[currentHour] || "evening";
      // Bug found alongside the Sanctorale Psalms/Lessons gap: this used
      // to ask resolvePsalmsForDay to read resolved.lectionary.psalms
      // directly, a flat field that never actually exists on this data
      // (the real shape nests psalms under .mattins/.evensongI/
      // .evensongII - see calendar.js) - so the Temporale's own Proper
      // Psalms (e.g. Christmas Day's 19, 45, 85 at Mattins) were never
      // once displayed; every day silently fell back to the Monthly
      // Psalter cycle instead. pickLectionarySlot already resolves the
      // correct slot object for Lessons below - reusing it here fixes
      // Psalms the same way, and also picks up a winning Feast's own
      // Psalms via the lectionary-festivals.json lookup added above.
      const lectionarySlot = pickLectionarySlot(resolved);
      // Task #170: on a Sunday Second Class or lower whose own Proper
      // Psalms aren't already superseded by a winning Feast, Augustine's
      // 9/5 answer makes those Proper Psalms optional against the 30-Day
      // Monthly Psalter default - see resolveEffectiveProperPsalms and
      // isSundayPsalmsOptional above pickLectionarySlot for the exact
      // scoping rule.
      const properPsalms = resolveEffectiveProperPsalms(resolved, lectionarySlot);
      // George's 10/7 note: the Table-of-Concurrence displacement swap
      // (renderResolved, used as this module's `resolved` throughout a
      // displaced I Evensong) carries tomorrow's date, which is correct
      // for the Collect/Lessons/proper-Psalms decision above but wrong
      // for the 30-Day Monthly Psalter's day-of-month fallback below -
      // resolvePsalmsForDay reads resolved.date.getUTCDate() directly,
      // so left unguarded it quietly renders tomorrow's monthly-cycle
      // Psalms instead of tonight's own. Mirrors the same
      // usingDisplacedFerial guard already applied in pickLectionarySlot
      // above for the parallel Lessons bug; only matters when
      // properPsalms is falsy, since resolvePsalmsForDay returns early
      // on a Proper hit before ever touching .date.
      const usingDisplacedFerialPsalms = currentHour === "evensong" && eveningDisplacement && eveningDisplacement.todayResolved;
      const psalmDayResolved = usingDisplacedFerialPsalms ? eveningDisplacement.todayResolved : resolved;
      const { entries } = resolvePsalmsForDay(psalmDayResolved, psalterData, monthlySlot, properPsalms);
      if (entries.length === 0) return `<div class="placeholder-block"><span class="missing">No psalms resolved for this day yet.</span></div>`;
      // Task #170: the toggle only ever appears when there's an actual
      // choice to make - a Sunday Second Class or lower whose own Proper
      // Psalms exist (lectionarySlot.psalms truthy) and aren't already
      // overridden by a winning Feast (isSundayPsalmsOptional already
      // checks that). First Class Sundays, plain ferias with no Proper of
      // their own, and days a Feast wins outright all render no toggle.
      const showSundayPsalterToggle = isSundayPsalmsOptional(resolved) && !!(lectionarySlot && lectionarySlot.psalms);
      const sundayPsalterToggleHtml = showSundayPsalterToggle
        ? renderInlineToggle("sundayPsalter", [
            { value: "monthly", label: "30-Day Psalter" },
            { value: "proper", label: "Sunday Psalms" },
          ], sundayPsalterChoice)
        : "";
      // Evensong's own gloriaChoice toggle (right after this section)
      // already supplies the closing doxology for the whole group of
      // Psalms - see the omitGloria comment in psalms.js - so only
      // Evensong's own last Psalm skips its individual Gloria Patri;
      // every other Hour's Psalms (and every non-last Evensong Psalm)
      // keep theirs exactly as before.
      // George's 9/1 note, task #119: pass today's weekday (lowercase, per
      // data/psalter.json's antiphonByWeekday keys) so Psalm 51 - the one
      // psalm in Psal.tex whose antiphon varies by day rather than being
      // fixed - can resolve the right one; every other psalm's antiphon
      // ignores this argument entirely (see resolvePsalmAntiphons).
      const weekdayName = resolved.weekdayName ? resolved.weekdayName.toLowerCase() : null;
      // George's 9/2 note, task #139: "When a feast day's rank is double
      // or higher the antiphon for the psalms and canticles is said in
      // full before and after." Scoped literally to a winning FEAST (not
      // a Sunday, which the note doesn't mention) at Double tier or
      // above (RANK_TIER 4+: Double, Greater Double, 2nd Double, 1st
      // Double) - Semidouble/Memorial/Simple feasts and plain season
      // days keep the ordinary incipit-before/full-after convention.
      const rankFeastInfo = resolveFeastRankToday(resolved);
      const fullAntiphonBefore = !!(rankFeastInfo.winner === "feast" && window.Ranking && (window.Ranking.RANK_TIER[rankFeastInfo.rank] || 0) >= 4);
      // George's 9/2 note, task #141: "If it's a feast day it should pull
      // the festal antiphons for the Psalms." Temporale.tex/Sanctorale.tex
      // give some named Sundays/Feasts their own proper Psalm antiphon
      // (`\psalmAntiphon{}`, sourced alongside task #120's Benedictus/
      // Magnificat antiphons, same day-keyed fields) - ONE antiphon
      // covering the WHOLE group of psalms for the Hour (not one per
      // psalm, unlike Psal.tex's own Monthly Psalter antiphons), said
      // once before the first Psalm and once in full after the last,
      // replacing the individual per-psalm antiphons for the day. Reuses
      // resolveMassPropersWinner's own decision (same "which proper wins"
      // choice already trusted for the Collect and the Benedictus/
      // Magnificat antiphon) so this antiphon always agrees with whatever
      // else is showing for the day.
      const propersResolution = resolveMassPropersWinner(resolved);
      let festalPsalmAntiphon = null;
      if (propersResolution) {
        const { seasonEntry, sanctorale, decision } = propersResolution;
        let primaryEntry;
        if (sanctorale && seasonEntry && decision) {
          primaryEntry = decision.winner === "feast" ? sanctorale : seasonEntry;
        } else {
          primaryEntry = sanctorale || seasonEntry || null;
        }
        // George's 9/2 note, task #141: same fix as the Benedictus/
        // Magnificat antiphon above - a named Sunday's own group Psalm
        // antiphon (e.g. "Epiphany I") is proper to that Sunday, not to
        // every plain feria in the week that follows it; only apply it on
        // the actual Sunday, or when a real Feast (proper to its own
        // date) is winning. An ordinary feria falls through to the
        // normal per-psalm Psal.tex antiphons below instead (there is no
        // FerialHymns.tex group-Psalm-antiphon equivalent to fall back
        // to, unlike the Benedictus/Magnificat case).
        const isSunday = resolved.date && resolved.date.getUTCDay() === 0;
        const primaryEntryIsPlainSeasonFeria = primaryEntry === seasonEntry && !isSunday;
        if (primaryEntry && !primaryEntryIsPlainSeasonFeria) {
          festalPsalmAntiphon = currentHour === "mattins"
            ? primaryEntry.psalmAntiphon
            : pickEvensongAntiphonVariant(primaryEntry.firstEvensongPsalmAntiphon, primaryEntry.secondEvensongPsalmAntiphon);
        }
        // George's 9/8 note, task #185: "If it [the Feast] lack anything,
        // then its listed Common should be used for whatever else is
        // needed" - the same Feast-then-Common priority already used for
        // the Office Hymn (pickFeastCommonHymnLabel, task #90) had never
        // been extended to this group Psalm antiphon, so a winning Feast
        // with no `psalmAntiphon` of its own (most of them - only a
        // subset of Sanctorale entries have one sourced directly) fell
        // straight through to the plain ferial Psal.tex antiphons below,
        // skipping its Common entirely. Sourced from Commons.tex's own
        // `\psalmAntiphon{}` lines (data/feast-office-hymns.json's
        // `commons` block, extended alongside its existing hymn fields).
        // Only applies when a real Feast is winning (never to the season,
        // which has its own separate, correct "no fallback" comment
        // above) and only as a fallback when the Feast's own antiphon is
        // genuinely absent.
        if (!festalPsalmAntiphon && decision && decision.winner === "feast" && sanctorale && window.FEAST_OFFICE_HYMNS) {
          const shortName = sanctorale.name || "";
          const kalendarEntries = resolved.kalendar || [];
          const kalendarMatch = kalendarEntries.find((k) => k.name && shortName && k.name.indexOf(shortName) === 0);
          const feastName = (kalendarMatch && kalendarMatch.name) || shortName;
          const seasonKeyToday = typeof seasonKeyFor === "function" ? seasonKeyFor(resolved.periodKey) : null;
          const eastertideToday = seasonKeyToday === "eastertide" || seasonKeyToday === "ascensiontide";
          const commonLabel = typeof pickFeastCommonHymnLabel === "function" ? pickFeastCommonHymnLabel(feastName, eastertideToday) : null;
          const commonEntry = commonLabel && window.FEAST_OFFICE_HYMNS.commons[commonLabel];
          if (commonEntry) {
            festalPsalmAntiphon = currentHour === "mattins"
              ? commonEntry.psalmAntiphon
              : pickEvensongAntiphonVariant(commonEntry.firstEvensongPsalmAntiphon, commonEntry.secondEvensongPsalmAntiphon);
          }
        }
      }
      if (festalPsalmAntiphon) {
        const beforeText = fullAntiphonBefore ? festalPsalmAntiphon.text : (festalPsalmAntiphon.incipit || festalPsalmAntiphon.text);
        let html = `<p class="antiphon">${escapeHtml(beforeText)}</p>`;
        html += entries.map((e, i) => {
          const isLastEvensongPsalm = currentHour === "evensong" && i === entries.length - 1;
          return renderPsalmHtml(e.num, psalterData, e.range, isLastEvensongPsalm, weekdayName, fullAntiphonBefore, true, true);
        }).join("");
        // Mattins has no equivalent "deferred to the Gloria choice"
        // mechanism (that's an Evensong-only structure, task #143), so
        // the group's "after" antiphon simply prints here, right after
        // the last Psalm. Evensong's own "after" text is deferred to the
        // Gloria in excelsis/Gloria Patri position instead, matching
        // task #143's placement rule - see renderDeferredLastPsalmAntiphon.
        if (currentHour !== "evensong") {
          html += `<p class="antiphon">${escapeHtml(festalPsalmAntiphon.text)}</p>`;
        }
        return sundayPsalterToggleHtml + html;
      }
      // George's 9/2 note, task #143: Evensong's last Psalm shouldn't
      // print its own "after" antiphon here - it's shown instead right
      // after the Gloria in excelsis/Gloria Patri choice that follows
      // this whole section (see the "gloriaChoice" case), still ahead of
      // the First Lesson, matching the same "the group's own closing act
      // supplies it, not the individual Psalm" idea already used for
      // `omitGloria`.
      return sundayPsalterToggleHtml + entries.map((e, i) => {
        const isLastEvensongPsalm = currentHour === "evensong" && i === entries.length - 1;
        return renderPsalmHtml(e.num, psalterData, e.range, isLastEvensongPsalm, weekdayName, fullAntiphonBefore, isLastEvensongPsalm);
      }).join("");
    }
    if (key === "benedictusAntiphon" || key === "magnificatAntiphon") {
      // George's 9/1 note, task #120: "the Antiphons before and after the
      // Benedictus/Magnificat should also be provided." Sourced from
      // pages/Propers/Temporale.tex and Sanctorale.tex, which give many
      // (not all) named days their own proper Benedictus (Mattins) and
      // Magnificat (First/Second Evensong) antiphon - distinct from, and
      // in addition to, the Monthly Psalter's own per-psalm antiphons
      // (task #119). Sunday/Feast-level entries are sourced here
      // (`\properantiphon{}`/`\firstEvensongAntiphon{}`/`\mattinsAntiphon{}`/
      // `\secondEvensongAntiphon{}`, keyed to the exact same feast names/
      // dates already used by collects-temporale.json/
      // collects-sanctorale.json), with a plain-ferial fallback (task
      // #141, see below) for ordinary weekdays with no Sunday/Feast
      // antiphon of their own. The source also has a THIRD, much larger
      // family of ferial-within-a-named-week antiphons (`\antiphon{Ben.}`/
      // `\antiphon{Mag.}` in Temporale.tex specifically, distinct per
      // weekday-within-a-specific-week-of-a-season, e.g. "Monday in
      // Advent I Week" carrying different text from "Monday in Advent II
      // Week") that would need a new day-of-week-within-season calendar
      // key this site doesn't yet resolve anywhere else - left out as a
      // documented follow-up rather than guessing at a mapping; not to be
      // confused with FerialHymns.tex's own plain (non-seasonal) ferial
      // antiphons, which ARE now sourced below. Renders nothing on any
      // day with none of these three sources available, same honest-
      // fallback convention as every other antiphon on this site
      // (Compline, the Little Hours, the Psalter).
      const resolution = resolveMassPropersWinner(resolved);
      if (!resolution) return "";
      const { seasonEntry, sanctorale, decision } = resolution;
      // Same "which proper actually wins the day" choice already used by
      // renderCommemoratedOration for the Collect/Secret/Postcommunion -
      // reusing resolveMassPropersWinner's own decision rather than
      // re-deriving it, so the antiphon always agrees with which Collect
      // is showing above it.
      let primaryEntry;
      if (sanctorale && seasonEntry && decision) {
        primaryEntry = decision.winner === "feast" ? sanctorale : seasonEntry;
      } else {
        primaryEntry = sanctorale || seasonEntry || null;
      }
      if (!primaryEntry) return "";
      // George's 9/2 note, task #141: a plain weekday feria within a
      // season week should NOT keep re-showing that week's Sunday-proper
      // antiphon every day - only the Sunday itself (or an actual winning
      // Feast, whose Collect/antiphon is proper to its own date whatever
      // weekday it falls on) gets the season/sanctorale antiphon above;
      // an ordinary feria falls through to the FerialHymns.tex fallback
      // below instead. This mirrors task #120's pre-existing Collect
      // carry-over-all-week behavior (which stays correct and untouched -
      // Western Rite rubric does say the Sunday Collect stands all week)
      // while fixing the antiphon specifically, which the source doesn't
      // carry over the same way.
      const isSunday = resolved.date && resolved.date.getUTCDay() === 0;
      const primaryEntryIsPlainSeasonFeria = primaryEntry === seasonEntry && !isSunday;
      let ant;
      if (primaryEntryIsPlainSeasonFeria) {
        ant = undefined;
      } else if (key === "benedictusAntiphon") {
        ant = primaryEntry.benedictusAntiphon;
      } else {
        // George's 10/20 note, task #91: on a feast with a distinct
        // First and Second Evensong Magnificat antiphon pair, which one
        // is "this evening's" depends on whether tonight is First
        // Evensong (eveningDisplacement set - tonight anticipates this
        // same feast, found via `resolved`) or the feast's own Second
        // Evensong (no displacement) - see pickEvensongAntiphonVariant's
        // own comment above resolveMassPropersWinner for the full
        // rationale. Most sourced days only ever have one Magnificat
        // antiphon total, not a distinct pair, so either direction just
        // falls back to whichever one the day actually has.
        ant = pickEvensongAntiphonVariant(primaryEntry.firstEvensongMagnificatAntiphon, primaryEntry.secondEvensongMagnificatAntiphon);
      }
      // George's 9/8 note, task #185: same Feast-then-Common priority as
      // the Office Hymn (pickFeastCommonHymnLabel, task #90) and the
      // group Psalm antiphon fix just above - a winning Feast with no
      // Benedictus/Magnificat antiphon of its own should fall to its
      // listed Common's antiphon (Commons.tex's own `\antiphon{Ben.}{}`/
      // `\antiphon{Mag.}{}` lines, newly added to data/feast-office-
      // hymns.json's `commons` block) BEFORE falling all the way through
      // to the plain ferial-weekday antiphon below. Only applies when a
      // real Feast is winning (primaryEntry === sanctorale) and only when
      // that Feast's own antiphon is genuinely absent.
      if (!ant && decision && decision.winner === "feast" && primaryEntry === sanctorale && window.FEAST_OFFICE_HYMNS) {
        const shortName = sanctorale.name || "";
        const kalendarEntries = resolved.kalendar || [];
        const kalendarMatch = kalendarEntries.find((k) => k.name && shortName && k.name.indexOf(shortName) === 0);
        const feastName = (kalendarMatch && kalendarMatch.name) || shortName;
        const seasonKeyToday = typeof seasonKeyFor === "function" ? seasonKeyFor(resolved.periodKey) : null;
        const eastertideToday = seasonKeyToday === "eastertide" || seasonKeyToday === "ascensiontide";
        const commonLabel = typeof pickFeastCommonHymnLabel === "function" ? pickFeastCommonHymnLabel(feastName, eastertideToday) : null;
        const commonEntry = commonLabel && window.FEAST_OFFICE_HYMNS.commons[commonLabel];
        if (commonEntry) {
          ant = key === "benedictusAntiphon"
            ? commonEntry.benedictusAntiphon
            : pickEvensongAntiphonVariant(commonEntry.firstEvensongMagnificatAntiphon, commonEntry.secondEvensongMagnificatAntiphon);
        }
      }
      // George's 9/2 note, task #141: "if it's a feria you'll get the
      // antiphon from the ferial hymns" - FerialHymns.tex gives its own
      // Benedictus antiphon (Mattins) and Magnificat antiphon (Evensong)
      // for each weekday Monday-Saturday (`\antiphon{Ben.}`/`\antiphon{
      // Mag.}`, right alongside that same weekday's already-sourced
      // Office Hymn, task #90) - previously left as a documented
      // follow-up rather than a day-of-week-within-season mapping this
      // site didn't resolve; that gap turned out unnecessary; these
      // antiphons are keyed by plain weekday, the exact same key
      // `pickOfficeHymnSeason` already resolves for the Office Hymn
      // itself. Only used as a fallback when no Sunday/Feast-proper
      // antiphon was found above - a feast's own antiphon always wins
      // when one exists. Saturday has no sourced Magnificat antiphon in
      // the source at all (FerialHymns.tex's own Saturday Evensong
      // subsection has no `\antiphon{Mag.}` line) - honestly renders
      // nothing there rather than fabricate one.
      if (!ant) {
        const hourKey = currentHour === "mattins" ? "mattins" : "evensong";
        const seasonKey = typeof pickOfficeHymnSeason === "function" ? pickOfficeHymnSeason(resolved, hourKey) : null;
        const optList = hourKey === "mattins" ? currentTemplate.mattinsHymnOptions : currentTemplate.evensongHymnOptions;
        const opt = (optList || []).find((o) => o.season === seasonKey);
        ant = opt && (key === "benedictusAntiphon" ? opt.benedictusAntiphon : opt.magnificatAntiphon);
      }
      if (!ant) return "";
      // George's 9/2 note, task #139: on a Double+ ranked Feast, this
      // canticle antiphon (like the Psalter's own) is said in full both
      // before and after, not just incipit-before. Reuses this same
      // resolution's own `winner`/`sanctoraleRank` rather than calling
      // resolveFeastRankToday separately, so it can never disagree with
      // which entry (`primaryEntry`) is actually supplying the antiphon
      // text above.
      const fullBefore = resolution.winner === "feast" && window.Ranking && (window.Ranking.RANK_TIER[resolution.sanctoraleRank] || 0) >= 4;
      const showText = (sec && sec.position === "before" && !fullBefore) ? ant.incipit : ant.text;
      return `<p class="antiphon">${escapeHtml(showText)}</p>`;
    }
    if (key === "lesson1" || key === "lesson2") {
      const slot = pickLectionarySlot(resolved);
      const citation = slot && slot[key];
      if (!citation) {
        return `<div class="placeholder-block"><span class="missing">No lesson resolved for this day/Hour yet (see ROADMAP.md).</span></div>`;
      }
      const result = (window.Scripture && kjvData) ? window.Scripture.resolveCitation(citation, kjvData, apocryphaData) : { ok: false, reason: "unparsed" };
      if (result.ok) {
        const text = result.verses.map((v) => v.text).join(" ");
        // "Here beginneth.../Here endeth..." per Mattins.tex's rubric
        // ("the Minister shall say, Here beginneth [such a] Chapter of
        // [such a] Book; and after every Lesson, Here endeth the First
        // Lesson") - built dynamically from the actual citation instead
        // of leaving that as a generic instruction to the reader. Uses
        // the book's full 1611 KJV running-header title ("the First Book
        // of Samuel"), not the citation's own abbreviation, per
        // Augustine's 8/26 review ("the full title of the book, as in
        // the 1611 King James Bible should be used").
        const fullTitle = (window.Scripture.BOOK_FULL_TITLES && window.Scripture.BOOK_FULL_TITLES[result.book]) || result.book;
        const firstChapter = result.verses[0] && result.verses[0].chapter;
        const beginning = firstChapter ? `Here beginneth the ${ordinalWords(firstChapter)} Chapter of the ${fullTitle}.` : `Here beginneth the ${fullTitle}.`;
        const ending = `Here endeth the ${key === "lesson1" ? "First" : "Second"} Lesson.`;
        // The citation line itself only needs its book abbreviation
        // expanded to the same short canonical name resolveCitation
        // already resolved against (e.g. "1 Sam" -> "1 Samuel"), not the
        // full running-header title - Augustine's own example just asked
        // that "Sam" be "written out fully to Samuel".
        const prettyCitation = result.alias ? result.book + citation.slice(result.alias.length) : citation;
        return `<div class="lesson-block"><div class="lesson-citation">${escapeHtml(prettyCitation)}</div><p class="rubric-black">${escapeHtml(beginning)}</p><p class="lesson-text">${withDropcap(text, true)}</p><p class="rubric-black">${escapeHtml(ending)}</p></div>`;
      }
      let note;
      if (result.reason === "apocrypha") {
        note = `This reading is from the Apocrypha (${escapeHtml(result.book || "")}). This prototype has KJV Apocrypha text only for the specific chapters the Lectionary actually cites, and this particular passage isn't among them yet. The citation above is exactly what the Lectionary appoints for today.`;
      } else {
        note = `This citation couldn't be automatically resolved to scripture text in this prototype (see ROADMAP.md). It is exactly what the Lectionary appoints for today.`;
      }
      return `<div class="placeholder-block"><span class="citation">${escapeHtml(citation)}</span><br/><span class="missing">${note}</span></div>`;
    }
    if (key === "collectOfDay") {
      // George's note: "today is a Saturday office of the BVM, but
      // Matins and Vespers is treating it as just a saturday." Scoped to
      // `currentPage === "office"` only - this same "collectOfDay"
      // placeholder key is also used by the Mass page (via
      // data/mass-ordinary.json), whose own Collect-of-the-day decision
      // (and the separate, opt-in Votive Mass of Our Lady on Saturday,
      // task #201) is deliberately left untouched by this fix - see
      // isOfficeOfOurLadyToday above for why the two have different
      // thresholds and aren't merged.
      if (currentPage === "office" && isOfficeOfOurLadyToday(resolved, resolveFeastRankToday(resolved))) {
        const bvmCollect = bvmSaturdayCollectText(resolved);
        if (bvmCollect) {
          return `<div class="collect-heading">Collect: Of Our Lady on Saturday</div><p class="collect-block">${withDropcap(bvmCollect, true)}</p>`;
        }
      }
      const resolution = resolveMassPropersWinner(resolved);
      const missingNote = `No Collect text found for this Proper (${escapeHtml(resolved.periodKey)}) yet - see ROADMAP.md.`;
      // Table 2 concurrence (see resolveEveningConcurrence) only concerns
      // Vespers - only compute/pass it in when this Collect is actually
      // rendering on the Office page's Evensong Hour, not Mattins or Mass.
      // When eveningDisplacement is set (renderOfficePage found a code
      // 1/3/5 - tomorrow's Office displacing today's entirely), `resolved`
      // here IS tomorrow's own resolved day (renderOfficePage swapped it
      // in for the whole render pass), so resolveEveningConcurrence would
      // wrongly look a further day ahead; use the already-resolved
      // commemorate-today info from eveningDisplacement instead.
      let eveningConcurrence = null;
      if (currentPage === "office" && currentHour === "evensong") {
        eveningConcurrence = eveningDisplacement
          ? (eveningDisplacement.commemorateToday
              ? { name: eveningDisplacement.todayName, text: eveningDisplacement.todayText, displaced: true }
              : null)
          : resolveEveningConcurrence(resolved);
      }
      return renderCommemoratedOration(resolution, "text", "secondaryText", "Collect", missingNote, eveningConcurrence, resolved) + renderSecondThirdCollectBlock("collect", "Collect", resolved, resolution, countMassCommemorations(resolution, "text", "secondaryText"));
    }
    if (key === "introitOfDay") {
      const resolution = resolveMassPropersWinner(resolved);
      const missingNote = `No Introit text found for this Proper (${escapeHtml(resolved.periodKey)}) yet - see ROADMAP.md.`;
      if (!resolution) return `<div class="placeholder-block"><span class="missing">${missingNote}</span></div>`;
      const winnerEntry = resolution.winner === "feast" ? resolution.sanctorale : resolution.seasonEntry;
      let introitText = winnerEntry && winnerEntry.introit;
      if (!introitText) return `<div class="placeholder-block"><span class="missing">${missingNote}</span></div>`;
      // Pending-corrections note (10/2): a bracketed "(Alleluia, alleluia.)"
      // marker baked into some Introits' own Antiphon text (see the
      // comment above renderSimplePart, which fixes the same gap for the
      // Offertory/Communion) was always shown literally, never gated by
      // season. Swapped in/stripped here, before the antiphon/incipit
      // split below, so both the first and repeated copy of the Antiphon
      // agree on whether "Alleluia" is actually said today.
      introitText = applyAlleluiaMarker(introitText, isAlleluiaSeason(resolved));
      // George's 9/4 note, task #161: after the Introit's Antiphon and Ps.
      // verse, the Gloria Patri is said in full, then the Antiphon is
      // repeated - the classical Introit structure (Ant. / Ps. verse /
      // Gloria Patri / Ant. repeated). PropTime.tex/PropSeas.tex/
      // Sanctorale.tex never spell either piece out per-Introit - the
      // Gloria Patri text is invariant and assumed universal knowledge,
      // the same print-economy already seen at Terce's own Psalm 119
      // Gloria Patri (task #154) - so this site had only ever shown the
      // bare Antiphon+Ps.verse text.
      //
      // Pending-corrections note (10/2): "the repeated portion after the
      // Gloria Patri does not go until the 'Ps.'" - the original attempt
      // at this (task #161) cut the repeated text at the Antiphon's
      // first colon, on the theory that it mirrored this book's
      // half-verse pointing convention. That was wrong: a classical
      // Introit's "Ant." rubric repeats the WHOLE Antiphon, every clause
      // - not a shorthand chant incipit, which is a convention of a
      // chant score, not of a text meant to be read in full - confirmed
      // against Trinity XI's own two-colon Antiphon ("Haste thee, O God,
      // unto my rescue: O Lord make haste to my deliverance: let mine
      // enemies be ashamed and confounded that seek after my soul."),
      // which the old cut-at-first-colon logic truncated to just its
      // first clause. The repeated text is now simply the full Antiphon
      // - everything before " Ps." - with no further cutting.
      const antiphon = introitText.split(" Ps.")[0];
      const incipit = antiphon;
      // George's 9/8 note, task #192: "the Gloria Patri should be in line
      // with the rest of the text, as well as the repeated sentence" -
      // the Gloria Patri had been rendered via renderVersicleLine (two
      // separate versicle/response-styled <p> elements, the same
      // dialogue-look used for an actual spoken versicle exchange) and
      // the repeated incipit via its own separate `.antiphon`-class <p>,
      // both visually breaking what is really one continuous printed
      // sentence in the source (Ant. Ps.verse. Gloria Patri. Ant.). Now
      // built as a single `plain-text` paragraph instead, joined the same
      // way Vidi Aquam's own inline Gloria Patri already is (task #190),
      // reusing that exact wording for consistency. Also per the same
      // note, "the 'Ps.' should be in italics" - italicized only the
      // literal "Ps." abbreviation itself (not the whole psalm verse),
      // split out the same way the incipit-cutting logic above already
      // isolates the Antiphon from the Ps. verse.
      const psSplit = introitText.split(" Ps.");
      const introitHtml = psSplit.length === 2
        ? `${escapeHtml(psSplit[0])} <em>Ps.</em>${escapeHtml(psSplit[1])}`
        : escapeHtml(introitText);
      // Pending-corrections note (10/2): "Passiontide is a sub-season of
      // Lent, so the Gloria Patri (at the Introit) should not be said
      // during Passiontide specifically." Rubrics.tex's own "Gloria
      // Patri" entry: "During Passiontide, the Gloria Patri is omitted in
      // the Invitatory of Mattins, Responsory of the Minor Hours,
      // Aspersion of the People, Introit, and Lavabo" - and its own
      // "Introit" entry: "followed by the Gloria Patri (except in
      // Passiontide) and the Introit repeated." This Gloria Patri had
      // always been printed unconditionally. Omitted via the same
      // isPassiontideToday check already used for Asperges's own Gloria
      // Patri (task #190) and the Lavabo's (just below, in
      // data/mass-ordinary.json) - the Antiphon is still always repeated
      // either way, per the rubric's own wording.
      const omitGloriaPatri = resolved && isPassiontideToday(resolved);
      const gloriaPatri = "Glory be to the Father, and to the Son, and to the Holy Ghost: * as it was in the beginning, is now and ever shall be, world without end. Amen.";
      const middle = omitGloriaPatri ? "" : ` ${escapeHtml(gloriaPatri)}`;
      return `<p class="plain-text">${introitHtml}${middle} ${escapeHtml(incipit)}</p>`;
    }
    if (key === "properPreface") {
      const preface = pickPreface(resolved);
      if (!preface) return "";
      return `<p class="plain-text">${escapeHtml(preface.text)}</p>`;
    }
    if (key === "epistleOfDay") {
      const resolution = resolveMassPropersWinner(resolved);
      if (!resolution) {
        return `<div class="placeholder-block"><span class="missing">No Epistle found for this Proper (${escapeHtml(resolved.periodKey)}) yet - see ROADMAP.md.</span></div>`;
      }
      const winnerEntry = resolution.winner === "feast" ? resolution.sanctorale : resolution.seasonEntry;
      const citation = winnerEntry && winnerEntry.epistleCitation;
      const text = winnerEntry && winnerEntry.epistleText;
      if (!citation && !text) {
        return `<div class="placeholder-block"><span class="missing">No Epistle found for this Proper (${escapeHtml(resolved.periodKey)}) yet - see ROADMAP.md.</span></div>`;
      }
      // 8/26 note: "replace the standard rubric with the fully written-
      // out reading introduction, drop-cap 'Brethren' (or the reading's
      // actual opening word)" - the same fix already made to Mattins/
      // Evensong's Lessons (see the lesson1/lesson2 branch above),
      // applied here to the Mass Epistle. Unlike the Lessons, this
      // site's Epistle text is pre-transcribed directly onto the winning
      // Mass Propers entry (epistleText), not looked up from KJV data
      // verse-by-verse, so there's no per-verse `result.verses` array to
      // read a chapter number off of - the citation string itself
      // ("Romans 13:8", "1 Corinthians 4:1-5", etc.) is parsed directly
      // instead. Falls back to the old plain citation+text rendering
      // (no generated intro sentence) if the citation doesn't parse -
      // better to show something than nothing.
      // Single-chapter books (Jude, Philemon, Obadiah, 2 John, 3 John)
      // are cited by verse alone with no colon ("Jude 17", not "Jude
      // 1:17") - this data's only two live instances are both Jude
      // (collects-sanctorale.json 6-20 and 10-28). Try the normal
      // "Book Chapter:Verse" pattern first; if that fails, fall back to
      // a bare "Book Verse" pattern with chapter implicitly First.
      const citeMatch = citation && (citation.match(/^(.+?)\s+(\d+):(\d+)/) || citation.match(/^(.+?)\s+(\d+)$/));
      if (citeMatch && text) {
        const book = citeMatch[1];
        const chapter = citeMatch[3] ? parseInt(citeMatch[2], 10) : 1;
        const verse = parseInt(citeMatch[3] || citeMatch[2], 10);
        const fullTitle = (window.Scripture && window.Scripture.BOOK_FULL_TITLES && window.Scripture.BOOK_FULL_TITLES[book]) || book;
        const beginning = `The Epistle is written in the ${ordinalWords(chapter)} Chapter of the ${fullTitle}, beginning at the ${ordinalWords(verse)} Verse.`;
        return `<div class="lesson-block"><div class="lesson-citation">${escapeHtml(citation)}</div><p class="rubric-black">${escapeHtml(beginning)}</p><p class="lesson-text">${withDropcap(text, true)}</p></div>`;
      }
      return `<div class="lesson-block">${citation ? `<div class="lesson-citation">${escapeHtml(citation)}</div>` : ""}${text ? `<p class="lesson-text">${escapeHtml(text)}</p>` : ""}</div>`;
    }
    // 8/26 note: "programmatically choose 'Beginning'/'Continuation'
    // wording (omit 'Beginning' specifically when it's the first verse
    // of the first chapter)" plus the pre-existing static "N." never
    // being filled in with the actual Evangelist's name - both fixed
    // together here, since both come from the same gospelCitation. Only
    // the four Gospels are ever cited this way, so a small local name
    // table (rather than reusing BOOK_FULL_TITLES, whose own Matthew/
    // Mark/Luke/John entries are phrased "Gospel according to Saint
    // Matthew" - already containing "according to", which this rubric's
    // own template also supplies, so reusing it verbatim would double up
    // to "...according to Gospel according to Saint Matthew") is enough.
    if (key === "gospelIncipit") {
      const EVANGELIST_NAMES = { Matthew: "Saint Matthew", Mark: "Saint Mark", Luke: "Saint Luke", John: "Saint John" };
      const resolution = resolveMassPropersWinner(resolved);
      const winnerEntry = resolution && (resolution.winner === "feast" ? resolution.sanctorale : resolution.seasonEntry);
      const citation = winnerEntry && winnerEntry.gospelCitation;
      const citeMatch = citation && citation.match(/^(.+?)\s+(\d+):(\d+)/);
      if (citeMatch) {
        const book = citeMatch[1];
        const chapter = parseInt(citeMatch[2], 10);
        const verse = parseInt(citeMatch[3], 10);
        const name = EVANGELIST_NAMES[book] || book;
        const isBeginning = chapter === 1 && verse === 1;
        const v = `The ${isBeginning ? "Beginning" : "Continuation"} ✠ of the Holy Gospel according to ${name}.`;
        const vLatin = `℣. ${isBeginning ? "Inítium" : "Sequéntia"} ✠ sancti Evangélii secúndum ${book === "John" ? "Joánnem" : book === "Matthew" ? "Matthǽum" : book === "Mark" ? "Marcum" : book === "Luke" ? "Lucam" : book}.`;
        return renderVersicleLine(v, vLatin, "versicle") + renderVersicleLine("Glory be to thee, O Lord.", "℟. Glória tibi, Dómine.", "response");
      }
      // Fall back to the old templated wording if the citation doesn't parse.
      return renderVersicleLine("The Beginning (or, Continuation) ✠ of the Holy Gospel according to N.", "℣. Inítium (vel, Sequéntia) ✠ sancti Evangélii secúndum N.", "versicle") +
        renderVersicleLine("Glory be to thee, O Lord.", "℟. Glória tibi, Dómine.", "response");
    }
    if (key === "gospelOfDay") {
      const resolution = resolveMassPropersWinner(resolved);
      if (!resolution) {
        return `<div class="placeholder-block"><span class="missing">No Gospel found for this Proper (${escapeHtml(resolved.periodKey)}) yet - see ROADMAP.md.</span></div>`;
      }
      const winnerEntry = resolution.winner === "feast" ? resolution.sanctorale : resolution.seasonEntry;
      const citation = winnerEntry && winnerEntry.gospelCitation;
      const text = winnerEntry && winnerEntry.gospelText;
      if (!citation && !text) {
        return `<div class="placeholder-block"><span class="missing">No Gospel found for this Proper (${escapeHtml(resolved.periodKey)}) yet - see ROADMAP.md.</span></div>`;
      }
      return `<div class="lesson-block">${citation ? `<div class="lesson-citation">${escapeHtml(citation)}</div>` : ""}${text ? `<p class="lesson-text">${escapeHtml(text)}</p>` : ""}</div>`;
    }
    if (key === "gradualOfDay") {
      const resolution = resolveMassPropersWinner(resolved);
      if (!resolution) {
        return `<div class="placeholder-block"><span class="missing">No Gradual/Tract found for this Proper (${escapeHtml(resolved.periodKey)}) yet - see ROADMAP.md.</span></div>`;
      }
      const winnerEntry = resolution.winner === "feast" ? resolution.sanctorale : resolution.seasonEntry;
      if (!winnerEntry) {
        return `<div class="placeholder-block"><span class="missing">No Gradual/Tract found for this Proper (${escapeHtml(resolved.periodKey)}) yet - see ROADMAP.md.</span></div>`;
      }
      // Outside of penitential seasons the Gradual is followed by the
      // Alleluia verse; in Septuagesimatide/Lent/Passiontide the
      // Alleluia is suppressed and a Tract is sung instead; from Easter
      // to Pentecost the Gradual itself is dropped and a second
      // Alleluia verse stands in its place (the "Greater Alleluia").
      // seasonKeyFor() (office-variants.js) already buckets periodKey
      // into these season groups for the Office's own antiphon/hymn
      // pickers - reused here rather than re-deriving season logic.
      const seasonKey = typeof seasonKeyFor === "function" ? seasonKeyFor(resolved.periodKey) : null;
      let html = "";
      const eastertide = seasonKey === "eastertide" || seasonKey === "ascensiontide";
      if (eastertide && winnerEntry.gradualAlleluia) {
        html += `<p class="plain-text">${escapeHtml(winnerEntry.gradualAlleluia)}</p>`;
        if (winnerEntry.alleluia) html += `<p class="plain-text">${escapeHtml(winnerEntry.alleluia)}</p>`;
      } else if (winnerEntry.tract && (seasonKey === "septuagesima" || seasonKey === "lent" || seasonKey === "passiontide" || !winnerEntry.gradual)) {
        if (winnerEntry.gradual) html += `<p class="plain-text">${escapeHtml(winnerEntry.gradual)}</p>`;
        html += `<p class="plain-text">${escapeHtml(winnerEntry.tract)}</p>`;
      } else if (winnerEntry.gradual) {
        html += `<p class="plain-text">${escapeHtml(winnerEntry.gradual)}</p>`;
        if (winnerEntry.gradualAlleluia) html += `<p class="plain-text">${escapeHtml(winnerEntry.gradualAlleluia)}</p>`;
      } else if (winnerEntry.tract) {
        html += `<p class="plain-text">${escapeHtml(winnerEntry.tract)}</p>`;
      } else if (winnerEntry.alleluia) {
        html += `<p class="plain-text">${escapeHtml(winnerEntry.alleluia)}</p>`;
      }
      if (!html) {
        return `<div class="placeholder-block"><span class="missing">No Gradual/Tract found for this Proper (${escapeHtml(resolved.periodKey)}) yet - see ROADMAP.md.</span></div>`;
      }
      return html;
    }
    if (key === "offertoryOfDay") {
      const resolution = resolveMassPropersWinner(resolved);
      return renderSimplePart(resolution, "offertory", `No Offertory antiphon found for this Proper (${escapeHtml(resolved.periodKey)}) yet - see ROADMAP.md.`, resolved);
    }
    if (key === "secretOfDay") {
      const resolution = resolveMassPropersWinner(resolved);
      const missingNote = `No Secret text found for this Proper (${escapeHtml(resolved.periodKey)}) yet - see ROADMAP.md.`;
      let html = renderCommemoratedOration(resolution, "secretText", "secretSecondaryText", "Secret", missingNote, null, resolved) + renderSecondThirdCollectBlock("secret", "Secret", resolved, resolution, countMassCommemorations(resolution, "secretText", "secretSecondaryText"));
      // George's 9/1 note: "Where the final words 'Throughout all ages,
      // world without end. Amen.' are supplied in the Mass, they should
      // be excised from the Collect, Secret, or Postcommunion itself."
      // This is specifically about the Secret: pages/HolyMass/HolyMass.tex
      // gives the Secret Prayers their own peculiar rubric - said silently
      // by the Priest, with only their very last words spoken aloud as
      // the people's cue to answer "Amen" ("When these are ended, he
      // saith in a loud voice, 'Throughout all ages, world without end.'
      // / 'Amen.'" - see data/mass-ordinary.json's own separate ℣./℟.
      // section right after this placeholder). No equivalent separate
      // dialogue exists after the Collect or the Postcommunion (or at
      // Mattins/Evensong's own Collect, which shares this same
      // renderCommemoratedOration function) - those three keep their full
      // ending exactly as stored, unabbreviated per task #78. Every
      // secretText/secretSecondaryText/secretTertiaryText in this site's
      // data ends with the identical fixed tail ("...God, throughout all
      // ages, world without end. Amen." - confirmed by a direct scan:
      // exactly one variant exists across the whole data set), so
      // printing it here AND the separate spoken dialogue immediately
      // after would say the same closing words twice. Stripped at render
      // time, not in the underlying data, so the canonical Secret text
      // stays complete and correct on its own (e.g. for anyone reading
      // just the data files, or a future page that prints the Secret
      // without the separate dialogue).
      html = html.replace(/,\s*throughout all ages,\s*world without end\.\s*Amen\.(?=\s*<\/p>)/gi, ".");
      return html;
    }
    if (key === "communionOfDay") {
      const resolution = resolveMassPropersWinner(resolved);
      return renderSimplePart(resolution, "communion", `No Communion antiphon found for this Proper (${escapeHtml(resolved.periodKey)}) yet - see ROADMAP.md.`, resolved);
    }
    if (key === "postcommunionOfDay") {
      const resolution = resolveMassPropersWinner(resolved);
      const missingNote = `No Postcommunion text found for this Proper (${escapeHtml(resolved.periodKey)}) yet - see ROADMAP.md.`;
      return renderCommemoratedOration(resolution, "postcommunionText", "postcommunionSecondaryText", "Postcommunion", missingNote, null, resolved) + renderSecondThirdCollectBlock("postcommunion", "Postcommunion", resolved, resolution, countMassCommemorations(resolution, "postcommunionText", "postcommunionSecondaryText"));
    }
    if (key === "invitatory") {
      const seasonKey = pickInvitatorySeason(resolved, resolveFeastRankToday(resolved));
      const opt = (currentTemplate.invitatoryOptions || []).find((o) => o.season === seasonKey);
      if (!opt) return "";
      return `<p class="antiphon">${escapeHtml(opt.text)}</p>`;
    }
    if (key === "morningCanticle") {
      // morningCanticleMode (8/25 note, per Augustine via George):
      // "automatic" runs pickMorningCanticle's own Sunday/feast-rank/
      // season logic exactly as before. "oldTestament" is a substitute
      // Mattins.tex itself names explicitly: "Note, The Old Testament
      // Canticle (p. [OT]) may be said instead of the following Hymn
      // [Te Deum]" and, at the Benedicite's own rubric, "...may be said
      // instead of the Benedicite." - i.e. the Old Testament Canticle is
      // not a THIRD independent choice with its own separate rank rule;
      // it simply swaps in wherever Te Deum/Benedicite would otherwise
      // go, for whichever the day's own rank already calls for.
      //
      // George's 9/2 note (task #140) corrected two compounding errors
      // in the previous implementation: (1) the "Nine Biblical Odes"
      // data it showed (data/old-testament-odes.json - First/Second Song
      // of Moses from Exodus 15/Deuteronomy 32, Song of Hannah, etc.) is
      // a DIFFERENT, unrelated canticle scheme, not the one this specific
      // Breviary actually contains - pages/Office/OTCant.tex ("Old
      // Testament Canticles", confirmed by its own \label{OT} anchor,
      // matching the \pageref{OT} both rubrics above point to) has its
      // own distinct set of 12 (Monday-Saturday, one Ferial + one Festal
      // each, no Sunday entry at all) with completely different Latin
      // incipits and English text; and (2) it was offered as a manually
      // browsable dropdown letting the reader pick any of the 9 at will,
      // when OTCant.tex's own top rubric ("The Festal Canticle is prayed
      // on Feast Days Semidouble & higher, Octave Days, and the Saturday
      // Office of St. Mary") makes the Ferial/Festal choice automatic,
      // by the same rank test already used to choose Te Deum over
      // Benedicite in the first place - so `pickMorningCanticle`'s own
      // "teDeum"/"benedicite" answer doubles as this canticle's own
      // Festal/Ferial answer, with no separate threshold to maintain.
      const gloriaPatri = () =>
        renderVersicleLine("Glory be to the Father, and to the Son, and to the Holy Ghost.", "℣. Glória Patri, et Fílio, et Spirítui Sancto:", "versicle") +
        renderVersicleLine("As it was in the beginning, is now, and ever shall be, world without end. Amen.", "℟. Sicut erat in princípio, et nunc, et semper, et in sæcula sæculórum. Amen.", "response");

      const canticleKey = pickMorningCanticle(resolved, resolveFeastRankToday(resolved));

      if (morningCanticleMode === "oldTestament") {
        const weekday = resolved.weekdayName ? resolved.weekdayName.toLowerCase() : null;
        const dayEntry = weekday && oldTestamentCanticlesData.weekdays && oldTestamentCanticlesData.weekdays[weekday];
        // OTCant.tex has no Sunday canticle at all - honestly fall
        // through to the day's own normal Te Deum/Benedicite rather
        // than fabricate a Sunday entry that isn't in the source.
        if (dayEntry) {
          const kind = canticleKey === "teDeum" ? "festal" : "ferial";
          const chosen = dayEntry[kind];
          if (chosen) {
            let html = `<p class="rubric-fine">${escapeHtml(oldTestamentCanticlesData.rubric)}</p>`;
            chosen.parts.forEach((part) => {
              html += `<div class="section-heading">${escapeHtml(part.heading)}</div>`;
              if (part.rubricNote) html += `<p class="rubric-fine">${escapeHtml(part.rubricNote)}</p>`;
              html += part.textLines.map((line, i) => renderBilingualLine(line, undefined, true, i === 0)).join("");
            });
            html += gloriaPatri();
            return html;
          }
        }
      }

      const c = currentTemplate.canticles && currentTemplate.canticles[canticleKey];
      if (!c) return "";
      const showLa = (languageMode === "latin" || languageMode === "both") && c.headingLatin;
      let html = `<div class="section-heading">${escapeHtml(c.heading)}${showLa ? `<span class="heading-latin">${escapeHtml(c.headingLatin)}</span>` : ""}</div>`;
      html += `<p class="rubric">${renderRubricText(c.rubricNote)}</p>`;
      html += c.textLines.map((line, i) => renderBilingualLine(line, c.textLinesLatin ? c.textLinesLatin[i] : undefined, true, i === 0)).join("");
      if (canticleKey === "benedicite") html += gloriaPatri();
      return html;
    }
    if (key === "complinePsalmAntiphon" || key === "complineNuncAntiphon") {
      // Compline.tex prints each antiphon twice: once BEFORE its psalm(s)
      // marked with a dagger (\dag) showing where the reciter stops (the
      // classical "said in incipit before, in full after" antiphon
      // convention), and again AFTER the psalm(s)/Gloria Patri with no
      // dagger, in full. The site previously showed the identical full
      // text at both placements, silently dropping this distinction.
      // `sec.position` ("before"/"after", set on each placeholder in the
      // template) now selects `opt.incipit` for the pre-psalm placement
      // and `opt.text` (full) for the post-psalm one; falls back to the
      // full text if an option has no separate incipit. Note: unlike
      // most seasons, Passiontide's Nunc Dimittis antiphon genuinely
      // differs in wording before ("In the midst of life we be in
      // death...") vs. after ("Thou knowest, Lord, the secrets of our
      // hearts...") in the source itself - not a truncation of the same
      // sentence - so only its incipit is used for "before" (see the
      // `note` on that option in compline-template.json).
      //
      // George's 9/4 note, task #157: on a Double+ ranked Feast, this
      // antiphon is "doubled" - said in full both before and after, not
      // just incipit-before - the same rule task #139 already applies to
      // Mattins/Evensong's Benedictus/Magnificat antiphon (and, via
      // renderPsalmHtml's fullAntiphonBefore, the Psalter's own). Reuses
      // resolveMassPropersWinner's `winner`/`sanctoraleRank` the same way
      // that logic does, rather than a separate rank lookup.
      const massResolution = resolveMassPropersWinner(resolved);
      const fullBefore = !!(massResolution && massResolution.winner === "feast" && window.Ranking && (window.Ranking.RANK_TIER[massResolution.sanctoraleRank] || 0) >= 4);
      const seasonKey = key === "complinePsalmAntiphon" ? pickComplinePsalmAntiphon(resolved) : pickComplineNuncAntiphon(resolved);
      const optList = key === "complinePsalmAntiphon" ? currentTemplate.psalmAntiphonOptions : currentTemplate.nuncAntiphonOptions;
      const opt = (optList || []).find((o) => o.season === seasonKey);
      if (!opt) return "";
      const showText = (sec && sec.position === "before" && opt.incipit && !fullBefore) ? opt.incipit : opt.text;
      return `<p class="antiphon">${escapeHtml(showText)}</p>`;
    }
    if (key === "complineHymn") {
      const hymnKey = pickComplineHymn(resolved, resolveFeastRankToday(resolved));
      const h = (currentTemplate.hymnOptions || []).find((o) => o.season === hymnKey);
      if (!h) return "";
      const showLa = (languageMode === "latin" || languageMode === "both") && h.headingLatin;
      let html = `<div class="section-heading">${escapeHtml(h.heading)}${showLa ? `<span class="heading-latin">${escapeHtml(h.headingLatin)}</span>` : ""}</div>`;
      html += h.textLines.map((stanza, i) => renderHymnStanza(stanza, i === 0)).join("");
      return html;
    }
    if (key === "littleHourAntiphon") {
      // George's 9/7 note: "The Antiphon should not be doubled on Ferias
      // and Semidoubles." Each Little Hour template has two identical
      // littleHourAntiphon placeholders (one before the Psalms, one
      // after); historically both always printed the same full text
      // unconditionally. The classical convention (already implemented
      // for Compline's own Psalm/Nunc Dimittis antiphon at task #157,
      // via `complinePsalmAntiphon`/`complineNuncAntiphon`'s
      // `sec.position` handling) is: the antiphon is always said in full
      // AFTER the psalmody; it is said in full BEFORE only on Double+
      // ranked Feasts (the "doubling"), while on ferias and Semidoubles
      // it is normally only intoned by its opening words ("incipit")
      // before. `data/prime-template.json` (and terce/sext/none)'s
      // `psalmAntiphonOptions` have no sourced incipit text distinct
      // from the full antiphon, and per this project's rule against
      // fabricating liturgical text, no incipit is invented here.
      // Reusing task #139's exact rank threshold
      // (window.Ranking.RANK_TIER[rank] >= 4), the "before" occurrence
      // is therefore omitted entirely on ferias/Semidoubles rather than
      // shown in full - the sourced-safe way to make it "not doubled" -
      // while the "after" occurrence (marked `"position": "after"` on
      // the template's second placeholder) always renders the full
      // text, matching Compline's own "after" placement.
      const rankFeastInfo = resolveFeastRankToday(resolved);
      const isBefore = !sec || sec.position !== "after";
      if (isBefore) {
        const isDoubleOrHigher = !!(
          rankFeastInfo.winner === "feast" &&
          window.Ranking &&
          (window.Ranking.RANK_TIER[rankFeastInfo.rank] || 0) >= 4
        );
        if (!isDoubleOrHigher) return "";
      }
      const seasonKey = pickLittleHourAntiphon(resolved, rankFeastInfo);
      const opt = (currentTemplate.psalmAntiphonOptions || []).find((o) => o.season === seasonKey);
      if (!opt) return "";
      return `<p class="antiphon">${escapeHtml(opt.text)}</p>`;
    }
    if (key === "littleHourChapter") {
      const seasonKey = pickLittleHourChapter(resolved, resolveFeastRankToday(resolved));
      const opt = (currentTemplate.chapterOptions || []).find((o) => o.season === seasonKey);
      if (!opt) return "";
      return `<p class="plain-text">${escapeHtml(opt.text)}</p>`;
    }
    if (key === "littleHourShortRespond") {
      const seasonKey = pickLittleHourShortRespond(resolved, resolveFeastRankToday(resolved));
      const opt = (currentTemplate.shortRespondOptions || []).find((o) => o.season === seasonKey);
      if (!opt) return "";
      return opt.lines.map((l) => renderVersicleLine(l.v, undefined, "versicle") + (l.r !== undefined ? renderVersicleLine(l.r, undefined, "response") : "")).join("");
    }
    if (key === "mattinsCreed" || key === "athanasianCreedFull") {
      // athanasianCreedFull (Prime's always-optional block) always shows
      // the Athanasian Creed; mattinsCreed picks between it and the
      // Apostles' Creed depending on the day - see isAthanasianCreedDay
      // in office-variants.js for the exact 13 named Feasts.
      const showAthanasian = key === "athanasianCreedFull" || isAthanasianCreedDay(resolved);
      if (showAthanasian) {
        const a = athanasianCreedData;
        if (!a.verses) return "";
        const showLa = (languageMode === "latin" || languageMode === "both") && a.headingLatin;
        let html = key === "mattinsCreed"
          ? `<div class="section-heading">${escapeHtml(a.heading)}${showLa ? `<span class="heading-latin">${escapeHtml(a.headingLatin)}</span>` : ""}</div>`
          : "";
        html += a.verses.map((line, i) => renderBilingualLine(line, a.versesLatin ? a.versesLatin[i] : undefined, i === 0, i === 0)).join("");
        return html;
      }
      // Not an automatic-Athanasian day (mattinsCreed only, since
      // athanasianCreedFull is always the Athanasian text): fall to the
      // user's Apostles'/Nicene choice, per "the Nicene Creed may be said
      // instead of the Apostles'." The toggle itself only shows here -
      // an Athanasian day already shows the Athanasian text above
      // instead, so the choice is moot there (8/25 note, same reasoning
      // as the Gloria toggle's seasonal hide).
      const ac = creedChoice === "nicene" && currentTemplate.nicaeanCreed ? currentTemplate.nicaeanCreed : currentTemplate.apostlesCreed;
      if (!ac) return "";
      const showLa = (languageMode === "latin" || languageMode === "both") && ac.headingLatin;
      let html = renderInlineToggle("creed", [
        { value: "apostles", label: "Apostles' Creed" },
        { value: "nicene", label: "Nicene Creed" },
      ], creedChoice);
      html += `<div class="section-heading">${escapeHtml(ac.heading)}${showLa ? `<span class="heading-latin">${escapeHtml(ac.headingLatin)}</span>` : ""}</div>`;
      const lines = ac.text.split("\n");
      const linesLatin = ac.textLatin ? ac.textLatin.split("\n") : null;
      html += lines.map((line, i) => renderBilingualLine(line, linesLatin ? linesLatin[i] : undefined, true, i === 0)).join("");
      return html;
    }
    if (key === "evensongCreed") {
      // Evensong has no automatic-Athanasian override (that's a
      // Mattins-only rule), so this always follows the user's choice,
      // and the toggle always shows.
      const ac = creedChoice === "nicene" && currentTemplate.nicaeanCreed ? currentTemplate.nicaeanCreed : currentTemplate.apostlesCreed;
      if (!ac) return "";
      const showLa = (languageMode === "latin" || languageMode === "both") && ac.headingLatin;
      let html = renderInlineToggle("creed", [
        { value: "apostles", label: "Apostles' Creed" },
        { value: "nicene", label: "Nicene Creed" },
      ], creedChoice);
      html += `<div class="section-heading">${escapeHtml(ac.heading)}${showLa ? `<span class="heading-latin">${escapeHtml(ac.headingLatin)}</span>` : ""}</div>`;
      const lines = ac.text.split("\n");
      const linesLatin = ac.textLatin ? ac.textLatin.split("\n") : null;
      html += lines.map((line, i) => renderBilingualLine(line, linesLatin ? linesLatin[i] : undefined, true, i === 0)).join("");
      return html;
    }
    if (key === "marianAnthem") {
      const anthemKey = pickMarianAnthem(resolved);
      // No anthem is said on Maundy Thursday or Good Friday - render
      // nothing rather than a "missing" placeholder, since this is a
      // real rubric, not a data gap.
      if (!anthemKey) return "";
      const a = marianAnthemsData[anthemKey];
      if (!a) return "";
      const showLa = (languageMode === "latin" || languageMode === "both") && a.headingLatin;
      let html = `<div class="section-heading">${escapeHtml(a.heading)}${showLa ? `<span class="heading-latin">${escapeHtml(a.headingLatin)}</span>` : ""}</div>`;
      html += `<p class="rubric">${renderRubricText(a.rubric)}</p>`;
      html += a.textLines.map((line, i) => renderBilingualLine(line, a.textLinesLatin ? a.textLinesLatin[i] : undefined, true, i === 0)).join("");
      html += renderVersicleLine(a.v, a.vLatin, "versicle");
      html += renderVersicleLine(a.r, a.rLatin, "response");
      html += renderPrayCue("Orémus.");
      html += renderBilingualLine(a.collect, a.collectLatin, true, true);
      return html;
    }
    return "";
  }

  function withDropcap(text, enabled) {
    if (!enabled) return escapeHtml(text);
    // Split the RAW text first, then escape each half separately - a
    // couple of Matrimony's vows dropcap the literal letter "N" (the
    // rite's own name placeholder happens to be the paragraph's first
    // word too: "N., wilt thou have this woman..."). Escaping the whole
    // string up front, as this used to do, would let escapeHtml()'s
    // "N." placeholder-italics rule wrap the very first two characters
    // in an <em> before this function's own "first letter" regex ever
    // got to see them, breaking the dropcap match entirely. Splitting
    // first means the lone dropcapped "N" is never re-wrapped (its own
    // large-initial styling already marks it as distinct; italicizing
    // it too would be redundant), while any *other* "N." later in the
    // same paragraph still goes through escapeHtml() normally.
    const m = text.match(/^([A-Za-z])(.*)$/s);
    if (!m) return escapeHtml(text);
    return `<span class="dropcap-letter">${escapeHtml(m[1])}</span>${escapeHtml(m[2])}`;
  }

  // Shared by every `.rubric`-styled paragraph, whether it comes from a
  // generic `{"type": "rubric", ...}` section or one of the several
  // bespoke named rubric fields (Fore-Office's `preRubric1`/`gc.rubric`/
  // `lp.rubric`, Compline's `abs.*Rubric`, an anthem's `a.rubric`, etc.).
  // `{{...}}` in the source data marks a black-rubric segment (the LaTeX
  // source's own \blackrubric{} macro) within an otherwise-red rubric -
  // see the "rubric" case in renderSection and .rubric-black-inline in
  // style.css. Centralizing this here (rather than each call site
  // re-implementing the same escapeHtml+replace) means `{{...}}` works
  // everywhere a rubric is rendered, not just the generic section path.
  function renderRubricText(text) {
    return escapeHtml(text).replace(/\{\{(.*?)\}\}/g, '<span class="rubric-black-inline">$1</span>');
  }

  function renderBilingualLine(en, la, dropcap, isFirstLine, extraSuffixHtml) {
    const enHtml = (en !== undefined ? withDropcap(en, dropcap && isFirstLine) : "") + (extraSuffixHtml || "");
    const laHtml = la !== undefined ? withDropcap(la, dropcap && isFirstLine) : null;
    if (languageMode === "both") {
      return `<div class="bilingual-row"><div class="col-en">${enHtml}</div><div class="col-la">${laHtml !== null ? laHtml : '<span class="no-latin-note">(no Latin text in source)</span>'}</div></div>`;
    }
    if (languageMode === "latin") {
      if (laHtml !== null) return `<p class="plain-text">${laHtml}</p>`;
      return `<p class="plain-text">${enHtml}<br/><span class="no-latin-note">(no Latin text given in the source for this line)</span></p>`;
    }
    return `<p class="plain-text">${enHtml}</p>`;
  }

  /**
   * Office Hymn stanzas (8/25 note): the source (Compline.tex,
   * FerialHymns.tex) marks each stanza's own internal poetic line
   * breaks explicitly (\par after every line), but the original
   * transcription flattened each whole stanza into one run-on prose
   * string with no breaks at all - "one continuous run-on block," per
   * the ROADMAP complaint. `stanza` here may be a single line (no
   * internal "\n") for any hymn data not yet re-transcribed with real
   * line breaks - this still renders correctly as one line, just
   * without the visual line-break benefit, so this helper is safe to
   * use everywhere textLines-style hymn data appears even before every
   * hymn source has been fixed up to match. Each poetic line renders
   * on its own line (<br> within one <p>, not a full paragraph gap -
   * lines belong to the same breath/stanza); stanzas themselves keep
   * their normal paragraph-to-paragraph gap, matching how a printed
   * hymnal visually separates stanzas from each other more than it
   * separates the lines within one.
   */
  // Factored out of renderHymnStanza (task #169) so the bilingual
  // "hymnStanzas" section type below can build the same tight,
  // <br/>-joined line grouping for a Latin column too, without
  // duplicating the split/dropcap logic.
  function buildHymnStanzaLines(stanza, isFirstStanza) {
    return stanza.split("\n").map((line, i) => withDropcap(line, isFirstStanza && i === 0)).join("<br/>");
  }

  function renderHymnStanza(stanza, isFirstStanza) {
    return `<p class="hymn-stanza">${buildHymnStanzaLines(stanza, isFirstStanza)}</p>`;
  }

  /**
   * Versicles are special-cased vs. renderBilingualLine: the English
   * strings rely on a CSS ::before to prepend "℣. "/"℟. ", but the
   * Latin strings already have their own "℣."/"℟." typed into the data
   * (that's how the source LaTeX writes them) - so only the English
   * side ever gets the marker CSS class, or Latin-only text would show
   * the mark twice.
   */
  function renderVersicleLine(en, la, markerClass) {
    const showEn = languageMode === "english" || languageMode === "both";
    const showLa = languageMode === "latin" || languageMode === "both";
    if (languageMode === "both") {
      const laCell = la !== undefined ? escapeHtml(la) : '<span class="no-latin-note">(no Latin text in source)</span>';
      return `<div class="bilingual-row"><div class="col-en ${markerClass}">${escapeHtml(en)}</div><div class="col-la">${laCell}</div></div>`;
    }
    if (languageMode === "latin") {
      if (la !== undefined) return `<p class="plain-text">${escapeHtml(la)}</p>`;
      return `<p class="${markerClass}">${escapeHtml(en)}<br/><span class="no-latin-note">(no Latin text given in the source for this line)</span></p>`;
    }
    return `<p class="${markerClass}">${escapeHtml(en)}</p>`;
  }

  /**
   * The Prayer Book's "The Lord be with you. (or, O Lord, hear our
   * prayer.)" pattern recurs across Mattins, Evensong, Prime, Terce,
   * Sext, None, Compline, and the Office of the Dead's Mattins - the
   * Priest/Deacon form vs. the Layman's substitute, per the rubric's own
   * "or." Per Augustine's 8/22 answer: Priest and Deacon say the first
   * form ("The Lord be with you"); a Layman always says the second ("O
   * Lord, hear our prayer") instead. Resolved here at render time from
   * the "(or, ...)"/"(vel, ...)" parenthetical already present in the
   * data, rather than hand-editing every occurrence in every template.
   */
  const MINISTER_OR_EN_RE = /^(.*?)\s*\(or,\s*(.*?)\)\s*$/i;
  const MINISTER_OR_LA_RE = /^(.*?)\s*\(vel,\s*(.*?)\)\s*$/i;
  function resolveMinisterVersicleField(text, isLatin, markerPrefix) {
    if (text === undefined) return text;
    const re = isLatin ? MINISTER_OR_LA_RE : MINISTER_OR_EN_RE;
    const m = text.match(re);
    if (!m) return text;
    if (ministerRank !== "layman") return m[1].trim();
    // The alternative clause was written inline without its own "℣./℟."
    // marker (the source only marks the primary clause) - Latin needs it
    // re-added since, unlike English, Latin's marker is baked into the
    // string rather than added by CSS. See renderVersicleLine's comment.
    return isLatin ? `${markerPrefix} ${m[2].trim()}` : m[2].trim();
  }

  /**
   * Site-wide rule, REVISED per George's 9/1 note: a bare "Let us pray."
   * cue - regardless of which type tags it in the source data (rubric/
   * text/versicle all occur across the various service data files) -
   * used to render centered, italicized, and unmarked (the 8/23 meeting
   * notes' original rule). George's correction: it should NOT be
   * centered, since most occurrences of this cue (e.g. right before the
   * Lord's Prayer in the Preces, or before the Mass's Offertory) aren't
   * actually introducing a Collect - they're an ordinary call to prayer
   * sitting inline with the rest of the text, same as every other
   * versicle, and should carry the same "℣." marker a versicle normally
   * gets. So this now renders through the exact same renderVersicleLine
   * path as any other bare versicle (no "r"/"rLatin" pair, since these
   * are a spoken cue rather than a real call/response dialogue), just
   * pre-supplying the fixed "Let us pray." text. Only the standalone
   * two-word cue matches this at all; longer sentences that happen to
   * start the same way ("Let us pray for the whole state of Christ's
   * Church.", "Let us pray and beseech our Lord...") are real prose and
   * render through their normal path untouched.
   */
  function renderPrayCue(la) {
    // Unlike the old centered/unmarked rendering, this now goes through
    // the same renderVersicleLine path every other versicle uses - which
    // expects Latin to already carry its own "℣." (that's how the
    // source data writes it; see renderVersicleLine's own comment), so
    // `la` is passed through unstripped rather than having its marker
    // removed.
    const en = "Let us pray.";
    return renderVersicleLine(en, la, "versicle");
  }

  /**
   * Shared inline-toggle button group (8/25 note, extended 8/25 to also
   * cover Creed): renders a centered segmented button group directly on
   * the page, immediately above the section it controls - replacing
   * what used to be eight separate groups tucked away in the global
   * Settings panel (gloriaMenu, veniteAshMenu, matrimonyPsalmMenu,
   * exhortationMenu, commandmentsMenu, complineCollectMenu,
   * litanyFormMenu, creedMenu). `toggle` is a short key used
   * both as a data attribute (for the delegated click listeners below)
   * and as the lookup key into INLINE_TOGGLE_SETTERS/getInlineToggleCurrent.
   * `options` is an array of {value, label}; `current` is the presently-
   * selected value.
   */
  function renderInlineToggle(toggle, options, current) {
    const buttons = options.map((o) =>
      `<button type="button" data-inline-toggle="${escapeHtml(toggle)}" data-value="${escapeHtml(o.value)}" class="${o.value === current ? "selected" : ""}">${escapeHtml(o.label)}</button>`
    ).join("");
    return `<div class="inline-toggle"><div class="inline-toggle-options">${buttons}</div></div>`;
  }

  // Write side of the inline toggles: dispatches a clicked value to the
  // right state variable. Read by the four delegated click listeners
  // (officeBody, massBody, litanyBody, matrimonyBody) below.
  const INLINE_TOGGLE_SETTERS = {
    veniteAsh: (v) => { omitVeniteAshWednesday = v === "true"; },
    exhortation: (v) => { exhortationChoice = v; },
    commandments: (v) => { commandmentsChoice = v; },
    matrimonyPsalm: (v) => { matrimonyPsalmChoice = v; },
    receptionPsalm: (v) => { receptionPsalmChoice = v; },
    complineCollect: (v) => { complineCollectChoice = v; },
    litanyForm: (v) => { litanyForm = v; },
    gloria: (v) => { gloriaChoice = v; },
    creed: (v) => { creedChoice = v; },
    presidentPrayer: (v) => { presidentPrayerChoice = v; },
    massDay: (v) => { massDayChoice = v; },
    votiveThirdCollect: (v) => { votiveThirdCollectChoice = v; },
    matinsDeadNocturns: (v) => { matinsDeadNocturns = v; },
    matinsDeadNocturnPick: (v) => { matinsDeadNocturnPick = v; },
    officeDeadCollect: (v) => { officeDeadCollectChoice = v; },
    ambrosePortion: (v) => { ambrosePortion = v; },
    ambroseDayPick: (v) => { ambroseDayPick = v; },
    sundayPsalter: (v) => { sundayPsalterChoice = v; },
    burialLesson: (v) => { burialLessonChoice = v; },
    burialGraveSentence: (v) => { burialGraveSentenceChoice = v; },
  };

  // Read side, for the JSON-section-array-positioned toggles (Great
  // Litany, Ten Commandments, Matrimony Psalm, Compline Collect) that
  // render via the `inlineToggle` case in renderSection below. Venite
  // Ash Wednesday, Exhortation, and Gloria are rendered directly from JS
  // logic instead (see the veniteGroup loop, renderForeOffice, and the
  // gloriaChoice case), so they don't need an entry here.
  function getInlineToggleCurrent(toggle) {
    switch (toggle) {
      case "commandments": return commandmentsChoice;
      case "matrimonyPsalm": return matrimonyPsalmChoice;
      case "receptionPsalm": return receptionPsalmChoice;
      case "complineCollect": return complineCollectChoice;
      case "litanyForm": return litanyForm;
      case "presidentPrayer": return presidentPrayerChoice;
      case "votiveThirdCollect": return votiveThirdCollectChoice;
      case "matinsDeadNocturns": return matinsDeadNocturns;
      case "matinsDeadNocturnPick": return matinsDeadNocturnPick;
      case "officeDeadCollect": return officeDeadCollectChoice;
      case "ambrosePortion": return ambrosePortion;
      case "ambroseDayPick": return ambroseDayPick;
      case "burialLesson": return burialLessonChoice;
      case "burialGraveSentence": return burialGraveSentenceChoice;
      default: return null;
    }
  }

  // George's 9/2 note, task #143: "The antiphon for the last psalm
  // should be placed at the Gloria in excelsis or Gloria Patri, but
  // before the First Lesson." Independently re-resolves the same Psalms
  // list the "psalms" placeholder case already rendered (the same
  // redundant-recomputation pattern already used throughout this file
  // for resolveMassPropersWinner etc.) purely to find the last entry's
  // own antiphon text - psalms.js's renderPsalmHtml was told to skip
  // printing it inline (via `omitAfterAntiphon`) specifically so it can
  // appear here instead, right after the Gloria choice.
  function renderDeferredLastPsalmAntiphon(resolved) {
    if (currentHour !== "evensong") return "";
    // George's 9/2 note, task #141: when today's winning Feast/season has
    // its own proper Psalm antiphon (Temporale.tex/Sanctorale.tex's
    // `\psalmAntiphon{}` - see the "psalms" case's `festalPsalmAntiphon`
    // logic), that ONE antiphon's "after" text is what belongs here
    // (still deferred to the Gloria in excelsis/Gloria Patri position per
    // task #143), not the last individual Psalm's own Psal.tex antiphon -
    // the group antiphon replaces the per-psalm ones for the whole Hour,
    // including at this deferred position.
    const propersResolution = resolveMassPropersWinner(resolved);
    if (propersResolution) {
      const { seasonEntry, sanctorale, decision } = propersResolution;
      let primaryEntry;
      if (sanctorale && seasonEntry && decision) {
        primaryEntry = decision.winner === "feast" ? sanctorale : seasonEntry;
      } else {
        primaryEntry = sanctorale || seasonEntry || null;
      }
      // Same Sunday-vs-plain-feria guard as the "psalms" case's own
      // festalPsalmAntiphon derivation above - a season entry's group
      // Psalm antiphon is proper to its Sunday, not the whole week.
      const isSunday = resolved.date && resolved.date.getUTCDay() === 0;
      const primaryEntryIsPlainSeasonFeria = primaryEntry === seasonEntry && !isSunday;
      const festalPsalmAntiphon = primaryEntry && !primaryEntryIsPlainSeasonFeria
        && pickEvensongAntiphonVariant(primaryEntry.firstEvensongPsalmAntiphon, primaryEntry.secondEvensongPsalmAntiphon);
      if (festalPsalmAntiphon) {
        return `<p class="antiphon">${escapeHtml(festalPsalmAntiphon.text)}</p>`;
      }
    }
    const monthlySlot = HOUR_MONTHLY_SLOT[currentHour] || "evening";
    const lectionarySlot = pickLectionarySlot(resolved);
    // Task #170: must agree with the "psalms" case's own effective-Proper
    // decision (see resolveEffectiveProperPsalms above) so this deferred
    // last-Psalm antiphon is always drawn from whichever Psalm list (the
    // 30-Day Psalter or the Sunday's own Proper) is actually on screen.
    const properPsalms = resolveEffectiveProperPsalms(resolved, lectionarySlot);
    // Same displaced-Evensong day-of-month guard as the "psalms" case
    // above (George's 10/7 note) - this deferred last-Psalm antiphon
    // must fall back to the same Monthly Psalter entries actually shown
    // there, not tomorrow's.
    const usingDisplacedFerialPsalms = currentHour === "evensong" && eveningDisplacement && eveningDisplacement.todayResolved;
    const psalmDayResolved = usingDisplacedFerialPsalms ? eveningDisplacement.todayResolved : resolved;
    const { entries } = resolvePsalmsForDay(psalmDayResolved, psalterData, monthlySlot, properPsalms);
    if (!entries.length) return "";
    const last = entries[entries.length - 1];
    const psalm = psalterData.psalms[String(last.num)];
    if (!psalm) return "";
    const weekdayName = resolved.weekdayName ? resolved.weekdayName.toLowerCase() : null;
    const antiphons = resolvePsalmAntiphons(psalm, last.range, weekdayName);
    return renderAntiphonBlock(antiphons, false);
  }

  function renderSection(sec, resolved) {
    // George's 9/7 note, task #176: "The Antiphon should not be doubled
    // on Ferias and Semidoubles" - flagged separately at Preparation and
    // Thanksgiving, whose opening antiphon (unlike the Little Hours'
    // shared `littleHourAntiphon` placeholder) is transcribed as two
    // plain literal `text` sections, one before the Psalms/canticle and
    // one after. Mirroring the same classical convention already
    // implemented at Compline (task #157) and the Little Hours (task
    // #176, `littleHourAntiphon` case below): the antiphon is always
    // said in full AFTER, and only in full BEFORE on a Double-or-higher
    // ranked Feast (task #139's exact threshold); with no sourced
    // incipit text for a shortened "before" on lesser days, the
    // sourced-safe reading of "not doubled" is to omit the "before"
    // copy entirely rather than fabricate one. A section carries this
    // gate only when explicitly flagged `omitUnlessDoubleOrHigher` in
    // its template JSON (currently just Preparation's and
    // Thanksgiving's own opening "before" antiphon copies), so this has
    // no effect anywhere else.
    if (sec.omitUnlessDoubleOrHigher && resolved) {
      const rankFeastInfo = resolveFeastRankToday(resolved);
      const isDoubleOrHigher = !!(
        rankFeastInfo.winner === "feast" &&
        window.Ranking &&
        (window.Ranking.RANK_TIER[rankFeastInfo.rank] || 0) >= 4
      );
      if (!isDoubleOrHigher) return "";
    }
    // George's 9/7 note, task #175: sections flagged `alleluiaMarker`
    // (currently just Preparation/Thanksgiving/Benediction's own
    // antiphons and versicles) get their "(Alleluia)"/"(Allelúja.)" text
    // swapped for a real spoken "Alleluia"/"Allelúja." (no parens) during
    // Eastertide, or stripped out entirely otherwise - see
    // applyAlleluiaMarker above isAlleluiaSeason. Builds a shallow copy
    // rather than mutating `sec` in place, since `sec` is a direct
    // reference into the page's own template object (window.
    // BENEDICTION_TEMPLATE etc.), shared and re-rendered on every
    // navigation - mutating it here would make the very first render's
    // season baked in permanently for every later one. `resolved` is only
    // ever null on a genuinely date-blind static-rite page (see
    // renderStaticRitePage), so the flag simply has no effect there.
    if (sec.alleluiaMarker && resolved) {
      const alleluiaSeason = isAlleluiaSeason(resolved);
      const t = Object.assign({}, sec);
      ["text", "textLatin", "v", "r", "vLatin", "rLatin"].forEach((k) => {
        if (typeof t[k] === "string") t[k] = applyAlleluiaMarker(t[k], alleluiaSeason);
      });
      sec = t;
    }
    if (sec.type === "rubric" || sec.type === "text" || sec.type === "versicle") {
      const cueText = sec.type === "versicle" ? sec.v : sec.text;
      // George's 9/7 note: many Pastoral Rites / static-rite pages (Great
      // Litany, Litany of the Saints, A Penitential Office, Compline,
      // Benediction, Preparation, Thanksgiving, Baptism/Adult Baptism,
      // Burial/Burial Child, Communion of the Sick, Matrimony, Purification,
      // Reception, Unction) still transcribed their own bare "Let us pray."
      // cue wrapped in task #108's own black-rubric marker -
      // "{{Let us pray.}}" - rather than the bare "Let us pray." string
      // Mattins/Evensong/Mass's own cues use (tasks #122/#131/#163). Task
      // #108's sweep styled that wrapper as inline black-rubric text
      // instead of recognizing it as this same special prayer-cue, so it
      // never reached renderPrayCue at all and kept rendering as a plain
      // rubric paragraph. Since a bare "Let us pray." cue was never meant
      // to be highlighted as if it named a Creed/Canticle/Feast (the
      // actual purpose of task #108's {{...}} convention), stripping the
      // wrapper here - rather than leaving it and letting it render as
      // black-rubric text - is correct, not a loss of information.
      const unwrappedCue = typeof cueText === "string" ? cueText.trim().replace(/^\{\{(.*)\}\}$/, "$1").trim() : cueText;
      if (typeof unwrappedCue === "string" && unwrappedCue === "Let us pray." && sec.r === undefined) {
        const cueLatin = sec.type === "versicle" ? sec.vLatin : sec.textLatin;
        return renderPrayCue(cueLatin);
      }
    }
    switch (sec.type) {
      case "heading": {
        const showLa = (languageMode === "latin" || languageMode === "both") && sec.headingLatin;
        return `<div class="section-heading">${escapeHtml(sec.text)}${showLa ? `<span class="heading-latin">${escapeHtml(sec.headingLatin)}</span>` : ""}</div>`;
      }
      case "rubric": {
        // {{...}} in the source data marks a black-rubric segment (the
        // LaTeX source's own \blackrubric{} macro) within an otherwise-
        // red rubric - words/phrases that name something outside the
        // rubric itself (a canticle, a Creed, a Feast). See the
        // .rubric-black-inline note in style.css.
        return `<p class="rubric">${renderRubricText(sec.text)}</p>`;
      }
      case "versicle": {
        // v is optional: a few Little Hours sections are a bare "℟. Thanks
        // be to God." continuing the previous versicle's dialogue, with no
        // new ℣. line of their own.
        // alleluiaSuffix marks the closing "Let us bless the Lord (alleluia,
        // alleluia.)" versicle at Mattins/Evensong - that parenthetical is
        // only added from Easter Day through the Saturday in Whitsun Ember
        // Week inclusive (the historic "time of Alleluia"; see the Mass
        // Gradual rubric in PropSeas.tex, "From this day until Ember
        // Saturday in Whitsun Week, inclusive"), not year-round.
        let v = sec.v, r = sec.r, vLatin = sec.vLatin, rLatin = sec.rLatin;
        // "O Lord, save the State." (America) vs. "O Lord, save the
        // King." (British Commonwealth) in the Preces, per Augustine's
        // 8/22 answer. The response is identical either way.
        if (sec.regionVersicle && region === "commonwealth") {
          v = sec.vCommonwealth !== undefined ? sec.vCommonwealth : v;
          vLatin = sec.vLatinCommonwealth !== undefined ? sec.vLatinCommonwealth : vLatin;
        }
        if (sec.alleluiaSuffix && !isAlleluiaSeason(resolved)) {
          const stripEn = (s) => s === undefined ? s : s.replace(" (alleluia, alleluia.)", "");
          const stripLa = (s) => s === undefined ? s : s.replace(" (allelúja, allelúja.)", "");
          v = stripEn(v); r = stripEn(r); vLatin = stripLa(vLatin); rLatin = stripLa(rLatin);
        }
        v = resolveMinisterVersicleField(v, false);
        r = resolveMinisterVersicleField(r, false);
        vLatin = resolveMinisterVersicleField(vLatin, true, "℣.");
        rLatin = resolveMinisterVersicleField(rLatin, true, "℟.");
        return (v !== undefined ? renderVersicleLine(v, vLatin, "versicle") : "") +
               (r !== undefined ? renderVersicleLine(r, rLatin, "response") : "");
      }
      case "canticle":
      case "creed":
      case "collect":
      case "text": {
        let secText = sec.text;
        let secTextLatin = sec.textLatin;
        // Requiem Mass text swap (ROADMAP.md: "dynamically swap 'have
        // mercy upon us' -> 'grant them rest' and 'grant us thy peace'
        // -> 'grant them rest everlasting'"), now that massDayChoice
        // gives a real Requiem-Mass signal to key off of - previously
        // only a static informational rubric, never actually applied.
        // Per Augustine's 8/29 answer (Q8 of the release-audit list),
        // this applies "on All Souls' Day and when the Mass is Requiem"
        // - two separate triggers, not one: the manual massDayChoice
        // toggle (any date, priest's own votive choice) OR automatically
        // on All Souls' Day itself (2 November, resolved.kalendarKey
        // "11-2"), whose own Mass is inherently a Requiem regardless of
        // whether the priest has touched the Requiem toggle at all.
        if (sec.requiemText && (massDayChoice === "requiem" || (resolved && resolved.kalendarKey === "11-2"))) {
          secText = sec.requiemText;
          if (sec.requiemTextLatin) secTextLatin = sec.requiemTextLatin;
        }
        // George's 9/8 note, task #186: the automatic Verses-8-11
        // substitution that used to happen here (see ROADMAP.md's 8/23
        // entry) has been removed - the Venite's own text is no longer
        // silently swapped on Red Letter Days. The alternate ending is
        // now only ever shown as a separate, conditionally-visible
        // rubric-plus-text note appended after the Venite (see the
        // `redLetterNotice`-flagged sections in data/mattins-template.json
        // and the `visibleGroup` filter above), matching the source's own
        // presentation (Mattins.tex prints the rubric and the alternate
        // text together, right after the Venite, leaving the choice to
        // the minister rather than making it automatically).
        // `continuousColumns` (8/23 note, currently only the Venite):
        // instead of one bilingual-row per verse - which forces the
        // English and Latin to align line-for-line even where the
        // source Latin condenses several English verses onto a single
        // line (as the Venite's own verses 8-11 do) - render each
        // language as ONE continuous flowing paragraph, independent of
        // the other. This is a distinct, opt-in rendering path rather
        // than a change to the shared per-line behavior, since most
        // other canticles/creeds/collects across the site (Magnificat,
        // Nunc Dimittis, Benedictus, Te Deum, etc.) do keep 1:1
        // line-for-verse Latin/English correspondence and a broader
        // switch would need its own separate confirmation.
        if (sec.continuousColumns) {
          // 8/26 note: Augustine's original complaint about the old
          // per-line bilingual-row layout (row-pairing English verse 9
          // against Latin's condensed verses 10-11, etc. - see this
          // section's own doc comment above) is still correctly solved by
          // keeping the English and Latin columns' line counts fully
          // independent of each other. But collapsing each column into
          // one run-on, space-joined paragraph went a step too far - "the
          // Venite should have verses, it shouldn't be a paragraph of
          // text" (8/26 review). Each column now keeps its own verse-by-
          // verse line breaks (real <br/> tags, not row-boxes), just
          // still never forced to align against the other language's line
          // count. The dropcap, per withDropcap's own contract, only ever
          // applies to the very first line of the passage.
          const buildColumnHtml = (lines) => {
            if (!lines) return null;
            return lines.map((line, i) => (i === 0 ? withDropcap(line, sec.dropcap) : escapeHtml(line))).join("<br/>");
          };
          const enHtml = buildColumnHtml(secText.split("\n"));
          const laHtml = secTextLatin ? buildColumnHtml(secTextLatin.split("\n")) : null;
          if (languageMode === "both") {
            return `<div class="canticle-columns"><div class="col-en">${enHtml}</div><div class="col-la">${laHtml !== null ? laHtml : '<span class="no-latin-note">(no Latin text in source)</span>'}</div></div>`;
          }
          if (languageMode === "latin") {
            if (laHtml !== null) return `<p class="plain-text">${laHtml}</p>`;
            return `<p class="plain-text">${enHtml}<br/><span class="no-latin-note">(no Latin text given in the source for this line)</span></p>`;
          }
          return `<p class="plain-text">${enHtml}</p>`;
        }
        const lines = secText.split("\n");
        const linesLatin = secTextLatin ? secTextLatin.split("\n") : null;
        // sec.citation (8/25 note): render a trailing scriptural citation
        // the same small, gray, parenthesized style already used for the
        // Daily Office's Opening Sentences (.sentence-citation, see
        // renderForeOffice) and Comfortable Words - appended only to the
        // last line's English cell, matching those two existing patterns
        // (citations aren't duplicated on the Latin side).
        const rendered = lines.map((line, i) => {
          const la = linesLatin ? linesLatin[i] : (sec.noLatinInSource ? undefined : null);
          const isLast = i === lines.length - 1;
          const suffix = (isLast && sec.citation) ? ` <span class="sentence-citation">(${escapeHtml(sec.citation)})</span>` : "";
          return renderBilingualLine(line, la === null ? undefined : la, sec.dropcap, i === 0, suffix);
        }).join("");
        // Matrimony's "Those whom God hath joined together" (8/23 note:
        // centered, small caps) is the only user of this flag so far -
        // a generic opt-in on the plain "text" type rather than a new
        // one-off type, in case other solemn declarations need the same
        // treatment later.
        if (sec.centeredSmallCaps) return `<div class="solemn-declaration">${rendered}</div>`;
        // The Words of Institution (8/25 note, from George's two
        // reference photos): set the actual sacramental formula - "This
        // is my Body...", "This is my Blood...", "Do this, as oft as ye
        // shall drink it..." - visually apart from the surrounding
        // narrative/rubrical frame ("For in the night in which he was
        // betrayed, he took Bread..."), so the Priest can find the
        // words themselves at a glance mid-Mass. A left-border indent
        // block (.institution-words) rather than attempting either
        // reference photo's literal margin-note layout, which depends
        // on a note staying vertically pinned to its inline letter
        // marker - not reliable in a reflowing responsive page (Text
        // Size setting, mobile widths). The inline (a)/(b)/(c) letter
        // markers themselves are left exactly as transcribed, in the
        // surrounding frame text; see the new "ceremonialNotes" case
        // just below for where their explanations now render.
        return sec.institutionWords ? `<div class="institution-words">${rendered}</div>` : rendered;
      }
      case "ceremonialNotes": {
        // The paired half of institutionWords above: the lettered
        // ceremonial-action notes ("(a) He takes & holds the Bread.")
        // that a print missal pins in a side margin next to the letter
        // it explains. Rendered here as a small, left-aligned list
        // right after the paragraph instead - same information, same
        // order, no fragile vertical alignment to maintain. Deliberately
        // its own section type rather than another rubric flag: this is
        // a list of discrete (letter, text) pairs, not one running
        // sentence, and the source data already carries it that way.
        const items = (sec.notes || []).map((n) =>
          `<div class="ceremonial-note"><span class="ceremonial-note-letter">(${escapeHtml(n.letter)})</span> ${escapeHtml(n.text)}</div>`
        ).join("");
        return `<div class="ceremonial-notes">${items}</div>`;
      }
      case "biddingPrayer": {
        // 8/23 note: "replace the inline rubric with a show/hide toggle
        // button, defaulting to hidden" - reuses the existing (until now
        // orphaned - see the removed Mattins/Evensong "additional
        // prayers" link elsewhere in ROADMAP.md) .optional-toggle/
        // .optional-section CSS, wired via a single delegated click
        // listener on massBody rather than per-render rebinding (see
        // the "Bidding Prayer toggle" section further down this file).
        const partsHtml = sec.parts.map((p) => {
          if (p.type === "rubric") return `<p class="rubric">${renderRubricText(p.text)}</p>`;
          return renderBilingualLine(p.text, undefined, p.dropcap, true);
        }).join("");
        return `<div class="section-heading">${escapeHtml(sec.heading)}</div>` +
          `<p class="rubric-fine">${escapeHtml(sec.rubric)}</p>` +
          `<div class="optional-toggle"><button type="button" data-bidding-toggle>Show the Bidding Prayer</button></div>` +
          `<div class="optional-section" hidden>${partsHtml}</div>`;
      }
      case "collapsibleGroup": {
        // A generic version of biddingPrayer's show/hide pattern (same
        // .optional-toggle/.optional-section CSS, defaulting to
        // hidden), but for an arbitrary run of ordinary sections rather
        // than a bespoke rubric/text-only list - `parts` is rendered by
        // simply recursing back through renderSection itself, so any
        // section type (heading, rubric, versicle, text, canticle,
        // collect...) can appear inside. First use: Prime's optional
        // Pretiosa & Commemoration of the Faithful Departed (8/23 note)
        // - Prime/Terce/Sext/None all share one "officeBody" container
        // that gets fully rebuilt on every render, so - like
        // biddingPrayer's own massBody listener - the click handler is
        // a single delegated listener on officeBody (see further down
        // this file) rather than rebound per render.
        // George's 9/8 note, task #188: "The 'Lord be with you' in the
        // Commemoration for the Faithful Departed should not be provided
        // if the layman setting is on." Unlike the sitewide "(or, O
        // Lord, hear our prayer.)" swap (resolveMinisterVersicleField,
        // used when the source itself gives an explicit Layman
        // alternative), CommemorationDeparted.tex's own "The Lord be
        // with you. / And with thy spirit." pair has no such alternate
        // printed - George's own instruction is simply to omit it
        // outright for a Layman, not substitute different text. Since
        // `parts` here is rendered by directly recursing into
        // renderSection (bypassing the ordinary section-filtering while
        // loop in renderOfficeSections, where flags like `priestOnly`
        // normally live), the equivalent `omitForLayman` flag is
        // filtered out right here instead.
        const visibleParts = sec.parts.filter((p) => !(p.omitForLayman && ministerRank === "layman"));
        const partsHtml = visibleParts.map((p) => renderSection(p, resolved)).join("\n");
        return `<div class="section-heading">${escapeHtml(sec.heading)}</div>` +
          `<p class="rubric-fine">${escapeHtml(sec.rubric)}</p>` +
          `<div class="optional-toggle"><button type="button" data-collapsible-toggle data-show-label="${escapeHtml(sec.toggleLabel)}">${escapeHtml(sec.toggleLabel)}</button></div>` +
          `<div class="optional-section" hidden>${partsHtml}</div>`;
      }
      case "gloriaChoice": {
        // Evensong's rubric permits Gloria Patri OR Gloria in excelsis after
        // the Psalms - but never the latter during Advent, Septuagesimatide,
        // & Lent. Gloria Patri itself is already said after every individual
        // Psalm/Canticle regardless (see psalms.js), so during those seasons
        // this section contributes nothing further and just explains why.
        // George's 9/2 note, task #143: the last Psalm's own "after"
        // antiphon (deliberately withheld by psalms.js's "psalms" case
        // above, via omitAfterAntiphon) belongs here, right after
        // whichever of these paths this section takes - still ahead of
        // the First Lesson that follows this whole section in the
        // template. Appended to every return below, including the
        // Advent/Septuagesima/Lent early return, since that branch still
        // needs to show it even though it has no Gloria toggle of its
        // own to attach to.
        const deferredAntiphonHtml = renderDeferredLastPsalmAntiphon(resolved);
        const seasonKey = typeof seasonKeyFor === "function" ? seasonKeyFor(resolved.periodKey) : null;
        if (seasonKey === "advent" || seasonKey === "septuagesima" || seasonKey === "lent") {
          return `<p class="rubric">${renderRubricText(sec.omittedRubric)}</p>` + deferredAntiphonHtml;
        }
        // Button order matches the default-first convention used by
        // every other toggle on the site (see ambrosePortion, votiveThirdCollect,
        // matinsDeadNocturns, etc.) - "Gloria Patri" is now the default
        // (Augustine's 9/5 answer), so it's listed first here too.
        const toggleHtml = renderInlineToggle("gloria", [
          { value: "patri", label: "Gloria Patri" },
          { value: "excelsis", label: "Gloria in excelsis" },
        ], gloriaChoice);
        if (gloriaChoice === "patri") {
          const showLa = (languageMode === "latin" || languageMode === "both") && sec.patriHeadingLatin;
          return toggleHtml +
            `<div class="section-heading">${escapeHtml(sec.patriHeadingText)}${showLa ? `<span class="heading-latin">${escapeHtml(sec.patriHeadingLatin)}</span>` : ""}</div>` +
            renderVersicleLine(sec.patriV, sec.patriVLatin, "versicle") +
            renderVersicleLine(sec.patriR, sec.patriRLatin, "response") +
            deferredAntiphonHtml;
        }
        const showLa = (languageMode === "latin" || languageMode === "both") && sec.headingLatin;
        const lines = sec.text.split("\n");
        const linesLatin = sec.textLatin ? sec.textLatin.split("\n") : null;
        return toggleHtml +
          `<div class="section-heading">${escapeHtml(sec.headingText)}${showLa ? `<span class="heading-latin">${escapeHtml(sec.headingLatin)}</span>` : ""}</div>` +
          lines.map((line, i) => renderBilingualLine(line, linesLatin ? linesLatin[i] : undefined, true, i === 0)).join("") +
          deferredAntiphonHtml;
      }
      case "comfortableWords": {
        // Mass Ordinary's Comfortable Words (8/23 note): each attribution
        // ("Hear also what Saint Paul saith.") centered in small caps,
        // and each quote's scriptural citation in the same small gray
        // style already used for the Daily Office's Opening Sentences
        // (.sentence-citation, see renderForeOffice) - reusing that
        // established class rather than inventing a second one.
        const quotesHtml = (sec.quotes || []).map((q) => {
          const cite = q.citation ? ` <span class="sentence-citation">(${escapeHtml(q.citation)})</span>` : "";
          return `<p class="plain-text">${escapeHtml(q.text)}${cite}</p>`;
        }).join("");
        return `<p class="comfortable-words-attribution">${escapeHtml(sec.attribution)}</p>` + quotesHtml;
      }
      case "inlineToggle": {
        const current = getInlineToggleCurrent(sec.toggle);
        return renderInlineToggle(sec.toggle, sec.options, current);
      }
      case "officeDeadCollect": {
        // Task #167: Vespers/Matins/Lauds of the Dead all shared one bare
        // rubric ("The appropriate collect is here said (p. \pageref{dead})")
        // with no actual Collect text ever transcribed anywhere on the
        // site. data/collects-dead.json now holds all 10 usable options
        // from that page's own "Prayers for the Dead" subsection; this one
        // self-contained section type renders both the picker and the
        // currently-selected text together, so only a single JSON entry
        // (in place of the old rubric) is needed in each of the three rite
        // files, rather than three copies of ten option-gated blocks.
        const dead = window.COLLECTS_DEAD;
        if (!dead || !Array.isArray(dead.options) || !dead.options.length) return "";
        const toggleOptions = dead.options.map((o) => ({ value: o.value, label: o.label }));
        const current = officeDeadCollectChoice || dead.default;
        const chosen = dead.options.find((o) => o.value === current) || dead.options[0];
        const lines = chosen.text.split("\n");
        const rendered = lines.map((line, i) => renderBilingualLine(line, undefined, true, i === 0)).join("");
        return renderInlineToggle("officeDeadCollect", toggleOptions, current) + rendered;
      }
      case "burialLesson": {
        // Task #199: Burial.tex's Lesson rubric names its default reading
        // ("1 Corinthians 15:20", the only one of the three ever actually
        // transcribed) plus a permitted note ("Note, Either Romans
        // 8:14-39 or John 14:1-6 may be said instead.") that just left
        // the two alternatives as citations, never as sourced text - no
        // rite file on this site had ever transcribed either passage.
        // George's corrections doc: "A button should be put in the
        // Lesson section allowing for easy selection of the preferred
        // Lesson option, instead of the rubric there." Rather than
        // hand-transcribe two new passages (risking a transcription
        // error the rest of this site's Scripture never risks), this
        // reuses the same window.Scripture.resolveCitation/window.KJV_DATA
        // machinery that already renders every Daily Office Lesson
        // (lesson1/lesson2 above) - so all three readings, including the
        // already-sourced default, are drawn live from the identical KJV
        // text data this site already trusts everywhere else.
        const BURIAL_LESSON_OPTIONS = [
          { value: "1cor15", label: "1 Corinthians 15:20", citation: "1 Cor 15:20-58" },
          { value: "rom8", label: "Romans 8:14-39", citation: "Rom 8:14-39" },
          { value: "jn14", label: "John 14:1-6", citation: "Jn 14:1-6" },
        ];
        const current = burialLessonChoice || "1cor15";
        const chosen = BURIAL_LESSON_OPTIONS.find((o) => o.value === current) || BURIAL_LESSON_OPTIONS[0];
        const toggleOptions = BURIAL_LESSON_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
        const toggleHtml = renderInlineToggle("burialLesson", toggleOptions, current);
        const result = (window.Scripture && kjvData) ? window.Scripture.resolveCitation(chosen.citation, kjvData, apocryphaData) : { ok: false, reason: "unparsed" };
        if (!result.ok) {
          return toggleHtml + `<div class="lesson-block"><div class="lesson-citation">Lesson: ${escapeHtml(chosen.label)}</div><div class="placeholder-block"><span class="missing">This citation couldn't be automatically resolved to scripture text in this prototype (see ROADMAP.md).</span></div></div>`;
        }
        const text = result.verses.map((v) => v.text).join(" ");
        return toggleHtml + `<div class="lesson-block"><div class="lesson-citation">Lesson: ${escapeHtml(chosen.label)}</div><p class="lesson-text">${withDropcap(text, true)}</p></div>`;
      }
      case "hymnStanzas": {
        // George's 9/4 note, task #169: Benediction's O Salutaris Hostia
        // and Tantum Ergo should be formatted "like an Office Hymn" -
        // that means the tight, <br/>-joined poetic-line grouping within
        // each stanza (renderHymnStanza's own style, used sitewide for
        // Mattins/Evensong/Little Hours/Compline's Office Hymns), with a
        // normal paragraph gap between stanzas and the dropcap applied
        // only to the very first stanza's first letter - not the
        // Psalm/Canticle-style one-<p>-per-line layout these two hymns
        // had been using before (data/benediction.json's old single
        // "canticle" sections, whose text just ran each poetic line into
        // its own paragraph with a mid-line " * " caesura mark, exactly
        // like a Psalm verse). Unlike every other Office Hymn on the
        // site, though, these two are already fully and accurately
        // transcribed bilingually (`stanzasLatin`) - Office Hymns
        // elsewhere are English-only because they're free metrical
        // translations with no clean line-for-line Latin pairing, but
        // O Salutaris/Tantum Ergo's Latin has been on this site since
        // before this task and lines up one-for-one with the English, so
        // it's kept and given the same tight per-stanza grouping via its
        // own column, rather than discarded to match the (narrower)
        // English-only Office Hymn convention.
        const stanzas = sec.stanzas || [];
        const stanzasLatin = sec.stanzasLatin;
        if (languageMode === "both") {
          return stanzas.map((stanza, i) => {
            const enHtml = buildHymnStanzaLines(stanza, i === 0);
            const laStanza = stanzasLatin ? stanzasLatin[i] : undefined;
            const laHtml = laStanza !== undefined ? buildHymnStanzaLines(laStanza, i === 0) : null;
            return `<div class="canticle-columns hymn-stanza-row"><div class="col-en">${enHtml}</div><div class="col-la">${laHtml !== null ? laHtml : '<span class="no-latin-note">(no Latin text in source)</span>'}</div></div>`;
          }).join("");
        }
        if (languageMode === "latin" && stanzasLatin) {
          return stanzasLatin.map((stanza, i) => renderHymnStanza(stanza, i === 0)).join("");
        }
        return stanzas.map((stanza, i) => renderHymnStanza(stanza, i === 0)).join("");
      }
      case "placeholder":
        return renderPlaceholder(sec.key, resolved, sec);
      case "end": {
        const showLa = (languageMode === "latin" || languageMode === "both") && sec.textLatin;
        return `<p class="end-mark">${escapeHtml(sec.text)}${showLa ? `<span class="end-latin">${escapeHtml(sec.textLatin)}</span>` : ""}</p>`;
      }
      default:
        return "";
    }
  }

  function renderOfficeSections(template, resolved) {
    // Sections flagged `optional` (the Prayers for the Clergy & People,
    // General Thanksgiving, etc.) used to render behind a "Show/Hide
    // additional prayers" toggle. Per Augustine's 8/13 review notes, that
    // link should be removed outright, not merely defaulted open - so
    // `optional` is no longer treated as special at all here; it just
    // renders like every other section.
    //
    // Sections flagged `veniteGroup` (Mattins' Venite block: invitatory
    // antiphon, heading, canticle, Gloria Patri, closing antiphon, and
    // the Red Letter Day verse-substitution note) are omitted as a
    // contiguous unit on the days the rubric requires - see
    // isVeniteOmittedToday.
    // Sections flagged `priestOnly` (Prime and Compline's "If a Priest be
    // present, he shall stand and pronounce the following Absolution"
    // rubric, and the priestly Absolution text itself) only render for
    // ministerRank === "priest" - a Deacon or Layman only gets the
    // preceding, unconditional "Almighty God, have mercy upon us..."
    // line, which already serves as the non-priest Minister's Collect
    // per Augustine's 8/22 answer.
    const parts = [];
    let i = 0;
    const sections = template.sections;
    let lastVersicleResolvedV = null;
    while (i < sections.length) {
      const sec = sections[i];
      if (sec.veniteGroup) {
        const group = [];
        while (i < sections.length && sections[i].veniteGroup) { group.push(sections[i]); i++; }
        // The Ash Wednesday toggle only matters (and so only appears) on
        // Ash Wednesday itself - see isVeniteOmittedToday. On the three
        // unconditionally-omitted days (Maundy Thursday/Good Friday/
        // Easter Even) the toggle is meaningless and stays hidden.
        const ashToggle = resolved && resolved.periodKey === "Ash Wednesday"
          ? renderInlineToggle("veniteAsh", [
              { value: "false", label: "Include the Venite" },
              { value: "true", label: "Omit the Venite" },
            ], omitVeniteAshWednesday ? "true" : "false")
          : "";
        if (resolved && isVeniteOmittedToday(resolved)) {
          parts.push(ashToggle + `<p class="rubric-black">The Venite is omitted today.</p>`);
        } else {
          // George's 9/8 note, task #186: "the Venite (Psalm 95) should
          // remain the same as on other days" even on Red Letter Days -
          // reverting the 8/23 change (see the removed `redLetterAltTail`
          // substitution this same case used to apply) that silently
          // swapped the printed verses. "However, on those days, the
          // rubric allowing the alternative text should be present" - the
          // source's own rubric (Mattins.tex: "On any Red Letter Day,
          // Verses 8-11 of the Venite may be replaced with the
          // following.") always prints the alternate ending right there
          // in the book (it has no way to be day-aware), leaving the
          // choice to the minister; this site instead only shows that
          // same rubric-plus-text note on an actual Red Letter Day, via
          // the two new `redLetterNotice`-flagged sections appended to
          // this group.
          const visibleGroup = group.filter((s) => !(s.redLetterNotice && resolved && !isRedLetterDay(resolved)));
          parts.push(ashToggle + visibleGroup.map((s) => renderSection(s, resolved)).join("\n"));
        }
        continue;
      }
      if (sec.priestOnly && ministerRank !== "priest") { i++; continue; }
      // Matrimony's Thanksgiving psalm choice (128/67) - see matrimonyPsalmChoice.
      if (sec.matrimonyPsalmOption && sec.matrimonyPsalmOption !== matrimonyPsalmChoice) { i++; continue; }
      // Reception of Converts' penitential psalm choice (51/130) - see receptionPsalmChoice.
      if (sec.receptionPsalmOption && sec.receptionPsalmOption !== receptionPsalmChoice) { i++; continue; }
      // Burial of the Dead's "At the Grave" either/or sentence choice (task #199) - see burialGraveSentenceChoice.
      if (sec.burialGraveSentenceOption && sec.burialGraveSentenceOption !== burialGraveSentenceChoice) { i++; continue; }
      // Mass Ordinary's Ten Commandments vs. Summary of the Law choice - see commandmentsChoice.
      if (sec.commandmentsOption && sec.commandmentsOption !== commandmentsChoice) { i++; continue; }
      // Votive Masses' "Our Lady on Saturday": which of the 5 seasonal
      // forms to show, auto-picked by date - see pickBvmSaturdaySeason.
      if (sec.bvmSeasonOption && resolved && sec.bvmSeasonOption !== pickBvmSaturdaySeason(resolved)) { i++; continue; }
      // Votive Masses' "Against the Persecutors of the Church" / "For
      // the Chief Bishop" third-collect choice - manual toggle, per
      // Augustine's 8/29 answer (Q10) - see votiveThirdCollectChoice.
      if (sec.votiveThirdCollectOption && sec.votiveThirdCollectOption !== votiveThirdCollectChoice) { i++; continue; }
      // Compline's Standard vs. Memorial Collect choice - see complineCollectChoice.
      if (sec.complineCollectOption && sec.complineCollectOption !== complineCollectChoice) { i++; continue; }
      // Mattins' two alternate Prayers for the President - see presidentPrayerChoice.
      if (sec.presidentPrayerOption && sec.presidentPrayerOption !== presidentPrayerChoice) { i++; continue; }
      // Mass's Final Blessing: four mutually exclusive printed dismissal
      // forms ("On days when the Gloria in excelsis is said," / "is not
      // said," / "In Requiem Masses," / "In Eastertide, in Masses of the
      // Season,") that used to all print unconditionally, one after
      // another, with the reader left to pick the right one themselves
      // (8/26 note: "the Gloria in excelsis... should be presented only
      // as liturgically appropriate"; see ROADMAP.md). Now automated via
      // pickFinalBlessingVariant, gated by the same finalBlessingVariant
      // flag on every section belonging to a given form.
      if (sec.finalBlessingVariant && resolved && sec.finalBlessingVariant !== pickFinalBlessingVariant(resolved)) { i++; continue; }
      // The Great Litany's own "Minister may, at his discretion, omit
      // all that followeth [the Lord's Prayer], to the Prayer, We
      // humbly beseech thee, O Father, etc." permission - see
      // litanyForm. The "Let us pray." immediately before that final
      // Prayer is deliberately NOT flagged (kept always-visible as that
      // Prayer's own lead-in), matching the source's own "to the
      // Prayer" wording (up to, not including, We humbly beseech thee).
      if (sec.litanyOmittable && litanyForm === "shortened") { i++; continue; }
      // Matins of the Dead's one-Nocturn-vs-three-Nocturns choice - see
      // matinsDeadNocturns/matinsDeadNocturnPick. `nocturnsOption` gates
      // the two alternate closing Responsories (one said only when a
      // single Nocturn is used, the other only when all three are); the
      // Nocturn-picker inlineToggle section itself is also flagged
      // `nocturnsOption: "one"` so it only appears once there is
      // something to pick. `nocturnGroup` gates each Nocturn's own
      // heading/Psalms/Lesson/Responsory block by number (1/2/3) - only
      // consulted in "one" mode, since all three always show in "three"
      // mode regardless of which weekday the picker is currently set to.
      if (sec.nocturnsOption && sec.nocturnsOption !== matinsDeadNocturns) { i++; continue; }
      if (sec.nocturnGroup && matinsDeadNocturns === "one" && String(sec.nocturnGroup) !== matinsDeadNocturnPick) { i++; continue; }
      // Preparation for Holy Communion's Prayer of St. Ambrose (task
      // #168) - see ambrosePortion/ambroseDayPick. `ambrosePortionOption`
      // gates the day-picker inlineToggle section itself, so it only
      // appears once "portion" mode makes it meaningful (mirroring
      // matinsDeadNocturnPick's own `nocturnsOption: "one"` gate above).
      // `weekdayPortion` (0 Sunday - 6 Saturday, same numbering as
      // ambroseDayPick) gates each day's own heading/text block - only
      // consulted in "portion" mode, since "full" always shows all seven
      // regardless of which weekday is currently picked.
      if (sec.ambrosePortionOption && sec.ambrosePortionOption !== ambrosePortion) { i++; continue; }
      if (sec.weekdayPortion !== undefined && ambrosePortion === "portion" && String(sec.weekdayPortion) !== ambroseDayPick) { i++; continue; }
      // Mass Ordinary's Gloria in Excelsis, auto-omitted in Advent/
      // Septuagesimatide/Lent - see isGloriaOmittedSeason. Reuses the
      // same three-season bucket as Evensong's own "gloriaChoice"
      // seasonal suppression (see renderSection) for consistency, PLUS
      // (8/26 note: "certain rubrics or texts like the Gloria in
      // excelsis should be presented only as liturgically appropriate")
      // the classical rubric's rank-based omission: outside those three
      // seasons, the Gloria is said on Sundays and on Semidouble-or-
      // higher Feast Days, but omitted on ordinary ferias and on
      // Memorial/Simple-rank days - see shouldOmitMassGloria below. Still
      // doesn't cover Ember Days/Vigils specifically (not yet
      // distinguished from an ordinary feria in this data) or a votive
      // Requiem Mass chosen on a day that would otherwise say the
      // Gloria (no Requiem-Mass setting exists yet - see ROADMAP.md).
      if (sec.seasonalOmit === "gloriaMass" && resolved && shouldOmitMassGloria(resolved)) { i++; continue; }
      if (sec.seasonalOmitNotice === "gloriaMass" && resolved && !shouldOmitMassGloria(resolved)) { i++; continue; }
      // Mass Ordinary's Nicene Creed - see shouldOmitMassCreed's own long
      // comment for the full rule and its sourcing (George's 9/1 note).
      if (sec.seasonalOmit === "creedMass" && resolved && shouldOmitMassCreed(resolved)) { i++; continue; }
      // Asperges's Gloria Patri, auto-omitted in Passiontide - see
      // isPassiontideToday. `seasonalOmit: "gloriaAsperges"` marks the
      // Gloria Patri itself; `seasonalOnly: "gloriaAsperges"` marks the
      // repeated-psalm-verse section that stands in its place, per the
      // rubric's own words "the psalm simply being repeated."
      if (sec.seasonalOmit === "gloriaAsperges" && resolved && isPassiontideToday(resolved)) { i++; continue; }
      if (sec.seasonalOnly === "gloriaAsperges" && resolved && !isPassiontideToday(resolved)) { i++; continue; }
      // Pending-corrections note (10/2): the Mass Ordinary's Lavabo
      // (Psalm 26 said while the Priest washes his hands) had its Gloria
      // Patri printed unconditionally too - see Rubrics.tex's own
      // "Gloria Patri" entry, quoted above the Introit's own fix. Unlike
      // Asperges, Mass.tex gives no Passiontide repeat-substitute for
      // this one, so it's simply omitted with nothing standing in its
      // place.
      if (sec.seasonalOmit === "gloriaLavabo" && resolved && isPassiontideToday(resolved)) { i++; continue; }
      // ForeMass's Judica me Psalm + its repeated Antiphon, auto-omitted
      // in Masses for the Dead and in Passiontide - see
      // shouldOmitForeMassPsalm's own comment.
      if (sec.omitJudicaMe && shouldOmitForeMassPsalm(resolved)) { i++; continue; }
      // Last Gospel auto-omission (Christmas Day only - see
      // shouldOmitLastGospel's own comment).
      if (sec.lastGospelOmit && resolved && shouldOmitLastGospel(resolved)) { i++; continue; }
      if (sec.lastGospelOmitNotice && resolved && !shouldOmitLastGospel(resolved)) { i++; continue; }
      // Prime/Terce/Sext/None's Suffrages ("The Suffrages are said,
      // kneeling, on all Ferias outside of Eastertide") - see
      // suffragesSaidToday. `feriaOnly` marks the actual Suffrages
      // content; `feriaOmittedNotice` marks the single replacement
      // rubric shown in its place otherwise.
      //
      // George's 9/4 note, task #151, relaying Augustine: "the Suffrages
      // [are] not actually omitted" on Feast Days despite the notice
      // saying they are. An earlier pass here had only tagged Prime's
      // opening Kyrie block and its "O let my mouth..." versicle set as
      // `feriaOnly`, on the assumption that the Lord's Prayer/Confession/
      // Absolution/closing versicles in between and after them should
      // always be said regardless - but Prime.tex's own structure
      // contradicts that: the entire span from the opening Kyrie through
      // "Vouchsafe, O Lord, to keep us this day without sin" sits inside
      // one single `\subsection{Suffrages}`, whose own one rubric ("said,
      // kneeling, on all Ferias outside of Eastertide") governs the
      // whole thing, not just its first few lines - `\subsection{Collect}`
      // is the next heading in the source, and nothing marks an earlier
      // internal boundary. This matches actual historical Sarum/monastic
      // practice too: the Confiteor-and-versicles "Preces feriales" at
      // Prime/Compline are the part customarily dropped on Duplex feasts,
      // while a separate silent Pater Noster at the very start of each
      // Hour (outside this data model entirely) is unaffected. Every
      // section in this whole span now carries `feriaOnly` - Terce/Sext/
      // None don't have this particular gap (see task #156 below; they
      // never had a Confession/Absolution of their own to begin with).
      if (sec.feriaOnly && resolved && !suffragesSaidToday(resolved)) { i++; continue; }
      if (sec.feriaOmittedNotice && resolved && suffragesSaidToday(resolved)) { i++; continue; }
      // regionOnly ("america"/"commonwealth") gates the Third Collect's
      // Prayer for the President / Prayer for the King and the Royal
      // Family, per Augustine's 8/22 answer.
      if (sec.regionOnly && sec.regionOnly !== region) { i++; continue; }
      // A bare "Let us pray." call-to-prayer (v only, no r - e.g.
      // Terce/Sext/None's cue right before their single Collect) is a
      // dialogue-less cue, not a substantive versicle exchange, so it's
      // ignored here entirely rather than counting as "something
      // different happened" and breaking the consecutive-repeat check
      // below. Without this, Terce/Sext/None's "Let us pray." sitting
      // between their two identical swappable versicles would wrongly
      // reset the tracking and let the duplicate through for a Layman.
      if (sec.type === "versicle" && sec.r !== undefined) {
        const resolvedV = resolveMinisterVersicleField(sec.v, false);
        const isSwappable = sec.v !== undefined && MINISTER_OR_EN_RE.test(sec.v);
        if (ministerRank === "layman" && isSwappable && resolvedV === lastVersicleResolvedV) {
          // Would say "O Lord, hear our prayer" twice in a row (with
          // only a Collect between, as at Terce/Sext/None) - per
          // Augustine's 8/22 answer, only say it once.
          i++; continue;
        }
        lastVersicleResolvedV = resolvedV;
      }
      parts.push(renderSection(sec, resolved));
      i++;
    }
    return parts.join("\n");
  }

  /**
   * The Venite is mandatorily omitted on Maundy Thursday, Good Friday,
   * and Easter Even (the three days immediately before Easter), and may
   * optionally be omitted on Ash Wednesday too, per user choice
   * (`omitVeniteAshWednesday`, off by default - the rubric says "may,"
   * not "shall"). Maundy Thursday/Good Friday/Easter Even are computed
   * directly from Easter's date rather than matched against periodKey,
   * since all three share the generic "Palm Sunday" periodKey bucket
   * (only their seasonLabel - "Thursday/Friday/Saturday in Palm Sunday"
   * - actually distinguishes them, which is fragile to match against).
   */
  function isVeniteOmittedToday(resolved) {
    if (typeof getLiturgicalYearAnchors !== "function") return false;
    const anchors = getLiturgicalYearAnchors(resolved.date);
    const diffDays = Math.round((resolved.date - anchors.easterDay) / 86400000);
    if (diffDays === -3 || diffDays === -2 || diffDays === -1) return true;
    if (resolved.periodKey === "Ash Wednesday" && omitVeniteAshWednesday) return true;
    return false;
  }

  /**
   * A "Red Letter Day" - so called from the Kalendar page's own red-ink
   * convention (see kalendarData's `redLetter` flag, already used by
   * the date-picker's feast-dot marking above) - is every Sunday, plus
   * any day carrying a Kalendar entry itself flagged `redLetter: true`
   * (the major Holy Days printed in red). Used to automatically
   * substitute the Venite's alternate Verses 8-11 - see the
   * `redLetterAltTail` field on Mattins' Venite canticle section.
   */
  function isRedLetterDay(resolved) {
    if (!resolved) return false;
    if (resolved.weekdayName === "Sunday") return true;
    return (resolved.kalendar || []).some((e) => e.name && e.redLetter);
  }

  /**
   * A "feria" in the rubrical sense used by Prime/Terce/Sext/None's
   * Suffrages rubric ("said, kneeling, on all Ferias outside of
   * Eastertide") is an ordinary weekday whose Office is still "of the
   * season" - not a Sunday, and not a day a Kalendar feast has actually
   * won (resolveFeastRankToday's winner === "feast"). A day carrying
   * only a merely-*commemorated* lower-rank feast (winner still
   * "season") is still a feria for this purpose - only an outright
   * winning feast, or Sunday itself, disqualifies a day.
   */
  function isFeria(resolved) {
    if (!resolved) return false;
    if (resolved.weekdayName === "Sunday") return false;
    return resolveFeastRankToday(resolved).winner !== "feast";
  }

  /**
   * Whether Prime/Terce/Sext/None's Suffrages are said today: a feria
   * (see isFeria) that also falls outside Eastertide. "Eastertide" here
   * reuses isAlleluiaSeason's boundary (Easter Day through the Saturday
   * in Whitsun Ember Week) - the same "time of Alleluia" the site
   * already tracks for the Mattins/Evensong "(alleluia, alleluia.)"
   * suffix, and a natural fit rubrically: penitential material like
   * these Suffrages ("Vouchsafe, O Lord, to keep us this day without
   * sin...") is exactly what a season of unbroken Alleluias sets aside.
   */
  function suffragesSaidToday(resolved) {
    return isFeria(resolved) && !isAlleluiaSeason(resolved);
  }

  /**
   * Mass Ordinary's Gloria in Excelsis is omitted in Advent,
   * Septuagesimatide, and Lent - the same three-season bucket already
   * used by Evensong's "gloriaChoice" seasonal suppression (see
   * renderSection's "gloriaChoice" case), reused here for consistency.
   */
  function isGloriaOmittedSeason(resolved) {
    if (!resolved || typeof seasonKeyFor !== "function") return false;
    const seasonKey = seasonKeyFor(resolved.periodKey);
    return seasonKey === "advent" || seasonKey === "septuagesima" || seasonKey === "lent";
  }

  // Asperges (task #190, George's corrections doc: "Instead of the rubric
  // about Passiontide, the change should automatically be made during
  // Passiontide.") - Asperges.tex's own rubric: "The following Gloria
  // Patri is omitted in Passiontide, the psalm simply being repeated."
  // Reuses seasonKeyFor's existing "passiontide" bucket (Passion Sunday
  // through Holy Saturday), same helper already relied on by
  // pickFeastCommonHymnLabel's Eastertide check elsewhere.
  function isPassiontideToday(resolved) {
    if (!resolved || typeof seasonKeyFor !== "function") return false;
    return seasonKeyFor(resolved.periodKey) === "passiontide";
  }

  // Prayers at the Foot of the Altar (task #191, George's corrections doc:
  // "Instead of the rubric about changes during Passiontide and Requiem
  // Masses, the text should be automatically be changed during those
  // times.") - ForeMass.tex's own rubric: "In Masses for the Dead, and in
  // Masses of the Season from Passion Sunday to Holy Saturday exclusive,
  // the following Psalm [Judica me] is omitted together with [Gloria
  // Patri] and the repetition of the Antiphon." Three independent
  // triggers, matching the "text" section's own established Requiem
  // detection (see the `sec.requiemText` case above): the manual
  // massDayChoice toggle (any date), automatically on All Souls' Day
  // itself (a Mass for the Dead by nature, kalendarKey "11-2", regardless
  // of whether the priest has touched the Requiem toggle), or
  // automatically during Passiontide regardless of massDayChoice.
  function shouldOmitForeMassPsalm(resolved) {
    if (massDayChoice === "requiem") return true;
    if (resolved && resolved.kalendarKey === "11-2") return true;
    return isPassiontideToday(resolved);
  }

  // The fuller Mass Gloria in excelsis rule. Rubrics.tex's own "Gloria in
  // excelsis" entry: "The Gloria in excelsis is said in the Mass on Feast
  // Days of Double rank and higher. It is also said on all Sundays,
  // except in Advent, Septuagesimatide, and Lent." Omitted year-round in
  // Advent/Septuagesimatide/Lent (isGloriaOmittedSeason, unchanged);
  // outside those seasons, said on Sundays and on Double-or-higher Feast
  // Days, but omitted on an ordinary feria and on a Semidouble/Memorial/
  // Simple-rank day (whether that Memorial is only being commemorated,
  // per the usual automatic ranking, or the Priest has actively chosen
  // to say its own Votive Mass via massDayChoice - a Memorial's Votive
  // Mass never has a Gloria either, so resolveFeastRankToday's own
  // automatic-only tier reading already gives the right answer without
  // needing to consult massDayChoice separately here: a Semidouble/
  // Memorial/Simple never clears tier 4 either way).
  //
  // Pending-corrections note (10/2): this had read `tier >= 3`, which
  // incorrectly included Semidouble (RANK_TIER's tier 3, js/ranking.js) -
  // the rubric names "Double rank and higher" specifically, and
  // RANK_TIER's own descending order (confirmed with Augustine per that
  // file's own comment) puts Double at tier 4, with Semidouble one rank
  // below it, not among the ranks meant here. Corrected to `tier >= 4`.
  function shouldOmitMassGloria(resolved) {
    if (!resolved) return false;
    if (massDayChoice === "requiem") return true; // Requiem Masses never have a Gloria
    if (isGloriaOmittedSeason(resolved)) return true;
    const isSunday = resolved.date && resolved.date.getUTCDay() === 0;
    if (isSunday) return false;
    const feastInfo = resolveFeastRankToday(resolved);
    if (feastInfo.winner === "feast" && feastInfo.tier >= 4) return false;
    return true;
  }

  // George's 9/1 note: "The Gloria in excelsis and Nicene Creed should
  // only be supplied if the rubrics indicate for them to be said." The
  // Missal's own rule (pages/Front/Rubrics.tex, "Nicene Creed" entry) is
  // NOT the same shape as the Gloria's rank-based rule above - it's a
  // disjunction of specific categories, most of which have nothing to do
  // with a day's rank: every Sunday (even a low one); two fixed calendar
  // ranges (Christmas through the Octave of St. John Evangelist, i.e.
  // 25 December - 3 January; Epiphany and its Octave); Maundy Thursday;
  // and Feast Days (with their Octaves) of the Apostles, St. Joseph, the
  // Blessed Virgin Mary, the Holy Cross, Angels, and a long named list of
  // specific Doctors/Fathers (Sts. Ambrose, Augustine of Hippo, Jerome,
  // Hilary, Isidore, Bede, Peter Chrysologus, Athanasius, Basil, Cyril of
  // Alexandria, Cyril of Jerusalem, Ephrem the Syrian, Gregory Nazianzen,
  // Gregory the Great, John Chrysostom, John Damascene) plus St. Mary
  // Magdalene, St. Lawrence, and St. John Baptist. Matched against this
  // site's actual `data/kalendar.json` names below, checked against every
  // commemoration listed for the day (not only the ranking winner - the
  // rubric's own wording, "even if the Mass is of a [Sunday] on which it
  // would not otherwise be said," shows a merely-commemorated feast still
  // counts). `Pope St. Leo I` (rubric) has no match in this Kalendar
  // edition (only `Pope St. Leo II` exists) and `St. Ephram Syrus`
  // matches under this Kalendar's own spelling, `St. Ephrem the Syrian`.
  // Deliberately NOT attempted: the rubric's remaining clauses are
  // parish-specific occasions this site has no way to know about for any
  // given reader (a church's own dedication/patronal-feast anniversary,
  // an altar's consecration day, a bishop's own election/consecration
  // anniversary) or pastoral-discretion cases ("Votive Masses... for a
  // grave matter") rather than calendar facts - left unattempted rather
  // than guessed at. Requiem Masses, like the Gloria, never have a Creed
  // (universal Western practice, not specific to this Missal).
  const MASS_CREED_FEAST_RE = new RegExp([
    "Apostle", // every Apostle feast + Sts. Peter & Paul's dedication/commemoration entries + their Octaves
    "Angel", // St. Michael & All Angels, Holy Guardian Angels, Apparition of St. Michael the Archangel
    "Holy Cross", // Exaltation/Invention of the Holy Cross
    "St\\. Joseph, Spouse of the Blessed Virgin Mary",
    "Annunciation of the Blessed Virgin Mary",
    "Assumption of the Blessed Virgin Mary",
    "Conception of the Blessed Virgin Mary", // catches both the feast and its Octave Day
    "Expectation of the Blessed Virgin Mary",
    "Holy Rosary of the Blessed Virgin Mary",
    "Motherhood of the Blessed Virgin Mary",
    "Nativity of the Blessed Virgin Mary",
    "Presentation of the Blessed Virgin Mary",
    "Purification of the Blessed Virgin Mary",
    "Seven Sorrows of the Blessed Virgin Mary",
    "Visitation of the Blessed Virgin Mary",
    "St\\. Mary Magdalene",
    "St\\. Ambrose of Milan",
    "St\\. Augustine of Hippo",
    "St\\. Jerome,",
    "St\\. Hilary of Poitiers",
    "St\\. Isidore of Seville",
    "St\\. Bede the Venerable",
    "St\\. Peter Chrysologus",
    "St\\. Athanasius of Alexandria",
    "St\\. Basil the Great",
    "St\\. Cyril of Alexandria",
    "St\\. Cyril of Jerusalem",
    "St\\. Ephrem the Syrian",
    "St\\. Gregory Nazianzen",
    "St\\. Gregory of Rome", // "Pope St. Gregory of Rome" - Gregory the Great; other Gregories (II, Palamas, of Armenia, of Nyssa, the Wonder-worker) are NOT in the Missal's named list, so not matched
    "St\\. John Chrysostom",
    "St\\. John Damascene",
    "St\\. Lawrence",
    "St\\. John Baptist",
  ].join("|"));
  function shouldOmitMassCreed(resolved) {
    if (!resolved) return false;
    if (massDayChoice === "requiem") return true;
    const isSunday = resolved.date && resolved.date.getUTCDay() === 0;
    if (isSunday) return false;
    const anchors = typeof getLiturgicalYearAnchors === "function" ? getLiturgicalYearAnchors(resolved.date) : null;
    if (anchors) {
      // Christmas (25 Dec) through the Octave Day of St. John Evangelist
      // (3 Jan), inclusive - both fixed dates regardless of year.
      const christmasToStJohnOctave = daysBetween(anchors.christmas, resolved.date) >= 0 && daysBetween(resolved.date, addDays(anchors.christmas, 9)) >= 0;
      if (christmasToStJohnOctave) return false;
      // Epiphany (6 Jan) and its Octave (through 13 Jan), inclusive.
      const epiphanyToOctave = daysBetween(anchors.epiphany, resolved.date) >= 0 && daysBetween(resolved.date, addDays(anchors.epiphany, 7)) >= 0;
      if (epiphanyToOctave) return false;
      // Maundy Thursday (Palm Sunday + 4 days: Sun -> Thu).
      if (daysBetween(addDays(anchors.palmSunday, 4), resolved.date) === 0) return false;
    }
    const kalendar = resolved.kalendar || [];
    if (kalendar.some((e) => e.name && MASS_CREED_FEAST_RE.test(e.name))) return false;
    return true;
  }

  // "Unless a proper Last Gospel be provided..." (Mass.tex) - the
  // classical rubric this default John 1:1-14 Last Gospel is subject to:
  // it's omitted (not read a second time) on the one day in this
  // Kalendar whose own Mass Gospel of the Day already IS John's
  // Prologue - Christmas Day (see collects-temporale.json's "Christmas"
  // entry, gospelCitation "John 1:1") - since repeating the passage
  // just read moments earlier would be pointless. ROADMAP.md's own
  // to-do ("Omit the Last Gospel rubric entirely unless a proper Last
  // Gospel text is actually supplied for the day") is answered minimally
  // and correctly here: this site has no data for the OTHER classical
  // substitution case (a superseded Sunday's Gospel read as the Last
  // Gospel instead) - so only the one case this data can actually detect
  // without inventing anything is implemented; everywhere else the
  // default Johannine Last Gospel still applies exactly as before.
  function shouldOmitLastGospel(resolved) {
    if (!resolved) return false;
    const resolution = resolveMassPropersWinner(resolved);
    if (!resolution) return false;
    const entry = resolution.winner === "feast" ? resolution.sanctorale : resolution.seasonEntry;
    const gc = entry && entry.gospelCitation;
    return !!gc && /^John\s*1:1\b/.test(gc);
  }

  // Picks today's Proper Preface (js/data-mass-prefaces.js's window.MASS_PREFACES,
  // sourced from the Missal's pages/Mass/Prefaces.tex "Proper Prefaces
  // without Notation" - the plain-text set, matching this project's
  // usual "words, not chant notation" convention) - see Mass.tex's own
  // "The Proper Preface is then here said, if there be one" rubric,
  // previously an honest gap with nothing wired to it at all (see
  // ROADMAP.md's Mass Ordinary to-do list). Returns null when no Proper
  // Preface applies today, in which case the placeholder renders
  // nothing and the Mass's plain default Preface stands alone exactly
  // as it always has.
  //
  // Priority, matching ordinary Western liturgical practice (not
  // spelled out as a single ranked list anywhere in this Kalendar's own
  // sources, but standard wherever a feast's own Preface and a season's
  // running Preface could otherwise both apply): (1) a votive Requiem
  // Mass always uses its own Preface; (2) if TODAY's own winning Mass is
  // a feast with a proper Preface of its own (Blessed Virgin Mary, St.
  // Joseph, an Apostle/Evangelist, All Hallows, or the Purification/
  // Annunciation/Transfiguration "Of Our Lord" preface), that feast's
  // own Preface is said, regardless of season; (3) otherwise the
  // running season's own Preface (Advent/Christmas/Epiphany/Lent/Holy
  // Rood/Easter/Ascension/Holy Ghost), each tied to a periodKey span
  // exactly as Prefaces.tex's own rubrics state; (4) the Most Holy
  // Trinity preface, restricted (per its own rubric) to Sundays only,
  // from Trinity III onward through the Sunday Next before Advent, and
  // Sundays in Septuagesimatide; (5) the three optional Sunday-only
  // Prefaces (Septuagesima/Sexagesima/Quinquagesima), defaulted to "on"
  // for their one named Sunday each, matching this project's usual
  // practice of picking the one sensible default when a rubric offers
  // an optional choice with no toggle mechanism built for it; otherwise
  // no Proper Preface applies (ordinary Trinitytide weekdays, Trinity
  // I/II, and any ordinary feria with no feast of its own kept).
  //
  // Known gap: the four sets of Ember Days share one generic "Ember
  // Wednesday"/"Ember Friday"/"Ember Saturday" periodKey in this site's
  // data regardless of which quarter they fall in (Advent/Lent/Whitsun/
  // September), so they can't be reliably distinguished here - mapped
  // to the Holy Ghost Preface (their position in Prefaces.tex's own
  // list, immediately after Whitsunday) as the closest honest default,
  // rather than resolved per-quarter.
  function pickPreface(resolved) {
    if (!resolved || !window.MASS_PREFACES) return null;
    if (massDayChoice === "requiem") return window.MASS_PREFACES["Requiem"];

    const resolution = resolveMassPropersWinner(resolved);
    if (resolution && resolution.winner === "feast" && resolution.sanctorale) {
      // collectsSanctoraleData's own `name` field is often a short
      // nickname ("Assumption", "Candlemas", "St. James") rather than
      // the full descriptive title these patterns need to match against
      // ("Assumption of the Blessed Virgin Mary", "Purification of the
      // Blessed Virgin Mary", "St. James, Apostle") - the Kalendar's own
      // per-day array (resolution.kalendar, already exposed by
      // resolveMassPropersWinner) carries that full title instead, so
      // look there first and only fall back to the Sanctorale entry's
      // own (possibly nicknamed) name if no Kalendar entry is found -
      // same defensive fallback pattern resolveMassPropersWinner's own
      // sanctoraleRank lookup already uses.
      const kalMatch = (resolution.kalendar || []).find((e) => e.name === resolution.sanctorale.name) || (resolution.kalendar || [])[0];
      const name = (kalMatch && kalMatch.name) || resolution.sanctorale.name || "";
      if (/Purification|Annunciation|Transfiguration/i.test(name)) return window.MASS_PREFACES["Of Our Lord"];
      if (/Spouse of the Blessed Virgin/i.test(name)) return window.MASS_PREFACES["St. Joseph"];
      if (/Apostle|Evangelist/i.test(name)) return window.MASS_PREFACES["Apostles & Evangelists"];
      if (/All Hallows/i.test(name)) return window.MASS_PREFACES["All Hallows"];
      if (/Blessed Virgin Mary/i.test(name)) {
        const feastWordMatch = name.match(/^(\w[\w\s]*?) of the Blessed Virgin Mary/i);
        const feastWord = feastWordMatch ? feastWordMatch[1] : "Nativity";
        return Object.assign({}, window.MASS_PREFACES["Blessed Virgin Mary"], {
          text: window.MASS_PREFACES["Blessed Virgin Mary"].text.replace("{{feast}}", feastWord),
        });
      }
    }

    const periodKey = resolved.periodKey;
    const isSunday = resolved.date && resolved.date.getUTCDay() === 0;

    if (periodKey === "Compassion of Our Lord") return window.MASS_PREFACES["Compassion of Our Lord"];
    if (periodKey === "Corpus Christi") return window.MASS_PREFACES["Christmas"]; // per Prefaces.tex's own Christmas-Preface rubric
    if (/^Advent /.test(periodKey)) return window.MASS_PREFACES["Advent"];
    if (["Christmas", "St. Stephen", "St. John Evangelist", "Holy Innocents", "Christmas I", "Circumcision", "Most Holy Name of Jesus", "Christmas II"].includes(periodKey)) return window.MASS_PREFACES["Christmas"];
    if (periodKey === "Epiphany") return window.MASS_PREFACES["Epiphany"];
    // The named Sunday's own optional Preface takes priority over the
    // generic "Sundays in Septuagesimatide" Trinity Preface below - see
    // this function's own doc comment on why, given both are offered as
    // alternatives by the source with no toggle built for the choice.
    if (isSunday && periodKey === "Septuagesima") return window.MASS_PREFACES["Septuagesima"];
    if (isSunday && periodKey === "Sexagesima") return window.MASS_PREFACES["Sexagesima"];
    if (isSunday && periodKey === "Quinquagesima") return window.MASS_PREFACES["Quinquagesima"];
    if (["Ash Wednesday", "Lent I", "Lent II", "Lent III", "Lent IV"].includes(periodKey)) return window.MASS_PREFACES["Lent"];
    if (["Passion Sunday", "Palm Sunday"].includes(periodKey)) return window.MASS_PREFACES["Holy Rood"];
    if (["Easter Day", "Easter I", "Easter II", "Patronage of St. Joseph", "Easter III", "Easter IV", "Rogation Sunday"].includes(periodKey)) return window.MASS_PREFACES["Easter"];
    if (["Ascension Thursday", "Sunday within Ascension Octave"].includes(periodKey)) return window.MASS_PREFACES["Ascension"];
    if (["Whitsunday", "Ember Wednesday", "Ember Friday", "Ember Saturday"].includes(periodKey)) return window.MASS_PREFACES["Holy Ghost"];
    if (periodKey === "Trinity Sunday") return window.MASS_PREFACES["Most Holy Trinity"];
    if (isSunday && /^Trinity (III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX|XXI|XXII|XXIII|XXIV)$/.test(periodKey)) return window.MASS_PREFACES["Most Holy Trinity"];
    if (isSunday && periodKey === "Sunday Next before Advent") return window.MASS_PREFACES["Most Holy Trinity"];
    return null;
  }

  // Picks which of the Final Blessing's four printed dismissal forms
  // applies today - see the finalBlessingVariant gating in
  // renderOfficeSections above. Priority order matches how the four
  // rubrics themselves are printed and read: a Requiem Mass (a pastoral
  // choice via massDayChoice - see applyMassDayChoice's own comment on
  // why this needs a manual toggle rather than a date fact) always uses
  // its own fixed dismissal regardless of season; otherwise, in the
  // "time of Alleluia" (isAlleluiaSeason, already used elsewhere for the
  // Daily Office's own alleluia parenthetical) *and* only when the
  // season's own Mass of the day is being said (per the rubric's own
  // "in Masses of the Season" qualifier - a competing Feast Day's Mass
  // during Eastertide is not covered by this printed rubric, so it falls
  // through to the ordinary Gloria-said/not-said check below); otherwise
  // it comes down to whether the Gloria in excelsis was actually said,
  // per shouldOmitMassGloria.
  function pickFinalBlessingVariant(resolved) {
    if (massDayChoice === "requiem") return "requiem";
    if (typeof isAlleluiaSeason === "function" && isAlleluiaSeason(resolved)) {
      const resolution = resolveMassPropersWinner(resolved);
      if (resolution && resolution.winner === "season") return "eastertide";
    }
    return shouldOmitMassGloria(resolved) ? "gloriaOmitted" : "gloriaSaid";
  }

  // "Our Lady on Saturday" (Votive Masses page) has five seasonal forms
  // (data/votive.json's bvmSeasonOption: advent/epiphany/septuagesima/
  // eastertide/trinitytide), each carrying its own explicit VOTIVE-usage
  // date range straight from the source rubric (Votive.tex, transcribed
  // verbatim into each season's own rubric line in the data) - e.g.
  // Epiphanytide's own printed rubric: "From the Octave of the Epiphany
  // (or in Votive Masses, from 26 December) until 1 February, inclusive."
  // Per Augustine's 8/29 answer (Q10): auto-calculate which one applies
  // by date, using the site's existing seasonKeyFor() 9-way season
  // bucket (office-variants.js) rather than re-deriving exact moveable-
  // feast day arithmetic a second time - mapped down to the 5 forms this
  // data actually has. This is intentionally an approximation at the
  // narrow boundary seams (e.g. Epiphanytide's rubric technically starts
  // 26 December, one day after Christmas proper, not at the start of
  // seasonKeyFor's whole "christmas" bucket; Septuagesimatide's votive
  // range technically ends at the Saturday after Passion Sunday, not the
  // full width of the "passiontide" bucket) - every such seam falls
  // either within Christmastide itself or within Holy Week/the Easter
  // Octave, i.e. "always-season" days per ranking.js where no Votive
  // Mass could actually be said anyway, so the imprecision has no live
  // consequence, just flagged here for honesty rather than silently
  // presented as exact computus.
  function pickBvmSaturdaySeason(resolved) {
    if (!resolved || !resolved.periodKey) return "trinitytide";
    const sk = typeof seasonKeyFor === "function" ? seasonKeyFor(resolved.periodKey) : "trinitytide";
    if (sk === "christmas") return "epiphany";
    if (sk === "lent" || sk === "passiontide") return "septuagesima";
    if (sk === "ascensiontide") return "eastertide";
    return sk; // advent/epiphany/septuagesima/eastertide/trinitytide already match directly
  }

  function renderOfficePage() {
    document.querySelectorAll("#hoursMenu a").forEach((a) => {
      a.classList.toggle("selected", a.getAttribute("href") === `#office/${currentHour}`);
    });
    document.getElementById("currentDateLabel").textContent = fmtDate(currentDate);
    const resolved = resolveLiturgicalDay(currentDate, lectionaryData, kalendarData);

    // Table 2 "tomorrow wins" (codes 1/3/5 - see resolveEveningDisplacement
    // and TABLE2_TOMORROW_WINS in ranking.js): only ever checked for the
    // Evensong hour, since Table 2 concerns Vespers specifically. When it
    // fires, the whole render pass below uses tomorrow's resolved day
    // (renderResolved) instead of today's, so Psalms/Lessons/Hymn/Collect
    // all render as First Evensong of tomorrow's feast - not just the
    // Collect, per the scoping note this deliberately left out until now.
    // eveningDisplacement itself is reset every call so it can never leak
    // into another Hour's or another day's render.
    eveningDisplacement = currentHour === "evensong" ? resolveEveningDisplacement(resolved) : null;
    const renderResolved = eveningDisplacement ? eveningDisplacement.tomorrowResolved : resolved;

    applyLiturgicalColor(renderResolved);
    const officeFeastInfo = resolveFeastRankToday(renderResolved);
    // George's note: "today is a Saturday office of the BVM, but Matins
    // and Vespers is treating it as just a saturday." Only this (the
    // Office page's own title) is adjusted here - not computeDayTitle
    // itself, which the Mass page and the Home page's "Today" card also
    // call, and which must keep showing the plain season label for
    // those, since the Votive Mass's own "Our Lady on Saturday" rubric
    // has a different threshold (see isOfficeOfOurLadyToday above).
    let officeTitleText = computeDayTitle(renderResolved);
    if (isOfficeOfOurLadyToday(renderResolved, officeFeastInfo)) {
      officeTitleText = `${officeTitleText} (Office of Our Lady)`;
    }
    // George's consolidated 10/7 note: "Mattins and Evensong of All
    // Souls' Day should be the Office of the Dead with Double rite." See
    // isAllSoulsOfficeOfTheDeadToday above for the full scoping rationale.
    const allSoulsDeadOffice = (currentHour === "mattins" || currentHour === "evensong") && isAllSoulsOfficeOfTheDeadToday(renderResolved, officeFeastInfo);
    if (allSoulsDeadOffice) {
      officeTitleText = `${officeTitleText} — the Office of the Dead (Double rite)`;
    }
    document.getElementById("seasonLabel").textContent = officeTitleText;
    document.getElementById("kalendarLine").innerHTML = renderKalendarLine(renderResolved, officeFeastInfo);
    document.getElementById("fallbackNote").textContent = renderResolved.lectionary ? "" : "No exact lectionary entry found for this day in this prototype's data yet.";

    const body = document.getElementById("officeBody");
    const titleEl = document.getElementById("officeTitle");

    if (allSoulsDeadOffice) {
      // Mattins of the Dead (Matins + Lauds, said together as one Hour in
      // the classical form) substitutes for the ordinary Mattins;
      // Vespers of the Dead substitutes for the ordinary Evensong.
      // `currentTemplate` is left at whatever it already was (or null) -
      // safe, since none of these three templates has a "placeholder"
      // section, the only section type that ever reads it.
      currentTemplate = null;
      // Double rite mandates all three Nocturns (see matinsDeadNocturns's
      // own declaration comment above and task #64) - not the user's own
      // "one Nocturn" choice, which only applies on the separate,
      // date-blind Matins-of-the-Dead page. Saved/restored around the
      // render so visiting that page afterward still shows whatever the
      // user had actually chosen there.
      const savedMatinsDeadNocturns = matinsDeadNocturns;
      // Both Nocturn toggles (matinsDeadNocturns itself, and the
      // Nocturn-I/II/III picker that only matters when "one" is chosen)
      // are stripped out here - they have no click handler wired to
      // #officeBody (only to #matinsDeadBody on the dedicated page), and
      // since Double rite forces "three" unconditionally on this page
      // anyway, there is no live choice left for them to offer.
      const stripNocturnToggles = (tmpl) => ({ sections: (tmpl.sections || []).filter((s) => s.type !== "inlineToggle") });
      if (currentHour === "mattins") {
        if (titleEl) titleEl.innerHTML = "Mattins &amp; Lauds of the Dead";
        matinsDeadNocturns = "three";
        const matinsHtml = window.MATINS_DEAD_TEMPLATE ? renderOfficeSections(stripNocturnToggles(window.MATINS_DEAD_TEMPLATE), renderResolved) : "";
        matinsDeadNocturns = savedMatinsDeadNocturns;
        const laudsHtml = window.LAUDS_DEAD_TEMPLATE ? renderOfficeSections(window.LAUDS_DEAD_TEMPLATE, renderResolved) : "";
        body.innerHTML = matinsHtml + `<div class="section-heading">Lauds of the Dead</div>` + laudsHtml;
      } else {
        if (titleEl) titleEl.innerHTML = "Vespers of the Dead";
        body.innerHTML = window.VESPER_DEAD_TEMPLATE ? renderOfficeSections(window.VESPER_DEAD_TEMPLATE, renderResolved) : "";
      }
      return;
    }

    const template = HOUR_TEMPLATES[currentHour];
    currentTemplate = template || null;
    if (!template) {
      if (titleEl) titleEl.innerHTML = escapeHtml(HOUR_LABELS[currentHour]);
      body.innerHTML = `<div class="placeholder-block"><span class="missing">${escapeHtml(HOUR_LABELS[currentHour])} isn't wired up in this prototype yet. See ROADMAP.md for what's next.</span></div>`;
      return;
    }
    const showLa = (languageMode === "latin" || languageMode === "both") && template.titleLatin;
    // The title now lives in its own static #officeTitle heading (outside
    // #officeBody, and positioned before the date toolbar/season banner in
    // index.html) rather than being prepended into officeBody's own
    // innerHTML on every render - per Augustine's 8/26 review ("title
    // first, content below... no navigation buttons or controls above the
    // title"), which the old layout got backwards: the toolbar and season
    // banner are static HTML positioned before #officeBody, so the title -
    // previously injected as officeBody's own first child - always
    // rendered *after* both of them, not before. See ROADMAP.md.
    if (titleEl) {
      titleEl.innerHTML = `${escapeHtml(template.title)}${showLa ? `<span class="office-title-latin">${escapeHtml(template.titleLatin)}</span>` : ""}`;
    }
    // Explains the swap above, so anticipated First Evensong doesn't look
    // like a date-navigation bug (season/color/Psalms/Collect all showing
    // tomorrow's feast while the toolbar above still reads today's date).
    const displacementBanner = eveningDisplacement
      ? `<p class="rubric-fine">This Evensong is First Evensong of ${escapeHtml(eveningDisplacement.tomorrowLabel)}, anticipated per the Table of Concurrence (Table2_revision.pdf), since it outranks the Office otherwise proper to this civil day${eveningDisplacement.commemorateToday ? " (which is instead commemorated below)" : ""}.</p>`
      : "";
    body.innerHTML = displacementBanner + renderOfficeSections(template, renderResolved);
  }

  // None of these static rites have any date-dependent content (no
  // season, no lessons, no seasonal antiphon choices - each is the same
  // text every time it's used), so unlike renderOfficePage this needs no
  // `resolved` liturgical-day object. renderOfficeSections/renderSection
  // only ever touch `resolved` for a "placeholder" section type, and
  // none of these templates has one, so passing null through is safe.
  // Shared by the two Litanies, the Ordinary of the Mass, and the
  // Pastoral rites below. Highlighting both dropdown menus is a
  // harmless no-op for pages outside that particular dropdown (a plain
  // top-level nav link like "#mass" is already handled by showPage's
  // generic [data-nav-link] logic).
  function renderStaticRitePage(template, bodyElId, missingLabel, resolved) {
    document.querySelectorAll("#litaniesMenu a, #pastoralMenu a, #eucharisticMenu a, #officeDeadMenu a, #votiveMenu a").forEach((a) => {
      a.classList.toggle("selected", a.getAttribute("href") === location.hash);
    });
    const body = document.getElementById(bodyElId);
    if (!template) {
      body.innerHTML = `<div class="placeholder-block"><span class="missing">${escapeHtml(missingLabel)} isn't wired up in this prototype yet.</span></div>`;
      return;
    }
    const titleHtml = `<h2 class="office-title">${escapeHtml(template.title)}</h2>`;
    // `resolved` is an optional 4th param, still undefined/null for most
    // rites here - every one of those genuinely has no date-dependent
    // content, so they keep passing nothing and renderOfficeSections's
    // resolved-only filters (bvmSeasonOption, finalBlessingVariant, etc.)
    // simply never match. Votive Masses (renderVotivePage, task #107) was
    // the first exception; Preparation/Thanksgiving/Benediction (task
    // #175) now pass it too, for their own "(Alleluia)" seasonal marker.
    body.innerHTML = titleHtml + renderOfficeSections(template, resolved || null);
  }

  function renderLitanyPage() {
    renderStaticRitePage(window.GREAT_LITANY_TEMPLATE, "litanyBody", "The Great Litany");
  }

  function renderLitanySaintsPage() {
    renderStaticRitePage(window.LITANY_SAINTS_TEMPLATE, "litanySaintsBody", "The Litany of the Saints");
  }

  // A Penitential Office (pages/Litanies/Penitential.tex) - previously
  // never transcribed at all (no data file, no page, no navigation
  // entry existed anywhere on the site), discovered while investigating
  // the ROADMAP's "place the Penitential Office under the Great Litany"
  // navigation note, which assumed the page already existed. Fully
  // transcribed into data/penitential.json and wired in as a sibling
  // static rite page alongside the Great Litany and Litany of the
  // Saints (same renderStaticRitePage path, same litaniesMenu dropdown).
  function renderPenitentialPage() {
    renderStaticRitePage(window.PENITENTIAL_TEMPLATE, "penitentialBody", "A Penitential Office");
  }

  // Unlike the other static rites, the Mass Ordinary now has eight
  // "placeholder" sections (Introit/Collect/Epistle/Gradual/Gospel/
  // Offertory/Secret/Communion/Postcommunion) whose text depends on the
  // day - so, like renderOfficePage, this needs its own date toolbar
  // and season banner and must resolve the liturgical day and pass
  // `resolved` through, rather than routing through renderStaticRitePage
  // (which intentionally passes null for the rites that have no
  // date-dependent content).
  function renderMassPage() {
    document.querySelectorAll("#litaniesMenu a, #pastoralMenu a, #eucharisticMenu a, #officeDeadMenu a, #votiveMenu a").forEach((a) => {
      a.classList.toggle("selected", a.getAttribute("href") === location.hash);
    });
    document.getElementById("massCurrentDateLabel").textContent = fmtDate(currentDate);
    const resolved = resolveLiturgicalDay(currentDate, lectionaryData, kalendarData);
    applyLiturgicalColor(resolved, "massColorDot");
    document.getElementById("massSeasonLabel").textContent = computeDayTitle(resolved);
    document.getElementById("massKalendarLine").innerHTML = renderKalendarLine(resolved, resolveFeastRankToday(resolved));
    document.getElementById("massFallbackNote").textContent = resolved.lectionary ? "" : "No exact lectionary entry found for this day in this prototype's data yet.";

    const template = window.MASS_ORDINARY_TEMPLATE;
    const body = document.getElementById("massBody");
    const titleEl = document.getElementById("massTitle");
    if (!template) {
      if (titleEl) titleEl.innerHTML = "";
      body.innerHTML = `<div class="placeholder-block"><span class="missing">The Holy Communion isn't wired up in this prototype yet.</span></div>`;
      return;
    }
    // See renderOfficePage's identical comment above: the title now lives
    // in its own static #massTitle heading, positioned before the date
    // toolbar/season banner in index.html, instead of being prepended
    // into massBody's own innerHTML (which always rendered after both).
    if (titleEl) titleEl.innerHTML = escapeHtml(template.title);
    // "For Mass, options should exist for the priest to select either
    // the preceding Sunday [feria] or the memorial" (8/26 note) - only
    // printed on a day where that's a genuine live choice (see
    // massDayChoiceAvailable); reuses the same .inline-toggle markup and
    // massBody's existing delegated data-inline-toggle click listener as
    // every other inline toggle on this site, so no new wiring is
    // needed beyond the massDay entry already added to
    // INLINE_TOGGLE_SETTERS above.
    const massDayOptions = [{ value: "automatic", label: "Mass of the Day" }];
    // George's 9/4 note, task #159: the old default note here ("The
    // Priest may say a Votive Mass in place of the Mass of the day.")
    // doesn't exist anywhere in the source (Mass.tex has no such general
    // permission-rubric) - it was this prototype's own invented gloss on
    // the toggle below, in the same fabricated-rubric family as Prime's
    // task #152 "memorial Collect" rubric. Excised outright rather than
    // reworded, since the toggle's own option labels ("Mass of the Day"/
    // "Requiem Mass") are self-explanatory without it. The genuine,
    // sourced explanation used on a day with a live Memorial choice
    // (`massDayChoiceAvailable`, task #70's own note) is untouched below.
    let massDayNote = "";
    if (massDayChoiceAvailable(resolved)) {
      const memorialEntry = (resolved.kalendar || []).find((e) => e.rank === "Memorial" || e.rank === "Simple");
      const label = memorialEntry ? memorialEntry.name : "the Memorial";
      massDayOptions.push({ value: "memorial", label: `Memorial: ${label}` });
      massDayNote = "A Memorial has no Office or Mass of its own obligation; the Priest may say either the Mass of the day or the Mass of the noted Memorial, or a Requiem Mass.";
    }
    massDayOptions.push({ value: "requiem", label: "Requiem Mass" });
    const massDayNoteHtml = massDayNote ? `<p class="rubric-fine">${escapeHtml(massDayNote)}</p>` : "";
    const massDayToggleHtml = `<div class="mass-day-choice">${massDayNoteHtml}` +
      renderInlineToggle("massDay", massDayOptions, massDayChoice) +
      `</div>`;
    body.innerHTML = candlemasRiteHtml(resolved) + massDayToggleHtml + renderOfficeSections(template, resolved);
  }

  /**
   * Pending-corrections fix (10/3, task #212, item #9): "Candlemas (the
   * Purification...) should have the proper rites from the BCP and
   * Missal included with the Mass (e.g., the candle-blessing/procession
   * rite), not just an ordinary Mass." Unlike item #8b's Mass of the
   * Presanctified, this one is NOT blocked - PropTime.tex gives the
   * Blessing of the Candles and the Procession in full (data/
   * candlemas-rite.json, transcribed verbatim from that section), so it
   * was simply never rendered anywhere in this site at all.
   *
   * PropTime.tex's own rubric: "If it happen that this Feast be
   * transferred, only the Blessing and Distribution of the Candles and
   * the Procession take place today. Mass is said of the Office
   * occurring" - i.e. this rite belongs to the calendar date 2 February
   * itself, independent of which Office/Mass actually wins that day
   * under this site's ranking engine. So this checks `kalendarKey`
   * directly (the fixed "2-2" date), not any resolved Feast/winner
   * field, and renders unconditionally on that date - matching the
   * source's own "it happen... be transferred" wording, which assumes
   * the rite still happens even when the Feast itself does not.
   */
  function candlemasRiteHtml(resolved) {
    if (!resolved || resolved.kalendarKey !== "2-2" || !window.CANDLEMAS_RITE_TEMPLATE) return "";
    const template = window.CANDLEMAS_RITE_TEMPLATE;
    return `<h2 class="office-title">${escapeHtml(template.title)}</h2>` + renderOfficeSections(template, resolved);
  }

  function renderConfessionPage() {
    renderStaticRitePage(window.CONFESSION_TEMPLATE, "confessionBody", "The Sacrament of Penance");
  }

  function renderCommunionSickPage() {
    renderStaticRitePage(window.COMMUNION_SICK_TEMPLATE, "communionSickBody", "Communion of the Sick");
  }

  function renderPurificationPage() {
    renderStaticRitePage(window.PURIFICATION_TEMPLATE, "purificationBody", "Purification of Women after Childbirth");
  }

  function renderBurialChildPage() {
    renderStaticRitePage(window.BURIAL_CHILD_TEMPLATE, "burialChildBody", "At the Burial of a Child");
  }

  function renderConfirmationPage() {
    renderStaticRitePage(window.CONFIRMATION_TEMPLATE, "confirmationBody", "Sacrament of Confirmation");
  }

  function renderReceptionPage() {
    renderStaticRitePage(window.RECEPTION_TEMPLATE, "receptionBody", "Reception of Converts");
  }

  function renderMatrimonyPage() {
    renderStaticRitePage(window.MATRIMONY_TEMPLATE, "matrimonyBody", "Sacrament of Matrimony");
  }

  function renderBaptismPage() {
    renderStaticRitePage(window.BAPTISM_TEMPLATE, "baptismBody", "Sacrament of Baptism for Infants");
  }

  function renderUnctionPage() {
    renderStaticRitePage(window.UNCTION_TEMPLATE, "unctionBody", "Sacrament of Holy Unction");
  }

  function renderBurialPage() {
    renderStaticRitePage(window.BURIAL_TEMPLATE, "burialBody", "The Order for the Burial of the Dead");
  }

  function renderAdultBaptismPage() {
    renderStaticRitePage(window.ADULT_BAPTISM_TEMPLATE, "adultBaptismBody", "Sacrament of Baptism for Adults");
  }

  function renderFamilyPage() {
    renderStaticRitePage(window.FAMILY_TEMPLATE, "familyBody", "Forms of Prayer to be used in Families");
  }

  function renderAspergesPage() {
    const resolved = resolveLiturgicalDay(currentDate, lectionaryData, kalendarData);
    renderStaticRitePage(window.ASPERGES_TEMPLATE, "aspergesBody", "Aspersion of the People", resolved);
  }

  function renderForeMassPage() {
    const resolved = resolveLiturgicalDay(currentDate, lectionaryData, kalendarData);
    renderStaticRitePage(window.FOREMASS_TEMPLATE, "foremassBody", "Prayers at the Foot of the Altar", resolved);
  }

  // George's 9/7 note, task #175: "(Alleluia)" in Preparation/Thanksgiving/
  // Benediction should auto-insert as real spoken "Alleluia" (no
  // parentheses) during Eastertide and be omitted otherwise - the same
  // "(alleluia, alleluia.)" seasonal-marker idea already used at Mattins/
  // Evensong (isAlleluiaSeason, sec.alleluiaSuffix) and at Terce (task
  // #155), just needing a real `resolved` for these three pages to check
  // against. Like Votive Masses (the one existing static-rite page that
  // already needs a date), resolve the day from the app's own shared
  // currentDate - these pages have no date toolbar of their own.
  function renderPreparationPage() {
    const resolved = resolveLiturgicalDay(currentDate, lectionaryData, kalendarData);
    renderStaticRitePage(window.PREPARATION_TEMPLATE, "preparationBody", "Preparation for Holy Communion", resolved);
  }

  function renderThanksgivingPage() {
    const resolved = resolveLiturgicalDay(currentDate, lectionaryData, kalendarData);
    renderStaticRitePage(window.THANKSGIVING_TEMPLATE, "thanksgivingBody", "Thanksgiving for Holy Communion", resolved);
  }

  function renderBenedictionPage() {
    const resolved = resolveLiturgicalDay(currentDate, lectionaryData, kalendarData);
    renderStaticRitePage(window.BENEDICTION_TEMPLATE, "benedictionBody", "Benediction of the Blessed Sacrament", resolved);
  }

  function renderVesperDeadPage() {
    // George's 9/7 note, task #176: "The Antiphons should not be doubled
    // on Ferias and Semidoubles" applies to the Office of the Dead too -
    // needs a real `resolved` for the same `omitUnlessDoubleOrHigher`
    // gate used at Preparation/Thanksgiving (task #175's precedent).
    const resolved = resolveLiturgicalDay(currentDate, lectionaryData, kalendarData);
    renderStaticRitePage(window.VESPER_DEAD_TEMPLATE, "vesperDeadBody", "Vespers of the Dead", resolved);
  }

  function renderMatinsDeadPage() {
    const resolved = resolveLiturgicalDay(currentDate, lectionaryData, kalendarData);
    renderStaticRitePage(window.MATINS_DEAD_TEMPLATE, "matinsDeadBody", "Matins of the Dead", resolved);
  }

  function renderLaudsDeadPage() {
    const resolved = resolveLiturgicalDay(currentDate, lectionaryData, kalendarData);
    renderStaticRitePage(window.LAUDS_DEAD_TEMPLATE, "laudsDeadBody", "Lauds of the Dead", resolved);
  }

  // Task #201 (George's corrections doc: "The different Votive Masses
  // should be provided in different pages, accessible on different items
  // under the Votive Masses drop-down in the menu."): the four Votive
  // Masses that used to share one combined "votive" page/data file
  // (Votive.tex's own four top-level \section blocks: Our Lady on
  // Saturday, Mass of the Angels, Holy Matrimony, Masses for the Dead)
  // are now four separate pages/templates, each with its own nav-menu
  // item under the new "Votive Masses" dropdown (see index.html).
  function renderVotiveBvmPage() {
    // Unlike the other three (now separate) Votive Masses, "Our Lady on
    // Saturday" has five seasonal forms that need picking by date - see
    // pickBvmSaturdaySeason and data/votive-bvm.json's bvmSeasonOption
    // flags, added per Augustine's 8/29 answer (Q10). Resolving the day
    // the same way the Office/Mass pages do, using the shared
    // currentDate state (there's no date toolbar of its own on this
    // page, so "today" per the app's current navigation state is the
    // only sensible date to key off of).
    const resolved = resolveLiturgicalDay(currentDate, lectionaryData, kalendarData);
    renderStaticRitePage(window.VOTIVE_BVM_TEMPLATE, "votiveBvmBody", "Our Lady on Saturday", resolved);
  }

  // Pending-corrections note (10/2): these two Votive Masses' own
  // Introit/Offertory/Communion carry the same bracketed "(Alleluia,
  // alleluia.)" marker as the daily Mass Propers (see the comment above
  // renderSimplePart) - now flagged `alleluiaMarker: true` in
  // data/votive-angels.json / data/votive-matrimony.json, same as
  // Preparation/Thanksgiving/Benediction's own markers (task #175). That
  // flag only does anything when a real `resolved` day is passed through
  // (renderOfficeSections's alleluiaMarker branch checks `sec.
  // alleluiaMarker && resolved`), so these two now resolve "today" the
  // same way renderVotiveBvmPage already does, rather than passing
  // nothing through as before.
  function renderVotiveAngelsPage() {
    const resolved = resolveLiturgicalDay(currentDate, lectionaryData, kalendarData);
    renderStaticRitePage(window.VOTIVE_ANGELS_TEMPLATE, "votiveAngelsBody", "Mass of the Angels", resolved);
  }

  function renderVotiveMatrimonyPage() {
    const resolved = resolveLiturgicalDay(currentDate, lectionaryData, kalendarData);
    renderStaticRitePage(window.VOTIVE_MATRIMONY_TEMPLATE, "votiveMatrimonyBody", "Holy Matrimony", resolved);
  }

  function renderVotiveDeadPage() {
    renderStaticRitePage(window.VOTIVE_DEAD_TEMPLATE, "votiveDeadBody", "Masses for the Dead");
  }

  // ---------------- Home page "Today" summary ----------------
  // Always shows the real calendar today (not the shared `currentDate`
  // the Office/Mass toolbars can navigate away from) - this is meant as
  // an at-a-glance daily dashboard, not another date-navigable view.
  // Reuses the same resolveLiturgicalDay/resolveMassPropersWinner/
  // resolveFeastRankToday machinery the Office and Mass pages already
  // use, so this never has to duplicate or risk disagreeing with them.
  function pickWinningMassEntry(resolution) {
    if (!resolution) return null;
    return resolution.winner === "feast" ? resolution.sanctorale : resolution.seasonEntry;
  }

  function renderHomeToday() {
    updateHomeCta();
    const today = todayUtc();
    const resolved = resolveLiturgicalDay(today, lectionaryData, kalendarData);
    document.getElementById("todayDateLabel").textContent = fmtDate(today);
    applyLiturgicalColor(resolved, "todayColorDot");
    document.getElementById("todaySeasonLabel").textContent = computeDayTitle(resolved);

    // Fasting/Abstinence status (js/fasting.js) - see ROADMAP.md for the
    // full derivation of these rules from the fasting-norms page and the
    // 2026 Ordo.
    const fastingEl = document.getElementById("todayFasting");
    if (typeof getFastingStatus === "function") {
      const status = getFastingStatus(today);
      if (status.isFasting || status.isAbstinence) {
        const parts = [];
        if (status.isFasting) parts.push("a Fasting day");
        if (status.isAbstinence) parts.push("a day of Abstinence");
        const reason = status.labels.length ? ` &mdash; ${escapeHtml(status.labels.join("; "))}` : "";
        fastingEl.innerHTML = `<span class="fasting-badge">Today is ${parts.join(" and ")}.</span>${reason}`;
        fastingEl.hidden = false;
      } else {
        fastingEl.innerHTML = "";
        fastingEl.hidden = true;
      }
    } else {
      fastingEl.hidden = true;
    }

    // Commemorations - per Augustine's instruction, names only for now;
    // saint bios are a deferred feature (see ROADMAP.md).
    const commemEl = document.getElementById("todayCommemorations");
    const names = (resolved.kalendar || []).map((e) => e.name).filter(Boolean);
    if (names.length) {
      commemEl.innerHTML = `<div class="today-commem-label">Commemorations</div><ul class="today-commem-list">${names.map((n) => `<li>${escapeHtml(n)}</li>`).join("")}</ul>`;
    } else {
      commemEl.innerHTML = "";
    }

    // Scripture readings - today's Mass Epistle & Gospel, full text.
    const readingsEl = document.getElementById("todayReadings");
    const resolution = resolveMassPropersWinner(resolved);
    const entry = pickWinningMassEntry(resolution);
    const epistleCitation = entry && entry.epistleCitation;
    const epistleText = entry && entry.epistleText;
    const gospelCitation = entry && entry.gospelCitation;
    const gospelText = entry && entry.gospelText;
    let html = "";
    if (epistleText) {
      html += `<div class="today-reading"><h4>Epistle${epistleCitation ? `: ${escapeHtml(epistleCitation)}` : ""}</h4><p>${escapeHtml(epistleText)}</p></div>`;
    }
    if (gospelText) {
      html += `<div class="today-reading"><h4>Gospel${gospelCitation ? `: ${escapeHtml(gospelCitation)}` : ""}</h4><p>${escapeHtml(gospelText)}</p></div>`;
    }
    if (!html) {
      html = `<div class="placeholder-block"><span class="missing">Today's Mass readings aren't resolvable yet in this prototype.</span></div>`;
    }
    readingsEl.innerHTML = html;
  }

  // ---------------- Calendar page (month grid) ----------------
  let calendarPageCursor = todayUtc();

  function renderCalendarPage() {
    const year = calendarPageCursor.getUTCFullYear();
    const month = calendarPageCursor.getUTCMonth();
    document.getElementById("calPageMonthLabel").textContent =
      calendarPageCursor.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
    const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const grid = document.getElementById("calPageGrid");
    const todayD = todayUtc();

    let html = `<div class="cal-page-dow-row">`;
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((d) => { html += `<div class="cal-page-dow">${d}</div>`; });
    html += `</div><div class="cal-page-days">`;
    for (let i = 0; i < firstWeekday; i++) html += `<div class="cal-page-day empty"></div>`;

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(Date.UTC(year, month, day));
      const resolved = resolveLiturgicalDay(d, lectionaryData, kalendarData);
      const feastInfo = resolveFeastRankToday(resolved);
      const colorKey = resolveLiturgicalColor(resolved, feastInfo);
      const color = (typeof LITURGICAL_COLORS !== "undefined" ? LITURGICAL_COLORS : {})[colorKey];
      const status = typeof getFastingStatus === "function" ? getFastingStatus(d) : { isFasting: false, isAbstinence: false };
      const isToday = daysBetween(d, todayD) === 0;
      // George's 9/7 note, task #178: "The name of the Sunday (such as
      // the Fifteenth Sunday after Trinity) should be provided instead
      // of the name of the Commemoration (such as Sts. Eustace &
      // Companions). Only a 1st or 2nd Double can outrank a normal
      // Sunday" - and "The Temporale should be considered in the
      // ranking, such as the Ember Days." This grid used to just list
      // whatever Kalendar (Sanctorale) entries existed for the day,
      // regardless of whether any of them actually WON the day under
      // `decideCollectWinner` - so an ordinary "other-sunday" (Lesser
      // Sunday) sitting under a Memorial or Simple-rank Saint's day
      // showed that Saint's name here even though the Sunday's own
      // Office is what's actually said (per ranking.js's own tier>=6
      // threshold for "other-sunday" - only a 1st/2nd Double wins), and
      // an Ember Day (a "second-class-feria" in ranking.js, also
      // tier>=6) had the same problem. `feastInfo` (already computed
      // just above for this same day's liturgical color) is exactly the
      // same winner/season decision `computeDayTitle` already trusts for
      // the Office/Mass page title - reusing it here instead of the raw
      // Kalendar listing makes this grid agree with what the Office page
      // itself would show for the same date. Task #164's fix (falling
      // back to `seasonLabel` only when there was no Kalendar entry at
      // all) is now subsumed by this broader, rank-aware rule: whenever
      // the season/Sunday/Temporale day wins, `seasonLabel` is shown
      // (which already has a proper name for every day, Sunday or not -
      // "Ash Wednesday", "Ember Wednesday", "Holy Monday", etc. -
      // via `describeSeason`), and only when a Feast genuinely wins is
      // its own name shown instead.
      const names = [];
      if (feastInfo.winner === "feast" && feastInfo.name) {
        names.push(feastInfo.name);
      } else if (findVigilKalendarEntry(resolved)) {
        // Task #216, item #13: same fix as computeDayTitle above, applied
        // here too so the calendar grid's own day-square label agrees
        // with what the Office/Mass page would show for the same date.
        names.push(findVigilKalendarEntry(resolved).name);
      } else if (resolved.seasonLabel) {
        names.push(resolved.seasonLabel);
      } else {
        const kalNames = (resolved.kalendar || []).map((e) => e.name).filter(Boolean);
        if (kalNames.length) names.push(kalNames[0]);
      }
      const classes = ["cal-page-day"];
      if (isToday) classes.push("today");
      // Same background-wash fix as renderCalendarPopover above (George's
      // consolidated 10/7 note, item 10) - --day-color-rgb lets the CSS
      // build a low-alpha rgba() wash from this day's own color.
      const style = color ? ` style="--day-color:${color.hex};--day-color-rgb:${hexToRgbTriplet(color.hex)}"` : "";
      html += `<button class="${classes.join(" ")}" data-cal-page-day="${day}"${style} aria-label="${escapeHtml(fmtDate(d))}${names.length ? ", " + escapeHtml(names[0]) : ""}">` +
        `<span class="cal-page-daynum">${day}</span>` +
        (names.length ? `<span class="cal-page-feast">${escapeHtml(names[0])}</span>` : "") +
        `<span class="cal-page-marks">${status.isFasting ? '<span class="mark-fast" title="Fasting">F</span>' : ""}${status.isAbstinence ? '<span class="mark-abst" title="Abstinence">A</span>' : ""}</span>` +
        `</button>`;
    }
    html += `</div>`;
    grid.innerHTML = html;

    grid.querySelectorAll("[data-cal-page-day]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const day = parseInt(btn.dataset.calPageDay, 10);
        currentDate = new Date(Date.UTC(year, month, day));
        location.hash = "#office/mattins";
      });
    });
  }

  const calPagePrevMonth = document.getElementById("calPagePrevMonth");
  const calPageNextMonth = document.getElementById("calPageNextMonth");
  const calPageTodayBtn = document.getElementById("calPageTodayBtn");
  if (calPagePrevMonth) {
    calPagePrevMonth.addEventListener("click", () => {
      calendarPageCursor = new Date(Date.UTC(calendarPageCursor.getUTCFullYear(), calendarPageCursor.getUTCMonth() - 1, 1));
      renderCalendarPage();
    });
  }
  if (calPageNextMonth) {
    calPageNextMonth.addEventListener("click", () => {
      calendarPageCursor = new Date(Date.UTC(calendarPageCursor.getUTCFullYear(), calendarPageCursor.getUTCMonth() + 1, 1));
      renderCalendarPage();
    });
  }
  if (calPageTodayBtn) {
    calPageTodayBtn.addEventListener("click", () => {
      calendarPageCursor = todayUtc();
      renderCalendarPage();
    });
  }

  function shiftDay(delta) {
    currentDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate() + delta));
  }

  setupDateToolbar(
    { prevDay: "prevDay", nextDay: "nextDay", todayBtn: "todayBtn", calendarToggle: "calendarToggle", calendarPopover: "calendarPopover", calendarQuickDate: "calendarQuickDate", calendarGrid: "calendarGrid" },
    refreshDateAwarePages
  );
  setupDateToolbar(
    { prevDay: "massPrevDay", nextDay: "massNextDay", todayBtn: "massTodayBtn", calendarToggle: "massCalendarToggle", calendarPopover: "massCalendarPopover", calendarQuickDate: "massCalendarQuickDate", calendarGrid: "massCalendarGrid" },
    refreshDateAwarePages
  );

  if (!lectionaryData || !kalendarData || !psalterData || !window.EVENSONG_TEMPLATE) {
    document.getElementById("page-home").innerHTML = `<p class="rubric">Data scripts (js/data-*.js) did not load. Make sure the whole office-book-web folder was copied together, including the js/ subfolder.</p>`;
  } else {
    handleRoute();
  }
})();
