// ============================================================================
// RHODES PORTUGUESE V1 - COURSE CONFIGURATION
// ============================================================================
// Brazilian Portuguese course built from DLI Basic + FSI Programmatic + FSI FAST.

window.COURSE_CONFIG = {
  // ============================================================================
  // IDENTITY
  // ============================================================================
  lang: 'portuguese',
  langCode: 'pt-BR',
  displayName: 'Portuguese',
  courseName: 'Rhodes Portuguese | Vamos!',
  tagline: 'COMPLETE COURSE',

  // ============================================================================
  // THEME
  // ============================================================================
  theme: {
    accentPrimary: '#009B3A',
    accentLight: '#e6f5ec',
    flagColors: ['#009B3A', '#FEDF00', '#002776'],
  },

  // ============================================================================
  // FIELD MAPPINGS
  // ============================================================================
  fields: {
    target: 'portuguese_formal',
    targetFormal: 'portuguese_formal',
    targetInformal: 'portuguese_informal',
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
    hasServiceWorker: false,
  },

  // ============================================================================
  // KEYBOARD
  // ============================================================================
  keyboard: {
    type: 'accent',
    chars: ['\u00e0','\u00e1','\u00e2','\u00e3','\u00e9','\u00ea','\u00ed','\u00f3','\u00f4','\u00f5','\u00fa','\u00e7'],
  },

  // ============================================================================
  // STORAGE
  // ============================================================================
  storage: {
    progress: 'rhodes_portuguese_progress',
    sync: 'rhodes_portuguese_sync',
    srs: 'rhodes_portuguese_srs',
    analytics: 'rhodes_portuguese_analytics',
    linear: 'rhodes_portuguese_linear',
  },

  // ============================================================================
  // DATA PATHS
  // ============================================================================
  data: {
    drills: 'data/drills.json',
    audioMapping: null,
    confusables: null,
  },

  // ============================================================================
  // AUDIO
  // ============================================================================
  audio: {
    dialogues: null,
    drills: null,
    version: '1',
  },

  // ============================================================================
  // CDN
  // ============================================================================
  cdn: {
    baseUrl: null,
  },

  // ============================================================================
  // TITLE HTML
  // ============================================================================
  titleHtml: `<div style="display:flex;flex-direction:column;height:30px;width:45px;border:1px solid #ccc;margin-bottom:8px;">
  <span style="flex:1;background:#009B3A;"></span>
  <span style="flex:1;background:#FEDF00;"></span>
  <span style="flex:1;background:#002776;"></span>
</div>
<div style="border:2px solid #333;padding:5px 12px;font-size:24px;font-weight:bold;letter-spacing:3px;display:flex;align-items:center;gap:15px;">
  <span>RHODES PORTUGUESE</span>

</div>`,

  // ============================================================================
  // SETTINGS
  // ============================================================================
  convertToInformal: null,
  totalUnits: 30,

  // ============================================================================
  // VERBS (placeholder — expand later)
  // ============================================================================
  verbs: {},

  // ============================================================================
  // CONFUSABLES (placeholder — expand later)
  // ============================================================================
  confusables: {},

  // ============================================================================
  // GRAMMAR PATTERN DETECTION
  // ============================================================================
  detectGrammarPatterns(portuguese, english) {
    const patterns = [];
    if (!portuguese) return patterns;
    const pt = portuguese.toLowerCase();

    if (/\best(ou|á|ão|amos)\b/.test(pt)) patterns.push({ pattern: 'estar', hint: 'Estar = temporary state/location' });
    if (/\b(sou|é|são|somos)\b/.test(pt)) patterns.push({ pattern: 'ser', hint: 'Ser = permanent/essential quality' });
    if (/\b(tenho|tem|temos|têm)\b/.test(pt)) patterns.push({ pattern: 'ter', hint: 'Ter = to have' });
    if (/\b(vou|vai|vão|vamos)\b/.test(pt)) patterns.push({ pattern: 'ir', hint: 'Ir = to go (also used for future)' });
    if (/\b(faço|faz|fazem|fazemos)\b/.test(pt)) patterns.push({ pattern: 'fazer', hint: 'Fazer = to do/make' });
    if (/\bnão\b/.test(pt)) patterns.push({ pattern: 'negation', hint: 'Não before the verb = negation' });
    if (/\b(me|te|se|nos|lhe|lhes)\b/.test(pt)) patterns.push({ pattern: 'pronoun', hint: 'Object pronoun placement' });

    return patterns;
  },

  // ============================================================================
  // UNITS
  // ============================================================================
  units: [
    { id: 1, volume: 1, title_target: 'Lição 1: Cumprimentos Formais', title_source: 'Lesson 1: Formal Greetings' },
    { id: 2, volume: 1, title_target: 'Lição 2: Posse e Objetos', title_source: 'Lesson 2: Possession and Objects' },
    { id: 3, volume: 1, title_target: 'Lição 3: Locomoção e Destinos', title_source: 'Lesson 3: Transportation and Destinations' },
    { id: 4, volume: 1, title_target: 'Lição 4: Alugar um Apartamento', title_source: 'Lesson 4: Renting an Apartment' },
    { id: 5, volume: 1, title_target: 'Lição 5: Planos e Convites', title_source: 'Lesson 5: Plans and Invitations' },
    { id: 6, volume: 1, title_target: 'Lição 6: Habilidades Linguísticas', title_source: 'Lesson 6: Language Abilities' },
    { id: 7, volume: 1, title_target: 'Lição 7: Horários e Locais', title_source: 'Lesson 7: Schedules and Places' },
    { id: 8, volume: 1, title_target: 'Lição 8: Feriados e Obrigações', title_source: 'Lesson 8: Holidays and Obligations' },
    { id: 9, volume: 1, title_target: 'Lição 9: Comprar Roupas', title_source: 'Lesson 9: Buying Clothes' },
    { id: 10, volume: 1, title_target: 'Lição 10: Bebidas e Preferências', title_source: 'Lesson 10: Drinks and Preferences' },
    { id: 11, volume: 1, title_target: 'Lição 11: Manutenção do Carro', title_source: 'Lesson 11: Car Maintenance' },
    { id: 12, volume: 1, title_target: 'Lição 12: Clima e Perguntas', title_source: 'Lesson 12: Weather and Questions' },
    { id: 13, volume: 1, title_target: 'Lição 13: Casamento e Apresentações', title_source: 'Lesson 13: Marriage and Introductions' },
    { id: 14, volume: 1, title_target: 'Lição 14: Telefonemas e Reservas', title_source: 'Lesson 14: Phone Calls and Reservations' },
    { id: 15, volume: 1, title_target: 'Lição 15: Explicações e Motivos', title_source: 'Lesson 15: Explanations and Reasons' },
    { id: 16, volume: 2, title_target: 'Lição 16: Correio e Encomendas', title_source: 'Lesson 16: Mail and Packages' },
    { id: 17, volume: 2, title_target: 'Lição 17: Barbearia e Espera', title_source: 'Lesson 17: Barber Shop and Waiting' },
    { id: 18, volume: 2, title_target: 'Lição 18: Rotina Matinal', title_source: 'Lesson 18: Morning Routine' },
    { id: 19, volume: 2, title_target: 'Lição 19: Decisões Passadas', title_source: 'Lesson 19: Past Decisions' },
    { id: 20, volume: 2, title_target: 'Lição 20: Chegada e Carnaval', title_source: 'Lesson 20: Arrival and Carnival' },
    { id: 21, volume: 2, title_target: 'Lição 21: Farmácia e Medicamentos', title_source: 'Lesson 21: Pharmacy and Medicine' },
    { id: 22, volume: 2, title_target: 'Lição 22: Hotel e Serviços', title_source: 'Lesson 22: Hotel and Services' },
    { id: 23, volume: 2, title_target: 'Lição 23: Hotel e Visitas', title_source: 'Lesson 23: Hotel and Sightseeing' },
    { id: 24, volume: 2, title_target: 'Lição 24: Cidades do Passado', title_source: 'Lesson 24: Cities of the Past' },
    { id: 25, volume: 2, title_target: 'Lição 25: Comprar uma Câmera', title_source: 'Lesson 25: Buying a Camera' },
    { id: 26, volume: 2, title_target: 'Lição 26: Jantar e Babá', title_source: 'Lesson 26: Dinner and Babysitting' },
    { id: 27, volume: 2, title_target: 'Lição 27: Futebol e Certezas', title_source: 'Lesson 27: Soccer and Certainties' },
    { id: 28, volume: 2, title_target: 'Lição 28: Jogo de Futebol', title_source: 'Lesson 28: Soccer Match' },
    { id: 29, volume: 2, title_target: 'Lição 29: Informações de Viagem', title_source: 'Lesson 29: Travel Information' },
    { id: 30, volume: 2, title_target: 'Lição 30: Vocabulário Diverso', title_source: 'Lesson 30: Miscellaneous Vocabulary' },
  ],
};
