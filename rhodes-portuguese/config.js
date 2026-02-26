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
  titleHtml: '<span style="color:#009B3A">R</span><span style="color:#FEDF00">H</span><span style="color:#002776">O</span><span style="color:#009B3A">D</span><span style="color:#FEDF00">E</span><span style="color:#002776">S</span> <span style="color:var(--text-primary)">PORTUGUESE</span>',

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
    { id: 1, volume: 1, title_target: 'Cumprimentos', title_source: 'Greetings', title_pt: 'Cumprimentos', title_en: 'Greetings & Introductions', dialogue: [], grammar: [{ title: 'Basic Greetings', desc: 'Bom dia, boa tarde, boa noite. Formal vs informal address.' }] },
    { id: 2, volume: 1, title_target: 'Apresentações', title_source: 'Introductions', title_pt: 'Apresentações', title_en: 'Meeting People', dialogue: [], grammar: [{ title: 'Introducing Yourself', desc: 'Eu sou..., Meu nome é..., Muito prazer.' }] },
    { id: 3, volume: 1, title_target: 'Números', title_source: 'Numbers', title_pt: 'Números', title_en: 'Numbers & Counting', dialogue: [], grammar: [{ title: 'Cardinal Numbers', desc: 'Um, dois, três... Agreement with gender.' }] },
    { id: 4, volume: 1, title_target: 'Família', title_source: 'Family', title_pt: 'Família', title_en: 'Family & Relationships', dialogue: [], grammar: [{ title: 'Family Terms', desc: 'Pai, mãe, irmão, irmã. Possessive adjectives.' }] },
    { id: 5, volume: 1, title_target: 'Revisão I', title_source: 'Review I', title_pt: 'Revisão I', title_en: 'Review I', dialogue: [], grammar: [] },

    { id: 6, volume: 2, title_target: 'No Restaurante', title_source: 'At the Restaurant', title_pt: 'No Restaurante', title_en: 'At the Restaurant', dialogue: [], grammar: [{ title: 'Ordering Food', desc: 'Eu quero..., Por favor, me dá..., A conta.' }] },
    { id: 7, volume: 2, title_target: 'Compras', title_source: 'Shopping', title_pt: 'Compras', title_en: 'Shopping & Markets', dialogue: [], grammar: [{ title: 'Shopping Phrases', desc: 'Quanto custa? Tem...? É muito caro.' }] },
    { id: 8, volume: 2, title_target: 'Direções', title_source: 'Directions', title_pt: 'Direções', title_en: 'Directions & Places', dialogue: [], grammar: [{ title: 'Asking Directions', desc: 'Onde fica...? À direita, à esquerda, em frente.' }] },
    { id: 9, volume: 2, title_target: 'Transporte', title_source: 'Transportation', title_pt: 'Transporte', title_en: 'Transportation', dialogue: [], grammar: [{ title: 'Getting Around', desc: 'Ônibus, táxi, metrô. Ir de..., Pegar o...' }] },
    { id: 10, volume: 2, title_target: 'Revisão II', title_source: 'Review II', title_pt: 'Revisão II', title_en: 'Review II', dialogue: [], grammar: [] },

    { id: 11, volume: 3, title_target: 'No Hotel', title_source: 'At the Hotel', title_pt: 'No Hotel', title_en: 'At the Hotel', dialogue: [], grammar: [{ title: 'Hotel Vocabulary', desc: 'Quarto, reserva, diária. Tem vaga?' }] },
    { id: 12, volume: 3, title_target: 'Telefone', title_source: 'Telephone', title_pt: 'Telefone', title_en: 'Telephone & Communication', dialogue: [], grammar: [{ title: 'Phone Conversations', desc: 'Alô? Quem fala? Um momento, por favor.' }] },
    { id: 13, volume: 3, title_target: 'Saúde', title_source: 'Health', title_pt: 'Saúde', title_en: 'Health & Body', dialogue: [], grammar: [{ title: 'Health Expressions', desc: 'Estou doente. Dói aqui. Preciso de um médico.' }] },
    { id: 14, volume: 3, title_target: 'Trabalho', title_source: 'Work', title_pt: 'Trabalho', title_en: 'Work & Occupation', dialogue: [], grammar: [{ title: 'Work Vocabulary', desc: 'Escritório, reunião, colega. Trabalhar, estudar.' }] },
    { id: 15, volume: 3, title_target: 'Revisão III', title_source: 'Review III', title_pt: 'Revisão III', title_en: 'Review III', dialogue: [], grammar: [] },

    { id: 16, volume: 4, title_target: 'Clima', title_source: 'Weather', title_pt: 'Clima', title_en: 'Weather & Seasons', dialogue: [], grammar: [{ title: 'Weather Expressions', desc: 'Está quente/frio. Vai chover. Faz sol.' }] },
    { id: 17, volume: 4, title_target: 'Rotina', title_source: 'Daily Routine', title_pt: 'Rotina', title_en: 'Daily Routine', dialogue: [], grammar: [{ title: 'Reflexive Verbs', desc: 'Acordar-se, levantar-se, vestir-se. Daily activities.' }] },
    { id: 18, volume: 4, title_target: 'Lazer', title_source: 'Leisure', title_pt: 'Lazer', title_en: 'Leisure & Entertainment', dialogue: [], grammar: [{ title: 'Free Time', desc: 'Gostar de..., Preferir..., Jogar, assistir.' }] },
    { id: 19, volume: 4, title_target: 'Viagem', title_source: 'Travel', title_pt: 'Viagem', title_en: 'Travel & Tourism', dialogue: [], grammar: [{ title: 'Travel Phrases', desc: 'Passaporte, alfândega, embarque. Viajar para...' }] },
    { id: 20, volume: 4, title_target: 'Revisão IV', title_source: 'Review IV', title_pt: 'Revisão IV', title_en: 'Review IV', dialogue: [], grammar: [] },

    { id: 21, volume: 5, title_target: 'Passado', title_source: 'Past Tense', title_pt: 'Passado', title_en: 'Past Tense & Narration', dialogue: [], grammar: [{ title: 'Pretérito Perfeito', desc: 'Falei, comi, parti. Regular -ar, -er, -ir conjugations.' }] },
    { id: 22, volume: 5, title_target: 'Futuro', title_source: 'Future', title_pt: 'Futuro', title_en: 'Future & Plans', dialogue: [], grammar: [{ title: 'Future with Ir', desc: 'Vou + infinitive for immediate future. Farei, direi for formal future.' }] },
    { id: 23, volume: 5, title_target: 'Subjuntivo', title_source: 'Subjunctive', title_pt: 'Subjuntivo', title_en: 'Subjunctive Mood', dialogue: [], grammar: [{ title: 'Present Subjunctive', desc: 'Que eu fale, que ele coma. After esperar que, querer que.' }] },
    { id: 24, volume: 5, title_target: 'Descrições', title_source: 'Descriptions', title_pt: 'Descrições', title_en: 'Descriptions & Adjectives', dialogue: [], grammar: [{ title: 'Adjective Agreement', desc: 'Gender/number agreement. Position before/after noun.' }] },
    { id: 25, volume: 5, title_target: 'Revisão V', title_source: 'Review V', title_pt: 'Revisão V', title_en: 'Review V', dialogue: [], grammar: [] },

    { id: 26, volume: 6, title_target: 'Opiniões', title_source: 'Opinions', title_pt: 'Opiniões', title_en: 'Opinions & Discussion', dialogue: [], grammar: [{ title: 'Expressing Opinions', desc: 'Eu acho que..., Na minha opinião..., Concordo/Discordo.' }] },
    { id: 27, volume: 6, title_target: 'Cultura', title_source: 'Culture', title_pt: 'Cultura', title_en: 'Brazilian Culture', dialogue: [], grammar: [{ title: 'Cultural Context', desc: 'Carnaval, futebol, música. Regional differences.' }] },
    { id: 28, volume: 6, title_target: 'Negócios', title_source: 'Business', title_pt: 'Negócios', title_en: 'Business Portuguese', dialogue: [], grammar: [{ title: 'Business Language', desc: 'Formal register, meeting vocabulary, correspondence.' }] },
    { id: 29, volume: 6, title_target: 'Conversação', title_source: 'Conversation', title_pt: 'Conversação Avançada', title_en: 'Advanced Conversation', dialogue: [], grammar: [{ title: 'Advanced Structures', desc: 'Complex sentences, idiomatic expressions, register shifting.' }] },
    { id: 30, volume: 6, title_target: 'Revisão Final', title_source: 'Final Review', title_pt: 'Revisão Final', title_en: 'Final Review', dialogue: [], grammar: [] },
  ],
};
