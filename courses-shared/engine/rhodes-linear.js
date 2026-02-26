const _hasChrome = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

function _storageGet(key) {
  return new Promise((resolve) => {
    if (_hasChrome) {
      chrome.storage.local.get([key], (result) => resolve(result[key] || null));
    } else {
      try {
        const val = localStorage.getItem(key);
        resolve(val ? JSON.parse(val) : null);
      } catch (e) { resolve(null); }
    }
  });
}

function _storageSet(key, value) {
  return new Promise((resolve, reject) => {
    if (_hasChrome) {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          console.error('Chrome storage error:', chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError);
        } else { resolve(); }
      });
    } else {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        resolve();
      } catch (e) {
        console.error('LocalStorage error:', e.message);
        const indicator = document.getElementById('saveIndicator');
        if (indicator) {
          indicator.innerHTML = '<span style="color:#dc3545;">Storage full</span>';
          indicator.classList.add('show');
          setTimeout(() => indicator.classList.remove('show'), 5000);
        }
        reject(e);
      }
    }
  }).catch(e => { console.warn('Storage set failed:', e.message); });
}

function _shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const RhodesLinear = {
  get STORAGE_KEY() { return window.COURSE_CONFIG?.storage?.linear || 'rhodes_linear'; },
  SECTIONS: ['dialogue','vocabulary','grammar','lexical_drills','substitution_drills','transformation_drills','response_drills','expansion_drills','variation_drills','translation_drills','review'],
  state: { current_unit: 1, current_section: 'dialogue', current_item: 0, completed: {}, scores: {}, started_at: null, last_activity: null },
  courseData: null,

  async init(courseData) {
    this.courseData = courseData;
    await this.loadState();
    return this;
  },

  async loadState() {
    const saved = await _storageGet(this.STORAGE_KEY);
    if (saved) {
      this.state = { ...this.state, ...saved };
    }
    if (!this.state.started_at) {
      this.state.started_at = new Date().toISOString();
    }
  },

  async saveState() {
    this.state.last_activity = new Date().toISOString();
    await _storageSet(this.STORAGE_KEY, this.state);
  },

  getCurrentUnit() {
    return this.state.current_unit;
  },

  getCurrentSection() {
    return this.state.current_section;
  },

  getCurrentSectionData() {
    const unit = this.courseData?.units?.[this.state.current_unit];
    if (!unit) return null;
    return unit[this.state.current_section] || null;
  },

  getCurrentItem() {
    const sectionData = this.getCurrentSectionData();
    if (!sectionData || !Array.isArray(sectionData)) return null;
    return sectionData[this.state.current_item] || null;
  },

  getItemKey(unit, section, index) {
    return `${unit}_${section}_${index}`;
  },

  isCompleted(unit, section, index) {
    const key = this.getItemKey(unit, section, index);
    return !!this.state.completed[key];
  },

  async markComplete(unit, section, index, score = null) {
    const key = this.getItemKey(unit, section, index);
    this.state.completed[key] = new Date().toISOString();
    if (score !== null) {
      this.state.scores[key] = score;
    }
    await this.saveState();
  },

  async nextItem() {
    const sectionData = this.getCurrentSectionData();
    if (!sectionData || !Array.isArray(sectionData)) {
      return await this.nextSection();
    }

    if (this.state.current_item < sectionData.length - 1) {
      this.state.current_item++;
      await this.saveState();
      return { unit: this.state.current_unit, section: this.state.current_section, item: this.state.current_item };
    } else {
      return await this.nextSection();
    }
  },

  async nextSection() {
    const currentIdx = this.SECTIONS.indexOf(this.state.current_section);
    if (currentIdx < this.SECTIONS.length - 1) {
      this.state.current_section = this.SECTIONS[currentIdx + 1];
      this.state.current_item = 0;
      await this.saveState();
      return { unit: this.state.current_unit, section: this.state.current_section, item: this.state.current_item };
    } else {
      return await this.nextUnit();
    }
  },

  async nextUnit() {
    const maxUnit = Object.keys(this.courseData?.units || {}).length;
    if (this.state.current_unit < maxUnit) {
      this.state.current_unit++;
      this.state.current_section = this.SECTIONS[0];
      this.state.current_item = 0;
      await this.saveState();
      return { unit: this.state.current_unit, section: this.state.current_section, item: this.state.current_item };
    } else {
      return null;
    }
  },

  async goTo(unit, section, item = 0) {
    this.state.current_unit = unit;
    this.state.current_section = section;
    this.state.current_item = item;
    await this.saveState();
    return { unit, section, item };
  },

  buildReviewItems(unit) {
    const unitData = this.courseData?.units?.[unit];
    if (!unitData) return [];

    const reviewItems = [];

    for (const section of this.SECTIONS) {
      if (section === 'review') continue;
      const sectionData = unitData[section];
      if (!Array.isArray(sectionData)) continue;

      sectionData.forEach((item, idx) => {
        const key = this.getItemKey(unit, section, idx);
        if (this.state.completed[key]) {
          reviewItems.push({
            ...item,
            _source_section: section,
            _source_index: idx,
            _completion_date: this.state.completed[key],
            _score: this.state.scores[key] || null
          });
        }
      });
    }

    return _shuffle(reviewItems);
  },

  getUnitProgress(unit) {
    const unitData = this.courseData?.units?.[unit];
    if (!unitData) return { completed: 0, total: 0, percentage: 0 };

    let completed = 0;
    let total = 0;

    for (const section of this.SECTIONS) {
      if (section === 'review') continue;
      const sectionData = unitData[section];
      if (!Array.isArray(sectionData)) continue;

      sectionData.forEach((_, idx) => {
        total++;
        if (this.isCompleted(unit, section, idx)) {
          completed++;
        }
      });
    }

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  },

  getOverallProgress() {
    const units = Object.keys(this.courseData?.units || {});
    let totalCompleted = 0;
    let totalItems = 0;

    units.forEach(unitNum => {
      const progress = this.getUnitProgress(parseInt(unitNum));
      totalCompleted += progress.completed;
      totalItems += progress.total;
    });

    return {
      completed: totalCompleted,
      total: totalItems,
      percentage: totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0,
      units_completed: units.filter(u => this.getUnitProgress(parseInt(u)).percentage === 100).length,
      total_units: units.length
    };
  },

  getScores(unit = null) {
    if (unit === null) {
      return this.state.scores;
    }

    const unitScores = {};
    Object.keys(this.state.scores).forEach(key => {
      if (key.startsWith(`${unit}_`)) {
        unitScores[key] = this.state.scores[key];
      }
    });
    return unitScores;
  },

  getCompletedSentences(maxItems = 50) {
    const sentences = [];
    const targetField = window.COURSE_CONFIG?.fields?.target || 'french';

    Object.keys(this.state.completed).forEach(key => {
      const [unit, section, index] = key.split('_');
      const unitData = this.courseData?.units?.[parseInt(unit)];
      if (!unitData) return;

      const sectionData = unitData[section];
      if (!Array.isArray(sectionData)) return;

      const itemData = sectionData[parseInt(index)];
      if (!itemData) return;

      if (itemData?.[targetField]) {
        sentences.push({
          sentence: itemData[targetField],
          english: itemData.english || '',
          unit: parseInt(unit),
          section,
          index: parseInt(index),
          completed_at: this.state.completed[key],
          score: this.state.scores[key] || null
        });
      }
    });

    sentences.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
    return sentences.slice(0, maxItems);
  },

  async resetUnit(unit) {
    const keysToDelete = Object.keys(this.state.completed).filter(k => k.startsWith(`${unit}_`));
    keysToDelete.forEach(key => {
      delete this.state.completed[key];
      delete this.state.scores[key];
    });

    if (this.state.current_unit === unit) {
      this.state.current_section = this.SECTIONS[0];
      this.state.current_item = 0;
    }

    await this.saveState();
  },

  async resetAll() {
    this.state = {
      current_unit: 1,
      current_section: 'dialogue',
      current_item: 0,
      completed: {},
      scores: {},
      started_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    };
    await this.saveState();
  }
};

window.RhodesLinear = RhodesLinear;
