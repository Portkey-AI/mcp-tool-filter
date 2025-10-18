/**
 * Comprehensive benchmark comparing three approaches:
 * 1. All tools to LLM (no filtering)
 * 2. OpenAI embeddings filtering + LLM
 * 3. Local embeddings filtering + LLM
 * 
 * Run with: npx ts-node examples/benchmark.ts
 */

import { MCPToolFilter, MCPServer } from '../src';
import OpenAI from 'openai';

// ============================================
// Mock MCP Servers (20 servers, ~300 tools)
// ============================================

const mockServers: MCPServer[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Email management and communication',
    tools: [
      { name: 'gmail_search', description: 'Search emails in Gmail inbox using queries', keywords: ['email', 'search', 'find', 'inbox'] },
      { name: 'gmail_send', description: 'Send an email to recipients', keywords: ['email', 'send', 'compose', 'write'] },
      { name: 'gmail_read', description: 'Read email content by ID', keywords: ['email', 'read', 'view', 'open'] },
      { name: 'gmail_delete', description: 'Delete emails by ID', keywords: ['email', 'delete', 'remove', 'trash'] },
      { name: 'gmail_archive', description: 'Archive emails', keywords: ['email', 'archive', 'store'] },
      { name: 'gmail_label', description: 'Add labels to emails', keywords: ['email', 'label', 'tag', 'organize'] },
      { name: 'gmail_draft', description: 'Create email draft', keywords: ['email', 'draft', 'prepare'] },
      { name: 'gmail_attachment', description: 'Download email attachments', keywords: ['email', 'attachment', 'file', 'download'] },
      { name: 'gmail_filter', description: 'Create email filters', keywords: ['email', 'filter', 'rule', 'automation'] },
      { name: 'gmail_signature', description: 'Manage email signatures', keywords: ['email', 'signature', 'footer'] },
    ],
  },
  {
    id: 'gcal',
    name: 'Google Calendar',
    description: 'Calendar and event management',
    tools: [
      { name: 'gcal_list', description: 'List calendar events for a date range', keywords: ['calendar', 'events', 'list', 'schedule'] },
      { name: 'gcal_create', description: 'Create new calendar event', keywords: ['calendar', 'create', 'add', 'schedule', 'meeting'] },
      { name: 'gcal_update', description: 'Update existing event', keywords: ['calendar', 'update', 'edit', 'modify'] },
      { name: 'gcal_delete', description: 'Delete calendar event', keywords: ['calendar', 'delete', 'remove', 'cancel'] },
      { name: 'gcal_find_time', description: 'Find available time slots', keywords: ['calendar', 'availability', 'free', 'time'] },
      { name: 'gcal_invite', description: 'Send calendar invites', keywords: ['calendar', 'invite', 'attendees', 'guests'] },
      { name: 'gcal_reminder', description: 'Set event reminders', keywords: ['calendar', 'reminder', 'notification', 'alert'] },
      { name: 'gcal_recurring', description: 'Create recurring events', keywords: ['calendar', 'recurring', 'repeat', 'series'] },
      { name: 'gcal_timezone', description: 'Manage timezone settings', keywords: ['calendar', 'timezone', 'time', 'zone'] },
      { name: 'gcal_share', description: 'Share calendar with others', keywords: ['calendar', 'share', 'permissions', 'access'] },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication and collaboration',
    tools: [
      { name: 'slack_message', description: 'Send message to channel or user', keywords: ['slack', 'message', 'send', 'chat'] },
      { name: 'slack_search', description: 'Search messages in Slack', keywords: ['slack', 'search', 'find', 'messages'] },
      { name: 'slack_channel_create', description: 'Create new Slack channel', keywords: ['slack', 'channel', 'create', 'new'] },
      { name: 'slack_channel_list', description: 'List all channels', keywords: ['slack', 'channel', 'list', 'browse'] },
      { name: 'slack_user_info', description: 'Get user information', keywords: ['slack', 'user', 'profile', 'info'] },
      { name: 'slack_file_upload', description: 'Upload file to Slack', keywords: ['slack', 'file', 'upload', 'share'] },
      { name: 'slack_reaction', description: 'Add reaction to message', keywords: ['slack', 'reaction', 'emoji', 'respond'] },
      { name: 'slack_thread', description: 'Reply in thread', keywords: ['slack', 'thread', 'reply', 'conversation'] },
      { name: 'slack_status', description: 'Set user status', keywords: ['slack', 'status', 'presence', 'availability'] },
      { name: 'slack_reminder', description: 'Set reminders in Slack', keywords: ['slack', 'reminder', 'notification', 'alert'] },
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Code repository and collaboration',
    tools: [
      { name: 'github_repo_create', description: 'Create new repository', keywords: ['github', 'repo', 'create', 'new'] },
      { name: 'github_repo_list', description: 'List repositories', keywords: ['github', 'repo', 'list', 'browse'] },
      { name: 'github_issue_create', description: 'Create issue', keywords: ['github', 'issue', 'create', 'bug', 'task'] },
      { name: 'github_issue_list', description: 'List issues', keywords: ['github', 'issue', 'list', 'search'] },
      { name: 'github_pr_create', description: 'Create pull request', keywords: ['github', 'pr', 'pull request', 'create'] },
      { name: 'github_pr_list', description: 'List pull requests', keywords: ['github', 'pr', 'pull request', 'list'] },
      { name: 'github_commit', description: 'Get commit information', keywords: ['github', 'commit', 'history', 'changes'] },
      { name: 'github_branch', description: 'Manage branches', keywords: ['github', 'branch', 'create', 'delete'] },
      { name: 'github_review', description: 'Review pull requests', keywords: ['github', 'review', 'approve', 'comment'] },
      { name: 'github_actions', description: 'Manage GitHub Actions', keywords: ['github', 'actions', 'ci', 'workflow'] },
      { name: 'github_wiki', description: 'Edit repository wiki', keywords: ['github', 'wiki', 'documentation', 'docs'] },
      { name: 'github_release', description: 'Create releases', keywords: ['github', 'release', 'version', 'publish'] },
    ],
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Project management and issue tracking',
    tools: [
      { name: 'jira_issue_create', description: 'Create Jira issue', keywords: ['jira', 'issue', 'ticket', 'create', 'task'] },
      { name: 'jira_issue_update', description: 'Update issue', keywords: ['jira', 'issue', 'update', 'edit'] },
      { name: 'jira_issue_search', description: 'Search issues with JQL', keywords: ['jira', 'issue', 'search', 'find', 'query'] },
      { name: 'jira_sprint_create', description: 'Create sprint', keywords: ['jira', 'sprint', 'create', 'agile'] },
      { name: 'jira_sprint_list', description: 'List sprints', keywords: ['jira', 'sprint', 'list', 'browse'] },
      { name: 'jira_board_list', description: 'List boards', keywords: ['jira', 'board', 'kanban', 'scrum'] },
      { name: 'jira_comment', description: 'Add comment to issue', keywords: ['jira', 'comment', 'reply', 'discuss'] },
      { name: 'jira_assign', description: 'Assign issue to user', keywords: ['jira', 'assign', 'assignee', 'owner'] },
      { name: 'jira_transition', description: 'Transition issue status', keywords: ['jira', 'transition', 'status', 'workflow'] },
      { name: 'jira_attachment', description: 'Add attachment to issue', keywords: ['jira', 'attachment', 'file', 'upload'] },
    ],
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Note-taking and knowledge management',
    tools: [
      { name: 'notion_page_create', description: 'Create new page', keywords: ['notion', 'page', 'create', 'note', 'document'] },
      { name: 'notion_page_read', description: 'Read page content', keywords: ['notion', 'page', 'read', 'view', 'open'] },
      { name: 'notion_page_update', description: 'Update page content', keywords: ['notion', 'page', 'update', 'edit'] },
      { name: 'notion_database_query', description: 'Query database', keywords: ['notion', 'database', 'query', 'search', 'filter'] },
      { name: 'notion_database_create', description: 'Create database', keywords: ['notion', 'database', 'create', 'table'] },
      { name: 'notion_block_append', description: 'Append blocks to page', keywords: ['notion', 'block', 'append', 'add'] },
      { name: 'notion_comment', description: 'Add comment', keywords: ['notion', 'comment', 'discuss', 'feedback'] },
      { name: 'notion_search', description: 'Search across workspace', keywords: ['notion', 'search', 'find', 'query'] },
    ],
  },
  {
    id: 'drive',
    name: 'Google Drive',
    description: 'File storage and sharing',
    tools: [
      { name: 'drive_upload', description: 'Upload file to Drive', keywords: ['drive', 'upload', 'file', 'store'] },
      { name: 'drive_download', description: 'Download file', keywords: ['drive', 'download', 'file', 'get'] },
      { name: 'drive_list', description: 'List files and folders', keywords: ['drive', 'list', 'browse', 'files'] },
      { name: 'drive_search', description: 'Search for files', keywords: ['drive', 'search', 'find', 'query'] },
      { name: 'drive_share', description: 'Share file or folder', keywords: ['drive', 'share', 'permissions', 'access'] },
      { name: 'drive_delete', description: 'Delete file', keywords: ['drive', 'delete', 'remove', 'trash'] },
      { name: 'drive_folder_create', description: 'Create folder', keywords: ['drive', 'folder', 'create', 'directory'] },
      { name: 'drive_copy', description: 'Copy file', keywords: ['drive', 'copy', 'duplicate'] },
      { name: 'drive_move', description: 'Move file', keywords: ['drive', 'move', 'relocate'] },
      { name: 'drive_export', description: 'Export Google Docs format', keywords: ['drive', 'export', 'convert', 'download'] },
    ],
  },
  {
    id: 'sheets',
    name: 'Google Sheets',
    description: 'Spreadsheet management and analysis',
    tools: [
      { name: 'sheets_create', description: 'Create new spreadsheet', keywords: ['sheets', 'spreadsheet', 'create', 'new'] },
      { name: 'sheets_read', description: 'Read cell values', keywords: ['sheets', 'read', 'get', 'cell', 'data'] },
      { name: 'sheets_write', description: 'Write to cells', keywords: ['sheets', 'write', 'update', 'cell'] },
      { name: 'sheets_append', description: 'Append rows', keywords: ['sheets', 'append', 'add', 'row'] },
      { name: 'sheets_format', description: 'Format cells', keywords: ['sheets', 'format', 'style', 'color'] },
      { name: 'sheets_formula', description: 'Add formula', keywords: ['sheets', 'formula', 'calculate', 'function'] },
      { name: 'sheets_chart', description: 'Create chart', keywords: ['sheets', 'chart', 'graph', 'visualize'] },
      { name: 'sheets_filter', description: 'Filter data', keywords: ['sheets', 'filter', 'sort', 'query'] },
      { name: 'sheets_pivot', description: 'Create pivot table', keywords: ['sheets', 'pivot', 'table', 'summarize'] },
    ],
  },
  {
    id: 'trello',
    name: 'Trello',
    description: 'Project management boards',
    tools: [
      { name: 'trello_board_create', description: 'Create board', keywords: ['trello', 'board', 'create', 'new'] },
      { name: 'trello_card_create', description: 'Create card', keywords: ['trello', 'card', 'create', 'task'] },
      { name: 'trello_card_update', description: 'Update card', keywords: ['trello', 'card', 'update', 'edit'] },
      { name: 'trello_list_create', description: 'Create list', keywords: ['trello', 'list', 'column', 'create'] },
      { name: 'trello_comment', description: 'Add comment', keywords: ['trello', 'comment', 'reply', 'discuss'] },
      { name: 'trello_attachment', description: 'Add attachment', keywords: ['trello', 'attachment', 'file', 'upload'] },
      { name: 'trello_label', description: 'Add label', keywords: ['trello', 'label', 'tag', 'category'] },
      { name: 'trello_checklist', description: 'Add checklist', keywords: ['trello', 'checklist', 'todo', 'items'] },
      { name: 'trello_member', description: 'Add member', keywords: ['trello', 'member', 'assign', 'user'] },
    ],
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Video conferencing',
    tools: [
      { name: 'zoom_meeting_create', description: 'Create meeting', keywords: ['zoom', 'meeting', 'create', 'schedule'] },
      { name: 'zoom_meeting_list', description: 'List meetings', keywords: ['zoom', 'meeting', 'list', 'upcoming'] },
      { name: 'zoom_meeting_delete', description: 'Delete meeting', keywords: ['zoom', 'meeting', 'delete', 'cancel'] },
      { name: 'zoom_recording_list', description: 'List recordings', keywords: ['zoom', 'recording', 'list', 'past'] },
      { name: 'zoom_user_list', description: 'List users', keywords: ['zoom', 'user', 'list', 'members'] },
      { name: 'zoom_webinar_create', description: 'Create webinar', keywords: ['zoom', 'webinar', 'create', 'event'] },
      { name: 'zoom_report', description: 'Get usage reports', keywords: ['zoom', 'report', 'analytics', 'usage'] },
    ],
  },
  {
    id: 'asana',
    name: 'Asana',
    description: 'Team task and project management',
    tools: [
      { name: 'asana_task_create', description: 'Create task', keywords: ['asana', 'task', 'create', 'todo'] },
      { name: 'asana_task_update', description: 'Update task', keywords: ['asana', 'task', 'update', 'edit'] },
      { name: 'asana_project_create', description: 'Create project', keywords: ['asana', 'project', 'create', 'new'] },
      { name: 'asana_project_list', description: 'List projects', keywords: ['asana', 'project', 'list', 'browse'] },
      { name: 'asana_section_create', description: 'Create section', keywords: ['asana', 'section', 'create', 'group'] },
      { name: 'asana_comment', description: 'Add comment', keywords: ['asana', 'comment', 'reply', 'discuss'] },
      { name: 'asana_attachment', description: 'Add attachment', keywords: ['asana', 'attachment', 'file', 'upload'] },
      { name: 'asana_tag', description: 'Add tag', keywords: ['asana', 'tag', 'label', 'category'] },
      { name: 'asana_search', description: 'Search tasks', keywords: ['asana', 'search', 'find', 'query'] },
    ],
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Cloud file storage',
    tools: [
      { name: 'dropbox_upload', description: 'Upload file', keywords: ['dropbox', 'upload', 'file', 'store'] },
      { name: 'dropbox_download', description: 'Download file', keywords: ['dropbox', 'download', 'file', 'get'] },
      { name: 'dropbox_list', description: 'List files', keywords: ['dropbox', 'list', 'browse', 'files'] },
      { name: 'dropbox_search', description: 'Search files', keywords: ['dropbox', 'search', 'find', 'query'] },
      { name: 'dropbox_share', description: 'Share file', keywords: ['dropbox', 'share', 'link', 'access'] },
      { name: 'dropbox_delete', description: 'Delete file', keywords: ['dropbox', 'delete', 'remove'] },
      { name: 'dropbox_folder', description: 'Create folder', keywords: ['dropbox', 'folder', 'create', 'directory'] },
      { name: 'dropbox_move', description: 'Move file', keywords: ['dropbox', 'move', 'relocate'] },
    ],
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    description: 'Social media platform',
    tools: [
      { name: 'twitter_tweet', description: 'Post tweet', keywords: ['twitter', 'tweet', 'post', 'publish'] },
      { name: 'twitter_reply', description: 'Reply to tweet', keywords: ['twitter', 'reply', 'respond', 'comment'] },
      { name: 'twitter_retweet', description: 'Retweet', keywords: ['twitter', 'retweet', 'share', 'amplify'] },
      { name: 'twitter_like', description: 'Like tweet', keywords: ['twitter', 'like', 'favorite', 'heart'] },
      { name: 'twitter_search', description: 'Search tweets', keywords: ['twitter', 'search', 'find', 'query'] },
      { name: 'twitter_timeline', description: 'Get timeline', keywords: ['twitter', 'timeline', 'feed', 'home'] },
      { name: 'twitter_user', description: 'Get user info', keywords: ['twitter', 'user', 'profile', 'info'] },
      { name: 'twitter_follow', description: 'Follow user', keywords: ['twitter', 'follow', 'subscribe'] },
      { name: 'twitter_dm', description: 'Send direct message', keywords: ['twitter', 'dm', 'message', 'direct'] },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Professional networking',
    tools: [
      { name: 'linkedin_post', description: 'Create post', keywords: ['linkedin', 'post', 'publish', 'share'] },
      { name: 'linkedin_comment', description: 'Comment on post', keywords: ['linkedin', 'comment', 'reply', 'engage'] },
      { name: 'linkedin_like', description: 'Like post', keywords: ['linkedin', 'like', 'react', 'endorse'] },
      { name: 'linkedin_share', description: 'Share post', keywords: ['linkedin', 'share', 'repost', 'amplify'] },
      { name: 'linkedin_message', description: 'Send message', keywords: ['linkedin', 'message', 'chat', 'dm'] },
      { name: 'linkedin_connect', description: 'Send connection request', keywords: ['linkedin', 'connect', 'network', 'invite'] },
      { name: 'linkedin_profile', description: 'View profile', keywords: ['linkedin', 'profile', 'user', 'person'] },
      { name: 'linkedin_job_search', description: 'Search jobs', keywords: ['linkedin', 'job', 'search', 'career'] },
      { name: 'linkedin_job_apply', description: 'Apply to job', keywords: ['linkedin', 'job', 'apply', 'application'] },
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing',
    tools: [
      { name: 'stripe_payment_create', description: 'Create payment', keywords: ['stripe', 'payment', 'charge', 'create'] },
      { name: 'stripe_payment_list', description: 'List payments', keywords: ['stripe', 'payment', 'list', 'history'] },
      { name: 'stripe_refund', description: 'Refund payment', keywords: ['stripe', 'refund', 'return', 'cancel'] },
      { name: 'stripe_customer_create', description: 'Create customer', keywords: ['stripe', 'customer', 'create', 'new'] },
      { name: 'stripe_customer_list', description: 'List customers', keywords: ['stripe', 'customer', 'list', 'browse'] },
      { name: 'stripe_subscription_create', description: 'Create subscription', keywords: ['stripe', 'subscription', 'recurring', 'create'] },
      { name: 'stripe_invoice', description: 'Generate invoice', keywords: ['stripe', 'invoice', 'bill', 'payment'] },
      { name: 'stripe_balance', description: 'Check balance', keywords: ['stripe', 'balance', 'funds', 'account'] },
    ],
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'E-commerce platform',
    tools: [
      { name: 'shopify_product_create', description: 'Create product', keywords: ['shopify', 'product', 'create', 'add'] },
      { name: 'shopify_product_list', description: 'List products', keywords: ['shopify', 'product', 'list', 'browse'] },
      { name: 'shopify_order_list', description: 'List orders', keywords: ['shopify', 'order', 'list', 'sales'] },
      { name: 'shopify_order_fulfill', description: 'Fulfill order', keywords: ['shopify', 'order', 'fulfill', 'ship'] },
      { name: 'shopify_customer_list', description: 'List customers', keywords: ['shopify', 'customer', 'list', 'users'] },
      { name: 'shopify_inventory', description: 'Update inventory', keywords: ['shopify', 'inventory', 'stock', 'quantity'] },
      { name: 'shopify_collection', description: 'Create collection', keywords: ['shopify', 'collection', 'category', 'group'] },
    ],
  },
  {
    id: 'aws',
    name: 'AWS',
    description: 'Cloud computing services',
    tools: [
      { name: 'aws_ec2_launch', description: 'Launch EC2 instance', keywords: ['aws', 'ec2', 'instance', 'launch', 'server'] },
      { name: 'aws_ec2_list', description: 'List EC2 instances', keywords: ['aws', 'ec2', 'instance', 'list'] },
      { name: 'aws_ec2_stop', description: 'Stop EC2 instance', keywords: ['aws', 'ec2', 'stop', 'shutdown'] },
      { name: 'aws_s3_upload', description: 'Upload to S3', keywords: ['aws', 's3', 'upload', 'bucket', 'file'] },
      { name: 'aws_s3_download', description: 'Download from S3', keywords: ['aws', 's3', 'download', 'bucket', 'file'] },
      { name: 'aws_s3_list', description: 'List S3 objects', keywords: ['aws', 's3', 'list', 'bucket', 'objects'] },
      { name: 'aws_lambda_invoke', description: 'Invoke Lambda', keywords: ['aws', 'lambda', 'invoke', 'function'] },
      { name: 'aws_rds_status', description: 'Check RDS status', keywords: ['aws', 'rds', 'database', 'status'] },
      { name: 'aws_cloudwatch', description: 'Get CloudWatch metrics', keywords: ['aws', 'cloudwatch', 'metrics', 'monitoring'] },
      { name: 'aws_iam_user', description: 'Create IAM user', keywords: ['aws', 'iam', 'user', 'create', 'access'] },
    ],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'CRM and sales platform',
    tools: [
      { name: 'sf_lead_create', description: 'Create lead', keywords: ['salesforce', 'lead', 'create', 'prospect'] },
      { name: 'sf_lead_convert', description: 'Convert lead', keywords: ['salesforce', 'lead', 'convert', 'opportunity'] },
      { name: 'sf_opportunity_create', description: 'Create opportunity', keywords: ['salesforce', 'opportunity', 'deal', 'create'] },
      { name: 'sf_account_create', description: 'Create account', keywords: ['salesforce', 'account', 'company', 'create'] },
      { name: 'sf_contact_create', description: 'Create contact', keywords: ['salesforce', 'contact', 'person', 'create'] },
      { name: 'sf_task_create', description: 'Create task', keywords: ['salesforce', 'task', 'todo', 'create'] },
      { name: 'sf_report', description: 'Run report', keywords: ['salesforce', 'report', 'analytics', 'data'] },
      { name: 'sf_dashboard', description: 'View dashboard', keywords: ['salesforce', 'dashboard', 'metrics', 'kpi'] },
    ],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Marketing and sales automation',
    tools: [
      { name: 'hs_contact_create', description: 'Create contact', keywords: ['hubspot', 'contact', 'create', 'lead'] },
      { name: 'hs_company_create', description: 'Create company', keywords: ['hubspot', 'company', 'create', 'account'] },
      { name: 'hs_deal_create', description: 'Create deal', keywords: ['hubspot', 'deal', 'create', 'opportunity'] },
      { name: 'hs_email_send', description: 'Send email', keywords: ['hubspot', 'email', 'send', 'campaign'] },
      { name: 'hs_list_create', description: 'Create list', keywords: ['hubspot', 'list', 'segment', 'create'] },
      { name: 'hs_workflow', description: 'Create workflow', keywords: ['hubspot', 'workflow', 'automation', 'sequence'] },
      { name: 'hs_form', description: 'Get form submissions', keywords: ['hubspot', 'form', 'submission', 'lead'] },
      { name: 'hs_analytics', description: 'Get analytics', keywords: ['hubspot', 'analytics', 'report', 'metrics'] },
    ],
  },
  {
    id: 'intercom',
    name: 'Intercom',
    description: 'Customer messaging platform',
    tools: [
      { name: 'intercom_message_send', description: 'Send message', keywords: ['intercom', 'message', 'send', 'chat'] },
      { name: 'intercom_user_create', description: 'Create user', keywords: ['intercom', 'user', 'contact', 'create'] },
      { name: 'intercom_conversation_list', description: 'List conversations', keywords: ['intercom', 'conversation', 'list', 'chat'] },
      { name: 'intercom_conversation_reply', description: 'Reply to conversation', keywords: ['intercom', 'conversation', 'reply', 'respond'] },
      { name: 'intercom_tag', description: 'Add tag', keywords: ['intercom', 'tag', 'label', 'category'] },
      { name: 'intercom_note', description: 'Add note', keywords: ['intercom', 'note', 'comment', 'annotation'] },
      { name: 'intercom_article', description: 'Create help article', keywords: ['intercom', 'article', 'help', 'documentation'] },
    ],
  },
];

// Calculate total tools
const totalTools = mockServers.reduce((acc, server) => acc + server.tools.length, 0);
console.log(`📊 Total MCP Servers: ${mockServers.length}`);
console.log(`📊 Total Tools: ${totalTools}\n`);

// ============================================
// Test Queries (100 realistic examples)
// ============================================

const testQueries = [
  // Email queries
  "Search for emails from John about the project deadline",
  "Send an email to the team about tomorrow's meeting",
  "Find all unread emails in my inbox",
  "Draft an email reply to Sarah's proposal",
  "Delete all spam emails from last week",
  
  // Calendar queries
  "What meetings do I have today?",
  "Schedule a meeting with the design team for next Tuesday at 2pm",
  "Cancel my 3pm meeting tomorrow",
  "Find available time slots next week for a 1-hour meeting",
  "Create a recurring weekly standup meeting",
  
  // Slack/Communication
  "Send a message in the #engineering channel",
  "Search for messages about the Q4 roadmap in Slack",
  "Create a new Slack channel for the new project",
  "Upload the presentation to our team Slack",
  "Set my Slack status to 'In a meeting'",
  
  // GitHub/Development
  "Create a new GitHub repository for the mobile app",
  "List all open issues in the backend repo",
  "Create a pull request for the authentication feature",
  "Review the latest PR from Alex",
  "Check the CI/CD workflow status",
  
  // Jira/Project Management
  "Create a new bug ticket in Jira",
  "Search for all high-priority tasks assigned to me",
  "Move ticket PROJ-123 to 'In Progress'",
  "Add a comment to the database migration ticket",
  "Create a new sprint for Q1 2024",
  
  // File Management
  "Upload the Q4 report to Google Drive",
  "Share the design mockups folder with the team",
  "Search for the contract document in Drive",
  "Create a new folder for client files",
  "Download the latest version of the presentation",
  
  // Spreadsheets/Data
  "Create a new spreadsheet for the budget",
  "Add a row to the sales tracking sheet",
  "Format the revenue column as currency",
  "Create a chart showing monthly growth",
  "Filter the data to show only Q4 results",
  
  // Notion/Documentation
  "Create a new page for the product spec",
  "Update the engineering handbook",
  "Search for the onboarding documentation",
  "Add a comment to the design system page",
  "Query the project database for active projects",
  
  // Task Management
  "Create a task to review the API documentation",
  "Update the deployment task as complete",
  "Create a new Asana project for the website redesign",
  "Add a checklist to the launch preparation card",
  "Assign the code review task to Maria",
  
  // Video Conferencing
  "Schedule a Zoom call for tomorrow at 10am",
  "List all my upcoming Zoom meetings",
  "Cancel the client call next Thursday",
  "Get the recording from yesterday's all-hands",
  "Create a webinar for the product launch",
  
  // Social Media
  "Post a tweet about our new feature launch",
  "Reply to the comment on our LinkedIn post",
  "Search Twitter for mentions of our company",
  "Share the blog post on LinkedIn",
  "Send a DM to our partner on Twitter",
  
  // E-commerce
  "Create a new product listing for the t-shirt",
  "Update the inventory for item SKU-123",
  "List all pending orders from today",
  "Fulfill order #12345",
  "Create a new product collection for summer items",
  
  // CRM/Sales
  "Create a new lead for Acme Corp",
  "Convert the lead to an opportunity",
  "Create a deal worth $50k in HubSpot",
  "Send a follow-up email to the prospect",
  "Run a sales report for this quarter",
  
  // Cloud/Infrastructure
  "Launch a new EC2 instance for the staging environment",
  "Upload the backup file to S3",
  "Check the status of the production database",
  "List all running Lambda functions",
  "Get CloudWatch metrics for the API server",
  
  // Customer Support
  "Send a message to the customer about their issue",
  "Reply to the open support ticket",
  "Create a help article for password reset",
  "Tag the conversation as 'billing issue'",
  "Add a note to the customer profile",
  
  // Payments
  "Process a payment of $99 from customer",
  "Issue a refund for order #789",
  "Create a new subscription plan",
  "Generate an invoice for the monthly service",
  "Check the account balance",
  
  // Mixed/Complex queries
  "Find the email about the Q4 budget and add it to Drive",
  "Schedule a meeting and send calendar invites to the team",
  "Create a GitHub issue for the bug found in testing",
  "Search Slack for the API documentation link",
  "Upload the contract and share it with legal team",
  "Find available meeting times and create a Zoom call",
  "Create a task in Jira and assign it to the developer",
  "Post about the new feature on Twitter and LinkedIn",
  "Check the server status and send alert to on-call",
  "Generate sales report and email it to management",
  
  // More variety
  "Archive all emails older than 30 days",
  "Create a pivot table to analyze customer data",
  "Set a reminder for the code review deadline",
  "Export the spreadsheet as PDF",
  "Create a recurring task for weekly reports",
  "Find the Zoom recording and upload to Drive",
  "Reply to the GitHub code review comments",
  "Update all tickets in the current sprint",
  "Share the Notion page with external stakeholders",
  "Create labels for categorizing customer issues",
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
  // GPT-4o-mini pricing
  const promptCost = (promptTokens / 1_000_000) * 0.150; // $0.150 per 1M input tokens
  const completionCost = (completionTokens / 1_000_000) * 0.600; // $0.600 per 1M output tokens
  
  // OpenAI embedding pricing (text-embedding-3-small)
  const embeddingCost = (embeddingTokens / 1_000_000) * 0.020; // $0.020 per 1M tokens
  
  return promptCost + completionCost + embeddingCost;
}

// Estimate tokens (rough approximation: 4 chars = 1 token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
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
  
  console.log('🚀 Starting Comprehensive Benchmark\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Prepare all tools for Approach 1
  const allTools = mockServers.flatMap(server =>
    server.tools.map(tool => ({ ...tool, serverId: server.id }))
  );
  
  // OpenAI has a limit of 128 tools max
  const MAX_TOOLS = 128;
  const cappedTools = allTools.slice(0, MAX_TOOLS);
  const allToolsOpenAI = toolsToOpenAIFormat(cappedTools);

  console.log(`⚠️  OpenAI tool limit: 128 tools maximum`);
  console.log(`📊 Total available tools: ${allTools.length}`);
  console.log(`Approach 1: ${cappedTools.length} tools will be sent to LLM (${allTools.length - cappedTools.length} tools excluded!)\n`);

  // Initialize filters for Approaches 2 and 3
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
      model: 'Xenova/all-MiniLM-L6-v2', // Fast, reliable model (384 dimensions)
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
    { approach: 'All Tools (Capped at 128)', latencies: [], costs: [], toolCounts: [], errors: 0 },
    { approach: 'OpenAI Embeddings Filtering', latencies: [], costs: [], toolCounts: [], errors: 0 },
    { approach: 'Local Embeddings Filtering', latencies: [], costs: [], toolCounts: [], errors: 0 },
  ];

  // Run benchmark
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Running benchmark on 100 queries...\n');

  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    console.log(`[${i + 1}/100] "${query.substring(0, 60)}${query.length > 60 ? '...' : ''}"`);

    // Approach 1: All tools
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
      
      results[0].latencies.push(latency1);
      results[0].costs.push(cost1);
      results[0].toolCounts.push(cappedTools.length);
      
      console.log(`  Approach 1: ${latency1}ms, $${cost1.toFixed(6)}, ${cappedTools.length} tools (${allTools.length - cappedTools.length} excluded)`);
    } catch (error: any) {
      console.log(`  Approach 1: ERROR - ${error.message}`);
      results[0].errors++;
    }

    // Approach 2: OpenAI embeddings
    try {
      const filterStart2 = Date.now();
      const filterResult2 = await apiFilter.filter(query);
      const filterTime2 = Date.now() - filterStart2;
      
      const filteredTools2 = toolsToOpenAIFormat(filterResult2.tools);
      
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
      
      console.log(`  Approach 2: ${latency2}ms (filter: ${filterTime2}ms), $${cost2.toFixed(6)}, ${filterResult2.tools.length} tools`);
    } catch (error: any) {
      console.log(`  Approach 2: ERROR - ${error.message}`);
      results[1].errors++;
    }

    // Approach 3: Local embeddings
    try {
      const filterStart3 = Date.now();
      const filterResult3 = await localFilter.filter(query);
      const filterTime3 = Date.now() - filterStart3;
      
      const filteredTools3 = toolsToOpenAIFormat(filterResult3.tools);
      
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
      const cost3 = calculateCost(usage3.prompt_tokens, usage3.completion_tokens); // No embedding cost
      
      results[2].latencies.push(latency3);
      results[2].costs.push(cost3);
      results[2].toolCounts.push(filterResult3.tools.length);
      
      console.log(`  Approach 3: ${latency3}ms (filter: ${filterTime3}ms), $${cost3.toFixed(6)}, ${filterResult3.tools.length} tools\n`);
    } catch (error: any) {
      console.log(`  Approach 3: ERROR - ${error.message}\n`);
      results[2].errors++;
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
    
    console.log(`Latency:`);
    console.log(`  Average: ${avgLatency.toFixed(2)}ms`);
    console.log(`  P50: ${p50Latency.toFixed(2)}ms`);
    console.log(`  P95: ${p95Latency.toFixed(2)}ms`);
    console.log(`\nCost:`);
    console.log(`  Total (100 queries): $${totalCost.toFixed(4)}`);
    console.log(`  Average per query: $${avgCost.toFixed(6)}`);
    console.log(`  Estimated monthly (1M queries): $${(avgCost * 1_000_000).toFixed(2)}`);
    console.log(`\nTools:`);
    console.log(`  Average tools per query: ${avgTools.toFixed(1)}`);
    console.log(`\nErrors: ${result.errors}`);
  }

  // Comparison
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏆 COMPARISON');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('⚠️  CRITICAL: OpenAI limits tools to 128 maximum');
  console.log(`   Total available tools: ${allTools.length}`);
  console.log(`   Tools excluded in Approach 1: ${allTools.length - MAX_TOOLS}`);
  console.log(`   Tools used in Approach 2 & 3: ~20 (filtered from all ${allTools.length})\n`);
  console.log('   → Filtering is REQUIRED, not optional, for large tool sets!\n');

  const baseline = results[0];
  
  console.log('Latency Improvement vs All Tools:');
  results.forEach((r, i) => {
    if (i === 0) return;
    const baselineAvg = baseline.latencies.reduce((a, b) => a + b, 0) / baseline.latencies.length;
    const currentAvg = r.latencies.reduce((a, b) => a + b, 0) / r.latencies.length;
    const improvement = ((baselineAvg - currentAvg) / baselineAvg * 100).toFixed(1);
    const speedup = (baselineAvg / currentAvg).toFixed(2);
    console.log(`  ${r.approach}: ${improvement}% faster (${speedup}x speedup)`);
  });

  console.log('\nCost Savings vs All Tools:');
  results.forEach((r, i) => {
    if (i === 0) return;
    const baselineCost = baseline.costs.reduce((a, b) => a + b, 0);
    const currentCost = r.costs.reduce((a, b) => a + b, 0);
    const savings = ((baselineCost - currentCost) / baselineCost * 100).toFixed(1);
    const savedAmount = (baselineCost - currentCost).toFixed(4);
    console.log(`  ${r.approach}: ${savings}% cheaper (saved $${savedAmount} on 100 queries)`);
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
  
  console.log(`  Latency: Local is ${latencyDiff}% faster`);
  console.log(`  Cost: Local is ${costDiff}% cheaper`);

  console.log('\n✅ Benchmark complete!\n');
}

main().catch(console.error);

