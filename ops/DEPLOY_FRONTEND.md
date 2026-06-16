# Argus 前端部署说明

前端项目路径：`argus-front`

## 部署前先改配置

修改：

```text
argus-front/ops/nginx.frontend.conf
```

确认域名正确：

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

并确认前端请求的后端地址已经指向实际后端服务地址，且带上 /argus 前缀，例如：http://zhangyanc.club:7777/argus 。

## 两套部署方式

### 方案一：服务器自己构建

使用文件：

```text
ops/docker-compose.yaml
```

首次部署 / 更新发布：

```bash
cd ~/argus/argus-front/ops
docker-compose -f docker-compose.yaml up -d --build argus-front
```

### 方案二：直接拉腾讯云公有镜像

使用文件：

```text
ops/docker-compose.image.yaml
```

当前公有镜像：

```bash
docker pull ccr.ccs.tencentyun.com/zhangyancheng/argus-front:1.0
```

首次部署 / 更新发布：

```bash
cd ~/argus/argus-front/ops
docker-compose -f docker-compose.image.yaml pull argus-front
docker-compose -f docker-compose.image.yaml up -d argus-front
```

## 查看状态

自己构建版：

```bash
cd ~/argus/argus-front/ops
docker-compose -f docker-compose.yaml ps
```

公有镜像版：

```bash
cd ~/argus/argus-front/ops
docker-compose -f docker-compose.image.yaml ps
```

## 看日志

自己构建版：

```bash
cd ~/argus/argus-front/ops
docker-compose -f docker-compose.yaml logs -f argus-front
```

公有镜像版：

```bash
cd ~/argus/argus-front/ops
docker-compose -f docker-compose.image.yaml logs -f argus-front
```

## 说明

- `docker-compose.yaml`：服务器自己构建前端镜像
- `docker-compose.image.yaml`：直接拉腾讯云公有镜像
- `2核2G` 机器更推荐使用“公有镜像版”

