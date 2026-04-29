#!/usr/bin/env node
/**
 * CEO MCP Server - 使用官方MCP SDK STDIO传输
 */

const path = require('path');
const sdkPath = path.join(__dirname, 'node_modules/@modelcontextprotocol/sdk/dist/cjs');

const { Server } = require(path.join(sdkPath, 'server/index.js'));
const { StdioServerTransport } = require(path.join(sdkPath, 'server/stdio.js'));
const { ListToolsRequestSchema, CallToolRequestSchema } = require(path.join(sdkPath, 'types.js'));

// 工具定义
const tools = [
  {
    name: 'check_accounting',
    description: '查询今日记账数据',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_status',
    description: '获取CEO助手状态',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'list_tasks',
    description: '列出当前任务',
    inputSchema: { type: 'object', properties: {} }
  }
];

const server = new Server(
  {
    name: 'CEO-Assistant',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// 处理工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  let text;
  
  switch (name) {
    case 'check_accounting':
      text = '今日记账数据：成本2215元，运费100元，数量77件（4月29日）';
      break;
    case 'get_status':
      text = 'CEO助手运行正常，2026年4月30日';
      break;
    case 'list_tasks':
      text = '当前任务：小智AI接入OpenClaw配置中';
      break;
    default:
      text = `未知工具: ${name}`;
  }
  
  return {
    content: [{ type: 'text', text }]
  };
});

const transport = new StdioServerTransport();
server.connect(transport);
