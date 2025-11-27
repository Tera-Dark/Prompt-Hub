/**
 * Hash-based Prompt Storage Migration Script
 * 将现有prompts.json迁移到分片存储结构
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 配置
const CONFIG = {
  shardCount: 8,
  sourceFile: path.join(__dirname, '../public/data/prompts.json'),
  targetDir: path.join(__dirname, '../public/data/prompts'),
  indexFile: path.join(__dirname, '../public/data/prompts/index.json'),
}

/**
 * 计算字符串的哈希值
 */
function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * 根据promptId计算分片ID
 */
function getShardId(promptId, shardCount) {
  return hashCode(promptId) % shardCount
}

/**
 * 迁移数据
 */
async function migrate() {
  console.log('🚀 Starting migration to hash-sharding storage...')

  // 1. 读取现有数据
  console.log('📖 Reading existing prompts.json...')
  const sourceData = JSON.parse(fs.readFileSync(CONFIG.sourceFile, 'utf-8'))
  const prompts = sourceData.prompts || []
  console.log(`   Found ${prompts.length} prompts`)

  // 2. 创建目标目录
  if (!fs.existsSync(CONFIG.targetDir)) {
    fs.mkdirSync(CONFIG.targetDir, { recursive: true })
    console.log('📁 Created prompts directory')
  }

  // 3. 初始化分片
  const shards = Array.from({ length: CONFIG.shardCount }, (_, i) => ({
    shardId: i,
    prompts: [],
  }))

  // 4. 分配prompts到分片
  console.log('🔀 Distributing prompts to shards...')
  const categoryMap = new Map() // 分类统计

  for (const prompt of prompts) {
    const shardId = getShardId(prompt.id, CONFIG.shardCount)
    shards[shardId].prompts.push(prompt)

    // 更新分类统计
    const category = prompt.category
    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        count: 0,
        shards: new Set(),
        promptIds: [],
      })
    }
    const catData = categoryMap.get(category)
    catData.count++
    catData.shards.add(shardId)
    catData.promptIds.push(prompt.id)
  }

  // 5. 写入分片文件
  console.log('💾 Writing shard files...')
  for (const shard of shards) {
    const shardFile = path.join(CONFIG.targetDir, `shard-${shard.shardId}.json`)
    fs.writeFileSync(shardFile, JSON.stringify(shard, null, 2), 'utf-8')
    console.log(`   ✓ shard-${shard.shardId}.json (${shard.prompts.length} prompts)`)
  }

  // 6. 生成分片映射
  const shardMap = {}
  for (const shard of shards) {
    shardMap[shard.shardId] = shard.prompts.map((p) => p.id)
  }

  // 7. 生成索引
  console.log('📋 Generating index...')
  const categories = {}
  for (const [name, data] of categoryMap.entries()) {
    categories[name] = {
      count: data.count,
      shards: Array.from(data.shards).sort((a, b) => a - b),
      promptIds: data.promptIds,
    }
  }

  const index = {
    version: '2.0.0',
    shardCount: CONFIG.shardCount,
    totalPrompts: prompts.length,
    lastUpdated: new Date().toISOString(),
    categories,
    shardMap,
  }

  fs.writeFileSync(CONFIG.indexFile, JSON.stringify(index, null, 2), 'utf-8')
  console.log('   ✓ index.json generated')

  // 8. 备份原文件
  const backupFile = CONFIG.sourceFile + '.backup'
  fs.copyFileSync(CONFIG.sourceFile, backupFile)
  console.log(`💼 Backup created: ${backupFile}`)

  // 9. 统计信息
  console.log('\n✅ Migration completed!')
  console.log(`   Total prompts: ${prompts.length}`)
  console.log(`   Categories: ${categoryMap.size}`)
  console.log(`   Shards: ${CONFIG.shardCount}`)
  console.log(`   Avg prompts per shard: ${(prompts.length / CONFIG.shardCount).toFixed(1)}`)
}

// 执行迁移
migrate().catch((err) => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
