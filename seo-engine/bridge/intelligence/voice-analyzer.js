/**
 * Voice / Corpus Analyzer — VI-001
 *
 * Crawls a client site, extracts article text, and runs 6 stylometric
 * signals to classify each article as AI-written, human-written, or hybrid.
 *
 * Signals:
 *   1. Sentence length variance (AI = uniform, human = varied)
 *   2. Vocabulary diversity — Type-Token Ratio (AI = limited, human = rich)
 *   3. Transition pattern overuse (AI loves "Moreover"/"Furthermore")
 *   4. Paragraph rhythm variance (AI = uniform para length, human = varied)
 *   5. Hedge/qualifier frequency (AI = fewer hedges like "perhaps"/"sometimes")
 *   6. First-person usage (AI rarely uses I/we/my)
 *
 * Classification:
 *   ai_probability < 0.3  → HUMAN
 *   ai_probability 0.3–0.6 → HYBRID
 *   ai_probability > 0.6  → AI
 *
 * Minimum 50 articles required for statistical significance.
 *
 * Zero npm dependencies — Node.js built-ins only.
 */

const crypto = require('crypto');
const logger = require('../logger');
const supabase = require('../supabase-client');

// ── Constants ──────────────────────────────────────────────────

const RATE_LIMIT_MS = 500;          // 2 req/s
const MAX_PAGES = 500;              // Hard cap on pages to crawl
const MIN_ARTICLES = 50;            // Statistical significance threshold
const MIN_WORD_COUNT = 200;         // Minimum words for an article to qualify
const FETCH_TIMEOUT_MS = 30000;
const USER_AGENT = 'ChainIQ-VoiceAnalyzer/1.0 (+https://chainiq.ai/bot)';
const UPSERT_BATCH_SIZE = 50;

// AI transition words — overused by LLMs
const AI_TRANSITIONS = [
  'moreover', 'furthermore', 'additionally', 'consequently',
  'nevertheless', 'subsequently', 'in conclusion', 'it is worth noting',
  'it is important to note', 'in this regard', 'as such',
  'notably', 'significantly', 'essentially', 'fundamentally',
  'in essence', 'delve', 'tapestry', 'landscape', 'leverage',
  'holistic', 'synergy', 'paradigm', 'robust', 'comprehensive',
  'multifaceted', 'nuanced', 'pivotal', 'crucial'
];

// Hedge / qualifier words — used more by humans
const HEDGE_WORDS = [
  'perhaps', 'maybe', 'sometimes', 'probably', 'possibly',
  'might', 'could', 'seem', 'seems', 'appear', 'appears',
  'sort of', 'kind of', 'a bit', 'somewhat', 'fairly',
  'quite', 'rather', 'roughly', 'approximately', 'arguably',
  'presumably', 'supposedly', 'apparently', 'likely',
  'i think', 'i believe', 'i guess', 'i suppose',
  'in my opinion', 'to be honest', 'honestly', 'frankly'
];

// First-person pronouns
const FIRST_PERSON_WORDS = [
  'i', 'me', 'my', 'mine', 'myself',
  'we', 'us', 'our', 'ours', 'ourselves'
];

// Track active crawls per user (in-memory, max 1 concurrent)
const activeCrawls = new Map();

// ── Helpers ────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getSupabaseAdmin() {
  const config = supabase.loadConfig();
  const serviceRoleKey = supabase.getServiceRoleKey();
  if (!config || !serviceRoleKey) {
    throw new Error('Supabase admin config not available. Set SUPABASE_SERVICE_ROLE_KEY env var.');
  }
  return { config, serviceRoleKey };
}

/**
 * Safe fetch with timeout and user-agent.
 */
async function safeFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        ...(options.headers || {})
      }
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Text Extraction ────────────────────────────────────────────

/**
 * Extract article body text from HTML using regex.
 * Priority: <article> → [role=main] → <main> → <body>
 * Strips: nav, footer, header, sidebar, ads, script, style.
 *
 * @param {string} html - Raw HTML
 * @returns {string} Plain text content
 */
function extractArticleText(html) {
  if (!html || typeof html !== 'string') return '';

  let content = html;

  // Try to extract from main content areas (priority order)
  const contentSelectors = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<[^>]*role\s*=\s*["']main["'][^>]*>([\s\S]*?)<\/[^>]+>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i
  ];

  for (const regex of contentSelectors) {
    const match = content.match(regex);
    if (match) {
      content = match[1];
      break;
    }
  }

  // Fallback to body
  if (content === html) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) content = bodyMatch[1];
  }

  // Remove unwanted elements
  const unwantedPatterns = [
    /<script[\s\S]*?<\/script>/gi,
    /<style[\s\S]*?<\/style>/gi,
    /<noscript[\s\S]*?<\/noscript>/gi,
    /<iframe[\s\S]*?<\/iframe>/gi,
    /<nav[\s\S]*?<\/nav>/gi,
    /<header[\s\S]*?<\/header>/gi,
    /<footer[\s\S]*?<\/footer>/gi,
    /<aside[\s\S]*?<\/aside>/gi,
    /<form[\s\S]*?<\/form>/gi,
    /<!--[\s\S]*?-->/gi,
    /<[^>]*class\s*=\s*["'][^"']*(?:sidebar|widget|ad|banner|cookie|popup|modal)[^"']*["'][^>]*>[\s\S]*?<\/[^>]+>/gi
  ];

  for (const pattern of unwantedPatterns) {
    content = content.replace(pattern, ' ');
  }

  // Strip all remaining HTML tags
  content = content.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  content = content
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/&\w+;/g, ' ');

  // Normalize whitespace but preserve paragraph breaks
  content = content
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();

  return content;
}

/**
 * Extract page title from HTML.
 */
function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return '';
  return match[1].replace(/<[^>]*>/g, '').trim();
}

// ── Stylometric Signals ────────────────────────────────────────

/**
 * Split text into sentences using punctuation boundaries.
 */
function splitSentences(text) {
  if (!text) return [];
  // Split on sentence-ending punctuation followed by space or end
  const raw = text.split(/(?<=[.!?])\s+/);
  return raw.filter(s => s.trim().length > 3);
}

/**
 * Split text into paragraphs.
 */
function splitParagraphs(text) {
  if (!text) return [];
  return text.split(/\n\n+/).filter(p => p.trim().length > 10);
}

/**
 * Tokenize text into lowercase words.
 */
