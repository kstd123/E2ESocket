# 快速开始指南

本指南将帮助你快速启动和使用 E2E WebSocket 服务器。

## 目录

1. [安装](#安装)
2. [启动服务器](#启动服务器)
3. [使用浏览器客户端](#使用浏览器客户端)
4. [使用 Node.js 客户端](#使用-nodejs-客户端)
5. [测试示例](#测试示例)
6. [常见问题](#常见问题)

## 安装

### 前置要求

- Node.js 18.0 或更高版本
- npm 或 yarn 或 pnpm

### 安装依赖

```bash
npm install
```

## 启动服务器

### 方式 1: 生产模式

```bash
npm start
```

### 方式 2: 开发模式（支持热重载）

```bash
npm run dev
```

服务器启动后，你会看到：

```
========================================
  E2E WebSocket Server Starting...  
========================================

✓ WebSocket Server: ws://localhost:8080

✓ HTTP API Server: http://localhost:3000

Available endpoints:
  - GET  http://localhost:3000/health
  - GET  http://localhost:3000/api/stats
  - GET  http://localhost:3000/api/rooms
  ...

========================================
  Server is ready!  
========================================
```

## 使用浏览器客户端

### 打开测试页面

在浏览器中打开 `examples/client.html` 文件：

```bash
open examples/client.html  # macOS
```

或者直接在浏览器中打开文件路径。

### 基本操作

1. **连接服务器**
   - 默认连接地址: `ws://localhost:8080`
   - 点击"连接"按钮

2. **创建或加入房间**
   - 留空房间号自动生成新房间
   - 输入已存在的房间号加入现有房间
   - 选择权限：读写或只读
   - 点击"加入房间"

3. **发送消息**
   - 在消息输入框输入内容
   - 点击"发送"按钮
   - 房间内所有成员都会收到消息

4. **查看房间信息**
   - 点击"房间信息"按钮
   - 查看成员列表、在线人数等

5. **离开房间**
   - 点击"离开房间"按钮

### 多人测试

打开多个浏览器窗口或标签页，每个窗口打开 `client.html`，即可模拟多人同时在线的场景。

## 使用 Node.js 客户端

### 基础示例

```bash
npm run test:client
```

这会运行 `examples/client.js`，演示：
- 连接服务器
- 创建房间
- 发送消息
- 获取房间信息
- 离开房间

### 多客户端测试

```bash
npm run test:multi
```

这会运行 `examples/multi-client-test.js`，演示：
- 多个客户端同时连接
- 不同权限（管理员、读写、只读）
- 管理员功能（踢人、修改权限）
- 点对点消息
- 广播消息

### 加密通信测试

```bash
npm run test:encrypted
```

这会运行 `examples/encrypted-communication.js`，演示：
- 生成密钥对
- 注册和交换公钥
- 发送和接收加密消息
- 端到端加密通信

## 测试示例

### 场景 1: 两人聊天

**终端 1（Alice）:**
```bash
node examples/client.js
# 记录房间号
```

**终端 2（Bob）:**
```javascript
import E2EClient from './examples/client.js';

const bob = new E2EClient('ws://localhost:8080');
await bob.connect();
await bob.joinRoom('ABC123'); // 使用 Alice 的房间号
bob.sendMessage('Hi Alice!');
```

### 场景 2: 测试 HTTP API

```bash
# 检查服务器状态
curl http://localhost:3000/health

# 获取服务器统计
curl http://localhost:3000/api/stats

# 获取所有房间
curl http://localhost:3000/api/rooms

# 生成房间号
curl -X POST http://localhost:3000/api/rooms/generate

# 生成加密密钥对
curl -X POST http://localhost:3000/api/encryption/generate-keys
```

### 场景 3: WebSocket 消息测试

使用 `websocat` 或 `wscat` 工具：

```bash
# 安装 wscat
npm install -g wscat

# 连接服务器
wscat -c ws://localhost:8080

# 加入房间
> {"type":"join_room","data":{"roomId":"","permission":"read_write","isCreate":true}}

# 发送消息
> {"type":"send_message","data":{"content":"Hello, World!","encrypted":false}}

# 获取房间信息
> {"type":"get_room_info","data":{}}
```

## 常见问题

### Q: 端口被占用怎么办？

**A:** 服务器会自动检测端口是否可用，如果被占用会自动使用备用端口。你也可以：

**方式 1: 自动端口切换（推荐）**
服务器启动时会自动检测并使用可用端口：
```bash
npm start
# 如果 8080 被占用，会自动使用 8081, 8082 等
```

**方式 2: 使用环境变量**
```bash
WS_PORT=9090 API_PORT=4000 npm start
```

**方式 3: 修改配置文件**
编辑 `config/config.js`：
```javascript
export const config = {
  wsPort: 8080,  // 改为其他端口
  apiPort: 3000, // 改为其他端口
  // ...
};
```

**方式 4: 查找并关闭占用端口的进程**
```bash
# macOS/Linux
lsof -i :8080
kill -9 <PID>

# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Q: 如何在生产环境部署？

**A:** 生产环境建议：

1. 使用 WSS（WebSocket Secure）
2. 配置 SSL/TLS 证书
3. 使用 Nginx 或其他反向代理
4. 启用防火墙
5. 使用进程管理器（如 PM2）

示例 PM2 配置：

```bash
npm install -g pm2
pm2 start server.js --name e2e-socket
pm2 save
pm2 startup
```

### Q: 如何限制房间人数？

**A:** 修改 `config/config.js`：

```javascript
room: {
  maxMembers: 50, // 修改为你想要的人数
}
```

### Q: 消息最大长度是多少？

**A:** 默认 1MB，可在 `config/config.js` 修改：

```javascript
message: {
  maxLength: 1024 * 1024, // 1MB
}
```

### Q: 房间会自动删除吗？

**A:** 是的，空闲超过 24 小时的房间会自动删除。可在配置文件修改：

```javascript
room: {
  expirationTime: 24 * 60 * 60 * 1000, // 24小时
}
```

### Q: 如何实现用户认证？

**A:** 服务器提供了基础的房间管理功能，你可以：

1. 在客户端连接时发送认证信息
2. 在服务器端验证 token
3. 使用第三方认证服务（如 JWT）
4. 扩展 WebSocketServer 类添加认证逻辑

示例：

```javascript
// 客户端
ws.send(JSON.stringify({
  type: 'authenticate',
  data: {
    token: 'your-jwt-token'
  }
}));

// 服务器端（在 WebSocketServer.js 中添加）
case 'authenticate':
  this.handleAuthenticate(client, message.data);
  break;
```

### Q: 如何持久化消息？

**A:** 当前版本不支持消息持久化。如需此功能，可以：

1. 集成数据库（如 MongoDB、PostgreSQL）
2. 在 `handleSendMessage` 方法中保存消息
3. 提供历史消息查询接口

### Q: 支持文件传输吗？

**A:** 当前版本支持 JSON 数据传输。文件传输建议：

1. 将文件转为 Base64 编码
2. 分块传输大文件
3. 或使用专门的文件传输协议（如 HTTP 上传）

## 下一步

- 阅读完整 [README.md](README.md)
- 查看 [API 文档](README.md#api-文档)
- 浏览示例代码 `examples/`
- 根据需求定制功能

## 获取帮助

如有问题或建议，请：

1. 查看 README.md 文档
2. 检查服务器日志
3. 提交 Issue
4. 查看示例代码

祝使用愉快！ 🚀

