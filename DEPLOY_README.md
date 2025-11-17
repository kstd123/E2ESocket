# 🚀 生产环境部署完成！

## ✅ 已完成的配置

### 1. **静态文件服务** 📁
- ✅ 添加了 Express 静态文件服务
- ✅ 客户端页面可通过 HTTP 访问
- ✅ 支持 `/client/client.html` 和 `/examples/` 路径
- ✅ 首页自动重定向到客户端

### 2. **环境自动检测** 🔄
- ✅ 客户端自动检测运行环境（本地/服务器）
- ✅ WebSocket 地址自动配置
- ✅ API 地址自动配置
- ✅ 支持 HTTP/HTTPS 自动切换

### 3. **PM2 配置** ⚙️
- ✅ 完整的 PM2 生产环境配置
- ✅ 日志管理和轮转
- ✅ 自动重启和内存限制
- ✅ 环境变量管理
- ✅ 开机自启配置

### 4. **部署脚本** 📜
- ✅ 一键部署脚本 (`scripts/deploy.sh`)
- ✅ 自动检查系统要求
- ✅ 依赖安装和服务启动
- ✅ 状态验证和显示

### 5. **Nginx 配置** 🌐
- ✅ 反向代理配置模板
- ✅ WebSocket 代理支持
- ✅ HTTPS/SSL 配置示例
- ✅ 静态文件缓存优化

### 6. **完整文档** 📚
- ✅ 生产环境部署指南
- ✅ 快速部署参考
- ✅ 故障排查指南
- ✅ 性能优化建议

## 📦 部署方式

### 方式 1: 一键部署（推荐）

```bash
# 在服务器上执行
cd /var/www/e2eSocket
npm run deploy
```

### 方式 2: 手动部署

```bash
# 1. 安装依赖
npm ci --production

# 2. 启动服务
npm run pm2:start

# 3. 保存配置
pm2 save
pm2 startup
```

### 方式 3: 使用 npm 脚本

```bash
# 生产环境
npm run deploy

# 开发环境
npm run deploy:dev
```

## 🌍 访问地址

部署完成后，通过以下方式访问：

### 本地测试

```
Web客户端: http://localhost:3001
直接访问:  http://localhost:3001/client/client.html
WebSocket: ws://localhost:8080
API文档:   http://localhost:3001/api/docs
健康检查:  http://localhost:3001/health
```

### 服务器部署

```
Web客户端: http://your-server-ip:3001
或使用域名: http://your-domain.com (需配置 Nginx)
```

## 🔧 配置说明

### 端口配置

默认端口（可在 `ecosystem.config.js` 修改）:
- **WebSocket**: 8080
- **HTTP API**: 3001

### 环境变量

```javascript
// ecosystem.config.js
env_production: {
  NODE_ENV: 'production',
  WS_PORT: 8080,
  API_PORT: 3001
}
```

### 客户端自动配置

客户端会自动检测环境：

