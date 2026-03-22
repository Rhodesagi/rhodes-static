// ============================================================================
// RHODES ITALIAN V2 - COURSE CONFIGURATION
// ============================================================================
window.COURSE_CONFIG = {
  lang: 'italian',
  langCode: 'it-IT',
  displayName: 'Italian',
  courseName: 'Rhodes Italian | Andiamo!',
  tagline: 'COMPLETE COURSE',

  theme: {
    accentPrimary: '#009246',
    accentLight: '#e8f5e9',
    flagColors: ['#009246', '#ffffff', '#CE2B37'],
  },

  fields: {
    target: 'italian_formal',
    targetFormal: 'italian_formal',
    targetInformal: 'italian_informal',
    source: 'english',
  },

  features: {
    hasRegisterToggle: false,
    hasDirectionToggle: true,
    hasFullscreen: true,
    hasCaseColors: false,
    hasAlphabetUnit: false,
    hasStressPositions: false,
    hasAudioMapping: false,
    hasConfusables: false,
    hasDarkMode: true,
    hasLiteralToggle: true,
    hasServiceWorker: false,
  },

  keyboard: {
    type: 'accent',
    keys: ['à','è','é','ì','í','ò','ó','ù','ú'],
  },

  storage: {
    progress: 'rhodes_italian_progress',
    sync: 'rhodes_italian_sync',
    srs: 'rhodes_italian_srs',
    analytics: 'rhodes_italian_analytics',
    linear: 'rhodes_italian_linear',
  },

  data: {
    drills: 'data/drills.json',
  },

  audio: {
    dialogues: 'audio/',
    drills: 'audio/drills/',
    version: '1.0.0',
  },

  cdn: {
    baseUrl: '',
  },

  titleHtml: `<div style="display:flex;flex-direction:column;height:30px;width:45px;border:1px solid #ccc;margin-bottom:8px;">
  <span style="flex:1;background:#009246;"></span>
  <span style="flex:1;background:#ffffff;border-top:1px solid #ddd;border-bottom:1px solid #ddd;"></span>
  <span style="flex:1;background:#CE2B37;"></span>
</div>
<div style="border:2px solid #333;padding:5px 12px;font-size:24px;font-weight:bold;letter-spacing:3px;display:flex;align-items:center;gap:15px;">
  <span>RHODES ITALIAN</span>
  <span style="font-size:14px;font-weight:normal;opacity:0.7;">Andiamo!</span>
</div>`,

  units: [
    { id: 1,  volume: 1, title_target: 'Lezione 1',  title_source: 'Lesson 1' },
    { id: 2,  volume: 1, title_target: 'Lezione 2',  title_source: 'Lesson 2' },
    { id: 3,  volume: 1, title_target: 'Lezione 3',  title_source: 'Lesson 3' },
    { id: 4,  volume: 1, title_target: 'Lezione 4',  title_source: 'Lesson 4' },
    { id: 5,  volume: 1, title_target: 'Lezione 5',  title_source: 'Lesson 5' },
    { id: 6,  volume: 1, title_target: 'Lezione 6',  title_source: 'Lesson 6' },
    { id: 7,  volume: 1, title_target: 'Lezione 7',  title_source: 'Lesson 7' },
    { id: 8,  volume: 1, title_target: 'Lezione 8',  title_source: 'Lesson 8' },
    { id: 9,  volume: 1, title_target: 'Lezione 9',  title_source: 'Lesson 9' },
    { id: 10, volume: 1, title_target: 'Lezione 10', title_source: 'Lesson 10' },
    { id: 11, volume: 2, title_target: 'Lezione 11', title_source: 'Lesson 11' },
    { id: 12, volume: 2, title_target: 'Lezione 12', title_source: 'Lesson 12' },
    { id: 13, volume: 2, title_target: 'Lezione 13', title_source: 'Lesson 13' },
    { id: 14, volume: 2, title_target: 'Lezione 14', title_source: 'Lesson 14' },
    { id: 15, volume: 2, title_target: 'Lezione 15', title_source: 'Lesson 15' },
    { id: 16, volume: 2, title_target: 'Lezione 16', title_source: 'Lesson 16' },
    { id: 17, volume: 2, title_target: 'Lezione 17', title_source: 'Lesson 17' },
    { id: 18, volume: 2, title_target: 'Lezione 18', title_source: 'Lesson 18' },
    { id: 19, volume: 2, title_target: 'Lezione 19', title_source: 'Lesson 19' },
    { id: 20, volume: 2, title_target: 'Lezione 20', title_source: 'Lesson 20' },
    { id: 21, volume: 3, title_target: 'Lezione 21', title_source: 'Lesson 21' },
    { id: 22, volume: 3, title_target: 'Lezione 22', title_source: 'Lesson 22' },
    { id: 23, volume: 3, title_target: 'Lezione 23', title_source: 'Lesson 23' },
    { id: 24, volume: 3, title_target: 'Lezione 24', title_source: 'Lesson 24' },
    { id: 25, volume: 3, title_target: 'Lezione 25', title_source: 'Lesson 25' },
    { id: 26, volume: 3, title_target: 'Lezione 26', title_source: 'Lesson 26' },
    { id: 27, volume: 3, title_target: 'Lezione 27', title_source: 'Lesson 27' },
    { id: 28, volume: 3, title_target: 'Lezione 28', title_source: 'Lesson 28' },
    { id: 29, volume: 3, title_target: 'Lezione 29', title_source: 'Lesson 29' },
    { id: 30, volume: 3, title_target: 'Lezione 30', title_source: 'Lesson 30' },
  ],
};
