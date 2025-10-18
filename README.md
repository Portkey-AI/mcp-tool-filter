# @portkey-ai/mcp-tool-filter

Ultra-fast semantic tool filtering for MCP (Model Context Protocol) servers using embedding similarity. Reduce your tool context from 1000+ tools down to the most relevant 10-20 tools in **under 10ms**.

## Features

- ⚡ **Lightning Fast**: <10ms filtering latency for 1000+ tools
- 🎯 **Semantic Understanding**: Uses embeddings for intelligent tool matching
- 📦 **Zero Dependencies on Runtime**: Only requires an embedding provider API
- 🔄 **Flexible Input**: Accepts chat completion messages or raw strings
- 💾 **Smart Caching**: Caches embeddings and context for optimal performance
- 🎛️ **Configurable**: Tune scoring thresholds, top-k, and always-include tools
- 📊 **Performance Metrics**: Built-in timing for optimization

## Installation

```bash
npm install @portkey-ai/mcp-tool-filter
```

## Quick Start

```typescript
import { MCPToolFilter } from '@portkey-ai/mcp-tool-filter';

// 1. Initialize the filter (choose embedding provider)

// Option A: Local Embeddings (RECOMMENDED for low latency < 5ms)
const filter = new MCPToolFilter({
  embedding: {
    provider: 'local',
  }
});

// Option B: API Embeddings (for highest accuracy)
const filter = new MCPToolFilter({
  embedding: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
  }
});

// 2. Load your MCP servers (one-time setup)
await filter.initialize(mcpServers);

// 3. Filter tools based on context
const result = await filter.filter(
  "Search my emails for the Q4 budget discussion"
);

// 4. Use the filtered tools in your LLM request
console.log(result.tools); // Top 20 most relevant tools
console.log(result.metrics.totalTime); // e.g., "2ms" for local, "500ms" for API
```

## Embedding Provider Options

### Local Embeddings (Recommended)

**Pros:**
- ⚡ Ultra-fast: 1-5ms latency
- 🔒 Private: No data sent to external APIs
- 💰 Free: No API costs
- 🌐 Offline: Works without internet

**Cons:**
- Slightly lower accuracy than API models
- First initialization downloads model (~25MB)

```typescript
const filter = new MCPToolFilter({
  embedding: {
    provider: 'local',
    model: 'Xenova/all-MiniLM-L6-v2', // Optional: default model
    quantized: true, // Optional: use quantized model for speed (default: true)
  }
});
```

**Available Models:**
- `Xenova/all-MiniLM-L6-v2` (default) - 384 dimensions, very fast
- `Xenova/all-MiniLM-L12-v2` - 384 dimensions, more accurate
- `Xenova/bge-small-en-v1.5` - 384 dimensions, good balance
- `Xenova/bge-base-en-v1.5` - 768 dimensions, higher quality

**Performance:**
- Initialization: 100ms-4s (one-time, downloads model)
- Filter request: 1-5ms
- Cached request: <1ms

### API Embeddings

For highest accuracy, use OpenAI or other API providers:

```typescript
const filter = new MCPToolFilter({
  embedding: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'text-embedding-3-small', // Optional
    dimensions: 384, // Optional: match local model for fair comparison
  }
});
```

**Pros:**
- 🎯 Highest accuracy: 5-15% better than local
- 🔄 Easy to switch models
- 🌐 No local resources needed

**Cons:**
- 🐌 Slow: 400-800ms per request
- 💰 Costs money: ~$0.02 per 1M tokens
- 🔒 Data sent to external API
- 📶 Requires internet connection

**Performance:**
- Initialization: 200ms-60s (depends on tool count)
- Filter request: 400-800ms
- Cached request: 1-3ms

### Quick Comparison

| Aspect | Local | API | Winner |
|--------|-------|-----|--------|
| **Speed** | 1-5ms | 400-800ms | 🏆 Local (200x faster) |
| **Accuracy** | Good (85-90%) | Best (100%) | 🏆 API |
| **Cost** | Free | ~$0.02/1M tokens | 🏆 Local |
| **Privacy** | Fully local | Data sent to API | 🏆 Local |
| **Offline** | ✅ Works offline | ❌ Needs internet | 🏆 Local |
| **Setup** | Zero config | Needs API key | 🏆 Local |

**📊 See [TRADEOFFS.md](./docs/TRADEOFFS.md) for detailed analysis**

## MCP Server JSON Format

The library expects an array of MCP servers with the following structure:

