/**
 * Supabase REST API Client for Article Engine Bridge Server
 *
 * Uses direct HTTP calls to Supabase — no npm dependencies required.
 * Requires Node.js 18+ for built-in fetch.
 */

const fs = require('fs');
const path = require('path');

let _config = null;
let _configMtime = 0;

// Default Supabase config (public anon key — safe to embed, RLS-protected).
// Used as fallback when env vars and .supabase.json are both missing.
const DEFAULT_CONFIG = {
  url: 'https://vyljszbmbortwhbzqywj.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5bGpzemJtYm9ydHdoYnpxeXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTQxNTEsImV4cCI6MjA4OTE3MDE1MX0.sAyfmC2LXpJ9OlxibY0VOGxsety9U8s4QTitw5J7U7Q'
};

/**
 * Load Supabase config.
 * Priority: env vars > .supabase.json > DEFAULT_CONFIG
 */
function loadConfig() {
  // Prefer env vars
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    _config = { url: process.env.SUPABASE_URL, anonKey: process.env.SUPABASE_ANON_KEY };
    return _config;
  }

  // Fall back to config file
  const configPath = path.join(__dirname, '..', 'config', '.supabase.json');
  try {
    const stat = fs.statSync(configPath);
    if (_config && stat.mtimeMs === _configMtime) return _config;
    _config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    _configMtime = stat.mtimeMs;
  } catch (e) {
    _config = DEFAULT_CONFIG;
  }
  return _config;
}

/**
 * Sign up a new user
 */
async function signUp(email, password) {
  const config = loadConfig();
  if (!config) throw new Error('Authentication service unavailable. Please try again later.');

  const res = await fetch(`${config.url}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.anonKey
    },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Unable to create account. Please try a different email.');
  return data;
}

/**
 * Sign in with email and password
 */
async function signIn(email, password) {
  const config = loadConfig();
  if (!config) throw new Error('Authentication service unavailable. Please try again later.');

  const res = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.anonKey
    },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Invalid email or password.');
  return data;
}

/**
 * Verify an access token and return the user
 */
async function verifyToken(token) {
  const config = loadConfig();
  if (!config) return null;

  try {
    const res = await fetch(`${config.url}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': config.anonKey
      }
    });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    console.error('[supabase] Token verification failed:', e.message);
    return null;
  }
}

/**
 * Get subscription status for a user
 */
async function getSubscription(token, userId) {
  const config = loadConfig();
  if (!config) return null;

  try {
    const res = await fetch(
      `${config.url}/rest/v1/subscriptions?user_id=eq.${userId}&select=*`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': config.anonKey
        }
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0] || null;
  } catch (e) {
    console.error('[supabase] getSubscription failed:', e.message);
    return null;
  }
}

/**
 * Log a usage event (generate or edit)
 */
async function logUsage(token, userId, action, articleFile) {
  const config = loadConfig();
  if (!config) return false;

  const res = await fetch(`${config.url}/rest/v1/usage_logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': config.anonKey,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      user_id: userId,
      action,
      article_file: articleFile || null
    })
  });
  return res.ok;
}

/**
 * Count today's usage for a user
 */
async function getTodayUsageCount(token, userId, action) {
  const config = loadConfig();
  if (!config) return 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const res = await fetch(
    `${config.url}/rest/v1/usage_logs?user_id=eq.${userId}&action=eq.${action}&created_at=gte.${todayStart.toISOString()}&select=id`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': config.anonKey,
        'Prefer': 'count=exact'
      }
    }
  );
  if (!res.ok) return 0;
  const count = res.headers.get('content-range');
  if (count) {
    const match = count.match(/\/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
  const rows = await res.json();
  return rows.length;
}

// ── DASHBOARD DATA FUNCTIONS (user-scoped, RLS-protected) ──

/**
 * List articles for the authenticated user (paginated, filterable)
 * @param {string} token - User's access token
 * @param {object} params - { page, limit, status, search, sort, order }
 */
async function listArticles(token, params = {}) {
  const config = loadConfig();
  if (!config) return { data: [], total: 0 };

  const page = Math.max(1, parseInt(params.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit) || 20));
  const offset = (page - 1) * limit;
  const sort = params.sort || 'created_at';
  const order = params.order === 'asc' ? 'asc' : 'desc';

  let url = `${config.url}/rest/v1/articles?select=*&order=${sort}.${order}&limit=${limit}&offset=${offset}`;

  if (params.status) {
    url += `&status=eq.${encodeURIComponent(params.status)}`;
  }
  if (params.search) {
    url += `&or=(title.ilike.*${encodeURIComponent(params.search)}*,topic.ilike.*${encodeURIComponent(params.search)}*)`;
  }

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': config.anonKey,
      'Prefer': 'count=exact'
    }
  });
  if (!res.ok) return { data: [], total: 0 };

  const data = await res.json();
  const range = res.headers.get('content-range');
  let total = data.length;
  if (range) {
    const match = range.match(/\/(\d+)/);
    if (match) total = parseInt(match[1], 10);
  }

  return { data, total, page, limit };
}

/**
 * Get a single article by ID
 */
async function getArticle(token, articleId) {
  const config = loadConfig();
  if (!config) return null;

  const res = await fetch(
    `${config.url}/rest/v1/articles?id=eq.${articleId}&select=*`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': config.anonKey
      }
    }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

/**
 * Create a new article
 */
async function createArticle(token, data) {
  const config = loadConfig();
  if (!config) throw new Error('Database unavailable');

  const res = await fetch(`${config.url}/rest/v1/articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': config.anonKey,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create article');
  }
  const rows = await res.json();
  return rows[0];
}

