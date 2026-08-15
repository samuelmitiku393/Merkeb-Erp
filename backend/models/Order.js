import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
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

    // Unified order lifecycle status
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending"
    },

    // Payment tracking
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending"
    },

    // Delivery tracking
    deliveryStatus: {
      type: String,
      enum: ["pending", "shipped", "delivered"],
      default: "pending"
    },

    // Cancellation metadata
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: "" }
  },
  { timestamps: true } // adds createdAt + updatedAt automatically
);

export default mongoose.model("Order", orderSchema);