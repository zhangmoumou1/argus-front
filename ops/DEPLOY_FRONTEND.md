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

在前端项目根目录执行：

```bash
docker compose -f ops/docker-compose.yaml up -d --build
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

