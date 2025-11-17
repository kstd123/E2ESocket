# 部署指南

本指南介绍如何在生产环境部署 E2E WebSocket 服务器。

## 目录

1. [服务器要求](#服务器要求)
2. [使用 PM2 部署](#使用-pm2-部署)
3. [使用 Docker 部署](#使用-docker-部署)
4. [Nginx 配置](#nginx-配置)
5. [SSL/TLS 配置](#ssltls-配置)
6. [监控和日志](#监控和日志)
7. [性能优化](#性能优化)
8. [安全建议](#安全建议)

## 服务器要求

### 最低配置
- CPU: 1 核心
- 内存: 512MB RAM
- 磁盘: 1GB
- 网络: 1Mbps

### 推荐配置
- CPU: 2 核心或更多
- 内存: 2GB RAM 或更多
- 磁盘: 10GB SSD
- 网络: 10Mbps 或更高

### 软件要求
- Node.js 18.0 或更高版本
- npm 或 yarn
- Git（可选）

## 使用 PM2 部署

PM2 是一个流行的 Node.js 进程管理器。

### 1. 安装 PM2

```bash
npm install -g pm2
```

### 2. 启动应用

```bash
# 克隆或上传代码到服务器
cd /var/www/e2eSocket

# 安装依赖
npm install --production

# 使用 PM2 启动
pm2 start server.js --name e2e-socket

# 查看状态
pm2 status

# 查看日志
pm2 logs e2e-socket
```

### 3. 配置自动重启

```bash
# 保存当前进程列表
pm2 save

# 设置开机自启
pm2 startup
```

### 4. PM2 配置文件

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'e2e-socket',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    max_memory_restart: '500M',
    autorestart: true,
    watch: false
  }]
};
```

启动：

```bash
pm2 start ecosystem.config.js
```

## 使用 Docker 部署

### 1. 创建 Dockerfile

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 8080 3000

# 启动应用
CMD ["node", "server.js"]
```

### 2. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  e2e-socket:
    build: .
    ports:
      - "8080:8080"
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### 3. 构建和运行

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## Nginx 配置

使用 Nginx 作为反向代理可以提供更好的性能和安全性。

### 1. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 2. 配置 Nginx

创建配置文件 `/etc/nginx/sites-available/e2e-socket`：

```nginx
# HTTP 配置
server {
    listen 80;
    server_name your-domain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 证书配置
    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;
    
    # SSL 优化配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # WebSocket 代理
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket 超时设置
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
    
    # HTTP API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 静态文件
    location / {
        root /var/www/e2e-socket/examples;
        index client.html;
    }
}
```

### 3. 启用配置

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/e2e-socket /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

## SSL/TLS 配置

### 使用 Let's Encrypt（免费）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 手动配置 SSL

如果你有自己的证书：

```bash
# 复制证书文件
sudo cp your-cert.pem /etc/ssl/certs/
sudo cp your-key.pem /etc/ssl/private/

# 设置权限
sudo chmod 644 /etc/ssl/certs/your-cert.pem
sudo chmod 600 /etc/ssl/private/your-key.pem
```

## 监控和日志

### 1. 应用日志

使用 PM2 查看日志：

```bash
# 实时日志
pm2 logs e2e-socket

# 最近日志
pm2 logs e2e-socket --lines 100

# 清空日志
pm2 flush
```

### 2. 系统监控

```bash
# PM2 监控
pm2 monit

# 系统资源
pm2 describe e2e-socket
```

### 3. 日志轮转

创建 `/etc/logrotate.d/e2e-socket`：

```
/var/www/e2e-socket/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

## 性能优化

### 1. Node.js 优化

在启动脚本中设置环境变量：

```bash
# 增加内存限制
export NODE_OPTIONS="--max-old-space-size=2048"

# 启用集群模式（PM2）
pm2 start server.js -i max
```

### 2. WebSocket 优化

修改 `config/config.js`：

```javascript
export const config = {
  // 调整超时设置
  connectionTimeout: 60000,
  
  // 限制消息大小
  message: {
    maxLength: 1024 * 1024 // 1MB
  },
  
  // 限制房间人数
  room: {
    maxMembers: 50
  }
};
```

### 3. 系统优化

调整系统限制：

```bash
# 增加文件描述符限制
ulimit -n 65536

# 永久修改 /etc/security/limits.conf
* soft nofile 65536
* hard nofile 65536
```

## 安全建议

### 1. 防火墙配置

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable

# 禁止直接访问应用端口
sudo ufw deny 8080/tcp
sudo ufw deny 3000/tcp
```

### 2. 限制请求频率

使用 Nginx 限流：

```nginx
# 在 http 块中添加
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_conn_zone $binary_remote_addr zone=conn:10m;

# 在 location 块中使用
location /api {
    limit_req zone=api burst=20;
    limit_conn conn 10;
    # ... 其他配置
}
```

### 3. 环境变量

创建 `.env` 文件存储敏感信息：

```bash
NODE_ENV=production
WS_PORT=8080
API_PORT=3000
SECRET_KEY=your-secret-key
```

不要提交 `.env` 到版本控制！

### 4. 定期更新

```bash
# 更新依赖
npm update
npm audit fix

# 检查安全漏洞
npm audit
```

## 健康检查

创建健康检查脚本 `healthcheck.sh`：

```bash
#!/bin/bash

# 检查 HTTP API
http_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)

if [ "$http_status" -eq 200 ]; then
    echo "HTTP API is healthy"
else
    echo "HTTP API is down"
    # 重启服务
    pm2 restart e2e-socket
fi

# 检查 WebSocket
# 需要安装 wscat: npm install -g wscat
# ... WebSocket 检查逻辑
```

设置 cron 定时检查：

```bash
# 编辑 crontab
crontab -e

# 每 5 分钟检查一次
*/5 * * * * /path/to/healthcheck.sh
```

## 故障排查

### 常见问题

1. **端口被占用**
```bash
# 查找占用端口的进程
lsof -i :8080
# 或
netstat -tulpn | grep 8080
```

2. **权限问题**
```bash
# 给予执行权限
chmod +x server.js
```

3. **内存不足**
```bash
# 查看内存使用
free -h
pm2 describe e2e-socket
```

## 备份和恢复

### 备份

```bash
# 备份代码
tar -czf e2e-socket-backup.tar.gz /var/www/e2e-socket

# 备份 PM2 配置
pm2 save
cp ~/.pm2/dump.pm2 /backup/
```

### 恢复

```bash
# 恢复代码
tar -xzf e2e-socket-backup.tar.gz -C /var/www/

# 恢复 PM2
pm2 resurrect
```

## 总结

部署 E2E WebSocket 服务器的关键步骤：

1. ✅ 准备服务器环境
2. ✅ 安装依赖和应用
3. ✅ 配置进程管理（PM2）
4. ✅ 设置反向代理（Nginx）
5. ✅ 配置 SSL/TLS
6. ✅ 启用监控和日志
7. ✅ 优化性能
8. ✅ 加强安全
9. ✅ 设置备份

祝部署顺利！ 🚀

