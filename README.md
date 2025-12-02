# YuklaBot 🤖

**Simple bot for downloading videos from social media**

> Based on [Vidzilla](https://github.com/zerox9dev/Vidzilla) - Enhanced with quality selection features

## What can the bot do?

- Downloads videos from 8 popular platforms
- **Choose your preferred quality** before downloading
- Audio-only extraction option
- No download limits
- No payments or subscriptions required
- Simple and clean interface

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
   - � High Quality (best resolution)
4. **Get your video** instantly!

That's it! 😊

## Bot commands:
/start - Start using the bot

## For developers

If you want to run the bot yourself:

1. **Install Python 3.10+** (Python 3.9 or lower not supported)
2. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/yuklaBot.git
   cd yuklaBot
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create .env file** with your bot token and MongoDB settings (see `.env.example`)
   
5. **Run the bot:**
   ```bash
   ./start.sh
   # or manually:
   python3 bot.py
   ```

## New Features (vs Vidzilla)

- ✨ **Quality Selection Menu** - Choose video quality before downloading
- 🎵 **Audio Extraction** - Download audio-only from videos
- 🚀 **Optimized Performance** - Faster downloads and better error handling
- 📊 **File Size Display** - See file sizes when available

## Credits

This project is based on [Vidzilla](https://github.com/zerox9dev/Vidzilla) by [@zerox9dev](https://github.com/zerox9dev)

## License

MIT License - see [LICENSE](LICENSE) file
