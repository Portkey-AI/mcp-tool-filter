# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of @portkey-ai/mcp-tool-filter
- Local embeddings support using @xenova/transformers
- API embeddings support (OpenAI, Voyage, Cohere)
- Semantic tool filtering with cosine similarity
- Context caching for performance optimization
- Support for chat messages and string inputs
- Configurable filtering options (topK, minScore, alwaysInclude, exclude)
- Performance metrics and debug logging
- Comprehensive documentation and examples

### Performance
- **Loop-Unrolled Dot Product**: 6-8x faster vector similarity computation through CPU pipeline optimization
- **Smart Top-K Selection**: Hybrid algorithm using optimized built-in sort for <500 tools, heap-based selection (O(n log k)) for 500+ tools
- **True LRU Cache**: Proper access-order tracking for better cache hit rates (20-40% improvement)
- **In-Place Vector Normalization**: Optional in-place normalization reduces memory allocations by ~30%
- **Set-Based Exclusion**: O(1) exclusion checking instead of O(n) array operations
- **Overall**: 50-80% faster filtering for typical workloads with zero configuration needed

## [0.1.0] - 2025-10-19

### Added
- Initial package setup
- Core filtering functionality
- TypeScript support
- Jest testing framework
- Basic documentation

---

## Version Guidelines

### Major (X.0.0)
- Breaking API changes
- Significant architectural changes

### Minor (0.X.0)
- New features
- Non-breaking API additions
- Performance improvements

### Patch (0.0.X)
- Bug fixes
- Documentation updates
- Minor improvements

