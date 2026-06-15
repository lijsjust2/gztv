# GDTV Live Proxy - 荔枝网直播源代理服务

[![Docker Build](https://github.com/lijsjust2/gztv/actions/workflows/docker-build.yml/badge.svg)](https://github.com/lijsjust2/gztv/actions/workflows/docker-build.yml)
[![Docker Pulls](https://img.shields.io/docker/pulls/lijsfun/gdtv-live-proxy.svg)](https://hub.docker.com/r/lijsfun/gdtv-live-proxy)
[![GitHub Release](https://img.shields.io/github/release/lijsjust2/gztv.svg)](https://github.com/lijsjust2/gztv/releases)

荔枝网(GDTV)直播源代理服务 - 全代理模式，实现固定直播流链接，支持无缝持续播放。

## 功能特性

- **固定直播链接** - 将动态变化的直播流地址映射为固定格式的代理接口
- **全代理模式** - m3u8 + ts 片段全部代理转发，解决 token 过期问题
- **无缝持续播放** - 自动刷新 token，确保播放不中断
- **多架构支持** - AMD64 / ARM64 双架构 Docker 镜像
- **M3U 播放列表** - 标准 M3U 格式输出，兼容 IPTV 播放器
- **密码保护** - 可选访问密码，保护服务安全

## 频道列表

### 央视频道（静态源）

| ID | 频道名称 | 直播链接 |
|----|----------|----------|
| cctv1 | CCTV1综合 | `/cctv1` |
| cctv2 | CCTV2财经 | `/cctv2` |
| cctv3 | CCTV3综艺 | `/cctv3` |
| cctv4 | CCTV4中文国际 | `/cctv4` |
| cctv5 | CCTV5体育 | `/cctv5` |
| cctv5p | CCTV5+体育赛事 | `/cctv5p` |
| cctv6 | CCTV6电影 | `/cctv6` |
| cctv7 | CCTV7国防军事 | `/cctv7` |
| cctv8 | CCTV8电视剧 | `/cctv8` |
| cctv9 | CCTV9纪录 | `/cctv9` |
| cctv10 | CCTV10科教 | `/cctv10` |
| cctv11 | CCTV11戏曲 | `/cctv11` |
| cctv12 | CCTV12社会与法 | `/cctv12` |
| cctv13 | CCTV13新闻 | `/cctv13` |
| cctv14 | CCTV14少儿 | `/cctv14` |
| cctv15 | CCTV15音乐 | `/cctv15` |
| cctv16 | CCTV16奥林匹克 | `/cctv16` |
| cctv17 | CCTV17农业农村 | `/cctv17` |

### 广东频道（GDTV动态源）

| ID | 频道名称 | pk | 直播链接 |
|----|----------|-----|----------|
| gdws | 广东卫视 | 43 | `/gdws` |
| gdzj | 广东珠江 | 44 | `/gdzj` |
| gdxw | 广东新闻 | 45 | `/gdxw` |
| gdms | 广东民生 | 48 | `/gdms` |
| gdty | 广东体育 | 47 | `/gdty` |
| dwqws | 大湾区卫视 | 51 | `/dwqws` |
| dwqwhw | 大湾区卫视（海外版） | 46 | `/dwqwhw` |
| gdys | 广东影视 | 53 | `/gdys` |
| 4k | 4K超高清 | 16 | `/4k` |
| gdse | 广东少儿 | 54 | `/gdse` |
| jjkt | 嘉佳卡通 | 66 | `/jjkt` |
| nfgo | 南方购物 | 42 | `/nfgo` |
| lqxq | 岭南戏曲 | 15 | `/lqxq` |
| gdyd | 广东移动 | 74 | `/gdyd` |
| gdjdj | 广东台经典剧 | 100 | `/gdjdj` |
| jlp | 纪录片 | 94 | `/jlp` |
| jk | 健康 | 99 | `/jk` |
| grtsh | GRTN生活频道 | 102 | `/grtsh` |

> **频道类型说明**：
> - **央视频道**：使用稳定的第三方静态 m3u8 源，直接代理转发
> - **广东频道**：通过荔枝网 API 动态获取带 token 的直播流地址，自动刷新 token 确保持续播放

## 快速部署

### Docker 部署（推荐）

```bash
# 从 Docker Hub 拉取（自动选择架构）
docker pull lijsfun/gdtv-live-proxy:latest

# 运行容器
docker run -d \
  --name gdtv-proxy \
  -p 5678:5678 \
  -e TZ=Asia/Shanghai \
  --restart unless-stopped \
  lijsfun/gdtv-live-proxy:latest
```

### Docker Compose 部署

```yaml
version: '3'
services:
  gdtv-proxy:
    image: lijsfun/gdtv-live-proxy:latest
    container_name: gdtv-proxy
    ports:
      - "5678:5678"
    environment:
      - TZ=Asia/Shanghai
      - gport=5678
      - gpass=
    restart: unless-stopped
```

```bash
docker-compose up -d
```

### 从 Releases 下载镜像文件

```bash
# 下载镜像文件
wget https://github.com/lijsjust2/gztv/releases/download/v1.0.0/gdtv-live-proxy-amd64.tar.gz

# 导入镜像
docker load -i gdtv-live-proxy-amd64.tar.gz

# 运行
docker run -d -p 5678:5678 lijsfun/gdtv-live-proxy:latest
```

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/lijsjust2/gztv.git
cd gztv

# 安装依赖
npm install

# 启动服务
node app.js
```

## 使用方法

启动服务后，访问以下地址：

| 地址 | 说明 |
|------|------|
| `http://<IP>:5678` | M3U 播放列表（直接显示） |
| `http://<IP>:5678/m3u` | M3U 播放列表 |
| `http://<IP>:5678/txt` | TXT 格式播放列表 |
| `http://<IP>:5678/gdws` | 广东卫视直播流 |
| `http://<IP>:5678/api/channels` | 频道列表 JSON |

### IPTV 播放器配置

将 `http://<IP>:5678` 或 `http://<IP>:5678/m3u` 作为直播源地址添加到 IPTV 播放器即可。

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `gport` | 服务端口 | 5678 |
| `ghost` | 公网访问地址（用于生成 M3U 中的链接） | 空 |
| `gpass` | 访问密码（添加后访问格式 `http://<IP>:port/<密码>/...`） | 空 |

### 自定义配置示例

```bash
# 自定义端口
docker run -d -p 8080:8080 -e gport=8080 lijsfun/gdtv-live-proxy:latest

# 添加密码保护
docker run -d -p 5678:5678 -e gpass=mypassword lijsfun/gdtv-live-proxy:latest
# 访问地址变为 http://<IP>:5678/mypassword/m3u

# 设置公网地址（用于部署到服务器）
docker run -d -p 5678:5678 -e ghost=http://myserver.com:5678 lijsfun/gdtv-live-proxy:latest
```

## 工作原理

```
播放器 → http://<IP>:5678/gdws
         ↓
服务端获取 m3u8 → 改写 ts 片段 URL → 返回给播放器
         ↓
播放器请求 ts 片段 → http://<IP>:5678/ts/gdws/编码URL
         ↓
服务端代理转发到 CDN → 返回视频数据给播放器
```

### 关键特性

1. **m3u8 改写** - ts 片段 URL 替换为代理 URL，播放器所有请求都经过代理
2. **ts 片段代理** - 服务端解码 URL 后直接请求 CDN，避免编码问题
3. **自动刷新** - m3u8 缓存 5 秒，流地址缓存 2 小时，token 过期自动重新获取
4. **双策略获取** - API 优先，Puppeteer 模拟浏览器降级

## 技术架构

- **Node.js** - 服务端运行环境
- **Puppeteer** - 模拟浏览器获取直播流（降级方案）
- **HLS 协议** - HTTP Live Streaming 流媒体协议
- **全代理模式** - m3u8 + ts 全部代理转发

## 镜像大小说明

Docker 镜像约 280MB，主要包含：
- Chromium 浏览器（~200MB）- Puppeteer 降级方案必需
- Node.js + 依赖（~30MB）
- 系统库（~50MB）

Chromium 作为降级方案，当荔枝网 API 签名失效时，通过模拟浏览器获取直播流，确保服务稳定性。

## 常见问题

### Q: 播放一段时间后停止？

A: 本项目采用全代理模式，已解决此问题。如果仍有问题，请检查：
- 服务是否正常运行
- 网络连接是否稳定
- 荔枝网服务是否正常

### Q: 首次加载较慢？

A: 首次访问需要启动 Chromium 获取直播流，约需 5-10 秒。后续访问会使用缓存，响应更快。

### Q: 如何添加更多频道？

A: 编辑 `channels.js` 文件，添加频道信息：
```javascript
{ id: '频道ID', name: '频道名称', pk: 频道pk, group: '分组', logo: 'logoURL' }
```

## 许可证

MIT License

## 致谢

- 参考项目：[migu_video](https://github.com/lijsjust2/migu_video)
- 数据来源：[荔枝网 GDTV](https://www.gdtv.cn)