import Customer from "../models/Customer.js";
import Order from "../models/Order.js";

// CREATE CUSTOMER
export const createCustomer = async (req, res) => {
  try {
    const { name, phone, address, instagramHandle, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }

    // Prevent duplicate customers by phone or instagram handle
    const existingQuery = [{ phone }];
    if (instagramHandle && instagramHandle.trim() !== "") {
      existingQuery.push({ instagramHandle });
    }

    const existingCustomer = await Customer.findOne({ $or: existingQuery });

    if (existingCustomer) {
      return res.status(400).json({
        message: "Customer with this phone or Instagram handle already exists"
      });
    }

    const customer = new Customer({
      name,
      phone,
      address: address || "",
      instagramHandle: instagramHandle || "",
      notes: notes || ""
    });

    const savedCustomer = await customer.save();
    res.status(201).json(savedCustomer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL CUSTOMERS (with aggregated order metrics)
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });

    // Aggregate order metrics for each customer
    const customerStats = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: "$customer",
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$totalPrice" },
          lastOrderDate: { $max: "$createdAt" }
        }
      }
    ]);

    const statsMap = {};
    customerStats.forEach((stat) => {
      if (stat._id) {
        statsMap[stat._id.toString()] = stat;
      }
    });

    const enrichedCustomers = customers.map((c) => {
      const stat = statsMap[c._id.toString()] || {};
      return {
        ...c.toObject(),
        totalOrders: stat.totalOrders || 0,
        totalSpent: stat.totalSpent || 0,
        lastOrderDate: stat.lastOrderDate || null
      };
    });

    res.json(enrichedCustomers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SEARCH CUSTOMERS
export const searchCustomers = async (req, res) => {
  try {
    const keyword = req.query.q || "";

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

// GET SINGLE CUSTOMER (with order history)
export const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const orders = await Order.find({ customer: customer._id })
      .populate("items.product")
      .sort({ createdAt: -1 });

    const totalSpent = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    res.json({
      ...customer.toObject(),
      orders,
      totalOrders: orders.length,
      totalSpent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE CUSTOMER
export const updateCustomer = async (req, res) => {
  try {
    const { name, phone, address, instagramHandle, notes } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, phone, address, instagramHandle, notes },
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