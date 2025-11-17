import { config } from '../../config/config.js';
import { generateRoomId, validateRoomId } from '../utils/helpers.js';

/**
 * 房间管理器
 * 负责房间的创建、删除、成员管理等
 */
export class RoomManager {
    constructor() {
        // 存储所有房间
        // roomId -> Room 对象
        this.rooms = new Map();

        // 定期清理过期房间
        this.startCleanupTimer();
    }

    /**
     * 创建或加入房间
     */
    joinRoom(client, roomId, permission = config.permissions.READ_WRITE, isCreate = false) {
        // 如果房间号为空，生成新房间号
        if (!roomId) {
            roomId = generateRoomId();
            isCreate = true;
        }

        // 验证房间号格式
        if (!validateRoomId(roomId)) {
            throw new Error('Invalid room ID format');
        }

        let room = this.rooms.get(roomId);

        // 如果房间不存在，创建新房间
        if (!room) {
            if (!isCreate) {
                throw new Error('Room does not exist');
            }

            room = this.createRoom(roomId, client.id);
            this.rooms.set(roomId, room);
        }

        // 检查房间是否已满
        if (room.members.size >= config.room.maxMembers) {
            throw new Error('Room is full');
        }

        // 设置客户端权限（第一个加入的是管理员）
        const clientPermission = room.members.size === 0
            ? config.permissions.ADMIN
            : permission;

        // 将客户端添加到房间
        room.members.set(client.id, {
            client,
            permission: clientPermission,
            joinedAt: Date.now()
        });

        // 更新房间最后活动时间
        room.lastActivity = Date.now();

        // 将房间信息保存到客户端
        client.roomId = roomId;
        client.permission = clientPermission;

        return {
            roomId,
            permission: clientPermission,
            memberCount: room.members.size,
            isAdmin: clientPermission === config.permissions.ADMIN
        };
    }

    /**
     * 离开房间
     */
    leaveRoom(clientId) {
        const client = this.findClientById(clientId);
        if (!client || !client.roomId) {
            return null;
        }

        const roomId = client.roomId;
        const room = this.rooms.get(roomId);

        if (!room) {
            return null;
        }

        // 从房间中移除成员
        room.members.delete(clientId);

        // 如果房间为空，删除房间
        if (room.members.size === 0) {
            this.rooms.delete(roomId);
            return { roomId, deleted: true };
        }

        // 如果离开的是管理员，将管理员权限转移给下一个成员
        if (client.permission === config.permissions.ADMIN && room.members.size > 0) {
            const nextAdmin = Array.from(room.members.values())[0];
            nextAdmin.permission = config.permissions.ADMIN;
            nextAdmin.client.permission = config.permissions.ADMIN;
        }

        room.lastActivity = Date.now();

        return {
            roomId,
            deleted: false,
            memberCount: room.members.size
        };
    }

    /**
     * 踢出房间成员（仅管理员）
     */
    kickMember(adminClientId, targetClientId) {
        const adminClient = this.findClientById(adminClientId);

        if (!adminClient || adminClient.permission !== config.permissions.ADMIN) {
            throw new Error('Permission denied: Only admin can kick members');
        }

        const room = this.rooms.get(adminClient.roomId);
        if (!room) {
            throw new Error('Room not found');
        }

        const targetMember = room.members.get(targetClientId);
        if (!targetMember) {
            throw new Error('Target member not found in room');
        }

        // 不能踢出管理员自己
        if (targetClientId === adminClientId) {
            throw new Error('Cannot kick yourself');
        }

        // 移除成员
        room.members.delete(targetClientId);
        room.lastActivity = Date.now();

        return {
            roomId: room.id,
            kickedClientId: targetClientId
        };
    }

