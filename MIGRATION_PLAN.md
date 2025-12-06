# YuklaBot NestJS Migration Plan

## Overview

Rebuild YuklaBot in NestJS with Local Bot API for better performance and 2GB file limit.

**Status Update (Dec 6, 2024):**

- ✅ Python project files deleted
- ✅ Moved nest files to root
- ✅ Restructured to proper NestJS architecture
- ✅ Updated folder structure to NestJS conventions

## Phase 1: Setup (Day 1)

- [x] Create project plan
- [x] Create NestJS project structure
- [x] Initialize NestJS project
- [x] Restructure to proper NestJS conventions
- [ ] Set up Local Bot API server (Docker)
- [x] Configure environment variables
- [x] Set up basic bot connection

## Phase 2: Core Features (Day 2-3)

- [x] Bot module with nestjs-telegraf
- [x] Message handlers (start, help)
- [x] URL detection and platform identification
- [x] Video info extraction (yt-dlp wrapper)
- [x] Quality selection UI (inline keyboards)
- [x] Callback query handlers

## Phase 3: Download & Streaming (Day 3-4)

- [ ] Video download service
- [ ] Streaming implementation (source → Local Bot API)
- [ ] Audio extraction for audio-only option
- [ ] File size checking (2GB limit)
- [ ] Progress messages in Uzbek
- [ ] Error handling

## Phase 4: Advanced Features (Day 4-5)

- [ ] Cookie management for YouTube
- [ ] MongoDB integration (user tracking)
- [ ] Admin commands
- [ ] Webhook support
- [ ] Rate limiting
- [ ] Cleanup service (temp files)

## Phase 5: Testing & Deployment (Day 5-6)

- [ ] Local testing with test bot
- [ ] Deploy to VPS (port 8002)
- [ ] Update nginx for new upstream
- [ ] Parallel testing (both bots)
- [ ] Switch production traffic
- [ ] Monitor for 24 hours
- [ ] Delete Python code

## Architecture

**Current Structure (Updated):**

```
yuklaBot/                           # Root project (no more nest/ subfolder)
├── src/
│   ├── components/                 # Feature modules
│   │   ├── bot/
│   │   │   ├── bot.module.ts      ✓ Complete
│   │   │   └── bot.update.ts      ✓ Complete
│   │   ├── video/
│   │   │   ├── video.module.ts    ✓ Complete
│   │   │   ├── video.service.ts   ✓ Complete (basic)
│   │   │   └── quality.service.ts ✓ Complete
│   │   └── components.module.ts   ✓ Complete
│   ├── libs/                       # Shared libraries
│   │   ├── config.ts              ✓ Configuration
│   │   └── enums/
│   │       ├── messages.enum.ts   ✓ Uzbek messages
│   │       └── platforms.enum.ts  ✓ Platform identifiers
│   ├── app.module.ts              ✓
│   └── main.ts                    ✓
├── docker-compose.yml              # Includes Local Bot API
├── Dockerfile
├── .env                            ✓
├── cookies.txt                     ✓
└── package.json                    ✓
```

**Next to Add:**

```
src/
├── components/
│   ├── video/
│   │   ├── download.service.ts    ⏳ Phase 3
│   │   └── upload.service.ts      ⏳ Phase 3
│   └── telegram-api/              ⏳ Phase 3
│       ├── telegram-api.module.ts
│       └── telegram-api.service.ts
├── libs/
│   └── utils/                     ⏳ Phase 3
│       └── file.util.ts
```

## Technical Stack

### Dependencies

- `@nestjs/common`, `@nestjs/core` - Framework
- `nestjs-telegraf` - Telegram bot integration
- `telegraf` - Bot library
- `yt-dlp-wrap` - Video info extraction
- `@nestjs/mongoose` - MongoDB
- `form-data` - Multipart uploads to Local Bot API
- `axios` - HTTP client

### Infrastructure

- Local Bot API Server (Docker, port 8081)
- NestJS App (port 8002)
- Nginx reverse proxy
- MongoDB (existing)

## Key Improvements Over Python Version

1. **Performance**
   - Streaming instead of disk writes
   - Better concurrent request handling
   - Faster startup time

2. **File Size**
   - 50MB → 2GB limit with Local Bot API

3. **Code Quality**
   - TypeScript type safety
   - Modular NestJS architecture
   - Dependency injection
   - Better testing capabilities

4. **Developer Experience**
   - Hot reload in development
   - Better IDE support
   - Familiar stack (NestJS)

## Reusable from Python Version

- ✅ `.env` configuration
- ✅ `cookies.txt` for YouTube
- ✅ nginx configuration
- ✅ SSL certificates
- ✅ MongoDB connection
- ✅ Domain setup (bot.solven.uz)
- ✅ Platform identifiers list
- ✅ Message texts (Uzbek)
- ✅ Business logic flow

## Migration Checklist

### Before Starting

- [x] Backup current Python code
- [x] Document current bot token and configs
- [x] Test current bot is working
- [ ] Create test Telegram bot for development

### During Development (Current Phase)

- [x] Delete Python bot files
- [x] Move NestJS to root directory
- [x] Restructure to proper NestJS conventions
- [x] Test bot basic connectivity (Phase 1-2 complete)
- [ ] Implement download & streaming (Phase 3)
- [ ] Test with real video URLs
- [ ] Test with large files (>50MB)

### Deployment

- [ ] Deploy to VPS (port 8002)
- [ ] Set up Local Bot API Docker container
- [ ] Test with production token
- [ ] Update nginx to point to port 8002
- [ ] Monitor errors for 24-48 hours
- [ ] Verify 2GB file limit works

### Post-Migration

- [ ] Monitor performance improvements
- [ ] Collect user feedback
- [ ] Fix any edge cases discovered
- [ ] Document final architecture

## Notes

- ✅ Python code deleted - committed to NestJS approach
- ✅ Project moved to root - proper NestJS structure
- ✅ Configuration migrated to libs/config.ts
- ✅ Constants moved to libs/enums/
- Port 8002 for production deployment
- Local Bot API will run on port 8081
- Test with large files (>50MB) to verify Local Bot API works
- Cookie management strategy stays the same (cookies.txt)

## Current Status Summary

### ✅ Complete (Phases 1-2):

- NestJS project setup and restructuring
- Bot module with Telegraf integration
- Message handlers (/start, /help, text messages)
- URL detection and platform identification
- Video info extraction with yt-dlp
- Quality selection UI with inline keyboards
- Callback handlers for quality selection
- Uzbek message localization
- Configuration management

### ⏳ In Progress (Phase 3):

- Video download service
- Streaming to Local Bot API (2GB limit)
- Audio extraction for audio-only option
- File upload to Telegram with metadata
- Progress messages during download
- Error handling for large files
- File cleanup after sending

### 🔜 Upcoming (Phase 4-5):

- MongoDB integration (optional)
- Admin commands (optional)
- Webhook support for production
- Docker setup with Local Bot API
- VPS deployment
- Performance testing
