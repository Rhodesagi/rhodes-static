// ============================================================================
// RHODES RUSSIAN V2 - COURSE CONFIGURATION
// ============================================================================
// This file contains ALL language-specific data for the Russian course.
// The engine reads this config and adapts accordingly.

window.COURSE_CONFIG = {
  // ============================================================================
  // IDENTITY
  // ============================================================================
  lang: 'russian',
  langCode: 'ru-RU',
  displayName: 'Russian',
  courseName: 'Rhodes Russian | \u0414\u0430\u0432\u0430\u0439\u0442\u0435!',
  tagline: 'COMPLETE COURSE',

  // ============================================================================
  // THEME
  // ============================================================================
  theme: {
    accentPrimary: '#0039A6',
    accentLight: '#e8eef5',
    flagColors: ['#ffffff', '#0039A6', '#D52B1E'],
  },

  // ============================================================================
  // FIELD MAPPINGS
  // ============================================================================
  // Maps generic field names to actual JSON keys in drills
  fields: {
    target: 'russian_formal',
    targetFormal: 'russian_formal',
    targetInformal: 'russian_informal',
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
    hasAlphabetUnit: true,
    hasStressPositions: true,
    hasAudioMapping: false,
    hasConfusables: false,
    hasDarkMode: true,
    hasServiceWorker: false,
  },

  // ============================================================================
  // KEYBOARD
  // ============================================================================
  keyboard: {
    type: 'full',
    rows: [
      ['\u0439','\u0446','\u0443','\u043a','\u0435','\u043d','\u0433','\u0448','\u0449','\u0437','\u0445','\u044a'],
      ['\u0444','\u044b','\u0432','\u0430','\u043f','\u0440','\u043e','\u043b','\u0434','\u0436','\u044d'],
      ['\u044f','\u0447','\u0441','\u043c','\u0438','\u0442','\u044c','\u0431','\u044e','\u0451'],
    ],
  },

  // ============================================================================
  // STORAGE KEYS
  // ============================================================================
  storage: {
    progress: 'rhodes_russian_progress',
    sync: 'rhodes_russian_sync',
    srs: 'rhodes_russian_srs',
    analytics: 'rhodes_russian_analytics',
    linear: 'rhodes_russian_linear',
  },

  // ============================================================================
  // DATA PATHS
  // ============================================================================
  data: {
    drills: 'data/drills.json',
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
  titleHtml: `<div style="display:flex;flex-direction:column;height:30px;width:45px;border:1px solid #ccc;margin-bottom:8px;">
  <span style="flex:1;background:#ffffff;border-bottom:1px solid #ddd;"></span>
  <span style="flex:1;background:#0039A6;"></span>
  <span style="flex:1;background:#D52B1E;"></span>
</div>
<div style="border:2px solid #333;padding:5px 12px;font-size:24px;font-weight:bold;letter-spacing:3px;display:flex;align-items:center;gap:15px;">
  <span>RHODES RUSSIAN</span>
  <span style="font-size:14px;font-weight:normal;opacity:0.7;">\u0414\u0430\u0432\u0430\u0439\u0442\u0435!</span>
</div>`,

  // ============================================================================
  // CASE COLORS (6 Russian cases)
  // ============================================================================
  caseColors: {
    nominative: { color: '#0066CC', label: '\u0418\u043c\u0435\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0439' },
    accusative: { color: '#CC0000', label: '\u0412\u0438\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0439' },
    dative: { color: '#009900', label: '\u0414\u0430\u0442\u0435\u043b\u044c\u043d\u044b\u0439' },
    genitive: { color: '#CC9900', label: '\u0420\u043e\u0434\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0439' },
    instrumental: { color: '#9933CC', label: '\u0422\u0432\u043e\u0440\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0439' },
    prepositional: { color: '#FF6600', label: '\u041f\u0440\u0435\u0434\u043b\u043e\u0436\u043d\u044b\u0439' },
  },

  // ============================================================================
  // CUSTOM DRILL TYPES (Unit 0 special types)
  // ============================================================================
  customDrillTypes: {
    alphabet_recognition: {
      promptField: 'prompt',
      answerField: 'answer',
      displayRussian: true,
      showExample: true,
    },
    false_friend_warning: {
      promptField: 'prompt',
      answerField: 'answer',
      displayRussian: true,
      showExample: true,
    },
  },

  // ============================================================================
  // FORMAL TO INFORMAL CONVERSION
  // ============================================================================
  // Russian formal/informal is handled by separate data fields (russian_formal / russian_informal)
  // No text-based conversion needed
  convertToInformal: null,

  // ============================================================================
  // VERBS - RUSSIAN VERB CONJUGATIONS
  // ============================================================================
  verbs: {
    '\u0431\u044b\u0442\u044c': {
      meaning: 'to be',
      present: [null, null, '\u0435\u0441\u0442\u044c', null, null, null],
      past: ['\u0431\u044b\u043b', '\u0431\u044b\u043b\u0430', '\u0431\u044b\u043b\u043e', '\u0431\u044b\u043b\u0438'],
      future: ['\u0431\u0443\u0434\u0443', '\u0431\u0443\u0434\u0435\u0448\u044c', '\u0431\u0443\u0434\u0435\u0442', '\u0431\u0443\u0434\u0435\u043c', '\u0431\u0443\u0434\u0435\u0442\u0435', '\u0431\u0443\u0434\u0443\u0442'],
      imperative: ['\u0431\u0443\u0434\u044c', '\u0431\u0443\u0434\u044c\u0442\u0435'],
      tip: 'Omitted in present tense. \u0423 \u043c\u0435\u043d\u044f \u0435\u0441\u0442\u044c... (I have...). Past agrees in gender.'
    },
    '\u0438\u043c\u0435\u0442\u044c': {
      meaning: 'to have',
      present: ['\u0438\u043c\u0435\u044e', '\u0438\u043c\u0435\u0435\u0448\u044c', '\u0438\u043c\u0435\u0435\u0442', '\u0438\u043c\u0435\u0435\u043c', '\u0438\u043c\u0435\u0435\u0442\u0435', '\u0438\u043c\u0435\u044e\u0442'],
      past: ['\u0438\u043c\u0435\u043b', '\u0438\u043c\u0435\u043b\u0430', '\u0438\u043c\u0435\u043b\u043e', '\u0438\u043c\u0435\u043b\u0438'],
      tip: 'Rarely used directly. Russian prefers \u0423 \u043c\u0435\u043d\u044f \u0435\u0441\u0442\u044c + nominative.'
    },
    '\u0438\u0434\u0442\u0438': {
      meaning: 'to go (on foot, one direction)',
      present: ['\u0438\u0434\u0443', '\u0438\u0434\u0451\u0448\u044c', '\u0438\u0434\u0451\u0442', '\u0438\u0434\u0451\u043c', '\u0438\u0434\u0451\u0442\u0435', '\u0438\u0434\u0443\u0442'],
      past: ['\u0448\u0451\u043b', '\u0448\u043b\u0430', '\u0448\u043b\u043e', '\u0448\u043b\u0438'],
      imperative: ['\u0438\u0434\u0438', '\u0438\u0434\u0438\u0442\u0435'],
      tip: 'Unidirectional motion on foot. Multidirectional: \u0445\u043e\u0434\u0438\u0442\u044c. Irregular past: \u0448\u0451\u043b/\u0448\u043b\u0430.'
    },
    '\u0445\u043e\u0434\u0438\u0442\u044c': {
      meaning: 'to go (on foot, habitual/round trip)',
      present: ['\u0445\u043e\u0436\u0443', '\u0445\u043e\u0434\u0438\u0448\u044c', '\u0445\u043e\u0434\u0438\u0442', '\u0445\u043e\u0434\u0438\u043c', '\u0445\u043e\u0434\u0438\u0442\u0435', '\u0445\u043e\u0434\u044f\u0442'],
      past: ['\u0445\u043e\u0434\u0438\u043b', '\u0445\u043e\u0434\u0438\u043b\u0430', '\u0445\u043e\u0434\u0438\u043b\u043e', '\u0445\u043e\u0434\u0438\u043b\u0438'],
      imperative: ['\u0445\u043e\u0434\u0438', '\u0445\u043e\u0434\u0438\u0442\u0435'],
      tip: 'Multidirectional/habitual on foot. \u042f \u0445\u043e\u0436\u0443 \u0432 \u0448\u043a\u043e\u043b\u0443 \u043a\u0430\u0436\u0434\u044b\u0439 \u0434\u0435\u043d\u044c.'
    },
    '\u0435\u0445\u0430\u0442\u044c': {
      meaning: 'to go (by transport, one direction)',
      present: ['\u0435\u0434\u0443', '\u0435\u0434\u0435\u0448\u044c', '\u0435\u0434\u0435\u0442', '\u0435\u0434\u0435\u043c', '\u0435\u0434\u0435\u0442\u0435', '\u0435\u0434\u0443\u0442'],
      past: ['\u0435\u0445\u0430\u043b', '\u0435\u0445\u0430\u043b\u0430', '\u0435\u0445\u0430\u043b\u043e', '\u0435\u0445\u0430\u043b\u0438'],
      imperative: ['\u043f\u043e\u0435\u0437\u0436\u0430\u0439', '\u043f\u043e\u0435\u0437\u0436\u0430\u0439\u0442\u0435'],
      tip: 'Unidirectional by vehicle. Multidirectional: \u0435\u0437\u0434\u0438\u0442\u044c. Imperative uses \u043f\u043e\u0435\u0437\u0436\u0430\u0439.'
    },
    '\u0433\u043e\u0432\u043e\u0440\u0438\u0442\u044c': {
      meaning: 'to speak/say',
      present: ['\u0433\u043e\u0432\u043e\u0440\u044e', '\u0433\u043e\u0432\u043e\u0440\u0438\u0448\u044c', '\u0433\u043e\u0432\u043e\u0440\u0438\u0442', '\u0433\u043e\u0432\u043e\u0440\u0438\u043c', '\u0433\u043e\u0432\u043e\u0440\u0438\u0442\u0435', '\u0433\u043e\u0432\u043e\u0440\u044f\u0442'],
      past: ['\u0433\u043e\u0432\u043e\u0440\u0438\u043b', '\u0433\u043e\u0432\u043e\u0440\u0438\u043b\u0430', '\u0433\u043e\u0432\u043e\u0440\u0438\u043b\u043e', '\u0433\u043e\u0432\u043e\u0440\u0438\u043b\u0438'],
      imperative: ['\u0433\u043e\u0432\u043e\u0440\u0438', '\u0433\u043e\u0432\u043e\u0440\u0438\u0442\u0435'],
      tip: 'Second conjugation (-\u0438\u0442\u044c). Perfective: \u0441\u043a\u0430\u0437\u0430\u0442\u044c (to say, single instance).'
    },
    '\u0434\u0435\u043b\u0430\u0442\u044c': {
      meaning: 'to do/make',
      present: ['\u0434\u0435\u043b\u0430\u044e', '\u0434\u0435\u043b\u0430\u0435\u0448\u044c', '\u0434\u0435\u043b\u0430\u0435\u0442', '\u0434\u0435\u043b\u0430\u0435\u043c', '\u0434\u0435\u043b\u0430\u0435\u0442\u0435', '\u0434\u0435\u043b\u0430\u044e\u0442'],
      past: ['\u0434\u0435\u043b\u0430\u043b', '\u0434\u0435\u043b\u0430\u043b\u0430', '\u0434\u0435\u043b\u0430\u043b\u043e', '\u0434\u0435\u043b\u0430\u043b\u0438'],
      imperative: ['\u0434\u0435\u043b\u0430\u0439', '\u0434\u0435\u043b\u0430\u0439\u0442\u0435'],
      tip: 'First conjugation (-\u0430\u0442\u044c). Perfective: \u0441\u0434\u0435\u043b\u0430\u0442\u044c.'
    },
    '\u0445\u043e\u0442\u0435\u0442\u044c': {
      meaning: 'to want',
      present: ['\u0445\u043e\u0447\u0443', '\u0445\u043e\u0447\u0435\u0448\u044c', '\u0445\u043e\u0447\u0435\u0442', '\u0445\u043e\u0442\u0438\u043c', '\u0445\u043e\u0442\u0438\u0442\u0435', '\u0445\u043e\u0442\u044f\u0442'],
      past: ['\u0445\u043e\u0442\u0435\u043b', '\u0445\u043e\u0442\u0435\u043b\u0430', '\u0445\u043e\u0442\u0435\u043b\u043e', '\u0445\u043e\u0442\u0435\u043b\u0438'],
      imperative: [null, null],
      tip: 'Mixed conjugation: 1st conj in singular, 2nd conj in plural. \u042f \u0445\u043e\u0447\u0443, \u043d\u043e \u043c\u044b \u0445\u043e\u0442\u0438\u043c.'
    },
    '\u043c\u043e\u0447\u044c': {
      meaning: 'can/to be able',
      present: ['\u043c\u043e\u0433\u0443', '\u043c\u043e\u0436\u0435\u0448\u044c', '\u043c\u043e\u0436\u0435\u0442', '\u043c\u043e\u0436\u0435\u043c', '\u043c\u043e\u0436\u0435\u0442\u0435', '\u043c\u043e\u0433\u0443\u0442'],
      past: ['\u043c\u043e\u0433', '\u043c\u043e\u0433\u043b\u0430', '\u043c\u043e\u0433\u043b\u043e', '\u043c\u043e\u0433\u043b\u0438'],
      tip: 'Consonant alternation \u0433/\u0436. Perfective: \u0441\u043c\u043e\u0447\u044c. No imperative.'
    },
    '\u0437\u043d\u0430\u0442\u044c': {
      meaning: 'to know (facts)',
      present: ['\u0437\u043d\u0430\u044e', '\u0437\u043d\u0430\u0435\u0448\u044c', '\u0437\u043d\u0430\u0435\u0442', '\u0437\u043d\u0430\u0435\u043c', '\u0437\u043d\u0430\u0435\u0442\u0435', '\u0437\u043d\u0430\u044e\u0442'],
      past: ['\u0437\u043d\u0430\u043b', '\u0437\u043d\u0430\u043b\u0430', '\u0437\u043d\u0430\u043b\u043e', '\u0437\u043d\u0430\u043b\u0438'],
      imperative: ['\u0437\u043d\u0430\u0439', '\u0437\u043d\u0430\u0439\u0442\u0435'],
      tip: 'Know facts. Compare: \u0443\u043c\u0435\u0442\u044c (know how to do). \u042f \u0437\u043d\u0430\u044e \u0440\u0443\u0441\u0441\u043a\u0438\u0439 \u044f\u0437\u044b\u043a.'
    },
    '\u0432\u0438\u0434\u0435\u0442\u044c': {
      meaning: 'to see',
      present: ['\u0432\u0438\u0436\u0443', '\u0432\u0438\u0434\u0438\u0448\u044c', '\u0432\u0438\u0434\u0438\u0442', '\u0432\u0438\u0434\u0438\u043c', '\u0432\u0438\u0434\u0438\u0442\u0435', '\u0432\u0438\u0434\u044f\u0442'],
      past: ['\u0432\u0438\u0434\u0435\u043b', '\u0432\u0438\u0434\u0435\u043b\u0430', '\u0432\u0438\u0434\u0435\u043b\u043e', '\u0432\u0438\u0434\u0435\u043b\u0438'],
      imperative: [null, null],
      tip: 'Second conjugation. Consonant mutation \u0434\u2192\u0436 in first person. Perfective: \u0443\u0432\u0438\u0434\u0435\u0442\u044c.'
    },
    '\u0440\u0430\u0431\u043e\u0442\u0430\u0442\u044c': {
      meaning: 'to work',
      present: ['\u0440\u0430\u0431\u043e\u0442\u0430\u044e', '\u0440\u0430\u0431\u043e\u0442\u0430\u0435\u0448\u044c', '\u0440\u0430\u0431\u043e\u0442\u0430\u0435\u0442', '\u0440\u0430\u0431\u043e\u0442\u0430\u0435\u043c', '\u0440\u0430\u0431\u043e\u0442\u0430\u0435\u0442\u0435', '\u0440\u0430\u0431\u043e\u0442\u0430\u044e\u0442'],
      past: ['\u0440\u0430\u0431\u043e\u0442\u0430\u043b', '\u0440\u0430\u0431\u043e\u0442\u0430\u043b\u0430', '\u0440\u0430\u0431\u043e\u0442\u0430\u043b\u043e', '\u0440\u0430\u0431\u043e\u0442\u0430\u043b\u0438'],
      imperative: ['\u0440\u0430\u0431\u043e\u0442\u0430\u0439', '\u0440\u0430\u0431\u043e\u0442\u0430\u0439\u0442\u0435'],
      tip: 'Regular first conjugation (-\u0430\u0442\u044c). Model verb for the pattern.'
    },
    '\u0447\u0438\u0442\u0430\u0442\u044c': {
      meaning: 'to read',
      present: ['\u0447\u0438\u0442\u0430\u044e', '\u0447\u0438\u0442\u0430\u0435\u0448\u044c', '\u0447\u0438\u0442\u0430\u0435\u0442', '\u0447\u0438\u0442\u0430\u0435\u043c', '\u0447\u0438\u0442\u0430\u0435\u0442\u0435', '\u0447\u0438\u0442\u0430\u044e\u0442'],
      past: ['\u0447\u0438\u0442\u0430\u043b', '\u0447\u0438\u0442\u0430\u043b\u0430', '\u0447\u0438\u0442\u0430\u043b\u043e', '\u0447\u0438\u0442\u0430\u043b\u0438'],
      imperative: ['\u0447\u0438\u0442\u0430\u0439', '\u0447\u0438\u0442\u0430\u0439\u0442\u0435'],
      tip: 'Regular first conjugation. Perfective: \u043f\u0440\u043e\u0447\u0438\u0442\u0430\u0442\u044c.'
    },
    '\u043f\u0438\u0441\u0430\u0442\u044c': {
      meaning: 'to write',
      present: ['\u043f\u0438\u0448\u0443', '\u043f\u0438\u0448\u0435\u0448\u044c', '\u043f\u0438\u0448\u0435\u0442', '\u043f\u0438\u0448\u0435\u043c', '\u043f\u0438\u0448\u0435\u0442\u0435', '\u043f\u0438\u0448\u0443\u0442'],
      past: ['\u043f\u0438\u0441\u0430\u043b', '\u043f\u0438\u0441\u0430\u043b\u0430', '\u043f\u0438\u0441\u0430\u043b\u043e', '\u043f\u0438\u0441\u0430\u043b\u0438'],
      imperative: ['\u043f\u0438\u0448\u0438', '\u043f\u0438\u0448\u0438\u0442\u0435'],
      tip: 'Consonant alternation \u0441\u2192\u0448 in present. Perfective: \u043d\u0430\u043f\u0438\u0441\u0430\u0442\u044c.'
    },
    '\u0436\u0438\u0442\u044c': {
      meaning: 'to live',
      present: ['\u0436\u0438\u0432\u0443', '\u0436\u0438\u0432\u0451\u0448\u044c', '\u0436\u0438\u0432\u0451\u0442', '\u0436\u0438\u0432\u0451\u043c', '\u0436\u0438\u0432\u0451\u0442\u0435', '\u0436\u0438\u0432\u0443\u0442'],
      past: ['\u0436\u0438\u043b', '\u0436\u0438\u043b\u0430', '\u0436\u0438\u043b\u043e', '\u0436\u0438\u043b\u0438'],
      imperative: ['\u0436\u0438\u0432\u0438', '\u0436\u0438\u0432\u0438\u0442\u0435'],
      tip: 'Stem changes in present. \u042f \u0436\u0438\u0432\u0443 \u0432 \u041c\u043e\u0441\u043a\u0432\u0435.'
    },
    '\u043b\u044e\u0431\u0438\u0442\u044c': {
      meaning: 'to love/like',
      present: ['\u043b\u044e\u0431\u043b\u044e', '\u043b\u044e\u0431\u0438\u0448\u044c', '\u043b\u044e\u0431\u0438\u0442', '\u043b\u044e\u0431\u0438\u043c', '\u043b\u044e\u0431\u0438\u0442\u0435', '\u043b\u044e\u0431\u044f\u0442'],
      past: ['\u043b\u044e\u0431\u0438\u043b', '\u043b\u044e\u0431\u0438\u043b\u0430', '\u043b\u044e\u0431\u0438\u043b\u043e', '\u043b\u044e\u0431\u0438\u043b\u0438'],
      imperative: ['\u043b\u044e\u0431\u0438', '\u043b\u044e\u0431\u0438\u0442\u0435'],
      tip: 'Consonant insertion \u0431\u043b in first person. \u042f \u043b\u044e\u0431\u043b\u044e \u0447\u0438\u0442\u0430\u0442\u044c.'
    },
    '\u043f\u043e\u043d\u0438\u043c\u0430\u0442\u044c': {
      meaning: 'to understand',
      present: ['\u043f\u043e\u043d\u0438\u043c\u0430\u044e', '\u043f\u043e\u043d\u0438\u043c\u0430\u0435\u0448\u044c', '\u043f\u043e\u043d\u0438\u043c\u0430\u0435\u0442', '\u043f\u043e\u043d\u0438\u043c\u0430\u0435\u043c', '\u043f\u043e\u043d\u0438\u043c\u0430\u0435\u0442\u0435', '\u043f\u043e\u043d\u0438\u043c\u0430\u044e\u0442'],
      past: ['\u043f\u043e\u043d\u0438\u043c\u0430\u043b', '\u043f\u043e\u043d\u0438\u043c\u0430\u043b\u0430', '\u043f\u043e\u043d\u0438\u043c\u0430\u043b\u043e', '\u043f\u043e\u043d\u0438\u043c\u0430\u043b\u0438'],
      imperative: ['\u043f\u043e\u043d\u0438\u043c\u0430\u0439', '\u043f\u043e\u043d\u0438\u043c\u0430\u0439\u0442\u0435'],
      tip: 'Regular first conjugation. Perfective: \u043f\u043e\u043d\u044f\u0442\u044c (irregular).'
    },
    '\u0434\u0430\u0442\u044c': {
      meaning: 'to give',
      present: ['\u0434\u0430\u043c', '\u0434\u0430\u0448\u044c', '\u0434\u0430\u0441\u0442', '\u0434\u0430\u0434\u0438\u043c', '\u0434\u0430\u0434\u0438\u0442\u0435', '\u0434\u0430\u0434\u0443\u0442'],
      past: ['\u0434\u0430\u043b', '\u0434\u0430\u043b\u0430', '\u0434\u0430\u043b\u043e', '\u0434\u0430\u043b\u0438'],
      imperative: ['\u0434\u0430\u0439', '\u0434\u0430\u0439\u0442\u0435'],
      tip: 'Irregular. Imperfective: \u0434\u0430\u0432\u0430\u0442\u044c (\u0434\u0430\u044e, \u0434\u0430\u0451\u0448\u044c...).'
    },
    '\u0435\u0441\u0442\u044c': {
      meaning: 'to eat',
      present: ['\u0435\u043c', '\u0435\u0448\u044c', '\u0435\u0441\u0442', '\u0435\u0434\u0438\u043c', '\u0435\u0434\u0438\u0442\u0435', '\u0435\u0434\u044f\u0442'],
      past: ['\u0435\u043b', '\u0435\u043b\u0430', '\u0435\u043b\u043e', '\u0435\u043b\u0438'],
      imperative: ['\u0435\u0448\u044c', '\u0435\u0448\u044c\u0442\u0435'],
      tip: 'Irregular. Do not confuse with \u0435\u0441\u0442\u044c (there is/to be). Perfective: \u0441\u044a\u0435\u0441\u0442\u044c.'
    },
    '\u043f\u0438\u0442\u044c': {
      meaning: 'to drink',
      present: ['\u043f\u044c\u044e', '\u043f\u044c\u0451\u0448\u044c', '\u043f\u044c\u0451\u0442', '\u043f\u044c\u0451\u043c', '\u043f\u044c\u0451\u0442\u0435', '\u043f\u044c\u044e\u0442'],
      past: ['\u043f\u0438\u043b', '\u043f\u0438\u043b\u0430', '\u043f\u0438\u043b\u043e', '\u043f\u0438\u043b\u0438'],
      imperative: ['\u043f\u0435\u0439', '\u043f\u0435\u0439\u0442\u0435'],
      tip: 'Consonant alternation. Perfective: \u0432\u044b\u043f\u0438\u0442\u044c.'
    },
    '\u043a\u0443\u043f\u0438\u0442\u044c': {
      meaning: 'to buy (perfective)',
      present: ['\u043a\u0443\u043f\u043b\u044e', '\u043a\u0443\u043f\u0438\u0448\u044c', '\u043a\u0443\u043f\u0438\u0442', '\u043a\u0443\u043f\u0438\u043c', '\u043a\u0443\u043f\u0438\u0442\u0435', '\u043a\u0443\u043f\u044f\u0442'],
      past: ['\u043a\u0443\u043f\u0438\u043b', '\u043a\u0443\u043f\u0438\u043b\u0430', '\u043a\u0443\u043f\u0438\u043b\u043e', '\u043a\u0443\u043f\u0438\u043b\u0438'],
      imperative: ['\u043a\u0443\u043f\u0438', '\u043a\u0443\u043f\u0438\u0442\u0435'],
      tip: 'Perfective form. Imperfective: \u043f\u043e\u043a\u0443\u043f\u0430\u0442\u044c. Consonant insertion \u043f\u043b in first person.'
    },
  },

  // ============================================================================
  // GRAMMAR PATTERN DETECTION
  // ============================================================================
  detectGrammarPatterns(russian, english) {
    const hints = [];
    const ruLower = russian.toLowerCase();
    const ruWords = ruLower.split(/\s+/);
    const hasWord = (words) => words.some(w => ruWords.includes(w));

    // Verb detection
    const verbs = window.COURSE_CONFIG?.verbs || {};
    for (const [verb, data] of Object.entries(verbs)) {
      const allForms = [];
      if (data.present) allForms.push(...data.present);
      if (data.past) allForms.push(...data.past);
      if (data.future) allForms.push(...data.future);
      if (data.imperative) allForms.push(...data.imperative);

      const validForms = allForms.filter(f => f !== null);

      if (hasWord(validForms)) {
        let hint = verb.toUpperCase() + ' (' + data.meaning + ')';
        if (data.tip) hint += ': ' + data.tip;
        hints.push(hint);
        break;
      }
    }

    // Case detection
    if (ruLower.includes('\u043d\u0435\u0442 ') || ruLower.includes('\u0431\u0435\u0437 ') || ruLower.includes('\u0438\u0437 ') || ruLower.includes('\u043e\u0442 ') || ruLower.includes('\u0434\u043e ')) {
      hints.push('GENITIVE CASE (\u0420.\u043f.): triggered by \u043d\u0435\u0442/\u0431\u0435\u0437/\u0438\u0437/\u043e\u0442/\u0434\u043e');
    }
    if (ruLower.includes('\u043a ') || ruLower.includes('\u043f\u043e ') || ruLower.includes('\u043d\u0443\u0436\u043d\u043e') || ruLower.includes('\u043c\u043e\u0436\u043d\u043e')) {
      hints.push('DATIVE CASE (\u0414.\u043f.): triggered by \u043a/\u043f\u043e/\u043d\u0443\u0436\u043d\u043e/\u043c\u043e\u0436\u043d\u043e');
    }
    if (ruLower.includes(' \u0441 ') || ruLower.includes(' \u0441\u043e ') || ruLower.includes('\u043c\u0435\u0436\u0434\u0443')) {
      hints.push('INSTRUMENTAL CASE (\u0422.\u043f.): triggered by \u0441/\u0441\u043e/\u043c\u0435\u0436\u0434\u0443');
    }
    if (ruLower.includes(' \u0432 ') || ruLower.includes(' \u043d\u0430 ') || ruLower.includes(' \u043e ') || ruLower.includes(' \u043e\u0431 ')) {
      hints.push('PREPOSITIONAL CASE (\u041f.\u043f.): triggered by \u0432/\u043d\u0430/\u043e');
    }

    // Negation
    if (ruLower.includes('\u043d\u0435 ')) {
      hints.push('NEGATION: \u043d\u0435 + verb');
    }

    // Aspect
    if (ruLower.includes('\u0431\u0443\u0434\u0443') || ruLower.includes('\u0431\u0443\u0434\u0435\u0448\u044c') || ruLower.includes('\u0431\u0443\u0434\u0435\u0442') || ruLower.includes('\u0431\u0443\u0434\u0435\u043c')) {
      hints.push('FUTURE: \u0431\u0443\u0434\u0443 + infinitive (imperfective future)');
    }

    return hints.length > 0 ? hints.slice(0, 2).join(' | ') : 'Basic vocabulary';
  },

  // ============================================================================
  // UNITS DATA - ALL RUSSIAN UNITS
  // ============================================================================
  totalUnits: 30,

  units: [
    {
      id: 0,
      volume: 1,
      title_target: '\u0410\u043b\u0444\u0430\u0432\u0438\u0442 \u0438 \u043e\u0441\u043d\u043e\u0432\u044b',
      title_source: 'Alphabet & Basics',
      title_ru: '\u0410\u043b\u0444\u0430\u0432\u0438\u0442 \u0438 \u043e\u0441\u043d\u043e\u0432\u044b',
      title_en: 'Alphabet & Basics',
      dialogue: [
        { speaker: '\u0423\u0447\u0438\u0442\u0435\u043b\u044c', ru: '\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435! \u0414\u0430\u0432\u0430\u0439\u0442\u0435 \u043d\u0430\u0447\u043d\u0451\u043c \u0441 \u0430\u043b\u0444\u0430\u0432\u0438\u0442\u0430.', en: 'Hello! Let\'s start with the alphabet.' },
        { speaker: '\u0423\u0447\u0435\u043d\u0438\u043a', ru: '\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435! \u0421\u043a\u043e\u043b\u044c\u043a\u043e \u0431\u0443\u043a\u0432 \u0432 \u0440\u0443\u0441\u0441\u043a\u043e\u043c \u0430\u043b\u0444\u0430\u0432\u0438\u0442\u0435?', en: 'Hello! How many letters are in the Russian alphabet?' },
        { speaker: '\u0423\u0447\u0438\u0442\u0435\u043b\u044c', ru: '\u0422\u0440\u0438\u0434\u0446\u0430\u0442\u044c \u0442\u0440\u0438 \u0431\u0443\u043a\u0432\u044b.', en: 'Thirty-three letters.' },
        { speaker: '\u0423\u0447\u0435\u043d\u0438\u043a', ru: '\u0410, \u0411, \u0412, \u0413, \u0414...', en: 'A, B, V, G, D...' },
        { speaker: '\u0423\u0447\u0438\u0442\u0435\u043b\u044c', ru: '\u041e\u0442\u043b\u0438\u0447\u043d\u043e! \u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0430\u0435\u043c.', en: 'Excellent! Let\'s continue.' }
      ],
      grammar: [
        { title: 'The Russian Alphabet', desc: '33 letters: \u0410 \u0411 \u0412 \u0413 \u0414 \u0415 \u0401 \u0416 \u0417 \u0418 \u0419 \u041a \u041b \u041c \u041d \u041e \u041f \u0420 \u0421 \u0422 \u0423 \u0424 \u0425 \u0426 \u0427 \u0428 \u0429 \u042a \u042b \u042c \u042d \u042e \u042f' },
        { title: 'Vowels', desc: 'Hard: \u0410 \u041e \u0423 \u042b \u042d | Soft: \u042f \u0401 \u042e \u0418 \u0415' },
        { title: 'Stress', desc: 'Russian stress is unpredictable. Unstressed \u041e \u2192 [\u0430], unstressed \u0415 \u2192 [\u0438]' }
      ]
    },
        {
      id: 1,
      volume: 1,
      title_target: 'Алфавит',
      title_source: 'The Russian Alphabet',
      title_ru: 'Алфавит',
      title_en: 'The Russian Alphabet',
      dialogue: [],
      grammar: []
    },
    {
      id: 2,
      volume: 1,
      title_target: '\u0417\u043d\u0430\u043a\u043e\u043c\u0441\u0442\u0432\u043e',
      title_source: 'Introductions & Family',
      title_ru: '\u0417\u043d\u0430\u043a\u043e\u043c\u0441\u0442\u0432\u043e',
      title_en: 'Introductions & Family',
      dialogue: [
        { speaker: '\u0410\u043d\u043d\u0430', ru: '\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435! \u041c\u0435\u043d\u044f \u0437\u043e\u0432\u0443\u0442 \u0410\u043d\u043d\u0430.', en: 'Hello! My name is Anna.' },
        { speaker: '\u0411\u043e\u0440\u0438\u0441', ru: '\u041e\u0447\u0435\u043d\u044c \u043f\u0440\u0438\u044f\u0442\u043d\u043e. \u042f \u0411\u043e\u0440\u0438\u0441.', en: 'Nice to meet you. I\'m Boris.' },
        { speaker: '\u0410\u043d\u043d\u0430', ru: '\u042d\u0442\u043e \u0432\u0430\u0448\u0430 \u0441\u0435\u043c\u044c\u044f?', en: 'Is this your family?' },
        { speaker: '\u0411\u043e\u0440\u0438\u0441', ru: '\u0414\u0430, \u044d\u0442\u043e \u043c\u043e\u044f \u0436\u0435\u043d\u0430 \u0438 \u043c\u043e\u0439 \u0441\u044b\u043d.', en: 'Yes, this is my wife and my son.' },
        { speaker: '\u0410\u043d\u043d\u0430', ru: '\u0412\u044b \u043e\u0442\u043a\u0443\u0434\u0430?', en: 'Where are you from?' },
        { speaker: '\u0411\u043e\u0440\u0438\u0441', ru: '\u042f \u0438\u0437 \u041c\u043e\u0441\u043a\u0432\u044b. \u0410 \u0432\u044b?', en: 'I\'m from Moscow. And you?' }
      ],
      grammar: [
        { title: 'Greetings', desc: '\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435 (formal hello), \u041f\u0440\u0438\u0432\u0435\u0442 (hi), \u041a\u0430\u043a \u0434\u0435\u043b\u0430? (How are you?)' },
        { title: '\u041c\u0435\u043d\u044f \u0437\u043e\u0432\u0443\u0442...', desc: 'My name is... (lit. me they-call)' },
        { title: 'Possessives', desc: '\u043c\u043e\u0439/\u043c\u043e\u044f/\u043c\u043e\u0451 (my m/f/n), \u0432\u0430\u0448/\u0432\u0430\u0448\u0430 (your formal m/f)' }
      ]
    },
    {
      id: 3,
      volume: 1,
      title_target: '\u041f\u043e\u0432\u0441\u0435\u0434\u043d\u0435\u0432\u043d\u0430\u044f \u0436\u0438\u0437\u043d\u044c',
      title_source: 'Daily Life & Activities',
      title_ru: '\u041f\u043e\u0432\u0441\u0435\u0434\u043d\u0435\u0432\u043d\u0430\u044f \u0436\u0438\u0437\u043d\u044c',
      title_en: 'Daily Life & Activities',
      dialogue: [
        { speaker: '\u041c\u0430\u0448\u0430', ru: '\u0427\u0442\u043e \u0432\u044b \u0434\u0435\u043b\u0430\u0435\u0442\u0435 \u043a\u0430\u0436\u0434\u044b\u0439 \u0434\u0435\u043d\u044c?', en: 'What do you do every day?' },
        { speaker: '\u0418\u0432\u0430\u043d', ru: '\u0423\u0442\u0440\u043e\u043c \u044f \u0440\u0430\u0431\u043e\u0442\u0430\u044e, \u0430 \u0432\u0435\u0447\u0435\u0440\u043e\u043c \u043e\u0442\u0434\u044b\u0445\u0430\u044e.', en: 'In the morning I work, in the evening I rest.' },
        { speaker: '\u041c\u0430\u0448\u0430', ru: '\u0410 \u0447\u0442\u043e \u0432\u044b \u043b\u044e\u0431\u0438\u0442\u0435 \u0434\u0435\u043b\u0430\u0442\u044c?', en: 'And what do you like to do?' },
        { speaker: '\u0418\u0432\u0430\u043d', ru: '\u042f \u043b\u044e\u0431\u043b\u044e \u0447\u0438\u0442\u0430\u0442\u044c \u043a\u043d\u0438\u0433\u0438 \u0438 \u0433\u0443\u043b\u044f\u0442\u044c \u0432 \u043f\u0430\u0440\u043a\u0435.', en: 'I like to read books and walk in the park.' }
      ],
      grammar: [
        { title: 'Present Tense', desc: '-\u0430\u0442\u044c verbs: \u0440\u0430\u0431\u043e\u0442\u0430\u0442\u044c \u2192 \u044f \u0440\u0430\u0431\u043e\u0442\u0430\u044e, \u0442\u044b \u0440\u0430\u0431\u043e\u0442\u0430\u0435\u0448\u044c, \u043e\u043d \u0440\u0430\u0431\u043e\u0442\u0430\u0435\u0442' },
        { title: 'Accusative Case', desc: '\u042f \u0447\u0438\u0442\u0430\u044e \u043a\u043d\u0438\u0433\u0443 (I read a book). Fem -\u0430 \u2192 -\u0443' },
        { title: 'Frequency', desc: '\u0432\u0441\u0435\u0433\u0434\u0430 (always), \u0447\u0430\u0441\u0442\u043e (often), \u0438\u043d\u043e\u0433\u0434\u0430 (sometimes)' }
      ]
    },
    {
      id: 4,
      volume: 1,
      title_target: '\u041f\u043e\u043a\u0443\u043f\u043a\u0438 \u0438 \u0433\u043e\u0440\u043e\u0434',
      title_source: 'Shopping & Around Town',
      title_ru: '\u041f\u043e\u043a\u0443\u043f\u043a\u0438 \u0438 \u0433\u043e\u0440\u043e\u0434',
      title_en: 'Shopping & Around Town',
      dialogue: [
        { speaker: '\u041f\u043e\u043a\u0443\u043f\u0430\u0442\u0435\u043b\u044c', ru: '\u0421\u043a\u043e\u043b\u044c\u043a\u043e \u0441\u0442\u043e\u0438\u0442 \u044d\u0442\u0430 \u043a\u043d\u0438\u0433\u0430?', en: 'How much does this book cost?' },
        { speaker: '\u041f\u0440\u043e\u0434\u0430\u0432\u0435\u0446', ru: '\u041f\u044f\u0442\u044c\u0441\u043e\u0442 \u0440\u0443\u0431\u043b\u0435\u0439.', en: 'Five hundred rubles.' },
        { speaker: '\u041f\u043e\u043a\u0443\u043f\u0430\u0442\u0435\u043b\u044c', ru: '\u041c\u043e\u0436\u043d\u043e \u043a\u0430\u0440\u0442\u043e\u0439?', en: 'Can I pay by card?' },
        { speaker: '\u041f\u0440\u043e\u0434\u0430\u0432\u0435\u0446', ru: '\u041a\u043e\u043d\u0435\u0447\u043d\u043e!', en: 'Of course!' }
      ],
      grammar: [
        { title: '\u0421\u043a\u043e\u043b\u044c\u043a\u043e \u0441\u0442\u043e\u0438\u0442?', desc: 'How much? \u0440\u0443\u0431\u043b\u044c/\u0440\u0443\u0431\u043b\u044f/\u0440\u0443\u0431\u043b\u0435\u0439 (ruble/rubles)' },
        { title: 'Adjectives', desc: '\u043a\u0440\u0430\u0441\u0438\u0432\u044b\u0439/\u043a\u0440\u0430\u0441\u0438\u0432\u0430\u044f/\u043a\u0440\u0430\u0441\u0438\u0432\u043e\u0435 (beautiful m/f/n)' },
        { title: 'Imperatives', desc: '\u0421\u043a\u0430\u0436\u0438\u0442\u0435! (Tell!), \u041f\u043e\u0441\u043c\u043e\u0442\u0440\u0438\u0442\u0435! (Look!)' }
      ]
    },
    {
      id: 5,
      volume: 1,
      title_target: '\u041e\u0431\u0449\u0435\u043d\u0438\u0435',
      title_source: 'Communication & Social Life',
      title_ru: '\u041e\u0431\u0449\u0435\u043d\u0438\u0435',
      title_en: 'Communication & Social Life',
      dialogue: [
        { speaker: '\u041a\u0430\u0442\u044f', ru: '\u041f\u0440\u0438\u0432\u0435\u0442! \u041a\u0430\u043a \u0443 \u0442\u0435\u0431\u044f \u0434\u0435\u043b\u0430?', en: 'Hi! How are you?' },
        { speaker: '\u0414\u0438\u043c\u0430', ru: '\u0425\u043e\u0440\u043e\u0448\u043e! \u0414\u0430\u0432\u0430\u0439 \u043f\u043e\u0439\u0434\u0451\u043c \u0432 \u043a\u0438\u043d\u043e!', en: 'Good! Let\'s go to the movies!' },
        { speaker: '\u041a\u0430\u0442\u044f', ru: '\u0414\u0430\u0432\u0430\u0439! \u0412\u043e \u0441\u043a\u043e\u043b\u044c\u043a\u043e?', en: 'Let\'s! At what time?' },
        { speaker: '\u0414\u0438\u043c\u0430', ru: '\u0412 \u0441\u0435\u043c\u044c \u0447\u0430\u0441\u043e\u0432.', en: 'At seven o\'clock.' }
      ],
      grammar: [
        { title: 'Informal (\u0442\u044b)', desc: '\u041a\u0430\u043a \u0443 \u0442\u0435\u0431\u044f \u0434\u0435\u043b\u0430? \u0422\u044b \u0437\u0430\u043d\u044f\u0442? (Are you busy? m)' },
        { title: '\u0414\u0430\u0432\u0430\u0439/\u0414\u0430\u0432\u0430\u0439\u0442\u0435', desc: 'Let\'s + verb: \u0414\u0430\u0432\u0430\u0439 \u043f\u043e\u0439\u0434\u0451\u043c!' },
        { title: 'Time', desc: '\u0432\u043e \u0441\u043a\u043e\u043b\u044c\u043a\u043e? (at what time?), \u0432 \u0441\u0435\u043c\u044c \u0447\u0430\u0441\u043e\u0432 (at 7)' }
      ]
    },
    {
      id: 6,
      volume: 1,
      title_target: '\u0421\u0435\u043c\u044c\u044f \u0438 \u0436\u0438\u0432\u043e\u0442\u043d\u044b\u0435',
      title_source: 'Family, Pets & Possession',
      title_ru: '\u0421\u0435\u043c\u044c\u044f \u0438 \u0436\u0438\u0432\u043e\u0442\u043d\u044b\u0435',
      title_en: 'Family, Pets & Possession',
      dialogue: [
        { speaker: '\u041b\u0435\u043d\u0430', ru: '\u0421\u043a\u043e\u043b\u044c\u043a\u043e \u0442\u0435\u0431\u0435 \u043b\u0435\u0442?', en: 'How old are you?' },
        { speaker: '\u041c\u0438\u0448\u0430', ru: '\u041c\u043d\u0435 \u0434\u0432\u0430\u0434\u0446\u0430\u0442\u044c \u043f\u044f\u0442\u044c \u043b\u0435\u0442.', en: 'I\'m twenty-five.' },
        { speaker: '\u041b\u0435\u043d\u0430', ru: '\u0423 \u0442\u0435\u0431\u044f \u0435\u0441\u0442\u044c \u0434\u043e\u043c\u0430\u0448\u043d\u0438\u0435 \u0436\u0438\u0432\u043e\u0442\u043d\u044b\u0435?', en: 'Do you have pets?' },
        { speaker: '\u041c\u0438\u0448\u0430', ru: '\u0414\u0430, \u0443 \u043c\u0435\u043d\u044f \u0435\u0441\u0442\u044c \u043a\u043e\u0448\u043a\u0430 \u0438 \u0441\u043e\u0431\u0430\u043a\u0430.', en: 'Yes, I have a cat and a dog.' }
      ],
      grammar: [
        { title: 'Age', desc: '\u041c\u043d\u0435 ... \u043b\u0435\u0442: Dative + number + \u0433\u043e\u0434/\u0433\u043e\u0434\u0430/\u043b\u0435\u0442' },
        { title: 'Possession', desc: '\u0423 \u043c\u0435\u043d\u044f \u0435\u0441\u0442\u044c (I have) / \u0423 \u043c\u0435\u043d\u044f \u043d\u0435\u0442 + gen (I don\'t have)' },
        { title: 'Genitive Case', desc: '\u043d\u0435\u0442 + gen: \u0423 \u043c\u0435\u043d\u044f \u043d\u0435\u0442 \u043a\u043e\u0448\u043a\u0438. Masc -\u0430/-\u044f, Fem -\u044b/-\u0438' }
      ]
    },
    {
      id: 7,
      volume: 1,
      title_target: '\u0413\u043e\u0440\u043e\u0434\u0430 \u0438 \u043d\u0430\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f',
      title_source: 'Cities, Directions & Location',
      title_ru: '\u0413\u043e\u0440\u043e\u0434\u0430 \u0438 \u043d\u0430\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f',
      title_en: 'Cities, Directions & Location',
      dialogue: [
        { speaker: '\u0422\u0443\u0440\u0438\u0441\u0442', ru: '\u041a\u0430\u043a \u043f\u0440\u043e\u0439\u0442\u0438 \u043a \u041a\u0440\u0430\u0441\u043d\u043e\u0439 \u043f\u043b\u043e\u0449\u0430\u0434\u0438?', en: 'How do I get to Red Square?' },
        { speaker: '\u041f\u0440\u043e\u0445\u043e\u0436\u0438\u0439', ru: '\u0418\u0434\u0438\u0442\u0435 \u043f\u0440\u044f\u043c\u043e, \u043f\u043e\u0442\u043e\u043c \u043d\u0430\u043f\u0440\u0430\u0432\u043e.', en: 'Go straight, then right.' },
        { speaker: '\u0422\u0443\u0440\u0438\u0441\u0442', ru: '\u042d\u0442\u043e \u0434\u0430\u043b\u0435\u043a\u043e?', en: 'Is it far?' },
        { speaker: '\u041f\u0440\u043e\u0445\u043e\u0436\u0438\u0439', ru: '\u041d\u0435\u0442, \u043c\u0438\u043d\u0443\u0442 \u0434\u0435\u0441\u044f\u0442\u044c \u043f\u0435\u0448\u043a\u043e\u043c.', en: 'No, about ten minutes on foot.' }
      ],
      grammar: [
        { title: 'Prepositional Case', desc: '\u0432 \u041c\u043e\u0441\u043a\u0432\u0435 (in Moscow), \u043d\u0430 \u043f\u043b\u043e\u0449\u0430\u0434\u0438 (at the square)' },
        { title: 'Directions', desc: '\u043f\u0440\u044f\u043c\u043e (straight), \u043d\u0430\u043f\u0440\u0430\u0432\u043e (right), \u043d\u0430\u043b\u0435\u0432\u043e (left)' },
        { title: '\u0412 vs \u041d\u0430', desc: '\u0432 = inside (\u0432 \u0434\u043e\u043c\u0435), \u043d\u0430 = on/at (\u043d\u0430 \u043f\u043b\u043e\u0449\u0430\u0434\u0438, \u043d\u0430 \u0440\u0430\u0431\u043e\u0442\u0435)' }
      ]
    },
    {
      id: 8,
      volume: 1,
      title_target: '\u041e\u0431\u044a\u044f\u0441\u043d\u0435\u043d\u0438\u044f',
      title_source: 'Explanations & Contrasts',
      title_ru: '\u041e\u0431\u044a\u044f\u0441\u043d\u0435\u043d\u0438\u044f',
      title_en: 'Explanations & Contrasts',
      dialogue: [
        { speaker: '\u0421\u0442\u0443\u0434\u0435\u043d\u0442', ru: '\u042f \u043d\u0435 \u043f\u043e\u043d\u0438\u043c\u0430\u044e \u0440\u0430\u0437\u043d\u0438\u0446\u0443 \u043c\u0435\u0436\u0434\u0443 \u00ab\u0437\u043d\u0430\u0442\u044c\u00bb \u0438 \u00ab\u0443\u043c\u0435\u0442\u044c\u00bb.', en: 'I don\'t understand the difference between "know" and "know how to".' },
        { speaker: '\u0423\u0447\u0438\u0442\u0435\u043b\u044c', ru: '\u0417\u043d\u0430\u0442\u044c \u2014 \u044d\u0442\u043e \u0437\u043d\u0430\u043d\u0438\u0435 \u0444\u0430\u043a\u0442\u043e\u0432. \u0423\u043c\u0435\u0442\u044c \u2014 \u044d\u0442\u043e \u043d\u0430\u0432\u044b\u043a.', en: '\u0417\u043d\u0430\u0442\u044c is knowing facts. \u0423\u043c\u0435\u0442\u044c is a skill.' },
        { speaker: '\u0423\u0447\u0438\u0442\u0435\u043b\u044c', ru: '\u042f \u0437\u043d\u0430\u044e \u0440\u0443\u0441\u0441\u043a\u0438\u0439 \u044f\u0437\u044b\u043a. \u042f \u0443\u043c\u0435\u044e \u0433\u043e\u0432\u043e\u0440\u0438\u0442\u044c \u043f\u043e-\u0440\u0443\u0441\u0441\u043a\u0438.', en: 'I know the Russian language. I can speak Russian.' }
      ],
      grammar: [
        { title: '\u0417\u043d\u0430\u0442\u044c vs \u0423\u043c\u0435\u0442\u044c', desc: '\u0437\u043d\u0430\u0442\u044c (know facts) vs \u0443\u043c\u0435\u0442\u044c (know how to)' },
        { title: 'Adverbs', desc: '\u0445\u043e\u0440\u043e\u0448\u043e (well), \u0431\u044b\u0441\u0442\u0440\u043e (fast), \u043c\u0435\u0434\u043b\u0435\u043d\u043d\u043e (slow)' },
        { title: 'Negation', desc: '\u043d\u0435 + verb: \u042f \u043d\u0435 \u043f\u043e\u043d\u0438\u043c\u0430\u044e (I don\'t understand)' }
      ]
    },
    {
      id: 9,
      volume: 1,
      title_target: '\u0427\u0438\u0441\u043b\u0430 \u0438 \u0434\u0435\u043d\u044c\u0433\u0438',
      title_source: 'Numbers, Age & Money',
      title_ru: '\u0427\u0438\u0441\u043b\u0430 \u0438 \u0434\u0435\u043d\u044c\u0433\u0438',
      title_en: 'Numbers, Age & Money',
      dialogue: [
        { speaker: '\u041a\u0430\u0441\u0441\u0438\u0440', ru: '\u0421 \u0432\u0430\u0441 \u0442\u044b\u0441\u044f\u0447\u0430 \u0434\u0432\u0435\u0441\u0442\u0438 \u0440\u0443\u0431\u043b\u0435\u0439.', en: 'That\'ll be 1200 rubles.' },
        { speaker: '\u041f\u043e\u043a\u0443\u043f\u0430\u0442\u0435\u043b\u044c', ru: '\u0412\u043e\u0442, \u043f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430.', en: 'Here you go.' },
        { speaker: '\u041a\u0430\u0441\u0441\u0438\u0440', ru: '\u0412\u0430\u0448\u0430 \u0441\u0434\u0430\u0447\u0430 \u2014 \u0442\u0440\u0438\u0441\u0442\u0430 \u0440\u0443\u0431\u043b\u0435\u0439.', en: 'Your change is 300 rubles.' }
      ],
      grammar: [
        { title: 'Numbers 100-1000', desc: '\u0441\u0442\u043e (100), \u0434\u0432\u0435\u0441\u0442\u0438 (200), \u0442\u0440\u0438\u0441\u0442\u0430 (300), \u0442\u044b\u0441\u044f\u0447\u0430 (1000)' },
        { title: 'Numbers + Genitive', desc: '2-4 + gen.sg: \u0434\u0432\u0430 \u0440\u0443\u0431\u043b\u044f | 5-20 + gen.pl: \u043f\u044f\u0442\u044c \u0440\u0443\u0431\u043b\u0435\u0439' },
        { title: 'Money', desc: '\u0440\u0443\u0431\u043b\u044c/\u0440\u0443\u0431\u043b\u044f/\u0440\u0443\u0431\u043b\u0435\u0439, \u043a\u043e\u043f\u0435\u0439\u043a\u0430/\u043a\u043e\u043f\u0435\u0435\u043a, \u0441\u043a\u0438\u0434\u043a\u0430 (discount)' }
      ]
    },
    {
      id: 10,
      volume: 1,
      title_target: '\u0414\u0438\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u043a\u0430',
      title_source: 'Diagnostic & Grammar Review',
      title_ru: '\u0414\u0438\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u043a\u0430',
      title_en: 'Diagnostic & Grammar Review',
      dialogue: [
        { speaker: '\u0423\u0447\u0438\u0442\u0435\u043b\u044c', ru: '\u0414\u0430\u0432\u0430\u0439\u0442\u0435 \u043f\u0440\u043e\u0432\u0435\u0440\u0438\u043c, \u0447\u0442\u043e \u0432\u044b \u0443\u0436\u0435 \u0437\u043d\u0430\u0435\u0442\u0435.', en: 'Let\'s check what you already know.' },
        { speaker: '\u0423\u0447\u0435\u043d\u0438\u043a', ru: '\u0425\u043e\u0440\u043e\u0448\u043e, \u044f \u0433\u043e\u0442\u043e\u0432!', en: 'Okay, I\'m ready!' }
      ],
      grammar: [
        { title: 'Review', desc: 'This unit reviews grammar from Units 0-9.' },
        { title: 'Key Cases', desc: 'Nom (\u043a\u0442\u043e?), Gen (\u043a\u043e\u0433\u043e?), Dat (\u043a\u043e\u043c\u0443?), Acc (\u043a\u043e\u0433\u043e?/\u0447\u0442\u043e?), Inst (\u043a\u0435\u043c?), Prep (\u043e \u043a\u043e\u043c?)' }
      ]
    },
    {
      id: 11,
      volume: 2,
      title_target: '\u0417\u0434\u043e\u0440\u043e\u0432\u044c\u0435 \u0438 \u0447\u0443\u0432\u0441\u0442\u0432\u0430',
      title_source: 'Health, Feelings & Necessity',
      title_ru: '\u0417\u0434\u043e\u0440\u043e\u0432\u044c\u0435 \u0438 \u0447\u0443\u0432\u0441\u0442\u0432\u0430',
      title_en: 'Health, Feelings & Necessity',
      dialogue: [
        { speaker: '\u041f\u0430\u0446\u0438\u0435\u043d\u0442', ru: '\u0423 \u043c\u0435\u043d\u044f \u0431\u043e\u043b\u0438\u0442 \u0433\u043e\u043b\u043e\u0432\u0430.', en: 'My head hurts.' },
        { speaker: '\u0412\u0440\u0430\u0447', ru: '\u0412\u0430\u043c \u043d\u0443\u0436\u043d\u043e \u043e\u0442\u0434\u044b\u0445\u0430\u0442\u044c.', en: 'You need to rest.' }
      ],
      grammar: [
        { title: '\u0411\u043e\u043b\u0438\u0442...', desc: '\u0423 \u043c\u0435\u043d\u044f \u0431\u043e\u043b\u0438\u0442 \u0433\u043e\u043b\u043e\u0432\u0430/\u0436\u0438\u0432\u043e\u0442/\u0433\u043e\u0440\u043b\u043e' },
        { title: 'Dative Case', desc: '\u041c\u043d\u0435 \u0445\u043e\u043b\u043e\u0434\u043d\u043e (I\'m cold), \u041c\u043d\u0435 \u043d\u0443\u0436\u043d\u043e (I need to)' },
        { title: '\u041d\u0443\u0436\u043d\u043e / \u043d\u0430\u0434\u043e', desc: 'Dat + \u043d\u0443\u0436\u043d\u043e + inf: \u041c\u043d\u0435 \u043d\u0443\u0436\u043d\u043e \u0440\u0430\u0431\u043e\u0442\u0430\u0442\u044c' }
      ]
    },
    {
      id: 12,
      volume: 2,
      title_target: '\u041f\u043e\u043c\u043e\u0449\u044c \u0438 \u043f\u0440\u0435\u0434\u043b\u043e\u0433\u0438',
      title_source: 'Helping, Prepositions & Cases',
      title_ru: '\u041f\u043e\u043c\u043e\u0449\u044c \u0438 \u043f\u0440\u0435\u0434\u043b\u043e\u0433\u0438',
      title_en: 'Helping, Prepositions & Cases',
      dialogue: [
        { speaker: '\u041e\u043b\u0435\u0433', ru: '\u041f\u043e\u043c\u043e\u0433\u0438 \u043c\u043d\u0435 \u0441 \u0434\u043e\u043c\u0430\u0448\u043d\u0438\u043c \u0437\u0430\u0434\u0430\u043d\u0438\u0435\u043c!', en: 'Help me with the homework!' },
        { speaker: '\u0421\u0432\u0435\u0442\u0430', ru: '\u041a\u043e\u043d\u0435\u0447\u043d\u043e! \u0421 \u0447\u0435\u043c?', en: 'Of course! With what?' },
        { speaker: '\u041e\u043b\u0435\u0433', ru: '\u0421 \u043f\u0440\u0435\u0434\u043b\u043e\u0433\u0430\u043c\u0438.', en: 'With prepositions.' }
      ],
      grammar: [
        { title: 'Prepositions + Cases', desc: '\u0432/\u043d\u0430 + prep (where), \u0432/\u043d\u0430 + acc (where to), \u0441 + inst (with)' },
        { title: 'All Six Cases', desc: 'Nom, Gen, Dat, Acc, Inst, Prep' }
      ]
    },
    {
      id: 13,
      volume: 2,
      title_target: '\u0415\u0434\u0430 \u0438 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u0430\u043b\u044c\u043d\u044b\u0439',
      title_source: 'Food & Instrumental Case',
      title_ru: '\u0415\u0434\u0430 \u0438 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u0430\u043b\u044c\u043d\u044b\u0439',
      title_en: 'Food & Instrumental Case',
      dialogue: [
        { speaker: '\u041e\u0444\u0438\u0446\u0438\u0430\u043d\u0442', ru: '\u0427\u0442\u043e \u0431\u0443\u0434\u0435\u0442\u0435 \u0437\u0430\u043a\u0430\u0437\u044b\u0432\u0430\u0442\u044c?', en: 'What will you order?' },
        { speaker: '\u0413\u043e\u0441\u0442\u044c', ru: '\u0411\u043e\u0440\u0449 \u0441\u043e \u0441\u043c\u0435\u0442\u0430\u043d\u043e\u0439 \u0438 \u043f\u0435\u043b\u044c\u043c\u0435\u043d\u0438 \u0441 \u0433\u0440\u0438\u0431\u0430\u043c\u0438.', en: 'Borscht with sour cream and pelmeni with mushrooms.' },
        { speaker: '\u041e\u0444\u0438\u0446\u0438\u0430\u043d\u0442', ru: '\u0427\u0430\u0439 \u0438\u043b\u0438 \u043a\u043e\u0444\u0435?', en: 'Tea or coffee?' },
        { speaker: '\u0413\u043e\u0441\u0442\u044c', ru: '\u0427\u0430\u0439 \u0441 \u043b\u0438\u043c\u043e\u043d\u043e\u043c.', en: 'Tea with lemon.' }
      ],
      grammar: [
        { title: 'Instrumental Case', desc: '\u0441 + inst: \u0441\u043e \u0441\u043c\u0435\u0442\u0430\u043d\u043e\u0439, \u0441 \u0433\u0440\u0438\u0431\u0430\u043c\u0438, \u0441 \u043b\u0438\u043c\u043e\u043d\u043e\u043c' },
        { title: 'Food', desc: '\u0431\u043e\u0440\u0449, \u043f\u0435\u043b\u044c\u043c\u0435\u043d\u0438, \u0441\u043c\u0435\u0442\u0430\u043d\u0430, \u0445\u043b\u0435\u0431' }
      ]
    },
    {
      id: 14,
      volume: 2,
      title_target: '\u041f\u0430\u0434\u0435\u0436\u0438',
      title_source: 'All Cases Review',
      title_ru: '\u041f\u0430\u0434\u0435\u0436\u0438',
      title_en: 'All Cases Review',
      dialogue: [
        { speaker: '\u0423\u0447\u0438\u0442\u0435\u043b\u044c', ru: '\u0421\u0435\u0433\u043e\u0434\u043d\u044f \u043c\u044b \u043f\u043e\u0432\u0442\u043e\u0440\u044f\u0435\u043c \u0432\u0441\u0435 \u043f\u0430\u0434\u0435\u0436\u0438.', en: 'Today we review all cases.' },
        { speaker: '\u0423\u0447\u0435\u043d\u0438\u043a', ru: '\u0412\u0441\u0435 \u0448\u0435\u0441\u0442\u044c?', en: 'All six?' }
      ],
      grammar: [
        { title: 'All 6 Cases', desc: 'Nom: subject | Gen: of/none | Dat: to/for | Acc: direct object | Inst: with | Prep: about/in' },
        { title: 'Case Triggers', desc: '\u043d\u0435\u0442 + gen, \u043a + dat, \u0432/\u043d\u0430 + acc, \u0441 + inst, \u043e + prep' }
      ]
    },
    {
      id: 15,
      volume: 2,
      title_target: '\u0414\u0432\u0438\u0436\u0435\u043d\u0438\u0435 \u0438 \u0447\u0443\u0432\u0441\u0442\u0432\u0430',
      title_source: 'Motion, Feelings & Dialogue',
      title_ru: '\u0414\u0432\u0438\u0436\u0435\u043d\u0438\u0435 \u0438 \u0447\u0443\u0432\u0441\u0442\u0432\u0430',
      title_en: 'Motion, Feelings & Dialogue',
      dialogue: [
        { speaker: '\u041d\u0430\u0442\u0430\u0448\u0430', ru: '\u041a\u0443\u0434\u0430 \u0442\u044b \u0438\u0434\u0451\u0448\u044c?', en: 'Where are you going?' },
        { speaker: '\u041f\u0435\u0442\u044f', ru: '\u042f \u0438\u0434\u0443 \u0432 \u0443\u043d\u0438\u0432\u0435\u0440\u0441\u0438\u0442\u0435\u0442.', en: 'I\'m going to the university.' },
        { speaker: '\u041d\u0430\u0442\u0430\u0448\u0430', ru: '\u042f \u0435\u0434\u0443 \u043d\u0430 \u0440\u0430\u0431\u043e\u0442\u0443 \u043d\u0430 \u0430\u0432\u0442\u043e\u0431\u0443\u0441\u0435.', en: 'I\'m going to work by bus.' }
      ],
      grammar: [
        { title: 'Motion Verbs', desc: '\u0438\u0434\u0442\u0438/\u0445\u043e\u0434\u0438\u0442\u044c (on foot), \u0435\u0445\u0430\u0442\u044c/\u0435\u0437\u0434\u0438\u0442\u044c (by vehicle)' },
        { title: 'Direction: \u0432/\u043d\u0430 + Acc', desc: '\u042f \u0438\u0434\u0443 \u0432 \u0448\u043a\u043e\u043b\u0443, \u042f \u0435\u0434\u0443 \u043d\u0430 \u0440\u0430\u0431\u043e\u0442\u0443' }
      ]
    },
    {
      id: 16,
      volume: 2,
      title_target: '\u0420\u0435\u0441\u0442\u043e\u0440\u0430\u043d',
      title_source: 'Restaurant & Ordering',
      title_ru: '\u0420\u0435\u0441\u0442\u043e\u0440\u0430\u043d',
      title_en: 'Restaurant & Ordering',
      dialogue: [
        { speaker: '\u041e\u0444\u0438\u0446\u0438\u0430\u043d\u0442', ru: '\u0414\u043e\u0431\u0440\u043e \u043f\u043e\u0436\u0430\u043b\u043e\u0432\u0430\u0442\u044c!', en: 'Welcome!' },
        { speaker: '\u0413\u043e\u0441\u0442\u044c', ru: '\u041c\u043e\u0436\u043d\u043e \u043c\u0435\u043d\u044e?', en: 'May I have the menu?' },
        { speaker: '\u041e\u0444\u0438\u0446\u0438\u0430\u043d\u0442', ru: '\u0420\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0443\u044e \u0448\u0430\u0448\u043b\u044b\u043a.', en: 'I recommend shashlik.' },
        { speaker: '\u0413\u043e\u0441\u0442\u044c', ru: '\u041c\u043e\u0436\u043d\u043e \u0441\u0447\u0451\u0442?', en: 'Can I have the check?' }
      ],
      grammar: [
        { title: '\u041c\u043e\u0436\u043d\u043e + infinitive', desc: '\u041c\u043e\u0436\u043d\u043e \u043c\u0435\u043d\u044e? \u041c\u043e\u0436\u043d\u043e \u043f\u043e\u0441\u043c\u043e\u0442\u0440\u0435\u0442\u044c?' },
        { title: 'Genitive with Quantities', desc: '\u0431\u0443\u0442\u044b\u043b\u043a\u0430 \u0432\u043e\u0434\u044b, \u0447\u0430\u0448\u043a\u0430 \u0447\u0430\u044f' }
      ]
    },
        {
      id: 17,
      volume: 2,
      title_target: 'Повседневная речь',
      title_source: 'Everyday Speech',
      title_ru: 'Повседневная речь',
      title_en: 'Everyday Speech',
      dialogue: [],
      grammar: []
    },
    {
      id: 18,
      volume: 3,
      title_target: '\u041f\u0440\u043e\u0448\u0435\u0434\u0448\u0435\u0435 \u0432\u0440\u0435\u043c\u044f',
      title_source: 'Past Tense Formation',
      title_ru: '\u041f\u0440\u043e\u0448\u0435\u0434\u0448\u0435\u0435 \u0432\u0440\u0435\u043c\u044f',
      title_en: 'Past Tense Formation',
      dialogue: [
        { speaker: '\u041c\u0430\u0448\u0430', ru: '\u0427\u0442\u043e \u0442\u044b \u0434\u0435\u043b\u0430\u043b \u0432\u0447\u0435\u0440\u0430?', en: 'What did you do yesterday?' },
        { speaker: '\u0421\u0430\u0448\u0430', ru: '\u042f \u0447\u0438\u0442\u0430\u043b \u043a\u043d\u0438\u0433\u0443 \u0438 \u0441\u043c\u043e\u0442\u0440\u0435\u043b \u0444\u0438\u043b\u044c\u043c.', en: 'I read a book and watched a movie.' },
        { speaker: '\u041c\u0430\u0448\u0430', ru: '\u0410 \u044f \u0445\u043e\u0434\u0438\u043b\u0430 \u0432 \u043c\u0443\u0437\u0435\u0439.', en: 'And I went to the museum.' }
      ],
      grammar: [
        { title: 'Past Tense', desc: 'Remove -\u0442\u044c, add -\u043b (m), -\u043b\u0430 (f), -\u043b\u043e (n), -\u043b\u0438 (pl)' },
        { title: 'Gender Agreement', desc: '\u041e\u043d \u0447\u0438\u0442\u0430\u043b, \u041e\u043d\u0430 \u0447\u0438\u0442\u0430\u043b\u0430, \u041e\u043d\u0438 \u0447\u0438\u0442\u0430\u043b\u0438' },
        { title: 'Irregular Past', desc: '\u0438\u0434\u0442\u0438 \u2192 \u0448\u0451\u043b/\u0448\u043b\u0430, \u0435\u0441\u0442\u044c \u2192 \u0435\u043b/\u0435\u043b\u0430' }
      ]
    },
        {
      id: 19,
      volume: 2,
      title_target: 'Совершенный вид',
      title_source: 'Perfective Aspect',
      title_ru: 'Совершенный вид',
      title_en: 'Perfective Aspect',
      dialogue: [],
      grammar: []
    },
    {
      id: 20,
      volume: 3,
      title_target: '\u0412\u0438\u0434\u044b \u0438 \u043f\u043e\u043a\u0443\u043f\u043a\u0438',
      title_source: 'Aspect & Shopping',
      title_ru: '\u0412\u0438\u0434\u044b \u0438 \u043f\u043e\u043a\u0443\u043f\u043a\u0438',
      title_en: 'Aspect & Shopping',
      dialogue: [
        { speaker: '\u041b\u0435\u043d\u0430', ru: '\u0422\u044b \u0443\u0436\u0435 \u043a\u0443\u043f\u0438\u043b\u0430 \u043f\u043e\u0434\u0430\u0440\u043e\u043a?', en: 'Have you bought the gift yet?' },
        { speaker: '\u041e\u043b\u044f', ru: '\u041d\u0435\u0442, \u044f \u0438\u0441\u043a\u0430\u043b\u0430 \u0432\u0435\u0441\u044c \u0434\u0435\u043d\u044c, \u043d\u043e \u043d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u043d\u0430\u0448\u043b\u0430.', en: 'No, I searched all day but found nothing.' },
        { speaker: '\u041b\u0435\u043d\u0430', ru: '\u0414\u0430\u0432\u0430\u0439 \u0432\u043c\u0435\u0441\u0442\u0435 \u043f\u043e\u0438\u0449\u0435\u043c \u0437\u0430\u0432\u0442\u0440\u0430.', en: 'Let\'s look together tomorrow.' }
      ],
      grammar: [
        { title: 'Verbal Aspect', desc: 'Imperfective (process): \u043f\u043e\u043a\u0443\u043f\u0430\u0442\u044c | Perfective (result): \u043a\u0443\u043f\u0438\u0442\u044c' },
        { title: 'Aspect Pairs', desc: '\u0434\u0435\u043b\u0430\u0442\u044c/\u0441\u0434\u0435\u043b\u0430\u0442\u044c, \u043f\u043e\u043a\u0443\u043f\u0430\u0442\u044c/\u043a\u0443\u043f\u0438\u0442\u044c, \u0438\u0441\u043a\u0430\u0442\u044c/\u043d\u0430\u0439\u0442\u0438' }
      ]
    },
        {
      id: 21,
      volume: 3,
      title_target: 'Глаголы движения',
      title_source: 'Verbs of Motion I',
      title_ru: 'Глаголы движения',
      title_en: 'Verbs of Motion I',
      dialogue: [],
      grammar: []
    },
        {
      id: 22,
      volume: 3,
      title_target: 'Глаголы движения II',
      title_source: 'Verbs of Motion II',
      title_ru: 'Глаголы движения II',
      title_en: 'Verbs of Motion II',
      dialogue: [],
      grammar: []
    },
        {
      id: 23,
      volume: 3,
      title_target: 'Транспорт и условные',
      title_source: 'Transport & Conditionals',
      title_ru: 'Транспорт и условные',
      title_en: 'Transport & Conditionals',
      dialogue: [],
      grammar: []
    },
        {
      id: 24,
      volume: 3,
      title_target: 'Условное наклонение',
      title_source: 'Conditional Mood',
      title_ru: 'Условное наклонение',
      title_en: 'Conditional Mood',
      dialogue: [],
      grammar: []
    },
    {
      id: 25,
      volume: 3,
      title_target: '\u0411\u0443\u0434\u0443\u0449\u0435\u0435 \u0438 \u0434\u0432\u0438\u0436\u0435\u043d\u0438\u0435',
      title_source: 'Future Tense & Motion Verbs',
      title_ru: '\u0411\u0443\u0434\u0443\u0449\u0435\u0435 \u0438 \u0434\u0432\u0438\u0436\u0435\u043d\u0438\u0435',
      title_en: 'Future Tense & Motion Verbs',
      dialogue: [
        { speaker: '\u041a\u043e\u043b\u044f', ru: '\u041a\u0443\u0434\u0430 \u0442\u044b \u043f\u043e\u0435\u0434\u0435\u0448\u044c \u043b\u0435\u0442\u043e\u043c?', en: 'Where will you go this summer?' },
        { speaker: '\u0412\u0435\u0440\u0430', ru: '\u042f \u043f\u043e\u0435\u0434\u0443 \u0432 \u041f\u0435\u0442\u0435\u0440\u0431\u0443\u0440\u0433.', en: 'I\'ll go to Petersburg.' },
        { speaker: '\u041a\u043e\u043b\u044f', ru: '\u0427\u0442\u043e \u0442\u044b \u0431\u0443\u0434\u0435\u0448\u044c \u0442\u0430\u043c \u0434\u0435\u043b\u0430\u0442\u044c?', en: 'What will you do there?' },
        { speaker: '\u0412\u0435\u0440\u0430', ru: '\u042f \u0431\u0443\u0434\u0443 \u0445\u043e\u0434\u0438\u0442\u044c \u0432 \u043c\u0443\u0437\u0435\u0438.', en: 'I\'ll visit museums.' }
      ],
      grammar: [
        { title: 'Future: \u0431\u0443\u0434\u0443 + inf', desc: '\u042f \u0431\u0443\u0434\u0443 \u0440\u0430\u0431\u043e\u0442\u0430\u0442\u044c (I will work)' },
        { title: 'Perfective Future', desc: '\u042f \u043f\u043e\u0435\u0434\u0443 (I will go), \u042f \u043d\u0430\u043f\u0438\u0448\u0443 (I will write)' },
        { title: 'Prefixed Motion', desc: '\u043f\u043e- (set off), \u043f\u0440\u0438- (arrive), \u0443- (leave)' }
      ]
    },
        {
      id: 26,
      volume: 3,
      title_target: 'Время',
      title_source: 'Telling Time',
      title_ru: 'Время',
      title_en: 'Telling Time',
      dialogue: [],
      grammar: []
    },
        {
      id: 27,
      volume: 3,
      title_target: 'Расписание',
      title_source: 'Schedules & Half-Hours',
      title_ru: 'Расписание',
      title_en: 'Schedules & Half-Hours',
      dialogue: [],
      grammar: []
    },
        {
      id: 28,
      volume: 3,
      title_target: 'По телефону',
      title_source: 'On the Phone',
      title_ru: 'По телефону',
      title_en: 'On the Phone',
      dialogue: [],
      grammar: []
    },
        {
      id: 29,
      volume: 3,
      title_target: 'Телефонные звонки',
      title_source: 'Phone Calls & Messages',
      title_ru: 'Телефонные звонки',
      title_en: 'Phone Calls & Messages',
      dialogue: [],
      grammar: []
    },
    {
      id: 30,
      volume: 3,
      title_target: '\u0418\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u044d\u043a\u0437\u0430\u043c\u0435\u043d',
      title_source: 'Final Comprehensive Exam',
      title_ru: '\u0418\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u044d\u043a\u0437\u0430\u043c\u0435\u043d',
      title_en: 'Final Comprehensive Exam',
      dialogue: [
        { speaker: '\u0423\u0447\u0438\u0442\u0435\u043b\u044c', ru: '\u041f\u043e\u0437\u0434\u0440\u0430\u0432\u043b\u044f\u044e! \u0412\u044b \u0437\u0430\u043a\u043e\u043d\u0447\u0438\u043b\u0438 \u043a\u0443\u0440\u0441.', en: 'Congratulations! You\'ve finished the course.' },
        { speaker: '\u0423\u0447\u0435\u043d\u0438\u043a', ru: '\u0421\u043f\u0430\u0441\u0438\u0431\u043e! \u042f \u043c\u043d\u043e\u0433\u043e\u043c\u0443 \u043d\u0430\u0443\u0447\u0438\u043b\u0441\u044f.', en: 'Thanks! I learned a lot.' },
        { speaker: '\u0423\u0447\u0438\u0442\u0435\u043b\u044c', ru: '\u0423\u0434\u0430\u0447\u0438! \u0414\u043e \u0441\u0432\u0438\u0434\u0430\u043d\u0438\u044f!', en: 'Good luck! Goodbye!' }
      ],
      grammar: [
        { title: 'Course Review', desc: 'Final exam covers all grammar from Units 0-25.' },
        { title: 'Key Skills', desc: 'All 6 cases, conjugation, aspect, motion verbs, past/present/future tenses' }
      ],
      noDrills: true
    }
  ],
};

console.log('Russian course config loaded');
