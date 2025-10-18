/**
 * Example script to demonstrate detailed timing logs
 * Run with: npx ts-node examples/test-timings.ts
 */

import { MCPToolFilter, MCPServer } from '../src';

// Mock servers for testing
const mockServers: MCPServer[] = [
  {
    id: 'productivity-server',
    name: 'Productivity Server',
    description: 'Tools for email, calendar, and tasks',
    tools: [
      {
        name: 'email_search',
        description: 'Search emails in your inbox. Use when looking for messages, correspondence, or mail.',
        keywords: ['email', 'search', 'inbox', 'messages'],
        category: 'email',
      },
      {
        name: 'email_send',
        description: 'Send an email to recipients. Use when composing or sending messages.',
        keywords: ['email', 'send', 'compose', 'message'],
        category: 'email',
      },
      {
        name: 'calendar_list',
        description: 'List calendar events and meetings. Use when checking schedule or appointments.',
        keywords: ['calendar', 'events', 'meetings', 'schedule'],
        category: 'calendar',
      },
      {
        name: 'calendar_create',
        description: 'Create a new calendar event or meeting. Use when scheduling appointments.',
        keywords: ['calendar', 'create', 'schedule', 'meeting'],
        category: 'calendar',
      },
      {
        name: 'task_list',
        description: 'List your tasks and to-do items. Use when checking what needs to be done.',
        keywords: ['tasks', 'todo', 'list', 'items'],
        category: 'tasks',
      },
      {
        name: 'task_create',
        description: 'Create a new task or to-do item. Use when adding something to your list.',
        keywords: ['task', 'create', 'todo', 'add'],
        category: 'tasks',
      },
    ],
  },
  {
    id: 'web-server',
    name: 'Web Search Server',
    description: 'Tools for searching the web',
    tools: [
      {
        name: 'web_search',
        description: 'Search the internet for information. Use when looking up facts or current events.',
        keywords: ['search', 'web', 'google', 'internet'],
        category: 'web',
      },
      {
        name: 'web_scrape',
        description: 'Scrape content from a website. Use when extracting data from web pages.',
        keywords: ['scrape', 'web', 'extract', 'content'],
        category: 'web',
      },
    ],
  },
];

async function main() {
  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.log('\n⚠️  OPENAI_API_KEY not found in environment.');
    console.log('Set it to see actual timing data:');
    console.log('  export OPENAI_API_KEY=your-key-here\n');
    return;
  }

  console.log('🚀 Testing MCPToolFilter with detailed timing logs\n');

  // Initialize filter with debug mode enabled
  const filter = new MCPToolFilter({
    embedding: {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: 'text-embedding-3-small',
      dimensions: 512,
    },
    debug: true, // Enable debug logging to see timing details
  });

  console.log('Initializing filter and embedding tools...');
  await filter.initialize(mockServers);
  console.log('✓ Initialization complete\n');

  // Test 1: First request (cache miss)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 1: Email search query (cache miss)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const result1 = await filter.filter(
    "Can you search my emails for the project update?",
    { topK: 3 }
  );
  
  console.log('\nTop results:');
  result1.tools.forEach((tool, i) => {
    console.log(`  ${i + 1}. ${tool.toolName} (score: ${tool.score.toFixed(4)})`);
  });

  // Test 2: Same request (cache hit)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 2: Same query (cache hit)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const result2 = await filter.filter(
    "Can you search my emails for the project update?",
    { topK: 3 }
  );
  
  console.log('\nTop results:');
  result2.tools.forEach((tool, i) => {
    console.log(`  ${i + 1}. ${tool.toolName} (score: ${tool.score.toFixed(4)})`);
  });

  // Test 3: Different request
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 3: Calendar query (cache miss)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const result3 = await filter.filter(
    "What meetings do I have today?",
    { topK: 3 }
  );
  
  console.log('\nTop results:');
  result3.tools.forEach((tool, i) => {
    console.log(`  ${i + 1}. ${tool.toolName} (score: ${tool.score.toFixed(4)})`);
  });

  // Test 4: Chat messages
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 4: Chat messages with context');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const result4 = await filter.filter(
    [
      { role: 'user', content: 'I need to organize my day' },
      { role: 'assistant', content: 'I can help with that. What would you like to do?' },
      { role: 'user', content: 'Show me my tasks for today' },
    ],
    { topK: 3 }
  );
  
  console.log('\nTop results:');
  result4.tools.forEach((tool, i) => {
    console.log(`  ${i + 1}. ${tool.toolName} (score: ${tool.score.toFixed(4)})`);
  });

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Performance Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const stats = filter.getStats();
  console.log(`Total tools indexed: ${stats.toolCount}`);
  console.log(`Embedding dimensions: ${stats.embeddingDimensions}`);
  console.log(`Cache size: ${stats.cacheSize} entries\n`);
}

main().catch(console.error);

