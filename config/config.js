// 服务器配置文件
export const config = {
  // WebSocket 端口（可通过环境变量 WS_PORT 覆盖）
  wsPort: parseInt(process.env.WS_PORT) || 8080,
  
  // HTTP API 端口（可通过环境变量 API_PORT 覆盖）
  apiPort: parseInt(process.env.API_PORT) || 3001,

    // 房间配置
    room: {
        // 房间号最小长度
        minRoomIdLength: 4,
        // 房间号最大长度
        maxRoomIdLength: 20,
        // 房间最大人数
        maxMembers: 50,
        // 房间过期时间（毫秒），空闲超过此时间自动删除
        expirationTime: 24 * 60 * 60 * 1000 // 24小时
    },

    // 消息配置
    message: {
        // 最大消息长度（字节）
        maxLength: 1024 * 1024, // 1MB
        // 消息类型
        types: {
            JOIN: 'join',
            LEAVE: 'leave',
            MESSAGE: 'message',
            BROADCAST: 'broadcast',
            ROOM_INFO: 'room_info',
            ERROR: 'error',
            KICK: 'kick',
            PERMISSION_UPDATE: 'permission_update'
        }
    },

    // 权限类型
    permissions: {
        ADMIN: 'admin',
        READ_WRITE: 'read_write',
        READ_ONLY: 'read_only'
    }
};

