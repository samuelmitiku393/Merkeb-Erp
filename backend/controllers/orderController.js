import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import User from "../models/User.js";
import ExcelJS from "exceljs";
import { notifyLowStock, notifyNewOrder, sendTelegramDocument } from "../services/notificationService.js";

// Low-stock threshold for notifications
const LOW_STOCK_THRESHOLD = 3;

// Helper: check product sizes for low stock and fire notifications
const checkAndNotifyLowStock = async (productId) => {
  try {
    const product = await Product.findById(productId);
    if (!product) return;
    for (const sizeObj of product.sizes) {
      if (sizeObj.stock <= LOW_STOCK_THRESHOLD) {
        // Fire-and-forget — don't block the response
        notifyLowStock(product.name, sizeObj.size, sizeObj.stock).catch(() => {});
      }
    }
  } catch {
    // Non-critical — never block the main flow
  }
};

// CREATE ORDER
export const createOrder = async (req, res) => {
  const session = await Order.startSession();
  try {
    await session.startTransaction();
    const { customer, items } = req.body;

    // Basic validation
    if (!customer || !items || items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Invalid order data" });
    }

    let totalPrice = 0;
    const processedItems = [];
    const affectedProductIds = [];

    for (let item of items) {
      // 1. Validate product exists
      const product = await Product.findById(item.product).session(session);

      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({
          message: `Product not found: ${item.product}`
        });
      }

      // 2. ATOMIC stock check + deduction
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.product,
          "sizes.size": item.size,
          "sizes.stock": { $gte: item.quantity }
        },
        {
          $inc: { "sizes.$.stock": -item.quantity }
        },
        { new: true, session }
      );

      if (!updatedProduct) {
        await session.abortTransaction();
        return res.status(400).json({
          message: `Not enough stock for ${product.name} (Size: ${item.size})`
        });
      }

      // 3. SECURE pricing (never trust frontend)
      const orderItem = {
        product: item.product,
        size: item.size,
        quantity: item.quantity,
        price: product.price
      };

      processedItems.push(orderItem);
      affectedProductIds.push(item.product);

      // 4. Calculate total safely
      totalPrice += product.price * item.quantity;
    }

    // 5. Create order
    const order = new Order({
      customer,
      items: processedItems,
      totalPrice,
      paymentStatus: "pending",
      deliveryStatus: "pending"
    });

    const savedOrder = await order.save({ session });
    await session.commitTransaction();

    // 6. Fire Telegram notifications (after commit, non-blocking)
    Order.findById(savedOrder._id)
      .populate("customer")
      .populate("items.product")
      .then((populatedOrder) => {
        if (populatedOrder) notifyNewOrder(populatedOrder).catch(() => {});
      })
      .catch(() => {});

    affectedProductIds.forEach((id) => checkAndNotifyLowStock(id));

    res.status(201).json(savedOrder);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// GET ALL ORDERS — with pagination and optional status filter
export const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const query = {};
    if (status) query.status = status;

    // Build the aggregated list and total count in parallel
    const [orders, totalCount] = await Promise.all([
      Order.find(query)
        .populate("customer")
        .populate("items.product")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Order.countDocuments(query)
    ]);

    // Optional: filter by customer name/phone in memory (small datasets)
    let filtered = orders;
    if (search) {
      const term = search.toLowerCase();
      filtered = orders.filter(
        (o) =>
          o.customer?.name?.toLowerCase().includes(term) ||
          o.customer?.phone?.toLowerCase().includes(term)
      );
    }

    res.json({
      orders: filtered,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        limit: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching orders",
      error: error.message
    });
  }
};

// UPDATE ORDER STATUS
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled", "refunded"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status: ${status}` });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;

    // Keep paymentStatus and deliveryStatus in sync when possible
    if (status === "delivered") {
      order.deliveryStatus = "delivered";
    } else if (status === "shipped") {
      order.deliveryStatus = "shipped";
    } else if (status === "refunded") {
      order.paymentStatus = "refunded";
    }

    await order.save();

    res.json(order);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CANCEL ORDER — restores stock, records cancellation reason
