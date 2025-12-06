import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getBotToken } from 'nestjs-telegraf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable JSON body parsing for Telegram webhook
  app.enableCors();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);

  // Get bot instance and set webhook
  const bot = app.get(getBotToken());
  const webhookDomain = process.env.WEBHOOK_URL; // Should be just "bot.solven.uz"
  const webhookPath = process.env.WEBHOOK_PATH; // Should be "/webhook"

  if (webhookDomain && webhookPath) {
    app.use(bot.webhookCallback(webhookPath));
    console.log(
      `Webhook configured at: https://${webhookDomain}${webhookPath}`,
    );
  } else {
    console.log('Running in polling mode');
  }
}
bootstrap();
