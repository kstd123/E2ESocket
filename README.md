# E2E WebSocket 服务器

一个支持端到端加密、房间管理和权限控制的 WebSocket 双工服务器。

## 功能特性

### 核心功能
- ✅ **WebSocket 双工通信**：支持实时双向数据传输
- ✅ **房间管理系统**：支持创建、加入、离开房间
- ✅ **权限控制**：管理员、读写、只读三种权限
- ✅ **端到端加密**：基于 Signal 协议的加密通信
- ✅ **实时广播**：消息实时广播给房间内所有成员
- ✅ **在线状态**：实时显示房间在线人数
- ✅ **HTTP API**：提供 RESTful API 接口

### 高级功能
- 🔐 公钥注册和分发
- 👑 管理员权限（踢人、修改权限）
- 🔒 房间权限控制（只读/读写）
- 💬 点对点消息和广播消息
- 📊 服务器统计信息
- 🧹 自动清理过期房间
- ⚙️ **房间配置管理**：管理员可发布JSON配置，实时广播给所有成员
- 📱 **二维码加入**：生成房间二维码，扫码快速加入

## 技术栈

- **Node.js** - 运行环境
- **ws** - WebSocket 库
- **Express** - HTTP API 框架
- **crypto** - 加密模块（Signal 协议）

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动服务器

```bash
npm start
```

或使用开发模式（支持热重载）：

```bash
npm run dev
```

### 服务器地址

- **WebSocket**: `ws://localhost:8080`
- **HTTP API**: `http://localhost:3000`

### ✨ 端口自动切换

服务器会自动检测端口是否可用，如果被占用会自动使用备用端口：

```bash
npm start

# 如果端口被占用，会显示：
# ⚠️  WebSocket 端口 8080 被占用，使用备用端口 8081
# ✓ WebSocket Server: ws://localhost:8081
```

**其他配置方式**：

```bash
# 使用环境变量指定端口
WS_PORT=9090 API_PORT=4000 npm start

# 或修改 config/config.js 中的默认端口
```

详细的端口管理文档请查看 [docs/PORT_MANAGEMENT.md](docs/PORT_MANAGEMENT.md)

## API 文档

### HTTP API

#### 1. 健康检查
```
GET /health
```

响应：
```json
{
  "status": "ok",
  "timestamp": 1234567890
}
```

#### 2. 获取服务器统计
```
GET /api/stats
```

响应：
```json
{
  "success": true,
  "data": {
    "connectedClients": 10,
    "rooms": [...],
    "uptime": 3600
  }
}
```

#### 3. 获取所有房间
```
GET /api/rooms
```

响应：
```json
{
  "success": true,
  "data": [
    {
      "roomId": "ABC123",
      "memberCount": 5,
      "createdAt": 1234567890,
      "lastActivity": 1234567890
    }
  ]
}
```

#### 4. 获取房间信息
```
GET /api/rooms/:roomId
```

响应：
```json
{
  "success": true,
  "data": {
    "id": "ABC123",
    "memberCount": 5,
    "maxMembers": 50,
    "members": [...]
  }
}
```

#### 5. 生成房间号
```
POST /api/rooms/generate
```

响应：
```json
{
  "success": true,
  "data": {
    "roomId": "ABC123",
    "message": "Room ID generated. Use WebSocket to join."
  }
}
```

#### 6. 生成加密密钥对
```
POST /api/encryption/generate-keys
```

响应：
```json
{
  "success": true,
  "data": {
    "publicKey": "-----BEGIN PUBLIC KEY-----...",
    "privateKey": "-----BEGIN PRIVATE KEY-----..."
  }
}
```

#### 7. 生成房间二维码
```
GET /api/rooms/:roomId/qrcode?format=data
```

参数：
- `roomId`: 房间号
- `format`: 格式类型
  - `png`: PNG图片（默认）
  - `svg`: SVG图片
  - `data`: Data URL（JSON响应）

响应（format=data）：
```json
{
  "success": true,
  "data": {
    "dataUrl": "data:image/png;base64,...",
    "roomId": "ABC123",
    "joinUrl": "http://localhost:3000/join?roomId=ABC123"
  }
}
```

响应（format=png或svg）：
返回图片文件（Content-Type: image/png 或 image/svg+xml）

### WebSocket 协议

#### 连接
```javascript
const ws = new WebSocket('ws://localhost:8080');
```

#### 消息格式
所有消息都使用 JSON 格式：

```json
{
  "type": "message_type",
  "data": {
    // 消息数据
  },
  "error": null,
  "timestamp": 1234567890
}
```

