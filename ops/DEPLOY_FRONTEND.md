# Argus 前端部署说明

前端项目路径：`argus-front`

## 部署前先改 1 处

### 修改 `ops/nginx.frontend.conf`

当前域名：

- `zhangyanc.club`
- `www.zhangyanc.club`

配置示例：

```nginx
server {
  listen 80;
  server_name zhangyanc.club www.zhangyanc.club;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

## 启动

首次部署或依赖变更：

```bash
docker compose -f ops/docker-compose.yaml up -d --build
```

日常前端代码发布：

```bash
docker compose -f ops/docker-compose.yaml up -d --build
```

如果只是重启容器，不重新打包：

```bash
docker compose -f ops/docker-compose.yaml restart argus-front
```

## 检查

查看容器：

```bash
docker compose -f ops/docker-compose.yaml ps
```

查看前端日志：

```bash
docker compose -f ops/docker-compose.yaml logs -f argus-front
```

## 说明

- 已添加 `.dockerignore`，减少无关文件进入 Docker 构建上下文
- `package.json` / `package-lock.json` 不变时，`npm install` 层会优先复用 Docker 缓存