    /**
     * 更新成员权限（仅管理员）
     */
    updatePermission(adminClientId, targetClientId, newPermission) {
        const adminClient = this.findClientById(adminClientId);

        if (!adminClient || adminClient.permission !== config.permissions.ADMIN) {
            throw new Error('Permission denied: Only admin can update permissions');
        }

        const room = this.rooms.get(adminClient.roomId);
        if (!room) {
            throw new Error('Room not found');
        }

        const targetMember = room.members.get(targetClientId);
        if (!targetMember) {
            throw new Error('Target member not found in room');
        }

        // 不能修改管理员自己的权限
        if (targetClientId === adminClientId) {
            throw new Error('Cannot change your own permission');
        }

        // 更新权限
        targetMember.permission = newPermission;
        targetMember.client.permission = newPermission;
        room.lastActivity = Date.now();

        return {
            roomId: room.id,
            targetClientId,
            newPermission
        };
    }

    /**
     * 广播消息到房间所有成员
     */
    broadcastToRoom(roomId, message, excludeClientId = null) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return 0;
        }

        let sentCount = 0;

        room.members.forEach((member, clientId) => {
            if (clientId !== excludeClientId && member.client.ws.readyState === 1) { // OPEN
                try {
                    member.client.ws.send(message);
                    sentCount++;
                } catch (error) {
                    console.error(`Failed to send message to client ${clientId}:`, error);
                }
            }
        });

        room.lastActivity = Date.now();

        return sentCount;
    }

    /**
     * 获取房间信息
     */
    getRoomInfo(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return null;
        }

        const members = Array.from(room.members.values()).map(member => ({
            id: member.client.id,
            permission: member.permission,
            joinedAt: member.joinedAt
        }));

        return {
            id: room.id,
            createdAt: room.createdAt,
            memberCount: room.members.size,
            maxMembers: config.room.maxMembers,
            members
        };
    }

    /**
     * 获取所有房间统计信息
     */
    getAllRoomsStats() {
        const stats = [];

        this.rooms.forEach((room, roomId) => {
            stats.push({
                roomId,
                memberCount: room.members.size,
                createdAt: room.createdAt,
                lastActivity: room.lastActivity
            });
        });

        return stats;
    }

  /**
   * 创建新房间
   */
  createRoom(roomId, adminId) {
    return {
      id: roomId,
      adminId,
      members: new Map(),
      createdAt: Date.now(),
      lastActivity: Date.now(),
      config: null, // 存储房间配置
      configVersion: 0 // 配置版本号
    };
  }

  /**
   * 发布房间配置（仅管理员）
   */
  publishConfig(adminClientId, configData) {
    const adminClient = this.findClientById(adminClientId);
    
    if (!adminClient || adminClient.permission !== config.permissions.ADMIN) {
      throw new Error('Permission denied: Only admin can publish config');
    }
    
    const room = this.rooms.get(adminClient.roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    // 更新房间配置
    room.config = configData;
    room.configVersion++;
    room.lastActivity = Date.now();
    
    return {
      roomId: room.id,
      config: configData,
      version: room.configVersion
    };
  }

  /**
   * 获取房间配置
   */
  getRoomConfig(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    return {
      config: room.config,
      version: room.configVersion
    };
  }

    /**
     * 查找客户端
     */
    findClientById(clientId) {
        for (const room of this.rooms.values()) {
            const member = room.members.get(clientId);
            if (member) {
                return member.client;
            }
        }
        return null;
    }

    /**
     * 定期清理过期房间
     */
    startCleanupTimer() {
        setInterval(() => {
            const now = Date.now();
            const expiredRooms = [];

            this.rooms.forEach((room, roomId) => {
                if (now - room.lastActivity > config.room.expirationTime) {
                    expiredRooms.push(roomId);
                }
            });

            expiredRooms.forEach(roomId => {
                console.log(`Cleaning up expired room: ${roomId}`);
                this.rooms.delete(roomId);
            });

            if (expiredRooms.length > 0) {
                console.log(`Cleaned up ${expiredRooms.length} expired rooms`);
            }
        }, 60 * 60 * 1000); // 每小时检查一次
    }
}

