#!/usr/bin/env node
/**
 * CEO MCP Server - STDIO版本
 * 通过stdin/stdout与MCP客户端通信
 */

const JSONRPC_VERSION = '2.0';

const tools = [
  { name: 'check_accounting', description: '查询今日记账数据', inputSchema: { type: 'object', properties: {} } },
  { name: 'get_status', description: '获取CEO助手状态', inputSchema: { type: 'object', properties: {} } },
  { name: 'list_tasks', description: '列出当前任务', inputSchema: { type: 'object', properties: {} } }
];

let requestId = 1;

function handleRequest(method, params) {
  const id = requestId++;
  switch (method) {
    case 'initialize':
      return { jsonrpc: JSONRPC_VERSION, id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'CEO-Assistant', version: '1.0.0' } } };
    case 'tools/list':
      return { jsonrpc: JSONRPC_VERSION, id, result: { tools } };
    case 'tools/call': {
      const { name } = params;
      let result;
      switch (name) {
        case 'check_accounting': result = '今日记账数据：成本2215元，运费100元，数量77件（4月29日）'; break;
        case 'get_status': result = 'CEO助手运行正常，2026年4月30日'; break;
        case 'list_tasks': result = '当前任务：小智AI接入OpenClaw配置中'; break;
        default: result = `未知工具: ${name}`;
      }
      return { jsonrpc: JSONRPC_VERSION, id, result: { content: [{ type: 'text', text: result }] } };
    }
    default:
      return { jsonrpc: JSONRPC_VERSION, id, error: { code: -32601, message: `Method not found: ${method}` } };
  }
}

function sendResponse(response) {
  console.log(JSON.stringify(response));
}

process.stdin.on('data', (data) => {
  try {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      const message = JSON.parse(line);
      if (message.method === 'tools/list' || message.method === 'tools/call' || message.method === 'initialize') {
        const response = handleRequest(message.method, message.params);
        if (response) sendResponse(response);
      }
    }
  } catch (err) {
    // Ignore parse errors for non-JSON input
  }
});

process.stdin.on('end', () => {
  process.exit(0);
});
