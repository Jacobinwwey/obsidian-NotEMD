# Git Author Hygiene

## Overview

This project maintains strict git author hygiene to ensure commit history reflects human authorship only. Bot-related authorship is automatically blocked by git hooks.

## Git Hooks

### pre-commit Hook
Validates git author configuration before allowing commits:
- Blocks commits if `user.name` contains bot-related terms (claude, bot, assistant, AI)
- Blocks commits if `user.email` contains bot-related terms
- Ensures author name and email are configured

**Location:** `.git/hooks/pre-commit`

### commit-msg Hook
Validates commit messages before accepting them:
- Blocks commit messages containing bot-related references
- Prevents accidental mentions in commit descriptions

**Location:** `.git/hooks/commit-msg`

## Helper Scripts

### Verify Author Configuration
```bash
./scripts/verify-author.sh
```
Checks your current git configuration and reports any issues.

### Clean Bot Commits from History
```bash
./scripts/clean-bot-commits.sh
```
**WARNING:** Rewrites git history!

This script:
1. Scans last 50 commits for bot-related authorship
2. Creates a backup branch
3. Re-authors bot commits with your real name/email
4. Requires manual force push after review

**Use only when you need to clean up existing history.**

## Setting Correct Author Info

### For This Repository Only
```bash
git config user.name "Your Real Name"
git config user.email "your.email@example.com"
```

### Globally (All Repositories)
```bash
git config --global user.name "Your Real Name"
git config --global user.email "your.email@example.com"
```

## Verification Before Pushing

Always verify your commits before pushing:

```bash
# Check last 5 commits
git log --format="%h %an <%ae> - %s" -5

# Verify author configuration
./scripts/verify-author.sh
```

## GitHub Pull Request Protection

GitHub will show the commit author based on git metadata. The hooks ensure:
- PR commits always have proper human authorship
- No bot-related names appear in commit history
- GitHub profile links work correctly (when email matches GitHub account)

## Troubleshooting

### Hook Not Running
```bash
# Ensure hooks are executable
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/commit-msg

# Verify hook location
ls -la .git/hooks/
```

### Bypassing Hooks (NOT RECOMMENDED)
If you absolutely must bypass for testing:
```bash
git commit --no-verify -m "message"
```

**Do not push commits created with `--no-verify` to main branch!**

### Cleaning Up After Bot Commits

If bot commits were already pushed:

1. **Run cleanup script:**
   ```bash
   ./scripts/clean-bot-commits.sh
   ```

2. **Review changes:**
   ```bash
   git log --oneline -20
   ```

3. **Force push (coordinate with team first!):**
   ```bash
   git push --force-with-lease origin main
   ```

4. **Notify collaborators to reset:**
   ```bash
   git fetch origin
   git reset --hard origin/main
   ```

## Hook Installation for New Contributors

Hooks are not automatically distributed via git clone. New contributors should:

1. Clone repository
2. Verify hooks exist:
   ```bash
   ls -la .git/hooks/pre-commit .git/hooks/commit-msg
   ```
3. If missing, copy from project root (if stored) or recreate from this doc
4. Make executable:
   ```bash
   chmod +x .git/hooks/pre-commit
   chmod +x .git/hooks/commit-msg
   ```

## Best Practices

1. **Always set author info first** before making any commits
2. **Run `./scripts/verify-author.sh`** before starting work
3. **Review commits** before pushing: `git log -5`
4. **Never use `--no-verify`** for commits going to main
5. **Coordinate history rewrites** with team before force pushing

## Related

- [Release Workflow](./release-workflow.md) - Ensures releases have proper authorship
- [CLI Capability Matrix](./notemd-cli-capability-matrix.md) - Documents maintainer tools
