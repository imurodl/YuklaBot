import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VideoService } from './video.service';
import { QualityService } from './quality.service';

@Module({
  imports: [ConfigModule],
  providers: [VideoService, QualityService],
  exports: [VideoService],
})
export class VideoModule {}
