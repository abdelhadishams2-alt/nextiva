/**
 * Language detection module for ChainIQ Universal Engine.
 * Zero dependencies — uses only Node.js built-ins.
 *
 * Detects script type from Unicode ranges and maps to language,
 * direction, font stacks, and locale.
 */

// ── Unicode script ranges ──

const SCRIPT_RANGES = {
  arabic:     { start: 0x0600, end: 0x06FF },
  hebrew:     { start: 0x0590, end: 0x05FF },
  cjk:        { start: 0x4E00, end: 0x9FFF },
  cyrillic:   { start: 0x0400, end: 0x04FF },
  devanagari: { start: 0x0900, end: 0x097F },
  latin:      { start: 0x0041, end: 0x024F },
};

// ── RTL languages ──

const RTL_LANGUAGES = new Set(['ar', 'he']);

// ── Font stacks per language ──

const FONT_STACKS = {
  ar: ['Noto Naskh Arabic', 'Noto Kufi Arabic', 'sans-serif'],
  he: ['Noto Sans Hebrew', 'sans-serif'],
  fr: ['system-ui', 'sans-serif'],
  es: ['system-ui', 'sans-serif'],
  tr: ['system-ui', 'sans-serif'],
  en: ['system-ui', 'sans-serif'],
  zh: ['Noto Sans SC', 'sans-serif'],
  ru: ['system-ui', 'sans-serif'],
  hi: ['Noto Sans Devanagari', 'sans-serif'],
};

// ── Locale map ──

const LOCALE_MAP = {
  ar: 'ar-SA',
  he: 'he-IL',
  fr: 'fr-FR',
  es: 'es-ES',
  tr: 'tr-TR',
  en: 'en-US',
  zh: 'zh-CN',
  ru: 'ru-RU',
  hi: 'hi-IN',
};

// ── Common word patterns for Latin-script languages ──

const LATIN_PATTERNS = {
  fr: /\b(le|la|les|des|est|une?|dans|pour|avec|qui|que|sur|pas|sont|nous|vous|ils|cette|mais|aussi|comme|tout|fait|bien|aux|ces|ont)\b/gi,
  es: /\b(el|los|las|una?|del|por|con|para|que|est[aá]|como|pero|sus|todo|tiene|puede|entre|desde|cuando|donde|otro|esta|sobre|hay)\b/gi,
  tr: /\b(bir|ve|bu|için|ile|olan|gibi|daha|çok|var|ama|den|dan|kadar|olarak|sonra|her|üzerinde|değil|oldu|olan|ise|ancak)\b/gi,
  en: /\b(the|is|are|was|were|have|has|been|will|would|could|should|this|that|with|from|they|their|which|about|into|than|just|also|more|some|these|other)\b/gi,
};

/**
 * Count characters matching a Unicode script range.
 */
function countScript(text, range) {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= range.start && code <= range.end) count++;
  }
  return count;
}

/**
 * Detect the dominant non-Latin script in the text.
 * Returns the script name or null if Latin/unknown.
 */
function detectScript(text) {
  const counts = {};
  let maxScript = null;
  let maxCount = 0;

  for (const [script, range] of Object.entries(SCRIPT_RANGES)) {
    if (script === 'latin') continue;
    const count = countScript(text, range);
    counts[script] = count;
    if (count > maxCount) {
      maxCount = count;
      maxScript = script;
    }
  }

  // Require at least 3 characters of the dominant non-Latin script
  if (maxCount >= 3) return maxScript;
  return null;
}

/**
 * Map a detected script to a language code.
 */
function scriptToLanguage(script) {
  const map = {
    arabic: 'ar',
    hebrew: 'he',
    cjk: 'zh',
    cyrillic: 'ru',
    devanagari: 'hi',
  };
  return map[script] || null;
}

/**
 * For Latin-script text, use word frequency patterns to distinguish languages.
 */
function detectLatinLanguage(text) {
  const scores = {};

  for (const [lang, pattern] of Object.entries(LATIN_PATTERNS)) {
    const matches = text.match(pattern);
    scores[lang] = matches ? matches.length : 0;
  }

  let bestLang = 'en';
  let bestScore = 0;

  for (const [lang, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  }

  return bestLang;
}

/**
 * Detect the language of the given text.
 *
 * @param {string} text - Input text to analyze
 * @returns {{ language: string, direction: 'ltr'|'rtl', fonts: string[], locale: string }}
 */
function detectLanguage(text) {
  const fallback = {
    language: 'en',
    direction: 'ltr',
    fonts: FONT_STACKS.en,
    locale: LOCALE_MAP.en,
  };

  if (!text || typeof text !== 'string') return fallback;

  // Strip whitespace/punctuation for analysis
  const cleaned = text.replace(/[\s\d\p{P}]/gu, '');
  if (cleaned.length === 0) return fallback;

  // Check for non-Latin scripts first
  const script = detectScript(cleaned);
  if (script) {
    const lang = scriptToLanguage(script);
    if (lang) {
      return {
        language: lang,
        direction: RTL_LANGUAGES.has(lang) ? 'rtl' : 'ltr',
        fonts: FONT_STACKS[lang] || FONT_STACKS.en,
        locale: LOCALE_MAP[lang] || 'en-US',
      };
    }
  }

  // Latin script — use word patterns
  const lang = detectLatinLanguage(text);
  return {
    language: lang,
    direction: RTL_LANGUAGES.has(lang) ? 'rtl' : 'ltr',
    fonts: FONT_STACKS[lang] || FONT_STACKS.en,
    locale: LOCALE_MAP[lang] || 'en-US',
  };
}

module.exports = { detectLanguage };
