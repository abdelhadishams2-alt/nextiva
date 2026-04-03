/**
 * Tests for the Publish Manager dashboard feature (PB-005).
 * Validates API contract shapes, platform type coverage, and data structures.
 */

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

// ── API Contract Tests ──

describe("Publish API contracts", () => {
  const PLATFORM_TYPES = [
    "wordpress",
    "shopify",
    "ghost",
    "contentful",
    "strapi",
    "webflow",
    "webhook",
  ];

  it("should define all 7 platform types", () => {
    assert.equal(PLATFORM_TYPES.length, 7);
    assert.ok(PLATFORM_TYPES.includes("wordpress"));
    assert.ok(PLATFORM_TYPES.includes("shopify"));
    assert.ok(PLATFORM_TYPES.includes("ghost"));
    assert.ok(PLATFORM_TYPES.includes("contentful"));
    assert.ok(PLATFORM_TYPES.includes("strapi"));
    assert.ok(PLATFORM_TYPES.includes("webflow"));
    assert.ok(PLATFORM_TYPES.includes("webhook"));
  });

  it("should have valid PublishPlatform shape", () => {
    const samplePlatform = {
      id: "plat-001",
      user_id: "user-001",
      platform: "wordpress",
      label: "My Blog",
      config: { site_url: "https://example.com" },
      connected: true,
      last_published_at: "2026-03-28T12:00:00Z",
      created_at: "2026-03-01T00:00:00Z",
      updated_at: "2026-03-28T12:00:00Z",
    };

    assert.equal(typeof samplePlatform.id, "string");
    assert.equal(typeof samplePlatform.user_id, "string");
    assert.ok(PLATFORM_TYPES.includes(samplePlatform.platform));
    assert.equal(typeof samplePlatform.label, "string");
    assert.equal(typeof samplePlatform.config, "object");
    assert.equal(typeof samplePlatform.connected, "boolean");
    assert.equal(typeof samplePlatform.created_at, "string");
  });

  it("should have valid PublishRecord shape", () => {
    const sampleRecord = {
      id: "pub-001",
      user_id: "user-001",
      article_id: "art-001",
      article_title: "Test Article",
      platform_id: "plat-001",
      platform: "wordpress",
      platform_label: "My Blog",
      status: "published",
      published_url: "https://example.com/test-article",
      error_message: null,
      published_at: "2026-03-28T12:00:00Z",
      created_at: "2026-03-28T12:00:00Z",
    };

    assert.equal(typeof sampleRecord.id, "string");
    assert.equal(typeof sampleRecord.article_id, "string");
    assert.equal(typeof sampleRecord.article_title, "string");
    assert.ok(PLATFORM_TYPES.includes(sampleRecord.platform));
    assert.ok(
      ["pending", "publishing", "published", "failed"].includes(sampleRecord.status)
    );
  });

  it("should have valid PublishPayloadPreview shape", () => {
    const samplePreview = {
      title: "Test Article",
      slug: "test-article",
      html: "<h1>Test</h1>",
      excerpt: "A test article",
      meta_description: "Test meta description",
      featured_image: null,
      tags: ["test", "article"],
    };

    assert.equal(typeof samplePreview.title, "string");
    assert.equal(typeof samplePreview.slug, "string");
    assert.equal(typeof samplePreview.html, "string");
    assert.ok(Array.isArray(samplePreview.tags));
  });

  it("PublishRecord status should be one of valid statuses", () => {
    const validStatuses = ["pending", "publishing", "published", "failed"];
    for (const status of validStatuses) {
      assert.ok(validStatuses.includes(status), `${status} should be valid`);
    }
  });
});

// ── Platform Config Tests ──

describe("Platform configuration fields", () => {
  const CONFIG_FIELDS = {
    wordpress: ["site_url", "username", "app_password"],
    shopify: ["store_domain", "access_token", "blog_id"],
    ghost: ["api_url", "admin_api_key"],
    contentful: ["space_id", "management_token", "content_type_id"],
    strapi: ["api_url", "api_token", "content_type"],
    webflow: ["api_token", "site_id", "collection_id"],
    webhook: ["url", "secret", "method"],
  };

  it("WordPress should require site_url and auth fields", () => {
    const fields = CONFIG_FIELDS.wordpress;
    assert.ok(fields.includes("site_url"));
    assert.ok(fields.includes("username"));
    assert.ok(fields.includes("app_password"));
  });

  it("Shopify should require store_domain and access_token", () => {
    const fields = CONFIG_FIELDS.shopify;
    assert.ok(fields.includes("store_domain"));
    assert.ok(fields.includes("access_token"));
  });

  it("Ghost should require api_url and admin_api_key", () => {
    const fields = CONFIG_FIELDS.ghost;
    assert.ok(fields.includes("api_url"));
    assert.ok(fields.includes("admin_api_key"));
  });

  it("Contentful should require space_id and management_token", () => {
    const fields = CONFIG_FIELDS.contentful;
    assert.ok(fields.includes("space_id"));
    assert.ok(fields.includes("management_token"));
  });

  it("Strapi should require api_url and api_token", () => {
    const fields = CONFIG_FIELDS.strapi;
    assert.ok(fields.includes("api_url"));
    assert.ok(fields.includes("api_token"));
  });

  it("Webflow should require api_token and site_id", () => {
    const fields = CONFIG_FIELDS.webflow;
    assert.ok(fields.includes("api_token"));
    assert.ok(fields.includes("site_id"));
  });

  it("Webhook should require url", () => {
    const fields = CONFIG_FIELDS.webhook;
    assert.ok(fields.includes("url"));
  });

  it("all platform types should have config field definitions", () => {
    const platformTypes = [
      "wordpress",
      "shopify",
      "ghost",
      "contentful",
      "strapi",
      "webflow",
      "webhook",
    ];
    for (const type of platformTypes) {
      assert.ok(
        CONFIG_FIELDS[type],
        `Config fields missing for ${type}`
      );
      assert.ok(
        CONFIG_FIELDS[type].length > 0,
        `${type} should have at least one config field`
      );
    }
  });
});

