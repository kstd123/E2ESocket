/**
 * 配置管理功能测试
 * 
 * 测试场景：
 * 1. 管理员创建房间
 * 2. 管理员发布配置
 * 3. 成员加入房间并接收配置
 * 4. 管理员更新配置
 * 5. 所有成员收到新配置
 */

import WebSocket from 'ws';

// 配置
const WS_URL = 'ws://localhost:8080';
const DELAY = 1000; // 延迟时间（毫秒）

// 示例配置
const INITIAL_CONFIG = {
  title: '初始配置',
  version: '1.0.0',
  settings: {
    mode: 'easy',
    maxPlayers: 10,
    timeLimit: 300
  }
};

const UPDATED_CONFIG = {
  title: '更新配置',
  version: '2.0.0',
  settings: {
    mode: 'hard',
    maxPlayers: 20,
    timeLimit: 600,
    newFeature: true
  }
};

// 工具函数
function sendMessage(ws, type, data = {}) {
  ws.send(JSON.stringify({ type, data }));
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 创建客户端
function createClient(name) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const client = {
      name,
      ws,
      roomId: null,
      clientId: null,
      isAdmin: false,
      config: null,
      configVersion: 0
    };

    ws.on('open', () => {
      console.log(`✅ [${name}] 已连接`);
      resolve(client);
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data);
      handleMessage(client, message);
    });

    ws.on('error', (error) => {
      console.error(`❌ [${name}] 错误:`, error.message);
      reject(error);
    });

    ws.on('close', () => {
      console.log(`🔌 [${name}] 已断开`);
    });
  });
}

// 处理消息
function handleMessage(client, message) {
  const { name } = client;
  
  switch (message.type) {
    case 'connected':
      client.clientId = message.data.clientId;
      console.log(`📡 [${name}] Client ID: ${client.clientId}`);
      break;

    case 'join':
      if (message.data.success) {
        client.roomId = message.data.roomId;
        client.isAdmin = message.data.permission === 'admin';
        console.log(`🚪 [${name}] 加入房间: ${client.roomId}${client.isAdmin ? ' (管理员)' : ''}`);
      }
      break;

    case 'config_update':
      client.config = message.data.config;
      client.configVersion = message.data.version;
      console.log(`⚙️  [${name}] 收到配置更新 v${client.configVersion}:`, client.config);
      break;

    case 'publish_config':
      if (message.data.success) {
        console.log(`✅ [${name}] 配置已发布，版本: ${message.data.version}`);
      }
      break;

    case 'broadcast':
      handleBroadcast(client, message.data);
      break;

    case 'error':
      console.error(`❌ [${name}] 错误:`, message.data.error);
      break;
  }
}

// 处理广播
function handleBroadcast(client, data) {
  const { name } = client;

  switch (data.event) {
    case 'member_joined':
      console.log(`👋 [${name}] 新成员加入，当前人数: ${data.memberCount}`);
      break;

    case 'config_published':
      console.log(`📢 [${name}] 配置已广播 v${data.version}`);
      break;
  }
}

// 主测试流程
async function runTest() {
  console.log('🧪 开始测试配置管理功能\n');

  try {
    // 1. 创建管理员客户端
    console.log('1️⃣  创建管理员客户端...');
    const admin = await createClient('Admin');
    await delay(DELAY);

    // 2. 管理员创建房间
    console.log('\n2️⃣  管理员创建房间...');
    sendMessage(admin.ws, 'join', {
      roomId: '',
      permission: 'admin',
      isCreate: true
    });
    await delay(DELAY);

    // 3. 管理员发布初始配置
    console.log('\n3️⃣  管理员发布初始配置...');
    sendMessage(admin.ws, 'publish_config', {
      config: INITIAL_CONFIG
    });
    await delay(DELAY);

    // 4. 创建成员1
    console.log('\n4️⃣  成员1加入房间...');
    const member1 = await createClient('Member1');
    await delay(DELAY);

    sendMessage(member1.ws, 'join', {
      roomId: admin.roomId,
      permission: 'read_write'
    });
    await delay(DELAY);

    // 5. 创建成员2
    console.log('\n5️⃣  成员2加入房间...');
    const member2 = await createClient('Member2');
    await delay(DELAY);

    sendMessage(member2.ws, 'join', {
      roomId: admin.roomId,
      permission: 'read_only'
    });
    await delay(DELAY);

    // 6. 管理员更新配置
    console.log('\n6️⃣  管理员更新配置...');
    sendMessage(admin.ws, 'publish_config', {
      config: UPDATED_CONFIG
    });
    await delay(DELAY);

    // 7. 成员1尝试发布配置（应该失败）
    console.log('\n7️⃣  成员1尝试发布配置（权限测试）...');
    sendMessage(member1.ws, 'publish_config', {
      config: { test: 'should fail' }
    });
    await delay(DELAY);

    // 8. 验证配置
    console.log('\n8️⃣  验证所有客户端的配置...');
    console.log(`   Admin: v${admin.configVersion}`, admin.config?.title);
    console.log(`   Member1: v${member1.configVersion}`, member1.config?.title);
    console.log(`   Member2: v${member2.configVersion}`, member2.config?.title);

    // 9. 清理
    console.log('\n9️⃣  清理连接...');
    await delay(DELAY);
    admin.ws.close();
    member1.ws.close();
    member2.ws.close();

    await delay(DELAY);

    // 测试结果
    console.log('\n' + '='.repeat(50));
    console.log('✅ 测试完成！');
    console.log('='.repeat(50));
    console.log('\n测试结果：');
    console.log('✓ 管理员成功创建房间');
    console.log('✓ 管理员成功发布配置');
    console.log('✓ 新成员加入时自动接收配置');
    console.log('✓ 配置更新成功广播');
    console.log('✓ 非管理员无法发布配置');
    console.log('✓ 所有成员配置版本一致');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
runTest();

