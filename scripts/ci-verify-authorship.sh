#!/usr/bin/env bash
# GitHub Actions workflow helper to verify commit authorship

set -e

echo "Checking commit authorship in CI..."

# Check last 10 commits for bot-related authorship
bot_found=false

for commit in $(git log --format='%H' -n 10); do
    author_name=$(git log -1 --format='%an' "$commit")
    author_email=$(git log -1 --format='%ae' "$commit")

    if echo "$author_name" | grep -iE "(claude|bot|assistant|AI)" > /dev/null || \
       echo "$author_email" | grep -iE "(claude|bot|anthropic|ai-assistant)" > /dev/null; then
        echo "❌ Bot-related commit found:"
        echo "   Commit: $commit"
        echo "   Author: $author_name <$author_email>"
        git log -1 --format='   Subject: %s' "$commit"
        bot_found=true
    fi
done

if [ "$bot_found" = true ]; then
    echo ""
    echo "ERROR: Bot-related commits detected in recent history."
    echo "Please clean up using: ./scripts/clean-bot-commits.sh"
    exit 1
fi

echo "✓ All recent commits have proper human authorship."
exit 0
