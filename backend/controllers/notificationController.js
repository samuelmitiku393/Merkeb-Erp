import Product from "../models/Product.js";
import Order from "../models/Order.js";

export const getNotifications = async (req, res) => {
    try {
        const notifications = [];

        // LOW STOCK ALERTS
        const products = await Product.find();

        products.forEach((product) => {
            product.sizes.forEach((size) => {
                if (size.stock <= 3) {
                    notifications.push({
                        type: "low_stock",
                        message: `${product.name} (Size ${size.size}) is low on stock (${size.stock} left)`
                    });
                }
            });
        });

        // PENDING ORDERS ALERT
        const pendingOrders = await Order.countDocuments({
            status: "pending"
        });

        if (pendingOrders > 0) {
            notifications.push({
                type: "pending_orders",
                message: `You have ${pendingOrders} pending orders`
            });
        }

        res.json(notifications);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};