export const CATEGORIES = {
  AI_DRAWING: 'AI绘画',
  WRITING: '写作',
  PROGRAMMING: '编程',
  PRODUCTIVITY: '效率提升',
  TRANSLATION: '翻译',
  EDUCATION: '教育',
  MARKETING: '营销',
  ANALYSIS: '分析',
} as const

export type CategoryValue = (typeof CATEGORIES)[keyof typeof CATEGORIES]

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  [CATEGORIES.AI_DRAWING]: '生成和优化AI绘画提示词',
  [CATEGORIES.WRITING]: '创作、编辑和改进文本内容',
  [CATEGORIES.PROGRAMMING]: '编程、调试和代码优化',
  [CATEGORIES.PRODUCTIVITY]: '提升工作效率和生产力',
  [CATEGORIES.TRANSLATION]: '翻译和语言转换',
  [CATEGORIES.EDUCATION]: '教学和学习辅助',
  [CATEGORIES.MARKETING]: '营销文案和策略',
  [CATEGORIES.ANALYSIS]: '数据分析和研究',
}

export const CATEGORY_ICONS: Record<string, string> = {
  [CATEGORIES.AI_DRAWING]: '🎨',
  [CATEGORIES.WRITING]: '✍️',
  [CATEGORIES.PROGRAMMING]: '💻',
  [CATEGORIES.PRODUCTIVITY]: '⚡',
  [CATEGORIES.TRANSLATION]: '🌐',
  [CATEGORIES.EDUCATION]: '📚',
  [CATEGORIES.MARKETING]: '📢',
  [CATEGORIES.ANALYSIS]: '📊',
}
