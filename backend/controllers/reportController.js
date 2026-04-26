import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import ExcelJS from "exceljs";

// Generate Monthly Sales Report
export const generateMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    // Set date range for the specified month
    const startDate = new Date(year, month - 1, 1); // month is 0-indexed
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Fetch orders within the date range
    const orders = await Order.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .populate("customer")
    .populate("items.product")
    .sort({ createdAt: 1 });

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Your Store";
    workbook.created = new Date();

    // ===== SHEET 1: SALES SUMMARY =====
    const summarySheet = workbook.addWorksheet("Sales Summary", {
      properties: { tabColor: { argb: "FF00FF00" } }
    });

    // Title
    summarySheet.mergeCells("A1:G1");
    const titleCell = summarySheet.getCell("A1");
    titleCell.value = `Monthly Sales Report - ${getMonthName(month)} ${year}`;
    titleCell.font = { size: 16, bold: true, color: { argb: "FF1F4E79" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    summarySheet.getRow(1).height = 30;

    // Summary headers
    const summaryHeaders = [
      "Total Orders",
      "Total Revenue",
      "Total Cost",
      "Total Profit",
      "Products Sold",
      "Avg. Order Value",
      "Returning Customers"
    ];

    // Calculate summary metrics
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProductsSold = 0;
    const uniqueCustomers = new Set();

    orders.forEach(order => {
      totalRevenue += order.totalPrice || 0;
      
      order.items.forEach(item => {
        const product = item.product;
        if (product && product.costPrice) {
          totalCost += product.costPrice * item.quantity;
        }
        totalProductsSold += item.quantity;
      });

      if (order.customer) {
        uniqueCustomers.add(order.customer._id.toString());
      }
    });

    const totalProfit = totalRevenue - totalCost;
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Add summary data
    summarySheet.getCell("A3").value = "Metric";
    summarySheet.getCell("B3").value = "Value";
    summarySheet.getRow(3).font = { bold: true };
    summarySheet.getRow(3).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    summarySheet.getRow(3).font = { color: { argb: "FFFFFFFF" }, bold: true };

    const summaryData = [
      ["Total Orders", orders.length],
      ["Total Revenue", `$${totalRevenue.toFixed(2)}`],
      ["Total Cost", `$${totalCost.toFixed(2)}`],
      ["Total Profit", `$${totalProfit.toFixed(2)}`],
      ["Products Sold", totalProductsSold],
      ["Avg. Order Value", `$${avgOrderValue.toFixed(2)}`],
      ["Unique Customers", uniqueCustomers.size]
    ];

    summaryData.forEach((data, index) => {
      const row = summarySheet.getRow(4 + index);
      row.getCell(1).value = data[0];
      row.getCell(2).value = data[1];
      row.getCell(1).font = { bold: true };
    });

    summarySheet.getColumn(1).width = 25;
    summarySheet.getColumn(2).width = 20;

    // ===== SHEET 2: DETAILED ORDERS =====
    const ordersSheet = workbook.addWorksheet("Detailed Orders", {
      properties: { tabColor: { argb: "FF4472C4" } }
    });

    // Orders headers
    const orderHeaders = [
      "Order ID",
      "Date",
      "Customer Name",
      "Customer Phone",
      "Products",
      "Total Items",
      "Total Price",
      "Status"
    ];

    const headerRow = ordersSheet.getRow(1);
    orderHeaders.forEach((header, index) => {
      headerRow.getCell(index + 1).value = header;
      headerRow.getCell(index + 1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.getCell(index + 1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2F5496" }
      };
    });

    // Add order data
    orders.forEach((order, rowIndex) => {
      const row = ordersSheet.getRow(rowIndex + 2);
      
      const productsList = order.items.map(item => 
        `${item.product?.name || "Unknown"} (${item.size}) x${item.quantity}`
      ).join(", ");

      row.getCell(1).value = order._id.toString();
      row.getCell(2).value = order.createdAt.toLocaleDateString();
      row.getCell(3).value = order.customer?.name || "N/A";
      row.getCell(4).value = order.customer?.phone || "N/A";
      row.getCell(5).value = productsList;
      row.getCell(6).value = order.items.reduce((sum, item) => sum + item.quantity, 0);
      row.getCell(7).value = `$${order.totalPrice?.toFixed(2) || "0.00"}`;
      row.getCell(8).value = order.paymentStatus || "pending";

      // Alternate row colors
      if (rowIndex % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF2F2F2" }
        };
      }
    });

    // Set column widths
    ordersSheet.getColumn(1).width = 25;
    ordersSheet.getColumn(2).width = 15;
    ordersSheet.getColumn(3).width = 20;
    ordersSheet.getColumn(4).width = 15;
    ordersSheet.getColumn(5).width = 40;
    ordersSheet.getColumn(6).width = 12;
    ordersSheet.getColumn(7).width = 15;
    ordersSheet.getColumn(8).width = 15;

    // ===== SHEET 3: PRODUCT PERFORMANCE =====
    const productsSheet = workbook.addWorksheet("Product Performance", {
      properties: { tabColor: { argb: "FFFFC000" } }
    });

    // Product headers
    const productHeaders = [
      "Product Name",
      "Team",
      "Size",
      "Units Sold",
      "Revenue",
      "Current Stock"
    ];

    const productHeaderRow = productsSheet.getRow(1);
    productHeaders.forEach((header, index) => {
      productHeaderRow.getCell(index + 1).value = header;
      productHeaderRow.getCell(index + 1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      productHeaderRow.getCell(index + 1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFBF8F00" }
      };
    });

    // Calculate product performance
    const productPerformance = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.product?._id?.toString();
        const productName = item.product?.name || "Unknown";
        const team = item.product?.team || "N/A";
        const size = item.size;
        const key = `${productId}-${size}`;

        if (!productPerformance[key]) {
          productPerformance[key] = {
            name: productName,
            team: team,
            size: size,
            quantity: 0,
            revenue: 0
          };
        }

        productPerformance[key].quantity += item.quantity;
        productPerformance[key].revenue += (item.price || 0) * item.quantity;
      });
    });

    // Get current stock for products
    const allProducts = await Product.find({});
    
    let productRow = 2;
    Object.values(productPerformance).forEach((perf, index) => {
      const row = productsSheet.getRow(productRow);
      
      // Find current stock
      let currentStock = 0;
      const product = allProducts.find(p => p.name === perf.name);
      if (product) {
        const sizeObj = product.sizes.find(s => s.size === perf.size);
        currentStock = sizeObj ? sizeObj.stock : 0;
      }

      row.getCell(1).value = perf.name;
      row.getCell(2).value = perf.team;
      row.getCell(3).value = perf.size;
      row.getCell(4).value = perf.quantity;
      row.getCell(5).value = `$${perf.revenue.toFixed(2)}`;
      row.getCell(6).value = currentStock;

      // Highlight low stock
      if (currentStock <= 3) {
        row.getCell(6).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFF0000" }
        };
        row.getCell(6).font = { color: { argb: "FFFFFFFF" }, bold: true };
      }

      productRow++;
    });

    // Set column widths
    productsSheet.getColumn(1).width = 25;
    productsSheet.getColumn(2).width = 15;
    productsSheet.getColumn(3).width = 10;
    productsSheet.getColumn(4).width = 12;
    productsSheet.getColumn(5).width = 15;
    productsSheet.getColumn(6).width = 15;

    // ===== SHEET 4: DAILY BREAKDOWN =====
    const dailySheet = workbook.addWorksheet("Daily Breakdown", {
      properties: { tabColor: { argb: "FF70AD47" } }
    });

    const dailyHeaders = ["Date", "Orders", "Revenue", "Items Sold", "Avg. Order Value"];
    const dailyHeaderRow = dailySheet.getRow(1);
    dailyHeaders.forEach((header, index) => {
      dailyHeaderRow.getCell(index + 1).value = header;
      dailyHeaderRow.getCell(index + 1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      dailyHeaderRow.getCell(index + 1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF548235" }
      };
    });

    // Group orders by date
    const dailyStats = {};
    orders.forEach(order => {
      const date = order.createdAt.toLocaleDateString();
      
      if (!dailyStats[date]) {
        dailyStats[date] = {
          orders: 0,
          revenue: 0,
          items: 0
        };
      }
      
      dailyStats[date].orders++;
      dailyStats[date].revenue += order.totalPrice || 0;
      dailyStats[date].items += order.items.reduce((sum, item) => sum + item.quantity, 0);
    });

    let dailyRow = 2;
    Object.entries(dailyStats).forEach(([date, stats]) => {
      const row = dailySheet.getRow(dailyRow);
      row.getCell(1).value = date;
      row.getCell(2).value = stats.orders;
      row.getCell(3).value = `$${stats.revenue.toFixed(2)}`;
      row.getCell(4).value = stats.items;
      row.getCell(5).value = `$${(stats.revenue / stats.orders).toFixed(2)}`;
      dailyRow++;
    });

    // Set column widths
    dailySheet.getColumn(1).width = 15;
    dailySheet.getColumn(2).width = 10;
    dailySheet.getColumn(3).width = 15;
    dailySheet.getColumn(4).width = 12;
    dailySheet.getColumn(5).width = 18;

    // Auto-filter for all sheets
    ordersSheet.autoFilter = "A1:H1";
    productsSheet.autoFilter = "A1:F1";
    dailySheet.autoFilter = "A1:E1";

    // Generate the Excel file
    const fileName = `Monthly_Report_${getMonthName(month)}_${year}.xlsx`;
    
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${fileName}`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ 
      message: "Error generating monthly report",
      error: error.message 
    });
  }
};

// Generate Yearly Report
export const generateYearlyReport = async (req, res) => {
  try {
    const { year } = req.query;
    
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Yearly Report ${year}`);

    // Monthly columns
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Headers
    const headers = ["Metric", ...months, "Total"];
    const headerRow = sheet.getRow(1);
    headers.forEach((header, index) => {
      headerRow.getCell(index + 1).value = header;
      headerRow.getCell(index + 1).font = { bold: true };
      headerRow.getCell(index + 1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" }
      };
      headerRow.getCell(index + 1).font = { color: { argb: "FFFFFFFF" }, bold: true };
    });

    // Metrics to track
    const metrics = ["Orders", "Revenue", "Cost", "Profit", "Products Sold"];
    const yearlyData = {};

    // Initialize yearly data
    metrics.forEach(metric => {
      yearlyData[metric] = new Array(12).fill(0);
    });

    // Fetch and calculate data for each month
    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const orders = await Order.find({
        createdAt: { $gte: startDate, $lte: endDate }
      }).populate("items.product");

      orders.forEach(order => {
        yearlyData["Orders"][month - 1]++;
        yearlyData["Revenue"][month - 1] += order.totalPrice || 0;
        
        let orderCost = 0;
        order.items.forEach(item => {
          yearlyData["Products Sold"][month - 1] += item.quantity;
          if (item.product?.costPrice) {
            orderCost += item.product.costPrice * item.quantity;
          }
        });
        
        yearlyData["Cost"][month - 1] += orderCost;
      });

      yearlyData["Profit"][month - 1] = 
        yearlyData["Revenue"][month - 1] - yearlyData["Cost"][month - 1];
    }

    // Write data to sheet
    metrics.forEach((metric, rowIndex) => {
      const row = sheet.getRow(rowIndex + 2);
      row.getCell(1).value = metric;

      let total = 0;
      months.forEach((month, colIndex) => {
        const value = yearlyData[metric][colIndex];
        if (metric === "Revenue" || metric === "Cost" || metric === "Profit") {
          row.getCell(colIndex + 2).value = value;
          row.getCell(colIndex + 2).numFormat = '$#,##0.00';
        } else {
          row.getCell(colIndex + 2).value = value;
        }
        total += value;
      });

      // Total column
      row.getCell(14).value = total;
      if (metric === "Revenue" || metric === "Cost" || metric === "Profit") {
        row.getCell(14).numFormat = '$#,##0.00';
      }
      row.getCell(14).font = { bold: true };
    });

    // Set column widths
    sheet.getColumn(1).width = 20;
    for (let i = 2; i <= 14; i++) {
      sheet.getColumn(i).width = 15;
    }

    const fileName = `Yearly_Report_${year}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    res.status(500).json({ 
      message: "Error generating yearly report",
      error: error.message 
    });
  }
};

// Helper function
function getMonthName(monthNumber) {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[parseInt(monthNumber) - 1] || "Invalid";
}