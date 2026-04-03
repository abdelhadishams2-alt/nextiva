/**
 * Content Decay Detector — CI-001
 *
 * Analyzes performance_snapshots data to identify content with declining
 * traffic, rankings, or engagement. Implements three detection methods:
 * - Click/impression decline (90-day rolling window)
 * - Position tracking (page boundary crossings)
 * - Content age audit (type-based triggers)
 *
 * Classifies every content item as HEALTHY, DECAYING, DECLINING, or DEAD.
 * Updates content_inventory status field. Exposes results via API.
 *
 * Zero npm dependencies — Node.js built-ins only.
 */

const logger = require('../logger');
const supabase = require('../supabase-client');

// ── Constants ──────────────────────────────────────────────────

const CLICK_DECLINE_THRESHOLD = -0.20; // 20% decline triggers flag
const MIN_BASELINE_CLICKS = 100;       // Minimum clicks in baseline period
const UPSERT_BATCH_SIZE = 500;

// Severity thresholds for click decline
const CLICK_SEVERITY = {
  critical: -0.50, // 50%+ decline
  high: -0.40,     // 40-50% decline
  medium: -0.20    // 20-40% decline
  // below 20% = low (not flagged)
};

// Position severity rules
const POSITION_SEVERITY = {
  critical: { fromPage: 1, toPageMin: 3 },  // page 1 -> page 3+
  high: { fromPage: 1, toPageMin: 2 },       // page 1 -> page 2
  medium: { minSpotDrop: 3 }                  // 3+ spots same page
  // 1-2 spots = low
};

// Content age triggers (months)
const AGE_TRIGGERS = {
  listicle: 6,
  howto: 12,
  evergreen: 18
};

// Title/URL patterns for content type detection
const LISTICLE_PATTERNS = [
  /\bbest\b/i, /\btop\s*\d+/i, /\d+\s*best\b/i,
  /\blist\b/i, /\branking/i, /\brated\b/i,
  /\bpicks?\b/i, /\breview(?:s|ed)?\b/i,
  /\bcompar(?:e|ison)\b/i, /\bvs\.?\b/i
];

const HOWTO_PATTERNS = [
  /\bhow\s*to\b/i, /\btutorial\b/i, /\bguide\b/i,
  /\bstep[\s-]*by[\s-]*step\b/i, /\bsetup\b/i,
  /\binstall(?:ation)?\b/i, /\breplace\b/i,
  /\bfix(?:ing)?\b/i, /\bsolve\b/i, /\btroubleshoot/i,
  /\bdiy\b/i
];

// Classification thresholds
const CLASSIFICATION = {
  HEALTHY: { minScore: 70 },
  DECAYING: { minScore: 40, maxClickDecline: -0.20 },
  DECLINING: { minScore: 20, maxClickDecline: -0.40 },
  DEAD: { maxScore: 20, zeroDays: 60 }
};

// ── Helpers ────────────────────────────────────────────────────

