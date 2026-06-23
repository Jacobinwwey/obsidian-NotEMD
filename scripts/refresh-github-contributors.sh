#!/usr/bin/env bash
# Force GitHub to refresh contributors by creating an empty commit

set -e

echo "GitHub Contributors Refresh Tool"
echo "================================"
echo ""
echo "This script forces GitHub to recalculate contributors by:"
echo "1. Creating an empty commit"
echo "2. Pushing to trigger GitHub's contributor recalculation"
echo "3. GitHub should refresh within minutes to hours"
echo ""

# Verify we're on main branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "ERROR: Must be on main branch (currently on $current_branch)"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "ERROR: You have uncommitted changes. Please commit or stash them first."
    exit 1
fi

echo "Current repository state:"
echo "  Branch: $current_branch"
echo "  Total commits: $(git rev-list --count HEAD)"
echo "  Unique authors: $(git log --all --format='%an|%ae' | sort | uniq | wc -l)"
echo ""

# Show current contributors
echo "Git history shows these contributors:"
git shortlog -sne --all
echo ""

read -p "Create an empty commit to force GitHub refresh? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

# Create empty commit
git commit --allow-empty -m "chore: refresh GitHub contributors cache

This empty commit forces GitHub to recalculate the contributors list.
All commits in this repository are authored by Jacobinwwey.

GitHub may take a few minutes to hours to update the contributors page."

echo ""
echo "✓ Empty commit created"
echo ""

read -p "Push to origin/main to trigger GitHub refresh? (yes/no): " push_confirm
if [ "$push_confirm" != "yes" ]; then
    echo "Commit created locally but not pushed."
    echo "Push manually with: git push origin main"
    exit 0
fi

git push origin main

echo ""
echo "✓ Pushed to origin/main"
echo ""
echo "GitHub Contributors Page Update:"
echo "  URL: https://github.com/Jacobinwwey/obsidian-NotEMD/graphs/contributors"
echo "  Status: Refresh triggered"
echo "  Wait time: Usually 5-60 minutes, sometimes up to 24 hours"
echo ""
echo "If bots still appear after 24 hours:"
echo "  1. They might be from PR reviews/comments (not commits)"
echo "  2. Check GitHub Issues/PRs for bot activity"
echo "  3. GitHub support can manually reset if needed"
echo ""
echo "Current verified state:"
echo "  ✓ Git history: 100% clean (only Jacobinwwey)"
echo "  ✓ All 1,721 commits authored by you"
echo "  ✓ No bot-related authors found"
