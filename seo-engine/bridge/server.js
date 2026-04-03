/**
 * Article Engine Bridge Server
 *
 * Lightweight local HTTP server that receives section edit requests
 * from the article's browser-based edit UI and routes them to Claude CLI
 * for automatic processing. Includes Supabase auth for edit gating.
 *
 * Usage:
 *   node server.js <project-directory>
 *
 * The server listens on http://127.0.0.1:19847
 */

const http = require('http');
const crypto = require('crypto');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const supabase = require('./supabase-client');
const logger = require('./logger');
const promptGuard = require('./prompt-guard');
const { JobQueue } = require('./job-queue');
const { WebhookManager } = require('./webhooks');
const blueprintParser = require('../engine/blueprint-parser');
const { KeyManager } = require('./key-manager');
const oauth = require('./oauth');
const gsc = require('./ingestion/gsc');
const ga4 = require('./ingestion/ga4');
const crawler = require('./ingestion/crawler');
const semrush = require('./ingestion/semrush');
const ahrefs = require('./ingestion/ahrefs');
const { Scheduler } = require('./ingestion/scheduler');
const qualityGate = require('../engine/quality-gate');
const { generateSuggestions } = require('../engine/quality-suggestions');
const { computeSevenSignals, computeOverallScore, generateRevisionInstructions } = require('../engine/seven-signals');
const decayDetector = require('./intelligence/decay-detector');
const gapAnalyzer = require('./intelligence/gap-analyzer');
const cannibalization = require('./intelligence/cannibalization');
const topicRecommender = require('./intelligence/topic-recommender');
const voiceAnalyzer = require('./intelligence/voice-analyzer');
const recalibration = require('./intelligence/recalibration');
const performanceTracker = require('./intelligence/performance-tracker');
const payloadAssembler = require('./publishing/payload');
const imagePipeline = require('./publishing/image-pipeline');
const wordpressPublisher = require('./publishing/wordpress');
const shopifyPublisher = require('./publishing/shopify');
const ghostPublisher = require('./publishing/ghost');
const contentfulPublisher = require('./publishing/contentful');
const strapiPublisher = require('./publishing/strapi');
const webflowPublisher = require('./publishing/webflow');
const webhookPublisher = require('./publishing/webhook');

// Strip CLAUDECODE env var immediately on startup.
// When the bridge is started from within a Claude Code session, this var is inherited.
// If not removed, any spawned `claude` child process will refuse to start with
// "cannot be launched inside another Claude Code session".
delete process.env.CLAUDECODE;

const PORT = parseInt(process.env.BRIDGE_PORT || '19847', 10);
const PROJECT_DIR = path.resolve(process.argv[2] || process.cwd());
const TIMEOUT_MS = 600000; // 10 minutes max per edit

// activeEdit mutex removed — the job queue serializes edit jobs

// Job queue and webhook manager instances
const jobQueue = new JobQueue({ supabase, projectDir: PROJECT_DIR });
const webhookManager = new WebhookManager();
const keyManager = new KeyManager({ supabase });
const scheduler = new Scheduler({
  connectors: { gsc, ga4, crawler, semrush, ahrefs }
});

const pidFile = path.join(PROJECT_DIR, '.claude-bridge-pid');
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Concurrent generation tracking: userId → active generation count
const _activeGenerations = new Map();
const MAX_CONCURRENT_GENERATIONS_PER_USER = 2;

// Helper: read JSON body from request (64KB max)
const MAX_BODY = 64 * 1024;
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY) { req.destroy(); reject(new Error('Request body too large (max 64KB)')); return; }
      body += chunk;
    });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(new Error('Invalid JSON: ' + e.message)); }
    });
    req.on('error', reject);
  });
}

// Helper: send JSON response
function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Helper: extract Bearer token from Authorization header
function getToken(req) {
  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  // Fallback: check query param (needed for EventSource which can't set headers)
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const tokenParam = url.searchParams.get('token');
  if (tokenParam) return tokenParam;
  return null;
}

// Helper: verify token and check active subscription (with 30s TTL cache)
async function requireAuth(req, res) {
  const token = getToken(req);
  if (!token) {
    logger.logSecurity('auth_missing_token', { ip: req.socket.remoteAddress, url: req.url });
    json(res, 401, { status: 'error', error: 'Authentication required. Please log in.' });
    return null;
  }

  // Check cache first
  const cached = getCachedAuth(token);
  if (cached) {
    if (!cached.subscription || cached.subscription.status !== 'active') {
      logger.logSecurity('auth_inactive_subscription', { userId: cached.user.id, status: cached.subscription?.status });
      json(res, 403, { status: 'error', error: 'Your account is pending approval. Contact the admin for access.' });
      return null;
    }
    return { user: cached.user, token, subscription: cached.subscription };
  }

  const user = await supabase.verifyToken(token);
  if (!user || !user.id) {
    logger.logSecurity('auth_invalid_token', { ip: req.socket.remoteAddress, url: req.url });
    json(res, 401, { status: 'error', error: 'Invalid or expired token. Please log in again.' });
    return null;
  }

  const sub = await supabase.getSubscription(token, user.id);
  setCachedAuth(token, user, sub);

  if (!sub || sub.status !== 'active') {
    logger.logSecurity('auth_inactive_subscription', { userId: user.id, status: sub?.status });
    json(res, 403, { status: 'error', error: 'Your account is pending approval. Contact the admin for access.' });
    return null;
  }

  return { user, token, subscription: sub };
}

// Helper: verify token and require admin role (uses service_role key for privilege check)
async function requireAdmin(req, res) {
  const token = getToken(req);
  if (!token) {
    logger.logSecurity('admin_missing_token', { ip: req.socket.remoteAddress, url: req.url });
    json(res, 401, { status: 'error', error: 'Authentication required.' });
    return null;
  }

  const user = await supabase.verifyToken(token);
  if (!user || !user.id) {
    logger.logSecurity('admin_invalid_token', { ip: req.socket.remoteAddress, url: req.url });
    json(res, 401, { status: 'error', error: 'Invalid or expired token.' });
    return null;
  }

  // Use service_role key to check admin status (never trust user's own token for privilege check)
  const sub = await supabase.adminGetSubscription(user.id);
  if (!sub || sub.role !== 'admin' || sub.status !== 'active') {
    logger.logSecurity('admin_access_denied', { userId: user.id, role: sub?.role, status: sub?.status });
    json(res, 403, { status: 'error', error: 'Admin access required.' });
    return null;
  }

  return { user, token, subscription: sub };
}

// Rate limiter: configurable max attempts per minute per key
const rateLimitMap = new Map();
function checkRateLimit(key, maxAttempts = 10) {
  const now = Date.now();
  if (rateLimitMap.size > 100) {
    for (const [k, v] of rateLimitMap) {
      if (now > v.resetAt) rateLimitMap.delete(k);
    }
  }
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60000 });
    return true;
  }
  entry.count++;
  if (entry.count > maxAttempts) return false;
  return true;
}

// Auth verification cache: SHA-256 hashed token → { user, subscription, expiresAt }
const AUTH_CACHE_TTL = 30000; // 30 seconds
const authCache = new Map();

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getCachedAuth(token) {
  const hash = hashToken(token);
  const entry = authCache.get(hash);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    authCache.delete(hash);
    return null;
  }
  return entry;
}

function setCachedAuth(token, user, subscription) {
  const hash = hashToken(token);
  authCache.set(hash, { user, subscription, expiresAt: Date.now() + AUTH_CACHE_TTL });
  // Evict expired entries when cache grows
  if (authCache.size > 200) {
    const now = Date.now();
    for (const [k, v] of authCache) {
      if (now > v.expiresAt) authCache.delete(k);
    }
  }
}

// Max subprocess output size (4MB)
const MAX_SUBPROCESS_OUTPUT = 4 * 1024 * 1024;

// User settings store (in-memory, per user ID)
const userSettings = new Map();

function defaultSettings() {
  return {
    language: 'en',
    framework: 'html',
    imagesPerArticle: 4,
    bridgePort: 19847,
    researchRounds: 6,
    editTimeout: 600,
    theme: 'dark',
    defaultDomain: ''
  };
}

function sanitizeSettings(input) {
  const safe = {};
  if (input.language && typeof input.language === 'string') safe.language = input.language.slice(0, 10);
  if (input.framework && typeof input.framework === 'string') safe.framework = input.framework.slice(0, 20);
  if (typeof input.imagesPerArticle === 'number') safe.imagesPerArticle = Math.min(Math.max(input.imagesPerArticle, 1), 10);
  if (typeof input.bridgePort === 'number') safe.bridgePort = Math.min(Math.max(input.bridgePort, 1024), 65535);
  if (typeof input.researchRounds === 'number') safe.researchRounds = Math.min(Math.max(input.researchRounds, 1), 10);
  if (typeof input.editTimeout === 'number') safe.editTimeout = Math.min(Math.max(input.editTimeout, 60), 1800);
  if (input.theme === 'dark' || input.theme === 'light') safe.theme = input.theme;
  if (typeof input.defaultDomain === 'string') safe.defaultDomain = input.defaultDomain.slice(0, 100);
  return safe;
}

