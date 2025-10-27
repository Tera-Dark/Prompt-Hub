import type { PromptsData } from '@/types/prompt';

export interface ValidationError {
  field: string;
  message: string;
  promptId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export function validatePromptsData(data: PromptsData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!data.version) {
    errors.push({ field: 'version', message: 'Version field is required' });
  }

  if (!Array.isArray(data.prompts)) {
    errors.push({ field: 'prompts', message: 'Prompts must be an array' });
    return { valid: false, errors, warnings };
  }

  const seenIds = new Set<string>();

  data.prompts.forEach((prompt, index) => {
    const promptId = prompt.id || `index-${index}`;

    if (!prompt.id) {
      errors.push({ field: 'id', message: 'ID is required', promptId });
    } else if (seenIds.has(prompt.id)) {
      errors.push({ field: 'id', message: `Duplicate ID: ${prompt.id}`, promptId });
    } else {
      seenIds.add(prompt.id);
    }

    if (!prompt.title || prompt.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title is required', promptId });
    }

    if (!prompt.category || prompt.category.trim().length === 0) {
      errors.push({ field: 'category', message: 'Category is required', promptId });
    }

    if (!Array.isArray(prompt.tags)) {
      errors.push({ field: 'tags', message: 'Tags must be an array', promptId });
    } else if (prompt.tags.length === 0) {
      warnings.push({ field: 'tags', message: 'No tags specified', promptId });
    }

    if (!prompt.prompt || prompt.prompt.trim().length === 0) {
      errors.push({ field: 'prompt', message: 'Prompt text is required', promptId });
    }

    if (!prompt.description || prompt.description.trim().length === 0) {
      errors.push({ field: 'description', message: 'Description is required', promptId });
    }

    if (!prompt.createdAt) {
      errors.push({ field: 'createdAt', message: 'CreatedAt is required', promptId });
    } else {
      const date = new Date(prompt.createdAt);
      if (isNaN(date.getTime())) {
        errors.push({ field: 'createdAt', message: 'Invalid date format', promptId });
      }
    }

    if (prompt.updatedAt) {
      const date = new Date(prompt.updatedAt);
      if (isNaN(date.getTime())) {
        errors.push({ field: 'updatedAt', message: 'Invalid date format', promptId });
      }
    }

    if (prompt.sourceLink && !isValidUrl(prompt.sourceLink)) {
      warnings.push({ field: 'sourceLink', message: 'Invalid URL format', promptId });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function printValidationResults(result: ValidationResult): void {
  console.log('\n=== Prompts Data Validation ===\n');

  if (result.valid) {
    console.log('✅ Validation passed!');
  } else {
    console.log('❌ Validation failed!');
  }

  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`);
    result.errors.forEach(err => {
      const location = err.promptId ? ` [${err.promptId}]` : '';
      console.log(`  - ${err.field}${location}: ${err.message}`);
    });
  }

  if (result.warnings.length > 0) {
    console.log(`\nWarnings (${result.warnings.length}):`);
    result.warnings.forEach(warn => {
      const location = warn.promptId ? ` [${warn.promptId}]` : '';
      console.log(`  - ${warn.field}${location}: ${warn.message}`);
    });
  }

  console.log('\n=============================\n');
}
