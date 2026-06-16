FROM node:18.20.4-alpine AS builder
ENV NODE_OPTIONS=--max-old-space-size=2048
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps --no-package-lock
COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY ops/nginx.frontend.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


