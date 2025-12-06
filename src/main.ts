import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getBotToken } from 'nestjs-telegraf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable JSON body parsing for Telegram webhook
  app.enableCors();

  // Get bot instance and set webhook BEFORE listening
  const bot = app.get(getBotToken());
  const webhookDomain = process.env.WEBHOOK_URL; // Should be just "bot.solven.uz"
  const webhookPath = process.env.WEBHOOK_PATH; // Should be "/webhook"

  if (webhookDomain && webhookPath) {
    // Add logging middleware
    app.use(webhookPath, (req, res, next) => {
      console.log(`[WEBHOOK] Received ${req.method} request to ${req.url}`);
      next();
    });
    
    app.use(bot.webhookCallback(webhookPath));
    console.log(
      `Webhook will be available at: https://${webhookDomain}${webhookPath}`,
    );
  } else {
    console.log('Running in polling mode');
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
