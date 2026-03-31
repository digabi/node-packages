import { createRequire } from 'node:module'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import importX from 'eslint-plugin-import-x'
import promise from 'eslint-plugin-promise'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import globals from 'globals'

const require = createRequire(import.meta.url)

const TS_FILES = ['**/*.ts', '**/*.tsx']
const TEST_FILES = ['**/*.test.*', '**/*.spec.*']

function hasDependency(mod) {
  try {
    require.resolve(mod)

    return true
  } catch {
    return false
  }
}

export default function digabiConfig() {
  const hasMocha = hasDependency('eslint-plugin-mocha') && hasDependency('mocha')
  const hasJest = hasDependency('eslint-plugin-jest') && hasDependency('jest')
  const hasReact = hasDependency('eslint-plugin-react') && hasDependency('react')
  const hasReactHooks = hasReact && hasDependency('eslint-plugin-react-hooks')

  const configs = []

  configs.push(js.configs.recommended)
  configs.push({ ignores: ['**/dist/'] })

  configs.push({
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
        ...(hasMocha ? globals.mocha : {})
      }
    }
  })

  configs.push(importX.flatConfigs.recommended)
  configs.push(promise.configs['flat/recommended'])

  if (hasMocha) {
    const mocha = require('eslint-plugin-mocha')

    if (mocha.configs?.flat?.recommended) {
      configs.push(mocha.configs.flat.recommended)
    }

    configs.push({
      rules: {
        'mocha/no-mocha-arrows': 'off',
        'mocha/no-setup-in-describe': 'off',
        'mocha/no-sibling-hooks': 'off',
        'mocha/no-hooks-for-single-case': 'off',
        'mocha/no-exclusive-tests': 'error'
      }
    })
  }

  if (hasJest) {
    const jest = require('eslint-plugin-jest')

    configs.push({
      ...jest.configs['flat/recommended'],
      files: TEST_FILES
    })
    configs.push({
      ...jest.configs['flat/style'],
      files: TEST_FILES
    })
    configs.push({
      files: TEST_FILES,
      rules: {
        'jest/expect-expect': ['error', { assertFunctionNames: ['expect*'] }]
      }
    })
  }

  if (hasReact) {
    const react = require('eslint-plugin-react')

    if (react.configs?.flat?.recommended) {
      configs.push(react.configs.flat.recommended)
    }

    configs.push({
      settings: { react: { version: 'detect' } },
      rules: {
        'react/prop-types': 'off'
      }
    })
  }

  if (hasReactHooks) {
    const reactHooks = require('eslint-plugin-react-hooks')

    if (reactHooks.configs?.flat?.recommended) {
      configs.push(reactHooks.configs.flat.recommended)
    }
  }

  configs.push(
    ...tseslint.configs.recommendedTypeChecked.map(c => ({
      ...c,
      files: TS_FILES
    }))
  )

  configs.push({
    files: TS_FILES,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true
      }
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/unbound-method': 'off'
    }
  })

  // Prettier must be near the end to override conflicting rules
  configs.push(eslintPluginPrettierRecommended)

  configs.push({
    rules: {
      'array-callback-return': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-object-spread': 'error',
      'no-duplicate-imports': ['error', { includeExports: true }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-restricted-imports': [
        'warn',
        {
          name: 'bluebird',
          message: 'Please use native promises instead.'
        },
        {
          name: 'ramda',
          message: 'Please use lodash or native javascript instead.'
        },
        {
          name: 'partial.lenses',
          message: 'Please use lodash or native javascript instead.'
        },
        {
          name: 'moment',
          message: 'Please use native Date() and date-fns instead.'
        }
      ],
      'import-x/default': 'off',
      'import-x/named': 'off',
      'import-x/namespace': 'off',
      'import-x/no-unresolved': 'off',
      'import-x/no-named-as-default': 'off',
      'import-x/no-named-as-default-member': 'off',
      'import-x/no-commonjs': 'warn',
      'one-var': ['error', 'never'],
      'prefer-arrow-callback': 'error',
      'prefer-destructuring': ['error', { array: false }],
      'prefer-template': 'error',
      'promise/avoid-new': 'off',
      'promise/catch-or-return': ['error', { allowFinally: true }],
      'promise/no-callback-in-promise': 'off',
      'promise/no-nesting': 'off',
      'promise/prefer-await-to-then': 'warn',
      'require-await': 'error'
    }
  })

  // Must come after custom rules to take precedence for TS files
  configs.push({
    files: TS_FILES,
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'require-await': 'off'
    }
  })

  return configs
}
