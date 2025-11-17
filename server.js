import { WebSocketServer } from './src/websocket/WebSocketServer.js';
import { createApiServer } from './src/api/routes.js';
import { config } from './config/config.js';
import { getAvailablePorts, isPortAvailable } from './src/utils/port-finder.js';

/**
 * 主服务器入口
 * 启动 WebSocket 服务器和 HTTP API 服务器
 */
const main = async () => {
  console.log('========================================');
  console.log('  E2E WebSocket Server Starting...  ');
  console.log('========================================');
  console.log();

  try {
    // 检查并获取可用端口
    console.log('正在检查端口可用性...');
    const preferredPorts = [config.wsPort, config.apiPort];
    const availablePorts = await getAvailablePorts(preferredPorts, 2);
    
    const wsPort = availablePorts[0];
    const apiPort = availablePorts[1];
    
    // 显示端口变更信息
    if (wsPort !== config.wsPort) {
      console.log(`⚠️  WebSocket 端口 ${config.wsPort} 被占用，使用备用端口 ${wsPort}`);
    }
    if (apiPort !== config.apiPort) {
      console.log(`⚠️  HTTP API 端口 ${config.apiPort} 被占用，使用备用端口 ${apiPort}`);
    }
    console.log();

    // 创建并启动 WebSocket 服务器
    const wsServer = new WebSocketServer(wsPort);
    await wsServer.start();
    wsServer.startHeartbeat();

    console.log(`✓ WebSocket Server: ws://localhost:${wsPort}`);
    console.log();

    // 创建并启动 HTTP API 服务器
    const apiServer = createApiServer(wsServer);
    
    // 使用 Promise 包装 listen，以便处理端口占用错误
    await new Promise((resolve, reject) => {
      const server = apiServer.listen(apiPort)
        .on('listening', () => {
          console.log(`✓ HTTP API Server: http://localhost:${apiPort}`);
          console.log();
          console.log('Available endpoints:');
          console.log(`  - GET  http://localhost:${apiPort}/health`);
          console.log(`  - GET  http://localhost:${apiPort}/api/stats`);
          console.log(`  - GET  http://localhost:${apiPort}/api/rooms`);
          console.log(`  - GET  http://localhost:${apiPort}/api/rooms/:roomId`);
          console.log(`  - POST http://localhost:${apiPort}/api/rooms/generate`);
          console.log(`  - POST http://localhost:${apiPort}/api/encryption/generate-keys`);
          console.log(`  - GET  http://localhost:${apiPort}/api/docs`);
          console.log();
          console.log('========================================');
          console.log('  Server is ready!  ');
          console.log('========================================');
          resolve(server);
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    // 优雅关闭
    const shutdown = () => {
      console.log();
      console.log('Shutting down server...');
      
      wsServer.wss.close(() => {
        console.log('WebSocket server closed');
      });
      
      apiServer.close(() => {
        console.log('HTTP API server closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
  } catch (error) {
    console.error();
    console.error('❌ 服务器启动失败:', error.message);
    console.error();
    
    if (error.code === 'EADDRINUSE') {
      console.error('提示: 端口被占用，请检查是否有其他程序正在使用该端口。');
      console.error('解决方案:');
      console.error('  1. 关闭占用端口的程序');
      console.error('  2. 修改 config/config.js 中的端口配置');
      console.error('  3. 使用环境变量: WS_PORT=9090 API_PORT=4000 npm start');
    }
    
    console.error();
    process.exit(1);
  }
};

// 启动服务器
main();