/**
 * Update an article's metadata
 */
async function updateArticle(token, articleId, updates) {
  const config = loadConfig();
  if (!config) throw new Error('Database unavailable');

  // Whitelist safe fields
  const safe = {};
  for (const key of ['title', 'topic', 'language', 'framework', 'status', 'file_path', 'word_count', 'image_count', 'metadata', 'published_at']) {
    if (updates[key] !== undefined) safe[key] = updates[key];
  }
  safe.updated_at = new Date().toISOString();

  const res = await fetch(
    `${config.url}/rest/v1/articles?id=eq.${articleId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': config.anonKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(safe)
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update article');
  }
  const rows = await res.json();
  return rows[0] || null;
}

/**
 * Delete an article (admin only — uses service_role key to bypass RLS)
 */
async function adminDeleteArticle(articleId) {
  const config = loadConfig();
  const serviceRoleKey = getServiceRoleKey();
  if (!config || !serviceRoleKey) throw new Error('Admin config not available');

  const res = await fetch(
    `${config.url}/rest/v1/articles?id=eq.${articleId}`,
    {
      method: 'DELETE',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey,
        'Prefer': 'return=minimal'
      }
    }
  );
  if (!res.ok) throw new Error('Failed to delete article');
}

/**
 * Get version history for an article
 */
async function getArticleVersions(token, articleId) {
  const config = loadConfig();
  if (!config) return [];

  const res = await fetch(
    `${config.url}/rest/v1/article_versions?article_id=eq.${articleId}&select=*&order=version_number.desc`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': config.anonKey
      }
    }
  );
  if (!res.ok) return [];
  return res.json();
}

/**
 * Update an article's HTML content (used by rollback)
 */
async function updateArticleContent(token, articleId, htmlContent) {
  const config = loadConfig();
  if (!config) throw new Error('Database unavailable');

  const res = await fetch(
    `${config.url}/rest/v1/articles?id=eq.${articleId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': config.anonKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ html_content: htmlContent, updated_at: new Date().toISOString() })
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update article content');
  }
  const rows = await res.json();
  return rows[0] || null;
}

/**
 * Create a new article version record
 */
async function createArticleVersion(token, data) {
  const config = loadConfig();
  if (!config) throw new Error('Database unavailable');

  // Use service_role key since article_versions has no INSERT policy for users
  const serviceRoleKey = getServiceRoleKey();
  const authHeader = serviceRoleKey ? `Bearer ${serviceRoleKey}` : `Bearer ${token}`;
  const apiKey = serviceRoleKey || config.anonKey;

  const res = await fetch(`${config.url}/rest/v1/article_versions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
      'apikey': apiKey,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create article version');
  }
  const rows = await res.json();
  return rows[0];
}

/**
 * List pipeline jobs for the authenticated user (paginated)
 */
async function listPipelineJobs(token, params = {}) {
  const config = loadConfig();
  if (!config) return { data: [], total: 0 };

  const page = Math.max(1, parseInt(params.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit) || 20));
  const offset = (page - 1) * limit;

  let url = `${config.url}/rest/v1/pipeline_jobs?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`;

  if (params.status) {
    url += `&status=eq.${encodeURIComponent(params.status)}`;
  }

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': config.anonKey,
      'Prefer': 'count=exact'
    }
  });
  if (!res.ok) return { data: [], total: 0 };

  const data = await res.json();
  const range = res.headers.get('content-range');
  let total = data.length;
  if (range) {
    const match = range.match(/\/(\d+)/);
    if (match) total = parseInt(match[1], 10);
  }

  return { data, total, page, limit };
}

/**
 * Create a pipeline job
 */
async function createPipelineJob(token, data) {
  const config = loadConfig();
  if (!config) throw new Error('Database unavailable');

  const res = await fetch(`${config.url}/rest/v1/pipeline_jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': config.anonKey,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create pipeline job');
  }
  const rows = await res.json();
  return rows[0];
}

