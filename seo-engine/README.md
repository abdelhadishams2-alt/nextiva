# ChainIQ

AI Content Intelligence Platform. Generates full standalone HTML article pages from minimal input by adapting to any website's design system.

**Status:** v1.0.0-alpha (pre-release)

## Quick Start

### Prerequisites

- Node.js 18+
- A Supabase project (for auth and subscriptions)
- Claude CLI installed and available in PATH

### Install

```bash
git clone <repo-url>
cd article-engine-plugin
```

No `npm install` needed — zero npm dependencies.

### Configure

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...    # Required for admin endpoints
```

Run the database setup:

```bash
# Execute supabase-setup.sql in your Supabase SQL editor
```

See [docs/SETUP-ADMIN.md](docs/SETUP-ADMIN.md) for detailed admin configuration.

### Run

```bash
# Start the bridge server
npm run bridge

# Or with a specific project directory
node bridge/server.js /path/to/your/project
```

The bridge server runs at `http://127.0.0.1:19847`.

## Architecture

```
Topic keyword
  │
  ▼
SKILL.md orchestrator (20-step pipeline)
  ├── Project Analyzer ──► Detect shell, tokens, components
  ├── Research Engine ───► 6-round research via Gemini MCP
  ├── Article Architect ─► Concepts → architecture → component mapping
  └── Draft Writer ──────► Standalone HTML + inline edit UI
                              │
                              ▼
                     Browser opens article
                              │
                     User clicks "Edit Section"
                              │
                              ▼
                     Bridge Server (localhost:19847)
                              │
                     Supabase Auth ──► Claude CLI subprocess
```

### 3 Adaptation Modes

- **EXISTING** — uses components found in the target project
- **REGISTRY** — uses 193 built-in structural component blueprints
- **FALLBACK** — generates components from scratch with safe defaults

## API Reference

The bridge server exposes 12 HTTP endpoints. See [docs/BRIDGE-API.md](docs/BRIDGE-API.md) for full documentation.

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /health` | No | Server status |
| `POST /auth/signup` | No | Create account |
| `POST /auth/login` | No | Sign in |
| `GET /auth/verify` | Bearer | Verify token |
| `POST /apply-edit` | Bearer | Section edit via Claude CLI |
| `GET /admin/users` | Admin | List users |
| `POST /admin/approve` | Admin | Approve user |
| `POST /admin/revoke` | Admin | Revoke access |
| `POST /admin/delete` | Admin | Delete user |
| `POST /admin/add-user` | Admin | Create user (admin) |
| `GET /admin/usage` | Admin | Usage logs |

## Development

```bash
# Run tests
npm test

# Run a single test suite
node --test tests/auth-middleware.test.js

# Start bridge server in development
npm run bridge
```

### Project Structure

```
├── agents/           # 4-agent pipeline (analyzer, research, architect, writer)
├── bridge/           # HTTP server + Supabase client
├── config/           # Component registry, engine config, templates
├── commands/         # Claude Code slash commands
├── skills/           # SKILL.md orchestrator
├── tests/            # node:test suites
├── docs/             # API and setup documentation
└── dev_docs/         # Internal planning (audit, tasks, specs)
```

## License

MIT
