#!/usr/bin/env bash
# Script to clean bot-related commits from history
# WARNING: This rewrites git history. Use with caution!

set -e

echo "Bot Commit Cleaner"
echo "=================="
echo ""
echo "This script will scan for and clean commits with bot-related authorship."
echo "WARNING: This rewrites git history!"
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "ERROR: Not in a git repository"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "ERROR: You have uncommitted changes. Please commit or stash them first."
    exit 1
fi

# Function to check if a commit has bot-related author
is_bot_commit() {
    local commit="$1"
    local author_name=$(git log -1 --format='%an' "$commit")
    local author_email=$(git log -1 --format='%ae' "$commit")

    if echo "$author_name" | grep -iE "(claude|bot|assistant|AI)" > /dev/null; then
        return 0
    fi

    if echo "$author_email" | grep -iE "(claude|bot|anthropic|ai-assistant)" > /dev/null; then
        return 0
    fi

    return 1
}

# Scan recent commits for bot authorship
echo "Scanning last 50 commits for bot-related authorship..."
echo ""

bot_commits=()
for commit in $(git log --format='%H' -n 50); do
    if is_bot_commit "$commit"; then
        author=$(git log -1 --format='%an <%ae>' "$commit")
        subject=$(git log -1 --format='%s' "$commit")
        bot_commits+=("$commit")
        echo "  🤖 $commit - $author"
        echo "     $subject"
        echo ""
    fi
done

if [ ${#bot_commits[@]} -eq 0 ]; then
    echo "✓ No bot-related commits found in recent history."
    exit 0
fi

echo ""
echo "Found ${#bot_commits[@]} bot-related commit(s)."
echo ""
read -p "Do you want to clean these commits? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
read -p "Enter your real name for re-authoring: " real_name
read -p "Enter your real email for re-authoring: " real_email

if [ -z "$real_name" ] || [ -z "$real_email" ]; then
    echo "ERROR: Name and email are required."
    exit 1
fi

echo ""
echo "Re-authoring bot commits to: $real_name <$real_email>"
echo ""

# Create a backup branch
backup_branch="backup-before-bot-clean-$(date +%Y%m%d-%H%M%S)"
git branch "$backup_branch"
echo "✓ Created backup branch: $backup_branch"
echo ""

# Use filter-branch to rewrite commits
git filter-branch --force --env-filter "
if echo \"\$GIT_AUTHOR_NAME\" | grep -iE '(claude|bot|assistant|AI)' > /dev/null || \
   echo \"\$GIT_AUTHOR_EMAIL\" | grep -iE '(claude|bot|anthropic|ai-assistant)' > /dev/null; then
    export GIT_AUTHOR_NAME='$real_name'
    export GIT_AUTHOR_EMAIL='$real_email'
    export GIT_COMMITTER_NAME='$real_name'
    export GIT_COMMITTER_EMAIL='$real_email'
fi
" --tag-name-filter cat -- --all

echo ""
echo "✓ Bot commits cleaned and re-authored."
echo ""
echo "Backup branch: $backup_branch"
echo ""
echo "Next steps:"
echo "  1. Review the changes: git log --oneline -20"
echo "  2. If satisfied, force push: git push --force-with-lease origin main"
echo "  3. To restore backup: git reset --hard $backup_branch"
echo ""
echo "⚠️  WARNING: After force pushing, all collaborators must re-clone or reset their repos."