#### 消息类型

##### 1. 加入房间
```json
{
  "type": "join_room",
  "data": {
    "roomId": "ABC123",
    "permission": "read_write",
    "isCreate": false
  }
}
```

参数说明：
- `roomId`: 房间号（可选，为空则自动生成）
- `permission`: 权限类型 (`read_write` | `read_only`)
- `isCreate`: 是否创建新房间

响应：
```json
{
  "type": "join",
  "data": {
    "success": true,
    "roomId": "ABC123",
    "permission": "admin",
    "memberCount": 1,
    "isAdmin": true
  }
}
```

##### 2. 离开房间
```json
{
  "type": "leave_room",
  "data": {}
}
```

响应：
```json
{
  "type": "leave",
  "data": {
    "success": true,
    "roomId": "ABC123"
  }
}
```

##### 3. 发送消息
```json
{
  "type": "send_message",
  "data": {
    "content": "Hello, World!",
    "encrypted": false,
    "targetClientId": null
  }
}
```

参数说明：
- `content`: 消息内容（字符串或加密数据）
- `encrypted`: 是否加密
- `targetClientId`: 目标客户端ID（可选，为空则广播）

响应：
```json
{
  "type": "message",
  "data": {
    "success": true,
    "sent": true
  }
}
```

广播消息（房间内其他成员收到）：
```json
{
  "type": "message",
  "data": {
    "from": "client-id",
    "content": "Hello, World!",
    "encrypted": false,
    "targetClientId": null,
    "timestamp": 1234567890
  }
}
```

##### 4. 获取房间信息
```json
{
  "type": "get_room_info",
  "data": {}
}
```

响应：
```json
{
  "type": "room_info",
  "data": {
    "id": "ABC123",
    "createdAt": 1234567890,
    "memberCount": 5,
    "maxMembers": 50,
    "members": [
      {
        "id": "client-id",
        "permission": "admin",
        "joinedAt": 1234567890
      }
    ]
  }
}
```

##### 5. 踢出成员（仅管理员）
```json
{
  "type": "kick_member",
  "data": {
    "targetClientId": "client-id"
  }
}
```

响应：
```json
{
  "type": "kick",
  "data": {
    "success": true,
    "kickedClientId": "client-id"
  }
}
```

##### 6. 更新权限（仅管理员）
```json
{
  "type": "update_permission",
  "data": {
    "targetClientId": "client-id",
    "permission": "read_only"
  }
}
```

响应：
```json
{
  "type": "permission_update",
  "data": {
    "success": true,
    "targetClientId": "client-id",
    "newPermission": "read_only"
  }
}
```

##### 7. 注册公钥
```json
{
  "type": "register_public_key",
  "data": {
    "publicKey": "-----BEGIN PUBLIC KEY-----..."
  }
}
```

响应：
```json
{
  "type": "register_public_key",
  "data": {
    "success": true,
    "message": "Public key registered"
  }
}
```

##### 8. 发布配置（仅管理员）
```json
{
  "type": "publish_config",
  "data": {
    "config": {
      "title": "示例配置",
      "settings": {
        "value": 123,
        "enabled": true
      }
    }
  }
}
```

响应：
```json
{
  "type": "publish_config",
  "data": {
    "success": true,
    "version": 1
  }
}
```

##### 9. 获取配置
```json
{
  "type": "get_config",
  "data": {}
}
```

响应：
```json
{
  "type": "get_config",
  "data": {
    "config": {
      "title": "示例配置",
      "settings": {}
    },
    "version": 1
  }
}
```

##### 10. 获取房间内所有公钥
```json
{
  "type": "get_public_keys",
  "data": {}
}
```

响应：
```json
{
  "type": "get_public_keys",
  "data": {
    "publicKeys": {
      "client-id-1": "-----BEGIN PUBLIC KEY-----...",
      "client-id-2": "-----BEGIN PUBLIC KEY-----..."
    }
  }
}
```

#### 广播事件

房间内发生特定事件时，服务器会自动广播给所有成员：

```json
{
  "type": "broadcast",
  "data": {
    "event": "member_joined",
    "clientId": "client-id",
    "memberCount": 5,
    "timestamp": 1234567890
  }
}
```

事件类型：
- `member_joined` - 新成员加入
- `member_left` - 成员离开
- `member_kicked` - 成员被踢出
- `permission_updated` - 权限更新
- `config_published` - 配置已发布（包含新配置和版本号）

## 使用示例

