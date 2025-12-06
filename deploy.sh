#!/bin/bash
set -e

# YuklaBot NestJS Deployment Script
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR"

echo "🚀 YuklaBot NestJS Deployment"
echo "=============================="
echo ""

echo "🛑 Stopping existing containers..."
docker compose down || true

echo "📥 Resetting local changes and pulling origin/main..."
git reset --hard
git fetch origin
git checkout main
git pull origin main

# Ensure cookies file exists and has correct permissions for container
if [ -f "./cookies.txt" ]; then
  echo "✅ cookies.txt found, setting ownership and permissions"
  # UID 1001 matches the nodejs user in the container
  chown 1001:1001 ./cookies.txt || true
  chmod 666 ./cookies.txt || true
else
  echo "⚠️  Warning: cookies.txt not found. YouTube downloads may require authentication."
fi

# Check .env file
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please create .env file with required variables:"
    exit 1
fi

echo "🔨 Building containers (no cache)..."
docker compose build --pull --no-cache

echo "🚀 Starting containers..."
docker compose up -d --remove-orphans

echo ""
echo "✅ Deployment complete!"
echo ""
