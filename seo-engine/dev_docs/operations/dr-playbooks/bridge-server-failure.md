# DR Playbook: Bridge Server Failure

> **Severity:** SEV1 (complete outage) or SEV2 (intermittent crashes)
> **RTO (Recovery Time Objective):** 30 minutes
> **RPO (Recovery Point Objective):** 0 (stateless server; data lives in Supabase)
> **Last Tested:** [Update after each drill]
> **Owner:** Solo Developer

---

## 1. Overview

The bridge server is a Node.js application deployed via Coolify on a Hetzner CPX21 VPS (3 vCPU, 4 GB RAM, 80 GB disk). It exposes 48 API endpoints that mediate between the Next.js 16 Dashboard frontend and backend services (Supabase, LLM APIs, content processing). The bridge server is the single point of entry for all platform operations, making its availability critical.

### Failure Modes

| Failure Mode | Symptoms | Likely Cause |
|-------------|----------|-------------|
| **Complete crash** | All endpoints return connection refused, Coolify shows container stopped | Unhandled exception, segfault, fatal error |
| **OOM kill** | Container restarts repeatedly, `dmesg` shows OOM killer, truncated responses | Memory leak, large article batch processing, unbounded caching |
| **Hung process** | Health check timeout, requests hang indefinitely, CPU at 0% | Deadlock, awaiting unresponsive external service, event loop blocked |
| **Partial failure** | Some endpoints work, others 500, inconsistent behavior | Module-level crash, corrupted dependency, bad deployment |
| **Network unreachable** | Cannot connect to server at all, SSH also fails | Hetzner network issue, firewall misconfiguration, IP blocked |

### Services Affected

When the bridge server is down, the impact is total for user-facing operations:

- **Dashboard** cannot load any data or perform any actions
- **Article Pipeline** cannot be triggered or monitored
- **Auth flow** breaks (bridge validates tokens and proxies to Supabase Auth)
- **Analytics** stops recording new events
- **Publishing** cannot push articles to destinations
- All other services that route through bridge endpoints are blocked

---

## 2. Detection

### Automated Detection

1. **Coolify built-in health checks** — Coolify monitors the container and will attempt automatic restarts. You receive a notification when a restart occurs.
2. **External uptime monitor** — UptimeRobot or Better Uptime pings `https://[BRIDGE_DOMAIN]/health` every 30 seconds. Alert fires after 2 consecutive failures.
3. **Dashboard error boundary** — The Next.js dashboard displays a connection error banner when bridge API calls fail, which may trigger a user report.

### Manual Verification

```bash
# Check if the bridge is responding
curl -s -o /dev/null -w "%{http_code}" https://[BRIDGE_DOMAIN]/health

# SSH into the server and check container status
ssh root@[HETZNER_IP]
docker ps -a --filter "name=bridge"

# Check container logs (last 100 lines)
docker logs --tail 100 [CONTAINER_ID]

# Check system resources
free -h
df -h
top -bn1 | head -20
```

---

## 3. Coolify Auto-Restart Behavior

Coolify is configured with automatic restart policies. Understanding this behavior prevents unnecessary manual intervention:

1. **Restart policy:** `unless-stopped` — Coolify will automatically restart the container if it crashes.
2. **Restart backoff:** Coolify uses Docker's exponential backoff (1s, 2s, 4s, 8s, ... up to a cap) to avoid restart loops.
3. **Health check integration:** If configured, Coolify will mark the container as unhealthy and restart it when health checks fail consecutively.

**When auto-restart is sufficient:** Single crash caused by a transient issue (brief network blip, temporary memory spike). If the container comes back healthy within 2 minutes, no further action is needed. Monitor for 15 minutes to ensure stability.

**When auto-restart is NOT sufficient:** If the container has restarted 3+ times in 10 minutes, this indicates a persistent issue. Proceed to manual intervention.

---

## 4. Manual Restart Procedure

### Step 1: SSH Into the Server

```bash
ssh root@[HETZNER_IP]
```

### Step 2: Assess Current State

```bash
# Check all containers
docker ps -a

# Check the bridge container specifically
docker inspect [CONTAINER_ID] | jq '.[0].State'

# Review exit code — non-zero indicates a crash
docker inspect [CONTAINER_ID] --format='{{.State.ExitCode}}'
# Exit code 137 = OOM killed
# Exit code 1 = application error
# Exit code 0 = graceful shutdown (unexpected if not triggered by you)
```

### Step 3: Capture Logs Before Restart

```bash
# Save the full log to a file for postmortem analysis
docker logs [CONTAINER_ID] > /root/incident-logs/bridge-$(date +%Y%m%d-%H%M%S).log 2>&1

# Check system logs for OOM events
dmesg | grep -i "oom\|killed" | tail -20
```

### Step 4: Restart via Coolify

**Preferred method** — Use the Coolify dashboard:
1. Navigate to the Coolify admin panel.
2. Find the bridge server application.
3. Click "Restart."

**Alternative — Docker CLI:**
```bash
docker restart [CONTAINER_ID]
```

