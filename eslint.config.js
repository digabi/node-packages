import digabi from '@digabi/eslint-config'

export default [
  ...[digabi].flat(),
  {
    ignores: ['**/dist/', '**/node_modules/']
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off'
    }
  }
]
