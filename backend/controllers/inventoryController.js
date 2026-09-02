import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import ExcelJS from "exceljs";
import { sendTelegramDocument } from "../services/notificationService.js";

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

// DOWNLOAD PRODUCT IMPORT TEMPLATE (.xlsx)
export const downloadProductTemplate = async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Product Import Template");

        worksheet.columns = [
            { header: "Name *", key: "name", width: 25 },
            { header: "SKU", key: "sku", width: 15 },
            { header: "Category", key: "category", width: 18 },
            { header: "Team / Brand", key: "team", width: 18 },
            { header: "Selling Price *", key: "price", width: 15 },
            { header: "Cost Price *", key: "costPrice", width: 15 },
            { header: "Sizes & Stock (e.g. S:10, M:15, L:5)", key: "sizes", width: 35 },
            { header: "Description", key: "description", width: 30 },
            { header: "Image URL", key: "imageUrl", width: 30 }
        ];

        // Format Header Row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "1E88E5" }
        };
        headerRow.alignment = { vertical: "middle", horizontal: "center" };

        // Add Sample Rows
        worksheet.addRow({
            name: "Home Jersey 2026",
            sku: "JER-2026-H",
            category: "Jerseys",
            team: "Arsenal",
            price: 2500,
            costPrice: 1800,
            sizes: "S:10, M:15, L:20, XL:5",
            description: "Official 2026 Arsenal Home Kit",
            imageUrl: "https://example.com/jersey.jpg"
        });

        worksheet.addRow({
            name: "Training Tracksuit",
            sku: "TRK-2026-B",
            category: "Sportswear",
            team: "Real Madrid",
            price: 3500,
            costPrice: 2400,
            sizes: "M:8, L:12, XL:6",
            description: "Full zip breathable tracksuit",
            imageUrl: ""
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const filename = "Merkeb_Product_Import_Template.xlsx";

        // Determine Telegram chatId
        let chatId = req.headers["x-telegram-chat-id"] || req.query.chatId || req.user?.telegramId;
        if (!chatId && req.user?.id) {
            const userDoc = await User.findById(req.user.id);
            if (userDoc?.telegramId) {
                chatId = userDoc.telegramId;
            }
        }

        // Send via Telegram Bot DM asynchronously if chatId is available (non-blocking)
        if (chatId) {
            sendTelegramDocument(
                chatId,
                buffer,
                filename,
                "📊 *Merkeb ERP — Product Import Template*\nUse this Excel sheet to bulk import or update products."
            ).catch(err => console.error("Telegram document error:", err.message));
        }

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
        );

        res.send(Buffer.from(buffer));
    } catch (error) {
        console.error("Template download error:", error);
        res.status(500).json({ message: "Failed to generate template" });
    }
};

// BULK IMPORT PRODUCTS (Excel / CSV)
export const importProducts = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Please upload an Excel or CSV file" });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            return res.status(400).json({ message: "Workbook contains no worksheets" });
        }

        const rows = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row
            const values = row.values;
            // row.values is 1-indexed in ExcelJS
            rows.push({
                rowNumber,
                name: values[1] ? String(values[1]).trim() : "",
                sku: values[2] ? String(values[2]).trim() : "",
                category: values[3] ? String(values[3]).trim() : "",
                team: values[4] ? String(values[4]).trim() : "",
                price: parseFloat(values[5]) || 0,
                costPrice: parseFloat(values[6]) || 0,
                sizesStr: values[7] ? String(values[7]).trim() : "",
                description: values[8] ? String(values[8]).trim() : "",
                imageUrl: values[9] ? String(values[9]).trim() : ""
            });
        });

        if (rows.length === 0) {
            return res.status(400).json({ message: "No data rows found in uploaded file" });
        }

        let importedCount = 0;
        let updatedCount = 0;
        const errors = [];

        for (const data of rows) {
            // Validation
            if (!data.name) {
                errors.push({ row: data.rowNumber, error: "Missing required Product Name" });
                continue;
            }
            if (!data.costPrice && data.costPrice !== 0) {
                errors.push({ row: data.rowNumber, error: `Row ${data.rowNumber}: Cost price is required` });
                continue;
            }

            // Parse Sizes string (e.g. "S:10, M:15, L:5" or "Standard:20")
            const sizesArr = [];
            if (data.sizesStr) {
                const parts = data.sizesStr.split(",");
                for (const part of parts) {
                    const [sizeName, stockVal] = part.split(":");
                    if (sizeName && sizeName.trim()) {
                        sizesArr.push({
                            size: sizeName.trim(),
                            stock: parseInt(stockVal) || 0
                        });
                    }
                }
            }

            // Fallback if no sizes specified
            if (sizesArr.length === 0) {
                sizesArr.push({ size: "Standard", stock: 0 });
            }

            try {
                // Check if product exists by SKU or exact Name
                let existingProduct = null;
                if (data.sku) {
                    existingProduct = await Product.findOne({ sku: data.sku });
                }
                if (!existingProduct) {
                    existingProduct = await Product.findOne({ name: data.name });
                }

                if (existingProduct) {
                    // Update existing product
                    existingProduct.price = data.price || existingProduct.price;
                    existingProduct.costPrice = data.costPrice ?? existingProduct.costPrice;
                    if (data.category) existingProduct.category = data.category;
                    if (data.team) existingProduct.team = data.team;
                    if (data.description) existingProduct.description = data.description;
                    if (data.imageUrl) existingProduct.imageUrl = data.imageUrl;

                    // Merge sizes
                    for (const newSize of sizesArr) {
                        const idx = existingProduct.sizes.findIndex(s => s.size.toLowerCase() === newSize.size.toLowerCase());
                        if (idx >= 0) {
                            existingProduct.sizes[idx].stock = newSize.stock;
                        } else {
                            existingProduct.sizes.push(newSize);
                        }
                    }

                    await existingProduct.save();
                    updatedCount++;
                } else {
                    // Create new product
                    const newProd = new Product({
                        name: data.name,
                        sku: data.sku,
                        category: data.category,
                        team: data.team,
                        price: data.price,
                        costPrice: data.costPrice,
                        description: data.description,
                        imageUrl: data.imageUrl,
                        sizes: sizesArr
                    });
                    await newProd.save();
                    importedCount++;
                }
            } catch (err) {
                errors.push({ row: data.rowNumber, product: data.name, error: err.message });
            }
        }

        res.json({
            success: true,
            message: `Import processed: ${importedCount} created, ${updatedCount} updated, ${errors.length} skipped`,
            totalRows: rows.length,
            importedCount,
            updatedCount,
            skippedCount: errors.length,
            errors
        });
    } catch (error) {
        console.error("Bulk import products error:", error);
        res.status(500).json({ message: "Failed to process import file", error: error.message });
    }
};