/**
 * Update a pipeline job (status, progress, result, error)
 */
async function updatePipelineJob(token, jobId, updates) {
  const config = loadConfig();
  if (!config) throw new Error('Database unavailable');

  const safeUpdates = {};
  if (updates.status) safeUpdates.status = updates.status;
  if (updates.started_at) safeUpdates.started_at = updates.started_at;
  if (updates.completed_at) safeUpdates.completed_at = updates.completed_at;
  if (updates.result) safeUpdates.result = updates.result;
  if (updates.error) safeUpdates.error_message = updates.error;
  if (updates.progress) safeUpdates.progress = updates.progress;

  const res = await fetch(`${config.url}/rest/v1/pipeline_jobs?id=eq.${jobId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': config.anonKey,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(safeUpdates)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update pipeline job');
  }
  const rows = await res.json();
  return rows[0];
}

/**
 * Get analytics overview for the authenticated user
 */
async function getAnalyticsOverview(token, userId) {
  const config = loadConfig();
  if (!config) return null;

  // Fetch counts in parallel
  const headers = {
    'Authorization': `Bearer ${token}`,
    'apikey': config.anonKey,
    'Prefer': 'count=exact'
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [articlesRes, jobsRes, editsRes] = await Promise.all([
    fetch(`${config.url}/rest/v1/articles?select=id&user_id=eq.${userId}`, { headers }),
    fetch(`${config.url}/rest/v1/pipeline_jobs?select=id&user_id=eq.${userId}`, { headers }),
    fetch(`${config.url}/rest/v1/usage_logs?select=id&user_id=eq.${userId}&action=eq.edit&created_at=gte.${todayStart.toISOString()}`, { headers })
  ]);

  function extractCount(res) {
    const range = res.headers.get('content-range');
    if (range) {
      const match = range.match(/\/(\d+)/);
      if (match) return parseInt(match[1], 10);
    }
    return 0;
  }

  return {
    total_articles: extractCount(articlesRes),
    total_jobs: extractCount(jobsRes),
    edits_today: extractCount(editsRes)
  };
}

// ── USER SETTINGS (persistent, Supabase-backed) ──

/**
 * Get user settings from Supabase. Creates default row if missing.
 */
async function getUserSettings(token, userId) {
  const config = loadConfig();
  if (!config) return null;

  const res = await fetch(
    `${config.url}/rest/v1/user_settings?user_id=eq.${userId}&select=*`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': config.anonKey
      }
    }
  );
  if (!res.ok) return null;
  const rows = await res.json();

  if (rows.length > 0) return rows[0];

  // Create default settings row
  const insertRes = await fetch(`${config.url}/rest/v1/user_settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': config.anonKey,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ user_id: userId })
  });
  if (!insertRes.ok) return null;
  const inserted = await insertRes.json();
  return inserted[0] || null;
}

/**
 * Validate settings against plan limits.
 * Throws an Error with a descriptive message if a setting violates the user's plan.
 *
 * @param {object} settings - The settings being saved
 * @param {object} subscription - User's subscription row (with plan field)
 * @returns {void}
 */
