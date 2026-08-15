/**
 * bot.js – Interactive Telegram Bot for Merkeb ERP
 *
 * Commands:
 *   /start    – Sends welcome message & Mini App launch button
 *   /app      – Opens the Mini App dashboard
 *   /sales    – Returns today's orders, revenue, and profit stats
 *   /stock    – Searches inventory stock by jersey or team name (e.g. /stock Arsenal)
 *   /lowstock – Lists all items with low stock (<= 3 remaining)
 *   /recent   – Lists the last 5 orders placed with customer & status
 *   /digest   – Sends the daily store sales digest
 */

import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import connectDB from '../config/db.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { sendDailySalesDigest } from '../services/notificationService.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
const appUrl = process.env.MINI_APP_URL || 'https://merkeb-erp-1.onrender.com';

if (!token) {
  console.error('❌  TELEGRAM_BOT_TOKEN is not set in .env');
  process.exit(1);
}

// Connect to MongoDB database
connectDB();

const bot = new TelegramBot(token, { polling: true });
console.log('🤖  Merkeb ERP interactive bot is running…');

// /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name ?? 'there';

  bot.sendMessage(
    chatId,
    `👋 Hi ${firstName}!\n\n` +
    `Welcome to *Merkeb ERP* Bot.\n\n` +
    `Available Admin Commands:\n` +
    `• /sales — Today's sales & profit\n` +
    `• /stock <name> — Search stock\n` +
    `• /lowstock — Low stock alert items\n` +
    `• /recent — Last 5 orders\n` +
    `• /digest — Generate daily sales summary\n\n` +
    `Tap below to open the Mini App:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          {
            text: '📊 Open Merkeb ERP',
            web_app: { url: appUrl }
          }
        ]]
      }
    }
  );
});

// /app command
bot.onText(/\/app/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '🚀 Launch Merkeb ERP Dashboard:', {
    reply_markup: {
      inline_keyboard: [[
        {
          text: '📊 Open App',
          web_app: { url: appUrl }
        }
      ]]
    }
  });
});

// /sales command — Today's financial performance
bot.onText(/\/sales/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      createdAt: { $gte: today },
      status: { $ne: 'cancelled' }
    }).populate('items.product');

    let totalRevenue = 0;
    let totalCost = 0;

    for (const order of orders) {
      totalRevenue += order.totalPrice || 0;
      for (const item of order.items) {
        totalCost += (item.product?.costPrice || 0) * item.quantity;
      }
    }

    const profit = totalRevenue - totalCost;

    bot.sendMessage(
      chatId,
      `📊 *Today's Sales Performance*\n\n` +
      `📦 *Orders Placed*: ${orders.length}\n` +
      `💰 *Total Revenue*: ${totalRevenue.toLocaleString()} ETB\n` +
      `💵 *Est. Net Profit*: ${profit.toLocaleString()} ETB`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    bot.sendMessage(chatId, `❌ Error fetching sales data: ${err.message}`);
  }
});

// /stock command — Search product stock
bot.onText(/\/stock(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1]?.trim();

  try {
    const filter = query
      ? {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { team: { $regex: query, $options: 'i' } }
          ]
        }
      : {};

    const products = await Product.find(filter).limit(5);

    if (products.length === 0) {
      return bot.sendMessage(chatId, `🔍 No products found matching "${query || ''}".`);
    }

    let response = `📦 *Stock Search Results*:\n\n`;
    for (const p of products) {
      response += `👕 *${p.name}* (${p.team || 'No team'})\n`;
      const sizeStr = p.sizes.map(s => `${s.size}: *${s.stock}*`).join(' | ');
      response += `   Stock: ${sizeStr}\n\n`;
    }

    bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
  } catch (err) {
    bot.sendMessage(chatId, `❌ Error searching stock: ${err.message}`);
  }
});

// /lowstock command — List items with stock <= 3
bot.onText(/\/lowstock/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const products = await Product.find();
    const lowStock = [];

    for (const p of products) {
      for (const s of p.sizes) {
        if (s.stock <= 3) {
          lowStock.push({ name: p.name, size: s.size, stock: s.stock });
        }
      }
    }

    if (lowStock.length === 0) {
      return bot.sendMessage(chatId, `✅ *Stock is healthy!* No items below threshold.`);
    }

    let response = `⚠️ *Low Stock Items (<= 3 remaining)*:\n\n`;
    for (const item of lowStock) {
      const emoji = item.stock === 0 ? '🚨' : '⚠️';
      response += `${emoji} *${item.name}* (Size: ${item.size}) — *${item.stock} left*\n`;
    }

    bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
  } catch (err) {
    bot.sendMessage(chatId, `❌ Error fetching low stock: ${err.message}`);
  }
});

// /recent command — Show last 5 orders
bot.onText(/\/recent/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer');

    if (orders.length === 0) {
      return bot.sendMessage(chatId, `📦 No orders placed yet.`);
    }

    let response = `🛒 *Recent 5 Orders*:\n\n`;
    for (const o of orders) {
      const customer = o.customer?.name || 'Unknown';
      const statusEmoji = o.status === 'delivered' ? '✅' : o.status === 'cancelled' ? '❌' : '⏳';
      response += `${statusEmoji} *${customer}* — ${o.totalPrice} ETB (${o.status.toUpperCase()})\n`;
    }

    bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
  } catch (err) {
    bot.sendMessage(chatId, `❌ Error fetching recent orders: ${err.message}`);
  }
});

// /digest command — Send daily digest
bot.onText(/\/digest/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const digestText = await sendDailySalesDigest();
    if (digestText) {
      bot.sendMessage(chatId, `✅ *Daily digest sent to admins!*`);
    } else {
      bot.sendMessage(chatId, `⚠️ Failed to generate digest.`);
    }
  } catch (err) {
    bot.sendMessage(chatId, `❌ Error sending digest: ${err.message}`);
  }
});

// Handle polling errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});
