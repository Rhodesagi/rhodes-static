// ============================================================================
// RHODES ITALIAN V2 - COURSE CONFIGURATION
// ============================================================================
// This file contains ALL language-specific data for the Italian course.
// The engine reads this config and adapts accordingly.

window.COURSE_CONFIG = {
  // ============================================================================
  // IDENTITY
  // ============================================================================
  lang: 'italian',
  langCode: 'it-IT',
  displayName: 'Italian',
  courseName: 'Rhodes Italian | Andiamo!',
  tagline: 'COMPLETE COURSE',

  // ============================================================================
  // THEME
  // ============================================================================
  theme: {
    accentPrimary: '#009246',
    accentLight: '#e8f5ee',
    flagColors: ['#009246', '#ffffff', '#CE2B37'],
  },

  // ============================================================================
  // FIELD MAPPINGS
  // ============================================================================
  // Maps generic field names to actual JSON keys in drills
  fields: {
    target: 'italian_formal',
    targetFormal: 'italian_formal',
    targetInformal: 'italian_informal',
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
    chars: ['\u00e0','\u00e8','\u00e9','\u00ec','\u00f2','\u00f9',"'"],
  },

  // ============================================================================
  // STORAGE KEYS
  // ============================================================================
  storage: {
    progress: 'rhodes_italian_progress',
    sync: 'rhodes_italian_sync',
    srs: 'rhodes_italian_srs',
    analytics: 'rhodes_italian_analytics',
    linear: 'rhodes_italian_linear',
  },

  // ============================================================================
  // DATA PATHS
  // ============================================================================
  data: {
    drills: 'data/drills.json',
    audioMapping: 'data/audio_manifest.json',
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
  // TITLE HTML
  // ============================================================================
  titleHtml: `<div style="display:flex;height:30px;margin-bottom:8px;">
  <span style="width:10px;background:#009246;"></span>
  <span style="width:10px;background:#ffffff;border-top:1px solid #ddd;border-bottom:1px solid #ddd;"></span>
  <span style="width:10px;background:#CE2B37;"></span>
</div>
<div style="border:2px solid #333;padding:5px 12px;font-size:24px;font-weight:bold;letter-spacing:3px;display:flex;align-items:center;gap:15px;">
  <span>RHODES ITALIAN</span>
  <span style="font-size:14px;font-weight:normal;opacity:0.7;">Andiamo!</span>
</div>`,

  // ============================================================================
  // FORMAL TO INFORMAL CONVERSION
  // ============================================================================
  convertToInformal: null, // drills already have both registers

  // ============================================================================
  // TOTAL UNITS
  // ============================================================================
  totalUnits: 30,

  // ============================================================================
  // VERBS - ITALIAN VERB CONJUGATIONS
  // ============================================================================
  verbs: {
    essere: {
      meaning: 'to be',
      presente: ['sono', 'sei', '\u00e8', 'siamo', 'siete', 'sono'],
      passatoProssimo: { aux: 'essere', pp: 'stato/a' },
      imperfetto: ['ero', 'eri', 'era', 'eravamo', 'eravate', 'erano'],
      futuro: ['sar\u00f2', 'sarai', 'sar\u00e0', 'saremo', 'sarete', 'saranno'],
      condizionale: ['sarei', 'saresti', 'sarebbe', 'saremmo', 'sareste', 'sarebbero'],
      congiuntivo: ['sia', 'sia', 'sia', 'siamo', 'siate', 'siano'],
      imperativo: ['sii', 'sia', 'siamo', 'siate', 'siano'],
      tip: 'Most common verb. Used for identity, nationality, profession, characteristics, and with adjectives.'
    },
    avere: {
      meaning: 'to have',
      presente: ['ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno'],
      passatoProssimo: { aux: 'avere', pp: 'avuto' },
      imperfetto: ['avevo', 'avevi', 'aveva', 'avevamo', 'avevate', 'avevano'],
      futuro: ['avr\u00f2', 'avrai', 'avr\u00e0', 'avremo', 'avrete', 'avranno'],
      condizionale: ['avrei', 'avresti', 'avrebbe', 'avremmo', 'avreste', 'avrebbero'],
      congiuntivo: ['abbia', 'abbia', 'abbia', 'abbiamo', 'abbiate', 'abbiano'],
      imperativo: ['abbi', 'abbia', 'abbiamo', 'abbiate', 'abbiano'],
      expressions: ['avere fame (hungry)', 'avere sete (thirsty)', 'avere caldo/freddo (hot/cold)', 'avere X anni (be X years old)', 'avere bisogno di (need)', 'avere voglia di (want to)', 'avere paura di (afraid of)', 'avere ragione/torto (be right/wrong)'],
      tip: 'Used as auxiliary for most verbs in passato prossimo. Also in many expressions where English uses "to be".'
    },
    stare: {
      meaning: 'to stay/to be (health, feelings)',
      presente: ['sto', 'stai', 'sta', 'stiamo', 'state', 'stanno'],
      passatoProssimo: { aux: 'essere', pp: 'stato/a' },
      imperfetto: ['stavo', 'stavi', 'stava', 'stavamo', 'stavate', 'stavano'],
      futuro: ['star\u00f2', 'starai', 'star\u00e0', 'staremo', 'starete', 'staranno'],
      condizionale: ['starei', 'staresti', 'starebbe', 'staremmo', 'stareste', 'starebbero'],
      congiuntivo: ['stia', 'stia', 'stia', 'stiamo', 'stiate', 'stiano'],
      imperativo: ['sta\'', 'stia', 'stiamo', 'state', 'stiano'],
      tip: 'Used for health/feelings (Come stai?), progressive (sto mangiando), and location (sta a casa). Do NOT confuse with essere.'
    },
    andare: {
      meaning: 'to go',
      presente: ['vado', 'vai', 'va', 'andiamo', 'andate', 'vanno'],
      passatoProssimo: { aux: 'essere', pp: 'andato/a' },
      imperfetto: ['andavo', 'andavi', 'andava', 'andavamo', 'andavate', 'andavano'],
      futuro: ['andr\u00f2', 'andrai', 'andr\u00e0', 'andremo', 'andrete', 'andranno'],
      condizionale: ['andrei', 'andresti', 'andrebbe', 'andremmo', 'andreste', 'andrebbero'],
      congiuntivo: ['vada', 'vada', 'vada', 'andiamo', 'andiate', 'vadano'],
      imperativo: ['va\'', 'vada', 'andiamo', 'andate', 'vadano'],
      tip: 'Uses ESSERE in passato prossimo. "Andare a + infinitive" = going to do something.'
    },
    fare: {
      meaning: 'to do/make',
      presente: ['faccio', 'fai', 'fa', 'facciamo', 'fate', 'fanno'],
      passatoProssimo: { aux: 'avere', pp: 'fatto' },
      imperfetto: ['facevo', 'facevi', 'faceva', 'facevamo', 'facevate', 'facevano'],
      futuro: ['far\u00f2', 'farai', 'far\u00e0', 'faremo', 'farete', 'faranno'],
      condizionale: ['farei', 'faresti', 'farebbe', 'faremmo', 'fareste', 'farebbero'],
      congiuntivo: ['faccia', 'faccia', 'faccia', 'facciamo', 'facciate', 'facciano'],
      imperativo: ['fa\'', 'faccia', 'facciamo', 'fate', 'facciano'],
      tip: 'Very versatile. Used for weather (fa caldo), activities (fare sport), and many expressions.'
    },
    volere: {
      meaning: 'to want',
      presente: ['voglio', 'vuoi', 'vuole', 'vogliamo', 'volete', 'vogliono'],
      passatoProssimo: { aux: 'avere', pp: 'voluto' },
      imperfetto: ['volevo', 'volevi', 'voleva', 'volevamo', 'volevate', 'volevano'],
      futuro: ['vorr\u00f2', 'vorrai', 'vorr\u00e0', 'vorremo', 'vorrete', 'vorranno'],
      condizionale: ['vorrei', 'vorresti', 'vorrebbe', 'vorremmo', 'vorreste', 'vorrebbero'],
      congiuntivo: ['voglia', 'voglia', 'voglia', 'vogliamo', 'vogliate', 'vogliano'],
      tip: '"Vorrei" (conditional) is more polite than "voglio". No imperative form in common use.'
    },
    potere: {
      meaning: 'can/to be able',
      presente: ['posso', 'puoi', 'pu\u00f2', 'possiamo', 'potete', 'possono'],
      passatoProssimo: { aux: 'avere', pp: 'potuto' },
      imperfetto: ['potevo', 'potevi', 'poteva', 'potevamo', 'potevate', 'potevano'],
      futuro: ['potr\u00f2', 'potrai', 'potr\u00e0', 'potremo', 'potrete', 'potranno'],
      condizionale: ['potrei', 'potresti', 'potrebbe', 'potremmo', 'potreste', 'potrebbero'],
      congiuntivo: ['possa', 'possa', 'possa', 'possiamo', 'possiate', 'possano'],
      tip: 'No imperative form. "Potrebbe" (conditional) = could you (polite request).'
    },
    dovere: {
      meaning: 'must/to have to',
      presente: ['devo', 'devi', 'deve', 'dobbiamo', 'dovete', 'devono'],
      passatoProssimo: { aux: 'avere', pp: 'dovuto' },
      imperfetto: ['dovevo', 'dovevi', 'doveva', 'dovevamo', 'dovevate', 'dovevano'],
      futuro: ['dovr\u00f2', 'dovrai', 'dovr\u00e0', 'dovremo', 'dovrete', 'dovranno'],
      condizionale: ['dovrei', 'dovresti', 'dovrebbe', 'dovremmo', 'dovreste', 'dovrebbero'],
      congiuntivo: ['debba', 'debba', 'debba', 'dobbiamo', 'dobbiate', 'debbano'],
      tip: '"Dovrei" = I should. No imperative form.'
    },
    sapere: {
      meaning: 'to know (facts)',
      presente: ['so', 'sai', 'sa', 'sappiamo', 'sapete', 'sanno'],
      passatoProssimo: { aux: 'avere', pp: 'saputo' },
      imperfetto: ['sapevo', 'sapevi', 'sapeva', 'sapevamo', 'sapevate', 'sapevano'],
      futuro: ['sapr\u00f2', 'saprai', 'sapr\u00e0', 'sapremo', 'saprete', 'sapranno'],
      condizionale: ['saprei', 'sapresti', 'saprebbe', 'sapremmo', 'sapreste', 'saprebbero'],
      congiuntivo: ['sappia', 'sappia', 'sappia', 'sappiamo', 'sappiate', 'sappiano'],
      imperativo: ['sappi', 'sappia', 'sappiamo', 'sappiate', 'sappiano'],
      tip: 'Know facts or how to do something. "So nuotare" = I can swim.'
    },
    conoscere: {
      meaning: 'to know (people/places)',
      presente: ['conosco', 'conosci', 'conosce', 'conosciamo', 'conoscete', 'conoscono'],
      passatoProssimo: { aux: 'avere', pp: 'conosciuto' },
      imperfetto: ['conoscevo', 'conoscevi', 'conosceva', 'conoscevamo', 'conoscevate', 'conoscevano'],
      futuro: ['conoscer\u00f2', 'conoscerai', 'conoscer\u00e0', 'conosceremo', 'conoscerete', 'conosceranno'],
      condizionale: ['conoscerei', 'conosceresti', 'conoscerebbe', 'conosceremmo', 'conoscereste', 'conoscerebbero'],
      congiuntivo: ['conosca', 'conosca', 'conosca', 'conosciamo', 'conosciate', 'conoscano'],
      tip: 'Know through familiarity. "Conosci Roma?" = Are you familiar with Rome?'
    },
    venire: {
      meaning: 'to come',
      presente: ['vengo', 'vieni', 'viene', 'veniamo', 'venite', 'vengono'],
      passatoProssimo: { aux: 'essere', pp: 'venuto/a' },
      imperfetto: ['venivo', 'venivi', 'veniva', 'venivamo', 'venivate', 'venivano'],
      futuro: ['verr\u00f2', 'verrai', 'verr\u00e0', 'verremo', 'verrete', 'verranno'],
      condizionale: ['verrei', 'verresti', 'verrebbe', 'verremmo', 'verreste', 'verrebbero'],
      congiuntivo: ['venga', 'venga', 'venga', 'veniamo', 'veniate', 'vengano'],
      imperativo: ['vieni', 'venga', 'veniamo', 'venite', 'vengano'],
      tip: 'Uses ESSERE. Double R in future/conditional.'
    },
    partire: {
      meaning: 'to leave/depart',
      presente: ['parto', 'parti', 'parte', 'partiamo', 'partite', 'partono'],
      passatoProssimo: { aux: 'essere', pp: 'partito/a' },
      imperfetto: ['partivo', 'partivi', 'partiva', 'partivamo', 'partivate', 'partivano'],
      futuro: ['partir\u00f2', 'partirai', 'partir\u00e0', 'partiremo', 'partirete', 'partiranno'],
      condizionale: ['partirei', 'partiresti', 'partirebbe', 'partiremmo', 'partireste', 'partirebbero'],
      congiuntivo: ['parta', 'parta', 'parta', 'partiamo', 'partiate', 'partano'],
      imperativo: ['parti', 'parta', 'partiamo', 'partite', 'partano'],
      tip: 'Uses ESSERE.'
    },
    prendere: {
      meaning: 'to take',
      presente: ['prendo', 'prendi', 'prende', 'prendiamo', 'prendete', 'prendono'],
      passatoProssimo: { aux: 'avere', pp: 'preso' },
      imperfetto: ['prendevo', 'prendevi', 'prendeva', 'prendevamo', 'prendevate', 'prendevano'],
      futuro: ['prender\u00f2', 'prenderai', 'prender\u00e0', 'prenderemo', 'prenderete', 'prenderanno'],
      condizionale: ['prenderei', 'prenderesti', 'prenderebbe', 'prenderemmo', 'prendereste', 'prenderebbero'],
      congiuntivo: ['prenda', 'prenda', 'prenda', 'prendiamo', 'prendiate', 'prendano'],
      imperativo: ['prendi', 'prenda', 'prendiamo', 'prendete', 'prendano'],
      tip: 'Irregular past participle: preso. Also: comprendere, apprendere, sorprendere.'
    },
    mettere: {
      meaning: 'to put',
      presente: ['metto', 'metti', 'mette', 'mettiamo', 'mettete', 'mettono'],
      passatoProssimo: { aux: 'avere', pp: 'messo' },
      imperfetto: ['mettevo', 'mettevi', 'metteva', 'mettevamo', 'mettevate', 'mettevano'],
      futuro: ['metter\u00f2', 'metterai', 'metter\u00e0', 'metteremo', 'metterete', 'metteranno'],
      condizionale: ['metterei', 'metteresti', 'metterebbe', 'metteremmo', 'mettereste', 'metterebbero'],
      congiuntivo: ['metta', 'metta', 'metta', 'mettiamo', 'mettiate', 'mettano'],
      imperativo: ['metti', 'metta', 'mettiamo', 'mettete', 'mettano'],
      tip: 'Irregular PP: messo. Also: permettere, promettere, ammettere.'
    },
    vedere: {
      meaning: 'to see',
      presente: ['vedo', 'vedi', 'vede', 'vediamo', 'vedete', 'vedono'],
      passatoProssimo: { aux: 'avere', pp: 'visto' },
      imperfetto: ['vedevo', 'vedevi', 'vedeva', 'vedevamo', 'vedevate', 'vedevano'],
      futuro: ['vedr\u00f2', 'vedrai', 'vedr\u00e0', 'vedremo', 'vedrete', 'vedranno'],
      condizionale: ['vedrei', 'vedresti', 'vedrebbe', 'vedremmo', 'vedreste', 'vedrebbero'],
      congiuntivo: ['veda', 'veda', 'veda', 'vediamo', 'vediate', 'vedano'],
      imperativo: ['vedi', 'veda', 'vediamo', 'vedete', 'vedano'],
      tip: 'Irregular PP: visto (also veduto). Contracted future stem.'
    },
    dire: {
      meaning: 'to say/tell',
      presente: ['dico', 'dici', 'dice', 'diciamo', 'dite', 'dicono'],
      passatoProssimo: { aux: 'avere', pp: 'detto' },
      imperfetto: ['dicevo', 'dicevi', 'diceva', 'dicevamo', 'dicevate', 'dicevano'],
      futuro: ['dir\u00f2', 'dirai', 'dir\u00e0', 'diremo', 'direte', 'diranno'],
      condizionale: ['direi', 'diresti', 'direbbe', 'diremmo', 'direste', 'direbbero'],
      congiuntivo: ['dica', 'dica', 'dica', 'diciamo', 'diciate', 'dicano'],
      imperativo: ['di\'', 'dica', 'diciamo', 'dite', 'dicano'],
      tip: 'Irregular PP: detto. Note "voi dite" (irregular).'
    },
    scrivere: {
      meaning: 'to write',
      presente: ['scrivo', 'scrivi', 'scrive', 'scriviamo', 'scrivete', 'scrivono'],
      passatoProssimo: { aux: 'avere', pp: 'scritto' },
      imperfetto: ['scrivevo', 'scrivevi', 'scriveva', 'scrivevamo', 'scrivevate', 'scrivevano'],
      futuro: ['scriver\u00f2', 'scriverai', 'scriver\u00e0', 'scriveremo', 'scriverete', 'scriveranno'],
      condizionale: ['scriverei', 'scriveresti', 'scriverebbe', 'scriveremmo', 'scrivereste', 'scriverebbero'],
      congiuntivo: ['scriva', 'scriva', 'scriva', 'scriviamo', 'scriviate', 'scrivano'],
      imperativo: ['scrivi', 'scriva', 'scriviamo', 'scrivete', 'scrivano'],
      tip: 'Irregular PP: scritto. Also: descrivere, iscrivere.'
    },
    leggere: {
      meaning: 'to read',
      presente: ['leggo', 'leggi', 'legge', 'leggiamo', 'leggete', 'leggono'],
      passatoProssimo: { aux: 'avere', pp: 'letto' },
      imperfetto: ['leggevo', 'leggevi', 'leggeva', 'leggevamo', 'leggevate', 'leggevano'],
      futuro: ['legger\u00f2', 'leggerai', 'legger\u00e0', 'leggeremo', 'leggerete', 'leggeranno'],
      condizionale: ['leggerei', 'leggeresti', 'leggerebbe', 'leggeremmo', 'leggereste', 'leggerebbero'],
      congiuntivo: ['legga', 'legga', 'legga', 'leggiamo', 'leggiate', 'leggano'],
      imperativo: ['leggi', 'legga', 'leggiamo', 'leggete', 'leggano'],
      tip: 'Irregular PP: letto. Also: eleggere, rileggere.'
    },
    bere: {
      meaning: 'to drink',
      presente: ['bevo', 'bevi', 'beve', 'beviamo', 'bevete', 'bevono'],
      passatoProssimo: { aux: 'avere', pp: 'bevuto' },
      imperfetto: ['bevevo', 'bevevi', 'beveva', 'bevevamo', 'bevevate', 'bevevano'],
      futuro: ['berr\u00f2', 'berrai', 'berr\u00e0', 'berremo', 'berrete', 'berranno'],
      condizionale: ['berrei', 'berresti', 'berrebbe', 'berremmo', 'berreste', 'berrebbero'],
      congiuntivo: ['beva', 'beva', 'beva', 'beviamo', 'beviate', 'bevano'],
      imperativo: ['bevi', 'beva', 'beviamo', 'bevete', 'bevano'],
      tip: 'From Latin bibere. Double R in future/conditional.'
    },
    uscire: {
      meaning: 'to go out',
      presente: ['esco', 'esci', 'esce', 'usciamo', 'uscite', 'escono'],
      passatoProssimo: { aux: 'essere', pp: 'uscito/a' },
      imperfetto: ['uscivo', 'uscivi', 'usciva', 'uscivamo', 'uscivate', 'uscivano'],
      futuro: ['uscir\u00f2', 'uscirai', 'uscir\u00e0', 'usciremo', 'uscirete', 'usciranno'],
      condizionale: ['uscirei', 'usciresti', 'uscirebbe', 'usciremmo', 'uscireste', 'uscirebbero'],
      congiuntivo: ['esca', 'esca', 'esca', 'usciamo', 'usciate', 'escano'],
      imperativo: ['esci', 'esca', 'usciamo', 'uscite', 'escano'],
      tip: 'Uses ESSERE. Note stem change: esc- in singular and 3rd pl.'
    },
    piacere: {
      meaning: 'to please/to like',
      presente: ['piaccio', 'piaci', 'piace', 'piacciamo', 'piacete', 'piacciono'],
      passatoProssimo: { aux: 'essere', pp: 'piaciuto/a' },
      imperfetto: ['piacevo', 'piacevi', 'piaceva', 'piacevamo', 'piacevate', 'piacevano'],
      futuro: ['piacer\u00f2', 'piacerai', 'piacer\u00e0', 'piaceremo', 'piacerete', 'piaceranno'],
      condizionale: ['piacerei', 'piaceresti', 'piacerebbe', 'piaceremmo', 'piacereste', 'piacerebbero'],
      congiuntivo: ['piaccia', 'piaccia', 'piaccia', 'piacciamo', 'piacciate', 'piacciano'],
      tip: 'Used with indirect object: "Mi piace" = I like (lit. it pleases me). Uses ESSERE in compound tenses.'
    },
    parlare: {
      meaning: 'to speak',
      presente: ['parlo', 'parli', 'parla', 'parliamo', 'parlate', 'parlano'],
      passatoProssimo: { aux: 'avere', pp: 'parlato' },
      imperfetto: ['parlavo', 'parlavi', 'parlava', 'parlavamo', 'parlavate', 'parlavano'],
      futuro: ['parler\u00f2', 'parlerai', 'parler\u00e0', 'parleremo', 'parlerete', 'parleranno'],
      condizionale: ['parlerei', 'parleresti', 'parlerebbe', 'parleremmo', 'parlereste', 'parlerebbero'],
      congiuntivo: ['parli', 'parli', 'parli', 'parliamo', 'parliate', 'parlino'],
      imperativo: ['parla', 'parli', 'parliamo', 'parlate', 'parlino'],
      tip: 'Regular -are verb. Model for all first conjugation verbs.'
    },
    mangiare: {
      meaning: 'to eat',
      presente: ['mangio', 'mangi', 'mangia', 'mangiamo', 'mangiate', 'mangiano'],
      passatoProssimo: { aux: 'avere', pp: 'mangiato' },
      imperfetto: ['mangiavo', 'mangiavi', 'mangiava', 'mangiavamo', 'mangiavate', 'mangiavano'],
      futuro: ['manger\u00f2', 'mangerai', 'manger\u00e0', 'mangeremo', 'mangerete', 'mangeranno'],
      condizionale: ['mangerei', 'mangeresti', 'mangerebbe', 'mangeremmo', 'mangereste', 'mangerebbero'],
      congiuntivo: ['mangi', 'mangi', 'mangi', 'mangiamo', 'mangiate', 'mangino'],
      imperativo: ['mangia', 'mangi', 'mangiamo', 'mangiate', 'mangino'],
      tip: 'Note: drops the i before e in future/conditional (manger-, not mangier-).'
    },
    dormire: {
      meaning: 'to sleep',
      presente: ['dormo', 'dormi', 'dorme', 'dormiamo', 'dormite', 'dormono'],
      passatoProssimo: { aux: 'avere', pp: 'dormito' },
      imperfetto: ['dormivo', 'dormivi', 'dormiva', 'dormivamo', 'dormivate', 'dormivano'],
      futuro: ['dormir\u00f2', 'dormirai', 'dormir\u00e0', 'dormiremo', 'dormirete', 'dormiranno'],
      condizionale: ['dormirei', 'dormiresti', 'dormirebbe', 'dormiremmo', 'dormireste', 'dormirebbero'],
      congiuntivo: ['dorma', 'dorma', 'dorma', 'dormiamo', 'dormiate', 'dormano'],
      imperativo: ['dormi', 'dorma', 'dormiamo', 'dormite', 'dormano'],
      tip: 'Regular -ire verb (non-isc type). Model for third conjugation.'
    },
    chiamarsi: {
      meaning: 'to be called',
      presente: ['mi chiamo', 'ti chiami', 'si chiama', 'ci chiamiamo', 'vi chiamate', 'si chiamano'],
      passatoProssimo: { aux: 'essere', pp: 'chiamato/a' },
      imperfetto: ['mi chiamavo', 'ti chiamavi', 'si chiamava', 'ci chiamavamo', 'vi chiamavate', 'si chiamavano'],
      tip: 'Reflexive. Used for introductions: "Mi chiamo..." = My name is...'
    },
    piovere: {
      meaning: 'to rain',
      presente: [null, null, 'piove', null, null, null],
      passatoProssimo: { aux: 'essere/avere', pp: 'piovuto' },
      imperfetto: [null, null, 'pioveva', null, null, null],
      futuro: [null, null, 'piover\u00e0', null, null, null],
      condizionale: [null, null, 'pioverebbe', null, null, null],
      congiuntivo: [null, null, 'piova', null, null, null],
      tip: 'Impersonal - only "it" form. Both essere and avere accepted as auxiliary.'
    },
    bisognare: {
      meaning: 'to be necessary',
      presente: [null, null, 'bisogna', null, null, null],
      passatoProssimo: { aux: 'essere', pp: 'bisognato' },
      imperfetto: [null, null, 'bisognava', null, null, null],
      futuro: [null, null, 'bisogner\u00e0', null, null, null],
      condizionale: [null, null, 'bisognerebbe', null, null, null],
      congiuntivo: [null, null, 'bisogni', null, null, null],
      tip: 'Impersonal - only "it" form. "Bisogna + infinitive" = one must.'
    },
  },

  // ============================================================================
  // CONFUSABLE WORDS
  // ============================================================================
  confusables: {
    // ========== ESSERE vs STARE (both mean "to be") ==========
    'sono': { confusesWith: 'sto', hint: 'SONO = I am (essere - permanent, identity). STO = I am (stare - temporary state, feeling). "Sono italiano" vs "Sto bene."' },
    'sto': { confusesWith: 'sono', hint: 'STO = I am (stare - health, feelings, temporary). SONO = I am (essere - identity). "Come stai?" vs "Di dove sei?"' },
    '\u00e8': { confusesWith: 'sta', hint: '\u00c8 = is (essere - permanent). STA = is (stare - temporary). "\u00c8 italiano" (identity) vs "Sta bene" (condition).' },
    'sta': { confusesWith: '\u00e8', hint: 'STA = is (stare - how someone is doing). \u00c8 = is (essere - what someone is). "Come sta?" vs "Chi \u00e8?"' },

    // ========== SAPERE vs CONOSCERE (both mean "to know") ==========
    'so': { confusesWith: 'conosco', hint: 'SO = I know (sapere - facts, how to). CONOSCO = I know (conoscere - people, places). "So nuotare" vs "Conosco Maria."' },
    'conosco': { confusesWith: 'so', hint: 'CONOSCO = I know (conoscere - acquainted with). SO = I know (sapere - facts). "Conosci Roma?" vs "Sai dov\'\u00e8?"' },
    'sa': { confusesWith: 'conosce', hint: 'SA = knows (sapere - information). CONOSCE = knows (conoscere - familiarity). "Sa l\'inglese" vs "Conosce mio padre."' },
    'conosce': { confusesWith: 'sa', hint: 'CONOSCE = knows (conoscere - people/places). SA = knows (sapere - facts). "Conosce l\'Italia" vs "Sa cucinare."' },

    // ========== ARTICLES: il/lo, i/gli ==========
    'il': { confusesWith: 'lo', hint: 'IL = the (most masculine nouns). LO = the (before z, s+cons, gn, ps, x). "il libro" vs "lo studente, lo zio."' },
    'lo': { confusesWith: 'il', hint: 'LO = the (before z, s+consonant, gn, ps, x, y). Use IL for other masculine nouns. "lo sport" but "il ragazzo."' },
    'i': { confusesWith: 'gli', hint: 'I = the (plural of IL). GLI = the (plural of LO, before vowels). "i libri" vs "gli studenti, gli amici."' },
    'gli': { confusesWith: 'i', hint: 'GLI = the (plural of LO, also before vowels). I = plural of IL. "gli zii" and "gli italiani" (not i italiani).' },

    // ========== PREPOSITIONS ==========
    'a': { confusesWith: 'in', hint: 'A = to/at (cities, activities). IN = in/to (countries, regions, large areas). "Vado a Roma" vs "Vado in Italia."' },
    'in': { confusesWith: 'a', hint: 'IN = in/to (countries, regions). A = to/at (cities). "Abito in Italia, a Roma." Also: in + vehicle (in treno).' },
    'da': { confusesWith: 'di', hint: 'DA = from (origin), at (someone\'s place), by, for (duration). DI = of, from (material). "Vengo da Roma" vs "Una borsa di pelle."' },
    'di': { confusesWith: 'da', hint: 'DI = of, from (origin/material), \'s. DA = from (departure), at (someone\'s). "Sono di Milano" vs "Vado da Maria."' },
    'per': { confusesWith: 'da', hint: 'PER = for (purpose, destination), through. DA = for (duration with present). "Studio per l\'esame" vs "Studio italiano da due anni."' },

    // ========== PRONOUNS: Direct vs Indirect Object ==========
    'la': { confusesWith: 'le', hint: 'LA = her/it (direct object). LE = to her (indirect object). "La chiamo" (I call her) vs "Le scrivo" (I write to her).' },
    'li': { confusesWith: 'loro', hint: 'LI = them (masc, direct). LORO/GLI = to them (indirect, gli now common). "Li conosco" vs "Gli telefono."' },
    'le': { confusesWith: 'loro', hint: 'LE = them (fem, direct) or to her (indirect). Context matters! "Le vedo" (I see them-f) vs "Le scrivo" (I write to her).' },

    // ========== BUONO/BELLO vs BENE ==========
    'buono': { confusesWith: 'bene', hint: 'BUONO = good (adjective, describes nouns). BENE = well (adverb, describes verbs). "Un buon libro" vs "Stai bene."' },
    'bene': { confusesWith: 'buono', hint: 'BENE = well (adverb). BUONO = good (adjective). "Parli bene italiano" (adverb) vs "Un buon amico" (adjective).' },
    'bello': { confusesWith: 'bene', hint: 'BELLO = beautiful (adjective). BENE = well (adverb). Don\'t confuse! "Una bella giornata" vs "Come stai? Bene!"' },

    // ========== MOLTO vs TANTO ==========
    'molto': { confusesWith: 'tanto', hint: 'MOLTO = very/much/many (more neutral). TANTO = so much/many (more emphatic). Both work, MOLTO is more common.' },
    'tanto': { confusesWith: 'molto', hint: 'TANTO = so much (emphatic). MOLTO = very/much (neutral). "Ho tanta fame!" vs "Ho molta fame."' },

    // ========== PASSATO PROSSIMO: ESSERE vs AVERE auxiliary ==========
    'ho': { confusesWith: 'sono', hint: 'HO = I have (avere - most verbs). SONO = I have/am (essere - motion, reflexive). "Ho mangiato" vs "Sono andato."' },
    'hai': { confusesWith: 'sei', hint: 'HAI = you have (avere - actions). SEI = you have/are (essere - movement). "Hai studiato" vs "Sei arrivato."' },
    'ha': { confusesWith: 'andato', hint: 'HA = has (avere). Motion verbs use ESSERE: \u00c8 andato, NOT ha andato. "Ha lavorato" vs "\u00c8 partito."' },

    // ========== CHE vs CUI (relative pronouns) ==========
    'che': { confusesWith: 'cui', hint: 'CHE = that/which/who (subject or direct object). CUI = which/whom (after prepositions). "Il libro che leggo" vs "Il libro di cui parlo."' },
    'cui': { confusesWith: 'che', hint: 'CUI = which/whom (after preposition). CHE = that (no preposition). "La persona con cui parlo" vs "La persona che vedo."' },
  },

  // ============================================================================
  // GRAMMAR PATTERN DETECTION
  // ============================================================================
  detectGrammarPatterns(italian, english) {
    const hints = [];
    const itLower = italian.toLowerCase();
    const itWords = itLower.split(/\s+/);
    const hasWord = (words) => words.some(w => itWords.includes(w));

    // Verb detection
    const verbs = window.COURSE_CONFIG?.verbs || {};
    for (const [verb, data] of Object.entries(verbs)) {
      const allForms = [];
      if (data.presente) allForms.push(...data.presente);
      if (data.imperfetto) allForms.push(...data.imperfetto);
      if (data.futuro) allForms.push(...data.futuro);
      if (data.condizionale) allForms.push(...data.condizionale);
      if (data.passatoProssimo && data.passatoProssimo.pp) allForms.push(data.passatoProssimo.pp);

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
    if (itLower.includes('non ')) {
      let neg = 'non...';
      if (itLower.includes(' pi\u00f9')) neg = 'non..pi\u00f9 (no longer)';
      else if (itLower.includes(' mai')) neg = 'non...mai (never)';
      else if (itLower.includes(' niente') || itLower.includes(' nulla')) neg = 'non...niente/nulla (nothing)';
      else if (itLower.includes(' nessuno')) neg = 'non...nessuno (no one)';
      hints.push('NEGATION: ' + neg);
    }

    // Subjunctive triggers
    if (itLower.includes('che ') && (itLower.includes('spero') || itLower.includes('penso') || itLower.includes('credo') || itLower.includes('bisogna') || itLower.includes('importante'))) {
      hints.push('CONGIUNTIVO: Triggered by expressions of hope, belief, necessity, or importance.');
    }

    return hints.length > 0 ? hints.slice(0, 2).join(' | ') : 'Basic vocabulary';
  },

  // ============================================================================
  // UNITS DATA - ALL 30 ITALIAN UNITS
  // ============================================================================
  units: [
    {
      id: 1,
      volume: 1,
      title_target: 'Primi Contatti',
      title_source: 'First Contact',
      title_it: 'Primi Contatti',
      title_en: 'First Contact',
      dialogue: [
        { speaker: 'MARIA', it: 'Buongiorno, signore.', en: 'Good morning, sir.' },
        { speaker: 'LUCA', it: 'Buongiorno, signora.', en: 'Good morning, ma\'am.' },
        { speaker: 'MARIA', it: 'Mi chiamo Maria Rossi. Come si chiama Lei?', en: 'My name is Maria Rossi. What is your name?' },
        { speaker: 'LUCA', it: 'Mi chiamo Luca Bianchi. Piacere.', en: 'My name is Luca Bianchi. Pleased to meet you.' },
        { speaker: 'MARIA', it: 'Piacere mio. Di dov\'\u00e8 Lei?', en: 'The pleasure is mine. Where are you from?' },
        { speaker: 'LUCA', it: 'Sono di Milano. E Lei?', en: 'I\'m from Milan. And you?' },
        { speaker: 'MARIA', it: 'Sono di Roma.', en: 'I\'m from Rome.' },
      ],
      grammar: [
        { title: 'Greetings & Politeness', desc: 'Buongiorno (hello/good morning), Buonasera (good evening). "Come si chiama?" is formal.' },
        { title: 'Essere (to be)', desc: 'Io sono, tu sei, lui/lei \u00e8, noi siamo, voi siete, loro sono.' },
        { title: 'Chiamarsi (to be called)', desc: 'Mi chiamo, ti chiami, si chiama, ci chiamiamo, vi chiamate, si chiamano.' },
        { title: 'Formal vs Informal', desc: 'Lei (formal you, capitalized) vs tu (informal). Lei uses 3rd person singular verbs.' }
      ]
    },
    {
      id: 2,
      volume: 1,
      title_target: 'Di Dove Sei?',
      title_source: 'Where Are You From?',
      title_it: 'Di Dove Sei?',
      title_en: 'Where Are You From?',
      dialogue: [
        { speaker: 'MARCO', it: 'Buonasera. \u00c8 la prima volta che viene a questo congresso?', en: 'Good evening. Is this your first time at this conference?' },
        { speaker: 'ANNA', it: 'S\u00ec, \u00e8 la prima volta. Sono Anna Conti. E Lei?', en: 'Yes, it\'s my first time. I\'m Anna Conti. And you?' },
        { speaker: 'MARCO', it: 'Marco Ferri. Piacere. Di che nazionalit\u00e0 \u00e8?', en: 'Marco Ferri. Pleased to meet you. What nationality are you?' },
        { speaker: 'ANNA', it: 'Sono italiana, di Napoli. E Lei, di dov\'\u00e8?', en: 'I\'m Italian, from Naples. And you, where are you from?' },
        { speaker: 'MARCO', it: 'Anch\'io sono italiano, ma vivo a Londra da cinque anni.', en: 'I\'m also Italian, but I\'ve been living in London for five years.' },
      ],
      grammar: [
        { title: 'Nationality & Origin', desc: '"Sono italiano/a" = I\'m Italian. "Di dov\'\u00e8?" (formal) / "Di dove sei?" (informal).' },
        { title: 'Languages', desc: '"Parlo italiano, inglese e spagnolo." Verbs: parlare (speak), capire (understand), studiare (study).' },
        { title: 'Prepositions: a vs in', desc: '"Vado a Roma" (cities use a). "Vado in Italia" (countries use in).' }
      ]
    },
    {
      id: 3,
      volume: 1,
      title_target: 'Come Stai?',
      title_source: 'How Are You?',
      title_it: 'Come Stai?',
      title_en: 'How Are You?',
      dialogue: [
        { speaker: 'DOTTOR ROSSI', it: 'Buongiorno, Signora Bianchi. Come sta oggi?', en: 'Good morning, Mrs. Bianchi. How are you today?' },
        { speaker: 'SIGNORA BIANCHI', it: 'Buongiorno, Dottore. Sto bene, grazie. E Lei?', en: 'Good morning, Doctor. I\'m fine, thanks. And you?' },
        { speaker: 'DOTTOR ROSSI', it: 'Non c\'\u00e8 male, grazie. Un po\' stanco, ma bene.', en: 'Not bad, thanks. A little tired, but fine.' },
      ],
      grammar: [
        { title: 'Stare vs Essere', desc: 'Stare = health/feelings (Come stai? Sto bene). Essere = identity (Sono italiano). Key distinction!' },
        { title: 'Adjectives & Agreement', desc: 'Adjectives agree in gender/number: stanco/stanca/stanchi/stanche. Contento, triste, preoccupato.' },
        { title: 'Common Expressions', desc: 'Sto bene/male. Non c\'\u00e8 male. Cos\u00ec cos\u00ec. Mi dispiace.' }
      ]
    },
    {
      id: 4,
      volume: 1,
      title_target: 'La Mia Famiglia',
      title_source: 'My Family',
      title_it: 'La Mia Famiglia',
      title_en: 'My Family',
      dialogue: [
        { speaker: 'SIGNORA CONTI', it: 'Benvenuto a casa nostra! Ha famiglia Lei?', en: 'Welcome to our home! Do you have family?' },
        { speaker: 'JOHN', it: 'S\u00ec, ho una famiglia grande. Siamo in cinque.', en: 'Yes, I have a big family. There are five of us.' },
        { speaker: 'SIGNORA CONTI', it: 'Ah, che bello! Chi c\'\u00e8 nella Sua famiglia?', en: 'Ah, how nice! Who is in your family?' },
        { speaker: 'JOHN', it: 'C\'\u00e8 mia madre, mio padre, mio fratello e mia sorella.', en: 'There\'s my mother, my father, my brother, and my sister.' },
      ],
      grammar: [
        { title: 'Avere (to have)', desc: 'Ho, hai, ha, abbiamo, avete, hanno.' },
        { title: 'Family Members', desc: 'padre/madre, fratello/sorella, figlio/figlia, nonno/nonna, zio/zia, cugino/cugina.' },
        { title: 'Possessive Adjectives', desc: 'mio/mia, tuo/tua, suo/sua. With family: "mio padre" (no article) but "il mio amico" (article).' },
        { title: 'Age with Avere', desc: '"Quanti anni hai?" / "Ho venticinque anni." Italian uses "to have" for age.' }
      ]
    },
    {
      id: 5,
      volume: 1,
      title_target: 'RIPASSO',
      title_source: 'Review',
      title_it: 'RIPASSO',
      title_en: 'Review',
      dialogue: [],
      grammar: [
        { title: 'Articles Review', desc: 'Definite: il/lo/la/l\'/i/gli/le. Indefinite: un/uno/una/un\'.' },
        { title: 'Common Verbs', desc: 'essere, avere, stare, fare, andare, venire.' }
      ]
    },
    {
      id: 6,
      volume: 1,
      title_target: 'Che Ore Sono?',
      title_source: 'What Time Is It?',
      title_it: 'Che Ore Sono?',
      title_en: 'What Time Is It?',
      dialogue: [
        { speaker: 'SEGRETARIA', it: 'Buongiorno. Desidera?', en: 'Good morning. How can I help you?' },
        { speaker: 'SIGNOR ROSSI', it: 'Buongiorno. Vorrei prendere un appuntamento con il Dottor Bianchi.', en: 'Good morning. I\'d like to make an appointment with Dr. Bianchi.' },
        { speaker: 'SEGRETARIA', it: 'Certo. Per quando?', en: 'Certainly. For when?' },
        { speaker: 'SIGNOR ROSSI', it: 'Scusi, che ore sono adesso?', en: 'Excuse me, what time is it now?' },
        { speaker: 'SEGRETARIA', it: 'Sono le undici e un quarto.', en: 'It\'s 11:15.' },
      ],
      grammar: [
        { title: 'Telling Time', desc: 'Che ore sono? / Che ora \u00e8? Sono le due (2:00). \u00c8 l\'una (1:00). \u00c8 mezzogiorno/mezzanotte.' },
        { title: 'Time Expressions', desc: 'e un quarto (+15), e mezza (+30), meno un quarto (-15). Alle due = at 2:00.' },
        { title: 'Days of the Week', desc: 'luned\u00ec, marted\u00ec, mercoled\u00ec, gioved\u00ec, venerd\u00ec, sabato, domenica.' }
      ]
    },
    {
      id: 7,
      volume: 1,
      title_target: 'Al Ristorante',
      title_source: 'At the Restaurant',
      title_it: 'Al Ristorante',
      title_en: 'At the Restaurant',
      dialogue: [
        { speaker: 'CAMERIERE', it: 'Buonasera, Signori. Una tavola per due?', en: 'Good evening. A table for two?' },
        { speaker: 'SIGNOR CONTI', it: 'S\u00ec, grazie. Possibilmente vicino alla finestra.', en: 'Yes, thanks. Possibly near the window.' },
        { speaker: 'CAMERIERE', it: 'Prego, da questa parte. Ecco il men\u00f9.', en: 'This way, please. Here\'s the menu.' },
        { speaker: 'SIGNOR CONTI', it: 'Per cominciare, vorremmo un antipasto misto.', en: 'To start, we\'d like a mixed appetizer.' },
      ],
      grammar: [
        { title: 'Ordering Food', desc: 'Vorrei... (I\'d like). Per me... (For me). Il conto, per favore (The check, please).' },
        { title: 'Italian Meals', desc: 'antipasto (starter), primo (pasta/risotto), secondo (meat/fish), contorno (side), dolce (dessert).' },
        { title: 'Partitive Articles', desc: 'del/dello/della/dell\'/dei/degli/delle = some. "Vorrei del pane" = I\'d like some bread.' }
      ]
    },
    {
      id: 8,
      volume: 1,
      title_target: 'Facciamo Spese',
      title_source: 'Shopping',
      title_it: 'Facciamo Spese',
      title_en: 'Shopping',
      dialogue: [
        { speaker: 'COMMESSA', it: 'Buongiorno, posso aiutarLa?', en: 'Good morning, can I help you?' },
        { speaker: 'CLIENTE', it: 'S\u00ec, grazie. Cerco una giacca elegante.', en: 'Yes, thank you. I\'m looking for an elegant jacket.' },
        { speaker: 'COMMESSA', it: 'Che taglia porta?', en: 'What size do you wear?' },
        { speaker: 'CLIENTE', it: 'Quanto costa?', en: 'How much does it cost?' },
      ],
      grammar: [
        { title: 'Shopping Vocabulary', desc: 'Quanto costa? Che taglia porta? Posso provarlo/a? La cassa (register). Lo scontrino (receipt).' },
        { title: 'Direct Object Pronouns', desc: 'lo, la, li, le = it/them (direct). Placement: before conjugated verb. "Lo prendo" = I\'ll take it.' },
        { title: 'Colors', desc: 'rosso, blu, verde, giallo, nero, bianco, grigio, marrone. Agree in gender/number (except blu, rosa, viola).' }
      ]
    },
    {
      id: 9,
      volume: 1,
      title_target: 'Dov\'\u00e8...?',
      title_source: 'Where Is...?',
      title_it: 'Dov\'\u00e8...?',
      title_en: 'Where Is...?',
      dialogue: [
        { speaker: 'TURISTA', it: 'Buongiorno. Scusi, potrebbe indicarmi dov\'\u00e8 il Duomo?', en: 'Good morning. Excuse me, could you tell me where the Duomo is?' },
        { speaker: 'IMPIEGATA', it: 'Certo! \u00c8 molto vicino. Vada sempre diritto per questa strada.', en: 'Of course! It\'s very close. Go straight on this street.' },
        { speaker: 'TURISTA', it: 'E quanto ci vuole a piedi?', en: 'And how long does it take on foot?' },
        { speaker: 'IMPIEGATA', it: 'Circa dieci minuti.', en: 'About ten minutes.' },
      ],
      grammar: [
        { title: 'Giving Directions', desc: 'Vada diritto (go straight), giri a destra/sinistra (turn right/left), continui (continue).' },
        { title: 'Prepositions of Place', desc: 'vicino a (near), lontano da (far from), davanti a (in front of), dietro (behind), accanto a (next to).' },
        { title: 'Imperative (formal)', desc: 'Lei form: vada, giri, prenda, continui. Uses congiuntivo forms.' }
      ]
    },
    {
      id: 10,
      volume: 1,
      title_target: 'RIPASSO',
      title_source: 'Review',
      title_it: 'RIPASSO',
      title_en: 'Review',
      dialogue: [],
      grammar: [
        { title: 'Units 6-9 Review', desc: 'Time, restaurant, shopping, directions. Key verbs: volere, potere, dovere.' },
        { title: 'Pronoun Review', desc: 'Direct: lo/la/li/le. Indirect: gli/le. Placement before verb.' }
      ]
    },
    {
      id: 11,
      volume: 2,
      title_target: 'La Mia Giornata',
      title_source: 'My Day',
      title_it: 'La Mia Giornata',
      title_en: 'My Day',
      dialogue: [
        { speaker: 'INTERVISTATRICE', it: 'Mi parli della Sua giornata tipica.', en: 'Tell me about your typical day.' },
        { speaker: 'CANDIDATO', it: 'Di solito mi sveglio alle sei e mezza.', en: 'I usually wake up at 6:30.' },
        { speaker: 'CANDIDATO', it: 'Mi alzo subito, faccio la doccia e mi vesto.', en: 'I get up right away, take a shower, and get dressed.' },
      ],
      grammar: [
        { title: 'Reflexive Verbs', desc: 'svegliarsi, alzarsi, vestirsi, lavarsi. Pronoun before verb: mi sveglio, ti svegli, si sveglia...' },
        { title: 'Daily Routine', desc: 'fare la doccia (shower), fare colazione (breakfast), andare al lavoro (go to work), cenare (dine).' },
        { title: 'Time Expressions', desc: 'di solito (usually), sempre (always), a volte (sometimes), la mattina/sera (morning/evening).' }
      ]
    },
    {
      id: 12,
      volume: 2,
      title_target: 'Cosa Ti Piace?',
      title_source: 'What Do You Like?',
      title_it: 'Cosa Ti Piace?',
      title_en: 'What Do You Like?',
      dialogue: [
        { speaker: 'SIGNOR ROSSI', it: 'Le piace vivere a Milano?', en: 'Do you like living in Milan?' },
        { speaker: 'SIGNORA BIANCHI', it: 'S\u00ec, mi piace molto!', en: 'Yes, I like it a lot!' },
        { speaker: 'SIGNOR ROSSI', it: 'Cosa Le piace fare nel tempo libero?', en: 'What do you like to do in your free time?' },
      ],
      grammar: [
        { title: 'Piacere (to like)', desc: '"Mi piace" (I like - singular). "Mi piacciono" (I like - plural). Subject is the thing liked!' },
        { title: 'Indirect Object Pronouns', desc: 'mi, ti, gli/le, ci, vi, gli/loro. Used with piacere: "Ti piace?" = Do you like it?' },
        { title: 'Hobbies & Interests', desc: 'leggere, cucinare, viaggiare, giocare a calcio, suonare la chitarra.' }
      ]
    },
    {
      id: 13,
      volume: 2,
      title_target: 'Il Fine Settimana Scorso',
      title_source: 'Last Weekend',
      title_it: 'Il Fine Settimana Scorso',
      title_en: 'Last Weekend',
      dialogue: [
        { speaker: 'COLLEGA 1', it: 'Come ha passato il fine settimana?', en: 'How did you spend the weekend?' },
        { speaker: 'COLLEGA 2', it: 'Molto bene! Sabato ho visitato una mostra al museo.', en: 'Very well! Saturday I visited an exhibition at the museum.' },
        { speaker: 'COLLEGA 2', it: 'Domenica ho pranzato con la famiglia.', en: 'Sunday I had lunch with my family.' },
      ],
      grammar: [
        { title: 'Passato Prossimo', desc: 'avere/essere + past participle. "Ho mangiato" (I ate). "Sono andato" (I went).' },
        { title: 'ESSERE Verbs', desc: 'Motion/state change: andare, venire, partire, arrivare, uscire, entrare, nascere, morire, restare, diventare.' },
        { title: 'Past Participle Agreement', desc: 'With essere: agrees with subject (sono andata). With avere: agrees with preceding direct object pronoun.' }
      ]
    },
    {
      id: 14,
      volume: 2,
      title_target: 'Quando Ero Bambino',
      title_source: 'When I Was a Child',
      title_it: 'Quando Ero Bambino',
      title_en: 'When I Was a Child',
      dialogue: [
        { speaker: 'SIGNOR VERDI', it: 'Si ricorda com\'era la nostra scuola?', en: 'Do you remember what our school was like?' },
        { speaker: 'SIGNORA ROSSI', it: 'Certo! Era molto diversa da oggi.', en: 'Of course! It was very different from today.' },
        { speaker: 'SIGNOR VERDI', it: '\u00c8 vero! Scrivevamo sempre a mano.', en: 'That\'s true! We always wrote by hand.' },
      ],
      grammar: [
        { title: 'Imperfetto', desc: 'Ongoing/habitual past. -are: -avo, -avi, -ava, -avamo, -avate, -avano. "Giocavo" = I used to play.' },
        { title: 'Passato Prossimo vs Imperfetto', desc: 'PP: completed actions (Ho mangiato). Impf: descriptions, habits, ongoing (Mangiavo sempre l\u00ec).' },
        { title: 'Time Markers', desc: 'PP: ieri, l\'altro ieri, una volta. Impf: sempre, spesso, di solito, ogni giorno, da bambino.' }
      ]
    },
    {
      id: 15,
      volume: 2,
      title_target: 'RIPASSO',
      title_source: 'Review',
      title_it: 'RIPASSO',
      title_en: 'Review',
      dialogue: [],
      grammar: [
        { title: 'Tenses Review', desc: 'Presente, Passato Prossimo, Imperfetto. When to use each.' },
        { title: 'Reflexive + Past', desc: 'Reflexive verbs use ESSERE in passato prossimo: "Mi sono svegliato/a."' }
      ]
    },
    {
      id: 16,
      volume: 2,
      title_target: 'Una Storia',
      title_source: 'A Story',
      title_it: 'Una Storia',
      title_en: 'A Story',
      dialogue: [
        { speaker: 'MARCO', it: 'Signora Bianchi, Le racconto cosa mi \u00e8 successo ieri!', en: 'Mrs. Bianchi, let me tell you what happened to me yesterday!' },
        { speaker: 'BIANCHI', it: 'Oh, mi dica! Che cosa \u00e8 successo?', en: 'Oh, tell me! What happened?' },
        { speaker: 'MARCO', it: 'Era una bella giornata, il sole splendeva, e io camminavo nel parco...', en: 'It was a beautiful day, the sun was shining, and I was walking in the park...' },
      ],
      grammar: [
        { title: 'Narration: PP + Imperfetto', desc: 'Imperfetto sets the scene (era, splendeva). PP advances the action (ho sentito, mi sono girato).' },
        { title: 'Stare per + Infinitive', desc: '"Stavo per scappare" = I was about to run. Near past/future with stare.' },
        { title: 'Exclamations', desc: 'Che paura! Che bello! Che storia! Madonna! Meno male!' }
      ]
    },
    {
      id: 17,
      volume: 2,
      title_target: 'Dal Medico',
      title_source: 'At the Doctor',
      title_it: 'Dal Medico',
      title_en: 'At the Doctor',
      dialogue: [
        { speaker: 'MEDICO', it: 'Buongiorno, si accomodi. Come posso aiutarLa?', en: 'Good morning, have a seat. How can I help you?' },
        { speaker: 'PAZIENTE', it: 'Ho mal di testa, mi fa male la gola e ho la febbre.', en: 'I have a headache, my throat hurts, and I have a fever.' },
        { speaker: 'MEDICO', it: 'Apra la bocca e dica "Ahhh."', en: 'Open your mouth and say "Ahhh."' },
      ],
      grammar: [
        { title: 'Health Vocabulary', desc: 'Ho mal di testa/gola/stomaco. Mi fa male il/la... Ho la febbre. Tossire (to cough).' },
        { title: 'Formal Imperative', desc: 'Lei form commands: apra, dica, prenda, respiri. Uses congiuntivo presente.' },
        { title: 'Da + Time', desc: '"Non mi sento bene da due giorni" = for two days (with present tense for ongoing).' }
      ]
    },
    {
      id: 18,
      volume: 2,
      title_target: 'Facendo Progetti',
      title_source: 'Making Plans',
      title_it: 'Facendo Progetti',
      title_en: 'Making Plans',
      dialogue: [
        { speaker: 'DIRETTORE', it: 'Che programmi ha per il prossimo mese?', en: 'What are your plans for next month?' },
        { speaker: 'MARTINI', it: 'Sar\u00f2 molto impegnata. Partir\u00f2 il 15 e torner\u00f2 il 18.', en: 'I\'ll be very busy. I\'ll leave on the 15th and return on the 18th.' },
      ],
      grammar: [
        { title: 'Future Tense', desc: 'Regular: stem + \u00f2, ai, \u00e0, emo, ete, anno. Irregular: sar-, avr-, far-, andr-, verr-, potr-, vorr-, dovr-.' },
        { title: 'Future of Probability', desc: '"Sar\u00e0 stanco" = He\'s probably tired. "Avr\u00e0 trent\'anni" = She\'s probably 30.' },
        { title: 'Time Expressions (Future)', desc: 'domani, dopodomani, la settimana prossima, il mese prossimo, fra/tra due giorni.' }
      ]
    },
    {
      id: 19,
      volume: 2,
      title_target: 'Al Lavoro',
      title_source: 'At Work',
      title_it: 'Al Lavoro',
      title_en: 'At Work',
      dialogue: [
        { speaker: 'DIRETTORE', it: 'Buongiorno a tutti. Cominciamo la riunione.', en: 'Good morning everyone. Let\'s begin the meeting.' },
        { speaker: 'BIANCHI', it: 'Potrebbe parlare del progetto di cui ci ha accennato ieri?', en: 'Could you talk about the project you mentioned yesterday?' },
      ],
      grammar: [
        { title: 'Relative Pronouns', desc: 'che = who/which/that (no preposition). cui = whom/which (after preposition). "Il libro di cui parlo."' },
        { title: 'Work Vocabulary', desc: 'la riunione (meeting), il progetto (project), la scadenza (deadline), il rapporto (report).' },
        { title: 'Conditional', desc: 'Polite requests: potrebbe, vorrebbe, sarebbe. "Potrebbe parlare pi\u00f9 lentamente?"' }
      ]
    },
    {
      id: 20,
      volume: 2,
      title_target: 'RIPASSO',
      title_source: 'Review',
      title_it: 'RIPASSO',
      title_en: 'Review',
      dialogue: [],
      grammar: [
        { title: 'Tenses Review', desc: 'Presente, Passato Prossimo, Imperfetto, Futuro, Condizionale.' },
        { title: 'Pronouns Review', desc: 'Subject, direct/indirect object, reflexive, relative.' }
      ]
    },
    {
      id: 21,
      volume: 3,
      title_target: 'Spero Che...',
      title_source: 'I Hope That...',
      title_it: 'Spero Che...',
      title_en: 'I Hope That...',
      dialogue: [
        { speaker: 'MARIA', it: 'Spero che trovi qualcosa presto.', en: 'I hope he finds something soon.' },
        { speaker: 'ROSSI', it: 'Credo che sia un ragazzo molto capace.', en: 'I believe he is a very capable young man.' },
        { speaker: 'MARIA', it: 'Penso che abbia buone possibilit\u00e0.', en: 'I think he has good chances.' },
      ],
      grammar: [
        { title: 'Congiuntivo Presente', desc: 'Triggered by: sperare, credere, pensare, volere, dubitare + che. "Spero che tu stia bene."' },
        { title: 'Regular Congiuntivo', desc: '-are: -i, -i, -i, -iamo, -iate, -ino. -ere: -a, -a, -a, -iamo, -iate, -ano. -ire: -a/-isca.' },
        { title: 'Irregular Congiuntivo', desc: 'sia (essere), abbia (avere), faccia (fare), vada (andare), stia (stare), possa (potere).' }
      ]
    },
    {
      id: 22,
      volume: 3,
      title_target: '\u00c8 Importante Che...',
      title_source: 'It\'s Important That...',
      title_it: '\u00c8 Importante Che...',
      title_en: 'It\'s Important That...',
      dialogue: [
        { speaker: 'MADRE', it: 'Figlio mio, \u00e8 importante che tu studi seriamente.', en: 'My son, it\'s important that you study seriously.' },
        { speaker: 'MADRE', it: '\u00c8 necessario che tu frequenti tutte le lezioni.', en: 'It\'s necessary that you attend all classes.' },
      ],
      grammar: [
        { title: 'Impersonal Triggers', desc: '\u00c8 importante/necessario/meglio/fondamentale/naturale/strano/un peccato che + congiuntivo.' },
        { title: 'Emotion Triggers', desc: 'Sono felice/contento/triste/sorpreso che + congiuntivo. "Mi dispiace che tu sia malato."' },
        { title: 'Indicative vs Congiuntivo', desc: 'Certezza = indicative ("\u00c8 chiaro che viene"). Doubt/emotion = congiuntivo ("\u00c8 strano che venga").' }
      ]
    },
    {
      id: 23,
      volume: 3,
      title_target: 'Sebbene...',
      title_source: 'Although...',
      title_it: 'Sebbene...',
      title_en: 'Although...',
      dialogue: [
        { speaker: 'DIRETTORE', it: 'Bench\u00e9 il progetto sia complesso, dobbiamo finirlo in tempo.', en: 'Although the project is complex, we must finish it on time.' },
        { speaker: 'BIANCHI', it: 'Far\u00f2 tutto il possibile affinch\u00e9 tutto vada bene.', en: 'I\'ll do everything possible so that everything goes well.' },
      ],
      grammar: [
        { title: 'Conjunctions + Congiuntivo', desc: 'bench\u00e9, sebbene, nonostante (although). affinch\u00e9, perch\u00e9 (so that). prima che (before).' },
        { title: 'More Triggers', desc: 'a meno che non (unless), purch\u00e9 (provided that), senza che (without), nel caso che (in case).' },
        { title: 'Superlative + Congiuntivo', desc: '"La persona pi\u00f9 gentile che io conosca." After superlatives, use congiuntivo.' }
      ]
    },
    {
      id: 24,
      volume: 3,
      title_target: 'Se Fossi...',
      title_source: 'If I Were...',
      title_it: 'Se Fossi...',
      title_en: 'If I Were...',
      dialogue: [
        { speaker: 'MARIA', it: 'Se avesse un milione di euro, cosa farebbe?', en: 'If you had a million euros, what would you do?' },
        { speaker: 'ROSSI', it: 'Se fossi ricco, viaggerei per tutto il mondo.', en: 'If I were rich, I would travel around the world.' },
      ],
      grammar: [
        { title: 'Congiuntivo Imperfetto', desc: 'Se fossi, se avessi, se potessi... Used in hypothetical "if" clauses (periodo ipotetico).' },
        { title: 'Periodo Ipotetico (Type 2)', desc: 'Se + congiuntivo imperfetto, condizionale presente. "Se avessi tempo, viaggerei."' },
        { title: 'Common Irregular Forms', desc: 'fossi (essere), avessi (avere), facessi (fare), potessi (potere), andassi (andare), venissi (venire).' }
      ]
    },
    {
      id: 25,
      volume: 3,
      title_target: 'RIPASSO',
      title_source: 'Review',
      title_it: 'RIPASSO',
      title_en: 'Review',
      dialogue: [],
      grammar: [
        { title: 'Congiuntivo Review', desc: 'Presente (spero che venga), Imperfetto (se venisse), triggers, conjunctions.' },
        { title: 'All Tenses', desc: 'Presente, PP, Imperfetto, Futuro, Condizionale, Congiuntivo Presente, Congiuntivo Imperfetto.' }
      ]
    },
    {
      id: 26,
      volume: 3,
      title_target: 'Dal Nord al Sud',
      title_source: 'Regional Variation',
      title_it: 'Dal Nord al Sud',
      title_en: 'Regional Variation',
      dialogue: [],
      grammar: [
        { title: 'Regional Italian', desc: 'Northern vs Southern pronunciation, vocabulary differences, dialectal influences.' },
        { title: 'Passato Remoto', desc: 'More common in southern/literary Italian. "Andai, feci, dissi." vs PP in spoken northern Italian.' }
      ]
    },
    {
      id: 27,
      volume: 3,
      title_target: 'Modi di Dire',
      title_source: 'Idioms',
      title_it: 'Modi di Dire',
      title_en: 'Idioms',
      dialogue: [],
      grammar: [
        { title: 'Common Idioms', desc: 'In bocca al lupo! (good luck). Acqua in bocca (keep a secret). Non vedo l\'ora (can\'t wait).' },
        { title: 'Proverbs', desc: 'Chi dorme non piglia pesci. Meglio tardi che mai. Tra il dire e il fare c\'\u00e8 di mezzo il mare.' }
      ]
    },
    {
      id: 28,
      volume: 3,
      title_target: 'Notizie e Opinioni',
      title_source: 'News and Opinions',
      title_it: 'Notizie e Opinioni',
      title_en: 'News and Opinions',
      dialogue: [],
      grammar: [
        { title: 'Expressing Opinions', desc: 'Secondo me, a mio parere, credo che, penso che, mi sembra che.' },
        { title: 'Passive Voice', desc: 'essere + past participle: "\u00c8 stato costruito" = It was built. "Viene usato" = It is used.' }
      ]
    },
    {
      id: 29,
      volume: 3,
      title_target: 'Arte e Cultura',
      title_source: 'Art and Culture',
      title_it: 'Arte e Cultura',
      title_en: 'Art and Culture',
      dialogue: [],
      grammar: [
        { title: 'Art & Culture Vocabulary', desc: 'il quadro (painting), la scultura (sculpture), il museo (museum), la mostra (exhibition).' },
        { title: 'Advanced Structures', desc: 'Gerund: stando, facendo. Infinitive constructions: prima di, dopo, senza + infinitive.' }
      ]
    },
    {
      id: 30,
      volume: 3,
      title_target: 'RIPASSO FINALE',
      title_source: 'Final Review',
      title_it: 'RIPASSO FINALE',
      title_en: 'Final Review',
      dialogue: [],
      grammar: [],
      noDrills: true
    },
  ],
};

console.log('Italian course config loaded');
