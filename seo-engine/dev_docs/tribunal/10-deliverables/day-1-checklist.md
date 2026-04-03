# Day 1 Checklist -- The Most Important Day of the Project

**Date:** First day of Phase A development
**Goal:** Submit every external dependency application and perform the first infrastructure and code changes
**Time required:** Full working day (8 hours)
**Why this matters:** Every external dependency has a multi-week approval queue. Submitting them all on Day 1 means they process in parallel with development. Every day of delay on these submissions adds a day to the entire project timeline.

---

## Task 1: Submit Google OAuth Consent Screen

**Time:** 45-60 minutes
**Prerequisites:** Google Cloud account, privacy policy URL, terms of service URL, 120x120px logo image
**What blocks if delayed:** ALL data ingestion from GSC and GA4. This gates the entire intelligence layer. Every day this is not submitted adds a day to the project.

### Steps

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project named "ChainIQ" (or select the existing project if one exists)
3. Navigate to **APIs & Services > OAuth consent screen**
4. Select **External** user type (required for third-party access to client Google accounts)
5. Fill in the consent screen form:
   - **App name:** ChainIQ
   - **User support email:** Your business email
   - **App logo:** Upload a 120x120px PNG or JPG (must be under 1MB)
   - **Application homepage link:** Your production domain URL (must be live and accessible)
   - **Application privacy policy link:** URL to your privacy policy page (must be publicly accessible -- draft a minimal version if one does not exist, using a legal template)
   - **Application terms of service link:** URL to your terms of service page (same requirement)
   - **Authorized domains:** Add your production domain
   - **Developer contact email:** Your email
6. Click **Save and Continue**
7. On the **Scopes** page, click **Add or Remove Scopes** and add exactly these two:
   - `https://www.googleapis.com/auth/webmasters.readonly` (Search Console read access)
   - `https://www.googleapis.com/auth/analytics.readonly` (Google Analytics read access)
8. Click **Save and Continue**
9. On the **Test users** page, add the Google accounts that will be used during development and the SRMG pilot (up to 100 test users). This enables Testing mode immediately while verification is pending.
10. Click **Save and Continue**, then **Back to Dashboard**
11. Click **Publish App** to submit for verification
12. Navigate to **APIs & Services > Credentials**
13. Click **Create Credentials > OAuth 2.0 Client IDs**
14. Select **Web application**
15. Add your production domain callback URL: `https://yourdomain.com/api/auth/google/callback`
16. Also add `http://localhost:19847/api/auth/google/callback` for local development
17. Copy the **Client ID** and **Client Secret** -- store them as environment variables, never in code

**Verification timeline:** Google acknowledges receipt within 3-5 business days. First review round happens at weeks 2-4. Potential rejection and resubmission at weeks 4-6. Best case: approved by Week 4. Worst case: Week 8. Testing mode (100 users) works immediately.

**If privacy policy and ToS do not exist yet:** This is the actual Day 1 blocker. Draft minimal acceptable versions before starting this task. Google requires pages to be publicly accessible but does not require legal perfection. A simple page covering data collection, usage, and user rights is sufficient for initial submission. Refine later.

---

## Task 2: Apply for Semrush API Access

**Time:** 15-20 minutes
**Prerequisites:** Semrush account (free or paid)
**What blocks if delayed:** Gap analysis and keyword research features in Phase B. Not blocking Phase A, but the 1-2 week approval process should overlap with Phase A development.

### Steps

