const { getResolvedConfig } = require('./helpers')

const config = require('../src/index.js')

const FILE_TYPES = ['test.js', 'test.ts', 'test.tsx']

describe('eslint-config (all plugins disabled)', () => {
  test.each(FILE_TYPES)('resolved config for %s', async (fileType) => {
    const resolved = await getResolvedConfig(config, fileType)
    expect(resolved).toMatchSnapshot()
  })
})
