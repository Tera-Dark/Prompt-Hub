<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="['icon', `icon-${name}`]"
  >
    <path
      v-if="name === 'sparkles'"
      d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
    />
    <path v-else-if="name === 'compass'" d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8" />
    <circle v-if="name === 'compass'" cx="10" cy="10" r="7" />
    <path v-if="name === 'compass'" d="m14.2 5.8-4.4 8.4-4.4-8.4 8.4 4.4Z" />
    <!-- Alternative compass path -->

    <template v-if="name === 'compass-simple'">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </template>

    <path v-if="name === 'plus'" d="M5 12h14" />
    <path v-if="name === 'plus'" d="M12 5v14" />

    <path v-if="name === 'search'" d="m21 21-4.3-4.3" />
    <circle v-if="name === 'search'" cx="11" cy="11" r="8" />

    <path
      v-if="name === 'layout-dashboard'"
      d="M7 9a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-1Z"
    />
    <path
      v-if="name === 'layout-dashboard'"
      d="M14 9a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-1Z"
    />
    <path
      v-if="name === 'layout-dashboard'"
      d="M7 16a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-1Z"
    />
    <path
      v-if="name === 'layout-dashboard'"
      d="M14 16a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-1Z"
    />

    <path v-if="name === 'log-in'" d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline v-if="name === 'log-in'" points="10 17 15 12 10 7" />
    <line v-if="name === 'log-in'" x1="15" x2="3" y1="12" y2="12" />

    <path v-if="name === 'zap'" d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />

    <path v-if="name === 'x'" d="M18 6 6 18" />
    <path v-if="name === 'x'" d="m6 6 12 12" />

    <path v-if="name === 'eye'" d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle v-if="name === 'eye'" cx="12" cy="12" r="3" />

    <path
      v-if="name === 'heart'"
      d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
    />

    <rect v-if="name === 'copy'" width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path v-if="name === 'copy'" d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />

    <path
      v-if="name === 'external-link'"
      d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
    />
    <polyline v-if="name === 'external-link'" points="15 3 21 3 21 9" />
    <line v-if="name === 'external-link'" x1="10" x2="21" y1="14" y2="3" />

    <path v-if="name === 'bookmark'" d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </svg>
</template>

<script setup lang="ts">
defineProps({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: [Number, String],
    default: 20,
  },
  strokeWidth: {
    type: [Number, String],
    default: 2,
  },
})
</script>