function formatDate(date) {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSupabaseAdmin() {
  const config = supabase.loadConfig();
  const serviceRoleKey = supabase.getServiceRoleKey();
  if (!config || !serviceRoleKey) {
    throw new Error('Supabase admin config not available. Set SUPABASE_SERVICE_ROLE_KEY env var.');
  }
  return { config, serviceRoleKey };
}

function getPage(position) {
  return Math.ceil(position / 10);
}

function detectContentType(title, url) {
  const text = (title || '') + ' ' + (url || '');
  for (const pattern of LISTICLE_PATTERNS) {
    if (pattern.test(text)) return 'listicle';
  }
  for (const pattern of HOWTO_PATTERNS) {
    if (pattern.test(text)) return 'howto';
  }
  return 'evergreen';
}

function getClickSeverity(changePct) {
  if (changePct <= CLICK_SEVERITY.critical) return 'critical';
  if (changePct <= CLICK_SEVERITY.high) return 'high';
  if (changePct <= CLICK_SEVERITY.medium) return 'medium';
  return 'low';
}

function getPositionSeverity(prevPos, currPos) {
  const prevPage = getPage(prevPos);
  const currPage = getPage(currPos);
  const pageBoundaryCrossed = currPage > prevPage;
  const spotDrop = currPos - prevPos;

  let severity = 'low';
  let trend = 'stable';

  if (spotDrop > 0) {
    trend = spotDrop >= 10 ? 'collapsed' : 'declining';
  } else if (spotDrop < 0) {
    trend = 'improving';
  }

  if (prevPage === 1 && currPage >= 3) {
    severity = 'critical';
  } else if (prevPage === 1 && currPage === 2) {
    severity = 'high';
  } else if (spotDrop >= 3 && !pageBoundaryCrossed) {
    severity = 'medium';
  } else if (spotDrop >= 1) {
    severity = 'low';
  }

  return { severity, trend, pageBoundaryCrossed, spotDrop, prevPage, currPage };
}

// ── Sub-task 1: Click Decline Detection ────────────────────────

/**
 * Detect click decline by comparing last 90 days vs preceding 90 days.
 * Only flags URLs with >= 100 clicks in baseline period.
 *
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} Array of decline items
 */
async function detectClickDecline(userId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  const now = new Date();
  const currentEnd = formatDate(now);
  const currentStart = formatDate(new Date(now.getTime() - 90 * 86400000));
  const baselineEnd = formatDate(new Date(now.getTime() - 90 * 86400000 - 86400000));
  const baselineStart = formatDate(new Date(now.getTime() - 180 * 86400000));

  logger.info('decay_click_decline_started', { userId, currentStart, currentEnd, baselineStart, baselineEnd });

  // Fetch current period snapshots
  const currentData = await fetchAggregatedSnapshots(config, serviceRoleKey, userId, currentStart, currentEnd);
  // Fetch baseline period snapshots
  const baselineData = await fetchAggregatedSnapshots(config, serviceRoleKey, userId, baselineStart, baselineEnd);

  const results = [];

  for (const [url, current] of Object.entries(currentData)) {
    const baseline = baselineData[url];
    if (!baseline) continue;
    if (baseline.clicks < MIN_BASELINE_CLICKS) continue;

    const clickChangePct = (current.clicks - baseline.clicks) / baseline.clicks;
    const impressionChangePct = baseline.impressions > 0
      ? (current.impressions - baseline.impressions) / baseline.impressions
      : 0;

    if (clickChangePct <= CLICK_DECLINE_THRESHOLD) {
      results.push({
        url,
        type: 'click_decline',
        clickChangePct: Math.round(clickChangePct * 10000) / 10000,
        impressionChangePct: Math.round(impressionChangePct * 10000) / 10000,
        currentClicks: current.clicks,
        baselineClicks: baseline.clicks,
        currentImpressions: current.impressions,
        baselineImpressions: baseline.impressions,
        severity: getClickSeverity(clickChangePct)
      });
    }
  }

  logger.info('decay_click_decline_completed', { userId, flagged: results.length });
  return results;
}

/**
 * Fetch and aggregate snapshot data for a date range, grouped by URL.
 */
async function fetchAggregatedSnapshots(config, serviceRoleKey, userId, startDate, endDate) {
  const aggregated = {};
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const url = `${config.url}/rest/v1/performance_snapshots` +
      `?user_id=eq.${encodeURIComponent(userId)}` +
      `&snapshot_date=gte.${startDate}` +
      `&snapshot_date=lte.${endDate}` +
      `&source=eq.gsc` +
      `&select=url,clicks,impressions,ctr,avg_position` +
      `&offset=${offset}&limit=${pageSize}` +
      `&order=url.asc`;

    const res = await fetch(url, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    });

    if (!res.ok) {
      logger.error('decay_fetch_snapshots_failed', { status: res.status, userId });
      break;
    }

    const rows = await res.json();
    if (!rows || rows.length === 0) break;

    for (const row of rows) {
      if (!aggregated[row.url]) {
        aggregated[row.url] = { clicks: 0, impressions: 0, ctrSum: 0, positionSum: 0, count: 0 };
      }
      const agg = aggregated[row.url];
      agg.clicks += row.clicks || 0;
      agg.impressions += row.impressions || 0;
      agg.ctrSum += parseFloat(row.ctr || 0);
      agg.positionSum += parseFloat(row.avg_position || 0);
      agg.count += 1;
    }

    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  // Calculate averages
  for (const url of Object.keys(aggregated)) {
    const agg = aggregated[url];
    agg.avgCtr = agg.count > 0 ? agg.ctrSum / agg.count : 0;
    agg.avgPosition = agg.count > 0 ? agg.positionSum / agg.count : 0;
  }

  return aggregated;
}

