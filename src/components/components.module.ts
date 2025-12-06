import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '../libs/config';
import { BotModule } from './bot/bot.module';
import { VideoModule } from './video/video.module';
import { QualityModule } from './quality/quality.module';
import { DownloadModule } from './download/download.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    BotModule,
    VideoModule,
    QualityModule,
    DownloadModule,
    UploadModule,
  ],
})
export class ComponentsModule {}
