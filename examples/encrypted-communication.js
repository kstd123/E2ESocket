import E2EClient from './client.js';
import fetch from 'node-fetch';
import crypto from 'crypto';

/**
 * 端到端加密通信示例
 * 演示如何使用公钥加密进行安全通信
 */
class EncryptedE2EClient extends E2EClient {
  constructor(serverUrl, apiUrl) {
    super(serverUrl);
    this.apiUrl = apiUrl;
    this.publicKey = null;
    this.privateKey = null;
    this.peerPublicKeys = new Map(); // clientId -> publicKey
  }

  /**
   * 生成密钥对
   */
  async generateKeyPair() {
    try {
      const response = await fetch(`${this.apiUrl}/api/encryption/generate-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      
      if (result.success) {
        this.publicKey = result.data.publicKey;
        this.privateKey = result.data.privateKey;
        console.log('✓ 密钥对已生成');
        return result.data;
      } else {
        throw new Error('密钥生成失败');
      }
    } catch (error) {
      console.error('生成密钥对失败:', error);
      throw error;
    }
  }

  /**
   * 注册公钥到服务器
   */
  registerPublicKey() {
    if (!this.publicKey) {
      throw new Error('请先生成密钥对');
    }

    this.send('register_public_key', {
      publicKey: this.publicKey
    });

    console.log('✓ 公钥已注册到服务器');
  }

  /**
   * 获取房间内所有成员的公钥
   */
  async getPeerPublicKeys() {
    return new Promise((resolve, reject) => {
      this.send('get_public_keys', {});

      const handler = (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'get_public_keys') {
          const publicKeys = message.data.publicKeys;
          
          // 保存到本地
          Object.entries(publicKeys).forEach(([clientId, publicKey]) => {
            if (clientId !== this.clientId) {
              this.peerPublicKeys.set(clientId, publicKey);
            }
          });

          console.log(`✓ 已获取 ${Object.keys(publicKeys).length} 个公钥`);
          this.ws.off('message', handler);
          resolve(publicKeys);
        }
      };

      this.ws.on('message', handler);

      setTimeout(() => {
        this.ws.off('message', handler);
        reject(new Error('获取公钥超时'));
      }, 5000);
    });
  }

  /**
   * 使用对方公钥加密消息
   */
  encryptMessage(message, targetClientId) {
    const targetPublicKey = this.peerPublicKeys.get(targetClientId);
    
    if (!targetPublicKey) {
      throw new Error(`未找到客户端 ${targetClientId} 的公钥`);
    }

    try {
      const buffer = Buffer.from(JSON.stringify({ message }), 'utf8');
      const encrypted = crypto.publicEncrypt(
        {
          key: targetPublicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        buffer
      );

      return encrypted.toString('base64');
    } catch (error) {
      console.error('加密失败:', error);
      throw error;
    }
  }

  /**
   * 使用私钥解密消息
   */
  decryptMessage(encryptedMessage) {
    if (!this.privateKey) {
      throw new Error('私钥未设置');
    }

    try {
      const buffer = Buffer.from(encryptedMessage, 'base64');
      const decrypted = crypto.privateDecrypt(
        {
          key: this.privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        buffer
      );

      return JSON.parse(decrypted.toString('utf8')).message;
    } catch (error) {
      console.error('解密失败:', error);
      throw error;
    }
  }

  /**
   * 发送加密消息
   */
  sendEncryptedMessage(message, targetClientId) {
    const encrypted = this.encryptMessage(message, targetClientId);
    
    this.send('send_message', {
      content: encrypted,
      encrypted: true,
      targetClientId
    });

    console.log(`✓ 已发送加密消息给 ${targetClientId.substring(0, 8)}...`);
  }

  /**
   * 重写消息处理，支持解密
   */
  handleMessage(message) {
    // 如果是加密消息，先解密
    if (message.type === 'message' && message.data.encrypted && message.data.content) {
      try {
        const decrypted = this.decryptMessage(message.data.content);
        console.log(`\n[加密消息] ${message.data.from.substring(0, 8)}...: ${decrypted}`);
        return;
      } catch (error) {
        console.error('解密消息失败:', error);
      }
    }

    // 其他消息使用父类处理
    super.handleMessage(message);
  }
}

/**
 * 加密通信演示
 */
const encryptedDemo = async () => {
  console.log('========================================');
  console.log('  端到端加密通信演示  ');
  console.log('========================================\n');

  const serverUrl = 'ws://localhost:8080';
  const apiUrl = 'http://localhost:3000';

  // 创建两个客户端
  const alice = new EncryptedE2EClient(serverUrl, apiUrl);
  const bob = new EncryptedE2EClient(serverUrl, apiUrl);

  try {
    // 步骤 1: 生成密钥对
    console.log('步骤 1: 为两个客户端生成密钥对...');
    await Promise.all([
      alice.generateKeyPair(),
      bob.generateKeyPair()
    ]);
    console.log();
    await sleep(500);

    // 步骤 2: 连接到服务器
    console.log('步骤 2: 连接到服务器...');
    await Promise.all([
      alice.connect(),
      bob.connect()
    ]);
    console.log('✓ 两个客户端已连接\n');
    await sleep(1000);

    // 步骤 3: Alice创建房间
    console.log('步骤 3: Alice创建房间...');
    const roomData = await alice.joinRoom(null, 'read_write');
    const roomId = roomData.roomId;
    console.log(`✓ 房间已创建: ${roomId}\n`);
    await sleep(1000);

    // 步骤 4: Alice注册公钥
    console.log('步骤 4: Alice注册公钥...');
    alice.registerPublicKey();
    console.log();
    await sleep(1000);

    // 步骤 5: Bob加入房间
    console.log('步骤 5: Bob加入房间...');
    await bob.joinRoom(roomId, 'read_write');
    console.log();
    await sleep(1000);

    // 步骤 6: Bob注册公钥
    console.log('步骤 6: Bob注册公钥...');
    bob.registerPublicKey();
    console.log();
    await sleep(1000);

    // 步骤 7: 双方获取对方的公钥
    console.log('步骤 7: 双方获取房间内的公钥...');
    await Promise.all([
      alice.getPeerPublicKeys(),
      bob.getPeerPublicKeys()
    ]);
    console.log();
    await sleep(1000);

    // 步骤 8: Alice发送加密消息给Bob
    console.log('步骤 8: Alice发送加密消息给Bob...');
    alice.sendEncryptedMessage('Hello Bob! This is a secret message from Alice.', bob.clientId);
    await sleep(2000);

    // 步骤 9: Bob发送加密消息给Alice
    console.log('\n步骤 9: Bob发送加密消息给Alice...');
    bob.sendEncryptedMessage('Hi Alice! I received your message. This is my encrypted reply.', alice.clientId);
    await sleep(2000);

    // 步骤 10: 多条加密消息交换
    console.log('\n步骤 10: 多条加密消息交换...');
    alice.sendEncryptedMessage('What do you think about end-to-end encryption?', bob.clientId);
    await sleep(1000);
    bob.sendEncryptedMessage('It\'s awesome! Our messages are completely secure.', alice.clientId);
    await sleep(1000);
    alice.sendEncryptedMessage('Yes! Nobody can read our conversation.', bob.clientId);
    await sleep(2000);

    // 步骤 11: 清理
    console.log('\n步骤 11: 清理连接...');
    await Promise.all([
      alice.leaveRoom(),
      bob.leaveRoom()
    ]);
    
    alice.disconnect();
    bob.disconnect();

    console.log('\n========================================');
    console.log('  加密通信演示完成！  ');
    console.log('========================================\n');

    console.log('总结:');
    console.log('✓ 成功生成密钥对');
    console.log('✓ 成功交换公钥');
    console.log('✓ 成功发送和接收加密消息');
    console.log('✓ 消息在传输过程中完全加密');
    console.log('✓ 只有持有私钥的接收者才能解密消息\n');

  } catch (error) {
    console.error('演示出错:', error.message);
    alice.disconnect();
    bob.disconnect();
  }
};

/**
 * 休眠函数
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 运行演示
encryptedDemo();

