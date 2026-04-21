/**
 * Evidence Schema Tests — Content Quality Phase
 *
 * Validates the canonical evidence-record shape used across:
 *   research-engine -> strategist (architect Phase 3) -> section-writer ->
 *   saudi-localizer -> fact-checker -> quality-reviewer
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const schema = require('../../engine/evidence-schema');

const FIXTURE_PATH = path.join(__dirname, '..', 'fixtures', 'evidence-bank.sample.json');
const fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf-8'));

describe('evidence-schema :: validateEvidence', () => {
  it('accepts a well-formed record', () => {
    const record = fixture.records[0];
    const result = schema.validateEvidence(record);
    assert.strictEqual(result.valid, true);
    assert.deepStrictEqual(result.errors, []);
  });

  it('rejects a record missing required fields', () => {
    const result = schema.validateEvidence({});
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.length >= 5);
  });

  it('rejects malformed id', () => {
    const record = { ...fixture.records[0], id: 'wafeq-pricing' };
    const result = schema.validateEvidence(record);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('id must match')));
  });

  it('rejects non-http source URL', () => {
    const record = { ...fixture.records[0], source_url: 'ftp://example.com' };
    const result = schema.validateEvidence(record);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('source_url must be an http(s) URL')));
  });

  it('rejects malformed verified_date', () => {
    const record = { ...fixture.records[0], verified_date: 'April 20, 2026' };
    const result = schema.validateEvidence(record);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('verified_date must be an ISO date')));
  });

  it('rejects unknown confidence level', () => {
    const record = { ...fixture.records[0], confidence: 'uncertain' };
    const result = schema.validateEvidence(record);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('confidence must be one of')));
  });

  it('rejects unknown scope', () => {
    const record = { ...fixture.records[0], scope: 'regional' };
    const result = schema.validateEvidence(record);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('scope must be one of')));
  });

  it('rejects unknown kind', () => {
    const record = { ...fixture.records[0], kind: 'opinion' };
    const result = schema.validateEvidence(record);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('kind must be one of')));
  });

  it('rejects non-boolean high_stakes', () => {
    const record = { ...fixture.records[0], high_stakes: 'yes' };
    const result = schema.validateEvidence(record);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('high_stakes must be a boolean')));
  });

  it('accepts records without dimensions (optional)', () => {
    const base = fixture.records[0];
    const { dimensions, ...rest } = base;
    const result = schema.validateEvidence(rest);
    assert.strictEqual(result.valid, true);
  });

  it('rejects non-array dimensions', () => {
    const record = { ...fixture.records[0], dimensions: 'zatca' };
    const result = schema.validateEvidence(record);
    assert.strictEqual(result.valid, false);
  });
});

describe('evidence-schema :: validateBank', () => {
  it('accepts the full fixture bank', () => {
    const result = schema.validateBank(fixture.records);
    assert.strictEqual(result.valid, true, `invalid records: ${JSON.stringify(result.invalid, null, 2)}`);
    assert.strictEqual(result.validCount, fixture.records.length);
  });

  it('rejects when records is not an array', () => {
    const result = schema.validateBank({});
    assert.strictEqual(result.valid, false);
  });

  it('collects all invalid records with their index', () => {
    const bank = [
      fixture.records[0],
      { id: 'bad' },
      fixture.records[1],
      { id: 'also-bad' },
    ];
    const result = schema.validateBank(bank);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.invalid.length, 2);
    assert.deepStrictEqual(result.invalid.map(i => i.index), [1, 3]);
  });
});

describe('evidence-schema :: filterByScope', () => {
  it('returns only saudi-scope records when requested', () => {
    const saudi = schema.filterByScope(fixture.records, 'saudi');
    assert.ok(saudi.length > 0);
    assert.ok(saudi.every(r => r.scope === 'saudi'));
  });

  it('returns empty for general when bank is all-saudi', () => {
    const general = schema.filterByScope(fixture.records, 'general');
    assert.strictEqual(general.length, 0);
  });

  it('throws on unknown scope', () => {
    assert.throws(() => schema.filterByScope(fixture.records, 'international'), /scope must be one of/);
  });
});

describe('evidence-schema :: filterByKind', () => {
  it('returns records of a single kind', () => {
    const pricing = schema.filterByKind(fixture.records, 'pricing');
    assert.ok(pricing.length > 0);
    assert.ok(pricing.every(r => r.kind === 'pricing'));
  });

  it('returns records of multiple kinds when array provided', () => {
    const priceOrReg = schema.filterByKind(fixture.records, ['pricing', 'regulation']);
    assert.ok(priceOrReg.every(r => ['pricing', 'regulation'].includes(r.kind)));
    assert.ok(priceOrReg.length >= schema.filterByKind(fixture.records, 'pricing').length);
  });
});

describe('evidence-schema :: selectByIds', () => {
  it('returns records in the requested order', () => {
    const requested = ['ev-zoho-sar-69', 'ev-wafeq-sar-99', 'ev-zatca-phase2-api-spec'];
    const selected = schema.selectByIds(fixture.records, requested);
    assert.deepStrictEqual(selected.map(r => r.id), requested);
  });

  it('silently skips ids not found in the bank', () => {
    const requested = ['ev-zoho-sar-69', 'ev-nonexistent', 'ev-wafeq-sar-99'];
    const selected = schema.selectByIds(fixture.records, requested);
    assert.strictEqual(selected.length, 2);
  });
});

describe('evidence-schema :: isStale', () => {
  it('returns false for fresh records', () => {
    const fresh = { verified_date: '2026-04-20' };
    const today = new Date('2026-04-21');
    assert.strictEqual(schema.isStale(fresh, 180, today), false);
  });

  it('returns true for records past the age limit', () => {
    const old = { verified_date: '2025-09-01' };
    const today = new Date('2026-04-21');
    assert.strictEqual(schema.isStale(old, 180, today), true);
  });

  it('returns true for missing or malformed verified_date', () => {
    assert.strictEqual(schema.isStale({}, 180, new Date('2026-04-21')), true);
    assert.strictEqual(schema.isStale({ verified_date: 'not-a-date' }, 180, new Date('2026-04-21')), true);
  });

  it('respects custom age window', () => {
    const record = { verified_date: '2026-03-01' };
    const today = new Date('2026-04-21');
    assert.strictEqual(schema.isStale(record, 30, today), true);
    assert.strictEqual(schema.isStale(record, 90, today), false);
  });
});

describe('evidence-schema :: highStakes', () => {
  it('returns only records flagged high_stakes', () => {
    const hs = schema.highStakes(fixture.records);
    assert.ok(hs.length > 0);
    assert.ok(hs.every(r => r.high_stakes === true));
    assert.ok(hs.length < fixture.records.length, 'fixture should include some non-high-stakes records too');
  });
});
