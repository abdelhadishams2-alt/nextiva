/**
 * Shared mock fixtures for ChainIQ Mock API Server.
 * Realistic data matching the Supabase schema.
 */

'use strict';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440001';

module.exports = {
  USER_ID,
  ADMIN_ID,

  // ── Users ─────────────────────────────────────────────────────────────────
  users: [
    { id: USER_ID, email: 'nadia@srmg.com', is_admin: false, plan: 'professional', status: 'active', created_at: '2026-01-15T08:00:00Z' },
    { id: ADMIN_ID, email: 'admin@chainiq.io', is_admin: true, plan: 'enterprise', status: 'active', created_at: '2026-01-01T00:00:00Z' },
    { id: '550e8400-e29b-41d4-a716-446655440002', email: 'ahmed@arabiya.net', is_admin: false, plan: 'starter', status: 'active', created_at: '2026-02-10T10:30:00Z' },
    { id: '550e8400-e29b-41d4-a716-446655440003', email: 'sara@zawya.com', is_admin: false, plan: 'professional', status: 'pending', created_at: '2026-03-20T14:00:00Z' },
  ],

  // ── Articles ──────────────────────────────────────────────────────────────
  articles: [
    { id: 'a1000001-0000-0000-0000-000000000001', user_id: USER_ID, title: 'BMW N54 HPFP Failure Guide: Complete Diagnosis & Fix', topic: 'n54 hpfp failure', language: 'en', framework: 'html', status: 'published', word_count: 4200, component_count: 12, created_at: '2026-03-25T09:00:00Z' },
    { id: 'a1000001-0000-0000-0000-000000000002', user_id: USER_ID, title: 'دليل صيانة محرك BMW N55 الشامل', topic: 'صيانة محرك n55', language: 'ar', framework: 'html', status: 'draft', word_count: 3800, component_count: 10, created_at: '2026-03-26T11:00:00Z' },
    { id: 'a1000001-0000-0000-0000-000000000003', user_id: USER_ID, title: 'React Server Components: The Complete Guide', topic: 'react server components', language: 'en', framework: 'react', status: 'published', word_count: 5100, component_count: 15, created_at: '2026-03-27T08:00:00Z' },
    { id: 'a1000001-0000-0000-0000-000000000004', user_id: USER_ID, title: 'Supabase RLS Patterns for Multi-Tenant Apps', topic: 'supabase rls multi tenant', language: 'en', framework: 'html', status: 'generating', word_count: 0, component_count: 0, created_at: '2026-03-28T10:00:00Z' },
  ],

  // ── Connections ───────────────────────────────────────────────────────────
  connections: [
    { id: 'c0000001-0000-0000-0000-000000000001', user_id: USER_ID, provider: 'google', type: 'gsc', status: 'connected', property: 'sc-domain:srmg.com', scopes: ['webmasters.readonly'], expires_at: '2026-04-28T10:00:00Z', created_at: '2026-03-01T09:00:00Z' },
    { id: 'c0000001-0000-0000-0000-000000000002', user_id: USER_ID, provider: 'google', type: 'ga4', status: 'connected', property: 'properties/123456789', scopes: ['analytics.readonly'], expires_at: '2026-04-28T10:00:00Z', created_at: '2026-03-01T09:05:00Z' },
    { id: 'c0000001-0000-0000-0000-000000000003', user_id: USER_ID, provider: 'semrush', type: 'api_key', status: 'connected', property: null, scopes: [], expires_at: null, created_at: '2026-03-05T14:00:00Z' },
  ],

  // ── Content Inventory ─────────────────────────────────────────────────────
  contentInventory: [
    { id: 'inv-001', user_id: USER_ID, url: 'https://srmg.com/tech/bmw-n54-hpfp', title: 'BMW N54 HPFP Failure Guide', status: 'ok', health_score: 92, word_count: 4200, language: 'en', author: 'Nadia', last_crawled: '2026-03-27T00:00:00Z' },
    { id: 'inv-002', user_id: USER_ID, url: 'https://srmg.com/tech/react-hooks-2024', title: 'React Hooks Best Practices 2024', status: 'decaying', health_score: 38, word_count: 3100, language: 'en', author: 'Ahmed', last_crawled: '2026-03-27T00:00:00Z' },
    { id: 'inv-003', user_id: USER_ID, url: 'https://srmg.com/ar/maintenance/n55', title: 'صيانة محرك N55', status: 'ok', health_score: 85, word_count: 3800, language: 'ar', author: 'Nadia', last_crawled: '2026-03-27T00:00:00Z' },
    { id: 'inv-004', user_id: USER_ID, url: 'https://srmg.com/tech/supabase-auth', title: 'Supabase Auth Setup Guide', status: 'thin', health_score: 45, word_count: 800, language: 'en', author: 'Sara', last_crawled: '2026-03-27T00:00:00Z' },
  ],

  // ── Recommendations ───────────────────────────────────────────────────────
  recommendations: [
    { id: 'rec-001', user_id: USER_ID, type: 'gap', keyword: 'bmw n54 turbo upgrade', volume: 8100, difficulty: 35, priority_score: 8.7, status: 'open', intent: 'informational', created_at: '2026-03-27T06:00:00Z' },
    { id: 'rec-002', user_id: USER_ID, type: 'decay', keyword: 'react hooks best practices', volume: 22000, difficulty: 62, priority_score: 9.2, status: 'open', intent: 'informational', content_url: 'https://srmg.com/tech/react-hooks-2024', created_at: '2026-03-27T06:00:00Z' },
    { id: 'rec-003', user_id: USER_ID, type: 'trending', keyword: 'claude code tutorial', volume: 14500, difficulty: 28, priority_score: 8.1, status: 'accepted', intent: 'informational', created_at: '2026-03-27T06:00:00Z' },
  ],

  // ── Voice Personas ────────────────────────────────────────────────────────
  personas: [
    { id: 'per-001', user_id: USER_ID, name: 'SRMG Technical', is_default: true, classification: 'HUMAN', voice_profile: { tone: 'authoritative', cadence: 'measured', vocabulary_level: 'technical', avg_sentence_length: 18, personality_markers: ['direct', 'evidence-based'] }, created_at: '2026-03-15T10:00:00Z' },
    { id: 'per-002', user_id: USER_ID, name: 'SRMG Conversational', is_default: false, classification: 'HUMAN', voice_profile: { tone: 'friendly', cadence: 'flowing', vocabulary_level: 'general', avg_sentence_length: 14, personality_markers: ['warm', 'accessible'] }, created_at: '2026-03-15T10:05:00Z' },
  ],

  // ── Quality Scores ────────────────────────────────────────────────────────
  qualityScores: {
    'a1000001-0000-0000-0000-000000000001': {
      composite: 82, signals: { eeat: 85, completeness: 88, voice: 79, ai_detection: 91, freshness: 75, tech_seo: 80, readability: 76 },
      checklist: { total: 60, passed: 49, failed: 11 },
    },
    'a1000001-0000-0000-0000-000000000003': {
      composite: 74, signals: { eeat: 70, completeness: 82, voice: 65, ai_detection: 88, freshness: 90, tech_seo: 72, readability: 68 },
      checklist: { total: 60, passed: 44, failed: 16 },
    },
  },

  // ── Publish Platforms ─────────────────────────────────────────────────────
  platforms: [
    { id: 'plat-001', user_id: USER_ID, type: 'wordpress', name: 'srmg.com', status: 'connected', url: 'https://srmg.com', capabilities: { categories: true, tags: true, featured_image: true, seo_plugin: 'yoast' }, created_at: '2026-03-10T09:00:00Z' },
    { id: 'plat-002', user_id: USER_ID, type: 'webhook', name: 'Content Pipeline', status: 'connected', url: 'https://api.internal.srmg.com/ingest', capabilities: {}, created_at: '2026-03-12T14:00:00Z' },
  ],

  // ── Performance Data ──────────────────────────────────────────────────────
  performanceSummary: {
    total_published: 47, avg_accuracy: 0.73, total_clicks: 128400, avg_ctr: 0.042,
  },

  performanceChart: Array.from({ length: 90 }, (_, i) => {
    const date = new Date('2025-12-29');
    date.setDate(date.getDate() + i);
    return {
      date: date.toISOString().split('T')[0],
      clicks: Math.floor(Math.random() * 2000) + 800,
      impressions: Math.floor(Math.random() * 50000) + 20000,
      ctr: +(Math.random() * 0.06 + 0.02).toFixed(4),
      position: +(Math.random() * 15 + 5).toFixed(1),
    };
  }),

  // ── Analytics ─────────────────────────────────────────────────────────────
  analyticsOverview: {
    total_articles: 47, success_rate: 0.936, active_users_7d: 3, errors_24h: 0,
  },
};
