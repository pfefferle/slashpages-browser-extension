import stylistic from '@stylistic/eslint-plugin'

export default [
  {
    files: ['**/*.js'],
    plugins: { '@stylistic': stylistic },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { document: 'readonly', window: 'readonly', fetch: 'readonly', URL: 'readonly', globalThis: 'readonly', AbortSignal: 'readonly' }
    },
    rules: {
      '@stylistic/indent': ['error', 2],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/semi': ['error', 'never'],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-undef': 'error'
    }
  },
  { ignores: ['dist/**', 'node_modules/**'] }
]
