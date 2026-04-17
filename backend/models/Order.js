import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      size: String,
      quantity: Number,
      price: Number
    }
  ],
  totalPrice: Number,
  status: {
    type: String,
    enum: ["pending", "confirmed", "shipped", "delivered"],
    default: "pending"
  },
  createdAt: { type: Date, default: Date.now },

paymentStatus: {
  type: String,
  enum: ["pending", "paid"],
  default: "pending"
},
deliveryStatus: {
  type: String,
  enum: ["pending", "shipped", "delivered"],
  default: "pending"
}}
);

export default mongoose.model("Order", orderSchema);