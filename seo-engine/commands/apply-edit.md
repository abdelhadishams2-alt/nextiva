---
name: apply-edit
description: Apply a section edit from clipboard. Fallback for when the bridge server is not running — use after clicking "Apply Edit" on an article's edit UI.
---

# Apply Section Edit from Clipboard

This is the fallback command for when the bridge server is not running. The bridge server (started via `/start-bridge`) handles edits automatically. Use this command only if the bridge is not active.

## Step 1 — Read clipboard

Read the clipboard content. On Windows use: `powershell -command "Get-Clipboard"` (works with both PowerShell 5.x and 7+). On macOS use: `pbpaste`. On Linux use: `xclip -selection clipboard -o`.

## Step 2 — Validate

Check that the clipboard content:
1. Contains `SECTION_EDIT:`
2. Contains `Article file:` with a filename
3. Contains `Section ID:` with a valid section ID
4. Contains `User requested change:` with actual content

If invalid:
- Tell the user: "No edit request found on clipboard. Open your article in the browser, click Edit on a section, type your changes, and click Apply Edit — then run /apply-edit again."
- Stop.

## Step 3 — Process the edit

Process the edit using the autonomous-article-engine skill's Section Edit Mode:

1. Parse the SECTION_EDIT prompt — extract: article file path, section ID, section type, section role, section purpose, section heading, topic, and user edit instruction
2. Read the target article HTML file
3. Locate the target section by its `data-section-id`
4. Read surrounding sections for context
5. Rewrite the section following the edit rules:
   - Preserve topic domain integrity
   - Preserve page style and component compatibility
   - Improve the section intelligently and professionally
   - Keep the result aligned with the rest of the article
   - If the edit affects a heading, update both sidebar and inline TOC entries
   - Maintain all section data attributes
6. Apply the edit using the Edit tool
7. Report completion

This is the same Section Edit Mode defined in the autonomous-article-engine skill. Follow all its rules exactly.
