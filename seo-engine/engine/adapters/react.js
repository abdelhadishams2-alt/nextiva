/**
 * React Adapter — JSX component output.
 *
 * Generates a React component file with CSS Module.
 * Compatible with Next.js, Vite, CRA.
 */

const description = 'React JSX component with CSS Module';
const extensions = ['.jsx', '.tsx', '.module.css'];

/**
 * Generate a React article component.
 *
 * @param {object} ir - Intermediate representation
 * @returns {{ files: Array<{path: string, content: string}> }}
 */
function generate(ir) {
  const { title, content, langConfig, tokens = {}, meta = {} } = ir;
  const componentName = toPascalCase(title);
  const isTS = ir.typescript !== false;
  const ext = isTS ? 'tsx' : 'jsx';
  const cssFileName = `${componentName}.module.css`;

  const jsxContent = convertHTMLToJSX(content);

  const component = `${isTS ? "import React from 'react';" : "import React from 'react';"}
import styles from './${cssFileName}';

${isTS ? `interface ${componentName}Props {
  className?: string;
}` : ''}

export default function ${componentName}(${isTS ? `props: ${componentName}Props` : 'props'}) {
  const { className } = props;

  return (
    <article
      className={\`\${styles.container}\${className ? \` \${className}\` : ''}\`}
      dir="${langConfig.direction}"
      lang="${langConfig.language}"
    >
      <h1 className={styles.title}>${escapeJSX(title)}</h1>
${indent(jsxContent, 6)}
    </article>
  );
}
`;

  const { generateDirectionalCSS } = require('../rtl');
  const css = generateDirectionalCSS({
    direction: langConfig.direction,
    fonts: langConfig.fonts,
    tokens
  }).replace(/\.article-container/g, '.container');

  return {
    files: [
      { path: `${componentName}.${ext}`, content: component },
      { path: cssFileName, content: css }
    ]
  };
}

function toPascalCase(str) {
  return String(str)
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function convertHTMLToJSX(html) {
  if (!html) return '';
  return html
    .replace(/class="/g, 'className="')
    .replace(/for="/g, 'htmlFor="')
    .replace(/tabindex="/g, 'tabIndex="')
    .replace(/readonly/g, 'readOnly')
    .replace(/colspan="/g, 'colSpan="')
    .replace(/rowspan="/g, 'rowSpan="')
    .replace(/<!--[\s\S]*?-->/g, '{/* comment */}');
}

function escapeJSX(str) {
  if (!str) return '';
  return String(str).replace(/[{}]/g, c => `{'${c}'}`);
}

function indent(str, spaces) {
  const pad = ' '.repeat(spaces);
  return str.split('\n').map(line => line ? pad + line : line).join('\n');
}

module.exports = { description, extensions, generate };
