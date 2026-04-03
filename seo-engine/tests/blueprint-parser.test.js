const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { parseBlueprints, getCategories, searchBlueprints } = require('../engine/blueprint-parser');

describe('Blueprint Parser', () => {
  it('parses blueprints from registry', async () => {
    const blueprints = await parseBlueprints();
    assert.ok(Array.isArray(blueprints));
    assert.ok(blueprints.length > 0, 'Should find at least one blueprint');
  });

  it('returns blueprints with required fields', async () => {
    const blueprints = await parseBlueprints();
    const first = blueprints[0];
    assert.ok(first.id, 'Blueprint should have an id');
    assert.ok(first.name, 'Blueprint should have a name');
    assert.ok(first.category, 'Blueprint should have a category');
  });

  it('finds the article shell blueprint', async () => {
    const blueprints = await parseBlueprints();
    const shell = blueprints.find(b => b.id === 'bp-article-shell');
    assert.ok(shell, 'Should find bp-article-shell');
    assert.equal(shell.name, 'Article Page Shell');
    assert.equal(shell.category, 'shell');
  });

  it('finds the hero blueprint', async () => {
    const blueprints = await parseBlueprints();
    const hero = blueprints.find(b => b.id === 'bp-hero');
    assert.ok(hero, 'Should find bp-hero');
    assert.equal(hero.category, 'hero');
  });

  it('caches results on repeated calls', async () => {
    const first = await parseBlueprints();
    const second = await parseBlueprints();
    assert.deepEqual(first, second);
  });

  describe('getCategories', () => {
    it('returns sorted unique categories', async () => {
      const categories = await getCategories();
      assert.ok(Array.isArray(categories));
      assert.ok(categories.length > 0);
      // Should be sorted
      const sorted = [...categories].sort();
      assert.deepEqual(categories, sorted);
    });

    it('includes expected categories', async () => {
      const categories = await getCategories();
      assert.ok(categories.includes('hero'), 'Should include hero category');
      assert.ok(categories.includes('shell'), 'Should include shell category');
    });
  });

  describe('searchBlueprints', () => {
    it('returns paginated results', async () => {
      const result = await searchBlueprints({ page: 1, limit: 5 });
      assert.ok(result.data.length <= 5);
      assert.ok(result.total > 0);
      assert.equal(result.page, 1);
      assert.equal(result.limit, 5);
    });

    it('filters by category', async () => {
      const result = await searchBlueprints({ category: 'hero' });
      assert.ok(result.data.every(b => b.category === 'hero'));
    });

    it('searches by query', async () => {
      const result = await searchBlueprints({ query: 'hero' });
      assert.ok(result.data.length > 0);
      assert.ok(result.data.some(b => b.name.toLowerCase().includes('hero') || b.id.includes('hero')));
    });

    it('returns empty for non-matching query', async () => {
      const result = await searchBlueprints({ query: 'zzzznonexistent' });
      assert.equal(result.data.length, 0);
      assert.equal(result.total, 0);
    });

    it('paginates correctly', async () => {
      const page1 = await searchBlueprints({ page: 1, limit: 3 });
      const page2 = await searchBlueprints({ page: 2, limit: 3 });
      if (page1.total > 3) {
        assert.ok(page2.data.length > 0);
        assert.notDeepEqual(page1.data[0].id, page2.data[0].id);
      }
    });
  });
});
