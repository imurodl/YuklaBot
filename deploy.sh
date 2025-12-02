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

echo "Building and starting containers..."
docker compose build --pull
docker compose up -d --remove-orphans

echo "Deployment complete. Showing logs from the yuklabot container (last 50 lines):"
docker compose logs --no-log-prefix --tail=50 yuklabot
