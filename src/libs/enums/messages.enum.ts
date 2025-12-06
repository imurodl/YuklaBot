export const MESSAGES = {
  WELCOME: `👋 Assalomu aleykum!

📥 Instagram, TikTok, YouTube va Pinterest'dan video yuklab olishingiz mumkin.

📎 Havola yuboring va videoni oling!

👨‍💻 Murojaat uchun: @imurodl`,

  DOWNLOADING: 'Yuklanmoqda...',
  CHECKING: 'Tekshirilmoqda...',
  SENDING: 'Yuborilmoqda...',
  ANALYZING: 'Tahlil qilinmoqda...',

  SUCCESS: (sizeMB: number) => `Tayyor! (${sizeMB.toFixed(1)}MB)`,

  ERROR: `Xatolik\nBoshqa havola yuboring`,

  TOO_LARGE: (sizeMB: number, limitMB: number) =>
    `Juda katta (${sizeMB.toFixed(1)}MB)\nLimiti: ${limitMB}MB`,

  PLATFORM_NOT_SUPPORTED: (platforms: string[]) =>
    `❌ Bu platforma qo'llab-quvvatlanmaydi\n\n✅ Qo'llab-quvvatlanadigan platformalar:\n${platforms.join(', ')}`,

  SELECT_QUALITY: (platform: string) => `📊 Sifatni tanlang:\n\n🔗 ${platform}`,
};
