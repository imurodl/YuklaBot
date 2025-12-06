# YuklaBot NestJS Migration Plan

## Overview

Rebuild YuklaBot in NestJS with Local Bot API for better performance and 2GB file limit.

**Status Update (Dec 6, 2024):**

- ✅ Python project files deleted
- ✅ Moved nest files to root
- ✅ Restructured to proper NestJS architecture
- ✅ Updated folder structure to NestJS conventions
- ✅ Phase 1-2 Complete: Bot structure, handlers, quality selection working
- ⏳ Phase 3 Ready: Awaiting confirmation to implement download & upload services

**Current State:**

- Bot can receive messages and show quality options
- yt-dlp wrapper set up for video info extraction
- Inline keyboards working for quality selection
- **Missing:** Actual video download and upload to Telegram

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

### Phase 3 Detailed Steps:

#### Step 3.1: Create File Utils

**File:** `src/libs/utils/file.util.ts`

- ✅ Calculate file sizes
- ✅ Check file size limits
- ✅ Format file sizes (MB, GB display)
- ✅ Validate file paths

#### Step 3.2: Create Download Module

**Files:** `src/components/download/`

- ✅ `download.module.ts` - Module definition
- ✅ `download.service.ts` - Download implementation
  - ✅ Set up yt-dlp wrapper with ConfigService
  - ✅ Implement video download with format selection
  - ✅ Handle audio extraction (bestaudio format)
  - ✅ Add ffprobe metadata extraction (width, height, duration)
  - ✅ Generate temp file paths
  - ✅ Implement file cleanup

#### Step 3.3: Create Upload Module

**Files:** `src/components/upload/`

- ✅ `upload.module.ts` - Module definition
- ✅ `upload.service.ts` - Upload implementation
  - ✅ Send video files with metadata to Telegram
  - ✅ Send audio files to Telegram
  - ✅ Handle document fallback
  - ✅ Implement progress tracking
  - ✅ Add error handling

#### Step 3.4: Update Video Module (Integration)

**Files to Update:**

- ✅ `src/components/video/video.module.ts` - Import Download & Upload modules
- ✅ `src/components/video/quality.service.ts` - Integrate Download & Upload services
  - ✅ Inject DownloadService & UploadService
  - ✅ Update callback handler to download & send
  - ✅ Add progress messages during process
  - ✅ Handle errors gracefully

#### Step 3.5: Update Components Module

**File:** `src/components/components.module.ts`

- ✅ Import DownloadModule
- ✅ Import UploadModule
- ✅ Ensure proper module dependencies

#### Step 3.6: Testing Phase 3

- [ ] Test with YouTube video (short)
- [ ] Test with Instagram video
- [ ] Test with TikTok video
- [ ] Test audio-only download
- [ ] Test different quality options
- [ ] Test error cases (invalid URL, unavailable video)
- [ ] Verify progress messages appear correctly
- [ ] Check file cleanup after sending

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
│   │   ├── video/                  # Video info & orchestration
│   │   │   ├── video.module.ts    ✓ Complete
│   │   │   ├── video.service.ts   ✓ Complete (orchestrator)
│   │   │   └── quality.service.ts ✓ Complete (quality selection)
│   │   ├── download/               ⏳ NEW - Phase 3
│   │   │   ├── download.module.ts
│   │   │   └── download.service.ts
│   │   ├── upload/                 ⏳ NEW - Phase 3
│   │   │   ├── upload.module.ts
│   │   │   └── upload.service.ts
│   │   └── components.module.ts   ✓ Complete
│   ├── libs/                       # Shared libraries
│   │   ├── config.ts              ✓ Configuration
│   │   ├── enums/
│   │   │   ├── messages.enum.ts   ✓ Uzbek messages
│   │   │   └── platforms.enum.ts  ✓ Platform identifiers
│   │   └── utils/                 ⏳ NEW - Phase 3
│   │       └── file.util.ts
│   ├── app.module.ts              ✓
│   └── main.ts                    ✓
├── docker-compose.yml              # Includes Local Bot API
├── Dockerfile
├── .env                            ✓
├── cookies.txt                     ✓
└── package.json                    ✓
```

**Module Responsibilities:**

- **`bot/`** - Telegram bot handlers, message routing
- **`video/`** - Video orchestration, platform detection, quality selection
- **`download/`** - yt-dlp integration, video/audio downloading
- **`upload/`** - Telegram upload, metadata handling, file sending
- **`libs/`** - Shared utilities, config, constants

**Module Dependencies Flow:**

```
┌─────────────────────────────────────────────────┐
│          ComponentsModule (Root)                │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼───────┐ ┌───▼────┐ ┌─────▼──────┐
│   BotModule   │ │Download│ │   Upload   │
│               │ │ Module │ │   Module   │
└───────┬───────┘ └────────┘ └────────────┘
        │              ▲           ▲
