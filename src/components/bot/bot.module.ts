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

        if (!token) {
          throw new Error('BOT_TOKEN is not defined in environment variables');
        }

        const options: any = {
          token,
        };

        // Use webhook if configured, otherwise polling
        if (webhookUrl && webhookPath) {
          // Extract domain from full URL (remove https://)
          const domain = webhookUrl.replace(/^https?:\/\//, '');
          
          options.launchOptions = {
            webhook: {
              domain: domain.replace(webhookPath, ''), // Remove path from domain
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
