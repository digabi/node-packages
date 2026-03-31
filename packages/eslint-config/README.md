# eslint-config

Shared ESLint config for the digabi project. Requires ESLint 9+ and uses the flat config format.

# How to add to a new project?

Add the required dependencies:

    $ npm install --save-dev @digabi/eslint-config eslint eslint-plugin-import-x eslint-plugin-prettier eslint-plugin-promise globals typescript-eslint

If you're using React, add

    $ npm install --save-dev eslint-plugin-react eslint-plugin-react-hooks

If you're using Mocha, add

    $ npm install --save-dev eslint-plugin-mocha mocha

If you're using Jest, add

    $ npm install --save-dev eslint-plugin-jest jest

Create an `eslint.config.mjs` in the project root:

```js
import digabiConfig from '@digabi/eslint-config'

export default [
  ...digabiConfig(),
]
```

The config auto-detects installed optional plugins (React, Mocha, Jest) and enables their rules automatically.
