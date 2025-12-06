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
   PORT=8002
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

| Variable            | Description                                 | Default       |
| ------------------- | ------------------------------------------- | ------------- |
| `BOT_TOKEN`         | Telegram Bot Token (required)               | -             |
| `PORT`              | Application port                            | 8002          |
| `YTDLP_COOKIES`     | Path to cookies.txt for YouTube auth        | ./cookies.txt |
| `LOCAL_BOT_API_URL` | Local Bot API URL (optional, for 2GB files) | -             |
| `MONGODB_URI`       | MongoDB connection string (optional)        | -             |

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
