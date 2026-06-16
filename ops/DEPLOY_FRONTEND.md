# Argus 前端部署说明

前端项目路径：`argus-front`

当前访问域名示例：

- `http://zhangyanc.club`
- `http://www.zhangyanc.club`

## 公有镜像地址

当前可直接使用腾讯云公有镜像：

```bash
docker pull ccr.ccs.tencentyun.com/zhangyancheng/argus-front:1.0
```

如果仓库已公开，通常不需要执行 `docker login`。  
只有在拉取镜像时出现鉴权或频率限制问题，再补充登录：

```bash
docker login ccr.ccs.tencentyun.com --username=100006655230
```

## 部署前先改配置

### 1. 修改 `ops/nginx.frontend.conf`

确认域名配置正确：

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

### 2. 确认前端接口地址

前端环境配置里的后端接口地址，需要指向实际部署后的后端域名或后端服务地址。

### 3. 可选：镜像地址

如果需要切换镜像版本，可在 shell 环境中增加：

```env
ARGUS_FRONT_IMAGE=ccr.ccs.tencentyun.com/zhangyancheng/argus-front:1.0
```

## 启动

进入前端部署目录：

```bash
cd ~/argus/argus-front/ops
```

推荐：直接使用公有镜像启动：

```bash
docker-compose pull argus-front
docker-compose up -d argus-front
```

首次部署或需要本地重建镜像时：

```bash
docker-compose up -d --build
```

只是重启服务：

```bash
docker-compose up -d
```

## 代码更新后如何发布

前端代码改动后重新发布：

```bash
cd ~/argus/argus-front/ops
docker-compose pull argus-front
docker-compose up -d argus-front
```

如果只是重启容器，不重新打包：

```bash
cd ~/argus/argus-front/ops
docker-compose restart argus-front
```

## 查看状态

```bash
cd ~/argus/argus-front/ops
docker-compose ps
```

## 看日志

容器日志：

```bash
cd ~/argus/argus-front/ops
docker-compose logs -f argus-front
```

最近日志：

```bash
cd ~/argus/argus-front/ops
docker-compose logs --tail=100 argus-front
```

## SSH 断开后怎么处理

重新登录服务器后执行：

```bash
cd ~/argus/argus-front/ops
docker-compose ps
docker-compose logs --tail=100 argus-front
```

如果服务没起来，再重新执行一次：

```bash
docker-compose pull argus-front
docker-compose up -d argus-front
```

## 说明

- 当前前端镜像支持直接从腾讯云镜像仓库拉取，不需要在服务器本机构建
- 只有需要重新制作镜像时，才使用 `docker-compose up -d --build`
- 已添加 `.dockerignore`，减少无关文件进入构建上下文

