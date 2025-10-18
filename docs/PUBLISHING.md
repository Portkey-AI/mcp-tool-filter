# Publishing to NPM - Checklist

## Pre-Publish Checklist

Before publishing to npm, verify the following:

### 1. Package Configuration ✅
- [x] `package.json` has correct name, version, description
- [x] `files` field specifies what to include
- [x] `main` and `types` point to correct entry points
- [x] Repository, bugs, and homepage URLs are correct
- [x] Keywords are comprehensive and relevant
- [x] License is specified (MIT)
- [x] Engines requirement set (>=18.0.0)

### 2. Documentation ✅
- [x] README.md is comprehensive with examples
- [x] LICENSE file exists
- [x] CHANGELOG.md tracks version history
- [x] CONTRIBUTING.md guides contributors
- [x] Supplementary docs organized in `docs/` folder

### 3. Build & Test ✅
```bash
# Build the package
npm run build

# Run tests
npm test

# Check what will be published
npm pack --dry-run
```

### 4. Version Management

Update version in `package.json` following [Semantic Versioning](https://semver.org/):
- **Patch** (0.1.X): Bug fixes, documentation updates
- **Minor** (0.X.0): New features, non-breaking changes
- **Major** (X.0.0): Breaking API changes

```bash
# Bump version
npm version patch  # or minor, or major
```

### 5. Test Installation Locally

Before publishing, test the package locally:

```bash
# Pack the package
npm pack

# In another directory, test install
mkdir test-install && cd test-install
npm install ../mcp-tool-filter/portkey-ai-mcp-tool-filter-0.1.0.tgz

# Verify it works
node -e "const MCPToolFilter = require('@portkey-ai/mcp-tool-filter'); console.log(MCPToolFilter);"
```

### 6. Publishing

#### First Time Setup
```bash
# Login to npm (one time)
npm login
```

#### Publishing
```bash
# For scoped packages (@portkey-ai), verify access
npm access public @portkey-ai/mcp-tool-filter

# Publish
npm publish --access public

# Or for beta/alpha releases
npm publish --tag beta
```

### 7. Post-Publish

- [x] Verify package on npmjs.com
- [x] Test installation: `npm install @portkey-ai/mcp-tool-filter`
- [x] Create GitHub release with changelog
- [x] Tag the release: `git tag v0.1.0 && git push --tags`
- [x] Announce on relevant channels

## Maintenance

### Updating the Package

1. Make changes
2. Update CHANGELOG.md
3. Bump version: `npm version patch/minor/major`
4. Build and test: `npm run build && npm test`
5. Publish: `npm publish`
6. Push to GitHub: `git push && git push --tags`

### Deprecating Versions

If a version has critical bugs:
```bash
npm deprecate @portkey-ai/mcp-tool-filter@0.1.0 "Critical bug, use 0.1.1+"
```

### Unpublishing (USE WITH CAUTION)

Only within 72 hours:
```bash
npm unpublish @portkey-ai/mcp-tool-filter@0.1.0
```

## Package Size

Current package size: ~55KB (dist folder + docs)

Monitor size with:
```bash
npm pack --dry-run
```

## CI/CD Recommendations

Consider setting up GitHub Actions for:
- Automated testing on PR
- Automated publishing on tag/release
- Dependency updates
- Security scanning

## Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [npm Scripts](https://docs.npmjs.com/cli/v8/using-npm/scripts)

