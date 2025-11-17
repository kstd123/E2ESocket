# 🚀 立即开始

欢迎使用 E2E WebSocket 服务器！按照以下步骤快速启动。

## 📋 前置要求

- Node.js 18.0 或更高版本
- npm 或 yarn

## ⚡ 快速启动（3 步）

### 1️⃣ 安装依赖

```bash
npm install
```

### 2️⃣ 启动服务器

```bash
npm start
```

看到以下输出说明启动成功：

```
========================================
  E2E WebSocket Server Starting...  
========================================

✓ WebSocket Server: ws://localhost:8080
✓ HTTP API Server: http://localhost:3000
```

### 3️⃣ 测试连接

打开新的终端窗口：

```bash
npm test
```

## 🎯 下一步

### 📱 使用浏览器客户端

在浏览器中打开：
```
examples/client.html
```

### 💻 运行示例代码

```bash
# 基础客户端
npm run test:client

# 多客户端测试
npm run test:multi

# 加密通信测试
npm run test:encrypted
```

## 📚 文档

- **完整文档**: [README.md](README.md)
- **快速指南**: [QUICKSTART.md](QUICKSTART.md)
- **部署指南**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **项目总结**: [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

## 🔧 常用命令

```bash
# 启动服务器
npm start

# 开发模式（热重载）
npm run dev

# 测试连接
npm test

# 运行示例
npm run test:client
npm run test:multi
npm run test:encrypted
```

## 🌐 访问地址

- WebSocket: `ws://localhost:8080`
- HTTP API: `http://localhost:3000`
- 健康检查: `http://localhost:3000/health`
- API 文档: `http://localhost:3000/api/docs`

## 🆘 遇到问题？

1. **端口被占用**
   - ✨ 服务器会自动检测并使用可用端口！
   - 或使用环境变量：`WS_PORT=9090 API_PORT=4000 npm start`
   - 或修改 `config/config.js` 中的端口配置

2. **依赖安装失败**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **连接测试失败**
   - 确保服务器正在运行
   - 检查防火墙设置
   - 查看服务器输出的实际端口号

4. **查看更多**
   - 查看 [QUICKSTART.md](QUICKSTART.md) 的常见问题部分
   - 查看 [docs/PORT_MANAGEMENT.md](docs/PORT_MANAGEMENT.md) 端口管理指南

## 💡 快速示例

### WebSocket 客户端（浏览器）

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  // 加入房间
  ws.send(JSON.stringify({
    type: 'join_room',
    data: {
      roomId: '',  // 留空自动生成
      permission: 'read_write',
      isCreate: true
    }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('收到消息:', message);
};
```

### HTTP API 测试

```bash
# 健康检查
curl http://localhost:3000/health

# 服务器统计
curl http://localhost:3000/api/stats

# 生成房间号
curl -X POST http://localhost:3000/api/rooms/generate
```

## 🎉 开始探索

现在你已经准备好了！尽情探索 E2E WebSocket 服务器的强大功能吧！

如有任何问题，请查看完整文档或提交 Issue。

---

**祝使用愉快！** 🚀

