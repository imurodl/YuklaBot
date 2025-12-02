#!/bin/bash

# Vidzilla Bot Startup Script

echo "🤖 Starting Vidzilla Bot..."
echo ""

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate venv
echo "Activating virtual environment..."
source venv/bin/activate

# Check if dependencies are installed
if ! python -c "import aiogram" 2>/dev/null; then
    echo "📦 Installing dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    echo "✅ Dependencies installed"
fi

# Check .env file
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please create .env file with your BOT_TOKEN"
    exit 1
fi

# Start bot
echo ""
echo "🚀 Starting bot in POLLING mode..."
echo "Press Ctrl+C to stop"
echo ""
python3 bot.py
