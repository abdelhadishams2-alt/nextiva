# ChainIQ Mock API Server

> Zero-dependency mock server covering all 135 API endpoints.
> Serves realistic fixture data for dashboard development without the bridge server.

## Quick Start

```bash
node dev_docs/mocks/server.js
# → http://localhost:19848
```

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `MOCK_PORT` | `19848` | Server port (bridge uses 19847) |
| `MOCK_LATENCY` | `100` | Simulated latency in ms |
| `MOCK_ERROR_RATE` | `0` | Random error rate 0.0–1.0 (0.1 = 10% errors) |
| `MOCK_AUTH` | `false` | Require Bearer token on requests |

### Example: Slow network with 5% errors

```bash
MOCK_LATENCY=500 MOCK_ERROR_RATE=0.05 node dev_docs/mocks/server.js
```

## File Structure

```
mocks/
├── server.js                              Entry point (router + helpers)
├── README.md                              This file
├── fixtures/
│   └── shared.fixtures.js                 Realistic data (users, articles, connections, etc.)
├── handlers/
│   ├── auth-bridge.handlers.js            /health, /auth/*, /admin/* (12 endpoints)
│   ├── dashboard-api.handlers.js          /api/articles, pipeline, blueprints, settings, queue, webhooks, analytics, admin, users (48 endpoints)
│   ├── data-ingestion.handlers.js         /api/connections, inventory, ingestion (20 endpoints)
│   ├── content-intelligence.handlers.js   /api/intelligence/* (15 endpoints)
│   ├── voice-intelligence.handlers.js     /api/voice/* (11 endpoints)
│   ├── quality-gate.handlers.js           /api/quality/* (7 endpoints)
│   ├── publishing.handlers.js             /api/publish/* (15 endpoints)
│   └── feedback-loop.handlers.js          /api/performance/*, /api/feedback/* (9 endpoints)
```

## Features

- Standard response envelope: `{ success: true, data }` / `{ error, message }`
- Pagination support on all list endpoints (`?page=1&limit=20`)
- SSE streaming for progress endpoints (crawl, pipeline, voice analysis, edits)
- Filter and search support where screens require it
- CORS headers on all responses
- Configurable latency and error injection

## Dashboard Integration

Point the dashboard at the mock server during development:

```env
# dashboard/.env.local
NEXT_PUBLIC_BRIDGE_URL=http://localhost:19848
```

## Adding New Endpoints

1. Add fixture data to `fixtures/shared.fixtures.js`
2. Add handler to the appropriate `handlers/*.handlers.js` file
3. Handler format:
   ```js
   {
     method: 'GET',
     pattern: /^\/api\/resource\/(?<id>[a-z0-9-]+)$/,
     handle: ({ params, query, body, fixtures }) => ({
       status: 200,  // optional, defaults to 200
       body: { success: true, data: fixtures.items.find(i => i.id === params.id) }
     })
   }
   ```
4. For SSE endpoints, return `{ sse: true, events: [...] }`
