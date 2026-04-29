/**
 * CEO MCP Server
 * 供小智AI通过WebSocket调用
 */

import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 8080;
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

const wss = new WebSocketServer({ port: PORT });
console.log(`CEO MCP Server WebSocket 启动: ws://0.0.0.0:${PORT}`);

wss.on('connection', (ws) => {
  console.log('小智AI已连接');
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.method === 'tools/list' || msg.method === 'tools/call') {
        const response = handleRequest(msg.method, msg.params);
        ws.send(JSON.stringify(response));
      }
    } catch (err) {
      console.error('处理消息错误:', err);
    }
  });
  ws.on('close', () => console.log('小智AI断开连接'));
  ws.on('error', (err) => console.error('WebSocket错误:', err));
});

console.log('等待小智AI连接...');
