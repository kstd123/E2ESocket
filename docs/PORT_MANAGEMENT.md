# 端口管理指南

本文档介绍如何管理和配置 E2E WebSocket 服务器的端口。

## 🔌 默认端口

- **WebSocket 服务器**: `8080`
- **HTTP API 服务器**: `3000`

## ✨ 自动端口切换（新功能）

### 工作原理

服务器启动时会自动检测配置的端口是否可用：

1. **首选端口可用** - 使用配置的端口启动
2. **端口被占用** - 自动查找并使用下一个可用端口

### 示例

```bash
$ npm start

========================================
  E2E WebSocket Server Starting...  
========================================

正在检查端口可用性...
⚠️  WebSocket 端口 8080 被占用，使用备用端口 8081
⚠️  HTTP API 端口 3000 被占用，使用备用端口 3001

✓ WebSocket Server: ws://localhost:8081
✓ HTTP API Server: http://localhost:3001

========================================
  Server is ready!  
========================================
```

## 🛠️ 配置端口的方法

### 方式 1: 自动端口切换（推荐）

直接启动服务器，系统会自动处理端口冲突：

```bash
npm start
```

**优点**：
- 无需手动配置
- 自动避免端口冲突
- 开发环境友好

### 方式 2: 环境变量（推荐用于生产环境）

通过环境变量指定端口：

```bash
# Unix/Linux/macOS
WS_PORT=9090 API_PORT=4000 npm start

# Windows CMD
set WS_PORT=9090 && set API_PORT=4000 && npm start

# Windows PowerShell
$env:WS_PORT=9090; $env:API_PORT=4000; npm start
```

**优点**：
- 不需要修改代码
- 适合 Docker 和 CI/CD
- 易于管理多环境配置

### 方式 3: 修改配置文件

编辑 `config/config.js`：

```javascript
export const config = {
  wsPort: parseInt(process.env.WS_PORT) || 9090,  // 修改默认端口
  apiPort: parseInt(process.env.API_PORT) || 4000, // 修改默认端口
  // ...
};
```

**优点**：
- 永久生效
- 项目级配置

### 方式 4: .env 文件

创建 `.env` 文件（从 `.env.example` 复制）：

```bash
# 复制示例文件
cp .env.example .env
```

编辑 `.env`：

```env
WS_PORT=9090
API_PORT=4000
```

然后使用 `dotenv` 加载（需要安装 `dotenv` 包）：

```bash
npm install dotenv
```

在 `server.js` 开头添加：

```javascript
import 'dotenv/config';
```

## 🔍 检查端口占用

### macOS/Linux

```bash
# 查看端口占用
lsof -i :8080

# 查看所有监听端口
lsof -i -P -n | grep LISTEN

# 查找占用特定端口的进程
netstat -vanp tcp | grep 8080
```

### Windows

```bash
# 查看端口占用
netstat -ano | findstr :8080

# 查看所有监听端口
netstat -ano | findstr LISTENING
```

## ⚙️ 端口范围

自动端口切换会在以下范围内查找可用端口：

- **起始端口**: 配置的端口
- **查找范围**: 起始端口 + 100
- **示例**: 如果配置为 8080，会尝试 8080-8180

你可以修改 `src/utils/port-finder.js` 来调整查找范围：

```javascript
export const findAvailablePort = async (startPort, maxAttempts = 10) => {
  // maxAttempts 控制查找范围
  // 增加这个值可以扩大查找范围
  // ...
};
```

## 🚀 生产环境建议

### 1. 使用标准端口

```bash
# 使用 80 和 443 需要 root 权限
sudo WS_PORT=443 API_PORT=80 npm start
```

### 2. 使用反向代理（推荐）

使用 Nginx 等反向代理，让应用运行在非特权端口：

```nginx
server {
    listen 80;
    
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    location /api {
        proxy_pass http://localhost:3000;
    }
}
```

### 3. 使用进程管理器

使用 PM2 管理端口配置：

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'e2e-socket',
    script: './server.js',
    env_production: {
      NODE_ENV: 'production',
      WS_PORT: 8080,
      API_PORT: 3000
    }
  }]
};
```

启动：

```bash
pm2 start ecosystem.config.js --env production
```

### 4. Docker 端口映射

```yaml
# docker-compose.yml
services:
  e2e-socket:
    ports:
      - "80:8080"    # 宿主机:容器
      - "443:3000"
    environment:
      - WS_PORT=8080
      - API_PORT=3000
```

## 🔒 安全建议

### 1. 防火墙配置

只开放必要的端口：

```bash
# UFW (Ubuntu)
sudo ufw allow 8080/tcp
sudo ufw allow 3000/tcp
sudo ufw enable

# firewalld (CentOS)
sudo firewall-cmd --add-port=8080/tcp --permanent
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

### 2. 绑定到本地地址

修改代码绑定到特定 IP：

```javascript
// WebSocket 服务器
this.wss = new WSServer({ 
  port: this.port,
  host: '127.0.0.1'  // 只监听本地
});

// HTTP 服务器
apiServer.listen(apiPort, '127.0.0.1', () => {
  // ...
});
```

### 3. 使用环境隔离

不同环境使用不同端口：

```javascript
const config = {
  development: {
    wsPort: 8080,
    apiPort: 3000
  },
  staging: {
    wsPort: 8081,
    apiPort: 3001
  },
  production: {
    wsPort: 8082,
    apiPort: 3002
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

## 🐛 故障排查

### 问题 1: 端口仍然被占用

**检查步骤**：

1. 确认没有其他实例在运行
```bash
ps aux | grep node
```

2. 检查端口占用
```bash
lsof -i :8080
```

3. 终止占用进程
```bash
kill -9 <PID>
```

### 问题 2: 权限不足

**错误信息**：
```
Error: listen EACCES: permission denied 0.0.0.0:80
```

**解决方案**：
- 使用非特权端口（>1024）
- 使用 sudo 运行（不推荐）
- 使用反向代理

### 问题 3: 自动端口切换不工作

**检查步骤**：

1. 确认使用最新代码
2. 查看控制台输出
3. 检查 `port-finder.js` 是否存在
4. 查看错误日志

## 📝 最佳实践

### 1. 开发环境

```bash
# 使用默认端口 + 自动切换
npm run dev
```

### 2. 测试环境

```bash
# 使用环境变量指定端口
WS_PORT=8081 API_PORT=3001 npm start
```

### 3. 生产环境

```bash
# 使用 PM2 + 配置文件
pm2 start ecosystem.config.js --env production
```

### 4. Docker 环境

```bash
# 使用 docker-compose
docker-compose up -d
```

## 📚 相关文档

- [快速开始指南](../QUICKSTART.md)
- [部署指南](../DEPLOYMENT.md)
- [配置文件说明](../config/config.js)

---

有任何问题？请查看主文档或提交 Issue。

