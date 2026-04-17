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