import Product from "../models/Product.js";

// CREATE PRODUCT
export const createProduct = async (req, res) => {
  try {
    const { name, team, price, costPrice, sizes } = req.body;

    const product = new Product({
      name,
      team,
      price,
      costPrice: costPrice || 0, // Default to 0 if not provided
      sizes
    });

    const savedProduct = await product.save();

    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL PRODUCTS
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SEARCH PRODUCTS
export const searchProducts = async (req, res) => {
  try {
    const keyword = req.query.q;

    const products = await Product.find({
      name: { $regex: keyword, $options: "i" }
    });

    res.json(products);
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

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    const { name, team, price, costPrice, sizes } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update only the fields that are provided
    if (name !== undefined) product.name = name;
    if (team !== undefined) product.team = team;
    if (price !== undefined) product.price = price;
    if (costPrice !== undefined) product.costPrice = costPrice;
    if (sizes !== undefined) product.sizes = sizes;

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

// UPDATE PRODUCT STOCK (for specific size)
export const updateProductStock = async (req, res) => {
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

// BULK UPDATE STOCK
export const bulkUpdateStock = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { productId, size, stock }

    const updatePromises = updates.map(async (update) => {
      const product = await Product.findById(update.productId);
      if (product) {
        const sizeIndex = product.sizes.findIndex(s => s.size === update.size);
        if (sizeIndex !== -1) {
          product.sizes[sizeIndex].stock = update.stock;
          return product.save();
        }
      }
      return null;
    });

    await Promise.all(updatePromises);
    res.json({ message: "Stock updated successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};