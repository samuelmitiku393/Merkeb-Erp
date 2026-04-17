import Product from "../models/Product.js";
import Order from "../models/Order.js";
export const getLowStockItems = async (req, res) => {
    try {
        const products = await Product.find();

        const lowStockItems = [];

        products.forEach((product) => {
            product.sizes.forEach((sizeObj) => {
                if (sizeObj.stock <= 3) {
                    lowStockItems.push({
                        productId: product._id,
                        productName: product.name,
                        size: sizeObj.size,
                        stock: sizeObj.stock
                    });
                }
            });
        });

        res.json(lowStockItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getRestockSuggestions = async (req, res) => {
    try {
        const orders = await Order.find();
        const products = await Product.find();

        const productSales = {};

        // STEP 1: Calculate total sales per product
        orders.forEach((order) => {
            order.items.forEach((item) => {
                const id = item.product.toString();

                if (!productSales[id]) {
                    productSales[id] = 0;
                }

                productSales[id] += item.quantity;
            });
        });

        const suggestions = [];

        // STEP 2: Build restock logic
        products.forEach((product) => {
            let totalSold = productSales[product._id.toString()] || 0;

            // Avoid division errors
            const estimatedDailyDemand = totalSold / 30; // simplistic monthly avg

            product.sizes.forEach((size) => {
                const currentStock = size.stock;

                // Safety stock = 7 days of demand
                const safetyStock = estimatedDailyDemand * 7;

                const suggestedStock = Math.ceil(
                    estimatedDailyDemand * 14 // 2 weeks coverage
                );

                const reorderQty = Math.max(
                    suggestedStock - currentStock,
                    0
                );

                if (reorderQty > 0) {
                    suggestions.push({
                        productId: product._id,
                        productName: product.name,
                        size: size.size,
                        currentStock,
                        estimatedDailyDemand: estimatedDailyDemand.toFixed(2),
                        reorderQty
                    });
                }
            });
        });

        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Get all products
export const getProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single product
export const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create product
export const createProduct = async (req, res) => {
    try {
        const product = new Product({
            name: req.body.name,
            team: req.body.team,
            price: req.body.price,
            costPrice: req.body.costPrice,
            sizes: req.body.sizes
        });

        const newProduct = await product.save();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update product
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        product.name = req.body.name || product.name;
        product.team = req.body.team || product.team;
        product.price = req.body.price !== undefined ? req.body.price : product.price;
        product.costPrice = req.body.costPrice !== undefined ? req.body.costPrice : product.costPrice;
        product.sizes = req.body.sizes || product.sizes;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete product
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        await product.deleteOne();
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update stock for specific size
export const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { size, stock } = req.body;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const sizeIndex = product.sizes.findIndex(s => s.size === size);
        if (sizeIndex === -1) {
            return res.status(404).json({ message: "Size not found" });
        }

        product.sizes[sizeIndex].stock = stock;
        await product.save();

        res.json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Bulk update stock
export const bulkUpdateStock = async (req, res) => {
    try {
        const updates = req.body.updates; // Array of { productId, size, stock }

        const updatePromises = updates.map(async (update) => {
            const product = await Product.findById(update.productId);
            if (product) {
                const sizeIndex = product.sizes.findIndex(s => s.size === update.size);
                if (sizeIndex !== -1) {
                    product.sizes[sizeIndex].stock = update.stock;
                    return product.save();
                }
            }
        });

        await Promise.all(updatePromises);
        res.json({ message: "Stock updated successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};