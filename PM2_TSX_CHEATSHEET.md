# PM2 + TSX Cheat Sheet

## Install
```bash
npm install -g pm2 tsx
npm install --save-dev pm2 tsx
```

## Run with TSX (Quick)
```bash
# Development (watch mode)
tsx watch ./src/index.ts

# Production (single run)
tsx ./src/index.ts

# With environment variables
NODE_ENV=production APOLLO_API_KEY=xxx tsx ./src/index.ts
```

## PM2 Basic Commands
```bash
# Start app
pm2 start ecosystem.config.js

# Start specific app
pm2 start ecosystem.config.js --only apollo-agency

# Production mode
pm2 start ecosystem.config.js --env production

# Start with TSX directly
pm2 start "tsx ./src/index.ts" --name apollo-agency

# Start with TSX (watch mode)
pm2 start "tsx ./src/index.ts" --name apollo-agency --watch

# Restart app
pm2 restart apollo-agency

# Stop app
pm2 stop apollo-agency

# Delete app
pm2 delete apollo-agency

# List all apps
pm2 list

# Show app details
pm2 show apollo-agency

# Monitor (real-time dashboard)
pm2 monit

# View logs
pm2 logs apollo-agency

# Last 100 lines
pm2 logs apollo-agency --lines 100

# Clear logs
pm2 flush

# Kill all and exit
pm2 kill
```

## PM2 Autostart (Reboot)
```bash
# Save current PM2 apps
pm2 save

# Generate startup script
pm2 startup

# Disable autostart
pm2 unstartup
```

## ecosystem.config.js (Minimal)
```javascript
module.exports = {
  apps: [
    {
      name: "apollo-agency",
      script: "./src/index.ts",
      interpreter: "tsx",
      env_production: { NODE_ENV: "production" },
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "500M",
      error_file: "./logs/error.log",
      out_file: "./logs/out.log"
    }
  ]
};
```

## One-Liners

### Install & Start
```bash
npm install -g pm2 tsx && npm install && pm2 start "tsx ./src/index.ts" --name apollo-agency
```

### Install & Start with Autostart
```bash
npm install -g pm2 tsx && npm install && pm2 start "tsx ./src/index.ts" --name apollo-agency && pm2 save && pm2 startup
```

### Deploy & Monitor
```bash
git pull && npm install && pm2 restart apollo-agency && pm2 monit
```

### Full Production Setup
```bash
npm install -g pm2 tsx && npm install && mkdir -p logs && pm2 start ecosystem.config.js --env production && pm2 save && pm2 startup && pm2 monit
```

## Cluster Mode (Load Balancing)
```bash
# Run with max workers
pm2 start "tsx ./src/index.ts" --name apollo-agency -i max

# Run with 4 workers
pm2 start "tsx ./src/index.ts" --name apollo-agency -i 4
```

## Multiple Workers
```bash
pm2 start "tsx ./src/workers/worker1.ts" --name worker-1
pm2 start "tsx ./src/workers/worker2.ts" --name worker-2
pm2 start "tsx ./src/workers/worker3.ts" --name worker-3
```

## Environment Variables
```bash
# Set per-app
pm2 start "tsx ./src/index.ts" --name apollo-agency --env "NODE_ENV=production"

# Or in ecosystem.config.js
env: { NODE_ENV: "development" }
env_production: { NODE_ENV: "production" }
```

## Update & Restart
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Restart app
pm2 restart apollo-agency

# Or one command
git pull && npm install && pm2 restart apollo-agency
```

## Troubleshooting
```bash
# Check if running
pm2 list

# See what's wrong
pm2 logs apollo-agency --lines 50

# View error log specifically
tail -f ./logs/error.log

# Restart with verbose output
pm2 restart apollo-agency --update-env

# Force kill and restart
pm2 kill && pm2 start ecosystem.config.js --env production
```

## Logging
```bash
# Stream all logs
pm2 logs

# Stream specific app
pm2 logs apollo-agency

# Show errors only
pm2 logs apollo-agency --err

# Show last N lines
pm2 logs apollo-agency --lines 50

# Follow log in real-time
pm2 logs apollo-agency --follow
```

## Memory & CPU
```bash
# View memory usage
pm2 show apollo-agency | grep memory

# Set max memory restart
pm2 start "tsx ./src/index.ts" --max-memory-restart 500M

# Monitor in real-time
pm2 monit
```

## Common Patterns

### Development
```bash
tsx watch ./src/index.ts
```

### Production (Single)
```bash
pm2 start "tsx ./src/index.ts" --name apollo-agency && pm2 save && pm2 startup
```

### Production (Cluster)
```bash
pm2 start ecosystem.config.js --env production && pm2 save && pm2 startup
```

### CI/CD Deploy
```bash
git pull origin main
npm install
pm2 restart apollo-agency
pm2 logs apollo-agency --lines 20
```

### Watch Mode + PM2
```bash
pm2 start "tsx ./src/index.ts" --name apollo-agency --watch --ignore-watch "node_modules,dist,.git"
```

## PM2 Config File Locations
- Linux/Mac: `~/.pm2/`
- Windows: `%USERPROFILE%\.pm2\`

## Reset Everything
```bash
pm2 kill
rm -rf ~/.pm2
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```
