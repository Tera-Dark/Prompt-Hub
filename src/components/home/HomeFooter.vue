<template>
  <footer class="home-footer">
    <div class="container">
      <p class="copyright">© {{ new Date().getFullYear() }} {{ t('app.name') }}</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.home-footer {
  padding: 2rem 0;
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.copyright {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}
</style>
