import {
  MCPServer,
  MCPToolFilterConfig,
  FilterInput,
  FilterOptions,
  FilterResult,
  ScoredTool,
} from './types';
import { EmbeddingProvider, createEmbeddingProvider } from './embedding';
import {
  normalizeVector,
  dotProduct,
  buildContextString,
  extractToolsWithMetadata,
  partialSort,
  hashString,
  Timer,
  ToolWithMetadata,
  LRUCache,
} from './utils';

/**
 * Main MCP Tool Filter class
 */
export class MCPToolFilter {
  private config: MCPToolFilterConfig;
  private embeddingProvider: EmbeddingProvider;
  private initialized: boolean = false;
  
  // Cached tool embeddings (normalized for cosine similarity)
  private toolEmbeddings: Map<string, Float32Array> = new Map();
  private toolMetadata: Map<string, ToolWithMetadata> = new Map();
  
  // Context embedding cache with proper LRU eviction
  private contextCache: LRUCache<string, Float32Array>;
  private readonly MAX_CACHE_SIZE = 100;
  
  constructor(config: MCPToolFilterConfig) {
    this.config = config;
    this.embeddingProvider = createEmbeddingProvider(config.embedding);
    this.contextCache = new LRUCache(this.MAX_CACHE_SIZE);
    
    this.log('MCPToolFilter initialized with provider:', config.embedding.provider);
  }
  
  /**
   * Initialize the filter with MCP servers
   * This precomputes and caches all tool embeddings
   */
  async initialize(servers: MCPServer[]): Promise<void> {
    const timer = new Timer();
    this.log(`Initializing with ${servers.length} servers...`);
    
    // Extract all tools with metadata
    const tools = extractToolsWithMetadata(servers);
    this.log(`Found ${tools.length} total tools`);
    
    // Generate descriptions for embedding
    const descriptions = tools.map(t => t.description);
    
    // Batch embed all tool descriptions
    this.log('Computing tool embeddings...');
    const embeddings = await this.embeddingProvider.embedBatch(descriptions);
    
    // Normalize and cache embeddings
    for (let i = 0; i < tools.length; i++) {
      const toolKey = this.getToolKey(tools[i].serverId, tools[i].tool.name);
      const normalized = normalizeVector(embeddings[i]);
      
      this.toolEmbeddings.set(toolKey, normalized);
      this.toolMetadata.set(toolKey, tools[i]);
    }
    
    this.initialized = true;
    this.log(`Initialization complete in ${timer.elapsed()}ms`);
  }
  
  /**
   * Filter tools based on input context
   */
  async filter(
    input: FilterInput,
    options?: FilterOptions
  ): Promise<FilterResult> {
    if (!this.initialized) {
      throw new Error('MCPToolFilter not initialized. Call initialize() first.');
    }
    
    const totalTimer = new Timer();
    this.log('=== Starting filter request ===');
    
    // Merge options with defaults
    const mergeTimer = new Timer();
    const opts: Required<FilterOptions> = {
      topK: options?.topK ?? this.config.defaultOptions?.topK ?? 20,
      minScore: options?.minScore ?? this.config.defaultOptions?.minScore ?? 0.3,
      contextMessages: options?.contextMessages ?? this.config.defaultOptions?.contextMessages ?? 3,
      alwaysInclude: options?.alwaysInclude ?? this.config.defaultOptions?.alwaysInclude ?? [],
      exclude: options?.exclude ?? this.config.defaultOptions?.exclude ?? [],
      maxContextTokens: options?.maxContextTokens ?? this.config.defaultOptions?.maxContextTokens ?? 500,
    };
    const mergeTime = mergeTimer.elapsed();
    this.log(`[1/5] Options merged: ${mergeTime.toFixed(2)}ms`);
    
    // Build context string
    const contextTimer = new Timer();
    const contextString = buildContextString(
      input,
      opts.contextMessages,
      opts.maxContextTokens
    );
    const contextTime = contextTimer.elapsed();
    this.log(`[2/5] Context built (${contextString.length} chars): ${contextTime.toFixed(2)}ms`);
    
    // Check cache
    const cacheTimer = new Timer();
    const contextHash = hashString(contextString);
    let contextEmbedding: Float32Array;
    let embeddingTime: number;
    const cacheTime = cacheTimer.elapsed();
    
    const cachedEmbedding = this.contextCache.get(contextHash);
    if (cachedEmbedding !== undefined) {
      contextEmbedding = cachedEmbedding;
      embeddingTime = 0;
      this.log(`[3/5] Cache HIT (lookup: ${cacheTime.toFixed(2)}ms, embedding: 0ms)`);
    } else {
      this.log(`[3/5] Cache MISS (lookup: ${cacheTime.toFixed(2)}ms)`);
      // Embed context
      const embTimer = new Timer();
      const rawEmbedding = await this.embeddingProvider.embed(contextString);
      contextEmbedding = normalizeVector(rawEmbedding, true); // Use in-place normalization
      embeddingTime = embTimer.elapsed();
      
      // Cache the embedding
      this.contextCache.set(contextHash, contextEmbedding);
      
      this.log(`     → Embedding generated: ${embeddingTime.toFixed(2)}ms`);
    }
    
    // Compute similarities
    const simTimer = new Timer();
    const scores = this.computeSimilarities(contextEmbedding, opts);
    const similarityTime = simTimer.elapsed();
    
    this.log(`[4/5] Similarities computed: ${similarityTime.toFixed(2)}ms (${this.toolEmbeddings.size} tools, ${(similarityTime / this.toolEmbeddings.size).toFixed(3)}ms/tool)`);
    
    // Filter and rank tools
    const selectTimer = new Timer();
    const filteredTools = this.selectTools(scores, opts);
    const selectionTime = selectTimer.elapsed();
    
    this.log(`[5/5] Tools selected & ranked: ${selectionTime.toFixed(2)}ms (${filteredTools.length} tools returned)`);
    
    const totalTime = totalTimer.elapsed();
    this.log(`=== Total filter time: ${totalTime.toFixed(2)}ms ===`);
    
    // Log breakdown
    this.log(`Breakdown: merge=${mergeTime.toFixed(2)}ms, context=${contextTime.toFixed(2)}ms, cache=${cacheTime.toFixed(2)}ms, embedding=${embeddingTime.toFixed(2)}ms, similarity=${similarityTime.toFixed(2)}ms, selection=${selectionTime.toFixed(2)}ms`);
    
    return {
      tools: filteredTools,
      metrics: {
        totalTime,
        embeddingTime,
        similarityTime,
        toolsEvaluated: this.toolEmbeddings.size,
      },
    };
  }
  
