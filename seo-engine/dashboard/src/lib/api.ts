/**
 * API client for the ChainIQ bridge server.
 * Adds Bearer token to requests and handles 401 redirects.
 */

const BRIDGE_URL =
  process.env.NEXT_PUBLIC_BRIDGE_URL || "http://localhost:19847";

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export function setOnUnauthorized(callback: () => void) {
  onUnauthorized = callback;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${BRIDGE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    setAuthToken(null);
    onUnauthorized?.();
    throw new Error("Unauthorized");
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed: ${res.status}`);
  }

  return data as T;
}

// Auth API
export async function login(email: string, password: string) {
  return apiFetch<{
    status: string;
    access_token: string;
    user: { id: string; email: string };
    subscription: { plan: string; status: string; role: string };
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signup(email: string, password: string) {
  return apiFetch<{
    status: string;
    message: string;
    user: { id: string; email: string };
  }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function verify() {
  return apiFetch<{
    status: string;
    user: { id: string; email: string };
    subscription: { plan: string; status: string; role?: string };
  }>("/auth/verify");
}

// ── Dashboard API ──

export interface Article {
  id: string;
  user_id: string;
  title: string;
  topic: string;
  language: string;
  framework: string;
  status: string;
  file_path: string | null;
  word_count: number | null;
  image_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface PipelineJob {
  id: string;
  user_id: string;
  article_id: string | null;
  topic: string;
  language: string;
  framework: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: { total: number; page: number; limit: number };
}

export interface AnalyticsOverview {
  total_articles: number;
  total_jobs: number;
  edits_today: number;
}

export async function fetchArticles(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return apiFetch<PaginatedResponse<Article>>(`/api/articles${qs}`);
}

export async function fetchArticle(id: string) {
  return apiFetch<{ success: boolean; data: Article }>(`/api/articles/${id}`);
}

export async function createArticle(data: { title: string; topic: string; language?: string; framework?: string }) {
  return apiFetch<{ success: boolean; data: Article }>("/api/articles", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateArticle(id: string, data: Partial<Article>) {
  return apiFetch<{ success: boolean; data: Article }>(`/api/articles/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function fetchArticleVersions(id: string) {
  return apiFetch<{ success: boolean; data: Array<{ id: string; version_number: number; section_edited: string | null; word_count_delta: number; created_at: string }> }>(
    `/api/articles/${id}/versions`
  );
}

export async function fetchPipelineStatus() {
  return apiFetch<{ success: boolean; data: { status: string; active_since: number | null } }>(
    "/api/pipeline/status"
  );
}

export async function fetchPipelineHistory(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return apiFetch<PaginatedResponse<PipelineJob>>(`/api/pipeline/history${qs}`);
}

export async function fetchAnalyticsOverview() {
  return apiFetch<{ success: boolean; data: AnalyticsOverview }>(
    "/api/analytics/overview"
  );
}

// ── Admin API ──

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  raw_user_meta_data?: Record<string, unknown>;
}

export interface Subscription {
  user_id: string;
  plan: string;
  status: string;
  role: string;
  created_at: string;
  expires_at: string | null;
}

export async function adminListUsers() {
  return apiFetch<{
    status: string;
    users: AdminUser[];
    subscriptions: Subscription[];
  }>("/admin/users");
}

export async function adminApproveUser(userId: string) {
  return apiFetch<{ status: string; message: string }>("/admin/approve", {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}

export async function adminRevokeUser(userId: string) {
  return apiFetch<{ status: string; message: string }>("/admin/revoke", {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}

export async function adminDeleteUser(userId: string) {
  return apiFetch<{ status: string; message: string }>("/admin/delete", {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}

export async function adminAddUser(email: string, password: string) {
  return apiFetch<{
    status: string;
    message: string;
    user: { id: string; email: string };
  }>("/admin/add-user", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function adminGetUsageLogs() {
  return apiFetch<{
    status: string;
    logs: Array<{ id: number; user_id: string; action: string; article_file: string | null; created_at: string }>;
  }>("/admin/usage");
}

// ── Generate API ──

export interface GenerateRequest {
  topic: string;
  language?: string;
  framework?: string;
  css_framework?: string;
  image_style?: string;
  image_count?: number;
  max_images?: number;
  domain_hint?: string;
}

export interface GenerateResponse {
  success: boolean;
  data: {
    job_id: string;
    article_id: string | null;
    status: string;
    estimated_time: number;
    progress_url: string;
  };
}

export async function generateArticle(data: GenerateRequest) {
  return apiFetch<GenerateResponse>("/api/generate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function subscribeToProgress(
  jobId: string,
  onEvent: (event: { event: string; stage?: string; percent?: number; result?: unknown; error?: string }) => void
): () => void {
  // EventSource doesn't support custom headers, so pass token as query param
  const tokenParam = authToken ? `?token=${encodeURIComponent(authToken)}` : "";
  const url = `${BRIDGE_URL}/api/queue/job/${jobId}/progress${tokenParam}`;

  const es = new EventSource(url);

  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onEvent(data);
      if (data.event === "completed" || data.event === "failed" || data.event === "cancelled") {
        es.close();
      }
    } catch {
      // Ignore parse errors
    }
  };

  es.onerror = () => {
    onEvent({ event: "error", error: "Connection lost" });
    es.close();
  };

  return () => es.close();
}

// ── Quality API ──

export interface QualityCheckItem {
  id: string;
  category: string;
  label: string;
  status: "pass" | "fail" | "warning";
  detail: string | null;
  weight: number;
}

export interface QualitySignal {
  name: string;
  score: number;
  max_score: number;
  weight: number;
  details: string;
}

export interface EEATDimension {
  dimension: string;
  score: number;
  max_score: number;
  grade: string;
  notes: string;
}

export interface QualitySuggestion {
  id: string;
  priority: "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  auto_fixable: boolean;
}

export interface QualityReport {
  article_id: string;
  overall_score: number;
  letter_grade: string;
  signals: QualitySignal[];
  checklist: QualityCheckItem[];
  eeat: EEATDimension[];
  suggestions: QualitySuggestion[];
  scored_at: string;
}

export async function fetchQualityReport(articleId: string) {
  return apiFetch<{ success: boolean; data: QualityReport }>(
    `/api/quality/score/${encodeURIComponent(articleId)}`
  );
}

export async function refreshQualityReport(articleId: string) {
  return apiFetch<{ success: boolean; data: QualityReport }>(
    `/api/quality/score/${encodeURIComponent(articleId)}?refresh=true`
  );
}

export async function triggerAutoFix(articleId: string) {
  return apiFetch<{ success: boolean; data: { job_id: string; status: string } }>(
    `/api/quality/auto-fix/${encodeURIComponent(articleId)}`,
    { method: "POST" }
  );
}

// ── Settings API ──

export interface UserSettings {
  preferred_language: string;
  preferred_framework: string;
  preferred_css: string;
  default_domain: string;
  rtl_enabled: boolean;
  image_style: string;
  max_images: number;
  /** When true, always use preferred_framework instead of auto-detecting from project */
  framework_override: boolean;
}

export async function fetchSettings() {
  return apiFetch<{ success: boolean; data: UserSettings }>("/api/settings");
}

export async function updateSettings(settings: Partial<UserSettings>) {
  return apiFetch<{ success: boolean; data: UserSettings }>("/api/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

// ── Quota API ──

export interface QuotaStatus {
  plan: string;
  articles: { used: number; limit: number; remaining: number };
  edits: { used: number; limit: number; remaining: number };
  languages: { limit: number };
  frameworks: { allowed: string[] };
  api_keys_enabled: boolean;
}

export async function fetchQuota() {
  return apiFetch<{ success: boolean; data: QuotaStatus }>("/api/quota");
}

export async function checkQuota(action: string) {
  return apiFetch<{ allowed: boolean; reason: string }>(
    `/api/quota/check/${action}`
  );
}

// ── Admin Quota API ──

export async function adminUpdatePlan(
  userId: string,
  planData: { plan: string; articles_per_month?: number; edits_per_day?: number }
) {
  return apiFetch<{ success: boolean }>(`/api/admin/plans/${userId}`, {
    method: "PUT",
    body: JSON.stringify(planData),
  });
}

export async function adminGetQuotaStats() {
  return apiFetch<{ success: boolean; data: Record<string, unknown> }>(
    "/api/admin/quota-stats"
  );
}

// ── API Key Management ──

export interface ApiKey {
  id: string;
  key_name: string;
  key_hint: string;
  scope: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function adminListApiKeys() {
  return apiFetch<{ success: boolean; data: ApiKey[] }>("/api/admin/api-keys");
}

export async function adminAddApiKey(data: {
  key_name: string;
  key_value: string;
  scope?: string;
}) {
  return apiFetch<{ success: boolean; data: ApiKey }>("/api/admin/api-keys", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function adminRotateApiKey(id: string, newValue: string) {
  return apiFetch<{ success: boolean; data: ApiKey }>(
    `/api/admin/api-keys/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({ key_value: newValue }),
    }
  );
}

export async function adminRevokeApiKey(id: string) {
  return apiFetch<{ success: boolean }>(`/api/admin/api-keys/${id}`, {
    method: "DELETE",
  });
}

export async function adminTestApiKey(id: string) {
  return apiFetch<{ success: boolean; valid: boolean; message: string }>(
    `/api/admin/api-keys/${id}/test`,
    { method: "POST" }
  );
}

// ── Publisher Hub API ──

export interface PluginInstance {
  id: string;
  user_id: string;
  instance_id: string;
  project_name: string | null;
  framework: string | null;
  plugin_version: string | null;
  last_seen_at: string;
  ip_address: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PluginConfigEntry {
  config_key: string;
  config_value: Record<string, unknown>;
  description: string | null;
  updated_at: string;
}

export interface UserAnalyticsDetail {
  user_id: string;
  period: string;
  generations: { total: number; recent: Array<{ action: string; metadata: Record<string, unknown>; created_at: string }> };
  edits: { total: number; recent: Array<{ action: string; metadata: Record<string, unknown>; created_at: string }> };
  articles: Array<{ id: string; title: string; topic: string; language: string; framework: string; status: string; created_at: string }>;
  instances: PluginInstance[];
  topic_frequency: Record<string, number>;
  framework_distribution: Record<string, number>;
  error_rate: number;
  total_actions: number;
}

export async function pluginHeartbeat(data: {
  instance_id: string;
  project_name?: string;
  framework?: string;
  plugin_version?: string;
  metadata?: Record<string, unknown>;
}) {
  return apiFetch<{ success: boolean; data: PluginInstance }>(
    "/api/plugin/heartbeat",
    { method: "POST", body: JSON.stringify(data) }
  );
}

export async function fetchPluginConfig() {
  return apiFetch<{ success: boolean; data: Record<string, unknown> }>(
    "/api/plugin/config"
  );
}

export async function fetchUserAnalyticsDetail(userId: string) {
  return apiFetch<{ success: boolean; data: UserAnalyticsDetail }>(
    `/api/analytics/user/${userId}`
  );
}

export async function adminListPluginInstances() {
  return apiFetch<{ success: boolean; data: PluginInstance[] }>(
    "/api/admin/plugin-instances"
  );
}

export async function adminListPluginConfig() {
  return apiFetch<{ success: boolean; data: PluginConfigEntry[] }>(
    "/api/admin/plugin-config"
  );
}

export async function adminSetPluginConfig(
  key: string,
  value: unknown,
  description?: string
) {
  return apiFetch<{ success: boolean; data: PluginConfigEntry }>(
    `/api/admin/plugin-config/${encodeURIComponent(key)}`,
    {
      method: "PUT",
      body: JSON.stringify({ value, description }),
    }
  );
}

// ── Connections API ──

export interface OAuthConnection {
  id: string;
  provider: string;
  provider_account_id: string;
  scopes: string[];
  connected_at: string;
  expires_at: string | null;
  last_synced_at: string | null;
}

export interface ConnectionStatus {
  provider: string;
  connected: boolean;
  healthy: boolean;
  last_synced_at: string | null;
  expires_at: string | null;
  scopes: string[];
}

export async function getGoogleAuthUrl() {
  return apiFetch<{ success: boolean; data: { auth_url: string; state: string } }>(
    "/api/connections/google/auth"
  );
}

export async function getConnections() {
  return apiFetch<{ success: boolean; data: OAuthConnection[] }>(
    "/api/connections"
  );
}

export async function getConnectionStatus() {
  return apiFetch<{ success: boolean; data: ConnectionStatus[] }>(
    "/api/connections/status"
  );
}

// ── Ingestion API ──

export interface CrawlResult {
  session_id: string;
  status: string;
  pages_crawled: number;
  pages_total: number;
}

export interface CrawlStatus {
  session_id: string;
  status: string;
  pages_crawled: number;
  pages_total: number;
  started_at: string;
  completed_at: string | null;
  errors: string[];
}

export interface ScheduleInfo {
  gsc: { enabled: boolean; interval_hours: number; next_run: string | null };
  ga4: { enabled: boolean; interval_hours: number; next_run: string | null };
  crawl: { enabled: boolean; interval_hours: number; next_run: string | null };
}

export async function triggerCrawl(siteUrl: string, maxPages?: number) {
  return apiFetch<{ success: boolean; data: CrawlResult }>(
    "/api/ingestion/crawl",
    {
      method: "POST",
      body: JSON.stringify({ site_url: siteUrl, max_pages: maxPages }),
    }
  );
}

export async function getCrawlStatus(sessionId: string) {
  return apiFetch<{ success: boolean; data: CrawlStatus }>(
    `/api/ingestion/crawl/status/${encodeURIComponent(sessionId)}`
  );
}

export async function getScheduleStatus() {
  return apiFetch<{ success: boolean; data: ScheduleInfo }>(
    "/api/ingestion/schedule"
  );
}

export async function triggerGSCPull() {
  return apiFetch<{ success: boolean; data: Record<string, unknown> }>(
    "/api/ingestion/trigger/gsc",
    { method: "POST" }
  );
}

export async function triggerGA4Pull() {
  return apiFetch<{ success: boolean; data: Record<string, unknown> }>(
    "/api/ingestion/trigger/ga4",
    { method: "POST" }
  );
}

// ── Inventory API ──

export interface InventoryItem {
  id: string;
  url: string;
  title: string;
  status: "healthy" | "needs_review" | "thin" | "error" | "new";
  word_count: number;
  h2_count: number;
  internal_links: number;
  images: number;
  health_score: number;
  last_crawled: string;
  meta_description: string | null;
  canonical_url: string | null;
  http_status: number;
  redirect_url: string | null;
  structured_data: boolean;
  mobile_friendly: boolean;
  load_time_ms: number | null;
}

export interface InventoryDetail extends InventoryItem {
  headings: Array<{ level: number; text: string }>;
  external_links: number;
  outbound_links: Array<{ url: string; text: string }>;
  inbound_links: Array<{ url: string; text: string }>;
  performance: Array<{
    date: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

export interface InventoryParams {
  status?: string;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  per_page?: number;
  min_words?: number;
  max_words?: number;
  date_from?: string;
  date_to?: string;
}

export async function getInventory(params?: InventoryParams) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    });
  }
  const qs = searchParams.toString();
  return apiFetch<PaginatedResponse<InventoryItem>>(
    `/api/inventory${qs ? `?${qs}` : ""}`
  );
}

export async function getInventoryItem(id: string) {
  return apiFetch<{ success: boolean; data: InventoryDetail }>(
    `/api/inventory/${encodeURIComponent(id)}`
  );
}

// ── Intelligence / Opportunities API ──

export interface Recommendation {
  id: string;
  type: "content_gap" | "optimization" | "consolidation" | "new_topic" | "update";
  title: string;
  description: string;
  priority_score: number;
  impact: "high" | "medium" | "low";
  effort: "high" | "medium" | "low";
  affected_urls: string[];
  suggested_action: string;
  status: "pending" | "accepted" | "dismissed" | "executed";
  created_at: string;
}

export interface KeywordGap {
  id: string;
  keyword: string;
  search_volume: number;
  difficulty: number;
  current_position: number | null;
  competitor_position: number | null;
  impressions: number;
  clicks: number;
  ctr: number;
  opportunity_score: number;
  suggested_url: string | null;
  category: string;
}

export interface CannibalizationGroup {
  id: string;
  keyword: string;
  pages: Array<{
    url: string;
    title: string;
    position: number;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
  severity: "critical" | "warning" | "info";
  recommended_action: "merge" | "redirect" | "differentiate" | "deoptimize";
  resolved: boolean;
}

export interface DecayAlert {
  id: string;
  url: string;
  title: string;
  metric: "clicks" | "impressions" | "position" | "ctr";
  severity: "critical" | "warning" | "info";
  current_value: number;
  previous_value: number;
  change_percent: number;
  trend: number[];
  detected_at: string;
  acknowledged: boolean;
}

export interface OpportunityFilters {
  type?: string;
  impact?: string;
  status?: string;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  per_page?: number;
}

export interface AnalysisRun {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  started_at: string | null;
  completed_at: string | null;
  results_summary: Record<string, number> | null;
}

export async function getRecommendations(params?: OpportunityFilters) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    });
  }
  const qs = searchParams.toString();
  return apiFetch<PaginatedResponse<Recommendation>>(
    `/api/intelligence/recommendations${qs ? `?${qs}` : ""}`
  );
}

export async function updateRecommendation(
  id: string,
  action: "accept" | "dismiss" | "execute"
) {
  return apiFetch<{ success: boolean; data: Recommendation }>(
    `/api/intelligence/recommendations/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify({ action }) }
  );
}

export async function getKeywordGaps(params?: OpportunityFilters) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    });
  }
  const qs = searchParams.toString();
  return apiFetch<PaginatedResponse<KeywordGap>>(
    `/api/intelligence/keyword-gaps${qs ? `?${qs}` : ""}`
  );
}

export async function getCannibalizationGroups(params?: OpportunityFilters) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    });
  }
  const qs = searchParams.toString();
  return apiFetch<PaginatedResponse<CannibalizationGroup>>(
    `/api/intelligence/cannibalization${qs ? `?${qs}` : ""}`
  );
}

export async function resolveCannibalization(
  id: string,
  action: "merge" | "redirect" | "differentiate" | "deoptimize"
) {
  return apiFetch<{ success: boolean; data: CannibalizationGroup }>(
    `/api/intelligence/cannibalization/${encodeURIComponent(id)}/resolve`,
    { method: "POST", body: JSON.stringify({ action }) }
  );
}

export async function getDecayAlerts(params?: OpportunityFilters) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    });
  }
  const qs = searchParams.toString();
  return apiFetch<PaginatedResponse<DecayAlert>>(
    `/api/intelligence/decay-alerts${qs ? `?${qs}` : ""}`
  );
}

