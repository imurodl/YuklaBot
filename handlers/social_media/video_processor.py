import asyncio
import logging
import os
import tempfile
import uuid
from typing import Optional, Dict, List

import yt_dlp
from aiogram.types import FSInputFile, InlineKeyboardMarkup, InlineKeyboardButton

from config import TEMP_DIRECTORY, PLATFORM_IDENTIFIERS
from utils.user_agent_utils import get_random_user_agent
from utils.common_utils import safe_edit_message

# Set up logging
logger = logging.getLogger(__name__)

# Telegram limits
TELEGRAM_VIDEO_SIZE_LIMIT_MB = 50  # Telegram's video size limit


def get_file_size_mb(file_path: str) -> float:
    try:
        size_bytes = os.path.getsize(file_path)
        return size_bytes / (1024 * 1024)
    except Exception:
        return 0.0


class SimpleVideoDownloader:

    def __init__(self):
        self.temp_dir = TEMP_DIRECTORY
        os.makedirs(self.temp_dir, exist_ok=True)

    async def get_video_info(self, url: str) -> Optional[Dict]:
        """Extract video information without downloading"""
        try:
            cookiefile = os.getenv("YTDLP_COOKIES")
            options = {
                "quiet": True,
                "no_warnings": True,
                "extract_flat": False,
                "skip_download": True,  # Only get info, don't download
                "http_headers": {"User-Agent": get_random_user_agent()},
            }

            if cookiefile:
                options["cookiefile"] = cookiefile
                logger.info(f"Using yt-dlp cookies file: {cookiefile}")

            def extract_info():
                with yt_dlp.YoutubeDL(options) as ydl:
                    return ydl.extract_info(url, download=False)

            loop = asyncio.get_event_loop()
            info = await loop.run_in_executor(None, extract_info)
            return info
        except Exception as e:
            logger.error(f"Error extracting video info: {str(e)}")
            return None

    def format_filesize(self, size_bytes: Optional[int]) -> str:
        """Convert bytes to human readable format, return empty string if not available"""
        if not size_bytes or size_bytes <= 0:
            return ""

        size_mb = size_bytes / (1024 * 1024)
        if size_mb < 1:
            return f" - {size_bytes / 1024:.1f}KB"
        elif size_mb < 1024:
            return f" - {size_mb:.1f}MB"
        else:
            return f" - {size_mb / 1024:.1f}GB"

    def get_filesize(self, format_dict: Dict) -> Optional[int]:
        """Get actual file size only (no estimation)"""
        return format_dict.get("filesize") or format_dict.get("filesize_approx")

    def get_quality_options(self, info: Dict) -> List[Dict]:
        """Extract quality options from video info"""
        formats = info.get("formats", [])

        # Find best audio - check both standalone and combined formats
        audio_formats = [
            f
            for f in formats
            if f.get("acodec") != "none" and f.get("vcodec") == "none"
        ]
        
        # If no standalone audio, we'll extract from best combined format
        best_audio = None
        if audio_formats:
            best_audio = max(audio_formats, key=lambda f: f.get("abr", 0) or 0)
        else:
            # For YouTube and platforms without standalone audio, use special format
            best_audio = {
                "format_id": "bestaudio",
                "ext": "m4a",
                "acodec": "audio",
                "vcodec": "none",
            }

        # Find video formats with both video and audio
        video_formats = [
            f
            for f in formats
            if f.get("vcodec") != "none"
            and f.get("acodec") != "none"
            and f.get("ext") in ["mp4", "webm"]
        ]

        # If no combined formats, get video-only formats
        if not video_formats:
            video_formats = [
                f
                for f in formats
                if f.get("vcodec") != "none" and f.get("ext") in ["mp4", "webm"]
            ]

        # Sort by quality (resolution * fps)
        video_formats.sort(
            key=lambda f: (f.get("height", 0) or 0) * (f.get("fps", 30) or 30),
            reverse=True,
        )

        quality_options = []

        # Audio option - always add it
        quality_options.append(
            {
                "type": "audio",
                "format_id": best_audio.get("format_id"),
                "quality": "Audio Only",
                "size": self.format_filesize(self.get_filesize(best_audio)),
                "ext": best_audio.get("ext", "m4a"),
                "icon": "🎵",
            }
        )

        # Get Low, Medium, High quality
        if len(video_formats) > 0:
            # High quality (best)
            high = video_formats[0]
            quality_options.append(
                {
                    "type": "video",
                    "format_id": high.get("format_id"),
                    "quality": f"High ({high.get('height', '?')}p)",
                    "size": self.format_filesize(self.get_filesize(high)),
                    "ext": high.get("ext", "mp4"),
                    "icon": "📹",
                }
            )

            # Medium quality (middle)
            if len(video_formats) >= 3:
                medium = video_formats[len(video_formats) // 2]
                quality_options.append(
                    {
                        "type": "video",
                        "format_id": medium.get("format_id"),
                        "quality": f"Medium ({medium.get('height', '?')}p)",
                        "size": self.format_filesize(self.get_filesize(medium)),
                        "ext": medium.get("ext", "mp4"),
                        "icon": "📹",
                    }
                )

            # Low quality (worst)
            if len(video_formats) >= 2:
                low = video_formats[-1]
                quality_options.append(
                    {
                        "type": "video",
                        "format_id": low.get("format_id"),
                        "quality": f"Low ({low.get('height', '?')}p)",
                        "size": self.format_filesize(self.get_filesize(low)),
                        "ext": low.get("ext", "mp4"),
                        "icon": "📹",
                    }
                )

        return quality_options

    def get_simple_ytdlp_options(
        self, output_path: str, format_id: Optional[str] = None
    ) -> dict:
        """Get yt-dlp options with optional format selection"""
        cookiefile = os.getenv("YTDLP_COOKIES")
        options = {
            "outtmpl": output_path,
            "writeinfojson": False,
            "writesubtitles": False,
            "ignoreerrors": False,
            "no_warnings": False,
            "http_headers": {"User-Agent": get_random_user_agent()},
            "extract_flat": False,
            "writethumbnail": False,
            "writeautomaticsub": False,
        }

        if format_id:
            # Download specific format
            if format_id == "bestaudio":
                # For audio extraction, use bestaudio format and convert to m4a
                options["format"] = "bestaudio[ext=m4a]/bestaudio"
                options["postprocessors"] = [
                    {
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "m4a",
                    }
                ]
            else:
                # Download exact format (no merging)
                options["format"] = format_id
                # Prefer formats that don't need post-processing
                options["merge_output_format"] = "mp4"
        else:
            # Default format selection
            options["format"] = "best[ext=mp4]/best/worst"

        if cookiefile:
            options["cookiefile"] = cookiefile
            logger.info(f"Using yt-dlp cookies file for download: {cookiefile}")

        return options

    async def download_video(
        self,
        url: str,
        platform_name: str,
        user_id: int,
        format_id: Optional[str] = None,
    ) -> Optional[str]:
        request_id = str(uuid.uuid4())[:8]
        filename = f"{platform_name.lower()}_{user_id}_{request_id}.%(ext)s"
        output_path = os.path.join(self.temp_dir, filename)

        try:
            logger.info(
                f"Downloading from {platform_name}: {url} (format: {format_id or 'auto'})"
            )

            options = self.get_simple_ytdlp_options(output_path, format_id)

            def run_download():
                with yt_dlp.YoutubeDL(options) as ydl:
                    ydl.download([url])

                    # Find downloaded file
                    base_path = output_path.replace(".%(ext)s", "")
                    for ext in [
                        ".mp4",
                        ".webm",
                        ".mkv",
                        ".avi",
                        ".mov",
                        ".m4a",
                        ".mp3",
                    ]:
                        potential_path = base_path + ext
                        if os.path.exists(potential_path):
                            return potential_path
                    return None

            loop = asyncio.get_event_loop()
            downloaded_path = await loop.run_in_executor(None, run_download)

            if downloaded_path and os.path.exists(downloaded_path):
                file_size = get_file_size_mb(downloaded_path)
                logger.info(
                    f"Successfully downloaded {platform_name} video: {file_size:.2f}MB"
                )
                return downloaded_path
            else:
                logger.error(f"Failed to download {platform_name} video")
                return None

        except Exception as e:
            logger.error(f"Error downloading {platform_name} video: {str(e)}")
            return None


async def process_social_media_video(
    message, bot, url, platform_name, progress_msg=None
):
    downloader = SimpleVideoDownloader()
    temp_video_path = None

    try:
        # Update progress
        if progress_msg:
            await safe_edit_message(progress_msg, f"Yuklanmoqda...")

        # Download video
        temp_video_path = await downloader.download_video(
            url, platform_name, message.from_user.id
        )

        if not temp_video_path:
            raise Exception("Failed to download video")

        # Check file size
        file_size_mb = get_file_size_mb(temp_video_path)
        logger.info(f"{platform_name} video size: {file_size_mb:.2f}MB")

        if progress_msg:
            await safe_edit_message(progress_msg, f"Tekshirilmoqda...")

        # Check Telegram size limit
        if file_size_mb > TELEGRAM_VIDEO_SIZE_LIMIT_MB:
            # Video is too large for Telegram
            size_limit_message = f"Juda katta ({file_size_mb:.1f}MB)\nLimiti: {TELEGRAM_VIDEO_SIZE_LIMIT_MB}MB"

            if progress_msg:
                await safe_edit_message(progress_msg, size_limit_message)
            else:
                await bot.send_message(message.chat.id, size_limit_message)

            logger.info(
                f"{platform_name} video too large: {file_size_mb:.2f}MB > {TELEGRAM_VIDEO_SIZE_LIMIT_MB}MB"
            )
            return

        if progress_msg:
            await safe_edit_message(progress_msg, f"Yuborilmoqda...")

        # Send video and document in media group (it's within size limit)
        await send_video_with_fallback(bot, message, temp_video_path, platform_name)

        # Success message
        if progress_msg:
            await safe_edit_message(
                progress_msg, f"Tayyor! ({file_size_mb:.1f}MB)"
            )

        logger.info(f"{platform_name} video processed successfully")

    except Exception as e:
        logger.error(f"Error processing {platform_name} video: {str(e)}")

        # Simple error message
        error_message = "Xatolik\nBoshqa havola yuboring"

        if progress_msg:
            await safe_edit_message(progress_msg, error_message)
        else:
            await bot.send_message(message.chat.id, error_message)

    finally:
        # Cleanup
        if temp_video_path and os.path.exists(temp_video_path):
            try:
                os.unlink(temp_video_path)
                logger.debug(f"Cleaned up: {temp_video_path}")
            except Exception as e:
                logger.warning(f"Cleanup failed: {e}")


async def send_video_with_fallback(bot, message, video_path: str, platform_name: str):
    """Send video as video format, with document as fallback if video fails"""

    # Try to send as video first with proper metadata
    try:
        import subprocess
        import json
        
        # Get video metadata using ffprobe
        try:
            result = subprocess.run(
                [
                    "ffprobe",
                    "-v", "quiet",
                    "-print_format", "json",
                    "-show_format",
                    "-show_streams",
                    video_path
                ],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                metadata = json.loads(result.stdout)
                video_stream = next(
                    (s for s in metadata.get("streams", []) if s.get("codec_type") == "video"),
                    None
                )
                
                width = None
                height = None
                duration = None
                
                if video_stream:
                    width = video_stream.get("width")
                    height = video_stream.get("height")
                
                format_info = metadata.get("format", {})
                if format_info.get("duration"):
                    duration = int(float(format_info["duration"]))
                
                video_file = FSInputFile(video_path)
                await bot.send_video(
                    chat_id=message.chat.id,
                    video=video_file,
                    width=width,
                    height=height,
                    duration=duration,
                    supports_streaming=True
                )
                logger.info(f"Video sent successfully as video (metadata: {width}x{height}, {duration}s)")
                return
            else:
                logger.warning("ffprobe failed, sending without metadata")
        except Exception as probe_error:
            logger.warning(f"Could not probe video metadata: {probe_error}")
        
        # Fallback: send without metadata
        video_file = FSInputFile(video_path)
        await bot.send_video(
            chat_id=message.chat.id,
            video=video_file,
            supports_streaming=True
        )
        logger.info("Video sent successfully as video")
        return
    except Exception as video_error:
        logger.warning(f"Failed to send as video: {video_error}")

    # If video fails, try document as fallback
    try:
        file_name = f"{platform_name.lower()}_video.mp4"
        doc_file = FSInputFile(video_path, filename=file_name)

        await bot.send_document(
            chat_id=message.chat.id,
            document=doc_file,
            disable_content_type_detection=True,
        )
        logger.info("Video sent as document (fallback)")
        return
    except Exception as doc_error:
        logger.error(f"Failed to send as document: {doc_error}")
        raise Exception(f"Failed to send video: {video_error}; Document: {doc_error}")


async def detect_platform_and_process(message, bot, url, progress_msg=None):
    # Check supported platforms
    for domain, platform_name in PLATFORM_IDENTIFIERS.items():
        if domain in url:
            await show_quality_selection(message, bot, url, platform_name, progress_msg)
            return True

    return False


async def show_quality_selection(
    message, bot, url: str, platform_name: str, progress_msg=None
):
    """Show quality selection menu to user"""
    downloader = SimpleVideoDownloader()

    try:
        # Update progress
        if progress_msg:
            await safe_edit_message(progress_msg, "Analyzing video...")

        # Get video info
        info = await downloader.get_video_info(url)

        if not info:
            raise Exception("Failed to get video information")

        # Get quality options
        quality_options = downloader.get_quality_options(info)

        if not quality_options:
            raise Exception("No quality options available")

        # Create inline keyboard
        keyboard = []
        for option in quality_options:
            button_text = f"{option['icon']} {option['quality']}{option['size']}"
            callback_data = (
                f"dl:{platform_name}:{option['format_id']}:{message.from_user.id}"
            )
            keyboard.append(
                [InlineKeyboardButton(text=button_text, callback_data=callback_data)]
            )

        reply_markup = InlineKeyboardMarkup(inline_keyboard=keyboard)

        # Store URL in temporary storage (we'll need it for callback)
        # For now, we'll pass it in the message text
        selection_text = f"📊 Select quality:\n\n🔗 {platform_name}"

        if progress_msg:
            await progress_msg.edit_text(selection_text, reply_markup=reply_markup)
        else:
            await bot.send_message(
                message.chat.id, selection_text, reply_markup=reply_markup
            )

        # Store URL temporarily (using bot data storage)
        if not hasattr(bot, "download_urls"):
            bot.download_urls = {}
        bot.download_urls[message.from_user.id] = url

    except Exception as e:
        logger.error(f"Error showing quality selection: {str(e)}")
        error_message = "Error analyzing video\nTry another link"

        if progress_msg:
            await safe_edit_message(progress_msg, error_message)
        else:
            await bot.send_message(message.chat.id, error_message)


async def handle_quality_callback(callback_query, bot):
    """Handle quality selection callback"""
    try:
        # Parse callback data: dl:platform:format_id:user_id
        parts = callback_query.data.split(":")
        if len(parts) != 4 or parts[0] != "dl":
            return

        _, platform_name, format_id, user_id = parts
        user_id = int(user_id)

        # Verify user
        if callback_query.from_user.id != user_id:
            await callback_query.answer("This is not your download", show_alert=True)
            return

        # Get stored URL
        if not hasattr(bot, "download_urls") or user_id not in bot.download_urls:
            await callback_query.answer(
                "Download expired, please send link again", show_alert=True
            )
            return

        url = bot.download_urls[user_id]

        # Answer callback immediately
        await callback_query.answer("Processing...")

        # Update message
        await callback_query.message.edit_text("⏳ Downloading...")

        # Process download
        await process_social_media_video_with_format(
            callback_query.message,
            bot,
            url,
            platform_name,
            format_id,
            callback_query.message,
        )

        # Clean up stored URL
        del bot.download_urls[user_id]

    except Exception as e:
        logger.error(f"Error handling quality callback: {str(e)}")
        await callback_query.answer("Error processing download", show_alert=True)


async def process_social_media_video_with_format(
    message, bot, url, platform_name, format_id, progress_msg=None
):
    """Process video with specific format selection"""
    downloader = SimpleVideoDownloader()
    temp_video_path = None

    try:
        # Update progress
        if progress_msg:
            await safe_edit_message(progress_msg, f"⏳ Downloading...")

        # Download video with specific format
        temp_video_path = await downloader.download_video(
            url, platform_name, message.from_user.id, format_id
        )

        if not temp_video_path:
            raise Exception("Failed to download video")

        # Check file size
        file_size_mb = get_file_size_mb(temp_video_path)
        logger.info(f"{platform_name} video size: {file_size_mb:.2f}MB")

        if progress_msg:
            await safe_edit_message(progress_msg, f"⏳ Checking...")

        # Check Telegram size limit
        if file_size_mb > TELEGRAM_VIDEO_SIZE_LIMIT_MB:
            # Video is too large for Telegram
            size_limit_message = f"❌ Too large ({file_size_mb:.1f}MB)\nLimit: {TELEGRAM_VIDEO_SIZE_LIMIT_MB}MB\n\nTry a lower quality"

            if progress_msg:
                await safe_edit_message(progress_msg, size_limit_message)
            else:
                await bot.send_message(message.chat.id, size_limit_message)

            logger.info(
                f"{platform_name} video too large: {file_size_mb:.2f}MB > {TELEGRAM_VIDEO_SIZE_LIMIT_MB}MB"
            )
            return

        if progress_msg:
            await safe_edit_message(progress_msg, f"⏳ Sending...")

        # Determine if it's audio or video
        is_audio = temp_video_path.endswith((".m4a", ".mp3", ".aac", ".ogg"))

        if is_audio:
            # Send as audio
            await send_audio_file(bot, message, temp_video_path, platform_name)
        else:
            # Send video and document
            await send_video_with_fallback(bot, message, temp_video_path, platform_name)

        # Success message
        if progress_msg:
            await safe_edit_message(progress_msg, f"✅ Sent! ({file_size_mb:.1f}MB)")

        logger.info(f"{platform_name} video processed successfully")

    except Exception as e:
        logger.error(f"Error processing {platform_name} video: {str(e)}")

        # Simple error message
        error_message = "❌ Error\nTry another link"

        if progress_msg:
            await safe_edit_message(progress_msg, error_message)
        else:
            await bot.send_message(message.chat.id, error_message)

    finally:
        # Cleanup
        if temp_video_path and os.path.exists(temp_video_path):
            try:
                os.unlink(temp_video_path)
                logger.debug(f"Cleaned up: {temp_video_path}")
            except Exception as e:
                logger.warning(f"Cleanup failed: {e}")


async def send_audio_file(bot, message, audio_path: str, platform_name: str):
    """Send audio file"""
    try:
        file_name = f"{platform_name.lower()}_audio.m4a"
        audio_file = FSInputFile(audio_path, filename=file_name)

        await bot.send_audio(chat_id=message.chat.id, audio=audio_file)
        logger.info("Audio sent successfully")
    except Exception as e:
        logger.error(f"Failed to send audio: {e}")
        # Fallback to document
        doc_file = FSInputFile(audio_path, filename=file_name)
        await bot.send_document(chat_id=message.chat.id, document=doc_file)
        logger.info("Audio sent as document")
