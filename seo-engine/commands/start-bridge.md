---
name: start-bridge
description: Start the Article Engine bridge server for fully automatic section editing from the browser.
---

# Start Bridge Server

Start the Article Engine bridge server so that section edits from the browser are processed automatically — no copy-paste required.

## Steps

1. **Check if already running:** Try fetching `http://127.0.0.1:19847/health`. If it responds with JSON containing `"status":"ok"`, the bridge is already running — inform the user and stop.

2. **Find the bridge server script:** Locate `bridge/server.js` within the article-engine plugin directory. The plugin is installed at one of these locations:
   - `.claude/plugins/article-engine/bridge/server.js` (relative to project root)
   - Search for the file using Glob if needed: `**/article-engine/bridge/server.js`

3. **Start the server:** Run the following command in the background:
   ```
   node "<path-to-bridge/server.js>" "<current-project-directory>"
   ```
   Use `run_in_background: true` so it stays running.

4. **Verify it started:** Wait 2 seconds, then fetch `http://127.0.0.1:19847/health` to confirm the server is responding.

5. **Report to user:**
   - If successful: "Bridge server started on http://127.0.0.1:19847 — section edits from the browser will now be applied automatically."
   - If failed: "Bridge server failed to start. Check that Node.js is installed and the bridge/server.js file exists."
