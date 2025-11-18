#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
// const tabs = require('../src/constant/tabs.js');
const tabs = [
  "Parenting",
  "Pets",
  "Travel",
  "RealEstate",
  "JobCareer",
  "Home",
  "Health",
  "Fitness",
  "Gardening",
  "Cars",
  "Beauty",
  "Education",
  "Fashion",
  "Finance",
  "Food",
  "Spirituality",
  "Transportation",
  "Science",
  "Tech",
  "Shopping",
  "Culture",
  "Business",
  "Entertainment",
  "Games",
  "Safety",
  "Sports",
  "Lifehacks",
  "History",
  "Politics",
  "Astrology",
  "Religion",
  "Aging",
  "Campus",
  "Funny",
  "Rants",
  "News",
  "Weather",
  "Military",
  "Relationships",
  "SkillsLearning",
  "Outdoors",
  "Guns"
]
const staticPagesConfig = require('./static-pages-config.js');

// 环境变量配置
const SITE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://biblevod.com';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || SITE_URL;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'internal-sitemap-key-2024';

// 获取有效的分类（排除 "/" 和 "following"）
const validCategories = tabs.map(key => ({
  name: key,
  key: key,
}));

console.log(`🔧 配置信息:`);
console.log(`   站点URL: ${SITE_URL}`);
console.log(`   有效分类: ${validCategories.map(c => c.key).join(', ')}`);

/**
 * 生成单个sitemap的XML内容
 */
