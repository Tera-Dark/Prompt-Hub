import { createI18n } from 'vue-i18n'
import en from './locales/en'
import zh from './locales/zh'

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: localStorage.getItem('prompt-hub::pref::lang') || 'zh', // Default to Chinese or saved preference
  fallbackLocale: 'en',
  messages: {
    en,
    zh,
  },
})

export default i18n
