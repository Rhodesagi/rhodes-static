// ============================================================================
// RHODES GERMAN V2 - COURSE CONFIGURATION
// ============================================================================
// This file contains ALL language-specific data for the German course.
// The engine reads this config and adapts accordingly.

window.COURSE_CONFIG = {
  // ============================================================================
  // IDENTITY
  // ============================================================================
  lang: 'german',
  langCode: 'de-DE',
  displayName: 'German',
  courseName: 'The German Course | Auf geht\'s!',
  tagline: 'COMPLETE COURSE',

  // ============================================================================
  // THEME
  // ============================================================================
  theme: {
    accentPrimary: '#DD0000',
    accentLight: '#fde8e8',
    flagColors: ['#000000', '#DD0000', '#FFCC00'],
  },

  // ============================================================================
  // FIELD MAPPINGS
  // ============================================================================
  fields: {
    target: 'german_formal',
    targetFormal: 'german_formal',
    targetInformal: 'german_informal',
    source: 'english',
  },

  // ============================================================================
  // FEATURES
  // ============================================================================
  features: {
    hasRegisterToggle: true,
    hasDirectionToggle: true,
    hasFullscreen: true,
    hasCaseColors: true,
    hasAlphabetUnit: false,
    hasStressPositions: false,
    hasAudioMapping: false,
    hasConfusables: true,
    hasDarkMode: true,
    hasServiceWorker: false,
  },

  // ============================================================================
  // KEYBOARD
  // ============================================================================
  keyboard: {
    type: 'accent',
    chars: ['\u00e4','\u00f6','\u00fc','\u00df','\u00c4','\u00d6','\u00dc'],
  },

  // ============================================================================
  // STORAGE KEYS
  // ============================================================================
  storage: {
    progress: 'rhodes_german_progress',
    sync: 'rhodes_german_sync',
    srs: 'rhodes_german_srs',
    analytics: 'rhodes_german_analytics',
    linear: 'rhodes_german_linear',
  },

  // ============================================================================
  // DATA PATHS
  // ============================================================================
  data: {
    drills: 'data/drills.json',
    confusables: null, // confusables are inline below
  },

  // ============================================================================
  // AUDIO
  // ============================================================================
  audio: {
    dialogues: 'audio/',
    drills: 'audio/drills/',
    version: '1.0.0',
  },

  // ============================================================================
  // CDN
  // ============================================================================
  cdn: {
    baseUrl: '',
  },

  // ============================================================================
  // CASE COLORS (German-specific)
  // ============================================================================
  caseColors: {
    nominative: { color: '#0066CC', label: 'Nominativ' },
    accusative: { color: '#CC0000', label: 'Akkusativ' },
    dative: { color: '#009900', label: 'Dativ' },
    genitive: { color: '#CC9900', label: 'Genitiv' },
  },

  // ============================================================================
  // TITLE HTML
  // ============================================================================
  titleHtml: `<div style="display:flex;flex-direction:column;height:30px;width:45px;border:1px solid #ccc;margin-bottom:8px;">
    <span style="flex:1;background:#000000;"></span>
    <span style="flex:1;background:#DD0000;"></span>
    <span style="flex:1;background:#FFCC00;"></span>
  </div>
  <div style="border:2px solid #333;padding:5px 12px;font-size:24px;font-weight:bold;letter-spacing:3px;display:flex;align-items:center;gap:15px;">
    <span>THE GERMAN COURSE</span>
    <span style="font-size:14px;font-weight:normal;opacity:0.7;">\u2014By Rhodes\u2014</span>
  </div>`,

  // ============================================================================
  // FORMAL TO INFORMAL CONVERSION
  // ============================================================================
  convertToInformal: null, // drills already have both registers

  // ============================================================================
  // GRAMMAR ARTICLES (German-specific)
  // ============================================================================
  grammarArticles: {
    der: { case: 'nominative', gender: 'masculine' },
    die: { case: 'nominative/accusative', gender: 'feminine/plural' },
    das: { case: 'nominative/accusative', gender: 'neuter' },
    den: { case: 'accusative', gender: 'masculine' },
    dem: { case: 'dative', gender: 'masculine/neuter' },
    des: { case: 'genitive', gender: 'masculine/neuter' },
    einer: { case: 'genitive/dative', gender: 'feminine' },
    einem: { case: 'dative', gender: 'masculine/neuter' },
    einen: { case: 'accusative', gender: 'masculine' },
  },

  // ============================================================================
  // TOTAL UNITS
  // ============================================================================
  totalUnits: 30,

  // ============================================================================
  // VERBS - GERMAN VERB CONJUGATIONS
  // ============================================================================
  // Format: pr\u00e4sens [ich, du, er/sie/es, wir, ihr, sie/Sie]
  //         perfekt { aux, pp }
  //         pr\u00e4teritum [ich, du, er/sie/es, wir, ihr, sie/Sie]
  //         konjunktivII [ich, du, er/sie/es, wir, ihr, sie/Sie]
  //         imperativ [du, ihr, Sie]
  //         futurI: note (werde + infinitive, regular pattern)
  // ============================================================================
  verbs: {
    sein: {
      meaning: 'to be',
      pr\u00e4sens: ['bin', 'bist', 'ist', 'sind', 'seid', 'sind'],
      perfekt: { aux: 'sein', pp: 'gewesen' },
      pr\u00e4teritum: ['war', 'warst', 'war', 'waren', 'wart', 'waren'],
      konjunktivII: ['w\u00e4re', 'w\u00e4rest', 'w\u00e4re', 'w\u00e4ren', 'w\u00e4ret', 'w\u00e4ren'],
      imperativ: ['sei', 'seid', 'seien Sie'],
      futurI: 'werde/wirst/wird/werden/werdet/werden + sein',
      tip: 'Most important verb. Irregular in all tenses. Used for identity, origin, profession, description, and as auxiliary for Perfekt with motion/state-change verbs.'
    },
    haben: {
      meaning: 'to have',
      pr\u00e4sens: ['habe', 'hast', 'hat', 'haben', 'habt', 'haben'],
      perfekt: { aux: 'haben', pp: 'gehabt' },
      pr\u00e4teritum: ['hatte', 'hattest', 'hatte', 'hatten', 'hattet', 'hatten'],
      konjunktivII: ['h\u00e4tte', 'h\u00e4ttest', 'h\u00e4tte', 'h\u00e4tten', 'h\u00e4ttet', 'h\u00e4tten'],
      imperativ: ['hab', 'habt', 'haben Sie'],
      futurI: 'werde + haben',
      expressions: ['Hunger haben (be hungry)', 'Durst haben (be thirsty)', 'Recht haben (be right)', 'Angst haben (be afraid)', 'Lust haben (feel like)', 'es eilig haben (be in a hurry)'],
      tip: 'Second most common verb. Auxiliary for Perfekt with most transitive verbs. Many expressions where English uses "to be".'
    },
    werden: {
      meaning: 'to become / will (future auxiliary)',
      pr\u00e4sens: ['werde', 'wirst', 'wird', 'werden', 'werdet', 'werden'],
      perfekt: { aux: 'sein', pp: 'geworden' },
      pr\u00e4teritum: ['wurde', 'wurdest', 'wurde', 'wurden', 'wurdet', 'wurden'],
      konjunktivII: ['w\u00fcrde', 'w\u00fcrdest', 'w\u00fcrde', 'w\u00fcrden', 'w\u00fcrdet', 'w\u00fcrden'],
      imperativ: ['werde', 'werdet', 'werden Sie'],
      futurI: 'werde + werden (rare)',
      tip: 'Triple function: (1) "to become" (Er wird Arzt), (2) future auxiliary (Ich werde gehen), (3) passive auxiliary (Es wird gemacht). w\u00fcrde + infinitive = polite/subjunctive.'
    },
    k\u00f6nnen: {
      meaning: 'can / to be able to',
      pr\u00e4sens: ['kann', 'kannst', 'kann', 'k\u00f6nnen', 'k\u00f6nnt', 'k\u00f6nnen'],
      perfekt: { aux: 'haben', pp: 'gekonnt / k\u00f6nnen (double infinitive)' },
      pr\u00e4teritum: ['konnte', 'konntest', 'konnte', 'konnten', 'konntet', 'konnten'],
      konjunktivII: ['k\u00f6nnte', 'k\u00f6nntest', 'k\u00f6nnte', 'k\u00f6nnten', 'k\u00f6nntet', 'k\u00f6nnten'],
      tip: 'Modal verb \u2014 no imperative. k\u00f6nnte = could (polite request). Stem vowel changes: a in singular present, \u00f6 in plural/infinitive.'
    },
    m\u00fcssen: {
      meaning: 'must / to have to',
      pr\u00e4sens: ['muss', 'musst', 'muss', 'm\u00fcssen', 'm\u00fcsst', 'm\u00fcssen'],
      perfekt: { aux: 'haben', pp: 'gemusst / m\u00fcssen (double infinitive)' },
      pr\u00e4teritum: ['musste', 'musstest', 'musste', 'mussten', 'musstet', 'mussten'],
      konjunktivII: ['m\u00fcsste', 'm\u00fcsstest', 'm\u00fcsste', 'm\u00fcssten', 'm\u00fcsstet', 'm\u00fcssten'],
      tip: 'Modal verb. "nicht m\u00fcssen" = don\'t have to (NOT must not). "must not" = d\u00fcrfen + nicht. m\u00fcsste = should/ought to.'
    },
    wollen: {
      meaning: 'to want to',
      pr\u00e4sens: ['will', 'willst', 'will', 'wollen', 'wollt', 'wollen'],
      perfekt: { aux: 'haben', pp: 'gewollt / wollen (double infinitive)' },
      pr\u00e4teritum: ['wollte', 'wolltest', 'wollte', 'wollten', 'wolltet', 'wollten'],
      konjunktivII: ['wollte', 'wolltest', 'wollte', 'wollten', 'wolltet', 'wollten'],
      tip: 'Modal verb. "Ich will" is direct/strong. For polite requests use m\u00f6chten or "Ich h\u00e4tte gern". Konjunktiv II = Pr\u00e4teritum (same forms).'
    },
    sollen: {
      meaning: 'should / to be supposed to',
      pr\u00e4sens: ['soll', 'sollst', 'soll', 'sollen', 'sollt', 'sollen'],
      perfekt: { aux: 'haben', pp: 'gesollt / sollen (double infinitive)' },
      pr\u00e4teritum: ['sollte', 'solltest', 'sollte', 'sollten', 'solltet', 'sollten'],
      konjunktivII: ['sollte', 'solltest', 'sollte', 'sollten', 'solltet', 'sollten'],
      tip: 'Modal verb. Expresses obligation, advice, or hearsay. "Er soll reich sein" = He is said to be rich. Konjunktiv II = Pr\u00e4teritum.'
    },
    d\u00fcrfen: {
      meaning: 'may / to be allowed to',
      pr\u00e4sens: ['darf', 'darfst', 'darf', 'd\u00fcrfen', 'd\u00fcrft', 'd\u00fcrfen'],
      perfekt: { aux: 'haben', pp: 'gedurft / d\u00fcrfen (double infinitive)' },
      pr\u00e4teritum: ['durfte', 'durftest', 'durfte', 'durften', 'durftet', 'durften'],
      konjunktivII: ['d\u00fcrfte', 'd\u00fcrftest', 'd\u00fcrfte', 'd\u00fcrften', 'd\u00fcrftet', 'd\u00fcrften'],
      tip: 'Modal verb. "nicht d\u00fcrfen" = must not (prohibition). d\u00fcrfte = might/could (probability or polite). "Darf ich?" = May I?'
    },
    m\u00f6gen: {
      meaning: 'to like',
      pr\u00e4sens: ['mag', 'magst', 'mag', 'm\u00f6gen', 'm\u00f6gt', 'm\u00f6gen'],
      perfekt: { aux: 'haben', pp: 'gemocht' },
      pr\u00e4teritum: ['mochte', 'mochtest', 'mochte', 'mochten', 'mochtet', 'mochten'],
      konjunktivII: ['m\u00f6chte', 'm\u00f6chtest', 'm\u00f6chte', 'm\u00f6chten', 'm\u00f6chtet', 'm\u00f6chten'],
      tip: 'M\u00f6gen (indicative) = to like (Ich mag Kaffee). M\u00f6chten (Konj. II) = would like (Ich m\u00f6chte Kaffee) \u2014 used constantly for polite requests.'
    },
    kommen: {
      meaning: 'to come',
      pr\u00e4sens: ['komme', 'kommst', 'kommt', 'kommen', 'kommt', 'kommen'],
      perfekt: { aux: 'sein', pp: 'gekommen' },
      pr\u00e4teritum: ['kam', 'kamst', 'kam', 'kamen', 'kamt', 'kamen'],
      konjunktivII: ['k\u00e4me', 'k\u00e4mest', 'k\u00e4me', 'k\u00e4men', 'k\u00e4met', 'k\u00e4men'],
      imperativ: ['komm', 'kommt', 'kommen Sie'],
      tip: 'Uses SEIN in Perfekt (motion verb). Strong verb: kam/gekommen. "Woher kommen Sie?" = Where are you from?'
    },
    gehen: {
      meaning: 'to go (on foot)',
      pr\u00e4sens: ['gehe', 'gehst', 'geht', 'gehen', 'geht', 'gehen'],
      perfekt: { aux: 'sein', pp: 'gegangen' },
      pr\u00e4teritum: ['ging', 'gingst', 'ging', 'gingen', 'gingt', 'gingen'],
      konjunktivII: ['ginge', 'gingest', 'ginge', 'gingen', 'ginget', 'gingen'],
      imperativ: ['geh', 'geht', 'gehen Sie'],
      tip: 'Uses SEIN. "Wie geht es Ihnen?" = How are you? "Es geht" = It\'s okay. Strong verb: ging/gegangen.'
    },
    machen: {
      meaning: 'to do / to make',
      pr\u00e4sens: ['mache', 'machst', 'macht', 'machen', 'macht', 'machen'],
      perfekt: { aux: 'haben', pp: 'gemacht' },
      pr\u00e4teritum: ['machte', 'machtest', 'machte', 'machten', 'machtet', 'machten'],
      konjunktivII: ['machte', 'machtest', 'machte', 'machten', 'machtet', 'machten'],
      imperativ: ['mach', 'macht', 'machen Sie'],
      tip: 'Regular weak verb. Very versatile: "Was machst du?" (What are you doing?), "Das macht nichts" (It doesn\'t matter), "Mach\'s gut!" (Take care!).'
    },
    sagen: {
      meaning: 'to say / to tell',
      pr\u00e4sens: ['sage', 'sagst', 'sagt', 'sagen', 'sagt', 'sagen'],
      perfekt: { aux: 'haben', pp: 'gesagt' },
      pr\u00e4teritum: ['sagte', 'sagtest', 'sagte', 'sagten', 'sagtet', 'sagten'],
      konjunktivII: ['sagte', 'sagtest', 'sagte', 'sagten', 'sagtet', 'sagten'],
      imperativ: ['sag', 'sagt', 'sagen Sie'],
      tip: 'Regular weak verb. "Sag mal..." = Tell me... / Say... (casual). Used in indirect speech: "Er sagte, er sei m\u00fcde."'
    },
    wissen: {
      meaning: 'to know (a fact)',
      pr\u00e4sens: ['wei\u00df', 'wei\u00dft', 'wei\u00df', 'wissen', 'wisst', 'wissen'],
      perfekt: { aux: 'haben', pp: 'gewusst' },
      pr\u00e4teritum: ['wusste', 'wusstest', 'wusste', 'wussten', 'wusstet', 'wussten'],
      konjunktivII: ['w\u00fcsste', 'w\u00fcsstest', 'w\u00fcsste', 'w\u00fcssten', 'w\u00fcsstet', 'w\u00fcssten'],
      imperativ: ['wisse', 'wisst', 'wissen Sie'],
      tip: 'Irregular (Pr\u00e4teritum-Pr\u00e4sens verb). Knows FACTS: "Ich wei\u00df es nicht." Compare with kennen (familiarity with people/places).'
    },
    kennen: {
      meaning: 'to know (a person/place)',
      pr\u00e4sens: ['kenne', 'kennst', 'kennt', 'kennen', 'kennt', 'kennen'],
      perfekt: { aux: 'haben', pp: 'gekannt' },
      pr\u00e4teritum: ['kannte', 'kanntest', 'kannte', 'kannten', 'kanntet', 'kannten'],
      konjunktivII: ['kennte', 'kenntest', 'kennte', 'kennten', 'kenntet', 'kennten'],
      imperativ: ['kenn', 'kennt', 'kennen Sie'],
      tip: 'Mixed verb (irregular Pr\u00e4teritum: kannte). Knows by ACQUAINTANCE: "Kennen Sie Berlin?" Do NOT use for facts (use wissen).'
    },
    sprechen: {
      meaning: 'to speak',
      pr\u00e4sens: ['spreche', 'sprichst', 'spricht', 'sprechen', 'sprecht', 'sprechen'],
      perfekt: { aux: 'haben', pp: 'gesprochen' },
      pr\u00e4teritum: ['sprach', 'sprachst', 'sprach', 'sprachen', 'spracht', 'sprachen'],
      konjunktivII: ['spr\u00e4che', 'spr\u00e4chest', 'spr\u00e4che', 'spr\u00e4chen', 'spr\u00e4chet', 'spr\u00e4chen'],
      imperativ: ['sprich', 'sprecht', 'sprechen Sie'],
      tip: 'Strong verb with stem change e\u2192i in du/er. "Sprechen Sie Deutsch?" Also: besprechen (discuss), versprechen (promise).'
    },
    lesen: {
      meaning: 'to read',
      pr\u00e4sens: ['lese', 'liest', 'liest', 'lesen', 'lest', 'lesen'],
      perfekt: { aux: 'haben', pp: 'gelesen' },
      pr\u00e4teritum: ['las', 'last', 'las', 'lasen', 'last', 'lasen'],
      konjunktivII: ['l\u00e4se', 'l\u00e4sest', 'l\u00e4se', 'l\u00e4sen', 'l\u00e4set', 'l\u00e4sen'],
      imperativ: ['lies', 'lest', 'lesen Sie'],
      tip: 'Strong verb with stem change e\u2192ie in du/er. "Liest du gern?" = Do you like reading? Imperative: Lies! (not Les!).'
    },
    schreiben: {
      meaning: 'to write',
      pr\u00e4sens: ['schreibe', 'schreibst', 'schreibt', 'schreiben', 'schreibt', 'schreiben'],
      perfekt: { aux: 'haben', pp: 'geschrieben' },
      pr\u00e4teritum: ['schrieb', 'schriebst', 'schrieb', 'schrieben', 'schriebt', 'schrieben'],
      konjunktivII: ['schriebe', 'schriebest', 'schriebe', 'schrieben', 'schriebet', 'schrieben'],
      imperativ: ['schreib', 'schreibt', 'schreiben Sie'],
      tip: 'Strong verb: ei\u2192ie\u2192ie. "Schreib mir!" = Write to me! Also: beschreiben (describe), aufschreiben (write down).'
    },
    nehmen: {
      meaning: 'to take',
      pr\u00e4sens: ['nehme', 'nimmst', 'nimmt', 'nehmen', 'nehmt', 'nehmen'],
      perfekt: { aux: 'haben', pp: 'genommen' },
      pr\u00e4teritum: ['nahm', 'nahmst', 'nahm', 'nahmen', 'nahmt', 'nahmen'],
      konjunktivII: ['n\u00e4hme', 'n\u00e4hmest', 'n\u00e4hme', 'n\u00e4hmen', 'n\u00e4hmet', 'n\u00e4hmen'],
      imperativ: ['nimm', 'nehmt', 'nehmen Sie'],
      tip: 'Strong verb with stem change e\u2192i in du/er. "Nehmen Sie Platz!" = Have a seat! Also: mitnehmen, annehmen, teilnehmen.'
    },
    geben: {
      meaning: 'to give',
      pr\u00e4sens: ['gebe', 'gibst', 'gibt', 'geben', 'gebt', 'geben'],
      perfekt: { aux: 'haben', pp: 'gegeben' },
      pr\u00e4teritum: ['gab', 'gabst', 'gab', 'gaben', 'gabt', 'gaben'],
      konjunktivII: ['g\u00e4be', 'g\u00e4best', 'g\u00e4be', 'g\u00e4ben', 'g\u00e4bet', 'g\u00e4ben'],
      imperativ: ['gib', 'gebt', 'geben Sie'],
      tip: 'Strong verb, e\u2192i in du/er. "Es gibt" = there is/are (+ accusative). "Gib mir das!" = Give me that! Also: aufgeben, zugeben, ausgeben.'
    },
    essen: {
      meaning: 'to eat',
      pr\u00e4sens: ['esse', 'isst', 'isst', 'essen', 'esst', 'essen'],
      perfekt: { aux: 'haben', pp: 'gegessen' },
      pr\u00e4teritum: ['a\u00df', 'a\u00dfest', 'a\u00df', 'a\u00dfen', 'a\u00dft', 'a\u00dfen'],
      konjunktivII: ['\u00e4\u00dfe', '\u00e4\u00dfest', '\u00e4\u00dfe', '\u00e4\u00dfen', '\u00e4\u00dfet', '\u00e4\u00dfen'],
      imperativ: ['iss', 'esst', 'essen Sie'],
      tip: 'Strong verb, e\u2192i in du/er. Note double s in "du isst" and "er isst". Pr\u00e4teritum: a\u00df. Imperative: Iss! (not Ess!).'
    },
    trinken: {
      meaning: 'to drink',
      pr\u00e4sens: ['trinke', 'trinkst', 'trinkt', 'trinken', 'trinkt', 'trinken'],
      perfekt: { aux: 'haben', pp: 'getrunken' },
      pr\u00e4teritum: ['trank', 'trankst', 'trank', 'tranken', 'trankt', 'tranken'],
      konjunktivII: ['tr\u00e4nke', 'tr\u00e4nkest', 'tr\u00e4nke', 'tr\u00e4nken', 'tr\u00e4nket', 'tr\u00e4nken'],
      imperativ: ['trink', 'trinkt', 'trinken Sie'],
      tip: 'Strong verb: i\u2192a\u2192u. "Was m\u00f6chten Sie trinken?" Regular in Pr\u00e4sens.'
    },
    schlafen: {
      meaning: 'to sleep',
      pr\u00e4sens: ['schlafe', 'schl\u00e4fst', 'schl\u00e4ft', 'schlafen', 'schlaft', 'schlafen'],
      perfekt: { aux: 'haben', pp: 'geschlafen' },
      pr\u00e4teritum: ['schlief', 'schliefst', 'schlief', 'schliefen', 'schlieft', 'schliefen'],
      konjunktivII: ['schliefe', 'schliefest', 'schliefe', 'schliefen', 'schliefet', 'schliefen'],
      imperativ: ['schlaf', 'schlaft', 'schlafen Sie'],
      tip: 'Strong verb with stem change a\u2192\u00e4 in du/er Pr\u00e4sens. "Schlaf gut!" = Sleep well! Also: einschlafen (fall asleep, uses sein).'
    },
    fahren: {
      meaning: 'to drive / to travel (by vehicle)',
      pr\u00e4sens: ['fahre', 'f\u00e4hrst', 'f\u00e4hrt', 'fahren', 'fahrt', 'fahren'],
      perfekt: { aux: 'sein', pp: 'gefahren' },
      pr\u00e4teritum: ['fuhr', 'fuhrst', 'fuhr', 'fuhren', 'fuhrt', 'fuhren'],
      konjunktivII: ['f\u00fchre', 'f\u00fchrest', 'f\u00fchre', 'f\u00fchren', 'f\u00fchret', 'f\u00fchren'],
      imperativ: ['fahr', 'fahrt', 'fahren Sie'],
      tip: 'Strong verb, a\u2192\u00e4 in du/er Pr\u00e4sens. Uses SEIN (motion). "Ich fahre mit dem Zug." With accusative object: uses haben ("Ich habe das Auto gefahren").'
    },
    sehen: {
      meaning: 'to see',
      pr\u00e4sens: ['sehe', 'siehst', 'sieht', 'sehen', 'seht', 'sehen'],
      perfekt: { aux: 'haben', pp: 'gesehen' },
      pr\u00e4teritum: ['sah', 'sahst', 'sah', 'sahen', 'saht', 'sahen'],
      konjunktivII: ['s\u00e4he', 's\u00e4hest', 's\u00e4he', 's\u00e4hen', 's\u00e4het', 's\u00e4hen'],
      imperativ: ['sieh', 'seht', 'sehen Sie'],
      tip: 'Strong verb, e\u2192ie in du/er. "Sieh mal!" = Look! Also: aussehen (to look like), fernsehen (to watch TV \u2014 separable).'
    },
    aufstehen: {
      meaning: 'to get up / to stand up',
      pr\u00e4sens: ['stehe auf', 'stehst auf', 'steht auf', 'stehen auf', 'steht auf', 'stehen auf'],
      perfekt: { aux: 'sein', pp: 'aufgestanden' },
      pr\u00e4teritum: ['stand auf', 'standst auf', 'stand auf', 'standen auf', 'standet auf', 'standen auf'],
      konjunktivII: ['st\u00e4nde auf', 'st\u00e4ndest auf', 'st\u00e4nde auf', 'st\u00e4nden auf', 'st\u00e4ndet auf', 'st\u00e4nden auf'],
      imperativ: ['steh auf', 'steht auf', 'stehen Sie auf'],
      tip: 'Separable verb: prefix "auf" goes to end in main clauses. "Ich stehe um 7 Uhr auf." In subordinate clauses it stays together: "...weil ich fr\u00fch aufstehe."'
    },
    einkaufen: {
      meaning: 'to shop / to go shopping',
      pr\u00e4sens: ['kaufe ein', 'kaufst ein', 'kauft ein', 'kaufen ein', 'kauft ein', 'kaufen ein'],
      perfekt: { aux: 'haben', pp: 'eingekauft' },
      pr\u00e4teritum: ['kaufte ein', 'kauftest ein', 'kaufte ein', 'kauften ein', 'kauftet ein', 'kauften ein'],
      konjunktivII: ['kaufte ein', 'kauftest ein', 'kaufte ein', 'kauften ein', 'kauftet ein', 'kauften ein'],
      imperativ: ['kauf ein', 'kauft ein', 'kaufen Sie ein'],
      tip: 'Separable verb. "Ich kaufe im Supermarkt ein." Prefix goes to end. In Perfekt: "eingekauft" (ge- between prefix and stem).'
    },
    anfangen: {
      meaning: 'to begin / to start',
      pr\u00e4sens: ['fange an', 'f\u00e4ngst an', 'f\u00e4ngt an', 'fangen an', 'fangt an', 'fangen an'],
      perfekt: { aux: 'haben', pp: 'angefangen' },
      pr\u00e4teritum: ['fing an', 'fingst an', 'fing an', 'fingen an', 'fingt an', 'fingen an'],
      konjunktivII: ['finge an', 'fingest an', 'finge an', 'fingen an', 'finget an', 'fingen an'],
      imperativ: ['fang an', 'fangt an', 'fangen Sie an'],
      tip: 'Separable strong verb, a\u2192\u00e4 in du/er. "Wann f\u00e4ngt der Film an?" Past participle: an-ge-fangen. Synonym: beginnen (inseparable).'
    },
    'sich waschen': {
      meaning: 'to wash (oneself)',
      pr\u00e4sens: ['wasche mich', 'w\u00e4schst dich', 'w\u00e4scht sich', 'waschen uns', 'wascht euch', 'waschen sich'],
      perfekt: { aux: 'haben', pp: 'gewaschen' },
      pr\u00e4teritum: ['wusch mich', 'wuschst dich', 'wusch sich', 'wuschen uns', 'wuscht euch', 'wuschen sich'],
      konjunktivII: ['w\u00fcsche mich', 'w\u00fcschest dich', 'w\u00fcsche sich', 'w\u00fcschen uns', 'w\u00fcschet euch', 'w\u00fcschen sich'],
      imperativ: ['wasch dich', 'wascht euch', 'waschen Sie sich'],
      tip: 'Reflexive + strong verb (a\u2192\u00e4 in du/er). Accusative reflexive. "Ich wasche mir die H\u00e4nde" = dative reflexive (body part).'
    },
    'sich freuen': {
      meaning: 'to be happy / to look forward to',
      pr\u00e4sens: ['freue mich', 'freust dich', 'freut sich', 'freuen uns', 'freut euch', 'freuen sich'],
      perfekt: { aux: 'haben', pp: 'gefreut' },
      pr\u00e4teritum: ['freute mich', 'freutest dich', 'freute sich', 'freuten uns', 'freutet euch', 'freuten sich'],
      konjunktivII: ['freute mich', 'freutest dich', 'freute sich', 'freuten uns', 'freutet euch', 'freuten sich'],
      imperativ: ['freu dich', 'freut euch', 'freuen Sie sich'],
      tip: 'Reflexive. "sich freuen \u00fcber" + acc. = be happy about. "sich freuen auf" + acc. = look forward to. Key preposition distinction!'
    },
    finden: {
      meaning: 'to find / to think (opinion)',
      pr\u00e4sens: ['finde', 'findest', 'findet', 'finden', 'findet', 'finden'],
      perfekt: { aux: 'haben', pp: 'gefunden' },
      pr\u00e4teritum: ['fand', 'fandest', 'fand', 'fanden', 'fandet', 'fanden'],
      konjunktivII: ['f\u00e4nde', 'f\u00e4ndest', 'f\u00e4nde', 'f\u00e4nden', 'f\u00e4ndet', 'f\u00e4nden'],
      imperativ: ['finde', 'findet', 'finden Sie'],
      tip: 'Strong verb. Two meanings: "Ich finde meinen Schl\u00fcssel" (find) and "Ich finde das gut" (I think that\'s good). "Wie findest du das?" = What do you think?'
    },
    helfen: {
      meaning: 'to help',
      pr\u00e4sens: ['helfe', 'hilfst', 'hilft', 'helfen', 'helft', 'helfen'],
      perfekt: { aux: 'haben', pp: 'geholfen' },
      pr\u00e4teritum: ['half', 'halfst', 'half', 'halfen', 'halft', 'halfen'],
      konjunktivII: ['h\u00fclfe', 'h\u00fclfest', 'h\u00fclfe', 'h\u00fclfen', 'h\u00fclfet', 'h\u00fclfen'],
      imperativ: ['hilf', 'helft', 'helfen Sie'],
      tip: 'Strong verb, e\u2192i in du/er. Takes DATIVE object: "Ich helfe dir." (not dich). "Kann ich Ihnen helfen?"'
    },
  },

  // ============================================================================
  // CONFUSABLE WORDS
  // ============================================================================
  confusables: {
    // ========== SEIN vs HABEN as auxiliary ==========
    'ist ... gegangen': { confusesWith: 'hat ... gemacht', hint: 'Motion/state-change verbs use SEIN as auxiliary: ist gegangen, ist gekommen, ist gefahren. Action verbs use HABEN: hat gemacht, hat gesagt.' },
    'ist gekommen': { confusesWith: 'hat bekommen', hint: 'KOMMEN (to come) uses sein: "Er ist gekommen." BEKOMMEN (to receive) uses haben: "Er hat es bekommen." False friend!' },

    // ========== KENNEN vs WISSEN (both mean "to know") ==========
    'wei\u00df': { confusesWith: 'kenne', hint: 'WISSEN = know facts/information. KENNEN = know people/places (familiarity). "Ich wei\u00df es nicht" vs "Ich kenne ihn nicht."' },
    'kenne': { confusesWith: 'wei\u00df', hint: 'KENNEN = know (be acquainted with). WISSEN = know (a fact). "Kennst du Berlin?" vs "Wei\u00dft du, wo er wohnt?"' },
    'kennt': { confusesWith: 'wei\u00df', hint: 'KENNEN = familiarity with people/places. WISSEN = factual knowledge. "Sie kennt meinen Bruder" vs "Sie wei\u00df die Antwort."' },

    // ========== ALS vs WENN vs WANN ==========
    'als': { confusesWith: 'wenn', hint: 'ALS = when (single past event): "Als ich jung war." WENN = when/if (repeated, present, or future): "Wenn es regnet." WANN = when (question): "Wann kommst du?"' },
    'wenn': { confusesWith: 'als', hint: 'WENN = when (repeated, present, future, or hypothetical): "Wenn ich Zeit habe." ALS = when (one-time past): "Als ich Kind war." WENN also = if.' },
    'wann': { confusesWith: 'wenn', hint: 'WANN = when (direct/indirect QUESTION only): "Wann f\u00e4hrt der Zug?" / "Ich wei\u00df nicht, wann er kommt." Not for clauses!' },

    // ========== ABER vs SONDERN ==========
    'aber': { confusesWith: 'sondern', hint: 'ABER = but (general contrast): "Es ist kalt, aber sch\u00f6n." SONDERN = but rather (after negation, correcting): "Nicht blau, sondern gr\u00fcn." Requires nicht/kein before it.' },
    'sondern': { confusesWith: 'aber', hint: 'SONDERN = but rather (contradiction after negation): "Er ist nicht dumm, sondern faul." Must follow nicht or kein. ABER = simple contrast.' },

    // ========== SEIT vs SEITDEM ==========
    'seit': { confusesWith: 'seitdem', hint: 'SEIT = since/for (preposition + dative): "Seit zwei Jahren." SEITDEM = since then (adverb/conjunction): "Seitdem wohne ich hier." / "Seitdem er hier ist."' },
    'seitdem': { confusesWith: 'seit', hint: 'SEITDEM = since (conjunction introducing a clause, or adverb meaning "since then"). SEIT = since/for (preposition before a noun/time).' },

    // ========== DER/DIE/DAS confusion ==========
    'der': { confusesWith: 'die/das', hint: 'DER = masculine nominative. Also: die (fem./plural nom.), das (neuter nom.). No reliable rules \u2014 learn gender with each noun! Tips: -ung/-heit/-keit = die; -chen/-lein = das.' },
    'die': { confusesWith: 'der/das', hint: 'DIE = feminine nominative OR plural (all genders). "Die Frau" (the woman), "die B\u00fccher" (the books). In accusative, only masculine changes (den).' },
    'das': { confusesWith: 'der/die', hint: 'DAS = neuter nominative/accusative. Common neuters: das Kind, das Buch, das M\u00e4dchen (diminutive!), das Haus. -chen and -lein are always neuter.' },

    // ========== ACCUSATIVE vs DATIVE prepositions (two-way / Wechselpr\u00e4positionen) ==========
    'in den': { confusesWith: 'in dem/im', hint: 'IN + ACCUSATIVE (motion INTO): "Ich gehe in den Park." IN + DATIVE (location IN): "Ich bin im Park." Wohin? = Akk. Wo? = Dat.' },
    'in dem': { confusesWith: 'in den', hint: 'IN + DATIVE (location, no motion): "Im (in dem) Haus." IN + ACCUSATIVE (motion toward): "Ins (in das) Haus." Key: Wo? = Dativ, Wohin? = Akkusativ.' },
    'auf den': { confusesWith: 'auf dem', hint: 'AUF + ACCUSATIVE (motion ONTO): "Ich lege das Buch auf den Tisch." AUF + DATIVE (location ON): "Das Buch liegt auf dem Tisch."' },
    'auf dem': { confusesWith: 'auf den', hint: 'AUF + DATIVE (location ON): "auf dem Tisch." AUF + ACCUSATIVE (motion ONTO): "auf den Tisch." Wo? = Dativ. Wohin? = Akkusativ.' },
    'an die': { confusesWith: 'an der', hint: 'AN + ACCUSATIVE (motion TO): "Ich gehe an die T\u00fcr." AN + DATIVE (location AT): "Ich stehe an der T\u00fcr."' },
    'an der': { confusesWith: 'an die', hint: 'AN + DATIVE (at/on vertical surface): "an der Wand." AN + ACCUSATIVE (toward): "an die Wand." Wo? vs Wohin?' },

    // ========== HIN vs HER (directional particles) ==========
    'hin': { confusesWith: 'her', hint: 'HIN = motion AWAY from speaker: "Wo gehst du hin?" (Where are you going?) HER = motion TOWARD speaker: "Wo kommst du her?" (Where do you come from?)' },
    'her': { confusesWith: 'hin', hint: 'HER = toward the speaker: "Komm her!" (Come here!) HIN = away from speaker: "Geh hin!" (Go there!) Also in: herein/hinein, heraus/hinaus.' },

    // ========== BRINGEN vs MITBRINGEN ==========
    'bringen': { confusesWith: 'mitbringen', hint: 'BRINGEN = to bring/take (general). MITBRINGEN = to bring along (with you, separable): "Bring bitte Brot mit!" In Perfekt: "mitgebracht" (ge- in middle).' },
    'mitbringen': { confusesWith: 'bringen', hint: 'MITBRINGEN = to bring along (separable): "Ich bringe Kuchen mit." BRINGEN = bring (general, inseparable): "Ich bringe es dir." "Was soll ich mitbringen?"' },

    // ========== STELLEN/STEHEN, LEGEN/LIEGEN, SETZEN/SITZEN ==========
    'stellen': { confusesWith: 'stehen', hint: 'STELLEN = to PUT (upright, transitive, + Akk.): "Ich stelle die Flasche auf den Tisch." STEHEN = to STAND/BE (intransitive, + Dat.): "Die Flasche steht auf dem Tisch." Weak/haben vs strong/haben.' },
    'stehen': { confusesWith: 'stellen', hint: 'STEHEN = to stand/be standing (location): "Er steht an der T\u00fcr." STELLEN = to place upright (action): "Er stellt das Glas auf den Tisch." Stehen = Wo? Stellen = Wohin?' },
    'legen': { confusesWith: 'liegen', hint: 'LEGEN = to LAY/PUT (flat, transitive, + Akk.): "Ich lege das Buch auf den Tisch." LIEGEN = to LIE/BE LYING (intransitive, + Dat.): "Das Buch liegt auf dem Tisch."' },
    'liegen': { confusesWith: 'legen', hint: 'LIEGEN = to lie (location, intransitive): "Die Zeitung liegt auf dem Sofa." LEGEN = to lay (action, transitive): "Leg die Zeitung auf den Tisch."' },
    'setzen': { confusesWith: 'sitzen', hint: 'SETZEN = to SET/PUT (seated, transitive, + Akk.): "Ich setze das Kind auf den Stuhl." SITZEN = to SIT/BE SITTING (+ Dat.): "Das Kind sitzt auf dem Stuhl." sich setzen = to sit down.' },
    'sitzen': { confusesWith: 'setzen', hint: 'SITZEN = to be sitting (location): "Sie sitzt am Tisch." SETZEN = to seat/put: "Setzen Sie sich!" (Sit down!). Action vs state.' },

    // ========== SIE vs sie vs sie ==========
    'Sie': { confusesWith: 'sie', hint: 'SIE (capitalized) = you (formal). sie (lowercase) = she OR they. Context + verb form: "Sie haben" = you have (formal) or they have. "Sie hat" = she has.' },
  },

  // ============================================================================
  // GRAMMAR PATTERN DETECTION
  // ============================================================================
  detectGrammarPatterns(german, english) {
    const hints = [];
    const deLower = german.toLowerCase();
    const deWords = deLower.split(/\s+/);
    const hasWord = (words) => words.some(w => deWords.includes(w));

    // Verb detection
    const verbs = window.COURSE_CONFIG?.verbs || {};
    for (const [verb, data] of Object.entries(verbs)) {
      const allForms = [];
      if (data.pr\u00e4sens) allForms.push(...data.pr\u00e4sens);
      if (data.pr\u00e4teritum) allForms.push(...data.pr\u00e4teritum);
      if (data.konjunktivII) allForms.push(...data.konjunktivII);
      if (data.perfekt && data.perfekt.pp) allForms.push(data.perfekt.pp);

      // Filter nulls and split separable forms (take first word)
      const validForms = allForms
        .filter(f => f !== null)
        .map(f => f.split(' ')[0]);

      if (hasWord(validForms)) {
        let hint = verb.toUpperCase() + ' (' + data.meaning + ')';
        if (data.tip) hint += ': ' + data.tip;
        hints.push(hint);
        break;
      }
    }

    // Case detection via articles
    const articles = window.COURSE_CONFIG?.grammarArticles || {};
    for (const [art, info] of Object.entries(articles)) {
      if (deLower.includes(art + ' ')) {
        hints.push('CASE: ' + info.case.toUpperCase() + ' (' + info.gender + ')');
        break;
      }
    }

    // Negation
    if (deLower.includes('nicht') || deLower.includes('kein')) {
      let neg = 'nicht/kein';
      if (deLower.includes('nicht mehr')) neg = 'nicht mehr (no longer)';
      else if (deLower.includes('nie') || deLower.includes('niemals')) neg = 'nie/niemals (never)';
      else if (deLower.includes('nichts')) neg = 'nichts (nothing)';
      else if (deLower.includes('niemand')) neg = 'niemand (nobody)';
      hints.push('NEGATION: ' + neg);
    }

    // Subordinate clause detection (verb at end)
    if (deLower.includes('weil ') || deLower.includes('dass ') || deLower.includes('obwohl ') || deLower.includes('wenn ') || deLower.includes('als ')) {
      hints.push('SUBORDINATE CLAUSE: Verb goes to END. weil/dass/obwohl/wenn/als + ... + verb.');
    }

    // Separable verb detection
    const sepPrefixes = ['auf', 'an', 'ab', 'aus', 'ein', 'mit', 'vor', 'zu', 'zur\u00fcck', 'weg', 'um', 'fern'];
    const lastWord = deWords[deWords.length - 1];
    if (sepPrefixes.includes(lastWord) && deWords.length > 2) {
      hints.push('SEPARABLE VERB: Prefix "' + lastWord + '" at sentence end.');
    }

    return hints.length > 0 ? hints.slice(0, 2).join(' | ') : 'Basic vocabulary';
  },

  // ============================================================================
  // UNITS DATA - ALL 30 GERMAN UNITS
  // ============================================================================
  units: [
    // ===== VOLUME 1: FOUNDATIONS (Units 1-10) =====
    {
      id: 1,
      volume: 1,
      title_target: 'Erste Begegnung',
      title_source: 'First Encounter',
      title_de: 'Erste Begegnung',
      title_en: 'First Encounter',
      dialogue: [
        { speaker: 'FRAU SCHMIDT', de: 'Guten Tag. Mein Name ist Schmidt, Anna Schmidt.', en: 'Good day. My name is Schmidt, Anna Schmidt.' },
        { speaker: 'HERR M\u00dcLLER', de: 'Guten Tag, Frau Schmidt. Ich bin Thomas M\u00fcller. Freut mich.', en: 'Good day, Mrs. Schmidt. I am Thomas M\u00fcller. Pleased to meet you.' },
        { speaker: 'FRAU SCHMIDT', de: 'Freut mich auch. Woher kommen Sie?', en: 'Pleased to meet you too. Where are you from?' },
        { speaker: 'HERR M\u00dcLLER', de: 'Ich komme aus M\u00fcnchen. Und Sie?', en: 'I come from Munich. And you?' },
        { speaker: 'FRAU SCHMIDT', de: 'Ich bin aus Berlin. Sind Sie auch auf der Konferenz?', en: 'I\'m from Berlin. Are you also at the conference?' },
        { speaker: 'HERR M\u00dcLLER', de: 'Ja, ich bin Ingenieur. Was sind Sie von Beruf?', en: 'Yes, I\'m an engineer. What is your profession?' },
      ],
      grammar: [
        { title: 'Begr\u00fc\u00dfungen', desc: 'Guten Tag (hello/good day), Guten Morgen (good morning), Guten Abend (good evening). Informal: Hallo, Hi.' },
        { title: 'sein (Pr\u00e4sens)', desc: 'ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind.' },
        { title: 'Herkunft & W-Fragen', desc: '"Woher kommen Sie?" \u2014 "Ich komme aus Berlin." W-Fragen: wer, was, wo, woher, wie.' },
        { title: 'Sie vs du', desc: 'Sie (formal you, always capitalized) vs du (informal). Sie uses 3rd person plural verb forms.' },
      ]
    },
    {
      id: 2,
      volume: 1,
      title_target: 'Im Caf\u00e9',
      title_source: 'At the Caf\u00e9',
      title_de: 'Im Caf\u00e9',
      title_en: 'At the Caf\u00e9',
      dialogue: [
        { speaker: 'KELLNER', de: 'Guten Tag! Was m\u00f6chten Sie bestellen?', en: 'Good day! What would you like to order?' },
        { speaker: 'FRAU WEBER', de: 'Ich h\u00e4tte gern einen Kaffee, bitte.', en: 'I\'d like a coffee, please.' },
        { speaker: 'KELLNER', de: 'Mit Milch und Zucker?', en: 'With milk and sugar?' },
        { speaker: 'FRAU WEBER', de: 'Nur mit Milch, bitte. Und haben Sie auch Kuchen?', en: 'Only with milk, please. And do you also have cake?' },
        { speaker: 'KELLNER', de: 'Ja, wir haben Apfelkuchen und Schwarzw\u00e4lder Kirschtorte.', en: 'Yes, we have apple cake and Black Forest cake.' },
        { speaker: 'FRAU WEBER', de: 'Dann nehme ich ein St\u00fcck Apfelkuchen. Was kostet das?', en: 'Then I\'ll take a piece of apple cake. How much does that cost?' },
      ],
      grammar: [
        { title: 'haben (Pr\u00e4sens)', desc: 'ich habe, du hast, er/sie/es hat, wir haben, ihr habt, sie/Sie haben.' },
        { title: 'Bestellen (Ordering)', desc: '"Ich m\u00f6chte..." / "Ich h\u00e4tte gern..." (I would like). "Was kostet das?" (How much is that?)' },
        { title: 'Akkusativ (bestimmter Artikel)', desc: 'Only masculine changes: der \u2192 den, ein \u2192 einen. "Ich m\u00f6chte einen Kaffee." Die/das stay the same.' },
      ]
    },
    {
      id: 3,
      volume: 1,
      title_target: 'Familie und Freunde',
      title_source: 'Family and Friends',
      title_de: 'Familie und Freunde',
      title_en: 'Family and Friends',
      dialogue: [
        { speaker: 'ANNA', de: 'Haben Sie Familie hier in der Stadt?', en: 'Do you have family here in the city?' },
        { speaker: 'THOMAS', de: 'Ja, meine Frau und meine zwei Kinder.', en: 'Yes, my wife and my two children.' },
        { speaker: 'ANNA', de: 'Wie hei\u00dfen Ihre Kinder?', en: 'What are your children\'s names?' },
        { speaker: 'THOMAS', de: 'Mein Sohn hei\u00dft Max und meine Tochter hei\u00dft Lena.', en: 'My son\'s name is Max and my daughter\'s name is Lena.' },
        { speaker: 'ANNA', de: 'Wie alt sind sie?', en: 'How old are they?' },
        { speaker: 'THOMAS', de: 'Max ist zehn und Lena ist sieben Jahre alt.', en: 'Max is ten and Lena is seven years old.' },
      ],
      grammar: [
        { title: 'Familienmitglieder', desc: 'der Vater/die Mutter, der Bruder/die Schwester, der Sohn/die Tochter, der Gro\u00dfvater/die Gro\u00dfmutter, der Onkel/die Tante.' },
        { title: 'Possessivartikel', desc: 'mein/meine (my), dein/deine (your-inf.), sein/seine (his), ihr/ihre (her), unser/unsere (our), Ihr/Ihre (your-formal).' },
        { title: 'Plural', desc: 'Common patterns: Kind\u2192Kinder, Bruder\u2192Br\u00fcder (umlaut), Schwester\u2192Schwestern, Frau\u2192Frauen. Learn plurals with each noun!' },
      ]
    },
    {
      id: 4,
      volume: 1,
      title_target: 'Berufe und Arbeit',
      title_source: 'Professions and Work',
      title_de: 'Berufe und Arbeit',
      title_en: 'Professions and Work',
      dialogue: [
        { speaker: 'LISA', de: 'Was sind Sie von Beruf, Herr Fischer?', en: 'What is your profession, Mr. Fischer?' },
        { speaker: 'HERR FISCHER', de: 'Ich bin Arzt. Ich arbeite im Krankenhaus.', en: 'I\'m a doctor. I work in the hospital.' },
        { speaker: 'LISA', de: 'Das ist interessant! Arbeiten Sie viel?', en: 'That\'s interesting! Do you work a lot?' },
        { speaker: 'HERR FISCHER', de: 'Ja, leider. Und was machen Sie beruflich?', en: 'Yes, unfortunately. And what do you do professionally?' },
        { speaker: 'LISA', de: 'Ich bin keine Ingenieurin. Ich bin Lehrerin an einer Grundschule.', en: 'I\'m not an engineer. I\'m a teacher at an elementary school.' },
      ],
      grammar: [
        { title: 'Berufe (ohne Artikel)', desc: 'No article with professions: "Ich bin Arzt/\u00c4rztin" (NOT ich bin ein Arzt). With adjective: "Ich bin ein guter Arzt."' },
        { title: 'Verneinung: nicht vs kein', desc: 'NICHT negates verbs/adjectives: "Ich arbeite nicht." KEIN negates nouns (replaces ein): "Ich habe keinen Hund."' },
        { title: 'Weibliche Berufsbezeichnungen', desc: 'Add -in for feminine: Arzt/\u00c4rztin, Lehrer/Lehrerin, Ingenieur/Ingenieurin, Student/Studentin.' },
      ]
    },
    {
      id: 5,
      volume: 1,
      title_target: 'Wiederholung 1',
      title_source: 'Review 1',
      title_de: 'Wiederholung 1',
      title_en: 'Review 1',
      dialogue: [],
      grammar: [
        { title: 'Artikel-\u00dcbersicht', desc: 'Nominativ: der/die/das/die. Akkusativ: den/die/das/die. Unbestimmt: ein/eine/ein \u2192 einen/eine/ein.' },
        { title: 'Wichtige Verben', desc: 'sein (bin/bist/ist), haben (habe/hast/hat), kommen, hei\u00dfen, arbeiten, machen.' },
      ]
    },
    {
      id: 6,
      volume: 1,
      title_target: 'Tagesablauf',
      title_source: 'Daily Routine',
      title_de: 'Tagesablauf',
      title_en: 'Daily Routine',
      dialogue: [
        { speaker: 'MODERATOR', de: 'Erz\u00e4hlen Sie uns von Ihrem Tagesablauf.', en: 'Tell us about your daily routine.' },
        { speaker: 'MARIA', de: 'Ich stehe um halb sieben auf und dusche mich.', en: 'I get up at half past six and shower.' },
        { speaker: 'MODERATOR', de: 'Und was machen Sie dann?', en: 'And what do you do then?' },
        { speaker: 'MARIA', de: 'Dann fr\u00fchst\u00fccke ich und fahre um acht zur Arbeit.', en: 'Then I have breakfast and drive to work at eight.' },
        { speaker: 'MODERATOR', de: 'Wann kommen Sie nach Hause?', en: 'When do you come home?' },
        { speaker: 'MARIA', de: 'Ich komme um sechs nach Hause und koche das Abendessen.', en: 'I come home at six and cook dinner.' },
      ],
      grammar: [
        { title: 'Trennbare Verben', desc: 'aufstehen, aufwachen, einkaufen, anfangen, mitkommen. Prefix goes to end: "Ich stehe um 7 auf." Perfekt: auf-ge-standen.' },
        { title: 'Uhrzeit', desc: '"Wie sp\u00e4t ist es?" / "Wie viel Uhr ist es?" Es ist halb sieben (6:30). Viertel vor/nach. Um + time = at.' },
        { title: 'Tageszeiten', desc: 'morgens (in the morning), vormittags, mittags, nachmittags, abends, nachts. With am: am Morgen, am Abend.' },
      ]
    },
    {
      id: 7,
      volume: 1,
      title_target: 'Einkaufen',
      title_source: 'Shopping',
      title_de: 'Einkaufen',
      title_en: 'Shopping',
      dialogue: [
        { speaker: 'VERK\u00c4UFERIN', de: 'Guten Tag, kann ich Ihnen helfen?', en: 'Good day, can I help you?' },
        { speaker: 'KUNDIN', de: 'Ja, ich m\u00f6chte ein Kilo \u00c4pfel und eine Flasche Wasser.', en: 'Yes, I\'d like a kilo of apples and a bottle of water.' },
        { speaker: 'VERK\u00c4UFERIN', de: 'Gerne. Darf es sonst noch etwas sein?', en: 'Of course. Will there be anything else?' },
        { speaker: 'KUNDIN', de: 'Ja, ich brauche noch Brot. Was k\u00f6nnen Sie empfehlen?', en: 'Yes, I still need bread. What can you recommend?' },
        { speaker: 'VERK\u00c4UFERIN', de: 'Das Vollkornbrot ist sehr gut. Das macht zusammen 8,50 Euro.', en: 'The whole grain bread is very good. That comes to 8.50 euros altogether.' },
      ],
      grammar: [
        { title: 'Modalverben', desc: 'k\u00f6nnen (can), m\u00fcssen (must), m\u00f6chten (would like), d\u00fcrfen (may), wollen (want), sollen (should). Verb goes to end: "Ich m\u00f6chte einkaufen."' },
        { title: 'Dativ (indirektes Objekt)', desc: 'dem/der/dem/den(+n). "Ich gebe dem Mann das Buch." Pronouns: mir, dir, ihm, ihr, uns, euch, ihnen/Ihnen.' },
        { title: 'Einkaufsvokabular', desc: 'das Gesch\u00e4ft (shop), der Supermarkt, die B\u00e4ckerei (bakery), die Metzgerei (butcher), der Markt. Mengen: ein Kilo, eine Flasche, ein St\u00fcck.' },
      ]
    },
    {
      id: 8,
      volume: 1,
      title_target: 'Wohnen',
      title_source: 'Housing',
      title_de: 'Wohnen',
      title_en: 'Housing',
      dialogue: [
        { speaker: 'MAKLER', de: 'Die Wohnung hat drei Zimmer, eine K\u00fcche und ein Bad.', en: 'The apartment has three rooms, a kitchen, and a bathroom.' },
        { speaker: 'MIETER', de: 'Ist die Wohnung m\u00f6bliert?', en: 'Is the apartment furnished?' },
        { speaker: 'MAKLER', de: 'Nein, aber es gibt einen Balkon und einen Keller.', en: 'No, but there is a balcony and a cellar.' },
        { speaker: 'MIETER', de: 'Was kostet die Miete pro Monat?', en: 'How much is the rent per month?' },
        { speaker: 'MAKLER', de: 'Die Kaltmiete betr\u00e4gt 750 Euro plus Nebenkosten.', en: 'The base rent is 750 euros plus utilities.' },
      ],
      grammar: [
        { title: 'Akkusativ-Pr\u00e4positionen', desc: 'durch (through), f\u00fcr (for), gegen (against), ohne (without), um (around). ALWAYS accusative: "f\u00fcr meinen Freund."' },
        { title: 'es gibt + Akkusativ', desc: '"Es gibt einen Balkon" = There is a balcony. Always accusative after "es gibt".' },
        { title: 'Wohnungsvokabular', desc: 'das Zimmer (room), die K\u00fcche, das Bad, das Schlafzimmer, das Wohnzimmer, der Flur (hallway), die Miete (rent), die Nebenkosten (utilities).' },
      ]
    },
    {
      id: 9,
      volume: 1,
      title_target: 'Unterwegs',
      title_source: 'Getting Around',
      title_de: 'Unterwegs',
      title_en: 'Getting Around',
      dialogue: [
        { speaker: 'TOURIST', de: 'Entschuldigung, wie komme ich zum Bahnhof?', en: 'Excuse me, how do I get to the train station?' },
        { speaker: 'PASSANT', de: 'Gehen Sie geradeaus und dann links an der Ampel.', en: 'Go straight ahead and then left at the traffic light.' },
        { speaker: 'TOURIST', de: 'Ist es weit von hier?', en: 'Is it far from here?' },
        { speaker: 'PASSANT', de: 'Nein, ungef\u00e4hr zehn Minuten zu Fu\u00df. Oder fahren Sie mit der U-Bahn.', en: 'No, about ten minutes on foot. Or take the subway.' },
        { speaker: 'TOURIST', de: 'Wo ist die n\u00e4chste U-Bahn-Station?', en: 'Where is the nearest subway station?' },
      ],
      grammar: [
        { title: 'Dativ-Pr\u00e4positionen', desc: 'aus (from/out of), bei (at/near), mit (with), nach (to/after), seit (since/for), von (from/of), zu (to). ALWAYS dative: "mit dem Bus."' },
        { title: 'Wegbeschreibung', desc: 'geradeaus (straight), links/rechts (left/right), die Ampel (traffic light), die Kreuzung (intersection), die Br\u00fccke (bridge).' },
        { title: 'Verkehrsmittel', desc: 'mit dem Bus/Zug/Auto/Fahrrad, mit der U-Bahn/Stra\u00dfenbahn. "zu Fu\u00df gehen" = to walk. "fahren" = to drive/ride.' },
      ]
    },
    {
      id: 10,
      volume: 1,
      title_target: 'Wiederholung 2',
      title_source: 'Review 2',
      title_de: 'Wiederholung 2',
      title_en: 'Review 2',
      dialogue: [],
      grammar: [
        { title: 'Einheiten 6\u20139 Wiederholung', desc: 'Trennbare Verben, Modalverben, Uhrzeit, Einkaufen, Wohnen, Wegbeschreibung.' },
        { title: 'Kasus-\u00dcbersicht', desc: 'Nominativ (Subjekt), Akkusativ (direktes Objekt + Pr\u00e4p.), Dativ (indirektes Objekt + Pr\u00e4p.). Maskulin \u00e4ndert sich am meisten.' },
      ]
    },

    // ===== VOLUME 2: INTERMEDIATE (Units 11-20) =====
    {
      id: 11,
      volume: 2,
      title_target: 'Im Restaurant',
      title_source: 'At the Restaurant',
      title_de: 'Im Restaurant',
      title_en: 'At the Restaurant',
      dialogue: [
        { speaker: 'KELLNER', de: 'Guten Abend! Haben Sie reserviert?', en: 'Good evening! Do you have a reservation?' },
        { speaker: 'GAST', de: 'Ja, auf den Namen M\u00fcller. Einen Tisch f\u00fcr zwei, bitte.', en: 'Yes, under the name M\u00fcller. A table for two, please.' },
        { speaker: 'KELLNER', de: 'Hier ist die Speisekarte. M\u00f6chten Sie schon etwas trinken?', en: 'Here is the menu. Would you like something to drink already?' },
        { speaker: 'GAST', de: 'Ich stelle das Glas auf den Tisch. Wo liegt die Speisekarte?', en: 'I\'m putting the glass on the table. Where is the menu?' },
        { speaker: 'KELLNER', de: 'Sie liegt auf dem Tisch neben der Kerze.', en: 'It\'s lying on the table next to the candle.' },
      ],
      grammar: [
        { title: 'Wechselpr\u00e4positionen', desc: 'in, an, auf, \u00fcber, unter, neben, vor, hinter, zwischen. Wohin? (motion) = Akk. Wo? (location) = Dat.' },
        { title: 'stellen/stehen, legen/liegen', desc: 'Transitive (put) = Akk.: "Ich stelle das Glas auf DEN Tisch." Intransitive (be) = Dat.: "Das Glas steht auf DEM Tisch."' },
        { title: 'Im Restaurant', desc: 'die Speisekarte (menu), das Gericht (dish), die Vorspeise (appetizer), das Hauptgericht (main course), die Nachspeise (dessert), die Rechnung (bill).' },
      ]
    },
    {
      id: 12,
      volume: 2,
      title_target: 'Gesundheit',
      title_source: 'Health',
      title_de: 'Gesundheit',
      title_en: 'Health',
      dialogue: [
        { speaker: 'ARZT', de: 'Was fehlt Ihnen? Wo tut es weh?', en: 'What\'s wrong? Where does it hurt?' },
        { speaker: 'PATIENT', de: 'Ich habe Kopfschmerzen und mir ist schlecht.', en: 'I have a headache and I feel nauseous.' },
        { speaker: 'ARZT', de: 'Seit wann haben Sie die Beschwerden?', en: 'How long have you had the symptoms?' },
        { speaker: 'PATIENT', de: 'Seit drei Tagen. Ich f\u00fchle mich sehr m\u00fcde.', en: 'For three days. I feel very tired.' },
        { speaker: 'ARZT', de: 'Bitte legen Sie sich hin. Ich muss Sie untersuchen.', en: 'Please lie down. I need to examine you.' },
      ],
      grammar: [
        { title: 'Reflexivverben', desc: 'sich f\u00fchlen (feel), sich waschen (wash), sich setzen (sit down), sich anziehen (dress). Pronomen: mich/dich/sich/uns/euch/sich.' },
        { title: 'Schmerzen ausdr\u00fccken', desc: 'Kopfschmerzen/Bauchschmerzen haben. "Mir tut der Kopf weh." "Mir ist schlecht/kalt/warm." (Dative + sein).' },
        { title: 'Reflexiv: Akkusativ vs Dativ', desc: '"Ich wasche mich" (Akk. = whole self). "Ich wasche mir die H\u00e4nde" (Dat. = body part is separate object).' },
      ]
    },
    {
      id: 13,
      volume: 2,
      title_target: 'Freizeit',
      title_source: 'Free Time',
      title_de: 'Freizeit',
      title_en: 'Free Time',
      dialogue: [
        { speaker: 'STEFAN', de: 'Was machst du lieber: schwimmen oder laufen?', en: 'What do you prefer: swimming or running?' },
        { speaker: 'KLARA', de: 'Ich schwimme lieber als laufen. Aber am liebsten spiele ich Tennis.', en: 'I prefer swimming to running. But most of all I like to play tennis.' },
        { speaker: 'STEFAN', de: 'Tennis? Du bist bestimmt besser als ich!', en: 'Tennis? You\'re surely better than me!' },
        { speaker: 'KLARA', de: 'Na ja, ich bin nicht die beste, aber es macht Spa\u00df.', en: 'Well, I\'m not the best, but it\'s fun.' },
      ],
      grammar: [
        { title: 'Komparativ', desc: 'Adjektiv + -er: schneller, gr\u00f6\u00dfer, besser. "als" for comparison: "Er ist gr\u00f6\u00dfer als ich." Umlaut: alt\u2192\u00e4lter, jung\u2192j\u00fcnger.' },
        { title: 'Superlativ', desc: 'am + Adj. + -sten: am schnellsten, am gr\u00f6\u00dften, am besten. Irregular: gut\u2192besser\u2192am besten, viel\u2192mehr\u2192am meisten, gern\u2192lieber\u2192am liebsten.' },
        { title: 'gern / lieber / am liebsten', desc: '"Ich schwimme gern" (I like swimming). "Ich schwimme lieber" (I prefer swimming). "Am liebsten spiele ich Tennis" (I like playing tennis most).' },
      ]
    },
    {
      id: 14,
      volume: 2,
      title_target: 'Beschreibungen',
      title_source: 'Descriptions',
      title_de: 'Beschreibungen',
      title_en: 'Descriptions',
      dialogue: [
        { speaker: 'POLIZIST', de: 'K\u00f6nnen Sie die Person beschreiben?', en: 'Can you describe the person?' },
        { speaker: 'ZEUGE', de: 'Er war ein gro\u00dfer Mann mit kurzen, dunklen Haaren.', en: 'He was a tall man with short, dark hair.' },
        { speaker: 'POLIZIST', de: 'Was hat er getragen?', en: 'What was he wearing?' },
        { speaker: 'ZEUGE', de: 'Er trug einen schwarzen Mantel und eine alte braune Tasche.', en: 'He was wearing a black coat and an old brown bag.' },
      ],
      grammar: [
        { title: 'Adjektivendungen (nach bestimmtem Artikel)', desc: 'Nom: der gro\u00dfe Mann, die kleine Frau, das alte Haus. Akk: den gro\u00dfen Mann. Dat: dem gro\u00dfen Mann. Weak endings: mostly -e or -en.' },
        { title: 'Adjektivendungen (nach unbestimmtem Artikel)', desc: 'Nom: ein gro\u00dfer Mann, eine kleine Frau, ein altes Haus. Mixed endings: adjective shows gender when article doesn\'t.' },
        { title: 'Adjektivendungen (ohne Artikel)', desc: 'Strong endings: kalter Kaffee, frische Milch, deutsches Bier. Adjective takes full article ending when no article present.' },
      ]
    },
    {
      id: 15,
      volume: 2,
      title_target: 'Wiederholung 3',
      title_source: 'Review 3',
      title_de: 'Wiederholung 3',
      title_en: 'Review 3',
      dialogue: [],
      grammar: [
        { title: 'Wechselpr\u00e4positionen', desc: 'Akkusativ (Wohin?) vs Dativ (Wo?) mit in, an, auf, \u00fcber, unter, neben, vor, hinter, zwischen.' },
        { title: 'Adjektivdeklination', desc: 'Drei Typen: nach bestimmtem Artikel (schwach), nach unbestimmtem Artikel (gemischt), ohne Artikel (stark).' },
      ]
    },
    {
      id: 16,
      volume: 2,
      title_target: 'Reisen',
      title_source: 'Travel',
      title_de: 'Reisen',
      title_en: 'Travel',
      dialogue: [
        { speaker: 'ANNA', de: 'Wo haben Sie Ihren Urlaub verbracht?', en: 'Where did you spend your vacation?' },
        { speaker: 'PETER', de: 'Ich habe zwei Wochen in Spanien verbracht. Es war wunderbar!', en: 'I spent two weeks in Spain. It was wonderful!' },
        { speaker: 'ANNA', de: 'Was haben Sie dort gemacht?', en: 'What did you do there?' },
        { speaker: 'PETER', de: 'Ich habe viel fotografiert und die lokale K\u00fcche probiert.', en: 'I took a lot of photos and tried the local cuisine.' },
        { speaker: 'ANNA', de: 'Haben Sie auch Sehensw\u00fcrdigkeiten besucht?', en: 'Did you also visit sights?' },
      ],
      grammar: [
        { title: 'Perfekt mit haben', desc: 'Most verbs: haben + Partizip II. Regular: ge-...-t (gemacht, gekauft). Irregular: ge-...-en (geschrieben, genommen).' },
        { title: 'Partizip II Bildung', desc: 'Regular: ge+Stamm+t (machen\u2192gemacht). Strong: ge+Stamm+en (fahren\u2192gefahren). -ieren: no ge- (fotografiert). Inseparable: no ge- (besucht, verbracht).' },
        { title: 'Reisevokabular', desc: 'der Urlaub (vacation), die Reise (trip), der Flug (flight), das Hotel, die Sehensw\u00fcrdigkeit (sight), buchen (to book).' },
      ]
    },
    {
      id: 17,
      volume: 2,
      title_target: 'Am Flughafen',
      title_source: 'At the Airport',
      title_de: 'Am Flughafen',
      title_en: 'At the Airport',
      dialogue: [
        { speaker: 'BEAMTER', de: 'Ihren Reisepass, bitte. Wann sind Sie angekommen?', en: 'Your passport, please. When did you arrive?' },
        { speaker: 'REISENDER', de: 'Ich bin heute Morgen angekommen. Ich bin aus London geflogen.', en: 'I arrived this morning. I flew from London.' },
        { speaker: 'BEAMTER', de: 'Wie lange sind Sie geblieben?', en: 'How long did you stay?' },
        { speaker: 'REISENDER', de: 'Ich bin drei Tage in Berlin geblieben und dann nach M\u00fcnchen gefahren.', en: 'I stayed in Berlin for three days and then went to Munich.' },
      ],
      grammar: [
        { title: 'Perfekt mit sein', desc: 'Motion verbs: kommen\u2192ist gekommen, gehen\u2192ist gegangen, fahren\u2192ist gefahren, fliegen\u2192ist geflogen. State change: einschlafen, aufwachen, sterben.' },
        { title: 'sein-Verben merken', desc: 'Key sein verbs: kommen, gehen, fahren, fliegen, laufen, reisen, ankommen, abfahren, bleiben, sein, werden, passieren, sterben, aufstehen.' },
        { title: 'Zeitausdr\u00fccke (Vergangenheit)', desc: 'gestern (yesterday), vorgestern, letzte Woche, letzten Monat, letztes Jahr, vor zwei Tagen (two days ago).' },
      ]
    },
    {
      id: 18,
      volume: 2,
      title_target: 'Probleme l\u00f6sen',
      title_source: 'Solving Problems',
      title_de: 'Probleme l\u00f6sen',
      title_en: 'Solving Problems',
      dialogue: [
        { speaker: 'FRAU BRAUN', de: 'Was w\u00fcrden Sie machen, wenn Sie viel Geld h\u00e4tten?', en: 'What would you do if you had a lot of money?' },
        { speaker: 'HERR KLEIN', de: 'Wenn ich reich w\u00e4re, w\u00fcrde ich um die Welt reisen.', en: 'If I were rich, I would travel around the world.' },
        { speaker: 'FRAU BRAUN', de: 'Das w\u00e4re sch\u00f6n! K\u00f6nnten Sie mir einen Rat geben?', en: 'That would be nice! Could you give me some advice?' },
        { speaker: 'HERR KLEIN', de: 'An Ihrer Stelle w\u00fcrde ich erst mal sparen.', en: 'In your position, I would save first.' },
      ],
      grammar: [
        { title: 'Konjunktiv II', desc: 'Unreale Situationen. w\u00e4re (would be), h\u00e4tte (would have), k\u00f6nnte (could), w\u00fcrde + Inf. (would do). "Wenn ich Zeit h\u00e4tte..."' },
        { title: 'w\u00fcrde + Infinitiv', desc: 'For most verbs: "Ich w\u00fcrde gern helfen." Use actual Konj. II for sein/haben/modals: "Ich w\u00e4re froh" (not w\u00fcrde sein).' },
        { title: 'H\u00f6fliche Bitten', desc: 'K\u00f6nnten Sie...? (Could you...?) H\u00e4tten Sie...? (Would you have...?) W\u00fcrden Sie bitte...? (Would you please...?)' },
      ]
    },
    {
      id: 19,
      volume: 2,
      title_target: 'Telefon und E-Mail',
      title_source: 'Phone and Email',
      title_de: 'Telefon und E-Mail',
      title_en: 'Phone and Email',
      dialogue: [
        { speaker: 'SEKRET\u00c4RIN', de: 'Guten Tag, Firma M\u00fcller. Was kann ich f\u00fcr Sie tun?', en: 'Good day, M\u00fcller Company. What can I do for you?' },
        { speaker: 'ANRUFER', de: 'Ich m\u00f6chte Herrn Schmidt sprechen. Er hat gesagt, dass er heute im B\u00fcro ist.', en: 'I\'d like to speak to Mr. Schmidt. He said that he is in the office today.' },
        { speaker: 'SEKRET\u00c4RIN', de: 'Es tut mir leid, dass er gerade in einer Besprechung ist.', en: 'I\'m sorry that he is currently in a meeting.' },
        { speaker: 'ANRUFER', de: 'K\u00f6nnen Sie ihm sagen, dass ich angerufen habe?', en: 'Can you tell him that I called?' },
      ],
      grammar: [
        { title: 'dass-S\u00e4tze', desc: 'Nebensatz mit "dass": Verb goes to END. "Er sagt, dass er morgen KOMMT." "Ich hoffe, dass Sie gut ANGEKOMMEN SIND."' },
        { title: 'Wortstellung im Nebensatz', desc: 'After dass/weil/obwohl/wenn/als/ob: Subject + ... + conjugated verb LAST. "Ich wusste nicht, dass du hier BIST."' },
        { title: 'Telefonvokabular', desc: 'anrufen (to call), der Anruf (call), die Nachricht (message), zur\u00fcckrufen (call back), auflegen (hang up), der Anrufbeantworter (answering machine).' },
      ]
    },
    {
      id: 20,
      volume: 2,
      title_target: 'Wiederholung 4',
      title_source: 'Review 4',
      title_de: 'Wiederholung 4',
      title_en: 'Review 4',
      dialogue: [],
      grammar: [
        { title: 'Perfekt \u00dcbersicht', desc: 'haben vs sein als Hilfsverb. Partizip II: regul\u00e4r (ge-...-t), stark (ge-...-en), trennbar (auf-ge-standen), untrennbar (besucht).' },
        { title: 'Nebens\u00e4tze', desc: 'dass, weil, obwohl, wenn, als, ob \u2014 Verb am Ende. Konjunktiv II: w\u00e4re, h\u00e4tte, w\u00fcrde + Infinitiv.' },
      ]
    },

    // ===== VOLUME 3: ADVANCED (Units 21-30) =====
    {
      id: 21,
      volume: 3,
      title_target: 'Meinungen',
      title_source: 'Opinions',
      title_de: 'Meinungen',
      title_en: 'Opinions',
      dialogue: [
        { speaker: 'JOURNALIST', de: 'Warum lernen Sie Deutsch?', en: 'Why are you learning German?' },
        { speaker: 'STUDENTIN', de: 'Ich lerne Deutsch, weil ich in Deutschland studieren m\u00f6chte.', en: 'I\'m learning German because I\'d like to study in Germany.' },
        { speaker: 'JOURNALIST', de: 'Obwohl es schwer ist, machen Sie weiter?', en: 'Although it\'s hard, you keep going?' },
        { speaker: 'STUDENTIN', de: 'Ja! Wenn man jeden Tag \u00fcbt, wird es leichter. Als ich angefangen habe, konnte ich nichts.', en: 'Yes! If you practice every day, it gets easier. When I started, I couldn\'t do anything.' },
      ],
      grammar: [
        { title: 'weil (because)', desc: 'Nebensatz: Verb am Ende. "Ich bleibe zu Hause, weil ich krank BIN." Hauptsatz danach: Verb-Subjekt Inversion.' },
        { title: 'obwohl (although)', desc: '"Obwohl es regnet, gehe ich spazieren." Konzessiver Nebensatz. Verb am Ende im obwohl-Satz.' },
        { title: 'wenn vs als', desc: 'WENN: gegenw\u00e4rtig, wiederholt, hypothetisch. ALS: einmalig in der Vergangenheit. "Wenn ich Zeit habe..." vs "Als ich jung war..."' },
      ]
    },
    {
      id: 22,
      volume: 3,
      title_target: 'Nachrichten',
      title_source: 'News',
      title_de: 'Nachrichten',
      title_en: 'News',
      dialogue: [
        { speaker: 'NACHRICHTENSPRECHER', de: 'Das neue Museum wird n\u00e4chste Woche er\u00f6ffnet.', en: 'The new museum will be opened next week.' },
        { speaker: 'REPORTER', de: 'Das Geb\u00e4ude wurde von einem ber\u00fchmten Architekten entworfen.', en: 'The building was designed by a famous architect.' },
        { speaker: 'NACHRICHTENSPRECHER', de: 'Es wird erwartet, dass viele Besucher kommen werden.', en: 'It is expected that many visitors will come.' },
        { speaker: 'REPORTER', de: 'Die Ausstellung kann ab Montag besichtigt werden.', en: 'The exhibition can be viewed from Monday.' },
      ],
      grammar: [
        { title: 'Passiv Pr\u00e4sens', desc: 'werden + Partizip II: "Das Haus wird gebaut." (The house is being built.) Agent: "von + Dativ": "Es wird von ihm gemacht."' },
        { title: 'Passiv Pr\u00e4teritum', desc: 'wurde + Partizip II: "Das Haus wurde 1990 gebaut." (The house was built in 1990.)' },
        { title: 'Passiv mit Modalverben', desc: 'Modalverb + Partizip II + werden: "Das kann gemacht werden." "Das muss repariert werden." werden stays as infinitive.' },
      ]
    },
    {
      id: 23,
      volume: 3,
      title_target: 'Zukunft',
      title_source: 'Future',
      title_de: 'Zukunft',
      title_en: 'Future',
      dialogue: [
        { speaker: 'LEHRER', de: 'Was werden Sie nach dem Studium machen?', en: 'What will you do after your studies?' },
        { speaker: 'SCH\u00dcLER', de: 'Ich werde wahrscheinlich im Ausland arbeiten.', en: 'I will probably work abroad.' },
        { speaker: 'LEHRER', de: 'Das wird sicher eine gute Erfahrung sein.', en: 'That will certainly be a good experience.' },
        { speaker: 'SCH\u00dcLER', de: 'Ja, und danach werde ich vielleicht meine eigene Firma gr\u00fcnden.', en: 'Yes, and after that I might start my own company.' },
      ],
      grammar: [
        { title: 'Futur I', desc: 'werden + Infinitiv: "Ich werde morgen kommen." werden: werde, wirst, wird, werden, werdet, werden. Infinitiv am Ende.' },
        { title: 'Futur f\u00fcr Vermutung', desc: '"Er wird wohl krank sein." = He is probably sick. Futur I + wohl/wahrscheinlich/sicher for probability in present.' },
        { title: 'Pr\u00e4sens f\u00fcr Zukunft', desc: 'German often uses Pr\u00e4sens + time word for future: "Ich komme morgen." = I\'m coming tomorrow. Futur I adds formality or emphasis.' },
      ]
    },
    {
      id: 24,
      volume: 3,
      title_target: 'Vergangenheit',
      title_source: 'The Past',
      title_de: 'Vergangenheit',
      title_en: 'The Past',
      dialogue: [
        { speaker: 'ERZA\u0308HLER', de: 'Es war einmal ein junger Mann, der in einer kleinen Stadt lebte.', en: 'Once upon a time, there was a young man who lived in a small town.' },
        { speaker: 'ERZA\u0308HLER', de: 'Eines Tages ging er in den Wald und fand einen alten Schl\u00fcssel.', en: 'One day he went into the forest and found an old key.' },
        { speaker: 'ERZA\u0308HLER', de: 'Er wusste nicht, wohin der Schl\u00fcssel geh\u00f6rte.', en: 'He didn\'t know where the key belonged.' },
        { speaker: 'ERZA\u0308HLER', de: 'Also nahm er ihn mit und suchte das passende Schloss.', en: 'So he took it with him and searched for the matching lock.' },
      ],
      grammar: [
        { title: 'Pr\u00e4teritum (schriftliche Vergangenheit)', desc: 'Used in writing, news, narratives. Schwache Verben: Stamm + -te: machte, sagte. Starke Verben: Stammvokalwechsel: ging, kam, fand.' },
        { title: 'Starke Verben im Pr\u00e4teritum', desc: 'gehen\u2192ging, kommen\u2192kam, sehen\u2192sah, nehmen\u2192nahm, sprechen\u2192sprach, schreiben\u2192schrieb, lesen\u2192las, finden\u2192fand.' },
        { title: 'Perfekt vs Pr\u00e4teritum', desc: 'Perfekt: spoken German ("Ich habe gegessen"). Pr\u00e4teritum: written/formal ("Ich a\u00df"). Exception: sein/haben/modals use Pr\u00e4teritum even in speech.' },
      ]
    },
    {
      id: 25,
      volume: 3,
      title_target: 'Wiederholung 5',
      title_source: 'Review 5',
      title_de: 'Wiederholung 5',
      title_en: 'Review 5',
      dialogue: [],
      grammar: [
        { title: 'Nebens\u00e4tze Wiederholung', desc: 'weil, obwohl, wenn, als, dass, ob \u2014 Verb am Ende. Konnektoren: deshalb, trotzdem, sonst, dann (Verb-Subjekt Inversion).' },
        { title: 'Alle Zeitformen', desc: 'Pr\u00e4sens, Perfekt, Pr\u00e4teritum, Futur I. Passiv: Pr\u00e4sens (wird gemacht), Pr\u00e4teritum (wurde gemacht). Konjunktiv II.' },
      ]
    },
    {
      id: 26,
      volume: 3,
      title_target: 'Indirekte Rede',
      title_source: 'Indirect Speech',
      title_de: 'Indirekte Rede',
      title_en: 'Indirect Speech',
      dialogue: [
        { speaker: 'REPORTER', de: 'Der Minister sagte, er sei optimistisch.', en: 'The minister said he was optimistic.' },
        { speaker: 'KOLLEGIN', de: 'Er meinte auch, die Wirtschaft wachse wieder.', en: 'He also said the economy was growing again.' },
        { speaker: 'REPORTER', de: 'Er behauptete, man habe alles unter Kontrolle.', en: 'He claimed that they had everything under control.' },
        { speaker: 'KOLLEGIN', de: 'Glaubst du, dass das stimmt?', en: 'Do you think that\'s true?' },
      ],
      grammar: [
        { title: 'Konjunktiv I', desc: 'Used for indirect/reported speech. Formed from infinitive stem + endings: -e, -est, -e, -en, -et, -en. sein: sei, seist, sei, seien, seiet, seien.' },
        { title: 'Konjunktiv I Bildung', desc: 'haben\u2192habe, kommen\u2192komme, wissen\u2192wisse. If Konj. I = Indikativ, use Konj. II instead: "sie sagten, sie h\u00e4tten" (not haben).' },
        { title: 'Indirekte Rede Signalw\u00f6rter', desc: 'Er sagte / meinte / behauptete / erkl\u00e4rte, ... Reports what someone said without committing to truth.' },
      ]
    },
    {
      id: 27,
      volume: 3,
      title_target: 'Kultur und Geschichte',
      title_source: 'Culture and History',
      title_de: 'Kultur und Geschichte',
      title_en: 'Culture and History',
      dialogue: [
        { speaker: 'REISEF\u00dcHRER', de: 'Dies ist das Schloss des K\u00f6nigs Ludwig.', en: 'This is King Ludwig\'s castle.' },
        { speaker: 'TOURIST', de: 'W\u00e4hrend des Krieges wurde es besch\u00e4digt, oder?', en: 'It was damaged during the war, wasn\'t it?' },
        { speaker: 'REISEF\u00dcHRER', de: 'Ja, trotz der Sch\u00e4den konnte es restauriert werden.', en: 'Yes, despite the damage it could be restored.' },
        { speaker: 'TOURIST', de: 'Die Architektur des Geb\u00e4udes ist beeindruckend.', en: 'The architecture of the building is impressive.' },
      ],
      grammar: [
        { title: 'Genitiv', desc: 'Besitz: "das Haus des Mannes / der Frau / des Kindes." Maskulin/Neutrum: des + -(e)s. Feminin/Plural: der. "Annas Haus" (Eigennamen: -s).' },
        { title: 'Genitiv-Pr\u00e4positionen', desc: 'w\u00e4hrend (during), wegen (because of), trotz (despite), statt/anstatt (instead of), innerhalb (within), au\u00dferhalb (outside of).' },
        { title: 'Genitiv im Alltag', desc: 'In spoken German, von + Dativ often replaces Genitiv: "das Haus von meinem Freund." Written/formal German prefers Genitiv.' },
      ]
    },
    {
      id: 28,
      volume: 3,
      title_target: 'Literatur',
      title_source: 'Literature',
      title_de: 'Literatur',
      title_en: 'Literature',
      dialogue: [
        { speaker: 'PROFESSORIN', de: 'Kennen Sie den Autor, der diesen Roman geschrieben hat?', en: 'Do you know the author who wrote this novel?' },
        { speaker: 'STUDENT', de: 'Ja, das ist der Schriftsteller, dessen B\u00fccher sehr bekannt sind.', en: 'Yes, that\'s the writer whose books are very well known.' },
        { speaker: 'PROFESSORIN', de: 'Das Buch, das ich Ihnen empfohlen habe, sollten Sie unbedingt lesen.', en: 'You really should read the book that I recommended to you.' },
        { speaker: 'STUDENT', de: 'Die Geschichte, in der es um Liebe und Verlust geht, hat mich sehr bewegt.', en: 'The story, which is about love and loss, moved me deeply.' },
      ],
      grammar: [
        { title: 'Relativs\u00e4tze', desc: 'Relativpronomen: der/die/das/die (like definite article). Verb goes to END. "Der Mann, der dort steht, ist mein Vater."' },
        { title: 'Relativpronomen nach Kasus', desc: 'Nom: der/die/das. Akk: den/die/das. Dat: dem/der/dem/denen. Gen: dessen/deren/dessen/deren. Case depends on function in relative clause.' },
        { title: 'Relativs\u00e4tze mit Pr\u00e4position', desc: 'Pr\u00e4position + Relativpronomen: "Die Stadt, in der ich wohne." "Der Freund, mit dem ich reise." Preposition determines case.' },
      ]
    },
    {
      id: 29,
      volume: 3,
      title_target: 'Humor und Redewendungen',
      title_source: 'Humor and Idioms',
      title_de: 'Humor und Redewendungen',
      title_en: 'Humor and Idioms',
      dialogue: [
        { speaker: 'OPA', de: 'Ich dr\u00fccke dir die Daumen f\u00fcr deine Pr\u00fcfung!', en: 'I\'ll keep my fingers crossed for your exam!' },
        { speaker: 'ENKELIN', de: 'Danke, Opa! Ich habe Schmetterlinge im Bauch.', en: 'Thanks, Grandpa! I have butterflies in my stomach.' },
        { speaker: 'OPA', de: 'Du schaffst das! Du hast den Nagel auf den Kopf getroffen mit deiner Vorbereitung.', en: 'You\'ll manage! You hit the nail on the head with your preparation.' },
        { speaker: 'ENKELIN', de: 'Na ja, \u00dcbung macht den Meister, oder?', en: 'Well, practice makes perfect, right?' },
      ],
      grammar: [
        { title: 'Redewendungen (Idiome)', desc: 'die Daumen dr\u00fccken (cross fingers), den Nagel auf den Kopf treffen (hit the nail on the head), Schwein haben (be lucky), ins Fettn\u00e4pfchen treten (put one\'s foot in it).' },
        { title: 'Sprichw\u00f6rter', desc: '\u00dcbung macht den Meister (practice makes perfect). Morgenstund hat Gold im Mund (early bird catches the worm). Ende gut, alles gut (all\'s well that ends well).' },
        { title: 'Umgangssprache', desc: 'Na ja (well), Ach so (I see), Mensch! (Man!), Quatsch! (Nonsense!), Genau! (Exactly!), Tja... (Well...), Krass! (Crazy!/Wow!)' },
      ]
    },
    {
      id: 30,
      volume: 3,
      title_target: 'Abschluss',
      title_source: 'Finale',
      title_de: 'Abschluss',
      title_en: 'Finale',
      dialogue: [],
      grammar: [],
      noDrills: true
    },
  ],
};

console.log('German course config loaded');
