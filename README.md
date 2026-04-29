# CEO MCP Server

小智AI接入OpenClaw的MCP Server。

## 功能

暴露以下工具供小智AI调用：
- `check_accounting` - 查询今日记账数据
- `get_status` - 获取CEO助手状态
- `list_tasks` - 列出当前任务

## 运行

```bash
node mcp-server.cjs
```

## WebSocket地址

`ws://192.168.1.11:8080`