function tokenize(text) {
  if (!text) return [];
  return text.toLowerCase().match(/\b[a-z']+\b/g) || [];
}

/**
 * Signal 1: Sentence Length Variance
 * AI tends to produce uniform sentence lengths; humans vary more.
 * Returns 0–1 where 1 = AI-like (low variance).
 */
function signalSentenceLengthVariance(text) {
  const sentences = splitSentences(text);
  if (sentences.length < 5) return 0.5; // insufficient data

  const lengths = sentences.map(s => s.split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 0; // coefficient of variation

  // Human writing typically has CV > 0.5; AI is often 0.2–0.4
  // Map: CV 0.0 → 1.0 (very AI), CV 0.6+ → 0.0 (very human)
  if (cv >= 0.6) return 0.0;
  if (cv <= 0.15) return 1.0;
  return 1.0 - (cv - 0.15) / (0.6 - 0.15);
}

/**
 * Signal 2: Vocabulary Diversity (Type-Token Ratio)
 * AI tends to reuse vocabulary more; humans use more unique words.
 * Returns 0–1 where 1 = AI-like (low diversity).
 */
function signalVocabularyDiversity(text) {
  const words = tokenize(text);
  if (words.length < 100) return 0.5; // insufficient data

  // Use a sliding window TTR for fairness across text lengths
  const windowSize = Math.min(500, words.length);
  const window = words.slice(0, windowSize);
  const types = new Set(window).size;
  const ttr = types / windowSize;

  // Human writing typically has TTR 0.55–0.75; AI often 0.35–0.50
  // Map: TTR 0.35 → 1.0 (very AI), TTR 0.70+ → 0.0 (very human)
  if (ttr >= 0.70) return 0.0;
  if (ttr <= 0.35) return 1.0;
  return 1.0 - (ttr - 0.35) / (0.70 - 0.35);
}

/**
 * Signal 3: Transition Pattern Overuse
 * AI overuses formal transitions like "Moreover", "Furthermore", "Additionally".
 * Returns 0–1 where 1 = AI-like (many AI transitions).
 */
function signalTransitionPatterns(text) {
  const words = tokenize(text);
  if (words.length < 100) return 0.5;

  const textLower = text.toLowerCase();
  let transitionCount = 0;

  for (const transition of AI_TRANSITIONS) {
    // Count occurrences of each transition
    const regex = new RegExp('\\b' + transition.replace(/\s+/g, '\\s+') + '\\b', 'gi');
    const matches = textLower.match(regex);
    if (matches) transitionCount += matches.length;
  }

  // Normalize per 1000 words
  const per1000 = (transitionCount / words.length) * 1000;

  // Human writing typically has 0–3 per 1000 words; AI often 5–15
  // Map: 0 per 1000 → 0.0, 8+ per 1000 → 1.0
  if (per1000 <= 1) return 0.0;
  if (per1000 >= 8) return 1.0;
  return (per1000 - 1) / (8 - 1);
}

/**
 * Signal 4: Paragraph Rhythm Variance
 * AI produces uniform paragraph lengths; humans vary more.
 * Returns 0–1 where 1 = AI-like (low variance).
 */
function signalParagraphRhythm(text) {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length < 3) return 0.5; // insufficient data

  const lengths = paragraphs.map(p => p.split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 0;

  // Human paragraphs typically have CV > 0.5; AI is often 0.1–0.3
  if (cv >= 0.6) return 0.0;
  if (cv <= 0.15) return 1.0;
  return 1.0 - (cv - 0.15) / (0.6 - 0.15);
}

/**
 * Signal 5: Hedge/Qualifier Frequency
 * AI uses fewer hedges like "perhaps", "sometimes", "I think".
 * Returns 0–1 where 1 = AI-like (few hedges).
 */
function signalHedgeFrequency(text) {
  const words = tokenize(text);
  if (words.length < 100) return 0.5;

  const textLower = text.toLowerCase();
  let hedgeCount = 0;

  for (const hedge of HEDGE_WORDS) {
    const regex = new RegExp('\\b' + hedge.replace(/\s+/g, '\\s+') + '\\b', 'gi');
    const matches = textLower.match(regex);
    if (matches) hedgeCount += matches.length;
  }

  // Normalize per 1000 words
  const per1000 = (hedgeCount / words.length) * 1000;

  // Human writing typically has 5–15 hedges per 1000 words; AI often 0–3
  // Map: 0 per 1000 → 1.0 (AI), 10+ per 1000 → 0.0 (human)
  if (per1000 >= 10) return 0.0;
  if (per1000 <= 1) return 1.0;
  return 1.0 - (per1000 - 1) / (10 - 1);
}

/**
 * Signal 6: First-Person Usage
 * AI rarely uses I/we/my; human blog posts use them frequently.
 * Returns 0–1 where 1 = AI-like (no first-person).
 */
function signalFirstPersonUsage(text) {
  const words = tokenize(text);
  if (words.length < 100) return 0.5;

  let fpCount = 0;
  for (const word of words) {
    if (FIRST_PERSON_WORDS.includes(word)) fpCount++;
  }

  // Normalize per 1000 words
  const per1000 = (fpCount / words.length) * 1000;

  // Human blog posts typically have 10–40 per 1000; AI often 0–3
  // Map: 0 per 1000 → 1.0 (AI), 15+ per 1000 → 0.0 (human)
  if (per1000 >= 15) return 0.0;
  if (per1000 <= 1) return 1.0;
  return 1.0 - (per1000 - 1) / (15 - 1);
}

/**
 * Run all 6 stylometric signals on a text and return scores + classification.
 *
 * @param {string} text - Article body text
 * @returns {{ signals: object, ai_probability: number, classification: string }}
 */
function analyzeText(text) {
  const signals = {
    sentence_length_variance: signalSentenceLengthVariance(text),
    vocabulary_diversity: signalVocabularyDiversity(text),
    transition_patterns: signalTransitionPatterns(text),
    paragraph_rhythm: signalParagraphRhythm(text),
    hedge_frequency: signalHedgeFrequency(text),
    first_person_usage: signalFirstPersonUsage(text)
  };

  // Round each signal to 4 decimal places
  for (const key of Object.keys(signals)) {
    signals[key] = Math.round(signals[key] * 10000) / 10000;
  }

  // Average all signals
  const values = Object.values(signals);
  const ai_probability = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10000) / 10000;

  let classification = 'HYBRID';
  if (ai_probability < 0.3) classification = 'HUMAN';
  else if (ai_probability > 0.6) classification = 'AI';

  return { signals, ai_probability, classification };
}

// ── Corpus Crawler ─────────────────────────────────────────────

/**
 * Discover URLs from sitemap.xml (preferred method).
 *
 * @param {string} siteUrl - Base URL of the site
 * @returns {Promise<string[]>}
 */
async function discoverFromSitemap(siteUrl) {
  const base = siteUrl.replace(/\/+$/, '');
  const sitemapUrls = [
    base + '/sitemap.xml',
    base + '/sitemap_index.xml',
    base + '/sitemap/',
    base + '/sitemap.txt'
  ];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const res = await safeFetch(sitemapUrl);
      if (!res.ok) continue;

      const body = await res.text();
      if (!body || body.length < 50) continue;

      // Check for sitemap index (contains <sitemap> tags)
      const isSitemapIndex = /<sitemap>/i.test(body);

      if (isSitemapIndex) {
        // Extract child sitemap URLs
        const childMatches = body.match(/<loc>\s*(https?:\/\/[^<]+)\s*<\/loc>/gi) || [];
        const childUrls = childMatches.map(m => m.replace(/<\/?loc>/gi, '').trim());

        let allUrls = [];
        for (const childUrl of childUrls.slice(0, 10)) { // Max 10 child sitemaps
          await sleep(RATE_LIMIT_MS);
          try {
            const childRes = await safeFetch(childUrl);
            if (!childRes.ok) continue;
            const childBody = await childRes.text();
            const urls = extractUrlsFromSitemap(childBody);
            allUrls = allUrls.concat(urls);
          } catch (e) {
            logger.info('voice_sitemap_child_failed', { childUrl, error: e.message });
          }
        }
        if (allUrls.length > 0) {
          logger.info('voice_sitemap_index_found', { sitemapUrl, urlCount: allUrls.length });
          return [...new Set(allUrls)].slice(0, MAX_PAGES);
        }
      } else {
        const urls = extractUrlsFromSitemap(body);
        if (urls.length > 0) {
          logger.info('voice_sitemap_found', { sitemapUrl, urlCount: urls.length });
          return urls.slice(0, MAX_PAGES);
        }
      }
    } catch (e) {
      logger.info('voice_sitemap_not_found', { sitemapUrl, error: e.message });
    }
  }

  return [];
}

/**
 * Extract URLs from a sitemap XML body.
 */
function extractUrlsFromSitemap(body) {
  const matches = body.match(/<loc>\s*(https?:\/\/[^<]+)\s*<\/loc>/gi) || [];
  return matches.map(m => m.replace(/<\/?loc>/gi, '').trim());
}

/**
 * BFS crawl fallback when sitemap is unavailable.
 *
 * @param {string} siteUrl - Base URL of the site
 * @param {number} maxPages - Maximum pages to discover
 * @returns {Promise<string[]>}
 */