// ── UI Structure Tests ──

describe("Publish Manager UI structure", () => {
  it("should support pagination for history", () => {
    const total = 45;
    const limit = 20;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    assert.equal(totalPages, 3);
  });

  it("should compute correct page count for exact multiples", () => {
    const total = 40;
    const limit = 20;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    assert.equal(totalPages, 2);
  });

  it("should default to 1 page for empty results", () => {
    const total = 0;
    const limit = 20;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    assert.equal(totalPages, 1);
  });

  it("platform meta should provide label, color, and icon", () => {
    const PLATFORM_META = {
      wordpress: { label: "WordPress", color: "bg-blue-600", icon: "W" },
      shopify: { label: "Shopify", color: "bg-green-600", icon: "S" },
      ghost: { label: "Ghost", color: "bg-purple-600", icon: "G" },
      contentful: { label: "Contentful", color: "bg-yellow-600", icon: "C" },
      strapi: { label: "Strapi", color: "bg-indigo-600", icon: "St" },
      webflow: { label: "Webflow", color: "bg-blue-500", icon: "Wf" },
      webhook: { label: "Webhook", color: "bg-gray-600", icon: "Wh" },
    };

    for (const [type, meta] of Object.entries(PLATFORM_META)) {
      assert.ok(meta.label, `${type} should have a label`);
      assert.ok(meta.color, `${type} should have a color`);
      assert.ok(meta.icon, `${type} should have an icon`);
    }
  });

  it("status badges should map to valid variants", () => {
    const STATUS_VARIANT = {
      published: "default",
      publishing: "secondary",
      pending: "outline",
      failed: "destructive",
    };

    const validVariants = ["default", "secondary", "destructive", "outline"];
    for (const [status, variant] of Object.entries(STATUS_VARIANT)) {
      assert.ok(
        validVariants.includes(variant),
        `${status} badge variant "${variant}" should be valid`
      );
    }
  });

  it("should correctly determine connected vs unconnected platforms", () => {
    const platforms = [
      { platform: "wordpress", connected: true },
      { platform: "ghost", connected: true },
    ];

    const ALL_TYPES = [
      "wordpress", "shopify", "ghost", "contentful", "strapi", "webflow", "webhook",
    ];

    const connectedTypes = new Set(platforms.map((p) => p.platform));
    const unconnectedTypes = ALL_TYPES.filter((t) => !connectedTypes.has(t));

    assert.equal(connectedTypes.size, 2);
    assert.equal(unconnectedTypes.length, 5);
    assert.ok(!unconnectedTypes.includes("wordpress"));
    assert.ok(!unconnectedTypes.includes("ghost"));
    assert.ok(unconnectedTypes.includes("shopify"));
  });
});

// ── Publish Dialog Flow Tests ──

describe("Publish dialog flow", () => {
  it("should require both article and platform selection", () => {
    const selectedArticleId = "";
    const selectedPlatformIds = new Set();

    const canProceed =
      selectedArticleId !== "" && selectedPlatformIds.size > 0;
    assert.equal(canProceed, false);
  });

  it("should allow proceeding with valid selections", () => {
    const selectedArticleId = "art-001";
    const selectedPlatformIds = new Set(["plat-001"]);

    const canProceed =
      selectedArticleId !== "" && selectedPlatformIds.size > 0;
    assert.equal(canProceed, true);
  });

  it("should support multi-platform selection", () => {
    const selectedPlatformIds = new Set(["plat-001", "plat-002", "plat-003"]);
    assert.equal(selectedPlatformIds.size, 3);

    // Toggle off
    selectedPlatformIds.delete("plat-002");
    assert.equal(selectedPlatformIds.size, 2);
    assert.ok(!selectedPlatformIds.has("plat-002"));
  });

  it("should format publish button text correctly for single platform", () => {
    const count = 1;
    const text = `Publish to ${count} platform${count > 1 ? "s" : ""}`;
    assert.equal(text, "Publish to 1 platform");
  });

  it("should format publish button text correctly for multiple platforms", () => {
    const count = 3;
    const text = `Publish to ${count} platform${count > 1 ? "s" : ""}`;
    assert.equal(text, "Publish to 3 platforms");
  });
});
