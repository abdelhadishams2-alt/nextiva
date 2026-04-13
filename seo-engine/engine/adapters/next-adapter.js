/**
 * Next.js Native Adapter — Generates pages matching project conventions.
 *
 * Output follows the host project's patterns:
 * - BEM CSS in src/styles/ (imported via globals.css)
 * - next-intl for all visible text (getTranslations server-side)
 * - [locale] dynamic segment routing
 * - Design tokens from tokens.css
 * - Server components (async) by default
 * - SITE_CONFIG for metadata URLs
 * - Shared UI components (ReadingProgress, TOCSidebar, TOCInline, etc.)
 */

const description = 'Next.js App Router with BEM CSS, next-intl, and [locale] routing';
const extensions = ['.tsx', '.jsx'];

/**
 * Generate a complete Next.js article page set.
 *
 * @param {object} ir - Intermediate representation of article content
 * @param {string} ir.title - Article title
 * @param {string} [ir.description] - Article description
 * @param {Array}  [ir.sections] - Array of section objects {id, title, sidebarLabel, content, type}
 * @param {Array}  [ir.images] - Array of image objects {src, alt, width, height}
 * @param {object} [ir.meta] - Metadata (author, date, readTime, keywords, canonical)
 * @param {Array}  [ir.faq] - FAQ items [{question, answer}]
 * @param {Array}  [ir.keyTakeaways] - Key takeaway strings
 * @param {object} [ir.langConfig] - Language configuration
 * @param {object} [ir.tokens] - Design tokens
 * @param {object} [ir.projectConfig] - Auto-detected project config
 * @returns {{ files: Array<{path: string, content: string}>, globalsImport: string, messages: object }}
 */
function generate(ir) {
  const {
    title,
    description: articleDesc,
    sections = [],
    images = [],
    meta = {},
    faq = [],
    keyTakeaways = [],
    langConfig = { direction: 'ltr', language: 'en' },
    projectConfig = {},
  } = ir;

  const slug = slugify(title);
  const namespace = camelCase(slug).replace(/[^a-zA-Z0-9]/g, '');
  const files = [];

  // 3. Translation strings for messages/en.json (generate FIRST to know which keys have HTML)
  const messagesResult = generateMessages({
    title, articleDesc, sections, images, meta, faq,
    keyTakeaways, namespace,
  }, { projectConfig });
  const htmlKeys = messagesResult._htmlKeys || [];

  // 1. Main page component (Server Component — async, getTranslations)
  const pageContent = generatePageComponent({
    title, articleDesc, sections, images, meta, faq,
    keyTakeaways, slug, namespace, langConfig, htmlKeys,
  });
  files.push({ path: `src/app/[locale]/${slug}/page.tsx`, content: pageContent });

  // 2. BEM CSS file in src/styles/
  const cssContent = generateBEMCSS(slug, sections, langConfig);
  files.push({ path: `src/styles/article-${slug}.css`, content: cssContent });

  // Messages already generated above (before page component, to extract htmlKeys)
  const messages = { Articles: messagesResult.Articles };

  // 4. Globals.css import line
  const globalsImport = `@import '../styles/article-${slug}.css';`;

  // 5. Blog listing entry (for blogs/page.tsx)
  const blogEntry = {
    slug,
    image: `/assets/articles/${slug}-1.webp`,
    badge: meta.category || 'Article',
    title,
    excerpt: articleDesc || title,
    date: meta.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    readTime: meta.readTime || '10 min read',
    category: meta.articleType || 'general',
  };

  return { files, globalsImport, messages, blogEntry };
}

// ── Page Component (Server Component) ──────────────────────────────

