import { ChatMessage, MCPTool, MCPServer } from './types';

/**
 * Normalize a vector to unit length (for cosine similarity via dot product)
 */
export function normalizeVector(vec: Float32Array): Float32Array {
  let magnitude = 0;
  for (let i = 0; i < vec.length; i++) {
    magnitude += vec[i] * vec[i];
  }
  magnitude = Math.sqrt(magnitude);
  
  if (magnitude === 0) return vec;
  
  const normalized = new Float32Array(vec.length);
  for (let i = 0; i < vec.length; i++) {
    normalized[i] = vec[i] / magnitude;
  }
  return normalized;
}

/**
 * Compute dot product between two vectors (cosine similarity for normalized vectors)
 */
export function dotProduct(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Generate rich description for a tool (includes keywords and context)
 */
export function generateToolDescription(tool: MCPTool): string {
  const parts: string[] = [tool.description];
  
  if (tool.keywords && tool.keywords.length > 0) {
    parts.push(`Keywords: ${tool.keywords.join(', ')}`);
  }
  
  if (tool.category) {
    parts.push(`Category: ${tool.category}`);
  }
  
  // Add parameter names for better semantic matching
  if (tool.inputSchema && tool.inputSchema.properties) {
    const paramNames = Object.keys(tool.inputSchema.properties);
    if (paramNames.length > 0) {
      parts.push(`Parameters: ${paramNames.join(', ')}`);
    }
  }
  
  return parts.join(' | ');
}

/**
 * Build context string from messages or raw string
 */
export function buildContextString(
  input: ChatMessage[] | string,
  maxMessages: number = 3,
  maxTokens: number = 500
): string {
  // If input is already a string, truncate and return
  if (typeof input === 'string') {
    return truncateToTokens(input, maxTokens);
  }
  
  // Filter out system messages and take last N messages
  const relevantMessages = input
    .filter(msg => msg.role !== 'system')
    .slice(-maxMessages);
  
  // Build context string
  const contextParts = relevantMessages.map(msg => {
    const rolePrefix = msg.role === 'user' ? 'User' : 'Assistant';
    return `${rolePrefix}: ${msg.content}`;
  });
  
  const context = contextParts.join('\n\n');
  return truncateToTokens(context, maxTokens);
}

/**
 * Simple token estimation and truncation
 * Uses rough approximation: 1 token ≈ 4 characters
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  const estimatedChars = maxTokens * 4;
  if (text.length <= estimatedChars) {
    return text;
  }
  
  // Truncate and try to break at word boundary
  let truncated = text.slice(0, estimatedChars);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > estimatedChars * 0.8) {
    truncated = truncated.slice(0, lastSpace);
  }
  
  return truncated + '...';
}

/**
 * Partial sort to get top K elements (faster than full sort)
 */
export function partialSort<T>(
  items: T[],
  k: number,
  scoreFunc: (item: T) => number
): T[] {
  if (k >= items.length) {
    return items.sort((a, b) => scoreFunc(b) - scoreFunc(a));
  }
  
  // Use a min-heap approach for better performance with large arrays
  // For now, simple approach: sort all and take top k
  // TODO: Optimize with actual heap implementation for large tool counts
  return items
    .sort((a, b) => scoreFunc(b) - scoreFunc(a))
    .slice(0, k);
}

/**
 * Generate a stable hash for caching
 */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Extract all tools from servers with metadata
 */
export interface ToolWithMetadata {
  serverId: string;
  serverName: string;
  tool: MCPTool;
  description: string;
}

export function extractToolsWithMetadata(servers: MCPServer[]): ToolWithMetadata[] {
  const tools: ToolWithMetadata[] = [];
  
  for (const server of servers) {
    for (const tool of server.tools) {
      tools.push({
        serverId: server.id,
        serverName: server.name,
        tool,
        description: generateToolDescription(tool),
      });
    }
  }
  
  return tools;
}

/**
 * Performance timer utility
 */
export class Timer {
  private startTime: number;
  
  constructor() {
    this.startTime = Date.now();
  }
  
  elapsed(): number {
    return Date.now() - this.startTime;
  }
  
  reset(): void {
    this.startTime = Date.now();
  }
}
