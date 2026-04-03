# ChainIQ — Session Completion Checklist

> **Mandatory at every session boundary and before ending any conversation.**
> Takes 2-3 minutes. Skipping costs 30+ minutes next session.

---

## The 6-Step Checklist

### 1. Update STATUS.md

- [ ] Toggle completed task checkboxes
- [ ] Update orchestrator progress table
- [ ] Update "Current Phase" header
- **Path:** `dev_docs/STATUS.md`

### 2. Update handoff.md

- [ ] Set "Current Step" to where we stopped
- [ ] Fill "What Was Done This Session" with specifics (file counts, word counts)
- [ ] Set "What's Next" with the exact next step
- [ ] Update "Blockers" if any exist
- [ ] Update "Files to Read on Resume"
- **Path:** `dev_docs/handoff.md`

### 3. Append to DEVLOG.md

- [ ] Add timestamped entry: date, what was done, decisions made, files created/modified
- **Path:** `dev_docs/DEVLOG.md` (create if not exists)

### 4. Sync Master Tracker

- [ ] Update subtask status in `dev_docs/tracker/master-tracker.md`
- [ ] Mark completed subtasks, update blocked-by chains
- **Path:** `dev_docs/tracker/master-tracker.md`

### 5. Persist Session Context

- [ ] Save any context that would be lost if conversation ends
- [ ] Update `dev_docs/ARCH-ANCHOR.md` if architecture changed
- **Path:** `dev_docs/ARCH-ANCHOR.md` (only if architecture changed)

### 6. Echo the Golden Rule

> **"Every content team trusts ChainIQ to find the right topic, match the right voice, and publish content that ranks — without manual analysis or guesswork."**

Read this aloud before ending. Does the work done this session move us closer to this north star?

---

## Verification

After completing the checklist, verify:
- STATUS.md reflects current progress accurately
- handoff.md has enough detail for a cold resume
- No open work is undocumented
- ARCH-ANCHOR.md matches current architecture (if modified)
