#!/usr/bin/env bash
# Verify git author configuration before committing

set -e

author_name=$(git config user.name)
author_email=$(git config user.email)

echo "Git Author Verification"
echo "======================="
echo ""
echo "Current configuration:"
echo "  Name:  $author_name"
echo "  Email: $author_email"
echo ""

# Check for bot-related patterns
issues=()

if echo "$author_name" | grep -iE "(claude|bot|assistant|AI)" > /dev/null; then
    issues+=("❌ Author name contains bot-related terms")
fi

if echo "$author_email" | grep -iE "(claude|bot|anthropic|ai-assistant)" > /dev/null; then
    issues+=("❌ Author email contains bot-related terms")
fi

if [ -z "$author_name" ]; then
    issues+=("❌ Author name is not set")
fi

if [ -z "$author_email" ]; then
    issues+=("❌ Author email is not set")
fi

if [ ${#issues[@]} -gt 0 ]; then
    echo "Issues found:"
    for issue in "${issues[@]}"; do
        echo "  $issue"
    done
    echo ""
    echo "Fix with:"
    echo "  git config user.name 'Your Real Name'"
    echo "  git config user.email 'your.email@example.com'"
    echo ""
    echo "Or set globally:"
    echo "  git config --global user.name 'Your Real Name'"
    echo "  git config --global user.email 'your.email@example.com'"
    exit 1
else
    echo "✓ Author configuration looks good!"
    exit 0
fi
