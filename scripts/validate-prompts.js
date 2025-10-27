#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROMPTS_PATH = join(__dirname, '../public/data/prompts.json');

const VALID_CATEGORIES = [
  'AI绘画',
  '写作',
  '编程',
  '效率提升',
  '翻译',
  '教育',
  '营销',
  '分析'
];

function validatePromptsData() {
  console.log('\n🔍 Validating prompts data...\n');
  
  let data;
  try {
    const content = readFileSync(PROMPTS_PATH, 'utf-8');
    data = JSON.parse(content);
  } catch (error) {
    console.error('❌ Failed to read or parse prompts.json:', error.message);
    process.exit(1);
  }

  const errors = [];
  const warnings = [];

  if (!data.version) {
    errors.push('Missing version field');
  } else {
    console.log(`📦 Version: ${data.version}`);
  }

  if (!Array.isArray(data.prompts)) {
    errors.push('Prompts field must be an array');
    return { valid: false, errors, warnings };
  }

  console.log(`📊 Total prompts: ${data.prompts.length}\n`);

  const seenIds = new Set();
  const categoryCounts = {};

  data.prompts.forEach((prompt, index) => {
    const promptId = prompt.id || `index-${index}`;

    // Required fields
    if (!prompt.id) {
      errors.push(`[${index}] Missing id`);
    } else if (seenIds.has(prompt.id)) {
      errors.push(`[${promptId}] Duplicate ID`);
    } else {
      seenIds.add(prompt.id);
      
      // Check ID format
      if (!/^[a-z-]+-\d{3}$/.test(prompt.id)) {
        warnings.push(`[${promptId}] ID doesn't follow recommended format: {category-slug}-{number}`);
      }
    }

    if (!prompt.title || prompt.title.trim().length === 0) {
      errors.push(`[${promptId}] Missing or empty title`);
    }

    if (!prompt.category || prompt.category.trim().length === 0) {
      errors.push(`[${promptId}] Missing or empty category`);
    } else if (!VALID_CATEGORIES.includes(prompt.category)) {
      errors.push(`[${promptId}] Invalid category: ${prompt.category}`);
    } else {
      categoryCounts[prompt.category] = (categoryCounts[prompt.category] || 0) + 1;
    }

    if (!Array.isArray(prompt.tags)) {
      errors.push(`[${promptId}] Tags must be an array`);
    } else if (prompt.tags.length === 0) {
      warnings.push(`[${promptId}] No tags specified`);
    } else if (prompt.tags.length > 10) {
      warnings.push(`[${promptId}] Too many tags (${prompt.tags.length}), consider reducing to 8 or fewer`);
    }

    if (!prompt.prompt || prompt.prompt.trim().length === 0) {
      errors.push(`[${promptId}] Missing or empty prompt text`);
    }

    if (!prompt.description || prompt.description.trim().length === 0) {
      errors.push(`[${promptId}] Missing or empty description`);
    }

    if (!prompt.createdAt) {
      errors.push(`[${promptId}] Missing createdAt`);
    } else {
      const date = new Date(prompt.createdAt);
      if (isNaN(date.getTime())) {
        errors.push(`[${promptId}] Invalid createdAt date format`);
      }
    }

    if (prompt.updatedAt) {
      const date = new Date(prompt.updatedAt);
      if (isNaN(date.getTime())) {
        errors.push(`[${promptId}] Invalid updatedAt date format`);
      }
    }

    if (prompt.sourceLink) {
      try {
        new URL(prompt.sourceLink);
      } catch {
        warnings.push(`[${promptId}] Invalid sourceLink URL format`);
      }
    }
  });

  console.log('📂 Prompts by category:');
  Object.entries(categoryCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([category, count]) => {
      console.log(`   ${category}: ${count}`);
    });
  console.log();

  if (errors.length > 0) {
    console.log(`\n❌ Found ${errors.length} error(s):\n`);
    errors.forEach(err => console.log(`   ${err}`));
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  Found ${warnings.length} warning(s):\n`);
    warnings.forEach(warn => console.log(`   ${warn}`));
  }

  console.log();

  if (errors.length === 0) {
    console.log('✅ Validation passed!\n');
    return 0;
  } else {
    console.log('❌ Validation failed!\n');
    return 1;
  }
}

const exitCode = validatePromptsData();
process.exit(exitCode);
