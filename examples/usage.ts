/**
 * Example usage of @portkey-ai/mcp-tool-filter
 */

import { MCPToolFilter, MCPServer } from '../src';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  // 1. Load your MCP servers configuration
  const serversJson = fs.readFileSync(
    path.join(__dirname, 'mcp-servers.json'),
    'utf-8'
  );
  const servers: MCPServer[] = JSON.parse(serversJson);
  
  // 2. Initialize the filter
  const filter = new MCPToolFilter({
    embedding: {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY!,
      model: 'text-embedding-3-small', // Fast and cheap
      dimensions: 1536,
    },
    defaultOptions: {
      topK: 15,
      minScore: 0.3,
      contextMessages: 3,
    },
    debug: true,
  });
  
  // 3. Initialize with servers (precomputes embeddings - do this once)
  console.log('Initializing filter...');
  await filter.initialize(servers);
  console.log('Filter ready!\n');
  
  // 4. Example 1: Filter with a simple string query
  console.log('=== Example 1: Simple string query ===');
  const result1 = await filter.filter(
    "Can you search my emails for messages from john about the Q4 project?"
  );
  
  console.log(`Found ${result1.tools.length} relevant tools:`);
  result1.tools.forEach(tool => {
    console.log(`  - ${tool.toolName} (score: ${tool.score.toFixed(3)})`);
  });
  console.log(`\nPerformance: ${result1.metrics.totalTime}ms total`);
  console.log(`  - Embedding: ${result1.metrics.embeddingTime}ms`);
  console.log(`  - Similarity: ${result1.metrics.similarityTime}ms\n`);
  
  // 5. Example 2: Filter with chat completion messages
  console.log('=== Example 2: Chat completion messages ===');
  const result2 = await filter.filter([
    {
      role: 'user',
      content: 'What meetings do I have next week?'
    },
    {
      role: 'assistant',
      content: 'I can check your calendar for you.'
    },
    {
      role: 'user',
      content: 'Yes please, and also check if I have any free time on Thursday'
    }
  ]);
  
  console.log(`Found ${result2.tools.length} relevant tools:`);
  result2.tools.forEach(tool => {
    console.log(`  - ${tool.toolName} (score: ${tool.score.toFixed(3)})`);
  });
  console.log(`\nPerformance: ${result2.metrics.totalTime}ms total\n`);
  
  // 6. Example 3: Custom options per query
  console.log('=== Example 3: Custom options ===');
  const result3 = await filter.filter(
    "Send a message to the engineering team about the deployment",
    {
      topK: 5, // Only return top 5 tools
      minScore: 0.4, // Higher threshold
      alwaysInclude: ['web_search'], // Always include web search
    }
  );
  
  console.log(`Found ${result3.tools.length} relevant tools:`);
  result3.tools.forEach(tool => {
    console.log(`  - ${tool.toolName} (score: ${tool.score.toFixed(3)})`);
  });
  console.log(`\nPerformance: ${result3.metrics.totalTime}ms total\n`);
  
  // 7. Example 4: Get stats
  console.log('=== Filter Statistics ===');
  const stats = filter.getStats();
  console.log(stats);
}

// Run the example
main().catch(console.error);
