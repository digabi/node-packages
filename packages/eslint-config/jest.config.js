const OPTIONAL_PLUGINS = [
  'eslint-plugin-mocha',
  'eslint-plugin-jest',
  'eslint-plugin-react',
  'eslint-plugin-react-hooks',
]

const disabledMapper = Object.fromEntries(
  OPTIONAL_PLUGINS.map((plugin) => [`^${plugin}$`, '<rootDir>/__tests__/nonexistent'])
)

module.exports = {
  projects: [
    {
      displayName: 'all-plugins-disabled',
      testMatch: ['<rootDir>/__tests__/config-disabled.test.js'],
      moduleNameMapper: disabledMapper,
    },
    {
      displayName: 'all-plugins-enabled',
      testMatch: ['<rootDir>/__tests__/config-enabled.test.js'],
    },
  ],
}
