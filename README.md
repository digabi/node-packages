# Digabi Node Packages

This repository contains utility packages for Digabi codebase.

### Package guidelines

- Typescript only
- Good unit test coverage
- If a devDependency is needed in all packages, add it to the root level package.json. Otherwise it should go in the packages own package.json
- Let’s keep dependencies to a minimum and only add them when they’re truly needed. Try to avoid pulling in a large library just for a single function.

#### Naming convention

No strict naming conventions. Package name should reflect the context and functionality. Feel free to add `-utils` ending if you feel like the package
is only an extension/helper and it could be confusing to name it only based on the context.

### Package structure

- `__tests__` contains unit tests for package. Each package should have unit tests that cover the usage.
- `src` contains actual code

### Creating a new package

1. Copy an existing package under `packages/` as a template and modify relevant parts.
   - Try `crypto-utils` or `2fa` as pretty minimal examples.
2. Add an entry for your package to `.github/workflows/publish.yml`.
3. Run `just new-package foobar` where `foobar` is the package's name.
   - The prefix `@digabi/` will be added automatically.
4. Sign into npmjs.com and navigate to the new package's settings.
5. Setup "Trusted publisher".
   - Set "publishing access" to "require two-factor authentication and disallow tokens".
6. Ensure connection works by creating a new version with `publish.yml`.

### Updating a package

Publishing should be done only via github actions by triggering the `Publish new version` workflow.

1. Go to https://github.com/digabi/node-packages/actions/workflows/publish.yml and choose `Run workflow`.
2. If you want to create a pre release from a feature branch, select that as the branch to run workflow from.
3. Select package to update
4. Select what kind of version bump would you like to do. If doing a `pre` type release, the version will be
   tagged with the branch name for example `feature-add-sort-function`. If normal release then it will be tagged as `latest`.
