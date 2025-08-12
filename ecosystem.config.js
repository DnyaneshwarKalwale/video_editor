module.exports = {
  apps: [
    {
      name: 'video_editor',
      script: 'npm',
      args: 'start',
      cwd: '/root/ignite',
      instances: 1,
      exec_mode: 'fork',
      
      // Critical timeout configurations for video rendering
      kill_timeout: 600000, // 10 minutes to gracefully shutdown
      listen_timeout: 300000, // 5 minutes to start
      max_memory_restart: '4G', // Restart if memory exceeds 4GB
      
      // Process management
      autorestart: true,
      watch: false,
      max_restarts: 5,
      min_uptime: '30s',
      
      // Environment variables for better performance
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Increase Node.js memory and thread limits
        UV_THREADPOOL_SIZE: 128,
        NODE_OPTIONS: '--max-old-space-size=4096 --max-semi-space-size=512 --expose-gc'
      },
      
      // Logging configuration
      log_file: '/root/.pm2/logs/video-editor-combined.log',
      out_file: '/root/.pm2/logs/video-editor-out.log',
      error_file: '/root/.pm2/logs/video-editor-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Advanced settings - removed wait_ready to prevent hanging
      listen_timeout: 300000,
      kill_timeout: 600000,
      
      // Resource management
      max_memory_restart: '4G',
      node_args: '--max-old-space-size=4096 --expose-gc'
    }
  ]  
};
