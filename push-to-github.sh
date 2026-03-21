#!/bin/bash
# Run this once you have a GitHub repo ready
# Usage: ./push-to-github.sh https://github.com/YOUR_USERNAME/mythwright.git

REMOTE=$1
if [ -z "$REMOTE" ]; then
  echo "Usage: ./push-to-github.sh <remote-url>"
  exit 1
fi
git remote add origin $REMOTE
git push -u origin main
git push -u origin dev
echo "✓ Pushed to $REMOTE"
