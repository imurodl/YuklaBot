# YuklaBot 🤖

**Simple bot for downloading videos from social media - Built with NestJS**

> Based on [Vidzilla](https://github.com/zerox9dev/Vidzilla) - Rebuilt in NestJS for better performance

## What can the bot do?

- Downloads videos from 8+ popular platforms
- **Choose your preferred quality** before downloading
- Audio-only extraction option
- Support for 2GB files (with Local Bot API)
- No download limits
- No payments or subscriptions required
- Simple and clean interface
- Built with TypeScript & NestJS

## Supported platforms:

YouTube • Instagram • TikTok • Facebook • Twitter • Pinterest • Reddit • Vimeo

---

## How to use?

1. **Find a video link** on any supported platform
2. **Send the link to the bot** in Telegram
3. **Select quality:**
   - 🎵 Audio Only
   - 📹 Low Quality (smaller file)
   - 📹 Medium Quality
   - 📹 High Quality (best resolution)
4. **Get your video** instantly!

That's it! 😊

## Bot commands:

/start - Start using the bot
/help - Get help information

---

## For developers

### Prerequisites

- **Node.js 18+** and npm
- **yt-dlp** (for video downloads)
- **ffmpeg** (for video processing)
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/imurodl/yuklaBot.git
   cd yuklaBot
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Install yt-dlp:**

   ```bash
   # macOS
   brew install yt-dlp

   # Ubuntu/Debian
   sudo apt install yt-dlp

   # or via pip
   pip3 install yt-dlp
   ```

4. **Install ffmpeg:**

   ```bash
   # macOS
   brew install ffmpeg

   # Ubuntu/Debian
   sudo apt install ffmpeg
   ```

5. **Create .env file:**

   ```bash
   BOT_TOKEN=your_bot_token_here
   PORT=8000
   YTDLP_COOKIES=./cookies.txt
   ```

6. **Run the bot:**

   ```bash
   # Development mode
   npm run start:dev

   # Production mode
   npm run build
   npm run start:prod

   # Or use the startup script
   ./start.sh
   ```

### Docker Deployment

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f yuklabot

# Stop
docker-compose down
```

### Environment Variables

| Variable            | Description                                     | Default                      |
| ------------------- | ----------------------------------------------- | ---------------------------- |
| `BOT_TOKEN`         | Telegram Bot Token (required)                   | -                            |
| `PORT`              | Application port                                | 8000                         |
| `WEBHOOK_PATH`      | Webhook path (for production)                   | -                            |
| `WEBHOOK_URL`       | Webhook domain (for production)                 | -                            |
| `YTDLP_COOKIES`     | Path to cookies.txt for YouTube auth            | ./cookies.txt                |
| `TELEGRAM_API_ID`   | Telegram API ID (for Local Bot API)             | -                            |
| `TELEGRAM_API_HASH` | Telegram API Hash (for Local Bot API)           | -                            |
| `LOCAL_BOT_API_URL` | Local Bot API URL (for 2GB file support)        | http://telegram-bot-api:8081 |
| `MONGODB_URI`       | MongoDB connection string (optional)            | -                            |
| `ADMIN_IDS`         | Comma-separated list of admin Telegram user IDs | -                            |

### Local Bot API Setup (2GB File Support)

By default, Telegram bots can only send files up to 50MB. To enable **2GB file support**, you need to set up a Local Bot API server.

#### Step 1: Get Telegram API Credentials

1. Go to https://my.telegram.org/auth
2. Log in with your phone number
3. Navigate to "API development tools"
4. Create a new application (or use existing)
5. Copy your `api_id` and `api_hash`

#### Step 2: Configure Environment Variables

Add to your `.env` file:

```env
TELEGRAM_API_ID=your_api_id_here
TELEGRAM_API_HASH=your_api_hash_here
```

#### Step 3: Deploy with Local Bot API

The `telegram-bot-api` service will automatically start when you have API credentials set:

```bash
docker-compose up -d
```

#### Step 4: Logout Bot from Official Server

After starting the Local Bot API, you need to logout your bot from Telegram's official servers:

```bash
# Get your bot token
TOKEN="your_bot_token_here"

# Logout from official servers
curl "https://api.telegram.org/bot${TOKEN}/logOut"

# Verify local API is working
docker-compose logs telegram-bot-api
```

**Important Notes:**

- Once you logout from official servers, your bot will ONLY work through the Local Bot API
- Make sure the Local Bot API container is always running
- The bot can now send files up to 2GB
- File size limit automatically changes from 50MB → 2GB when Local Bot API is enabled

#### Reverting to Official API

If you want to go back to the official API:

1. Remove `TELEGRAM_API_ID` and `TELEGRAM_API_HASH` from `.env`
2. Stop the Local Bot API: `docker-compose stop telegram-bot-api`
3. The bot will automatically reconnect to official Telegram servers on next restart

## Architecture

Built with modern NestJS architecture:

```
src/
├── components/
│   ├── bot/          # Telegram bot handlers
│   ├── video/        # Video orchestration
│   ├── quality/      # Quality parsing & info extraction
│   ├── download/     # Video download service
│   └── upload/       # Telegram file upload service
└── libs/
    ├── config.ts     # Configuration
    ├── enums/        # Messages & constants
    └── utils/        # Utility functions
```

## New Features (NestJS Version)

- ✨ **NestJS Framework** - Modern, scalable architecture
- 🚀 **Better Performance** - Faster downloads and processing
- 📦 **Modular Design** - Easy to extend and maintain
- 🎯 **TypeScript** - Type safety and better DX
- 🔄 **Streaming Support** - Ready for Local Bot API integration
- 🎵 **Audio Extraction** - Download audio-only from videos
- 📊 **File Size Display** - See file sizes when available
- 🌐 **Webhook Ready** - Production deployment support

## Roadmap

- [ ] Local Bot API integration (2GB file support)
- [ ] MongoDB user tracking
- [ ] Admin panel
- [ ] Rate limiting
- [ ] Queue system for heavy load
- [ ] Quality control pipeline
- [ ] Multi-language support

## Credits

This project is based on [Vidzilla](https://github.com/zerox9dev/Vidzilla) by [@zerox9dev](https://github.com/zerox9dev)

## License

MIT License - see [LICENSE](LICENSE) file
