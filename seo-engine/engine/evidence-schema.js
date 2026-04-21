/**
 * Evidence Record Schema for ChainIQ Content Quality Phase.
 *
 * Every fact used in article generation flows through this shape.
 * The schema is consumed by:
 *   - research-engine (emits records)
 *   - article-architect Phase 3 / Strategist (selects records per section)
 *   - section-writer subagent (cites records inline)
 *   - saudi-localizer subagent (queries records by scope === "saudi")
 *   - fact-checker subagent (validates source_url and verified_date)
 *   - quality-reviewer subagent (scores section against record dimensions)
 *
 * Zero dependencies by design — pure Node.js per the ChainIQ golden rule.
 */

const ALLOWED_CONFIDENCE = ['high', 'medium', 'low'];
const ALLOWED_SCOPES = ['general', 'saudi'];
const ALLOWED_KINDS = ['pricing', 'regulation', 'feature', 'market-stat', 'quote', 'case-study'];
const ID_PATTERN = /^ev-[a-z0-9-]+$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const URL_PATTERN = /^https?:\/\/[^\s]+$/i;

const MAX_VERIFIED_AGE_DAYS = 180;

/**
 * Validate a single evidence record. Returns an object with:
 *   { valid: boolean, errors: string[] }
 *
 * The record is rejected if any required field is missing or malformed.
 * Unknown fields are allowed (forward-compatible) but do not contribute to validity.
 */
function validateEvidence(record) {
  const errors = [];

  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return { valid: false, errors: ['record must be a non-null object'] };
  }

  if (typeof record.id !== 'string' || !ID_PATTERN.test(record.id)) {
    errors.push('id must match /^ev-[a-z0-9-]+$/');
  }
  if (typeof record.claim !== 'string' || record.claim.trim().length === 0) {
    errors.push('claim must be a non-empty string');
  }
  if (typeof record.source_url !== 'string' || !URL_PATTERN.test(record.source_url)) {
    errors.push('source_url must be an http(s) URL');
  }
  if (typeof record.verified_date !== 'string' || !ISO_DATE_PATTERN.test(record.verified_date)) {
    errors.push('verified_date must be an ISO date YYYY-MM-DD');
  }
  if (!ALLOWED_CONFIDENCE.includes(record.confidence)) {
    errors.push(`confidence must be one of ${ALLOWED_CONFIDENCE.join(', ')}`);
  }
  if (!ALLOWED_SCOPES.includes(record.scope)) {
    errors.push(`scope must be one of ${ALLOWED_SCOPES.join(', ')}`);
  }
  if (!ALLOWED_KINDS.includes(record.kind)) {
    errors.push(`kind must be one of ${ALLOWED_KINDS.join(', ')}`);
  }
  if (typeof record.subject !== 'string' || record.subject.trim().length === 0) {
    errors.push('subject must be a non-empty string');
  }
  if (typeof record.high_stakes !== 'boolean') {
    errors.push('high_stakes must be a boolean');
  }
  if (record.dimensions !== undefined) {
    if (!Array.isArray(record.dimensions) || record.dimensions.some(d => typeof d !== 'string')) {
      errors.push('dimensions, when present, must be an array of strings');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a full evidence bank (array of records). Returns:
 *   { valid: boolean, invalid: Array<{ index, errors, record }>, validCount: number }
 */
function validateBank(records) {
  if (!Array.isArray(records)) {
    return { valid: false, invalid: [], validCount: 0, error: 'records must be an array' };
  }

  const invalid = [];
  records.forEach((record, index) => {
    const result = validateEvidence(record);
    if (!result.valid) invalid.push({ index, errors: result.errors, record });
  });

  return {
    valid: invalid.length === 0,
    invalid,
    validCount: records.length - invalid.length
  };
}

/**
 * Filter the bank by scope. Returns a new array; does not mutate.
 */
function filterByScope(records, scope) {
  if (!ALLOWED_SCOPES.includes(scope)) {
    throw new Error(`scope must be one of ${ALLOWED_SCOPES.join(', ')}`);
  }
  return records.filter(r => r.scope === scope);
}

/**
 * Filter the bank by kind (or array of kinds).
 */
function filterByKind(records, kinds) {
  const wanted = Array.isArray(kinds) ? kinds : [kinds];
  return records.filter(r => wanted.includes(r.kind));
}

/**
 * Select evidence for a section by ID list. Returns records in the order
 * the IDs were requested; missing IDs are silently skipped (the caller
 * should detect this via record count vs requested count).
 */
function selectByIds(records, ids) {
  const byId = new Map(records.map(r => [r.id, r]));
  return ids.map(id => byId.get(id)).filter(Boolean);
}

/**
 * Returns true if the record's verified_date is older than maxAgeDays.
 * Used by the fact-checker subagent to flag stale citations.
 */
function isStale(record, maxAgeDays = MAX_VERIFIED_AGE_DAYS, today = new Date()) {
  if (!record || typeof record.verified_date !== 'string') return true;
  const verified = new Date(record.verified_date);
  if (Number.isNaN(verified.getTime())) return true;
  const ageMs = today.getTime() - verified.getTime();
  return ageMs > maxAgeDays * 24 * 60 * 60 * 1000;
}

/**
 * Returns all high_stakes records. These are the ones Round 9 (fact verification)
 * must re-check before the bank is passed downstream.
 */
function highStakes(records) {
  return records.filter(r => r.high_stakes === true);
}

module.exports = {
  // constants
  ALLOWED_CONFIDENCE,
  ALLOWED_SCOPES,
  ALLOWED_KINDS,
  ID_PATTERN,
  ISO_DATE_PATTERN,
  URL_PATTERN,
  MAX_VERIFIED_AGE_DAYS,
  // validators
  validateEvidence,
  validateBank,
  // selectors
  filterByScope,
  filterByKind,
  selectByIds,
  // predicates
  isStale,
  highStakes,
};