function validateSettingsAgainstPlan(settings, subscription) {
  const plan = subscription ? subscription.plan : 'free';
  const defaults = PLAN_DEFAULTS[plan] || PLAN_DEFAULTS.free;

  // Validate preferred_framework is allowed by plan
  if (settings.preferred_framework && settings.preferred_framework !== 'auto') {
    const fw = settings.preferred_framework.toLowerCase();
    if (!defaults.allowed_frameworks.includes(fw)) {
      throw new Error(
        `Framework '${fw}' is not available on your ${plan} plan. ` +
        `Allowed frameworks: ${defaults.allowed_frameworks.join(', ')}. Upgrade to unlock more.`
      );
    }
  }

  // Validate max_images within plan-reasonable bounds (max 10, min 1)
  if (settings.max_images !== undefined) {
    const val = parseInt(settings.max_images, 10);
    if (isNaN(val) || val < 1 || val > 10) {
      throw new Error('max_images must be between 1 and 10.');
    }
  }

  // Validate image_style is a known value
  if (settings.image_style !== undefined) {
    const allowedStyles = ['realistic', 'illustration', 'minimal', 'abstract', 'photo'];
    if (!allowedStyles.includes(settings.image_style)) {
      throw new Error(`Invalid image_style '${settings.image_style}'. Allowed: ${allowedStyles.join(', ')}.`);
    }
  }
}

/**
 * Update user settings. Validates against plan limits before saving.
 * Fetches user's subscription to enforce plan-based constraints.
 */
async function upsertUserSettings(token, userId, settings) {
  const config = loadConfig();
  if (!config) throw new Error('Database unavailable');

  // Fetch subscription for plan-limit validation
  const sub = await getSubscription(token, userId);
  validateSettingsAgainstPlan(settings, sub);

  // Whitelist safe fields
  const safe = {};
  const allowedFields = [
    'preferred_language', 'preferred_framework', 'preferred_css',
    'default_domain', 'rtl_enabled', 'image_style', 'max_images'
  ];
  for (const key of allowedFields) {
    if (settings[key] !== undefined) safe[key] = settings[key];
  }
  safe.updated_at = new Date().toISOString();

  // Try update first
  const res = await fetch(
    `${config.url}/rest/v1/user_settings?user_id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': config.anonKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(safe)
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to save settings');
  }

  const rows = await res.json();
  if (rows.length > 0) return rows[0];

  // Row didn't exist — insert
  safe.user_id = userId;
  const insertRes = await fetch(`${config.url}/rest/v1/user_settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': config.anonKey,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(safe)
  });
  if (!insertRes.ok) throw new Error('Failed to create settings');
  const inserted = await insertRes.json();
  return inserted[0];
}

// ── QUOTA ENFORCEMENT ──

/**
 * Plan defaults for quota limits
 */
const PLAN_DEFAULTS = {
  free:         { articles_per_month: 4,   edits_per_day: 5,   max_languages: 1,  allowed_frameworks: ['html'],                                                        api_keys_enabled: false },
  starter:      { articles_per_month: 50,  edits_per_day: 30,  max_languages: 3,  allowed_frameworks: ['html', 'react', 'vue'],                                        api_keys_enabled: false },
  professional: { articles_per_month: 200, edits_per_day: -1,  max_languages: 11, allowed_frameworks: ['html', 'react', 'vue', 'next', 'svelte', 'astro', 'wordpress'], api_keys_enabled: true },
  enterprise:   { articles_per_month: -1,  edits_per_day: -1,  max_languages: 11, allowed_frameworks: ['html', 'react', 'vue', 'next', 'svelte', 'astro', 'wordpress'], api_keys_enabled: true },
};

/**
 * Get full quota status for a user: usage vs. limits
 */
