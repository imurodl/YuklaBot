import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VideoService } from './video.service';
import { QualityModule } from '../quality/quality.module';
import { DownloadModule } from '../download/download.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [ConfigModule, QualityModule, DownloadModule, UploadModule],
  providers: [VideoService],
  exports: [VideoService],
})
export class VideoModule {}