function generatePageComponent(opts) {
  const {
    title, articleDesc, sections, images, meta, faq,
    keyTakeaways, slug, namespace, langConfig, htmlKeys = [],
  } = opts;

  const htmlKeySet = new Set(htmlKeys);

  // Helper: render a translation key as JSX.
  // Uses t.raw() + dangerouslySetInnerHTML for keys containing HTML (affiliate links).
  // Uses plain t() for plain text keys.
  // SAFETY: All HTML in translations is developer-controlled i18n content (affiliate links
  // injected by injectAffiliateLinks), never user-generated input.
  function renderT(key, tag, indent) {
    if (htmlKeySet.has(key)) {
      return `${indent}<${tag} dangerouslySetInnerHTML={{ __html: t.raw('${key}') }} />`;
    }
    return `${indent}<${tag}>{t('${key}')}</${tag}>`;
  }

  // Helper: render a dynamic key (template literal) — always uses t.raw() since
  // dynamic keys may resolve to HTML-containing values at runtime.
  // SAFETY: same as renderT — only developer-controlled i18n content.
  function renderDynamic(keyTemplate, tag, indent) {
    return `${indent}<${tag} dangerouslySetInnerHTML={{ __html: t.raw(\`${keyTemplate}\`) }} />`;
  }

  const heroImage = images.length > 0 ? images[0] : null;
  const dir = langConfig.direction || 'ltr';

  // Build tocItems array
  const tocItems = sections
    .filter(s => s.title)
    .map((s, i) => ({
      id: s.id || `section-${i + 2}`,
      label: s.sidebarLabel || truncate(s.title, 30),
    }));

  const tocItemsFull = sections
    .filter(s => s.title)
    .map((s, i) => ({
      id: s.id || `section-${i + 2}`,
      label: s.title,
    }));

  const lines = [];

  // Imports
  lines.push("import { getTranslations } from 'next-intl/server';");
  lines.push("import { SITE_CONFIG } from '@/config/site';");
  lines.push("import ReadingProgress from '@/components/ui/ReadingProgress';");
  lines.push("import TOCSidebar from '@/components/ui/TOCSidebar';");
  lines.push("import TOCInline from '@/components/ui/TOCInline';");
  lines.push("import ShareButtons from '@/components/ui/ShareButtons';");
  lines.push("import FadeUpObserver from '@/components/ui/FadeUpObserver';");
  lines.push("import { Navbar } from '@/components/sections/Navbar';");
  lines.push("import { CallToAction } from '@/components/sections/CallToAction';");
  lines.push("import { Footer } from '@/components/sections/Footer';");
  lines.push('');

  // TOC data
  lines.push(`const tocItems = ${JSON.stringify(tocItems, null, 2)};`);
  lines.push('');
  lines.push(`const tocItemsFull = ${JSON.stringify(tocItemsFull, null, 2)};`);
  lines.push('');

  // generateMetadata
  lines.push('export async function generateMetadata() {');
  lines.push(`  const t = await getTranslations('Articles.${namespace}');`);
  lines.push("  const title = t('metaTitle');");
  lines.push("  const description = t('metaDescription');");
  lines.push('  return {');
  lines.push('    title,');
  lines.push('    description,');
  if (meta.keywords) {
    lines.push(`    keywords: ${JSON.stringify(meta.keywords)},`);
  }
  lines.push('    openGraph: {');
  lines.push('      title,');
  lines.push('      description,');
  lines.push(`      url: \`\${SITE_CONFIG.url}/${slug}\`,`);
  lines.push('      siteName: SITE_CONFIG.name,');
  if (heroImage) {
    lines.push(`      images: [{ url: \`\${SITE_CONFIG.url}/assets/articles/${slug}-1.webp\`, width: 1200, height: 630, alt: title }],`);
  }
  lines.push("      type: 'article',");
  if (meta.publishedTime) {
    lines.push(`      publishedTime: ${JSON.stringify(meta.publishedTime)},`);
  }
  lines.push('      authors: [SITE_CONFIG.author],');
  lines.push('    },');
  lines.push('    twitter: {');
  lines.push("      card: 'summary_large_image',");
  lines.push('      title,');
  lines.push('      description,');
  if (heroImage) {
    lines.push(`      images: [\`\${SITE_CONFIG.url}/assets/articles/${slug}-1.webp\`],`);
  }
  lines.push('    },');
  lines.push('    alternates: {');
  lines.push(`      canonical: \`\${SITE_CONFIG.url}/${slug}\`,`);
  lines.push('    },');
  lines.push('  };');
  lines.push('}');
  lines.push('');

  // Main component
  const fnName = pascalCase(slug) + 'Page';
  lines.push(`export default async function ${fnName}() {`);
  lines.push(`  const t = await getTranslations('Articles.${namespace}');`);
  lines.push('');
  lines.push('  return (');
  lines.push('    <>');
  lines.push('      <ReadingProgress />');
  lines.push('      <FadeUpObserver />');
  lines.push('      <Navbar transparent />');
  lines.push('');
  lines.push('      <main>');

  // Hero section
  lines.push("        {/* HERO */}");
  lines.push(`        <section id="section-1" className="article-section">`);
  lines.push('          <div className="article-hero-outer">');
  lines.push('            <div className="article-hero-inner">');
  lines.push('              <div className="article-hero-bg">');
  lines.push(`                <img src="/assets/articles/${slug}-1.webp" alt={t('heroImageAlt')} />`);
  lines.push('              </div>');
  lines.push('              <div className="article-hero-overlay" />');
  lines.push('              <div className="article-hero-content">');
  lines.push(`                <span className="hero-tag">{t('heroBadge')}</span>`);
  lines.push("                <h1>{t('heroTitle')}</h1>");
  lines.push('                <div className="hero-meta-row">');
  lines.push('                  <span>');
  lines.push('                    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>');
  lines.push("                    {t('heroAuthor')}");
  lines.push('                  </span>');
  lines.push('                  <span>');
  lines.push('                    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>');
  lines.push("                    {t('heroDate')}");
  lines.push('                  </span>');
  lines.push('                  <span className="reading-time">');
  lines.push('                    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>');
  lines.push("                    {t('heroReadTime')}");
  lines.push('                  </span>');
  lines.push('                </div>');
  lines.push('              </div>');
  lines.push('            </div>');
  lines.push('          </div>');
  lines.push('        </section>');
  lines.push('');

  // Article layout with sidebar
  lines.push('        <div className="container-article">');
  lines.push('          <div className="article-layout">');
  lines.push('            <TOCSidebar items={tocItems} />');
  lines.push('            <div className="article-main">');
  lines.push('              <TOCInline items={tocItemsFull} />');
  lines.push('');

  // Author box
  lines.push('              {/* Author Box */}');
  lines.push('              <div className="author-box">');
  lines.push("                <div className=\"author-avatar\">{t('authorInitials')}</div>");
  lines.push('                <div className="author-info">');
  lines.push("                  <span className=\"author-name\">{t('authorName')}</span>");
  lines.push("                  <span className=\"author-meta\">{t('authorMeta')}</span>");
  lines.push('                </div>');
  lines.push('              </div>');
  lines.push('');

  // Key takeaways
  if (keyTakeaways.length > 0) {
    lines.push('              {/* Key Takeaways */}');
    lines.push('              <div className="key-takeaways">');
    lines.push("                <h4>{t('keyTakeawaysLabel')}</h4>");
    lines.push('                <ul>');
    lines.push(`                  {[${keyTakeaways.map((_, i) => i + 1).join(', ')}].map((n) => (`);
    lines.push('                    <li key={n}>{t(`keyTakeaway${n}`)}</li>');
    lines.push('                  ))}');
    lines.push('                </ul>');
    lines.push('              </div>');
    lines.push('');
  }

  // Content sections
  sections.forEach((section, i) => {
    const sectionId = section.id || `section-${i + 2}`;
    const sectionKey = `s${i + 2}`;
    lines.push(`              {/* SECTION ${i + 2} — ${section.title || 'Content'} */}`);
    lines.push(`              <section id="${sectionId}" className="fade-up article-section">`);

    if (section.title) {
      lines.push(`                <h2>{t('${sectionKey}Title')}</h2>`);
    }

    // Section content — paragraphs use translation keys
    // Uses t.raw() for keys containing HTML (affiliate links), plain t() otherwise
    if (section.paragraphs && section.paragraphs.length > 0) {
      section.paragraphs.forEach((_, pIdx) => {
        const pKey = `${sectionKey}P${pIdx + 1}`;
        lines.push(renderT(pKey, 'p', '                '));
      });
    } else if (section.content) {
      const cKey = `${sectionKey}Content`;
      lines.push(renderT(cKey, 'p', '                '));
    }

    // Section image
    const sectionImage = images.find(img => img.sectionId === sectionId) || (i < images.length - 1 ? images[i + 1] : null);
    if (sectionImage && i % 2 === 0 && i < 6) {
      const imgIdx = images.indexOf(sectionImage) + 1;
      lines.push('                <figure className="article-image article-image--contextual">');
      lines.push(`                  <img src="/assets/articles/${slug}-${imgIdx}.webp" alt={t('${sectionKey}ImageAlt')} />`);
      lines.push(`                  <figcaption>{t('${sectionKey}ImageCaption')}</figcaption>`);
      lines.push('                </figure>');
    }

    lines.push('              </section>');
    lines.push('');
  });

  // FAQ section
  if (faq.length > 0) {
    lines.push('              {/* FAQ */}');
    lines.push('              <section className="fade-up article-section">');
    lines.push("                <h2>{t('faqTitle')}</h2>");
    lines.push('                <div className="shopify-guide__faq-list">');
    faq.forEach((_, fIdx) => {
      const aKey = `faq${fIdx + 1}A`;
      lines.push(`                  <details className="shopify-guide__faq-item">`);
      lines.push(`                    <summary>{t('faq${fIdx + 1}Q')}</summary>`);
      lines.push(renderT(aKey, 'p', '                    '));
      lines.push('                  </details>');
    });
    lines.push('                </div>');
    lines.push('              </section>');
    lines.push('');
  }

  // Share buttons
  lines.push('              {/* Share */}');
  lines.push(`              <ShareButtons url={\`\${SITE_CONFIG.url}/${slug}\`} title={t('metaTitle')} />`);
  lines.push('');

  // Close article-main, article-layout, container
  lines.push('            </div>');
  lines.push('          </div>');
  lines.push('        </div>');
  lines.push('      </main>');
  lines.push('');
  lines.push('      <CallToAction />');
  lines.push('      <Footer />');
  lines.push('    </>');
  lines.push('  );');
  lines.push('}');

  return lines.join('\n');
}

