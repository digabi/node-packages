# Digabi Node Packages

This repository contains utility packages for Digabi codebase.

### Package guidelines

- Typescript only
- Good unit test coverage
- If a devDependency is needed in all packages, add it to the root level package.json. Otherwise it should go in the packages own package.json
- Zero dependency should be the goal. Only add dependencies if absolutely necessary.

### Package structure

- `__tests__` contains unit tests for package. Each package should have unit tests that cover the usage.
- `src` contains actual code

### Creating a new package

1. Copy existing package as a template and modify relevant parts.
2. Add entry to `.github/workflows/publish.yml`.

### Publishing

Publishing should be done only via github actions by triggering the `Publish new version` workflow.

1. Go to https://github.com/digabi/node-packages/actions/workflows/publish.yml and choose `Run workflow`.
2. Workflow should always be run from `main` branch!
3. Select package to update
4. Select what kind of version bump would you like to do. If doing a `pre` type release, the version will be
   tagged as `alpha`. If normal release then it will be tagged as `latest`.

### Make package public

Add this to `package.json`. Note that by default packages are private.

```
  "publishConfig": {
    "access": "restricted"
  }
```
