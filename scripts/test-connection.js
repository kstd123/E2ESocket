#!/usr/bin/env node

/**
 * 测试服务器连接脚本
 * 用于验证 WebSocket 和 HTTP API 是否正常工作
 */

import WebSocket from 'ws';
import fetch from 'node-fetch';

const WS_URL = process.env.WS_URL || 'ws://localhost:8080';
const API_URL = process.env.API_URL || 'http://localhost:3000';

console.log('========================================');
console.log('  服务器连接测试  ');
console.log('========================================\n');

let testsPassed = 0;
let testsFailed = 0;

/**
 * 测试 HTTP API 健康检查
 */
async function testHealthCheck() {
  console.log('测试 1: HTTP API 健康检查...');
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    
    if (response.status === 200 && data.status === 'ok') {
      console.log('✓ 健康检查通过\n');
      testsPassed++;
      return true;
    } else {
      throw new Error('健康检查失败');
    }
  } catch (error) {
    console.error(`✗ 健康检查失败: ${error.message}\n`);
    testsFailed++;
    return false;
  }
}

/**
 * 测试获取服务器统计
 */
async function testGetStats() {
  console.log('测试 2: 获取服务器统计...');
  try {
    const response = await fetch(`${API_URL}/api/stats`);
    const data = await response.json();
    
    if (response.status === 200 && data.success) {
      console.log('✓ 服务器统计获取成功');
      console.log(`  在线客户端: ${data.data.connectedClients}`);
      console.log(`  房间数量: ${data.data.rooms.length}`);
      console.log(`  运行时间: ${Math.floor(data.data.uptime)}秒\n`);
      testsPassed++;
      return true;
    } else {
      throw new Error('获取统计失败');
    }
  } catch (error) {
    console.error(`✗ 获取统计失败: ${error.message}\n`);
    testsFailed++;
    return false;
  }
}

/**
 * 测试生成房间号
 */
async function testGenerateRoom() {
  console.log('测试 3: 生成房间号...');
  try {
    const response = await fetch(`${API_URL}/api/rooms/generate`, {
      method: 'POST'
    });
    const data = await response.json();
    
    if (response.status === 200 && data.success && data.data.roomId) {
      console.log('✓ 房间号生成成功');
      console.log(`  房间号: ${data.data.roomId}\n`);
      testsPassed++;
      return data.data.roomId;
    } else {
      throw new Error('生成房间号失败');
    }
  } catch (error) {
    console.error(`✗ 生成房间号失败: ${error.message}\n`);
    testsFailed++;
    return null;
  }
}

/**
 * 测试 WebSocket 连接
 */
function testWebSocketConnection() {
  return new Promise((resolve) => {
    console.log('测试 4: WebSocket 连接...');
    
    const ws = new WebSocket(WS_URL);
    let connected = false;
    
    const timeout = setTimeout(() => {
      if (!connected) {
        console.error('✗ WebSocket 连接超时\n');
        testsFailed++;
        ws.close();
        resolve(false);
      }
    }, 5000);
    
    ws.on('open', () => {
      console.log('✓ WebSocket 连接成功');
      connected = true;
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'join' && message.data.clientId) {
          console.log(`  客户端 ID: ${message.data.clientId}\n`);
          clearTimeout(timeout);
          testsPassed++;
          ws.close();
          resolve(true);
        }
      } catch (error) {
        console.error(`✗ 消息解析失败: ${error.message}\n`);
        testsFailed++;
        clearTimeout(timeout);
        ws.close();
        resolve(false);
      }
    });
    
    ws.on('error', (error) => {
      console.error(`✗ WebSocket 错误: ${error.message}\n`);
      testsFailed++;
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

/**
 * 测试加入房间
 */
function testJoinRoom(roomId) {
  return new Promise((resolve) => {
    console.log('测试 5: 加入房间...');
    
    const ws = new WebSocket(WS_URL);
    let clientId = null;
    
    const timeout = setTimeout(() => {
      console.error('✗ 加入房间超时\n');
      testsFailed++;
      ws.close();
      resolve(false);
    }, 5000);
    
    ws.on('open', () => {
      // 等待连接确认
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'join' && message.data.clientId && !clientId) {
          clientId = message.data.clientId;
          
          // 发送加入房间请求
          ws.send(JSON.stringify({
            type: 'join_room',
            data: {
              roomId: roomId || undefined,
              permission: 'read_write',
              isCreate: !roomId
            }
          }));
        } else if (message.type === 'join' && message.data.success && message.data.roomId) {
          console.log('✓ 成功加入房间');
          console.log(`  房间号: ${message.data.roomId}`);
          console.log(`  权限: ${message.data.permission}`);
          console.log(`  是否管理员: ${message.data.isAdmin ? '是' : '否'}\n`);
          clearTimeout(timeout);
          testsPassed++;
          ws.close();
          resolve(true);
        } else if (message.type === 'error') {
          console.error(`✗ 加入房间失败: ${message.data.error}\n`);
          testsFailed++;
          clearTimeout(timeout);
          ws.close();
          resolve(false);
        }
      } catch (error) {
        console.error(`✗ 消息处理失败: ${error.message}\n`);
        testsFailed++;
        clearTimeout(timeout);
        ws.close();
        resolve(false);
      }
    });
    
    ws.on('error', (error) => {
      console.error(`✗ WebSocket 错误: ${error.message}\n`);
      testsFailed++;
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log(`WebSocket URL: ${WS_URL}`);
  console.log(`HTTP API URL: ${API_URL}\n`);
  
  // 测试 1: 健康检查
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('⚠️  HTTP API 服务不可用，跳过后续 API 测试\n');
  }
  
  // 测试 2: 获取统计
  if (healthOk) {
    await testGetStats();
  }
  
  // 测试 3: 生成房间号
  let roomId = null;
  if (healthOk) {
    roomId = await testGenerateRoom();
  }
  
  // 测试 4: WebSocket 连接
  const wsOk = await testWebSocketConnection();
  
  // 测试 5: 加入房间
  if (wsOk) {
    await testJoinRoom(roomId);
  }
  
  // 输出测试结果
  console.log('========================================');
  console.log('  测试结果  ');
  console.log('========================================');
  console.log(`✓ 通过: ${testsPassed} 个测试`);
  console.log(`✗ 失败: ${testsFailed} 个测试`);
  console.log('========================================\n');
  
  if (testsFailed === 0) {
    console.log('🎉 所有测试通过！服务器运行正常。\n');
    process.exit(0);
  } else {
    console.log('❌ 部分测试失败，请检查服务器配置。\n');
    process.exit(1);
  }
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试运行出错:', error);
  process.exit(1);
});

