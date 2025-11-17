/**
 * PM2 进程管理配置文件
 * 
 * 使用方法：
 * pm2 start ecosystem.config.js
 * pm2 start ecosystem.config.js --env production
 */
module.exports = {
  apps: [
    {
      // 应用名称
      name: 'e2e-socket',
      
      // 启动脚本
      script: './server.js',
      
      // 实例数量
      // 'max' 表示根据 CPU 核心数自动设置
      // 或设置具体数字，如 2, 4 等
      instances: 1,
      
      // 执行模式
      // 'cluster' 用于负载均衡
      // 'fork' 用于单实例
      exec_mode: 'fork',
      
      // 监听文件变化自动重启（生产环境建议关闭）
      watch: false,
      
      // 忽略监听的文件/文件夹
      ignore_watch: [
        'node_modules',
        'logs',
        'examples',
        '.git'
      ],
      
      // 最大内存限制，超过后自动重启
      max_memory_restart: '500M',
      
      // 自动重启
      autorestart: true,
      
      // 最大重启次数
      max_restarts: 10,
      
      // 重启延迟时间（毫秒）
      restart_delay: 4000,
      
      // 错误日志文件
      error_file: './logs/pm2-error.log',
      
      // 输出日志文件
      out_file: './logs/pm2-out.log',
      
      // 日志时间格式
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      
      // 合并日志
      merge_logs: true,
      
      // 环境变量 - 开发环境
      env: {
        NODE_ENV: 'development',
        WS_PORT: 8080,
        API_PORT: 3001
      },
      
      // 环境变量 - 生产环境
      env_production: {
        NODE_ENV: 'production',
        WS_PORT: 8080,
        API_PORT: 3001
      },
      
      // 进程 ID 文件
      pid_file: './logs/e2e-socket.pid',
      
      // 等待应用启动的时间
      listen_timeout: 5000,
      
      // 优雅关闭超时时间
      kill_timeout: 5000,
      
      // 等待就绪信号
      wait_ready: false,
      
      // 实例间隔启动时间（集群模式）
      instance_var: 'INSTANCE_ID'
    }
  ],
  
  // 部署配置（可选）
  deploy: {
    // 生产环境部署配置
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:yourname/e2eSocket.git',
      path: '/var/www/e2eSocket',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    },
    
    // 开发环境部署配置
    development: {
      user: 'deploy',
      host: ['dev-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:yourname/e2eSocket.git',
      path: '/var/www/e2eSocket-dev',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env development',
      env: {
        NODE_ENV: 'development'
      }
    }
  }
};