export const cancelOrder = async (req, res) => {
  const session = await Order.startSession();
  try {
    await session.startTransaction();
    const { reason = "" } = req.body;

    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "cancelled") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Order is already cancelled" });
    }

    if (order.status === "delivered") {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Cannot cancel a delivered order. Use refund instead."
      });
    }

    // Restore stock for all items
    for (const item of order.items) {
      await Product.findOneAndUpdate(
        { _id: item.product, "sizes.size": item.size },
        { $inc: { "sizes.$.stock": item.quantity } },
        { session }
      );
    }

    order.status = "cancelled";
    order.cancelledAt = new Date();
    order.cancellationReason = reason;
    await order.save({ session });

    await session.commitTransaction();
    res.json({ message: "Order cancelled successfully", order });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      message: "Error cancelling order",
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// UPDATE ORDER - Full order update
export const updateOrder = async (req, res) => {
  const session = await Order.startSession();
  try {
    await session.startTransaction();
    const { customer, items } = req.body;
    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Order not found" });
    }

    // Calculate new total price
    let totalPrice = 0;
    const processedItems = [];

    // If items are being updated, validate stock changes
    if (items && items.length > 0) {
      for (let item of items) {
        const product = await Product.findById(item.product).session(session);

        if (!product) {
          await session.abortTransaction();
          return res.status(404).json({
            message: `Product not found: ${item.product}`
          });
        }

        // Find the existing item in the order to calculate stock difference
        const existingItem = order.items.find(
          (i) => i.product.toString() === item.product && i.size === item.size
        );

        let stockChange = 0;
        if (existingItem) {
          stockChange = existingItem.quantity - item.quantity; // positive => return stock
        } else {
          stockChange = -item.quantity; // new item, deduct stock
        }

        if (stockChange !== 0) {
          const updatedProduct = await Product.findOneAndUpdate(
            {
              _id: item.product,
              "sizes.size": item.size,
              "sizes.stock": { $gte: stockChange > 0 ? 0 : -stockChange }
            },
            { $inc: { "sizes.$.stock": stockChange } },
            { new: true, session }
          );

          if (!updatedProduct && stockChange < 0) {
            await session.abortTransaction();
            return res.status(400).json({
              message: `Not enough stock for ${product.name} (Size: ${item.size})`
            });
          }
        }

        const orderItem = {
          product: item.product,
          size: item.size,
          quantity: item.quantity,
          price: product.price
        };

        processedItems.push(orderItem);
        totalPrice += product.price * item.quantity;
      }
    } else {
      // Keep existing items if none provided
      processedItems.push(...order.items);
      totalPrice = order.totalPrice;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        customer: customer || order.customer,
        items: processedItems,
        totalPrice
      },
      { new: true, session }
    ).populate("customer").populate("items.product");

    await session.commitTransaction();
    res.json(updatedOrder);

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      message: "Error updating order",
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// DELETE ORDER
export const deleteOrder = async (req, res) => {
  const session = await Order.startSession();
  try {
    await session.startTransaction();
    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Order not found" });
    }

    // Only restore stock if not already cancelled (stock was already restored on cancel)
    if (order.status !== "cancelled") {
      for (const item of order.items) {
        await Product.findOneAndUpdate(
          {
            _id: item.product,
            "sizes.size": item.size
          },
          { $inc: { "sizes.$.stock": item.quantity } },
          { session }
        );
      }
    }

    await Order.findByIdAndDelete(req.params.id).session(session);
    await session.commitTransaction();
    res.json({ message: "Order deleted successfully" });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      message: "Error deleting order",
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// ─── BULK IMPORT HELPERS ─────────────────────────────────────────────────────

const WALK_IN_PHONE = "0000000000";
const WALK_IN_NAME  = "Walk-in Customer";

/** Finds or creates the anonymous Walk-in Customer sentinel record. */
const getOrCreateWalkInCustomer = async () => {
  let customer = await Customer.findOne({ phone: WALK_IN_PHONE });
  if (!customer) {
    customer = await Customer.create({ name: WALK_IN_NAME, phone: WALK_IN_PHONE, address: "" });
  }
  return customer;
};

/** Finds or creates a customer by phone. Falls back to Walk-in Customer when phone is blank. */
const resolveCustomer = async (name, phone, address) => {
  const cleanPhone = (phone || "").trim();
  if (!cleanPhone) return getOrCreateWalkInCustomer();

  let customer = await Customer.findOne({ phone: cleanPhone });
  if (!customer) {
    customer = await Customer.create({
      name: (name || "").trim() || WALK_IN_NAME,
      phone: cleanPhone,
      address: (address || "").trim()
    });
  }
  return customer;
};

// DOWNLOAD ORDER IMPORT TEMPLATE (.xlsx)
export const downloadOrderTemplate = async (req, res) => {
  try {
    const workbook  = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Order Import Template");

    worksheet.columns = [
      { header: "Customer Name",     key: "customerName",    width: 22 },
      { header: "Customer Phone",    key: "customerPhone",   width: 18 },
      { header: "Customer Address",  key: "customerAddress", width: 25 },
      { header: "Order Date (YYYY-MM-DD)", key: "orderDate", width: 22 },
      { header: "Status",            key: "status",          width: 14 },
      { header: "Product Name *",    key: "productName",     width: 28 },
      { header: "Size *",            key: "size",            width: 10 },
      { header: "Quantity *",        key: "quantity",        width: 12 },
      { header: "Price (ETB)",       key: "price",           width: 14 },
      { header: "Notes",             key: "notes",           width: 30 }
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font      = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "1E88E5" } };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    // Sample rows
    worksheet.addRow({
      customerName:    "Abebe Kebede",
      customerPhone:   "0911234567",
      customerAddress: "Bole, Addis Ababa",
      orderDate:       "2025-03-15",
      status:          "delivered",
      productName:     "Home Jersey 2026",
      size:            "L",
      quantity:        2,
      price:           2500,
      notes:           ""
    });
    worksheet.addRow({
      customerName:    "Abebe Kebede",
      customerPhone:   "0911234567",
      customerAddress: "Bole, Addis Ababa",
      orderDate:       "2025-03-15",
      status:          "delivered",
      productName:     "Training Tracksuit",
      size:            "M",
      quantity:        1,
      price:           3500,
      notes:           "Same order as row above — same customer + date"
    });
    worksheet.addRow({
      customerName:    "",
      customerPhone:   "",
      customerAddress: "",
      orderDate:       "2025-04-01",
      status:          "delivered",
      productName:     "Home Jersey 2026",
      size:            "S",
      quantity:        1,
      price:           "",
      notes:           "No customer info — assigned to Walk-in Customer automatically"
    });

    // Notes sheet
    const notes = workbook.addWorksheet("Instructions");
    notes.getCell("A1").value  = "BULK ORDER IMPORT — INSTRUCTIONS";
    notes.getCell("A1").font   = { bold: true, size: 13 };
    notes.getCell("A3").value  = "• Rows with the same Customer Phone AND Order Date are grouped into ONE order (multi-item).";
    notes.getCell("A4").value  = "• Leave Customer Name & Phone blank to assign the order to a Walk-in Customer.";
    notes.getCell("A5").value  = "• Product Name must match exactly as it appears in Inventory.";
    notes.getCell("A6").value  = "• Price is optional — leave blank to use the product's stored selling price.";
    notes.getCell("A7").value  = "• Status defaults to 'delivered' if blank. Valid values: pending / confirmed / shipped / delivered / cancelled / refunded";
    notes.getCell("A8").value  = "• Stock is NOT affected by this import (historical orders only).";
    notes.getCell("A9").value  = "• Order Date format: YYYY-MM-DD (e.g. 2025-03-15). Defaults to today if blank.";
    notes.getColumn("A").width = 90;

    const buffer   = await workbook.xlsx.writeBuffer();
    const filename = "Merkeb_Order_Import_Template.xlsx";

    // Send via Telegram (non-blocking)
    let chatId = req.headers["x-telegram-chat-id"] || req.query.chatId || req.user?.telegramId;
    if (!chatId && req.user?.id) {
      const userDoc = await User.findById(req.user.id);
      if (userDoc?.telegramId) chatId = userDoc.telegramId;
    }
    if (chatId) {
      sendTelegramDocument(
        chatId,
        buffer,
        filename,
        "📦 *Merkeb ERP — Order Import Template*\nUse this sheet to bulk-import historical orders."
      ).catch(err => console.error("Telegram doc error:", err.message));
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Order template error:", error);
    res.status(500).json({ message: "Failed to generate order import template" });
  }
};

// BULK IMPORT ORDERS (Excel / CSV)
export const importOrders = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an Excel or CSV file" });
    }

    const workbook  = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({ message: "Workbook contains no worksheets" });
    }

    // Parse rows (1-indexed; skip header row 1)
    const rows = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const v = row.values; // 1-indexed
      rows.push({
        rowNumber,
        customerName:    v[1]  ? String(v[1]).trim()  : "",
        customerPhone:   v[2]  ? String(v[2]).trim()  : "",
        customerAddress: v[3]  ? String(v[3]).trim()  : "",
        orderDateRaw:    v[4]  ? String(v[4]).trim()  : "",
        status:          v[5]  ? String(v[5]).trim().toLowerCase() : "delivered",
        productName:     v[6]  ? String(v[6]).trim()  : "",
        size:            v[7]  ? String(v[7]).trim()  : "",
        quantity:        parseInt(v[8])  || 0,
        priceOverride:   v[9]  ? parseFloat(v[9])     : null,
        notes:           v[10] ? String(v[10]).trim() : ""
      });
    });

    if (rows.length === 0) {
      return res.status(400).json({ message: "No data rows found in uploaded file" });
    }

    const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled", "refunded"];

    // ── Group rows into logical orders by (customerPhone|'walk-in') + orderDate ──
    // Key: "<phone>|<date>"  → { customerInfo, status, date, items[], notes }
    const orderMap = new Map();
    const errors   = [];

    for (const row of rows) {
      // Validate product columns
      if (!row.productName) {
        errors.push({ row: row.rowNumber, error: "Product Name is required" });
        continue;
      }
      if (!row.size) {
        errors.push({ row: row.rowNumber, product: row.productName, error: "Size is required" });
        continue;
      }
      if (row.quantity <= 0) {
        errors.push({ row: row.rowNumber, product: row.productName, error: "Quantity must be greater than 0" });
        continue;
      }

      // Parse date
      let orderDate = new Date();
      if (row.orderDateRaw) {
        const parsed = new Date(row.orderDateRaw);
        if (!isNaN(parsed.getTime())) orderDate = parsed;
      }
      const dateKey = orderDate.toISOString().split("T")[0]; // YYYY-MM-DD

      const phoneKey = row.customerPhone || "walk-in";
      const groupKey = `${phoneKey}|${dateKey}`;

      if (!orderMap.has(groupKey)) {
        orderMap.set(groupKey, {
          customerName:    row.customerName,
          customerPhone:   row.customerPhone,
          customerAddress: row.customerAddress,
          status:          validStatuses.includes(row.status) ? row.status : "delivered",
          orderDate,
          items:           [],
          notes:           row.notes
        });
      }

      orderMap.get(groupKey).items.push({
        productName:   row.productName,
        size:          row.size,
        quantity:      row.quantity,
        priceOverride: row.priceOverride,
        rowNumber:     row.rowNumber
      });
    }

    // ── Create Order documents ──────────────────────────────────────────────
    let importedCount = 0;
    const skippedItems = [];

    for (const [, orderData] of orderMap) {
      // Resolve customer (or walk-in fallback)
      let customerDoc;
      try {
        customerDoc = await resolveCustomer(
          orderData.customerName,
          orderData.customerPhone,
          orderData.customerAddress
        );
      } catch (err) {
        // Mark all items in this group as skipped
        orderData.items.forEach(i =>
          skippedItems.push({ row: i.rowNumber, customer: orderData.customerName || "(blank)", error: `Customer error: ${err.message}` })
        );
        continue;
      }

      // Resolve products + build order items
      const resolvedItems  = [];
      let   totalPrice     = 0;
      let   hasItemError   = false;

      for (const item of orderData.items) {
        const product = await Product.findOne({ name: item.productName });
        if (!product) {
          skippedItems.push({ row: item.rowNumber, product: item.productName, error: `Product not found: "${item.productName}"` });
          hasItemError = true;
          continue;
        }

        const sizeExists = product.sizes.some(s => s.size.toLowerCase() === item.size.toLowerCase());
        if (!sizeExists) {
          skippedItems.push({ row: item.rowNumber, product: item.productName, error: `Size "${item.size}" not found in product` });
          hasItemError = true;
          continue;
        }

        // Use overridden price or product's stored selling price
        const unitPrice = (item.priceOverride !== null && !isNaN(item.priceOverride))
          ? item.priceOverride
          : product.price;

        resolvedItems.push({
          product:  product._id,
          size:     item.size,
          quantity: item.quantity,
          price:    unitPrice
        });
        totalPrice += unitPrice * item.quantity;
      }

      // Skip entire order if ALL items errored
      if (resolvedItems.length === 0) continue;

      // Create the order — note: no stock deduction (historical import)
      try {
        await Order.create({
          customer:    customerDoc._id,
          items:       resolvedItems,
          totalPrice,
          status:      orderData.status,
          paymentStatus:  orderData.status === "delivered" ? "paid" : "pending",
          deliveryStatus: ["delivered", "shipped"].includes(orderData.status) ? orderData.status : "pending",
          createdAt:   orderData.orderDate,
          cancellationReason: orderData.notes || ""
        });
        importedCount++;
      } catch (err) {
        orderData.items.forEach(i =>
          skippedItems.push({ row: i.rowNumber, customer: orderData.customerName, error: err.message })
        );
      }
    }

    res.json({
      success:       true,
      message:       `Import processed: ${importedCount} order(s) created, ${skippedItems.length} row(s) skipped`,
      totalRows:     rows.length,
      importedCount,
      updatedCount:  0,
      skippedCount:  skippedItems.length,
      errors:        skippedItems
    });
  } catch (error) {
    console.error("Bulk import orders error:", error);
    res.status(500).json({ message: "Failed to process import file", error: error.message });
  }
};