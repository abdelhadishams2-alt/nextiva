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

  // 1. Main page component (Server Component — async, getTranslations)
  const pageContent = generatePageComponent({
    title, articleDesc, sections, images, meta, faq,
    keyTakeaways, slug, namespace, langConfig,
  });
  files.push({ path: `src/app/[locale]/${slug}/page.tsx`, content: pageContent });

  // 2. BEM CSS file in src/styles/
  const cssContent = generateBEMCSS(slug, sections, langConfig);
  files.push({ path: `src/styles/article-${slug}.css`, content: cssContent });

  // 3. Translation strings for messages/en.json
  const messages = generateMessages({
    title, articleDesc, sections, images, meta, faq,
    keyTakeaways, namespace,
  });

  // 4. Globals.css import line
  const globalsImport = `@import '../styles/article-${slug}.css';`;

  return { files, globalsImport, messages };
}

// ── Page Component (Server Component) ──────────────────────────────

function generatePageComponent(opts) {
  const {
    title, articleDesc, sections, images, meta, faq,
    keyTakeaways, slug, namespace, langConfig,
  } = opts;

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
    if (section.paragraphs && section.paragraphs.length > 0) {
      section.paragraphs.forEach((_, pIdx) => {
        lines.push(`                <p>{t('${sectionKey}P${pIdx + 1}')}</p>`);
      });
    } else if (section.content) {
      // Fallback: single content block
      lines.push(`                <p>{t('${sectionKey}Content')}</p>`);
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
    lines.push('                <div className="faq-grid">');
    faq.forEach((_, fIdx) => {
      lines.push(`                  <details className="faq-item">`);
      lines.push(`                    <summary>{t('faq${fIdx + 1}Q')}</summary>`);
      lines.push(`                    <p>{t('faq${fIdx + 1}A')}</p>`);
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

  // FAQ styles (if needed)
  lines.push('.faq-grid {');
  lines.push('  display: flex;');
  lines.push('  flex-direction: column;');
  lines.push('  gap: 12px;');
  lines.push('  margin-top: 24px;');
  lines.push('}');
  lines.push('');
  lines.push('.faq-item {');
  lines.push('  border: 1px solid var(--border);');
  lines.push('  border-radius: var(--radius-card);');
  lines.push('  padding: 0;');
  lines.push('  overflow: hidden;');
  lines.push('}');
  lines.push('');
  lines.push('.faq-item summary {');
  lines.push('  padding: 16px 24px;');
  lines.push('  font-weight: 600;');
  lines.push('  font-size: 15px;');
  lines.push('  cursor: pointer;');
  lines.push('  list-style: none;');
  lines.push('  color: var(--text-dark);');
  lines.push('  transition: background var(--duration) var(--ease);');
  lines.push('}');
  lines.push('');
  lines.push('.faq-item summary:hover {');
  lines.push('  background: var(--muted-bg);');
  lines.push('}');
  lines.push('');
  lines.push('.faq-item summary::-webkit-details-marker { display: none; }');
  lines.push('');
  lines.push('.faq-item p {');
  lines.push('  padding: 0 24px 16px;');
  lines.push('  margin: 0;');
  lines.push('  color: var(--text-muted);');
  lines.push('  font-size: 14px;');
  lines.push('  line-height: 1.7;');
  lines.push('}');
  lines.push('');

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

function generateMessages(opts) {
  const {
    title, articleDesc, sections, images, meta, faq,
    keyTakeaways, namespace,
  } = opts;

  const msgs = {};

  // Meta
  msgs.metaTitle = meta.metaTitle || title;
  msgs.metaDescription = meta.metaDescription || articleDesc || title;

  // Hero
  msgs.heroBadge = meta.category || 'Analysis';
  msgs.heroTitle = title;
  msgs.heroAuthor = meta.author || 'Mansati Editorial Team';
  msgs.heroDate = meta.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  msgs.heroReadTime = meta.readTime || '12 min read';
  msgs.heroImageAlt = meta.heroImageAlt || title;

  // Author
  msgs.authorInitials = getInitials(meta.author || 'Mansati Editorial');
  msgs.authorName = meta.author || 'Mansati Editorial Team';
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
      msgs[`${key}ImageCaption`] = section.imageCaption || `Source: ${meta.author || 'Mansati'} Research`;
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

  return { [`Articles`]: { [namespace]: msgs } };
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

module.exports = { description, extensions, generate };
