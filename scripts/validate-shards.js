import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.resolve(__dirname, '../public/data/prompts')
const INDEX_PATH = path.join(DATA_DIR, 'index.json')

function validate() {
  console.log('🔍 Starting Shard Validation...')

  if (!fs.existsSync(INDEX_PATH)) {
    console.error('❌ Index file not found:', INDEX_PATH)
    process.exit(1)
  }

  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'))
  console.log(
    `📊 Index Info: Version ${index.version}, Total Prompts: ${index.totalPrompts}, Shards: ${index.shardCount}`,
  )

  let actualTotalPrompts = 0
  const allPromptIds = new Set()
  const categoryStats = {}
  const shardMapActual = {}

  // Init category stats
  Object.keys(index.categories).forEach((cat) => {
    categoryStats[cat] = { count: 0, promptIds: new Set() }
  })

  // Check each shard
  for (let i = 0; i < index.shardCount; i++) {
    const shardPath = path.join(DATA_DIR, `shard-${i}.json`)
    if (!fs.existsSync(shardPath)) {
      console.error(`❌ Shard file missing: ${shardPath}`)
      continue
    }

    const shard = JSON.parse(fs.readFileSync(shardPath, 'utf-8'))
    console.log(`  📄 Checking Shard ${i}: ${shard.prompts.length} prompts`)

    shardMapActual[i] = []

    shard.prompts.forEach((p) => {
      // 1. Duplicate Check
      if (allPromptIds.has(p.id)) {
        console.error(`  ❌ Duplicate Prompt ID found: ${p.id} in Shard ${i}`)
      }
      allPromptIds.add(p.id)
      actualTotalPrompts++

      // 2. Track for ShardMap
      shardMapActual[i].push(p.id)

      // 3. Track for Category Stats
      if (!categoryStats[p.category]) {
        // New category found in data but not in index (or just initializing)
        categoryStats[p.category] = { count: 0, promptIds: new Set() }
      }
      categoryStats[p.category].count++
      categoryStats[p.category].promptIds.add(p.id)
    })
  }

  let hasError = false

  // Validation 1: Total Count
  if (actualTotalPrompts !== index.totalPrompts) {
    console.error(
      `❌ Total Prompts Mismatch! Index: ${index.totalPrompts}, Actual: ${actualTotalPrompts}`,
    )
    hasError = true
  } else {
    console.log('✅ Total Prompts Count Match')
  }

  // Validation 2: Categories
  console.log('🔍 Validating Categories...')
  Object.keys(index.categories).forEach((cat) => {
    const idxCat = index.categories[cat]
    const actCat = categoryStats[cat]

    if (!actCat) {
      if (idxCat.count !== 0) {
        console.error(`❌ Category '${cat}' has ${idxCat.count} in index but 0 in shards!`)
        hasError = true
      }
    } else {
      if (idxCat.count !== actCat.count) {
        console.error(
          `❌ Category '${cat}' count mismatch! Index: ${idxCat.count}, Actual: ${actCat.count}`,
        )
        hasError = true
      }
      // Check ID inclusion (sampling or full check)
      // We can verify that every ID in index is in actual
      idxCat.promptIds.forEach((id) => {
        if (!actCat.promptIds.has(id)) {
          console.error(
            `❌ Prompt ID ${id} listed in category '${cat}' index but not found in that category in shards!`,
          )
          hasError = true
        }
      })
    }
  })

  // Validation 3: Shard Map
  console.log('🔍 Validating Shard Map...')
  Object.keys(index.shardMap).forEach((shardId) => {
    const idxIds = index.shardMap[shardId]
    const actIds = shardMapActual[shardId]

    if (!actIds) {
      // logic handled above
    } else {
      if (idxIds.length !== actIds.length) {
        console.error(
          `❌ Shard ${shardId} Map length mismatch! Index: ${idxIds.length}, Actual: ${actIds.length}`,
        )
        hasError = true
      }
      // Basic set check
      const actSet = new Set(actIds)
      idxIds.forEach((id) => {
        if (!actSet.has(id)) {
          console.error(`❌ Prompt ID ${id} in Index ShardMap ${shardId} but not in Actual Shard!`)
          hasError = true
        }
      })
    }
  })

  if (hasError) {
    console.error('⛔ Validation FAILED')
    process.exit(1)
  } else {
    console.log('✨ All Validations PASSED')
    process.exit(0)
  }
}

validate()
