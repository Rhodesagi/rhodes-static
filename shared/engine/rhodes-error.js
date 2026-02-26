const RhodesError = {
  normalize(text) {
    return text
      .toLowerCase()
      .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
      .replace(/[\u2018\u2019\u201B\u0060\u00B4\u02BC\u02B9''‛`´ʼʹ\-]/g, "'")
      .replace(/[.,!?;:«»""„‟\u201C\u201D]/g, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim()
      .replace(/\s+/g, ' ');
  },
  stripAccents(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  },
  tokenize(text) {
    return this.normalize(text).split(' ').filter(w => w.length > 0);
  },
  levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i-1) === a.charAt(j-1)) {
          matrix[i][j] = matrix[i-1][j-1];
        } else {
          matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, matrix[i][j-1] + 1, matrix[i-1][j] + 1);
        }
      }
    }
    return matrix[b.length][a.length];
  },
  classify(userInput, expected) {
    const userNorm = this.normalize(userInput);
    const expNorm = this.normalize(expected);
    if (userNorm === expNorm) {
      return { correct: true, errors: [], feedback: '' };
    }
    if (this.stripAccents(userNorm) === this.stripAccents(expNorm)) {
      return {
        correct: true, accentWarning: true,
        errors: [{ type: 'accent', feedback: 'Watch the accents' }],
        feedback: `Accents: ${expected}`
      };
    }
    const userWords = this.tokenize(userInput);
    const expWords = this.tokenize(expected);
    const userSet = new Set(userWords);
    const expSet = new Set(expWords);
    const missing = expWords.filter(w => !userSet.has(w));
    const extra = userWords.filter(w => !expSet.has(w));
    const errors = [];
    const spellingPairs = [];
    for (const extraWord of [...extra]) {
      for (const missWord of [...missing]) {
        const dist = this.levenshtein(extraWord, missWord);
        if (dist <= 2 && dist > 0) {
          spellingPairs.push({ got: extraWord, expected: missWord, dist });
          extra.splice(extra.indexOf(extraWord), 1);
          missing.splice(missing.indexOf(missWord), 1);
          break;
        }
      }
    }
    for (const pair of spellingPairs) {
      if (this.stripAccents(pair.got) === this.stripAccents(pair.expected)) {
        errors.push({ type: 'accent', got: pair.got, expected: pair.expected, feedback: `Accent: "${pair.got}" → "${pair.expected}"` });
      } else {
        errors.push({ type: 'spelling', got: pair.got, expected: pair.expected, feedback: `Spelling: "${pair.got}" → "${pair.expected}"` });
      }
    }
    if (missing.length > 0) {
      const missingList = missing.slice(0, 3).map(w => `"${w}"`).join(', ');
      const moreCount = missing.length > 3 ? ` (+${missing.length - 3} more)` : '';
      errors.push({ type: 'missing', words: missing, feedback: `Missing: ${missingList}${moreCount}` });
    }
    if (extra.length > 0) {
      const extraList = extra.slice(0, 3).map(w => `"${w}"`).join(', ');
      const moreCount = extra.length > 3 ? ` (+${extra.length - 3} more)` : '';
      errors.push({ type: 'extra', words: extra, feedback: `Extra: ${extraList}${moreCount}` });
    }
    let feedback = '';
    if (errors.length > 0) { feedback = errors.map(e => e.feedback).join('\n'); }
    return { correct: false, errors, primaryError: errors[0] || { type: 'error' }, feedback };
  }
};

window.RhodesError = RhodesError;
