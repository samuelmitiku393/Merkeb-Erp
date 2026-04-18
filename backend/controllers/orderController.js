import Order from "../models/Order.js";
import Product from "../models/Product.js";

// CREATE ORDER
export const createOrder = async (req, res) => {
  try {
    const { customer, items } = req.body;

    // Basic validation
    if (!customer || !items || items.length === 0) {
      return res.status(400).json({ message: "Invalid order data" });
    }

    let totalPrice = 0;
    const processedItems = [];

    for (let item of items) {
      // 1. Validate product exists
      const product = await Product.findById(item.product);

      if (!product) {
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
        { new: true }
      );

      if (!updatedProduct) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name} (Size: ${item.size})`
        });
      }

      // 3. SECURE pricing (never trust frontend)
      const productPrice = product.price;

      const orderItem = {
        product: item.product,
        size: item.size,
        quantity: item.quantity,
        price: productPrice
      };

      processedItems.push(orderItem);

      // 4. Calculate total safely
      totalPrice += productPrice * item.quantity;
    }

    // 5. Create order
    const order = new Order({
      customer,
      items: processedItems,
      totalPrice,
      paymentStatus: "pending",
      deliveryStatus: "pending"
    });

    const savedOrder = await order.save();

    res.status(201).json(savedOrder);

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// GET ALL ORDERS
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer")
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching orders",
      error: error.message
    });
  }
};
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    res.json(order);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// UPDATE ORDER - Full order update
export const updateOrder = async (req, res) => {
  try {
    const { customer, items } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Calculate new total price
    let totalPrice = 0;
    const processedItems = [];

    // If items are being updated, validate stock changes
    if (items && items.length > 0) {
      for (let item of items) {
        const product = await Product.findById(item.product);
        
        if (!product) {
          return res.status(404).json({
            message: `Product not found: ${item.product}`
          });
        }

        // Find the existing item in the order to calculate stock difference
        const existingItem = order.items.find(
          i => i.product.toString() === item.product && i.size === item.size
        );

        let stockChange = 0;
        if (existingItem) {
          // If quantity decreased, stock increases (positive change)
          // If quantity increased, stock decreases (negative change)
          stockChange = existingItem.quantity - item.quantity;
        } else {
          // New item - decrease stock
          stockChange = -item.quantity;
        }

        // Update stock if needed
        if (stockChange !== 0) {
          const updatedProduct = await Product.findOneAndUpdate(
            {
              _id: item.product,
              "sizes.size": item.size,
              "sizes.stock": { $gte: stockChange > 0 ? 0 : -stockChange }
            },
            {
              $inc: { "sizes.$.stock": stockChange }
            },
            { new: true }
          );

          if (!updatedProduct && stockChange < 0) {
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
      // If no items provided, keep existing items
      processedItems.push(...order.items);
      totalPrice = order.totalPrice;
    }

    // Update order
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        customer: customer || order.customer,
        items: processedItems,
        totalPrice: totalPrice
      },
      { new: true }
    ).populate("customer").populate("items.product");

    res.json(updatedOrder);

  } catch (error) {
    res.status(500).json({
      message: "Error updating order",
      error: error.message
    });
  }
};

// DELETE ORDER
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Restore stock for all items in the order
    for (let item of order.items) {
      await Product.findOneAndUpdate(
        {
          _id: item.product,
          "sizes.size": item.size
        },
        {
          $inc: { "sizes.$.stock": item.quantity }
        }
      );
    }

    await Order.findByIdAndDelete(req.params.id);

    res.json({ message: "Order deleted successfully" });

  } catch (error) {
    res.status(500).json({
      message: "Error deleting order",
      error: error.message
    });
  }
};