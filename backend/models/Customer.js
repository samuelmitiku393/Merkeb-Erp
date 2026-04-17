import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  address: String,
  instagramHandle: String
});

export default mongoose.model("Customer", customerSchema);