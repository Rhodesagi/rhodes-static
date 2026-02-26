/**
 * Rhodes Universal Language Engine - UI Module
 * Handles: diff highlighting, verb hints, confusable hints, stats rendering
 * Language-specific data (verbs, confusables, grammar) comes from COURSE_CONFIG
 */

const RhodesUI = {

  // Check if two words are similar enough to be a typo
  isSimilarWord(word1, word2) {
    const a = word1.toLowerCase();
    const b = word2.toLowerCase();
    if (a.length <= 2 || b.length <= 2) return a[0] === b[0];
    let prefixLen = 0;
    while (prefixLen < a.length && prefixLen < b.length && a[prefixLen] === b[prefixLen]) prefixLen++;
    let suffixLen = 0;
    while (suffixLen < (a.length - prefixLen) && suffixLen < (b.length - prefixLen) &&
           a[a.length - 1 - suffixLen] === b[b.length - 1 - suffixLen]) suffixLen++;
    const maxLen = Math.max(a.length, b.length);
    const coverage = (prefixLen + suffixLen) / maxLen;
    return coverage > 0.7 && a[0] === b[0];
  },

  // Character-level diff within a word
  highlightWordDiff(userWord, expectedWord) {
    const u = userWord.toLowerCase();
    const e = expectedWord.toLowerCase();
    let prefixLen = 0;
    while (prefixLen < u.length && prefixLen < e.length && u[prefixLen] === e[prefixLen]) prefixLen++;
    let suffixLen = 0;
    while (suffixLen < (u.length - prefixLen) && suffixLen < (e.length - prefixLen) &&
           u[u.length - 1 - suffixLen] === e[e.length - 1 - suffixLen]) suffixLen++;

    const uPrefix = userWord.substring(0, prefixLen);
    const uMiddle = userWord.substring(prefixLen, userWord.length - suffixLen);
    const uSuffix = userWord.substring(userWord.length - suffixLen);
    const ePrefix = expectedWord.substring(0, prefixLen);
    const eMiddle = expectedWord.substring(prefixLen, expectedWord.length - suffixLen);
    const eSuffix = expectedWord.substring(expectedWord.length - suffixLen);

    let uMiddleHtml = '';
    if (uMiddle) {
      uMiddleHtml = `<span style="color: #c62828; text-decoration: line-through;">${uMiddle}</span>`;
    } else if (eMiddle) {
      uMiddleHtml = `<span style="color: #c62828;">${'_'.repeat(eMiddle.length)}</span>`;
    }

    const userHtml = `<span style="color: #2e7d32;">${uPrefix}</span>` + uMiddleHtml +
      `<span style="color: #2e7d32;">${uSuffix}</span>`;
    const expHtml = `<span>${ePrefix}</span>` +
      (eMiddle ? `<span style="color: #2e7d32; font-weight: bold;">${eMiddle}</span>` : '') +
      `<span>${eSuffix}</span>`;
    return { userHtml, expHtml };
  },

  // Highlight differences between user input and expected
  highlightDiff(userInput, expected) {
    const userWords = userInput.trim().replace(/-/g, ' ').split(/\s+/);
    const expWords = expected.trim().replace(/-/g, ' ').split(/\s+/);
    const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.,!?;:«»""']/g, '');

    let userHtml = [];
    let expHtml = [];
    const maxLen = Math.max(userWords.length, expWords.length);

    for (let i = 0; i < maxLen; i++) {
      const uw = userWords[i] || '';
      const ew = expWords[i] || '';
      if (normalize(uw) === normalize(ew)) {
        userHtml.push(`<span style="color: #2e7d32;">${uw}</span>`);
        expHtml.push(`<span>${ew}</span>`);
      } else if (uw && ew && this.isSimilarWord(uw, ew)) {
        const wordDiff = this.highlightWordDiff(uw, ew);
        userHtml.push(wordDiff.userHtml);
        expHtml.push(wordDiff.expHtml);
      } else if (uw && ew) {
        userHtml.push(`<span style="color: #c62828; text-decoration: line-through;">${uw}</span>`);
        expHtml.push(`<span style="color: #2e7d32; font-weight: bold;">${ew}</span>`);
      } else if (uw && !ew) {
        userHtml.push(`<span style="color: #c62828; text-decoration: line-through;">${uw}</span>`);
      } else if (!uw && ew) {
        userHtml.push(`<span style="color: #999;">_</span>`);
        expHtml.push(`<span style="color: #2e7d32; font-weight: bold;">${ew}</span>`);
      }
    }

    return { userHighlighted: userHtml.join(' '), expectedHighlighted: expHtml.join(' ') };
  },

  // Get verb hint when user makes an error (reads from config.verbs)
  getVerbHintForError(expected, userInput) {
    const verbs = window.COURSE_CONFIG?.verbs;
    if (!verbs) return null;

    const expLower = expected.toLowerCase();
    const userLower = userInput.toLowerCase();

    for (const [verb, data] of Object.entries(verbs)) {
      const allForms = [
        ...(data.present || []),
        ...(data.imparfait || []),
        ...(data.futur || []),
        ...(data.conditionnel || [])
      ];
      const expectedForm = allForms.find(f => expLower.includes(f));
      if (expectedForm) {
        const userHasWrongForm = allForms.some(f => f !== expectedForm && userLower.includes(f));
        if (userHasWrongForm || !userLower.includes(expectedForm)) {
          if (data.present) {
            const je = /^[aeiouhéèêëàâäôùûü]/i.test(data.present[0]) ? "j'" : "je ";
            return `${verb.toUpperCase()}: ${je}${data.present[0]}, tu ${data.present[1]}, il/elle ${data.present[2]}, nous ${data.present[3]}, vous ${data.present[4]}, ils/elles ${data.present[5]}`;
          }
        }
      }
    }
    return null;
  },

  // Get confusion hint (reads from config.confusables)
  getConfusionHint(expected, userInput) {
    const confusables = window.COURSE_CONFIG?.confusables;
    if (!confusables) return null;

    const expWords = expected.toLowerCase().split(/\s+/);
    const userWords = userInput.toLowerCase().split(/\s+/);

    for (const expWord of expWords) {
      const data = confusables[expWord];
      if (data && userWords.includes(data.confusesWith)) return data.hint;
    }
    for (const userWord of userWords) {
      const data = confusables[userWord];
      if (data && expWords.includes(data.confusesWith)) return data.hint;
    }
    return null;
  },

  // Generate grammar hints (reads from config.verbs and config.grammarPatterns)
  generateGrammarHints(targetText, sourceText) {
    const fn = window.COURSE_CONFIG?.detectGrammarPatterns;
    if (fn) return fn(targetText, sourceText);
    return 'Focus on vocabulary and rhythm';
  },

  // Show save indicator animation
  showSaveIndicator() {
    const indicator = document.getElementById('saveIndicator');
    if (indicator) {
      indicator.classList.remove('show');
      void indicator.offsetWidth;
      indicator.classList.add('show');
    }
  }
};

window.RhodesUI = RhodesUI;
// Also expose showSaveIndicator globally for Storage module
window.showSaveIndicator = RhodesUI.showSaveIndicator;