### Step 5: Verify Recovery

```bash
# Wait for the container to become healthy (up to 30 seconds)
sleep 10

# Check health
curl -s https://[BRIDGE_DOMAIN]/health

# Verify all critical endpoints respond
curl -s https://[BRIDGE_DOMAIN]/api/v1/status
```

---

## 5. Log Review and Root Cause Analysis

After service is restored, investigate the failure cause:

### Common Log Patterns

```bash
# Search for fatal errors
docker logs [CONTAINER_ID] 2>&1 | grep -i "fatal\|unhandled\|SIGTERM\|SIGKILL"

# Search for memory-related issues
docker logs [CONTAINER_ID] 2>&1 | grep -i "heap\|memory\|allocation"

# Search for connection errors (Supabase, LLM APIs)
docker logs [CONTAINER_ID] 2>&1 | grep -i "ECONNREFUSED\|ETIMEDOUT\|ENOTFOUND"

# Check for Node.js specific errors
docker logs [CONTAINER_ID] 2>&1 | grep -i "ERR_\|TypeError\|RangeError\|ReferenceError"
```

### Memory Leak Investigation

If exit code 137 (OOM killed) or repeated restarts with growing memory:

```bash
# Check current memory usage of the container
docker stats [CONTAINER_ID] --no-stream

# Check host memory
free -h

# If the Node.js process is running, capture a heap snapshot
docker exec [CONTAINER_ID] kill -USR2 $(docker exec [CONTAINER_ID] pgrep node)
# This generates a heap snapshot if --heapsnapshot-signal=SIGUSR2 is set

# Check for large objects in heap (requires adding --inspect flag to Node.js start)
# In package.json: "start": "node --max-old-space-size=3072 --inspect=0.0.0.0:9229 server.js"
```

**Common memory leak sources in the bridge server:**

1. **Unbounded in-memory caches** — Article data or API responses cached without eviction.
2. **Event listener accumulation** — Supabase real-time subscriptions not cleaned up.
3. **Large article batch processing** — Processing 50+ articles simultaneously without streaming.
4. **Unresolved promises** — Pending promises holding references to large objects.
5. **Buffer accumulation** — File uploads or LLM streaming responses not properly drained.

**Mitigation for memory issues:**

```bash
# Set container memory limit in Coolify to prevent OOM killing the host
# In Coolify: Application Settings > Resources > Memory Limit = 3584MB (leave 512MB for system)

# Add Node.js memory limit
# In Coolify environment variables: NODE_OPTIONS=--max-old-space-size=3072
```

---

## 6. Rollback to Previous Docker Image

If the crash was introduced by a recent deployment, roll back:

### Via Coolify Dashboard

1. Navigate to the bridge server application in Coolify.
2. Go to "Deployments" tab.
3. Find the last known good deployment.
4. Click "Rollback" or "Redeploy" on that version.

### Via Docker CLI

```bash
# List available images
docker images | grep bridge

# Identify the previous tag (Coolify tags by commit SHA or timestamp)
# Example: bridge:abc123 (current broken) vs bridge:def456 (last good)

# Stop current container
docker stop [CONTAINER_ID]

# Start with previous image
docker run -d --name bridge-rollback \
  --env-file /app/.env \
  -p 3000:3000 \
  --restart unless-stopped \
  [REGISTRY]/bridge:[PREVIOUS_TAG]

# Verify the rollback works
curl -s https://[BRIDGE_DOMAIN]/health
```

### Post-Rollback

1. **Do NOT redeploy the broken version** until the root cause is identified and fixed.
2. Update `STATUS.md` with the rollback event and the broken commit SHA.
3. On your development machine, reproduce the issue locally before pushing a fix.
4. Once fixed, deploy through the normal CI/CD pipeline with extra monitoring.

---

## 7. Escalation

| Condition | Action |
|-----------|--------|
| Server SSH unreachable | Contact Hetzner support, check Hetzner status page |
| Coolify dashboard unreachable | SSH to server, manage Docker containers directly |
| Repeated OOM despite memory limit increase | Investigate code-level memory leak; consider upgrading to CPX31 (4 vCPU, 8 GB RAM) |
| Disk full | Run `docker system prune -a --volumes` (CAUTION: removes unused containers/images/volumes), check for log rotation |
| Cannot identify root cause after 2 hours | Post in Node.js community forums with sanitized logs, consider engaging a freelance Node.js consultant |

---

## 8. Prevention Checklist

- [ ] Health check endpoint includes memory usage reporting
- [ ] Container memory limit set in Coolify (3584 MB)
- [ ] Node.js `--max-old-space-size` configured (3072 MB)
- [ ] Log rotation configured to prevent disk fill
- [ ] Uptime monitor configured with 30-second intervals
- [ ] Previous Docker image always retained (do not prune last-good image)
- [ ] Graceful shutdown handler implemented (SIGTERM → close connections → exit)
- [ ] Article batch size limited to prevent memory spikes
- [ ] Supabase client connection pooling configured with max connections
