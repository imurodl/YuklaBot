export default () => ({
  port: parseInt(process.env.PORT || '8000', 10),
  bot: {
    token: process.env.BOT_TOKEN || '',
    webhookPath: process.env.WEBHOOK_PATH || '',
    webhookUrl: process.env.WEBHOOK_URL || '',
    localBotApiUrl: process.env.LOCAL_BOT_API_URL || 'http://localhost:8081',
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
    dbName: process.env.MONGODB_DB_NAME || 'downloader',
    usersCollection: process.env.MONGODB_USERS_COLLECTION || 'users',
  },
  admin: {
    ids: process.env.ADMIN_IDS
      ? process.env.ADMIN_IDS.split(',').map((id) => parseInt(id.trim(), 10))
      : [],
  },
  ytdlp: {
    cookiesPath: process.env.YTDLP_COOKIES || './cookies.txt',
  },
  telegram: {
    fileSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB with Local Bot API
  },
});
