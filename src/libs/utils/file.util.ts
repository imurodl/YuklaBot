import { existsSync, statSync } from 'fs';

/**
 * Get file size in bytes
 */
export function getFileSizeBytes(filePath: string): number {
  try {
    if (!existsSync(filePath)) {
      return 0;
    }
    const stats = statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Get file size in megabytes
 */
export function getFileSizeMB(filePath: string): number {
  const bytes = getFileSizeBytes(filePath);
  return bytes / (1024 * 1024);
}

/**
 * Format file size for display (KB, MB, GB)
 */
export function formatFileSize(sizeBytes: number | undefined): string {
  if (!sizeBytes || sizeBytes <= 0) {
    return '';
  }

  const sizeMB = sizeBytes / (1024 * 1024);

  if (sizeMB < 1) {
    return ` - ${(sizeBytes / 1024).toFixed(1)}KB`;
  } else if (sizeMB < 1024) {
    return ` - ${sizeMB.toFixed(1)}MB`;
  } else {
    return ` - ${(sizeMB / 1024).toFixed(1)}GB`;
  }
}

/**
 * Check if file size exceeds limit
 */
export function isFileSizeWithinLimit(
  filePath: string,
  limitMB: number,
): boolean {
  const sizeMB = getFileSizeMB(filePath);
  return sizeMB <= limitMB;
}

/**
 * Validate if file exists and is accessible
 */
export function validateFilePath(filePath: string): boolean {
  try {
    return existsSync(filePath) && statSync(filePath).isFile();
  } catch (error) {
    return false;
  }
}

/**
 * Check if file is audio based on extension
 */
export function isAudioFile(filePath: string): boolean {
  const audioExtensions = ['.m4a', '.mp3', '.aac', '.ogg', '.wav', '.flac'];
  return audioExtensions.some((ext) => filePath.toLowerCase().endsWith(ext));
}

/**
 * Check if file is video based on extension
 */
export function isVideoFile(filePath: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.mkv', '.avi', '.mov', '.flv'];
  return videoExtensions.some((ext) => filePath.toLowerCase().endsWith(ext));
}
