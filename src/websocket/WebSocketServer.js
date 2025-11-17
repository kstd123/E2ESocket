import { WebSocketServer as WSServer } from 'ws';
import { RoomManager } from './RoomManager.js';
import { SignalEncryption } from '../encryption/signal.js';
import { config } from '../../config/config.js';
import { 
  generateClientId, 
  createResponse, 
  parseMessage, 
  validateMessage 
} from '../utils/helpers.js';

/**
 * WebSocket 服务器
 * 处理客户端连接、消息路由和房间管理
 */
export class WebSocketServer {
  constructor(port) {
    this.port = port;
    this.wss = null;
    this.roomManager = new RoomManager();
    this.encryption = new SignalEncryption();
    this.clients = new Map(); // clientId -> client 对象
  }

  /**
   * 启动 WebSocket 服务器
   */
  start() {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WSServer({ port: this.port });

        this.wss.on('connection', (ws, req) => {
          this.handleConnection(ws, req);
        });

        this.wss.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            reject(new Error(`端口 ${this.port} 已被占用`));
          } else {
            console.error('WebSocket server error:', error);
          }
        });

        this.wss.on('listening', () => {
          console.log(`WebSocket server started on port ${this.port}`);
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 处理新连接
   */
  handleConnection(ws, req) {
    const clientId = generateClientId();
    const client = {
      id: clientId,
      ws,
      roomId: null,
      permission: null,
      publicKey: null,
      ip: req.socket.remoteAddress,
      connectedAt: Date.now()
    };

    this.clients.set(clientId, client);

    console.log(`Client connected: ${clientId} from ${client.ip}`);

    // 发送欢迎消息
    this.sendToClient(client, config.message.types.JOIN, {
      clientId,
      message: 'Connected to server',
      serverTime: Date.now()
    });

    // 监听消息
    ws.on('message', (data) => {
      this.handleMessage(client, data);
    });

    // 监听连接关闭
    ws.on('close', () => {
      this.handleDisconnect(client);
    });

    // 监听错误
    ws.on('error', (error) => {
      console.error(`Client ${clientId} error:`, error);
    });

    // 心跳检测
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });
  }

  /**
   * 处理客户端消息
   */
  handleMessage(client, data) {
    try {
      const message = parseMessage(data.toString());

      if (!validateMessage(message)) {
        this.sendError(client, 'Invalid message format');
        return;
      }

      console.log(`Received message from ${client.id}:`, message.type);

      // 路由消息到对应的处理器
      switch (message.type) {
        case 'join_room':
          this.handleJoinRoom(client, message.data);
          break;

        case 'leave_room':
          this.handleLeaveRoom(client);
          break;

        case 'send_message':
          this.handleSendMessage(client, message.data);
          break;

        case 'get_room_info':
          this.handleGetRoomInfo(client);
          break;

        case 'kick_member':
          this.handleKickMember(client, message.data);
          break;

        case 'update_permission':
          this.handleUpdatePermission(client, message.data);
          break;

        case 'register_public_key':
          this.handleRegisterPublicKey(client, message.data);
          break;

        case 'get_public_keys':
          this.handleGetPublicKeys(client);
          break;

        case 'publish_config':
          this.handlePublishConfig(client, message.data);
          break;

        case 'get_config':
          this.handleGetConfig(client);
          break;

        default:
          this.sendError(client, `Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendError(client, error.message);
    }
  }

  /**
   * 处理加入房间
   */
  handleJoinRoom(client, data) {
    try {
      const { roomId, permission } = data;
      const isCreate = data.isCreate || false;

      const result = this.roomManager.joinRoom(
        client,
        roomId,
        permission || config.permissions.READ_WRITE,
        isCreate
      );

      // 发送加入成功消息
      this.sendToClient(client, config.message.types.JOIN, {
        success: true,
        ...result
      });

      // 如果房间有配置，发送给新加入的客户端
      try {
        const roomConfig = this.roomManager.getRoomConfig(result.roomId);
        if (roomConfig.config) {
          this.sendToClient(client, 'config_update', {
            config: roomConfig.config,
            version: roomConfig.version
          });
        }
      } catch (error) {
        console.error('Error sending room config:', error);
      }

      // 广播新成员加入消息
      const broadcastMessage = createResponse(
        config.message.types.BROADCAST,
        {
          event: 'member_joined',
          clientId: client.id,
          memberCount: result.memberCount,
          timestamp: Date.now()
        }
      );

      this.roomManager.broadcastToRoom(
        result.roomId,
        broadcastMessage,
        client.id
      );

      console.log(`Client ${client.id} joined room ${result.roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      this.sendError(client, error.message);
    }
  }

  /**
   * 处理离开房间
   */
  handleLeaveRoom(client) {
    try {
      const result = this.roomManager.leaveRoom(client.id);

      if (!result) {
        this.sendError(client, 'Not in any room');
        return;
      }

      // 发送离开成功消息
      this.sendToClient(client, config.message.types.LEAVE, {
        success: true,
        roomId: result.roomId
      });

      // 如果房间未删除，广播成员离开消息
      if (!result.deleted) {
        const broadcastMessage = createResponse(
          config.message.types.BROADCAST,
          {
            event: 'member_left',
            clientId: client.id,
            memberCount: result.memberCount,
            timestamp: Date.now()
          }
        );

        this.roomManager.broadcastToRoom(result.roomId, broadcastMessage);
      }

      // 清除客户端房间信息
      client.roomId = null;
      client.permission = null;

      console.log(`Client ${client.id} left room ${result.roomId}`);
    } catch (error) {
      console.error('Error leaving room:', error);
      this.sendError(client, error.message);
    }
  }

  /**
   * 处理发送消息
   */
  handleSendMessage(client, data) {
    try {
      // 检查客户端是否在房间中
      if (!client.roomId) {
        this.sendError(client, 'Not in any room');
        return;
      }

      // 检查权限
      if (client.permission === config.permissions.READ_ONLY) {
        this.sendError(client, 'Permission denied: Read-only mode');
        return;
      }

      // 广播消息
      const broadcastMessage = createResponse(
        config.message.types.MESSAGE,
        {
          from: client.id,
          content: data.content,
          encrypted: data.encrypted || false,
          targetClientId: data.targetClientId || null,
          timestamp: Date.now()
        }
      );

      // 如果指定了目标客户端，只发送给目标客户端
      if (data.targetClientId) {
        const targetClient = this.clients.get(data.targetClientId);
        if (targetClient && targetClient.roomId === client.roomId) {
          targetClient.ws.send(broadcastMessage);
        } else {
          this.sendError(client, 'Target client not found in room');
        }
      } else {
        // 广播给房间所有成员
        const sentCount = this.roomManager.broadcastToRoom(
          client.roomId,
          broadcastMessage
        );

        console.log(`Message from ${client.id} broadcasted to ${sentCount} clients`);
      }

      // 发送确认消息
      this.sendToClient(client, config.message.types.MESSAGE, {
        success: true,
        sent: true
      });
    } catch (error) {
      console.error('Error sending message:', error);
      this.sendError(client, error.message);
    }
  }

  /**
   * 处理获取房间信息
   */
  handleGetRoomInfo(client) {
    try {
      if (!client.roomId) {
        this.sendError(client, 'Not in any room');
        return;
      }

      const roomInfo = this.roomManager.getRoomInfo(client.roomId);

      if (!roomInfo) {
        this.sendError(client, 'Room not found');
        return;
      }

      this.sendToClient(client, config.message.types.ROOM_INFO, roomInfo);
    } catch (error) {
      console.error('Error getting room info:', error);
      this.sendError(client, error.message);
    }
  }

  /**
   * 处理踢出成员
   */
  handleKickMember(client, data) {
    try {
      const { targetClientId } = data;

      const result = this.roomManager.kickMember(client.id, targetClientId);

      // 通知被踢出的客户端
      const targetClient = this.clients.get(targetClientId);
      if (targetClient) {
        this.sendToClient(targetClient, config.message.types.KICK, {
          reason: 'Kicked by admin',
          roomId: result.roomId
        });

        // 清除目标客户端的房间信息
        targetClient.roomId = null;
        targetClient.permission = null;
      }

      // 广播踢出消息
      const broadcastMessage = createResponse(
        config.message.types.BROADCAST,
        {
          event: 'member_kicked',
          clientId: targetClientId,
          timestamp: Date.now()
        }
      );

      this.roomManager.broadcastToRoom(result.roomId, broadcastMessage);

      // 发送确认消息
      this.sendToClient(client, config.message.types.KICK, {
        success: true,
        kickedClientId: targetClientId
      });

      console.log(`Client ${targetClientId} kicked from room by ${client.id}`);
    } catch (error) {
      console.error('Error kicking member:', error);
      this.sendError(client, error.message);
    }
  }

  /**
   * 处理更新权限
   */
  handleUpdatePermission(client, data) {
    try {
      const { targetClientId, permission } = data;

      const result = this.roomManager.updatePermission(
        client.id,
        targetClientId,
        permission
      );

      // 通知目标客户端权限已更新
      const targetClient = this.clients.get(targetClientId);
      if (targetClient) {
        this.sendToClient(targetClient, config.message.types.PERMISSION_UPDATE, {
          newPermission: permission
        });
      }

      // 广播权限更新消息
      const broadcastMessage = createResponse(
        config.message.types.BROADCAST,
        {
          event: 'permission_updated',
          clientId: targetClientId,
          newPermission: permission,
          timestamp: Date.now()
        }
      );

      this.roomManager.broadcastToRoom(result.roomId, broadcastMessage);

      // 发送确认消息
      this.sendToClient(client, config.message.types.PERMISSION_UPDATE, {
        success: true,
        ...result
      });

      console.log(`Permission updated for ${targetClientId} to ${permission}`);
    } catch (error) {
      console.error('Error updating permission:', error);
      this.sendError(client, error.message);
    }
  }

  /**
   * 处理注册公钥
   */
  handleRegisterPublicKey(client, data) {
    try {
      const { publicKey } = data;

      this.encryption.registerPublicKey(client.id, publicKey);
      client.publicKey = publicKey;

      this.sendToClient(client, 'register_public_key', {
        success: true,
        message: 'Public key registered'
      });

      console.log(`Public key registered for client ${client.id}`);
    } catch (error) {
      console.error('Error registering public key:', error);
      this.sendError(client, error.message);
    }
  }

  /**
   * 处理获取公钥列表
   */
  handleGetPublicKeys(client) {
    try {
      if (!client.roomId) {
        this.sendError(client, 'Not in any room');
        return;
      }

      const roomInfo = this.roomManager.getRoomInfo(client.roomId);
      if (!roomInfo) {
        this.sendError(client, 'Room not found');
        return;
      }

      const publicKeys = {};
      roomInfo.members.forEach(member => {
        const memberClient = this.clients.get(member.id);
        if (memberClient && memberClient.publicKey) {
          publicKeys[member.id] = memberClient.publicKey;
        }
      });

      this.sendToClient(client, 'get_public_keys', {
        publicKeys
      });
    } catch (error) {
      console.error('Error getting public keys:', error);
      this.sendError(client, error.message);
    }
  }

  /**
   * 处理发布配置（仅管理员）
   */
  handlePublishConfig(client, data) {
    try {
      const { config: configData } = data;

      if (!configData) {
        this.sendError(client, 'Config data is required');
        return;
      }

      const result = this.roomManager.publishConfig(client.id, configData);

      // 广播配置更新给房间所有成员
      const broadcastMessage = createResponse(
        config.message.types.BROADCAST,
        {
          event: 'config_published',
          config: configData,
          version: result.version,
          timestamp: Date.now()
        }
      );

      this.roomManager.broadcastToRoom(result.roomId, broadcastMessage);

      // 发送确认消息给管理员
      this.sendToClient(client, 'publish_config', {
        success: true,
        version: result.version
      });

      console.log(`Config published in room ${result.roomId}, version ${result.version}`);
    } catch (error) {
      console.error('Error publishing config:', error);
      this.sendError(client, error.message);
    }
  }

  /**
   * 处理获取配置
   */
  handleGetConfig(client) {
    try {
      if (!client.roomId) {
        this.sendError(client, 'Not in any room');
        return;
      }

      const result = this.roomManager.getRoomConfig(client.roomId);

      this.sendToClient(client, 'get_config', {
        config: result.config,
        version: result.version
      });
    } catch (error) {
      console.error('Error getting config:', error);
      this.sendError(client, error.message);
    }
  }

  /**
   * 处理断开连接
   */
  handleDisconnect(client) {
    console.log(`Client disconnected: ${client.id}`);

    // 从房间中移除
    if (client.roomId) {
      const result = this.roomManager.leaveRoom(client.id);
      
      if (result && !result.deleted) {
        // 广播成员离开消息
        const broadcastMessage = createResponse(
          config.message.types.BROADCAST,
          {
            event: 'member_left',
            clientId: client.id,
            memberCount: result.memberCount,
            timestamp: Date.now()
          }
        );

        this.roomManager.broadcastToRoom(result.roomId, broadcastMessage);
      }
    }

    // 移除公钥
    this.encryption.removePublicKey(client.id);

    // 从客户端列表中移除
    this.clients.delete(client.id);
  }

  /**
   * 发送消息给客户端
   */
  sendToClient(client, type, data) {
    if (client.ws.readyState === 1) { // OPEN
      const message = createResponse(type, data);
      client.ws.send(message);
    }
  }

  /**
   * 发送错误消息
   */
  sendError(client, errorMessage) {
    this.sendToClient(client, config.message.types.ERROR, {
      error: errorMessage
    });
  }

  /**
   * 启动心跳检测
   */
  startHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 每30秒检查一次
  }

  /**
   * 获取服务器状态
   */
  getServerStats() {
    return {
      connectedClients: this.clients.size,
      rooms: this.roomManager.getAllRoomsStats(),
      uptime: process.uptime()
    };
  }
}

