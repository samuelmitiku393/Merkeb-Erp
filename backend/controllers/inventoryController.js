import Product from "../models/Product.js";
import Order from "../models/Order.js";

const LOW_STOCK_THRESHOLD = 3;

// GET LOW STOCK ITEMS
export const getLowStockItems = async (req, res) => {
    try {
        const products = await Product.find();
        const lowStockItems = [];

        products.forEach((product) => {
            product.sizes.forEach((sizeObj) => {
                if (sizeObj.stock <= LOW_STOCK_THRESHOLD) {
                    lowStockItems.push({
                        productId: product._id,
                        productName: product.name,
                        team: product.team,
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

// GET RESTOCK SUGGESTIONS
export const getRestockSuggestions = async (req, res) => {
    try {
        const orders = await Order.find();
        const products = await Product.find();

        const productSales = {};

        orders.forEach((order) => {
            order.items.forEach((item) => {
                const id = item.product.toString();
                if (!productSales[id]) productSales[id] = 0;
                productSales[id] += item.quantity;
            });
        });

        const suggestions = [];

        products.forEach((product) => {
            let totalSold = productSales[product._id.toString()] || 0;
            const estimatedDailyDemand = totalSold / 30;

            product.sizes.forEach((size) => {
                const currentStock = size.stock;
                const suggestedStock = Math.ceil(estimatedDailyDemand * 14);
                const reorderQty = Math.max(suggestedStock - currentStock, 0);

                if (reorderQty > 0) {
                    suggestions.push({
                        productId: product._id,
                        productName: product.name,
                        team: product.team,
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

// GET ALL PRODUCTS — with pagination, search, and category filter
export const getProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            category,
            team
        } = req.query;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

        const query = {};
        if (category) query.category = { $regex: category, $options: "i" };
        if (team) query.team = { $regex: team, $options: "i" };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { team: { $regex: search, $options: "i" } },
                { sku: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } }
            ];
        }

        const [products, totalCount] = await Promise.all([
            Product.find(query)
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum),
            Product.countDocuments(query)
        ]);

        res.json({
            products,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalCount / limitNum),
                totalCount,
                limit: limitNum
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET SINGLE PRODUCT
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

// CREATE PRODUCT
export const createProduct = async (req, res) => {
    try {
        const product = new Product({
            name: req.body.name,
            team: req.body.team,
            sku: req.body.sku,
            category: req.body.category,
            description: req.body.description,
            imageUrl: req.body.imageUrl,
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

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        product.name = req.body.name ?? product.name;
        product.team = req.body.team ?? product.team;
        product.sku = req.body.sku ?? product.sku;
        product.category = req.body.category ?? product.category;
        product.description = req.body.description ?? product.description;
        product.imageUrl = req.body.imageUrl ?? product.imageUrl;
        product.price = req.body.price !== undefined ? req.body.price : product.price;
        product.costPrice = req.body.costPrice !== undefined ? req.body.costPrice : product.costPrice;
        product.sizes = req.body.sizes ?? product.sizes;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// DELETE PRODUCT
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

// UPDATE STOCK FOR A SPECIFIC SIZE
export const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { size, stock } = req.body;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const sizeIndex = product.sizes.findIndex((s) => s.size === size);
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

// BULK UPDATE STOCK — Array of { productId, size, stock }
export const bulkUpdateStock = async (req, res) => {
    try {
        const updates = req.body.updates;

        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({ message: "No updates provided" });
        }

        const results = [];
        const errors = [];

        for (const update of updates) {
            try {
                const product = await Product.findById(update.productId);
                if (!product) {
                    errors.push({ productId: update.productId, error: "Product not found" });
                    continue;
                }

                const sizeIndex = product.sizes.findIndex((s) => s.size === update.size);
                if (sizeIndex === -1) {
                    errors.push({ productId: update.productId, size: update.size, error: "Size not found" });
                    continue;
                }

                product.sizes[sizeIndex].stock = update.stock;
                const saved = await product.save();
                results.push({ productId: update.productId, size: update.size, newStock: update.stock });
            } catch (err) {
                errors.push({ productId: update.productId, error: err.message });
            }
        }

        res.json({
            message: `Updated ${results.length} items, ${errors.length} errors`,
            updated: results,
            errors
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};