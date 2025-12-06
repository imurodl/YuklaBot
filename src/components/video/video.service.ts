import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Context } from 'telegraf';
import {
  PLATFORM_IDENTIFIERS,
  SUPPORTED_PLATFORMS,
} from '../../common/constants/platforms.constant';
import { MESSAGES } from '../../common/constants/messages.constant';
import { QualityService } from './quality.service';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly qualityService: QualityService,
  ) {}

  async handleVideoRequest(ctx: Context, url: string) {
    // Detect platform
    const platform = this.detectPlatform(url);

    if (!platform) {
      await ctx.reply(MESSAGES.PLATFORM_NOT_SUPPORTED(SUPPORTED_PLATFORMS));
      return;
    }

    this.logger.log(`Processing ${platform} video: ${url}`);

    // Send progress message
    const progressMsg = await ctx.reply(MESSAGES.ANALYZING);

    try {
      // Show quality selection
      await this.qualityService.showQualitySelection(
        ctx,
        url,
        platform,
        progressMsg.message_id,
      );
    } catch (error) {
      this.logger.error(`Error processing video: ${error.message}`);
      await ctx.telegram.editMessageText(
        ctx.chat?.id,
        progressMsg.message_id,
        undefined,
        MESSAGES.ERROR,
      );
    }
  }

  async handleQualityCallback(ctx: Context) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      return;
    }

    await this.qualityService.handleQualityCallback(ctx);
  }

  private detectPlatform(url: string): string | null {
    for (const [domain, platform] of Object.entries(PLATFORM_IDENTIFIERS)) {
      if (url.includes(domain)) {
        return platform;
      }
    }
    return null;
  }
}
