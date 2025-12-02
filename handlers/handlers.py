# handlers.py - FREE version

from aiogram import Bot, types, F
from aiogram.filters.command import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
    CallbackQuery,
)

from config import PLATFORM_IDENTIFIERS
from handlers.social_media.video_processor import (
    detect_platform_and_process,
    handle_quality_callback,
)
from utils.user_management import (
    check_channel_subscription,
    increment_download_count,
)
from utils.common_utils import ensure_user_exists, handle_errors


class DownloadVideo(StatesGroup):
    waiting_for_link = State()


async def send_welcome(message: Message, state: FSMContext):
    # Ensure user exists in database
    ensure_user_exists(message)
    welcome_text = "👋 Assalomu aleykum!\n\n📥 Instagram, TikTok, YouTube va Pinterest'dan video yuklab olishingiz mumkin.\n\n📎 Havola yuboring va videoni oling!\n\n👨‍💻 Murojaat uchun: @imurodl"

    await message.answer(welcome_text, parse_mode="Markdown")


@handle_errors("Xatolik\nBoshqa havola yuboring")
async def process_video_link(message: Message, state: FSMContext):
    # Ensure user exists in database
    user = ensure_user_exists(message)
    user_id = user["user_id"]
    url = message.text.strip()

    # Check channel subscription (always returns True in FREE version)
    if not await check_channel_subscription(user_id, message.bot):
        return

    # Send processing message
    progress_msg = await message.answer("Yuklanmoqda...")

    # Detect platform and process video
    platform_detected = await detect_platform_and_process(
        message, message.bot, url, progress_msg
    )

    if not platform_detected:
        # Platform not supported
        supported_platforms = ", ".join(set(PLATFORM_IDENTIFIERS.values()))
        await progress_msg.edit_text(
            f"❌ Bu platforma qo'llab-quvvatlanmaydi\n\n✅ Qo'llab-quvvatlanadigan platformalar:\n{supported_platforms}", parse_mode="Markdown"
        )
        return

    # Increment download counter
    increment_download_count(user_id)


async def handle_callback(callback_query: CallbackQuery):
    """Handle callback queries (quality selection)"""
    if callback_query.data.startswith("dl:"):
        await handle_quality_callback(callback_query, callback_query.bot)


def register_handlers(dp):
    from aiogram.filters import Command
    from aiogram import F

    # Commands
    dp.message.register(send_welcome, Command("start"))

    # Callback queries (quality selection)
    dp.callback_query.register(handle_callback, F.data.startswith("dl:"))

    # Video link processing (any message that contains URLs)
    dp.message.register(process_video_link, F.text.regexp(r"https?://"))

    # Fallback for other messages
    dp.message.register(send_welcome)

    print("Main handlers registered")


# Export functions for main router
__all__ = ["DownloadVideo", "send_welcome", "process_video_link", "register_handlers"]
