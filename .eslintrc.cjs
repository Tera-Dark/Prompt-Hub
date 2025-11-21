module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint', 'vue'],
  extends: ['plugin:vue/vue3-recommended', 'plugin:@typescript-eslint/recommended', 'eslint:recommended', 'prettier'],
  rules: {},
}