// ── Sub-task 2: Position Tracking ──────────────────────────────

/**
 * Detect position drops by comparing avg position last 30 days vs previous 30 days.
 *
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} Array of position drop items
 */
async function detectPositionDrop(userId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  const now = new Date();
  const currentEnd = formatDate(now);
  const currentStart = formatDate(new Date(now.getTime() - 30 * 86400000));
  const baselineEnd = formatDate(new Date(now.getTime() - 30 * 86400000 - 86400000));
  const baselineStart = formatDate(new Date(now.getTime() - 60 * 86400000));

  logger.info('decay_position_drop_started', { userId, currentStart, currentEnd, baselineStart, baselineEnd });

  const currentData = await fetchAggregatedSnapshots(config, serviceRoleKey, userId, currentStart, currentEnd);
  const baselineData = await fetchAggregatedSnapshots(config, serviceRoleKey, userId, baselineStart, baselineEnd);

  const results = [];

  for (const [url, current] of Object.entries(currentData)) {
    const baseline = baselineData[url];
    if (!baseline) continue;

    const prevPos = baseline.avgPosition;
    const currPos = current.avgPosition;

    if (currPos > prevPos) {
      const posResult = getPositionSeverity(prevPos, currPos);
      results.push({
        url,
        type: 'position_drop',
        previousPosition: Math.round(prevPos * 100) / 100,
        currentPosition: Math.round(currPos * 100) / 100,
        ...posResult
      });
    }
  }

  logger.info('decay_position_drop_completed', { userId, flagged: results.length });
  return results;
}

// ── Sub-task 3: Content Age Audit ──────────────────────────────

/**
 * Detect stale content based on age triggers by content type.
 *
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} Array of age audit items
 */
async function detectContentAge(userId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  logger.info('decay_content_age_started', { userId });

  const inventory = await fetchContentInventory(config, serviceRoleKey, userId);
  const now = new Date();
  const results = [];

  for (const item of inventory) {
    const publishDate = item.publish_date || item.modified_date || item.created_at;
    if (!publishDate) continue;

    const pubDate = new Date(publishDate);
    const ageMonths = (now.getTime() - pubDate.getTime()) / (30 * 86400000);
    const contentType = detectContentType(item.title, item.url);
    const trigger = AGE_TRIGGERS[contentType];

    if (ageMonths >= trigger) {
      results.push({
        url: item.url,
        contentId: item.id,
        type: 'content_age',
        contentType,
        title: item.title,
        publishDate: formatDate(pubDate),
        ageMonths: Math.round(ageMonths * 10) / 10,
        triggerMonths: trigger,
        severity: ageMonths >= trigger * 2 ? 'high' : 'medium'
      });
    }
  }

  logger.info('decay_content_age_completed', { userId, flagged: results.length });
  return results;
}

/**
 * Fetch content inventory for a user.
 */
async function fetchContentInventory(config, serviceRoleKey, userId) {
  const items = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const url = `${config.url}/rest/v1/content_inventory` +
      `?user_id=eq.${encodeURIComponent(userId)}` +
      `&select=id,url,title,publish_date,modified_date,created_at,status` +
      `&offset=${offset}&limit=${pageSize}`;

    const res = await fetch(url, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    });

    if (!res.ok) {
      logger.error('decay_fetch_inventory_failed', { status: res.status, userId });
      break;
    }

    const rows = await res.json();
    if (!rows || rows.length === 0) break;
    items.push(...rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  return items;
}

// ── Sub-task 4: Classification Engine ──────────────────────────

/**
 * Classify content by combining all 3 detection methods.
 * Updates content_inventory.status for each item.
 *
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} Array of classified decay items
 */
