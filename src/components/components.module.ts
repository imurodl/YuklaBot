import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '../libs/config';
import { BotModule } from './bot/bot.module';
import { VideoModule } from './video/video.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    BotModule,
    VideoModule,
  ],
})
export class ComponentsModule {}
