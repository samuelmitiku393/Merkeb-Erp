/**
 * Telegram Push Notification Service
 *
 * Sends messages to Telegram users/groups via the Bot API.
 * Requires TELEGRAM_BOT_TOKEN in .env to function.
 */

import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * Send a message to a single Telegram chat ID.
 */
export const sendTelegramMessage = async (chatId, text) => {
  if (!BOT_TOKEN || BOT_TOKEN === "your-telegram-bot-token-here") {
    console.log("[Notification] Telegram bot token not configured — skipping notification.");
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown"
      })
    });

    const data = await response.json();
    if (!data.ok) {
      console.error("[Notification] Telegram API error:", data.description);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Notification] Failed to send Telegram message:", err.message);
    return false;
  }
};

/**
 * Send an Excel / document file buffer directly to a Telegram user's DM.
 */
export const sendTelegramDocument = async (chatId, fileBuffer, filename, caption = "") => {
  if (!BOT_TOKEN || BOT_TOKEN === "your-telegram-bot-token-here") {
    console.log("[Notification] Telegram bot token not configured — skipping document send.");
    return false;
  }

  try {
    const formData = new FormData();
    formData.append("chat_id", String(chatId));

    // Convert Buffer to Uint8Array Blob for global FormData / fetch in Node.js
    const blob = new Blob([fileBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    formData.append("document", blob, filename);

    if (caption) {
      formData.append("caption", caption);
      formData.append("parse_mode", "Markdown");
    }

    const response = await fetch(`${TELEGRAM_API}/sendDocument`, {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    if (!data.ok) {
      console.error("[Notification] Telegram sendDocument error:", data.description);
      return false;
    }
    console.log(`[Notification] Successfully sent ${filename} to Telegram chatId ${chatId}`);
    return true;
  } catch (err) {
    console.error("[Notification] Failed to send Telegram document:", err.message);
    return false;
  }
};

/**
 * Broadcast a message to all admin users who have a linked Telegram ID.
 */
export const notifyAdmins = async (text) => {
  if (!BOT_TOKEN || BOT_TOKEN === "your-telegram-bot-token-here") {
    console.log("[Notification] Telegram bot not configured — skipping admin notification.");
    return;
  }

  try {
    const admins = await User.find({
      role: "admin",
      telegramId: { $ne: null }
    }).select("telegramId username");

    if (admins.length === 0) {
      console.log("[Notification] No admin users with Telegram linked found.");
      return;
    }

    const results = await Promise.allSettled(
      admins.map((admin) => sendTelegramMessage(admin.telegramId, text))
    );

    const succeeded = results.filter((r) => r.status === "fulfilled" && r.value).length;
    console.log(`[Notification] Sent to ${succeeded}/${admins.length} admins.`);
  } catch (err) {
    console.error("[Notification] Error fetching admins for notification:", err.message);
  }
};

/**
 * Send a low-stock alert for a specific product size.
 */
export const notifyLowStock = async (productName, size, currentStock) => {
  const emoji = currentStock === 0 ? "🚨" : "⚠️";
  const statusText = currentStock === 0 ? "OUT OF STOCK" : `only *${currentStock}* left`;
  const message =
    `${emoji} *Low Stock Alert*\n\n` +
    `Product: *${productName}* (Size: ${size})\n` +
    `Status: ${statusText}\n\n` +
    `Please restock soon.`;
  await notifyAdmins(message);
};

/**
 * Send a new order notification.
 */
export const notifyNewOrder = async (order) => {
  const customerName = order.customer?.name || "Unknown Customer";
  const itemsList = order.items
    .map((i) => {
      const priceTag = i.price !== undefined ? ` @ ${i.price} ETB` : "";
      const origTag = i.originalPrice && i.originalPrice !== i.price ? ` _(list: ${i.originalPrice} ETB)_` : "";
      return `• ${i.product?.name || "Item"} (${i.size}) x${i.quantity}${priceTag}${origTag}`;
    })
    .join("\n");

  let pricingBreakdown = `Total: *${order.totalPrice} ETB*`;
  if (order.discount > 0) {
    pricingBreakdown += `\nDiscount: *-${order.discount} ETB*`;
  }
  if (order.adjustment && order.adjustment !== 0) {
    pricingBreakdown += `\nAdjustment: *${order.adjustment > 0 ? "+" : ""}${order.adjustment} ETB*`;
  }
  if (order.negotiationNotes) {
    pricingBreakdown += `\nNote: _${order.negotiationNotes}_`;
  }

  const message =
    `🛒 *New Order Placed*\n\n` +
    `Customer: *${customerName}*\n` +
    `${pricingBreakdown}\n\n` +
    `Items:\n${itemsList}`;
  await notifyAdmins(message);
};

/**
 * Send a daily sales digest to Telegram admins.
 */
export const sendDailySalesDigest = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      createdAt: { $gte: today },
      status: { $ne: "cancelled" }
    }).populate("items.product");

    const totalOrders = orders.length;
    let totalRevenue = 0;
    let totalCost = 0;
    const itemSales = {};

    for (const order of orders) {
      totalRevenue += order.totalPrice || 0;
      for (const item of order.items) {
        const prod = item.product;
        const costPrice = prod?.costPrice || 0;
        totalCost += costPrice * item.quantity;

        const name = prod?.name || "Unknown Item";
        if (!itemSales[name]) itemSales[name] = 0;
        itemSales[name] += item.quantity;
      }
    }

    const netProfit = totalRevenue - totalCost;

    // Find top selling product
    let topSeller = "N/A";
    let maxQty = 0;
    for (const [name, qty] of Object.entries(itemSales)) {
      if (qty > maxQty) {
        maxQty = qty;
        topSeller = `${name} (${qty} sold)`;
      }
    }

    const dateStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const message =
      `📊 *Daily Merkeb ERP Digest* (${dateStr})\n` +
      `-----------------------------------\n` +
      `📦 *Orders Today*: ${totalOrders}\n` +
      `💰 *Total Revenue*: ${totalRevenue.toLocaleString()} ETB\n` +
      `💵 *Net Profit*: ${netProfit.toLocaleString()} ETB\n` +
      `🔥 *Top Seller*: ${topSeller}\n` +
      `-----------------------------------\n` +
      `Keep up the great work! 🚀`;

    await notifyAdmins(message);
    return message;
  } catch (err) {
    console.error("[Notification] Error generating daily sales digest:", err.message);
    return null;
  }
};