async function classifyContent(userId) {
  logger.info('decay_classify_started', { userId });

  const [clickDeclines, positionDrops, ageAudits] = await Promise.all([
    detectClickDecline(userId),
    detectPositionDrop(userId),
    detectContentAge(userId)
  ]);

  // Build lookup maps by URL
  const clickMap = new Map();
  for (const item of clickDeclines) clickMap.set(item.url, item);

  const positionMap = new Map();
  for (const item of positionDrops) positionMap.set(item.url, item);

  const ageMap = new Map();
  for (const item of ageAudits) ageMap.set(item.url, item);

  // Collect all URLs
  const allUrls = new Set([
    ...clickMap.keys(),
    ...positionMap.keys(),
    ...ageMap.keys()
  ]);

  // Fetch latest health scores
  const { config, serviceRoleKey } = getSupabaseAdmin();
  const healthScores = await fetchLatestHealthScores(config, serviceRoleKey, userId);

  // Build trend data
  const trendData = await fetchTrendData(config, serviceRoleKey, userId);

  const classifiedItems = [];

  for (const url of allUrls) {
    const click = clickMap.get(url);
    const position = positionMap.get(url);
    const age = ageMap.get(url);
    const healthScore = healthScores[url] || 0;
    const trend = trendData[url] || [];

    // Determine status
    const clickDeclinePct = click ? click.clickChangePct : 0;
    const hasZeroClicks = click && click.currentClicks === 0;
    const status = classifyStatus(healthScore, clickDeclinePct, hasZeroClicks, position);

    // Determine recommended action
    const currentPage = position ? position.currPage : (healthScores[url + '_page'] || 1);
    const action = recommendAction(clickDeclinePct, currentPage, click, age);

    // Determine overall severity (worst of all signals)
    const severities = [];
    if (click) severities.push(click.severity);
    if (position) severities.push(position.severity);
    if (age) severities.push(age.severity);
    const overallSeverity = worstSeverity(severities);

    classifiedItems.push({
      url,
      status,
      healthScore,
      severity: overallSeverity,
      recommendedAction: action,
      signals: {
        clickDecline: click || null,
        positionDrop: position || null,
        contentAge: age || null
      },
      trendData: trend
    });
  }

  // Update content_inventory status
  await updateInventoryStatuses(config, serviceRoleKey, userId, classifiedItems);

  logger.info('decay_classify_completed', { userId, total: classifiedItems.length });
  return classifiedItems;
}

/**
 * Classify a content item's status based on health score and signals.
 */
function classifyStatus(healthScore, clickDeclinePct, hasZeroClicks, positionData) {
  // DEAD: health_score < 20 OR zero clicks for extended period
  if (healthScore < CLASSIFICATION.DEAD.maxScore || hasZeroClicks) {
    return 'DEAD';
  }

  // DECLINING: health_score 20-39 OR 40%+ click decline
  if (healthScore < CLASSIFICATION.DECLINING.minScore + 20 && healthScore >= CLASSIFICATION.DEAD.maxScore) {
    return 'DECLINING';
  }
  if (clickDeclinePct <= CLASSIFICATION.DECLINING.maxClickDecline) {
    return 'DECLINING';
  }

  // DECAYING: health_score 40-69 OR 20%+ click decline
  if (healthScore < CLASSIFICATION.HEALTHY.minScore) {
    return 'DECAYING';
  }
  if (clickDeclinePct <= CLASSIFICATION.DECAYING.maxClickDecline) {
    return 'DECAYING';
  }

  // HEALTHY: health_score >= 70 AND no decay signals
  return 'HEALTHY';
}

/**
 * Recommend an action based on decline severity and position.
 */
function recommendAction(clickDeclinePct, currentPage, clickData, ageData) {
  // Age-triggered only, no click decline — monitor
  if (ageData && !clickData) {
    return 'monitor';
  }

  // Severe decline or page 3+ — full rewrite
  if (clickDeclinePct <= -0.50 || currentPage >= 3) {
    return 'full_rewrite';
  }

  // Low traffic, no backlinks — retire
  if (clickData && clickData.currentClicks < 10) {
    return 'retire_301';
  }

  // Moderate decline, still page 1-2 — partial refresh
  if (clickDeclinePct <= -0.10 && currentPage <= 2) {
    return 'partial_refresh';
  }

  return 'monitor';
}

/**
 * Return worst severity from a list.
 */
