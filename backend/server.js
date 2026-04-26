import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import Product from "./models/Product.js";
import productRoutes from "./routes/productRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import auditRoutes from "./routes/auditRoutes.js"
import reportRoutes from "./routes/reportRoutes.js";
import { authenticateToken } from "./middleware/auth.js";
import fs from "fs";
import path from "path";

dotenv.config();
connectDB();

const app = express();

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Custom logger function
const logError = (error, req = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    url: req?.url,
    method: req?.method,
    body: req?.body,
    params: req?.params,
    query: req?.query,
    headers: {
      ...req?.headers,
      authorization: req?.headers.authorization ? '[REDACTED]' : undefined
    },
    ip: req?.ip || req?.connection?.remoteAddress
  };

  // Console logging with colors
  console.error('\n' + '='.repeat(80));
  console.error('\x1b[31m%s\x1b[0m', `[${timestamp}] ERROR OCCURRED:`);
  console.error('\x1b[33m%s\x1b[0m', `Type: ${error.name}`);
  console.error('\x1b[33m%s\x1b[0m', `Message: ${error.message}`);

  if (error.code) {
    console.error('\x1b[33m%s\x1b[0m', `Code: ${error.code}`);
  }

  if (req) {
    console.error('\x1b[36m%s\x1b[0m', `Request: ${req.method} ${req.url}`);
    console.error('\x1b[36m%s\x1b[0m', `IP: ${logEntry.ip}`);
  }

  console.error('\x1b[31m%s\x1b[0m', '\nStack Trace:');
  console.error('\x1b[90m%s\x1b[0m', error.stack);

  if (req?.body && Object.keys(req.body).length > 0) {
    console.error('\x1b[36m%s\x1b[0m', '\nRequest Body:');
    console.error('\x1b[90m%s\x1b[0m', JSON.stringify(req.body, null, 2));
  }

  console.error('='.repeat(80) + '\n');

  // Write to log file
  const logFileName = `error-${new Date().toISOString().split('T')[0]}.log`;
  const logFilePath = path.join(logsDir, logFileName);

  fs.appendFileSync(
    logFilePath,
    JSON.stringify(logEntry, null, 2) + '\n---\n',
    'utf8'
  );

  return logEntry;
};

// Custom logger for authentication events
const logAuth = (type, data, req = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type,
    data,
    ip: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.headers?.['user-agent']
  };

  console.log('\x1b[35m%s\x1b[0m', `[${timestamp}] AUTH: ${type}`, data);

  // Write to auth log file
  const logFileName = `auth-${new Date().toISOString().split('T')[0]}.log`;
  const logFilePath = path.join(logsDir, logFileName);

  fs.appendFileSync(
    logFilePath,
    JSON.stringify(logEntry, null, 2) + '\n---\n',
    'utf8'
  );
};

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const { method, url } = req;

  // Skip logging for health checks or static files if needed
  if (url !== '/favicon.ico') {
    console.log('\x1b[32m%s\x1b[0m', `[${new Date().toISOString()}] ${method} ${url}`);
  }

  // Capture response
  const originalJson = res.json;
  const originalSend = res.send;

  res.json = function (data) {
    const duration = Date.now() - startTime;
    if (url !== '/favicon.ico') {
      console.log('\x1b[32m%s\x1b[0m', `[${new Date().toISOString()}] ${method} ${url} - ${res.statusCode} (${duration}ms)`);
    }
    return originalJson.call(this, data);
  };

  res.send = function (data) {
    const duration = Date.now() - startTime;
    if (url !== '/favicon.ico') {
      console.log('\x1b[32m%s\x1b[0m', `[${new Date().toISOString()}] ${method} ${url} - ${res.statusCode} (${duration}ms)`);
    }
    return originalSend.call(this, data);
  };

  next();
});

// CORS middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public routes (no authentication required)
app.get("/", (req, res) => {
  res.send("API Running...");
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Auth routes (public)
app.use("/api/auth", authRoutes);
app.use("/api/audit", auditRoutes);

// ===== PROTECTED ROUTES =====
// All routes below this middleware require authentication
app.use("/api", authenticateToken);

// Protected API routes
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);

// Test route with error handling (protected)
app.get("/api/test-product", async (req, res, next) => {
  try {
    const product = await Product.create({
      name: "Test Jersey",
      team: "Test Team",
      price: 1000,
      sizes: [{ size: "M", stock: 5 }]
    });

    logAuth('TEST_PRODUCT_CREATED', {
      productId: product._id,
      userId: req.user.id
    }, req);

    res.json(product);
  } catch (error) {
    logError(error, req);
    next(error);
  }
});

// Get current user info (protected)
app.get("/api/me", (req, res) => {
  res.json({
    user: req.user,
    message: "Authenticated user information"
  });
});

// 404 handler
app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.url}`);
  error.status = 404;
  error.code = 'ROUTE_NOT_FOUND';
  logError(error, req);
  next(error);
});

// Global error handling middleware
app.use((err, req, res, next) => {
  // Log the error
  logError(err, req);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `Duplicate value for ${field}`,
      field
    });
  }

  // Mongoose cast error (invalid ID)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
      field: err.path
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: "Invalid token. Please login again."
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: "Token expired. Please login again."
    });
  }

  // Authentication errors
  if (err.status === 401) {
    return res.status(401).json({
      success: false,
      message: err.message || "Authentication required"
    });
  }

  // Authorization errors
  if (err.status === 403) {
    return res.status(403).json({
      success: false,
      message: err.message || "Access forbidden"
    });
  }

  // Default error response
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Something went wrong!",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      type: err.name
    })
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n' + '='.repeat(80));
  console.error('\x1b[41m\x1b[37m%s\x1b[0m', ' UNCAUGHT EXCEPTION ');
  logError(error);
  console.error('='.repeat(80) + '\n');

  // Graceful shutdown
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n' + '='.repeat(80));
  console.error('\x1b[41m\x1b[37m%s\x1b[0m', ' UNHANDLED REJECTION ');
  console.error('\x1b[33m%s\x1b[0m', 'Reason:', reason);
  console.error('\x1b[33m%s\x1b[0m', 'Promise:', promise);
  logError(reason instanceof Error ? reason : new Error(String(reason)));
  console.error('='.repeat(80) + '\n');

  // Graceful shutdown
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('\x1b[33m%s\x1b[0m', 'SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('\x1b[32m%s\x1b[0m', 'HTTP server closed');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(80));
  console.log('\x1b[32m%s\x1b[0m', `✓ Server running on port ${PORT}`);
  console.log('\x1b[36m%s\x1b[0m', `✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('\x1b[36m%s\x1b[0m', `✓ Logs directory: ${logsDir}`);
  console.log('\x1b[33m%s\x1b[0m', `✓ Authentication: ${process.env.JWT_SECRET ? 'ENABLED' : 'DISABLED - Set JWT_SECRET in .env'}`);
  console.log('='.repeat(80) + '\n');
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error('\x1b[41m\x1b[37m%s\x1b[0m', ` Port ${PORT} is already in use `);
    logError(error);
    process.exit(1);
  } else {
    console.error('\x1b[41m\x1b[37m%s\x1b[0m', ' Server Error ');
    logError(error);
  }
});

// Export for testing or external use
export { app, logError, logAuth };