┌───────▼───────┐      │           │
│  VideoModule  │──────┴───────────┘
│ (Orchestrator)│
└───────────────┘

Flow:
1. User sends URL → BotModule
2. BotModule → VideoModule (detect platform, show quality)
3. User selects quality → VideoModule.QualityService
4. QualityService → DownloadModule (download video)
5. QualityService → UploadModule (send to Telegram)
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

---

## 🚀 Phase 3 Implementation Order

When you're ready to proceed with Phase 3, we'll build in this order:

### 1️⃣ Foundation Files (30 mins)

```
src/libs/utils/file.util.ts          # File size calculations, validations
```

### 2️⃣ Download Module (1.5 hours)

```
src/components/download/
  ├── download.module.ts              # Module definition
  └── download.service.ts             # yt-dlp integration, ffprobe
```

### 3️⃣ Upload Module (1.5 hours)

```
src/components/upload/
  ├── upload.module.ts                # Module definition
  └── upload.service.ts               # Telegram upload with metadata
```

### 4️⃣ Integration (1 hour)

```
src/components/components.module.ts   # Import new modules
src/components/video/video.module.ts  # Import Download & Upload
src/components/video/quality.service.ts # Use Download & Upload services
```

### 5️⃣ Testing (1-2 hours)

- Test all platforms
- Test quality options
- Test audio extraction
- Verify error handling
- Check file cleanup

### 6️⃣ Local Bot API Setup (Optional - Phase 4)

```
docker-compose.yml                    # Add Local Bot API container
src/components/telegram-api/         # Service for 2GB uploads
```

**Benefits of Modular Approach:**

- ✅ Single Responsibility Principle
- ✅ Easier to test each module independently
- ✅ Better code organization
- ✅ Clearer dependencies
- ✅ Easy to swap implementations (e.g., different download strategies)

---

## 📋 Quick Reference

### Files to Create Next:

1. `src/libs/utils/file.util.ts` - Utility functions
2. `src/components/download/download.module.ts` - Download module
3. `src/components/download/download.service.ts` - Download logic
4. `src/components/upload/upload.module.ts` - Upload module
5. `src/components/upload/upload.service.ts` - Upload to Telegram

### Files to Update:

1. `src/components/video/video.module.ts` - Import Download & Upload modules
2. `src/components/video/quality.service.ts` - Use Download & Upload services
3. `src/components/components.module.ts` - Import new modules

### Commands:

```bash
# Build project
npm run build

# Start in dev mode
npm run start:dev

# Run tests (when ready)
npm run test

# Deploy to production (when ready)
./deploy.sh
```

### Environment Variables Required:

```env
BOT_TOKEN=your_bot_token
PORT=8002
YTDLP_COOKIES=./cookies.txt
LOCAL_BOT_API_URL=http://localhost:8081  # For Phase 4
```

---

## ✅ Ready to Start Phase 3?

Confirm you're ready, and I'll create the implementation files one by one with full code.
