#!/usr/bin/env node

/**
 * 资源分发测试脚本
 * 用于验证 SEO 文件走服务器、静态资源走 CDN 的配置是否正确
 */

const axios = require('axios');
const chalk = require('chalk');

// 配置
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const CDN_URL = process.env.CDN_URL || '';

// 测试用例
const testCases = [
  // SEO 相关文件 - 应该走服务器
  {
    path: '/sitemap.xml',
    type: 'SEO Server',
    expectedServedBy: 'server',
    description: '主站点地图'
  },
  {
    path: '/sitemap-tech.xml',
    type: 'SEO Server',
    expectedServedBy: 'server',
    description: '分类站点地图'
  },
  {
    path: '/robots.txt',
    type: 'SEO Server',
    expectedServedBy: 'server',
    description: '搜索引擎爬虫配置'
  },
  {
    path: '/rss.xml',
    type: 'SEO Server',
    expectedServedBy: 'server',
    description: 'RSS 订阅源'
  },
  
  // API 路由 - 应该走服务器
  {
    path: '/api/health',
    type: 'API Server',
    expectedServedBy: 'server',
    description: 'API 健康检查'
  },
  
  // 静态文件 - 应该走 CDN（如果配置了）
  {
    path: '/_next/static/css/app.css',
    type: 'Static CDN',
    expectedServedBy: CDN_URL ? 'cdn' : 'server',
    description: 'CSS 样式文件',
    skipIfLocal: true
  },
  {
    path: '/images/logo.png',
    type: 'Image CDN',
    expectedServedBy: CDN_URL ? 'cdn' : 'server',
    description: '图片文件',
    skipIfLocal: true
  }
];

async function testResource(testCase) {
  try {
    console.log(`\n📋 测试: ${chalk.blue(testCase.description)}`);
    console.log(`   路径: ${testCase.path}`);
    console.log(`   期望: ${testCase.expectedServedBy}`);
    
    const response = await axios.get(`${BASE_URL}${testCase.path}`, {
      timeout: 5000,
      validateStatus: () => true // 允许所有状态码
    });
    
    const headers = response.headers;
    const servedBy = headers['x-served-by'] || 'unknown';
    const resourceType = headers['x-resource-type'] || 'unknown';
    const cacheStrategy = headers['x-cache-strategy'] || 'unknown';
    
    // 检查结果
    const isCorrect = servedBy === testCase.expectedServedBy;
    const statusIcon = isCorrect ? '✅' : '❌';
    const statusColor = isCorrect ? chalk.green : chalk.red;
    
    console.log(`   结果: ${statusIcon} ${statusColor(servedBy)}`);
    console.log(`   状态: ${response.status}`);
    console.log(`   资源类型: ${resourceType}`);
    console.log(`   缓存策略: ${cacheStrategy}`);
    
    // 开发环境的额外信息
    if (headers['x-debug-cdn-url']) {
      console.log(`   CDN URL: ${headers['x-debug-cdn-url']}`);
      console.log(`   资源流向: ${headers['x-debug-resource-flow']}`);
    }
    
    // SEO 文件的重写信息
    if (headers['x-seo-file']) {
      console.log(`   重写目标: ${headers['x-rewrite-target']}`);
    }
    
    return {
      path: testCase.path,
      success: isCorrect,
      expected: testCase.expectedServedBy,
      actual: servedBy,
      status: response.status
    };
    
  } catch (error) {
    console.log(`   结果: ❌ ${chalk.red('请求失败')}`);
    console.log(`   错误: ${error.message}`);
    
    return {
      path: testCase.path,
      success: false,
      expected: testCase.expectedServedBy,
      actual: 'error',
      error: error.message
    };
  }
}

async function runTests() {
  console.log(chalk.bold.blue('\n🚀 资源分发测试开始'));
  console.log(`测试地址: ${BASE_URL}`);
  console.log(`CDN 配置: ${CDN_URL || '未配置（本地模式）'}`);
  console.log('=' * 50);
  
  const results = [];
  
  for (const testCase of testCases) {
    // 跳过本地环境下不适用的测试
    if (testCase.skipIfLocal && !CDN_URL) {
      console.log(`\n⏭️  跳过: ${testCase.description}（本地环境）`);
      continue;
    }
    
    const result = await testResource(testCase);
    results.push(result);
    
    // 添加延迟避免过于频繁的请求
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // 汇总报告
  console.log('\n' + '=' * 50);
  console.log(chalk.bold.blue('📊 测试汇总报告'));
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const successRate = ((successful / total) * 100).toFixed(1);
  
  console.log(`总计测试: ${total}`);
  console.log(`成功: ${chalk.green(successful)}`);
  console.log(`失败: ${chalk.red(total - successful)}`);
  console.log(`成功率: ${successRate}%`);
  
  // 失败详情
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.log('\n❌ 失败详情:');
    failed.forEach(f => {
      console.log(`   ${f.path}: 期望 ${f.expected}, 实际 ${f.actual}`);
    });
  }
  
  // 建议
  console.log('\n💡 建议:');
  if (!CDN_URL) {
    console.log('   - 本地开发环境，静态资源走本地服务器是正常的');
    console.log('   - 生产环境请配置 CDN_URL 环境变量');
  } else {
    console.log('   - 确保 CDN 配置正确且可访问');
    console.log('   - 检查 next.config.js 中的 assetPrefix 配置');
  }
  
  console.log('   - 使用浏览器开发者工具查看网络请求的响应头');
  console.log('   - 查看 x-served-by 头确认资源来源');
  
  process.exit(failed.length > 0 ? 1 : 0);
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testResource }; 