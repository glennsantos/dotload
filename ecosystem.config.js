module.exports = {
  apps: [
    {
      name: 'alacarte-local',
      script: 'node_modules/next/dist/bin/next',
      args: 'dev',
      env: {
        NODE_ENV: 'development',
        PORT: 2222
      },
      watch: true,
      ignore_watch: [
        '.next',
        'node_modules',
        '.git',
        '.gitignore',
        '*.log'
      ],
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      log_file: 'logs/combined.log',
      time: true
    }
  ]
};
