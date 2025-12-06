import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VideoService } from './video.service';
import { QualityService } from './quality.service';
import { DownloadModule } from '../download/download.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [ConfigModule, DownloadModule, UploadModule],
  providers: [VideoService, QualityService],
  exports: [VideoService],
})
export class VideoModule {}