// ── BEM CSS Generator ──────────────────────────────────────────────

function generateBEMCSS(slug, sections, langConfig) {
  const dir = langConfig.direction || 'ltr';
  const isRTL = dir === 'rtl';

  const lines = [];
  lines.push('/* ----------------------------------------------------------------');
  lines.push(`   Article: ${slug} — Auto-generated by SEO Engine`);
  lines.push('   Uses shared article.css base styles + article design tokens');
  lines.push('   ---------------------------------------------------------------- */');
  lines.push('');
  lines.push('/* ----------------------------------------------------------------');
  lines.push('   Article-Specific Overrides');
  lines.push('   ---------------------------------------------------------------- */');
  lines.push('');

  // FAQ uses shared shopify-guide__faq-list / shopify-guide__faq-item styles from article.css


  // RTL overrides
  if (isRTL) {
    lines.push('/* ----------------------------------------------------------------');
    lines.push('   RTL Overrides');
    lines.push('   ---------------------------------------------------------------- */');
    lines.push('.article-layout { direction: rtl; }');
    lines.push('.toc-sidebar-inner { border-right: none; border-left: 2px solid var(--border); }');
    lines.push('.toc-sidebar-list li a { border-right: none; border-left: 2px solid transparent; margin-right: 0; margin-left: -2px; }');
    lines.push('.toc-sidebar-list li a.active { border-left-color: var(--primary); }');
    lines.push('');
  }

  return lines.join('\n');
}

