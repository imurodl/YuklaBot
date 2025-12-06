import { Injectable, Logger } from '@nestjs/common';
import { YtDlp } from 'ytdlp-nodejs';
import { ConfigService } from '@nestjs/config';

export interface VideoInfo {
  formats: any[];
  title?: string;
  thumbnail?: string;
  duration?: number;
}

export interface QualityOption {
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
  private readonly ytDlp: YtDlp;

  constructor(private readonly configService: ConfigService) {
    this.ytDlp = new YtDlp();
  }

  /**
   * Extract video information using yt-dlp
   */
  async getVideoInfo(url: string): Promise<VideoInfo | null> {
    try {
      const cookiesPath = this.configService.get<string>('ytdlp.cookiesPath');

      const options: any = {};

      if (cookiesPath) {
        // Note: ytdlp-nodejs uses cookies option, not command line flag
        options.cookies = cookiesPath;
      }

      const info = await this.ytDlp.getInfoAsync(url, options);

      // Handle both video and playlist types
      if (info._type === 'playlist') {
        this.logger.warn('Playlist detected, using first video');
        return info.entries?.[0] || null;
      }

      return info as VideoInfo;
    } catch (error) {
      this.logger.error(`Error extracting video info: ${error.message}`);
      return null;
    }
  }

  /**
   * Parse video formats and return quality options
   */
  getQualityOptions(info: VideoInfo): QualityOption[] {
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

  /**
   * Format filesize for display
   */
  formatFilesize(sizeBytes: number | undefined): string {
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

  /**
   * Format quality button text
   */
  formatQualityButton(option: QualityOption): string {
    return `${option.icon} ${option.quality}${option.size}`;
  }
}
