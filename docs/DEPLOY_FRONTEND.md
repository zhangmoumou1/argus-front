# Argus 前端部署说明

前端项目路径：`argus-front`

## 部署前先改配置

### 1. 修改 `config/defaultSettings.ts`

可直接参照示例：

```ts
apiUrl: '114.132.241.138:7777'
https: false
backend: false
```

### 2. 如果 `src/consts/config.ts` 有写死地址，同步改成后端地址

例如：

```ts
http://114.132.241.138:7777
ws://114.132.241.138:7777
```

## 启动步骤

在前端项目根目录执行：

```bash
docker compose -f ops/docker-compose.yaml up -d --build
```

## 说明

- 前端和后端分开部署
- 前端只连后端 API / WebSocket，不直接连 MySQL、Redis、ui_runner
