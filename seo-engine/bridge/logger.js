/**
 * Structured JSON logger for ChainIQ bridge server.
 * Zero dependencies — uses only Node.js built-ins.
 *
 * Log levels: debug < info < warn < error
 * Output: JSON lines to stdout (info+) and stderr (warn+)
 */

const crypto = require('crypto');

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const LOG_LEVEL = LEVELS[process.env.LOG_LEVEL || 'info'] ?? LEVELS.info;

/**
 * Generate a short request ID (8 hex chars)
 */
function requestId() {
  return crypto.randomBytes(4).toString('hex');
}

/**
 * Core log function — outputs a single JSON line
 */
function log(level, message, data = {}) {
  const numLevel = LEVELS[level] ?? LEVELS.info;
  if (numLevel < LOG_LEVEL) return;

  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...data
  };

  const line = JSON.stringify(entry);

  if (numLevel >= LEVELS.warn) {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

/**
 * Log an HTTP request (call at start of request handling)
 */
function logRequest(req, reqId) {
  log('info', 'request', {
    reqId,
    method: req.method,
    url: req.url,
    ip: req.socket.remoteAddress
  });
}

/**
 * Log an HTTP response (call when sending response)
 */
function logResponse(reqId, statusCode, durationMs) {
  log('info', 'response', {
    reqId,
    status: statusCode,
    ms: durationMs
  });
}

/**
 * Log a security event (failed auth, path traversal, rate limit, etc.)
 */
function logSecurity(event, details = {}) {
  log('warn', 'security', {
    event,
    ...details
  });
}

/**
 * Log an admin action (approve, revoke, delete user, etc.)
 */
function logAdmin(action, details = {}) {
  log('info', 'admin', {
    action,
    ...details
  });
}

module.exports = {
  debug: (msg, data) => log('debug', msg, data),
  info: (msg, data) => log('info', msg, data),
  warn: (msg, data) => log('warn', msg, data),
  error: (msg, data) => log('error', msg, data),
  requestId,
  logRequest,
  logResponse,
  logSecurity,
  logAdmin
};
