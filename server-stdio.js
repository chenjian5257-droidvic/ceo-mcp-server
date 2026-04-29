#!/usr/bin/env node
/**
 * CEO MCP Server - STDIO版本
 * 符合MCP协议标准
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
function sendResponse(id, result, error = null) {
  const response = {
    jsonrpc: JSONRPC_VERSION,
    id: id
  };
  if (error) {
    response.error = error;
  } else {
    response.result = result;
  }
  console.log(JSON.stringify(response));
}

// 处理请求
function handleRequest(method, params, id) {
  switch (method) {
    case 'initialize':
      return {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'CEO-Assistant', version: '1.0.0' }
      };
    
    case 'tools/list':
      return { tools: tools };
    
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
      return { content: [{ type: 'text', text: text }] };
    }
    
    default:
      throw new Error(`Method not found: ${method}`);
  }
}

// 读取stdin
let buffer = '';

process.stdin.on('data', (chunk) => {
  buffer += chunk.toString();
  
  // 按行处理
  const lines = buffer.split('\n');
  buffer = lines.pop(); // 保留最后一行（可能不完整）
  
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const message = JSON.parse(line);
      const { id, method, params } = message;
      
      try {
        const result = handleRequest(method, params, id);
        sendResponse(id, result);
      } catch (err) {
        sendResponse(id, null, { code: -32603, message: err.message });
      }
    } catch (err) {
      // 忽略解析错误
    }
  }
});

process.stdin.on('end', () => {
  process.exit(0);
});

// 发送ready信号
console.log(JSON.stringify({ jsonrpc: JSONRPC_VERSION, id: null, result: { status: 'ready' } }));
