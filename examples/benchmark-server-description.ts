/**
 * Benchmark comparing tool filtering with and without server descriptions
 * 
 * This script tests whether including server descriptions in embeddings
 * improves or degrades search similarity for various query types.
 */

import { MCPToolFilter } from '../src/MCPToolFilter.js';
import { MCPServer, FilterResult } from '../src/types.js';

// Test data with realistic MCP servers
const servers: MCPServer[] = [
  {
    id: 'filesystem',
    name: 'Filesystem Server',
    description: 'Provides file system operations for reading, writing, and managing files and directories on the local system',
    tools: [
      {
        name: 'read_file',
        description: 'Read the contents of a file',
        keywords: ['file', 'read', 'content'],
        inputSchema: { properties: { path: { type: 'string' } } }
      },
      {
        name: 'write_file',
        description: 'Write content to a file',
        keywords: ['file', 'write', 'save'],
        inputSchema: { properties: { path: { type: 'string' }, content: { type: 'string' } } }
      },
      {
        name: 'list_directory',
        description: 'List files and directories in a path',
        keywords: ['directory', 'list', 'folder'],
        inputSchema: { properties: { path: { type: 'string' } } }
      }
    ]
  },
  {
    id: 'database',
    name: 'Database Server',
    description: 'Database query and management tools for PostgreSQL, MySQL, and SQLite databases',
    tools: [
      {
        name: 'query',
        description: 'Execute a SQL query',
        keywords: ['sql', 'query', 'database'],
        inputSchema: { properties: { sql: { type: 'string' } } }
      },
      {
        name: 'list_tables',
        description: 'List all tables in the database',
        keywords: ['database', 'tables', 'schema'],
        inputSchema: {}
      }
    ]
  },
  {
    id: 'web',
    name: 'Web Server',
    description: 'HTTP client for making web requests, fetching data, and interacting with REST APIs',
    tools: [
      {
        name: 'fetch',
        description: 'Fetch data from a URL',
        keywords: ['http', 'fetch', 'request'],
        inputSchema: { properties: { url: { type: 'string' } } }
      },
      {
        name: 'post',
        description: 'Send a POST request',
        keywords: ['http', 'post', 'api'],
        inputSchema: { properties: { url: { type: 'string' }, body: { type: 'object' } } }
      }
    ]
  },
  {
    id: 'git',
    name: 'Git Server',
    description: 'Version control operations including commit, push, pull, and branch management for Git repositories',
    tools: [
      {
        name: 'commit',
        description: 'Commit changes',
        keywords: ['git', 'commit', 'version control'],
        inputSchema: { properties: { message: { type: 'string' } } }
      },
      {
        name: 'push',
        description: 'Push commits to remote',
        keywords: ['git', 'push', 'remote'],
        inputSchema: {}
      },
      {
        name: 'pull',
        description: 'Pull changes from remote',
        keywords: ['git', 'pull', 'fetch'],
        inputSchema: {}
      }
    ]
  },
  {
    id: 'slack',
    name: 'Slack Server',
    description: 'Team communication and collaboration tools for sending messages, managing channels, and user interactions in Slack workspaces',
    tools: [
      {
        name: 'send_message',
        description: 'Send a message to a channel',
        keywords: ['slack', 'message', 'chat'],
        inputSchema: { properties: { channel: { type: 'string' }, message: { type: 'string' } } }
      },
      {
        name: 'list_channels',
        description: 'List all channels',
        keywords: ['slack', 'channels', 'list'],
        inputSchema: {}
      }
    ]
  },
  {
    id: 'calendar',
    name: 'Calendar Server',
    description: 'Calendar and scheduling tools for Google Calendar, supporting event creation, updates, and meeting management',
    tools: [
      {
        name: 'create_event',
        description: 'Create a calendar event',
        keywords: ['calendar', 'event', 'schedule'],
        inputSchema: { properties: { title: { type: 'string' }, date: { type: 'string' } } }
      },
      {
        name: 'list_events',
        description: 'List upcoming events',
        keywords: ['calendar', 'events', 'schedule'],
        inputSchema: {}
      }
    ]
  }
];

// Test queries with expected relevant tools (ground truth)
interface TestCase {
  query: string;
  expectedTools: string[];  // Tool names that should rank highly
  category: 'specific' | 'general' | 'domain' | 'ambiguous';
  description: string;
}

