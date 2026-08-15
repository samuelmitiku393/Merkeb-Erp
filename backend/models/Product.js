import mongoose from "mongoose";

const sizeSchema = new mongoose.Schema({
  size: String,
  stock: { type: Number, default: 0 }
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    team: { type: String, default: "" },
    sku: { type: String, default: "" },
    category: { type: String, default: "" },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    price: { type: Number, required: true, default: 0 },
    costPrice: {
      type: Number,
      required: true,
      default: 0
    },
    sizes: [sizeSchema]
  },
  { timestamps: true } // adds createdAt + updatedAt automatically
);

export default mongoose.model("Product", productSchema);