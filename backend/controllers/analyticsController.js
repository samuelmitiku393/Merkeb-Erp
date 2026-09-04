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
        const orders = await Order.find({ status: { $nin: ["cancelled", "refunded"] } }).populate("items.product");

        const productStats = {};

        orders.forEach((order) => {
            order.items.forEach((item) => {
                if (!item.product) return;
                const productId = item.product._id.toString();
                const productName = item.product.name;
                const effectivePrice = item.price !== undefined && item.price !== null ? item.price : (item.product.price || 0);

                if (!productStats[productId]) {
                    productStats[productId] = {
                        productId,
                        productName,
                        totalQuantity: 0,
                        totalRevenue: 0
                    };
                }

                productStats[productId].totalQuantity += item.quantity;
                productStats[productId].totalRevenue += item.quantity * effectivePrice;
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
        const orders = await Order.find({ status: { $nin: ["cancelled", "refunded"] } }).populate("items.product");

        let totalRevenue = 0;
        let totalCost = 0;

        orders.forEach((order) => {
            // Revenue takes into account order-level discounts and negotiated prices
            if (typeof order.totalPrice === "number" && !isNaN(order.totalPrice)) {
                totalRevenue += order.totalPrice;
            }

            order.items.forEach((item) => {
                const product = item.product;
                const cost = item.quantity * ((product && product.costPrice) || 0);
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