const testCases: TestCase[] = [
  // Specific tool queries (should benefit less from server context)
  {
    query: 'I need to read a configuration file',
    expectedTools: ['read_file'],
    category: 'specific',
    description: 'Direct tool match - specific action'
  },
  {
    query: 'Execute this SQL query to get user data',
    expectedTools: ['query'],
    category: 'specific',
    description: 'Direct tool match with domain keyword'
  },
  
  // General domain queries (should benefit more from server context)
  {
    query: 'I need to work with files and directories',
    expectedTools: ['read_file', 'write_file', 'list_directory'],
    category: 'domain',
    description: 'Domain-level query - filesystem operations'
  },
  {
    query: 'Help me manage my database',
    expectedTools: ['query', 'list_tables'],
    category: 'domain',
    description: 'Domain-level query - database operations'
  },
  {
    query: 'I need to make HTTP requests',
    expectedTools: ['fetch', 'post'],
    category: 'domain',
    description: 'Domain-level query - web operations'
  },
  {
    query: 'Set up version control for my project',
    expectedTools: ['commit', 'push', 'pull'],
    category: 'domain',
    description: 'Domain-level query - git operations'
  },
  
  // Ambiguous queries (could match multiple domains)
  {
    query: 'list everything',
    expectedTools: ['list_directory', 'list_tables', 'list_channels', 'list_events'],
    category: 'ambiguous',
    description: 'Ambiguous action across multiple domains'
  },
  {
    query: 'Show me what is available',
    expectedTools: ['list_directory', 'list_tables', 'list_channels', 'list_events'],
    category: 'ambiguous',
    description: 'Generic query matching multiple list operations'
  },
  
  // General capability queries (server context should help)
  {
    query: 'I want to communicate with my team',
    expectedTools: ['send_message', 'list_channels'],
    category: 'general',
    description: 'High-level intent - team communication'
  },
  {
    query: 'Schedule a meeting',
    expectedTools: ['create_event', 'list_events'],
    category: 'general',
    description: 'High-level intent - scheduling'
  },
  {
    query: 'Work with REST APIs',
    expectedTools: ['fetch', 'post'],
    category: 'general',
    description: 'Technical capability - API interaction'
  },
  {
    query: 'Manage my local files',
    expectedTools: ['read_file', 'write_file', 'list_directory'],
    category: 'general',
    description: 'General capability - file management'
  }
];

// Metrics for evaluation
interface Metrics {
  precision: number;      // Relevant tools / Retrieved tools
  recall: number;         // Relevant tools / Total relevant
  mrr: number;           // Mean Reciprocal Rank of first relevant tool
  ndcg: number;          // Normalized Discounted Cumulative Gain
  avgRelevantRank: number; // Average rank of relevant tools
}

/**
 * Calculate metrics for a single query result
 */
function calculateMetrics(result: FilterResult, expectedTools: string[]): Metrics {
  const retrievedTools = result.tools.map(t => t.toolName);
  const expectedSet = new Set(expectedTools);
  
  // Calculate precision and recall
  const relevantRetrieved = retrievedTools.filter(t => expectedSet.has(t));
  const precision = relevantRetrieved.length / retrievedTools.length || 0;
  const recall = relevantRetrieved.length / expectedTools.length || 0;
  
  // Calculate MRR (Mean Reciprocal Rank)
  let firstRelevantRank = -1;
  for (let i = 0; i < retrievedTools.length; i++) {
    if (expectedSet.has(retrievedTools[i])) {
      firstRelevantRank = i + 1;
      break;
    }
  }
  const mrr = firstRelevantRank > 0 ? 1 / firstRelevantRank : 0;
  
  // Calculate average rank of relevant tools
  const relevantRanks: number[] = [];
  retrievedTools.forEach((tool, idx) => {
    if (expectedSet.has(tool)) {
      relevantRanks.push(idx + 1);
    }
  });
  const avgRelevantRank = relevantRanks.length > 0
    ? relevantRanks.reduce((a, b) => a + b, 0) / relevantRanks.length
    : 0;
  
  // Calculate NDCG (simplified - binary relevance)
  let dcg = 0;
  let idcg = 0;
  
  // DCG for actual ranking
  for (let i = 0; i < retrievedTools.length; i++) {
    const relevance = expectedSet.has(retrievedTools[i]) ? 1 : 0;
    dcg += relevance / Math.log2(i + 2);
  }
  
  // IDCG for ideal ranking (all relevant tools first)
  for (let i = 0; i < Math.min(expectedTools.length, retrievedTools.length); i++) {
    idcg += 1 / Math.log2(i + 2);
  }
  
  const ndcg = idcg > 0 ? dcg / idcg : 0;
  
  return {
    precision,
    recall,
    mrr,
    ndcg,
    avgRelevantRank
  };
}