function worstSeverity(severities) {
  const order = ['critical', 'high', 'medium', 'low'];
  for (const level of order) {
    if (severities.includes(level)) return level;
  }
  return 'low';
}

/**
 * Fetch latest health scores per URL for a user.
 */
async function fetchLatestHealthScores(config, serviceRoleKey, userId) {
  const scores = {};
  const now = new Date();
  const since = formatDate(new Date(now.getTime() - 30 * 86400000));

  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const url = `${config.url}/rest/v1/performance_snapshots` +
      `?user_id=eq.${encodeURIComponent(userId)}` +
      `&snapshot_date=gte.${since}` +
      `&source=eq.gsc` +
      `&select=url,health_score,avg_position` +
      `&order=snapshot_date.desc` +
      `&offset=${offset}&limit=${pageSize}`;

    const res = await fetch(url, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    });

    if (!res.ok) break;
    const rows = await res.json();
    if (!rows || rows.length === 0) break;

    for (const row of rows) {
      if (!(row.url in scores) && row.health_score != null) {
        scores[row.url] = parseFloat(row.health_score);
        scores[row.url + '_page'] = getPage(parseFloat(row.avg_position || 1));
      }
    }

    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  return scores;
}

/**
 * Fetch 3-month trend data per URL (monthly aggregated clicks/impressions).
 */
async function fetchTrendData(config, serviceRoleKey, userId) {
  const trends = {};
  const now = new Date();

  // 3 months of monthly data
  for (let m = 2; m >= 0; m--) {
    const monthStart = new Date(now.getUTCFullYear(), now.getUTCMonth() - m, 1);
    const monthEnd = new Date(now.getUTCFullYear(), now.getUTCMonth() - m + 1, 0);
    const start = formatDate(monthStart);
    const end = formatDate(monthEnd);
    const monthLabel = `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, '0')}`;

    let offset = 0;
    const pageSize = 1000;

    while (true) {
      const url = `${config.url}/rest/v1/performance_snapshots` +
        `?user_id=eq.${encodeURIComponent(userId)}` +
        `&snapshot_date=gte.${start}` +
        `&snapshot_date=lte.${end}` +
        `&source=eq.gsc` +
        `&select=url,clicks,impressions` +
        `&offset=${offset}&limit=${pageSize}`;

      const res = await fetch(url, {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': 'Bearer ' + serviceRoleKey
        }
      });

      if (!res.ok) break;
      const rows = await res.json();
      if (!rows || rows.length === 0) break;

      for (const row of rows) {
        if (!trends[row.url]) trends[row.url] = [];
        // Find or create month entry
        let monthEntry = trends[row.url].find(e => e.month === monthLabel);
        if (!monthEntry) {
          monthEntry = { month: monthLabel, clicks: 0, impressions: 0 };
          trends[row.url].push(monthEntry);
        }
        monthEntry.clicks += row.clicks || 0;
        monthEntry.impressions += row.impressions || 0;
      }

      if (rows.length < pageSize) break;
      offset += pageSize;
    }
  }

  return trends;
}

/**
 * Update content_inventory.status for classified items.
 */
async function updateInventoryStatuses(config, serviceRoleKey, userId, classifiedItems) {
  let updated = 0;

  for (const item of classifiedItems) {
    try {
      const patchUrl = `${config.url}/rest/v1/content_inventory` +
        `?user_id=eq.${encodeURIComponent(userId)}` +
        `&url=eq.${encodeURIComponent(item.url)}`;

      const res = await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': 'Bearer ' + serviceRoleKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status: item.status.toLowerCase() })
      });

      if (res.ok) updated++;
    } catch (e) {
      logger.error('decay_update_inventory_failed', { url: item.url, error: e.message });
    }
  }

  logger.info('decay_inventory_updated', { userId, updated, total: classifiedItems.length });
}

// ── API Handlers ───────────────────────────────────────────────

/**
 * Handle GET /api/intelligence/decay — list all decay items.
 * Supports ?severity=&sort=&page=&per_page=
 *
 * @param {string} userId - User UUID
 * @param {object} query - URL query parameters
 * @returns {Promise<object>} API response data
 */