const server = http.createServer(async (req, res) => {
  const reqId = logger.requestId();
  const reqStart = Date.now();

  // Patch json() to also log responses
  const _json = json;
  const jsonLog = (r, status, data) => {
    _json(r, status, data);
    logger.logResponse(reqId, status, Date.now() - reqStart);
  };

  try {
  // CORS — articles open as file:// URLs, Origin will be null
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  logger.logRequest(req, reqId);

  // Health check — no internal paths or config details
  if (req.method === 'GET' && req.url === '/health') {
    json(res, 200, {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      scheduler: scheduler.getStatus()
    });
    return;
  }

  // ── AUTH ENDPOINTS ──────────────────────────────────────────

  // Sign up
  if (req.method === 'POST' && req.url === '/auth/signup') {
    try {
      const { email, password } = await readBody(req);
      if (!checkRateLimit('signup:' + (email || req.socket.remoteAddress))) {
        logger.logSecurity('rate_limit_signup', { ip: req.socket.remoteAddress, email });
        json(res, 429, { status: 'error', error: 'Too many attempts. Please wait a minute.' });
        return;
      }
      if (!email || !password) {
        json(res, 400, { status: 'error', error: 'Email and password are required.' });
        return;
      }
      if (password.length < 6) {
        json(res, 400, { status: 'error', error: 'Password must be at least 6 characters.' });
        return;
      }
      const data = await supabase.signUp(email, password);
      json(res, 200, {
        status: 'success',
        message: 'Account created! Your access is pending admin approval.',
        user: { id: data.user?.id, email: data.user?.email }
      });
    } catch (e) {
      json(res, 400, { status: 'error', error: e.message });
    }
    return;
  }

  // Login
  if (req.method === 'POST' && req.url === '/auth/login') {
    try {
      const { email, password } = await readBody(req);
      if (!checkRateLimit('login:' + (email || req.socket.remoteAddress))) {
        logger.logSecurity('rate_limit_login', { ip: req.socket.remoteAddress, email });
        json(res, 429, { status: 'error', error: 'Too many attempts. Please wait a minute.' });
        return;
      }
      if (!email || !password) {
        json(res, 400, { status: 'error', error: 'Email and password are required.' });
        return;
      }
      const data = await supabase.signIn(email, password);

      // Check subscription status
      const sub = await supabase.getSubscription(data.access_token, data.user.id);

      // Write auth session file for SKILL.md quota bypass
      // NOTE: Only persist status flags — never write access_token to disk (P0 security)
      if (sub && sub.status === 'active') {
        const sessionPath = path.join(__dirname, '..', 'config', '.auth-session.json');
        try {
          await fs.promises.writeFile(sessionPath, JSON.stringify({
            user_email: data.user.email,
            subscription_status: sub.status,
            last_verified: new Date().toISOString()
          }, null, 2));
        } catch (e) {
          console.error('[bridge] Failed to write auth session file:', e.message);
        }
      }

      json(res, 200, {
        status: 'success',
        access_token: data.access_token,
        user: { id: data.user.id, email: data.user.email },
        subscription: sub ? { plan: sub.plan, status: sub.status, role: sub.role || 'user' } : { plan: 'free', status: 'pending', role: 'user' }
      });
    } catch (e) {
      json(res, 401, { status: 'error', error: e.message });
    }
    return;
  }

  // Verify token
  if (req.method === 'GET' && req.url === '/auth/verify') {
    if (!checkRateLimit('verify:' + req.socket.remoteAddress)) {
      json(res, 429, { status: 'error', error: 'Too many attempts. Please wait a minute.' });
      return;
    }
    const token = getToken(req);
    if (!token) {
      json(res, 401, { status: 'error', error: 'No token provided.' });
      return;
    }

    // Check auth cache first
    const cached = getCachedAuth(token);
    if (cached) {
      json(res, 200, {
        status: 'ok',
        user: { id: cached.user.id, email: cached.user.email },
        subscription: cached.subscription ? { plan: cached.subscription.plan, status: cached.subscription.status, role: cached.subscription.role || 'user' } : { plan: 'free', status: 'pending', role: 'user' }
      });
      return;
    }

    const user = await supabase.verifyToken(token);
    if (!user || !user.id) {
      json(res, 401, { status: 'error', error: 'Invalid or expired token.' });
      return;
    }
    const sub = await supabase.getSubscription(token, user.id);
    setCachedAuth(token, user, sub);
    json(res, 200, {
      status: 'ok',
      user: { id: user.id, email: user.email },
      subscription: sub ? { plan: sub.plan, status: sub.status, role: sub.role || 'user' } : { plan: 'free', status: 'pending', role: 'user' }
    });
    return;
  }

  // ── ADMIN ENDPOINTS (admin role required) ──────────────────

  // List all users + subscriptions
  if (req.method === 'GET' && req.url === '/admin/users') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    try {
      const data = await supabase.adminListUsers();
      json(res, 200, { status: 'ok', users: data.users, subscriptions: data.subscriptions });
    } catch (e) {
      json(res, 500, { status: 'error', error: e.message });
    }
    return;
  }

  // Approve a user (set status to active)
  if (req.method === 'POST' && req.url === '/admin/approve') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    try {
      const { user_id } = await readBody(req);
      if (!user_id || !UUID_RE.test(user_id)) { json(res, 400, { status: 'error', error: 'Valid user_id required' }); return; }
      await supabase.adminUpdateSubscription(user_id, { status: 'active' });
      logger.logAdmin('approve_user', { adminId: admin.user.id, targetUserId: user_id });
      json(res, 200, { status: 'success', message: 'User approved.' });
    } catch (e) {
      json(res, 500, { status: 'error', error: e.message });
    }
    return;
  }

  // Revoke a user (set status to pending)
  if (req.method === 'POST' && req.url === '/admin/revoke') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    try {
      const { user_id } = await readBody(req);
      if (!user_id || !UUID_RE.test(user_id)) { json(res, 400, { status: 'error', error: 'Valid user_id required' }); return; }
      await supabase.adminUpdateSubscription(user_id, { status: 'pending' });
      logger.logAdmin('revoke_user', { adminId: admin.user.id, targetUserId: user_id });
      json(res, 200, { status: 'success', message: 'User access revoked.' });
    } catch (e) {
      json(res, 500, { status: 'error', error: e.message });
    }
    return;
  }

  // Delete a user
  if (req.method === 'POST' && req.url === '/admin/delete') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    try {
      const { user_id } = await readBody(req);
      if (!user_id || !UUID_RE.test(user_id)) { json(res, 400, { status: 'error', error: 'Valid user_id required' }); return; }
      await supabase.adminDeleteUser(user_id);
      logger.logAdmin('delete_user', { adminId: admin.user.id, targetUserId: user_id });
      json(res, 200, { status: 'success', message: 'User deleted.' });
    } catch (e) {
      json(res, 500, { status: 'error', error: e.message });
    }
    return;
  }

  // Add a new user (admin-created, auto-activated)
  if (req.method === 'POST' && req.url === '/admin/add-user') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    try {
      const { email, password } = await readBody(req);
      if (!email || !password) { json(res, 400, { status: 'error', error: 'Email and password required.' }); return; }
      if (password.length < 6) { json(res, 400, { status: 'error', error: 'Password must be at least 6 characters.' }); return; }
      const result = await supabase.adminCreateUser(email, password);
      logger.logAdmin('create_user', { adminId: admin.user.id, newUserId: result.id, email });
      json(res, 200, { status: 'success', message: 'User created and activated.', user: result });
    } catch (e) {
      json(res, 400, { status: 'error', error: e.message });
    }
    return;
  }

  // Get usage logs
  if (req.method === 'GET' && req.url === '/admin/usage') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    try {
      const logs = await supabase.adminGetUsageLogs();
      json(res, 200, { status: 'ok', logs: logs });
    } catch (e) {
      json(res, 500, { status: 'error', error: e.message });
    }
    return;
  }

  // ── DASHBOARD API ENDPOINTS ──────────────────────────────────

  // Helper: parse URL path segments (e.g., /api/articles/uuid → ['api','articles','uuid'])
  const urlPath = req.url.split('?')[0];
  const segments = urlPath.split('/').filter(Boolean);  // e.g., ['api','admin','plans','uuid']
  const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';
  const queryParams = {};
  if (queryString) {
    for (const pair of queryString.split('&')) {
      const [k, v] = pair.split('=');
      queryParams[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
  }

  // GET /api/articles — list articles (paginated, filterable)
  if (req.method === 'GET' && urlPath === '/api/articles') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    try {
      const result = await supabase.listArticles(auth.token, queryParams);
      json(res, 200, { success: true, data: result.data, meta: { total: result.total, page: result.page, limit: result.limit } });
    } catch (e) {
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/articles/:id/versions — article version history
  const versionsMatch = urlPath.match(/^\/api\/articles\/([0-9a-f-]+)\/versions$/i);
  if (req.method === 'GET' && versionsMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const articleId = versionsMatch[1];
    if (!UUID_RE.test(articleId)) { json(res, 400, { success: false, error: 'Invalid article ID' }); return; }
    try {
      const versions = await supabase.getArticleVersions(auth.token, articleId);
      json(res, 200, { success: true, data: versions });
    } catch (e) {
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // POST /api/articles/:id/rollback — rollback to a specific version
  const rollbackMatch = urlPath.match(/^\/api\/articles\/([0-9a-f-]+)\/rollback$/i);
  if (req.method === 'POST' && rollbackMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const articleId = rollbackMatch[1];
    if (!UUID_RE.test(articleId)) { json(res, 400, { success: false, error: 'Invalid article ID' }); return; }
    if (!checkRateLimit(`rollback_${auth.user.id}`, 5)) {
      json(res, 429, { success: false, error: 'Too many rollback attempts. Please wait a minute.' });
      return;
    }
    try {
      const body = await readBody(req);
      const versionId = body.version_id;
      if (!versionId || !UUID_RE.test(versionId)) {
        json(res, 400, { success: false, error: 'Valid version_id is required' });
        return;
      }
      logger.info('article_rollback_started', { articleId, versionId, userId: auth.user.id });

      // Fetch the target version
      const versions = await supabase.getArticleVersions(auth.token, articleId);
      const targetVersion = versions.find(v => v.id === versionId);
      if (!targetVersion) {
        json(res, 404, { success: false, error: 'Version not found' });
        return;
      }
      if (!targetVersion.content_snapshot) {
        json(res, 400, { success: false, error: 'Version has no content snapshot to restore' });
        return;
      }

      // Update the article's content with the version's snapshot
      const updated = await supabase.updateArticleContent(auth.token, articleId, targetVersion.content_snapshot);
      if (!updated) {
        json(res, 404, { success: false, error: 'Article not found' });
        return;
      }

      // Create a new version record marking it as a rollback
      const newVersionNumber = versions.length > 0 ? Math.max(...versions.map(v => v.version_number)) + 1 : 1;
      await supabase.createArticleVersion(auth.token, {
        article_id: articleId,
        version_number: newVersionNumber,
        user_id: auth.user.id,
        section_edited: `rollback_to_v${targetVersion.version_number}`,
        content_snapshot: targetVersion.content_snapshot,
        word_count_delta: 0
      });

      logger.info('article_rollback_completed', { articleId, versionId, newVersion: newVersionNumber, userId: auth.user.id });
      json(res, 200, { success: true, data: { article: updated, rolled_back_to_version: targetVersion.version_number, new_version_number: newVersionNumber } });
    } catch (e) {
      logger.error('article_rollback_failed', { articleId, error: e.message, userId: auth.user.id });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/articles/:id — get single article
  const articleGetMatch = urlPath.match(/^\/api\/articles\/([0-9a-f-]+)$/i);
  if (req.method === 'GET' && articleGetMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const articleId = articleGetMatch[1];
    if (!UUID_RE.test(articleId)) { json(res, 400, { success: false, error: 'Invalid article ID' }); return; }
    try {
      const article = await supabase.getArticle(auth.token, articleId);
      if (!article) { json(res, 404, { success: false, error: 'Article not found' }); return; }
      json(res, 200, { success: true, data: article });
    } catch (e) {
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // POST /api/articles — create article (queue generation)
  if (req.method === 'POST' && urlPath === '/api/articles') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    try {
      const body = await readBody(req);
      if (!body.title || !body.topic) {
        json(res, 400, { success: false, error: 'title and topic are required' });
        return;
      }
      const article = await supabase.createArticle(auth.token, {
        user_id: auth.user.id,
        title: body.title,
        topic: body.topic,
        language: body.language || 'en',
        framework: body.framework || 'html',
        status: 'draft',
        metadata: body.metadata || {}
      });
      json(res, 201, { success: true, data: article });
    } catch (e) {
      json(res, 400, { success: false, error: e.message });
    }
    return;
  }

  // PUT /api/articles/:id — update article metadata
  const articlePutMatch = urlPath.match(/^\/api\/articles\/([0-9a-f-]+)$/i);
  if (req.method === 'PUT' && articlePutMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const articleId = articlePutMatch[1];
    if (!UUID_RE.test(articleId)) { json(res, 400, { success: false, error: 'Invalid article ID' }); return; }
    try {
      const body = await readBody(req);
      const updated = await supabase.updateArticle(auth.token, articleId, body);
      if (!updated) { json(res, 404, { success: false, error: 'Article not found' }); return; }
      json(res, 200, { success: true, data: updated });
    } catch (e) {
      json(res, 400, { success: false, error: e.message });
    }
    return;
  }

  // DELETE /api/articles/:id — delete article (admin only)
  const articleDeleteMatch = urlPath.match(/^\/api\/articles\/([0-9a-f-]+)$/i);
  if (req.method === 'DELETE' && articleDeleteMatch) {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const articleId = articleDeleteMatch[1];
    if (!UUID_RE.test(articleId)) { json(res, 400, { success: false, error: 'Invalid article ID' }); return; }
    try {
      await supabase.adminDeleteArticle(articleId);
      json(res, 200, { success: true, message: 'Article deleted' });
    } catch (e) {
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/pipeline/status — current pipeline status (queue-aware)
  if (req.method === 'GET' && urlPath === '/api/pipeline/status') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const queueStatus = jobQueue.getStatus();
    json(res, 200, {
      success: true,
      data: {
        status: queueStatus.processing ? (queueStatus.currentJob?.type === 'edit' ? 'editing' : 'running') : 'idle',
        active_since: queueStatus.currentJob ? queueStatus.currentJob.startedAt : null,
        queue: queueStatus
      }
    });
    return;
  }

  // GET /api/pipeline/queue — list pipeline jobs
  if (req.method === 'GET' && urlPath === '/api/pipeline/queue') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    try {
      const result = await supabase.listPipelineJobs(auth.token, { ...queryParams, status: 'queued' });
      json(res, 200, { success: true, data: result.data, meta: { total: result.total, page: result.page, limit: result.limit } });
    } catch (e) {
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/pipeline/history — all pipeline jobs
  if (req.method === 'GET' && urlPath === '/api/pipeline/history') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    try {
      const result = await supabase.listPipelineJobs(auth.token, queryParams);
      json(res, 200, { success: true, data: result.data, meta: { total: result.total, page: result.page, limit: result.limit } });
    } catch (e) {
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/analytics/overview — dashboard overview metrics
  if (req.method === 'GET' && urlPath === '/api/analytics/overview') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    try {
      const overview = await supabase.getAnalyticsOverview(auth.token, auth.user.id);
      json(res, 200, { success: true, data: overview });
    } catch (e) {
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // ── USER SETTINGS API (Supabase-backed) ─────────────────────

  // GET /api/settings — get user settings (persistent)
  if (req.method === 'GET' && urlPath === '/api/settings') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    try {
      const settings = await supabase.getUserSettings(auth.token, auth.user.id);
      json(res, 200, { success: true, data: settings || {} });
    } catch (e) {
      // Fallback to in-memory if table doesn't exist yet
      const settings = userSettings.get(auth.user.id) || defaultSettings();
      json(res, 200, { success: true, data: settings });
    }
    return;
  }

  // PUT /api/settings — save user settings (persistent, plan-limit validated)
  if (req.method === 'PUT' && urlPath === '/api/settings') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    let body;
    try {
      body = await readBody(req);
    } catch (e) {
      json(res, 400, { success: false, error: e.message });
      return;
    }
    try {
      // upsertUserSettings validates against plan limits before saving
      const updated = await supabase.upsertUserSettings(auth.token, auth.user.id, body);
      json(res, 200, { success: true, data: updated });
    } catch (e) {
      // Plan validation errors return 403, other errors fall back to in-memory
      if (e.message && (e.message.includes('not available on your') || e.message.includes('must be between') || e.message.includes('Invalid image_style'))) {
        json(res, 403, { success: false, error: e.message });
        return;
      }
      // Fallback to in-memory if table doesn't exist yet
      try {
        const sanitized = sanitizeSettings(body);
        const current = userSettings.get(auth.user.id) || defaultSettings();
        const updated = { ...current, ...sanitized };
        userSettings.set(auth.user.id, updated);
        json(res, 200, { success: true, data: updated });
      } catch {
        json(res, 400, { success: false, error: e.message });
      }
    }
    return;
  }

  // ── QUOTA API ──────────────────────────────────────────────

  // GET /api/quota — get user's quota status (usage vs. limits)
  if (req.method === 'GET' && urlPath === '/api/quota') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    try {
      const quota = await supabase.getUserQuota(auth.token, auth.user.id);
      if (!quota) {
        json(res, 500, { success: false, error: 'Unable to retrieve quota' });
        return;
      }
      json(res, 200, { success: true, data: quota });
    } catch (e) {
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/quota/check/:action — quick check if action is allowed (rate-limited)
  if (req.method === 'GET' && segments.length === 4 && segments[1] === 'quota' && segments[2] === 'check') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    // Rate limit: max 30 quota checks per minute per user
    if (!checkRateLimit('quota-check:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many quota checks. Please wait a minute.' });
      return;
    }
    const action = segments[3];
    if (!['generate', 'edit'].includes(action)) {
      json(res, 400, { success: false, error: 'Invalid action. Must be "generate" or "edit".' });
      return;
    }
    try {
      const result = await supabase.checkQuota(auth.token, auth.user.id, action);
      json(res, result.allowed ? 200 : 403, { success: result.allowed, ...result });
    } catch (e) {
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // ── ADMIN PLAN & QUOTA MANAGEMENT ─────────────────────────

  // PUT /api/admin/plans/:userId — set user's plan + quotas (admin only)
  if (req.method === 'PUT' && segments.length === 4 && segments[1] === 'admin' && segments[2] === 'plans') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const adminSub = await supabase.adminGetSubscription(auth.user.id);
    if (!adminSub || adminSub.role !== 'admin') {
      json(res, 403, { success: false, error: 'Admin access required' });
      return;
    }
    const targetUserId = segments[3];
    if (!UUID_RE.test(targetUserId)) {
      json(res, 400, { success: false, error: 'Invalid user ID' });
      return;
    }
    try {
      const body = await readBody(req);
      const result = await supabase.adminUpdatePlan(targetUserId, body);
      logger.info('admin_update_plan', { admin: auth.user.id, target: targetUserId, plan: body.plan });
      json(res, 200, { success: true, data: result });
    } catch (e) {
      json(res, 400, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/admin/quota-stats — aggregate quota usage stats (admin only)
  if (req.method === 'GET' && urlPath === '/api/admin/quota-stats') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const adminSub = await supabase.adminGetSubscription(auth.user.id);
    if (!adminSub || adminSub.role !== 'admin') {
      json(res, 403, { success: false, error: 'Admin access required' });
      return;
    }
    try {
      const stats = await supabase.adminGetQuotaStats();
      json(res, 200, { success: true, data: stats });
    } catch (e) {
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // ── API KEY MANAGEMENT (admin only) ────────────────────────

  // GET /api/admin/api-keys — list API keys (metadata only)
  if (req.method === 'GET' && urlPath === '/api/admin/api-keys') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const adminSub = await supabase.adminGetSubscription(auth.user.id);
    if (!adminSub || adminSub.role !== 'admin') {
      json(res, 403, { success: false, error: 'Admin access required' });
      return;
    }
    try {
      const keys = await keyManager.listKeys();
      json(res, 200, { success: true, data: keys });
    } catch (e) {
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // POST /api/admin/api-keys — add a new API key
  if (req.method === 'POST' && urlPath === '/api/admin/api-keys') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const adminSub = await supabase.adminGetSubscription(auth.user.id);
    if (!adminSub || adminSub.role !== 'admin') {
      json(res, 403, { success: false, error: 'Admin access required' });
      return;
    }
    try {
      const body = await readBody(req);
      if (!body.key_name || !body.key_value) {
        json(res, 400, { success: false, error: 'key_name and key_value are required' });
        return;
      }
      const result = await keyManager.addKey(body.key_name, body.key_value, auth.user.id, body.scope || 'global');
      logger.info('api_key_added', { admin: auth.user.id, key_name: body.key_name });
      json(res, 201, { success: true, data: result });
    } catch (e) {
      json(res, 400, { success: false, error: e.message });
    }
    return;
  }

  // PUT /api/admin/api-keys/:id — rotate an API key
  if (req.method === 'PUT' && segments.length === 4 && segments[1] === 'admin' && segments[2] === 'api-keys') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const adminSub = await supabase.adminGetSubscription(auth.user.id);
    if (!adminSub || adminSub.role !== 'admin') {
      json(res, 403, { success: false, error: 'Admin access required' });
      return;
    }
    const keyId = segments[3];
    if (!UUID_RE.test(keyId)) {
      json(res, 400, { success: false, error: 'Invalid key ID' });
      return;
    }
    try {
      const body = await readBody(req);
      if (!body.key_value) {
        json(res, 400, { success: false, error: 'key_value is required for rotation' });
        return;
      }
      const result = await keyManager.rotateKey(keyId, body.key_value, auth.user.id);
      logger.info('api_key_rotated', { admin: auth.user.id, key_id: keyId });
      json(res, 200, { success: true, data: result });
    } catch (e) {
      json(res, 400, { success: false, error: e.message });
    }
    return;
  }

  // DELETE /api/admin/api-keys/:id — revoke an API key
  if (req.method === 'DELETE' && segments.length === 4 && segments[1] === 'admin' && segments[2] === 'api-keys') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const adminSub = await supabase.adminGetSubscription(auth.user.id);
    if (!adminSub || adminSub.role !== 'admin') {
      json(res, 403, { success: false, error: 'Admin access required' });
      return;
    }
    const keyId = segments[3];
    if (!UUID_RE.test(keyId)) {
      json(res, 400, { success: false, error: 'Invalid key ID' });
      return;
    }
    try {
      await keyManager.revokeKey(keyId);
      logger.info('api_key_revoked', { admin: auth.user.id, key_id: keyId });
      json(res, 200, { success: true, message: 'Key revoked' });
    } catch (e) {
      json(res, 400, { success: false, error: e.message });
    }
    return;
  }

  // POST /api/admin/api-keys/:id/test — test an API key's validity
  if (req.method === 'POST' && segments.length === 5 && segments[1] === 'admin' && segments[2] === 'api-keys' && segments[4] === 'test') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const adminSub = await supabase.adminGetSubscription(auth.user.id);
    if (!adminSub || adminSub.role !== 'admin') {
      json(res, 403, { success: false, error: 'Admin access required' });
      return;
    }
    try {
      // Need to get key_name from the key ID first
      const keys = await keyManager.listKeys();
      const key = keys.find(k => k.id === segments[3]);
      if (!key) {
        json(res, 404, { success: false, error: 'Key not found' });
        return;
      }
      const result = await keyManager.testKey(key.key_name);
      json(res, 200, { success: true, data: result });
    } catch (e) {
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // ── BLUEPRINT GALLERY API ────────────────────────────────────

  // GET /api/blueprints — search/list blueprints
  if (req.method === 'GET' && urlPath === '/api/blueprints') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    try {
      const result = await blueprintParser.searchBlueprints({
        query: queryParams.q || '',
        category: queryParams.category || '',
        page: parseInt(queryParams.page || '1'),
        limit: parseInt(queryParams.limit || '12')
      });
      json(res, 200, { success: true, data: result.data, meta: { total: result.total, page: result.page, limit: result.limit } });
    } catch (e) {
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/blueprints/categories — list all categories
  if (req.method === 'GET' && urlPath === '/api/blueprints/categories') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    try {
      const categories = await blueprintParser.getCategories();
      json(res, 200, { success: true, data: categories });
    } catch (e) {
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // ── GENERATE ENDPOINT ──────────────────────────────────────

  // POST /api/generate — validate quota, create article, enqueue generation job
  if (req.method === 'POST' && urlPath === '/api/generate') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    try {
      const body = await readBody(req);

      // --- Input validation ---
      if (!body.topic || typeof body.topic !== 'string' || body.topic.trim().length === 0) {
        json(res, 400, { success: false, error: 'topic is required' });
        return;
      }
      const topic = body.topic.trim().slice(0, 500);
      if (topic.length < 3) {
        json(res, 400, { success: false, error: 'topic must be at least 3 characters' });
        return;
      }

      const VALID_LANGUAGES = ['en','ar','fr','es','de','pt','it','nl','ru','zh','ja'];
      const VALID_FRAMEWORKS = ['html','react','vue','svelte','next','astro','wordpress'];
      const VALID_CSS = ['inline','tailwind','bootstrap','bulma','custom'];
      const VALID_IMAGE_STYLES = ['realistic','illustration','3d','watercolor','minimalist','abstract'];

      // --- Concurrent generation rate limit: max 2 per user ---
      const concurrentCount = _activeGenerations.get(auth.user.id) || 0;
      if (concurrentCount >= MAX_CONCURRENT_GENERATIONS_PER_USER) {
        json(res, 429, { success: false, error: `Maximum ${MAX_CONCURRENT_GENERATIONS_PER_USER} concurrent generations allowed. Please wait for a running generation to complete.` });
        return;
      }

      // --- Merge user settings + auto-config + request overrides ---
      let userSettings = {};
      try {
        userSettings = await supabase.getUserSettings(auth.token, auth.user.id) || {};
      } catch (e) {
        logger.warn('user_settings_fetch_failed', { error: e.message, userId: auth.user.id });
      }

      // Auto-config detection from project_dir if provided
      let autoConfig = {};
      const projectDir = typeof body.project_dir === 'string' ? body.project_dir.trim() : '';
      if (projectDir) {
        try {
          const autoConfigModule = require('../engine/auto-config');
          if (typeof autoConfigModule.detect === 'function') {
            autoConfig = await autoConfigModule.detect(projectDir) || {};
          } else if (typeof autoConfigModule.detectProjectConfig === 'function') {
            autoConfig = await autoConfigModule.detectProjectConfig(projectDir) || {};
          }
        } catch (e) {
          logger.warn('auto_config_detect_failed', { error: e.message });
        }
      }

      // Layer 1: defaults, Layer 2: user settings, Layer 3: auto-config, Layer 4: request overrides
      const language = body.language && VALID_LANGUAGES.includes(body.language) ? body.language
        : (autoConfig.language && VALID_LANGUAGES.includes(autoConfig.language) ? autoConfig.language
        : (userSettings.preferred_language && VALID_LANGUAGES.includes(userSettings.preferred_language) ? userSettings.preferred_language
        : 'en'));

      const framework = body.framework && VALID_FRAMEWORKS.includes(body.framework) ? body.framework
        : (autoConfig.framework && VALID_FRAMEWORKS.includes(autoConfig.framework) ? autoConfig.framework
        : (userSettings.preferred_framework && VALID_FRAMEWORKS.includes(userSettings.preferred_framework) ? userSettings.preferred_framework
        : 'html'));

      const css_framework = body.css_framework && VALID_CSS.includes(body.css_framework) ? body.css_framework
        : (autoConfig.cssFramework && VALID_CSS.includes(autoConfig.cssFramework) ? autoConfig.cssFramework
        : (userSettings.preferred_css_framework && VALID_CSS.includes(userSettings.preferred_css_framework) ? userSettings.preferred_css_framework
        : 'inline'));

      const image_style = body.image_style && VALID_IMAGE_STYLES.includes(body.image_style) ? body.image_style
        : (userSettings.preferred_image_style && VALID_IMAGE_STYLES.includes(userSettings.preferred_image_style) ? userSettings.preferred_image_style
        : 'realistic');

      // Support both image_count (AC) and max_images (legacy)
      const rawImageCount = body.image_count ?? body.max_images;
      const image_count = Math.min(Math.max(parseInt(rawImageCount) || 6, 0), 10);

      // domain_hint: optional guidance for content domain
      const domain_hint = typeof body.domain_hint === 'string' ? body.domain_hint.trim().slice(0, 200) : '';

      // 1. Check quota
      const quotaResult = await supabase.checkQuota(auth.token, auth.user.id, 'generate');
      if (!quotaResult.allowed) {
        json(res, 429, { success: false, error: quotaResult.reason });
        return;
      }

      // 2. Resolve API keys for subprocess injection
      let resolvedKeys = {};
      try {
        resolvedKeys = await keyManager.resolveAllKeys();
      } catch (e) {
        logger.warn('key_resolve_failed', { error: e.message });
      }

      // 3. Create article record (non-fatal if it fails — generation can proceed without DB record)
      let articleId = null;
      try {
        const article = await supabase.createArticle(auth.token, {
          user_id: auth.user.id,
          title: topic.slice(0, 200),
          topic,
          language,
          framework,
          status: 'generating'
        });
        articleId = article.data?.id || null;
      } catch (e) {
        logger.warn('article_create_failed', { error: e.message, userId: auth.user.id });
      }

      // 4. Track concurrent generation count
      _activeGenerations.set(auth.user.id, concurrentCount + 1);

      // 5. Enqueue generation job (usage logged only on success, not eagerly)
      const job = await jobQueue.enqueue(auth.token, {
        userId: auth.user.id,
        type: 'generate',
        articleId,
        config: {
          topic, language, framework, css_framework, image_style,
          image_count, domain_hint, project_dir: projectDir,
          resolvedKeys, autoConfig
        }
      });

      // 6. Subscribe to job completion for deferred quota decrement & concurrent tracking
      const _unsubQuota = jobQueue.subscribe(job.id, async (event) => {
        if (event.event === 'completed') {
          // Decrement quota only on successful completion
          try {
            await supabase.logUsage(auth.token, auth.user.id, 'generate', topic);
          } catch (e) {
            logger.warn('usage_log_failed', { error: e.message });
          }
          const cur = _activeGenerations.get(auth.user.id) || 1;
          _activeGenerations.set(auth.user.id, Math.max(0, cur - 1));
          _unsubQuota();
        } else if (event.event === 'failed' || event.event === 'cancelled') {
          // Do NOT decrement quota on failure — user gets to retry
          const cur = _activeGenerations.get(auth.user.id) || 1;
          _activeGenerations.set(auth.user.id, Math.max(0, cur - 1));
          _unsubQuota();
        }
      });

      webhookManager.emit('pipeline.started', { jobId: job.id, topic, userId: auth.user.id });

      // Estimate generation time based on image count and framework complexity
      const baseMinutes = 8;
      const imageMinutes = image_count * 0.5;
      const estimated_seconds = Math.round((baseMinutes + imageMinutes) * 60);

      json(res, 201, {
        success: true,
        data: {
          job_id: job.id,
          article_id: articleId,
          status: 'queued',
          estimated_time: estimated_seconds,
          progress_url: `/api/queue/job/${job.id}/progress`
        }
      });
    } catch (e) {
      logger.error('generate_failed', { error: e.message, userId: auth.user.id });
      json(res, 500, { success: false, error: 'Generation failed. Please try again.' });
    }
    return;
  }

  // ── JOB QUEUE ENDPOINTS ──────────────────────────────────────

  // POST /api/queue/enqueue — add a job to the queue
  if (req.method === 'POST' && urlPath === '/api/queue/enqueue') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    try {
      const body = await readBody(req);
      if (!body.type || !['generate', 'edit'].includes(body.type)) {
        json(res, 400, { success: false, error: 'type must be "generate" or "edit"' });
        return;
      }
      const job = await jobQueue.enqueue(auth.token, {
        userId: auth.user.id,
        type: body.type,
        articleId: body.article_id,
        config: body.config || {}
      });
      webhookManager.emit('pipeline.started', { jobId: job.id, type: body.type });
      json(res, 201, { success: true, data: job });
    } catch (e) {
      json(res, 400, { success: false, error: e.message });
    }
    return;
  }

  // POST /api/queue/cancel/:id — cancel a queued or running job
  const cancelMatch = urlPath.match(/^\/api\/queue\/cancel\/([0-9a-f-]+)$/i);
  if (req.method === 'POST' && cancelMatch) {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const jobId = cancelMatch[1];
    if (!UUID_RE.test(jobId)) { json(res, 400, { success: false, error: 'Invalid job ID' }); return; }
    try {
      await jobQueue.cancel(admin.token, jobId);
      json(res, 200, { success: true, message: 'Job cancelled' });
    } catch (e) {
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/queue/status — current queue processing state
  if (req.method === 'GET' && urlPath === '/api/queue/status') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    json(res, 200, { success: true, data: jobQueue.getStatus() });
    return;
  }

  // GET /api/queue/job/:id/progress — SSE stream for job progress (structured events)
  const progressMatch = urlPath.match(/^\/api\/queue\/job\/([0-9a-f-]+)\/progress$/i);
  if (req.method === 'GET' && progressMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const jobId = progressMatch[1];
    if (!UUID_RE.test(jobId)) { json(res, 400, { success: false, error: 'Invalid job ID' }); return; }

    // SSE response
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Generation pipeline has 10 total steps
    const GENERATION_STEPS = {
      queued:       { step: 0, total: 10, phase: 'queued' },
      starting:     { step: 1, total: 10, phase: 'initialization' },
      parsing:      { step: 2, total: 10, phase: 'topic_parsing' },
      analyzing:    { step: 3, total: 10, phase: 'project_analysis' },
      researching:  { step: 4, total: 10, phase: 'research' },
      concepts:     { step: 5, total: 10, phase: 'concept_generation' },
      architecture: { step: 6, total: 10, phase: 'architecture' },
      images:       { step: 7, total: 10, phase: 'image_generation' },
      writing:      { step: 8, total: 10, phase: 'draft_writing' },
      finalizing:   { step: 9, total: 10, phase: 'finalization' },
      complete:     { step: 10, total: 10, phase: 'complete' },
      // Edit pipeline steps
      reading:      { step: 1, total: 5, phase: 'reading' },
      rewriting:    { step: 2, total: 5, phase: 'rewriting' },
      formatting:   { step: 3, total: 5, phase: 'formatting' },
      validating:   { step: 4, total: 5, phase: 'validating' },
    };

    const unsub = jobQueue.subscribe(jobId, (event) => {
      if (res.writableEnded) return;

      if (event.event === 'progress') {
        // Structured progress event
        const stageInfo = GENERATION_STEPS[event.stage] || { step: 0, total: 10, phase: event.stage };
        const structured = {
          event: 'progress',
          step: stageInfo.step,
          total: stageInfo.total,
          phase: stageInfo.phase,
          percent: event.percent || 0
        };
        res.write(`event: progress\ndata: ${JSON.stringify(structured)}\n\n`);

      } else if (event.event === 'completed') {
        // Structured complete event with article metadata
        const result = event.result || {};
        const structured = {
          event: 'complete',
          article_id: result.article_id || null,
          file_path: result.file_path || null,
          word_count: result.word_count || 0
        };
        res.write(`event: complete\ndata: ${JSON.stringify(structured)}\n\n`);
        res.end();

      } else if (event.event === 'failed') {
        // Structured error event
        const structured = {
          event: 'error',
          message: event.error || 'Unknown error',
          step: event.step || null
        };
        res.write(`event: error\ndata: ${JSON.stringify(structured)}\n\n`);
        res.end();

      } else if (event.event === 'cancelled') {
        res.write(`event: cancelled\ndata: ${JSON.stringify({ event: 'cancelled' })}\n\n`);
        res.end();

      } else {
        // Pass through other events (queued, started) as-is
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    });

    req.on('close', unsub);
    return;
  }

  // ── WEBHOOK ENDPOINTS ──────────────────────────────────────

  // GET /api/webhooks — list webhooks
  if (req.method === 'GET' && urlPath === '/api/webhooks') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    json(res, 200, { success: true, data: webhookManager.list(), events: WebhookManager.EVENTS });
    return;
  }

  // POST /api/webhooks — register webhook
  if (req.method === 'POST' && urlPath === '/api/webhooks') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    try {
      const body = await readBody(req);
      if (!body.url || !body.events) {
        json(res, 400, { success: false, error: 'url and events array required' });
        return;
      }
      const invalid = body.events.filter(e => !WebhookManager.EVENTS.includes(e));
      if (invalid.length > 0) {
        json(res, 400, { success: false, error: 'Invalid events: ' + invalid.join(', ') });
        return;
      }
      const hook = webhookManager.register({
        id: crypto.randomUUID(),
        url: body.url,
        events: body.events,
        secret: body.secret || crypto.randomBytes(32).toString('hex')
      });
      json(res, 201, { success: true, data: hook });
    } catch (e) {
      json(res, 400, { success: false, error: e.message });
    }
    return;
  }

  // DELETE /api/webhooks/:id — remove webhook
  const webhookDeleteMatch = urlPath.match(/^\/api\/webhooks\/([0-9a-f-]+)$/i);
  if (req.method === 'DELETE' && webhookDeleteMatch) {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const hookId = webhookDeleteMatch[1];
    const removed = webhookManager.unregister(hookId);
    if (!removed) { json(res, 404, { success: false, error: 'Webhook not found' }); return; }
    json(res, 200, { success: true, message: 'Webhook removed' });
    return;
  }

  // ── APPLY EDIT (auth required, routed through job queue for SSE progress) ──

  if (req.method === 'POST' && (req.url === '/apply-edit' || req.url.startsWith('/apply-edit?'))) {
    if (!checkRateLimit('edit:' + req.socket.remoteAddress, 10)) {
      logger.logSecurity('rate_limit_edit', { ip: req.socket.remoteAddress });
      json(res, 429, { status: 'error', error: 'Too many edit requests. Please wait a minute.' });
      return;
    }

    // Require auth
    const auth = await requireAuth(req, res);
    if (!auth) return; // response already sent

    try {
      const { prompt } = await readBody(req);

      if (!prompt || !prompt.includes('SECTION_EDIT:')) {
        json(res, 400, { status: 'error', error: 'Invalid SECTION_EDIT prompt' });
        return;
      }

      // Sanitize: cap length
      if (prompt.length > 8000) {
        json(res, 400, { status: 'error', error: 'Edit prompt too long (max 8000 characters)' });
        return;
      }

      // Sanitize: validate prompt structure to prevent prompt injection
      const requiredFields = ['Article file:', 'Section ID:', 'User requested change:'];
      const missingFields = requiredFields.filter(f => !prompt.includes(f));
      if (missingFields.length > 0) {
        json(res, 400, { status: 'error', error: 'Invalid edit prompt format. Missing: ' + missingFields.join(', ') });
        return;
      }

      // Prompt injection guard
      const guardResult = promptGuard.checkPrompt(prompt);
      if (!guardResult.safe) {
        logger.logSecurity('prompt_injection_blocked', { userId: auth.user.id, reason: guardResult.reason });
        json(res, 400, { status: 'error', error: 'Edit prompt rejected: ' + guardResult.reason });
        return;
      }

      // Extract and validate article file path
      const fileMatch = prompt.match(/Article file:\s*(.+?)[\r\n]/);
      if (fileMatch) {
        const articleFile = fileMatch[1].trim();
        if (articleFile.includes('..')) {
          logger.logSecurity('path_traversal_blocked', { userId: auth.user.id, path: articleFile });
          json(res, 400, { status: 'error', error: 'Invalid article file path: path traversal not allowed.' });
          return;
        }
        if (path.isAbsolute(articleFile)) {
          logger.logSecurity('absolute_path_blocked', { userId: auth.user.id, path: articleFile });
          json(res, 400, { status: 'error', error: 'Invalid article file path: absolute paths not allowed.' });
          return;
        }
        if (!articleFile.endsWith('.html')) {
          json(res, 400, { status: 'error', error: 'Article file must be an .html file.' });
          return;
        }
        const resolvedPath = path.resolve(PROJECT_DIR, articleFile);
        if (!resolvedPath.startsWith(path.resolve(PROJECT_DIR))) {
          json(res, 400, { status: 'error', error: 'Invalid article file path: file must be within project directory.' });
          return;
        }
        if (!(await fs.promises.access(resolvedPath).then(() => true).catch(() => false))) {
          json(res, 400, { status: 'error', error: 'Article file not found: ' + articleFile + '. Check that the file exists in your project directory.' });
          return;
        }
      }

      // Extract section ID for snapshot
      const sectionMatch = prompt.match(/Section ID:\s*(.+?)[\r\n]/);
      const sectionId = sectionMatch ? sectionMatch[1].trim() : null;

      // Save pre-edit snapshot server-side (best-effort)
      let snapshotSaved = false;
      if (fileMatch && sectionId) {
        try {
          const articlePath = path.resolve(PROJECT_DIR, fileMatch[1].trim());
          const html = await fs.promises.readFile(articlePath, 'utf-8');
          const sectionRegex = new RegExp(
            '<(?:section|div)[^>]*id=["\']' + sectionId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\'][^>]*>[\\s\\S]*?</(?:section|div)>',
            'i'
          );
          const match = html.match(sectionRegex);
          if (match) {
            const snapshotsDir = path.join(PROJECT_DIR, '.chainiq-snapshots');
            await fs.promises.mkdir(snapshotsDir, { recursive: true });
            const snapshotFile = path.join(snapshotsDir, sectionId + '-' + Date.now() + '.html');
            await fs.promises.writeFile(snapshotFile, match[0], 'utf-8');
            snapshotSaved = true;
            const allFiles = await fs.promises.readdir(snapshotsDir);
            const sectionFiles = allFiles
              .filter(f => f.startsWith(sectionId + '-') && f.endsWith('.html'))
              .sort();
            if (sectionFiles.length > 10) {
              const toDelete = sectionFiles.slice(0, sectionFiles.length - 10);
              for (const f of toDelete) {
                await fs.promises.unlink(path.join(snapshotsDir, f)).catch(() => {});
              }
            }
          }
        } catch (snapErr) {
          logger.warn('snapshot_save_failed', { sectionId, error: snapErr.message });
        }
      }

      // Log the edit usage
      supabase.logUsage(auth.token, auth.user.id, 'edit', null)
        .catch(err => console.error('[bridge] Failed to log usage:', err.message));

      // Resolve API keys for subprocess environment
      let resolvedKeys = {};
      try {
        resolvedKeys = await keyManager.resolveAllKeys();
      } catch (e) {
        logger.warn('key_resolve_failed', { error: e.message });
      }

      // Check if sync mode requested (backward compatibility)
      const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const syncMode = reqUrl.searchParams.get('sync') === 'true';

      // Enqueue the edit job
      const job = await jobQueue.enqueue(auth.token, {
        userId: auth.user.id,
        type: 'edit',
        config: { prompt, resolvedKeys, snapshotSaved }
      });

      if (syncMode) {
        // Backward compat: wait for job completion and return result
        await new Promise((resolve, reject) => {
          const unsub = jobQueue.subscribe(job.id, (event) => {
            if (event.event === 'completed') {
              unsub();
              json(res, 200, { status: 'success', output: event.result?.output || '', snapshotSaved });
              resolve();
            } else if (event.event === 'failed') {
              unsub();
              json(res, 500, { status: 'error', error: event.error || 'Edit failed' });
              resolve();
            } else if (event.event === 'cancelled') {
              unsub();
              json(res, 499, { status: 'cancelled', error: 'Edit was cancelled' });
              resolve();
            }
          });
          // Safety timeout for sync mode
          setTimeout(() => {
            unsub();
            if (!res.writableEnded) {
              json(res, 504, { status: 'timeout', error: 'Sync edit timed out' });
            }
            resolve();
          }, TIMEOUT_MS);
        });
      } else {
        // Async mode: return job ID immediately, client uses SSE for progress
        json(res, 202, {
          status: 'queued',
          job_id: job.id,
          progress_url: `/api/queue/job/${job.id}/progress`,
          snapshotSaved
        });
      }

    } catch (e) {
      json(res, 400, { status: 'error', error: e.message });
    }
    return;
  }

  // ── Plugin Instances & Remote Config (Publisher Hub) ──────────

  // POST /api/plugin/heartbeat — plugin phones home on startup
  if (req.method === 'POST' && urlPath === '/api/plugin/heartbeat') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    try {
      const body = await readBody(req);
      if (!body.instance_id) { json(res, 400, { error: 'instance_id is required' }); return; }
      const instance = await supabase.upsertPluginInstance(auth.token, {
        user_id: auth.user.id,
        instance_id: body.instance_id,
        project_name: body.project_name,
        framework: body.framework,
        plugin_version: body.plugin_version,
        ip_address: req.socket?.remoteAddress || null,
        metadata: body.metadata || {}
      });
      logger.info('plugin_heartbeat', { userId: auth.user.id, instanceId: body.instance_id });
      json(res, 200, { success: true, data: instance });
    } catch (e) {
      json(res, 500, { error: 'Heartbeat failed', message: e.message });
    }
    return;
  }

  // GET /api/plugin/config — plugin polls remote config on startup
  if (req.method === 'GET' && urlPath === '/api/plugin/config') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    try {
      const configs = await supabase.getPluginConfig(auth.token);
      const configMap = {};
      configs.forEach(c => { configMap[c.config_key] = c.config_value; });
      json(res, 200, { success: true, data: configMap });
    } catch (e) {
      json(res, 500, { error: 'Failed to fetch config', message: e.message });
    }
    return;
  }

  // GET /api/analytics/user/:userId — admin: per-user detailed analytics
  const analyticsUserMatch = urlPath.match(/^\/api\/analytics\/user\/([^/]+)$/);
  if (req.method === 'GET' && analyticsUserMatch) {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    try {
      const targetUserId = analyticsUserMatch[1];
      if (!UUID_RE.test(targetUserId)) { json(res, 400, { error: 'Valid userId required' }); return; }
      const analytics = await supabase.getUserAnalyticsDetail(admin.token, targetUserId);
      json(res, 200, { success: true, data: analytics });
    } catch (e) {
      json(res, 500, { error: 'Failed to fetch analytics', message: e.message });
    }
    return;
  }

  // GET /api/admin/plugin-instances — admin: list all plugin installations
  if (req.method === 'GET' && urlPath === '/api/admin/plugin-instances') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    try {
      const instances = await supabase.listPluginInstances(admin.token);
      json(res, 200, { success: true, data: instances });
    } catch (e) {
      json(res, 500, { error: 'Failed to list instances', message: e.message });
    }
    return;
  }

  // GET /api/admin/plugin-config — admin: list all config entries
  if (req.method === 'GET' && urlPath === '/api/admin/plugin-config') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    try {
      const configs = await supabase.getPluginConfig(admin.token);
      json(res, 200, { success: true, data: configs });
    } catch (e) {
      json(res, 500, { error: 'Failed to list config', message: e.message });
    }
    return;
  }

  // PUT /api/admin/plugin-config/:key — admin: set a config value
  const configKeyMatch = urlPath.match(/^\/api\/admin\/plugin-config\/([^/]+)$/);
  if (req.method === 'PUT' && configKeyMatch) {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    try {
      const configKey = decodeURIComponent(configKeyMatch[1]);
      const body = await readBody(req);
      if (body.value === undefined) { json(res, 400, { error: 'value is required' }); return; }
      const result = await supabase.upsertPluginConfig(admin.token, configKey, body.value, body.description);
      logger.info('plugin_config_updated', { key: configKey, adminId: admin.user.id });
      json(res, 200, { success: true, data: result });
    } catch (e) {
      json(res, 500, { error: 'Failed to update config', message: e.message });
    }
    return;
  }

  // ── OAUTH / CONNECTIONS ENDPOINTS ──────────────────────────

  // GET /api/connections/google/auth — initiate Google OAuth flow
  if (req.method === 'GET' && urlPath === '/api/connections/google/auth') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('oauth_auth:' + auth.user.id, 5)) {
      logger.logSecurity('rate_limit_oauth_auth', { userId: auth.user.id });
      json(res, 429, { success: false, error: 'Too many OAuth requests. Please wait a minute.' });
      return;
    }
    try {
      const result = await oauth.generateAuthUrl(auth.user.id);
      logger.info('oauth_auth_initiated', { userId: auth.user.id, provider: 'google' });
      json(res, 200, { success: true, data: { auth_url: result.authUrl, state: result.state } });
    } catch (e) {
      logger.error('oauth_auth_failed', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/connections/google/callback — Google OAuth callback (public, state-validated)
  if (req.method === 'GET' && urlPath === '/api/connections/google/callback') {
    const code = queryParams.code;
    const state = queryParams.state;
    const error = queryParams.error;

    // Google may redirect with an error parameter
    if (error) {
      logger.logSecurity('oauth_callback_error', { error, errorDescription: queryParams.error_description });
      const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3000';
      res.writeHead(302, { 'Location': `${dashboardUrl}/connections?error=${encodeURIComponent(error)}` });
      res.end();
      return;
    }

    if (!code || !state) {
      logger.logSecurity('oauth_callback_missing_params', { hasCode: !!code, hasState: !!state });
      const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3000';
      res.writeHead(302, { 'Location': `${dashboardUrl}/connections?error=missing_params` });
      res.end();
      return;
    }

    try {
      const result = await oauth.handleCallback(code, state);
      logger.info('oauth_callback_success', { userId: result.userId, provider: result.provider });
      const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3000';
      res.writeHead(302, { 'Location': `${dashboardUrl}/connections?connected=${result.provider}` });
      res.end();
    } catch (e) {
      logger.error('oauth_callback_failed', { error: e.message });
      const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3000';
      res.writeHead(302, { 'Location': `${dashboardUrl}/connections?error=${encodeURIComponent(e.message)}` });
      res.end();
    }
    return;
  }

  // GET /api/connections — list user's connections (no token data)
  if (req.method === 'GET' && urlPath === '/api/connections') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('connections_list:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const connections = await oauth.listConnections(auth.user.id);
      json(res, 200, { success: true, data: connections });
    } catch (e) {
      logger.error('connections_list_failed', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/connections/status — per-provider health summary
  if (req.method === 'GET' && urlPath === '/api/connections/status') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('connections_status:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const status = await oauth.getConnectionsStatus(auth.user.id);
      json(res, 200, { success: true, data: status });
    } catch (e) {
      logger.error('connections_status_failed', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // ── GSC INGESTION ENDPOINTS ────────────────────────────────

  // POST /api/ingestion/trigger/gsc — trigger GSC sync (historical or incremental)
  if (req.method === 'POST' && urlPath === '/api/ingestion/trigger/gsc') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('gsc_trigger:' + auth.user.id, 5)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      let body = {};
      try { body = await readBody(req); } catch (e) { /* no body is fine */ }
      const result = await gsc.handleTrigger(auth.user.id, body);
      const statusCode = result.statusCode || (result.success ? 200 : 500);
      json(res, statusCode, { success: result.success, data: result.data, error: result.error || undefined });
    } catch (e) {
      logger.error('gsc_trigger_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/ingestion/gsc/status — get current GSC sync status
  if (req.method === 'GET' && urlPath === '/api/ingestion/gsc/status') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('gsc_status:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const result = await gsc.handleStatus(auth.user.id);
      json(res, 200, result);
    } catch (e) {
      logger.error('gsc_status_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // ── GA4 INGESTION ENDPOINTS ────────────────────────────────

  // POST /api/ingestion/trigger/ga4 — trigger GA4 sync (historical or incremental)
  if (req.method === 'POST' && urlPath === '/api/ingestion/trigger/ga4') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('ga4_trigger:' + auth.user.id, 5)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      let body = {};
      try { body = await readBody(req); } catch (e) { /* no body is fine */ }
      const result = await ga4.handleTrigger(auth.user.id, body);
      const statusCode = result.statusCode || (result.success ? 200 : 500);
      json(res, statusCode, { success: result.success, data: result.data, error: result.error || undefined });
    } catch (e) {
      logger.error('ga4_trigger_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/ingestion/ga4/status — get current GA4 sync status
  if (req.method === 'GET' && urlPath === '/api/ingestion/ga4/status') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('ga4_status:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const result = await ga4.handleStatus(auth.user.id);
      json(res, 200, result);
    } catch (e) {
      logger.error('ga4_status_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // ── SEMRUSH INGESTION ENDPOINTS ──────────────────────────────

  // POST /api/ingestion/trigger/semrush — trigger Semrush sync
  if (req.method === 'POST' && urlPath === '/api/ingestion/trigger/semrush') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('semrush_trigger:' + auth.user.id, 5)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      let body = {};
      try { body = await readBody(req); } catch (e) { /* no body is fine */ }
      body.keyManager = keyManager;
      const result = await semrush.handleTrigger(auth.user.id, body);
      const statusCode = result.statusCode || (result.success ? 200 : 500);
      json(res, statusCode, { success: result.success, data: result.data, error: result.error || undefined });
    } catch (e) {
      logger.error('semrush_trigger_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/ingestion/semrush/status — get current Semrush sync status
  if (req.method === 'GET' && urlPath === '/api/ingestion/semrush/status') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('semrush_status:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const result = await semrush.handleStatus(auth.user.id);
      json(res, 200, result);
    } catch (e) {
      logger.error('semrush_status_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // POST /api/connections/semrush — store client Semrush API key (encrypted)
  if (req.method === 'POST' && urlPath === '/api/connections/semrush') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('connections_semrush:' + auth.user.id, 10)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const body = await readBody(req);
      if (!body.api_key) {
        json(res, 400, { success: false, error: 'api_key is required' });
        return;
      }
      const result = await keyManager.addKey('semrush_api_key', body.api_key, auth.user.id, auth.user.id);
      json(res, 200, { success: true, data: { id: result.id, key_hint: result.key_hint, message: 'Semrush API key stored (encrypted).' } });
    } catch (e) {
      logger.error('connections_semrush_store_failed', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // ── AHREFS INGESTION ENDPOINTS ──────────────────────────────

  // POST /api/ingestion/trigger/ahrefs — trigger Ahrefs sync
  if (req.method === 'POST' && urlPath === '/api/ingestion/trigger/ahrefs') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('ahrefs_trigger:' + auth.user.id, 5)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      let body = {};
      try { body = await readBody(req); } catch (e) { /* no body is fine */ }
      body.keyManager = keyManager;
      const result = await ahrefs.handleTrigger(auth.user.id, body);
      const statusCode = result.statusCode || (result.success ? 200 : 500);
      json(res, statusCode, { success: result.success, data: result.data, error: result.error || undefined });
    } catch (e) {
      logger.error('ahrefs_trigger_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/ingestion/ahrefs/status — get current Ahrefs sync status
  if (req.method === 'GET' && urlPath === '/api/ingestion/ahrefs/status') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('ahrefs_status:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const result = await ahrefs.handleStatus(auth.user.id);
      json(res, 200, result);
    } catch (e) {
      logger.error('ahrefs_status_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // POST /api/connections/ahrefs — store client Ahrefs API token (encrypted)
  if (req.method === 'POST' && urlPath === '/api/connections/ahrefs') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('connections_ahrefs:' + auth.user.id, 10)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const body = await readBody(req);
      if (!body.api_token) {
        json(res, 400, { success: false, error: 'api_token is required' });
        return;
      }
      const result = await keyManager.addKey('ahrefs_api_token', body.api_token, auth.user.id, auth.user.id);
      json(res, 200, { success: true, data: { id: result.id, key_hint: result.key_hint, message: 'Ahrefs API token stored (encrypted).' } });
    } catch (e) {
      logger.error('connections_ahrefs_store_failed', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // ── CONTENT CRAWLER ENDPOINTS ──────────────────────────────

  // POST /api/ingestion/crawl — trigger content crawl
  if (req.method === 'POST' && urlPath === '/api/ingestion/crawl') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('crawl_trigger:' + auth.user.id, 3)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const body = await readBody(req);
      const result = await crawler.handleTrigger(auth.user.id, body);
      const statusCode = result.statusCode || (result.success ? 200 : 500);
      json(res, statusCode, { success: result.success, data: result.data, error: result.error || undefined });
    } catch (e) {
      logger.error('crawl_trigger_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/ingestion/crawl/status/:sessionId — get crawl session status
  if (req.method === 'GET' && urlPath.startsWith('/api/ingestion/crawl/status/')) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('crawl_status:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    const sessionId = urlPath.split('/').pop();
    if (!UUID_RE.test(sessionId)) {
      json(res, 400, { success: false, error: 'Invalid session ID format' });
      return;
    }
    try {
      const result = await crawler.handleStatus(auth.user.id, sessionId);
      const statusCode = result.statusCode || (result.success ? 200 : 404);
      json(res, statusCode, { success: result.success, data: result.data, error: result.error || undefined });
    } catch (e) {
      logger.error('crawl_status_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // ── SCHEDULER ENDPOINT ────────────────────────────────────

  // GET /api/ingestion/schedule — schedule overview for authenticated user
  if (req.method === 'GET' && urlPath === '/api/ingestion/schedule') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('schedule_status:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const result = await scheduler.getScheduleForUser(auth.user.id);
      json(res, result.success ? 200 : 500, result);
    } catch (e) {
      logger.error('schedule_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // ── QUALITY GATE ENDPOINTS ─────────────────────────────────

  // GET /api/quality/score/:articleId — score + category breakdown + E-E-A-T grade
  const qualityScoreMatch = urlPath.match(/^\/api\/quality\/score\/([0-9a-f-]+)$/i);
  if (req.method === 'GET' && qualityScoreMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const articleId = qualityScoreMatch[1];
    if (!UUID_RE.test(articleId)) { json(res, 400, { success: false, error: 'Invalid article ID' }); return; }
    if (!checkRateLimit('quality_score:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const article = await supabase.getArticle(auth.token, articleId);
      if (!article) { json(res, 404, { success: false, error: 'Article not found' }); return; }

      const html = article.html_content || article.content || '';
      const keyword = article.keyword || article.topic || '';
      const title = article.title || '';
      const metaDescription = article.meta_description || '';

      const checklist = qualityGate.runChecklist(html, keyword, { title, metaDescription });
      const eeat = qualityGate.runEEATScoring(html, keyword);

      json(res, 200, {
        success: true,
        data: {
          articleId,
          score: checklist.score,
          passedCount: checklist.passedCount,
          totalCount: checklist.totalCount,
          categoryScores: checklist.categoryScores,
          eeat: {
            totalScore: eeat.totalScore,
            maxScore: eeat.maxScore,
            grade: eeat.grade,
            dimensions: eeat.dimensions
          }
        }
      });
    } catch (e) {
      logger.error('quality_score_endpoint_error', { userId: auth.user.id, articleId, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/quality/checklist/:articleId — full 60-item checklist + suggestions
  const qualityChecklistMatch = urlPath.match(/^\/api\/quality\/checklist\/([0-9a-f-]+)$/i);
  if (req.method === 'GET' && qualityChecklistMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const articleId = qualityChecklistMatch[1];
    if (!UUID_RE.test(articleId)) { json(res, 400, { success: false, error: 'Invalid article ID' }); return; }
    if (!checkRateLimit('quality_checklist:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const article = await supabase.getArticle(auth.token, articleId);
      if (!article) { json(res, 404, { success: false, error: 'Article not found' }); return; }

      const html = article.html_content || article.content || '';
      const keyword = article.keyword || article.topic || '';
      const title = article.title || '';
      const metaDescription = article.meta_description || '';

      const checklist = qualityGate.runChecklist(html, keyword, { title, metaDescription });
      const eeat = qualityGate.runEEATScoring(html, keyword);
      const suggestions = generateSuggestions(checklist, eeat);

      // Group items by category
      const grouped = {};
      for (const item of checklist.items) {
        if (!grouped[item.category]) {
          grouped[item.category] = [];
        }
        grouped[item.category].push(item);
      }

      json(res, 200, {
        success: true,
        data: {
          articleId,
          score: checklist.score,
          passedCount: checklist.passedCount,
          totalCount: checklist.totalCount,
          categoryScores: checklist.categoryScores,
          categories: grouped,
          eeat: {
            totalScore: eeat.totalScore,
            maxScore: eeat.maxScore,
            grade: eeat.grade,
            dimensions: eeat.dimensions
          },
          suggestions
        }
      });
    } catch (e) {
      logger.error('quality_checklist_endpoint_error', { userId: auth.user.id, articleId, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/quality/suggestions/:articleId — 7-signal weighted scoring + revision instructions
  const qualitySuggestionsMatch = urlPath.match(/^\/api\/quality\/suggestions\/([0-9a-f-]+)$/i);
  if (req.method === 'GET' && qualitySuggestionsMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const articleId = qualitySuggestionsMatch[1];
    if (!UUID_RE.test(articleId)) { json(res, 400, { success: false, error: 'Invalid article ID' }); return; }
    if (!checkRateLimit('quality_suggestions:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const article = await supabase.getArticle(auth.token, articleId);
      if (!article) { json(res, 404, { success: false, error: 'Article not found' }); return; }

      const html = article.html_content || article.content || '';
      const keyword = article.keyword || article.topic || '';
      const title = article.title || '';
      const metaDescription = article.meta_description || '';

      const checklist = qualityGate.runChecklist(html, keyword, { title, metaDescription });
      const eeat = qualityGate.runEEATScoring(html, keyword);
      const metrics = qualityGate.extractMetrics(html, keyword, { title, metaDescription });
      const suggestions = generateSuggestions(checklist, eeat);

      // ── 7-Signal Weighted Scoring ──
      const signals = computeSevenSignals(metrics, checklist, eeat);
      const rounded = computeOverallScore(signals);
      const pass = rounded >= 7.0;

      // Generate revision instructions for failing signals
      const revisionInstructions = pass ? null : generateRevisionInstructions(signals, suggestions);

      json(res, 200, {
        success: true,
        data: {
          article_id: articleId,
          overall_score: rounded,
          pass,
          signals: signals.map(s => ({
            name: s.name,
            score: s.score,
            weight: s.weight,
            weighted_score: s.weighted_score,
            details: s.details
          })),
          suggestions,
          revision_instructions: revisionInstructions,
          checklist_score: checklist.score,
          eeat_grade: eeat.grade,
          eeat_total: eeat.totalScore,
          eeat_max: eeat.maxScore
        }
      });
    } catch (e) {
      logger.error('quality_suggestions_endpoint_error', { userId: auth.user.id, articleId, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // ── KEYWORD GAP & CANNIBALIZATION ENDPOINTS ─────────────────────

  // GET /api/intelligence/gaps — list keyword gaps with filtering/pagination
  if (req.method === 'GET' && urlPath === '/api/intelligence/gaps') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('gap_list:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const queryUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const query = {
        min_impressions: queryUrl.searchParams.get('min_impressions') || '',
        sort: queryUrl.searchParams.get('sort') || 'priority_score',
        page: queryUrl.searchParams.get('page') || '1',
        per_page: queryUrl.searchParams.get('per_page') || '20'
      };
      const result = await gapAnalyzer.handleGapList(auth.user.id, query);
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('gap_list_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/intelligence/gaps/competitors — competitor domains
  if (req.method === 'GET' && urlPath === '/api/intelligence/gaps/competitors') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('gap_competitors:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const result = await gapAnalyzer.handleCompetitors(auth.user.id);
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('gap_competitors_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/intelligence/cannibalization — list cannibalization conflicts
  if (req.method === 'GET' && urlPath === '/api/intelligence/cannibalization') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('cannibalization_list:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const queryUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const query = {
        sort: queryUrl.searchParams.get('sort') || 'priority_score',
        page: queryUrl.searchParams.get('page') || '1',
        per_page: queryUrl.searchParams.get('per_page') || '20'
      };
      const result = await cannibalization.handleCannibalizationList(auth.user.id, query);
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('cannibalization_list_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // POST /api/intelligence/cannibalization/:id/resolve — accept resolution strategy
  const cannibResolveMatch = urlPath.match(/^\/api\/intelligence\/cannibalization\/([0-9a-f-]+)\/resolve$/i);
  if (req.method === 'POST' && cannibResolveMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const opportunityId = cannibResolveMatch[1];
    if (!UUID_RE.test(opportunityId)) {
      json(res, 400, { success: false, error: 'Invalid opportunity ID' });
      return;
    }
    if (!checkRateLimit('cannibalization_resolve:' + auth.user.id, 5)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const body = await readBody(req);
      const result = await cannibalization.handleResolve(auth.user.id, opportunityId, body);
      if (result.error) {
        json(res, 400, { success: false, error: result.error });
        return;
      }
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('cannibalization_resolve_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/intelligence/cannibalization/:keyword — detail for specific keyword
  const cannibDetailMatch = urlPath.match(/^\/api\/intelligence\/cannibalization\/(.+)$/i);
  if (req.method === 'GET' && cannibDetailMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const keyword = decodeURIComponent(cannibDetailMatch[1]);
    if (!checkRateLimit('cannibalization_detail:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const result = await cannibalization.handleCannibalizationDetail(auth.user.id, keyword);
      if (!result) {
        json(res, 404, { success: false, error: 'No cannibalization data found for this keyword' });
        return;
      }
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('cannibalization_detail_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // ── CONTENT DECAY INTELLIGENCE ENDPOINTS ──────────────────────

  // GET /api/intelligence/decay — list all decay items with filtering/pagination
  if (req.method === 'GET' && urlPath === '/api/intelligence/decay') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('decay_list:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const queryUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const query = {
        severity: queryUrl.searchParams.get('severity') || '',
        sort: queryUrl.searchParams.get('sort') || 'severity',
        page: queryUrl.searchParams.get('page') || '1',
        per_page: queryUrl.searchParams.get('per_page') || '20'
      };
      const result = await decayDetector.handleDecayList(auth.user.id, query);
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('decay_list_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/intelligence/decay/:contentId — full detail for single item
  const decayDetailMatch = urlPath.match(/^\/api\/intelligence\/decay\/([0-9a-f-]+)$/i);
  if (req.method === 'GET' && decayDetailMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const contentId = decayDetailMatch[1];
    if (!UUID_RE.test(contentId)) {
      json(res, 400, { success: false, error: 'Invalid content ID' });
      return;
    }
    if (!checkRateLimit('decay_detail:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const result = await decayDetector.handleDecayDetail(auth.user.id, contentId);
      if (!result) {
        json(res, 404, { success: false, error: 'Content not found' });
        return;
      }
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('decay_detail_endpoint_error', { userId: auth.user.id, contentId, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // ── PERFORMANCE TRACKER ENDPOINTS (FL-001) ─────────────────────

  // GET /api/performance/articles — list tracked articles with milestone predictions
  if (req.method === 'GET' && urlPath === '/api/performance/articles') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('perf_articles:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const queryUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const query = {
        milestone: queryUrl.searchParams.get('milestone') || '',
        status: queryUrl.searchParams.get('status') || '',
        sort: queryUrl.searchParams.get('sort') || 'publish_date',
        page: queryUrl.searchParams.get('page') || '1',
        per_page: queryUrl.searchParams.get('per_page') || '20'
      };
      const result = await performanceTracker.handleArticleList(auth.user.id, query);
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('perf_articles_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/performance/summary — portfolio performance summary with ROI
  if (req.method === 'GET' && urlPath === '/api/performance/summary') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('perf_summary:' + auth.user.id, 15)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const result = await performanceTracker.handleSummary(auth.user.id);
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('perf_summary_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/performance/articles/:id — single article milestone detail
  const perfDetailMatch = urlPath.match(/^\/api\/performance\/articles\/([0-9a-f-]+)$/i);
  if (req.method === 'GET' && perfDetailMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const contentId = perfDetailMatch[1];
    if (!UUID_RE.test(contentId)) {
      json(res, 400, { success: false, error: 'Invalid content ID' });
      return;
    }
    if (!checkRateLimit('perf_detail:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const result = await performanceTracker.handleArticleDetail(auth.user.id, contentId);
      if (!result) {
        json(res, 404, { success: false, error: 'Article not found' });
        return;
      }
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('perf_detail_endpoint_error', { userId: auth.user.id, contentId, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // ── TOPIC RECOMMENDER ENDPOINTS ─────────────────────────────────

  // GET /api/intelligence/recommendations — paginated list of topic recommendations
  if (req.method === 'GET' && urlPath === '/api/intelligence/recommendations') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('recommendations_list:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const queryUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const query = {
        category: queryUrl.searchParams.get('category') || '',
        sort: queryUrl.searchParams.get('sort') || 'priority_score',
        page: queryUrl.searchParams.get('page') || '1',
        per_page: queryUrl.searchParams.get('per_page') || '20'
      };
      const result = await topicRecommender.handleRecommendationList(auth.user.id, query);
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('recommendations_list_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // POST /api/intelligence/recommendations/run — trigger a full recommendation scan
  if (req.method === 'POST' && urlPath === '/api/intelligence/recommendations/run') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('recommendations_run:' + auth.user.id, 5)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const body = await readBody(req).catch(() => ({}));
      const result = await topicRecommender.handleRun(auth.user.id, body);
      json(res, 202, { success: true, data: result });
    } catch (e) {
      logger.error('recommendations_run_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/intelligence/recommendations/run/:runId — check run status
  const runStatusMatch = urlPath.match(/^\/api\/intelligence\/recommendations\/run\/([0-9a-f-]+)$/i);
  if (req.method === 'GET' && runStatusMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const runId = runStatusMatch[1];
    if (!checkRateLimit('recommendations_run_status:' + auth.user.id, 60)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const result = await topicRecommender.handleRunStatus(auth.user.id, runId);
      if (!result) {
        json(res, 404, { success: false, error: 'Run not found' });
        return;
      }
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('recommendations_run_status_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // POST /api/intelligence/recommendations/:id/execute — queue recommendation for pipeline
  const recExecuteMatch = urlPath.match(/^\/api\/intelligence\/recommendations\/([0-9a-f-]+)\/execute$/i);
  if (req.method === 'POST' && recExecuteMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const recommendationId = recExecuteMatch[1];
    if (!checkRateLimit('recommendations_execute:' + auth.user.id, 5)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const result = await topicRecommender.handleExecute(auth.user.id, recommendationId);
      if (result.error) {
        json(res, 400, { success: false, error: result.error });
        return;
      }
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('recommendations_execute_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // PATCH /api/intelligence/recommendations/:id/status — update recommendation status
  const recStatusMatch = urlPath.match(/^\/api\/intelligence\/recommendations\/([0-9a-f-]+)\/status$/i);
  if (req.method === 'PATCH' && recStatusMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const recommendationId = recStatusMatch[1];
    if (!checkRateLimit('recommendations_status:' + auth.user.id, 20)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const body = await readBody(req);
      const result = await topicRecommender.handleStatusUpdate(auth.user.id, recommendationId, body);
      if (result.error) {
        json(res, 400, { success: false, error: result.error });
        return;
      }
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('recommendations_status_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/intelligence/recommendations/:id — single recommendation detail
  const recDetailMatch = urlPath.match(/^\/api\/intelligence\/recommendations\/([0-9a-f-]+)$/i);
  if (req.method === 'GET' && recDetailMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const recommendationId = recDetailMatch[1];
    if (!checkRateLimit('recommendations_detail:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const result = await topicRecommender.handleRecommendationDetail(auth.user.id, recommendationId);
      if (!result) {
        json(res, 404, { success: false, error: 'Recommendation not found' });
        return;
      }
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('recommendations_detail_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // ── VOICE / CORPUS ANALYSIS ENDPOINTS ─────────────────────────

  // GET /api/voice/personas — list all personas for user
  if (req.method === 'GET' && urlPath === '/api/voice/personas') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('voice_personas:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Rate limit exceeded. Please wait a minute.' });
      return;
    }
    try {
      const result = await voiceAnalyzer.handleListPersonas(auth.user.id);
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('voice_personas_list_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/voice/personas/:id — get a single persona
  const personaGetMatch = urlPath.match(/^\/api\/voice\/personas\/([0-9a-f-]+)$/i);
  if (req.method === 'GET' && personaGetMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('voice_personas:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Rate limit exceeded. Please wait a minute.' });
      return;
    }
    try {
      const result = await voiceAnalyzer.handleGetPersona(auth.user.id, personaGetMatch[1]);
      json(res, 200, { success: true, data: result });
    } catch (e) {
      const status = e.message === 'Persona not found' ? 404 : 500;
      logger.error('voice_persona_get_error', { userId: auth.user.id, personaId: personaGetMatch[1], error: e.message });
      json(res, status, { success: false, error: e.message });
    }
    return;
  }

  // POST /api/voice/personas — create persona (manual or via clustering)
  if (req.method === 'POST' && urlPath === '/api/voice/personas') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('voice_personas_create:' + auth.user.id, 5)) {
      json(res, 429, { success: false, error: 'Rate limit exceeded. Please wait a minute.' });
      return;
    }
    try {
      const body = await readBody(req);
      const result = await voiceAnalyzer.handleCreatePersona(auth.user.id, body);
      json(res, 201, { success: true, data: result });
    } catch (e) {
      logger.error('voice_persona_create_error', { userId: auth.user.id, error: e.message });
      json(res, 400, { success: false, error: e.message });
    }
    return;
  }

  // PUT /api/voice/personas/:id — update persona
  const personaPutMatch = urlPath.match(/^\/api\/voice\/personas\/([0-9a-f-]+)$/i);
  if (req.method === 'PUT' && personaPutMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('voice_personas_update:' + auth.user.id, 10)) {
      json(res, 429, { success: false, error: 'Rate limit exceeded. Please wait a minute.' });
      return;
    }
    try {
      const body = await readBody(req);
      const result = await voiceAnalyzer.handleUpdatePersona(auth.user.id, personaPutMatch[1], body);
      json(res, 200, { success: true, data: result });
    } catch (e) {
      const status = e.message === 'Persona not found' ? 404 : 400;
      logger.error('voice_persona_update_error', { userId: auth.user.id, personaId: personaPutMatch[1], error: e.message });
      json(res, status, { success: false, error: e.message });
    }
    return;
  }

  // DELETE /api/voice/personas/:id — delete persona
  const personaDeleteMatch = urlPath.match(/^\/api\/voice\/personas\/([0-9a-f-]+)$/i);
  if (req.method === 'DELETE' && personaDeleteMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('voice_personas_delete:' + auth.user.id, 5)) {
      json(res, 429, { success: false, error: 'Rate limit exceeded. Please wait a minute.' });
      return;
    }
    try {
      const result = await voiceAnalyzer.handleDeletePersona(auth.user.id, personaDeleteMatch[1]);
      json(res, 200, { success: true, data: result });
    } catch (e) {
      const status = e.message.includes('Cannot delete') ? 409 : e.message === 'Persona not found' ? 404 : 500;
      logger.error('voice_persona_delete_error', { userId: auth.user.id, personaId: personaDeleteMatch[1], error: e.message });
      json(res, status, { success: false, error: e.message });
    }
    return;
  }

  // POST /api/voice/analyze — trigger corpus analysis for a site
  if (req.method === 'POST' && urlPath === '/api/voice/analyze') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    try {
      const body = await readBody(req);
      const result = await voiceAnalyzer.handleAnalyzeTrigger(auth.user.id, body);
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('voice_analyze_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 400, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/voice/corpus/:userId — get corpus analysis status
  const corpusStatusMatch = urlPath.match(/^\/api\/voice\/corpus\/([0-9a-f-]+)$/i);
  if (req.method === 'GET' && corpusStatusMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const targetUserId = corpusStatusMatch[1];
    // Users can only view their own corpus status
    if (targetUserId !== auth.user.id) {
      json(res, 403, { success: false, error: 'Access denied' });
      return;
    }
    try {
      const result = await voiceAnalyzer.handleCorpusStatus(targetUserId);
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('voice_corpus_status_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/voice/match/:articleId — score article against user's default persona voice profile
  const voiceMatchMatch = urlPath.match(/^\/api\/voice\/match\/([a-zA-Z0-9_-]+)$/);
  if (req.method === 'GET' && voiceMatchMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('voice_match:' + auth.user.id, 20)) {
      json(res, 429, { success: false, error: 'Rate limit exceeded. Please wait a minute.' });
      return;
    }
    try {
      const articleId = voiceMatchMatch[1];
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const personaId = url.searchParams.get('persona_id') || null;
      const result = await voiceAnalyzer.handleVoiceMatch(auth.user.id, articleId, personaId);
      json(res, 200, { success: true, data: result });
    } catch (e) {
      const status = e.message.includes('not found') ? 404 : e.message.includes('No persona') ? 400 : 500;
      logger.error('voice_match_endpoint_error', { userId: auth.user.id, articleId: voiceMatchMatch[1], error: e.message });
      json(res, status, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/publish/payload/:articleId — assemble universal article payload for cross-platform publishing
  const publishPayloadMatch = urlPath.match(/^\/api\/publish\/payload\/([0-9a-f-]+)$/i);
  if (req.method === 'GET' && publishPayloadMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const articleId = publishPayloadMatch[1];
    if (!UUID_RE.test(articleId)) { json(res, 400, { success: false, error: 'Invalid article ID' }); return; }
    if (!checkRateLimit('publish_payload:' + auth.user.id, 20)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const article = await supabase.getArticle(auth.token, articleId);
      if (!article) { json(res, 404, { success: false, error: 'Article not found' }); return; }

      const html = article.html_content || article.content || '';
      const keyword = article.keyword || article.topic || '';
      const title = article.title || '';
      const metaDescription = article.meta_description || '';

      // Compute quality data
      let qualityData = null;
      try {
        const checklist = qualityGate.runChecklist(html, keyword, { title, metaDescription });
        const eeat = qualityGate.runEEATScoring(html, keyword);
        const sevenSignals = computeSevenSignals({}, checklist, eeat);
        qualityData = { checklist, eeat, sevenSignals };
      } catch (qe) {
        logger.warn('publish_payload_quality_error', { articleId, error: qe.message });
      }

      // Parse format from query string
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const format = ['wordpress', 'shopify', 'ghost', 'contentful', 'strapi', 'webflow', 'webhook', 'generic'].includes(url.searchParams.get('format'))
        ? url.searchParams.get('format')
        : 'generic';

      const { payload, validation } = await payloadAssembler.assemblePayload(article, {
        format,
        qualityData,
        voiceProfile: null,
        uploader: null, // No CDN upload by default; caller can configure via separate endpoint
        categories: url.searchParams.get('categories') ? url.searchParams.get('categories').split(',').map(s => s.trim()) : null,
        tags: url.searchParams.get('tags') ? url.searchParams.get('tags').split(',').map(s => s.trim()) : null
      });

      json(res, 200, {
        success: true,
        data: {
          articleId,
          format,
          payload,
          validation
        }
      });
    } catch (e) {
      logger.error('publish_payload_endpoint_error', { userId: auth.user.id, articleId, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // POST /api/publish/shopify/:articleId — publish article to Shopify blog
  const shopifyPublishMatch = urlPath.match(/^\/api\/publish\/shopify\/([0-9a-f-]+)$/i);
  if (req.method === 'POST' && shopifyPublishMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const articleId = shopifyPublishMatch[1];
    if (!UUID_RE.test(articleId)) { json(res, 400, { success: false, error: 'Invalid article ID' }); return; }
    if (!checkRateLimit('shopify_publish:' + auth.user.id, 10)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const body = await readBody(req);
      const article = await supabase.getArticle(auth.token, articleId);
      if (!article) { json(res, 404, { success: false, error: 'Article not found' }); return; }

      // Resolve Shopify credentials
      const { shopDomain, accessToken } = await shopifyPublisher.resolveCredentials(keyManager, auth.user.id);

      // Assemble payload in Shopify format
      const { payload, validation } = await payloadAssembler.assemblePayload(article, {
        format: 'shopify',
        qualityData: null,
        uploader: null,
        categories: body.categories || null,
        tags: body.tags || null
      });

      if (!validation.valid) {
        json(res, 422, { success: false, error: 'Payload validation failed', details: validation.errors });
        return;
      }

      // Publish to Shopify
      const result = await shopifyPublisher.createArticle({
        shopDomain,
        accessToken,
        payload,
        blogId: body.blog_id || null,
        products: body.products || [],
        published: body.published !== undefined ? !!body.published : false
      });

      json(res, 201, { success: true, data: result });
    } catch (e) {
      const status = e.message.includes('credentials not configured') ? 422
        : e.message.includes('not found') ? 404
        : 500;
      logger.error('shopify_publish_endpoint_error', { userId: auth.user.id, articleId, error: e.message });
      json(res, status, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/publish/shopify/status — check Shopify connection and store info
  if (req.method === 'GET' && urlPath === '/api/publish/shopify/status') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('shopify_status:' + auth.user.id, 20)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const { shopDomain, accessToken } = await shopifyPublisher.resolveCredentials(keyManager, auth.user.id);
      const statusInfo = await shopifyPublisher.checkStatus(shopDomain, accessToken);
      json(res, 200, { success: true, data: statusInfo });
    } catch (e) {
      const status = e.message.includes('credentials not configured') ? 422 : 500;
      logger.error('shopify_status_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, status, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/publish/shopify/blogs — list available Shopify blogs
  if (req.method === 'GET' && urlPath === '/api/publish/shopify/blogs') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('shopify_blogs:' + auth.user.id, 20)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const { shopDomain, accessToken } = await shopifyPublisher.resolveCredentials(keyManager, auth.user.id);
      const blogs = await shopifyPublisher.listBlogs(shopDomain, accessToken);
      json(res, 200, { success: true, data: { blogs } });
    } catch (e) {
      const status = e.message.includes('credentials not configured') ? 422 : 500;
      logger.error('shopify_blogs_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, status, { success: false, error: e.message });
    }
    return;
  }

  // ── GHOST PUBLISHING ENDPOINTS ────────────────────────────────────

  // POST /api/publish/ghost/:articleId — publish article to Ghost
  const ghostPublishMatch = urlPath.match(/^\/api\/publish\/ghost\/([0-9a-f-]+)$/i);
  if (req.method === 'POST' && ghostPublishMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const articleId = ghostPublishMatch[1];
    if (!UUID_RE.test(articleId)) { json(res, 400, { success: false, error: 'Invalid article ID' }); return; }
    if (!checkRateLimit('ghost_publish:' + auth.user.id, 10)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const body = await readBody(req);
      const article = await supabase.getArticle(auth.token, articleId);
      if (!article) { json(res, 404, { success: false, error: 'Article not found' }); return; }

      const { apiUrl, adminApiKey } = await ghostPublisher.resolveCredentials(keyManager, auth.user.id);

      const { payload, validation } = await payloadAssembler.assemblePayload(article, {
        format: 'ghost',
        qualityData: null,
        categories: body.categories || null,
        tags: body.tags || null
      });

      if (!validation.valid) {
        json(res, 422, { success: false, error: 'Payload validation failed', details: validation.errors });
        return;
      }

      const result = await ghostPublisher.publishToGhost({
        payload,
        apiUrl,
        adminApiKey,
        options: {
          status: body.status || 'draft',
          featured: !!body.featured,
          existingPostId: body.existingPostId || null,
          visibility: body.visibility || 'public'
        }
      });

      json(res, result.success ? 201 : 502, { success: result.success, data: result });
    } catch (e) {
      const status = e.message.includes('credentials not configured') ? 422
        : e.message.includes('not found') ? 404
        : 500;
      logger.error('ghost_publish_endpoint_error', { userId: auth.user.id, articleId, error: e.message });
      json(res, status, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/publish/ghost/status — check Ghost connection
  if (req.method === 'GET' && urlPath === '/api/publish/ghost/status') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('ghost_status:' + auth.user.id, 20)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const { apiUrl, adminApiKey } = await ghostPublisher.resolveCredentials(keyManager, auth.user.id);
      const statusInfo = await ghostPublisher.checkStatus(apiUrl, adminApiKey);
      json(res, 200, { success: true, data: statusInfo });
    } catch (e) {
      const status = e.message.includes('credentials not configured') ? 422 : 500;
      logger.error('ghost_status_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, status, { success: false, error: e.message });
    }
    return;
  }

  // ── CONTENTFUL PUBLISHING ENDPOINTS ──────────────────────────────

  // POST /api/publish/contentful/:articleId — publish article to Contentful
  const contentfulPublishMatch = urlPath.match(/^\/api\/publish\/contentful\/([0-9a-f-]+)$/i);
  if (req.method === 'POST' && contentfulPublishMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const articleId = contentfulPublishMatch[1];
    if (!UUID_RE.test(articleId)) { json(res, 400, { success: false, error: 'Invalid article ID' }); return; }
    if (!checkRateLimit('contentful_publish:' + auth.user.id, 10)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const body = await readBody(req);
      const article = await supabase.getArticle(auth.token, articleId);
      if (!article) { json(res, 404, { success: false, error: 'Article not found' }); return; }

      const { spaceId, environmentId, accessToken } = await contentfulPublisher.resolveCredentials(keyManager, auth.user.id);

      const { payload, validation } = await payloadAssembler.assemblePayload(article, {
        format: 'generic',
        qualityData: null,
        categories: body.categories || null,
        tags: body.tags || null
      });

      if (!validation.valid) {
        json(res, 422, { success: false, error: 'Payload validation failed', details: validation.errors });
        return;
      }

      const result = await contentfulPublisher.publishToContentful({
        payload,
        spaceId,
        environmentId,
        accessToken,
        options: {
          contentTypeId: body.contentTypeId || 'blogPost',
          locale: body.locale || 'en-US',
          publish: !!body.publish,
          existingEntryId: body.existingEntryId || null,
          fieldMapping: body.fieldMapping || {}
        }
      });

      json(res, result.success ? 201 : 502, { success: result.success, data: result });
    } catch (e) {
      const status = e.message.includes('credentials not configured') ? 422
        : e.message.includes('not found') ? 404
        : 500;
      logger.error('contentful_publish_endpoint_error', { userId: auth.user.id, articleId, error: e.message });
      json(res, status, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/publish/contentful/status — check Contentful connection
  if (req.method === 'GET' && urlPath === '/api/publish/contentful/status') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('contentful_status:' + auth.user.id, 20)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const { spaceId, accessToken } = await contentfulPublisher.resolveCredentials(keyManager, auth.user.id);
      const statusInfo = await contentfulPublisher.checkStatus(spaceId, accessToken);
      json(res, 200, { success: true, data: statusInfo });
    } catch (e) {
      const status = e.message.includes('credentials not configured') ? 422 : 500;
      logger.error('contentful_status_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, status, { success: false, error: e.message });
    }
    return;
  }

  // ── STRAPI PUBLISHING ENDPOINTS ──────────────────────────────────

  // POST /api/publish/strapi/:articleId — publish article to Strapi
  const strapiPublishMatch = urlPath.match(/^\/api\/publish\/strapi\/([0-9a-f-]+)$/i);
  if (req.method === 'POST' && strapiPublishMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const articleId = strapiPublishMatch[1];
    if (!UUID_RE.test(articleId)) { json(res, 400, { success: false, error: 'Invalid article ID' }); return; }
    if (!checkRateLimit('strapi_publish:' + auth.user.id, 10)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const body = await readBody(req);
      const article = await supabase.getArticle(auth.token, articleId);
      if (!article) { json(res, 404, { success: false, error: 'Article not found' }); return; }

      const { baseUrl, apiToken } = await strapiPublisher.resolveCredentials(keyManager, auth.user.id);

      const { payload, validation } = await payloadAssembler.assemblePayload(article, {
        format: 'generic',
        qualityData: null,
        categories: body.categories || null,
        tags: body.tags || null
      });

      if (!validation.valid) {
        json(res, 422, { success: false, error: 'Payload validation failed', details: validation.errors });
        return;
      }

      const result = await strapiPublisher.publishToStrapi({
        payload,
        baseUrl,
        apiToken,
        options: {
          collection: body.collection || 'articles',
          publish: !!body.publish,
          existingEntryId: body.existingEntryId || null,
          fieldMapping: body.fieldMapping || {}
        }
      });

      json(res, result.success ? 201 : 502, { success: result.success, data: result });
    } catch (e) {
      const status = e.message.includes('credentials not configured') ? 422
        : e.message.includes('not found') ? 404
        : 500;
      logger.error('strapi_publish_endpoint_error', { userId: auth.user.id, articleId, error: e.message });
      json(res, status, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/publish/strapi/status — check Strapi connection
  if (req.method === 'GET' && urlPath === '/api/publish/strapi/status') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('strapi_status:' + auth.user.id, 20)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const { baseUrl, apiToken } = await strapiPublisher.resolveCredentials(keyManager, auth.user.id);
      const statusInfo = await strapiPublisher.checkStatus(baseUrl, apiToken);
      json(res, 200, { success: true, data: statusInfo });
    } catch (e) {
      const status = e.message.includes('credentials not configured') ? 422 : 500;
      logger.error('strapi_status_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, status, { success: false, error: e.message });
    }
    return;
  }

  // ── WEBFLOW PUBLISHING ENDPOINTS ─────────────────────────────────

  // POST /api/publish/webflow/:articleId — publish article to Webflow
  const webflowPublishMatch = urlPath.match(/^\/api\/publish\/webflow\/([0-9a-f-]+)$/i);
  if (req.method === 'POST' && webflowPublishMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const articleId = webflowPublishMatch[1];
    if (!UUID_RE.test(articleId)) { json(res, 400, { success: false, error: 'Invalid article ID' }); return; }
    if (!checkRateLimit('webflow_publish:' + auth.user.id, 10)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const body = await readBody(req);
      const article = await supabase.getArticle(auth.token, articleId);
      if (!article) { json(res, 404, { success: false, error: 'Article not found' }); return; }

      const { collectionId: defaultCollectionId, apiToken } = await webflowPublisher.resolveCredentials(keyManager, auth.user.id);
      const collectionId = body.collectionId || defaultCollectionId;
      if (!collectionId) {
        json(res, 400, { success: false, error: 'collectionId is required (provide in request body or configure webflow_collection_id)' });
        return;
      }

      const { payload, validation } = await payloadAssembler.assemblePayload(article, {
        format: 'generic',
        qualityData: null,
        categories: body.categories || null,
        tags: body.tags || null
      });

      if (!validation.valid) {
        json(res, 422, { success: false, error: 'Payload validation failed', details: validation.errors });
        return;
      }

      const result = await webflowPublisher.publishToWebflow({
        payload,
        collectionId,
        apiToken,
        options: {
          publish: !!body.publish,
          existingItemId: body.existingItemId || null,
          fieldMapping: body.fieldMapping || {}
        }
      });

      json(res, result.success ? 201 : 502, { success: result.success, data: result });
    } catch (e) {
      const status = e.message.includes('credentials not configured') ? 422
        : e.message.includes('not found') ? 404
        : 500;
      logger.error('webflow_publish_endpoint_error', { userId: auth.user.id, articleId, error: e.message });
      json(res, status, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/publish/webflow/status — check Webflow connection
  if (req.method === 'GET' && urlPath === '/api/publish/webflow/status') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('webflow_status:' + auth.user.id, 20)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const { siteId, apiToken } = await webflowPublisher.resolveCredentials(keyManager, auth.user.id);
      const statusInfo = await webflowPublisher.checkStatus(siteId, apiToken);
      json(res, 200, { success: true, data: statusInfo });
    } catch (e) {
      const status = e.message.includes('credentials not configured') ? 422 : 500;
      logger.error('webflow_status_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, status, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/publish/webflow/collections — list Webflow collections
  if (req.method === 'GET' && urlPath === '/api/publish/webflow/collections') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('webflow_collections:' + auth.user.id, 20)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const { siteId, apiToken } = await webflowPublisher.resolveCredentials(keyManager, auth.user.id);
      if (!siteId) {
        json(res, 400, { success: false, error: 'webflow_site_id is required to list collections' });
        return;
      }
      const collections = await webflowPublisher.listCollections(siteId, apiToken);
      json(res, 200, { success: true, data: { collections } });
    } catch (e) {
      const status = e.message.includes('credentials not configured') ? 422 : 500;
      logger.error('webflow_collections_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, status, { success: false, error: e.message });
    }
    return;
  }

  // ── WEBHOOK PUBLISHING ENDPOINTS ─────────────────────────────────

  // POST /api/publish/webhook/:articleId — publish article via webhook
  const webhookPublishMatch = urlPath.match(/^\/api\/publish\/webhook\/([0-9a-f-]+)$/i);
  if (req.method === 'POST' && webhookPublishMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const articleId = webhookPublishMatch[1];
    if (!UUID_RE.test(articleId)) { json(res, 400, { success: false, error: 'Invalid article ID' }); return; }
    if (!checkRateLimit('webhook_publish:' + auth.user.id, 10)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const body = await readBody(req);
      const article = await supabase.getArticle(auth.token, articleId);
      if (!article) { json(res, 404, { success: false, error: 'Article not found' }); return; }

      // Allow webhook URL from request body or key-manager
      let webhookUrl = body.webhookUrl;
      let webhookSecret = body.webhookSecret || null;

      if (!webhookUrl) {
        const resolved = await webhookPublisher.resolveCredentials(keyManager, auth.user.id);
        webhookUrl = resolved.webhookUrl;
        webhookSecret = webhookSecret || resolved.webhookSecret;
      }

      const { payload, validation } = await payloadAssembler.assemblePayload(article, {
        format: 'generic',
        qualityData: null,
        categories: body.categories || null,
        tags: body.tags || null
      });

      if (!validation.valid) {
        json(res, 422, { success: false, error: 'Payload validation failed', details: validation.errors });
        return;
      }

      const result = await webhookPublisher.publishViaWebhook({
        payload,
        webhookUrl,
        webhookSecret,
        options: {
          extraHeaders: body.extraHeaders || {},
          extraData: body.extraData || {},
          event: body.event || 'article.published'
        }
      });

      json(res, result.success ? 200 : 502, { success: result.success, data: result });
    } catch (e) {
      const status = e.message.includes('not configured') ? 422
        : e.message.includes('not found') ? 404
        : 500;
      logger.error('webhook_publish_endpoint_error', { userId: auth.user.id, articleId, error: e.message });
      json(res, status, { success: false, error: e.message });
    }
    return;
  }

  // ── WORDPRESS PUBLISHING ENDPOINTS ──────────────────────────────

  // POST /api/publish/wordpress/connections — save a WordPress connection
  if (req.method === 'POST' && urlPath === '/api/publish/wordpress/connections') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('wp_connection_save:' + auth.user.id, 10)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const body = await readBody(req);
      const result = await wordpressPublisher.saveConnection(supabase, auth.token, auth.user.id, body);
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('wp_connection_save_error', { userId: auth.user.id, error: e.message });
      json(res, 400, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/publish/wordpress/connections — list WordPress connections
  if (req.method === 'GET' && urlPath === '/api/publish/wordpress/connections') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('wp_connection_list:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const connections = await wordpressPublisher.listConnections(supabase, auth.user.id);
      json(res, 200, { success: true, data: connections });
    } catch (e) {
      logger.error('wp_connection_list_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // POST /api/publish/wordpress/connections/:id/validate — validate a WordPress connection
  const wpValidateMatch = urlPath.match(/^\/api\/publish\/wordpress\/connections\/([0-9a-f-]+)\/validate$/i);
  if (req.method === 'POST' && wpValidateMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const connectionId = wpValidateMatch[1];
    if (!UUID_RE.test(connectionId)) { json(res, 400, { success: false, error: 'Invalid connection ID' }); return; }
    if (!checkRateLimit('wp_connection_validate:' + auth.user.id, 5)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const result = await wordpressPublisher.validateConnection(supabase, auth.user.id, connectionId);
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('wp_connection_validate_error', { userId: auth.user.id, error: e.message });
      json(res, 400, { success: false, error: e.message });
    }
    return;
  }

  // DELETE /api/publish/wordpress/connections/:id — delete a WordPress connection
  const wpDeleteConnMatch = urlPath.match(/^\/api\/publish\/wordpress\/connections\/([0-9a-f-]+)$/i);
  if (req.method === 'DELETE' && wpDeleteConnMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const connectionId = wpDeleteConnMatch[1];
    if (!UUID_RE.test(connectionId)) { json(res, 400, { success: false, error: 'Invalid connection ID' }); return; }
    try {
      await wordpressPublisher.deleteConnection(supabase, auth.user.id, connectionId);
      json(res, 200, { success: true, data: { deleted: true } });
    } catch (e) {
      logger.error('wp_connection_delete_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // POST /api/publish/wordpress/:articleId — publish article to WordPress
  const wpPublishMatch = urlPath.match(/^\/api\/publish\/wordpress\/([0-9a-f-]+)$/i);
  if (req.method === 'POST' && wpPublishMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const articleId = wpPublishMatch[1];
    if (!UUID_RE.test(articleId)) { json(res, 400, { success: false, error: 'Invalid article ID' }); return; }
    if (!checkRateLimit('wp_publish:' + auth.user.id, 10)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const body = await readBody(req);
      const connectionId = body.connectionId;
      if (!connectionId || !UUID_RE.test(connectionId)) {
        json(res, 400, { success: false, error: 'connectionId is required' });
        return;
      }

      // Get connection + credentials
      const connData = await wordpressPublisher.getConnection(supabase, auth.user.id, connectionId);
      if (!connData) {
        json(res, 404, { success: false, error: 'WordPress connection not found' });
        return;
      }
      if (connData.connection.status !== 'active') {
        json(res, 400, { success: false, error: 'Connection is not validated. Please validate it first.' });
        return;
      }

      // Get article
      const article = await supabase.getArticle(auth.token, articleId);
      if (!article) {
        json(res, 404, { success: false, error: 'Article not found' });
        return;
      }

      // Assemble payload
      const html = article.html_content || article.content || '';
      const keyword = article.keyword || article.topic || '';
      const title = article.title || '';
      const metaDescription = article.meta_description || '';

      let qualityData = null;
      try {
        const checklist = qualityGate.runChecklist(html, keyword, { title, metaDescription });
        const eeat = qualityGate.runEEATScoring(html, keyword);
        const sevenSignals = computeSevenSignals({}, checklist, eeat);
        qualityData = { checklist, eeat, sevenSignals };
      } catch (qe) {
        logger.warn('wp_publish_quality_error', { articleId, error: qe.message });
      }

      const { payload, validation } = await payloadAssembler.assemblePayload(article, {
        format: 'wordpress',
        qualityData,
        categories: body.categories || null,
        tags: body.tags || null
      });

      // Publish
      const publishResult = await wordpressPublisher.publishToWordPress({
        payload,
        siteUrl: connData.connection.site_url,
        credentials: connData.credentials,
        options: {
          status: body.status || 'draft',
          seoPlugin: body.seoPlugin || 'yoast',
          uploadFeaturedImage: body.uploadFeaturedImage !== false,
          customFields: body.customFields || {},
          existingPostId: body.existingPostId || null
        }
      });

      // Update last_sync on connection
      if (publishResult.success) {
        try {
          const config = supabase.loadConfig();
          const serviceRoleKey = supabase.getServiceRoleKey();
          if (config && serviceRoleKey) {
            await fetch(
              `${config.url}/rest/v1/platform_connections?id=eq.${connectionId}`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': serviceRoleKey,
                  'Authorization': `Bearer ${serviceRoleKey}`
                },
                body: JSON.stringify({ last_sync: new Date().toISOString() })
              }
            );
          }
        } catch (syncErr) {
          logger.warn('wp_publish_sync_update_failed', { error: syncErr.message });
        }
      }

      json(res, publishResult.success ? 200 : 502, {
        success: publishResult.success,
        data: publishResult
      });
    } catch (e) {
      logger.error('wp_publish_endpoint_error', { userId: auth.user.id, articleId, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/publish/wordpress/status/:connectionId/:postId — check post status on WordPress
  const wpStatusMatch = urlPath.match(/^\/api\/publish\/wordpress\/status\/([0-9a-f-]+)\/(\d+)$/i);
  if (req.method === 'GET' && wpStatusMatch) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const connectionId = wpStatusMatch[1];
    const postId = parseInt(wpStatusMatch[2], 10);
    if (!UUID_RE.test(connectionId)) { json(res, 400, { success: false, error: 'Invalid connection ID' }); return; }
    if (!checkRateLimit('wp_status:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const connData = await wordpressPublisher.getConnection(supabase, auth.user.id, connectionId);
      if (!connData) {
        json(res, 404, { success: false, error: 'WordPress connection not found' });
        return;
      }
      const status = await wordpressPublisher.getPostStatus(
        connData.connection.site_url, postId, connData.credentials
      );
      json(res, 200, { success: true, data: status });
    } catch (e) {
      logger.error('wp_status_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // ── SCORING WEIGHT RECALIBRATION ENDPOINTS ──────────────────────

  // POST /api/recalibration/run — trigger a recalibration cycle
  if (req.method === 'POST' && urlPath === '/api/recalibration/run') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('recalibration_run:' + auth.user.id, 3)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const body = await readBody(req).catch(() => ({}));
      const result = await recalibration.handleRun(auth.user.id, body);
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('recalibration_run_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/recalibration/history — fetch weight change history
  if (req.method === 'GET' && urlPath === '/api/recalibration/history') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('recalibration_history:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const query = {
        type: url.searchParams.get('type') || '',
        limit: url.searchParams.get('limit') || '50'
      };
      const result = await recalibration.handleHistory(auth.user.id, query);
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('recalibration_history_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/recalibration/current-weights — get current effective weights
  if (req.method === 'GET' && urlPath === '/api/recalibration/current-weights') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    if (!checkRateLimit('recalibration_weights:' + auth.user.id, 30)) {
      json(res, 429, { success: false, error: 'Too many requests. Please wait a minute.' });
      return;
    }
    try {
      const result = recalibration.handleCurrentWeights(auth.user.id);
      json(res, 200, { success: true, data: result });
    } catch (e) {
      logger.error('recalibration_weights_endpoint_error', { userId: auth.user.id, error: e.message });
      json(res, 500, { success: false, error: e.message });
    }
    return;
  }

  json(res, 404, { error: 'Not found' });

  } catch (err) {
    logger.error('unhandled_request_error', { error: err.message, stack: err.stack });
    if (!res.writableEnded) {
      json(res, 500, { status: 'error', error: 'Internal server error' });
    }
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('');
    console.error('  Port ' + PORT + ' is already in use. Is the bridge already running?');
    console.error('  Run /stop-bridge first, or set BRIDGE_PORT to use a different port.');
    console.error('');
  } else {
    console.error('  Server error:', err.message);
  }
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  // Write PID file after successful bind
  try { fs.writeFileSync(pidFile, process.pid.toString()); } catch (e) { console.error('[bridge] Failed to write PID file:', e.message); }
  const config = supabase.loadConfig();
  console.log('');
  console.log('  Article Engine Bridge Server');
  console.log('  ────────────────────────────');
  console.log('  URL:     http://127.0.0.1:' + PORT);
  console.log('  Project: ' + PROJECT_DIR);
  console.log('  Auth:    ' + (config ? 'Supabase ✓' : 'Not configured'));
  console.log('  Status:  Ready for section edits');
  console.log('');
  console.log('  Press Ctrl+C to stop.');
  console.log('');

  // Validate Google OAuth config on startup (warn if missing)
  oauth.validateConfigOnStartup();

  // Start the automated scheduler
  scheduler.start().catch(e => {
    logger.error('scheduler_start_failed', { error: e.message });
  });
});

// Graceful shutdown
async function cleanup() {
  try { fs.unlinkSync(pidFile); } catch (e) {}
  // Stop scheduler gracefully (waits for running jobs)
  await scheduler.stop().catch(e => {
    logger.error('scheduler_stop_error', { error: e.message });
  });
  server.close();
  process.exit(0);
}

process.on('SIGTERM', () => cleanup());
process.on('SIGINT', () => cleanup());
