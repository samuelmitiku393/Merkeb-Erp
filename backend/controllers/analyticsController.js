import Order from "../models/Order.js";

export const getDashboardStats = async (req, res) => {
    try {
        const orders = await Order.find();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // TODAY ORDERS
        const todayOrders = orders.filter(
            (o) => new Date(o.createdAt) >= today
        );

        // TOTAL REVENUE TODAY
        const revenue = todayOrders.reduce(
            (sum, order) => sum + order.totalPrice,
            0
        );

        // PENDING ORDERS
        const pending = orders.filter(
            (o) => o.status === "pending"
        ).length;

        // BEST SELLING PRODUCT
        const productMap = {};

        orders.forEach((order) => {
            order.items.forEach((item) => {
                const id = item.product.toString();
                productMap[id] = (productMap[id] || 0) + item.quantity;
            });
        });

        const bestProductId = Object.keys(productMap).reduce(
            (a, b) => (productMap[a] > productMap[b] ? a : b),
            Object.keys(productMap)[0]
        );

        res.json({
            totalOrders: orders.length,
            todayOrders: todayOrders.length,
            revenue,
            pendingOrders: pending,
            bestProduct: bestProductId,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getProductPerformance = async (req, res) => {
    try {
        const orders = await Order.find().populate("items.product");

        const productStats = {};

        orders.forEach((order) => {
            order.items.forEach((item) => {
                const productId = item.product._id.toString();
                const productName = item.product.name;

                if (!productStats[productId]) {
                    productStats[productId] = {
                        productId,
                        productName,
                        totalQuantity: 0,
                        totalRevenue: 0
                    };
                }

                productStats[productId].totalQuantity += item.quantity;
                productStats[productId].totalRevenue +=
                    item.quantity * (item.product.price || 0);
            });
        });

        const result = Object.values(productStats).sort(
            (a, b) => b.totalRevenue - a.totalRevenue
        );

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getProfitStats = async (req, res) => {
    try {
        const orders = await Order.find().populate("items.product");

        let totalRevenue = 0;
        let totalCost = 0;

        orders.forEach((order) => {
            order.items.forEach((item) => {
                const product = item.product;

                const revenue = item.quantity * (product.price || 0);
                const cost = item.quantity * (product.costPrice || 0);

                totalRevenue += revenue;
                totalCost += cost;
            });
        });

        const profit = totalRevenue - totalCost;

        res.json({
            totalRevenue,
            totalCost,
            profit,
            profitMargin:
                totalRevenue > 0
                    ? ((profit / totalRevenue) * 100).toFixed(2)
                    : 0
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};