# typescript-config

Shared Typescript config for the digabi project.

# How to add to a new project?

Add the required dependencies:

    $ npm install --save-dev @digabi/typescript-config

Add `tsconfig.json` to root folder

```json
{
  "extends": "@digabi/typescript-config/root/tsconfig.json"
}
```

Add `tsconfig.json` to `server` folder

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "../dist"
  }
}
```

If you're have frontend, add `tsconfig.json` to `public/js` folder

```json
{
  "extends": "@digabi/typescript-config/public/tsconfig.json"
}
```

Finally, modify `.eslintrc.json` in the project root. `./public/js/tsconfig.json` is optional.

```json
{
  "extends": "@digabi/eslint-config",
  "parserOptions": {
    "project": ["./public/js/tsconfig.json", "./tsconfig.json"]
  }
}
```
