#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BasecampClient } from './api-client.js';
import { registerTools } from './tools.js';

const required = ['BASECAMP_ACCOUNT_ID', 'BASECAMP_USERNAME', 'BASECAMP_PASSWORD', 'BASECAMP_USER_AGENT'];
const missing = required.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('See .env.example for the required configuration.');
  process.exit(1);
}

const client = new BasecampClient({
  accountId: process.env.BASECAMP_ACCOUNT_ID,
  username: process.env.BASECAMP_USERNAME,
  password: process.env.BASECAMP_PASSWORD,
  userAgent: process.env.BASECAMP_USER_AGENT,
});

const server = new McpServer({ name: 'basecamp2', version: '1.0.0' });
registerTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Basecamp 2 MCP server running on stdio');
