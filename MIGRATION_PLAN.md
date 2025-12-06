# YuklaBot NestJS Migration Plan

## Overview

Rebuild YuklaBot in NestJS with Local Bot API for better performance and 2GB file limit.

## Phase 1: Setup (Day 1)

- [x] Create project plan
- [x] Create `nest/` folder
- [x] Initialize NestJS project
- [ ] Set up Local Bot API server (Docker)
- [x] Configure environment variables
- [ ] Set up basic bot connection

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

```
nest/
├── src/
│   ├── components/
│   │   ├── bot/
│   │   │   ├── bot.module.ts
│   │   │   ├── bot.update.ts           # Message handlers
│   │   │   └── handlers/
│   │   │       ├── start.handler.ts
│   │   │       ├── video.handler.ts
│   │   │       └── callback.handler.ts
│   │   ├── video/
│   │   │   ├── video.module.ts
│   │   │   ├── video.service.ts        # yt-dlp wrapper
│   │   │   ├── streaming.service.ts    # Stream to Local Bot API
│   │   │   └── quality.service.ts      # Format selection
│   │   ├── database/
│   │   │   ├── database.module.ts
│   │   │   └── user.service.ts
│   │   └── telegram-api/
│   │       ├── telegram-api.module.ts
│   │       └── telegram-api.service.ts # Local Bot API client
│   ├── config/
│   │   └── configuration.ts
│   ├── common/
│   │   ├── constants/
│   │   │   └── platforms.constant.ts
│   │   └── utils/
│   │       └── message.util.ts
│   ├── app.module.ts
│   └── main.ts
├── docker-compose.yml              # Includes Local Bot API
├── Dockerfile
├── .env
└── package.json
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

- [ ] Backup current Python code
- [ ] Document current bot token and configs
- [ ] Test current bot is working
- [ ] Create test Telegram bot for development

### During Development

- [ ] Keep Python bot running in production
- [ ] Test NestJS bot with test token locally
- [ ] Compare behavior side-by-side

### Deployment

- [ ] Deploy NestJS to VPS (port 8002)
- [ ] Test with production token on port 8002
- [ ] Update nginx to point to port 8002
- [ ] Monitor errors for 24 hours
- [ ] Archive Python code (don't delete immediately)

### Post-Migration

- [ ] Monitor performance improvements
- [ ] Collect user feedback
- [ ] Fix any edge cases
- [ ] After 1 week: delete Python code

## Notes

- Keep both bots during testing phase
- Use different ports (8000 for Python, 8002 for NestJS)
- Local Bot API runs on port 8081
- Test with large files (>50MB) to verify Local Bot API works
- Cookie management strategy stays the same