async function discoverFromBFS(siteUrl, maxPages = MAX_PAGES) {
  const base = siteUrl.replace(/\/+$/, '');
  const visited = new Set();
  const queue = [base + '/'];
  const discovered = [];

  const baseHost = new URL(base).hostname;

  while (queue.length > 0 && discovered.length < maxPages) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      await sleep(RATE_LIMIT_MS);
      const res = await safeFetch(url);
      if (!res.ok) continue;

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) continue;

      const html = await res.text();
      discovered.push(url);

      // Extract links for BFS
      const linkMatches = html.match(/<a\s[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>/gi) || [];
      for (const linkTag of linkMatches) {
        const hrefMatch = linkTag.match(/href\s*=\s*["']([^"'#]+)["']/i);
        if (!hrefMatch) continue;

        let href = hrefMatch[1].trim();
        // Resolve relative URLs
        try {
          const resolved = new URL(href, url).href;
          const resolvedHost = new URL(resolved).hostname;
          if (resolvedHost === baseHost && !visited.has(resolved) && resolved.startsWith('http')) {
            queue.push(resolved);
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    } catch (e) {
      logger.info('voice_bfs_fetch_failed', { url, error: e.message });
    }
  }

  return discovered;
}

// ── Main Analysis Pipeline ─────────────────────────────────────

/**
 * Run the full corpus analysis pipeline:
 * 1. Create analysis session
 * 2. Crawl site (sitemap preferred, BFS fallback)
 * 3. Fetch + extract article text from each URL
 * 4. Run 6 stylometric signals on each article
 * 5. Store results in voice_match_scores
 * 6. Aggregate and update session
 *
 * @param {string} userId - User UUID
 * @param {string} siteUrl - Site URL to analyze
 * @returns {Promise<object>} Session result
 */
async function runAnalysis(userId, siteUrl) {
  // Enforce max 1 concurrent crawl per user
  if (activeCrawls.has(userId)) {
    throw new Error('Analysis already in progress for this user');
  }

  const { config, serviceRoleKey } = getSupabaseAdmin();

  // Validate URL
  try {
    const parsed = new URL(siteUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Only HTTP/HTTPS URLs are supported');
    }
  } catch (e) {
    throw new Error('Invalid site URL: ' + e.message);
  }

  // Create analysis session
  const sessionId = crypto.randomUUID();
  await upsertSession(config, serviceRoleKey, {
    id: sessionId,
    user_id: userId,
    site_url: siteUrl,
    status: 'crawling',
    started_at: new Date().toISOString()
  });

  activeCrawls.set(userId, sessionId);

  logger.info('voice_analysis_started', { userId, sessionId, siteUrl });

  try {
    // Step 1: Discover URLs (sitemap preferred, BFS fallback)
    let urls = await discoverFromSitemap(siteUrl);
    if (urls.length === 0) {
      logger.info('voice_sitemap_empty_fallback_bfs', { userId, sessionId });
      urls = await discoverFromBFS(siteUrl, MAX_PAGES);
    }

    logger.info('voice_urls_discovered', { userId, sessionId, urlCount: urls.length });

    await updateSession(config, serviceRoleKey, sessionId, {
      total_pages: urls.length,
      status: 'analyzing'
    });

    // Step 2: Fetch and analyze each page
    const results = [];
    let articlesFound = 0;

    for (const url of urls) {
      try {
        await sleep(RATE_LIMIT_MS);
        const res = await safeFetch(url);
        if (!res.ok) continue;

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) continue;

        const html = await res.text();
        const text = extractArticleText(html);
        const title = extractTitle(html);
        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

        // Skip pages with too little content (not articles)
        if (wordCount < MIN_WORD_COUNT) continue;

        articlesFound++;

        // Run stylometric analysis
        const analysis = analyzeText(text);

        results.push({
          id: crypto.randomUUID(),
          session_id: sessionId,
          user_id: userId,
          url,
          title,
          word_count: wordCount,
          article_text: text.substring(0, 50000), // Cap at 50KB per article
          signal_scores: analysis.signals,
          ai_probability: analysis.ai_probability,
          classification: analysis.classification,
          metadata: {
            fetched_at: new Date().toISOString(),
            content_type: contentType
          }
        });
      } catch (e) {
        logger.info('voice_page_fetch_failed', { url, error: e.message });
      }
    }

    logger.info('voice_articles_analyzed', { userId, sessionId, articlesFound, analyzed: results.length });

    // Step 3: Store results in batches
    for (let i = 0; i < results.length; i += UPSERT_BATCH_SIZE) {
      const batch = results.slice(i, i + UPSERT_BATCH_SIZE);
      await insertScores(config, serviceRoleKey, batch);
    }

    // Step 4: Compute aggregate stats
    const summary = computeClassificationSummary(results);
    const aggregateSignals = computeAggregateSignals(results);

    // Step 5: Update session as complete
    await updateSession(config, serviceRoleKey, sessionId, {
      status: 'complete',
      articles_found: articlesFound,
      articles_analyzed: results.length,
      classification_summary: summary,
      aggregate_signals: aggregateSignals,
      completed_at: new Date().toISOString()
    });

    // Step 6: Build/update writer persona if enough articles
    if (results.length >= MIN_ARTICLES) {
      const humanArticles = results.filter(r => r.classification === 'HUMAN');
      if (humanArticles.length >= 10) {
        await upsertWriterPersona(config, serviceRoleKey, userId, humanArticles, aggregateSignals);
      }
    }

    logger.info('voice_analysis_completed', { userId, sessionId, total: results.length, summary });

    return {
      sessionId,
      status: 'complete',
      totalPages: urls.length,
      articlesFound,
      articlesAnalyzed: results.length,
      meetsMinimum: results.length >= MIN_ARTICLES,
      classificationSummary: summary,
      aggregateSignals
    };

  } catch (e) {
    logger.error('voice_analysis_failed', { userId, sessionId, error: e.message });
    await updateSession(config, serviceRoleKey, sessionId, {
      status: 'failed',
      error_message: e.message,
      completed_at: new Date().toISOString()
    });
    throw e;
  } finally {
    activeCrawls.delete(userId);
  }
}

/**
 * Compute classification summary from results.
 */
function computeClassificationSummary(results) {
  const summary = { HUMAN: 0, HYBRID: 0, AI: 0, total: results.length };
  for (const r of results) {
    if (summary[r.classification] !== undefined) {
      summary[r.classification]++;
    }
  }
  summary.human_pct = results.length > 0 ? Math.round((summary.HUMAN / results.length) * 100) : 0;
  summary.hybrid_pct = results.length > 0 ? Math.round((summary.HYBRID / results.length) * 100) : 0;
  summary.ai_pct = results.length > 0 ? Math.round((summary.AI / results.length) * 100) : 0;
  return summary;
}

/**
 * Compute aggregate signal averages across all analyzed articles.
 */
function computeAggregateSignals(results) {
  if (results.length === 0) return {};

  const signalKeys = [
    'sentence_length_variance', 'vocabulary_diversity', 'transition_patterns',
    'paragraph_rhythm', 'hedge_frequency', 'first_person_usage'
  ];

  const agg = {};
  for (const key of signalKeys) {
    const values = results.map(r => r.signal_scores[key]).filter(v => v != null);
    if (values.length > 0) {
      agg[key] = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10000) / 10000;
    }
  }

  // Overall average
  const allValues = Object.values(agg);
  agg.overall_ai_probability = allValues.length > 0
    ? Math.round((allValues.reduce((a, b) => a + b, 0) / allValues.length) * 10000) / 10000
    : 0;

  return agg;
}

// ── Supabase Persistence ───────────────────────────────────────

async function upsertSession(config, serviceRoleKey, session) {
  const url = `${config.url}/rest/v1/analysis_sessions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(session)
  });
  if (!res.ok) {
    const body = await res.text();
    logger.error('voice_upsert_session_failed', { status: res.status, body });
  }
}

async function updateSession(config, serviceRoleKey, sessionId, fields) {
  const url = `${config.url}/rest/v1/analysis_sessions?id=eq.${encodeURIComponent(sessionId)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(fields)
  });
  if (!res.ok) {
    const body = await res.text();
    logger.error('voice_update_session_failed', { status: res.status, body });
  }
}

async function insertScores(config, serviceRoleKey, scores) {
  const url = `${config.url}/rest/v1/voice_match_scores`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(scores)
  });
  if (!res.ok) {
    const body = await res.text();
    logger.error('voice_insert_scores_failed', { status: res.status, body });
  }
}

async function upsertWriterPersona(config, serviceRoleKey, userId, humanArticles, aggregateSignals) {
  const persona = {
    user_id: userId,
    name: 'Primary Voice (auto-detected)',
    voice_profile: {
      based_on: humanArticles.length + ' human-classified articles',
      aggregate_signals: aggregateSignals,
      detected_at: new Date().toISOString()
    },
    source_articles: humanArticles.slice(0, 100).map(a => a.url),
    feature_vector: aggregateSignals
  };

  // Check if persona already exists for user
  const checkUrl = `${config.url}/rest/v1/writer_personas?user_id=eq.${encodeURIComponent(userId)}&limit=1`;
  const checkRes = await fetch(checkUrl, {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey
    }
  });

  if (checkRes.ok) {
    const existing = await checkRes.json();
    if (existing && existing.length > 0) {
      // Update existing
      const patchUrl = `${config.url}/rest/v1/writer_personas?id=eq.${encodeURIComponent(existing[0].id)}`;
      await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': 'Bearer ' + serviceRoleKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(persona)
      });
      logger.info('voice_persona_updated', { userId });
      return;
    }
  }

  // Insert new
  const insertUrl = `${config.url}/rest/v1/writer_personas`;
  await fetch(insertUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(persona)
  });
  logger.info('voice_persona_created', { userId });
}

// ── API Handlers ───────────────────────────────────────────────

/**
 * Handle POST /api/voice/analyze — trigger a corpus analysis run.
 * Body: { siteUrl: string }
 *
 * @param {string} userId - User UUID
 * @param {object} body - Request body
 * @returns {Promise<object>} Initial session status
 */
async function handleAnalyzeTrigger(userId, body) {
  const { siteUrl } = body || {};
  if (!siteUrl || typeof siteUrl !== 'string') {
    throw new Error('siteUrl is required');
  }

  // Validate URL format
  try {
    new URL(siteUrl);
  } catch (e) {
    throw new Error('Invalid siteUrl: ' + e.message);
  }

  // Check if already running
  if (activeCrawls.has(userId)) {
    return {
      status: 'already_running',
      sessionId: activeCrawls.get(userId),
      message: 'An analysis is already in progress. Check status via GET /api/voice/corpus/:userId'
    };
  }

  // Start analysis in background (don't await the full run)
  const analysisPromise = runAnalysis(userId, siteUrl);

  // Return immediately with session info
  // We wait briefly for the session to be created
  await sleep(200);

  const { config, serviceRoleKey } = getSupabaseAdmin();
  const sessionUrl = `${config.url}/rest/v1/analysis_sessions` +
    `?user_id=eq.${encodeURIComponent(userId)}` +
    `&order=created_at.desc&limit=1`;
  const sessionRes = await fetch(sessionUrl, {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey
    }
  });

  let session = null;
  if (sessionRes.ok) {
    const rows = await sessionRes.json();
    if (rows && rows.length > 0) session = rows[0];
  }

  // Fire and forget — catch errors to prevent unhandled rejection
  analysisPromise.catch(e => {
    logger.error('voice_analysis_background_error', { userId, error: e.message });
  });

  return {
    status: 'started',
    sessionId: session ? session.id : null,
    siteUrl,
    message: 'Analysis started. Poll GET /api/voice/corpus/:userId for status.'
  };
}

/**
 * Handle GET /api/voice/corpus/:userId — get corpus analysis status.
 *
 * @param {string} userId - User UUID
 * @returns {Promise<object>} Corpus status
 */
