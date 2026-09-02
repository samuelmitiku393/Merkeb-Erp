import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { createBackup, pruneOldBackups } from "../services/backupService.js";

dotenv.config();

/**
 * CLI script to manually trigger a database backup.
 * Usage: node scripts/runBackup.js
 */
const run = async () => {
  try {
    console.log("\n=== Manual Database Backup ===\n");

    await connectDB();

    console.log("Starting backup...\n");
    const summary = await createBackup();

    console.log("\n--- Backup Summary ---");
    console.log(`Timestamp: ${summary.timestamp}`);
    console.log(`Database: ${summary.database}`);
    console.log(`Total Documents: ${summary.totalDocuments}`);
    console.log(`Backup Path: ${summary.backupPath}`);
    console.log("\nCollections:");
    for (const [name, info] of Object.entries(summary.collections)) {
      if (info.error) {
        console.log(`  ✗ ${name}: ERROR - ${info.error}`);
      } else {
        console.log(`  ✓ ${name}: ${info.count} documents`);
      }
    }

    // Prune old backups
    console.log("\nPruning old backups...");
    const pruned = pruneOldBackups();
    console.log(`Pruned ${pruned} old backup(s).`);

    console.log("\n=== Backup Complete ===\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Backup failed:", error);
    process.exit(1);
  }
};

run();
