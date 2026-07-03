# GitHub Support Request Template

**Use this template to request manual contributor cache reset from GitHub Support**

---

## Subject
Contributor cache showing deleted user after branch cleanup - Manual reset requested

---

## Repository
https://github.com/Jacobinwwey/obsidian-NotEMD

---

## Issue Description

The repository Contributors page is showing a user "claude" with 1,687 commits, but this user does not exist in the current git history.

**Contributors page:** https://github.com/Jacobinwwey/obsidian-NotEMD/graphs/contributors

**Current display:**
- Jacobinwwey: 3,192 commits ✓ (correct)
- claude: 1,687 commits ✗ (should not exist)

---

## Evidence

### 1. Local Git Repository Verification
```bash
$ git shortlog -sne --all
  1722 Jacobinwwey <jacob.hxx.cn@outlook.com>

$ git log --all --format='%an' | grep -i claude
(no results)
```

**Result:** Zero commits by "claude" in git history.

### 2. GitHub API Verification
```bash
$ curl -s "https://api.github.com/repos/Jacobinwwey/obsidian-NotEMD/contributors"
[
  {
    "login": "Jacobinwwey",
    "contributions": 691,
    "type": "User"
  }
]
```

**Result:** API correctly shows only Jacobinwwey as contributor.

### 3. Discrepancy
- **Git history (local):** No "claude" commits
- **GitHub API:** No "claude" contributor
- **GitHub Web UI:** Shows "claude" with 1,687 commits

**Conclusion:** Web UI is showing stale cached data.

---

## Actions Already Taken

### 1. Deleted All Feature Branches
```
Deleted on 2026-06-23:
- origin/add-LMCG
- origin/docs/readme-i18n-complete
- origin/feat/add-mermaid-feature-readme
- origin/feat/slide-export
- origin/feature/project-analysis-and-improvements
- origin/geo/phase2-fixes
- origin/prompt

Remaining: origin/main only
```

### 2. Force Pushed Cache Refresh Commits
```
Commit fd515de: "chore: force GitHub contributor cache rebuild after branch deletion"
Commit 7f144ec: "chore: refresh GitHub contributors cache"

Date: 2026-06-23
```

### 3. Verified Current State
```
Remote branches: main only
Local git commits: 1,722 (all by Jacobinwwey)
Bot commits in history: 0
```

---

## Root Cause Analysis

**Hypothesis:** The "claude" contributor is from deleted feature branches that contained bot commits (likely `google-labs-jules[bot]`), and GitHub's contributor cache has not yet cleared this data.

**Timeline:**
- Feature branches with bot commits existed previously
- Branches were deleted on 2026-06-23
- GitHub caches deleted branch contributors for up to 90 days
- Web UI still shows old cached data

---

## Request

**Please manually reset the contributor cache for this repository.**

The current contributor list should show:
- **Only Jacobinwwey** (verified in git history and API)

The following should be removed:
- **claude** (does not exist in current git history)

---

## Supporting Documentation

Full analysis available in repository:
https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/docs/archive/root-history/ROOT_CAUSE_CLAUDE_CONTRIBUTOR.md

---

## Contact Information

**Repository Owner:** Jacobinwwey  
**Email:** jacob.hxx.cn@outlook.com  
**Issue Date:** 2026-06-23  
**Priority:** Normal (cosmetic issue, not affecting functionality)

---

## Additional Context

- This is not a security issue - no unauthorized commits exist
- Git history is verified clean
- API shows correct data
- Only the web UI Contributors page has stale cache
- Would like this resolved for accurate project attribution

---

**Thank you for your assistance!**

---

## How to Submit This

1. Go to: https://support.github.com/contact
2. Select: **Account and Profile**
3. Category: **Repository settings**
4. Copy-paste this template into the message
5. Attach screenshots:
   - Contributors page showing "claude"
   - Terminal output showing `git shortlog` (only Jacobinwwey)
   - API response (only Jacobinwwey)

**Expected Response Time:** 1-3 business days
