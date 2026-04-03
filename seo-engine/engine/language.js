/**
 * Language Detection & Configuration for ChainIQ Universal Engine.
 *
 * Detects language from topic text, determines text direction,
 * selects appropriate fonts, and provides locale configuration
 * for the research and generation pipeline.
 */

// Unicode script ranges for detection
const SCRIPT_RANGES = [
  { name: 'arabic',     re: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/ },
  { name: 'hebrew',     re: /[\u0590-\u05FF\uFB1D-\uFB4F]/ },
  { name: 'cjk',        re: /[\u4E00-\u9FFF\u3400-\u4DBF\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/ },
  { name: 'cyrillic',   re: /[\u0400-\u04FF\u0500-\u052F]/ },
  { name: 'devanagari', re: /[\u0900-\u097F\uA8E0-\uA8FF]/ },
  { name: 'thai',       re: /[\u0E00-\u0E7F]/ },
  { name: 'latin',      re: /[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/ },
];

// Language configuration database
const LANGUAGES = {
  en: { name: 'English',  script: 'latin',      direction: 'ltr', locale: 'en-US', fonts: { body: 'system-ui, sans-serif', heading: 'system-ui, sans-serif' } },
  ar: { name: 'Arabic',   script: 'arabic',     direction: 'rtl', locale: 'ar-SA', fonts: { body: '"Noto Naskh Arabic", "Traditional Arabic", serif', heading: '"Noto Kufi Arabic", "Arial", sans-serif' } },
  he: { name: 'Hebrew',   script: 'hebrew',     direction: 'rtl', locale: 'he-IL', fonts: { body: '"David CLM", "David", serif', heading: '"Arial Hebrew", sans-serif' } },
  fr: { name: 'French',   script: 'latin',      direction: 'ltr', locale: 'fr-FR', fonts: { body: 'system-ui, sans-serif', heading: 'system-ui, sans-serif' } },
  es: { name: 'Spanish',  script: 'latin',      direction: 'ltr', locale: 'es-ES', fonts: { body: 'system-ui, sans-serif', heading: 'system-ui, sans-serif' } },
  de: { name: 'German',   script: 'latin',      direction: 'ltr', locale: 'de-DE', fonts: { body: 'system-ui, sans-serif', heading: 'system-ui, sans-serif' } },
  tr: { name: 'Turkish',  script: 'latin',      direction: 'ltr', locale: 'tr-TR', fonts: { body: 'system-ui, sans-serif', heading: 'system-ui, sans-serif' } },
  zh: { name: 'Chinese',  script: 'cjk',        direction: 'ltr', locale: 'zh-CN', fonts: { body: '"Noto Sans SC", "PingFang SC", sans-serif', heading: '"Noto Sans SC", "PingFang SC", sans-serif' } },
  ja: { name: 'Japanese', script: 'cjk',        direction: 'ltr', locale: 'ja-JP', fonts: { body: '"Noto Sans JP", "Hiragino Sans", sans-serif', heading: '"Noto Sans JP", "Hiragino Sans", sans-serif' } },
  ru: { name: 'Russian',  script: 'cyrillic',   direction: 'ltr', locale: 'ru-RU', fonts: { body: 'system-ui, sans-serif', heading: 'system-ui, sans-serif' } },
  hi: { name: 'Hindi',    script: 'devanagari', direction: 'ltr', locale: 'hi-IN', fonts: { body: '"Noto Sans Devanagari", sans-serif', heading: '"Noto Sans Devanagari", sans-serif' } },
};

// Common word patterns for disambiguation (Latin scripts)
const WORD_PATTERNS = {
  fr: /\b(le|la|les|un|une|des|du|de|et|est|sont|avec|pour|dans|qui|que|sur|par|pas|mais|ou|ce|cette)\b/gi,
  es: /\b(el|la|los|las|un|una|del|de|en|es|son|con|para|por|como|que|pero|más|su|al)\b/gi,
  de: /\b(der|die|das|ein|eine|und|ist|sind|mit|für|auf|von|zu|den|dem|nicht|es|ich|sie|er)\b/gi,
  tr: /\b(bir|ve|bu|ile|için|olan|gibi|daha|ama|veya|ancak|çok|hem|olan|olarak)\b/gi,
};

/**
 * Detect the dominant script in a text string.
 * Returns the script name with the highest character count.
 */
function detectScript(text) {
  if (!text || typeof text !== 'string') return 'latin';

  const counts = {};
  for (const { name, re } of SCRIPT_RANGES) {
    const matches = text.match(new RegExp(re.source, 'g'));
    counts[name] = matches ? matches.length : 0;
  }

  let maxScript = 'latin';
  let maxCount = 0;
  for (const [script, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxScript = script;
      maxCount = count;
    }
  }

  return maxScript;
}

/**
 * Detect language from topic text.
 * Returns a language code (e.g., 'en', 'ar', 'fr').
 */
function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'en';

  const script = detectScript(text);

  // Non-Latin scripts map directly to languages
  if (script === 'arabic') return 'ar';
  if (script === 'hebrew') return 'he';
  if (script === 'cyrillic') return 'ru';
  if (script === 'devanagari') return 'hi';
  if (script === 'thai') return 'th';

  // CJK needs character-level disambiguation
  if (script === 'cjk') {
    const hasHiragana = /[\u3040-\u309F]/.test(text);
    const hasKatakana = /[\u30A0-\u30FF]/.test(text);
    const hasHangul = /[\uAC00-\uD7AF]/.test(text);
    if (hasHiragana || hasKatakana) return 'ja';
    if (hasHangul) return 'ko';
    return 'zh';
  }

  // Latin scripts: use word pattern matching
  if (script === 'latin') {
    let bestLang = 'en';
    let bestScore = 0;

    for (const [lang, pattern] of Object.entries(WORD_PATTERNS)) {
      const matches = text.match(pattern);
      const score = matches ? matches.length : 0;
      if (score > bestScore) {
        bestScore = score;
        bestLang = lang;
      }
    }

    // Only switch from English if there's meaningful evidence
    if (bestScore < 2) return 'en';
    return bestLang;
  }

  return 'en';
}

/**
 * Get full language configuration.
 * Accepts explicit language code OR auto-detects from text.
 *
 * @param {string} input - Language code ('en','ar') or topic text for detection
 * @returns {{ language: string, name: string, direction: string, locale: string, fonts: object, isRTL: boolean }}
 */
function getLanguageConfig(input) {
  let langCode;

  // If input is a 2-3 char language code, use it directly
  if (input && input.length <= 3 && LANGUAGES[input.toLowerCase()]) {
    langCode = input.toLowerCase();
  } else {
    langCode = detectLanguage(input);
  }

  const config = LANGUAGES[langCode] || LANGUAGES.en;

  return {
    language: langCode,
    name: config.name,
    direction: config.direction,
    locale: config.locale,
    fonts: { ...config.fonts },
    isRTL: config.direction === 'rtl'
  };
}

/**
 * Get list of supported languages
 */
function getSupportedLanguages() {
  return Object.entries(LANGUAGES).map(([code, config]) => ({
    code,
    name: config.name,
    direction: config.direction
  }));
}

module.exports = {
  detectScript,
  detectLanguage,
  getLanguageConfig,
  getSupportedLanguages,
  LANGUAGES
};
