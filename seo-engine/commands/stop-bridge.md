---
name: stop-bridge
description: Stop the Article Engine bridge server.
---

# Stop Bridge Server

Stop the running Article Engine bridge server.

## Steps

1. **Check if running:** Try fetching `http://127.0.0.1:19847/health`. If it does not respond, the bridge is not running — inform the user and stop.

2. **Find the PID file:** Look for `.claude-bridge-pid` in the current project directory.

3. **Kill the process:**
   - If PID file exists: read the PID and kill it with `taskkill /PID <pid> /F` (Windows) or `kill <pid>` (Unix)
   - If no PID file: use `powershell.exe -command "Get-NetTCPConnection -LocalPort 19847 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }"` (Windows) or `lsof -ti:19847 | xargs kill` (Unix)

4. **Clean up:** Remove `.claude-bridge-pid` if it exists.

5. **Verify:** Try fetching `http://127.0.0.1:19847/health` again — it should fail.

6. **Report:** "Bridge server stopped."
