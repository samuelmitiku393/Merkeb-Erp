import { createBackup, pruneOldBackups } from "./backupService.js";

const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

let backupTimer = null;

/**
 * Starts the automated daily backup scheduler.
 * Runs backup + pruning every 24 hours.
 */
export const startBackupScheduler = () => {
  // Calculate ms until next 2:00 AM
  const now = new Date();
  const next2AM = new Date(now);
  next2AM.setHours(2, 0, 0, 0);

  // If 2 AM already passed today, schedule for tomorrow
  if (now >= next2AM) {
    next2AM.setDate(next2AM.getDate() + 1);
  }

  const msUntilFirst = next2AM.getTime() - now.getTime();

  console.log(
    `\x1b[36m✓ Backup scheduler initialized. First backup in ${Math.round(msUntilFirst / 1000 / 60)} minutes (at ${next2AM.toLocaleTimeString()})\x1b[0m`
  );

  // First run at 2 AM, then every 24 hours
  backupTimer = setTimeout(async () => {
    await runScheduledBackup();

    // Set up recurring interval
    backupTimer = setInterval(async () => {
      await runScheduledBackup();
    }, BACKUP_INTERVAL_MS);
  }, msUntilFirst);
};

/**
 * Stops the backup scheduler.
 */
export const stopBackupScheduler = () => {
  if (backupTimer) {
    clearTimeout(backupTimer);
    clearInterval(backupTimer);
    backupTimer = null;
    console.log("\x1b[33m✓ Backup scheduler stopped\x1b[0m");
  }
};

/**
 * Executes a single backup cycle: backup + prune old files.
 */
const runScheduledBackup = async () => {
  console.log(
    `\n\x1b[36m[${new Date().toISOString()}] Running scheduled backup...\x1b[0m`
  );
  try {
    const summary = await createBackup();
    const pruned = pruneOldBackups();
    console.log(
      `\x1b[32m✓ Scheduled backup complete. ${summary.totalDocuments} docs backed up, ${pruned} old backups pruned.\x1b[0m`
    );
  } catch (error) {
    console.error(
      `\x1b[31m✗ Scheduled backup failed: ${error.message}\x1b[0m`
    );
  }
};
