# eslint-config

Shared ESLint config for the digabi project.

# How to add to a new project?

Add the required dependencies:

    $ npm install --save-dev @digabi/eslint-config @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-config-prettier eslint-plugin-import eslint-plugin-prettier

If you're using React, add

    $ npm install --save-dev eslint-plugin-react
    $ npm install --save-dev eslint-plugin-react-hooks

If you're using Mocha, add

    $ npm install --save-dev eslint-plugin-mocha

If you're using Jest, add

    $ npm install --save-dev eslint-plugin-jest

Finally, add or modify `.eslintrc.json` in the project root.

```json
{
  "extends": "@digabi/eslint-config"
}
```
