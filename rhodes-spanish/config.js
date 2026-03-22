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
  courseName: 'Rhodes Spanish | ¡Vamos!',
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

  // ============================================================================
  // KEYBOARD (Spanish special characters)
  // ============================================================================
  keyboard: {
    type: 'accent',
    keys: ['á','é','í','ó','ú','ñ','ü','¿','¡'],
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
  <span style="flex:1;background:#AA151B;"></span>
  <span style="flex:2;background:#F1BF00;"></span>
  <span style="flex:1;background:#AA151B;"></span>
</div>
<div style="border:2px solid #333;padding:5px 12px;font-size:24px;font-weight:bold;letter-spacing:3px;display:flex;align-items:center;gap:15px;">
  <span>RHODES SPANISH</span>
  <span style="font-size:14px;font-weight:normal;opacity:0.7;">¡Vamos!</span>
</div>`,

  // ============================================================================
  // UNITS
  // ============================================================================
  units: [
    { id: 1,  volume: 1, title_target: 'Lección 1',  title_source: 'Lesson 1' },
    { id: 2,  volume: 1, title_target: 'Lección 2',  title_source: 'Lesson 2' },
    { id: 3,  volume: 1, title_target: 'Lección 3',  title_source: 'Lesson 3' },
    { id: 4,  volume: 1, title_target: 'Lección 4',  title_source: 'Lesson 4' },
    { id: 5,  volume: 1, title_target: 'Lección 5',  title_source: 'Lesson 5' },
    { id: 6,  volume: 1, title_target: 'Lección 6',  title_source: 'Lesson 6' },
    { id: 7,  volume: 1, title_target: 'Lección 7',  title_source: 'Lesson 7' },
    { id: 8,  volume: 1, title_target: 'Lección 8',  title_source: 'Lesson 8' },
    { id: 9,  volume: 1, title_target: 'Lección 9',  title_source: 'Lesson 9' },
    { id: 10, volume: 1, title_target: 'Lección 10', title_source: 'Lesson 10' },
    { id: 11, volume: 2, title_target: 'Lección 11', title_source: 'Lesson 11' },
    { id: 12, volume: 2, title_target: 'Lección 12', title_source: 'Lesson 12' },
    { id: 13, volume: 2, title_target: 'Lección 13', title_source: 'Lesson 13' },
    { id: 14, volume: 2, title_target: 'Lección 14', title_source: 'Lesson 14' },
    { id: 15, volume: 2, title_target: 'Lección 15', title_source: 'Lesson 15' },
    { id: 16, volume: 2, title_target: 'Lección 16', title_source: 'Lesson 16' },
    { id: 17, volume: 2, title_target: 'Lección 17', title_source: 'Lesson 17' },
    { id: 18, volume: 2, title_target: 'Lección 18', title_source: 'Lesson 18' },
    { id: 19, volume: 2, title_target: 'Lección 19', title_source: 'Lesson 19' },
    { id: 20, volume: 2, title_target: 'Lección 20', title_source: 'Lesson 20' },
    { id: 21, volume: 3, title_target: 'Lección 21', title_source: 'Lesson 21' },
    { id: 22, volume: 3, title_target: 'Lección 22', title_source: 'Lesson 22' },
    { id: 23, volume: 3, title_target: 'Lección 23', title_source: 'Lesson 23' },
    { id: 24, volume: 3, title_target: 'Lección 24', title_source: 'Lesson 24' },
    { id: 25, volume: 3, title_target: 'Lección 25', title_source: 'Lesson 25' },
    { id: 26, volume: 3, title_target: 'Lección 26', title_source: 'Lesson 26' },
    { id: 27, volume: 3, title_target: 'Lección 27', title_source: 'Lesson 27' },
    { id: 28, volume: 3, title_target: 'Lección 28', title_source: 'Lesson 28' },
    { id: 29, volume: 3, title_target: 'Lección 29', title_source: 'Lesson 29' },
    { id: 30, volume: 3, title_target: 'Lección 30', title_source: 'Lesson 30' },
  ],
};