- **本地文件 (file://)**: 使用 `localhost:8080` 和 `localhost:3001`
- **HTTP 服务器**: 使用当前域名和端口
- **HTTPS 服务器**: 自动切换到 WSS

## 📊 管理命令

### PM2 命令

```bash
npm run pm2:start      # 启动服务
npm run pm2:stop       # 停止服务
npm run pm2:restart    # 重启服务
npm run pm2:logs       # 查看日志
npm run pm2:status     # 查看状态
pm2 monit             # 实时监控
```

### 查看日志

```bash
# 所有日志
pm2 logs e2e-socket

# 只看最近100行
pm2 logs e2e-socket --lines 100

# 只看错误
pm2 logs e2e-socket --err

# 清空日志
pm2 flush
```

## 🌐 Nginx 配置（可选但推荐）

### 为什么使用 Nginx？

- ✅ SSL/TLS 终止（HTTPS 支持）
- ✅ 负载均衡
- ✅ 静态文件缓存
- ✅ Gzip 压缩
- ✅ 安全防护

### 快速配置

```bash
# 1. 复制配置文件
sudo cp config/nginx.conf /etc/nginx/sites-available/e2e-socket

# 2. 编辑域名
sudo nano /etc/nginx/sites-available/e2e-socket
# 修改 server_name 为你的域名

# 3. 启用配置
sudo ln -s /etc/nginx/sites-available/e2e-socket /etc/nginx/sites-enabled/

# 4. 测试并重启
sudo nginx -t
sudo systemctl reload nginx
```

### 配置 HTTPS

```bash
# 使用 Let's Encrypt
sudo certbot --nginx -d your-domain.com

# 证书会自动更新
```

## 🔒 安全建议

### 1. 防火墙

```bash
# 只开放必要端口
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 22/tcp    # SSH
sudo ufw enable
```

如果不使用 Nginx 代理：

```bash
sudo ufw allow 8080/tcp  # WebSocket
sudo ufw allow 3001/tcp  # API
```

### 2. 使用非 root 用户

```bash
# 创建专用用户
sudo useradd -m -s /bin/bash e2eapp
sudo chown -R e2eapp:e2eapp /var/www/e2eSocket

# 切换用户部署
sudo su - e2eapp
cd /var/www/e2eSocket
npm run deploy
```

### 3. 环境变量安全

不要在代码中硬编码敏感信息，使用环境变量：

```bash
# 创建 .env 文件（不要提交到 git）
cat > .env << EOF
NODE_ENV=production
WS_PORT=8080
API_PORT=3001
# 其他敏感配置
EOF
```

## 🎯 部署检查清单

部署前：
- [ ] Node.js 版本 >= 16
- [ ] npm 已安装
- [ ] Git 已配置
- [ ] 服务器可访问
- [ ] 端口未被占用

部署后：
- [ ] PM2 进程运行正常 (`pm2 status`)
- [ ] 日志无错误 (`pm2 logs`)
- [ ] HTTP API 可访问 (`curl http://localhost:3001/health`)
- [ ] WebSocket 可连接
- [ ] Web 客户端可打开
- [ ] 配置功能正常
- [ ] 二维码功能正常

生产环境：
- [ ] Nginx 已配置（推荐）
- [ ] HTTPS 已启用（推荐）
- [ ] 防火墙已配置
- [ ] PM2 开机自启
- [ ] 日志轮转已配置
- [ ] 监控已设置

## 🐛 故障排查

### 问题 1: 端口被占用

```bash
# 查看占用端口的进程
sudo netstat -tunlp | grep 8080
sudo netstat -tunlp | grep 3001

# 杀死进程
sudo kill -9 <PID>
```

### 问题 2: PM2 无法启动

```bash
# 删除旧进程
pm2 delete all

# 清空日志
pm2 flush

# 重新启动
npm run deploy
```

### 问题 3: 客户端无法连接

```bash
# 检查防火墙
sudo ufw status

# 检查 Nginx 日志
sudo tail -f /var/log/nginx/error.log

# 手动测试
curl http://localhost:3001/
curl http://localhost:3001/client/client.html
```

### 问题 4: WebSocket 连接失败

```bash
# 测试端口
telnet localhost 8080

# 检查服务日志
pm2 logs e2e-socket

# 查看 WebSocket 配置
pm2 show e2e-socket
```

## 📈 性能优化

### 1. PM2 集群模式

如果服务器有多核 CPU：

```javascript
// ecosystem.config.js
instances: 'max',      // 使用所有核心
exec_mode: 'cluster'
```

### 2. 增加文件描述符限制

```bash
ulimit -n 65536
```

永久配置：

```bash
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf
```

### 3. Nginx 缓存和压缩

已在 `config/nginx.conf` 中配置好。

## 📚 相关文档

- **完整部署指南**: `生产环境部署指南.md`
- **快速参考**: `DEPLOYMENT_QUICKSTART.md`
- **配置管理**: `docs/配置管理和二维码功能.md`
- **项目说明**: `README.md`
- **快速开始**: `QUICKSTART.md`

## 🆘 获取帮助

- 查看日志: `pm2 logs e2e-socket`
- 查看状态: `pm2 status`
- 实时监控: `pm2 monit`
- GitHub Issues: <your-repo>/issues

## 🎉 部署成功！

现在你可以：

1. **访问 Web 客户端**: `http://your-server:3001`
2. **创建房间并邀请他人**
3. **使用配置管理功能**
4. **生成二维码分享房间**
5. **享受端到端加密通信**

---

**祝使用愉快！** 🚀

