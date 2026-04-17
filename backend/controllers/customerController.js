import Customer from "../models/Customer.js";

// CREATE CUSTOMER
export const createCustomer = async (req, res) => {
  try {
    const { name, phone, address, instagramHandle } = req.body;

    // Prevent duplicate customers (basic check)
    const existingCustomer = await Customer.findOne({
      $or: [{ phone }, { instagramHandle }]
    });

    if (existingCustomer) {
      return res.status(400).json({
        message: "Customer already exists"
      });
    }

    const customer = new Customer({
      name,
      phone,
      address,
      instagramHandle
    });

    const savedCustomer = await customer.save();

    res.status(201).json(savedCustomer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL CUSTOMERS
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const searchCustomers = async (req, res) => {
  try {
    const keyword = req.query.q;

    const customers = await Customer.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { instagramHandle: { $regex: keyword, $options: "i" } }
      ]
    });

    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};