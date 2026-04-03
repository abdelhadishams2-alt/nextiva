/**
 * Language detector test suite.
 *
 * Tests language detection from Unicode script ranges and word patterns.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { detectLanguage } = require('../bridge/language-detector');

describe('Language detector', () => {

  // ── English ──

  it('should detect English text', () => {
    const result = detectLanguage('The quick brown fox jumps over the lazy dog. This is a simple test with common English words.');
    assert.equal(result.language, 'en');
    assert.equal(result.direction, 'ltr');
    assert.equal(result.locale, 'en-US');
  });

  // ── Arabic (RTL) ──

  it('should detect Arabic text', () => {
    const result = detectLanguage('مرحبا بالعالم، هذا نص باللغة العربية');
    assert.equal(result.language, 'ar');
    assert.equal(result.direction, 'rtl');
    assert.equal(result.locale, 'ar-SA');
  });

  it('should return correct font stack for Arabic', () => {
    const result = detectLanguage('مرحبا بالعالم هذا نص عربي');
    assert.deepEqual(result.fonts, ['Noto Naskh Arabic', 'Noto Kufi Arabic', 'sans-serif']);
  });

  // ── Hebrew (RTL) ──

  it('should detect Hebrew text', () => {
    const result = detectLanguage('שלום עולם, זהו טקסט בעברית');
    assert.equal(result.language, 'he');
    assert.equal(result.direction, 'rtl');
    assert.equal(result.locale, 'he-IL');
  });

  it('should return correct font stack for Hebrew', () => {
    const result = detectLanguage('שלום עולם זהו טקסט בעברית');
    assert.deepEqual(result.fonts, ['Noto Sans Hebrew', 'sans-serif']);
  });

  // ── French ──

  it('should detect French text', () => {
    const result = detectLanguage('Bonjour le monde. Nous sommes dans une belle journée avec les enfants qui sont dans la maison pour cette fête.');
    assert.equal(result.language, 'fr');
    assert.equal(result.direction, 'ltr');
    assert.equal(result.locale, 'fr-FR');
  });

  // ── Spanish ──

  it('should detect Spanish text', () => {
    const result = detectLanguage('Hola el mundo. Esta es una historia sobre los problemas del país para las personas que tiene como objetivo ayudar.');
    assert.equal(result.language, 'es');
    assert.equal(result.direction, 'ltr');
    assert.equal(result.locale, 'es-ES');
  });

  // ── Turkish ──

  it('should detect Turkish text', () => {
    const result = detectLanguage('Merhaba dünya. Bu bir deneme metni ve çok güzel bir gün için daha fazla bilgi ama değil ancak gibi olan.');
    assert.equal(result.language, 'tr');
    assert.equal(result.direction, 'ltr');
    assert.equal(result.locale, 'tr-TR');
  });

  // ── Mixed language ──

  it('should detect dominant script in mixed text', () => {
    const result = detectLanguage('Hello world مرحبا بالعالم هذا نص طويل بالعربية ويحتوي على كلمات كثيرة');
    assert.equal(result.language, 'ar');
    assert.equal(result.direction, 'rtl');
  });

  // ── Edge cases ──

  it('should fallback to English for empty string', () => {
    const result = detectLanguage('');
    assert.equal(result.language, 'en');
    assert.equal(result.direction, 'ltr');
  });

  it('should fallback to English for numbers-only input', () => {
    const result = detectLanguage('12345 67890 111213');
    assert.equal(result.language, 'en');
    assert.equal(result.direction, 'ltr');
  });

  it('should fallback to English for null input', () => {
    const result = detectLanguage(null);
    assert.equal(result.language, 'en');
  });

  it('should fallback to English for undefined input', () => {
    const result = detectLanguage(undefined);
    assert.equal(result.language, 'en');
  });

  // ── Direction correctness for RTL ──

  it('should return rtl direction for all RTL languages', () => {
    const arabic = detectLanguage('مرحبا بالعالم هذا نص عربي');
    const hebrew = detectLanguage('שלום עולם זהו טקסט בעברית');
    assert.equal(arabic.direction, 'rtl');
    assert.equal(hebrew.direction, 'rtl');
  });
});
