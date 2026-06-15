# GDTV Live Proxy - Node.js 项目
# 多阶段构建，最终镜像基于 Alpine

# === 构建阶段 ===
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json* ./

# 安装依赖（包括 puppeteer-core，但不安装 Chromium）
RUN npm ci --omit=dev --ignore-scripts || npm install --omit=dev --ignore-scripts

# === 运行阶段 ===
FROM node:20-alpine

# 安装 Chromium 和依赖（Puppeteer 需要）
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    tzdata

# 设置 Puppeteer 使用系统 Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# 从构建阶段复制依赖
COPY --from=builder /app/node_modules ./node_modules

# 复制应用代码
COPY app.js channels.js config.js ./

# 使用 node 镜像自带的 node 用户
RUN chown -R node:node /app

USER node

# 环境变量
ENV NODE_ENV=production
ENV gport=5678
ENV ghost=""
ENV gpass=""
ENV TZ=Asia/Shanghai

# 暴露端口
EXPOSE 5678

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${gport}/ || exit 1

# 启动服务
CMD ["node", "app.js"]