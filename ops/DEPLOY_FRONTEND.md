# Argus 前端部署文档

前端项目路径：`argus-front`

## 访问地址

- 平台首页：`http://你的域名或IP/`
- 后端接口：`http://你的域名或IP/argus/`
- 后端接口文档：`http://你的域名或IP/docs`
- OpenAPI：`http://你的域名或IP/openapi.json`

默认端口：

- 前端容器：`127.0.0.1:8000`
- 后端容器：`127.0.0.1:7777`
- 宿主机统一入口：Nginx

## 本地启动

本机建议先安装：

- `Node.js 18+`
- `npm`

前端改这里：

```text
argus-front/config/defaultSettings.ts
```

本机联调推荐：

```ts
apiUrl: 'localhost:7777/argus'
```

如果后端也在本机启动，同时确认：

```text
argus-end/conf/dev.env
```

至少要让后端跑在：

```env
SERVER_PORT=7777
PUBLIC_BASE_URL=http://localhost:8000
```

并且本机已经启动：

- `MySQL`
- `Redis`
- `RabbitMQ`
- `RustFS / S3 兼容对象存储`

启动命令：

```bash
cd ~/argus/argus-front
npm install
npm run start
```

## 服务器部署

### 服务器部署前要改的地方

1. `argus-front/config/defaultSettings.ts`
2. `argus-front/ops/nginx.frontend.conf`
3. `argus-end/ops/nginx.conf`
4. `argus-end/conf/pro.env`

如果你用域名部署：

- `config/defaultSettings.ts` 的 `apiUrl` 改成 `你的域名/argus`
- `ops/nginx.frontend.conf` 的 `server_name` 改成你的域名
- `argus-end/ops/nginx.conf` 的 `server_name` 改成你的域名
- `argus-end/conf/pro.env` 的 `PUBLIC_BASE_URL` 改成 `http://你的域名` 或 `https://你的域名`

如果你用 IP 部署：

- `config/defaultSettings.ts` 的 `apiUrl` 改成 `服务器IP/argus`
- `ops/nginx.frontend.conf` 的 `server_name` 改成 `_`
- `argus-end/ops/nginx.conf` 的 `server_name` 改成 `_`
- `argus-end/conf/pro.env` 的 `PUBLIC_BASE_URL` 改成 `http://服务器IP`

### 宿主机准备

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 方式一：服务器本机构建

```bash
cd ~/argus/argus-front/ops
docker-compose -f docker-compose.yaml up -d --build argus-front
```

### 方式二：使用公有镜像

```bash
cd ~/argus/argus-front/ops
docker-compose -f docker-compose.image.yaml pull argus-front
docker-compose -f docker-compose.image.yaml up -d argus-front
```

### Nginx

前端静态资源文件：

```text
argus-front/ops/nginx.frontend.conf
```

宿主机统一入口文件：

```text
argus-end/ops/nginx.conf
```

加载命令：

```bash
sudo cp ~/argus/argus-end/ops/nginx.conf /etc/nginx/conf.d/argus.conf
sudo nginx -t
sudo systemctl reload nginx
```

### 验证

查看状态：

```bash
cd ~/argus/argus-front/ops
docker-compose -f docker-compose.yaml ps
docker-compose -f docker-compose.image.yaml ps
```

查看日志：

```bash
cd ~/argus/argus-front/ops
docker-compose -f docker-compose.yaml logs -f argus-front
docker-compose -f docker-compose.image.yaml logs -f argus-front
```

能正常打开下面这些地址，就说明部署基本成功：

- `http://你的域名或IP/`
- `http://你的域名或IP/docs`
- `http://你的域名或IP/openapi.json`
