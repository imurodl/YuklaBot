import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import YTDlpWrap from 'yt-dlp-wrap';
import { spawn } from 'child_process';
import { unlink } from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';

export interface DownloadOptions {
  url: string;
  formatId?: string;
  userId: number;
  platform: string;
}

export interface DownloadResult {
  filePath: string;
  fileSize: number;
  width?: number;
  height?: number;
  duration?: number;
  isAudio: boolean;
}

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name);
  private readonly ytdlp: YTDlpWrap;
  private readonly cookiesPath: string;
  private readonly tempDir: string;

  constructor(private readonly configService: ConfigService) {
    this.ytdlp = new YTDlpWrap();
    this.cookiesPath =
      this.configService.get<string>('ytdlp.cookiesPath') || './cookies.txt';
    this.tempDir = '/tmp';
  }

  /**
   * Download video or audio with specified quality
   */
  async downloadVideo(options: DownloadOptions): Promise<DownloadResult> {
    const { url, formatId, userId, platform } = options;

    this.logger.log(
      `Downloading ${platform} video for user ${userId}, format: ${formatId || 'best'}`,
    );

    const outputPath = this.generateOutputPath(userId, platform, formatId);

    try {
      const ytdlpArgs = this.buildYtdlpArgs(url, formatId, outputPath);

      // Execute yt-dlp download
      await this.ytdlp.execPromise(ytdlpArgs);

      // Find the actual downloaded file
      const actualFilePath = this.findDownloadedFile(outputPath);

      if (!actualFilePath || !existsSync(actualFilePath)) {
        throw new Error('Downloaded file not found');
      }

      // Get file metadata
      const metadata = await this.getVideoMetadata(actualFilePath);
      const isAudio =
        formatId === 'bestaudio' || actualFilePath.endsWith('.m4a');

      this.logger.log(
        `Successfully downloaded: ${actualFilePath} (${((metadata.fileSize || 0) / (1024 * 1024)).toFixed(2)}MB)`,
      );

      return {
        filePath: actualFilePath,
        fileSize: metadata.fileSize || 0,
        width: metadata.width,
        height: metadata.height,
        duration: metadata.duration,
        isAudio,
      };
    } catch (error) {
      this.logger.error(`Download failed: ${error.message}`);
      // Cleanup on failure
      await this.cleanup(outputPath);
      throw error;
    }
  }

  /**
   * Build yt-dlp arguments based on format selection
   */
  private buildYtdlpArgs(
    url: string,
    formatId: string | undefined,
    outputPath: string,
  ): string[] {
    const args = [url, '-o', outputPath, '--no-playlist', '--no-warnings'];

    // Add cookies if available
    if (existsSync(this.cookiesPath)) {
      args.push('--cookies', this.cookiesPath);
      this.logger.debug(`Using cookies from: ${this.cookiesPath}`);
    }

    if (formatId) {
      if (formatId === 'bestaudio') {
        // For audio extraction
        args.push(
          '-f',
          'bestaudio[ext=m4a]/bestaudio',
          '-x',
          '--audio-format',
          'm4a',
        );
      } else {
        // For specific video format
        args.push('-f', formatId);
      }
    } else {
      // Default: best quality
      args.push('-f', 'best[ext=mp4]/best');
    }

    return args;
  }

  /**
   * Find the actual downloaded file (handles different extensions)
   */
  private findDownloadedFile(basePath: string): string | null {
    const basePathWithoutExt = basePath.replace('.%(ext)s', '');
    const possibleExtensions = [
      '.mp4',
      '.webm',
      '.mkv',
      '.avi',
      '.mov',
      '.m4a',
      '.mp3',
      '.ogg',
    ];

    for (const ext of possibleExtensions) {
      const filePath = basePathWithoutExt + ext;
      if (existsSync(filePath)) {
        return filePath;
      }
    }

    // Check if base path exists as-is
    if (existsSync(basePath)) {
      return basePath;
    }

    return null;
  }

  /**
   * Extract video metadata using ffprobe
   */
  private async getVideoMetadata(
    filePath: string,
  ): Promise<Partial<DownloadResult>> {
    return new Promise((resolve) => {
      const ffprobe = spawn('ffprobe', [
        '-v',
        'quiet',
        '-print_format',
        'json',
        '-show_format',
        '-show_streams',
        filePath,
      ]);

      let output = '';

      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code !== 0) {
          this.logger.warn('ffprobe failed, returning basic info');
          const fs = require('fs');
          const stats = fs.statSync(filePath);
          resolve({ fileSize: stats.size });
          return;
        }

        try {
          const metadata = JSON.parse(output);
          const videoStream = metadata.streams?.find(
            (s: any) => s.codec_type === 'video',
          );
          const format = metadata.format;

          resolve({
            fileSize: parseInt(format?.size || '0', 10),
            width: videoStream?.width,
            height: videoStream?.height,
            duration: format?.duration
              ? Math.floor(parseFloat(format.duration))
              : undefined,
          });
        } catch (error) {
          this.logger.warn('Failed to parse ffprobe output');
          const fs = require('fs');
          const stats = fs.statSync(filePath);
          resolve({ fileSize: stats.size });
        }
      });

      ffprobe.on('error', (error) => {
        this.logger.error(`ffprobe error: ${error.message}`);
        const fs = require('fs');
        const stats = fs.statSync(filePath);
        resolve({ fileSize: stats.size });
      });
    });
  }

  /**
   * Generate output path for downloaded file
   */
  private generateOutputPath(
    userId: number,
    platform: string,
    formatId?: string,
  ): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const filename = `${platform.toLowerCase()}_${userId}_${timestamp}_${random}.%(ext)s`;
    return path.join(this.tempDir, filename);
  }

  /**
   * Cleanup downloaded file
   */
  async cleanup(filePath: string): Promise<void> {
    try {
      // Handle base path with %(ext)s
      const basePathWithoutExt = filePath.replace('.%(ext)s', '');
      const possibleExtensions = [
        '.mp4',
        '.webm',
        '.mkv',
        '.avi',
        '.mov',
        '.m4a',
        '.mp3',
        '.ogg',
        '',
      ];

      for (const ext of possibleExtensions) {
        const fullPath = ext ? basePathWithoutExt + ext : filePath;
        if (existsSync(fullPath)) {
          await unlink(fullPath);
          this.logger.debug(`Cleaned up: ${fullPath}`);
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to cleanup ${filePath}: ${error.message}`);
    }
  }
}
