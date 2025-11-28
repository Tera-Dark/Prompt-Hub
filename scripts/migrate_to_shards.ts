import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SHARD_COUNT = 8

// Copy of hashCode from src/utils/shard.ts
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

function getShardId(promptId: string, shardCount: number): number {
  return hashCode(promptId) % shardCount
}

async function migrate() {
  const rootDir = path.resolve(__dirname, '..')
  const promptsFile = path.join(rootDir, 'public/data/prompts.json')
  const outputDir = path.join(rootDir, 'public/data/prompts')

  console.log('Reading prompts from:', promptsFile)

  if (!fs.existsSync(promptsFile)) {
    console.error('prompts.json not found!')
    process.exit(1)
  }

  const content = fs.readFileSync(promptsFile, 'utf-8')
  const data = JSON.parse(content)
  const prompts = data.prompts || []

  console.log(`Found ${prompts.length} prompts.`)

  // Prepare shards
  const shards: Record<number, any[]> = {}
  for (let i = 0; i < SHARD_COUNT; i++) {
    shards[i] = []
  }

  // Prepare index
  const index = {
    version: '2.0.0',
    shardCount: SHARD_COUNT,
    totalPrompts: prompts.length,
    lastUpdated: new Date().toISOString(),
    categories: {} as Record<string, { count: number; shards: number[]; promptIds: string[] }>,
    shardMap: {} as Record<string, string[]>,
  }

  // Distribute prompts
  prompts.forEach((prompt: any) => {
    const shardId = getShardId(prompt.id, SHARD_COUNT)
    shards[shardId].push(prompt)

    // Update Index - Categories
    const category = prompt.category
    if (!index.categories[category]) {
      index.categories[category] = {
        count: 0,
        shards: [],
        promptIds: [],
      }
    }
    index.categories[category].count++
    index.categories[category].promptIds.push(prompt.id)
    if (!index.categories[category].shards.includes(shardId)) {
      index.categories[category].shards.push(shardId)
    }

    // Update Index - ShardMap
    if (!index.shardMap[shardId]) {
      index.shardMap[shardId] = []
    }
    index.shardMap[shardId].push(prompt.id)
  })

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Write Shards
  for (let i = 0; i < SHARD_COUNT; i++) {
    const shardData = {
      shardId: i,
      prompts: shards[i],
    }
    const shardPath = path.join(outputDir, `shard-${i}.json`)
    fs.writeFileSync(shardPath, JSON.stringify(shardData, null, 2))
    console.log(`Written shard ${i} with ${shards[i].length} prompts`)
  }

  // Write Index
  const indexPath = path.join(outputDir, 'index.json')
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2))
  console.log('Written index.json')

  console.log('Migration complete!')
}

migrate().catch(console.error)
