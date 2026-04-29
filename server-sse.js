/**
 * CEO MCP Server - HTTP/SSE版本
 * 供imcp.pro通过SSE模式调用
 */

import { createServer } from 'http';
import { URL } from 'url';

const PORT = process.env.PORT || 8080;
const JSONRPC_VERSION = '2.0';

const tools = [
  { name: 'check_accounting', description: '查询今日记账数据', inputSchema: { type: 'object', properties: {} } },
  { name: 'get_status', description: '获取CEO助手状态', inputSchema: { type: 'object', properties: {} } },
  { name: 'list_tasks', description: '列出当前任务', inputSchema: { type: 'object', properties: {} } }
];

let requestId = 1;
let sseClients = [];

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

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // SSE endpoint for client subscription
  if (url.pathname === '/sse' || url.pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    sseClients.push(res);
    console.log('SSE客户端连接，当前连接数:', sseClients.length);
    
    req.on('close', () => {
      sseClients = sseClients.filter(c => c !== res);
      console.log('SSE客户端断开，当前连接数:', sseClients.length);
    });
    return;
  }
  
  // MCP POST endpoint
  if (url.pathname === '/mcp' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const message = JSON.parse(body);
        console.log('收到请求:', message.method);
        
        if (message.method === 'tools/list' || message.method === 'tools/call') {
          const response = handleRequest(message.method, message.params);
          
          // 如果是SSE模式，广播给所有客户端
          if (sseClients.length > 0) {
            const sseData = `data: ${JSON.stringify(response)}\n\n`;
            sseClients.forEach(client => client.write(sseData));
          }
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(handleRequest(message.method, message.params)));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // MCP GET endpoint for tool list
  if (url.pathname === '/mcp' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(handleRequest('tools/list', {})));
    return;
  }
  
  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }
  
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`CEO MCP Server HTTP/SSE 启动: http://0.0.0.0:${PORT}`);
  console.log(`SSE端点: http://0.0.0.0:${PORT}/sse`);
  console.log(`MCP端点: http://0.0.0.0:${PORT}/mcp`);
});
