# Admin Onboarding — Getting Started with ChainIQ

> **Role:** Agency owner, team admin, or account manager
> **Time to complete:** ~15 minutes
> **Prerequisites:** ChainIQ account with admin privileges, Supabase project URL and keys

---

## Step 1: First Login

1. Navigate to your ChainIQ dashboard URL (e.g., `https://app.chainiq.io`)
2. Click **Sign In** and enter the admin email and password provided during setup
3. After signing in, you'll land on the **Dashboard Overview** page showing your account status

**What you'll see on first login:**
- Empty article list (no articles generated yet)
- Getting Started wizard with setup checklist
- Navigation sidebar with: Dashboard, Articles, Generate, Pipeline, Settings, Admin

---

## Step 2: Configure API Keys

Before your team or CMS plugins can connect, you need API keys:

1. Navigate to **Settings → API Keys**
2. Click **Create New Key**
3. Enter a descriptive name (e.g., "WordPress Production Site" or "Staging Environment")
4. Copy the generated key immediately — it will only be shown once
5. The key is encrypted with AES-256-GCM and stored securely

**Key limits by plan:**
- Starter ($3K/mo): 2 API keys
- Professional ($6K/mo): 5 API keys
- Enterprise ($12K/mo): 20 API keys

---

## Step 3: Connect Data Sources

Connect your Google Search Console and Google Analytics 4 accounts to enable Content Intelligence features:

1. Navigate to **Settings → Connections**
2. Click **Connect Google Search Console**
3. Authorize ChainIQ to access your GSC data (read-only permissions)
4. Select the properties you want to monitor
5. Repeat for **Google Analytics 4**

**What ChainIQ reads from your data:**
- GSC: Search queries, click-through rates, impressions, average position (16 months of history)
- GA4: Page views, engagement time, bounce rate, scroll depth

ChainIQ never modifies your Google data. All connections use OAuth 2.0 with PKCE for security.

---

## Step 4: Set Up Your Team

If you have team members who need access:

1. Navigate to **Admin → User Management**
2. Click **Invite User**
3. Enter their email address
4. Select their role:
   - **Admin**: Full access including user management, billing, and system settings
   - **Editor**: Can generate articles, edit content, and view analytics
   - **Viewer**: Read-only access to articles and reports
5. Set their subscription tier (determines generation quotas)

---

## Step 5: Configure Generation Settings

Set default preferences for article generation:

1. Navigate to **Settings → Preferences**
2. Configure:
   - **Default Language**: Choose from 11 supported languages (Arabic, English, French, Spanish, German, Italian, Portuguese, Dutch, Turkish, Japanese, Korean)
   - **Default Framework**: Auto-detect (recommended) or specify (Next.js, Vue, Svelte, WordPress, plain HTML)
   - **Content Length**: Standard (~2000 words), Long-form (~4000 words), or Brief (~1000 words)
   - **Image Generation**: Enabled/Disabled, image count per article (4-6 default)
   - **Quality Gate**: Auto-check (recommended) or manual review

---

## Step 6: Set Quotas and Billing

Manage usage quotas to control costs:

1. Navigate to **Admin → Quotas**
2. View current plan limits:
   - Articles per month
   - API calls per day
   - Storage usage
3. Optionally override quotas per user (Enterprise only)
4. Set up overage alerts at 80% and 95% usage thresholds

---

## Step 7: Generate Your First Article

Now test the full pipeline:

1. Navigate to **Generate**
2. Enter a topic keyword (e.g., "best project management tools 2026")
3. Select language and any framework preferences
4. Click **Generate Article**
5. Watch the real-time progress indicator showing each pipeline stage:
   - Project Analysis → Research (6 rounds) → Architecture → Image Generation → Draft Writing
6. When complete, review the article in the **Articles** tab
7. Use inline editing to refine any section
8. When satisfied, publish via **Publish** (if CMS is connected)

**Estimated generation time:** 3-8 minutes depending on article complexity and content length.

---

## What's Next?

- **[Article Generation Guide](../guides/article-generation.md)** — Deep dive into generation options and customization
- **[Content Intelligence Guide](../guides/content-intelligence.md)** — Understand decay alerts and topic recommendations
- **[Quality Reports Guide](../guides/quality-reports.md)** — Learn to read the 7-signal quality gate scores
- **[Publishing Guide](../guides/publishing.md)** — Set up WordPress, Shopify, or Ghost publishing

---

## Need Help?

- **In-app help**: Click the `?` icon in the bottom-right corner of any page
- **Troubleshooting**: See [Common Issues](../troubleshooting/common-issues.md)
- **Contact support**: admin@chainreactionseo.com