// ── Translation Messages Generator ─────────────────────────────────

function generateMessages(opts, extra = {}) {
  const {
    title, articleDesc, sections, images, meta, faq,
    keyTakeaways, namespace,
  } = opts;
  const { projectConfig } = extra;

  const msgs = {};

  // Meta
  msgs.metaTitle = meta.metaTitle || title;
  msgs.metaDescription = meta.metaDescription || articleDesc || title;

  // Hero
  msgs.heroBadge = meta.category || 'Analysis';
  msgs.heroTitle = title;
  msgs.heroAuthor = meta.author || 'lkwjd Editorial Team';
  msgs.heroDate = meta.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  msgs.heroReadTime = meta.readTime || '12 min read';
  msgs.heroImageAlt = meta.heroImageAlt || title;

  // Author
  msgs.authorInitials = getInitials(meta.author || 'lkwjd Editorial');
  msgs.authorName = meta.author || 'lkwjd Editorial Team';
  msgs.authorMeta = meta.authorMeta || 'Expert Analysis & Research';

  // Key takeaways
  if (keyTakeaways.length > 0) {
    msgs.keyTakeawaysLabel = 'Key Takeaways';
    keyTakeaways.forEach((text, i) => {
      msgs[`keyTakeaway${i + 1}`] = text;
    });
  }

  // Sections
  sections.forEach((section, i) => {
    const key = `s${i + 2}`;
    if (section.title) msgs[`${key}Title`] = section.title;
    if (section.paragraphs && section.paragraphs.length > 0) {
      section.paragraphs.forEach((p, pIdx) => {
        msgs[`${key}P${pIdx + 1}`] = p;
      });
    } else if (section.content) {
      msgs[`${key}Content`] = section.content;
    }

    // Image alt/caption
    if (i % 2 === 0 && i < 6) {
      msgs[`${key}ImageAlt`] = section.imageAlt || `${section.title || title} illustration`;
      msgs[`${key}ImageCaption`] = section.imageCaption || `Source: ${meta.author || 'lkwjd'} Research`;
    }
  });

  // FAQ
  if (faq.length > 0) {
    msgs.faqTitle = 'Frequently Asked Questions';
    faq.forEach((item, i) => {
      msgs[`faq${i + 1}Q`] = item.question;
      msgs[`faq${i + 1}A`] = item.answer;
    });
  }

  // Inject affiliate hyperlinks into text that mentions tool/platform names
  // Converts plain text mentions like "shopify.com" into /out/ affiliate links
  injectAffiliateLinks(msgs, projectConfig || {});

  // Escape all values for next-intl ICU safety (prevents { } in CSS/code from breaking)
  for (const key of Object.keys(msgs)) {
    msgs[key] = escapeICU(msgs[key]);
  }

  // Track which keys contain HTML (for t.raw() usage in page.tsx)
  const htmlKeys = new Set();
  for (const key of Object.keys(msgs)) {
    if (typeof msgs[key] === 'string' && /<[a-z][\s\S]*>/i.test(msgs[key])) {
      htmlKeys.add(key);
    }
  }

  return { [`Articles`]: { [namespace]: msgs }, _htmlKeys: [...htmlKeys] };
}

