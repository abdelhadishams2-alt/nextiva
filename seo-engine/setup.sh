#!/bin/bash
# ============================================================
# Article Engine — One-Time Setup
# ============================================================
# Run this once after copying the skill to a new machine.
# Requires: Node.js (for npx)
#
# Usage:
#   bash .claude/plugins/article-engine/setup.sh
#
# Note: On Windows, run this from Git Bash or WSL.
#       The plugin's Step 0 setup gate handles configuration
#       interactively for all platforms including Windows.
# ============================================================

set -e

CLAUDE_JSON="$HOME/.claude.json"

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║   Article Engine — Full Setup            ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "  ✗ Node.js not found. Install it from https://nodejs.org"
  exit 1
fi
echo "  ✓ Node.js found: $(node -v)"

# ── Claude CLI (required for automatic section editing) ──
echo ""
echo "  ── Claude CLI ──"
if command -v claude &> /dev/null; then
  echo "  ✓ Claude CLI found: $(claude --version 2>/dev/null || echo 'installed')"
else
  echo "  ↓ Installing Claude CLI for automatic section editing..."
  if npm install -g @anthropic-ai/claude-code 2>/dev/null; then
    echo "  ✓ Claude CLI installed"
  elif command -v sudo &> /dev/null && sudo npm install -g @anthropic-ai/claude-code 2>/dev/null; then
    echo "  ✓ Claude CLI installed (with sudo)"
  else
    echo "  ⚠ Claude CLI install failed (you may need admin/sudo permissions)."
    echo "    Try manually: sudo npm install -g @anthropic-ai/claude-code"
    echo "    Section editing will use clipboard fallback until installed."
  fi
fi

# Get API key (always interactive — never pass as argument to avoid ps exposure)
echo ""
echo "  Get a free Gemini API key from:"
echo "  → https://aistudio.google.com/apikey"
echo ""
read -p "  Paste your Gemini API key: " API_KEY

if [ -z "$API_KEY" ]; then
  echo "  ✗ No API key provided. Aborting."
  exit 1
fi

# Add to ~/.claude.json — pass key via env to avoid shell injection
if GEMINI_KEY="$API_KEY" CLAUDE_CFG="$CLAUDE_JSON" node -e '
  const fs = require("fs");
  const key = process.env.GEMINI_KEY;
  const cfgPath = process.env.CLAUDE_CFG;
  let d = {};
  if (fs.existsSync(cfgPath)) {
    try { d = JSON.parse(fs.readFileSync(cfgPath, "utf8")); }
    catch (e) { console.log("  ⚠ Existing ~/.claude.json has invalid JSON — overwriting"); d = {}; }
    if (d.mcpServers && d.mcpServers.gemini) {
      console.log("  ⚠ Gemini MCP already configured — updating API key");
    }
  }
  d.mcpServers = d.mcpServers || {};
  d.mcpServers.gemini = {
    command: "npx",
    args: ["-y", "@rlabs-inc/gemini-mcp"],
    env: { GEMINI_API_KEY: key }
  };
  fs.writeFileSync(cfgPath, JSON.stringify(d, null, 2));
  console.log("  ✓ Gemini MCP added to ~/.claude.json");
'; then
  true
else
  echo "  ✗ Failed to update ~/.claude.json. Check Node.js and file permissions."
  exit 1
fi

# Pre-download the package
echo "  ↓ Pre-downloading Gemini MCP package..."
if npx -y @rlabs-inc/gemini-mcp --help >/dev/null 2>&1; then
  echo "  ✓ Package cached"
else
  echo "  ⚠ Package pre-download failed. Gemini MCP will download on first use."
  echo "    If this persists, check your internet connection or npm registry access."
fi

# ── Auth System (pre-configured, no user action needed) ──
echo ""
echo "  ── Auth System ──"
echo "  ✓ Authentication pre-configured (sign up via article edit panel)"

echo ""
echo "  ══════════════════════════════════════════"
echo "  ✓ Setup complete!"
echo "  "
echo "  Restart Claude Code, then say:"
echo "  \"write an article about [any topic]\""
echo "  "
echo "  Free tier: 4 articles/day, editing requires login."
echo "  ══════════════════════════════════════════"
echo ""
