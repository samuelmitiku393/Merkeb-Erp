module.exports = {
  apps: [
    {
      name: "merkeb-erp-api",
      script: "./server.js",
      instances: 1, // Change to "max" or number of CPU cores for multi-core clustering
      exec_mode: "fork", // Use "cluster" if running multiple instances
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "development",
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      restart_delay: 3000,
    },
  ],
};