1. Go to [Semrush Developer Portal](https://www.semrush.com/api/)
2. Sign in with your Semrush account
3. Navigate to the API access request form
4. Fill in:
   - **Company name:** Chain Reaction / ChainIQ
   - **Use case description:** "AI Content Intelligence Platform that uses Semrush keyword data and gap analysis to recommend content topics for enterprise publishers. Integration will cache responses with 7-day TTL and use batch endpoints to minimize API calls."
   - **Expected monthly API units:** Start with 10,000 units (can be increased later)
   - **Integration type:** Server-side (bridge server)
5. Submit the application
6. Semrush typically responds within 5-10 business days with API key or follow-up questions
7. Store the API key as an environment variable when received

**Expected cost:** $80-$150/month at production usage levels. Phase A uses zero Semrush API calls.

---

## Task 3: Apply for Ahrefs API Access

**Time:** 15-20 minutes
**Prerequisites:** Ahrefs account (paid plan required for API access)
**What blocks if delayed:** Backlink analysis and domain rating features in Phase B. Same logic as Semrush -- start the approval clock now.

### Steps

1. Go to [Ahrefs API Portal](https://ahrefs.com/api)
2. Sign in with your Ahrefs account (must be on a paid plan)
3. Navigate to API access settings
4. Request API access with:
   - **Use case:** "Content intelligence platform using backlink data and keyword explorer for enterprise publisher content strategy. Responses cached with 7-30 day TTL depending on data type."
   - **Expected usage:** Low initially (development and testing), scaling to per-client usage
5. Generate or request API token
6. Store the API token as an environment variable when received

**Expected cost:** $50-$120/month at production usage levels. Phase A uses zero Ahrefs API calls.

---

## Task 4: Submit WordPress Plugin Shell to wordpress.org

**Time:** 30-45 minutes
**Prerequisites:** WordPress.org account
**What blocks if delayed:** WordPress plugin directory listing. The review process takes 1-4 weeks. The plugin does not need to be functional at submission -- a shell with correct metadata is sufficient to start the review process.

### Steps

1. Create a wordpress.org account if you do not have one at [wordpress.org/support/register](https://wordpress.org/support/register/)
2. Create a minimal plugin file structure:
   ```
   chainiq/
   ├── chainiq.php          (main plugin file with header comment)
   ├── readme.txt           (WordPress plugin readme format)
   └── assets/
       ├── icon-256x256.png
       └── banner-1544x500.png
   ```
3. In `chainiq.php`, include the required plugin header:
   ```php
   <?php
   /**
    * Plugin Name: ChainIQ - AI Content Intelligence
    * Plugin URI: https://chainiq.ai
    * Description: AI-powered content intelligence platform. Connects your content strategy to Search Console and Analytics data, detects content decay, identifies keyword gaps, and publishes optimized articles directly to WordPress.
    * Version: 0.1.0
    * Requires at least: 6.0
    * Requires PHP: 7.4
    * Author: Chain Reaction
    * Author URI: https://chainreaction.com
    * License: GPL v2 or later
    * License URI: https://www.gnu.org/licenses/gpl-2.0.html
    * Text Domain: chainiq
    */
   ```
4. Write `readme.txt` in the WordPress plugin readme format with: description, installation instructions, FAQ, changelog
5. Go to [wordpress.org/plugins/developers/add](https://wordpress.org/plugins/developers/add/)
6. Upload the plugin ZIP file
7. Submit for review

**Review timeline:** WordPress.org plugin review takes 1-4 weeks. Initial review checks for security issues, GPL compliance, and readme format. A minimal shell plugin with correct metadata typically passes on first review. Actual functionality can be added via updates after approval.

---

## Task 5: Create Shopify Partner Account

**Time:** 15-20 minutes
**Prerequisites:** None (free to create)
**What blocks if delayed:** Shopify app development and testing in Phase C. The Partner account is free and instant, but the app submission process has its own review timeline.

### Steps

1. Go to [Shopify Partners](https://partners.shopify.com/signup)
2. Create a free Partner account
3. Once approved, navigate to **Apps > Create app**
4. Select **Custom app** for initial development
5. Note the API key and API secret -- these will be needed in Phase C
6. Create a development store for testing (free with Partner account)
7. No further action needed until Phase C (Weeks 15-22)

---

## Task 6: Set Up Hetzner Server + Coolify

**Time:** 60-90 minutes
**Prerequisites:** Hetzner Cloud account (requires payment method), domain name
**What blocks if delayed:** OAuth callbacks require an internet-accessible server. Without this, the OAuth flow (Sprint 2) cannot be tested against real Google accounts. This also blocks the CORS hardening and HTTPS setup.

### Steps

1. Create a Hetzner Cloud account at [hetzner.com/cloud](https://www.hetzner.com/cloud) if not already done
2. In the Hetzner Cloud Console, click **Add Server**
3. Configure:
   - **Location:** Choose closest to your primary users (Falkenstein for Europe, Ashburn for US)
   - **Image:** Ubuntu 22.04
   - **Type:** CPX21 (3 vCPU, 4GB RAM, 80GB SSD) -- approximately EUR 7.50/month
   - **Networking:** Public IPv4 (enabled by default)
   - **SSH Key:** Add your SSH public key for secure access
   - **Name:** `chainiq-prod`
4. Click **Create & Buy Now** -- server provisions in under 60 seconds
5. Note the public IP address
6. SSH into the server: `ssh root@YOUR_SERVER_IP`
7. Install Coolify:
   ```bash
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```
   This takes approximately 5-10 minutes
8. Access Coolify at `http://YOUR_SERVER_IP:8000`
9. Complete Coolify initial setup (admin account, server registration)
10. In Coolify, create a new **Application** resource:
    - **Source:** Git repository (or Docker image)
    - **Build pack:** Dockerfile (or Nixpacks for Node.js auto-detection)
    - **Port:** 19847 (bridge server port)
11. Configure environment variables in Coolify:
    - `SUPABASE_URL`
    - `SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `BRIDGE_PORT=19847`
    - `NODE_ENV=production`
    - `GOOGLE_CLIENT_ID` (from Task 1)
    - `GOOGLE_CLIENT_SECRET` (from Task 1)
12. Deploy the bridge server and verify it responds at `http://YOUR_SERVER_IP:19847/health`
13. Set up Cloudflare DNS:
    - Log in to Cloudflare, add your domain (or use existing)
    - Create an A record pointing to the Hetzner IP
    - Enable Cloudflare proxy (orange cloud) for DDoS protection
    - SSL/TLS mode: Full (strict) -- Coolify handles the origin certificate via Let's Encrypt
14. In Coolify, configure the domain and enable Let's Encrypt SSL
15. Verify HTTPS: `https://yourdomain.com/health` should return the bridge server health response

**Ongoing cost:** Approximately EUR 7.50/month ($9/month). Cloudflare free tier is sufficient.

---

## Task 7: Create the Route-Splitting Refactor PR

**Time:** Remaining hours of Day 1 (2-4 hours to start; full completion is Sprint 1)
**Prerequisites:** Hetzner server running (Task 6), or local development environment
**What blocks if delayed:** Every new endpoint added to the monolith makes the eventual refactor harder. This is Risk #1 (score 20/25). Starting it on Day 1 prevents any new work from compounding the debt.

### Steps

1. Create a new branch: `git checkout -b feat/route-splitting`
2. Create the route module directory: `mkdir bridge/routes`
3. Extract the first route group (start with `/health` -- simplest, lowest risk):
   - Create `bridge/routes/health.js`
   - Move the health endpoint handler from server.js into the new file
   - Export as a handler function: `module.exports = function healthRoutes(req, res) { ... }`
4. In server.js, import the route module and dispatch:
   ```javascript
   const healthRoutes = require('./routes/health.js');
   // In the request handler:
   if (url.startsWith('/health')) return healthRoutes(req, res);
   ```
5. Run all 228 existing tests to verify nothing broke
6. Repeat for each route group: auth, admin, edit, dashboard, settings, generate, webhooks
7. New empty modules for Phase A endpoints: connections, intelligence, quality, publishing
8. Target: server.js under 400 lines by end of Sprint 1

**This task will not be completed on Day 1.** The goal is to start the refactor, establish the pattern, and extract at least 2-3 route groups. Full completion is the Sprint 1 deliverable. Starting on Day 1 ensures the pattern is set before any new endpoints are added.

---

## Task 8: Run the 6 New DB Migrations

**Time:** 30-45 minutes
**Prerequisites:** Supabase project access (existing from v1)
**What blocks if delayed:** All Sprint 2 and Sprint 3 work writes to these tables. Without them, OAuth tokens have nowhere to be stored, crawled URLs have no persistence, and intelligence outputs cannot be saved.

### Steps

1. Open the Supabase SQL Editor for your project
2. Run each migration script in order:

   **Migration 1: client_connections**
   ```sql
   CREATE TABLE client_connections (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     client_id UUID REFERENCES auth.users(id) NOT NULL,
     provider TEXT NOT NULL CHECK (provider IN ('google', 'semrush', 'ahrefs')),
     access_token_encrypted TEXT,
     refresh_token_encrypted TEXT,
     token_expiry TIMESTAMPTZ,
     last_successful_pull TIMESTAMPTZ,
     status TEXT DEFAULT 'active' CHECK (status IN ('active', 'stale', 'expired', 'disconnected')),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ALTER TABLE client_connections ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users can manage their own connections"
     ON client_connections FOR ALL USING (auth.uid() = client_id);
   CREATE INDEX idx_connections_client ON client_connections(client_id);
   ```

   **Migration 2: content_inventory** -- create table, RLS, indexes

   **Migration 3: keyword_opportunities** -- create table, RLS, indexes

   **Migration 4: writer_personas** -- create table, RLS, indexes

   **Migration 5: performance_snapshots** -- create table with range partitioning by month, RLS, indexes

   **Migration 6: performance_predictions** -- create table, RLS, indexes

3. Verify each table exists: `SELECT * FROM information_schema.tables WHERE table_schema = 'public'`
4. Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`
5. Test RLS isolation: attempt to read from one table using a different auth.uid() -- should return empty

**Note:** The full migration SQL for all 6 tables should be version-controlled in a `migrations/` directory. The Supabase SQL Editor is for execution; the source of truth is the migration files in the repository.

---

## Day 1 Schedule (Recommended Order)

| Time | Task | Duration | Why This Order |
|------|------|----------|---------------|
| 09:00 | Draft privacy policy + ToS pages (if not ready) | 30-45 min | Gates Task 1 |
| 09:45 | **Task 1:** Submit Google OAuth consent screen | 45-60 min | Longest approval queue (2-6 weeks) -- submit first |
| 10:45 | **Task 2:** Apply for Semrush API access | 15-20 min | 1-2 week queue -- submit early |
| 11:05 | **Task 3:** Apply for Ahrefs API access | 15-20 min | 1-2 week queue -- submit early |
| 11:25 | **Task 5:** Create Shopify Partner account | 15-20 min | Quick, unblocks Phase C planning |
| 11:45 | **Task 4:** Submit WordPress plugin shell | 30-45 min | 1-4 week queue -- submit before lunch |
| 12:30 | Lunch break | 30 min | |
| 13:00 | **Task 6:** Set up Hetzner + Coolify + Cloudflare | 60-90 min | Infrastructure must be live for OAuth testing |
| 14:30 | **Task 8:** Run 6 DB migrations | 30-45 min | Tables must exist before Sprint 2 code |
| 15:15 | **Task 7:** Start route-splitting refactor | 2-4 hours | First code change -- establish the pattern |
| 17:15 | End of Day 1 | | |

**Day 1 outcomes:** 5 external applications submitted (Google OAuth, Semrush, Ahrefs, WordPress plugin, Shopify Partner), production server live with HTTPS, 6 database tables created, route-splitting refactor started. The approval clocks are running. Development can proceed at full speed starting Day 2.

---

## What Happens If You Skip Day 1 Tasks

| Skipped Task | Consequence |
|-------------|------------|
| Google OAuth submission | Intelligence layer delayed by 2-6 weeks PLUS every day you waited. This is the single highest-cost skip. |
| Semrush/Ahrefs applications | Phase B gap analysis and keyword research features delayed. Less critical than OAuth but still a multi-week queue. |
| WordPress plugin submission | Phase B publishing blocked until plugin is approved. 1-4 week review process cannot be parallelized with development. |
| Hetzner setup | OAuth flow cannot be tested with real Google accounts (callbacks need an internet-accessible server). Sprint 2 is blocked. |
| DB migrations | Every Sprint 2 story writes to these tables. Without them, OAuth tokens, GSC data, GA4 data, and crawled URLs have no persistence. Sprint 2 is blocked. |
| Route splitting start | Not immediately blocking, but every new endpoint added to the monolith compounds the refactor cost. Starting on Day 1 prevents the problem from growing. |

**The non-negotiable minimum for Day 1 is Tasks 1, 6, and 8.** Google OAuth submission, Hetzner deployment, and database migrations. Everything else can slip to Day 2 without project-level impact. But submitting the OAuth consent screen cannot wait even one day -- the verification queue is the project's longest external dependency.
