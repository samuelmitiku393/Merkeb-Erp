import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        size: String,
        quantity: Number,
        price: Number, // Actual negotiated selling price
        originalPrice: { type: Number, default: 0 }, // Catalog price at order creation
        discount: { type: Number, default: 0 } // Item discount/variance
      }
    ],
    subtotal: { type: Number, default: 0 }, // Sum of items (qty * price) before order discounts
    discount: { type: Number, default: 0 }, // Order-level discount amount
    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
      default: "fixed"
    },
    adjustment: { type: Number, default: 0 }, // Extra charges/fees or custom adjustment
    totalPrice: { type: Number, required: true }, // Final payable total
    negotiationNotes: { type: String, default: "" }, // Negotiation reason/notes

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