// ============================================================================
// RHODES FRENCH V2 - COURSE CONFIGURATION
// ============================================================================
// This file contains ALL language-specific data for the French course.
// The engine reads this config and adapts accordingly.

window.COURSE_CONFIG = {
  // ============================================================================
  // IDENTITY
  // ============================================================================
  lang: 'french',
  langCode: 'fr-FR',
  displayName: 'French',
  courseName: 'The French Course | Allons-y!',
  tagline: 'COMPLETE COURSE',

  // ============================================================================
  // THEME
  // ============================================================================
  theme: {
    accentPrimary: '#002395',
    accentLight: '#e8edf5',
    flagColors: ['#002395', '#ffffff', '#ED2939'],
  },

  // ============================================================================
  // FIELD MAPPINGS
  // ============================================================================
  // Maps generic field names to actual JSON keys in drills
  fields: {
    target: 'french_formal',
    targetFormal: 'french_formal',
    targetInformal: 'french_informal',
    source: 'english',
  },

  // ============================================================================
  // FEATURES
  // ============================================================================
  features: {
    hasRegisterToggle: true,
    hasDirectionToggle: true,
    hasFullscreen: true,
    hasCaseColors: false,
    hasAlphabetUnit: false,
    hasStressPositions: false,
    hasAudioMapping: true,
    hasConfusables: true,
    hasDarkMode: true,
    hasServiceWorker: false,
  },

  // ============================================================================
  // KEYBOARD
  // ============================================================================
  keyboard: {
    type: 'accent',
    chars: ['é','è','ê','ë','à','â','ù','û','ô','î','ï','ç','œ',"'"],
  },

  // ============================================================================
  // STORAGE KEYS
  // ============================================================================
  // Preserve existing French keys to avoid data loss
  storage: {
    progress: 'allonsy_fsi_progress',
    sync: 'fsi_french_sync',
    srs: 'allonsy_fsi_srs',
    analytics: 'allonsy_fsi_analytics',
    linear: 'allonsy_fsi_linear',
    titleStyle: 'fsi_title_style',
  },

  // ============================================================================
  // DATA PATHS
  // ============================================================================
  data: {
    drills: 'data/drills.json',
    audioMapping: 'data/reverse_audio_mapping.json',
    confusables: 'data/confusables.json',
  },

  // ============================================================================
  // AUDIO
  // ============================================================================
  audio: {
    dialogues: 'audio/',
    drills: 'audio/drills/',
    version: '1.1.1',
  },

  // ============================================================================
  // CDN
  // ============================================================================
  cdn: {
    baseUrl: '',
  },

  // ============================================================================
  // TITLE HTML
  // ============================================================================
  titleHtml: `<div style="display:flex;height:30px;margin-right:8px;">
    <span style="width:10px;background:#002395;"></span>
    <span style="width:10px;background:#ffffff;border-top:1px solid #ddd;border-bottom:1px solid #ddd;"></span>
    <span style="width:10px;background:#ED2939;"></span>
  </div>
  <div style="border:2px solid #333;padding:5px 12px;font-size:24px;font-weight:bold;letter-spacing:3px;display:flex;align-items:center;gap:15px;">
    <span style="color:#4169E1;font-size:28px;">Rhodes French</span>
    <span style="font-size:14px;font-weight:normal;opacity:0.7;">COMPLETE COURSE</span>
  </div>`,

  // ============================================================================
  // FORMAL TO INFORMAL CONVERSION
  // ============================================================================
  convertToInformal(text) {
    return text
      .replace(/\bvous\b/gi, 'tu')
      .replace(/\bvotre\b/gi, 'ton')
      .replace(/\bvos\b/gi, 'tes')
      .replace(/\ballez\b/gi, 'vas')
      .replace(/\bavez\b/gi, 'as')
      .replace(/\bêtes\b/gi, 'es')
      .replace(/Comment allez-vous/gi, 'Comment vas-tu');
  },

  // ============================================================================
  // VERBS - FRENCH VERB CONJUGATIONS
  // ============================================================================
  verbs: {
    être: {
      meaning: 'to be',
      present: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'],
      passéComposé: { aux: 'avoir', pp: 'été' },
      imparfait: ['étais', 'étais', 'était', 'étions', 'étiez', 'étaient'],
      futur: ['serai', 'seras', 'sera', 'serons', 'serez', 'seront'],
      conditionnel: ['serais', 'serais', 'serait', 'serions', 'seriez', 'seraient'],
      subjonctif: ['sois', 'sois', 'soit', 'soyons', 'soyez', 'soient'],
      impératif: ['sois', 'soyons', 'soyez'],
      tip: 'Most common verb. Used for identity, nationality, profession, characteristics, time, and with adjectives.'
    },
    avoir: {
      meaning: 'to have',
      present: ['ai', 'as', 'a', 'avons', 'avez', 'ont'],
      passéComposé: { aux: 'avoir', pp: 'eu' },
      imparfait: ['avais', 'avais', 'avait', 'avions', 'aviez', 'avaient'],
      futur: ['aurai', 'auras', 'aura', 'aurons', 'aurez', 'auront'],
      conditionnel: ['aurais', 'aurais', 'aurait', 'aurions', 'auriez', 'auraient'],
      subjonctif: ['aie', 'aies', 'ait', 'ayons', 'ayez', 'aient'],
      impératif: ['aie', 'ayons', 'ayez'],
      expressions: ['avoir faim (hungry)', 'avoir soif (thirsty)', 'avoir chaud/froid (hot/cold)', 'avoir X ans (be X years old)', 'avoir besoin de (need)', 'avoir envie de (want to)', 'avoir peur de (afraid of)', 'avoir raison/tort (be right/wrong)'],
      tip: 'Used as auxiliary for most verbs in passé composé. Also in many expressions where English uses "to be".'
    },
    aller: {
      meaning: 'to go',
      present: ['vais', 'vas', 'va', 'allons', 'allez', 'vont'],
      passéComposé: { aux: 'être', pp: 'allé(e)(s)' },
      imparfait: ['allais', 'allais', 'allait', 'allions', 'alliez', 'allaient'],
      futur: ['irai', 'iras', 'ira', 'irons', 'irez', 'iront'],
      conditionnel: ['irais', 'irais', 'irait', 'irions', 'iriez', 'iraient'],
      subjonctif: ['aille', 'ailles', 'aille', 'allions', 'alliez', 'aillent'],
      impératif: ['va', 'allons', 'allez'],
      tip: 'Uses ÊTRE in passé composé. "Aller + infinitive" = near future.'
    },
    faire: {
      meaning: 'to do/make',
      present: ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'],
      passéComposé: { aux: 'avoir', pp: 'fait' },
      imparfait: ['faisais', 'faisais', 'faisait', 'faisions', 'faisiez', 'faisaient'],
      futur: ['ferai', 'feras', 'fera', 'ferons', 'ferez', 'feront'],
      conditionnel: ['ferais', 'ferais', 'ferait', 'ferions', 'feriez', 'feraient'],
      subjonctif: ['fasse', 'fasses', 'fasse', 'fassions', 'fassiez', 'fassent'],
      impératif: ['fais', 'faisons', 'faites'],
      tip: 'Very versatile. Used for weather, activities, and many expressions.'
    },
    vouloir: {
      meaning: 'to want',
      present: ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'],
      passéComposé: { aux: 'avoir', pp: 'voulu' },
      imparfait: ['voulais', 'voulais', 'voulait', 'voulions', 'vouliez', 'voulaient'],
      futur: ['voudrai', 'voudras', 'voudra', 'voudrons', 'voudrez', 'voudront'],
      conditionnel: ['voudrais', 'voudrais', 'voudrait', 'voudrions', 'voudriez', 'voudraient'],
      subjonctif: ['veuille', 'veuilles', 'veuille', 'voulions', 'vouliez', 'veuillent'],
      tip: '"Je voudrais" is more polite than "je veux".'
    },
    pouvoir: {
      meaning: 'can/to be able',
      present: ['peux', 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent'],
      passéComposé: { aux: 'avoir', pp: 'pu' },
      imparfait: ['pouvais', 'pouvais', 'pouvait', 'pouvions', 'pouviez', 'pouvaient'],
      futur: ['pourrai', 'pourras', 'pourra', 'pourrons', 'pourrez', 'pourront'],
      conditionnel: ['pourrais', 'pourrais', 'pourrait', 'pourrions', 'pourriez', 'pourraient'],
      subjonctif: ['puisse', 'puisses', 'puisse', 'puissions', 'puissiez', 'puissent'],
      tip: 'No imperative form.'
    },
    devoir: {
      meaning: 'must/to have to',
      present: ['dois', 'dois', 'doit', 'devons', 'devez', 'doivent'],
      passéComposé: { aux: 'avoir', pp: 'dû' },
      imparfait: ['devais', 'devais', 'devait', 'devions', 'deviez', 'devaient'],
      futur: ['devrai', 'devras', 'devra', 'devrons', 'devrez', 'devront'],
      conditionnel: ['devrais', 'devrais', 'devrait', 'devrions', 'devriez', 'devraient'],
      subjonctif: ['doive', 'doives', 'doive', 'devions', 'deviez', 'doivent'],
      tip: '"Je devrais" = should.'
    },
    savoir: {
      meaning: 'to know (facts)',
      present: ['sais', 'sais', 'sait', 'savons', 'savez', 'savent'],
      passéComposé: { aux: 'avoir', pp: 'su' },
      imparfait: ['savais', 'savais', 'savait', 'savions', 'saviez', 'savaient'],
      futur: ['saurai', 'sauras', 'saura', 'saurons', 'saurez', 'sauront'],
      conditionnel: ['saurais', 'saurais', 'saurait', 'saurions', 'sauriez', 'sauraient'],
      subjonctif: ['sache', 'saches', 'sache', 'sachions', 'sachiez', 'sachent'],
      impératif: ['sache', 'sachons', 'sachez'],
      tip: 'Know facts or how to do something.'
    },
    connaître: {
      meaning: 'to know (people/places)',
      present: ['connais', 'connais', 'connaît', 'connaissons', 'connaissez', 'connaissent'],
      passéComposé: { aux: 'avoir', pp: 'connu' },
      imparfait: ['connaissais', 'connaissais', 'connaissait', 'connaissions', 'connaissiez', 'connaissaient'],
      futur: ['connaîtrai', 'connaîtras', 'connaîtra', 'connaîtrons', 'connaîtrez', 'connaîtront'],
      conditionnel: ['connaîtrais', 'connaîtrais', 'connaîtrait', 'connaîtrions', 'connaîtriez', 'connaîtraient'],
      subjonctif: ['connaisse', 'connaisses', 'connaisse', 'connaissions', 'connaissiez', 'connaissent'],
      tip: 'Know through familiarity.'
    },
    venir: {
      meaning: 'to come',
      present: ['viens', 'viens', 'vient', 'venons', 'venez', 'viennent'],
      passéComposé: { aux: 'être', pp: 'venu(e)(s)' },
      imparfait: ['venais', 'venais', 'venait', 'venions', 'veniez', 'venaient'],
      futur: ['viendrai', 'viendras', 'viendra', 'viendrons', 'viendrez', 'viendront'],
      conditionnel: ['viendrais', 'viendrais', 'viendrait', 'viendrions', 'viendriez', 'viendraient'],
      subjonctif: ['vienne', 'viennes', 'vienne', 'venions', 'veniez', 'viennent'],
      impératif: ['viens', 'venons', 'venez'],
      tip: 'Uses ÊTRE. "Venir de + inf" = just did something.'
    },
    partir: {
      meaning: 'to leave',
      present: ['pars', 'pars', 'part', 'partons', 'partez', 'partent'],
      passéComposé: { aux: 'être', pp: 'parti(e)(s)' },
      imparfait: ['partais', 'partais', 'partait', 'partions', 'partiez', 'partaient'],
      futur: ['partirai', 'partiras', 'partira', 'partirons', 'partirez', 'partiront'],
      conditionnel: ['partirais', 'partirais', 'partirait', 'partirions', 'partiriez', 'partiraient'],
      subjonctif: ['parte', 'partes', 'parte', 'partions', 'partiez', 'partent'],
      impératif: ['pars', 'partons', 'partez'],
      tip: 'Uses ÊTRE.'
    },
    prendre: {
      meaning: 'to take',
      present: ['prends', 'prends', 'prend', 'prenons', 'prenez', 'prennent'],
      passéComposé: { aux: 'avoir', pp: 'pris' },
      imparfait: ['prenais', 'prenais', 'prenait', 'prenions', 'preniez', 'prenaient'],
      futur: ['prendrai', 'prendras', 'prendra', 'prendrons', 'prendrez', 'prendront'],
      conditionnel: ['prendrais', 'prendrais', 'prendrait', 'prendrions', 'prendriez', 'prendraient'],
      subjonctif: ['prenne', 'prennes', 'prenne', 'prenions', 'preniez', 'prennent'],
      impératif: ['prends', 'prenons', 'prenez'],
      tip: 'Also: apprendre, comprendre, surprendre.'
    },
    mettre: {
      meaning: 'to put',
      present: ['mets', 'mets', 'met', 'mettons', 'mettez', 'mettent'],
      passéComposé: { aux: 'avoir', pp: 'mis' },
      imparfait: ['mettais', 'mettais', 'mettait', 'mettions', 'mettiez', 'mettaient'],
      futur: ['mettrai', 'mettras', 'mettra', 'mettrons', 'mettrez', 'mettront'],
      conditionnel: ['mettrais', 'mettrais', 'mettrait', 'mettrions', 'mettriez', 'mettraient'],
      subjonctif: ['mette', 'mettes', 'mette', 'mettions', 'mettiez', 'mettent'],
      impératif: ['mets', 'mettons', 'mettez'],
      tip: 'Also: permettre, promettre, admettre.'
    },
    voir: {
      meaning: 'to see',
      present: ['vois', 'vois', 'voit', 'voyons', 'voyez', 'voient'],
      passéComposé: { aux: 'avoir', pp: 'vu' },
      imparfait: ['voyais', 'voyais', 'voyait', 'voyions', 'voyiez', 'voyaient'],
      futur: ['verrai', 'verras', 'verra', 'verrons', 'verrez', 'verront'],
      conditionnel: ['verrais', 'verrais', 'verrait', 'verrions', 'verriez', 'verraient'],
      subjonctif: ['voie', 'voies', 'voie', 'voyions', 'voyiez', 'voient'],
      impératif: ['vois', 'voyons', 'voyez'],
      tip: 'Double R in future.'
    },
    dire: {
      meaning: 'to say/tell',
      present: ['dis', 'dis', 'dit', 'disons', 'dites', 'disent'],
      passéComposé: { aux: 'avoir', pp: 'dit' },
      imparfait: ['disais', 'disais', 'disait', 'disions', 'disiez', 'disaient'],
      futur: ['dirai', 'diras', 'dira', 'dirons', 'direz', 'diront'],
      conditionnel: ['dirais', 'dirais', 'dirait', 'dirions', 'diriez', 'diraient'],
      subjonctif: ['dise', 'dises', 'dise', 'disions', 'disiez', 'disent'],
      impératif: ['dis', 'disons', 'dites'],
      tip: 'Note irregular "vous dites".'
    },
    écrire: {
      meaning: 'to write',
      present: ['écris', 'écris', 'écrit', 'écrivons', 'écrivez', 'écrivent'],
      passéComposé: { aux: 'avoir', pp: 'écrit' },
      imparfait: ['écrivais', 'écrivais', 'écrivait', 'écrivions', 'écriviez', 'écrivaient'],
      futur: ['écrirai', 'écriras', 'écrira', 'écrirons', 'écrirez', 'écriront'],
      conditionnel: ['écrirais', 'écrirais', 'écrirait', 'écririons', 'écririez', 'écriraient'],
      subjonctif: ['écrive', 'écrives', 'écrive', 'écrivions', 'écriviez', 'écrivent'],
      impératif: ['écris', 'écrivons', 'écrivez'],
      tip: 'Also: décrire, inscrire.'
    },
    lire: {
      meaning: 'to read',
      present: ['lis', 'lis', 'lit', 'lisons', 'lisez', 'lisent'],
      passéComposé: { aux: 'avoir', pp: 'lu' },
      imparfait: ['lisais', 'lisais', 'lisait', 'lisions', 'lisiez', 'lisaient'],
      futur: ['lirai', 'liras', 'lira', 'lirons', 'lirez', 'liront'],
      conditionnel: ['lirais', 'lirais', 'lirait', 'lirions', 'liriez', 'liraient'],
      subjonctif: ['lise', 'lises', 'lise', 'lisions', 'lisiez', 'lisent'],
      impératif: ['lis', 'lisons', 'lisez'],
      tip: 'Also: élire, relire.'
    },
    boire: {
      meaning: 'to drink',
      present: ['bois', 'bois', 'boit', 'buvons', 'buvez', 'boivent'],
      passéComposé: { aux: 'avoir', pp: 'bu' },
      imparfait: ['buvais', 'buvais', 'buvait', 'buvions', 'buviez', 'buvaient'],
      futur: ['boirai', 'boiras', 'boira', 'boirons', 'boirez', 'boiront'],
      conditionnel: ['boirais', 'boirais', 'boirait', 'boirions', 'boiriez', 'boiraient'],
      subjonctif: ['boive', 'boives', 'boive', 'buvions', 'buviez', 'boivent'],
      impératif: ['bois', 'buvons', 'buvez'],
      tip: 'Note stem change.'
    },
    recevoir: {
      meaning: 'to receive',
      present: ['reçois', 'reçois', 'reçoit', 'recevons', 'recevez', 'reçoivent'],
      passéComposé: { aux: 'avoir', pp: 'reçu' },
      imparfait: ['recevais', 'recevais', 'recevait', 'recevions', 'receviez', 'recevaient'],
      futur: ['recevrai', 'recevras', 'recevra', 'recevrons', 'recevrez', 'recevront'],
      conditionnel: ['recevrais', 'recevrais', 'recevrait', 'recevrions', 'recevriez', 'recevraient'],
      subjonctif: ['reçoive', 'reçoives', 'reçoive', 'recevions', 'receviez', 'reçoivent'],
      impératif: ['reçois', 'recevons', 'recevez'],
      tip: 'Cedilla before a/o/u.'
    },
    vivre: {
      meaning: 'to live',
      present: ['vis', 'vis', 'vit', 'vivons', 'vivez', 'vivent'],
      passéComposé: { aux: 'avoir', pp: 'vécu' },
      imparfait: ['vivais', 'vivais', 'vivait', 'vivions', 'viviez', 'vivaient'],
      futur: ['vivrai', 'vivras', 'vivra', 'vivrons', 'vivrez', 'vivront'],
      conditionnel: ['vivrais', 'vivrais', 'vivrait', 'vivrions', 'vivriez', 'vivraient'],
      subjonctif: ['vive', 'vives', 'vive', 'vivions', 'viviez', 'vivent'],
      impératif: ['vis', 'vivons', 'vivez'],
      tip: 'Live (be alive/reside).'
    },
    ouvrir: {
      meaning: 'to open',
      present: ['ouvre', 'ouvres', 'ouvre', 'ouvrons', 'ouvrez', 'ouvrent'],
      passéComposé: { aux: 'avoir', pp: 'ouvert' },
      imparfait: ['ouvrais', 'ouvrais', 'ouvrait', 'ouvrions', 'ouvriez', 'ouvraient'],
      futur: ['ouvrirai', 'ouvriras', 'ouvrira', 'ouvrirons', 'ouvrirez', 'ouvriront'],
      conditionnel: ['ouvrirais', 'ouvrirais', 'ouvrirait', 'ouvririons', 'ouvririez', 'ouvriraient'],
      subjonctif: ['ouvre', 'ouvres', 'ouvre', 'ouvrions', 'ouvriez', 'ouvrent'],
      impératif: ['ouvre', 'ouvrons', 'ouvrez'],
      tip: '-ir verb but conjugates like -er!'
    },
    tenir: {
      meaning: 'to hold',
      present: ['tiens', 'tiens', 'tient', 'tenons', 'tenez', 'tiennent'],
      passéComposé: { aux: 'avoir', pp: 'tenu' },
      imparfait: ['tenais', 'tenais', 'tenait', 'tenions', 'teniez', 'tenaient'],
      futur: ['tiendrai', 'tiendras', 'tiendra', 'tiendrons', 'tiendrez', 'tiendront'],
      conditionnel: ['tiendrais', 'tiendrais', 'tiendrait', 'tiendrions', 'tiendriez', 'tiendraient'],
      subjonctif: ['tienne', 'tiennes', 'tienne', 'tenions', 'teniez', 'tiennent'],
      impératif: ['tiens', 'tenons', 'tenez'],
      tip: 'Same pattern as venir.'
    },
    dormir: {
      meaning: 'to sleep',
      present: ['dors', 'dors', 'dort', 'dormons', 'dormez', 'dorment'],
      passéComposé: { aux: 'avoir', pp: 'dormi' },
      imparfait: ['dormais', 'dormais', 'dormait', 'dormions', 'dormiez', 'dormaient'],
      futur: ['dormirai', 'dormiras', 'dormira', 'dormirons', 'dormirez', 'dormiront'],
      conditionnel: ['dormirais', 'dormirais', 'dormirait', 'dormirions', 'dormiriez', 'dormiraient'],
      subjonctif: ['dorme', 'dormes', 'dorme', 'dormions', 'dormiez', 'dorment'],
      impératif: ['dors', 'dormons', 'dormez'],
      tip: 'Loses "m" in singular.'
    },
    courir: {
      meaning: 'to run',
      present: ['cours', 'cours', 'court', 'courons', 'courez', 'courent'],
      passéComposé: { aux: 'avoir', pp: 'couru' },
      imparfait: ['courais', 'courais', 'courait', 'courions', 'couriez', 'couraient'],
      futur: ['courrai', 'courras', 'courra', 'courrons', 'courrez', 'courront'],
      conditionnel: ['courrais', 'courrais', 'courrait', 'courrions', 'courriez', 'courraient'],
      subjonctif: ['coure', 'coures', 'coure', 'courions', 'couriez', 'courent'],
      impératif: ['cours', 'courons', 'courez'],
      tip: 'Double R in future.'
    },
    conduire: {
      meaning: 'to drive',
      present: ['conduis', 'conduis', 'conduit', 'conduisons', 'conduisez', 'conduisent'],
      passéComposé: { aux: 'avoir', pp: 'conduit' },
      imparfait: ['conduisais', 'conduisais', 'conduisait', 'conduisions', 'conduisiez', 'conduisaient'],
      futur: ['conduirai', 'conduiras', 'conduira', 'conduirons', 'conduirez', 'conduiront'],
      conditionnel: ['conduirais', 'conduirais', 'conduirait', 'conduirions', 'conduiriez', 'conduiraient'],
      subjonctif: ['conduise', 'conduises', 'conduise', 'conduisions', 'conduisiez', 'conduisent'],
      impératif: ['conduis', 'conduisons', 'conduisez'],
      tip: 'Also: produire, traduire.'
    },
    pleuvoir: {
      meaning: 'to rain',
      present: [null, null, 'pleut', null, null, null],
      passéComposé: { aux: 'avoir', pp: 'plu' },
      imparfait: [null, null, 'pleuvait', null, null, null],
      futur: [null, null, 'pleuvra', null, null, null],
      conditionnel: [null, null, 'pleuvrait', null, null, null],
      subjonctif: [null, null, 'pleuve', null, null, null],
      tip: 'Impersonal - only "il" form.'
    },
    falloir: {
      meaning: 'must/necessary',
      present: [null, null, 'faut', null, null, null],
      passéComposé: { aux: 'avoir', pp: 'fallu' },
      imparfait: [null, null, 'fallait', null, null, null],
      futur: [null, null, 'faudra', null, null, null],
      conditionnel: [null, null, 'faudrait', null, null, null],
      subjonctif: [null, null, 'faille', null, null, null],
      tip: 'Impersonal - only "il" form.'
    },
  },

  // ============================================================================
  // CONFUSABLE WORDS
  // ============================================================================
  confusables: {
    fils: { confusesWith: 'fille', hint: 'GENDER: fils = son (male), fille = daughter (female)' },
    fille: { confusesWith: 'fils', hint: 'GENDER: fille = daughter (female), fils = son (male)' },
    frère: { confusesWith: 'sœur', hint: 'GENDER: frère = brother, sœur = sister' },
    sœur: { confusesWith: 'frère', hint: 'GENDER: sœur = sister, frère = brother' },
    oncle: { confusesWith: 'tante', hint: 'GENDER: oncle = uncle, tante = aunt' },
    tante: { confusesWith: 'oncle', hint: 'GENDER: tante = aunt, oncle = uncle' },
    père: { confusesWith: 'mère', hint: 'GENDER: père = father, mère = mother' },
    mère: { confusesWith: 'père', hint: 'GENDER: mère = mother, père = father' },
    homme: { confusesWith: 'femme', hint: 'GENDER: homme = man, femme = woman' },
    femme: { confusesWith: 'homme', hint: 'GENDER: femme = woman, homme = man' },
    garçon: { confusesWith: 'fille', hint: 'GENDER: garçon = boy, fille = girl' },
    monsieur: { confusesWith: 'madame', hint: 'GENDER: monsieur = sir/Mr., madame = ma\'am/Mrs.' },
    madame: { confusesWith: 'monsieur', hint: 'GENDER: madame = ma\'am/Mrs., monsieur = sir/Mr.' },
    il: { confusesWith: 'elle', hint: 'PRONOUN: il = he/it (masc), elle = she/it (fem)' },
    elle: { confusesWith: 'il', hint: 'PRONOUN: elle = she/it (fem), il = he/it (masc)' },
    un: { confusesWith: 'une', hint: 'ARTICLE: un = a (masc), une = a (fem)' },
    une: { confusesWith: 'un', hint: 'ARTICLE: une = a (fem), un = a (masc)' },
    le: { confusesWith: 'la', hint: 'ARTICLE: le = the (masc), la = the (fem)' },
    la: { confusesWith: 'le', hint: 'ARTICLE: la = the (fem), le = the (masc)' },
    mon: { confusesWith: 'ma', hint: 'POSSESSIVE: mon = my (masc), ma = my (fem)' },
    ma: { confusesWith: 'mon', hint: 'POSSESSIVE: ma = my (fem), mon = my (masc)' },
    ton: { confusesWith: 'ta', hint: 'POSSESSIVE: ton = your (masc), ta = your (fem)' },
    ta: { confusesWith: 'ton', hint: 'POSSESSIVE: ta = your (fem), ton = your (masc)' },
    son: { confusesWith: 'sa', hint: 'POSSESSIVE: son = his/her (masc), sa = his/her (fem)' },
    sa: { confusesWith: 'son', hint: 'POSSESSIVE: sa = his/her (fem), son = his/her (masc)' },
    bon: { confusesWith: 'bien', hint: 'bon = good (adj), bien = well (adv)' },
    bien: { confusesWith: 'bon', hint: 'bien = well (adv), bon = good (adj)' },
    sur: { confusesWith: 'sous', hint: 'sur = on, sous = under (opposites)' },
    sous: { confusesWith: 'sur', hint: 'sous = under, sur = on (opposites)' },
    avant: { confusesWith: 'après', hint: 'avant = before, après = after' },
    après: { confusesWith: 'avant', hint: 'après = after, avant = before' },
    ici: { confusesWith: 'là', hint: 'ici = here, là = there' },
    là: { confusesWith: 'ici', hint: 'là = there, ici = here' },
    oui: { confusesWith: 'non', hint: 'oui = yes, non = no' },
    non: { confusesWith: 'oui', hint: 'non = no, oui = yes' },
  },

  // ============================================================================
  // GRAMMAR PATTERN DETECTION
  // ============================================================================
  detectGrammarPatterns(french, english) {
    const hints = [];
    const frLower = french.toLowerCase();
    const frWords = frLower.split(/\s+/);
    const hasWord = (words) => words.some(w => frWords.includes(w));

    // Verb detection
    const verbs = window.COURSE_CONFIG?.verbs || {};
    for (const [verb, data] of Object.entries(verbs)) {
      const allForms = [];
      if (data.present) allForms.push(...data.present);
      if (data.imparfait) allForms.push(...data.imparfait);
      if (data.futur) allForms.push(...data.futur);
      if (data.conditionnel) allForms.push(...data.conditionnel);
      if (data.passéComposé) allForms.push(data.passéComposé.pp);

      // Filter out nulls (for impersonal verbs)
      const validForms = allForms.filter(f => f !== null);

      if (hasWord(validForms)) {
        let hint = verb.toUpperCase() + ' (' + data.meaning + ')';
        if (data.tip) hint += ': ' + data.tip;
        hints.push(hint);
        break;
      }
    }

    // Negation
    if (frLower.includes('ne ') || frLower.includes("n'")) {
      let neg = 'ne...pas';
      if (frLower.includes(' plus')) neg = 'ne...plus (no longer)';
      else if (frLower.includes(' jamais')) neg = 'ne...jamais (never)';
      else if (frLower.includes(' rien')) neg = 'ne...rien (nothing)';
      else if (frLower.includes(' personne')) neg = 'ne...personne (no one)';
      hints.push('NEGATION: ' + neg);
    }

    return hints.length > 0 ? hints.slice(0, 2).join(' | ') : 'Basic vocabulary';
  },

  // ============================================================================
  // UNITS DATA - ALL 24 FRENCH UNITS
  // ============================================================================
  units: [
    {
      id: 1,
      volume: 1,
      title_target: 'Dans la rue',
      title_source: 'In the Street',
      title_fr: 'Dans la rue',
      title_en: 'In the Street',
      dialogue: [
        { speaker: 'M. Durand', fr: 'Bonjour, Monsieur.', en: 'Hello, Sir.' },
        { speaker: 'M. Lelong', fr: 'Bonjour, Monsieur Durand. Comment allez-vous?', en: 'Hello, Mr. Durand. How are you?' },
        { speaker: 'M. Durand', fr: 'Très bien, merci. Et vous?', en: 'Very well, thank you. And you?' },
        { speaker: 'M. Lelong', fr: 'Pas mal, merci.', en: 'Not bad, thank you.' },
        { speaker: 'M. Durand', fr: 'Et votre frère, comment va-t-il?', en: 'And your brother, how is he?' },
        { speaker: 'M. Lelong', fr: 'Il va très bien. Il est en vacances.', en: 'He is doing very well. He is on vacation.' },
        { speaker: 'M. Durand', fr: 'Où est-il?', en: 'Where is he?' },
        { speaker: 'M. Lelong', fr: 'Il est à Lyon avec ma soeur.', en: 'He is in Lyon with my sister.' }
      ],
      grammar: [
        { title: 'Greetings & Politeness', desc: 'Bonjour (hello), Bonsoir (good evening). "Comment allez-vous?" is formal.' },
        { title: 'Être (to be)', desc: 'Je suis, tu es, il/elle est, nous sommes, vous êtes, ils/elles sont.' },
        { title: 'Possessive Adjectives', desc: 'mon/ton/son (masc), ma/ta/sa (fem), mes/tes/ses (plural).' },
        { title: 'Location with "à"', desc: '"À" means at/in for cities. Contracts: à + le = au, à + les = aux.' }
      ]
    },
    {
      id: 2,
      volume: 1,
      title_target: 'Dans un petit hôtel',
      title_source: 'In a Small Hotel',
      title_fr: 'Dans un petit hôtel',
      title_en: 'In a Small Hotel',
      dialogue: [
        { speaker: 'Client', fr: 'Bonjour, Madame. Avez-vous une chambre?', en: 'Hello, Madam. Do you have a room?' },
        { speaker: 'Réceptionniste', fr: 'Oui, Monsieur. Pour combien de personnes?', en: 'Yes, Sir. For how many people?' },
        { speaker: 'Client', fr: 'Pour une personne.', en: 'For one person.' },
        { speaker: 'Réceptionniste', fr: 'Pour combien de jours?', en: 'For how many days?' },
        { speaker: 'Client', fr: 'Pour trois jours.', en: 'For three days.' },
        { speaker: 'Réceptionniste', fr: 'Voulez-vous une salle de bains?', en: 'Do you want a bathroom?' },
        { speaker: 'Client', fr: 'Oui, s\'il vous plaît.', en: 'Yes, please.' }
      ],
      grammar: [
        { title: 'Avoir (to have)', desc: 'J\'ai, tu as, il/elle a, nous avons, vous avez, ils/elles ont.' },
        { title: 'Questions with Inversion', desc: 'Avez-vous...? Voulez-vous...? Add -t- between vowels.' },
        { title: 'Numbers 1-10', desc: 'un, deux, trois, quatre, cinq, six, sept, huit, neuf, dix.' }
      ]
    },
    {
      id: 3,
      volume: 1,
      title_target: 'À la gare',
      title_source: 'At the Train Station',
      title_fr: 'À la gare',
      title_en: 'At the Train Station',
      dialogue: [
        { speaker: 'Voyageur', fr: 'Un aller-retour pour Lyon, s\'il vous plaît.', en: 'A round-trip ticket to Lyon, please.' },
        { speaker: 'Guichetier', fr: 'En première ou en deuxième classe?', en: 'First or second class?' },
        { speaker: 'Voyageur', fr: 'En deuxième classe.', en: 'Second class.' },
        { speaker: 'Guichetier', fr: 'Ça fait cinquante euros.', en: 'That will be fifty euros.' }
      ],
      grammar: [
        { title: 'Telling Time', desc: 'Quelle heure est-il? Il est dix heures. Il est midi/minuit.' },
        { title: 'Numbers 11-100', desc: 'onze, douze, treize, quatorze, quinze, seize, vingt, trente, quarante, cinquante...' }
      ]
    },
    {
      id: 4,
      volume: 1,
      title_target: 'Faisons des courses',
      title_source: "Let's Go Shopping",
      title_fr: 'Faisons des courses',
      title_en: "Let's Go Shopping",
      dialogue: [
        { speaker: 'Client', fr: 'Je voudrais acheter des fruits.', en: 'I\'d like to buy some fruit.' },
        { speaker: 'Vendeur', fr: 'Nous avons des pommes, des poires et des oranges.', en: 'We have apples, pears, and oranges.' },
        { speaker: 'Client', fr: 'Je vais prendre deux kilos de pommes.', en: 'I\'ll take two kilos of apples.' }
      ],
      grammar: [
        { title: 'Partitive Articles', desc: 'du (masc), de la (fem), des (plural) = some. After negative: de/d\' only.' },
        { title: 'Aller + Infinitive', desc: 'Je vais prendre = I\'m going to take (near future).' }
      ]
    },
    {
      id: 5,
      volume: 1,
      title_target: 'Le climat',
      title_source: 'The Climate',
      title_fr: 'Le climat',
      title_en: 'The Climate',
      dialogue: [
        { speaker: 'A', fr: 'Quel temps fait-il?', en: 'What\'s the weather like?' },
        { speaker: 'B', fr: 'Il fait beau et chaud.', en: 'It\'s nice and warm.' },
        { speaker: 'A', fr: 'Est-ce qu\'il pleut souvent ici?', en: 'Does it rain often here?' },
        { speaker: 'B', fr: 'Oui, en hiver il pleut beaucoup.', en: 'Yes, in winter it rains a lot.' }
      ],
      grammar: [
        { title: 'Weather Expressions', desc: 'Il fait beau/chaud/froid/du vent. Il pleut. Il neige.' },
        { title: 'Seasons', desc: 'le printemps, l\'été, l\'automne, l\'hiver.' }
      ]
    },
    {
      id: 6,
      volume: 1,
      title_target: 'Révision',
      title_source: 'Review',
      title_fr: 'Révision',
      title_en: 'Review',
      dialogue: [
        { speaker: 'Professeur', fr: 'Révisons les leçons précédentes.', en: 'Let\'s review the previous lessons.' }
      ],
      grammar: [
        { title: 'Articles Review', desc: 'Definite: le/la/l\'/les. Indefinite: un/une/des. Partitive: du/de la/des.' },
        { title: 'Common Verbs', desc: 'être, avoir, aller, faire, vouloir, pouvoir.' }
      ]
    },
    {
      id: 7,
      volume: 1,
      title_target: 'Prenons rendez-vous',
      title_source: "Let's Make an Appointment",
      title_fr: 'Prenons rendez-vous',
      title_en: "Let's Make an Appointment",
      dialogue: [
        { speaker: 'Client', fr: 'Je voudrais prendre rendez-vous.', en: 'I\'d like to make an appointment.' },
        { speaker: 'Secrétaire', fr: 'Quel jour préférez-vous?', en: 'What day do you prefer?' },
        { speaker: 'Client', fr: 'Jeudi prochain, si possible.', en: 'Next Thursday, if possible.' }
      ],
      grammar: [
        { title: 'Vouloir & Pouvoir', desc: 'Je veux/peux, tu veux/peux, il veut/peut, nous voulons/pouvons...' },
        { title: 'Days of the Week', desc: 'lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche.' }
      ]
    },
    {
      id: 8,
      volume: 1,
      title_target: 'Chez le coiffeur',
      title_source: 'At the Hairdresser',
      title_fr: 'Chez le coiffeur',
      title_en: 'At the Hairdresser',
      dialogue: [
        { speaker: 'Client', fr: 'Je voudrais une coupe.', en: 'I\'d like a haircut.' },
        { speaker: 'Coiffeur', fr: 'Comment voulez-vous que je vous les coupe?', en: 'How would you like me to cut it?' },
        { speaker: 'Client', fr: 'Pas trop court, s\'il vous plaît.', en: 'Not too short, please.' }
      ],
      grammar: [
        { title: 'Direct Object Pronouns', desc: 'le, la, les, me, te, nous, vous. Placement: before conjugated verb.' },
        { title: 'Que + Subjunctive', desc: 'Comment voulez-vous que je... (subjunctive required).' }
      ]
    },
    {
      id: 9,
      volume: 1,
      title_target: 'Au restaurant',
      title_source: 'At the Restaurant',
      title_fr: 'Au restaurant',
      title_en: 'At the Restaurant',
      dialogue: [
        { speaker: 'Serveur', fr: 'Bonsoir. Une table pour deux?', en: 'Good evening. A table for two?' },
        { speaker: 'Client', fr: 'Oui, s\'il vous plaît.', en: 'Yes, please.' },
        { speaker: 'Serveur', fr: 'Que désirez-vous boire?', en: 'What would you like to drink?' },
        { speaker: 'Client', fr: 'Une bouteille d\'eau minérale, s\'il vous plaît.', en: 'A bottle of mineral water, please.' }
      ],
      grammar: [
        { title: 'Ordering Food', desc: 'Je prends... Je voudrais... Pour moi... L\'addition, s\'il vous plaît.' },
        { title: 'Meals', desc: 'le petit déjeuner, le déjeuner, le dîner.' }
      ]
    },
    {
      id: 10,
      volume: 1,
      title_target: 'Au bureau',
      title_source: 'At the Office',
      title_fr: 'Au bureau',
      title_en: 'At the Office',
      dialogue: [
        { speaker: 'Collègue', fr: 'Avez-vous reçu mon email?', en: 'Did you get my email?' },
        { speaker: 'Vous', fr: 'Oui, je l\'ai reçu ce matin.', en: 'Yes, I received it this morning.' },
        { speaker: 'Collègue', fr: 'Avez-vous terminé le rapport?', en: 'Have you finished the report?' },
        { speaker: 'Vous', fr: 'Non, pas encore. Je vais le finir cet après-midi.', en: 'No, not yet. I\'ll finish it this afternoon.' }
      ],
      grammar: [
        { title: 'Passé Composé', desc: 'avoir/être + past participle. Most verbs use avoir.' },
        { title: 'ÊTRE Verbs', desc: 'DR & MRS VANDERTRAMP: descendre, revenir, monter, rester, sortir, venir, aller, naître, devenir, entrer, rentrer, tomber, retourner, arriver, mourir, partir.' }
      ]
    },
    {
      id: 11,
      volume: 1,
      title_target: 'Maison à louer',
      title_source: 'House for Rent',
      title_fr: 'Maison à louer',
      title_en: 'House for Rent',
      dialogue: [
        { speaker: 'Locataire', fr: 'Je cherche un appartement.', en: 'I\'m looking for an apartment.' },
        { speaker: 'Agent', fr: 'Combien de pièces voulez-vous?', en: 'How many rooms do you want?' },
        { speaker: 'Locataire', fr: 'Il me faut trois chambres.', en: 'I need three bedrooms.' }
      ],
      grammar: [
        { title: 'Il faut', desc: 'Il faut + infinitive = One must... / Il me faut = I need.' },
        { title: 'Chercher vs Regarder', desc: 'Chercher = look for. Regarder = look at/watch.' }
      ]
    },
    {
      id: 12,
      volume: 1,
      title_target: 'Vocabulaire',
      title_source: 'Vocabulary Reference',
      title_fr: 'Vocabulaire',
      title_en: 'Vocabulary Reference',
      dialogue: [
        { speaker: 'Professeur', fr: 'Enrichissons notre vocabulaire.', en: 'Let\'s enrich our vocabulary.' }
      ],
      grammar: [
        { title: 'Formal vs Informal', desc: 'Vous = formal/plural. Tu = informal/singular. Use vous with strangers, superiors.' },
        { title: 'Liaison', desc: 'Link consonant sound to following vowel: les_enfants, vous_avez, ils_ont.' }
      ]
    },
    {
      id: 13,
      volume: 2,
      title_target: 'Au bureau de placement',
      title_source: 'At the Employment Office',
      title_fr: 'Au bureau de placement',
      title_en: 'At the Employment Office',
      dialogue: [
        { speaker: 'Client', fr: 'Je voudrais une bonne.', en: 'I\'d like a maid.' },
        { speaker: 'Employé', fr: 'Une personne qui sait cuisiner?', en: 'A person who knows how to cook?' },
        { speaker: 'Client', fr: 'Oui, et qui parle anglais.', en: 'Yes, and who speaks English.' }
      ],
      grammar: [
        { title: 'Relative Pronouns', desc: 'qui = subject (who, which). que = object (whom, which, that).' },
        { title: 'Savoir vs Connaître', desc: 'Savoir = know facts/how to. Connaître = know people/places.' }
      ]
    },
    {
      id: 14,
      volume: 2,
      title_target: 'La douane',
      title_source: 'Customs',
      title_fr: 'La douane',
      title_en: 'Customs',
      dialogue: [
        { speaker: 'A', fr: 'Nous approchons de la Belgique.', en: 'We\'re getting near Belgium.' },
        { speaker: 'B', fr: 'Avez-vous votre passeport?', en: 'Do you have your passport?' },
        { speaker: 'A', fr: 'Oui, le voici.', en: 'Yes, here it is.' }
      ],
      grammar: [
        { title: 'Passé Composé vs Imparfait', desc: 'PC: completed actions. Imparfait: ongoing/habitual past, descriptions.' },
        { title: 'Approcher de', desc: 'Approcher de + place = to approach. S\'approcher de = come closer to.' }
      ]
    },
    {
      id: 15,
      volume: 2,
      title_target: "L'école",
      title_source: 'School',
      title_fr: "L'école",
      title_en: 'School',
      dialogue: [
        { speaker: 'A', fr: 'Où mettrez-vous vos enfants?', en: 'Where will you send your children?' },
        { speaker: 'B', fr: 'Je les mettrai dans une école privée.', en: 'I\'ll put them in a private school.' }
      ],
      grammar: [
        { title: 'Future Tense', desc: 'Regular: infinitive + ai, as, a, ons, ez, ont. Irregular: ser-, aur-, fer-, ir-, etc.' },
        { title: 'Mettre', desc: 'to put. Mettre qqn dans = put someone in (school, position).' }
      ]
    },
    {
      id: 16,
      volume: 2,
      title_target: 'Parlons du spectacle',
      title_source: "Let's Talk About the Show",
      title_fr: 'Parlons du spectacle',
      title_en: "Let's Talk About the Show",
      dialogue: [
        { speaker: 'Client', fr: 'Joue-t-on Faust mardi?', en: 'Are they doing Faust Tuesday?' },
        { speaker: 'Employé', fr: 'Non, on ne le joue plus.', en: 'No, they\'re not doing it anymore.' }
      ],
      grammar: [
        { title: 'Negative Expressions', desc: 'ne...plus (no longer), ne...jamais (never), ne...rien (nothing), ne...que (only).' },
        { title: 'On', desc: 'Impersonal "one", informal "we", or passive voice.' }
      ]
    },
    {
      id: 17,
      volume: 2,
      title_target: "À l'aéroport",
      title_source: 'At the Airport',
      title_fr: "À l'aéroport",
      title_en: 'At the Airport',
      dialogue: [
        { speaker: 'A', fr: 'Avez-vous confirmé votre départ?', en: 'Have you confirmed your departure?' },
        { speaker: 'B', fr: 'Oui, je l\'ai confirmé hier.', en: 'Yes, I confirmed it yesterday.' }
      ],
      grammar: [
        { title: 'Infinitive After Prepositions', desc: 'avant de + inf (before), après + past inf (after), pour + inf (to), sans + inf (without).' },
        { title: 'Past Infinitive', desc: 'après avoir/être + past participle.' }
      ]
    },
    {
      id: 18,
      volume: 2,
      title_target: 'Révision',
      title_source: 'Review',
      title_fr: 'Révision',
      title_en: 'Review',
      dialogue: [
        { speaker: 'FSI', fr: '(Unité de révision)', en: '(Review unit)' }
      ],
      grammar: [
        { title: 'Tenses Review', desc: 'Present, Passé Composé, Imparfait, Future, Conditional, Subjunctive.' },
        { title: 'Pronouns Review', desc: 'Subject, direct/indirect object, reflexive, relative, demonstrative.' }
      ]
    },
    {
      id: 19,
      volume: 2,
      title_target: 'Chez le médecin',
      title_source: 'At the Doctor',
      title_fr: 'Chez le médecin',
      title_en: 'At the Doctor',
      dialogue: [
        { speaker: 'Patient', fr: 'J\'ai mal à la tête.', en: 'I have a headache.' },
        { speaker: 'Médecin', fr: 'Depuis quand?', en: 'Since when?' },
        { speaker: 'Patient', fr: 'Depuis hier soir.', en: 'Since yesterday evening.' }
      ],
      grammar: [
        { title: 'Avoir mal à', desc: 'J\'ai mal à la tête/gorge/dos/aux dents. Use à + definite article.' },
        { title: 'Depuis', desc: 'Depuis + time = since/for (with present tense for ongoing action).' }
      ]
    },
    {
      id: 20,
      volume: 2,
      title_target: 'À la banque',
      title_source: 'At the Bank',
      title_fr: 'À la banque',
      title_en: 'At the Bank',
      dialogue: [
        { speaker: 'Client', fr: 'Je voudrais ouvrir un compte.', en: 'I\'d like to open an account.' },
        { speaker: 'Employé', fr: 'Quel type de compte?', en: 'What type of account?' },
        { speaker: 'Client', fr: 'Un compte chèques.', en: 'A checking account.' }
      ],
      grammar: [
        { title: 'Banking Vocabulary', desc: 'un compte (account), un virement (transfer), retirer (withdraw), déposer (deposit), un chèque (check).' },
        { title: 'Ouvrir/Fermer', desc: 'ouvrir (open), fermer (close). Regular -ir verbs but conjugate like -er!' }
      ]
    },
    {
      id: 21,
      volume: 2,
      title_target: 'Les transports',
      title_source: 'Transportation',
      title_fr: 'Les transports',
      title_en: 'Transportation',
      dialogue: [
        { speaker: 'Voyageur', fr: 'Quelle ligne de métro?', en: 'Which metro line?' },
        { speaker: 'Passant', fr: 'Prenez la ligne quatre.', en: 'Take line four.' },
        { speaker: 'Voyageur', fr: 'Où dois-je descendre?', en: 'Where should I get off?' }
      ],
      grammar: [
        { title: 'Getting Around', desc: 'Prendre le métro/bus/train. Changer à... (transfer at). Descendre à... (get off at).' },
        { title: 'Imperative', desc: 'Prenez, Allez, Tournez. Drop subject pronoun. For tu: drop -s on -er verbs (va, tourne).' }
      ]
    },
    {
      id: 22,
      volume: 2,
      title_target: 'La politique',
      title_source: 'Politics',
      title_fr: 'La politique',
      title_en: 'Politics',
      dialogue: [
        { speaker: 'A', fr: 'Avez-vous suivi les élections?', en: 'Have you followed the elections?' },
        { speaker: 'B', fr: 'Oui, j\'espère que notre candidat va gagner.', en: 'Yes, I hope our candidate will win.' }
      ],
      grammar: [
        { title: 'Espérer vs Souhaiter', desc: 'Espérer + indicative (j\'espère qu\'il vient). Souhaiter + subjunctive (je souhaite qu\'il vienne).' },
        { title: 'Suivre', desc: 'to follow. Irregular: suis, suis, suit, suivons, suivez, suivent.' }
      ]
    },
    {
      id: 23,
      volume: 2,
      title_target: "L'économie",
      title_source: 'The Economy',
      title_fr: "L'économie",
      title_en: 'The Economy',
      dialogue: [
        { speaker: 'A', fr: 'Comment se porte l\'économie?', en: 'How is the economy doing?' },
        { speaker: 'B', fr: 'Elle se porte bien, malgré l\'inflation.', en: 'It\'s doing well, despite inflation.' }
      ],
      grammar: [
        { title: 'Economic Vocabulary', desc: 'la croissance (growth), l\'inflation, le chômage (unemployment), le PIB (GDP), une crise (crisis).' },
        { title: 'Malgré', desc: 'Despite/in spite of. Always followed by noun, never verb.' }
      ]
    },
    {
      id: 24,
      volume: 2,
      title_target: 'Discours final',
      title_source: 'Final Discourse',
      title_fr: 'Discours final',
      title_en: 'Final Discourse',
      dialogue: [
        { speaker: 'Professeur', fr: 'Félicitations! Vous avez terminé le cours.', en: 'Congratulations! You have finished the course.' },
        { speaker: 'Professeur', fr: 'Vous parlez maintenant très bien français.', en: 'You now speak French very well.' }
      ],
      grammar: [],
      noDrills: true
    },
  ],
};

console.log('✅ French course config loaded');