```json
[
  {
    "id": "gmail",
    "name": "Gmail MCP Server",
    "description": "Email management tools",
    "categories": ["email", "communication"],
    "tools": [
      {
        "name": "search_gmail_messages",
        "description": "Search and find email messages in Gmail inbox. Use when user wants to find, search, look up emails...",
        "keywords": ["email", "search", "inbox", "messages"],
        "category": "email-search",
        "inputSchema": {
          "type": "object",
          "properties": {
            "q": { "type": "string" }
          }
        }
      }
    ]
  }
]
```

### Field Descriptions

**Required Fields:**
- `id`: Unique identifier for the server
- `name`: Human-readable server name
- `tools`: Array of tool definitions
  - `name`: Unique tool name
  - `description`: Rich description of what the tool does and when to use it

**Optional but Recommended:**
- `description`: Server-level description
- `categories`: Array of category tags for hierarchical filtering
- `keywords`: Array of synonym/related terms for better matching
- `category`: Tool-level category
- `inputSchema`: JSON schema for parameters (parameter names are used for matching)

### Tips for Best Results

1. **Rich Descriptions**: Write detailed descriptions with use cases
   ```json
   "description": "Search emails in Gmail. Use when user wants to find, lookup, or retrieve messages, correspondence, or mail."
   ```

2. **Add Keywords**: Include synonyms and variations
   ```json
   "keywords": ["email", "mail", "inbox", "messages", "correspondence"]
   ```

3. **Mention Use Cases**: Explicitly state when to use the tool
   ```json
   "description": "... Use when user wants to draft, compose, write, or prepare an email to send later."
   ```

## API Reference

### `MCPToolFilter`

Main class for tool filtering.

#### Constructor

```typescript
new MCPToolFilter(config: MCPToolFilterConfig)
```

**Config Options:**
```typescript
{
  embedding: {
    // Local embeddings (recommended)
    provider: 'local',
    model?: string,               // Default: 'Xenova/all-MiniLM-L6-v2'
    quantized?: boolean,          // Default: true
    
    // OR API embeddings
    provider: 'openai' | 'voyage' | 'cohere',
    apiKey: string,
    model?: string,               // Default: 'text-embedding-3-small'
    dimensions?: number,          // Default: 1536 (or 384 for local)
    baseURL?: string,            // For custom endpoints
  },
  defaultOptions?: {
    topK?: number,              // Default: 20
    minScore?: number,          // Default: 0.3
    contextMessages?: number,   // Default: 3
    alwaysInclude?: string[],   // Always include these tools
    exclude?: string[],         // Never include these tools
    maxContextTokens?: number,  // Default: 500
  },
  debug?: boolean               // Enable debug logging
}
```

#### Methods

##### `initialize(servers: MCPServer[]): Promise<void>`

Initialize the filter with MCP servers. This precomputes and caches all tool embeddings.

**Note**: Call this once during startup. It's an async operation that may take a few seconds depending on the number of tools.

```typescript
await filter.initialize(servers);
```

##### `filter(input: FilterInput, options?: FilterOptions): Promise<FilterResult>`

Filter tools based on the input context.

**Input Types:**
```typescript
// String input
await filter.filter("Search my emails about the project");

// Chat messages
await filter.filter([
  { role: 'user', content: 'What meetings do I have today?' },
  { role: 'assistant', content: 'Let me check your calendar.' }
]);
```

**Options** (all optional, override defaults):
```typescript
{
  topK?: number,              // Max tools to return
  minScore?: number,          // Minimum similarity score (0-1)
  contextMessages?: number,   // How many recent messages to use
  alwaysInclude?: string[],   // Tool names to always include
  exclude?: string[],         // Tool names to exclude
  maxContextTokens?: number,  // Max context size
}
```

**Returns:**
```typescript
{
  tools: ScoredTool[],        // Filtered and ranked tools
  metrics: {
    totalTime: number,        // Total time in ms
    embeddingTime: number,    // Time to embed context
    similarityTime: number,   // Time to compute similarities
    toolsEvaluated: number,   // Total tools evaluated
  }
}
```

##### `getStats()`

Get statistics about the filter state.

```typescript
const stats = filter.getStats();
// {
//   initialized: true,
//   toolCount: 25,
//   cacheSize: 5,
//   embeddingDimensions: 1536
// }
```

##### `clearCache()`

Clear the context embedding cache.

```typescript
filter.clearCache();
```

## Performance Optimization

### Latency Breakdown

Typical performance for 1000 tools:

```
Building context:        <1ms
Embedding API call:      3-5ms  (cached: 0ms)
Similarity computation:  1-2ms
Sorting/filtering:       <1ms
─────────────────────────────
Total:                   5-9ms
```

### Optimization Tips

1. **Use Smaller Embeddings**: 512 or 1024 dimensions for faster computation
   ```typescript
   embedding: {
     provider: 'openai',
     model: 'text-embedding-3-small',
     dimensions: 512  // Faster than 1536
   }
   ```