  /**
   * Compute similarity scores for all tools
   * Optimized to minimize intermediate array allocations
   */
  private computeSimilarities(
    contextEmbedding: Float32Array,
    options: Required<FilterOptions>
  ): ScoredTool[] {
    const scores: ScoredTool[] = [];
    const excludeSet = new Set(options.exclude); // Pre-convert to Set for O(1) lookup
    
    for (const [toolKey, toolEmbedding] of this.toolEmbeddings.entries()) {
      const metadata = this.toolMetadata.get(toolKey)!;
      
      // Skip excluded tools (O(1) lookup)
      if (excludeSet.has(metadata.tool.name)) {
        continue;
      }
      
      // Compute cosine similarity (dot product of normalized vectors)
      const score = dotProduct(contextEmbedding, toolEmbedding);
      
      scores.push({
        serverId: metadata.serverId,
        toolName: metadata.tool.name,
        tool: metadata.tool,
        score,
      });
    }
    
    return scores;
  }
  
  /**
   * Select and rank tools based on scores
   * Optimized to reduce intermediate array allocations
   */
  private selectTools(
    scores: ScoredTool[],
    options: Required<FilterOptions>
  ): ScoredTool[] {
    // Separate always-include tools and filter by minScore in one pass
    const alwaysIncludeSet = new Set(options.alwaysInclude);
    const alwaysIncluded: ScoredTool[] = [];
    const scoredTools: ScoredTool[] = [];
    
    for (const scored of scores) {
      if (alwaysIncludeSet.has(scored.toolName)) {
        alwaysIncluded.push(scored);
      } else if (scored.score >= options.minScore) {
        scoredTools.push(scored);
      }
    }
    
    // Get top K from scored tools using heap-based selection (O(n log k))
    const remainingSlots = Math.max(0, options.topK - alwaysIncluded.length);
    const topScored = partialSort(
      scoredTools,
      remainingSlots,
      (tool) => tool.score
    );
    
    // Combine: always-included first, then top scored
    return [...alwaysIncluded, ...topScored];
  }
  
  /**
   * Generate unique key for a tool
   */
  private getToolKey(serverId: string, toolName: string): string {
    return `${serverId}::${toolName}`;
  }
  
  /**
   * Clear all caches
   */
  clearCache(): void {
    this.contextCache.clear();
    this.log('Caches cleared');
  }
  
  /**
   * Get initialization status
   */
  isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Get stats about loaded tools
   */
  getStats() {
    return {
      initialized: this.initialized,
      toolCount: this.toolEmbeddings.size,
      cacheSize: this.contextCache.size,
      embeddingDimensions: this.embeddingProvider.getDimensions(),
    };
  }
  
  /**
   * Debug logging
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[MCPToolFilter]', ...args);
    }
  }
}
