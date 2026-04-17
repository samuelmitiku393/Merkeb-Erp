import mongoose from "mongoose";

const sizeSchema = new mongoose.Schema({
  size: String,
  stock: Number
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  team: String,
  price: Number,
  costPrice: {
    type: Number,
    required: true,
    default: 0
  },
  sizes: [sizeSchema],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Product", productSchema);