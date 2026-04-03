/**
 * API Key Manager for ChainIQ Bridge Server
 *
 * Encrypts/decrypts API keys using AES-256-GCM.
 * Keys are stored encrypted in Supabase and never returned in full via API.
 * Resolved keys are injected as environment variables into Claude CLI subprocesses.
 *
 * Zero npm dependencies — uses Node.js built-in crypto.
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const HINT_LENGTH = 4;

/**
 * Get or derive the encryption key.
 * Uses BRIDGE_ENCRYPTION_KEY env var (32-byte hex or base64).
 * Auto-generates and caches if not set (development convenience).
 */
let _encryptionKey = null;

function getEncryptionKey() {
  if (_encryptionKey) return _encryptionKey;

  const envKey = process.env.BRIDGE_ENCRYPTION_KEY;
  if (envKey) {
    // Accept hex (64 chars) or base64 (44 chars)
    if (/^[0-9a-f]{64}$/i.test(envKey)) {
      _encryptionKey = Buffer.from(envKey, 'hex');
    } else {
      _encryptionKey = Buffer.from(envKey, 'base64');
    }
    if (_encryptionKey.length !== 32) {
      throw new Error('BRIDGE_ENCRYPTION_KEY must be exactly 32 bytes (64 hex chars or 44 base64 chars)');
    }
  } else {
    // Auto-generate for development — warn in logs
    const { logger } = getLogger();
    if (logger) {
      logger.warn('BRIDGE_ENCRYPTION_KEY not set — generating ephemeral key. API keys will be lost on restart.');
    }
    _encryptionKey = crypto.randomBytes(32);
  }

  return _encryptionKey;
}

/**
 * Lazy-load logger to avoid circular dependency
 */
function getLogger() {
  try {
    return { logger: require('./logger') };
  } catch {
    return { logger: null };
  }
}

/**
 * Encrypt a plaintext API key.
 * Returns: iv:authTag:ciphertext (all hex-encoded, colon-separated)
 */
function encrypt(plaintext) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt an encrypted API key.
 * Input format: iv:authTag:ciphertext (hex-encoded, colon-separated)
 */
