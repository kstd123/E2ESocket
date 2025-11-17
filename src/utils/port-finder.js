import net from 'net';

/**
 * 端口查找工具
 * 用于检测端口是否可用，并自动查找可用端口
 */

/**
 * 检测端口是否可用
 * @param {number} port - 要检测的端口
 * @returns {Promise<boolean>} - 端口是否可用
 */
export const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
};

/**
 * 查找可用端口
 * @param {number} startPort - 起始端口
 * @param {number} maxAttempts - 最大尝试次数
 * @returns {Promise<number>} - 可用的端口号
 */
export const findAvailablePort = async (startPort, maxAttempts = 10) => {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const available = await isPortAvailable(port);
    
    if (available) {
      return port;
    }
  }
  
  throw new Error(`无法找到可用端口，已尝试 ${startPort} 到 ${startPort + maxAttempts - 1}`);
};

/**
 * 获取多个可用端口
 * @param {number[]} preferredPorts - 首选端口列表
 * @param {number} count - 需要的端口数量
 * @returns {Promise<number[]>} - 可用端口列表
 */
export const getAvailablePorts = async (preferredPorts, count = 2) => {
  const availablePorts = [];
  const checkedPorts = new Set();
  
  // 首先检查首选端口
  for (const port of preferredPorts) {
    if (checkedPorts.has(port)) continue;
    checkedPorts.add(port);
    
    const available = await isPortAvailable(port);
    if (available) {
      availablePorts.push(port);
      if (availablePorts.length >= count) {
        return availablePorts;
      }
    }
  }
  
  // 如果首选端口不够，从最后一个首选端口开始查找
  const lastPort = preferredPorts[preferredPorts.length - 1] || 8000;
  let currentPort = lastPort + 1;
  let attempts = 0;
  const maxAttempts = 100;
  
  while (availablePorts.length < count && attempts < maxAttempts) {
    if (!checkedPorts.has(currentPort)) {
      checkedPorts.add(currentPort);
      const available = await isPortAvailable(currentPort);
      
      if (available) {
        availablePorts.push(currentPort);
      }
    }
    
    currentPort++;
    attempts++;
  }
  
  if (availablePorts.length < count) {
    throw new Error(`只找到 ${availablePorts.length} 个可用端口，需要 ${count} 个`);
  }
  
  return availablePorts;
};

