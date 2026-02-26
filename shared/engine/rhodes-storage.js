/**
 * RhodesStorage - Spaced Repetition System Storage Module
 * Extracted from fsi-main.js and parameterized via COURSE_CONFIG
 *
 * Storage keys read from window.COURSE_CONFIG.storage at runtime:
 *   - progress: default 'rhodes_course_progress'
 *   - sync: default 'rhodes_course_sync'
 */

const SRS_DEFAULTS = {
  interval: 1,
  ease: 2.5,
  reps: 0,
  lapses: 0,
  due: null,
  lastReview: null,
  state: 'new'
};

const RhodesStorage = {
  data: null,

  /**
   * Get storage key from COURSE_CONFIG or return default
   */
  _getStorageKey(type) {
    const config = window.COURSE_CONFIG?.storage || {};
    if (type === 'progress') return config.progress || 'rhodes_course_progress';
    if (type === 'sync') return config.sync || 'rhodes_course_sync';
    return null;
  },

  /**
   * Initialize storage by loading existing data
   */
  async init() {
    this.data = await this.load();
    console.log('Storage loaded:', Object.keys(this.data.cards || {}).length, 'cards');
    return this.data;
  },

  /**
   * Load data from Chrome sync storage, localStorage, or recovery
   */
  async load() {
    const STORAGE_KEY = this._getStorageKey('progress');
    const SYNC_KEY = this._getStorageKey('sync');

    // Try Chrome sync storage first
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      try {
        const result = await chrome.storage.sync.get(SYNC_KEY);
        if (result[SYNC_KEY]) return result[SYNC_KEY];
      } catch (e) {}
    }

    // Try localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }

    // Try recovery from backups
    const recovered = await this.recover();
    if (recovered) {
      console.log('Recovered from backup!');
      return recovered;
    }

    // Return empty state
    return {
      version: 2,
      cards: {},
      unitProgress: {},
      stats: { totalReviews: 0, streak: 0, lastStudyDate: null },
      settings: { newCardsPerDay: 20, reviewsPerDay: 100 }
    };
  },

  /**
   * Save data to localStorage, Chrome storage, and backups
   */
  async save() {
    if (!this.data) return;

    const STORAGE_KEY = this._getStorageKey('progress');
    const SYNC_KEY = this._getStorageKey('sync');

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));

    // Create dated backup
    const backupKey = 'rhodes_backup_' + new Date().toISOString().split('T')[0];
    const allBackups = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('rhodes_backup_')) allBackups.push(key);
    }

    localStorage.setItem(backupKey, JSON.stringify(this.data));

    // Keep only 10 most recent backups
    allBackups.sort().reverse();
    allBackups.slice(10).forEach(key => localStorage.removeItem(key));

    // Save to Chrome sync storage
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      try {
        await chrome.storage.sync.set({ [SYNC_KEY]: this.data });
      } catch (e) {}
    }

    // Save to Chrome local storage
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      try {
        await chrome.storage.local.set({ rhodes_local_backup: this.data });
      } catch (e) {}
    }

    // Call save indicator if it exists
    if (typeof window.showSaveIndicator === 'function') {
      window.showSaveIndicator();
    }
  },

  /**
   * Recover data from Chrome local storage or localStorage backups
   */
  async recover() {
    // Try Chrome local storage
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      try {
        const result = await chrome.storage.local.get('rhodes_local_backup');
        if (result.rhodes_local_backup) return result.rhodes_local_backup;
      } catch (e) {}
    }

    // Try localStorage backups
    const backups = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('rhodes_backup_')) backups.push(key);
    }

    backups.sort().reverse();
    for (const key of backups) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data?.version && data?.cards) return data;
      } catch (e) {}
    }

    return null;
  },

  /**
   * Get or create a card by drillId
   */
  getCard(drillId) {
    if (!this.data.cards[drillId]) {
      this.data.cards[drillId] = { ...SRS_DEFAULTS };
    }
    return this.data.cards[drillId];
  },

  /**
   * Update card after review (quality 0-4)
   */
  reviewCard(drillId, quality) {
    const card = this.getCard(drillId);
    const now = new Date();

    card.lastReview = now.toISOString();
    card.reps++;

    if (quality < 2) {
      card.lapses++;
      card.interval = 1;
      card.state = 'learning';
    } else {
      if (card.state === 'new') {
        card.interval = 1;
        card.state = 'learning';
      } else if (card.state === 'learning') {
        card.interval = 3;
        card.state = 'review';
      } else {
        card.ease = Math.max(
          1.3,
          card.ease + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02))
        );
        card.interval = Math.round(card.interval * card.ease);
        if (card.interval > 180) card.state = 'mastered';
      }
    }

    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + card.interval);
    card.due = dueDate.toISOString();

    this.data.stats.totalReviews++;
    this.save();

    // Sync card to Firestore if signed in
    if (typeof FSI_Auth !== "undefined" && FSI_Auth.isSignedIn()) {
      FSI_Auth.syncCardToFirestore?.(drillId, card);
    }

    return card;
  },

  /**
   * Get progress for a unit
   */
  getUnitProgress(unitId) {
    return this.data.unitProgress[unitId] || { position: 0, seenIds: [] };
  },

  /**
   * Set progress for a unit
   */
  setUnitProgress(unitId, position, seenId = null) {
    if (!this.data.unitProgress[unitId]) {
      this.data.unitProgress[unitId] = { position: 0, seenIds: [] };
    }
    this.data.unitProgress[unitId].position = position;
    if (seenId && !this.data.unitProgress[unitId].seenIds.includes(seenId)) {
      this.data.unitProgress[unitId].seenIds.push(seenId);
    }
    this.save();
  },

  /**
   * Get cards due for review (up to limit)
   */
  getDueCards(limit = 50) {
    const now = new Date();
    return Object.entries(this.data.cards)
      .filter(([id, c]) => c.due && new Date(c.due) <= now)
      .sort((a, b) => new Date(a[1].due) - new Date(b[1].due))
      .slice(0, limit)
      .map(([id, c]) => ({ id, ...c }));
  },

  /**
   * Get statistics summary
   */
  getStats() {
    const cards = Object.values(this.data.cards);
    const now = new Date();
    return {
      total: cards.length,
      newCount: cards.filter(c => c.state === 'new').length,
      learning: cards.filter(c => c.state === 'learning').length,
      review: cards.filter(c => c.state === 'review').length,
      mastered: cards.filter(c => c.state === 'mastered').length,
      dueToday: cards.filter(c => c.due && new Date(c.due) <= now).length,
      streak: this.data.stats.streak,
      totalReviews: this.data.stats.totalReviews
    };
  },

  /**
   * Export progress data as JSON string
   */
  export() {
    return JSON.stringify(this.data, null, 2);
  },

  /**
   * Import progress data from JSON string
   */
  import(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      if (!imported.version || !imported.cards) {
        throw new Error('Invalid format');
      }
      this.data = imported;
      this.save();
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },

  /**
   * Reset all progress data
   */
  reset() {
    this.data = {
      version: 2,
      cards: {},
      unitProgress: {},
      stats: { totalReviews: 0, streak: 0, lastStudyDate: null },
      settings: { newCardsPerDay: 20, reviewsPerDay: 100 }
    };
    this.save();
  },

  /**
   * Export progress data (alias for export)
   */
  exportProgress() {
    return this.export();
  },

  /**
   * Import progress data (alias for import)
   */
  importProgress(jsonString) {
    return this.import(jsonString);
  }
};

// Expose to window
window.RhodesStorage = RhodesStorage;
