import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { ESLint } from 'eslint'
import path from 'node:path'
import digabiConfig from '../src/index.mjs'

const FIXTURES_DIR = path.resolve(import.meta.dirname, 'fixtures')

function createESLint(cwd?: string) {
  return new ESLint({
    overrideConfigFile: true,
    overrideConfig: digabiConfig(),
    cwd: cwd ?? process.cwd()
  })
}

function getRuleIds(results: ESLint.LintResult[]) {
  return results.flatMap(r => r.messages.map(m => m.ruleId)).filter(Boolean) as string[]
}

function getMessages(results: ESLint.LintResult[]) {
  return results.flatMap(r =>
    r.messages
      .filter(m => m.ruleId !== 'prettier/prettier')
      .map(m => ({
        ruleId: m.ruleId,
        severity: m.severity
      }))
  )
}

describe('digabiConfig() structure', () => {
  test('returns a non-empty array', () => {
    const config = digabiConfig()
    assert.ok(Array.isArray(config))
    assert.ok(config.length > 0)
  })
})

describe('JS rule assertions', () => {
  const eslint = createESLint()

  async function expectRule(code: string, ruleId: string, severity: 1 | 2) {
    const results = await eslint.lintText(code, { filePath: 'test.js' })
    const msgs = getMessages(results)
    const match = msgs.find(m => m.ruleId === ruleId)
    assert.ok(match, `Expected rule '${ruleId}' to fire. Got: ${JSON.stringify(msgs)}`)
    assert.equal(match.severity, severity, `Expected severity ${severity} for '${ruleId}'`)
  }

  test('arrow-body-style', async () => {
    await expectRule('export const f = () => { return 1 }\n', 'arrow-body-style', 2)
  })

  test('prefer-template', async () => {
    await expectRule('const a = "hello"\nconst b = a + " " + "world"\nexport { b }\n', 'prefer-template', 2)
  })

  test('one-var', async () => {
    await expectRule('let a, b\nexport { a, b }\n', 'one-var', 2)
  })

  test('prefer-object-spread', async () => {
    await expectRule('const a = { x: 1 }\nconst b = Object.assign({}, a)\nexport { b }\n', 'prefer-object-spread', 2)
  })

  test('no-restricted-imports — bluebird', async () => {
    await expectRule('import "bluebird"\n', 'no-restricted-imports', 1)
  })

  test('import-x/no-commonjs', async () => {
    await expectRule('const fs = require("fs")\nexport { fs }\n', 'import-x/no-commonjs', 1)
  })

  test('require-await', async () => {
    await expectRule('export async function f() { return 1 }\n', 'require-await', 2)
  })

  test('no-unused-vars', async () => {
    await expectRule('const unused = 1\n', 'no-unused-vars', 2)
  })

  test('prefer-arrow-callback', async () => {
    await expectRule('const arr = [1]\narr.map(function(x) { return x })\n', 'prefer-arrow-callback', 2)
  })

  test('array-callback-return', async () => {
    await expectRule('const arr = [1]\narr.map((x) => { x + 1 })\n', 'array-callback-return', 2)
  })
})

describe('TypeScript overrides', () => {
  const eslint = createESLint()

  test('no-unused-vars is off for .ts files', async () => {
    const results = await eslint.lintText('const unused = 1\nexport {}\n', {
      filePath: 'test.ts'
    })
    const rules = getRuleIds(results)
    assert.ok(!rules.includes('no-unused-vars'), 'no-unused-vars should be off for TS')
    assert.ok(
      !rules.includes('@typescript-eslint/no-unused-vars'),
      '@typescript-eslint/no-unused-vars should be off for TS'
    )
  })

  test('require-await is off for .ts files', async () => {
    const results = await eslint.lintText('export async function f() { return 1 }\n', { filePath: 'test.ts' })
    const rules = getRuleIds(results)
    assert.ok(!rules.includes('require-await'), 'require-await should be off for TS')
  })
})

describe('TypeScript type-checked rules', () => {
  const eslint = createESLint(FIXTURES_DIR)
  let results: ESLint.LintResult[]

  test('type-checked config loads without fatal errors on .ts fixture', async () => {
    results = await eslint.lintFiles(['sample.ts'])
    const fatal = results.flatMap(r => r.messages.filter(m => m.fatal))
    assert.equal(fatal.length, 0, `Fatal errors: ${JSON.stringify(fatal)}`)
  })

  test('fixture triggers expected violations', () => {
    const ruleIds = getMessages(results).map(m => m.ruleId)

    assert.ok(ruleIds.includes('no-restricted-imports'), 'should warn on bluebird import')
    assert.ok(ruleIds.includes('one-var'), 'should error on one-var')
    assert.ok(ruleIds.includes('prefer-template'), 'should error on string concat')
    assert.ok(ruleIds.includes('arrow-body-style'), 'should error on arrow body style')
  })
})

describe('clean code', () => {
  test('well-written JS produces no errors', async () => {
    const eslint = createESLint()
    const code = 'const arr = [1, 2, 3]\nconst doubled = arr.map((x) => x * 2)\nconsole.log(doubled)\n'
    const results = await eslint.lintText(code, { filePath: 'clean.js' })
    const errors = getMessages(results).filter(m => m.severity === 2)
    assert.equal(errors.length, 0, `Unexpected errors: ${JSON.stringify(errors)}`)
  })
})
