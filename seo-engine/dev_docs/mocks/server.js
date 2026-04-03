/**
 * ChainIQ Mock API Server
 *
 * Serves realistic mock responses for all 135 API endpoints from the
 * screen-api-contract-registry. Zero dependencies — pure Node.js.
 *
 * Usage:
 *   node dev_docs/mocks/server.js
 *   # Starts on http://localhost:19848
 *
 * Configuration:
 *   MOCK_PORT=19848        Port (default: 19848, one above bridge)
 *   MOCK_LATENCY=100       Simulated latency in ms (default: 100)
 *   MOCK_ERROR_RATE=0      Error rate 0.0–1.0 (default: 0, set 0.1 for 10% errors)
 *   MOCK_AUTH=false         Require Bearer token (default: false)
 */

'use strict';

const http = require('node:http');
const { URL } = require('node:url');

// ── Config ──────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.MOCK_PORT || '19848', 10);
const LATENCY = parseInt(process.env.MOCK_LATENCY || '100', 10);
const ERROR_RATE = parseFloat(process.env.MOCK_ERROR_RATE || '0');
const REQUIRE_AUTH = process.env.MOCK_AUTH === 'true';

// ── Fixtures ────────────────────────────────────────────────────────────────

const fixtures = require('./fixtures/shared.fixtures.js');
const authHandlers = require('./handlers/auth-bridge.handlers.js');
const dashboardHandlers = require('./handlers/dashboard-api.handlers.js');
const ingestionHandlers = require('./handlers/data-ingestion.handlers.js');
const intelligenceHandlers = require('./handlers/content-intelligence.handlers.js');
const voiceHandlers = require('./handlers/voice-intelligence.handlers.js');
const qualityHandlers = require('./handlers/quality-gate.handlers.js');
const publishHandlers = require('./handlers/publishing.handlers.js');
const feedbackHandlers = require('./handlers/feedback-loop.handlers.js');

// ── Helpers ─────────────────────────────────────────────────────────────────

function jsonResponse(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  });
  res.end(JSON.stringify(data));
}

function paginate(items, page = 1, limit = 20) {
  const start = (page - 1) * limit;
  return {
    data: items.slice(start, start + limit),
    meta: { total: items.length, page, limit, totalPages: Math.ceil(items.length / limit) }
  };
}

async function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Router ──────────────────────────────────────────────────────────────────

const allHandlers = [
  ...authHandlers,
  ...dashboardHandlers,
  ...ingestionHandlers,
  ...intelligenceHandlers,
  ...voiceHandlers,
  ...qualityHandlers,
  ...publishHandlers,
  ...feedbackHandlers,
];

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return jsonResponse(res, 204, '');
  }

  // Simulated latency
  if (LATENCY > 0) await delay(LATENCY);

  // Random error injection
  if (ERROR_RATE > 0 && Math.random() < ERROR_RATE) {
    return jsonResponse(res, 500, { error: 'Simulated Error', message: 'Mock error injection triggered' });
  }

  // Auth check (optional)
  if (REQUIRE_AUTH && !req.url.startsWith('/health') && !req.url.startsWith('/auth/')) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return jsonResponse(res, 401, { error: 'Unauthorized', message: 'Missing Bearer token' });
    }
  }

  // Parse URL
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method;
  const query = Object.fromEntries(url.searchParams);

  // Match handler
  for (const handler of allHandlers) {
    const match = path.match(handler.pattern);
    if (match && handler.method === method) {
      const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await parseBody(req) : null;
      const params = match.groups || {};
      const result = handler.handle({ params, query, body, fixtures });

      if (result.sse) {
        // SSE response
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        });
        for (const event of result.events) {
          await delay(500);
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        }
        return res.end();
      }

      return jsonResponse(res, result.status || 200, result.body);
    }
  }

  // 404
  jsonResponse(res, 404, { error: 'Not Found', message: `No mock handler for ${method} ${path}` });
});

server.listen(PORT, () => {
  console.log(`\n  ChainIQ Mock API Server`);
  console.log(`  ──────────────────────`);
  console.log(`  URL:        http://localhost:${PORT}`);
  console.log(`  Latency:    ${LATENCY}ms`);
  console.log(`  Error rate: ${(ERROR_RATE * 100).toFixed(0)}%`);
  console.log(`  Auth:       ${REQUIRE_AUTH ? 'required' : 'disabled'}`);
  console.log(`  Endpoints:  ${allHandlers.length}`);
  console.log(`\n  Ready for dashboard development.\n`);
});
