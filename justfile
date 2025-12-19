[private]
@default:
    just --list

# Ensure you have a `publish` token saved on your machine.
[private]
@ensure-npm-login:
    npm whoami || npm login

# Create a new package from template
create-package package:
    #!/usr/bin/env bash
    set -euo pipefail
    
    # Remove @digabi/ prefix if present
    PACKAGE_NAME="{{ if package =~ "^@digabi/" { replace(package, "@digabi/", "") } else { package } }}"
    PACKAGE_DIR="packages/${PACKAGE_NAME}"
    FULL_PACKAGE_NAME="@digabi/${PACKAGE_NAME}"
    WORKFLOW_FILE=".github/workflows/publish.yml"
    
    # Check if package already exists
    if [ -d "${PACKAGE_DIR}" ]; then
        echo "Error: Package '${PACKAGE_NAME}' already exists at ${PACKAGE_DIR}"
        exit 1
    fi
    
    # Check if yq is installed
    if ! command -v yq &> /dev/null; then
        echo "Error: yq is not installed. Please install it with: brew install yq"
        exit 1
    fi
    
    echo "Creating new package: ${FULL_PACKAGE_NAME}"
    
    # Copy template
    cp -r .template "${PACKAGE_DIR}"
    
    # Replace placeholders in all files
    find "${PACKAGE_DIR}" -type f -exec sed -i '' "s/__PACKAGE_NAME__/${PACKAGE_NAME}/g" {} +
    
    # Rename test file
    mv "${PACKAGE_DIR}/__tests__/__PACKAGE_NAME__.test.ts" "${PACKAGE_DIR}/__tests__/${PACKAGE_NAME}.test.ts"
    
    echo "✓ Package structure created at ${PACKAGE_DIR}"
    
    # Add package to publish workflow
    echo "Adding ${FULL_PACKAGE_NAME} to publish workflow..."
    yq eval -i ".on.workflow_dispatch.inputs.package.options += [\"${FULL_PACKAGE_NAME}\"]" "${WORKFLOW_FILE}"
    yq eval -i ".on.workflow_dispatch.inputs.package.options |= sort" "${WORKFLOW_FILE}"
    
    echo "✓ Added to ${WORKFLOW_FILE}"
    echo ""
    echo "Next steps:"
    echo "1. Update ${PACKAGE_DIR}/package.json with proper description"
    echo "2. Implement your code in ${PACKAGE_DIR}/src/"
    echo "3. Run: just publish-initial ${PACKAGE_NAME}"
    echo ""

# Publish initial version of a new package to npm
publish-initial package: (ensure-npm-login)
    #!/usr/bin/env bash
    set -euo pipefail
    
    PACKAGE_NAME="{{ if package =~ "^@digabi/" { package } else { "@digabi/" + package } }}"
    
    echo "Publishing initial version of ${PACKAGE_NAME}..."
    npm publish --workspace="${PACKAGE_NAME}" \
    || echo "\nPublish failed! Maybe your token isn't a Publish token? Run 'npm logout' and try again."
    
    echo ""
    echo "Next steps:"
    echo "1. Sign into npmjs.com and navigate to the package settings"
    echo "2. Setup 'Trusted publisher' for GitHub Actions"
    echo "3. Set 'publishing access' to 'require two-factor authentication and disallow tokens'"
    echo "4. Test the workflow by creating a new version with publish.yml from github actions UI"
    echo ""
