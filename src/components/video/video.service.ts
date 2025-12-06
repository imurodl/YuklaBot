import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Context, Markup } from 'telegraf';
import {
  PLATFORM_IDENTIFIERS,
  SUPPORTED_PLATFORMS,
} from '../../libs/enums/platforms.enum';
import { MESSAGES } from '../../libs/enums/messages.enum';
import { QualityService, QualityOption } from '../quality/quality.service';
import { DownloadService } from '../download/download.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly downloadUrls: Map<number, string> = new Map();
  private readonly fileSizeLimit: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly qualityService: QualityService,
    private readonly downloadService: DownloadService,
    private readonly uploadService: UploadService,
  ) {
    this.fileSizeLimit =
      this.configService.get<number>('telegram.fileSizeLimit') ||
      50 * 1024 * 1024; // Default 50MB
  }

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
      // Get video info
      const info = await this.qualityService.getVideoInfo(url);

      if (!info) {
        throw new Error('Failed to get video information');
      }

      // Get quality options
      const options = this.qualityService.getQualityOptions(info);

      if (options.length === 0) {
        throw new Error('No quality options available');
      }

      // Store URL for callback
      if (ctx.from?.id) {
        this.downloadUrls.set(ctx.from.id, url);
      }

      // Create inline keyboard
      const keyboard = options.map((option: QualityOption) => [
        Markup.button.callback(
          this.qualityService.formatQualityButton(option),
          `dl:${platform}:${option.formatId}:${ctx.from?.id}`,
        ),
      ]);

      // Edit message with quality selection
      await ctx.telegram.editMessageText(
        ctx.chat?.id,
        progressMsg.message_id,
        undefined,
        MESSAGES.SELECT_QUALITY(platform),
        Markup.inlineKeyboard(keyboard),
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

    const data = ctx.callbackQuery.data;
    const parts = data.split(':');

    if (parts.length !== 4 || parts[0] !== 'dl') {
      return;
    }

    const [, platform, formatId, userIdStr] = parts;
    const userId = parseInt(userIdStr, 10);

    // Verify user
    if (ctx.from?.id !== userId) {
      await ctx.answerCbQuery('Bu yuklab olish sizniki emas', {
        show_alert: true,
      });
      return;
    }

    // Get stored URL
    const url = this.downloadUrls.get(userId);

    if (!url) {
      await ctx.answerCbQuery(
        'Yuklab olish muddati tugagan, havolani qaytadan yuboring',
        {
          show_alert: true,
        },
      );
      return;
    }

    // Answer callback immediately
    await ctx.answerCbQuery('Ishlanmoqda...');

    // Download and send video
    await this.downloadAndSendVideo(ctx, url, platform, formatId, userId);
  }

  private async downloadAndSendVideo(
    ctx: Context,
    url: string,
    platform: string,
    formatId: string,
    userId: number,
  ) {
    // Update message
    await ctx.editMessageText(MESSAGES.DOWNLOADING);

    let downloadedFilePath: string | null = null;

    try {
      // Download video
      const downloadResult = await this.downloadService.downloadVideo({
        url,
        formatId,
        userId,
        platform,
      });

      downloadedFilePath = downloadResult.filePath;
      const fileSizeMB = downloadResult.fileSize / (1024 * 1024);

      this.logger.log(
        `Downloaded: ${downloadedFilePath}, Size: ${fileSizeMB.toFixed(2)}MB`,
      );

      // Update progress
      await ctx.editMessageText(MESSAGES.CHECKING);

      // Check file size limit
      const limitMB = this.fileSizeLimit / (1024 * 1024);
      if (fileSizeMB > limitMB) {
        await ctx.editMessageText(MESSAGES.TOO_LARGE(fileSizeMB, limitMB));
        this.logger.warn(`File too large: ${fileSizeMB}MB > ${limitMB}MB`);
        return;
      }

      // Upload to Telegram
      await ctx.editMessageText(MESSAGES.SENDING);

      await this.uploadService.uploadFile({
        ctx,
        filePath: downloadedFilePath,
        platform,
        width: downloadResult.width,
        height: downloadResult.height,
        duration: downloadResult.duration,
        isAudio: downloadResult.isAudio,
      });

      // Success!
      await ctx.editMessageText(MESSAGES.SUCCESS(fileSizeMB));

      // Clean up stored URL
      this.downloadUrls.delete(userId);
    } catch (error) {
      this.logger.error(`Error processing download: ${error.message}`);
      await ctx.editMessageText(MESSAGES.ERROR);
    } finally {
      // Cleanup downloaded file
      if (downloadedFilePath) {
        await this.downloadService.cleanup(downloadedFilePath);
      }
    }
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
