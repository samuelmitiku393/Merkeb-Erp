import mongoose from "mongoose";

const startTime = Date.now();

/**
 * Detailed System Health Check Controller
 * Returns DB connection status, latency, uptime, memory, and environment info.
 */
export const getSystemHealth = async (req, res) => {
  const dbStates = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const isDbConnected = mongoose.connection.readyState === 1;

  // Measure DB Ping / Latency
  let dbLatencyMs = null;
  if (isDbConnected && mongoose.connection.db) {
    try {
      const pingStart = Date.now();
      await mongoose.connection.db.admin().ping();
      dbLatencyMs = Date.now() - pingStart;
    } catch (err) {
      console.error("Health check DB ping error:", err.message);
    }
  }

  const memoryUsage = process.memoryUsage();

  const healthInfo = {
    status: isDbConnected ? "OK" : "DEGRADED",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    uptimeFormatted: formatUptime(process.uptime()),
    database: {
      status: dbStates[mongoose.connection.readyState] || "unknown",
      name: mongoose.connection.name || "N/A",
      latencyMs: dbLatencyMs,
    },
    memory: {
      rssMB: (memoryUsage.rss / (1024 * 1024)).toFixed(2),
      heapTotalMB: (memoryUsage.heapTotal / (1024 * 1024)).toFixed(2),
      heapUsedMB: (memoryUsage.heapUsed / (1024 * 1024)).toFixed(2),
    },
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
  };

  const statusCode = isDbConnected ? 200 : 503;
  res.status(statusCode).json(healthInfo);
};

function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);

  return parts.join(" ");
}
