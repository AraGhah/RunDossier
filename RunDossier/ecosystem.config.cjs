// PM2 config for the Preframe engine (scheduler + research -> personalize -> QA -> delivery).
// Runs the compiled server as a background daemon that survives closing the terminal and
// auto-restarts on crash. Build first, then start:
//   npm run build
//   pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'preframe',
      script: 'dist/index.js',
      cwd: __dirname,          // RunDossier — so dotenv finds .env
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
      env: { NODE_ENV: 'production' },
    },
  ],
};
