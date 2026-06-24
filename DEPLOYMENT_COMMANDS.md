# Deployment Commands for Apollo Agency

## 1. INITIAL SETUP & ENVIRONMENT

### Install Node.js dependencies
```bash
npm install
```

### Install n8n globally (if not installed)
```bash
npm install -g n8n
```

### Create environment file
```bash
cp .env.example .env
# Then edit .env with your credentials:
# - APOLLO_API_KEY
# - N8N_HOST
# - N8N_PORT
# - DATABASE_URL (if needed)
```

### Install ruflo (Claude Flow CLI) for agent coordination
```bash
npm install -g @claude-flow/cli
npx @claude-flow/cli@latest init --wizard
```

### Install PM2 globally (production process manager)
```bash
npm install -g pm2
```

### Install TSX globally (TypeScript executor)
```bash
npm install -g tsx
```

### Install PM2 & TSX locally (optional, for project-level control)
```bash
npm install --save-dev pm2 tsx
```

---

## 2. GIT & VERSION CONTROL

### Initialize git (if new repo)
```bash
git init
git remote add origin <your-repo-url>
```

### Stage all changes
```bash
git add .
```

### Commit with message (no Co-Authored-By)
```bash
git commit -m "Initial Apollo agency setup"
```

### Push to main
```bash
git push -u origin main
```

### Pull latest
```bash
git pull origin main
```

### Check git status
```bash
git status
```

---

## 3. N8N WORKFLOW DEPLOYMENT

### Start n8n locally
```bash
n8n start
```

### Start n8n in background
```bash
n8n start &
```

### Stop n8n
```bash
n8n stop
# Or kill process:
pkill -f n8n
```

### Access n8n UI
```bash
open http://localhost:5678
# Or manually navigate to: http://localhost:5678
```

### Import workflow from JSON file
```bash
n8n import:workflow --input=/path/to/workflow.json
```

### Export workflow to JSON
```bash
n8n export:workflow --workflow=<workflow-id> --output=/path/to/export.json
```

### Start n8n with custom port
```bash
N8N_PORT=3000 n8n start
```

### Enable n8n webhooks
```bash
N8N_WEBHOOK_TUNNEL_URL=https://your-domain.com n8n start
```

---

## 4A. PM2 + TSX (PRODUCTION DEPLOYMENT)

### Install PM2 and TSX
```bash
npm install -g pm2 tsx
# Or locally:
npm install --save-dev pm2 tsx
```

### Create PM2 ecosystem config file (ecosystem.config.js)
```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: "apollo-agency",
      script: "./src/index.ts",
      interpreter: "tsx",
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production"
      },
      instances: "max",
      exec_mode: "cluster",
      watch: true,
      ignore_watch: ["node_modules", "dist", ".git"],
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      max_memory_restart: "500M",
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: "10s"
    },
    {
      name: "n8n",
      script: "n8n",
      args: "start",
      env: {
        NODE_ENV: "production",
        N8N_PORT: 5678,
        N8N_SECURE_COOKIE: true
      },
      instances: 1,
      exec_mode: "fork",
      error_file: "./logs/n8n-error.log",
      out_file: "./logs/n8n-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      max_memory_restart: "1G",
      restart_delay: 4000
    }
  ]
};
EOF
```

### Start app with PM2 (development)
```bash
pm2 start ecosystem.config.js
```

### Start app with PM2 (production)
```bash
pm2 start ecosystem.config.js --env production
```

### Start specific app with PM2
```bash
pm2 start ecosystem.config.js --only apollo-agency
```

### Start with TSX directly (development, single instance)
```bash
tsx watch ./src/index.ts
```

### Run TypeScript file with TSX (production)
```bash
tsx ./src/index.ts
```

### Run with PM2 and TSX (monitoring)
```bash
pm2 start "tsx ./src/index.ts" --name apollo-agency --watch
```

### View PM2 processes
```bash
pm2 list
```

### View PM2 process details
```bash
pm2 show apollo-agency
```

### Monitor all processes
```bash
pm2 monit
```

### View PM2 logs
```bash
pm2 logs apollo-agency
```

### View last 100 lines of logs
```bash
pm2 logs apollo-agency --lines 100
```

### Clear PM2 logs
```bash
pm2 flush
```

### Stop PM2 app
```bash
pm2 stop apollo-agency
```

### Restart PM2 app
```bash
pm2 restart apollo-agency
```

### Delete PM2 app
```bash
pm2 delete apollo-agency
```

### Delete all PM2 apps
```bash
pm2 delete all
```

### Save PM2 configuration (autostart on reboot)
```bash
pm2 save
pm2 startup
```

### Disable autostart
```bash
pm2 unstartup
```

### Kill all PM2 processes and daemon
```bash
pm2 kill
```

### Run with TSX and custom environment
```bash
NODE_ENV=production APOLLO_API_KEY=xxx tsx ./src/index.ts
```

