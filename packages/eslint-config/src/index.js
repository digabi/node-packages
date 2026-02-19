import { fileURLToPath } from 'node:url'
import path from 'node:path'

function hasDependency(mod) {
  try {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    import.meta.resolve(mod, `file://${__dirname}/`)
    return true
  } catch {
    return false
  }
}

const hasMocha = hasDependency('eslint-plugin-mocha')
const hasJest = hasDependency('eslint-plugin-jest')
const hasReact = hasDependency('eslint-plugin-react')
const hasReactHooks = hasDependency('eslint-plugin-react-hooks')

import pluginImport from 'eslint-plugin-import'
import pluginPromise from 'eslint-plugin-promise'
import pluginPrettier from 'eslint-plugin-prettier'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'

const pluginMocha = hasMocha
  ? ((await import('eslint-plugin-mocha')).default ?? (await import('eslint-plugin-mocha')))
  : null
const pluginJest = hasJest
  ? ((await import('eslint-plugin-jest')).default ?? (await import('eslint-plugin-jest')))
  : null
const pluginReact = hasReact
  ? ((await import('eslint-plugin-react')).default ?? (await import('eslint-plugin-react')))
  : null
const pluginReactHooks = hasReactHooks
  ? ((await import('eslint-plugin-react-hooks')).default ?? (await import('eslint-plugin-react-hooks')))
  : null

const sharedRules = {
  'array-callback-return': 'error',
  'arrow-body-style': ['error', 'as-needed'],
  'prefer-object-spread': 'error',
  'no-duplicate-imports': ['error', { includeExports: true }],
  'one-var': ['error', 'never'],
  'prefer-arrow-callback': ['error'],
  'prefer-destructuring': ['error', { array: false }],
  'prefer-template': ['error'],
  'require-await': 'error',

  'import/default': 'off',
  'import/named': 'off',
  'import/namespace': 'off',
  'import/no-unresolved': 'off',
  'import/no-commonjs': ['warn'],

  'promise/avoid-new': 'off',
  'promise/catch-or-return': ['error', { allowFinally: true }],
  'promise/no-callback-in-promise': 'off',
  'promise/no-nesting': 'off',
  'promise/prefer-await-to-then': ['warn'],

  'prettier/prettier': 'error',

  'no-restricted-imports': [
    'warn',
    { name: 'bluebird', message: 'Please use native promises instead.' },
    { name: 'ramda', message: 'Please use lodash or native javascript instead.' },
    { name: 'partial.lenses', message: 'Please use lodash or native javascript instead.' },
    { name: 'moment', message: 'Please use native Date() and date-fns instead.' }
  ],

  ...(hasMocha && {
    'mocha/no-mocha-arrows': 'off',
    'mocha/no-setup-in-describe': 'off',
    'mocha/no-sibling-hooks': 'off',
    'mocha/no-hooks-for-single-case': 'off',
    'mocha/no-exclusive-tests': ['error']
  }),
  ...(hasJest && {
    'jest/expect-expect': ['error', { assertFunctionNames: ['expect*'] }]
  }),
  ...(hasReact && {
    'react/prop-types': 'off'
  }),
  ...(hasReactHooks && {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  })
}

const sharedPlugins = {
  import: pluginImport,
  promise: pluginPromise,
  prettier: pluginPrettier,
  ...(hasMocha && { mocha: pluginMocha }),
  ...(hasJest && { jest: pluginJest }),
  ...(hasReact && { react: pluginReact }),
  ...(hasReactHooks && { 'react-hooks': pluginReactHooks })
}

export default [
  {
    name: 'shared',
    plugins: sharedPlugins,
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        // Minimal globals; environments added via "linterOptions"
      }
    },
    linterOptions: {
      noInlineConfig: false,
      reportUnusedDisableDirectives: true
    },
    settings: {
      ...(hasReact && { react: { version: 'detect' } })
    },
    rules: sharedRules
  },

  {
    name: 'javascript',
    files: ['**/*.{js,cjs,mjs}'],
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },

  {
    name: 'typescript',
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: process.cwd(),
        ecmaVersion: 2023,
        sourceType: 'module'
      }
    },
    plugins: {
      ...sharedPlugins,
      '@typescript-eslint': tsPlugin
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/unbound-method': 'off'
    }
  }
]
