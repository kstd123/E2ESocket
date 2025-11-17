# 生产环境部署 - 快速参考

## 🚀 一键部署

```bash
# 克隆项目
git clone <your-repo> /var/www/e2eSocket
cd /var/www/e2eSocket

# 运行部署脚本
npm run deploy
```

## 📦 访问地址

部署完成后，可以通过以下地址访问：

- **Web 客户端**: `http://your-server-ip:3001`
- **直接访问**: `http://your-server-ip:3001/client/client.html`
- **WebSocket**: `ws://your-server-ip:8080`
- **API 文档**: `http://your-server-ip:3001/api/docs`

## 🎯 常用命令

### 部署相关

```bash
npm run deploy              # 生产环境部署
npm run deploy:dev          # 开发环境部署
```

### PM2 管理

```bash
npm run pm2:start           # 启动服务
npm run pm2:stop            # 停止服务
npm run pm2:restart         # 重启服务
npm run pm2:logs            # 查看日志
npm run pm2:status          # 查看状态
pm2 monit                   # 实时监控
```

### 服务管理

```bash
# 查看所有进程
pm2 list

# 查看详细信息
pm2 show e2e-socket

# 清空日志
pm2 flush

# 保存配置
pm2 save

# 开机自启
pm2 startup
```

## 🔧 配置文件

### 环境变量

编辑 `ecosystem.config.js`:

```javascript
env_production: {
  NODE_ENV: 'production',
  WS_PORT: 8080,        // WebSocket 端口
  API_PORT: 3001        // API 端口
}
```

### Nginx 反向代理（可选）

```bash
# 安装 Nginx
sudo apt install nginx

# 复制配置
sudo cp config/nginx.conf /etc/nginx/sites-available/e2e-socket
sudo ln -s /etc/nginx/sites-available/e2e-socket /etc/nginx/sites-enabled/

# 修改域名
sudo nano /etc/nginx/sites-available/e2e-socket

# 重启
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 HTTPS 配置

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## 🔥 防火墙

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 3001/tcp
sudo ufw enable
```

## 📊 监控

```bash
# 实时日志
pm2 logs e2e-socket --lines 100

# 系统监控
pm2 monit

# 健康检查
curl http://localhost:3001/health
```

## 🐛 故障排查

```bash
# 检查服务状态
pm2 status

# 查看错误日志
pm2 logs e2e-socket --err

# 检查端口占用
sudo netstat -tunlp | grep -E '8080|3001'

# 重启服务
pm2 restart e2e-socket

# 手动测试
node server.js
```

## 📝 测试

```bash
# 测试 API
curl http://localhost:3001/health

# 测试 WebSocket
npm run test:client

# 测试配置功能
npm run test:config
```

## 🎯 完整部署流程

### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
```

### 2. 部署应用

```bash
# 克隆代码
git clone <repo> /var/www/e2eSocket
cd /var/www/e2eSocket

# 一键部署
npm run deploy
```

### 3. 配置域名（可选）

```bash
# 配置 DNS 记录
# A 记录: your-domain.com -> your-server-ip

# 配置 Nginx
sudo cp config/nginx.conf /etc/nginx/sites-available/e2e-socket
sudo nano /etc/nginx/sites-available/e2e-socket  # 修改域名
sudo ln -s /etc/nginx/sites-available/e2e-socket /etc/nginx/sites-enabled/
sudo systemctl reload nginx

# 配置 HTTPS
sudo certbot --nginx -d your-domain.com
```

### 4. 验证部署

```bash
# 检查服务
pm2 status

# 访问测试
curl http://your-domain.com/health
curl http://your-domain.com/

# 查看日志
pm2 logs e2e-socket
```

## 🌟 生产环境最佳实践

- ✅ 使用 PM2 集群模式（多核CPU）
- ✅ 配置 Nginx 反向代理
- ✅ 启用 HTTPS (Let's Encrypt)
- ✅ 设置防火墙规则
- ✅ 配置日志轮转
- ✅ 启用 PM2 监控
- ✅ 定期备份配置
- ✅ 设置健康检查
- ✅ 监控系统资源

## 📚 更多文档

- 完整部署指南: `生产环境部署指南.md`
- 配置说明: `config/config.js`
- Nginx 配置: `config/nginx.conf`
- PM2 配置: `ecosystem.config.js`

---

**需要帮助？** 查看完整文档或提交 Issue

