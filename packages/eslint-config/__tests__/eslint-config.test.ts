import { describe, test } from 'node:test'
import { ESLint } from 'eslint'
import digabiConfig from '../src/index.mjs'

function createESLint(cwd?: string) {
  return new ESLint({
    overrideConfigFile: true,
    overrideConfig: digabiConfig(),
    cwd: cwd ?? process.cwd()
  })
}

const FILE_TYPES = ['test.js', 'test.ts', 'test.tsx', 'test.spec.ts']

describe('eslint-config (all plugins enabled)', () => {
  for (const fileType of FILE_TYPES) {
    test(`resolved config for ${fileType}`, async t => {
      const eslint = createESLint()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const resolved: { rules: any } = await eslint.calculateConfigForFile(fileType)
      t.assert.snapshot(resolved.rules)
    })
  }
})