async function getUserQuota(token, userId) {
  const config = loadConfig();
  if (!config) return null;

  // Get subscription (includes quota columns)
  const sub = await getSubscription(token, userId);
  const plan = sub ? sub.plan : 'free';
  const defaults = PLAN_DEFAULTS[plan] || PLAN_DEFAULTS.free;

  // Quota values from subscription (with plan defaults as fallback)
  const articlesLimit = sub?.articles_per_month ?? defaults.articles_per_month;
  const editsLimit = sub?.edits_per_day ?? defaults.edits_per_day;
  const maxLanguages = sub?.max_languages ?? defaults.max_languages;
  const allowedFrameworks = sub?.allowed_frameworks ?? defaults.allowed_frameworks;
  const apiKeysEnabled = sub?.api_keys_enabled ?? defaults.api_keys_enabled;

  // Apply per-user overrides
  const overrides = sub?.quota_override || {};
  const effectiveArticlesLimit = overrides.articles_per_month ?? articlesLimit;
  const effectiveEditsLimit = overrides.edits_per_day ?? editsLimit;

  // Count usage this month (articles)
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const headers = {
    'Authorization': `Bearer ${token}`,
    'apikey': config.anonKey,
    'Prefer': 'count=exact'
  };

  const [articlesRes, editsRes] = await Promise.all([
    fetch(
      `${config.url}/rest/v1/usage_logs?user_id=eq.${userId}&action=eq.generate&created_at=gte.${monthStart.toISOString()}&select=id`,
      { headers }
    ),
    fetch(
      `${config.url}/rest/v1/usage_logs?user_id=eq.${userId}&action=eq.edit&created_at=gte.${todayStart.toISOString()}&select=id`,
      { headers }
    )
  ]);

  function extractCount(res) {
    const range = res.headers.get('content-range');
    if (range) {
      const match = range.match(/\/(\d+)/);
      if (match) return parseInt(match[1], 10);
    }
    return 0;
  }

  const articlesUsed = extractCount(articlesRes);
  const editsUsed = extractCount(editsRes);

  return {
    plan,
    status: sub?.status || 'pending',
    articles: {
      used: articlesUsed,
      limit: effectiveArticlesLimit,
      remaining: effectiveArticlesLimit === -1 ? -1 : Math.max(0, effectiveArticlesLimit - articlesUsed),
      unlimited: effectiveArticlesLimit === -1
    },
    edits_today: {
      used: editsUsed,
      limit: effectiveEditsLimit,
      remaining: effectiveEditsLimit === -1 ? -1 : Math.max(0, effectiveEditsLimit - editsUsed),
      unlimited: effectiveEditsLimit === -1
    },
    languages: { allowed: maxLanguages, limit: maxLanguages },
    frameworks: { allowed: allowedFrameworks },
    api_keys_enabled: apiKeysEnabled
  };
}

// In-process quota lock to prevent race conditions when multiple
// concurrent requests check+consume quota for the same user.
// Maps `${userId}:${action}` -> Promise that resolves when the
// previous check completes.  This serializes quota checks per-user
// per-action so two near-simultaneous requests can't both pass before
// either logs usage.  For multi-process deployments a database-level
// advisory lock (SELECT ... FOR UPDATE) would be needed; this in-process
// lock is sufficient for the single-process bridge server.
const _quotaLocks = new Map();

async function _withQuotaLock(userId, action, fn) {
  const key = `${userId}:${action}`;
  const prev = _quotaLocks.get(key) || Promise.resolve();
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  _quotaLocks.set(key, gate);
  try {
    await prev;
    return await fn();
  } finally {
    release();
    // Clean up if we're still the latest
    if (_quotaLocks.get(key) === gate) _quotaLocks.delete(key);
  }
}

/**
 * Check if a specific action is allowed by the user's quota.
 * Uses an in-process lock to serialize checks per user+action,
 * preventing race conditions where two simultaneous requests
 * both read the same count and both pass.
 *
 * @param {string} token - User's access token
 * @param {string} userId - User's UUID
 * @param {string} action - 'generate' or 'edit'
 * @returns {Promise<{ allowed: boolean, reason?: string }>}
 */
async function checkQuota(token, userId, action) {
  return _withQuotaLock(userId, action, async () => {
    const quota = await getUserQuota(token, userId);
    if (!quota) return { allowed: false, reason: 'Unable to verify quota' };

    if (quota.status !== 'active') {
      return { allowed: false, reason: 'Subscription not active. Contact admin for approval.' };
    }

    if (action === 'generate') {
      if (quota.articles.unlimited) return { allowed: true };
      if (quota.articles.remaining <= 0) {
        return { allowed: false, reason: `Monthly article limit reached (${quota.articles.limit}). Upgrade your plan for more.` };
      }
      return { allowed: true };
    }

    if (action === 'edit') {
      if (quota.edits_today.unlimited) return { allowed: true };
      if (quota.edits_today.remaining <= 0) {
        return { allowed: false, reason: `Daily edit limit reached (${quota.edits_today.limit}). Try again tomorrow or upgrade.` };
      }
      return { allowed: true };
    }

    return { allowed: true };
  });
}

// ── ADMIN FUNCTIONS (use service_role key from env var) ──

/**
 * Get the service_role key from environment.
 * Returns null if not configured.
 */
