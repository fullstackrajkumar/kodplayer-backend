/**
 * PM2 production process file.
 *
 * Setup (from repo root):
 *   pnpm install && pnpm run build
 *   cp .env.example .env   # fill secrets
 *   mkdir -p logs
 *   pnpm start:pm2:prod
 *   pm2 save
 */
const path = require("node:path");

const ROOT = __dirname;
const LOG_DIR = path.join(ROOT, "logs");

/** @type {import('pm2').StartOptions} */
const base = {
  exec_mode: "fork",
  instances: 1,
  autorestart: true,
  watch: false,
  merge_logs: true,
  time: true,
  min_uptime: "10s",
  max_restarts: 15,
  restart_delay: 3000,
  exp_backoff_restart_delay: 1000,
  kill_timeout: 8000,
  listen_timeout: 15000,
  source_map_support: false,
};

function app({ name, cwd, maxMemory = "512M", env = {} }) {
  return {
    ...base,
    name,
    cwd: path.join(ROOT, cwd),
    script: "dist/main.js",
    max_memory_restart: maxMemory,
    error_file: path.join(LOG_DIR, `${name}-error.log`),
    out_file: path.join(LOG_DIR, `${name}-out.log`),
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    env: { NODE_ENV: "development", ...env },
    env_production: { NODE_ENV: "production", ...env },
  };
}

module.exports = {
  apps: [
    app({ name: "mbt-api-service", cwd: "services/api-service", maxMemory: "768M", env: { PORT: "4040" } }),
    app({ name: "mbt-admin-service", cwd: "services/admin-service", maxMemory: "768M", env: { PORT: "4041", ADMIN_PORT: "4041" } }),
    app({ name: "mbt-notification-service", cwd: "services/notification-service", maxMemory: "512M", env: { NOTIFICATION_PORT: "4042" } }),
    // webhook-service is kept as a placeholder and not started
    // app({ name: "mbt-webhook-service", cwd: "services/webhook-service", maxMemory: "384M", env: { WEBHOOK_PORT: "4043" } }),
  ],
};
