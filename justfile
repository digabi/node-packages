[private]
@default:
    just --list

# Ensure you have a `publish` token saved on your machine.
[private]
@ensure-npm-login:
    npm whoami || npm login
    
# Publish a new package named `package` under `@digabi`.
new-package package: (ensure-npm-login)
    npm publish --workspace="{{ if package =~ "^@digabi/" { package } else { "@digabi/" + package } }}" \
    || echo "\nPublish failed! Maybe your token isn't a Publish token? Run `npm logout` and try again."
