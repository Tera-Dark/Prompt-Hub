<template>
  <div v-click-outside="close" class="sort-dropdown">
    <button class="trigger-btn" :class="{ active: isOpen }" @click="toggle">
      <span class="label">{{ label }}</span>
      <span class="value">{{ selectedLabel }}</span>
      <svg
        class="chevron"
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>

    <transition name="fade">
      <div v-if="isOpen" class="dropdown-menu">
        <button
          v-for="option in options"
          :key="option.value"
          class="dropdown-item"
          :class="{ selected: modelValue === option.value }"
          @click="select(option.value)"
        >
          {{ option.label }}
          <svg
            v-if="modelValue === option.value"
            class="check"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Option {
  label: string
  value: string | number
}

const props = defineProps<{
  modelValue: string | number
  options: Option[]
  label?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const isOpen = ref(false)

const selectedLabel = computed(() => {
  const opt = props.options.find((o) => o.value === props.modelValue)
  return opt ? opt.label : props.modelValue
})

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

function select(value: string | number) {
  emit('update:modelValue', value)
  close()
}

// Simple directive for click outside
const vClickOutside = {
  mounted(el: any, binding: any) {
    el.clickOutsideEvent = (event: Event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.body.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el: any) {
    document.body.removeEventListener('click', el.clickOutsideEvent)
  },
}
</script>

<style scoped>
.sort-dropdown {
  position: relative;
  display: inline-block;
}

.trigger-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.trigger-btn:hover,
.trigger-btn.active {
  border-color: var(--color-primary);
  background: var(--color-surface-hover);
}

.label {
  color: var(--color-text-tertiary);
  font-weight: 500;
}

.value {
  font-weight: 600;
}

.chevron {
  color: var(--color-text-tertiary);
  transition: transform 0.2s;
}

.trigger-btn.active .chevron {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  min-width: 180px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 0.25rem;
  z-index: 50;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5rem 0.75rem;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.1s;
}

.dropdown-item:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.dropdown-item.selected {
  background: var(--color-primary-subtle);
  color: var(--color-primary);
  font-weight: 500;
}

.check {
  color: var(--color-primary);
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
