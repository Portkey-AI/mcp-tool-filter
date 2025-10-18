/**
 * Comprehensive benchmark comparing three approaches:
 * 1. All tools to LLM (120 tools - within OpenAI limit)
 * 2. OpenAI embeddings filtering + LLM
 * 3. Local embeddings filtering + LLM
 * 
 * Run with: npx ts-node examples/benchmark-fair.ts
 */

import { MCPToolFilter, MCPServer } from '../src';
import OpenAI from 'openai';

// ============================================
// Mock MCP Servers (20 servers, 120 tools total = 6 tools each)
// ============================================

const mockServers: MCPServer[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    tools: [
      { name: 'gmail_search', description: 'Search emails in Gmail inbox using queries', keywords: ['email', 'search', 'find', 'inbox'] },
      { name: 'gmail_send', description: 'Send an email to recipients', keywords: ['email', 'send', 'compose', 'write'] },
      { name: 'gmail_read', description: 'Read email content by ID', keywords: ['email', 'read', 'view', 'open'] },
      { name: 'gmail_delete', description: 'Delete emails by ID', keywords: ['email', 'delete', 'remove', 'trash'] },
      { name: 'gmail_archive', description: 'Archive emails', keywords: ['email', 'archive', 'store'] },
      { name: 'gmail_label', description: 'Add labels to emails', keywords: ['email', 'label', 'tag', 'organize'] },
    ],
  },
  {
    id: 'gcal',
    name: 'Google Calendar',
    tools: [
      { name: 'gcal_list', description: 'List calendar events for a date range', keywords: ['calendar', 'events', 'list', 'schedule'] },
      { name: 'gcal_create', description: 'Create new calendar event', keywords: ['calendar', 'create', 'add', 'schedule', 'meeting'] },
      { name: 'gcal_update', description: 'Update existing event', keywords: ['calendar', 'update', 'edit', 'modify'] },
      { name: 'gcal_delete', description: 'Delete calendar event', keywords: ['calendar', 'delete', 'remove', 'cancel'] },
      { name: 'gcal_find_time', description: 'Find available time slots', keywords: ['calendar', 'availability', 'free', 'time'] },
      { name: 'gcal_invite', description: 'Send calendar invites', keywords: ['calendar', 'invite', 'attendees', 'guests'] },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    tools: [
      { name: 'slack_message', description: 'Send message to channel or user', keywords: ['slack', 'message', 'send', 'chat'] },
      { name: 'slack_search', description: 'Search messages in Slack', keywords: ['slack', 'search', 'find', 'messages'] },
      { name: 'slack_channel_create', description: 'Create new Slack channel', keywords: ['slack', 'channel', 'create', 'new'] },
      { name: 'slack_file_upload', description: 'Upload file to Slack', keywords: ['slack', 'file', 'upload', 'share'] },
      { name: 'slack_reaction', description: 'Add reaction to message', keywords: ['slack', 'reaction', 'emoji', 'respond'] },
      { name: 'slack_status', description: 'Set user status', keywords: ['slack', 'status', 'presence', 'availability'] },
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    tools: [
      { name: 'github_repo_create', description: 'Create new repository', keywords: ['github', 'repo', 'create', 'new'] },
      { name: 'github_issue_create', description: 'Create issue', keywords: ['github', 'issue', 'create', 'bug', 'task'] },
      { name: 'github_issue_list', description: 'List issues', keywords: ['github', 'issue', 'list', 'search'] },
      { name: 'github_pr_create', description: 'Create pull request', keywords: ['github', 'pr', 'pull request', 'create'] },
      { name: 'github_commit', description: 'Get commit information', keywords: ['github', 'commit', 'history', 'changes'] },
      { name: 'github_branch', description: 'Manage branches', keywords: ['github', 'branch', 'create', 'delete'] },
    ],
  },
  {
    id: 'jira',
    name: 'Jira',
    tools: [
      { name: 'jira_issue_create', description: 'Create Jira issue', keywords: ['jira', 'issue', 'ticket', 'create', 'task'] },
      { name: 'jira_issue_update', description: 'Update issue', keywords: ['jira', 'issue', 'update', 'edit'] },
      { name: 'jira_issue_search', description: 'Search issues with JQL', keywords: ['jira', 'issue', 'search', 'find', 'query'] },
      { name: 'jira_sprint_create', description: 'Create sprint', keywords: ['jira', 'sprint', 'create', 'agile'] },
      { name: 'jira_comment', description: 'Add comment to issue', keywords: ['jira', 'comment', 'reply', 'discuss'] },
      { name: 'jira_assign', description: 'Assign issue to user', keywords: ['jira', 'assign', 'assignee', 'owner'] },
    ],
  },
  {
    id: 'notion',
    name: 'Notion',
    tools: [
      { name: 'notion_page_create', description: 'Create new page', keywords: ['notion', 'page', 'create', 'note', 'document'] },
      { name: 'notion_page_read', description: 'Read page content', keywords: ['notion', 'page', 'read', 'view', 'open'] },
      { name: 'notion_page_update', description: 'Update page content', keywords: ['notion', 'page', 'update', 'edit'] },
      { name: 'notion_database_query', description: 'Query database', keywords: ['notion', 'database', 'query', 'search', 'filter'] },
      { name: 'notion_database_create', description: 'Create database', keywords: ['notion', 'database', 'create', 'table'] },
      { name: 'notion_search', description: 'Search across workspace', keywords: ['notion', 'search', 'find', 'query'] },
    ],
  },
  {
    id: 'drive',
    name: 'Google Drive',
    tools: [
      { name: 'drive_upload', description: 'Upload file to Drive', keywords: ['drive', 'upload', 'file', 'store'] },
      { name: 'drive_download', description: 'Download file', keywords: ['drive', 'download', 'file', 'get'] },
      { name: 'drive_list', description: 'List files and folders', keywords: ['drive', 'list', 'browse', 'files'] },
      { name: 'drive_search', description: 'Search for files', keywords: ['drive', 'search', 'find', 'query'] },
      { name: 'drive_share', description: 'Share file or folder', keywords: ['drive', 'share', 'permissions', 'access'] },
      { name: 'drive_delete', description: 'Delete file', keywords: ['drive', 'delete', 'remove', 'trash'] },
    ],
  },
  {
    id: 'sheets',
    name: 'Google Sheets',
    tools: [
      { name: 'sheets_create', description: 'Create new spreadsheet', keywords: ['sheets', 'spreadsheet', 'create', 'new'] },
      { name: 'sheets_read', description: 'Read cell values', keywords: ['sheets', 'read', 'get', 'cell', 'data'] },
      { name: 'sheets_write', description: 'Write to cells', keywords: ['sheets', 'write', 'update', 'cell'] },
      { name: 'sheets_append', description: 'Append rows', keywords: ['sheets', 'append', 'add', 'row'] },
      { name: 'sheets_format', description: 'Format cells', keywords: ['sheets', 'format', 'style', 'color'] },
      { name: 'sheets_chart', description: 'Create chart', keywords: ['sheets', 'chart', 'graph', 'visualize'] },
    ],
  },
  {
    id: 'trello',
    name: 'Trello',
    tools: [
      { name: 'trello_board_create', description: 'Create board', keywords: ['trello', 'board', 'create', 'new'] },
      { name: 'trello_card_create', description: 'Create card', keywords: ['trello', 'card', 'create', 'task'] },
      { name: 'trello_card_update', description: 'Update card', keywords: ['trello', 'card', 'update', 'edit'] },
      { name: 'trello_list_create', description: 'Create list', keywords: ['trello', 'list', 'column', 'create'] },
      { name: 'trello_comment', description: 'Add comment', keywords: ['trello', 'comment', 'reply', 'discuss'] },
      { name: 'trello_label', description: 'Add label', keywords: ['trello', 'label', 'tag', 'category'] },
    ],
  },
  {
    id: 'zoom',
    name: 'Zoom',
    tools: [
      { name: 'zoom_meeting_create', description: 'Create meeting', keywords: ['zoom', 'meeting', 'create', 'schedule'] },
      { name: 'zoom_meeting_list', description: 'List meetings', keywords: ['zoom', 'meeting', 'list', 'upcoming'] },
      { name: 'zoom_meeting_delete', description: 'Delete meeting', keywords: ['zoom', 'meeting', 'delete', 'cancel'] },
      { name: 'zoom_recording_list', description: 'List recordings', keywords: ['zoom', 'recording', 'list', 'past'] },
      { name: 'zoom_user_list', description: 'List users', keywords: ['zoom', 'user', 'list', 'members'] },
      { name: 'zoom_webinar_create', description: 'Create webinar', keywords: ['zoom', 'webinar', 'create', 'event'] },
    ],
  },
  {
    id: 'asana',
    name: 'Asana',
    tools: [
      { name: 'asana_task_create', description: 'Create task', keywords: ['asana', 'task', 'create', 'todo'] },
      { name: 'asana_task_update', description: 'Update task', keywords: ['asana', 'task', 'update', 'edit'] },
      { name: 'asana_project_create', description: 'Create project', keywords: ['asana', 'project', 'create', 'new'] },
      { name: 'asana_project_list', description: 'List projects', keywords: ['asana', 'project', 'list', 'browse'] },
      { name: 'asana_comment', description: 'Add comment', keywords: ['asana', 'comment', 'reply', 'discuss'] },
      { name: 'asana_tag', description: 'Add tag', keywords: ['asana', 'tag', 'label', 'category'] },
    ],
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    tools: [
      { name: 'dropbox_upload', description: 'Upload file', keywords: ['dropbox', 'upload', 'file', 'store'] },
      { name: 'dropbox_download', description: 'Download file', keywords: ['dropbox', 'download', 'file', 'get'] },
      { name: 'dropbox_list', description: 'List files', keywords: ['dropbox', 'list', 'browse', 'files'] },
      { name: 'dropbox_search', description: 'Search files', keywords: ['dropbox', 'search', 'find', 'query'] },
      { name: 'dropbox_share', description: 'Share file', keywords: ['dropbox', 'share', 'link', 'access'] },
      { name: 'dropbox_delete', description: 'Delete file', keywords: ['dropbox', 'delete', 'remove'] },
    ],
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    tools: [
      { name: 'twitter_tweet', description: 'Post tweet', keywords: ['twitter', 'tweet', 'post', 'publish'] },
      { name: 'twitter_reply', description: 'Reply to tweet', keywords: ['twitter', 'reply', 'respond', 'comment'] },
      { name: 'twitter_retweet', description: 'Retweet', keywords: ['twitter', 'retweet', 'share', 'amplify'] },
      { name: 'twitter_search', description: 'Search tweets', keywords: ['twitter', 'search', 'find', 'query'] },
      { name: 'twitter_timeline', description: 'Get timeline', keywords: ['twitter', 'timeline', 'feed', 'home'] },
      { name: 'twitter_dm', description: 'Send direct message', keywords: ['twitter', 'dm', 'message', 'direct'] },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    tools: [
      { name: 'linkedin_post', description: 'Create post', keywords: ['linkedin', 'post', 'publish', 'share'] },
      { name: 'linkedin_comment', description: 'Comment on post', keywords: ['linkedin', 'comment', 'reply', 'engage'] },
      { name: 'linkedin_share', description: 'Share post', keywords: ['linkedin', 'share', 'repost', 'amplify'] },
      { name: 'linkedin_message', description: 'Send message', keywords: ['linkedin', 'message', 'chat', 'dm'] },
      { name: 'linkedin_connect', description: 'Send connection request', keywords: ['linkedin', 'connect', 'network', 'invite'] },
      { name: 'linkedin_job_search', description: 'Search jobs', keywords: ['linkedin', 'job', 'search', 'career'] },
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    tools: [
      { name: 'stripe_payment_create', description: 'Create payment', keywords: ['stripe', 'payment', 'charge', 'create'] },
      { name: 'stripe_payment_list', description: 'List payments', keywords: ['stripe', 'payment', 'list', 'history'] },
      { name: 'stripe_refund', description: 'Refund payment', keywords: ['stripe', 'refund', 'return', 'cancel'] },
      { name: 'stripe_customer_create', description: 'Create customer', keywords: ['stripe', 'customer', 'create', 'new'] },
      { name: 'stripe_subscription_create', description: 'Create subscription', keywords: ['stripe', 'subscription', 'recurring', 'create'] },
      { name: 'stripe_balance', description: 'Check balance', keywords: ['stripe', 'balance', 'funds', 'account'] },
    ],
  },
  {
    id: 'shopify',
    name: 'Shopify',
    tools: [
      { name: 'shopify_product_create', description: 'Create product', keywords: ['shopify', 'product', 'create', 'add'] },
      { name: 'shopify_product_list', description: 'List products', keywords: ['shopify', 'product', 'list', 'browse'] },
      { name: 'shopify_order_list', description: 'List orders', keywords: ['shopify', 'order', 'list', 'sales'] },
      { name: 'shopify_order_fulfill', description: 'Fulfill order', keywords: ['shopify', 'order', 'fulfill', 'ship'] },
      { name: 'shopify_customer_list', description: 'List customers', keywords: ['shopify', 'customer', 'list', 'users'] },
      { name: 'shopify_inventory', description: 'Update inventory', keywords: ['shopify', 'inventory', 'stock', 'quantity'] },
    ],
  },
  {
    id: 'aws',
    name: 'AWS',
    tools: [
      { name: 'aws_ec2_launch', description: 'Launch EC2 instance', keywords: ['aws', 'ec2', 'instance', 'launch', 'server'] },
      { name: 'aws_ec2_list', description: 'List EC2 instances', keywords: ['aws', 'ec2', 'instance', 'list'] },
      { name: 'aws_s3_upload', description: 'Upload to S3', keywords: ['aws', 's3', 'upload', 'bucket', 'file'] },
      { name: 'aws_s3_download', description: 'Download from S3', keywords: ['aws', 's3', 'download', 'bucket', 'file'] },
      { name: 'aws_lambda_invoke', description: 'Invoke Lambda', keywords: ['aws', 'lambda', 'invoke', 'function'] },
      { name: 'aws_cloudwatch', description: 'Get CloudWatch metrics', keywords: ['aws', 'cloudwatch', 'metrics', 'monitoring'] },
    ],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    tools: [
      { name: 'sf_lead_create', description: 'Create lead', keywords: ['salesforce', 'lead', 'create', 'prospect'] },
      { name: 'sf_opportunity_create', description: 'Create opportunity', keywords: ['salesforce', 'opportunity', 'deal', 'create'] },
      { name: 'sf_account_create', description: 'Create account', keywords: ['salesforce', 'account', 'company', 'create'] },
      { name: 'sf_contact_create', description: 'Create contact', keywords: ['salesforce', 'contact', 'person', 'create'] },
      { name: 'sf_task_create', description: 'Create task', keywords: ['salesforce', 'task', 'todo', 'create'] },
      { name: 'sf_report', description: 'Run report', keywords: ['salesforce', 'report', 'analytics', 'data'] },
    ],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    tools: [
      { name: 'hs_contact_create', description: 'Create contact', keywords: ['hubspot', 'contact', 'create', 'lead'] },
      { name: 'hs_company_create', description: 'Create company', keywords: ['hubspot', 'company', 'create', 'account'] },
      { name: 'hs_deal_create', description: 'Create deal', keywords: ['hubspot', 'deal', 'create', 'opportunity'] },
      { name: 'hs_email_send', description: 'Send email', keywords: ['hubspot', 'email', 'send', 'campaign'] },
      { name: 'hs_workflow', description: 'Create workflow', keywords: ['hubspot', 'workflow', 'automation', 'sequence'] },
      { name: 'hs_analytics', description: 'Get analytics', keywords: ['hubspot', 'analytics', 'report', 'metrics'] },
    ],
  },
  {
    id: 'intercom',
    name: 'Intercom',
    tools: [
      { name: 'intercom_message_send', description: 'Send message', keywords: ['intercom', 'message', 'send', 'chat'] },
      { name: 'intercom_user_create', description: 'Create user', keywords: ['intercom', 'user', 'contact', 'create'] },
      { name: 'intercom_conversation_list', description: 'List conversations', keywords: ['intercom', 'conversation', 'list', 'chat'] },
      { name: 'intercom_conversation_reply', description: 'Reply to conversation', keywords: ['intercom', 'conversation', 'reply', 'respond'] },
      { name: 'intercom_tag', description: 'Add tag', keywords: ['intercom', 'tag', 'label', 'category'] },
      { name: 'intercom_article', description: 'Create help article', keywords: ['intercom', 'article', 'help', 'documentation'] },
    ],
  },
];

// Calculate total tools
const totalTools = mockServers.reduce((acc, server) => acc + server.tools.length, 0);
console.log(`📊 Total MCP Servers: ${mockServers.length}`);
console.log(`📊 Total Tools: ${totalTools}\n`);

// ============================================
// Test Queries with Ground Truth (50 queries)
// ============================================

interface TestQuery {
  query: string;
  expected: string[]; // Expected tool names (ground truth)
}

const testQueries: TestQuery[] = [
  // Email queries
  { query: "Search for emails from John about the project deadline", expected: ['gmail_search'] },
  { query: "Send an email to the team about tomorrow's meeting", expected: ['gmail_send'] },
  { query: "Find all unread emails in my inbox", expected: ['gmail_search'] },
  { query: "Read the email from Sarah about the proposal", expected: ['gmail_read'] },
  { query: "Delete all spam emails from last week", expected: ['gmail_delete'] },
  
  // Calendar queries
  { query: "What meetings do I have today?", expected: ['gcal_list'] },
  { query: "Schedule a meeting with the design team for next Tuesday at 2pm", expected: ['gcal_create'] },
  { query: "Cancel my 3pm meeting tomorrow", expected: ['gcal_delete'] },
  { query: "Find available time slots next week for a 1-hour meeting", expected: ['gcal_find_time'] },
  { query: "Update the client call to 4pm instead", expected: ['gcal_update'] },
  
  // Slack/Communication
  { query: "Send a message in the #engineering channel", expected: ['slack_message'] },
  { query: "Search for messages about the Q4 roadmap in Slack", expected: ['slack_search'] },
  { query: "Create a new Slack channel for the new project", expected: ['slack_channel_create'] },
  { query: "Upload the presentation to our team Slack", expected: ['slack_file_upload'] },
  { query: "Set my Slack status to 'In a meeting'", expected: ['slack_status'] },
  
  // GitHub/Development
  { query: "Create a new GitHub repository for the mobile app", expected: ['github_repo_create'] },
  { query: "List all open issues in the backend repo", expected: ['github_issue_list'] },
  { query: "Create a pull request for the authentication feature", expected: ['github_pr_create'] },
  { query: "File a bug report about the login page", expected: ['github_issue_create'] },
  { query: "Check the commit history for the API changes", expected: ['github_commit'] },
  
  // Jira/Project Management
  { query: "Create a new bug ticket in Jira", expected: ['jira_issue_create'] },
  { query: "Search for all high-priority tasks assigned to me", expected: ['jira_issue_search'] },
  { query: "Update the status of PROJ-123 to In Progress", expected: ['jira_issue_update'] },
  { query: "Add a comment to the database migration ticket", expected: ['jira_comment'] },
  { query: "Create a new sprint for Q1 2024", expected: ['jira_sprint_create'] },
  
  // File Management
  { query: "Upload the Q4 report to Google Drive", expected: ['drive_upload'] },
  { query: "Share the design mockups folder with the team", expected: ['drive_share'] },
  { query: "Search for the contract document in Drive", expected: ['drive_search'] },
  { query: "Download the latest version of the presentation", expected: ['drive_download'] },
  { query: "List all files in the clients folder", expected: ['drive_list'] },
  
  // Spreadsheets/Data
  { query: "Create a new spreadsheet for the budget", expected: ['sheets_create'] },
  { query: "Add a row to the sales tracking sheet", expected: ['sheets_append'] },
  { query: "Update the revenue numbers in the Q4 sheet", expected: ['sheets_write'] },
  { query: "Read the data from cell A1 to D10", expected: ['sheets_read'] },
  { query: "Create a chart showing monthly growth", expected: ['sheets_chart'] },
  
  // Notion/Documentation
  { query: "Create a new page for the product spec", expected: ['notion_page_create'] },
  { query: "Update the engineering handbook", expected: ['notion_page_update'] },
  { query: "Search for the onboarding documentation", expected: ['notion_search'] },
  { query: "Read the design system page", expected: ['notion_page_read'] },
  { query: "Query the project database for active projects", expected: ['notion_database_query'] },
  
  // Task Management
  { query: "Create a task to review the API documentation", expected: ['asana_task_create'] },
  { query: "Update the deployment task as complete", expected: ['asana_task_update'] },
  { query: "Create a new Asana project for the website redesign", expected: ['asana_project_create'] },
  { query: "Add a tag to categorize the marketing tasks", expected: ['asana_tag'] },
  { query: "List all active projects in Asana", expected: ['asana_project_list'] },
  
  // Video Conferencing
  { query: "Schedule a Zoom call for tomorrow at 10am", expected: ['zoom_meeting_create'] },
  { query: "List all my upcoming Zoom meetings", expected: ['zoom_meeting_list'] },
  { query: "Cancel the client call next Thursday", expected: ['zoom_meeting_delete'] },
  { query: "Get the recording from yesterday's all-hands", expected: ['zoom_recording_list'] },
  { query: "Create a webinar for the product launch", expected: ['zoom_webinar_create'] },
];

console.log(`📋 Test Queries: ${testQueries.length}\n`);

// ============================================
// Helper Functions
// ============================================

interface BenchmarkResult {
  approach: string;
  latencies: number[];
  costs: number[];
  toolCounts: number[];
  errors: number;
  filteringMetrics: {
    toolsAvailableCount: number;  // How many times required tools were available
    totalRecall: number[];        // Recall for each query
    totalPrecision: number[];     // Precision for each query
  };
  failures: Array<{              // Track failures for analysis
    query: string;
    expected: string[];
    sent: string[];
    recall: number;
  }>;
}

// Convert tools to OpenAI format
function toolsToOpenAIFormat(tools: any[]): any[] {
  return tools.map(t => ({
    type: 'function',
    function: {
      name: t.toolName || t.name,
      description: (t.tool || t).description,
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  }));
}

// Calculate token cost
function calculateCost(promptTokens: number, completionTokens: number, embeddingTokens: number = 0): number {
  const promptCost = (promptTokens / 1_000_000) * 0.150;
  const completionCost = (completionTokens / 1_000_000) * 0.600;
  const embeddingCost = (embeddingTokens / 1_000_000) * 0.020;
  return promptCost + completionCost + embeddingCost;
}

// Estimate tokens
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Calculate accuracy metrics - measures if required tools were available
function calculateAccuracy(sentTools: string[], expectedTools: string[]): {
  toolsAvailable: boolean;  // Were ALL required tools sent to LLM?
  recall: number;           // What % of required tools were sent?
  precision: number;        // What % of sent tools were actually needed?
} {
  const expectedSet = new Set(expectedTools);
  const sentSet = new Set(sentTools);
  
  // Check if all required tools were available
  const availableCount = expectedTools.filter(t => sentSet.has(t)).length;
  const toolsAvailable = availableCount === expectedTools.length;
  
  // Recall: what % of required tools were sent
  const recall = expectedTools.length > 0 ? availableCount / expectedTools.length : 1;
  
  // Precision: what % of sent tools were actually needed
  const neededCount = sentTools.filter(t => expectedSet.has(t)).length;
  const precision = sentTools.length > 0 ? neededCount / sentTools.length : 0;
  
  return { toolsAvailable, recall, precision };
}

// ============================================
// Main Benchmark
// ============================================

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable required');
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  console.log('🚀 Starting Fair Comprehensive Benchmark\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Prepare all tools
  const allTools = mockServers.flatMap(server =>
    server.tools.map(tool => ({ ...tool, serverId: server.id }))
  );
  const allToolsOpenAI = toolsToOpenAIFormat(allTools);

  console.log(`✅ All approaches can use all ${allTools.length} tools (within OpenAI's 128 limit)\n`);

  // Initialize filters
  console.log('Initializing embedding filters...\n');
  
  const apiFilter = new MCPToolFilter({
    embedding: {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: 'text-embedding-3-small',
      dimensions: 384,
    },
    defaultOptions: {
      topK: 20,
      minScore: 0.3,
    },
  });

  const localFilter = new MCPToolFilter({
    embedding: {
      provider: 'local',
      model: 'Xenova/all-MiniLM-L6-v2',
      quantized: true,
    },
    defaultOptions: {
      topK: 20,
      minScore: 0.3,
    },
  });

  console.log('Initializing API filter...');
  const apiInitStart = Date.now();
  await apiFilter.initialize(mockServers);
  const apiInitTime = Date.now() - apiInitStart;
  console.log(`✓ API filter initialized: ${apiInitTime}ms\n`);

  console.log('Initializing local filter...');
  const localInitStart = Date.now();
  await localFilter.initialize(mockServers);
  const localInitTime = Date.now() - localInitStart;
  console.log(`✓ Local filter initialized: ${localInitTime}ms\n`);

  // Results storage
  const results: BenchmarkResult[] = [
    { approach: 'All Tools (120)', latencies: [], costs: [], toolCounts: [], errors: 0, filteringMetrics: { toolsAvailableCount: 0, totalRecall: [], totalPrecision: [] }, failures: [] },
    { approach: 'OpenAI Embeddings Filtering', latencies: [], costs: [], toolCounts: [], errors: 0, filteringMetrics: { toolsAvailableCount: 0, totalRecall: [], totalPrecision: [] }, failures: [] },
    { approach: 'Local Embeddings Filtering', latencies: [], costs: [], toolCounts: [], errors: 0, filteringMetrics: { toolsAvailableCount: 0, totalRecall: [], totalPrecision: [] }, failures: [] },
  ];

  // Run benchmark
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Running benchmark on ${testQueries.length} queries...\n`);

  for (let i = 0; i < testQueries.length; i++) {
    const { query, expected } = testQueries[i];
    console.log(`[${i + 1}/${testQueries.length}] "${query.substring(0, 60)}${query.length > 60 ? '...' : ''}"`);

    // Approach 1: All tools (100% recall - all tools sent)
    try {
      const start1 = Date.now();
      const response1 = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that selects the most appropriate tool to use.' },
          { role: 'user', content: query },
        ],
        tools: allToolsOpenAI,
        tool_choice: 'auto',
        max_tokens: 100,
      });
      const latency1 = Date.now() - start1;
      
      const usage1 = response1.usage!;
      const cost1 = calculateCost(usage1.prompt_tokens, usage1.completion_tokens);
      
      // Check if required tools were available (they always are - we send all tools)
      const sentToolNames1 = allTools.map(t => t.name);
      const accuracy1 = calculateAccuracy(sentToolNames1, expected);
      
      results[0].latencies.push(latency1);
      results[0].costs.push(cost1);
      results[0].toolCounts.push(allTools.length);
      if (accuracy1.toolsAvailable) results[0].filteringMetrics.toolsAvailableCount++;
      results[0].filteringMetrics.totalRecall.push(accuracy1.recall);
      results[0].filteringMetrics.totalPrecision.push(accuracy1.precision);
      
      // Track failures
      if (!accuracy1.toolsAvailable) {
        results[0].failures.push({
          query,
          expected,
          sent: sentToolNames1,
          recall: accuracy1.recall,
        });
      }
      
      console.log(`  Approach 1: ${latency1}ms, $${cost1.toFixed(6)}, tools available: ${accuracy1.toolsAvailable ? '✓' : '✗'} (recall: ${(accuracy1.recall * 100).toFixed(0)}%)`);
    } catch (error: any) {
      console.log(`  Approach 1: ERROR - ${error.message}`);
      results[0].errors++;
      results[0].filteringMetrics.totalRecall.push(0);
      results[0].filteringMetrics.totalPrecision.push(0);
    }

    // Approach 2: OpenAI embeddings filtering
    try {
      const filterStart2 = Date.now();
      const filterResult2 = await apiFilter.filter(query);
      const filterTime2 = Date.now() - filterStart2;
      
      const filteredTools2 = toolsToOpenAIFormat(filterResult2.tools);
      
      // Check if required tools were available in filtered set
      const sentToolNames2 = filterResult2.tools.map(t => t.toolName);
      const accuracy2 = calculateAccuracy(sentToolNames2, expected);
      
      const start2 = Date.now();
      const response2 = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that selects the most appropriate tool to use.' },
          { role: 'user', content: query },
        ],
        tools: filteredTools2,
        tool_choice: 'auto',
        max_tokens: 100,
      });
      const llmTime2 = Date.now() - start2;
      const latency2 = filterTime2 + llmTime2;
      
      const usage2 = response2.usage!;
      const embeddingTokens2 = estimateTokens(query);
      const cost2 = calculateCost(usage2.prompt_tokens, usage2.completion_tokens, embeddingTokens2);
      
      results[1].latencies.push(latency2);
      results[1].costs.push(cost2);
      results[1].toolCounts.push(filterResult2.tools.length);
      if (accuracy2.toolsAvailable) results[1].filteringMetrics.toolsAvailableCount++;
      results[1].filteringMetrics.totalRecall.push(accuracy2.recall);
      results[1].filteringMetrics.totalPrecision.push(accuracy2.precision);
      
      // Track failures
      if (!accuracy2.toolsAvailable) {
        results[1].failures.push({
          query,
          expected,
          sent: sentToolNames2,
          recall: accuracy2.recall,
        });
      }
      
      console.log(`  Approach 2: ${latency2}ms (filter: ${filterTime2}ms), $${cost2.toFixed(6)}, tools available: ${accuracy2.toolsAvailable ? '✓' : '✗'} (recall: ${(accuracy2.recall * 100).toFixed(0)}%)`);
    } catch (error: any) {
      console.log(`  Approach 2: ERROR - ${error.message}`);
      results[1].errors++;
      results[1].filteringMetrics.totalRecall.push(0);
      results[1].filteringMetrics.totalPrecision.push(0);
    }

    // Approach 3: Local embeddings filtering
    try {
      const filterStart3 = Date.now();
      const filterResult3 = await localFilter.filter(query);
      const filterTime3 = Date.now() - filterStart3;
      
      const filteredTools3 = toolsToOpenAIFormat(filterResult3.tools);
      
      // Check if required tools were available in filtered set
      const sentToolNames3 = filterResult3.tools.map(t => t.toolName);
      const accuracy3 = calculateAccuracy(sentToolNames3, expected);
      
      const start3 = Date.now();
      const response3 = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that selects the most appropriate tool to use.' },
          { role: 'user', content: query },
        ],
        tools: filteredTools3,
        tool_choice: 'auto',
        max_tokens: 100,
      });
      const llmTime3 = Date.now() - start3;
      const latency3 = filterTime3 + llmTime3;
      
      const usage3 = response3.usage!;
      const cost3 = calculateCost(usage3.prompt_tokens, usage3.completion_tokens);
      
      results[2].latencies.push(latency3);
      results[2].costs.push(cost3);
      results[2].toolCounts.push(filterResult3.tools.length);
      if (accuracy3.toolsAvailable) results[2].filteringMetrics.toolsAvailableCount++;
      results[2].filteringMetrics.totalRecall.push(accuracy3.recall);
      results[2].filteringMetrics.totalPrecision.push(accuracy3.precision);
      
      // Track failures
      if (!accuracy3.toolsAvailable) {
        results[2].failures.push({
          query,
          expected,
          sent: sentToolNames3,
          recall: accuracy3.recall,
        });
      }
      
      console.log(`  Approach 3: ${latency3}ms (filter: ${filterTime3}ms), $${cost3.toFixed(6)}, tools available: ${accuracy3.toolsAvailable ? '✓' : '✗'} (recall: ${(accuracy3.recall * 100).toFixed(0)}%)\n`);
    } catch (error: any) {
      console.log(`  Approach 3: ERROR - ${error.message}\n`);
      results[2].errors++;
      results[2].filteringMetrics.totalRecall.push(0);
      results[2].filteringMetrics.totalPrecision.push(0);
    }

    // Rate limiting protection
    if ((i + 1) % 10 === 0) {
      console.log(`⏸️  Pausing for rate limits...\n`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // ============================================
  // Results Analysis
  // ============================================

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 BENCHMARK RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const result of results) {
    console.log(`\n${result.approach}:`);
    console.log('─'.repeat(50));
    
    const avgLatency = result.latencies.reduce((a, b) => a + b, 0) / result.latencies.length;
    const p50Latency = result.latencies.sort((a, b) => a - b)[Math.floor(result.latencies.length * 0.5)];
    const p95Latency = result.latencies.sort((a, b) => a - b)[Math.floor(result.latencies.length * 0.95)];
    const totalCost = result.costs.reduce((a, b) => a + b, 0);
    const avgCost = totalCost / result.costs.length;
    const avgTools = result.toolCounts.reduce((a, b) => a + b, 0) / result.toolCounts.length;
    
    // Calculate filtering accuracy metrics
    const toolsAvailablePercent = (result.filteringMetrics.toolsAvailableCount / testQueries.length) * 100;
    const avgRecall = result.filteringMetrics.totalRecall.reduce((a, b) => a + b, 0) / result.filteringMetrics.totalRecall.length;
    const avgPrecision = result.filteringMetrics.totalPrecision.reduce((a, b) => a + b, 0) / result.filteringMetrics.totalPrecision.length;
    
    console.log(`Latency:`);
    console.log(`  Average: ${avgLatency.toFixed(2)}ms`);
    console.log(`  P50: ${p50Latency.toFixed(2)}ms`);
    console.log(`  P95: ${p95Latency.toFixed(2)}ms`);
    console.log(`\nCost:`);
    console.log(`  Total (${testQueries.length} queries): $${totalCost.toFixed(4)}`);
    console.log(`  Average per query: $${avgCost.toFixed(6)}`);
    console.log(`  Estimated monthly (1M queries): $${(avgCost * 1_000_000).toFixed(2)}`);
    console.log(`\nTools:`);
    console.log(`  Average tools per query: ${avgTools.toFixed(1)}`);
    console.log(`\nFiltering Accuracy (Are required tools available?):`);
    console.log(`  Tools Available: ${toolsAvailablePercent.toFixed(1)}% (${result.filteringMetrics.toolsAvailableCount}/${testQueries.length} queries)`);
    console.log(`  Average Recall: ${(avgRecall * 100).toFixed(1)}% (% of required tools sent)`);
    console.log(`  Average Precision: ${(avgPrecision * 100).toFixed(1)}% (% of sent tools that were needed)`);
    console.log(`\nErrors: ${result.errors}`);
  }

  // Comparison
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏆 COMPARISON');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const baseline = results[0];
  
  console.log('Latency vs All Tools:');
  results.forEach((r, i) => {
    if (i === 0) return;
    const baselineAvg = baseline.latencies.reduce((a, b) => a + b, 0) / baseline.latencies.length;
    const currentAvg = r.latencies.reduce((a, b) => a + b, 0) / r.latencies.length;
    const improvement = ((baselineAvg - currentAvg) / baselineAvg * 100).toFixed(1);
    const speedup = (baselineAvg / currentAvg).toFixed(2);
    console.log(`  ${r.approach}: ${improvement}% faster (${speedup}x)`);
  });

  console.log('\nCost vs All Tools:');
  results.forEach((r, i) => {
    if (i === 0) return;
    const baselineCost = baseline.costs.reduce((a, b) => a + b, 0);
    const currentCost = r.costs.reduce((a, b) => a + b, 0);
    const savings = ((baselineCost - currentCost) / baselineCost * 100).toFixed(1);
    console.log(`  ${r.approach}: ${savings}% cheaper`);
  });

  console.log('\nFiltering Accuracy (Tools Available):');
  results.forEach((r) => {
    const toolsAvailablePercent = (r.filteringMetrics.toolsAvailableCount / testQueries.length) * 100;
    console.log(`  ${r.approach}: ${toolsAvailablePercent.toFixed(1)}%`);
  });

  console.log('\nLocal vs OpenAI Embeddings:');
  const local = results[2];
  const openaiEmb = results[1];
  const localAvgLatency = local.latencies.reduce((a, b) => a + b, 0) / local.latencies.length;
  const openaiAvgLatency = openaiEmb.latencies.reduce((a, b) => a + b, 0) / openaiEmb.latencies.length;
  const latencyDiff = ((openaiAvgLatency - localAvgLatency) / openaiAvgLatency * 100).toFixed(1);
  
  const localTotalCost = local.costs.reduce((a, b) => a + b, 0);
  const openaiTotalCost = openaiEmb.costs.reduce((a, b) => a + b, 0);
  const costDiff = ((openaiTotalCost - localTotalCost) / openaiTotalCost * 100).toFixed(1);
  
  const localToolsAvailable = (local.filteringMetrics.toolsAvailableCount / testQueries.length) * 100;
  const openaiToolsAvailable = (openaiEmb.filteringMetrics.toolsAvailableCount / testQueries.length) * 100;
  const accuracyDiff = (localToolsAvailable - openaiToolsAvailable).toFixed(1);
  
  console.log(`  Latency: Local is ${latencyDiff}% faster`);
  console.log(`  Cost: Local is ${costDiff}% cheaper`);
  console.log(`  Filtering Accuracy: Local is ${accuracyDiff}% ${parseFloat(accuracyDiff) >= 0 ? 'better' : 'worse'}`);

  // Detailed failure analysis for local embeddings
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 FAILURE ANALYSIS - Local Embeddings');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (local.failures.length === 0) {
    console.log('✅ No failures! Local embeddings found all required tools.\n');
  } else {
    console.log(`❌ Failed on ${local.failures.length} out of ${testQueries.length} queries (${((local.failures.length / testQueries.length) * 100).toFixed(1)}%)\n`);
    
    local.failures.forEach((failure, idx) => {
      console.log(`Failure #${idx + 1}:`);
      console.log(`  Query: "${failure.query}"`);
      console.log(`  Expected tools: [${failure.expected.join(', ')}]`);
      console.log(`  Tools sent: [${failure.sent.slice(0, 10).join(', ')}${failure.sent.length > 10 ? ` ... +${failure.sent.length - 10} more` : ''}]`);
      console.log(`  Recall: ${(failure.recall * 100).toFixed(0)}%`);
      console.log('');
    });
    
    // Analyze patterns
    console.log('Pattern Analysis:');
    const failureTypes = local.failures.reduce((acc, f) => {
      const tool = f.expected[0];
      const category = tool.split('_')[0];
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('  Failures by tool category:');
    Object.entries(failureTypes).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
      console.log(`    ${cat}: ${count} failures`);
    });
  }
  
  // Compare with OpenAI failures
  if (openaiEmb.failures.length > 0) {
    console.log('\n📊 OpenAI Embeddings also failed on:');
    openaiEmb.failures.forEach((failure, idx) => {
      console.log(`  ${idx + 1}. "${failure.query}" → Expected: [${failure.expected.join(', ')}]`);
    });
  }

  console.log('\n✅ Benchmark complete!\n');
}

main().catch(console.error);