// ── Utilities ──────────────────────────────────────────────────────

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function camelCase(slug) {
  return slug.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function pascalCase(slug) {
  const cc = camelCase(slug);
  // Ensure it starts with a letter (valid JS identifier)
  const result = cc.charAt(0).toUpperCase() + cc.slice(1);
  return result.replace(/[^a-zA-Z0-9]/g, '');
}

function truncate(str, len) {
  if (!str) return '';
  if (str.length <= len) return str;
  return str.slice(0, len).replace(/\s+\S*$/, '') + '...';
}

function getInitials(name) {
  if (!name) return 'ME';
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/**
 * Inject affiliate hyperlinks into translation text.
 * Converts plain-text mentions of tool names, URLs, and UI labels into
 * /out/{partner}-{variant} affiliate links.
 *
 * Only injects into keys that contain step instructions, tips, or FAQ answers
 * (keys matching: *Step*, *Tip, *Intro, faq*A). Skips titles and labels.
 *
 * @param {object} msgs - Translation messages object (mutated in place)
 * @param {object} [projectConfig] - Project config with affiliate registry
 */
function injectAffiliateLinks(msgs, projectConfig = {}) {
  // Known tool domains and their partner slugs
  const LINK_PATTERNS = [
    { pattern: /\bshopify\.com\b/gi, partner: 'shopify', variant: 'signup', label: 'shopify.com' },
    { pattern: /\bwix\.com\b/gi, partner: 'wix', variant: 'signup', label: 'wix.com' },
    { pattern: /\bsalla\.sa\b/gi, partner: 'salla', variant: 'signup', label: 'salla.sa' },
    { pattern: /\bzid\.sa\b/gi, partner: 'zid', variant: 'signup', label: 'zid.sa' },
    { pattern: /\bfoodics\.com\b/gi, partner: 'foodics', variant: 'signup', label: 'foodics.com' },
    { pattern: /\bhostinger\.com\b/gi, partner: 'hostinger', variant: 'signup', label: 'hostinger.com' },
    { pattern: /\bodoo\.com\b/gi, partner: 'odoo', variant: 'signup', label: 'odoo.com' },
  ];

  // Standard affiliate link attributes
  const LINK_ATTRS = 'class="affiliate-text-link" target="_blank" rel="nofollow sponsored noopener"';

  // Verified Shopify app store slugs (validated against live app store)
  const VERIFIED_APP_SLUGS = {
    'tap-payments': 'tap',
    'tap': 'tap',
    'marmin': 'marmin-e-invoicing-ksa-test',
    'oto': 'oto',
    'sufio': 'sufio',
    'translate-and-adapt': 'translate-and-adapt',
    'translate': 'translate-and-adapt',
  };

  // Only inject into content keys (steps, tips, intros, FAQ answers)
  const INJECTABLE_KEY_PATTERN = /Step\d|Tip$|Intro$|faq\d+A$/;

  for (const key of Object.keys(msgs)) {
    if (!INJECTABLE_KEY_PATTERN.test(key)) continue;
    if (typeof msgs[key] !== 'string') continue;

    let text = msgs[key];
    // Skip if already contains <a> tags (already has links)
    if (/<a\s/.test(text)) continue;

    for (const { pattern, partner, variant, label } of LINK_PATTERNS) {
      if (pattern.test(text)) {
        text = text.replace(pattern, `<a href="/out/${partner}-${variant}" ${LINK_ATTRS}>${label}</a>`);
      }
    }
    msgs[key] = text;
  }
}

/**
 * Escape curly braces in translation values for next-intl ICU format.
 * next-intl treats { and } as ICU message syntax placeholders.
 * Literal braces (e.g. CSS code snippets) must be escaped as '{' and '}'.
 *
 * @param {string} text - Raw translation value
 * @returns {string} ICU-safe translation value
 */
function escapeICU(text) {
  if (typeof text !== 'string') return text;
  // Only escape if the braces are NOT valid ICU placeholders like {name} or {count, plural, ...}
  // Simple heuristic: if content between braces contains spaces, colons, or semicolons, it's code not ICU
  return text.replace(/\{([^}]*)\}/g, (match, inner) => {
    // Valid ICU: {name}, {count, plural, one {# item} other {# items}}
    // Invalid (code): { direction: rtl; }, { color: red }
    if (/[;:]/.test(inner) || /^\s/.test(inner)) {
      return "'{'" + inner + "'}'";
    }
    return match;
  });
}

module.exports = { description, extensions, generate, escapeICU };
