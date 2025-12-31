#!/bin/bash
# Script to connect local repo to GitHub
# Usage: ./setup-github.sh YOUR_GITHUB_USERNAME REPO_NAME

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: ./setup-github.sh YOUR_GITHUB_USERNAME REPO_NAME"
    echo "Example: ./setup-github.sh jdwd40 footfive-front"
    exit 1
fi

USERNAME=$1
REPO_NAME=$2

echo "Setting up GitHub remote..."
git remote add origin https://github.com/${USERNAME}/${REPO_NAME}.git 2>/dev/null || \
git remote set-url origin https://github.com/${USERNAME}/${REPO_NAME}.git

echo "Pushing to GitHub..."
git push -u origin main

echo "Done! Your repo is now at: https://github.com/${USERNAME}/${REPO_NAME}"

