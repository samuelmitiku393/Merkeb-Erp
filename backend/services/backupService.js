import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";

const BACKUP_DIR = path.join(process.cwd(), "backups");
const MAX_BACKUP_AGE_DAYS = 30;

/**
 * Ensures the backups directory exists.
 */
const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
};

/**
 * Creates a full JSON snapshot backup of all collections.
 * Returns metadata about the backup.
 */
export const createBackup = async () => {
  ensureBackupDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFolder = path.join(BACKUP_DIR, `backup-${timestamp}`);
  fs.mkdirSync(backupFolder, { recursive: true });

  const collections = [
    { name: "products", model: Product },
    { name: "customers", model: Customer },
    { name: "orders", model: Order },
    { name: "users", model: User },
    { name: "auditlogs", model: AuditLog },
  ];

  const summary = {
    timestamp: new Date().toISOString(),
    database: mongoose.connection.name || "unknown",
    host: mongoose.connection.host || "unknown",
    collections: {},
    totalDocuments: 0,
    backupPath: backupFolder,
  };

  for (const { name, model } of collections) {
    try {
      const documents = await model.find({}).lean();
      const filePath = path.join(backupFolder, `${name}.json`);

      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), "utf8");

      summary.collections[name] = {
        count: documents.length,
        file: `${name}.json`,
      };
      summary.totalDocuments += documents.length;
    } catch (error) {
      console.error(`Failed to backup collection "${name}":`, error.message);
      summary.collections[name] = {
        count: 0,
        error: error.message,
      };
    }
  }

  // Write summary metadata
  const metadataPath = path.join(backupFolder, "metadata.json");
  fs.writeFileSync(metadataPath, JSON.stringify(summary, null, 2), "utf8");

  console.log(
    `\x1b[32m✓ Backup completed: ${summary.totalDocuments} documents across ${Object.keys(summary.collections).length} collections\x1b[0m`
  );

  return summary;
};

/**
 * Prunes (deletes) backup folders older than MAX_BACKUP_AGE_DAYS.
 */
export const pruneOldBackups = () => {
  ensureBackupDir();

  const now = Date.now();
  const maxAge = MAX_BACKUP_AGE_DAYS * 24 * 60 * 60 * 1000;
  let pruned = 0;

  try {
    const entries = fs.readdirSync(BACKUP_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory() || !entry.name.startsWith("backup-")) continue;

      const folderPath = path.join(BACKUP_DIR, entry.name);
      const stats = fs.statSync(folderPath);

      if (now - stats.mtimeMs > maxAge) {
        fs.rmSync(folderPath, { recursive: true, force: true });
        pruned++;
        console.log(`\x1b[33m✓ Pruned old backup: ${entry.name}\x1b[0m`);
      }
    }
  } catch (error) {
    console.error("Error pruning old backups:", error.message);
  }

  return pruned;
};

/**
 * Lists all existing backups with metadata.
 */
export const listBackups = () => {
  ensureBackupDir();

  const backups = [];

  try {
    const entries = fs.readdirSync(BACKUP_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory() || !entry.name.startsWith("backup-")) continue;

      const folderPath = path.join(BACKUP_DIR, entry.name);
      const metadataPath = path.join(folderPath, "metadata.json");

      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
        const stats = fs.statSync(folderPath);

        // Calculate folder size
        let totalSize = 0;
        const files = fs.readdirSync(folderPath);
        for (const file of files) {
          totalSize += fs.statSync(path.join(folderPath, file)).size;
        }

        backups.push({
          name: entry.name,
          ...metadata,
          sizeBytes: totalSize,
          sizeFormatted: formatBytes(totalSize),
          createdAt: stats.birthtime,
        });
      }
    }
  } catch (error) {
    console.error("Error listing backups:", error.message);
  }

  return backups.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
