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
      address: address || '',
      instagramHandle: instagramHandle || ''
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
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SEARCH CUSTOMERS
export const searchCustomers = async (req, res) => {
  try {
    const keyword = req.query.q;

    const customers = await Customer.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { phone: { $regex: keyword, $options: "i" } },
        { instagramHandle: { $regex: keyword, $options: "i" } },
        { address: { $regex: keyword, $options: "i" } }
      ]
    }).sort({ createdAt: -1 });

    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE CUSTOMER
export const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE CUSTOMER
export const updateCustomer = async (req, res) => {
  try {
    const { name, phone, address, instagramHandle } = req.body;
    
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, phone, address, instagramHandle },
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE CUSTOMER
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};