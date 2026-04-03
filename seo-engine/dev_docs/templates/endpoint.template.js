/**
 * @module {{MODULE_NAME}}
 * @description Bridge server endpoint handler for {{ENDPOINT_DESCRIPTION}}
 * @see dev_docs/specs/contracts/screen-api-contract-registry.md
 *
 * Copy this template when adding a new endpoint to bridge/server.js.
 * Follow the existing pattern: URL match → auth check → parse body → business logic → response.
 */

'use strict';

// ── Imports ──────────────────────────────────────────────────────────────────
// These are already available in server.js scope — do not re-import.
// const { verifyAuth } = require('./auth');          // from server.js closure
// const supabase = require('./supabase-client');      // from server.js closure
// const { createLogger } = require('./logger');       // from server.js closure

// ── Endpoint: {{METHOD}} {{PATH}} ───────────────────────────────────────────

/**
 * {{ENDPOINT_DESCRIPTION}}
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {Object} user - Authenticated user from verifyAuth()
 * @param {string} user.id - Supabase user UUID
 * @param {boolean} user.is_admin - Admin flag
 */
async function handle{{HandlerName}}(req, res, user) {
  const logger = createLogger('{{module-name}}');

  try {
    // ── Parse request ──────────────────────────────────────────────────────
    // For POST/PUT/PATCH: parse JSON body
    // const body = await parseBody(req);

    // For GET with query params:
    // const url = new URL(req.url, `http://${req.headers.host}`);
    // const page = parseInt(url.searchParams.get('page') || '1', 10);
    // const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);

    // For URL params (e.g., /api/resource/:id):
    // const id = urlSegments[3]; // already parsed in router

    // ── Authorization ──────────────────────────────────────────────────────
    // For admin-only endpoints:
    // if (!user.is_admin) {
    //   res.writeHead(403, { 'Content-Type': 'application/json' });
    //   return res.end(JSON.stringify({ error: 'Forbidden', message: 'Admin access required' }));
    // }

    // ── Business logic ─────────────────────────────────────────────────────
    const { data, error } = await supabase.from('{{table_name}}')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Database query failed', { error: error.message, user_id: user.id });
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Internal Server Error', message: 'Database query failed' }));
    }

    // ── Success response ───────────────────────────────────────────────────
    logger.info('{{HandlerName}} completed', { user_id: user.id, count: data.length });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data }));

  } catch (err) {
    logger.error('Unhandled error in {{HandlerName}}', { error: err.message, stack: err.stack });
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal Server Error', message: 'Unexpected error' }));
  }
}

// ── Router integration ─────────────────────────────────────────────────────
// Add this block to the request handler chain in server.js:
//
//   if (req.method === '{{METHOD}}' && urlPath === '{{PATH}}') {
//     const user = await verifyAuth(req);
//     if (!user) return sendUnauthorized(res);
//     return handle{{HandlerName}}(req, res, user);
//   }
