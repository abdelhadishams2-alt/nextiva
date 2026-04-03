/**
 * Blueprint Parser — Extracts component blueprints from the structural registry.
 *
 * Parses the markdown-based structural-component-registry.md into
 * structured objects for the blueprint gallery API.
 */

const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, '..', 'config', 'structural-component-registry.md');

let cachedBlueprints = null;
let cachedMtime = 0;

/**
 * Parse all blueprints from the registry file.
 * Results are cached by file mtime.
 *
 * @returns {Array<{id: string, name: string, category: string, role: string, pattern: string[]}>}
 */
async function parseBlueprints() {
  let stat;
  try {
    stat = await fs.promises.stat(REGISTRY_PATH);
  } catch {
    return [];
  }

  if (cachedBlueprints && stat.mtimeMs === cachedMtime) {
    return cachedBlueprints;
  }

  const content = await fs.promises.readFile(REGISTRY_PATH, 'utf-8');
  const blueprints = [];

  // Split on code blocks that contain blueprint definitions
  const codeBlockRegex = /```\r?\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const block = match[1];
    const bp = parseBlock(block);
    if (bp && bp.id) {
      blueprints.push(bp);
    }
  }

  cachedBlueprints = blueprints;
  cachedMtime = stat.mtimeMs;
  return blueprints;
}

/**
 * Parse a single code block into a blueprint object.
 */
function parseBlock(block) {
  const lines = block.split('\n');
  const bp = { id: '', name: '', category: '', role: '', pattern: [] };

  let inPattern = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('blueprint_id:')) {
      bp.id = trimmed.replace('blueprint_id:', '').trim();
      inPattern = false;
    } else if (trimmed.startsWith('blueprint_name:')) {
      bp.name = trimmed.replace('blueprint_name:', '').trim();
      inPattern = false;
    } else if (trimmed.startsWith('category:')) {
      bp.category = trimmed.replace('category:', '').trim();
      inPattern = false;
    } else if (trimmed.startsWith('article_role:')) {
      bp.role = trimmed.replace('article_role:', '').trim();
      inPattern = false;
    } else if (trimmed === 'structural_pattern:') {
      inPattern = true;
    } else if (inPattern && trimmed.startsWith('- ')) {
      bp.pattern.push(trimmed.slice(2));
    } else if (inPattern && !trimmed.startsWith('-') && trimmed !== '' && !trimmed.startsWith('slot_') && !trimmed.startsWith('layout_') && !trimmed.startsWith('responsive_') && !trimmed.startsWith('variant')) {
      // Still in pattern if indented continuation
      if (line.startsWith('    ') || line.startsWith('\t')) {
        // Nested pattern item
      } else {
        inPattern = false;
      }
    } else if (trimmed.startsWith('slot_') || trimmed.startsWith('layout_') || trimmed.startsWith('responsive_') || trimmed.startsWith('variant')) {
      inPattern = false;
    }
  }

  return bp;
}

/**
 * Get all unique categories from blueprints.
 */
async function getCategories() {
  const blueprints = await parseBlueprints();
  const categories = [...new Set(blueprints.map(b => b.category).filter(Boolean))];
  return categories.sort();
}

/**
 * Search blueprints by query and optional category filter.
 */
async function searchBlueprints({ query = '', category = '', page = 1, limit = 12 } = {}) {
  let blueprints = await parseBlueprints();

  if (category) {
    blueprints = blueprints.filter(b => b.category === category);
  }

  if (query) {
    const q = query.toLowerCase();
    blueprints = blueprints.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      b.role.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
  }

  const total = blueprints.length;
  const start = (page - 1) * limit;
  const data = blueprints.slice(start, start + limit);

  return { data, total, page, limit };
}

module.exports = { parseBlueprints, getCategories, searchBlueprints };