### Run multiple TSX instances with PM2
```bash
pm2 start "tsx ./src/workers/worker1.ts" --name worker-1
pm2 start "tsx ./src/workers/worker2.ts" --name worker-2
pm2 start "tsx ./src/workers/worker3.ts" --name worker-3
```

### Run with PM2 cluster mode (load balancing)
```bash
pm2 start "tsx ./src/index.ts" --name apollo-agency -i max
```

### Update app and restart
```bash
git pull origin main
npm install
pm2 restart apollo-agency
```

### Deploy with PM2 (if using PM2 Deploy)
```bash
pm2 deploy ecosystem.config.js production setup
pm2 deploy ecosystem.config.js production update
pm2 deploy ecosystem.config.js production exec "npm install && npm run build"
```

### Monitor with PM2+
```bash
pm2 plus
# Or link to PM2 Plus cloud
pm2 link <secret_key> <public_key>
```

### Create PM2 logs directory
```bash
mkdir -p logs
```

---

## 4. APOLLO API & AUTHENTICATION

### Test Apollo API connection
```bash
curl -X GET https://api.apollo.io/v1/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_APOLLO_API_KEY"
```

### Check Apollo credits
```bash
curl -X GET https://api.apollo.io/v1/usage/credit_usage_stats \
  -H "Authorization: Bearer YOUR_APOLLO_API_KEY"
```

### Authenticate Apollo MCP in Claude Code
```bash
claude mcp add apollo -- npx apollo-mcp
```

---

## 5. BUILD & VALIDATION

### Validate n8n workflows
```bash
n8n validate-workflow --input=/path/to/workflow.json
```

### Build TypeScript (if using)
```bash
npm run build
```

### Run tests
```bash
npm test
```

### Check code linting
```bash
npm run lint
```

### Format code
```bash
npm run format
```

---

## 6. DATABASE & STORAGE

### Initialize database (if using Supabase/PostgreSQL)
```bash
npm run db:migrate
# Or with Supabase CLI:
supabase db push
```

### Seed database with test data
```bash
npm run db:seed
```

### Check database status
```bash
npm run db:status
```

---

## 7. RUFLO (CLAUDE FLOW) AGENT SETUP

### Initialize ruflo/claude-flow
```bash
npx @claude-flow/cli@latest init --wizard
```

### Start ruflo daemon (background workers)
```bash
npx @claude-flow/cli@latest daemon start
```

### Check daemon status
```bash
npx @claude-flow/cli@latest daemon status --all
```

### Stop daemon
```bash
npx @claude-flow/cli@latest daemon stop
```

### Search memory for patterns
```bash
npx @claude-flow/cli@latest memory search --query "[task keywords]" --namespace patterns
```

### Store memory after success
```bash
npx @claude-flow/cli@latest memory store --namespace patterns --key "[name]" --value "[what worked]"
```

### Route task to correct agent
```bash
npx @claude-flow/cli@latest hooks route --task "[task description]"
```

### Run diagnostics
```bash
npx @claude-flow/cli@latest doctor --fix
```

### Run security scan
```bash
npx @claude-flow/cli@latest security scan
```

### Run performance benchmarks
```bash
npx @claude-flow/cli@latest performance benchmark
```

---

## 8. DEPLOYMENT (PRODUCTION)

### Deploy to cloud (if using Vercel)
```bash
vercel deploy --prod
```

### Deploy to cloud (if using Heroku)
```bash
heroku login
git push heroku main
heroku logs --tail
```

### Deploy to cloud (if using AWS)
```bash
aws deploy create-deployment \
  --application-name apollo-agency \
  --deployment-group-name production \
  --repository "https://github.com/your-repo"
```

### Start production n8n
```bash
N8N_ENCRYPTION_KEY=$(openssl rand -base64 32) \
N8N_DB_TYPE=postgresdb \
N8N_DB_POSTGRESDB_CONNECTION_STRING="postgresql://user:password@host/db" \
N8N_SECURE_COOKIE=true \
N8N_WEBHOOK_TUNNEL_URL=https://your-domain.com \
n8n start
```

---

## 9. MONITORING & LOGS

### View n8n logs
```bash
n8n logs --lines=100
```

### View system logs
```bash
tail -f /var/log/syslog
# Or on macOS:
log stream --predicate 'process == "n8n"'
```

### Monitor running processes
```bash
top
# Or:
ps aux | grep n8n
```

### Check disk usage
```bash
df -h
```

### Check memory usage
```bash
free -h
```

---

## 10. MAINTENANCE & UPDATES

### Update npm packages
```bash
npm update
```

### Update n8n
```bash
npm install -g n8n@latest
```

### Update ruflo CLI
```bash
npm install -g @claude-flow/cli@latest
```

### Clear n8n cache
```bash
rm -rf ~/.n8n
```

### Backup database
```bash
pg_dump your_database > backup.sql
# Or with Supabase:
supabase db pull > schema.sql
```

### Restore database
```bash
psql your_database < backup.sql
```

---

