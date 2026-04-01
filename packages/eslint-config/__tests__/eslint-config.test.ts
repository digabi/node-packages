import { describe, test } from 'node:test'
import { ESLint } from 'eslint'
import digabiConfig from '../src/index.mjs'

function sortKeysDeep(obj: unknown, seen = new WeakSet()): unknown {
  if (Array.isArray(obj)) return obj.map(item => sortKeysDeep(item, seen))
  if (obj !== null && typeof obj === 'object') {
    if (seen.has(obj)) return '[Circular]'
    seen.add(obj)
    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((sorted, key) => {
        sorted[key] = sortKeysDeep((obj as Record<string, unknown>)[key], seen)
        return sorted
      }, {})
  }
  return obj
}

function normalizeConfig(resolved: Record<string, unknown>) {
  return sortKeysDeep(resolved)
}

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
      t.assert.snapshot(normalizeConfig(resolved.rules as unknown as Record<string, unknown>))
    })
  }
})
