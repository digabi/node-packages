const { ESLint } = require('eslint')

function normalizeConfig(resolved) {
  return {
    ...resolved,
    parser: resolved.parser
      ? resolved.parser.replace(/^.*node_modules\//, '<node_modules>/')
      : resolved.parser,
  }
}

async function getResolvedConfig(baseConfig, filePath) {
  const eslint = new ESLint({ baseConfig, useEslintrc: false })
  const resolved = await eslint.calculateConfigForFile(filePath)
  return normalizeConfig(resolved)
}

module.exports = { getResolvedConfig }
