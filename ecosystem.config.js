const path = require('path');

module.exports = {
  apps: [
    {
      name: "apollo-agency",
      script: "src/index.ts",
      interpreter: "tsx",
      cwd: path.join(__dirname, "RunDossier"),
      env_production: { NODE_ENV: "production" },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "500M",
      error_file: path.join(__dirname, "RunDossier", "logs", "error.log"),
      out_file: path.join(__dirname, "RunDossier", "logs", "out.log")
    }
  ]
};
