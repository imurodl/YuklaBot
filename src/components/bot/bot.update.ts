import { Update, Start, Help, On, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { MESSAGES } from '../../libs/constants/messages.constant';
import { VideoService } from '../video/video.service';

@Update()
export class BotUpdate {
  constructor(private readonly videoService: VideoService) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    await ctx.reply(MESSAGES.WELCOME);
  }

  @Help()
  async help(@Ctx() ctx: Context) {
    await ctx.reply(MESSAGES.WELCOME);
  }

  @On('text')
  async onText(@Ctx() ctx: Context) {
    if (!ctx.message || !('text' in ctx.message)) {
      return;
    }

    const text = ctx.message.text;
    const url = this.extractUrl(text);

    if (!url) {
      return; // Ignore non-URL messages
    }

    try {
      await this.videoService.handleVideoRequest(ctx, url);
    } catch (error) {
      await ctx.reply(MESSAGES.ERROR);
    }
  }

  @On('callback_query')
  async onCallbackQuery(@Ctx() ctx: Context) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      return;
    }

    try {
      await this.videoService.handleQualityCallback(ctx);
    } catch (error) {
      await ctx.answerCbQuery('Xatolik yuz berdi', { show_alert: true });
    }
  }

  private extractUrl(text: string): string | null {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
  }
}
