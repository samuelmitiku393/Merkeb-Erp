import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      default: ""
    },
    instagramHandle: {
      type: String,
      default: ""
    },
    notes: {
      type: String,
      default: ""
    }
  },
  { timestamps: true } // adds createdAt + updatedAt automatically
);

export default mongoose.model("Customer", customerSchema);