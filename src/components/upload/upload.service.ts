import { Injectable, Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import { Input } from 'telegraf';
import { createReadStream } from 'fs';
import { isAudioFile } from '../../libs/utils/file.util';

export interface UploadOptions {
  ctx: Context;
  filePath: string;
  platform: string;
  width?: number;
  height?: number;
  duration?: number;
  isAudio?: boolean;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  /**
   * Upload file to Telegram (video, audio, or document)
   */
  async uploadFile(options: UploadOptions): Promise<void> {
    const { ctx, filePath, platform, width, height, duration, isAudio } =
      options;

    this.logger.log(`Uploading file: ${filePath}`);

    // Determine file type
    const shouldSendAsAudio = isAudio || isAudioFile(filePath);

    try {
      if (shouldSendAsAudio) {
        await this.sendAudio(ctx, filePath, platform);
      } else {
        await this.sendVideo(ctx, filePath, platform, width, height, duration);
      }

      this.logger.log('Upload successful');
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send file as video with metadata
   */
  private async sendVideo(
    ctx: Context,
    filePath: string,
    platform: string,
    width?: number,
    height?: number,
    duration?: number,
  ): Promise<void> {
    try {
      const videoFile = Input.fromLocalFile(filePath);

      await ctx.telegram.sendVideo(ctx.chat!.id, videoFile, {
        width,
        height,
        duration,
        supports_streaming: true,
      });

      this.logger.log(
        `Video sent successfully with metadata (${width}x${height}, ${duration}s)`,
      );
    } catch (videoError) {
      this.logger.warn(`Failed to send as video: ${videoError.message}`);
      // Fallback to document
      await this.sendDocument(ctx, filePath, platform);
    }
  }

  /**
   * Send file as audio
   */
  private async sendAudio(
    ctx: Context,
    filePath: string,
    platform: string,
  ): Promise<void> {
    try {
      const audioFile = Input.fromLocalFile(filePath);

      await ctx.telegram.sendAudio(ctx.chat!.id, audioFile);

      this.logger.log('Audio sent successfully');
    } catch (audioError) {
      this.logger.warn(`Failed to send as audio: ${audioError.message}`);
      // Fallback to document
      await this.sendDocument(ctx, filePath, platform);
    }
  }

  /**
   * Send file as document (fallback)
   */
  private async sendDocument(
    ctx: Context,
    filePath: string,
    platform: string,
  ): Promise<void> {
    try {
      const fileName = `${platform.toLowerCase()}_video.mp4`;
      const documentFile = Input.fromLocalFile(filePath, fileName);

      await ctx.telegram.sendDocument(ctx.chat!.id, documentFile);

      this.logger.log('File sent as document (fallback)');
    } catch (docError) {
      this.logger.error(`Failed to send as document: ${docError.message}`);
      throw new Error(
        `Failed to upload file: Video failed, Document failed - ${docError.message}`,
      );
    }
  }
}