function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

/**
 * Make an admin API call using service_role key
 */
async function adminFetch(apiPath, opts = {}) {
  const config = loadConfig();
  const serviceRoleKey = getServiceRoleKey();
  if (!config || !serviceRoleKey) throw new Error('Admin config not available. Set SUPABASE_SERVICE_ROLE_KEY env var.');

  const res = await fetch(config.url + apiPath, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey,
      ...(opts.headers || {})
    }
  });
  if (opts.noBody) return res;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || data.message || 'Admin API error');
  return data;
}

/**
 * Get a subscription using service_role key (for admin privilege checks)
 */
async function adminGetSubscription(userId) {
  const config = loadConfig();
  const serviceRoleKey = getServiceRoleKey();
  if (!config || !serviceRoleKey) return null;

  const res = await fetch(
    config.url + '/rest/v1/subscriptions?user_id=eq.' + userId + '&select=*',
    {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

/**
 * List all users and their subscriptions
 */
async function adminListUsers() {
  const authData = await adminFetch('/auth/v1/admin/users');
  const users = authData.users || [];

  const config = loadConfig();
  const serviceRoleKey = getServiceRoleKey();
  const subRes = await fetch(config.url + '/rest/v1/subscriptions?select=*&order=created_at.desc', {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey
    }
  });
  const subscriptions = await subRes.json();

  return { users, subscriptions: Array.isArray(subscriptions) ? subscriptions : [] };
}

/**
 * Update a user's subscription
 */
async function adminUpdateSubscription(userId, updates) {
  const config = loadConfig();
  const serviceRoleKey = getServiceRoleKey();
  if (!config || !serviceRoleKey) throw new Error('Admin config not available. Set SUPABASE_SERVICE_ROLE_KEY env var.');

  // Whitelist safe fields only — never allow role escalation via this function
  const safeUpdates = {};
  if (updates.status) safeUpdates.status = updates.status;
  if (updates.plan) safeUpdates.plan = updates.plan;
  if (updates.expires_at) safeUpdates.expires_at = updates.expires_at;

  const res = await fetch(config.url + '/rest/v1/subscriptions?user_id=eq.' + userId, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(safeUpdates)
  });
  if (!res.ok) throw new Error('Failed to update subscription');
}

/**
 * Delete a user and their subscription
 */
async function adminDeleteUser(userId) {
  const config = loadConfig();
  const serviceRoleKey = getServiceRoleKey();
  if (!config || !serviceRoleKey) throw new Error('Admin config not available. Set SUPABASE_SERVICE_ROLE_KEY env var.');

  // Delete subscription first
  await fetch(config.url + '/rest/v1/subscriptions?user_id=eq.' + userId, {
    method: 'DELETE',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey,
      'Prefer': 'return=minimal'
    }
  });

  // Delete auth user
  await adminFetch('/auth/v1/admin/users/' + userId, { method: 'DELETE', noBody: true });
}

/**
 * Create a user via admin API (auto-confirmed, auto-activated)
 */
async function adminCreateUser(email, password) {
  const result = await adminFetch('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email, password, email_confirm: true })
  });

  if (!result.id) throw new Error('Failed to create user');

  // Wait for trigger to create subscription, then activate (retry up to 3 times)
  let activated = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    await new Promise(r => setTimeout(r, 500));
    await adminUpdateSubscription(result.id, { status: 'active' });
    // Verify the row was actually updated
    const sub = await adminGetSubscription(result.id);
    if (sub && sub.status === 'active') {
      activated = true;
      break;
    }
  }

  if (!activated) {
    throw new Error('User created but activation failed. Check the subscriptions table manually.');
  }

  return { id: result.id, email: result.email };
}

/**
 * Get recent usage logs (last 50)
 */
async function adminGetUsageLogs() {
  const config = loadConfig();
  const serviceRoleKey = getServiceRoleKey();
  if (!config || !serviceRoleKey) throw new Error('Admin config not available. Set SUPABASE_SERVICE_ROLE_KEY env var.');

  const res = await fetch(config.url + '/rest/v1/usage_logs?select=*&order=created_at.desc&limit=50', {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey
    }
  });
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Admin: update a user's plan and quota limits
 */
