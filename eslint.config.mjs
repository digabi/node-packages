import digabiConfig from '@digabi/eslint-config'

export default [
  {
    ignores: ['**/*.snapshot']
  },
  ...digabiConfig(),
  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off'
    }
  }
]
