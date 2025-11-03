import { ChatMessage, MCPTool, MCPServer } from './types.js';

/**
 * Normalize a vector to unit length (for cosine similarity via dot product)
 * @param vec - Vector to normalize
 * @param inPlace - If true, modifies the input vector directly (default: false)
 * @returns Normalized vector
 */
export function normalizeVector(vec: Float32Array, inPlace: boolean = false): Float32Array {
  let magnitude = 0;
  for (let i = 0; i < vec.length; i++) {
    magnitude += vec[i] * vec[i];
  }
  magnitude = Math.sqrt(magnitude);

  if (magnitude === 0) return vec;

  if (inPlace) {
    // Modify in place - saves memory allocation
    for (let i = 0; i < vec.length; i++) {
      vec[i] = vec[i] / magnitude;
    }
    return vec;
  } else {
    // Create new array - preserves original
    const normalized = new Float32Array(vec.length);
    for (let i = 0; i < vec.length; i++) {
      normalized[i] = vec[i] / magnitude;
    }
    return normalized;
  }
}

/**
 * Compute dot product between two vectors (cosine similarity for normalized vectors)
 * Optimized with loop unrolling for better CPU performance
 */
export function dotProduct(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let sum = 0;
  const len = a.length;
  const remainder = len % 4;
  const limit = len - remainder;

  // Unrolled loop for better CPU pipelining (process 4 elements at a time)
  for (let i = 0; i < limit; i += 4) {
    sum += a[i] * b[i] +
      a[i + 1] * b[i + 1] +
      a[i + 2] * b[i + 2] +
      a[i + 3] * b[i + 3];
  }

  // Handle remaining elements
  for (let i = limit; i < len; i++) {
    sum += a[i] * b[i];
  }

  return sum;
}

/**
 * Generate rich description for a tool (includes keywords and context)
 * @param tool - The tool to generate description for
 * @param serverDescription - Optional server description to include for additional context
 */
export function generateToolDescription(tool: MCPTool, serverDescription?: string): string {
  const parts: string[] = [tool.description];

  // Add server description first for high-level context
  if (serverDescription) {
    parts.unshift(`Server context: ${serverDescription}`);
  }

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
 * Min-heap implementation for efficient top-K selection
 */
class MinHeap<T> {
  private heap: T[] = [];
  private scoreFunc: (item: T) => number;

  constructor(scoreFunc: (item: T) => number) {
    this.scoreFunc = scoreFunc;
  }

  size(): number {
    return this.heap.length;
  }

  peek(): T | undefined {
    return this.heap[0];
  }

  push(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.bubbleDown(0);
    return min;
  }

  toSortedArray(): T[] {
    const result: T[] = [];
    while (this.heap.length > 0) {
      result.unshift(this.pop()!);
    }
    return result;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.scoreFunc(this.heap[index]) >= this.scoreFunc(this.heap[parentIndex])) {
        break;
      }
      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      let minIndex = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (leftChild < length && this.scoreFunc(this.heap[leftChild]) < this.scoreFunc(this.heap[minIndex])) {
        minIndex = leftChild;
      }
      if (rightChild < length && this.scoreFunc(this.heap[rightChild]) < this.scoreFunc(this.heap[minIndex])) {
        minIndex = rightChild;
      }

      if (minIndex === index) break;

      [this.heap[index], this.heap[minIndex]] = [this.heap[minIndex], this.heap[index]];
      index = minIndex;
    }
  }
}

/**
 * Partial sort to get top K elements
 * Uses optimized built-in sort for small arrays, heap-based selection for large arrays
 */
export function partialSort<T>(
  items: T[],
  k: number,
  scoreFunc: (item: T) => number
): T[] {
  // If k is 0 or negative, return empty array
  if (k <= 0) return [];

  // If k >= items.length, just sort everything
  if (k >= items.length) {
    return items.sort((a, b) => scoreFunc(b) - scoreFunc(a));
  }

  // For smaller arrays or when k is close to n, built-in sort is faster
  // V8's sort is highly optimized and beats heap approach for n < ~500
  if (items.length < 500) {
    return items.sort((a, b) => scoreFunc(b) - scoreFunc(a)).slice(0, k);
  }

  // For large arrays with k << n, use min-heap approach
  // Complexity: O(n log k) vs O(n log n) for full sort
  const heap = new MinHeap(scoreFunc);

  for (const item of items) {
    if (heap.size() < k) {
      heap.push(item);
    } else {
      const minScore = scoreFunc(heap.peek()!);
      const currentScore = scoreFunc(item);
      if (currentScore > minScore) {
        heap.pop();
        heap.push(item);
      }
    }
  }

  // Extract items in descending order
  return heap.toSortedArray();
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

/**
 * Extract all tools from servers with metadata
 * @param servers - Array of MCP servers
 * @param includeServerDescription - Whether to include server description in tool embeddings
 */
export function extractToolsWithMetadata(
  servers: MCPServer[],
  includeServerDescription: boolean = false
): ToolWithMetadata[] {
  const tools: ToolWithMetadata[] = [];

  for (const server of servers) {
    for (const tool of server.tools) {
      const serverDesc = includeServerDescription ? server.description : undefined;
      tools.push({
        serverId: server.id,
        serverName: server.name,
        tool,
        description: generateToolDescription(tool, serverDesc),
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

/**
 * Proper LRU (Least Recently Used) Cache implementation
 * Uses Map for O(1) access and maintains access order
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    // If key exists, delete it first to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // If at capacity, remove least recently used (first item)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    // Add as most recently used (at the end)
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}
