import express from 'express';
import cors from 'cors';
import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * HTTP API 路由
 * 提供 RESTful API 接口用于查询和管理
 */
export const createApiServer = (wsServer) => {
    const app = express();

    // 中间件
    app.use(cors());
    app.use(express.json());

    // 静态文件服务 - 提供客户端页面
    const clientPath = path.join(__dirname, '../../examples');
    app.use('/client', express.static(clientPath));
    app.use('/examples', express.static(clientPath));

    // 日志中间件
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });

    /**
     * 首页 - 重定向到客户端
     */
    app.get('/', (req, res) => {
        res.redirect('/client/client.html');
    });

    /**
     * 健康检查
     */
    app.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: Date.now()
        });
    });

    /**
     * 获取服务器统计信息
     */
    app.get('/api/stats', (req, res) => {
        try {
            const stats = wsServer.getServerStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * 获取所有房间信息
     */
    app.get('/api/rooms', (req, res) => {
        try {
            const rooms = wsServer.roomManager.getAllRoomsStats();
            res.json({
                success: true,
                data: rooms
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });



    /**
     * 创建新房间（通过 API）
     * 注意：实际的房间创建通过 WebSocket 进行
     * 这个接口主要用于获取房间号
     */
    app.post('/api/rooms/generate', async (req, res) => {
        try {
            const { generateRoomId } = await import('../utils/helpers.js');
            const roomId = generateRoomId();

            res.json({
                success: true,
                data: {
                    roomId,
                    message: 'Room ID generated. Use WebSocket to join.'
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * 生成加密密钥对（用于客户端）
     */
    app.post('/api/encryption/generate-keys', (req, res) => {
        try {
            const keyPair = wsServer.encryption.generateKeyPair();
            res.json({
                success: true,
                data: keyPair
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * 生成房间二维码
     */
    app.get('/api/rooms/:roomId/qrcode', async (req, res) => {
        try {
            const { roomId } = req.params;
            const { format = 'png' } = req.query;

            // 生成加入房间的URL（包含房间号）
            const joinUrl = `${req.protocol}://${req.get('host')}/join?roomId=${roomId}`;

            // 创建二维码数据（JSON格式）
            const qrData = JSON.stringify({
                type: 'e2e-chat-room',
                roomId: roomId,
                joinUrl: joinUrl,
                timestamp: Date.now()
            });

            if (format === 'svg') {
                // 生成SVG格式
                const svg = await QRCode.toString(qrData, { type: 'svg' });
                res.setHeader('Content-Type', 'image/svg+xml');
                res.send(svg);
            } else if (format === 'data') {
                // 返回Data URL
                const dataUrl = await QRCode.toDataURL(qrData);
                res.json({
                    success: true,
                    data: {
                        dataUrl,
                        roomId,
                        joinUrl
                    }
                });
            } else {
                // 默认PNG格式
                const buffer = await QRCode.toBuffer(qrData);
                res.setHeader('Content-Type', 'image/png');
                res.send(buffer);
            }
        } catch (error) {
            console.log("🚀 ~ createApiServer ~ error:", error)
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    /**
         * 获取特定房间信息
         */
    app.get('/api/rooms/:roomId', (req, res) => {
        try {
            const { roomId } = req.params;
            const roomInfo = wsServer.roomManager.getRoomInfo(roomId);

            if (!roomInfo) {
                return res.status(404).json({
                    success: false,
                    error: 'Room not found'
                });
            }

            res.json({
                success: true,
                data: roomInfo
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    /**
     * 获取 API 文档
     */
    app.get('/api/docs', (req, res) => {
        res.json({
            success: true,
            data: {
                endpoints: [
                    {
                        method: 'GET',
                        path: '/health',
                        description: '健康检查'
                    },
                    {
                        method: 'GET',
                        path: '/api/stats',
                        description: '获取服务器统计信息'
                    },
                    {
                        method: 'GET',
                        path: '/api/rooms',
                        description: '获取所有房间列表'
                    },
                    {
                        method: 'GET',
                        path: '/api/rooms/:roomId',
                        description: '获取特定房间信息'
                    },
                    {
                        method: 'POST',
                        path: '/api/rooms/generate',
                        description: '生成新房间号'
                    },
                    {
                        method: 'POST',
                        path: '/api/encryption/generate-keys',
                        description: '生成加密密钥对'
                    }
                ],
                websocket: {
                    url: `ws://localhost:${wsServer.port}`,
                    messageTypes: [
                        'join_room - 加入房间',
                        'leave_room - 离开房间',
                        'send_message - 发送消息',
                        'get_room_info - 获取房间信息',
                        'kick_member - 踢出成员（管理员）',
                        'update_permission - 更新权限（管理员）',
                        'register_public_key - 注册公钥',
                        'get_public_keys - 获取房间内所有公钥'
                    ]
                }
            }
        });
    });

    // 404 处理
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            error: 'Endpoint not found'
        });
    });

    // 错误处理
    app.use((err, req, res, next) => {
        console.error('API Error:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Internal server error'
        });
    });

    return app;
};