async function handleCorpusStatus(userId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  // Fetch latest session for user
  const sessionUrl = `${config.url}/rest/v1/analysis_sessions` +
    `?user_id=eq.${encodeURIComponent(userId)}` +
    `&order=created_at.desc&limit=5` +
    `&select=*`;

  const sessionRes = await fetch(sessionUrl, {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey
    }
  });

  if (!sessionRes.ok) {
    throw new Error('Failed to fetch analysis sessions');
  }

  const sessions = await sessionRes.json();
  if (!sessions || sessions.length === 0) {
    return {
      status: 'no_sessions',
      sessions: [],
      message: 'No analysis sessions found. Trigger one via POST /api/voice/analyze'
    };
  }

  const latest = sessions[0];

  // If the latest session is complete, also fetch score summary
  let scoreSummary = null;
  if (latest.status === 'complete') {
    const scoresUrl = `${config.url}/rest/v1/voice_match_scores` +
      `?session_id=eq.${encodeURIComponent(latest.id)}` +
      `&select=classification,ai_probability,word_count`;

    const scoresRes = await fetch(scoresUrl, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    });

    if (scoresRes.ok) {
      const scores = await scoresRes.json();
      scoreSummary = {
        total: scores.length,
        classifications: {
          HUMAN: scores.filter(s => s.classification === 'HUMAN').length,
          HYBRID: scores.filter(s => s.classification === 'HYBRID').length,
          AI: scores.filter(s => s.classification === 'AI').length
        },
        avg_ai_probability: scores.length > 0
          ? Math.round((scores.reduce((a, s) => a + s.ai_probability, 0) / scores.length) * 10000) / 10000
          : 0,
        avg_word_count: scores.length > 0
          ? Math.round(scores.reduce((a, s) => a + s.word_count, 0) / scores.length)
          : 0,
        meets_minimum: scores.length >= MIN_ARTICLES
      };
    }
  }

  return {
    status: latest.status,
    isRunning: activeCrawls.has(userId),
    latest: {
      sessionId: latest.id,
      siteUrl: latest.site_url,
      status: latest.status,
      totalPages: latest.total_pages,
      articlesFound: latest.articles_found,
      articlesAnalyzed: latest.articles_analyzed,
      classificationSummary: latest.classification_summary,
      aggregateSignals: latest.aggregate_signals,
      errorMessage: latest.error_message,
      startedAt: latest.started_at,
      completedAt: latest.completed_at
    },
    scoreSummary,
    recentSessions: sessions.map(s => ({
      id: s.id,
      siteUrl: s.site_url,
      status: s.status,
      articlesAnalyzed: s.articles_analyzed,
      createdAt: s.created_at
    }))
  };
}

// ── 12-Dimension Feature Extraction (VI-002) ──────────────────

// Vocabulary sophistication — less common English words
const SOPHISTICATED_WORDS = [
  'albeit', 'ameliorate', 'ancillary', 'antithesis', 'apropos', 'ascertain',
  'bespoke', 'bifurcate', 'burgeoning', 'cadence', 'capitulate', 'cognizant',
  'commensurate', 'concomitant', 'conundrum', 'copious', 'delineate',
  'dichotomy', 'disparate', 'efficacious', 'elucidate', 'ephemeral',
  'equanimity', 'exacerbate', 'expedite', 'facetious', 'fastidious',
  'gratuitous', 'idiosyncratic', 'impervious', 'incandescent', 'incongruous',
  'inexorable', 'insidious', 'juxtapose', 'languid', 'magnanimous',
  'meticulous', 'nascent', 'obfuscate', 'onerous', 'opulent', 'ostentatious',
  'panacea', 'paradigmatic', 'pernicious', 'perspicacious', 'plethora',
  'pragmatic', 'precipitous', 'predilection', 'proclivity', 'propensity',
  'quintessential', 'recalcitrant', 'reticent', 'salient', 'sanguine',
  'serendipity', 'superfluous', 'surreptitious', 'tantamount', 'tenacious',
  'ubiquitous', 'unequivocal', 'vicissitude', 'voluminous', 'whimsical',
  'zealous'
];

// Analogy/metaphor markers
const ANALOGY_MARKERS = [
  'like a', 'as if', 'as though', 'resembles', 'reminiscent of',
  'akin to', 'analogous to', 'comparable to', 'mirrors', 'echoes',
  'evokes', 'conjures', 'is a metaphor', 'metaphorically',
  'figuratively', 'so to speak', 'in a sense', 'symbolizes',
  'embodies', 'personifies', 'epitomizes'
];

// Formal phrases — presence indicates formality
const FORMAL_MARKERS = [
  'therefore', 'consequently', 'furthermore', 'moreover', 'nevertheless',
  'notwithstanding', 'albeit', 'hitherto', 'whereby', 'wherein',
  'thus', 'hence', 'accordingly', 'subsequently', 'heretofore',
  'inasmuch', 'insofar', 'whereas', 'therein', 'thereof'
];

// Informal markers
const INFORMAL_MARKERS = [
  'gonna', 'wanna', 'gotta', 'kinda', 'sorta', 'yeah', 'nope',
  'yep', 'ok', 'okay', 'cool', 'awesome', 'stuff', 'things',
  'basically', 'literally', 'totally', 'super', 'pretty much',
  'no way', 'you know', 'right?', 'haha', 'lol', 'btw',
  'tbh', 'imho', 'omg', 'imo'
];

/**
 * Extract a 12-dimension feature vector from article text.
 * All values are normalized to 0-1.
 *
 * Dimensions:
 *   0. avg_sentence_length      — normalized avg words per sentence
 *   1. sentence_length_variance  — coefficient of variation of sentence lengths
 *   2. ttr                       — type-token ratio (vocabulary diversity)
 *   3. vocabulary_sophistication — ratio of sophisticated/uncommon words
 *   4. passive_voice_ratio       — ratio of passive constructions
 *   5. avg_paragraph_length      — normalized avg words per paragraph
 *   6. paragraph_rhythm_variance — CV of paragraph lengths
 *   7. question_frequency        — questions per sentence
 *   8. exclamation_frequency     — exclamations per sentence
 *   9. formality_score           — formal vs informal marker ratio
 *  10. first_person_ratio        — first-person pronoun density
 *  11. analogy_metaphor_density  — analogy/metaphor markers per 1000 words
 *
 * @param {string} text - Article body text
 * @returns {number[]} 12-element feature vector (all 0-1)
 */
function extract12DimFeatures(text) {
  if (!text || text.length < 50) {
    return new Array(12).fill(0.5);
  }

  const sentences = splitSentences(text);
  const paragraphs = splitParagraphs(text);
  const words = tokenize(text);
  const wordCount = words.length;

  if (wordCount < 50) return new Array(12).fill(0.5);

  // 0. avg_sentence_length — normalize: 5 words → 0, 40+ words → 1
  const sentLengths = sentences.map(s => s.split(/\s+/).length);
  const avgSentLen = sentLengths.length > 0
    ? sentLengths.reduce((a, b) => a + b, 0) / sentLengths.length : 15;
  const dim0 = clamp01((avgSentLen - 5) / 35);

  // 1. sentence_length_variance — CV normalized: 0 → 0, 1.0+ → 1
  const sentMean = avgSentLen;
  const sentVariance = sentLengths.length > 1
    ? sentLengths.reduce((sum, l) => sum + Math.pow(l - sentMean, 2), 0) / sentLengths.length : 0;
  const sentCV = sentMean > 0 ? Math.sqrt(sentVariance) / sentMean : 0;
  const dim1 = clamp01(sentCV / 1.0);

  // 2. TTR — sliding window
  const windowSize = Math.min(500, wordCount);
  const windowWords = words.slice(0, windowSize);
  const ttr = new Set(windowWords).size / windowSize;
  const dim2 = clamp01(ttr);

  // 3. vocabulary_sophistication — ratio of sophisticated words
  let sophCount = 0;
  for (const w of words) {
    if (SOPHISTICATED_WORDS.includes(w)) sophCount++;
  }
  const sophRatio = sophCount / wordCount;
  // Normalize: 0 → 0, 0.02+ → 1
  const dim3 = clamp01(sophRatio / 0.02);

  // 4. passive_voice_ratio — detect "was/were/is/are/been/being + past participle"
  const passiveRegex = /\b(?:was|were|is|are|been|being|be)\s+\w+(?:ed|en|t)\b/gi;
  const passiveMatches = text.match(passiveRegex) || [];
  const passiveRatio = sentences.length > 0 ? passiveMatches.length / sentences.length : 0;
  const dim4 = clamp01(passiveRatio / 0.5); // 50%+ sentences passive → 1

  // 5. avg_paragraph_length — normalize: 20 words → 0, 200+ words → 1
  const paraLengths = paragraphs.map(p => p.split(/\s+/).length);
  const avgParaLen = paraLengths.length > 0
    ? paraLengths.reduce((a, b) => a + b, 0) / paraLengths.length : 50;
  const dim5 = clamp01((avgParaLen - 20) / 180);

  // 6. paragraph_rhythm_variance — CV of paragraph lengths
  const paraMean = avgParaLen;
  const paraVariance = paraLengths.length > 1
    ? paraLengths.reduce((sum, l) => sum + Math.pow(l - paraMean, 2), 0) / paraLengths.length : 0;
  const paraCV = paraMean > 0 ? Math.sqrt(paraVariance) / paraMean : 0;
  const dim6 = clamp01(paraCV / 1.0);

  // 7. question_frequency — ratio of sentences ending with ?
  const questionCount = sentences.filter(s => s.trim().endsWith('?')).length;
  const dim7 = sentences.length > 0 ? clamp01(questionCount / sentences.length / 0.2) : 0;

  // 8. exclamation_frequency — ratio of sentences ending with !
  const exclamCount = sentences.filter(s => s.trim().endsWith('!')).length;
  const dim8 = sentences.length > 0 ? clamp01(exclamCount / sentences.length / 0.15) : 0;

  // 9. formality_score — formal / (formal + informal) markers
  const textLower = text.toLowerCase();
  let formalCount = 0;
  for (const marker of FORMAL_MARKERS) {
    const re = new RegExp('\\b' + marker.replace(/\s+/g, '\\s+') + '\\b', 'gi');
    const m = textLower.match(re);
    if (m) formalCount += m.length;
  }
  let informalCount = 0;
  for (const marker of INFORMAL_MARKERS) {
    const re = new RegExp('\\b' + marker.replace(/\s+/g, '\\s+') + '\\b', 'gi');
    const m = textLower.match(re);
    if (m) informalCount += m.length;
  }
  const totalFormality = formalCount + informalCount;
  const dim9 = totalFormality > 0 ? clamp01(formalCount / totalFormality) : 0.5;

  // 10. first_person_ratio — first-person words per 1000 words, normalized
  let fpCount = 0;
  for (const w of words) {
    if (FIRST_PERSON_WORDS.includes(w)) fpCount++;
  }
  const fpPer1000 = (fpCount / wordCount) * 1000;
  const dim10 = clamp01(fpPer1000 / 40); // 40 per 1000 → 1

  // 11. analogy_metaphor_density — markers per 1000 words
  let analogyCount = 0;
  for (const marker of ANALOGY_MARKERS) {
    const re = new RegExp('\\b' + marker.replace(/\s+/g, '\\s+') + '\\b', 'gi');
    const m = textLower.match(re);
    if (m) analogyCount += m.length;
  }
  const analogyPer1000 = (analogyCount / wordCount) * 1000;
  const dim11 = clamp01(analogyPer1000 / 5); // 5 per 1000 → 1

  return [dim0, dim1, dim2, dim3, dim4, dim5, dim6, dim7, dim8, dim9, dim10, dim11]
    .map(v => round4(v));
}

