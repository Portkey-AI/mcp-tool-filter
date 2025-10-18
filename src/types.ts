/**
 * Core types for MCP Tool Filter
 */

/**
 * MCP Tool definition
 */
export interface MCPTool {
  /** Unique identifier for the tool */
  name: string;
  
  /** Human-readable description of what the tool does */
  description: string;
  
  /** Optional: Additional keywords or use cases for better matching */
  keywords?: string[];
  
  /** Optional: Category for hierarchical filtering */
  category?: string;
  
  /** JSON schema for tool parameters */
  inputSchema?: Record<string, any>;
}

/**
 * MCP Server definition
 */
export interface MCPServer {
  /** Unique identifier for the server */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Optional: Description of what this server provides */
  description?: string;
  
  /** Tools exposed by this server */
  tools: MCPTool[];
  
  /** Optional: Categories this server belongs to */
  categories?: string[];
}

/**
 * Chat completion message format (OpenAI-compatible)
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

/**
 * Input for tool filtering - either messages or raw string
 */
export type FilterInput = ChatMessage[] | string;

/**
 * Scored tool result
 */
export interface ScoredTool {
  /** Server ID this tool belongs to */
  serverId: string;
  
  /** Tool name */
  toolName: string;
  
  /** Full tool definition */
  tool: MCPTool;
  
  /** Similarity score (0-1) */
  score: number;
}

/**
 * Filter configuration options
 */
export interface FilterOptions {
  /** Number of top tools to return (default: 20) */
  topK?: number;
  
  /** Minimum similarity score threshold (default: 0.3) */
  minScore?: number;
  
  /** Number of recent messages to consider for context (default: 3) */
  contextMessages?: number;
  
  /** Tools to always include regardless of score */
  alwaysInclude?: string[];
  
  /** Tools to exclude from results */
  exclude?: string[];
  
  /** Maximum tokens for context (default: 500) */
  maxContextTokens?: number;
}

/**
 * Embedding provider configuration for API-based providers
 */
export interface APIEmbeddingConfig {
  /** Provider to use */
  provider: 'openai' | 'voyage' | 'cohere';
  
  /** API key for the provider */
  apiKey: string;
  
  /** Optional: Model name (defaults to provider's recommended model) */
  model?: string;
  
  /** Optional: Embedding dimensions (for providers that support it) */
  dimensions?: number;
  
  /** Optional: Base URL for custom endpoints */
  baseURL?: string;
}

/**
 * Embedding provider configuration for local models
 */
export interface LocalEmbeddingConfig {
  /** Provider to use */
  provider: 'local';
  
  /** Optional: HuggingFace model name (defaults to 'Xenova/all-MiniLM-L6-v2') */
  model?: string;
  
  /** Optional: Quantization level (defaults to true for faster inference) */
  quantized?: boolean;
}

/**
 * Union type for all embedding configurations
 */
export type EmbeddingConfig = APIEmbeddingConfig | LocalEmbeddingConfig;

/**
 * Library configuration
 */
export interface MCPToolFilterConfig {
  /** Embedding provider configuration */
  embedding: EmbeddingConfig;
  
  /** Default filter options */
  defaultOptions?: FilterOptions;
  
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Filter result
 */
export interface FilterResult {
  /** Selected tools with scores */
  tools: ScoredTool[];
  
  /** Performance metrics */
  metrics: {
    /** Total time taken (ms) */
    totalTime: number;
    
    /** Time to embed context (ms) */
    embeddingTime: number;
    
    /** Time to compute similarities (ms) */
    similarityTime: number;
    
    /** Total number of tools evaluated */
    toolsEvaluated: number;
  };
}
