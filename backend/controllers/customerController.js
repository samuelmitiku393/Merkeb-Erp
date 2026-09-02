import Customer from "../models/Customer.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import ExcelJS from "exceljs";
import { sendTelegramDocument } from "../services/notificationService.js";

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

// DOWNLOAD CUSTOMER IMPORT TEMPLATE (.xlsx)
export const downloadCustomerTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Customer Import Template");

    worksheet.columns = [
      { header: "Name *", key: "name", width: 25 },
      { header: "Phone Number *", key: "phone", width: 20 },
      { header: "Address", key: "address", width: 30 },
      { header: "Instagram Handle", key: "instagramHandle", width: 22 },
      { header: "Notes", key: "notes", width: 30 }
    ];

    // Header styling
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2E7D32" } // Green header
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    // Sample rows
    worksheet.addRow({
      name: "Abebe Bikila",
      phone: "+251911223344",
      address: "Bole Medhanialem, Addis Ababa",
      instagramHandle: "@abebe_b",
      notes: "VIP customer - prefers morning delivery"
    });

    worksheet.addRow({
      name: "Tigist Assefa",
      phone: "+251922334455",
      address: "Kazanchis, Addis Ababa",
      instagramHandle: "@tigist_a",
      notes: "Referred by social media"
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = "Merkeb_Customer_Import_Template.xlsx";

    // Determine Telegram chatId
    let chatId = req.headers["x-telegram-chat-id"] || req.query.chatId || req.user?.telegramId;
    if (!chatId && req.user?.id) {
      const userDoc = await User.findById(req.user.id);
      if (userDoc?.telegramId) {
        chatId = userDoc.telegramId;
      }
    }

    // Send via Telegram Bot DM if chatId is available
    if (chatId) {
      await sendTelegramDocument(
        chatId,
        buffer,
        filename,
        "👥 *Merkeb ERP — Customer Import Template*\nUse this Excel sheet to bulk import customer records."
      );
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Customer template download error:", error);
    res.status(500).json({ message: "Failed to generate customer template" });
  }
};

// BULK IMPORT CUSTOMERS (Excel / CSV)
export const importCustomers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an Excel or CSV file" });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({ message: "Workbook contains no worksheets" });
    }

    const rows = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      const values = row.values;
      rows.push({
        rowNumber,
        name: values[1] ? String(values[1]).trim() : "",
        phone: values[2] ? String(values[2]).trim() : "",
        address: values[3] ? String(values[3]).trim() : "",
        instagramHandle: values[4] ? String(values[4]).trim() : "",
        notes: values[5] ? String(values[5]).trim() : ""
      });
    });

    if (rows.length === 0) {
      return res.status(400).json({ message: "No data rows found in uploaded file" });
    }

    let importedCount = 0;
    let updatedCount = 0;
    const errors = [];

    for (const data of rows) {
      if (!data.name) {
        errors.push({ row: data.rowNumber, error: "Missing required Name" });
        continue;
      }
      if (!data.phone) {
        errors.push({ row: data.rowNumber, name: data.name, error: "Missing required Phone number" });
        continue;
      }

      try {
        // Check for existing customer by Phone or Instagram
        const query = [{ phone: data.phone }];
        if (data.instagramHandle) {
          query.push({ instagramHandle: data.instagramHandle });
        }

        let existingCustomer = await Customer.findOne({ $or: query });

        if (existingCustomer) {
          existingCustomer.name = data.name;
          if (data.address) existingCustomer.address = data.address;
          if (data.instagramHandle) existingCustomer.instagramHandle = data.instagramHandle;
          if (data.notes) existingCustomer.notes = data.notes;

          await existingCustomer.save();
          updatedCount++;
        } else {
          const newCustomer = new Customer({
            name: data.name,
            phone: data.phone,
            address: data.address,
            instagramHandle: data.instagramHandle,
            notes: data.notes
          });
          await newCustomer.save();
          importedCount++;
        }
      } catch (err) {
        errors.push({ row: data.rowNumber, customer: data.name, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Customers import processed: ${importedCount} created, ${updatedCount} updated, ${errors.length} skipped`,
      totalRows: rows.length,
      importedCount,
      updatedCount,
      skippedCount: errors.length,
      errors
    });
  } catch (error) {
    console.error("Bulk import customers error:", error);
    res.status(500).json({ message: "Failed to process customer import file", error: error.message });
  }
};