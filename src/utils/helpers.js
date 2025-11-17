import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config/config.js';

/**
 * 生成随机房间号
 */
export const generateRoomId = () => {
    return uuidv4().split('-')[0].toUpperCase();
};

/**
 * 验证房间号格式
 */
export const validateRoomId = (roomId) => {
    if (!roomId || typeof roomId !== 'string') {
        return false;
    }

    const length = roomId.length;
    return length >= config.room.minRoomIdLength &&
        length <= config.room.maxRoomIdLength;
};

/**
 * 生成客户端唯一 ID
 */
export const generateClientId = () => {
    return uuidv4();
};

/**
 * 创建标准响应格式
 */
export const createResponse = (type, data, error = null) => {
    return JSON.stringify({
        type,
        data,
        error,
        timestamp: Date.now()
    });
};

/**
 * 解析 JSON 消息
 */
export const parseMessage = (message) => {
    try {
        return JSON.parse(message);
    } catch (error) {
        return null;
    }
};

/**
 * 验证消息格式
 */
export const validateMessage = (message) => {
    if (!message || typeof message !== 'object') {
        return false;
    }

    return message.type && message.data !== undefined;
};

