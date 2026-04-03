/**
 * Prompt Injection Guard for ChainIQ bridge server.
 *
 * Detects and blocks Claude instruction patterns in user-submitted
 * edit prompts. Prevents users from hijacking the Claude CLI subprocess
 * via crafted edit requests.
 *
 * Strategy: block known instruction patterns that could override Claude's
 * behavior, while allowing legitimate article editing instructions.
 */

// Patterns that indicate prompt injection attempts
// Each pattern has a regex and a human-readable description
const INJECTION_PATTERNS = [
  // Direct instruction override attempts
  { re: /(?:^|\n)\s*(?:system|assistant|human)\s*:/i, desc: 'Role prefix injection (system:/assistant:/human:)' },
  { re: /(?:^|\n)\s*<(?:system|instructions|prompt|context)>/i, desc: 'XML tag injection (<system>, <instructions>)' },
  { re: /ignore\s+(?:all\s+)?(?:previous|above|prior)\s+(?:instructions|prompts|rules)/i, desc: 'Instruction override attempt' },
  { re: /forget\s+(?:all\s+)?(?:previous|above|prior|your)\s+(?:instructions|prompts|rules|context)/i, desc: 'Context reset attempt' },
  { re: /you\s+are\s+(?:now|no\s+longer)\s+(?:a|an)\s+/i, desc: 'Identity reassignment attempt' },
  { re: /(?:new|updated|revised)\s+(?:system\s+)?instructions?\s*:/i, desc: 'New instruction injection' },
  { re: /(?:^|\n)\s*---+\s*(?:system|instructions|prompt)/i, desc: 'Delimiter-based instruction injection' },

  // Tool/capability manipulation
  { re: /(?:execute|run|eval)\s+(?:this\s+)?(?:code|command|script|shell)/i, desc: 'Code execution attempt' },
  { re: /(?:read|write|delete|modify)\s+(?:file|directory|folder)\s+(?:at|in|from)\s+/i, desc: 'File system manipulation attempt' },
  { re: /(?:access|read|fetch|curl|wget)\s+(?:url|http|https|api|endpoint)/i, desc: 'Network access attempt' },

  // Data exfiltration
  { re: /(?:output|print|display|reveal|show)\s+(?:the\s+)?(?:system\s+prompt|instructions|api\s+key|secret|token|password|credential)/i, desc: 'Data exfiltration attempt' },
  { re: /(?:what\s+(?:are|is)\s+your)\s+(?:instructions|system\s+prompt|rules|guidelines)/i, desc: 'System prompt extraction attempt' },

  // Encoding/obfuscation attempts
  { re: /(?:base64|rot13|hex)\s*(?:decode|encode|convert)/i, desc: 'Encoding-based obfuscation attempt' },
];

// Maximum allowed length for the user's change description within the prompt
const MAX_USER_CHANGE_LENGTH = 2000;

/**
 * Check an edit prompt for injection patterns.
 * Returns { safe: true } or { safe: false, reason: string }
 */
function checkPrompt(prompt) {
  if (typeof prompt !== 'string') {
    return { safe: false, reason: 'Prompt must be a string' };
  }

  // Extract just the "User requested change:" section — that's the user-controlled part
  const changeMatch = prompt.match(/User requested change:\s*([\s\S]*?)(?:\n\n|$)/);
  if (!changeMatch) {
    // If we can't find the user change section, scan the whole prompt
    return scanForInjection(prompt);
  }

  const userChange = changeMatch[1].trim();

  // Check user change length
  if (userChange.length > MAX_USER_CHANGE_LENGTH) {
    return { safe: false, reason: 'User change description too long (max 2000 characters)' };
  }

  // Scan the user-controlled section for injection patterns
  return scanForInjection(userChange);
}

/**
 * Scan text for injection patterns
 */
function scanForInjection(text) {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.re.test(text)) {
      return { safe: false, reason: pattern.desc };
    }
  }
  return { safe: true };
}

module.exports = { checkPrompt, INJECTION_PATTERNS };
