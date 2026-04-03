/**
 * Test helper: start/stop bridge server on a random available port.
 *
 * Usage:
 *   const { startServer, stopServer, baseUrl } = require('./helpers/server');
 *   before(async () => { await startServer(); });
 *   after(async () => { await stopServer(); });
 *   // then fetch(`${baseUrl()}/health`)
 */

const { spawn } = require('child_process');
const path = require('path');
const net = require('net');
const fs = require('fs');

let serverProc = null;
let serverPort = null;
let projectDir = null;

/**
 * Find a free port by binding to 0 and releasing.
 */
async function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

/**
 * Start the bridge server on a random port.
 * Creates a temporary project directory for isolation.
 */
async function startServer() {
  serverPort = await findFreePort();
  projectDir = path.join(__dirname, '..', '.test-project-' + serverPort);

  // Create temp project dir with a test HTML file
  fs.mkdirSync(projectDir, { recursive: true });
  fs.writeFileSync(path.join(projectDir, 'test-article.html'), '<html><body>Test</body></html>');

  const serverPath = path.join(__dirname, '..', '..', 'bridge', 'server.js');

  return new Promise((resolve, reject) => {
    serverProc = spawn(process.execPath, [serverPath, projectDir], {
      env: {
        ...process.env,
        BRIDGE_PORT: String(serverPort),
        // Don't need real Supabase for most tests
        SUPABASE_URL: process.env.SUPABASE_URL || 'https://test.supabase.co',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'test-anon-key',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        reject(new Error('Server failed to start within 5s'));
        serverProc.kill('SIGTERM');
      }
    }, 5000);

    serverProc.stdout.on('data', (data) => {
      const text = data.toString();
      if (text.includes('Ready for section edits') && !started) {
        started = true;
        clearTimeout(timeout);
        resolve();
      }
    });

    serverProc.stderr.on('data', (data) => {
      // Suppress stderr in tests unless debugging
      if (process.env.TEST_DEBUG) {
        process.stderr.write('[bridge] ' + data.toString());
      }
    });

    serverProc.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    serverProc.on('exit', (code) => {
      if (!started) {
        clearTimeout(timeout);
        reject(new Error('Server exited before starting, code: ' + code));
      }
    });
  });
}

/**
 * Stop the bridge server and clean up temp directory.
 */
async function stopServer() {
  if (serverProc) {
    serverProc.kill('SIGTERM');
    await new Promise((resolve) => {
      serverProc.on('exit', resolve);
      setTimeout(resolve, 2000);
    });
    serverProc = null;
  }
  if (projectDir) {
    try {
      fs.rmSync(projectDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
    projectDir = null;
  }
}

/**
 * Get the base URL for the running test server.
 */
function baseUrl() {
  if (!serverPort) throw new Error('Server not started. Call startServer() first.');
  return `http://127.0.0.1:${serverPort}`;
}

/**
 * Get the project directory used by the test server.
 */
function getProjectDir() {
  return projectDir;
}

module.exports = { startServer, stopServer, baseUrl, getProjectDir };
