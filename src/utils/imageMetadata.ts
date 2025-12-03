export interface SDMetadata {
  prompt: string
  negativePrompt: string
  steps?: number
  sampler?: string
  cfg?: number
  seed?: string
  modelHash?: string
  model?: string
  size?: string
  loras?: string[]
}

export async function extractSDMetadata(file: File): Promise<SDMetadata | null> {
  try {
    const buffer = await file.arrayBuffer()
    const textChunks = extractPngText(buffer)
    if (!textChunks) return null

    if (textChunks['parameters']) {
      return parseGenerationInfo(textChunks['parameters'])
    } else if (textChunks['Software'] === 'NovelAI') {
      return parseNovelAIMetadata(textChunks)
    }

    return null
  } catch (e) {
    console.error('Failed to extract metadata:', e)
    return null
  }
}

function extractPngText(buffer: ArrayBuffer): Record<string, string> | null {
  const view = new DataView(buffer)
  const textData: Record<string, string> = {}

  // Check PNG signature
  if (view.getUint32(0) !== 0x89504e47 || view.getUint32(4) !== 0x0d0a1a0a) {
    return null
  }

  let offset = 8
  while (offset < view.byteLength) {
    const length = view.getUint32(offset)
    const type = getString(view, offset + 4, 4)

    if (type === 'tEXt') {
      const data = getUint8Array(view, offset + 8, length)
      // tEXt format: Keyword + null + Text
      let nullIndex = -1
      for (let i = 0; i < data.length; i++) {
        if (data[i] === 0) {
          nullIndex = i
          break
        }
      }

      if (nullIndex > -1) {
        const keyword = new TextDecoder().decode(data.slice(0, nullIndex))
        const text = new TextDecoder().decode(data.slice(nullIndex + 1))
        textData[keyword] = text
      }
    }

    offset += 8 + length + 4 // Length + Type + Data + CRC
  }

  return Object.keys(textData).length > 0 ? textData : null
}

function getString(view: DataView, offset: number, length: number): string {
  const arr = new Uint8Array(view.buffer, offset, length)
  return new TextDecoder().decode(arr)
}

function getUint8Array(view: DataView, offset: number, length: number): Uint8Array {
  return new Uint8Array(view.buffer, offset, length)
}

function parseNovelAIMetadata(chunks: Record<string, string>): SDMetadata {
  const metadata: SDMetadata = {
    prompt: '',
    negativePrompt: '',
  }

  // NovelAI often stores rich metadata in the 'Comment' chunk as JSON
  if (chunks['Comment']) {
    try {
      const commentData = JSON.parse(chunks['Comment'])
      if (commentData.prompt) metadata.prompt = commentData.prompt
      if (commentData.uc) metadata.negativePrompt = commentData.uc
      if (commentData.steps) metadata.steps = commentData.steps
      if (commentData.sampler) metadata.sampler = commentData.sampler
      if (commentData.scale) metadata.cfg = commentData.scale
      if (commentData.seed) metadata.seed = String(commentData.seed)
    } catch (e) {
      console.warn('Failed to parse NovelAI Comment JSON:', e)
    }
  }

  // Fallback/Override with standard chunks if JSON didn't provide prompt
  if (!metadata.prompt && chunks['Description']) {
    metadata.prompt = chunks['Description']
  }

  if (chunks['Source']) {
    metadata.model = chunks['Source']
    // Try to extract hash from Source (e.g. "NovelAI Diffusion V4.5 4BDE2A90")
    const hashMatch = chunks['Source'].match(/([A-F0-9]{8,})$/)
    if (hashMatch) {
      metadata.modelHash = hashMatch[1]
    }
  }

  return metadata
}

function parseGenerationInfo(info: string): SDMetadata {
  const lines = info
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  let prompt = ''
  let negativePrompt = ''
  let paramsLine = ''

  // Find the parameters line (starts with Steps: )
  const paramsIndex = lines.findIndex((line) => line.startsWith('Steps: '))

  if (paramsIndex !== -1) {
    paramsLine = lines[paramsIndex]

    // Everything before parameters is prompt + negative prompt
    const contentBeforeParams = lines.slice(0, paramsIndex)

    // Find where negative prompt starts
    const negativeIndex = contentBeforeParams.findIndex((line) =>
      line.startsWith('Negative prompt:'),
    )

    if (negativeIndex !== -1) {
      prompt = contentBeforeParams.slice(0, negativeIndex).join('\n')
      negativePrompt = contentBeforeParams
        .slice(negativeIndex)
        .join('\n')
        .replace(/^Negative prompt:\s*/, '')
    } else {
      prompt = contentBeforeParams.join('\n')
    }
  } else {
    // Fallback: try to find Negative prompt without Steps
    const negativeIndex = lines.findIndex((line) => line.startsWith('Negative prompt:'))
    if (negativeIndex !== -1) {
      prompt = lines.slice(0, negativeIndex).join('\n')
      negativePrompt = lines
        .slice(negativeIndex)
        .join('\n')
        .replace(/^Negative prompt:\s*/, '')
    } else {
      prompt = lines.join('\n')
    }
  }

  // Extract LoRAs from prompt
  const loraRegex = /<lora:([^:]+):([0-9.]+)>/g
  const loras: string[] = []
  prompt = prompt
    .replace(loraRegex, (_match, name, weight) => {
      loras.push(`${name}:${weight}`)
      return '' // Remove LoRA tag from prompt
    })
    .trim()

  // Clean up prompt (remove extra commas/spaces)
  prompt = prompt.replace(/,\s*,/g, ',').replace(/^,/, '').replace(/,$/, '').trim()

  const metadata: SDMetadata = {
    prompt,
    negativePrompt,
    loras: loras.length > 0 ? loras : undefined,
  }

  if (paramsLine) {
    // Parse parameters
    // Format: Key: Value, Key: Value
    // But Value can contain commas (e.g. Lora hashes)
    // We need a smarter split.
    // Strategy: Split by ", " but check if the next part looks like a key (Capitalized word(s) + :)

    const kvPairs: Record<string, string> = {}
    let currentKey = ''
    let currentValue = ''

    const parts = paramsLine.split(', ')

    for (const part of parts) {
      // Check if this part starts a new key
      // Common keys: Steps, Sampler, CFG scale, Seed, Size, Model hash, Model, Lora hashes, Version, etc.
      const keyMatch = part.match(/^([a-zA-Z0-9\s]+):\s+(.*)/)

      if (keyMatch) {
        // Save previous pair if exists
        if (currentKey) {
          kvPairs[currentKey] = currentValue
        }

        currentKey = keyMatch[1]
        currentValue = keyMatch[2]
      } else {
        // Append to current value (it was split by comma inside value)
        if (currentKey) {
          currentValue += ', ' + part
        }
      }
    }
    // Save last pair
    if (currentKey) {
      kvPairs[currentKey] = currentValue
    }

    if (kvPairs['Steps']) metadata.steps = parseInt(kvPairs['Steps'])
    if (kvPairs['Sampler']) metadata.sampler = kvPairs['Sampler']
    if (kvPairs['CFG scale']) metadata.cfg = parseFloat(kvPairs['CFG scale'])
    if (kvPairs['Seed']) metadata.seed = kvPairs['Seed']
    if (kvPairs['Size']) metadata.size = kvPairs['Size']
    if (kvPairs['Model hash']) metadata.modelHash = kvPairs['Model hash']
    if (kvPairs['Model']) metadata.model = kvPairs['Model']
  }

  return metadata
}
