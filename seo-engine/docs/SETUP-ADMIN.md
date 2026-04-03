# Admin Setup Guide

This guide covers setting up ChainIQ from scratch, including Supabase configuration, environment variables, and creating the first admin user.

## 1. Supabase Project Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Note your project's:
   - **Project URL** — `https://your-project.supabase.co`
   - **Anon (public) key** — found in Settings > API
   - **Service role key** — found in Settings > API (keep secret)

## 2. Database Schema

Run the SQL setup script in Supabase's SQL Editor:

1. Go to your Supabase dashboard > SQL Editor
2. Paste the contents of `supabase-setup.sql`
3. Click "Run"

This creates:
- `subscriptions` table with RLS policies
- `usage_logs` table with RLS policies
- Trigger to auto-create a subscription row on user signup

## 3. Environment Variables

```bash
cp .env.example .env
```

Fill in your values:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
BRIDGE_PORT=19847
```

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Public anon key (safe for client, RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | For admin | Bypasses RLS. Required for `/admin/*` endpoints |
| `BRIDGE_PORT` | No | Bridge server port (default: 19847) |

**Security note:** The service role key bypasses Row Level Security. Never expose it to clients or commit it to version control.

## 4. Start the Bridge Server

```bash
npm run bridge
```

Verify it's running:

```bash
curl http://127.0.0.1:19847/health
# {"status":"ok","uptime":1}
```

## 5. Create the First Admin User

Since admin creation requires an existing admin, bootstrap the first admin manually:

### Option A: Via Supabase Dashboard

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User" and create a user with email/password
3. Go to Table Editor > `subscriptions`
4. Find the row for your new user
5. Set `status` to `active` and `role` to `admin`

### Option B: Via SQL Editor

```sql
-- After creating a user via /auth/signup, promote them to admin:
UPDATE subscriptions
SET status = 'active', role = 'admin'
WHERE user_id = 'your-user-uuid-here';
```

### Verify Admin Access

```bash
# Login as admin
curl -X POST http://127.0.0.1:19847/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'

# Use the returned access_token to list users
curl http://127.0.0.1:19847/admin/users \
  -H "Authorization: Bearer <access_token>"
```

## 6. Adding More Users

Once you have an admin account, use the admin API:

```bash
# Create and auto-activate a user
curl -X POST http://127.0.0.1:19847/admin/add-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"email":"newuser@example.com","password":"securepass"}'
```

Or let users self-register via `/auth/signup` and approve them:

```bash
# Approve a pending user
curl -X POST http://127.0.0.1:19847/admin/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"user_id":"user-uuid-here"}'
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Admin config not available` | Set `SUPABASE_SERVICE_ROLE_KEY` in your `.env` file |
| `Port 19847 is already in use` | Run `/stop-bridge` or set `BRIDGE_PORT` to a different port |
| `Invalid email or password` | Verify credentials in Supabase Auth dashboard |
| `Account pending approval` | An admin needs to approve the user via `/admin/approve` |
| `Token verification failed` | Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct |
| Admin endpoints return `403` | User's subscription must have `role: 'admin'` and `status: 'active'` |
