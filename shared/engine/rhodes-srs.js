/**
 * Rhodes SRS (Spaced Repetition System)
 * Based on FSRS (Free Spaced Repetition Scheduler) algorithm
 * Renamed from FSI_SRS with configurable storage keys
 */

const RhodesSRS = {
  // FSRS algorithm parameters
  params: {
    w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01,
        1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
    requestRetention: 0.9,
    maximumInterval: 36500,
    learningSteps: [1, 10],
    relearningSteps: [1, 10],
    graduatingInterval: 1,
    easyInterval: 4,
    graduationConsecutive: 5,
    graduationMinInterval: 16,
    reactivationLapseThreshold: 2
  },

  // Drill metadata (populated by course config)
  drillMeta: {},

  // Canonical group tracking: { groupName: { activeIndex, canonicalIds, graduated } }
  canonicalGroups: {},

  // Rating enum
  Rating: { Again: 1, Hard: 2, Good: 3, Easy: 4 },

  // Card state enum
  State: { New: 0, Learning: 1, Review: 2, Relearning: 3 },

  // Storage key getters (read from window.COURSE_CONFIG)
  get STORAGE_KEY() {
    return window.COURSE_CONFIG?.storage?.srs || 'rhodes_srs';
  },

  get ANALYTICS_KEY() {
    return window.COURSE_CONFIG?.storage?.analytics || 'rhodes_analytics';
  },

  // Chrome storage detection
  _hasChrome: typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local,

  // Card storage
  cards: {},

  // Session queue
  sessionQueue: [],

  // Analytics state
  analytics: {
    userId: null,
    responses: [],
    sessions: [],
    currentSessionStart: null,
    currentSessionId: null,
    totalReviews: 0,
    correctReviews: 0,
    errorsByType: {},
    cardMetrics: {}
  },

  // Prompt timing
  promptStartTime: null,

  /**
   * Initialize the SRS system
   */
  async init() {
    await this.loadCards();
    await this.loadAnalytics();
    console.log('[RhodesSRS] Initialized with', Object.keys(this.cards).length, 'cards');
  },

  /**
   * Create a new card
   */
  createNewCard(cardId) {
    return {
      id: cardId,
      state: this.State.New,
      stability: 0,
      difficulty: 5,
      interval: 0,
      due: Date.now(),
      reps: 0,
      lapses: 0,
      lastReview: null,
      learningStep: 0,
      consecutiveCorrect: 0,
      lastErrors: [],
      created: Date.now(),
      isCanonical: false,
      patternGroup: null,
      skippable: false
    };
  },

  /**
   * Initialize cards from drill metadata
   */
  initializeCards(drillMeta) {
    this.drillMeta = drillMeta;
    const cardIds = Object.keys(drillMeta);

    for (const id of cardIds) {
      if (!this.cards[id]) {
        this.cards[id] = this.createNewCard(id);
      }
      // Enrich card with canonical metadata from drill data
      const meta = drillMeta[id];
      if (meta) {
        this.cards[id].isCanonical = !!meta.is_canonical;
        this.cards[id].patternGroup = meta.pattern_group || null;
      }
    }

    // Build canonical group index
    this._buildCanonicalGroups();

    const groupCount = Object.keys(this.canonicalGroups).length;
    const canonicalCount = Object.values(this.cards).filter(c => c.isCanonical).length;
    console.log('[RhodesSRS] Initialized', cardIds.length, 'cards,', canonicalCount, 'canonical,', groupCount, 'groups');
  },

  /**
   * Build canonical group tracking from card data
   */
  _buildCanonicalGroups() {
    this.canonicalGroups = {};
    const cards = Object.values(this.cards);

    for (const card of cards) {
      if (!card.patternGroup) continue;
      const group = card.patternGroup;

      if (!this.canonicalGroups[group]) {
        this.canonicalGroups[group] = {
          activeIndex: 0,
          canonicalIds: [],
          memberIds: [],
          graduated: false
        };
      }

      this.canonicalGroups[group].memberIds.push(card.id);
      if (card.isCanonical) {
        this.canonicalGroups[group].canonicalIds.push(card.id);
      }
    }

    // Load saved group state from storage
    this._loadGroupState();
  },

  /**
   * Get the currently active canonical for a pattern group
   */
  getActiveCanonical(patternGroup) {
    const group = this.canonicalGroups[patternGroup];
    if (!group || group.canonicalIds.length === 0) return null;
    const idx = group.activeIndex % group.canonicalIds.length;
    return group.canonicalIds[idx];
  },

  /**
   * Check if a card is the active canonical for its group
   */
  isActiveCanonical(cardId) {
    const card = this.cards[cardId];
    if (!card || !card.isCanonical || !card.patternGroup) return false;
    return this.getActiveCanonical(card.patternGroup) === cardId;
  },

  /**
   * Rotate to next canonical in a group (called after current graduates)
   */
  _rotateCanonical(patternGroup) {
    const group = this.canonicalGroups[patternGroup];
    if (!group || group.canonicalIds.length <= 1) return;

    group.activeIndex = (group.activeIndex + 1) % group.canonicalIds.length;
    const nextId = group.canonicalIds[group.activeIndex];
    const nextCard = this.cards[nextId];

    // Check if ALL canonicals in group are graduated
    const p = this.params;
    const allGraduated = group.canonicalIds.every(id => {
      const c = this.cards[id];
      return c && c.consecutiveCorrect >= p.graduationConsecutive && c.interval >= p.graduationMinInterval;
    });

    if (allGraduated) {
      group.graduated = true;
      console.log('[RhodesSRS] Group mastered:', patternGroup);
    } else if (nextCard) {
      // Activate next canonical
      nextCard.state = this.State.New;
      nextCard.due = Date.now();
      nextCard.consecutiveCorrect = 0;
      console.log('[RhodesSRS] Rotated canonical in', patternGroup, '→', nextId);
    }

    this._saveGroupState();
  },

  /**
   * Ungraduate all cards in a pattern group (cascade on canonical failure)
   */
  _ungraduateGroup(patternGroup) {
    const group = this.canonicalGroups[patternGroup];
    if (!group) return;

    let count = 0;
    for (const memberId of group.memberIds) {
      const card = this.cards[memberId];
      if (!card) continue;
      // Only ungraduate cards that have been seen
      if (card.reps > 0) {
        card.consecutiveCorrect = 0;
        card.skippable = false;
        if (card.state === this.State.Review && card.interval >= this.params.graduationMinInterval) {
          card.state = this.State.Relearning;
          card.learningStep = 0;
          card.due = Date.now();
          count++;
        }
      }
    }

    group.graduated = false;
    this._saveGroupState();
    if (count > 0) console.log('[RhodesSRS] Ungraduated', count, 'cards in group:', patternGroup);
  },

  /**
   * Graduate non-canonical cards in a group (cascade on canonical graduation)
   */
  _graduateGroup(patternGroup) {
    const group = this.canonicalGroups[patternGroup];
    if (!group) return;

    for (const memberId of group.memberIds) {
      const card = this.cards[memberId];
      if (!card || card.isCanonical) continue;

      if (card.reps > 0) {
        // Auto-graduate seen non-canonical cards
        card.consecutiveCorrect = this.params.graduationConsecutive;
        card.interval = this.params.graduationMinInterval;
      } else {
        // Mark unseen non-canonical cards as skippable
        card.skippable = true;
      }
    }

    console.log('[RhodesSRS] Graduated non-canonical cards in group:', patternGroup);
  },

  /**
   * Save canonical group state to storage
   */
  _saveGroupState() {
    const key = (window.COURSE_CONFIG?.storage?.srs || 'rhodes_srs') + '_groups';
    const state = {};
    for (const [name, group] of Object.entries(this.canonicalGroups)) {
      state[name] = { activeIndex: group.activeIndex, graduated: group.graduated };
    }
    localStorage.setItem(key, JSON.stringify(state));
  },

  /**
   * Load canonical group state from storage
   */
  _loadGroupState() {
    const key = (window.COURSE_CONFIG?.storage?.srs || 'rhodes_srs') + '_groups';
    const stored = localStorage.getItem(key);
    if (!stored) return;
    try {
      const state = JSON.parse(stored);
      for (const [name, saved] of Object.entries(state)) {
        if (this.canonicalGroups[name]) {
          this.canonicalGroups[name].activeIndex = saved.activeIndex || 0;
          this.canonicalGroups[name].graduated = saved.graduated || false;
        }
      }
    } catch (e) { console.warn('[RhodesSRS] Failed to load group state:', e); }
  },

  /**
   * Load cards from storage
   */
  async loadCards() {
    if (this._hasChrome) {
      return new Promise((resolve) => {
        chrome.storage.local.get([this.STORAGE_KEY], (result) => {
          if (result[this.STORAGE_KEY]) {
            this.cards = result[this.STORAGE_KEY];
            console.log('[RhodesSRS] Loaded', Object.keys(this.cards).length, 'cards from Chrome storage');
          }
          resolve();
        });
      });
    } else {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.cards = JSON.parse(stored);
        console.log('[RhodesSRS] Loaded', Object.keys(this.cards).length, 'cards from localStorage');
      }
    }
  },

  /**
   * Save cards to storage
   */
  async saveCards() {
    if (this._hasChrome) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [this.STORAGE_KEY]: this.cards }, () => {
          console.log('[RhodesSRS] Saved', Object.keys(this.cards).length, 'cards to Chrome storage');
          resolve();
        });
      });
    } else {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cards));
      console.log('[RhodesSRS] Saved', Object.keys(this.cards).length, 'cards to localStorage');
    }
  },

  /**
   * Load analytics from storage
   */
  async loadAnalytics() {
    if (this._hasChrome) {
      return new Promise((resolve) => {
        chrome.storage.local.get([this.ANALYTICS_KEY], (result) => {
          if (result[this.ANALYTICS_KEY]) {
            this.analytics = { ...this.analytics, ...result[this.ANALYTICS_KEY] };
            console.log('[RhodesSRS] Loaded analytics from Chrome storage');
          }
          resolve();
        });
      });
    } else {
      const stored = localStorage.getItem(this.ANALYTICS_KEY);
      if (stored) {
        this.analytics = { ...this.analytics, ...JSON.parse(stored) };
        console.log('[RhodesSRS] Loaded analytics from localStorage');
      }
    }
  },

  /**
   * Save analytics to storage
   */
  async saveAnalytics() {
    if (this._hasChrome) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [this.ANALYTICS_KEY]: this.analytics }, () => {
          console.log('[RhodesSRS] Saved analytics to Chrome storage');
          resolve();
        });
      });
    } else {
      localStorage.setItem(this.ANALYTICS_KEY, JSON.stringify(this.analytics));
      console.log('[RhodesSRS] Saved analytics to localStorage');
    }
  },

  /**
   * Process a review using FSRS algorithm
   */
  processReview(cardId, rating, errors = []) {
    let card = this.cards[cardId];
    if (!card) {
      card = this.createNewCard(cardId);
      this.cards[cardId] = card;
    }

    const p = this.params;
    const now = Date.now();
    const elapsedDays = card.lastReview ? (now - card.lastReview) / (1000 * 60 * 60 * 24) : 0;

    // State: New
    if (card.state === this.State.New) {
      card.difficulty = p.w[4] - Math.exp(p.w[5] * (rating - 3)) + 1;
      card.difficulty = Math.max(1, Math.min(10, card.difficulty));
      card.stability = p.w[rating - 1];

      if (rating === this.Rating.Again) {
        card.state = this.State.Learning;
        card.learningStep = 0;
      } else {
        card.state = this.State.Review;
        card.interval = rating === this.Rating.Easy ? p.easyInterval : p.graduatingInterval;
      }
    }
    // State: Learning or Relearning
    else if (card.state === this.State.Learning || card.state === this.State.Relearning) {
      const steps = card.state === this.State.Learning ? p.learningSteps : p.relearningSteps;

      if (rating === this.Rating.Again) {
        card.learningStep = 0;
      } else if (rating === this.Rating.Easy) {
        card.state = this.State.Review;
        card.interval = p.easyInterval;
      } else {
        card.learningStep = (card.learningStep || 0) + 1;
        if (card.learningStep >= steps.length) {
          card.state = this.State.Review;
          card.interval = p.graduatingInterval;
        }
      }
    }
    // State: Review
    else if (card.state === this.State.Review) {
      const retrievability = Math.pow(1 + elapsedDays / (9 * card.stability), -1);

      if (rating === this.Rating.Again) {
        card.difficulty = Math.min(10, card.difficulty + p.w[6] * (1 / retrievability - 1));
        card.stability = p.w[11] * Math.pow(card.difficulty, -p.w[12]) *
                        (Math.pow(card.stability + 1, p.w[13]) - 1) *
                        Math.exp(p.w[14] * (1 - retrievability));
        card.lapses = (card.lapses || 0) + 1;
        card.state = this.State.Relearning;
        card.learningStep = 0;
      } else {
        card.difficulty = Math.max(1, Math.min(10, card.difficulty - p.w[6] * (rating - 3)));
        const hardPenalty = rating === this.Rating.Hard ? p.w[15] : 1;
        const easyBonus = rating === this.Rating.Easy ? p.w[16] : 1;
        card.stability = card.stability * (1 + Math.exp(p.w[8]) *
                        (11 - card.difficulty) *
                        Math.pow(card.stability, -p.w[9]) *
                        (Math.exp((1 - retrievability) * p.w[10]) - 1) *
                        hardPenalty * easyBonus);
        card.interval = Math.min(
          Math.round(9 * card.stability * (1 / p.requestRetention - 1)),
          p.maximumInterval
        );
        card.interval = Math.max(1, card.interval);
      }
    }

    // Update card metadata
    card.reps = (card.reps || 0) + 1;
    card.lastReview = now;
    card.due = now + (card.interval || 1) * 24 * 60 * 60 * 1000;

    // Track consecutive correct for graduation
    if (rating >= this.Rating.Good) {
      card.consecutiveCorrect = (card.consecutiveCorrect || 0) + 1;
    } else {
      card.consecutiveCorrect = 0;
    }

    // Error tracking
    if (errors && errors.length > 0) {
      card.lastErrors = errors.map(e => e.type || e);
    } else {
      card.lastErrors = [];
    }

    // === Canonical cascades ===
    if (card.isCanonical && card.patternGroup) {
      const p = this.params;

      // Ungraduation cascade: canonical failed → ungraduate entire group
      if (rating <= this.Rating.Hard) {
        this._ungraduateGroup(card.patternGroup);
      }

      // Graduation cascade: canonical mastered → graduate group + rotate
      if (card.consecutiveCorrect >= p.graduationConsecutive && card.interval >= p.graduationMinInterval) {
        this._graduateGroup(card.patternGroup);
        this._rotateCanonical(card.patternGroup);
      }
    }

    return card;
  },

  /**
   * Get next card due for review
   */
  getNextCard() {
    const now = Date.now();
    const dueCards = Object.values(this.cards).filter(c => c.due <= now);

    if (dueCards.length === 0) {
      return null;
    }

    // Sort by priority: New > Learning/Relearning > Review, then by due date
    dueCards.sort((a, b) => {
      const stateOrder = [this.State.New, this.State.Learning, this.State.Relearning, this.State.Review];
      const aPriority = stateOrder.indexOf(a.state);
      const bPriority = stateOrder.indexOf(b.state);

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return a.due - b.due;
    });

    return dueCards[0];
  },

  /**
   * Build a session queue of cards to review
   */
  buildSessionQueue(maxCards = 20) {
    const cfg = window.COURSE_CONFIG || {};
    const max = cfg.srs?.maxCards || maxCards;
    const now = Date.now();
    const hasCanonicals = Object.values(this.cards).some(c => c.isCanonical);

    let dueCards = Object.values(this.cards).filter(c => {
      if (c.due > now) return false;
      if (c.skippable) return false;
      // Skip non-active canonicals (only show the active one per group)
      if (hasCanonicals && c.isCanonical && c.patternGroup) {
        if (!this.isActiveCanonical(c.id)) return false;
      }
      // Skip non-canonicals in graduated groups
      if (hasCanonicals && !c.isCanonical && c.patternGroup) {
        const group = this.canonicalGroups[c.patternGroup];
        if (group && group.graduated) return false;
      }
      return true;
    });

    // Sort: canonical priority > state priority > due date
    dueCards.sort((a, b) => {
      // Canonical drills first (if canonical data exists)
      if (hasCanonicals) {
        if (a.isCanonical && !b.isCanonical) return -1;
        if (!a.isCanonical && b.isCanonical) return 1;
      }

      const stateOrder = [this.State.New, this.State.Learning, this.State.Relearning, this.State.Review];
      const aPriority = stateOrder.indexOf(a.state);
      const bPriority = stateOrder.indexOf(b.state);

      if (aPriority !== bPriority) return aPriority - bPriority;

      return a.due - b.due;
    });

    this.sessionQueue = dueCards.slice(0, max).map(c => c.id);
    console.log('[RhodesSRS] Built session queue with', this.sessionQueue.length, 'cards');

    return this.sessionQueue;
  },

  /**
   * Get graduated cards (mastered)
   */
  getGraduatedCards() {
    const p = this.params;
    return Object.values(this.cards).filter(card =>
      card.consecutiveCorrect >= p.graduationConsecutive &&
      card.interval >= p.graduationMinInterval
    );
  },

  /**
   * Check if a graduated card needs reactivation
   */
  checkReactivation(cardId) {
    const card = this.cards[cardId];
    if (!card) return false;

    const graduated = this.getGraduatedCards().some(c => c.id === cardId);
    if (!graduated) return false;

    // Reactivate if lapsed multiple times
    if (card.lapses >= this.params.reactivationLapseThreshold) {
      card.state = this.State.Review;
      card.interval = this.params.graduatingInterval;
      card.consecutiveCorrect = 0;
      return true;
    }

    return false;
  },

  /**
   * Convert error array to rating
   */
  errorToRating(errors) {
    if (!errors || errors.length === 0) {
      return this.Rating.Easy;
    }

    const errorCount = errors.length;
    const hasWordError = errors.some(e => e.type === 'word' || e === 'word');

    if (errorCount === 0) return this.Rating.Easy;
    if (errorCount === 1 && !hasWordError) return this.Rating.Good;
    if (errorCount <= 2) return this.Rating.Hard;
    return this.Rating.Again;
  },

  /**
   * Log a response to analytics
   */
  logResponse(cardId, rating, errors = [], responseTime = 0) {
    const card = this.cards[cardId];
    const response = {
      cardId,
      rating,
      errors: errors.map(e => e.type || e),
      responseTime,
      timestamp: Date.now(),
      cardState: card ? card.state : null,
      cardInterval: card ? card.interval : null,
      cardReps: card ? card.reps : 0
    };

    this.analytics.responses.push(response);
    this.analytics.totalReviews++;

    if (rating >= this.Rating.Good) {
      this.analytics.correctReviews++;
    }

    // Track errors by type
    for (const error of errors) {
      const errorType = error.type || error;
      this.analytics.errorsByType[errorType] = (this.analytics.errorsByType[errorType] || 0) + 1;
    }

    // Track per-card metrics
    if (!this.analytics.cardMetrics[cardId]) {
      this.analytics.cardMetrics[cardId] = {
        reviews: 0,
        correct: 0,
        avgResponseTime: 0,
        lastReview: null
      };
    }

    const metrics = this.analytics.cardMetrics[cardId];
    metrics.reviews++;
    if (rating >= this.Rating.Good) {
      metrics.correct++;
    }
    metrics.avgResponseTime = ((metrics.avgResponseTime * (metrics.reviews - 1)) + responseTime) / metrics.reviews;
    metrics.lastReview = Date.now();

    this.saveAnalytics();
  },

  /**
   * Start timing a prompt
   */
  startPromptTimer() {
    this.promptStartTime = Date.now();
  },

  /**
   * Get elapsed time since prompt started
   */
  getPromptElapsedTime() {
    if (!this.promptStartTime) return 0;
    return Date.now() - this.promptStartTime;
  },

  /**
   * Start a new session
   */
  startSession() {
    const sessionId = 'session_' + Date.now();
    this.analytics.currentSessionId = sessionId;
    this.analytics.currentSessionStart = Date.now();

    console.log('[RhodesSRS] Started session:', sessionId);
  },

  /**
   * End the current session
   */
  endSession() {
    if (!this.analytics.currentSessionId) return;

    const session = {
      id: this.analytics.currentSessionId,
      start: this.analytics.currentSessionStart,
      end: Date.now(),
      duration: Date.now() - this.analytics.currentSessionStart,
      reviews: this.analytics.responses.filter(r =>
        r.timestamp >= this.analytics.currentSessionStart
      ).length
    };

    this.analytics.sessions.push(session);
    this.analytics.currentSessionId = null;
    this.analytics.currentSessionStart = null;

    this.saveAnalytics();
    console.log('[RhodesSRS] Ended session:', session.id, 'Duration:', session.duration, 'ms');
  },

  /**
   * Get statistics for the current deck
   */
  getStats() {
    const now = Date.now();
    const cards = Object.values(this.cards);

    const newCards = cards.filter(c => c.state === this.State.New).length;
    const learningCards = cards.filter(c => c.state === this.State.Learning).length;
    const reviewCards = cards.filter(c => c.state === this.State.Review).length;
    const relearningCards = cards.filter(c => c.state === this.State.Relearning).length;

    const dueCards = cards.filter(c => c.due <= now).length;
    const graduatedCards = this.getGraduatedCards().length;

    const totalReviews = this.analytics.totalReviews;
    const correctReviews = this.analytics.correctReviews;
    const accuracy = totalReviews > 0 ? (correctReviews / totalReviews * 100).toFixed(1) : 0;

    // Canonical metrics
    const canonicalCards = cards.filter(c => c.isCanonical);
    const totalCanonicals = canonicalCards.length;
    const graduatedCanonicals = canonicalCards.filter(c =>
      c.consecutiveCorrect >= this.params.graduationConsecutive &&
      c.interval >= this.params.graduationMinInterval
    ).length;
    const canonicalsDue = canonicalCards.filter(c => c.due <= now && !c.skippable).length;

    const groups = Object.values(this.canonicalGroups);
    const totalGroups = groups.length;
    const groupsMastered = groups.filter(g => g.graduated).length;

    return {
      total: cards.length,
      new: newCards,
      learning: learningCards,
      review: reviewCards,
      relearning: relearningCards,
      due: dueCards,
      graduated: graduatedCards,
      totalReviews,
      correctReviews,
      accuracy: accuracy + '%',
      errorsByType: this.analytics.errorsByType,
      // Canonical stats
      totalCanonicals,
      graduatedCanonicals,
      canonicalsDue,
      totalGroups,
      groupsMastered
    };
  },

  /**
   * Get status of a specific pattern group
   */
  getGroupStatus(patternGroup) {
    const group = this.canonicalGroups[patternGroup];
    if (!group) return null;
    const activeId = this.getActiveCanonical(patternGroup);
    return {
      mastered: group.graduated,
      activeCanonical: activeId,
      totalCanonicals: group.canonicalIds.length,
      graduatedCount: group.canonicalIds.filter(id => {
        const c = this.cards[id];
        return c && c.consecutiveCorrect >= this.params.graduationConsecutive &&
               c.interval >= this.params.graduationMinInterval;
      }).length,
      totalMembers: group.memberIds.length
    };
  },

  /**
   * Reset all card data (use with caution)
   */
  async resetAllCards() {
    this.cards = {};
    await this.saveCards();
    console.log('[RhodesSRS] Reset all cards');
  },

  /**
   * Reset analytics data
   */
  async resetAnalytics() {
    this.analytics = {
      userId: this.analytics.userId,
      responses: [],
      sessions: [],
      currentSessionStart: null,
      currentSessionId: null,
      totalReviews: 0,
      correctReviews: 0,
      errorsByType: {},
      cardMetrics: {}
    };
    await this.saveAnalytics();
    console.log('[RhodesSRS] Reset analytics');
  },

  /**
   * Export all data as JSON
   */
  exportData() {
    return {
      cards: this.cards,
      analytics: this.analytics,
      params: this.params,
      exportedAt: Date.now()
    };
  },

  /**
   * Import data from JSON
   */
  async importData(data) {
    if (data.cards) {
      this.cards = data.cards;
      await this.saveCards();
    }

    if (data.analytics) {
      this.analytics = { ...this.analytics, ...data.analytics };
      await this.saveAnalytics();
    }

    if (data.params) {
      this.params = { ...this.params, ...data.params };
    }

    console.log('[RhodesSRS] Imported data:', Object.keys(this.cards).length, 'cards');
  }
};

// Export to window
if (typeof window !== 'undefined') {
  window.RhodesSRS = RhodesSRS;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RhodesSRS;
}
