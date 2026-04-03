'use strict';

module.exports = [
  { method: 'GET', pattern: /^\/api\/publish\/platforms$/, handle: ({ fixtures }) => ({ body: { success: true, data: fixtures.platforms } }) },
  { method: 'POST', pattern: /^\/api\/publish\/platforms\/connect$/, handle: ({ body }) => ({
    status: 201, body: { success: true, data: { id: 'plat-' + Date.now(), type: body.type, status: 'connected' } }
  })},
  { method: 'DELETE', pattern: /^\/api\/publish\/platforms\/(?<id>[a-z0-9-]+)$/, handle: () => ({ body: { success: true } }) },
  { method: 'POST', pattern: /^\/api\/publish\/platforms\/(?<id>[a-z0-9-]+)\/test$/, handle: () => ({
    body: { success: true, data: { reachable: true, capabilities: { categories: true, tags: true, featured_image: true } } }
  })},
  { method: 'POST', pattern: /^\/api\/publish\/platforms\/(?<id>[a-z0-9-]+)\/refresh$/, handle: () => ({ body: { success: true } }) },
  { method: 'GET', pattern: /^\/api\/publish\/platforms\/(?<id>[a-z0-9-]+)\/capabilities$/, handle: () => ({
    body: { success: true, data: { categories: true, tags: true, custom_fields: false, featured_image: true, seo_plugin: 'yoast' } }
  })},
  { method: 'POST', pattern: /^\/api\/publish\/wordpress\/push$/, handle: () => ({
    body: { success: true, data: { wp_post_id: 12345, url: 'https://srmg.com/tech/new-article', status: 'draft' } }
  })},
  { method: 'POST', pattern: /^\/api\/publish\/shopify\/push$/, handle: () => ({
    body: { success: true, data: { shopify_article_id: 67890, url: 'https://shop.srmg.com/blogs/tech/new-article' } }
  })},
  { method: 'POST', pattern: /^\/api\/publish\/webhook$/, handle: () => ({
    body: { success: true, data: { delivery_id: 'del-' + Date.now(), status: 'delivered', status_code: 200 } }
  })},
  { method: 'POST', pattern: /^\/api\/publish\/contentful\/push$/, handle: () => ({
    body: { success: true, data: { entry_id: 'cf-' + Date.now() } }
  })},
  { method: 'POST', pattern: /^\/api\/publish\/strapi\/push$/, handle: () => ({
    body: { success: true, data: { strapi_id: 'str-' + Date.now() } }
  })},
  { method: 'POST', pattern: /^\/api\/publish\/ghost\/push$/, handle: () => ({
    body: { success: true, data: { ghost_id: 'gh-' + Date.now(), url: 'https://blog.srmg.com/new-article' } }
  })},
  { method: 'POST', pattern: /^\/api\/publish\/webflow\/push$/, handle: () => ({
    body: { success: true, data: { item_id: 'wf-' + Date.now() } }
  })},
  { method: 'POST', pattern: /^\/api\/publish\/sanity\/push$/, handle: () => ({
    body: { success: true, data: { document_id: 'san-' + Date.now() } }
  })},
  { method: 'GET', pattern: /^\/api\/publish\/status\/(?<articleId>[a-z0-9-]+)$/, handle: () => ({
    body: { success: true, data: [{ platform: 'wordpress', status: 'published', published_at: '2026-03-25T16:00:00Z', url: 'https://srmg.com/tech/bmw-n54-hpfp' }] }
  })},
];