async function handleDecayList(userId, query) {
  logger.info('decay_list_started', { userId, query });

  const items = await classifyContent(userId);

  // Filter by severity
  let filtered = items;
  if (query.severity) {
    const severities = query.severity.split(',').map(s => s.trim().toLowerCase());
    filtered = filtered.filter(item => severities.includes(item.severity));
  }

  // Sort
  const sortField = query.sort || 'severity';
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  filtered.sort((a, b) => {
    if (sortField === 'severity') {
      return (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
    }
    if (sortField === 'healthScore') {
      return (a.healthScore || 0) - (b.healthScore || 0);
    }
    if (sortField === 'clickDecline') {
      const aDecline = a.signals.clickDecline ? a.signals.clickDecline.clickChangePct : 0;
      const bDecline = b.signals.clickDecline ? b.signals.clickDecline.clickChangePct : 0;
      return aDecline - bDecline;
    }
    return 0;
  });

  // Pagination
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(query.per_page || '20', 10)));
  const start = (page - 1) * perPage;
  const paginated = filtered.slice(start, start + perPage);

  // Summary
  const summary = {
    total: filtered.length,
    bySeverity: {
      critical: filtered.filter(i => i.severity === 'critical').length,
      high: filtered.filter(i => i.severity === 'high').length,
      medium: filtered.filter(i => i.severity === 'medium').length,
      low: filtered.filter(i => i.severity === 'low').length
    },
    byStatus: {
      HEALTHY: filtered.filter(i => i.status === 'HEALTHY').length,
      DECAYING: filtered.filter(i => i.status === 'DECAYING').length,
      DECLINING: filtered.filter(i => i.status === 'DECLINING').length,
      DEAD: filtered.filter(i => i.status === 'DEAD').length
    }
  };

  return {
    items: paginated,
    summary,
    pagination: {
      page,
      per_page: perPage,
      total: filtered.length,
      total_pages: Math.ceil(filtered.length / perPage)
    }
  };
}

/**
 * Handle GET /api/intelligence/decay/:contentId — single item detail.
 *
 * @param {string} userId - User UUID
 * @param {string} contentId - Content inventory UUID
 * @returns {Promise<object|null>} Decay detail or null
 */
async function handleDecayDetail(userId, contentId) {
  logger.info('decay_detail_started', { userId, contentId });

  const { config, serviceRoleKey } = getSupabaseAdmin();

  // Fetch content inventory item
  const invUrl = `${config.url}/rest/v1/content_inventory` +
    `?id=eq.${encodeURIComponent(contentId)}` +
    `&user_id=eq.${encodeURIComponent(userId)}` +
    `&select=*`;

  const invRes = await fetch(invUrl, {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey
    }
  });

  if (!invRes.ok) return null;
  const rows = await invRes.json();
  if (!rows || rows.length === 0) return null;

  const inventoryItem = rows[0];

  // Run classification for this user and find the item
  const items = await classifyContent(userId);
  const decayItem = items.find(i => i.url === inventoryItem.url);

  if (!decayItem) {
    // No decay signals — item is healthy
    return {
      contentId,
      url: inventoryItem.url,
      title: inventoryItem.title,
      status: 'HEALTHY',
      healthScore: 100,
      severity: null,
      recommendedAction: null,
      signals: { clickDecline: null, positionDrop: null, contentAge: null },
      trendData: [],
      inventory: inventoryItem
    };
  }

  return {
    contentId,
    url: decayItem.url,
    title: inventoryItem.title,
    status: decayItem.status,
    healthScore: decayItem.healthScore,
    severity: decayItem.severity,
    recommendedAction: decayItem.recommendedAction,
    signals: decayItem.signals,
    trendData: decayItem.trendData,
    inventory: inventoryItem
  };
}

// ── Exports ────────────────────────────────────────────────────

module.exports = {
  // Detection methods
  detectClickDecline,
  detectPositionDrop,
  detectContentAge,
  // Classification
  classifyContent,
  classifyStatus,
  recommendAction,
  // API handlers
  handleDecayList,
  handleDecayDetail,
  // Helpers (exported for testing)
  detectContentType,
  getClickSeverity,
  getPositionSeverity,
  getPage,
  worstSeverity,
  formatDate
};