function generateSitemapXML(paths, category) {
  const urls = paths.map(path => {
    const url = typeof path === 'string' ? path : path.loc;
    const lastmod = path.lastmod.replace(" ", "T") + "Z" || new Date().toISOString().split('T')[0] + ' 09:00:00';
    const changefreq = path.changefreq || 'daily';
    const priority = path.priority || 1.0;

    return `  <url>
    <loc>${SITE_URL}${url}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Generated for category: ${category} -->
  <!-- Total URLs: ${paths.length} -->
  <!-- Updated: ${Date.now()} -->
  
${urls}
</urlset>`;
}

/**
 * 生成sitemap索引文件 (不包含静态页面)
 */
function generateSitemapIndex(categories) {
  const currentDate = new Date().toISOString();

  const sitemapEntries = [
    // topdoc sitemap
    `
  <sitemap>
    <loc>${SITE_URL}/sitemap-topdoc.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>`,
    // 各分类sitemap
    ...categories.map(category => `
  <sitemap>
    <loc>${SITE_URL}/sitemap-${category.key}.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>`)
  ].join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Generated sitemap index - Categories and TopDoc only -->${sitemapEntries}
</sitemapindex>`;
}

/**
 * 生成robots.txt文件 (只包含两个sitemap索引)
 */
function generateRobotsTxt(categories) {
  const sitemapUrls = [
    `${SITE_URL}/sitemap-static.xml`,
    `${SITE_URL}/sitemap.xml`
  ];

  return `# *
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /private/
Disallow: /_next/
Disallow: /404
Disallow: /500
Disallow: /users/
Disallow: /activity/

# Googlebot
User-agent: Googlebot
Allow: /
Disallow: /api/
Disallow: /api/*
Allow: /api/contents/comments
Allow: /api/contents/comments/*
Disallow: /admin/
Disallow: /private/

# Bingbot
User-agent: Bingbot
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /private/

# Host
Host: ${SITE_URL.replace(/https?:\/\//, '')}

# Sitemaps
${sitemapUrls.map(url => `Sitemap: ${url}`).join('\n')}
`;
}

/**
 * 生成静态页面sitemap数据
 * 只包含真正的静态页面，使用配置文件中的手动管理的lastmod时间
 * 排除动态路径如/category等
 */
function generateStaticPagesPaths() {
  const staticPages = [];

  // 从配置文件中读取静态页面配置
  for (const [url, config] of Object.entries(staticPagesConfig)) {
    staticPages.push({
      loc: url,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.lastmod.replace(" ", "T")  // 使用配置文件中的手动设置时间
    });
  }

  // 注意：不再包含分类导航页面，因为这些是动态路径
  // 分类页面的sitemap会在各自的分类sitemap中处理

  return staticPages;
}

/**
 * 生成所有分类的sitemap文件
 */
async function generateAllCategorySitemaps() {
  console.log('🚀 开始生成分类sitemap文件...');
  console.log(`📂 将为 ${validCategories.length} 个分类生成独立的sitemap文件`);

  const publicDir = path.join(__dirname, '../public');

  // 确保public目录存在
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  let totalGeneratedFiles = 0;
  let totalUrls = 0;

  // 生成静态页面sitemap (sitemap-static.xml)
  try {
    const staticPaths = generateStaticPagesPaths();
    const staticSitemapXML = generateSitemapXML(staticPaths, 'Static Pages');
    const staticFileName = 'sitemap-static.xml';
    const staticFilePath = path.join(publicDir, staticFileName);

    fs.writeFileSync(staticFilePath, staticSitemapXML);
    console.log(`✅ 生成 ${staticFileName} - ${staticPaths.length} 个静态页面URL`);
    totalGeneratedFiles++;
    totalUrls += staticPaths.length;
  } catch (error) {
    console.error(`❌ 生成静态页面sitemap失败:`, error.message);
  }

  // 为每个分类生成sitemap
  for (const category of validCategories) {
    try {
      const data = await getHotDocsForSeo(category.key);

      if (data && data.length > 0) {
        const sitemapXML = generateSitemapXML(data, category.name);
        const fileName = `sitemap-${category.key}.xml`;
        const filePath = path.join(publicDir, fileName);

        fs.writeFileSync(filePath, sitemapXML);

        console.log(`✅ 生成 ${fileName} - ${data.length} 个唯一文档URL`);
        totalGeneratedFiles++;
        totalUrls += data.length;
      } else {
        console.log(`⚠️ 分类 "${category.name}" 无数据，跳过生成sitemap`);
      }
    } catch (error) {
      console.error(`❌ 生成分类 "${category.name}" sitemap失败:`, error.message);
    }
  }

  // 为topdoc生成sitemap
  try {
    const topDocData = await getHotDocsForSeo();
    const topDocSitemapXML = generateSitemapXML(topDocData, 'topdoc');
    const topDocFileName = `sitemap-topdoc.xml`;
    const topDocFilePath = path.join(publicDir, topDocFileName);
    fs.writeFileSync(topDocFilePath, topDocSitemapXML);
    console.log(`✅ 生成 ${topDocFileName} - ${topDocData.length} 个唯一文档URL`);
    totalGeneratedFiles++;
    totalUrls += topDocData.length;
  } catch (error) {
    console.error(`❌ 生成topdoc sitemap失败:`, error.message);
  }

  // 生成sitemap索引文件
  try {
    const sitemapIndexXML = generateSitemapIndex(validCategories);
    const indexPath = path.join(publicDir, 'sitemap.xml');
    fs.writeFileSync(indexPath, sitemapIndexXML);
    console.log(`✅ 生成 sitemap.xml 索引文件`);
    totalGeneratedFiles++;
  } catch (error) {
    console.error('❌ 生成sitemap索引文件失败:', error.message);
  }

  // 生成robots.txt文件
  try {
    const robotsTxtContent = generateRobotsTxt(validCategories);
    const robotsPath = path.join(publicDir, 'robots.txt');
    fs.writeFileSync(robotsPath, robotsTxtContent);
    console.log(`✅ 生成 robots.txt 文件`);
    totalGeneratedFiles++;
  } catch (error) {
    console.error('❌ 生成robots.txt文件失败:', error.message);
  }

  // 输出统计信息
  console.log('\n📊 生成完成统计:');
  console.log(`- 生成文件数: ${totalGeneratedFiles}`);
  console.log(`- 总唯一文档URL数量: ${totalUrls}`);
  console.log(`- 分类sitemap: ${validCategories.length} 个`);
  console.log(`- 文件位置: ${publicDir}\n`);

  // 列出生成的文件
  console.log('📁 生成的sitemap文件:');
  console.log(`  ✓ sitemap-static.xml (静态页面)`);
  console.log(`  ✓ sitemap-topdoc.xml (热门文档)`);
  validCategories.forEach(category => {
    const fileName = `sitemap-${category.key}.xml`;
    const filePath = path.join(publicDir, fileName);
    if (fs.existsSync(filePath)) {
      console.log(`  ✓ ${fileName} (${category.name})`);
    }
  });
  console.log(`  ✓ sitemap.xml (索引文件 - 分类和topdoc)`);
  console.log(`  ✓ robots.txt (robots文件 - 只包含两个sitemap索引)`);
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🏷️ 分类sitemap生成器启动');
    console.log(`🌐 网站URL: ${SITE_URL}`);
    console.log(`📡 API地址: ${API_BASE_URL}`);
    console.log(`🔑 API密钥: ${INTERNAL_API_KEY ? '已配置' : '未配置'}\n`);

    await generateAllCategorySitemaps();

    console.log('🎉 所有分类sitemap生成完成！');
  } catch (error) {
    console.error('💥 生成sitemap时出现错误:', error);
    process.exit(1);
  }
}

async function getHotDocsForSeo(category) {
  const TOTAL = 10000; // 需要请求的总数
  const PAGE_SIZE = 100; // 每页请求100条
  let allResults = [];

  try {
    let cstart = 0;
    while (allResults.length < TOTAL) {
      let cend = cstart + PAGE_SIZE;
      const backendBaseUrl = process.env.PC_BACKEND_BASE_URL || 'https://api-h2.newsbreak.com/Website';
      const url = category ? `${backendBaseUrl}/community/hot-docs-for-seo?cstart=${cstart}&cend=${cend}&channel=${category}` : `${backendBaseUrl}/community/hot-docs-for-seo?cstart=${cstart}&cend=${cend}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const result = (data.result || []).map(item => ({
        // ...item,
        loc: `/posts/${generateDetailPath(item.docid, item.title)}`,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: item.time,
        docid: item.docid // 保存原始docid用于去重
      }));

      allResults = allResults.concat(result);
      // console.log("🚀 ~ getHotDocsForSeo ~ allResults:", allResults)

      console.log(`【API】📚 获取 ${category ? category : 'topdoc'} 第${cstart}~${cend}条，返回${result.length}个热门文档（累计${allResults.length}/${TOTAL}）`);

      // 如果本次返回数量不足PAGE_SIZE，说明已无更多数据，提前结束
      if (result.length === 0) {
        break;
      }

      cstart += PAGE_SIZE;
    }

    // 如果返回数量大于TOTAL，截断
    if (allResults.length > TOTAL) {
      allResults = allResults.slice(0, TOTAL);
    }

    // 对docid进行去重
    const uniqueResults = [];
    const seenDocIds = new Set();

    for (const item of allResults) {
      if (!seenDocIds.has(item.docid)) {
        seenDocIds.add(item.docid);
        uniqueResults.push(item);
      }
    }

    const originalCount = allResults.length;
    const uniqueCount = uniqueResults.length;
    const duplicatesRemoved = originalCount - uniqueCount;

    console.log(`【API】📚 成功获取全部 ${originalCount} 个热门文档，去重后剩余 ${uniqueCount} 个文档${duplicatesRemoved > 0 ? `（移除 ${duplicatesRemoved} 个重复项）` : ''}`);
    return uniqueResults;

  } catch (error) {
    console.error('获取热门文档失败:', error);
    // 返回空数组而不是抛出错误，让上层处理
    return [];
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  generateAllCategorySitemaps,
  getHotDocsForSeo,
  generateSitemapXML,
  generateSitemapIndex,
  generateRobotsTxt,
  generateStaticPagesPaths
};

const bigInt = require("big-integer");

function base63_decode(str) {
  const base = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_";
  if (str.length <= 8) {
    let ret = 0;
    const n = str.length;
    for (let i = 0; i < n; i++) {
      const index = base.indexOf(str.charAt(i));
      ret = ret * 63 + (index >= 0 ? index : 0);
    }
    return `${ret}`;
  }
  let ret = bigInt(0);
  const n = str.length;
  for (let i = 0; i < n; i++) {
    const index = base.indexOf(str.charAt(i));
    ret = ret.times(63).plus(index >= 0 ? index : 0);
  }
  return `${ret}`;
}

function generateDetailPath(doc_id, title) {
  const id = base63_decode(doc_id);

  // 更完善的URL清理：移除所有problematic Unicode字符
  let cleanTitle = title
    // 移除emoji表情符号
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
    // 移除零宽度字符 (ZWJ, ZWNJ, variation selectors等)
    .replace(/[\u200D\u200C\uFE0F\uFE0E]/g, '')
    // 移除其他变体选择器和组合标记
    .replace(/[\u{E0000}-\u{E007F}]/gu, '')
    // 将全角标点符号转换为半角
    .replace(/？/g, '?')
    .replace(/！/g, '!')
    .replace(/，/g, ',')
    .replace(/。/g, '.')
    .replace(/：/g, ':')
    .replace(/；/g, ';')
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    // 移除其他可能problematic的字符
    .replace(/[^\w\s\-.,!?:;'"()]/g, '')
    // 将空格替换为短横线
    .replace(/\s+/g, '-')
    // 移除多余的短横线
    .replace(/-+/g, '-')
    // 移除开头和结尾的短横线
    .replace(/^-+|-+$/g, '');

  let path = `${id}-${cleanTitle}`;

  // 确保路径不以短横线结尾
  if (path.endsWith("-")) {
    path = path.slice(0, -1);
  }

  return path;
}