#!/usr/bin/env bash
# Delete all remote branches except main to force GitHub contributor refresh

set -e

echo "=============================================="
echo "  DELETE ALL REMOTE BRANCHES EXCEPT MAIN"
echo "=============================================="
echo ""
echo "This will DELETE all remote branches except 'main'."
echo "This forces GitHub to recalculate contributors based ONLY on main."
echo ""
echo "⚠️  WARNING: This deletes branches on GitHub!"
echo ""

# List branches to be deleted
echo "Remote branches (excluding main):"
git for-each-ref --format='%(refname:short)' refs/remotes/origin/ | grep -v 'origin/main' | grep -v 'origin/HEAD' | sed 's/origin\///' | while read branch; do
    echo "  - $branch"
done

echo ""
read -p "Delete all these branches from GitHub? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Deleting remote branches..."
echo ""

# Delete each branch
git for-each-ref --format='%(refname:short)' refs/remotes/origin/ | grep -v 'origin/main' | grep -v 'origin/HEAD' | sed 's/origin\///' | while read branch; do
    echo "Deleting: $branch"
    git push origin --delete "$branch" 2>&1 || echo "  ⚠️  Failed (might be already deleted or protected)"
done

echo ""
echo "✓ Remote branches deleted"
echo ""

# Prune local references
git fetch --prune

echo "✓ Local references pruned"
echo ""

# Create refresh commit
git commit --allow-empty -m "chore: deleted all branches except main to refresh contributors

Only main branch remains. GitHub contributors should now show only
commits from main branch.

All feature branches have been removed to force contributor recalculation."

git push origin main

echo ""
echo "=============================================="
echo "  BRANCH DELETION COMPLETE"
echo "=============================================="
echo ""
echo "Remaining branches:"
git branch -r
echo ""
echo "GitHub should recalculate contributors within 5-60 minutes."
echo "Check: https://github.com/Jacobinwwey/obsidian-NotEMD/graphs/contributors"
