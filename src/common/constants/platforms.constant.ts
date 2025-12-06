export const PLATFORM_IDENTIFIERS: Record<string, string> = {
  'youtube.com': 'YouTube',
  'youtu.be': 'YouTube',
  'instagram.com': 'Instagram',
  'tiktok.com': 'TikTok',
  'facebook.com': 'Facebook',
  'fb.com': 'Facebook',
  'twitter.com': 'Twitter',
  'x.com': 'Twitter',
  'pinterest.com': 'Pinterest',
  'pin.it': 'Pinterest',
  'reddit.com': 'Reddit',
  'vimeo.com': 'Vimeo',
};

export const SUPPORTED_PLATFORMS = Object.values(PLATFORM_IDENTIFIERS).filter(
  (value, index, self) => self.indexOf(value) === index,
);
