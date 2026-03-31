import digabiConfig from '@digabi/eslint-config'

export default [
  ...digabiConfig(),
  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off'
    }
  }
]
