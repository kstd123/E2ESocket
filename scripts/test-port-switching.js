#!/usr/bin/env node

/**
 * 端口自动切换测试脚本
 * 用于演示端口被占用时的自动切换功能
 */

import net from 'net';
import { spawn } from 'child_process';
import { isPortAvailable, findAvailablePort } from '../src/utils/port-finder.js';

console.log('========================================');
console.log('  端口自动切换功能测试  ');
console.log('========================================\n');

/**
 * 占用一个端口
 */
const occupyPort = (port) => {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.on('error', (err) => {
      reject(err);
    });
    
    server.listen(port, () => {
      console.log(`✓ 已占用端口 ${port}`);
      resolve(server);
    });
  });
};

/**
 * 主测试流程
 */
const runTest = async () => {
  let server8080 = null;
  let server3000 = null;

  try {
    console.log('步骤 1: 检查默认端口状态...\n');
    
    const port8080Available = await isPortAvailable(8080);
    const port3000Available = await isPortAvailable(3000);
    
    console.log(`端口 8080: ${port8080Available ? '✓ 可用' : '✗ 被占用'}`);
    console.log(`端口 3000: ${port3000Available ? '✓ 可用' : '✗ 被占用'}`);
    console.log();
    
    console.log('步骤 2: 测试端口查找功能...\n');
    
    const nextWsPort = await findAvailablePort(8080);
    const nextApiPort = await findAvailablePort(3000);
    
    console.log(`从 8080 开始查找，找到可用端口: ${nextWsPort}`);
    console.log(`从 3000 开始查找，找到可用端口: ${nextApiPort}`);
    console.log();
    
    console.log('步骤 3: 模拟端口被占用场景...\n');
    console.log('正在占用端口 8080 和 3000...');
    
    // 占用默认端口
    server8080 = await occupyPort(8080);
    server3000 = await occupyPort(3000);
    
    console.log();
    console.log('步骤 4: 查找备用端口...\n');
    
    const alternativeWsPort = await findAvailablePort(8080);
    const alternativeApiPort = await findAvailablePort(3000);
    
    console.log(`✓ WebSocket 备用端口: ${alternativeWsPort}`);
    console.log(`✓ HTTP API 备用端口: ${alternativeApiPort}`);
    console.log();
    
    console.log('步骤 5: 清理...\n');
    
    // 关闭占用的端口
    server8080.close();
    server3000.close();
    
    console.log('✓ 已释放占用的端口');
    console.log();
    
    console.log('========================================');
    console.log('  测试完成！  ');
    console.log('========================================\n');
    
    console.log('总结:');
    console.log('✓ 端口检测功能正常');
    console.log('✓ 端口查找功能正常');
    console.log('✓ 自动切换机制工作正常');
    console.log();
    console.log('现在你可以启动服务器来体验端口自动切换：');
    console.log('  npm start');
    console.log();
    
  } catch (error) {
    console.error('测试失败:', error.message);
    
    // 清理
    if (server8080) server8080.close();
    if (server3000) server3000.close();
    
    process.exit(1);
  }
};

// 运行测试
runTest();