async function adminUpdatePlan(userId, planData) {
  const config = loadConfig();
  const serviceRoleKey = getServiceRoleKey();
  if (!config || !serviceRoleKey) throw new Error('Admin config not available. Set SUPABASE_SERVICE_ROLE_KEY env var.');

  const safe = {};
  if (planData.plan) safe.plan = planData.plan;
  if (planData.status) safe.status = planData.status;
  if (planData.articles_per_month !== undefined) safe.articles_per_month = planData.articles_per_month;
  if (planData.edits_per_day !== undefined) safe.edits_per_day = planData.edits_per_day;
  if (planData.max_languages !== undefined) safe.max_languages = planData.max_languages;
  if (planData.allowed_frameworks !== undefined) safe.allowed_frameworks = planData.allowed_frameworks;
  if (planData.api_keys_enabled !== undefined) safe.api_keys_enabled = planData.api_keys_enabled;
  if (planData.quota_override !== undefined) safe.quota_override = planData.quota_override;

  // If changing plan, also apply plan defaults for unset fields
  if (planData.plan && PLAN_DEFAULTS[planData.plan]) {
    const defaults = PLAN_DEFAULTS[planData.plan];
    for (const key of Object.keys(defaults)) {
      if (safe[key] === undefined) safe[key] = defaults[key];
    }
  }

  const res = await fetch(config.url + '/rest/v1/subscriptions?user_id=eq.' + userId, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(safe)
  });
  if (!res.ok) throw new Error('Failed to update plan');
  const rows = await res.json();
  return rows[0] || null;
}

/**
 * Admin: get aggregate quota usage stats across all users
 */
async function adminGetQuotaStats() {
  const config = loadConfig();
  const serviceRoleKey = getServiceRoleKey();
  if (!config || !serviceRoleKey) return null;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const headers = {
    'apikey': serviceRoleKey,
    'Authorization': 'Bearer ' + serviceRoleKey,
    'Prefer': 'count=exact'
  };

  const [genRes, editRes, subsRes] = await Promise.all([
    fetch(`${config.url}/rest/v1/usage_logs?action=eq.generate&created_at=gte.${monthStart.toISOString()}&select=user_id`, { headers }),
    fetch(`${config.url}/rest/v1/usage_logs?action=eq.edit&created_at=gte.${monthStart.toISOString()}&select=user_id`, { headers }),
    fetch(`${config.url}/rest/v1/subscriptions?select=plan,status,articles_per_month`, { headers })
  ]);

  function extractCount(res) {
    const range = res.headers.get('content-range');
    if (range) {
      const match = range.match(/\/(\d+)/);
      if (match) return parseInt(match[1], 10);
    }
    return 0;
  }

  const subs = await subsRes.json().catch(() => []);

  return {
    total_generations_this_month: extractCount(genRes),
    total_edits_this_month: extractCount(editRes),
    users_by_plan: {
      free: subs.filter(s => s.plan === 'free').length,
      starter: subs.filter(s => s.plan === 'starter').length,
      professional: subs.filter(s => s.plan === 'professional').length,
      enterprise: subs.filter(s => s.plan === 'enterprise').length,
    },
    active_users: subs.filter(s => s.status === 'active').length
  };
}

// ── Plugin Instances & Remote Config ──────────────────────────

async function upsertPluginInstance(token, data) {
  const config = loadConfig();
  const res = await fetch(`${config.url}/rest/v1/plugin_instances`, {
    method: 'POST',
    headers: {
      'apikey': config.anonKey,
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify({
      user_id: data.user_id,
      instance_id: data.instance_id,
      project_name: data.project_name || null,
      framework: data.framework || null,
      plugin_version: data.plugin_version || null,
      ip_address: data.ip_address || null,
      metadata: data.metadata || {},
      last_seen_at: new Date().toISOString()
    })
  });
  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    throw new Error('Failed to upsert plugin instance: ' + err);
  }
  const rows = await res.json();
  return rows[0] || null;
}

async function getPluginConfig(token) {
  const config = loadConfig();
  const res = await fetch(`${config.url}/rest/v1/plugin_config?select=config_key,config_value,description,updated_at&order=config_key.asc`, {
    headers: {
      'apikey': config.anonKey,
      'Authorization': 'Bearer ' + token
    }
  });
  if (!res.ok) return [];
  return res.json();
}