/** Clamp a value to [0, 1] */
function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

/** Round to 4 decimal places */
function round4(v) {
  return Math.round(v * 10000) / 10000;
}

// ── HDBSCAN Clustering (VI-002) ────────────────────────────────

const HDBSCAN_DEFAULTS = {
  minClusterSize: 5,
  minSamples: 3
};

/**
 * Euclidean distance between two vectors.
 */
function euclideanDist(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/**
 * Compute the core distance for each point.
 * Core distance = distance to the k-th nearest neighbor (k = minSamples).
 */
function computeCoreDistances(distMatrix, minSamples) {
  const n = distMatrix.length;
  const coreDistances = new Array(n);
  for (let i = 0; i < n; i++) {
    const dists = [];
    for (let j = 0; j < n; j++) {
      if (i !== j) dists.push(distMatrix[i][j]);
    }
    dists.sort((a, b) => a - b);
    // k-th nearest neighbor (0-indexed, so minSamples-1)
    coreDistances[i] = dists[Math.min(minSamples - 1, dists.length - 1)];
  }
  return coreDistances;
}

/**
 * Compute mutual reachability distance matrix.
 * mrd(a, b) = max(core(a), core(b), dist(a, b))
 */
function computeMutualReachability(distMatrix, coreDistances) {
  const n = distMatrix.length;
  const mrd = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = Math.max(coreDistances[i], coreDistances[j], distMatrix[i][j]);
      mrd[i][j] = d;
      mrd[j][i] = d;
    }
  }
  return mrd;
}

/**
 * Build a Minimum Spanning Tree using Prim's algorithm.
 * Returns edges sorted by weight ascending.
 */
function buildMST(mrd) {
  const n = mrd.length;
  if (n === 0) return [];

  const inMST = new Array(n).fill(false);
  const minEdge = new Array(n).fill(Infinity);
  const minFrom = new Array(n).fill(-1);
  const edges = [];

  minEdge[0] = 0;

  for (let iter = 0; iter < n; iter++) {
    // Find the non-MST vertex with minimum edge weight
    let u = -1;
    for (let v = 0; v < n; v++) {
      if (!inMST[v] && (u === -1 || minEdge[v] < minEdge[u])) {
        u = v;
      }
    }

    inMST[u] = true;

    if (minFrom[u] !== -1) {
      edges.push({ from: minFrom[u], to: u, weight: minEdge[u] });
    }

    // Update minimum edges for neighbors
    for (let v = 0; v < n; v++) {
      if (!inMST[v] && mrd[u][v] < minEdge[v]) {
        minEdge[v] = mrd[u][v];
        minFrom[v] = u;
      }
    }
  }

  edges.sort((a, b) => a.weight - b.weight);
  return edges;
}

/**
 * Build a dendrogram from MST edges by iteratively removing edges
 * from highest to lowest weight and tracking connected components.
 *
 * Uses Union-Find for efficient component tracking.
 */
function buildDendrogram(edges, n) {
  // Union-Find
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);
  const size = new Array(n).fill(1);

  function find(x) {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]]; // path compression
      x = parent[x];
    }
    return x;
  }

  function union(a, b) {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return;
    if (rank[ra] < rank[rb]) { parent[ra] = rb; size[rb] += size[ra]; }
    else if (rank[ra] > rank[rb]) { parent[rb] = ra; size[ra] += size[rb]; }
    else { parent[rb] = ra; size[ra] += size[rb]; rank[ra]++; }
  }

  // Build dendrogram levels — process edges from lowest to highest weight
  const levels = [];
  for (const edge of edges) {
    union(edge.from, edge.to);
    // Record the merge level
    levels.push({
      weight: edge.weight,
      components: getComponents(parent, n)
    });
  }

  return levels;
}

/**
 * Get connected components from Union-Find parent array.
 */
function getComponents(parent, n) {
  const components = new Map();
  for (let i = 0; i < n; i++) {
    let root = i;
    while (parent[root] !== root) root = parent[root];
    if (!components.has(root)) components.set(root, []);
    components.get(root).push(i);
  }
  return [...components.values()];
}

/**
 * Extract clusters from the dendrogram using stability-based selection.
 *
 * For each component that appears/disappears at different dendrogram levels,
 * compute stability = sum over points of (1/lambda_birth - 1/lambda_death).
 * Select the most stable partition.
 *
 * @param {Array} edges - MST edges sorted by weight
 * @param {number} n - Number of points
 * @param {number} minClusterSize - Minimum cluster size
 * @returns {number[]} Cluster labels (-1 = noise)
 */
function extractClusters(edges, n, minClusterSize) {
  if (n === 0) return [];
  if (n < minClusterSize) return new Array(n).fill(-1);

  // Union-Find for building hierarchy bottom-up
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);
  const compSize = new Array(n).fill(1);

  function find(x) {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  }

  // Track cluster birth/death lambdas
  // A cluster is "born" when its component reaches minClusterSize
  // and "dies" when it merges with another >= minClusterSize component
  const clusterBirth = new Map(); // root → lambda at birth
  const clusterMembers = new Map(); // root → [point indices]

  // Process edges in ascending weight order (descending lambda)
  for (const edge of edges) {
    const ra = find(edge.from);
    const rb = find(edge.to);
    if (ra === rb) continue;

    const lambda = edge.weight > 0 ? 1 / edge.weight : Infinity;
    const sizeA = compSize[ra];
    const sizeB = compSize[rb];

    // Before merge, check if either component was a valid cluster
    const aIsCluster = sizeA >= minClusterSize;
    const bIsCluster = sizeB >= minClusterSize;

    // Merge
    let newRoot;
    if (rank[ra] < rank[rb]) {
      parent[ra] = rb; compSize[rb] += compSize[ra]; newRoot = rb;
    } else if (rank[ra] > rank[rb]) {
      parent[rb] = ra; compSize[ra] += compSize[rb]; newRoot = ra;
    } else {
      parent[rb] = ra; compSize[ra] += compSize[rb]; rank[ra]++; newRoot = ra;
    }

    const newSize = compSize[newRoot];

    // If the merged component now reaches minClusterSize for the first time
    if (!aIsCluster && !bIsCluster && newSize >= minClusterSize) {
      clusterBirth.set(newRoot, lambda);
    }

    // If both were valid clusters, the less stable one "dies"
    if (aIsCluster && bIsCluster) {
      // Keep the one with earlier birth (lower lambda = born at higher distance)
      const birthA = clusterBirth.get(ra) || 0;
      const birthB = clusterBirth.get(rb) || 0;

      // Both clusters persist into the merged component
      // The merged entity inherits the older birth
      clusterBirth.set(newRoot, Math.min(birthA, birthB));
    } else if (aIsCluster && !bIsCluster) {
      clusterBirth.set(newRoot, clusterBirth.get(ra) || lambda);
    } else if (!aIsCluster && bIsCluster) {
      clusterBirth.set(newRoot, clusterBirth.get(rb) || lambda);
    }
  }

  // Simpler extraction: cut the dendrogram at the level that maximizes
  // the number of points in clusters of size >= minClusterSize
  // Walk through edge weights to find the best cut
  const bestLabels = extractByDendrogramCut(edges, n, minClusterSize);
  return bestLabels;
}

