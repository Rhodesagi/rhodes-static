// ============================================================================
// RHODES SPANISH V2 - COURSE CONFIGURATION
// ============================================================================
// This file contains ALL language-specific data for the Spanish course.
// The engine reads this config and adapts accordingly.

window.COURSE_CONFIG = {
  // ============================================================================
  // IDENTITY
  // ============================================================================
  lang: 'spanish',
  langCode: 'es-ES',
  displayName: 'Spanish',
  courseName: 'Rhodes Spanish | \u00a1Vamos!',
  tagline: 'COMPLETE COURSE',

  // ============================================================================
  // THEME
  // ============================================================================
  theme: {
    accentPrimary: '#AA151B',
    accentLight: '#f5e8e8',
    flagColors: ['#AA151B', '#F1BF00', '#AA151B'],
  },

  // ============================================================================
  // FIELD MAPPINGS
  // ============================================================================
  // Maps generic field names to actual JSON keys in drills
  fields: {
    target: 'spanish_formal',
    targetFormal: 'spanish_formal',
    targetInformal: 'spanish_informal',
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
    chars: ['\u00e1','\u00e9','\u00ed','\u00f3','\u00fa','\u00fc','\u00f1','\u00bf','\u00a1'],
  },

  // ============================================================================
  // STORAGE KEYS
  // ============================================================================
  storage: {
    progress: 'rhodes_spanish_progress',
    sync: 'rhodes_spanish_sync',
    srs: 'rhodes_spanish_srs',
    analytics: 'rhodes_spanish_analytics',
    linear: 'rhodes_spanish_linear',
  },

  // ============================================================================
  // DATA PATHS
  // ============================================================================
  data: {
    drills: 'data/drills.json',
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
  titleHtml: `<div style="display:flex;flex-direction:column;width:30px;height:30px;border:1px solid #333;margin-bottom:8px;">
  <span style="height:25%;background:#AA151B;"></span>
  <span style="height:50%;background:#F1BF00;"></span>
  <span style="height:25%;background:#AA151B;"></span>
</div>
<div style="border:2px solid #333;padding:5px 12px;font-size:24px;font-weight:bold;letter-spacing:3px;display:flex;align-items:center;gap:15px;">
  <span>RHODES SPANISH</span>
  <span style="font-size:14px;font-weight:normal;opacity:0.7;">\u00a1Vamos!</span>
</div>`,

  // ============================================================================
  // FORMAL TO INFORMAL CONVERSION
  // ============================================================================
  convertToInformal: null,

  // ============================================================================
  // VERBS - SPANISH VERB CONJUGATIONS
  // ============================================================================
  verbs: {
    ser: {
      meaning: 'to be (permanent)',
      present: ['soy', 'eres', 'es', 'somos', 'sois', 'son'],
      preterite: ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
      imperfect: ['era', 'eras', 'era', '\u00e9ramos', 'erais', 'eran'],
      future: ['ser\u00e9', 'ser\u00e1s', 'ser\u00e1', 'seremos', 'ser\u00e9is', 'ser\u00e1n'],
      conditional: ['ser\u00eda', 'ser\u00edas', 'ser\u00eda', 'ser\u00edamos', 'ser\u00edais', 'ser\u00edan'],
      subjunctive: ['sea', 'seas', 'sea', 'seamos', 'se\u00e1is', 'sean'],
      imperative: ['s\u00e9', 'sea', 'seamos', 'sed', 'sean'],
      tip: 'Identity, origin, profession, time, characteristics. SER vs ESTAR is the #1 Spanish challenge.'
    },
    estar: {
      meaning: 'to be (temporary)',
      present: ['estoy', 'est\u00e1s', 'est\u00e1', 'estamos', 'est\u00e1is', 'est\u00e1n'],
      preterite: ['estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron'],
      imperfect: ['estaba', 'estabas', 'estaba', 'est\u00e1bamos', 'estabais', 'estaban'],
      future: ['estar\u00e9', 'estar\u00e1s', 'estar\u00e1', 'estaremos', 'estar\u00e9is', 'estar\u00e1n'],
      conditional: ['estar\u00eda', 'estar\u00edas', 'estar\u00eda', 'estar\u00edamos', 'estar\u00edais', 'estar\u00edan'],
      subjunctive: ['est\u00e9', 'est\u00e9s', 'est\u00e9', 'estemos', 'est\u00e9is', 'est\u00e9n'],
      imperative: ['est\u00e1', 'est\u00e9', 'estemos', 'estad', 'est\u00e9n'],
      tip: 'Location, health, emotions, temporary states. Used with past participles for passive/result.'
    },
    tener: {
      meaning: 'to have',
      present: ['tengo', 'tienes', 'tiene', 'tenemos', 'ten\u00e9is', 'tienen'],
      preterite: ['tuve', 'tuviste', 'tuvo', 'tuvimos', 'tuvisteis', 'tuvieron'],
      imperfect: ['ten\u00eda', 'ten\u00edas', 'ten\u00eda', 'ten\u00edamos', 'ten\u00edais', 'ten\u00edan'],
      future: ['tendr\u00e9', 'tendr\u00e1s', 'tendr\u00e1', 'tendremos', 'tendr\u00e9is', 'tendr\u00e1n'],
      conditional: ['tendr\u00eda', 'tendr\u00edas', 'tendr\u00eda', 'tendr\u00edamos', 'tendr\u00edais', 'tendr\u00edan'],
      subjunctive: ['tenga', 'tengas', 'tenga', 'tengamos', 'teng\u00e1is', 'tengan'],
      imperative: ['ten', 'tenga', 'tengamos', 'tened', 'tengan'],
      expressions: ['tener hambre (hungry)', 'tener sed (thirsty)', 'tener calor/fr\u00edo (hot/cold)', 'tener X a\u00f1os (be X years old)', 'tener que (have to)', 'tener ganas de (feel like)', 'tener miedo de (afraid of)', 'tener raz\u00f3n (be right)'],
      tip: 'Used in many expressions where English uses "to be". Tener que + infinitive = must/have to.'
    },
    hacer: {
      meaning: 'to do/make',
      present: ['hago', 'haces', 'hace', 'hacemos', 'hac\u00e9is', 'hacen'],
      preterite: ['hice', 'hiciste', 'hizo', 'hicimos', 'hicisteis', 'hicieron'],
      imperfect: ['hac\u00eda', 'hac\u00edas', 'hac\u00eda', 'hac\u00edamos', 'hac\u00edais', 'hac\u00edan'],
      future: ['har\u00e9', 'har\u00e1s', 'har\u00e1', 'haremos', 'har\u00e9is', 'har\u00e1n'],
      conditional: ['har\u00eda', 'har\u00edas', 'har\u00eda', 'har\u00edamos', 'har\u00edais', 'har\u00edan'],
      subjunctive: ['haga', 'hagas', 'haga', 'hagamos', 'hag\u00e1is', 'hagan'],
      imperative: ['haz', 'haga', 'hagamos', 'haced', 'hagan'],
      tip: 'Weather: hace calor/fr\u00edo/sol/viento. Hace + time = ago.'
    },
    ir: {
      meaning: 'to go',
      present: ['voy', 'vas', 'va', 'vamos', 'vais', 'van'],
      preterite: ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
      imperfect: ['iba', 'ibas', 'iba', '\u00edbamos', 'ibais', 'iban'],
      future: ['ir\u00e9', 'ir\u00e1s', 'ir\u00e1', 'iremos', 'ir\u00e9is', 'ir\u00e1n'],
      conditional: ['ir\u00eda', 'ir\u00edas', 'ir\u00eda', 'ir\u00edamos', 'ir\u00edais', 'ir\u00edan'],
      subjunctive: ['vaya', 'vayas', 'vaya', 'vayamos', 'vay\u00e1is', 'vayan'],
      imperative: ['ve', 'vaya', 'vayamos/vamos', 'id', 'vayan'],
      tip: 'Preterite = same as SER. Ir + a + infinitive = near future (voy a comer = I\'m going to eat).'
    },
    poder: {
      meaning: 'can/to be able',
      present: ['puedo', 'puedes', 'puede', 'podemos', 'pod\u00e9is', 'pueden'],
      preterite: ['pude', 'pudiste', 'pudo', 'pudimos', 'pudisteis', 'pudieron'],
      imperfect: ['pod\u00eda', 'pod\u00edas', 'pod\u00eda', 'pod\u00edamos', 'pod\u00edais', 'pod\u00edan'],
      future: ['podr\u00e9', 'podr\u00e1s', 'podr\u00e1', 'podremos', 'podr\u00e9is', 'podr\u00e1n'],
      conditional: ['podr\u00eda', 'podr\u00edas', 'podr\u00eda', 'podr\u00edamos', 'podr\u00edais', 'podr\u00edan'],
      subjunctive: ['pueda', 'puedas', 'pueda', 'podamos', 'pod\u00e1is', 'puedan'],
      tip: 'Stem-changing o\u2192ue in present. No imperative form.'
    },
    querer: {
      meaning: 'to want/love',
      present: ['quiero', 'quieres', 'quiere', 'queremos', 'quer\u00e9is', 'quieren'],
      preterite: ['quise', 'quisiste', 'quiso', 'quisimos', 'quisisteis', 'quisieron'],
      imperfect: ['quer\u00eda', 'quer\u00edas', 'quer\u00eda', 'quer\u00edamos', 'quer\u00edais', 'quer\u00edan'],
      future: ['querr\u00e9', 'querr\u00e1s', 'querr\u00e1', 'querremos', 'querr\u00e9is', 'querr\u00e1n'],
      conditional: ['querr\u00eda', 'querr\u00edas', 'querr\u00eda', 'querr\u00edamos', 'querr\u00edais', 'querr\u00edan'],
      subjunctive: ['quiera', 'quieras', 'quiera', 'queramos', 'quer\u00e1is', 'quieran'],
      imperative: ['quiere', 'quiera', 'queramos', 'quered', 'quieran'],
      tip: 'Stem-changing e\u2192ie. "Quisiera" (imperfect subjunctive) = polite "I would like".'
    },
    decir: {
      meaning: 'to say/tell',
      present: ['digo', 'dices', 'dice', 'decimos', 'dec\u00eds', 'dicen'],
      preterite: ['dije', 'dijiste', 'dijo', 'dijimos', 'dijisteis', 'dijeron'],
      imperfect: ['dec\u00eda', 'dec\u00edas', 'dec\u00eda', 'dec\u00edamos', 'dec\u00edais', 'dec\u00edan'],
      future: ['dir\u00e9', 'dir\u00e1s', 'dir\u00e1', 'diremos', 'dir\u00e9is', 'dir\u00e1n'],
      conditional: ['dir\u00eda', 'dir\u00edas', 'dir\u00eda', 'dir\u00edamos', 'dir\u00edais', 'dir\u00edan'],
      subjunctive: ['diga', 'digas', 'diga', 'digamos', 'dig\u00e1is', 'digan'],
      imperative: ['di', 'diga', 'digamos', 'decid', 'digan'],
      tip: 'Irregular past participle: dicho. Preterite stem: dij-.'
    },
    saber: {
      meaning: 'to know (facts)',
      present: ['s\u00e9', 'sabes', 'sabe', 'sabemos', 'sab\u00e9is', 'saben'],
      preterite: ['supe', 'supiste', 'supo', 'supimos', 'supisteis', 'supieron'],
      imperfect: ['sab\u00eda', 'sab\u00edas', 'sab\u00eda', 'sab\u00edamos', 'sab\u00edais', 'sab\u00edan'],
      future: ['sabr\u00e9', 'sabr\u00e1s', 'sabr\u00e1', 'sabremos', 'sabr\u00e9is', 'sabr\u00e1n'],
      conditional: ['sabr\u00eda', 'sabr\u00edas', 'sabr\u00eda', 'sabr\u00edamos', 'sabr\u00edais', 'sabr\u00edan'],
      subjunctive: ['sepa', 'sepas', 'sepa', 'sepamos', 'sep\u00e1is', 'sepan'],
      imperative: ['sabe', 'sepa', 'sepamos', 'sabed', 'sepan'],
      tip: 'Know facts or how to do something. Compare with conocer.'
    },
    conocer: {
      meaning: 'to know (people/places)',
      present: ['conozco', 'conoces', 'conoce', 'conocemos', 'conoc\u00e9is', 'conocen'],
      preterite: ['conoc\u00ed', 'conociste', 'conoci\u00f3', 'conocimos', 'conocisteis', 'conocieron'],
      imperfect: ['conoc\u00eda', 'conoc\u00edas', 'conoc\u00eda', 'conoc\u00edamos', 'conoc\u00edais', 'conoc\u00edan'],
      future: ['conocer\u00e9', 'conocer\u00e1s', 'conocer\u00e1', 'conoceremos', 'conocer\u00e9is', 'conocer\u00e1n'],
      conditional: ['conocer\u00eda', 'conocer\u00edas', 'conocer\u00eda', 'conocer\u00edamos', 'conocer\u00edais', 'conocer\u00edan'],
      subjunctive: ['conozca', 'conozcas', 'conozca', 'conozcamos', 'conozc\u00e1is', 'conozcan'],
      tip: 'Know through familiarity. -zco in yo form.'
    },
    venir: {
      meaning: 'to come',
      present: ['vengo', 'vienes', 'viene', 'venimos', 'ven\u00eds', 'vienen'],
      preterite: ['vine', 'viniste', 'vino', 'vinimos', 'vinisteis', 'vinieron'],
      imperfect: ['ven\u00eda', 'ven\u00edas', 'ven\u00eda', 'ven\u00edamos', 'ven\u00edais', 'ven\u00edan'],
      future: ['vendr\u00e9', 'vendr\u00e1s', 'vendr\u00e1', 'vendremos', 'vendr\u00e9is', 'vendr\u00e1n'],
      conditional: ['vendr\u00eda', 'vendr\u00edas', 'vendr\u00eda', 'vendr\u00edamos', 'vendr\u00edais', 'vendr\u00edan'],
      subjunctive: ['venga', 'vengas', 'venga', 'vengamos', 'veng\u00e1is', 'vengan'],
      imperative: ['ven', 'venga', 'vengamos', 'venid', 'vengan'],
      tip: 'Stem-changing e\u2192ie. Irregular preterite stem: vin-.'
    },
    dar: {
      meaning: 'to give',
      present: ['doy', 'das', 'da', 'damos', 'dais', 'dan'],
      preterite: ['di', 'diste', 'dio', 'dimos', 'disteis', 'dieron'],
      imperfect: ['daba', 'dabas', 'daba', 'd\u00e1bamos', 'dabais', 'daban'],
      future: ['dar\u00e9', 'dar\u00e1s', 'dar\u00e1', 'daremos', 'dar\u00e9is', 'dar\u00e1n'],
      conditional: ['dar\u00eda', 'dar\u00edas', 'dar\u00eda', 'dar\u00edamos', 'dar\u00edais', 'dar\u00edan'],
      subjunctive: ['d\u00e9', 'des', 'd\u00e9', 'demos', 'deis', 'den'],
      imperative: ['da', 'd\u00e9', 'demos', 'dad', 'den'],
      tip: 'Short -ar verb. Preterite has no accents (di, dio).'
    },
    ver: {
      meaning: 'to see',
      present: ['veo', 'ves', 've', 'vemos', 'veis', 'ven'],
      preterite: ['vi', 'viste', 'vio', 'vimos', 'visteis', 'vieron'],
      imperfect: ['ve\u00eda', 've\u00edas', 've\u00eda', 've\u00edamos', 've\u00edais', 've\u00edan'],
      future: ['ver\u00e9', 'ver\u00e1s', 'ver\u00e1', 'veremos', 'ver\u00e9is', 'ver\u00e1n'],
      conditional: ['ver\u00eda', 'ver\u00edas', 'ver\u00eda', 'ver\u00edamos', 'ver\u00edais', 'ver\u00edan'],
      subjunctive: ['vea', 'veas', 'vea', 'veamos', 've\u00e1is', 'vean'],
      imperative: ['ve', 'vea', 'veamos', 'ved', 'vean'],
      tip: 'Irregular past participle: visto. Imperfect retains -e\u00eda-.'
    },
    salir: {
      meaning: 'to leave/go out',
      present: ['salgo', 'sales', 'sale', 'salimos', 'sal\u00eds', 'salen'],
      preterite: ['sal\u00ed', 'saliste', 'sali\u00f3', 'salimos', 'salisteis', 'salieron'],
      imperfect: ['sal\u00eda', 'sal\u00edas', 'sal\u00eda', 'sal\u00edamos', 'sal\u00edais', 'sal\u00edan'],
      future: ['saldr\u00e9', 'saldr\u00e1s', 'saldr\u00e1', 'saldremos', 'saldr\u00e9is', 'saldr\u00e1n'],
      conditional: ['saldr\u00eda', 'saldr\u00edas', 'saldr\u00eda', 'saldr\u00edamos', 'saldr\u00edais', 'saldr\u00edan'],
      subjunctive: ['salga', 'salgas', 'salga', 'salgamos', 'salg\u00e1is', 'salgan'],
      imperative: ['sal', 'salga', 'salgamos', 'salid', 'salgan'],
      tip: '-go in yo form. Irregular future/conditional stem: saldr-.'
    },
    poner: {
      meaning: 'to put',
      present: ['pongo', 'pones', 'pone', 'ponemos', 'pon\u00e9is', 'ponen'],
      preterite: ['puse', 'pusiste', 'puso', 'pusimos', 'pusisteis', 'pusieron'],
      imperfect: ['pon\u00eda', 'pon\u00edas', 'pon\u00eda', 'pon\u00edamos', 'pon\u00edais', 'pon\u00edan'],
      future: ['pondr\u00e9', 'pondr\u00e1s', 'pondr\u00e1', 'pondremos', 'pondr\u00e9is', 'pondr\u00e1n'],
      conditional: ['pondr\u00eda', 'pondr\u00edas', 'pondr\u00eda', 'pondr\u00edamos', 'pondr\u00edais', 'pondr\u00edan'],
      subjunctive: ['ponga', 'pongas', 'ponga', 'pongamos', 'pong\u00e1is', 'pongan'],
      imperative: ['pon', 'ponga', 'pongamos', 'poned', 'pongan'],
      tip: 'Irregular past participle: puesto. Also: suponer, componer, proponer.'
    },
    hablar: {
      meaning: 'to speak/talk',
      present: ['hablo', 'hablas', 'habla', 'hablamos', 'habl\u00e1is', 'hablan'],
      preterite: ['habl\u00e9', 'hablaste', 'habl\u00f3', 'hablamos', 'hablasteis', 'hablaron'],
      imperfect: ['hablaba', 'hablabas', 'hablaba', 'habl\u00e1bamos', 'hablabais', 'hablaban'],
      future: ['hablar\u00e9', 'hablar\u00e1s', 'hablar\u00e1', 'hablaremos', 'hablar\u00e9is', 'hablar\u00e1n'],
      conditional: ['hablar\u00eda', 'hablar\u00edas', 'hablar\u00eda', 'hablar\u00edamos', 'hablar\u00edais', 'hablar\u00edan'],
      subjunctive: ['hable', 'hables', 'hable', 'hablemos', 'habl\u00e9is', 'hablen'],
      imperative: ['habla', 'hable', 'hablemos', 'hablad', 'hablen'],
      tip: 'Model regular -AR verb. All regular -AR verbs follow this pattern.'
    },
    comer: {
      meaning: 'to eat',
      present: ['como', 'comes', 'come', 'comemos', 'com\u00e9is', 'comen'],
      preterite: ['com\u00ed', 'comiste', 'comi\u00f3', 'comimos', 'comisteis', 'comieron'],
      imperfect: ['com\u00eda', 'com\u00edas', 'com\u00eda', 'com\u00edamos', 'com\u00edais', 'com\u00edan'],
      future: ['comer\u00e9', 'comer\u00e1s', 'comer\u00e1', 'comeremos', 'comer\u00e9is', 'comer\u00e1n'],
      conditional: ['comer\u00eda', 'comer\u00edas', 'comer\u00eda', 'comer\u00edamos', 'comer\u00edais', 'comer\u00edan'],
      subjunctive: ['coma', 'comas', 'coma', 'comamos', 'com\u00e1is', 'coman'],
      imperative: ['come', 'coma', 'comamos', 'comed', 'coman'],
      tip: 'Model regular -ER verb.'
    },
    vivir: {
      meaning: 'to live',
      present: ['vivo', 'vives', 'vive', 'vivimos', 'viv\u00eds', 'viven'],
      preterite: ['viv\u00ed', 'viviste', 'vivi\u00f3', 'vivimos', 'vivisteis', 'vivieron'],
      imperfect: ['viv\u00eda', 'viv\u00edas', 'viv\u00eda', 'viv\u00edamos', 'viv\u00edais', 'viv\u00edan'],
      future: ['vivir\u00e9', 'vivir\u00e1s', 'vivir\u00e1', 'viviremos', 'vivir\u00e9is', 'vivir\u00e1n'],
      conditional: ['vivir\u00eda', 'vivir\u00edas', 'vivir\u00eda', 'vivir\u00edamos', 'vivir\u00edais', 'vivir\u00edan'],
      subjunctive: ['viva', 'vivas', 'viva', 'vivamos', 'viv\u00e1is', 'vivan'],
      imperative: ['vive', 'viva', 'vivamos', 'vivid', 'vivan'],
      tip: 'Model regular -IR verb.'
    },
    trabajar: {
      meaning: 'to work',
      present: ['trabajo', 'trabajas', 'trabaja', 'trabajamos', 'trabaj\u00e1is', 'trabajan'],
      preterite: ['trabaj\u00e9', 'trabajaste', 'trabaj\u00f3', 'trabajamos', 'trabajasteis', 'trabajaron'],
      imperfect: ['trabajaba', 'trabajabas', 'trabajaba', 'trabaj\u00e1bamos', 'trabajabais', 'trabajaban'],
      future: ['trabajar\u00e9', 'trabajar\u00e1s', 'trabajar\u00e1', 'trabajaremos', 'trabajar\u00e9is', 'trabajar\u00e1n'],
      conditional: ['trabajar\u00eda', 'trabajar\u00edas', 'trabajar\u00eda', 'trabajar\u00edamos', 'trabajar\u00edais', 'trabajar\u00edan'],
      subjunctive: ['trabaje', 'trabajes', 'trabaje', 'trabajemos', 'trabaj\u00e9is', 'trabajen'],
      imperative: ['trabaja', 'trabaje', 'trabajemos', 'trabajad', 'trabajen'],
      tip: 'Regular -AR verb. Common in work/employment contexts.'
    },
    llamar: {
      meaning: 'to call',
      present: ['llamo', 'llamas', 'llama', 'llamamos', 'llam\u00e1is', 'llaman'],
      preterite: ['llam\u00e9', 'llamaste', 'llam\u00f3', 'llamamos', 'llamasteis', 'llamaron'],
      imperfect: ['llamaba', 'llamabas', 'llamaba', 'llam\u00e1bamos', 'llamabais', 'llamaban'],
      future: ['llamar\u00e9', 'llamar\u00e1s', 'llamar\u00e1', 'llamaremos', 'llamar\u00e9is', 'llamar\u00e1n'],
      conditional: ['llamar\u00eda', 'llamar\u00edas', 'llamar\u00eda', 'llamar\u00edamos', 'llamar\u00edais', 'llamar\u00edan'],
      subjunctive: ['llame', 'llames', 'llame', 'llamemos', 'llam\u00e9is', 'llamen'],
      imperative: ['llama', 'llame', 'llamemos', 'llamad', 'llamen'],
      tip: 'Llamarse = reflexive form for names. Me llamo = My name is.'
    },
  },

  // ============================================================================
  // CONFUSABLE WORDS
  // ============================================================================
  confusables: {
    // SER vs ESTAR
    soy: { confusesWith: 'estoy', hint: 'SOY = permanent identity/origin. ESTOY = temporary state/location.' },
    eres: { confusesWith: 'est\u00e1s', hint: 'ERES = who/what you are. EST\u00c1S = how/where you are.' },
    es: { confusesWith: 'est\u00e1', hint: 'ES = definition/profession/time. EST\u00c1 = condition/location.' },
    estoy: { confusesWith: 'soy', hint: 'ESTOY = temporary state/feeling. SOY = permanent identity.' },
    'est\u00e1': { confusesWith: 'es', hint: 'EST\u00c1 = location/health/emotion. ES = essence/identity.' },

    // SABER vs CONOCER
    's\u00e9': { confusesWith: 'conozco', hint: 'S\u00c9 = know facts/how to do. CONOZCO = be familiar with person/place.' },
    sabes: { confusesWith: 'conoces', hint: 'SABER = knowledge/skills. CONOCER = acquaintance/familiarity.' },
    conozco: { confusesWith: 's\u00e9', hint: 'CONOZCO = I know (person/place). S\u00c9 = I know (fact/skill).' },

    // POR vs PARA
    por: { confusesWith: 'para', hint: 'POR = because of, through, exchange, duration. PARA = purpose, destination, deadline.' },
    para: { confusesWith: 'por', hint: 'PARA = for (purpose/recipient/deadline). POR = for (reason/exchange/duration).' },

    // Preterite vs Imperfect
    fui: { confusesWith: 'era/iba', hint: 'FUI = I went/was (completed action). ERA/IBA = I was going/used to (ongoing).' },
    fue: { confusesWith: 'era', hint: 'FUE = it was (event). ERA = it was (description/ongoing).' },
    hice: { confusesWith: 'hac\u00eda', hint: 'HICE = I did (completed). HAC\u00cdA = I was doing/used to do.' },

    // Direct vs Indirect Objects
    lo: { confusesWith: 'le', hint: 'LO = him/it (direct object). LE = to him (indirect object).' },
    la: { confusesWith: 'le', hint: 'LA = her/it (direct object). LE = to her (indirect object).' },
    le: { confusesWith: 'lo/la', hint: 'LE = to him/her (indirect). LO/LA = him/her/it (direct).' },

    // TU vs TU
    'tu': { confusesWith: 't\u00fa', hint: 'TU (no accent) = your. T\u00da (accent) = you.' },

    // Gender
    el: { confusesWith: 'la', hint: 'EL = the (masculine). LA = the (feminine). Check noun gender!' },
    un: { confusesWith: 'una', hint: 'UN = a (masculine). UNA = a (feminine). Check noun gender!' },

    // False friends
    actualmente: { confusesWith: 'actually', hint: 'ACTUALMENTE = currently/nowadays. Actually = en realidad.' },
    embarazada: { confusesWith: 'embarrassed', hint: 'EMBARAZADA = pregnant. Embarrassed = avergonzado/a.' },
    asistir: { confusesWith: 'assist', hint: 'ASISTIR = to attend. To assist = ayudar.' },
    realizar: { confusesWith: 'realize', hint: 'REALIZAR = to accomplish/carry out. To realize = darse cuenta.' },
  },

  // ============================================================================
  // GRAMMAR PATTERN DETECTION
  // ============================================================================
  detectGrammarPatterns(spanish, english) {
    const hints = [];
    const esLower = spanish.toLowerCase();
    const esWords = esLower.split(/\s+/);
    const hasWord = (words) => words.some(w => esWords.includes(w));

    // Verb detection
    const verbs = window.COURSE_CONFIG?.verbs || {};
    for (const [verb, data] of Object.entries(verbs)) {
      const allForms = [];
      if (data.present) allForms.push(...data.present);
      if (data.preterite) allForms.push(...data.preterite);
      if (data.imperfect) allForms.push(...data.imperfect);
      if (data.future) allForms.push(...data.future);
      if (data.conditional) allForms.push(...data.conditional);

      const validForms = allForms.filter(f => f !== null);

      if (hasWord(validForms)) {
        let hint = verb.toUpperCase() + ' (' + data.meaning + ')';
        if (data.tip) hint += ': ' + data.tip;
        hints.push(hint);
        break;
      }
    }

    // SER vs ESTAR
    if (hasWord(['soy', 'eres', 'es', 'somos', 'son', 'era', 'fue'])) {
      hints.push('SER: identity, origin, profession, time, characteristics');
    } else if (hasWord(['estoy', 'est\u00e1s', 'est\u00e1', 'estamos', 'est\u00e1n', 'estaba', 'estuvo'])) {
      hints.push('ESTAR: location, health, emotions, temporary states');
    }

    // Negation
    if (esLower.includes('no ')) {
      let neg = 'no (not)';
      if (esLower.includes(' nunca')) neg = 'nunca (never)';
      else if (esLower.includes(' nada')) neg = 'nada (nothing)';
      else if (esLower.includes(' nadie')) neg = 'nadie (no one)';
      else if (esLower.includes(' tampoco')) neg = 'tampoco (neither)';
      hints.push('NEGATION: ' + neg);
    }

    return hints.length > 0 ? hints.slice(0, 2).join(' | ') : 'Basic vocabulary';
  },

  // ============================================================================
  // UNITS DATA - ALL 30 SPANISH UNITS
  // ============================================================================
  units: [
    // PHASE 1: FUNDAMENTOS (Foundation) - Units 1-5
    {
      id: 1,
      volume: 1,
      title_target: 'Primeros Contactos',
      title_source: 'First Contacts',
      title_es: 'Primeros Contactos',
      title_en: 'First Contacts',
      dialogue: [
        { speaker: 'MAR\u00cdA', es: 'Buenos d\u00edas, se\u00f1or.', en: 'Good morning, sir.' },
        { speaker: 'CARLOS', es: 'Buenos d\u00edas, se\u00f1ora.', en: 'Good morning, ma\'am.' },
        { speaker: 'MAR\u00cdA', es: 'Me llamo Mar\u00eda Garc\u00eda. \u00bfC\u00f3mo se llama usted?', en: 'My name is Mar\u00eda Garc\u00eda. What is your name?' },
        { speaker: 'CARLOS', es: 'Me llamo Carlos Rodr\u00edguez. Mucho gusto.', en: 'My name is Carlos Rodr\u00edguez. Pleased to meet you.' },
        { speaker: 'MAR\u00cdA', es: 'Mucho gusto. \u00bfDe d\u00f3nde es usted?', en: 'Pleased to meet you. Where are you from?' },
        { speaker: 'CARLOS', es: 'Soy de M\u00e9xico. \u00bfY usted?', en: 'I\'m from Mexico. And you?' },
        { speaker: 'MAR\u00cdA', es: 'Soy de Espa\u00f1a, de Madrid.', en: 'I\'m from Spain, from Madrid.' },
        { speaker: 'CARLOS', es: '\u00a1Ah, qu\u00e9 interesante! \u00bfEs usted profesora?', en: 'Ah, how interesting! Are you a professor?' },
        { speaker: 'MAR\u00cdA', es: 'S\u00ed, soy profesora de espa\u00f1ol. \u00bfY usted?', en: 'Yes, I\'m a Spanish professor. And you?' },
        { speaker: 'CARLOS', es: 'Soy m\u00e9dico.', en: 'I\'m a doctor.' },
        { speaker: 'MAR\u00cdA', es: 'Encantada de conocerlo. Hasta luego.', en: 'Delighted to meet you. See you later.' },
        { speaker: 'CARLOS', es: 'Igualmente. Hasta luego.', en: 'Likewise. See you later.' },
      ],
      grammar: [
        { title: 'Subject Pronouns', desc: 'yo, t\u00fa, \u00e9l/ella/usted, nosotros, ustedes, ellos/ellas' },
        { title: 'Verb: SER (present)', desc: 'soy, eres, es, somos, son - identity, origin, profession' },
        { title: 'Greetings', desc: 'Hola, Buenos d\u00edas, Buenas tardes, \u00bfC\u00f3mo est\u00e1?' },
        { title: 'Formal vs Informal', desc: 't\u00fa (informal) vs usted (formal)' }
      ]
    },
    {
      id: 2,
      volume: 1,
      title_target: '\u00bfDe D\u00f3nde Eres?',
      title_source: 'Where Are You From?',
      title_es: '\u00bfDe D\u00f3nde Eres?',
      title_en: 'Where Are You From?',
      dialogue: [
        { speaker: 'RECEPCIONISTA', es: 'Buenos d\u00edas. Bienvenido a la universidad.', en: 'Good morning. Welcome to the university.' },
        { speaker: 'CARLOS', es: 'Buenos d\u00edas. Gracias.', en: 'Good morning. Thank you.' },
        { speaker: 'RECEPCIONISTA', es: '\u00bfC\u00f3mo se llama usted?', en: 'What is your name?' },
        { speaker: 'CARLOS', es: 'Me llamo Carlos Mendoza.', en: 'My name is Carlos Mendoza.' },
        { speaker: 'RECEPCIONISTA', es: '\u00bfDe qu\u00e9 pa\u00eds es usted, se\u00f1or Mendoza?', en: 'What country are you from, Mr. Mendoza?' },
        { speaker: 'CARLOS', es: 'Soy de Chile, de Santiago.', en: 'I\'m from Chile, from Santiago.' },
        { speaker: 'RECEPCIONISTA', es: 'Ah, es usted chileno. \u00bfCu\u00e1l es su profesi\u00f3n?', en: 'Ah, you\'re Chilean. What is your profession?' },
        { speaker: 'CARLOS', es: 'Soy ingeniero. Estudio aqu\u00ed para una maestr\u00eda.', en: 'I\'m an engineer. I\'m studying here for a master\'s.' },
        { speaker: 'RECEPCIONISTA', es: 'Muy bien. \u00bfHabla usted ingl\u00e9s?', en: 'Very good. Do you speak English?' },
        { speaker: 'CARLOS', es: 'S\u00ed, hablo ingl\u00e9s y un poco de portugu\u00e9s.', en: 'Yes, I speak English and a little Portuguese.' },
      ],
      grammar: [
        { title: 'SER for Origin', desc: 'Soy de M\u00e9xico. \u00bfDe d\u00f3nde eres?' },
        { title: 'Nationalities', desc: 'mexicano/a, espa\u00f1ol/a, americano/a - gender agreement' },
        { title: 'Definite Articles', desc: 'el (m), la (f), los (m.pl), las (f.pl)' },
        { title: 'Countries & Languages', desc: 'Espa\u00f1a/espa\u00f1ol, M\u00e9xico/mexicano' }
      ]
    },
    {
      id: 3,
      volume: 1,
      title_target: '\u00bfC\u00f3mo Est\u00e1s?',
      title_source: 'How Are You?',
      title_es: '\u00bfC\u00f3mo Est\u00e1s?',
      title_en: 'How Are You?',
      dialogue: [
        { speaker: 'SR. GARC\u00cdA', es: 'Buenos d\u00edas, se\u00f1ora L\u00f3pez. \u00bfC\u00f3mo est\u00e1 usted?', en: 'Good morning, Mrs. L\u00f3pez. How are you?' },
        { speaker: 'SRA. L\u00d3PEZ', es: 'Buenos d\u00edas. Estoy muy bien, gracias. \u00bfY usted?', en: 'Good morning. I\'m very well, thank you. And you?' },
        { speaker: 'SR. GARC\u00cdA', es: 'Estoy un poco cansado hoy.', en: 'I\'m a little tired today.' },
        { speaker: 'SRA. L\u00d3PEZ', es: 'Lo siento. \u00bfEst\u00e1 usted enfermo?', en: 'I\'m sorry. Are you sick?' },
        { speaker: 'SR. GARC\u00cdA', es: 'No, no estoy enfermo. Solo estoy cansado.', en: 'No, I\'m not sick. I\'m just tired.' },
        { speaker: 'SRA. L\u00d3PEZ', es: '\u00bfD\u00f3nde est\u00e1 el informe?', en: 'Where is the report?' },
        { speaker: 'SR. GARC\u00cdA', es: 'Est\u00e1 en mi escritorio.', en: 'It\'s on my desk.' },
        { speaker: 'SRA. L\u00d3PEZ', es: '\u00bfY la reuni\u00f3n? \u00bfD\u00f3nde es?', en: 'And the meeting? Where is it?' },
        { speaker: 'SR. GARC\u00cdA', es: 'Es en la sala de conferencias. Est\u00e1 en el segundo piso.', en: 'It\'s in the conference room. It\'s on the second floor.' },
      ],
      grammar: [
        { title: 'Verb: ESTAR (present)', desc: 'estoy, est\u00e1s, est\u00e1, estamos, est\u00e1n' },
        { title: 'SER vs ESTAR', desc: 'SER: permanent traits. ESTAR: temporary states, location' },
        { title: 'Common Adjectives', desc: 'bien, mal, cansado, contento, enfermo' },
        { title: 'Basic Questions', desc: '\u00bfC\u00f3mo est\u00e1s? \u00bfQu\u00e9 tal? \u00bfY t\u00fa?' }
      ]
    },
    {
      id: 4,
      volume: 1,
      title_target: 'Mi Familia',
      title_source: 'My Family',
      title_es: 'Mi Familia',
      title_en: 'My Family',
      dialogue: [
        { speaker: 'SR. RUIZ', es: 'Se\u00f1ora Vargas, \u00bftiene usted familia aqu\u00ed?', en: 'Mrs. Vargas, do you have family here?' },
        { speaker: 'SRA. VARGAS', es: 'S\u00ed, tengo a mi esposo y a mis dos hijos.', en: 'Yes, I have my husband and my two children.' },
        { speaker: 'SR. RUIZ', es: '\u00a1Qu\u00e9 bien! \u00bfCu\u00e1ntos a\u00f1os tienen sus hijos?', en: 'How nice! How old are your children?' },
        { speaker: 'SRA. VARGAS', es: 'Mi hijo tiene quince a\u00f1os y mi hija tiene doce.', en: 'My son is fifteen and my daughter is twelve.' },
        { speaker: 'SR. RUIZ', es: '\u00bfY sus padres? \u00bfViven aqu\u00ed tambi\u00e9n?', en: 'And your parents? Do they live here too?' },
        { speaker: 'SRA. VARGAS', es: 'No, mis padres viven en Monterrey.', en: 'No, my parents live in Monterrey.' },
        { speaker: 'SR. RUIZ', es: '\u00bfTiene usted hermanos?', en: 'Do you have siblings?' },
        { speaker: 'SRA. VARGAS', es: 'S\u00ed, tengo dos hermanos y una hermana.', en: 'Yes, I have two brothers and one sister.' },
      ],
      grammar: [
        { title: 'Verb: TENER (present)', desc: 'tengo, tienes, tiene, tenemos, tienen' },
        { title: 'Possessives', desc: 'mi/mis, tu/tus, su/sus, nuestro/a' },
        { title: 'Family Vocabulary', desc: 'madre, padre, hermano/a, hijo/a, abuelo/a' },
        { title: 'Numbers 1-20', desc: 'uno, dos, tres... veinte' }
      ]
    },
    {
      id: 5,
      volume: 1,
      title_target: 'Repaso 1',
      title_source: 'Review 1',
      title_es: 'Repaso 1',
      title_en: 'Review 1',
      dialogue: [
        { speaker: 'MODERADOR', es: 'Buenos d\u00edas. \u00bfEs usted el Doctor Silva?', en: 'Good morning. Are you Doctor Silva?' },
        { speaker: 'DR. SILVA', es: 'S\u00ed, soy yo. Mucho gusto.', en: 'Yes, that\'s me. Nice to meet you.' },
        { speaker: 'MODERADOR', es: '\u00bfDe d\u00f3nde es usted?', en: 'Where are you from?' },
        { speaker: 'DR. SILVA', es: 'Soy brasile\u00f1o, de S\u00e3o Paulo, pero ahora estoy viviendo en Buenos Aires.', en: 'I\'m Brazilian, from S\u00e3o Paulo, but now I\'m living in Buenos Aires.' },
      ],
      grammar: [
        { title: 'Review Unit', desc: 'Consolidation of SER, ESTAR, TENER - Units 1-4' }
      ]
    },
    // PHASE 1: VIDA DIARIA (Daily Life) - Units 6-10
    {
      id: 6,
      volume: 1,
      title_target: '\u00bfQu\u00e9 Hora Es?',
      title_source: 'What Time Is It?',
      title_es: '\u00bfQu\u00e9 Hora Es?',
      title_en: 'What Time Is It?',
      dialogue: [
        { speaker: 'SECRETARIA', es: 'Buenos d\u00edas. \u00bfA qu\u00e9 hora es su reuni\u00f3n?', en: 'Good morning. What time is your meeting?' },
        { speaker: 'SR. MART\u00cdNEZ', es: 'Es a las diez de la ma\u00f1ana. \u00bfQu\u00e9 hora es ahora?', en: 'It\'s at ten in the morning. What time is it now?' },
        { speaker: 'SECRETARIA', es: 'Son las nueve y media. Tiene treinta minutos.', en: 'It\'s nine thirty. You have thirty minutes.' },
        { speaker: 'SR. MART\u00cdNEZ', es: '\u00bfA qu\u00e9 hora termina la reuni\u00f3n?', en: 'What time does the meeting end?' },
        { speaker: 'SECRETARIA', es: 'Termina a las once y cuarto.', en: 'It ends at eleven fifteen.' },
        { speaker: 'SR. MART\u00cdNEZ', es: '\u00bfA qu\u00e9 hora abre el restaurante?', en: 'What time does the restaurant open?' },
        { speaker: 'SECRETARIA', es: 'Abre a las doce y media.', en: 'It opens at twelve thirty.' },
      ],
      grammar: [
        { title: 'Telling Time', desc: 'Es la una. Son las dos. y cuarto, y media, menos cuarto' },
        { title: 'Days of the Week', desc: 'lunes, martes, mi\u00e9rcoles, jueves, viernes, s\u00e1bado, domingo' },
        { title: 'Verb: IR (present)', desc: 'voy, vas, va, vamos, van' },
        { title: 'IR + a + infinitive', desc: 'Voy a estudiar. Van a comer. (near future)' }
      ]
    },
    {
      id: 7,
      volume: 1,
      title_target: 'En el Restaurante',
      title_source: 'At the Restaurant',
      title_es: 'En el Restaurante',
      title_en: 'At the Restaurant',
      dialogue: [
        { speaker: 'MESERO', es: 'Buenas noches. \u00bfTiene usted reservaci\u00f3n?', en: 'Good evening. Do you have a reservation?' },
        { speaker: 'CLIENTE', es: 'S\u00ed, a nombre de Garc\u00eda.', en: 'Yes, under the name Garc\u00eda.' },
        { speaker: 'MESERO', es: 'Por aqu\u00ed, por favor. \u00bfDesea algo de beber?', en: 'This way, please. Would you like something to drink?' },
        { speaker: 'CLIENTE', es: 'S\u00ed, una copa de vino tinto, por favor.', en: 'Yes, a glass of red wine, please.' },
        { speaker: 'MESERO', es: '\u00bfQu\u00e9 me recomienda?', en: 'What do you recommend?' },
        { speaker: 'CLIENTE', es: 'El pescado del d\u00eda est\u00e1 muy bueno.', en: 'The fish of the day is very good.' },
        { speaker: 'MESERO', es: 'El flan, por favor. Y la cuenta cuando termine.', en: 'The flan, please. And the check when I finish.' },
      ],
      grammar: [
        { title: 'Stem-Changing: e\u2192ie', desc: 'querer: quiero, quieres, quiere, queremos' },
        { title: 'Stem-Changing: o\u2192ue', desc: 'poder: puedo, puedes, puede, podemos' },
        { title: 'Food Vocabulary', desc: 'comida, bebida, men\u00fa, cuenta, propina' },
        { title: 'Ordering', desc: 'Quisiera... Me gustar\u00eda... \u00bfMe trae...?' }
      ]
    },
    {
      id: 8,
      volume: 1,
      title_target: 'De Compras',
      title_source: 'Shopping',
      title_es: 'De Compras',
      title_en: 'Shopping',
      dialogue: [
        { speaker: 'CLIENTE', es: 'Buenas tardes. Busco una camisa.', en: 'Good afternoon. I\'m looking for a shirt.' },
        { speaker: 'VENDEDOR', es: '\u00bfDe qu\u00e9 color la busca?', en: 'What color are you looking for?' },
        { speaker: 'CLIENTE', es: 'Azul o blanca. Uso talla mediana.', en: 'Blue or white. I wear medium.' },
        { speaker: 'VENDEDOR', es: '\u00bfCu\u00e1nto cuesta?', en: 'How much does it cost?' },
        { speaker: 'CLIENTE', es: 'Esta cuesta ochocientos pesos.', en: 'This one costs 800 pesos.' },
        { speaker: 'VENDEDOR', es: 'Me queda bien. Me la llevo.', en: 'It fits well. I\'ll take it.' },
        { speaker: 'CLIENTE', es: '\u00bfPaga en efectivo o con tarjeta?', en: 'Cash or card?' },
      ],
      grammar: [
        { title: 'Demonstratives', desc: 'este/esta/esto, ese/esa/eso, aquel/aquella' },
        { title: 'Colors', desc: 'rojo, azul, verde, amarillo, negro, blanco' },
        { title: 'Clothing', desc: 'camisa, pantalones, zapatos, vestido' },
        { title: 'Numbers 20-100', desc: 'veinte, treinta, cuarenta... cien' }
      ]
    },
    {
      id: 9,
      volume: 1,
      title_target: 'La Casa',
      title_source: 'The House',
      title_es: 'La Casa',
      title_en: 'The House',
      dialogue: [
        { speaker: 'JEFA', es: '\u00bfA qu\u00e9 hora se levanta usted normalmente?', en: 'What time do you usually get up?' },
        { speaker: 'CANDIDATO', es: 'Me levanto a las seis de la ma\u00f1ana.', en: 'I get up at six in the morning.' },
        { speaker: 'JEFA', es: '\u00bfY qu\u00e9 hace despu\u00e9s?', en: 'And what do you do after?' },
        { speaker: 'CANDIDATO', es: 'Me ducho, me visto y desayuno.', en: 'I shower, get dressed, and have breakfast.' },
        { speaker: 'JEFA', es: '\u00bfA qu\u00e9 hora sale de su casa?', en: 'What time do you leave your house?' },
        { speaker: 'CANDIDATO', es: 'Salgo a las siete y media.', en: 'I leave at seven thirty.' },
      ],
      grammar: [
        { title: 'Rooms', desc: 'cocina, ba\u00f1o, dormitorio, sala, comedor' },
        { title: 'Furniture', desc: 'mesa, silla, cama, sof\u00e1, escritorio' },
        { title: 'HAY vs ESTAR', desc: 'Hay una mesa (existence) vs La mesa est\u00e1 aqu\u00ed (location)' },
        { title: 'Prepositions', desc: 'en, sobre, debajo de, al lado de, detr\u00e1s de' }
      ]
    },
    {
      id: 10,
      volume: 1,
      title_target: 'Repaso 2',
      title_source: 'Review 2',
      title_es: 'Repaso 2',
      title_en: 'Review 2',
      dialogue: [
        { speaker: 'A', es: 'Me levanto a las seis y media todos los d\u00edas.', en: 'I get up at six thirty every day.' },
        { speaker: 'A', es: 'Primero me ducho y despu\u00e9s me visto.', en: 'First I shower and then I get dressed.' },
        { speaker: 'A', es: 'Desayuno a las siete. Siempre tomo caf\u00e9 con tostadas.', en: 'I have breakfast at seven. I always have coffee with toast.' },
        { speaker: 'A', es: 'Me acuesto a las once. Ma\u00f1ana tengo otro d\u00eda ocupado.', en: 'I go to bed at eleven. Tomorrow I have another busy day.' },
      ],
      grammar: [
        { title: 'Review Unit', desc: 'Integration of Units 6-9: time, stem-changing, shopping, house' }
      ]
    },
    // PHASE 1: SOCIAL - Units 11-15
    {
      id: 11,
      volume: 1,
      title_target: 'Planes y Citas',
      title_source: 'Plans and Dates',
      title_es: 'Planes y Citas',
      title_en: 'Plans and Dates',
      dialogue: [
        { speaker: 'SRA. L\u00d3PEZ', es: '\u00bfTiene usted familia aqu\u00ed?', en: 'Do you have family here?' },
        { speaker: 'SR. GARC\u00cdA', es: 'S\u00ed, estoy casado y tengo dos hijos.', en: 'Yes, I\'m married and have two children.' },
        { speaker: 'SRA. L\u00d3PEZ', es: '\u00bfSon parecidos a usted o a su esposa?', en: 'Do they look like you or your wife?' },
        { speaker: 'SR. GARC\u00cdA', es: 'Carlos es alto y moreno como yo.', en: 'Carlos is tall and dark-haired like me.' },
        { speaker: 'SRA. L\u00d3PEZ', es: '\u00bfY su hija?', en: 'And your daughter?' },
        { speaker: 'SR. GARC\u00cdA', es: 'Sof\u00eda es rubia como su madre. Tiene los ojos azules.', en: 'Sof\u00eda is blonde like her mother. She has blue eyes.' },
      ],
      grammar: [
        { title: 'Future with IR', desc: 'Voy a + infinitive: Voy a estudiar ma\u00f1ana' },
        { title: 'Making Plans', desc: '\u00bfQuieres ir al cine? \u00bfQuedamos a las 8?' },
        { title: 'Time Expressions', desc: 'ma\u00f1ana, la pr\u00f3xima semana, el fin de semana' },
        { title: 'Accepting/Declining', desc: '\u00a1Claro! / Lo siento, no puedo' }
      ]
    },
    {
      id: 12,
      volume: 1,
      title_target: 'El Tiempo Libre',
      title_source: 'Free Time',
      title_es: 'El Tiempo Libre',
      title_en: 'Free Time',
      dialogue: [
        { speaker: 'SR. RUIZ', es: '\u00bfQu\u00e9 piensa usted del nuevo jefe?', en: 'What do you think of the new boss?' },
        { speaker: 'SRA. L\u00d3PEZ', es: 'Creo que es muy inteligente y organizado.', en: 'I think he\'s very intelligent and organized.' },
        { speaker: 'SR. RUIZ', es: 'Es bastante serio, pero muy justo.', en: 'He\'s quite serious, but very fair.' },
        { speaker: 'ANA', es: '\u00bfQu\u00e9 piensas de Mar\u00eda?', en: 'What do you think of Mar\u00eda?' },
        { speaker: 'CARLOS', es: 'Me cae muy bien. Es la m\u00e1s simp\u00e1tica del grupo.', en: 'I like her a lot. She\'s the nicest in the group.' },
      ],
      grammar: [
        { title: 'GUSTAR Construction', desc: 'Me gusta el f\u00fatbol. Me gustan los deportes.' },
        { title: 'Hobbies', desc: 'leer, nadar, bailar, cocinar, viajar' },
        { title: 'Frequency Adverbs', desc: 'siempre, a veces, nunca, frecuentemente' },
        { title: 'Sports & Activities', desc: 'f\u00fatbol, tenis, cine, m\u00fasica, arte' }
      ]
    },
    {
      id: 13,
      volume: 1,
      title_target: 'Descripciones',
      title_source: 'Descriptions',
      title_es: 'Descripciones',
      title_en: 'Descriptions',
      dialogue: [
        { speaker: 'SR. MORA', es: '\u00bfQu\u00e9 tal el fin de semana?', en: 'How was the weekend?' },
        { speaker: 'SRA. RUIZ', es: 'Muy bien. Descans\u00e9 mucho el s\u00e1bado.', en: 'Very good. I rested a lot on Saturday.' },
        { speaker: 'SR. MORA', es: '\u00bfY el domingo? \u00bfSali\u00f3 usted?', en: 'And Sunday? Did you go out?' },
        { speaker: 'SRA. RUIZ', es: 'S\u00ed, visit\u00e9 a mis padres. Almorzamos juntos.', en: 'Yes, I visited my parents. We had lunch together.' },
        { speaker: 'SRA. RUIZ', es: 'Comimos en un restaurante y despu\u00e9s caminamos por el parque.', en: 'We ate at a restaurant and then walked through the park.' },
      ],
      grammar: [
        { title: 'Physical Descriptions', desc: 'alto/bajo, gordo/delgado, joven/viejo' },
        { title: 'Personality', desc: 'simp\u00e1tico, inteligente, amable, trabajador' },
        { title: 'Adjective Agreement', desc: 'alto/alta/altos/altas - gender and number' },
        { title: 'Comparatives', desc: 'm\u00e1s...que, menos...que, tan...como' }
      ]
    },
    {
      id: 14,
      volume: 1,
      title_target: 'Opiniones',
      title_source: 'Opinions',
      title_es: 'Opiniones',
      title_en: 'Opinions',
      dialogue: [
        { speaker: 'SRA. L\u00d3PEZ', es: '\u00bfFue usted a la conferencia ayer?', en: 'Did you go to the conference yesterday?' },
        { speaker: 'SR. GARC\u00cdA', es: 'S\u00ed, fui. Estuvo muy interesante.', en: 'Yes, I went. It was very interesting.' },
        { speaker: 'SRA. L\u00d3PEZ', es: '\u00bfQu\u00e9 hizo despu\u00e9s?', en: 'What did you do afterwards?' },
        { speaker: 'SR. GARC\u00cdA', es: 'Tuve una reuni\u00f3n y despu\u00e9s vine a la oficina.', en: 'I had a meeting and then came to the office.' },
        { speaker: 'ANA', es: '\u00bfFuiste a la fiesta de Marcos?', en: 'Did you go to Marcos\'s party?' },
        { speaker: 'CARLOS', es: '\u00a1S\u00ed, fui! Estuvo incre\u00edble.', en: 'Yes, I went! It was incredible.' },
      ],
      grammar: [
        { title: 'Opinion Verbs', desc: 'creer, pensar, opinar, parecer' },
        { title: 'Expressing Agreement', desc: 'Estoy de acuerdo. Tienes raz\u00f3n.' },
        { title: 'Expressing Disagreement', desc: 'No estoy de acuerdo. No creo que...' },
        { title: 'Connectors', desc: 'porque, pero, aunque, sin embargo' }
      ]
    },
    {
      id: 15,
      volume: 1,
      title_target: 'Repaso 3',
      title_source: 'Review 3',
      title_es: 'Repaso 3',
      title_en: 'Review 3',
      dialogue: [
        { speaker: 'PROFESOR', es: 'Repasemos las lecciones anteriores.', en: 'Let\'s review the previous lessons.' }
      ],
      grammar: [
        { title: 'Review Unit', desc: 'Consolidation of Units 11-14: plans, free time, descriptions, opinions' }
      ]
    },
    // PHASE 2: PR\u00c1CTICO (Practical) - Units 16-20
    {
      id: 16,
      volume: 2,
      title_target: 'De Viaje',
      title_source: 'Traveling',
      title_es: 'De Viaje',
      title_en: 'Traveling',
      dialogue: [
        { speaker: 'AGENTE', es: '\u00bfC\u00f3mo fue su viaje a M\u00e9xico?', en: 'How was your trip to Mexico?' },
        { speaker: 'SR. RUIZ', es: 'Fue maravilloso. El hotel era muy bonito.', en: 'It was wonderful. The hotel was very nice.' },
        { speaker: 'AGENTE', es: '\u00bfQu\u00e9 tiempo hac\u00eda?', en: 'What was the weather like?' },
        { speaker: 'SR. RUIZ', es: 'Hac\u00eda mucho calor pero no llov\u00eda.', en: 'It was very hot but it wasn\'t raining.' },
        { speaker: 'AGENTE', es: '\u00bfQu\u00e9 hizo usted durante el viaje?', en: 'What did you do during the trip?' },
        { speaker: 'SR. RUIZ', es: 'Visit\u00e9 las pir\u00e1mides. Hab\u00eda much\u00edsima gente.', en: 'I visited the pyramids. There were lots of people.' },
      ],
      grammar: [
        { title: 'Travel Vocabulary', desc: 'avi\u00f3n, tren, hotel, maleta, pasaporte' },
        { title: 'Preterite Introduction', desc: 'Regular -AR: habl\u00e9, hablaste, habl\u00f3' },
        { title: 'Directions', desc: 'a la derecha, a la izquierda, todo recto' },
        { title: 'At the Hotel', desc: 'reservaci\u00f3n, habitaci\u00f3n, llave, recepci\u00f3n' }
      ]
    },
    {
      id: 17,
      volume: 2,
      title_target: 'En el M\u00e9dico',
      title_source: 'At the Doctor',
      title_es: 'En el M\u00e9dico',
      title_en: 'At the Doctor',
      dialogue: [
        { speaker: 'DOCTORA', es: 'Buenos d\u00edas. \u00bfQu\u00e9 le pasa?', en: 'Good morning. What\'s wrong?' },
        { speaker: 'PACIENTE', es: 'Me duele mucho la cabeza, doctora.', en: 'My head hurts a lot, doctor.' },
        { speaker: 'DOCTORA', es: '\u00bfDesde cu\u00e1ndo le duele?', en: 'Since when has it hurt?' },
        { speaker: 'PACIENTE', es: 'Empez\u00f3 ayer. Tambi\u00e9n me dol\u00eda el est\u00f3mago anoche.', en: 'It started yesterday. My stomach also hurt last night.' },
        { speaker: 'DOCTORA', es: '\u00bfTiene fiebre?', en: 'Do you have a fever?' },
        { speaker: 'PACIENTE', es: 'S\u00ed, ten\u00eda fiebre anoche pero ahora no.', en: 'Yes, I had a fever last night but not now.' },
        { speaker: 'DOCTORA', es: 'Voy a recetarle un medicamento.', en: 'I\'m going to prescribe you a medication.' },
      ],
      grammar: [
        { title: 'Body Parts', desc: 'cabeza, brazo, pierna, est\u00f3mago, espalda' },
        { title: 'DOLER Construction', desc: 'Me duele la cabeza. Me duelen los pies.' },
        { title: 'Health Vocabulary', desc: 'fiebre, dolor, medicina, receta' },
        { title: 'Symptoms', desc: 'Tengo tos. Estoy mareado. Me siento mal.' }
      ]
    },
    {
      id: 18,
      volume: 2,
      title_target: 'El Trabajo',
      title_source: 'Work',
      title_es: 'El Trabajo',
      title_en: 'Work',
      dialogue: [
        { speaker: 'ENTREVISTADOR', es: 'H\u00e1bleme de su experiencia laboral.', en: 'Tell me about your work experience.' },
        { speaker: 'CANDIDATA', es: 'Trabajaba en una empresa de tecnolog\u00eda.', en: 'I was working at a tech company.' },
        { speaker: 'ENTREVISTADOR', es: '\u00bfPor qu\u00e9 dej\u00f3 ese trabajo?', en: 'Why did you leave that job?' },
        { speaker: 'CANDIDATA', es: 'La empresa cerr\u00f3 el a\u00f1o pasado.', en: 'The company closed last year.' },
        { speaker: 'ENTREVISTADOR', es: '\u00bfQu\u00e9 hac\u00eda all\u00ed exactamente?', en: 'What exactly did you do there?' },
        { speaker: 'CANDIDATA', es: 'Era gerente de proyectos. Supervisaba un equipo de diez personas.', en: 'I was a project manager. I supervised a team of ten people.' },
      ],
      grammar: [
        { title: 'Professions', desc: 'm\u00e9dico, abogado, profesor, ingeniero' },
        { title: 'Workplace', desc: 'oficina, reuni\u00f3n, jefe, compa\u00f1ero' },
        { title: 'Work Verbs', desc: 'trabajar, ganar, jubilarse' },
        { title: 'Formal Register', desc: 'Professional Spanish expressions' }
      ]
    },
    {
      id: 19,
      volume: 2,
      title_target: 'Tecnolog\u00eda',
      title_source: 'Technology',
      title_es: 'Tecnolog\u00eda',
      title_en: 'Technology',
      dialogue: [
        { speaker: 'CLIENTE', es: 'Disculpe, \u00bfme puede ayudar con mi tel\u00e9fono?', en: 'Excuse me, can you help me with my phone?' },
        { speaker: 'T\u00c9CNICO', es: 'Por supuesto. \u00bfCu\u00e1l es el problema?', en: 'Of course. What\'s the problem?' },
        { speaker: 'CLIENTE', es: 'No puedo enviar correos electr\u00f3nicos.', en: 'I can\'t send emails.' },
        { speaker: 'T\u00c9CNICO', es: 'Ah, ya veo. Su WiFi est\u00e1 desactivado.', en: 'Ah, I see. Your WiFi is turned off.' },
        { speaker: 'CLIENTE', es: '\u00a1Ay, qu\u00e9 tonto! \u00bfC\u00f3mo lo activo?', en: 'Oh, how silly! How do I turn it on?' },
        { speaker: 'T\u00c9CNICO', es: 'Se lo muestro. Es muy f\u00e1cil.', en: 'I\'ll show you. It\'s very easy.' },
      ],
      grammar: [
        { title: 'Tech Vocabulary', desc: 'computadora, tel\u00e9fono, internet, aplicaci\u00f3n' },
        { title: 'Digital Actions', desc: 'descargar, subir, enviar, compartir' },
        { title: 'Social Media', desc: 'publicar, seguir, comentar, dar like' },
        { title: 'Tech Problems', desc: 'No funciona. Se cay\u00f3 el sistema.' }
      ]
    },
    {
      id: 20,
      volume: 2,
      title_target: 'Repaso 4',
      title_source: 'Review 4',
      title_es: 'Repaso 4',
      title_en: 'Review 4',
      dialogue: [
        { speaker: 'PROFESOR', es: 'Repasemos las unidades 16-19.', en: 'Let\'s review units 16-19.' }
      ],
      grammar: [
        { title: 'Review Unit', desc: 'Integration of Units 16-19: travel, doctor, work, technology' }
      ]
    },
    // PHASE 2: AVANZADO (Advanced) - Units 21-25
    {
      id: 21,
      volume: 2,
      title_target: 'El Futuro',
      title_source: 'The Future',
      title_es: 'El Futuro',
      title_en: 'The Future',
      dialogue: [
        { speaker: 'JEFA', es: '\u00bfQu\u00e9 har\u00e1 usted este fin de semana?', en: 'What will you do this weekend?' },
        { speaker: 'EMPLEADO', es: 'Trabajar\u00e9 en el proyecto hasta el s\u00e1bado.', en: 'I\'ll work on the project until Saturday.' },
        { speaker: 'JEFA', es: '\u00bfTerminar\u00e1 a tiempo?', en: 'Will you finish on time?' },
        { speaker: 'EMPLEADO', es: 'S\u00ed, lo terminar\u00e9 el viernes por la noche.', en: 'Yes, I\'ll finish it Friday night.' },
        { speaker: 'JEFA', es: 'Muy bien. El lunes hablaremos sobre el pr\u00f3ximo proyecto.', en: 'Very good. Monday we\'ll talk about the next project.' },
        { speaker: 'EMPLEADO', es: 'Perfecto. Estar\u00e9 listo.', en: 'Perfect. I\'ll be ready.' },
      ],
      grammar: [
        { title: 'Future Tense (Regular)', desc: 'hablar\u00e9, comer\u00e9, vivir\u00e9 - infinitive + endings' },
        { title: 'Future (Irregular)', desc: 'tendr\u00e9, podr\u00e9, har\u00e9, dir\u00e9, vendr\u00e9' },
        { title: 'Future Uses', desc: 'Predictions, promises, probability' },
        { title: 'Time Markers', desc: 'ma\u00f1ana, el pr\u00f3ximo a\u00f1o, dentro de...' }
      ]
    },
    {
      id: 22,
      volume: 2,
      title_target: 'El Condicional',
      title_source: 'The Conditional',
      title_es: 'El Condicional',
      title_en: 'The Conditional',
      dialogue: [
        { speaker: 'MESERO', es: 'Buenas noches. \u00bfQu\u00e9 le gustar\u00eda ordenar?', en: 'Good evening. What would you like to order?' },
        { speaker: 'CLIENTE', es: 'Me gustar\u00eda ver el men\u00fa, por favor.', en: 'I would like to see the menu, please.' },
        { speaker: 'MESERO', es: '\u00bfQu\u00e9 me recomendar\u00eda?', en: 'What would you recommend?' },
        { speaker: 'CLIENTE', es: 'Le recomendar\u00eda el vino de la casa. Es excelente.', en: 'I would recommend the house wine. It\'s excellent.' },
        { speaker: 'SOF\u00cdA', es: 'Si ganaras la loter\u00eda, \u00bfqu\u00e9 har\u00edas?', en: 'If you won the lottery, what would you do?' },
        { speaker: 'MARCOS', es: 'Viajar\u00eda por todo el mundo.', en: 'I would travel around the world.' },
      ],
      grammar: [
        { title: 'Conditional Tense', desc: 'hablar\u00eda, comer\u00eda, vivir\u00eda - would + verb' },
        { title: 'Conditional (Irregular)', desc: 'tendr\u00eda, podr\u00eda, har\u00eda (same stems as future)' },
        { title: 'Polite Requests', desc: '\u00bfPodr\u00eda ayudarme? Me gustar\u00eda...' },
        { title: 'Hypotheticals', desc: 'En tu lugar, yo... Si fuera posible...' }
      ]
    },
    {
      id: 23,
      volume: 2,
      title_target: 'Presente Perfecto',
      title_source: 'Present Perfect',
      title_es: 'Presente Perfecto',
      title_en: 'Present Perfect',
      dialogue: [
        { speaker: 'ENTREVISTADOR', es: '\u00bfHa viajado usted al extranjero?', en: 'Have you traveled abroad?' },
        { speaker: 'CANDIDATA', es: 'S\u00ed, he viajado a varios pa\u00edses de Europa.', en: 'Yes, I have traveled to several European countries.' },
        { speaker: 'ENTREVISTADOR', es: '\u00bfHa trabajado en equipos internacionales?', en: 'Have you worked on international teams?' },
        { speaker: 'CANDIDATA', es: 'S\u00ed, he colaborado con colegas de cinco pa\u00edses diferentes.', en: 'Yes, I have collaborated with colleagues from five different countries.' },
        { speaker: 'LUC\u00cdA', es: '\u00bfHas visto la nueva pel\u00edcula?', en: 'Have you seen the new movie?' },
        { speaker: 'CARLOS', es: 'No, todav\u00eda no la he visto.', en: 'No, I haven\'t seen it yet.' },
      ],
      grammar: [
        { title: 'Present Perfect', desc: 'he hablado, has comido - haber + participle' },
        { title: 'Past Participles', desc: '-ado (hablar\u2192hablado), -ido (comer\u2192comido)' },
        { title: 'Irregular Participles', desc: 'dicho, hecho, escrito, visto, puesto' },
        { title: 'Uses', desc: 'Recent past, experiences, unfinished time periods' }
      ]
    },
    {
      id: 24,
      volume: 2,
      title_target: 'Subjuntivo Intro',
      title_source: 'Subjunctive Intro',
      title_es: 'Subjuntivo Intro',
      title_en: 'Subjunctive Intro',
      dialogue: [
        { speaker: 'DOCTOR', es: 'Es importante que usted descanse m\u00e1s.', en: 'It\'s important that you rest more.' },
        { speaker: 'PACIENTE', es: '\u00bfQu\u00e9 m\u00e1s me recomienda?', en: 'What else do you recommend?' },
        { speaker: 'DOCTOR', es: 'Recomiendo que coma m\u00e1s verduras y que haga ejercicio.', en: 'I recommend that you eat more vegetables and exercise.' },
        { speaker: 'PACIENTE', es: 'Espero que no sea nada grave.', en: 'I hope it\'s nothing serious.' },
        { speaker: 'DOCTOR', es: 'No se preocupe. Solo quiero que cambie algunos h\u00e1bitos.', en: 'Don\'t worry. I just want you to change some habits.' },
        { speaker: 'MAM\u00c1', es: 'Quiero que estudies para tu examen.', en: 'I want you to study for your exam.' },
        { speaker: 'HIJO', es: 'Espero que el examen sea f\u00e1cil.', en: 'I hope the exam is easy.' },
      ],
      grammar: [
        { title: 'Present Subjunctive', desc: 'hable, coma, viva - after certain triggers' },
        { title: 'Subjunctive Triggers', desc: 'quiero que, espero que, es importante que' },
        { title: 'Formation', desc: 'Opposite vowel: -AR\u2192-e, -ER/-IR\u2192-a' },
        { title: 'WEIRDO', desc: 'Wishes, Emotions, Impersonal, Recommendations, Doubt, Ojal\u00e1' }
      ]
    },
    {
      id: 25,
      volume: 2,
      title_target: 'Repaso 5',
      title_source: 'Review 5',
      title_es: 'Repaso 5',
      title_en: 'Review 5',
      dialogue: [
        { speaker: 'PROFESOR', es: 'Repasemos las unidades 21-24.', en: 'Let\'s review units 21-24.' }
      ],
      grammar: [
        { title: 'Review Unit', desc: 'Consolidation of Units 21-24: future, conditional, present perfect, subjunctive' }
      ]
    },
    // PHASE 2: MAESTR\u00cdA (Mastery) - Units 26-30
    {
      id: 26,
      volume: 2,
      title_target: 'Subjuntivo II',
      title_source: 'Subjunctive II',
      title_es: 'Subjuntivo II',
      title_en: 'Subjunctive II',
      dialogue: [
        { speaker: 'JEFA', es: 'Dudo que el proyecto est\u00e9 listo para el viernes.', en: 'I doubt the project will be ready by Friday.' },
        { speaker: 'EMPLEADO', es: 'Me sorprende que diga eso. Hemos trabajado mucho.', en: 'I\'m surprised you say that. We\'ve worked a lot.' },
        { speaker: 'JEFA', es: 'No creo que tengamos suficiente tiempo.', en: 'I don\'t think we have enough time.' },
        { speaker: 'EMPLEADO', es: 'Haremos todo lo posible para que est\u00e9 satisfecha.', en: 'We\'ll do everything possible so that you\'re satisfied.' },
        { speaker: 'JEFA', es: 'Me alegro de que tengan esa actitud.', en: 'I\'m glad you have that attitude.' },
      ],
      grammar: [
        { title: 'Subjunctive (Doubt)', desc: 'dudo que, no creo que, es posible que' },
        { title: 'Subjunctive (Emotions)', desc: 'me alegra que, siento que, temo que' },
        { title: 'Subjunctive (Negation)', desc: 'No hay nadie que... No conozco a nadie que...' },
        { title: 'Indicative vs Subjunctive', desc: 'Creo que es... vs No creo que sea...' }
      ]
    },
    {
      id: 27,
      volume: 2,
      title_target: 'Imperfecto Subjuntivo',
      title_source: 'Imperfect Subjunctive',
      title_es: 'Imperfecto Subjuntivo',
      title_en: 'Imperfect Subjunctive',
      dialogue: [
        { speaker: 'CLIENTE', es: 'Quisiera hacer una reservaci\u00f3n, por favor.', en: 'I would like to make a reservation, please.' },
        { speaker: 'RECEPCIONISTA', es: 'Si pudiera venir a las ocho, tendr\u00edamos disponibilidad.', en: 'If you could come at eight, we\'d have availability.' },
        { speaker: 'CLIENTE', es: 'Preferir\u00eda que fuera a las siete, si fuera posible.', en: 'I would prefer it to be at seven, if possible.' },
        { speaker: 'MAR\u00cdA', es: 'Si pudieras vivir en cualquier pa\u00eds, \u00bfcu\u00e1l elegir\u00edas?', en: 'If you could live in any country, which would you choose?' },
        { speaker: 'JUAN', es: 'Si tuviera que elegir, vivir\u00eda en Espa\u00f1a.', en: 'If I had to choose, I would live in Spain.' },
        { speaker: 'MAR\u00cdA', es: 'Si ahorr\u00e1ramos dinero, podr\u00edamos hacerlo juntos.', en: 'If we saved money, we could do it together.' },
      ],
      grammar: [
        { title: 'Imperfect Subjunctive', desc: 'hablara/hablase, comiera/comiese' },
        { title: 'Formation', desc: 'From ellos preterite: hablaron \u2192 hablar-a' },
        { title: 'Si Clauses', desc: 'Si tuviera dinero, viajar\u00eda.' },
        { title: 'Past Wishes', desc: 'Ojal\u00e1 hubiera... Quisiera que...' }
      ]
    },
    {
      id: 28,
      volume: 2,
      title_target: 'Tiempos Compuestos',
      title_source: 'Compound Tenses',
      title_es: 'Tiempos Compuestos',
      title_en: 'Compound Tenses',
      dialogue: [
        { speaker: 'JEFE', es: '\u00bfYa hab\u00eda terminado el informe antes de la reuni\u00f3n?', en: 'Had you already finished the report before the meeting?' },
        { speaker: 'EMPLEADA', es: 'S\u00ed, lo hab\u00eda completado el d\u00eda anterior.', en: 'Yes, I had completed it the day before.' },
        { speaker: 'JEFE', es: 'Para las cinco, \u00bfhabr\u00e1 revisado los n\u00fameros?', en: 'By five, will you have reviewed the numbers?' },
        { speaker: 'EMPLEADA', es: 'S\u00ed, los habr\u00e9 verificado todos.', en: 'Yes, I will have verified all of them.' },
        { speaker: 'JEFE', es: 'Si hubiera sabido antes, habr\u00eda cambiado la fecha.', en: 'If I had known earlier, I would have changed the date.' },
        { speaker: 'EMPLEADA', es: 'No se preocupe. Me alegro de que haya salido bien.', en: 'Don\'t worry. I\'m glad it turned out well.' },
      ],
      grammar: [
        { title: 'Past Perfect', desc: 'hab\u00eda hablado - had spoken' },
        { title: 'Future Perfect', desc: 'habr\u00e9 terminado - will have finished' },
        { title: 'Conditional Perfect', desc: 'habr\u00eda hecho - would have done' },
        { title: 'Perfect Subjunctive', desc: 'haya hablado, hubiera hablado' }
      ]
    },
    {
      id: 29,
      volume: 2,
      title_target: 'Variaciones Regionales',
      title_source: 'Regional Variations',
      title_es: 'Variaciones Regionales',
      title_en: 'Regional Variations',
      dialogue: [
        { speaker: 'PROFESOR', es: 'El espa\u00f1ol tiene muchas variaciones regionales.', en: 'Spanish has many regional variations.' },
        { speaker: 'ALUMNO', es: '\u00bfPor ejemplo?', en: 'For example?' },
        { speaker: 'PROFESOR', es: 'En Argentina dicen "vos ten\u00e9s" en vez de "t\u00fa tienes".', en: 'In Argentina they say "vos ten\u00e9s" instead of "t\u00fa tienes".' },
        { speaker: 'ALUMNO', es: '\u00bfY en M\u00e9xico?', en: 'And in Mexico?' },
        { speaker: 'PROFESOR', es: 'En M\u00e9xico no usan "vosotros", siempre usan "ustedes".', en: 'In Mexico they don\'t use "vosotros", they always use "ustedes".' },
        { speaker: 'ALUMNO', es: '\u00bfQu\u00e9 otras diferencias hay?', en: 'What other differences are there?' },
        { speaker: 'PROFESOR', es: 'En Espa\u00f1a pronuncian la "z" como "th". En Am\u00e9rica Latina suena como "s".', en: 'In Spain they pronounce "z" like "th". In Latin America it sounds like "s".' },
      ],
      grammar: [
        { title: 'Voseo', desc: 'vos ten\u00e9s, vos pod\u00e9s (Argentina, parts of Central America)' },
        { title: 'Ustedes vs Vosotros', desc: 'Latin America: ustedes only. Spain: ustedes (formal) + vosotros (informal)' },
        { title: 'Vocabulary Differences', desc: 'carro/coche, computadora/ordenador, celular/m\u00f3vil' },
        { title: 'Pronunciation', desc: 'Seseo, ceceo, aspirated s, yeismo' }
      ]
    },
    {
      id: 30,
      volume: 2,
      title_target: 'Repaso Final',
      title_source: 'Final Review',
      title_es: 'Repaso Final',
      title_en: 'Final Review',
      dialogue: [
        { speaker: 'PROFESOR', es: '\u00a1Felicitaciones! Han terminado el curso.', en: 'Congratulations! You have finished the course.' },
        { speaker: 'PROFESOR', es: 'Ahora hablan espa\u00f1ol muy bien.', en: 'You now speak Spanish very well.' },
      ],
      grammar: [],
      noDrills: true
    },
  ],
};

console.log('Spanish course config loaded');