async function listPluginInstances(token) {
  const config = loadConfig();
  const serviceRoleKey = getServiceRoleKey();
  const res = await fetch(`${config.url}/rest/v1/plugin_instances?select=*&order=last_seen_at.desc`, {
    headers: {
      'apikey': config.anonKey,
      'Authorization': 'Bearer ' + serviceRoleKey
    }
  });
  if (!res.ok) return [];
  return res.json();
}

async function upsertPluginConfig(token, key, value, description) {
  const config = loadConfig();
  const serviceRoleKey = getServiceRoleKey();
  const res = await fetch(`${config.url}/rest/v1/plugin_config`, {
    method: 'POST',
    headers: {
      'apikey': config.anonKey,
      'Authorization': 'Bearer ' + serviceRoleKey,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify({
      config_key: key,
      config_value: typeof value === 'string' ? JSON.parse(value) : value,
      description: description || null,
      updated_by: null,
      updated_at: new Date().toISOString()
    })
  });
  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    throw new Error('Failed to upsert plugin config: ' + err);
  }
  const rows = await res.json();
  return rows[0] || null;
}

async function getUserAnalyticsDetail(token, userId) {
  const config = loadConfig();
  const serviceRoleKey = getServiceRoleKey();
  const headers = {
    'apikey': config.anonKey,
    'Authorization': 'Bearer ' + serviceRoleKey
  };

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [logsRes, articlesRes, instancesRes] = await Promise.all([
    fetch(`${config.url}/rest/v1/usage_logs?user_id=eq.${userId}&created_at=gte.${thirtyDaysAgo}&select=action,metadata,created_at&order=created_at.desc&limit=50`, { headers }),
    fetch(`${config.url}/rest/v1/articles?user_id=eq.${userId}&select=id,title,topic,language,framework,status,created_at&order=created_at.desc&limit=20`, { headers }),
    fetch(`${config.url}/rest/v1/plugin_instances?user_id=eq.${userId}&select=*&order=last_seen_at.desc`, { headers })
  ]);

  const logs = await logsRes.json().catch(() => []);
  const articles = await articlesRes.json().catch(() => []);
  const instances = await instancesRes.json().catch(() => []);

  const generates = logs.filter(l => l.action === 'generate');
  const edits = logs.filter(l => l.action === 'edit');

  // Topic frequency from articles
  const topicCounts = {};
  articles.forEach(a => {
    const topic = a.topic || 'Unknown';
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  });

  // Framework distribution from articles + instances
  const frameworkCounts = {};
  articles.forEach(a => {
    if (a.framework) frameworkCounts[a.framework] = (frameworkCounts[a.framework] || 0) + 1;
  });
  instances.forEach(inst => {
    if (inst.framework) frameworkCounts[inst.framework] = (frameworkCounts[inst.framework] || 0) + 1;
  });

  // Error rate from logs
  const errors = logs.filter(l => l.metadata && l.metadata.error);
  const errorRate = logs.length > 0 ? (errors.length / logs.length * 100).toFixed(1) : '0.0';

  return {
    user_id: userId,
    period: '30d',
    generations: { total: generates.length, recent: generates.slice(0, 10) },
    edits: { total: edits.length, recent: edits.slice(0, 10) },
    articles: articles,
    instances: instances,
    topic_frequency: topicCounts,
    framework_distribution: frameworkCounts,
    error_rate: parseFloat(errorRate),
    total_actions: logs.length
  };
}

module.exports = {
  loadConfig,
  signUp,
  signIn,
  verifyToken,
  getSubscription,
  logUsage,
  getTodayUsageCount,
  // Dashboard data
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  getArticleVersions,
  updateArticleContent,
  createArticleVersion,
  listPipelineJobs,
  createPipelineJob,
  updatePipelineJob,
  getAnalyticsOverview,
  // User settings & quota
  getUserSettings,
  upsertUserSettings,
  validateSettingsAgainstPlan,
  getUserQuota,
  checkQuota,
  PLAN_DEFAULTS,
  // Admin
  getServiceRoleKey,
  adminGetSubscription,
  adminListUsers,
  adminUpdateSubscription,
  adminUpdatePlan,
  adminGetQuotaStats,
  adminDeleteUser,
  adminDeleteArticle,
  adminCreateUser,
  adminGetUsageLogs,
  // Plugin instances & remote config
  upsertPluginInstance,
  getPluginConfig,
  listPluginInstances,
  upsertPluginConfig,
  getUserAnalyticsDetail
};
