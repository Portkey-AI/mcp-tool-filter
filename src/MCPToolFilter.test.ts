/**
 * Basic tests for MCPToolFilter
 */

import { MCPToolFilter, MCPServer } from '../src';

// Mock servers for testing
const mockServers: MCPServer[] = [
  {
    id: 'test-server',
    name: 'Test Server',
    description: 'A test MCP server',
    tools: [
      {
        name: 'email_search',
        description: 'Search emails in your inbox. Use when looking for messages, correspondence, or mail.',
        keywords: ['email', 'search', 'inbox', 'messages'],
        category: 'email',
      },
      {
        name: 'calendar_list',
        description: 'List calendar events and meetings. Use when checking schedule or appointments.',
        keywords: ['calendar', 'events', 'meetings', 'schedule'],
        category: 'calendar',
      },
      {
        name: 'web_search',
        description: 'Search the internet for information. Use when looking up facts or current events.',
        keywords: ['search', 'web', 'google', 'internet'],
        category: 'web',
      },
    ],
  },
];

describe('MCPToolFilter', () => {
  let filter: MCPToolFilter;
  
  // Note: These tests require a real API key
  // For CI/CD, you'd want to mock the embedding provider
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  
  beforeAll(async () => {
    if (!hasApiKey) {
      console.log('Skipping tests - no OPENAI_API_KEY found');
      return;
    }
    
    filter = new MCPToolFilter({
      embedding: {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY!,
        model: 'text-embedding-3-small',
        dimensions: 512, // Smaller for faster tests
      },
      debug: false,
    });
    
    await filter.initialize(mockServers);
  });
  
  test('should initialize successfully', () => {
    if (!hasApiKey) return;
    
    expect(filter.isInitialized()).toBe(true);
    
    const stats = filter.getStats();
    expect(stats.toolCount).toBe(3);
    expect(stats.embeddingDimensions).toBe(512);
  });
  
  test('should filter tools from string input', async () => {
    if (!hasApiKey) return;
    
    const result = await filter.filter(
      "Can you search my emails for the project update?"
    );
    
    expect(result.tools.length).toBeGreaterThan(0);
    expect(result.tools[0].toolName).toBe('email_search');
    expect(result.metrics.totalTime).toBeLessThan(5000); // Should complete within 5 seconds
  });
  
  test('should filter tools from chat messages', async () => {
    if (!hasApiKey) return;
    
    const result = await filter.filter([
      { role: 'user', content: 'What meetings do I have today?' },
    ]);
    
    expect(result.tools.length).toBeGreaterThan(0);
    expect(result.tools[0].toolName).toBe('calendar_list');
  });
  
  test('should respect topK option', async () => {
    if (!hasApiKey) return;
    
    const result = await filter.filter(
      "Search the web for information",
      { topK: 1 }
    );
    
    expect(result.tools.length).toBeLessThanOrEqual(1);
  });
  
  test('should respect minScore option', async () => {
    if (!hasApiKey) return;
    
    const result = await filter.filter(
      "Search the web",
      { minScore: 0.8 } // Very high threshold
    );
    
    // Should have fewer results due to high threshold
    result.tools.forEach(tool => {
      expect(tool.score).toBeGreaterThanOrEqual(0.8);
    });
  });
  
  test('should respect alwaysInclude option', async () => {
    if (!hasApiKey) return;
    
    const result = await filter.filter(
      "Search my emails",
      { 
        topK: 1,
        alwaysInclude: ['web_search'] 
      }
    );
    
    // Should include web_search even though it's not the most relevant
    const toolNames = result.tools.map(t => t.toolName);
    expect(toolNames).toContain('web_search');
  });
  
  test('should cache context embeddings', async () => {
    if (!hasApiKey) return;
    
    const input = "Check my calendar";
    
    // First call
    const result1 = await filter.filter(input);
    const time1 = result1.metrics.embeddingTime;
    
    // Second call with same input (should be cached)
    const result2 = await filter.filter(input);
    const time2 = result2.metrics.embeddingTime;
    
    expect(time2).toBe(0); // Should be cached
    expect(time1).toBeGreaterThan(0); // First call should have taken time
  });
  
  test('should clear cache', async () => {
    if (!hasApiKey) return;
    
    filter.clearCache();
    
    const stats = filter.getStats();
    expect(stats.cacheSize).toBe(0);
  });
});
