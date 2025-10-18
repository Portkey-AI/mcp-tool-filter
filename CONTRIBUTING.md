# Contributing to MCP Tool Filter

Thank you for your interest in contributing to MCP Tool Filter! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/mcp-tool-filter.git
   cd mcp-tool-filter
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Run tests**
   ```bash
   npm test
   ```

## Development Workflow

### Making Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clear, maintainable code
   - Follow existing code style
   - Add tests for new features
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run build
   npm test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add feature description"
   ```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `test:` Test changes
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `chore:` Build process or auxiliary tool changes

Examples:
```
feat: add support for custom embedding dimensions
fix: correct similarity calculation for edge cases
docs: update API reference with new options
test: add tests for context caching
```

### Pull Request Process

1. **Update documentation** if you've changed APIs or added features
2. **Ensure all tests pass** with `npm test`
3. **Update CHANGELOG.md** with your changes under `[Unreleased]`
4. **Submit a pull request** with:
   - Clear title and description
   - Reference any related issues
   - Screenshots/examples if applicable

## Code Style

- Use TypeScript with strict mode
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Keep functions focused and testable
- Use descriptive variable names

## Testing

- Write tests for new features
- Maintain or improve code coverage
- Test edge cases and error conditions
- Run `npm test` before committing

## Project Structure

```
src/
├── index.ts              # Main exports
├── types.ts              # TypeScript types
├── MCPToolFilter.ts      # Core filtering logic
├── embedding.ts          # Embedding providers
├── utils.ts              # Utility functions
└── MCPToolFilter.test.ts # Tests
```

## Adding New Features

When adding new features:

1. **Discuss first** - Open an issue to discuss major changes
2. **Maintain performance** - Ensure <50ms filtering latency
3. **Update docs** - Add examples and API documentation
4. **Add tests** - Comprehensive test coverage
5. **Consider backward compatibility** - Avoid breaking changes

## Documentation

Update relevant documentation:
- `README.md` - User-facing features and API changes
- `docs/ARCHITECTURE.md` - Architectural changes
- `docs/TRADEOFFS.md` - Performance or design tradeoffs
- Inline code comments - Complex logic
- Examples - New feature demonstrations

## Release Process

Maintainers will handle releases:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag
4. Publish to npm

## Questions?

- Open an issue for bugs or feature requests
- Reach out via email at support@portkey.ai
- Check existing documentation in the `docs/` directory

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