2. **Reduce Context Size**: Fewer messages = faster embedding
   ```typescript
   defaultOptions: {
     contextMessages: 2,  // Instead of 3-5
     maxContextTokens: 300
   }
   ```

3. **Leverage Caching**: Identical contexts reuse cached embeddings (0ms)

4. **Tune topK**: Request fewer tools if you don't need 20
   ```typescript
   await filter.filter(input, { topK: 10 });
   ```

## Integration Examples

### With Portkey AI Gateway

```typescript
import Portkey from 'portkey-ai';
import { MCPToolFilter } from '@portkey-ai/mcp-tool-filter';

const portkey = new Portkey({ apiKey: '...' });
const filter = new MCPToolFilter({ /* ... */ });

await filter.initialize(mcpServers);

// Filter tools based on conversation
const { tools } = await filter.filter(messages);

// Convert to OpenAI tool format
const openaiTools = tools.map(t => ({
  type: 'function',
  function: {
    name: t.toolName,
    description: t.tool.description,
    parameters: t.tool.inputSchema,
  }
}));

// Make LLM request with filtered tools
const completion = await portkey.chat.completions.create({
  model: 'gpt-4',
  messages: messages,
  tools: openaiTools,
});
```

### With LangChain

```typescript
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { MCPToolFilter } from '@portkey-ai/mcp-tool-filter';

const filter = new MCPToolFilter({ /* ... */ });
await filter.initialize(mcpServers);

// Create a custom tool selector
async function selectTools(messages) {
  const { tools } = await filter.filter(messages);
  return tools.map(t => convertToLangChainTool(t));
}

// Use in your agent
const model = new ChatOpenAI();
const tools = await selectTools(messages);
const response = await model.invoke(messages, { tools });
```

### Caching Strategy

```typescript
// Recommended: Initialize once at startup
let filterInstance: MCPToolFilter;

async function getFilter() {
  if (!filterInstance) {
    filterInstance = new MCPToolFilter({ /* ... */ });
    await filterInstance.initialize(mcpServers);
  }
  return filterInstance;
}

// Use in request handlers
app.post('/chat', async (req, res) => {
  const filter = await getFilter();
  const result = await filter.filter(req.body.messages);
  // ... use filtered tools
});
```

## Benchmarks

Performance on various tool counts (M1 Max):

**Local Embeddings (Xenova/all-MiniLM-L6-v2):**

| Tools | Initialization | Filter (Cold) | Filter (Cached) |
|-------|---------------|---------------|-----------------|
| 10    | ~100ms        | 2ms           | <1ms            |
| 100   | ~500ms        | 3ms           | <1ms            |
| 500   | ~2s           | 4ms           | 1ms             |
| 1000  | ~4s           | 5ms           | 1ms             |
| 5000  | ~20s          | 8ms           | 2ms             |

**API Embeddings (OpenAI text-embedding-3-small):**

| Tools | Initialization | Filter (Cold) | Filter (Cached) |
|-------|---------------|---------------|-----------------|
| 10    | ~200ms        | 500ms         | 1ms             |
| 100   | ~1.5s         | 550ms         | 2ms             |
| 500   | ~6s           | 600ms         | 2ms             |
| 1000  | ~12s          | 650ms         | 3ms             |
| 5000  | ~60s          | 800ms         | 4ms             |

**Key Takeaways:**
- 🚀 Local embeddings are **200-300x faster** for filter requests
- ✅ Local embeddings meet the **<50ms target** easily
- 💰 Local embeddings have no API costs
- 📊 API embeddings may have slightly higher accuracy
- ⚡ Both benefit significantly from caching

**Note**: Initialization is a one-time cost. Choose local embeddings for low latency, API embeddings for maximum accuracy.

### When to Use Local vs API Embeddings

**Use Local Embeddings when:**
- ⚡ You need ultra-low latency (<10ms)
- 🔒 Privacy is important (no external API calls)
- 💰 You want zero API costs
- 🌐 You need offline operation
- 📊 "Good enough" accuracy is acceptable

**Use API Embeddings when:**
- 🎯 You need maximum accuracy
- 🌍 You have good internet connectivity
- 💵 API costs are not a concern
- 📈 You're dealing with complex/nuanced queries

**Recommendation:** Start with local embeddings. Only switch to API if accuracy is insufficient.

### Testing Local vs API

Compare performance for your use case:

```bash
npx ts-node examples/test-local-embeddings.ts
```

This will benchmark both providers and show you:
- Initialization time
- Average filter time
- Cached filter time
- Speed comparison

## Debugging & Performance Monitoring

### Enable Debug Logging

To see detailed timing logs for each request, enable debug mode:

```typescript
const filter = new MCPToolFilter({
  embedding: { /* ... */ },
  debug: true  // Enable detailed timing logs
});
```

This will output detailed logs for each filter request:

```
=== Starting filter request ===
[1/5] Options merged: 0.12ms
[2/5] Context built (156 chars): 0.34ms
[3/5] Cache MISS (lookup: 0.08ms)
     → Embedding generated: 1247.56ms
[4/5] Similarities computed: 1.23ms (25 tools, 0.049ms/tool)
[5/5] Tools selected & ranked: 0.15ms (5 tools returned)
=== Total filter time: 1249.48ms ===
Breakdown: merge=0.12ms, context=0.34ms, cache=0.08ms, embedding=1247.56ms, similarity=1.23ms, selection=0.15ms
```

### Timing Breakdown

Each filter request logs 5 steps:

1. **Options Merging** (`merge`): Merge provided options with defaults
2. **Context Building** (`context`): Build the context string from input messages
3. **Cache Lookup & Embedding** (`cache` + `embedding`): 
   - Cache HIT: 0ms embedding time (reuses cached embedding)
   - Cache MISS: Calls embedding API (typically 200-2000ms depending on provider)
4. **Similarity Computation** (`similarity`): Compute cosine similarity for all tools
   - Also shows per-tool average time
5. **Tool Selection** (`selection`): Filter by score and select top-K tools

### Example: Testing Timings

See `examples/test-timings.ts` for a complete example:

```bash
export OPENAI_API_KEY=your-key-here
npx ts-node examples/test-timings.ts
```

This will run multiple filter requests showing:
- Cache miss vs cache hit performance
- Different query types
- Chat message context handling

### Performance Metrics

Every filter request returns detailed metrics:

```typescript
const result = await filter.filter(input);

console.log(result.metrics);
// {
//   totalTime: 1249.48,      // Total request time in ms
//   embeddingTime: 1247.56,  // Time spent on embedding API
//   similarityTime: 1.23,    // Time computing similarities
//   toolsEvaluated: 25       // Number of tools evaluated
// }
```

### Monitoring in Production

```typescript
const result = await filter.filter(messages);

// Log metrics for monitoring
logger.info('Tool filter performance', {
  totalTime: result.metrics.totalTime,
  embeddingTime: result.metrics.embeddingTime,
  cached: result.metrics.embeddingTime === 0,
  toolsReturned: result.tools.length,
});

// Alert if too slow
if (result.metrics.totalTime > 5000) {
  logger.warn('Slow filter request', result.metrics);
}
```

## Advanced Usage

### Two-Stage Filtering

For very large tool sets, use hierarchical filtering:

```typescript
// Stage 1: Filter by server categories
const relevantServers = mcpServers.filter(server => 
  server.categories?.some(cat => userIntent.includes(cat))
);

// Stage 2: Filter tools within relevant servers
const result = await filter.filter(messages);
```

### Custom Scoring

Combine embedding similarity with keyword matching:

```typescript
const { tools } = await filter.filter(input);

// Boost tools with exact keyword matches
const boostedTools = tools.map(tool => {
  const hasKeywordMatch = tool.tool.keywords?.some(kw => 
    input.toLowerCase().includes(kw.toLowerCase())
  );
  return {
    ...tool,
    score: hasKeywordMatch ? tool.score * 1.2 : tool.score
  };
}).sort((a, b) => b.score - a.score);
```

### Always-Include Power Tools

Always include certain essential tools:

```typescript
const filter = new MCPToolFilter({
  // ...
  defaultOptions: {
    alwaysInclude: [
      'web_search',           // Always useful
      'conversation_search',  // Access to context
    ],
  }
});
```

## Troubleshooting

### Slow First Request

**Problem**: First filter call is slow.

**Solution**: The embedding API call takes 3-5ms. Subsequent calls with similar context are cached and much faster.

```typescript
// Warm up the cache
await filter.filter("hello"); // ~5ms
await filter.filter("hello"); // ~1ms (cached)
```

### Poor Tool Selection

**Problem**: Wrong tools are being selected.

**Solutions**:
1. Improve tool descriptions with more keywords and use cases
2. Lower the `minScore` threshold
3. Increase `topK` to include more tools
4. Add important tools to `alwaysInclude`

### Memory Usage

**Problem**: High memory usage with many tools.

**Solution**: Use smaller embedding dimensions:

```typescript
embedding: {
  dimensions: 512  // Instead of 1536
}
```

This reduces memory by ~66% with minimal accuracy loss.

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Support

- GitHub Issues: [github.com/portkey-ai/mcp-tool-filter](https://github.com/portkey-ai/mcp-tool-filter)
- Email: support@portkey.ai
