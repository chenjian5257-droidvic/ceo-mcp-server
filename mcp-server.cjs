/**
 * CEO MCP Server - WebSocket版本
 * 暴露工具供小智AI通过WebSocket调用
 */

const WebSocket = require('/home/a/.npm-global/lib/node_modules/openclaw/node_modules/ws/index.js');

// MCP协议相关
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

// 处理MCP请求
async function handleRequest(method, params, id) {
  switch (method) {
    case 'initialize':
      return {
        jsonrpc: JSONRPC_VERSION,
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'CEO-Assistant', version: '1.0.0' }
        }
      };
    
    case 'tools/list':
      return {
        jsonrpc: JSONRPC_VERSION,
        id,
        result: { tools }
      };
    
    case 'tools/call': {
      const { name, arguments: args } = params;
      
      let result;
      switch (name) {
        case 'check_accounting':
          result = '今日记账数据：成本2215元，运费100元，数量77件（4月29日）';
          break;
        case 'get_status':
          result = 'CEO助手运行正常，2026年4月30日 00:27';
          break;
        case 'list_tasks':
          result = '当前任务：跨渠道同步配置中';
          break;
        default:
          result = `未知工具: ${name}`;
      }
      
      return {
        jsonrpc: JSONRPC_VERSION,
        id,
        result: {
          content: [{ type: 'text', text: result }]
        }
      };
    }
    
    default:
      return {
        jsonrpc: JSONRPC_VERSION,
        id,
        error: { code: -32601, message: `Method not found: ${method}` }
      };
  }
}

// 创建WebSocket服务器
const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log(`CEO MCP Server WebSocket 启动: ws://0.0.0.0:${PORT}`);

wss.on('connection', (ws) => {
  console.log('小智AI已连接');
  
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      const { id, method, params } = message;
      
      console.log('收到请求:', method);
      const response = await handleRequest(method, params, id);
      
      if (response) {
        ws.send(JSON.stringify(response));
      }
    } catch (err) {
      console.error('处理消息错误:', err);
      ws.send(JSON.stringify({
        jsonrpc: JSONRPC_VERSION,
        id: null,
        error: { code: -32700, message: 'Parse error' }
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('小智AI断开连接');
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket错误:', err);
  });
});

console.log(`等待小智AI连接...`);