export async function acknowledgeDecayAlert(id: string) {
  return apiFetch<{ success: boolean; data: DecayAlert }>(
    `/api/intelligence/decay-alerts/${encodeURIComponent(id)}/acknowledge`,
    { method: "POST" }
  );
}

export async function runAnalysis() {
  return apiFetch<{ success: boolean; data: AnalysisRun }>(
    "/api/intelligence/analyze",
    { method: "POST" }
  );
}

export async function getAnalysisStatus() {
  return apiFetch<{ success: boolean; data: AnalysisRun }>(
    "/api/intelligence/analyze/status"
  );
}

// ── Voice / Personas API ──

export interface VoiceProfile {
  tone: string;
  formality: string;
  avg_sentence_length: number;
  vocabulary_richness: number;
  readability_grade: number;
  passive_voice_ratio: number;
  contraction_usage: number;
  question_frequency: number;
  exclamation_frequency: number;
  paragraph_length: number;
  transition_density: number;
  personal_pronoun_ratio: number;
}

export interface VoicePersona {
  id: string;
  user_id: string;
  name: string;
  voice_profile: VoiceProfile;
  source_articles: Array<{ url: string; title?: string }>;
  feature_vector: number[];
  representative_sentences?: string[];
  cluster_size?: number;
  is_default: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CorpusStatus {
  sessions: Array<{
    id: string;
    site_url: string;
    status: string;
    pages_analyzed: number;
    total_pages: number;
    created_at: string;
    completed_at: string | null;
  }>;
}

export interface AnalyzeSiteResult {
  status: string;
  sessionId: string | null;
  siteUrl: string;
  message: string;
}

export async function getVoicePersonas() {
  return apiFetch<{ success: boolean; data: { personas: VoicePersona[]; total: number } }>(
    "/api/voice/personas"
  );
}

export async function getVoicePersona(id: string) {
  return apiFetch<{ success: boolean; data: VoicePersona }>(
    `/api/voice/personas/${encodeURIComponent(id)}`
  );
}

export async function createVoicePersona(data: {
  name?: string;
  siteUrl?: string;
  voice_profile?: Partial<VoiceProfile>;
  source_articles?: Array<{ url: string; title?: string }>;
  is_default?: boolean;
}) {
  return apiFetch<{ success: boolean; data: VoicePersona | { personas: VoicePersona[]; clustering: Record<string, number> } }>(
    "/api/voice/personas",
    { method: "POST", body: JSON.stringify(data) }
  );
}

export async function updateVoicePersona(
  id: string,
  data: Partial<Pick<VoicePersona, "name" | "voice_profile" | "source_articles" | "feature_vector" | "is_default">>
) {
  return apiFetch<{ success: boolean; data: VoicePersona }>(
    `/api/voice/personas/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(data) }
  );
}

export async function deleteVoicePersona(id: string) {
  return apiFetch<{ success: boolean; data: VoicePersona }>(
    `/api/voice/personas/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}

export async function analyzeSiteVoice(siteUrl: string) {
  return apiFetch<{ success: boolean; data: AnalyzeSiteResult }>(
    "/api/voice/analyze",
    { method: "POST", body: JSON.stringify({ siteUrl }) }
  );
}

export async function getCorpusStatus(userId: string) {
  return apiFetch<{ success: boolean; data: CorpusStatus }>(
    `/api/voice/corpus/${encodeURIComponent(userId)}`
  );
}

// ── Publish API ──

export type PlatformType =
  | "wordpress"
  | "shopify"
  | "ghost"
  | "contentful"
  | "strapi"
  | "webflow"
  | "webhook";

export interface PublishPlatform {
  id: string;
  user_id: string;
  platform: PlatformType;
  label: string;
  config: Record<string, unknown>;
  connected: boolean;
  last_published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublishRecord {
  id: string;
  user_id: string;
  article_id: string;
  article_title: string;
  platform_id: string;
  platform: PlatformType;
  platform_label: string;
  status: "pending" | "publishing" | "published" | "failed";
  published_url: string | null;
  error_message: string | null;
  published_at: string | null;
  created_at: string;
}

export interface PublishPayloadPreview {
  title: string;
  slug: string;
  html: string;
  excerpt: string;
  meta_description: string;
  featured_image: string | null;
  tags: string[];
}

export async function getPublishPlatforms() {
  return apiFetch<{ success: boolean; data: PublishPlatform[] }>(
    "/api/publish/platforms"
  );
}

export async function connectPlatform(
  platform: PlatformType,
  label: string,
  config: Record<string, unknown>
) {
  return apiFetch<{ success: boolean; data: PublishPlatform }>(
    "/api/publish/platforms",
    {
      method: "POST",
      body: JSON.stringify({ platform, label, config }),
    }
  );
}

export async function updatePlatform(
  id: string,
  data: Partial<Pick<PublishPlatform, "label" | "config">>
) {
  return apiFetch<{ success: boolean; data: PublishPlatform }>(
    `/api/publish/platforms/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(data) }
  );
}

export async function disconnectPlatform(id: string) {
  return apiFetch<{ success: boolean }>(
    `/api/publish/platforms/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}

export async function testPlatformConnection(id: string) {
  return apiFetch<{ success: boolean; healthy: boolean; message: string }>(
    `/api/publish/platforms/${encodeURIComponent(id)}/test`,
    { method: "POST" }
  );
}

export async function getPublishHistory(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return apiFetch<PaginatedResponse<PublishRecord>>(
    `/api/publish/history${qs}`
  );
}

export async function previewPublishPayload(articleId: string, platformId: string) {
  return apiFetch<{ success: boolean; data: PublishPayloadPreview }>(
    `/api/publish/preview/${encodeURIComponent(articleId)}/${encodeURIComponent(platformId)}`
  );
}

export async function publishArticle(
  articleId: string,
  platformIds: string[]
) {
  return apiFetch<{
    success: boolean;
    data: PublishRecord[];
  }>("/api/publish", {
    method: "POST",
    body: JSON.stringify({ article_id: articleId, platform_ids: platformIds }),
  });
}

// ── Performance API ──

export interface PortfolioSummary {
  total_articles: number;
  avg_performance_score: number;
  top_performer: {
    article_id: string;
    title: string;
    score: number;
  } | null;
  total_clicks: number;
  total_impressions: number;
  avg_position: number;
}

export type MilestoneStatus = "pending" | "on_track" | "at_risk" | "achieved" | "missed";

export interface ArticlePerformance {
  article_id: string;
  title: string;
  published_at: string;
  current_clicks: number;
  current_impressions: number;
  current_position: number;
  current_ctr: number;
  milestone_30: { status: MilestoneStatus; target: number; actual: number | null };
  milestone_60: { status: MilestoneStatus; target: number; actual: number | null };
  milestone_90: { status: MilestoneStatus; target: number; actual: number | null };
  performance_score: number;
}

export interface WeightHistoryEntry {
  date: string;
  weights: Record<string, number>;
}

export interface ROIReport {
  total_investment: number;
  total_revenue: number;
  roi_percentage: number;
  cost_per_article: number;
  revenue_per_article: number;
  monthly_breakdown: Array<{
    month: string;
    articles_produced: number;
    cost: number;
    estimated_traffic_value: number;
    roi: number;
  }>;
}

export async function fetchPortfolioSummary() {
  return apiFetch<{ success: boolean; data: PortfolioSummary }>(
    "/api/performance/portfolio"
  );
}

export async function fetchArticlePerformances(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return apiFetch<PaginatedResponse<ArticlePerformance>>(
    `/api/performance/articles${qs}`
  );
}

export async function fetchWeightHistory() {
  return apiFetch<{ success: boolean; data: WeightHistoryEntry[] }>(
    "/api/performance/weight-history"
  );
}

export async function fetchROIReport() {
  return apiFetch<{ success: boolean; data: ROIReport }>(
    "/api/performance/roi"
  );
}
