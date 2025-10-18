/**
 * Example script to test and compare local vs API embeddings
 * Run with: npx ts-node examples/test-local-embeddings.ts
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
  console.log('🚀 Testing Local vs API Embeddings Performance\n');

  // Test 1: Local Embeddings
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 1: LOCAL EMBEDDINGS (transformers.js)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const localFilter = new MCPToolFilter({
    embedding: {
      provider: 'local',
      model: 'Xenova/all-MiniLM-L6-v2', // Fast, lightweight model
      quantized: true, // Use quantized model for speed
    },
    debug: true,
  });

  console.log('Initializing with local embeddings...');
  const localInitStart = Date.now();
  await localFilter.initialize(mockServers);
  const localInitTime = Date.now() - localInitStart;
  console.log(`✓ Local initialization: ${localInitTime}ms\n`);

  // Test multiple queries with local embeddings
  const queries = [
    "Can you search my emails for the project update?",
    "What meetings do I have today?",
    "Add a task to my list",
  ];

  console.log('Running queries with local embeddings...\n');
  const localTimes: number[] = [];

  for (const query of queries) {
    console.log(`Query: "${query}"`);
    const result = await localFilter.filter(query, { topK: 3 });
    localTimes.push(result.metrics.totalTime);
    
    console.log(`Top result: ${result.tools[0].toolName} (score: ${result.tools[0].score.toFixed(4)})`);
    console.log(`Time: ${result.metrics.totalTime.toFixed(2)}ms\n`);
  }

  // Test cached query
  console.log('Testing cache (repeating first query)...');
  const cachedResult = await localFilter.filter(queries[0], { topK: 3 });
  console.log(`Cached time: ${cachedResult.metrics.totalTime.toFixed(2)}ms\n`);

  // Summary for local
  const avgLocal = localTimes.reduce((a, b) => a + b, 0) / localTimes.length;
  console.log('📊 Local Embeddings Summary:');
  console.log(`  Initialization: ${localInitTime}ms`);
  console.log(`  Average filter time: ${avgLocal.toFixed(2)}ms`);
  console.log(`  Cached filter time: ${cachedResult.metrics.totalTime.toFixed(2)}ms`);
  console.log(`  Embedding dimensions: ${localFilter.getStats().embeddingDimensions}\n`);

  // Test 2: API Embeddings (if API key available)
  if (process.env.OPENAI_API_KEY) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 2: API EMBEDDINGS (OpenAI)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const apiFilter = new MCPToolFilter({
      embedding: {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        model: 'text-embedding-3-small',
        dimensions: 384, // Match local model dimensions
      },
      debug: true,
    });

    console.log('Initializing with API embeddings...');
    const apiInitStart = Date.now();
    await apiFilter.initialize(mockServers);
    const apiInitTime = Date.now() - apiInitStart;
    console.log(`✓ API initialization: ${apiInitTime}ms\n`);

    console.log('Running queries with API embeddings...\n');
    const apiTimes: number[] = [];

    for (const query of queries) {
      console.log(`Query: "${query}"`);
      const result = await apiFilter.filter(query, { topK: 3 });
      apiTimes.push(result.metrics.totalTime);
      
      console.log(`Top result: ${result.tools[0].toolName} (score: ${result.tools[0].score.toFixed(4)})`);
      console.log(`Time: ${result.metrics.totalTime.toFixed(2)}ms\n`);
    }

    // Test cached query
    console.log('Testing cache (repeating first query)...');
    const apiCachedResult = await apiFilter.filter(queries[0], { topK: 3 });
    console.log(`Cached time: ${apiCachedResult.metrics.totalTime.toFixed(2)}ms\n`);

    // Summary for API
    const avgAPI = apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length;
    console.log('📊 API Embeddings Summary:');
    console.log(`  Initialization: ${apiInitTime}ms`);
    console.log(`  Average filter time: ${avgAPI.toFixed(2)}ms`);
    console.log(`  Cached filter time: ${apiCachedResult.metrics.totalTime.toFixed(2)}ms`);
    console.log(`  Embedding dimensions: ${apiFilter.getStats().embeddingDimensions}\n`);

    // Comparison
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚡ PERFORMANCE COMPARISON');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Initialization:');
    console.log(`  Local: ${localInitTime}ms`);
    console.log(`  API:   ${apiInitTime}ms`);
    console.log(`  Winner: ${localInitTime < apiInitTime ? '✓ Local' : '✓ API'} (${Math.abs(localInitTime - apiInitTime)}ms faster)\n`);

    console.log('Average Filter Time (cold):');
    console.log(`  Local: ${avgLocal.toFixed(2)}ms`);
    console.log(`  API:   ${avgAPI.toFixed(2)}ms`);
    console.log(`  Winner: ${avgLocal < avgAPI ? '✓ Local' : '✓ API'} (${Math.abs(avgLocal - avgAPI).toFixed(2)}ms faster)\n`);

    console.log('Cached Filter Time:');
    console.log(`  Local: ${cachedResult.metrics.totalTime.toFixed(2)}ms`);
    console.log(`  API:   ${apiCachedResult.metrics.totalTime.toFixed(2)}ms`);
    console.log(`  Winner: ${cachedResult.metrics.totalTime < apiCachedResult.metrics.totalTime ? '✓ Local' : '✓ API'} (${Math.abs(cachedResult.metrics.totalTime - apiCachedResult.metrics.totalTime).toFixed(2)}ms faster)\n`);

    const speedup = (avgAPI / avgLocal).toFixed(1);
    console.log(`🚀 Local embeddings are ${speedup}x faster than API embeddings!`);
    
    if (avgLocal < 50) {
      console.log('✅ Local embeddings meet the <50ms target!');
    } else {
      console.log(`⚠️  Local embeddings: ${avgLocal.toFixed(2)}ms (target: <50ms)`);
    }
  } else {
    console.log('\n⚠️  OPENAI_API_KEY not set, skipping API comparison');
    console.log('Set it to compare: export OPENAI_API_KEY=your-key-here\n');
  }

  console.log('\n✨ Test complete!\n');
}

main().catch(console.error);

