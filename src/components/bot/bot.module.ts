import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VideoModule } from '../video/video.module';
import { BotUpdate } from './bot.update';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const token = configService.get<string>('bot.token');
        const webhookUrl = configService.get<string>('bot.webhookUrl');
        const webhookPath = configService.get<string>('bot.webhookPath');
        const localBotApiUrl = configService.get<string>('bot.localApiUrl');

        if (!token) {
          throw new Error('BOT_TOKEN is not defined in environment variables');
        }

        const options: any = {
          token,
        };

        // Use Local Bot API if configured (for 2GB file support)
        if (localBotApiUrl) {
          options.options = {
            apiRoot: localBotApiUrl,
          };
        }

        // Use webhook if configured, otherwise polling
        if (webhookUrl && webhookPath) {
          options.launchOptions = {
            webhook: {
              domain: webhookUrl,
              hookPath: webhookPath,
            },
          };
        }

        return options;
      },
    }),
    VideoModule,
  ],
  providers: [BotUpdate],
})
export class BotModule {}
