/**
 * bot.js – Minimal Telegram bot that sends users a "Launch Merkeb ERP" button.
 *
 * Setup:
 *   1. npm install node-telegram-bot-api dotenv (run from the backend directory)
 *   2. Set TELEGRAM_BOT_TOKEN in backend/.env
 *   3. Set MINI_APP_URL in backend/.env to your deployed frontend URL
 *   4. node scripts/bot.js
 *
 * Commands handled:
 *   /start – sends a welcome message with the Web App launch button
 *   /app   – same as /start, opens the Mini App
 */

import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN;
const appUrl = process.env.MINI_APP_URL || 'https://your-frontend-url.vercel.app';

if (!token) {
  console.error('❌  TELEGRAM_BOT_TOKEN is not set in .env');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log('🤖  Merkeb ERP bot is running…');

// /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name ?? 'there';

  bot.sendMessage(chatId, `👋 Hi ${firstName}!\n\nWelcome to *Merkeb ERP* – your business management system.\n\nTap the button below to open the app.`, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        {
          text: '📊 Open Merkeb ERP',
          web_app: { url: appUrl },
        }
      ]]
    }
  });
});

// /app command – same as /start
bot.onText(/\/app/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '🚀 Open the Merkeb ERP dashboard:', {
    reply_markup: {
      inline_keyboard: [[
        {
          text: '📊 Launch App',
          web_app: { url: appUrl },
        }
      ]]
    }
  });
});

// Handle polling errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});