function decrypt(encryptedValue) {
  const key = getEncryptionKey();
  const parts = encryptedValue.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted key format');

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const ciphertext = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Generate a display hint from a plaintext key (last N chars, masked).
 * Example: "sk-abc123xyz" → "****xyz"
 */
function generateHint(plaintext) {
  if (plaintext.length <= HINT_LENGTH) return '****';
  return '****' + plaintext.slice(-HINT_LENGTH);
}

/**
 * Key Manager — manages encrypted keys in Supabase via the bridge's supabase-client.
 */
class KeyManager {
  constructor({ supabase }) {
    this.supabase = supabase;
  }

  /**
   * Store a new API key (encrypted).
   * @param {string} keyName - Key identifier (e.g., 'gemini_api_key')
   * @param {string} keyValue - Plaintext API key value
   * @param {string} createdBy - User ID of admin creating the key
   * @param {string} scope - 'global' or a specific user ID
   */
  async addKey(keyName, keyValue, createdBy, scope = 'global') {
    const config = this.supabase.loadConfig();
    const serviceRoleKey = this.supabase.getServiceRoleKey();
    if (!config || !serviceRoleKey) throw new Error('Admin config not available');

    // Deactivate existing active key with same name+scope
    await fetch(
      `${config.url}/rest/v1/api_keys?key_name=eq.${encodeURIComponent(keyName)}&scope=eq.${encodeURIComponent(scope)}&is_active=eq.true`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': 'Bearer ' + serviceRoleKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ is_active: false, updated_at: new Date().toISOString() })
      }
    );

    // Insert new encrypted key
    const res = await fetch(`${config.url}/rest/v1/api_keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        key_name: keyName,
        key_value_encrypted: encrypt(keyValue),
        key_hint: generateHint(keyValue),
        scope,
        created_by: createdBy,
        is_active: true
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to store API key');
    }

    const rows = await res.json();
    const row = rows[0];
    return {
      id: row.id,
      key_name: row.key_name,
      key_hint: row.key_hint,
      scope: row.scope,
      is_active: row.is_active,
      created_at: row.created_at
    };
  }

  /**
   * List all API keys (metadata only — never returns decrypted values).
   */
  async listKeys() {
    const config = this.supabase.loadConfig();
    const serviceRoleKey = this.supabase.getServiceRoleKey();
    if (!config || !serviceRoleKey) throw new Error('Admin config not available');

    const res = await fetch(
      `${config.url}/rest/v1/api_keys?select=id,key_name,key_hint,scope,is_active,created_at,updated_at&order=created_at.desc`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': 'Bearer ' + serviceRoleKey
        }
      }
    );

    if (!res.ok) return [];
    return res.json();
  }

  /**
   * Rotate a key — deactivate old, insert new with same name+scope.
   */
  async rotateKey(keyId, newValue, rotatedBy) {
    const config = this.supabase.loadConfig();
    const serviceRoleKey = this.supabase.getServiceRoleKey();
    if (!config || !serviceRoleKey) throw new Error('Admin config not available');

    // Get the existing key's metadata
    const getRes = await fetch(
      `${config.url}/rest/v1/api_keys?id=eq.${keyId}&select=key_name,scope`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': 'Bearer ' + serviceRoleKey
        }
      }
    );
    if (!getRes.ok) throw new Error('Key not found');
    const rows = await getRes.json();
    if (rows.length === 0) throw new Error('Key not found');

    const { key_name, scope } = rows[0];
    return this.addKey(key_name, newValue, rotatedBy, scope);
  }

  /**
   * Revoke (deactivate) a key by ID.
   */
  async revokeKey(keyId) {
    const config = this.supabase.loadConfig();
    const serviceRoleKey = this.supabase.getServiceRoleKey();
    if (!config || !serviceRoleKey) throw new Error('Admin config not available');

    const res = await fetch(
      `${config.url}/rest/v1/api_keys?id=eq.${keyId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': 'Bearer ' + serviceRoleKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ is_active: false, updated_at: new Date().toISOString() })
      }
    );
    if (!res.ok) throw new Error('Failed to revoke key');
  }

  /**
   * Resolve the decrypted value of an active key by name.
   * Used internally before spawning Claude CLI — never exposed via API.
   */
  async resolveKey(keyName, scope = 'global') {
    const config = this.supabase.loadConfig();
    const serviceRoleKey = this.supabase.getServiceRoleKey();
    if (!config || !serviceRoleKey) return null;

    const res = await fetch(
      `${config.url}/rest/v1/api_keys?key_name=eq.${encodeURIComponent(keyName)}&scope=eq.${encodeURIComponent(scope)}&is_active=eq.true&select=key_value_encrypted&limit=1&order=created_at.desc`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': 'Bearer ' + serviceRoleKey
        }
      }
    );

    if (!res.ok) return null;
    const rows = await res.json();
    if (rows.length === 0) return null;

    try {
      return decrypt(rows[0].key_value_encrypted);
    } catch (e) {
      const { logger } = getLogger();
      if (logger) logger.error(`Failed to decrypt key "${keyName}": ${e.message}`);
      return null;
    }
  }

  /**
   * Resolve all active keys and return as env var map.
   * Used to set environment before spawning Claude CLI subprocess.
   */
  async resolveAllKeys() {
    const config = this.supabase.loadConfig();
    const serviceRoleKey = this.supabase.getServiceRoleKey();
    if (!config || !serviceRoleKey) return {};

    const res = await fetch(
      `${config.url}/rest/v1/api_keys?is_active=eq.true&select=key_name,key_value_encrypted&order=created_at.desc`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': 'Bearer ' + serviceRoleKey
        }
      }
    );

    if (!res.ok) return {};
    const rows = await res.json();

    const envMap = {};
    const ENV_KEY_NAMES = {
      'gemini_api_key': 'GEMINI_API_KEY',
      'custom_llm_key': 'CUSTOM_LLM_API_KEY',
      'webhook_signing_key': 'WEBHOOK_SIGNING_KEY'
    };

    for (const row of rows) {
      const envName = ENV_KEY_NAMES[row.key_name] || row.key_name.toUpperCase();
      if (!envMap[envName]) {
        try {
          envMap[envName] = decrypt(row.key_value_encrypted);
        } catch {
          // Skip keys that fail to decrypt
        }
      }
    }

    return envMap;
  }

  /**
   * Test if a key is valid by attempting a lightweight API call.
   * Currently supports: gemini_api_key
   */
  async testKey(keyName) {
    const value = await this.resolveKey(keyName);
    if (!value) return { valid: false, error: 'Key not found or cannot be decrypted' };

    if (keyName === 'gemini_api_key') {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${value}`,
          { method: 'GET' }
        );
        if (res.ok) return { valid: true };
        return { valid: false, error: `Gemini API returned ${res.status}` };
      } catch (e) {
        return { valid: false, error: e.message };
      }
    }

    return { valid: true, warning: 'No test available for this key type — stored successfully' };
  }
}

// Aliases matching acceptance-criteria signatures
const encryptKey = encrypt;
const decryptKey = decrypt;

module.exports = { KeyManager, encrypt, decrypt, encryptKey, decryptKey, generateHint };
