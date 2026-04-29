#!/usr/bin/env node
/**
 * CEO MCP Server - 纯JavaScript MCP STDIO实现
 */

const JSONRPC_VERSION = '2.0';

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

let requestId = 0;

// 发送响应
function send(id, result, error = null) {
  const response = { jsonrpc: JSONRPC_VERSION, id };
  if (error) {
    response.error = error;
  } else {
    response.result = result;
  }
  process.stdout.write(JSON.stringify(response) + '\n');
}

// 处理请求
function handle(method, params, id) {
  switch (method) {
    case 'initialize':
      return {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'CEO-Assistant', version: '1.0.0' }
      };
    case 'tools/list':
      return { tools };
    case 'tools/call': {
      const { name } = params;
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
      return { content: [{ type: 'text', text }] };
    }
    default:
      throw new Error(`Method not found: ${method}`);
  }
}

// 读取stdin
let buffer = '';
process.stdin.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop();
  
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      const { id, method, params } = msg;
      try {
        const result = handle(method, params, id);
        send(id, result);
      } catch (err) {
        send(id, null, { code: -32603, message: err.message });
      }
    } catch (e) {
      // ignore parse errors
    }
  }
});

process.stdin.on('end', () => process.exit(0));