/**
 * Extract clusters by finding the optimal dendrogram cut level.
 * Tries each MST edge weight as a cut threshold and picks the one
 * that maximizes the number of clustered (non-noise) points.
 */
function extractByDendrogramCut(edges, n, minClusterSize) {
  if (edges.length === 0) return new Array(n).fill(n >= minClusterSize ? 0 : -1);

  let bestLabels = new Array(n).fill(-1);
  let bestClustered = 0;

  // Collect unique edge weights as candidate thresholds
  const thresholds = [...new Set(edges.map(e => e.weight))];
  thresholds.sort((a, b) => a - b);

  // Also try a threshold above all edges (all in one cluster)
  thresholds.push(thresholds[thresholds.length - 1] + 1);

  for (const threshold of thresholds) {
    const uf = Array.from({ length: n }, (_, i) => i);
    const sz = new Array(n).fill(1);

    function find(x) {
      while (uf[x] !== x) { uf[x] = uf[uf[x]]; x = uf[x]; }
      return x;
    }

    // Add all edges with weight <= threshold
    for (const edge of edges) {
      if (edge.weight > threshold) break;
      const ra = find(edge.from);
      const rb = find(edge.to);
      if (ra !== rb) {
        uf[ra] = rb;
        sz[rb] += sz[ra];
      }
    }

    // Collect components
    const comps = new Map();
    for (let i = 0; i < n; i++) {
      const root = find(i);
      if (!comps.has(root)) comps.set(root, []);
      comps.get(root).push(i);
    }

    // Label: clusters with >= minClusterSize get a cluster label, rest are noise
    const labels = new Array(n).fill(-1);
    let clusterId = 0;
    let clustered = 0;

    for (const [, members] of comps) {
      if (members.length >= minClusterSize) {
        for (const idx of members) {
          labels[idx] = clusterId;
        }
        clustered += members.length;
        clusterId++;
      }
    }

    if (clustered > bestClustered) {
      bestClustered = clustered;
      bestLabels = labels;
    }
  }

  return bestLabels;
}

/**
 * Run HDBSCAN clustering on feature vectors.
 *
 * @param {number[][]} vectors - Array of 12-dim feature vectors
 * @param {object} [options] - { minClusterSize, minSamples }
 * @returns {{ labels: number[], nClusters: number, noiseCount: number }}
 */
function hdbscan(vectors, options = {}) {
  const minClusterSize = options.minClusterSize || HDBSCAN_DEFAULTS.minClusterSize;
  const minSamples = options.minSamples || HDBSCAN_DEFAULTS.minSamples;
  const n = vectors.length;

  if (n === 0) return { labels: [], nClusters: 0, noiseCount: 0 };

  // Single-cluster fallback: if fewer than minClusterSize points
  if (n < minClusterSize) {
    return { labels: new Array(n).fill(-1), nClusters: 0, noiseCount: n };
  }

  // Step 1: Compute pairwise distance matrix
  const distMatrix = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = euclideanDist(vectors[i], vectors[j]);
      distMatrix[i][j] = d;
      distMatrix[j][i] = d;
    }
  }

  // Step 2: Core distances
  const coreDistances = computeCoreDistances(distMatrix, minSamples);

  // Step 3: Mutual reachability distance
  const mrd = computeMutualReachability(distMatrix, coreDistances);

  // Step 4: MST via Prim's
  const mstEdges = buildMST(mrd);

  // Step 5: Extract clusters from dendrogram
  const labels = extractClusters(mstEdges, n, minClusterSize);

  const uniqueLabels = new Set(labels.filter(l => l >= 0));
  const noiseCount = labels.filter(l => l === -1).length;

  return {
    labels,
    nClusters: uniqueLabels.size,
    noiseCount
  };
}

// ── Persona Generation (VI-002) ────────────────────────────────

const FEATURE_NAMES = [
  'avg_sentence_length', 'sentence_length_variance', 'ttr',
  'vocabulary_sophistication', 'passive_voice_ratio', 'avg_paragraph_length',
  'paragraph_rhythm_variance', 'question_frequency', 'exclamation_frequency',
  'formality_score', 'first_person_ratio', 'analogy_metaphor_density'
];

/**
 * Name templates based on dominant features.
 */
const PERSONA_NAME_TEMPLATES = [
  { features: ['first_person_ratio', 'exclamation_frequency'], name: 'The Conversationalist' },
  { features: ['formality_score', 'vocabulary_sophistication'], name: 'The Academic' },
  { features: ['avg_sentence_length', 'passive_voice_ratio'], name: 'The Detailed Analyst' },
  { features: ['question_frequency', 'analogy_metaphor_density'], name: 'The Curious Storyteller' },
  { features: ['sentence_length_variance', 'paragraph_rhythm_variance'], name: 'The Dynamic Writer' },
  { features: ['ttr', 'vocabulary_sophistication'], name: 'The Wordsmith' },
  { features: ['exclamation_frequency', 'analogy_metaphor_density'], name: 'The Passionate Narrator' },
  { features: ['formality_score', 'passive_voice_ratio'], name: 'The Corporate Voice' },
  { features: ['first_person_ratio', 'question_frequency'], name: 'The Personal Guide' },
  { features: ['avg_paragraph_length', 'avg_sentence_length'], name: 'The Long-Form Expert' }
];

/**
 * Generate a descriptive persona name from the dominant features of a centroid.
 */
function generatePersonaName(centroid, clusterIndex) {
  // Find the top 2 dominant features
  const indexed = centroid.map((v, i) => ({ idx: i, value: v, name: FEATURE_NAMES[i] }));
  indexed.sort((a, b) => b.value - a.value);
  const topFeatures = indexed.slice(0, 2).map(f => f.name);

  // Match against templates
  for (const template of PERSONA_NAME_TEMPLATES) {
    const matchCount = template.features.filter(f => topFeatures.includes(f)).length;
    if (matchCount >= 1) return template.name;
  }

  return `Writer Style ${clusterIndex + 1}`;
}

/**
 * Compute the centroid (mean vector) of a set of feature vectors.
 */
function computeCentroid(vectors) {
  const dim = vectors[0].length;
  const centroid = new Array(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) centroid[i] += v[i];
  }
  for (let i = 0; i < dim; i++) centroid[i] = round4(centroid[i] / vectors.length);
  return centroid;
}

/**
 * Find the N points closest to the centroid.
 */
function closestToCentroid(vectors, articles, centroid, n) {
  const distances = vectors.map((v, i) => ({ idx: i, dist: euclideanDist(v, centroid) }));
  distances.sort((a, b) => a.dist - b.dist);
  return distances.slice(0, n).map(d => articles[d.idx]);
}

/**
 * Build a voice profile object for a persona from its centroid.
 */
function buildVoiceProfile(centroid) {
  const c = {};
  FEATURE_NAMES.forEach((name, i) => { c[name] = centroid[i]; });

  // Derive descriptive attributes from centroid
  const voice = c.first_person_ratio > 0.4 ? 'personal and direct' :
    c.formality_score > 0.6 ? 'formal and authoritative' : 'balanced and accessible';

  const cadence = c.sentence_length_variance > 0.5 ? 'varied — mixes short punchy lines with longer exposition' :
    c.avg_sentence_length > 0.6 ? 'flowing — longer, complex sentences' : 'steady and measured';

  const structure = c.paragraph_rhythm_variance > 0.5 ? 'dynamic — paragraphs vary significantly in length' :
    c.avg_paragraph_length > 0.6 ? 'dense — longer paragraphs with detailed exploration' : 'consistent and structured';

  const numbers = c.vocabulary_sophistication > 0.5 ? 'uses precise, technical terminology' :
    'straightforward vocabulary, accessible numbers';

  const avoids = [];
  if (c.formality_score < 0.3) avoids.push('overly formal language');
  if (c.passive_voice_ratio < 0.2) avoids.push('passive voice');
  if (c.exclamation_frequency < 0.1) avoids.push('excessive exclamation marks');
  if (c.analogy_metaphor_density < 0.1) avoids.push('forced metaphors');

  const humor = c.exclamation_frequency > 0.4 && c.first_person_ratio > 0.3
    ? 'witty and engaging' : c.formality_score > 0.6 ? 'minimal — professional tone' : 'occasional light touches';

  const formality = c.formality_score > 0.7 ? 'high' : c.formality_score > 0.4 ? 'moderate' : 'casual';

  const headingStyle = c.question_frequency > 0.3 ? 'question-based headings that engage the reader' :
    c.formality_score > 0.6 ? 'descriptive, keyword-rich headings' : 'conversational, action-oriented headings';

  const tone = c.first_person_ratio > 0.5 ? 'warm and personal' :
    c.formality_score > 0.6 ? 'professional and detached' :
    c.analogy_metaphor_density > 0.3 ? 'creative and illustrative' : 'neutral and informative';

  return {
    voice,
    cadence,
    structure,
    numbers,
    avoids: avoids.length > 0 ? avoids : ['none identified'],
    ttr: round4(c.ttr),
    humor,
    formality,
    headingStyle,
    tone,
    feature_vector: centroid
  };
}

