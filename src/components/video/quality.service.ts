import { Injectable, Logger } from '@nestjs/common';
import { Context, Markup } from 'telegraf';
import YTDlpWrap from 'yt-dlp-wrap';
import { ConfigService } from '@nestjs/config';
import { MESSAGES } from '../../libs/enums/messages.enum';
import { DownloadService } from '../download/download.service';
import { UploadService } from '../upload/upload.service';
import { getFileSizeMB } from '../../libs/utils/file.util';

interface VideoInfo {
  formats: any[];
  title?: string;
}

interface QualityOption {
  type: 'audio' | 'video';
  formatId: string;
  quality: string;
  size: string;
  ext: string;
  icon: string;
}

@Injectable()
export class QualityService {
  private readonly logger = new Logger(QualityService.name);
  private readonly ytDlp: YTDlpWrap;
  private readonly downloadUrls: Map<number, string> = new Map();
  private readonly fileSizeLimit: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly downloadService: DownloadService,
    private readonly uploadService: UploadService,
  ) {
    this.ytDlp = new YTDlpWrap();
    this.fileSizeLimit =
      this.configService.get<number>('telegram.fileSizeLimit') ||
      50 * 1024 * 1024; // Default 50MB
  }

  async showQualitySelection(
    ctx: Context,
    url: string,
    platform: string,
    messageId: number,
  ) {
    try {
      // Get video info
      const info = await this.getVideoInfo(url);

      if (!info) {
        throw new Error('Failed to get video information');
      }

      // Get quality options
      const options = this.getQualityOptions(info);

      if (options.length === 0) {
        throw new Error('No quality options available');
      }

      // Store URL for callback
      if (ctx.from?.id) {
        this.downloadUrls.set(ctx.from.id, url);
      }

      // Create inline keyboard
      const keyboard = options.map((option) => [
        Markup.button.callback(
          `${option.icon} ${option.quality}${option.size}`,
          `dl:${platform}:${option.formatId}:${ctx.from?.id}`,
        ),
      ]);

      // Edit message with quality selection
      await ctx.telegram.editMessageText(
        ctx.chat?.id,
        messageId,
        undefined,
        MESSAGES.SELECT_QUALITY(platform),
        Markup.inlineKeyboard(keyboard),
      );
    } catch (error) {
      this.logger.error(`Error showing quality selection: ${error.message}`);
      throw error;
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

  private async getVideoInfo(url: string): Promise<VideoInfo | null> {
    try {
      const cookiesPath = this.configService.get<string>('ytdlp.cookiesPath');

      const options = ['--dump-json', '--no-warnings', '--skip-download'];

      if (cookiesPath) {
        options.push('--cookies', cookiesPath);
      }

      const output = await this.ytDlp.execPromise([...options, url]);
      const info = JSON.parse(output);

      return info;
    } catch (error) {
      this.logger.error(`Error extracting video info: ${error.message}`);
      return null;
    }
  }

  private getQualityOptions(info: VideoInfo): QualityOption[] {
    const formats = info.formats || [];
    const options: QualityOption[] = [];

    // Find audio formats
    const audioFormats = formats.filter(
      (f) => f.acodec !== 'none' && f.vcodec === 'none',
    );

    let bestAudio = audioFormats[0];
    if (!bestAudio) {
      // Create synthetic audio option
      bestAudio = {
        format_id: 'bestaudio',
        ext: 'm4a',
        acodec: 'audio',
        vcodec: 'none',
      };
    }

    // Add audio option
    options.push({
      type: 'audio',
      formatId: bestAudio.format_id,
      quality: 'Audio Only',
      size: this.formatFilesize(bestAudio.filesize),
      ext: bestAudio.ext || 'm4a',
      icon: '🎵',
    });

    // Find video formats (with both audio and video)
    const videoFormats = formats
      .filter(
        (f) =>
          f.vcodec !== 'none' &&
          f.acodec !== 'none' &&
          ['mp4', 'webm'].includes(f.ext),
      )
      .sort(
        (a, b) =>
          (b.height || 0) * (b.fps || 30) - (a.height || 0) * (a.fps || 30),
      );

    // Get High, Medium, Low quality
    if (videoFormats.length > 0) {
      // High quality
      const high = videoFormats[0];
      options.push({
        type: 'video',
        formatId: high.format_id,
        quality: `High (${high.height || '?'}p)`,
        size: this.formatFilesize(high.filesize),
        ext: high.ext || 'mp4',
        icon: '📹',
      });

      // Medium quality
      if (videoFormats.length >= 3) {
        const medium = videoFormats[Math.floor(videoFormats.length / 2)];
        options.push({
          type: 'video',
          formatId: medium.format_id,
          quality: `Medium (${medium.height || '?'}p)`,
          size: this.formatFilesize(medium.filesize),
          ext: medium.ext || 'mp4',
          icon: '📹',
        });
      }

      // Low quality
      if (videoFormats.length >= 2) {
        const low = videoFormats[videoFormats.length - 1];
        options.push({
          type: 'video',
          formatId: low.format_id,
          quality: `Low (${low.height || '?'}p)`,
          size: this.formatFilesize(low.filesize),
          ext: low.ext || 'mp4',
          icon: '📹',
        });
      }
    }

    return options;
  }

  private formatFilesize(sizeBytes: number | undefined): string {
    if (!sizeBytes || sizeBytes <= 0) {
      return '';
    }

    const sizeMB = sizeBytes / (1024 * 1024);
    if (sizeMB < 1) {
      return ` - ${(sizeBytes / 1024).toFixed(1)}KB`;
    } else if (sizeMB < 1024) {
      return ` - ${sizeMB.toFixed(1)}MB`;
    } else {
      return ` - ${(sizeMB / 1024).toFixed(1)}GB`;
    }
  }
}