### 客户端示例（JavaScript）

```javascript
// 连接到服务器
const ws = new WebSocket('ws://localhost:8080');

// 连接成功
ws.onopen = () => {
  console.log('Connected to server');
  
  // 加入或创建房间
  ws.send(JSON.stringify({
    type: 'join_room',
    data: {
      roomId: 'ABC123', // 留空则自动生成
      permission: 'read_write',
      isCreate: true
    }
  }));
};

// 接收消息
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
  
  switch (message.type) {
    case 'join':
      console.log('Joined room:', message.data.roomId);
      break;
      
    case 'message':
      console.log('Message from:', message.data.from);
      console.log('Content:', message.data.content);
      break;
      
    case 'broadcast':
      console.log('Broadcast event:', message.data.event);
      break;
      
    case 'error':
      console.error('Error:', message.data.error);
      break;
  }
};

// 发送消息
const sendMessage = (content) => {
  ws.send(JSON.stringify({
    type: 'send_message',
    data: {
      content: content,
      encrypted: false
    }
  }));
};

// 获取房间信息
const getRoomInfo = () => {
  ws.send(JSON.stringify({
    type: 'get_room_info',
    data: {}
  }));
};

// 离开房间
const leaveRoom = () => {
  ws.send(JSON.stringify({
    type: 'leave_room',
    data: {}
  }));
};
```

### 端到端加密示例

```javascript
// 1. 生成密钥对
const response = await fetch('http://localhost:3000/api/encryption/generate-keys', {
  method: 'POST'
});
const { publicKey, privateKey } = await response.json();

// 2. 注册公钥
ws.send(JSON.stringify({
  type: 'register_public_key',
  data: {
    publicKey: publicKey
  }
}));

// 3. 获取房间内其他成员的公钥
ws.send(JSON.stringify({
  type: 'get_public_keys',
  data: {}
}));

// 4. 使用对方公钥加密消息并发送
// 注意：实际加密需要在客户端完成
ws.send(JSON.stringify({
  type: 'send_message',
  data: {
    content: encryptedMessage,
    encrypted: true,
    targetClientId: 'target-client-id'
  }
}));
```

## 配置

服务器配置位于 `config/config.js`：

```javascript
{
  wsPort: 8080,              // WebSocket 端口
  apiPort: 3000,             // HTTP API 端口
  room: {
    minRoomIdLength: 4,      // 房间号最小长度
    maxRoomIdLength: 20,     // 房间号最大长度
    maxMembers: 50,          // 房间最大人数
    expirationTime: 86400000 // 房间过期时间（24小时）
  },
  message: {
    maxLength: 1048576       // 最大消息长度（1MB）
  }
}
```

## 应用场景

1. **电脑端和手机端通信**
   - 电脑端发送数据到手机端
   - 手机端发送数据到电脑端
   - 支持文本、文件等多种数据类型

2. **协同编辑**
   - 多人实时协作
   - 修改提交后自动通知所有在线节点
   - 支持冲突处理

3. **安全通信**
   - 端到端加密（Signal 协议）
   - 确保通信内容不被第三方窃取

4. **实时通知**
   - 实时推送消息
   - 状态更新通知
   - 在线人数统计

## 项目结构

```
e2eSocket/
├── package.json              # 项目配置
├── server.js                 # 主服务器入口
├── README.md                 # 项目文档
├── config/
│   └── config.js            # 配置文件
└── src/
    ├── websocket/
    │   ├── WebSocketServer.js  # WebSocket 服务器
    │   └── RoomManager.js      # 房间管理器
    ├── api/
    │   └── routes.js           # HTTP API 路由
    ├── encryption/
    │   └── signal.js           # Signal 加密协议
    └── utils/
        └── helpers.js          # 辅助函数
```

## 安全建议

1. **生产环境部署**
   - 使用 WSS（WebSocket Secure）协议
   - 配置 HTTPS 证书
   - 启用防火墙和 DDoS 防护

2. **加密通信**
   - 始终使用端到端加密
   - 定期更新密钥
   - 安全存储私钥

3. **权限管理**
   - 合理分配权限
   - 定期审查房间成员
   - 及时踢出可疑用户

4. **消息验证**
   - 验证消息格式
   - 限制消息大小
   - 防止恶意注入

## 开发计划

- [ ] 消息持久化
- [ ] 消息历史记录
- [ ] 文件传输支持
- [ ] 房间密码保护
- [ ] 用户认证系统
- [ ] 消息已读回执
- [ ] 离线消息推送

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。