/**
 * Generate writer personas from HUMAN-classified articles using HDBSCAN clustering.
 *
 * @param {object[]} humanArticles - Articles classified as HUMAN (must have .article_text, .url)
 * @param {object} [options] - { minClusterSize, minSamples }
 * @returns {{ personas: object[], clusterResult: object }}
 */
function generatePersonas(humanArticles, options = {}) {
  const minClusterSize = options.minClusterSize || HDBSCAN_DEFAULTS.minClusterSize;
  const minSamples = options.minSamples || HDBSCAN_DEFAULTS.minSamples;

  if (!humanArticles || humanArticles.length === 0) {
    return { personas: [], clusterResult: { labels: [], nClusters: 0, noiseCount: 0 } };
  }

  // Extract 12-dim features for each article
  const vectors = humanArticles.map(a => extract12DimFeatures(a.article_text || ''));

  // Run HDBSCAN
  const clusterResult = hdbscan(vectors, { minClusterSize, minSamples });

  // Single-cluster fallback: if HDBSCAN finds 0 clusters, treat all as one cluster
  if (clusterResult.nClusters === 0 && humanArticles.length > 0) {
    const centroid = computeCentroid(vectors);
    const representative = closestToCentroid(vectors, humanArticles, centroid, 5);
    const persona = {
      id: crypto.randomUUID(),
      name: generatePersonaName(centroid, 0),
      voice_profile: buildVoiceProfile(centroid),
      representative_sentences: extractRepresentativeSentences(representative),
      source_articles: humanArticles.map(a => a.url).filter(Boolean),
      feature_vector: centroid,
      cluster_size: humanArticles.length,
      is_default: true
    };
    return { personas: [persona], clusterResult };
  }

  // Build personas per cluster
  const personas = [];
  const clusterMap = new Map();

  for (let i = 0; i < clusterResult.labels.length; i++) {
    const label = clusterResult.labels[i];
    if (label === -1) continue; // noise
    if (!clusterMap.has(label)) clusterMap.set(label, []);
    clusterMap.get(label).push(i);
  }

  // Find largest cluster for default assignment
  let largestCluster = -1;
  let largestSize = 0;
  for (const [label, indices] of clusterMap) {
    if (indices.length > largestSize) {
      largestSize = indices.length;
      largestCluster = label;
    }
  }

  for (const [label, indices] of clusterMap) {
    const clusterVectors = indices.map(i => vectors[i]);
    const clusterArticles = indices.map(i => humanArticles[i]);
    const centroid = computeCentroid(clusterVectors);
    const representative = closestToCentroid(clusterVectors, clusterArticles, centroid, 5);

    personas.push({
      id: crypto.randomUUID(),
      name: generatePersonaName(centroid, label),
      voice_profile: buildVoiceProfile(centroid),
      representative_sentences: extractRepresentativeSentences(representative),
      source_articles: clusterArticles.map(a => a.url).filter(Boolean),
      feature_vector: centroid,
      cluster_size: indices.length,
      is_default: label === largestCluster
    });
  }

  // Sort by cluster size descending
  personas.sort((a, b) => b.cluster_size - a.cluster_size);

  return { personas, clusterResult };
}

/**
 * Extract up to 5 representative sentences from articles closest to centroid.
 */
function extractRepresentativeSentences(articles) {
  const sentences = [];
  for (const article of articles) {
    if (!article.article_text) continue;
    const artSentences = splitSentences(article.article_text);
    // Pick the first non-trivial sentence
    for (const s of artSentences) {
      if (s.split(/\s+/).length >= 8 && s.split(/\s+/).length <= 50) {
        sentences.push(s.trim());
        break;
      }
    }
    if (sentences.length >= 5) break;
  }
  return sentences;
}

// ── Persona CRUD Handlers (VI-002) ─────────────────────────────

/**
 * GET /api/voice/personas — List all personas for user.
 */
async function handleListPersonas(userId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();
  const url = `${config.url}/rest/v1/writer_personas` +
    `?user_id=eq.${encodeURIComponent(userId)}` +
    `&order=created_at.desc`;

  const res = await fetch(url, {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey
    }
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error('Failed to fetch personas: ' + body);
  }

  const personas = await res.json();
  return { personas, total: personas.length };
}

/**
 * GET /api/voice/personas/:id — Get a single persona.
 */
async function handleGetPersona(userId, personaId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();
  const url = `${config.url}/rest/v1/writer_personas` +
    `?id=eq.${encodeURIComponent(personaId)}` +
    `&user_id=eq.${encodeURIComponent(userId)}` +
    `&limit=1`;

  const res = await fetch(url, {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey
    }
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error('Failed to fetch persona: ' + body);
  }

  const rows = await res.json();
  if (!rows || rows.length === 0) {
    throw new Error('Persona not found');
  }

  return rows[0];
}

/**
 * POST /api/voice/personas — Create a new persona (or trigger clustering).
 * Body: { siteUrl?: string, name?: string, voice_profile?: object }
 *
 * If siteUrl is provided, runs clustering on HUMAN articles from that session.
 * Otherwise, creates a manual persona.
 */
async function handleCreatePersona(userId, body) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  // If siteUrl provided, run clustering
  if (body.siteUrl) {
    // Fetch HUMAN-classified articles for this user
    const scoresUrl = `${config.url}/rest/v1/voice_match_scores` +
      `?user_id=eq.${encodeURIComponent(userId)}` +
      `&classification=eq.HUMAN` +
      `&select=id,url,article_text,signal_scores,word_count` +
      `&order=created_at.desc&limit=500`;

    const scoresRes = await fetch(scoresUrl, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    });

    if (!scoresRes.ok) throw new Error('Failed to fetch HUMAN articles');
    const humanArticles = await scoresRes.json();

    if (!humanArticles || humanArticles.length < 3) {
      throw new Error('Not enough HUMAN-classified articles for clustering. Need at least 3, found ' + (humanArticles ? humanArticles.length : 0));
    }

    logger.info('voice_clustering_start', { userId, articleCount: humanArticles.length });

    const { personas, clusterResult } = generatePersonas(humanArticles, {
      minClusterSize: body.minClusterSize || HDBSCAN_DEFAULTS.minClusterSize,
      minSamples: body.minSamples || HDBSCAN_DEFAULTS.minSamples
    });

    logger.info('voice_clustering_complete', {
      userId,
      clusters: clusterResult.nClusters,
      noise: clusterResult.noiseCount,
      personas: personas.length
    });

    // Store personas in database
    const stored = [];
    for (const persona of personas) {
      const record = {
        id: persona.id,
        user_id: userId,
        name: persona.name,
        voice_profile: persona.voice_profile,
        source_articles: persona.source_articles,
        feature_vector: persona.feature_vector,
        representative_sentences: persona.representative_sentences,
        cluster_size: persona.cluster_size,
        is_default: persona.is_default,
        created_at: new Date().toISOString()
      };

      const insertUrl = `${config.url}/rest/v1/writer_personas`;
      const insertRes = await fetch(insertUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': 'Bearer ' + serviceRoleKey,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(record)
      });

      if (insertRes.ok) {
        const rows = await insertRes.json();
        stored.push(rows[0] || record);
      } else {
        logger.error('voice_persona_insert_failed', { personaId: persona.id, status: insertRes.status });
        stored.push(record);
      }
    }

    return {
      personas: stored,
      clustering: {
        totalArticles: humanArticles.length,
        clusters: clusterResult.nClusters,
        noisePoints: clusterResult.noiseCount
      }
    };
  }

  // Manual persona creation
  if (!body.name || typeof body.name !== 'string') {
    throw new Error('name is required for manual persona creation');
  }

  const record = {
    id: crypto.randomUUID(),
    user_id: userId,
    name: body.name.slice(0, 100),
    voice_profile: body.voice_profile || {},
    source_articles: body.source_articles || [],
    feature_vector: body.feature_vector || new Array(12).fill(0.5),
    is_default: body.is_default || false,
    created_at: new Date().toISOString()
  };

  // If setting as default, unset existing defaults
  if (record.is_default) {
    await unsetDefaultPersonas(config, serviceRoleKey, userId);
  }

  const insertUrl = `${config.url}/rest/v1/writer_personas`;
  const insertRes = await fetch(insertUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(record)
  });

  if (!insertRes.ok) {
    const respBody = await insertRes.text();
    throw new Error('Failed to create persona: ' + respBody);
  }

  const rows = await insertRes.json();
  return rows[0] || record;
}

/**
 * PUT /api/voice/personas/:id — Update persona.
 */