## 11. APOLLO CLI (IF INSTALLED)

### Login to Apollo
```bash
apollo auth:login
```

### Check API key
```bash
apollo config:get
```

### Export contacts
```bash
apollo contacts:export --output=contacts.csv
```

### Import contacts
```bash
apollo contacts:import --file=contacts.csv
```

---

## 12. QUICK START (ALL-IN-ONE)

### Complete deployment sequence
```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your keys

# 3. Initialize git
git add .
git commit -m "Initial setup"

# 4. Build
npm run build

# 5. Run tests
npm test

# 6. Start n8n
n8n start &

# 7. Deploy (adjust for your platform)
git push origin main
vercel deploy --prod

# 8. Verify
curl http://localhost:5678
```

---

## 12A. QUICK START WITH PM2 + TSX (PRODUCTION)

### Production deployment with PM2 + TSX
```bash
# 1. Install dependencies
npm install

# 2. Install PM2 and TSX globally
npm install -g pm2 tsx

# 3. Setup environment
cp .env.example .env
# Edit .env with your production keys

# 4. Create ecosystem config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: "apollo-agency",
      script: "./src/index.ts",
      interpreter: "tsx",
      env_production: { NODE_ENV: "production" },
      instances: "max",
      exec_mode: "cluster",
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      max_memory_restart: "500M"
    }
  ]
};
EOF

# 5. Create logs directory
mkdir -p logs

# 6. Start with PM2 (production)
pm2 start ecosystem.config.js --env production

# 7. Save PM2 config for autostart on reboot
pm2 save
pm2 startup

# 8. Monitor
pm2 monit

# 9. View logs
pm2 logs apollo-agency
```

### One-liner PM2 + TSX start
```bash
npm install -g pm2 tsx && npm install && pm2 start "tsx ./src/index.ts" --name apollo-agency && pm2 save && pm2 startup
```

---

## 13. TROUBLESHOOTING COMMANDS

### Check if n8n is running
```bash
curl http://localhost:5678/rest/health
```

### Restart n8n
```bash
pkill -f n8n
sleep 2
n8n start
```

### Clear npm cache
```bash
npm cache clean --force
```

### Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### Check Node version
```bash
node --version
npm --version
```

### Verify Apollo authentication
```bash
curl -I -H "Authorization: Bearer YOUR_API_KEY" https://api.apollo.io/v1/users/profile
```

---

## ENVIRONMENT VARIABLES NEEDED

Create a `.env` file with:

```env
# Apollo
APOLLO_API_KEY=your_apollo_api_key
APOLLO_ORG_ID=your_org_id

# n8n
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
N8N_ENCRYPTION_KEY=your_encryption_key

# Database (if using)
DATABASE_URL=postgresql://user:password@localhost:5432/apollo_agency
DB_HOST=localhost
DB_PORT=5432
DB_NAME=apollo_agency
DB_USER=your_user
DB_PASSWORD=your_password

# Node environment
NODE_ENV=production

# API URLs
API_URL=http://localhost:5678
WEBHOOK_URL=http://localhost:5678/webhook
```

---

## DEPLOYMENT CHECKLIST

- [ ] npm install (dependencies installed)
- [ ] .env file created with all API keys
- [ ] git initialized and first commit done
- [ ] npm run build (no errors)
- [ ] npm test (all tests pass)
- [ ] n8n starts successfully (http://localhost:5678 loads)
- [ ] Apollo API connection verified
- [ ] Database migrations run (if applicable)
- [ ] Workflows imported to n8n
- [ ] git push to main successful
- [ ] Production deployment completed
- [ ] Monitor logs for errors

---

## QUICK REFERENCE

### n8n Commands
| Task | Command |
|------|---------|
| Start dev | `n8n start` |
| Stop dev | `pkill -f n8n` |
| Check health | `curl http://localhost:5678/rest/health` |
| View logs | `n8n logs --lines=100` |

### PM2 + TSX Commands
| Task | Command |
|------|---------|
| Start (prod) | `pm2 start ecosystem.config.js --env production` |
| Start (dev) | `pm2 start ecosystem.config.js` |
| Monitor | `pm2 monit` |
| View logs | `pm2 logs apollo-agency` |
| Restart | `pm2 restart apollo-agency` |
| Stop | `pm2 stop apollo-agency` |
| Delete | `pm2 delete apollo-agency` |
| List apps | `pm2 list` |
| Autostart on reboot | `pm2 save && pm2 startup` |
| Direct TSX | `tsx watch ./src/index.ts` |
| TSX production | `tsx ./src/index.ts` |

### Git & Deployment
| Task | Command |
|------|---------|
| Commit code | `git commit -m "message"` |
| Push to main | `git push origin main` |
| Deploy prod | `vercel deploy --prod` |

### Apollo API
| Task | Command |
|------|---------|
| Check Apollo credits | `curl -H "Authorization: Bearer KEY" https://api.apollo.io/v1/usage/credit_usage_stats` |

