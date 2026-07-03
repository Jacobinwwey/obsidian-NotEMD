# Git Author Hygiene Protection

## Quick Start

```bash
# Verify your configuration is correct
./scripts/verify-author.sh

# Check recent commits for bot authorship
git log --format="%h %an <%ae> - %s" -10
```

## What's Protected

✅ **Pre-commit Hook** - Blocks commits with bot-related author names/emails  
✅ **Commit-msg Hook** - Blocks commit messages mentioning bots  
✅ **CI Verification** - GitHub Actions checks last 10 commits  
✅ **Cleanup Script** - Rewrites history to remove bot commits  

## Files Created

```
.git/hooks/
├── pre-commit           # Validates author before commit
└── commit-msg           # Validates commit message

scripts/
├── verify-author.sh          # Check your git config
├── clean-bot-commits.sh      # Remove bot commits from history
└── ci-verify-authorship.sh   # CI validation

docs/maintainer/
└── git-author-hygiene.md     # Full documentation
```

## Common Workflows

### Daily Development

```bash
# Before starting work
./scripts/verify-author.sh

# Make changes
git add .
git commit -m "Your commit message"
# ✓ Pre-commit hook validates author
# ✓ Commit-msg hook validates message

git push origin main
# ✓ CI validates no bot commits in history
```

### Cleaning Existing Bot Commits

```bash
# Scan and clean
./scripts/clean-bot-commits.sh

# Review changes
git log --oneline -20

# Force push (coordinate with team!)
git push --force-with-lease origin main
```

### If Hook Blocks Your Commit

```bash
# Check what's wrong
./scripts/verify-author.sh

# Fix your configuration
git config user.name "Your Real Name"
git config user.email "your.email@example.com"

# Try again
git commit -m "Your message"
```

## What Gets Blocked

### ❌ Bot-related author names:
- Claude
- Claude Code
- Bot
- Assistant
- AI Assistant
- *Any variation with these terms*

### ❌ Bot-related emails:
- *@anthropic.com
- *@claude.ai
- Contains: bot, ai-assistant, claude

### ❌ Commit messages mentioning:
- Claude
- Claude Code
- Anthropic
- AI assistant
- Bot

## Emergency Bypass (Not Recommended)

```bash
# Only for testing/debugging
git commit --no-verify -m "message"

# DO NOT push these commits to main!
```

## Testing the Hooks

```bash
# Test pre-commit (should pass)
./scripts/verify-author.sh

# Test by trying bad config (should fail)
git config user.name "Claude Bot"
git commit -m "test"  # Will be blocked

# Restore good config
git config user.name "Your Real Name"
```

## Troubleshooting

**Hook not running?**
```bash
ls -la .git/hooks/pre-commit .git/hooks/commit-msg
# Should show executable permissions (-rwxr-xr-x)

chmod +x .git/hooks/pre-commit .git/hooks/commit-msg
```

**Need to clean history?**
```bash
./scripts/clean-bot-commits.sh
# Follow the interactive prompts
```

**CI failing on authorship check?**
```bash
# Check what CI sees
./scripts/ci-verify-authorship.sh
```

## For New Contributors

After cloning, hooks may need to be reinstalled:

```bash
# Check if hooks exist
ls -la .git/hooks/pre-commit .git/hooks/commit-msg

# If missing, they should be tracked in a different way
# or recreate from docs/maintainer/git-author-hygiene.md
```

## See Also

- [Full Documentation](./docs/maintainer/git-author-hygiene.md)
- [Release Workflow](./docs/maintainer/release-workflow.md)