async function handleUpdatePersona(userId, personaId, body) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  // Verify persona exists and belongs to user
  const existing = await handleGetPersona(userId, personaId);

  const updates = {};
  if (body.name && typeof body.name === 'string') updates.name = body.name.slice(0, 100);
  if (body.voice_profile && typeof body.voice_profile === 'object') updates.voice_profile = body.voice_profile;
  if (body.source_articles && Array.isArray(body.source_articles)) updates.source_articles = body.source_articles;
  if (body.feature_vector && Array.isArray(body.feature_vector)) updates.feature_vector = body.feature_vector;
  if (typeof body.is_default === 'boolean') {
    updates.is_default = body.is_default;
    // If setting as default, unset others
    if (body.is_default) {
      await unsetDefaultPersonas(config, serviceRoleKey, userId);
    }
  }

  updates.updated_at = new Date().toISOString();

  const patchUrl = `${config.url}/rest/v1/writer_personas` +
    `?id=eq.${encodeURIComponent(personaId)}` +
    `&user_id=eq.${encodeURIComponent(userId)}`;

  const patchRes = await fetch(patchUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(updates)
  });

  if (!patchRes.ok) {
    const respBody = await patchRes.text();
    throw new Error('Failed to update persona: ' + respBody);
  }

  const rows = await patchRes.json();
  return rows[0] || { ...existing, ...updates };
}

/**
 * DELETE /api/voice/personas/:id — Delete persona (prevent deleting last default).
 */
async function handleDeletePersona(userId, personaId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  // Verify persona exists and belongs to user
  const existing = await handleGetPersona(userId, personaId);

  // If it's the default, check if it's the last persona
  if (existing.is_default) {
    const countUrl = `${config.url}/rest/v1/writer_personas` +
      `?user_id=eq.${encodeURIComponent(userId)}` +
      `&select=id`;

    const countRes = await fetch(countUrl, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    });

    if (countRes.ok) {
      const all = await countRes.json();
      if (all.length <= 1) {
        throw new Error('Cannot delete the last default persona. Create another persona first or set a different default.');
      }
    }
  }

  const deleteUrl = `${config.url}/rest/v1/writer_personas` +
    `?id=eq.${encodeURIComponent(personaId)}` +
    `&user_id=eq.${encodeURIComponent(userId)}`;

  const deleteRes = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey,
      'Prefer': 'return=minimal'
    }
  });

  if (!deleteRes.ok) {
    const respBody = await deleteRes.text();
    throw new Error('Failed to delete persona: ' + respBody);
  }

  return { deleted: true, id: personaId };
}

/**
 * Unset all default personas for a user (before setting a new default).
 */
async function unsetDefaultPersonas(config, serviceRoleKey, userId) {
  const patchUrl = `${config.url}/rest/v1/writer_personas` +
    `?user_id=eq.${encodeURIComponent(userId)}` +
    `&is_default=eq.true`;

  await fetch(patchUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ is_default: false })
  });
}

// ── Voice Match — VI-003 ────────────────────────────────────────

/**
 * Score an article's text against a persona's voice profile.
 *
 * @param {string} userId - Authenticated user ID
 * @param {string} articleId - Article identifier (voice_match_scores row ID or URL-safe slug)
 * @param {string|null} personaId - Optional persona ID; uses default if null
 * @returns {object} Match result with similarity score and dimension breakdown
 */
async function handleVoiceMatch(userId, articleId, personaId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  // 1. Resolve persona
  let persona;
  if (personaId) {
    // Fetch specific persona
    const pUrl = `${config.url}/rest/v1/writer_personas` +
      `?id=eq.${encodeURIComponent(personaId)}` +
      `&user_id=eq.${encodeURIComponent(userId)}` +
      `&select=*`;
    const pRes = await fetch(pUrl, {
      headers: { 'apikey': serviceRoleKey, 'Authorization': 'Bearer ' + serviceRoleKey }
    });
    if (!pRes.ok) throw new Error('Failed to fetch persona');
    const personas = await pRes.json();
    if (!personas || personas.length === 0) throw new Error('Persona not found');
    persona = personas[0];
  } else {
    // Fetch default persona
    const pUrl = `${config.url}/rest/v1/writer_personas` +
      `?user_id=eq.${encodeURIComponent(userId)}` +
      `&is_default=eq.true` +
      `&select=*&limit=1`;
    const pRes = await fetch(pUrl, {
      headers: { 'apikey': serviceRoleKey, 'Authorization': 'Bearer ' + serviceRoleKey }
    });
    if (!pRes.ok) throw new Error('Failed to fetch default persona');
    const personas = await pRes.json();
    if (!personas || personas.length === 0) throw new Error('No persona found. Create a persona first via POST /api/voice/personas');
    persona = personas[0];
  }

  // 2. Fetch the article from voice_match_scores
  const aUrl = `${config.url}/rest/v1/voice_match_scores` +
    `?id=eq.${encodeURIComponent(articleId)}` +
    `&user_id=eq.${encodeURIComponent(userId)}` +
    `&select=id,url,title,article_text,word_count,signal_scores,ai_probability,classification`;
  const aRes = await fetch(aUrl, {
    headers: { 'apikey': serviceRoleKey, 'Authorization': 'Bearer ' + serviceRoleKey }
  });
  if (!aRes.ok) throw new Error('Failed to fetch article');
  const articles = await aRes.json();
  if (!articles || articles.length === 0) throw new Error('Article not found');
  const article = articles[0];

  // 3. Extract 12-dim features from article text
  const articleText = article.article_text || '';
  if (!articleText || articleText.split(/\s+/).length < MIN_WORD_COUNT) {
    throw new Error('Article text too short for voice matching (minimum ' + MIN_WORD_COUNT + ' words)');
  }
  const articleFeatures = extract12DimFeatures(articleText);

  // 4. Get persona feature vector
  const personaVector = persona.feature_vector;
  let personaFeatures;
  if (Array.isArray(personaVector)) {
    personaFeatures = personaVector;
  } else if (personaVector && typeof personaVector === 'object') {
    // JSONB stored as object with feature names
    personaFeatures = FEATURE_NAMES.map(name => personaVector[name] || 0);
  } else {
    throw new Error('Persona has no feature vector. Re-run corpus analysis to generate one.');
  }

  // 5. Compute similarity
  const distance = euclideanDist(articleFeatures, personaFeatures);
  const similarityScore = round4(1 / (1 + distance));

  // 6. Build dimension breakdown
  const dimensionScores = {};
  const deltas = [];
  FEATURE_NAMES.forEach((name, i) => {
    const articleVal = round4(articleFeatures[i]);
    const personaVal = round4(personaFeatures[i]);
    const delta = round4(Math.abs(articleVal - personaVal));
    dimensionScores[name] = { article: articleVal, persona: personaVal, delta };
    deltas.push({ name, delta });
  });

  // Sort by delta descending to find top divergences
  deltas.sort((a, b) => b.delta - a.delta);
  const topDivergences = deltas.slice(0, 3).map(d => d.name);

  // 7. Generate recommendation
  let recommendation;
  if (similarityScore >= 0.85) {
    recommendation = 'Excellent voice match. Article closely aligns with the persona voice profile.';
  } else if (similarityScore >= 0.70) {
    recommendation = `Good voice match. Minor adjustments to ${topDivergences[0]} would improve alignment.`;
  } else if (similarityScore >= 0.50) {
    recommendation = `Moderate match. Consider adjusting ${topDivergences.slice(0, 2).join(' and ')} for better alignment.`;
  } else {
    recommendation = `Low match. Article voice differs significantly from persona — review ${topDivergences.join(', ')}.`;
  }

  return {
    article_id: article.id,
    article_url: article.url,
    article_title: article.title,
    persona_id: persona.id,
    persona_name: persona.name,
    similarity_score: similarityScore,
    dimension_scores: dimensionScores,
    top_divergences: topDivergences,
    recommendation
  };
}

// ── Exports ────────────────────────────────────────────────────

module.exports = {
  // Pipeline
  runAnalysis,
  // API handlers (VI-001)
  handleAnalyzeTrigger,
  handleCorpusStatus,
  // API handlers (VI-003 — Voice Match)
  handleVoiceMatch,
  // API handlers (VI-002 — Persona CRUD)
  handleListPersonas,
  handleGetPersona,
  handleCreatePersona,
  handleUpdatePersona,
  handleDeletePersona,
  // Text extraction (exported for testing)
  extractArticleText,
  extractTitle,
  // Stylometric signals (exported for testing)
  signalSentenceLengthVariance,
  signalVocabularyDiversity,
  signalTransitionPatterns,
  signalParagraphRhythm,
  signalHedgeFrequency,
  signalFirstPersonUsage,
  analyzeText,
  // 12-dim features (VI-002, exported for testing)
  extract12DimFeatures,
  FEATURE_NAMES,
  // HDBSCAN (VI-002, exported for testing)
  hdbscan,
  euclideanDist,
  computeCoreDistances,
  computeMutualReachability,
  buildMST,
  extractClusters,
  // Persona generation (VI-002, exported for testing)
  generatePersonas,
  generatePersonaName,
  computeCentroid,
  buildVoiceProfile,
  // Helpers (exported for testing)
  splitSentences,
  splitParagraphs,
  tokenize,
  clamp01,
  round4,
  computeClassificationSummary,
  computeAggregateSignals,
  // Crawler (exported for testing)
  discoverFromSitemap,
  discoverFromBFS,
  extractUrlsFromSitemap,
  // Constants
  MIN_ARTICLES,
  MIN_WORD_COUNT,
  AI_TRANSITIONS,
  HEDGE_WORDS,
  FIRST_PERSON_WORDS,
  HDBSCAN_DEFAULTS
};
