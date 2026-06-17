# Argus 前端部署说明

前端项目路径：`argus-front`

## 访问地址

前端访问地址：

```text
http://zhangyanc.club/
```

后端接口地址：

```text
http://zhangyanc.club/argus/
```

后端文档地址：

```text
http://zhangyanc.club/docs
```

## 部署前先改配置

修改：

```text
argus-front/config/defaultSettings.ts
argus-front/ops/nginx.frontend.conf
```

其中：

- `defaultSettings.ts` 中 `apiUrl` 推荐填写 `zhangyanc.club/argus`
- `nginx.frontend.conf` 只负责前端静态资源
- 对外统一入口由宿主机 Nginx 负责，配置文件见 `argus-end/ops/nginx.conf`

## 宿主机准备

当前部署方案依赖宿主机 Nginx 作为统一入口。

如果服务器还没安装 Nginx，先安装：

```bash
sudo apt update
sudo apt install -y nginx
```

安装后确认服务状态：

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl status nginx
```

宿主机 Nginx 实际转发配置文件在：

```text
argus-end/ops/nginx.conf
```

加载方式：

```bash
sudo cp ~/argus/argus-end/ops/nginx.conf /etc/nginx/conf.d/argus.conf
sudo nginx -t
sudo systemctl reload nginx
```
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
- 前端容器对宿主机暴露 `8000`
- 对外无端口访问由宿主机 Nginx 统一代理实现
- `2核2G` 机器更推荐使用“公有镜像版”

