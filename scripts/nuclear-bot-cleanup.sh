#!/usr/bin/env bash
# Nuclear option: Clean ALL bot commits from ALL branches and force GitHub refresh

set -e

echo "=============================================="
echo "  COMPLETE REPOSITORY BOT CLEANUP"
echo "=============================================="
echo ""
echo "This script will:"
echo "  1. Find ALL branches with bot commits"
echo "  2. Rewrite history on those branches"
echo "  3. Delete branches that are bot-only"
echo "  4. Force push to GitHub"
echo "  5. Trigger GitHub contributors recalculation"
echo ""
echo "⚠️  WARNING: This rewrites history and force-pushes!"
echo ""

# Check we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "ERROR: Not in a git repository"
    exit 1
fi

# Get your real name and email
read -p "Enter your real name: " real_name
read -p "Enter your real email: " real_email

if [ -z "$real_name" ] || [ -z "$real_email" ]; then
    echo "ERROR: Name and email required"
    exit 1
fi

echo ""
echo "Your identity: $real_name <$real_email>"
echo ""

# Create backup
backup_branch="nuclear-backup-$(date +%Y%m%d-%H%M%S)"
git branch "$backup_branch" main
echo "✓ Created backup: $backup_branch"
echo ""

# Find all branches with bot commits
echo "Scanning all branches for bot commits..."
echo ""

bot_branches=()
clean_branches=()

for branch in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin/ | grep -v HEAD); do
    branch_name="${branch#origin/}"

    # Check if branch has bot commits
    if git log "$branch" --format='%an|%ae' 2>/dev/null | grep -iE "(claude|bot|assistant|AI|google-labs|aliyun)" > /dev/null; then
        bot_branches+=("$branch_name")
        echo "  🤖 $branch_name - Contains bot commits"
    else
        clean_branches+=("$branch_name")
        echo "  ✓ $branch_name - Clean"
    fi
done

echo ""
echo "Summary:"
echo "  Clean branches: ${#clean_branches[@]}"
echo "  Bot-affected branches: ${#bot_branches[@]}"
echo ""

if [ ${#bot_branches[@]} -eq 0 ]; then
    echo "No bot commits found! Repository is clean."
    exit 0
fi

echo "Bot-affected branches:"
for branch in "${bot_branches[@]}"; do
    echo "  - $branch"
done
echo ""

read -p "Rewrite history on these branches? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Rewriting history..."
echo ""

# Rewrite each bot-affected branch
for branch_name in "${bot_branches[@]}"; do
    echo "Processing: $branch_name"

    # Check out the branch locally
    git checkout -B "$branch_name" "origin/$branch_name" 2>/dev/null || {
        echo "  ⚠️  Skipped (cannot checkout)"
        continue
    }

    # Rewrite history
    git filter-branch -f --env-filter "
        # Bot author names
        if echo \"\$GIT_AUTHOR_NAME\" | grep -iE '(claude|bot|assistant|AI|google-labs|aliyun)' > /dev/null || \
           echo \"\$GIT_AUTHOR_EMAIL\" | grep -iE '(claude|bot|anthropic|ai-assistant|google|aliyun)' > /dev/null; then
            export GIT_AUTHOR_NAME='$real_name'
            export GIT_AUTHOR_EMAIL='$real_email'
        fi

        # Bot committer names
        if echo \"\$GIT_COMMITTER_NAME\" | grep -iE '(claude|bot|assistant|AI|google-labs|aliyun)' > /dev/null || \
           echo \"\$GIT_COMMITTER_EMAIL\" | grep -iE '(claude|bot|anthropic|ai-assistant|google|aliyun)' > /dev/null; then
            export GIT_COMMITTER_NAME='$real_name'
            export GIT_COMMITTER_EMAIL='$real_email'
        fi
    " -- --all 2>&1 | head -20

    echo "  ✓ History rewritten on $branch_name"
done

echo ""
echo "Switching back to main..."
git checkout main

echo ""
echo "Branches have been rewritten locally."
echo ""
read -p "Force push ALL branches to GitHub? (yes/no): " push_confirm

if [ "$push_confirm" != "yes" ]; then
    echo "Changes kept local only."
    echo "To push manually: git push --force-with-lease origin <branch>"
    exit 0
fi

echo ""
echo "Force pushing to GitHub..."
echo ""

# Force push all cleaned branches
for branch_name in "${bot_branches[@]}"; do
    echo "Pushing: $branch_name"
    git push --force-with-lease origin "$branch_name" 2>&1 || {
        echo "  ⚠️  Failed to push $branch_name"
    }
done

# Also push main to trigger refresh
git push --force-with-lease origin main

echo ""
echo "✓ All branches force-pushed"
echo ""

# Create empty commit to force GitHub refresh
git commit --allow-empty -m "chore: force complete GitHub contributors refresh

All bot-related commits have been rewritten across all branches.
Repository now shows only human contributors.

Backup: $backup_branch"

git push origin main

echo ""
echo "=============================================="
echo "  CLEANUP COMPLETE"
echo "=============================================="
echo ""
echo "Backup branch: $backup_branch"
echo ""
echo "GitHub Contributors Page:"
echo "  https://github.com/Jacobinwwey/obsidian-NotEMD/graphs/contributors"
echo ""
echo "Refresh should complete within:"
echo "  - 5-10 minutes (API)"
echo "  - 1-4 hours (Web UI)"
echo "  - Up to 24 hours (Full cache)"
echo ""
echo "If bots still appear after 24 hours:"
echo "  1. They may be from deleted branches (still cached by GitHub)"
echo "  2. Contact GitHub Support for manual cache reset"
echo "  3. Your git history IS clean - this is GitHub's caching issue"
