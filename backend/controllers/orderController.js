import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { notifyLowStock, notifyNewOrder } from "../services/notificationService.js";

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