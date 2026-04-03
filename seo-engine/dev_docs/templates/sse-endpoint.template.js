/**
 * @module {{MODULE_NAME}} SSE
 * @description Server-Sent Events endpoint for {{SSE_DESCRIPTION}}
 * @see dev_docs/specs/contracts/screen-api-contract-registry.md
 *
 * Copy this template when adding a new SSE streaming endpoint.
 * ChainIQ uses SSE for: crawl progress, pipeline progress, analysis progress, edit progress.
 */

'use strict';

// ── SSE Endpoint: GET {{PATH}} ──────────────────────────────────────────────

/**
 * Streams real-time progress events to the client.
 *
 * Event format:
 *   data: {"stage":"{{stage}}","progress":0.5,"message":"Processing..."}
 *
 * Terminal events:
 *   data: {"stage":"complete","progress":1.0,"result":{...}}
 *   data: {"stage":"error","message":"What went wrong"}
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {Object} user - Authenticated user
 * @param {string} jobId - Job/session ID to track
 */
async function handle{{HandlerName}}SSE(req, res, user, jobId) {
  const logger = createLogger('{{module-name}}-sse');

  // ── Validate job exists and belongs to user ─────────────────────────────
  // const { data: job, error } = await supabase.from('{{jobs_table}}')
  //   .select('*')
  //   .eq('id', jobId)
  //   .eq('user_id', user.id)
  //   .single();
  //
  // if (error || !job) {
  //   res.writeHead(404, { 'Content-Type': 'application/json' });
  //   return res.end(JSON.stringify({ error: 'Not Found', message: 'Job not found' }));
  // }

  // ── Set SSE headers ─────────────────────────────────────────────────────
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no',  // Disable Nginx buffering
  });

  // ── Send initial event ──────────────────────────────────────────────────
  sendSSE(res, { stage: 'connected', progress: 0, message: 'Connected to progress stream' });

  // ── Polling loop (check job status every N ms) ──────────────────────────
  const POLL_INTERVAL = 2000; // 2 seconds
  const MAX_DURATION = 10 * 60 * 1000; // 10 minutes timeout
  const startTime = Date.now();

  const pollInterval = setInterval(async () => {
    try {
      // Check timeout
      if (Date.now() - startTime > MAX_DURATION) {
        sendSSE(res, { stage: 'error', message: 'Job timed out after 10 minutes' });
        clearInterval(pollInterval);
        return res.end();
      }

      // Poll job status from database
      // const { data: currentJob } = await supabase.from('{{jobs_table}}')
      //   .select('status, progress, result, error_message')
      //   .eq('id', jobId)
      //   .single();

      // Example: send progress update
      // sendSSE(res, {
      //   stage: currentJob.status,
      //   progress: currentJob.progress || 0,
      //   message: `Processing step ${currentJob.status}...`,
      // });

      // Check for completion
      // if (currentJob.status === 'completed') {
      //   sendSSE(res, { stage: 'complete', progress: 1.0, result: currentJob.result });
      //   clearInterval(pollInterval);
      //   return res.end();
      // }

      // Check for failure
      // if (currentJob.status === 'failed') {
      //   sendSSE(res, { stage: 'error', message: currentJob.error_message });
      //   clearInterval(pollInterval);
      //   return res.end();
      // }

    } catch (err) {
      logger.error('SSE poll error', { error: err.message, jobId });
      sendSSE(res, { stage: 'error', message: 'Internal error during progress tracking' });
      clearInterval(pollInterval);
      res.end();
    }
  }, POLL_INTERVAL);

  // ── Client disconnect cleanup ───────────────────────────────────────────
  req.on('close', () => {
    clearInterval(pollInterval);
    logger.info('SSE client disconnected', { jobId, user_id: user.id });
  });
}

// ── SSE helper ──────────────────────────────────────────────────────────────

function sendSSE(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// ── Router integration ─────────────────────────────────────────────────────
// Add this to the request handler chain in server.js:
//
//   const sseMatch = urlPath.match(/^\/api\/{{resource}}\/([0-9a-f-]+)\/progress$/i);
//   if (req.method === 'GET' && sseMatch) {
//     const user = await verifyAuth(req);
//     if (!user) return sendUnauthorized(res);
//     return handle{{HandlerName}}SSE(req, res, user, sseMatch[1]);
//   }
