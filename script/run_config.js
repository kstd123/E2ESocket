module.exports = {
  apps: [
    {
      name: 'bible-website',
      script: 'dist/index.js',
      instances: 'max', // 使用所有可用CPU核心
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      min_uptime: '10s', // 最小运行时间，避免频繁重启
      max_restarts: 10, // 最大重启次数
      autorestart: true, // 自动重启
      watch: false, // 生产环境关闭文件监听
      ignore_watch: ['node_modules', 'logs'], // 忽略监听的目录
      kill_timeout: 1600, // 关闭超时时间
      listen_timeout: 3000, // 监听超时时间
      wait_ready: true, // 等待应用准备就绪
      env: {
        NODE_ENV: 'development',
        RUN_ENV: 'development',
        UV_THREADPOOL_SIZE: 128 // 增加线程池大小
      },
      env_staging: {
        NODE_ENV: 'production',
        RUN_ENV: 'staging',
        UV_THREADPOOL_SIZE: 128
      },
      env_production: {
        NODE_ENV: 'production',
        RUN_ENV: 'production',
        UV_THREADPOOL_SIZE: 128
      },
      time: true,
      error_file: '/home/services/bible-website/logs/frontend-error.log',
      out_file: '/home/services/bible-website/logs/frontend-out.log', // 分离标准输出日志
      log_file: '/home/services/bible-website/logs/frontend.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z', // 添加日志时间格式
      combine_logs: true, // 合并日志
      max_size: '10M', // 日志文件最大大小
      retain: 7 // 保留日志文件数量
    }
  ]
};