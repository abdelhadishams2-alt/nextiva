/**
 * Next.js Adapter — Delegates to next-adapter.js (the full implementation).
 *
 * This file exists for backward compatibility with code that imports
 * from 'adapters/next' instead of 'adapters/next-adapter'.
 */

const nextAdapter = require('./next-adapter');

module.exports = nextAdapter;
