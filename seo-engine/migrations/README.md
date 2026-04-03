# Database Migrations

Versioned SQL migration files for ChainIQ's Supabase database.

## Running Migrations

Migrations are run in order against your Supabase project via the SQL Editor:

1. Open your Supabase dashboard → SQL Editor
2. Run each migration file in numerical order
3. Each file is idempotent (`CREATE TABLE IF NOT EXISTS`)

## Migration Files

| # | File | Description |
|---|------|-------------|
| 001 | `001-initial-schema.sql` | Core tables: subscriptions, usage_logs |
| 002 | `002-dashboard-tables.sql` | Dashboard tables: articles, article_versions, pipeline_jobs |
| 003 | `003-webhook-config.sql` | Webhook configuration storage |

## Rollback

Each migration file includes a rollback comment at the top. To roll back, run the `DROP TABLE` statement from the comment.

## Adding New Migrations

1. Create a new file: `NNN-description.sql` (zero-padded 3 digits)
2. Use `CREATE TABLE IF NOT EXISTS` for idempotency
3. Include a rollback comment at the top
4. Add RLS policies for any new tables
5. Add indexes for foreign keys and frequent query columns
6. Update this README
