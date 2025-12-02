#!/bin/bash
set -e

# Deployment script - pulls latest code and restarts docker compose
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR"

echo "Stopping and removing existing containers..."
docker compose down || true

echo "Resetting local changes and pulling origin/main..."
git reset --hard
git fetch origin
git checkout main
git pull origin main

# Ensure cookies file exists and secure permissions
if [ -f "./cookies.txt" ]; then
  echo "cookies.txt found, setting permissions to 600"
  chmod 600 ./cookies.txt || true
else
  echo "Warning: cookies.txt not found in repo root. If required, place it at ./cookies.txt"
fi

echo "Building and starting containers..."
docker compose build --pull --no-cache
docker compose up -d --remove-orphans