/**
 * Aggregate metrics across test cases
 */
function aggregateMetrics(metrics: Metrics[]): Metrics {
  const count = metrics.length;
  return {
    precision: metrics.reduce((sum, m) => sum + m.precision, 0) / count,
    recall: metrics.reduce((sum, m) => sum + m.recall, 0) / count,
    mrr: metrics.reduce((sum, m) => sum + m.mrr, 0) / count,
    ndcg: metrics.reduce((sum, m) => sum + m.ndcg, 0) / count,
    avgRelevantRank: metrics.reduce((sum, m) => sum + m.avgRelevantRank, 0) / count
  };
}

/**
 * Run benchmark comparison
 */
async function runBenchmark() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Server Description Embedding Benchmark');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log(`Testing ${testCases.length} queries against ${servers.length} servers\n`);
  
  // Initialize both filters
  console.log('Initializing filters...\n');
  
  const filterWithoutServer = new MCPToolFilter({
    embedding: {
      provider: 'local',
      quantized: true
    },
    includeServerDescription: false,
    debug: false
  });
  
  const filterWithServer = new MCPToolFilter({
    embedding: {
      provider: 'local',
      quantized: true
    },
    includeServerDescription: true,
    debug: false
  });
  
  await Promise.all([
    filterWithoutServer.initialize(servers),
    filterWithServer.initialize(servers)
  ]);
  
  console.log('✓ Both filters initialized\n');
  
  // Run tests
  const resultsWithout: Metrics[] = [];
  const resultsWith: Metrics[] = [];
  
  const metricsByCategory = {
    specific: { without: [] as Metrics[], with: [] as Metrics[] },
    general: { without: [] as Metrics[], with: [] as Metrics[] },
    domain: { without: [] as Metrics[], with: [] as Metrics[] },
    ambiguous: { without: [] as Metrics[], with: [] as Metrics[] }
  };
  
  console.log('Running test cases...\n');
  console.log('─'.repeat(80));
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    
    // Filter with both configurations
    const [resultWithout, resultWith] = await Promise.all([
      filterWithoutServer.filter(testCase.query, { topK: 10 }),
      filterWithServer.filter(testCase.query, { topK: 10 })
    ]);
    
    // Calculate metrics
    const metricsWithout = calculateMetrics(resultWithout, testCase.expectedTools);
    const metricsWith = calculateMetrics(resultWith, testCase.expectedTools);
    
    resultsWithout.push(metricsWithout);
    resultsWith.push(metricsWith);
    
    metricsByCategory[testCase.category].without.push(metricsWithout);
    metricsByCategory[testCase.category].with.push(metricsWith);
    
    // Print per-query results
    console.log(`\nTest ${i + 1}/${testCases.length}: ${testCase.query}`);
    console.log(`Category: ${testCase.category} | ${testCase.description}`);
    console.log(`Expected: ${testCase.expectedTools.join(', ')}\n`);
    
    console.log('WITHOUT server description:');
    console.log(`  Top 3: ${resultWithout.tools.slice(0, 3).map(t => t.toolName).join(', ')}`);
    console.log(`  MRR: ${metricsWithout.mrr.toFixed(3)} | NDCG: ${metricsWithout.ndcg.toFixed(3)} | Avg Rank: ${metricsWithout.avgRelevantRank.toFixed(1)}`);
    
    console.log('WITH server description:');
    console.log(`  Top 3: ${resultWith.tools.slice(0, 3).map(t => t.toolName).join(', ')}`);
    console.log(`  MRR: ${metricsWith.mrr.toFixed(3)} | NDCG: ${metricsWith.ndcg.toFixed(3)} | Avg Rank: ${metricsWith.avgRelevantRank.toFixed(1)}`);
    
    // Highlight improvement/degradation
    const mrrDiff = metricsWith.mrr - metricsWithout.mrr;
    const ndcgDiff = metricsWith.ndcg - metricsWithout.ndcg;
    
    if (mrrDiff > 0.05 || ndcgDiff > 0.05) {
      console.log(`  ✓ IMPROVEMENT: +${(mrrDiff * 100).toFixed(1)}% MRR, +${(ndcgDiff * 100).toFixed(1)}% NDCG`);
    } else if (mrrDiff < -0.05 || ndcgDiff < -0.05) {
      console.log(`  ✗ DEGRADATION: ${(mrrDiff * 100).toFixed(1)}% MRR, ${(ndcgDiff * 100).toFixed(1)}% NDCG`);
    } else {
      console.log(`  ≈ NEUTRAL: Similar performance`);
    }
    
    console.log('─'.repeat(80));
  }
  
  // Print overall summary
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('  OVERALL RESULTS');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const overallWithout = aggregateMetrics(resultsWithout);
  const overallWith = aggregateMetrics(resultsWith);
  
  console.log('┌─────────────────────┬──────────────┬──────────────┬──────────────┐');
  console.log('│ Metric              │   WITHOUT    │     WITH     │     DIFF     │');
  console.log('├─────────────────────┼──────────────┼──────────────┼──────────────┤');
  
  const metrics = [
    { name: 'Precision', key: 'precision' as const },
    { name: 'Recall', key: 'recall' as const },
    { name: 'MRR', key: 'mrr' as const },
    { name: 'NDCG', key: 'ndcg' as const },
    { name: 'Avg Relevant Rank', key: 'avgRelevantRank' as const }
  ];
  
  for (const metric of metrics) {
    const without = overallWithout[metric.key];
    const with_ = overallWith[metric.key];
    const diff = with_ - without;
    const diffStr = diff > 0 ? `+${diff.toFixed(3)}` : diff.toFixed(3);
    
    console.log(`│ ${metric.name.padEnd(19)} │ ${without.toFixed(3).padStart(12)} │ ${with_.toFixed(3).padStart(12)} │ ${diffStr.padStart(12)} │`);
  }
  
  console.log('└─────────────────────┴──────────────┴──────────────┴──────────────┘\n');
  
  // Print category breakdown
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  RESULTS BY CATEGORY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  for (const [category, results] of Object.entries(metricsByCategory)) {
    if (results.without.length === 0) continue;
    
    const avgWithout = aggregateMetrics(results.without);
    const avgWith = aggregateMetrics(results.with);
    
    console.log(`${category.toUpperCase()} (${results.without.length} queries):`);
    console.log('─'.repeat(60));
    console.log(`  MRR:  ${avgWithout.mrr.toFixed(3)} → ${avgWith.mrr.toFixed(3)} (${((avgWith.mrr - avgWithout.mrr) * 100).toFixed(1)}%)`);
    console.log(`  NDCG: ${avgWithout.ndcg.toFixed(3)} → ${avgWith.ndcg.toFixed(3)} (${((avgWith.ndcg - avgWithout.ndcg) * 100).toFixed(1)}%)`);
    console.log(`  Avg Rank: ${avgWithout.avgRelevantRank.toFixed(1)} → ${avgWith.avgRelevantRank.toFixed(1)}\n`);
  }
  
  // Final verdict
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  VERDICT');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const mrrImprovement = ((overallWith.mrr - overallWithout.mrr) / overallWithout.mrr) * 100;
  const ndcgImprovement = ((overallWith.ndcg - overallWithout.ndcg) / overallWithout.ndcg) * 100;
  
  if (mrrImprovement > 5 && ndcgImprovement > 5) {
    console.log('✓ STRONG IMPROVEMENT: Including server descriptions significantly');
    console.log('  improves search quality across most query types.');
    console.log(`  Overall improvement: ${mrrImprovement.toFixed(1)}% MRR, ${ndcgImprovement.toFixed(1)}% NDCG\n`);
    console.log('  RECOMMENDATION: Enable includeServerDescription: true\n');
  } else if (mrrImprovement > 2 && ndcgImprovement > 2) {
    console.log('≈ MODERATE IMPROVEMENT: Including server descriptions provides');
    console.log('  modest improvements in search quality.');
    console.log(`  Overall improvement: ${mrrImprovement.toFixed(1)}% MRR, ${ndcgImprovement.toFixed(1)}% NDCG\n`);
    console.log('  RECOMMENDATION: Consider enabling based on your use case\n');
  } else if (mrrImprovement < -2 || ndcgImprovement < -2) {
    console.log('✗ DEGRADATION: Including server descriptions hurts search quality.');
    console.log(`  Overall change: ${mrrImprovement.toFixed(1)}% MRR, ${ndcgImprovement.toFixed(1)}% NDCG\n`);
    console.log('  RECOMMENDATION: Keep includeServerDescription: false\n');
  } else {
    console.log('≈ NEUTRAL: Server descriptions have minimal impact on search quality.');
    console.log(`  Overall change: ${mrrImprovement.toFixed(1)}% MRR, ${ndcgImprovement.toFixed(1)}% NDCG\n`);
    console.log('  RECOMMENDATION: Keep disabled for simpler embeddings\n');
  }
}

// Run the benchmark
runBenchmark().catch(console.error);

