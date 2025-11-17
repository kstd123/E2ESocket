import WebSocket from 'ws';

/**
 * Node.js WebSocket 客户端示例
 * 演示如何连接到服务器、加入房间、发送和接收消息
 */
class E2EClient {
    constructor(serverUrl) {
        this.serverUrl = serverUrl;
        this.ws = null;
        this.clientId = null;
        this.roomId = null;
        this.permission = null;
        this.isAdmin = false;
    }

    /**
     * 连接到服务器
     */
    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.serverUrl);

            this.ws.on('open', () => {
                console.log('✓ 已连接到服务器');
            });

            this.ws.on('message', (data) => {
                this.handleMessage(JSON.parse(data.toString()));
            });

            this.ws.on('error', (error) => {
                console.error('连接错误:', error);
                reject(error);
            });

            this.ws.on('close', () => {
                console.log('✗ 已断开连接');
            });

            // 等待第一条消息（连接确认）
            this.ws.once('message', (data) => {
                const message = JSON.parse(data.toString());
                if (message.type === 'join' && message.data.clientId) {
                    this.clientId = message.data.clientId;
                    console.log(`✓ 客户端 ID: ${this.clientId}`);
                    resolve();
                }
            });
        });
    }

    /**
     * 断开连接
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }

    /**
     * 加入或创建房间
     */
    joinRoom(roomId = null, permission = 'read_write') {
        return new Promise((resolve, reject) => {
            this.send('join_room', {
                roomId,
                permission,
                isCreate: !roomId
            });

            // 等待加入房间响应
            const handler = (data) => {
                const message = JSON.parse(data.toString());
                if (message.type === 'join') {
                    if (message.data.success) {
                        this.roomId = message.data.roomId;
                        this.permission = message.data.permission;
                        this.isAdmin = message.data.isAdmin;
                        console.log(`✓ 已加入房间: ${this.roomId}`);
                        console.log(`  权限: ${this.permission}`);
                        console.log(`  在线人数: ${message.data.memberCount}`);
                        this.ws.off('message', handler);
                        resolve(message.data);
                    }
                } else if (message.type === 'error') {
                    console.error('加入房间失败:', message.data.error);
                    this.ws.off('message', handler);
                    reject(new Error(message.data.error));
                }
            };

            this.ws.on('message', handler);

            // 超时处理
            setTimeout(() => {
                this.ws.off('message', handler);
                reject(new Error('加入房间超时'));
            }, 5000);
        });
    }

    /**
     * 离开房间
     */
    leaveRoom() {
        return new Promise((resolve, reject) => {
            this.send('leave_room', {});

            const handler = (data) => {
                const message = JSON.parse(data.toString());
                if (message.type === 'leave') {
                    if (message.data.success) {
                        console.log(`✓ 已离开房间: ${message.data.roomId}`);
                        this.roomId = null;
                        this.permission = null;
                        this.isAdmin = false;
                        this.ws.off('message', handler);
                        resolve();
                    }
                }
            };

            this.ws.on('message', handler);

            setTimeout(() => {
                this.ws.off('message', handler);
                reject(new Error('离开房间超时'));
            }, 5000);
        });
    }

    /**
     * 发送消息
     */
    sendMessage(content, targetClientId = null) {
        this.send('send_message', {
            content,
            encrypted: false,
            targetClientId
        });
    }

    /**
     * 获取房间信息
     */
    getRoomInfo() {
        return new Promise((resolve, reject) => {
            this.send('get_room_info', {});

            const handler = (data) => {
                const message = JSON.parse(data.toString());
                if (message.type === 'room_info') {
                    this.ws.off('message', handler);
                    resolve(message.data);
                }
            };

            this.ws.on('message', handler);

            setTimeout(() => {
                this.ws.off('message', handler);
                reject(new Error('获取房间信息超时'));
            }, 5000);
        });
    }

    /**
     * 踢出成员（仅管理员）
     */
    kickMember(targetClientId) {
        if (!this.isAdmin) {
            throw new Error('只有管理员可以踢出成员');
        }

        this.send('kick_member', {
            targetClientId
        });
    }

    /**
     * 更新成员权限（仅管理员）
     */
    updatePermission(targetClientId, permission) {
        if (!this.isAdmin) {
            throw new Error('只有管理员可以更新权限');
        }

        this.send('update_permission', {
            targetClientId,
            permission
        });
    }

    /**
     * 发送消息到服务器
     */
    send(type, data) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('未连接到服务器');
        }

        this.ws.send(JSON.stringify({ type, data }));
    }

    /**
     * 处理接收到的消息
     */
    handleMessage(message) {
        switch (message.type) {
            case 'message':
                if (message.data.from) {
                    console.log(`\n[消息] ${message.data.from}: ${message.data.content}`);
                }
                break;

            case 'broadcast':
                this.handleBroadcast(message.data);
                break;

            case 'error':
                console.error(`[错误] ${message.data.error}`);
                break;

            case 'kick':
                console.log(`[系统] 你被踢出房间: ${message.data.reason}`);
                this.roomId = null;
                this.permission = null;
                this.isAdmin = false;
                break;

            case 'permission_update':
                if (message.data.newPermission) {
                    console.log(`[系统] 你的权限已更新为: ${message.data.newPermission}`);
                    this.permission = message.data.newPermission;
                }
                break;
        }
    }

    /**
     * 处理广播消息
     */
    handleBroadcast(data) {
        switch (data.event) {
            case 'member_joined':
                console.log(`\n[系统] 新成员加入，当前在线: ${data.memberCount} 人`);
                break;

            case 'member_left':
                console.log(`\n[系统] 成员离开，当前在线: ${data.memberCount} 人`);
                break;

            case 'member_kicked':
                console.log(`\n[系统] 成员 ${data.clientId} 被踢出房间`);
                break;

            case 'permission_updated':
                console.log(`\n[系统] 成员 ${data.clientId} 权限更新为 ${data.newPermission}`);
                break;
        }
    }
}

/**
 * 演示用法
 */
const demo = async () => {
    console.log('========================================');
    console.log('  E2E WebSocket Client Demo  ');
    console.log('========================================\n');

    // 创建客户端
    const client = new E2EClient('ws://localhost:8080');

    try {
        // 连接到服务器
        await client.connect();
        console.log();

        // 加入或创建房间
        await client.joinRoom(null, 'read_write'); // 留空房间号则自动创建
        console.log();

        // 发送一些测试消息
        console.log('发送消息...');
        client.sendMessage('Hello, World!');
        client.sendMessage('这是第二条消息');
        console.log();

        // 等待一段时间接收消息
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 获取房间信息
        console.log('获取房间信息...');
        const roomInfo = await client.getRoomInfo();
        console.log('房间信息:', JSON.stringify(roomInfo, null, 2));
        console.log();

        // 离开房间
        await client.leaveRoom();
        console.log();

        // 断开连接
        client.disconnect();

    } catch (error) {
        console.error('错误:', error.message);
        client.disconnect();
    }
};

// 如果直接运行此文件，执行演示
if (import.meta.url === `file://${process.argv[1]}`) {
    demo();
}

export default E2EClient;

