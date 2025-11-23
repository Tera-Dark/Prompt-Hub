<template>
  <div class="ui-input-wrapper">
    <label v-if="label" class="ui-label">
      {{ label }}
      <span v-if="required" class="ui-required">*</span>
    </label>
    <div class="ui-input-container">
      <span v-if="$slots.prefix" class="ui-input-prefix">
        <slot name="prefix"></slot>
      </span>
      <input
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="['ui-input', { 'has-error': error, 'has-prefix': $slots.prefix }]"
        v-bind="$attrs"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <span v-if="$slots.suffix" class="ui-input-suffix">
        <slot name="suffix"></slot>
      </span>
    </div>
    <p v-if="error" class="ui-error-message">{{ error }}</p>
    <p v-else-if="hint" class="ui-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string | number
  label?: string
  type?: string
  placeholder?: string
  error?: string
  hint?: string
  disabled?: boolean
  required?: boolean
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  required: false,
})

defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()
</script>

<style scoped>
.ui-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.ui-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-primary);
}

.ui-required {
  color: var(--color-text-primary); /* Minimalist: no red asterisk */
  margin-left: 0.125rem;
}

.ui-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.ui-input {
  width: 100%;
  padding: 0.75rem 0; /* Bottom border style */
  font-size: var(--text-base);
  color: var(--color-text-primary);
  background-color: transparent;
  border: none;
  border-bottom: 1px solid var(--color-border);
  border-radius: 0;
  transition: border-color var(--transition-base);
}

.ui-input:focus {
  outline: none;
  border-bottom-color: var(--color-black);
}

.ui-input:disabled {
  color: var(--color-text-tertiary);
  cursor: not-allowed;
  border-bottom-color: var(--color-border-light);
}

.ui-input.has-error {
  border-bottom-color: var(--color-black); /* Minimalist error: just black or maybe bold */
  /* Or stick to red if strictly needed, but user asked for minimalist. Let's keep it simple. */
}

.ui-input.has-prefix {
  padding-left: 2rem;
}

.ui-input-prefix {
  position: absolute;
  left: 0;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  pointer-events: none;
}

.ui-error-message {
  font-size: var(--text-xs);
  color: var(--color-text-primary);
  font-weight: 500;
  margin: 0;
}

.ui-hint {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin: 0;
}
</style>
