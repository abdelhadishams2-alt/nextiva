/**
 * Next.js Native Adapter test suite.
 *
 * Validates output structure, correct imports, metadata generation,
 * image component usage, link conversion, server/client split,
 * FAQ schema, generateStaticParams, layout, code blocks, lists, tables.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { generate } = require('../engine/adapters/next-adapter');

// ── Test IR fixtures ───────────────────────────────────────────────

const fullIR = {
  title: 'Getting Started with Next.js App Router',
  description: 'A comprehensive guide to the Next.js App Router architecture.',
  content: '<p>Welcome to the guide.</p><img src="/images/hero.png" alt="Hero" /><a href="/docs/intro">Read the docs</a><a href="https://external.com">External</a>',
  langConfig: { direction: 'ltr', language: 'en' },
  tokens: {},
  meta: { author: 'ChainIQ' },
  images: [
    { src: '/images/hero.png', alt: 'Hero image', width: 1200, height: 630 },
    { src: '/images/diagram.png', alt: 'Architecture diagram', width: 800, height: 450 },
  ],
  sections: [
    { id: 'intro', title: 'Introduction', sidebarLabel: 'Intro', content: '<p>This is the intro section.</p>' },
    { id: 'setup', title: 'Setup', content: '<p>Install dependencies.</p>' },
    { id: 'code-example', title: 'Code Example', type: 'code', content: 'npm install next', language: 'bash' },
    { id: 'features', title: 'Features', type: 'list', items: ['SSR', 'SSG', 'ISR'], ordered: false },
    { id: 'comparison', title: 'Comparison', type: 'table', headers: ['Feature', 'Pages', 'App'], rows: [['Routing', 'File', 'Folder'], ['Data', 'getStaticProps', 'fetch']] },
    { id: 'diagram', title: 'Diagram', type: 'image', src: '/images/diagram.png', alt: 'Architecture diagram', width: 800, height: 450 },
  ],
  projectConfig: { language: 'typescript', cssFramework: 'tailwind' },
  faq: [
    { question: 'What is the App Router?', answer: 'The App Router is the new routing system in Next.js 13+.' },
    { question: 'Is it stable?', answer: 'Yes, the App Router is stable since Next.js 13.4.' },
  ],
  generateLayout: true,
};

const minimalIR = {
  title: 'Minimal Article',
  langConfig: { direction: 'ltr', language: 'en' },
  projectConfig: {},
};

const jsIR = {
  title: 'JavaScript Article',
  description: 'Written in JS.',
  langConfig: { direction: 'ltr', language: 'en' },
  sections: [{ id: 'intro', title: 'Intro', content: '<p>Hello</p>' }],
  projectConfig: { language: 'javascript' },
};

const cssModuleIR = {
  title: 'CSS Module Article',
  description: 'No Tailwind here.',
  langConfig: { direction: 'ltr', language: 'en' },
  sections: [{ id: 'intro', title: 'Intro', content: '<p>Hello</p>' }],
  projectConfig: { language: 'typescript', cssFramework: 'css-modules' },
};

const rtlIR = {
  title: 'مقال بالعربية',
  description: 'مقال تجريبي',
  langConfig: { direction: 'rtl', language: 'ar' },
  sections: [{ id: 'intro', title: 'مقدمة', content: '<p>مرحبا</p>' }],
  projectConfig: { language: 'typescript', cssFramework: 'tailwind' },
};

const shadcnIR = {
  title: 'Shadcn Article',
  description: 'With shadcn/ui.',
  langConfig: { direction: 'ltr', language: 'en' },
  sections: [
    { id: 'intro', title: 'Introduction', content: '<p>Hello</p>' },
    { id: 'details', title: 'Details', content: '<p>More info</p>' },
  ],
  projectConfig: { language: 'typescript', cssFramework: 'tailwind', hasShadcn: true },
};

// ── Tests ──────────────────────────────────────────────────────────

describe('Next.js Native Adapter', () => {

  // ── Output Structure ─────────────────────────────────────────────

  describe('output structure', () => {
    it('should return an object with files array', () => {
      const result = generate(fullIR);
      assert.ok(result);
      assert.ok(Array.isArray(result.files));
      assert.ok(result.files.length > 0);
    });

    it('should generate page.tsx, edit-overlay.tsx, and layout.tsx for full IR', () => {
      const result = generate(fullIR);
      const paths = result.files.map(f => f.path);
      const slug = 'getting-started-with-nextjs-app-router';
      assert.ok(paths.some(p => p.includes(`${slug}/page.tsx`)), 'missing page.tsx');
      assert.ok(paths.some(p => p.includes(`${slug}/edit-overlay.tsx`)), 'missing edit-overlay.tsx');
      assert.ok(paths.some(p => p.includes(`${slug}/layout.tsx`)), 'missing layout.tsx');
    });

    it('should generate .jsx files for JavaScript projects', () => {
      const result = generate(jsIR);
      const paths = result.files.map(f => f.path);
      const componentFiles = paths.filter(p => !p.endsWith('.css'));
      assert.ok(componentFiles.every(p => p.endsWith('.jsx')), 'component files should be .jsx');
      assert.ok(!componentFiles.some(p => p.endsWith('.tsx')), 'should not have .tsx files for JS projects');
    });

    it('should generate CSS module when Tailwind is not detected', () => {
      const result = generate(cssModuleIR);
      const paths = result.files.map(f => f.path);
      assert.ok(paths.some(p => p.endsWith('.module.css')), 'missing CSS module');
    });

    it('should NOT generate CSS module when Tailwind is detected', () => {
      const result = generate(fullIR);
      const paths = result.files.map(f => f.path);
      assert.ok(!paths.some(p => p.endsWith('.module.css')), 'should not have CSS module with Tailwind');
    });

    it('should not generate layout.tsx when generateLayout is false', () => {
      const result = generate(minimalIR);
      const paths = result.files.map(f => f.path);
      assert.ok(!paths.some(p => p.includes('layout.')), 'should not have layout file');
    });

    it('should place files under app/articles/{slug}/', () => {
      const result = generate(fullIR);
      for (const file of result.files) {
        assert.ok(file.path.startsWith('app/articles/'), `${file.path} should start with app/articles/`);
      }
    });
  });

  // ── Correct Imports ──────────────────────────────────────────────

  describe('imports', () => {
    it('should import Image from next/image', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes("import Image from 'next/image';"), 'missing next/image import');
    });

    it('should import Link from next/link', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes("import Link from 'next/link';"), 'missing next/link import');
    });

    it('should import Metadata type in TypeScript', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes("import type { Metadata } from 'next';"), 'missing Metadata type import');
    });

    it('should not import Metadata type in JavaScript', () => {
      const result = generate(jsIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(!page.content.includes("import type { Metadata }"), 'should not have Metadata type in JS');
    });

    it('should import CSS module when not using Tailwind', () => {
      const result = generate(cssModuleIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes("import styles from './article.module.css';"), 'missing CSS module import');
    });

    it('should import EditOverlay', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes("import EditOverlay from './edit-overlay';"), 'missing EditOverlay import');
    });
  });

  // ── Metadata Generation ──────────────────────────────────────────

  describe('metadata export', () => {
    it('should export metadata with title', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('export const metadata'), 'missing metadata export');
      assert.ok(page.content.includes('"Getting Started with Next.js App Router"'), 'missing title in metadata');
    });

    it('should include description in metadata', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('"A comprehensive guide to the Next.js App Router architecture."'), 'missing description');
    });

    it('should include openGraph in metadata', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('openGraph:'), 'missing openGraph');
      assert.ok(page.content.includes("type: 'article'"), 'missing openGraph type');
    });

    it('should include openGraph images when images provided', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('images:'), 'missing openGraph images');
      assert.ok(page.content.includes('/images/hero.png'), 'missing hero image in openGraph');
    });

    it('should type metadata with Metadata in TypeScript', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('export const metadata: Metadata'), 'missing Metadata type annotation');
    });
  });

  // ── Image Component Usage ────────────────────────────────────────

  describe('image component usage', () => {
    it('should use <Image> instead of <img> for inline images', () => {
      const irWithImg = {
        ...minimalIR,
        content: '<img src="/photo.jpg" alt="A photo" />',
        projectConfig: { language: 'typescript', cssFramework: 'tailwind' },
      };
      const result = generate(irWithImg);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('<Image src="/photo.jpg"'), 'should use Image component');
      assert.ok(!page.content.includes('<img'), 'should not have raw <img> tags');
    });

    it('should include width and height on Image components', () => {
      const irWithImg = {
        ...minimalIR,
        content: '<img src="/photo.jpg" alt="A photo" />',
        projectConfig: { language: 'typescript', cssFramework: 'tailwind' },
      };
      const result = generate(irWithImg);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('width={'), 'missing width on Image');
      assert.ok(page.content.includes('height={'), 'missing height on Image');
    });

    it('should include alt attribute on Image components', () => {
      const irWithImg = {
        ...minimalIR,
        content: '<img src="/photo.jpg" alt="A photo" />',
        projectConfig: { language: 'typescript', cssFramework: 'tailwind' },
      };
      const result = generate(irWithImg);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('alt="A photo"'), 'missing alt attribute');
    });

    it('should render hero image with priority', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('priority'), 'hero image should have priority prop');
    });
  });

  // ── Link Component Usage ─────────────────────────────────────────

  describe('link component usage', () => {
    it('should use <Link> for internal links', () => {
      // Use an IR with content (no sections) so fallback content path is used
      const linkIR = {
        title: 'Link Test',
        content: '<p><a href="/docs/intro">Read the docs</a> and <a href="https://external.com">External</a></p>',
        langConfig: { direction: 'ltr', language: 'en' },
        sections: [],
        projectConfig: { language: 'typescript', cssFramework: 'tailwind' },
      };
      const result = generate(linkIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('<Link href="/docs/intro"'), 'should use Link for internal links');
    });

    it('should NOT convert external links to Link', () => {
      const linkIR = {
        title: 'Link Test',
        content: '<p><a href="/docs/intro">Read the docs</a> and <a href="https://external.com">External</a></p>',
        langConfig: { direction: 'ltr', language: 'en' },
        sections: [],
        projectConfig: { language: 'typescript', cssFramework: 'tailwind' },
      };
      const result = generate(linkIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(!page.content.includes('<Link href="https://external.com"'), 'should not use Link for external links');
    });

    it('should use Link in TOC navigation', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('<Link href={"#'), 'TOC should use Link components');
    });
  });

  // ── Server / Client Component Split ──────────────────────────────

  describe('server/client component split', () => {
    it('should NOT have "use client" in main page component', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(!page.content.includes("'use client'"), 'page should be a server component');
      assert.ok(!page.content.includes('"use client"'), 'page should be a server component');
    });

    it('should have "use client" in edit-overlay component', () => {
      const result = generate(fullIR);
      const overlay = result.files.find(f => f.path.includes('edit-overlay.'));
      assert.ok(overlay.content.includes("'use client'"), 'edit overlay should be a client component');
    });

    it('should import useState in edit-overlay (client component)', () => {
      const result = generate(fullIR);
      const overlay = result.files.find(f => f.path.includes('edit-overlay.'));
      assert.ok(overlay.content.includes("import { useState } from 'react';"), 'client component should use React hooks');
    });
  });

  // ── generateStaticParams ─────────────────────────────────────────

  describe('generateStaticParams', () => {
    it('should export generateStaticParams function', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('export async function generateStaticParams()'), 'missing generateStaticParams');
    });

    it('should include slug in generateStaticParams return', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('slug:'), 'generateStaticParams should return slug');
    });
  });

  // ── FAQ Schema ───────────────────────────────────────────────────

  describe('FAQ schema', () => {
    it('should include FAQ JSON-LD schema when faq items provided', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('application/ld+json'), 'missing JSON-LD script');
      assert.ok(page.content.includes('FAQPage'), 'missing FAQPage schema type');
    });

    it('should include all FAQ questions in schema', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('What is the App Router?'), 'missing FAQ question');
      assert.ok(page.content.includes('Is it stable?'), 'missing second FAQ question');
    });

    it('should not include FAQ schema when no FAQ items', () => {
      const result = generate(minimalIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(!page.content.includes('FAQPage'), 'should not have FAQ schema without FAQ items');
    });
  });

  // ── Content Types ────────────────────────────────────────────────

  describe('content types', () => {
    it('should render code blocks with pre/code tags', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('<pre'), 'missing pre tag for code block');
      assert.ok(page.content.includes('<code'), 'missing code tag');
      assert.ok(page.content.includes('npm install next'), 'missing code content');
    });

    it('should render code block language class', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('language-bash'), 'missing language class on code block');
    });

    it('should render unordered lists', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('<ul'), 'missing ul tag');
      assert.ok(page.content.includes('<li>SSR</li>'), 'missing list item');
      assert.ok(page.content.includes('<li>SSG</li>'), 'missing list item');
    });

    it('should render tables with headers and rows', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('<table'), 'missing table');
      assert.ok(page.content.includes('<thead'), 'missing thead');
      assert.ok(page.content.includes('<tbody'), 'missing tbody');
      assert.ok(page.content.includes('Feature'), 'missing header cell');
      assert.ok(page.content.includes('Routing'), 'missing data cell');
    });

    it('should render section images with Image component', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      // The image section for diagram
      assert.ok(page.content.includes('src="/images/diagram.png"'), 'missing section image src');
      assert.ok(page.content.includes('alt="Architecture diagram"'), 'missing section image alt');
    });
  });

  // ── RTL Support ──────────────────────────────────────────────────

  describe('RTL support', () => {
    it('should set dir="rtl" on article element', () => {
      const result = generate(rtlIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('dir="rtl"'), 'missing RTL direction');
    });

    it('should set lang="ar" on article element', () => {
      const result = generate(rtlIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('lang="ar"'), 'missing Arabic language');
    });
  });

  // ── Tailwind vs CSS Modules ──────────────────────────────────────

  describe('CSS strategy', () => {
    it('should use Tailwind classes when cssFramework is tailwind', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('prose'), 'missing Tailwind prose class');
      assert.ok(page.content.includes('max-w-'), 'missing Tailwind max-width class');
    });

    it('should use styles.* references when not using Tailwind', () => {
      const result = generate(cssModuleIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('styles.container') || page.content.includes('{styles.'), 'missing CSS module references');
    });

    it('should generate valid CSS module file', () => {
      const result = generate(cssModuleIR);
      const css = result.files.find(f => f.path.endsWith('.module.css'));
      assert.ok(css, 'missing CSS module file');
      assert.ok(css.content.includes('.container'), 'missing container class');
      assert.ok(css.content.includes('.main'), 'missing main class');
      assert.ok(css.content.includes('.sidebar'), 'missing sidebar class');
    });
  });

  // ── shadcn/ui TOC ───────────────────────────────────────────────

  describe('shadcn/ui TOC', () => {
    it('should use shadcn-style classes for TOC when hasShadcn is true', () => {
      const result = generate(shadcnIR);
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('hover:bg-accent'), 'missing shadcn accent hover class');
      assert.ok(page.content.includes('rounded-md'), 'missing shadcn rounded class');
    });

    it('should not use shadcn-specific classes without shadcn', () => {
      const result = generate(fullIR);
      const page = result.files.find(f => f.path.includes('page.'));
      // fullIR does not have hasShadcn=true
      assert.ok(!page.content.includes('hover:bg-accent'), 'should not have shadcn classes without shadcn');
    });
  });

  // ── Layout File ──────────────────────────────────────────────────

  describe('layout file', () => {
    it('should generate layout.tsx when generateLayout is true', () => {
      const result = generate(fullIR);
      const layout = result.files.find(f => f.path.includes('layout.'));
      assert.ok(layout, 'missing layout file');
      assert.ok(layout.content.includes('ArticleLayout'), 'missing layout component name');
      assert.ok(layout.content.includes('children'), 'missing children prop');
    });

    it('should include dir and lang in layout', () => {
      const result = generate(fullIR);
      const layout = result.files.find(f => f.path.includes('layout.'));
      assert.ok(layout.content.includes('dir="ltr"'), 'missing dir in layout');
      assert.ok(layout.content.includes('lang="en"'), 'missing lang in layout');
    });
  });

  // ── Minimal / Edge Cases ─────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle minimal IR without errors', () => {
      const result = generate(minimalIR);
      assert.ok(result.files.length >= 2, 'should produce at least page + edit-overlay');
    });

    it('should handle empty sections gracefully', () => {
      const result = generate({ ...minimalIR, sections: [] });
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.includes('ArticlePage'), 'should still render page component');
    });

    it('should handle missing content gracefully', () => {
      const result = generate({ ...minimalIR, content: undefined, sections: [] });
      const page = result.files.find(f => f.path.includes('page.'));
      assert.ok(page.content.length > 0, 'should produce non-empty page');
    });

    it('should handle empty title', () => {
      const result = generate({ title: '', langConfig: { direction: 'ltr', language: 'en' } });
      assert.ok(result.files.length >= 2);
    });
  });
});
