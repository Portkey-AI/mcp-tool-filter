/**
 * Example: Using MCP Tool Filter with Portkey AI Gateway
 * 
 * This example shows how to:
 * 1. Filter tools based on conversation context
 * 2. Use Portkey for both embeddings and LLM calls
 * 3. Handle tool calls in the response
 */

import Portkey from 'portkey-ai';
import { MCPToolFilter, MCPServer } from '../src';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  // Initialize Portkey client
  const portkey = new Portkey({
    apiKey: process.env.PORTKEY_API_KEY,
    // You can use virtual keys for different providers
  });
  
  // Load MCP servers
  const servers: MCPServer[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'mcp-servers.json'), 'utf-8')
  );
  
  // Initialize tool filter with Portkey's gateway for embeddings
  const filter = new MCPToolFilter({
    embedding: {
      provider: 'openai',
      apiKey: process.env.PORTKEY_API_KEY,
      baseURL: 'https://api.portkey.ai/v1', // Use Portkey gateway
      model: 'text-embedding-3-small',
    },
    defaultOptions: {
      topK: 15,
      minScore: 0.35,
      alwaysInclude: ['web_search'], // Always include web search
    },
    debug: true,
  });
  
  await filter.initialize(servers);
  console.log('✅ Filter initialized\n');
  
  // Conversation history
  const messages = [
    {
      role: 'user' as const,
      content: 'Can you check my calendar and see if I have any meetings with the engineering team next week? Also search my emails for any recent messages from Sarah about the Q4 planning.'
    }
  ];
  
  // Step 1: Filter relevant tools
  console.log('🔍 Filtering tools...');
  const { tools, metrics } = await filter.filter(messages);
  
  console.log(`Found ${tools.length} relevant tools in ${metrics.totalTime}ms:`);
  tools.forEach((tool, i) => {
    console.log(`  ${i + 1}. ${tool.toolName} (${tool.serverId}) - score: ${tool.score.toFixed(3)}`);
  });
  console.log();
  
  // Step 2: Convert to OpenAI tool format
  const openaiTools = tools.map(t => ({
    type: 'function' as const,
    function: {
      name: t.toolName,
      description: t.tool.description,
      parameters: t.tool.inputSchema || {
        type: 'object',
        properties: {},
      },
    },
  }));
  
  // Step 3: Make LLM call with filtered tools
  console.log('🤖 Calling LLM with filtered tools...');
  const completion = await portkey.chat.completions.create({
    model: 'gpt-4o',
    messages: messages,
    tools: openaiTools,
    tool_choice: 'auto',
  });
  
  const assistantMessage = completion.choices[0].message;
  console.log('Assistant response:', assistantMessage.content);
  
  // Step 4: Handle tool calls if present
  if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
    console.log('\n🔧 Tool calls requested:');
    assistantMessage.tool_calls.forEach(tc => {
      console.log(`  - ${tc.function.name}`);
      console.log(`    Args: ${tc.function.arguments}`);
    });
    
    // In a real implementation, you would:
    // 1. Execute the tool calls
    // 2. Add results to conversation
    // 3. Continue the conversation with filtered tools again
  }
  
  // Step 5: Example of multi-turn with tool filtering
  console.log('\n📊 Stats for this request:');
  console.log(`  Tools evaluated: ${metrics.toolsEvaluated}`);
  console.log(`  Tools sent to LLM: ${tools.length}`);
  console.log(`  Context reduction: ${((1 - tools.length / metrics.toolsEvaluated) * 100).toFixed(1)}%`);
}

// Advanced: Create a reusable agent class
class MCPAgent {
  private filter: MCPToolFilter;
  private portkey: Portkey;
  private conversationHistory: any[] = [];
  
  constructor(
    filterConfig: any,
    portkeyConfig: any,
    private servers: MCPServer[]
  ) {
    this.filter = new MCPToolFilter(filterConfig);
    this.portkey = new Portkey(portkeyConfig);
  }
  
  async initialize() {
    await this.filter.initialize(this.servers);
  }
  
  async chat(userMessage: string): Promise<string> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });
    
    // Filter relevant tools
    const { tools } = await this.filter.filter(this.conversationHistory);
    
    // Convert to OpenAI format
    const openaiTools = tools.map(t => ({
      type: 'function' as const,
      function: {
        name: t.toolName,
        description: t.tool.description,
        parameters: t.tool.inputSchema || { type: 'object', properties: {} },
      },
    }));
    
    // Call LLM
    const completion = await this.portkey.chat.completions.create({
      model: 'gpt-4o',
      messages: this.conversationHistory,
      tools: openaiTools,
    });
    
    const assistantMessage = completion.choices[0].message;
    
    // Add assistant message to history
    this.conversationHistory.push(assistantMessage);
    
    // Handle tool calls if needed
    if (assistantMessage.tool_calls) {
      // Execute tools and continue...
      // (implementation depends on your tool execution strategy)
    }
    
    return assistantMessage.content || '';
  }
  
  clearHistory() {
    this.conversationHistory = [];
  }
}

// Example usage
async function agentExample() {
  const agent = new MCPAgent(
    {
      embedding: {
        provider: 'openai',
        apiKey: process.env.PORTKEY_API_KEY,
        baseURL: 'https://api.portkey.ai/v1',
      },
    },
    {
      apiKey: process.env.PORTKEY_API_KEY,
    },
    JSON.parse(
      fs.readFileSync(path.join(__dirname, 'mcp-servers.json'), 'utf-8')
    )
  );
  
  await agent.initialize();
  
  // Multi-turn conversation
  const response1 = await agent.chat("What's on my calendar today?");
  console.log('Response 1:', response1);
  
  const response2 = await agent.chat("Send a message about it to the team");
  console.log('Response 2:', response2);
}

// Run examples
if (require.main === module) {
  main().catch(console.error);
}
