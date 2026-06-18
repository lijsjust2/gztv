# GDTV Live Proxy - 荔枝网直播源代理服务

[![Docker Build](https://github.com/lijsjust2/gztv/actions/workflows/docker-build.yml/badge.svg)](https://github.com/lijsjust2/gztv/actions/workflows/docker-build.yml)
[![Docker Pulls](https://img.shields.io/docker/pulls/lijsfun/gdtv-live-proxy.svg)](https://hub.docker.com/r/lijsfun/gdtv-live-proxy)
[![GitHub Release](https://img.shields.io/github/release/lijsjust2/gztv.svg)](https://github.com/lijsjust2/gztv/releases)

荔枝网(GDTV)直播源代理服务 - 支持 `direct302` / `hybrid` / `proxy` 多模式，实现固定直播流链接。

## 功能特性

- **固定直播链接** - 将动态变化的直播流地址映射为固定格式的代理接口
- **多播放模式** - 支持频道直 302、m3u8 代理 + TS 302、全代理三种模式
- **预加载优化** - 可选预加载后续 TS 片段，提升连续播放体验
- **多架构支持** - AMD64 / ARM64 双架构 Docker 镜像
- **M3U 播放列表** - 标准 M3U 格式输出，兼容 IPTV 播放器
- **密码保护** - 可选访问密码，保护服务安全

## 频道列表

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
| `gmode` | 播放模式：`direct302` / `hybrid` / `proxy` | `hybrid` |
| `gwarmup` | 启动时是否预热所有频道流地址，设为 `false` 可加快启动并降低上游请求 | `true` |
| `gpreload` | 是否启用 TS 预加载和频道后台预加载 | `true` |
| `gpreloadIdleMinutes` | 后台预加载空闲停止时间，单位分钟 | `10` |
| `gmaxTsCache` | TS 预加载缓存最大数量，避免长期运行内存增长 | `200` |
| `gallowedHosts` | `/redirect` 允许跳转的目标域名后缀，逗号分隔 | `gdtv.cn,itouchtv.cn` |
| `gdebug` | 是否输出调试日志 | `false` |

### 自定义配置示例

```bash
# 自定义端口
docker run -d -p 8080:8080 -e gport=8080 lijsfun/gdtv-live-proxy:latest

# 添加密码保护
docker run -d -p 5678:5678 -e gpass=mypassword lijsfun/gdtv-live-proxy:latest
# 访问地址变为 http://<IP>:5678/mypassword/m3u

# 设置公网地址（用于部署到服务器）
docker run -d -p 5678:5678 -e ghost=http://myserver.com:5678 lijsfun/gdtv-live-proxy:latest

# 极限省资源模式：频道接口直接 302 到真实 m3u8，视频流量完全不走本服务
docker run -d -p 5678:5678 -e gmode=direct302 -e gwarmup=false -e gpreload=false lijsfun/gdtv-live-proxy:latest

# 推荐默认模式：m3u8 由服务端改写，TS 片段 302 到 CDN
docker run -d -p 5678:5678 -e gmode=hybrid lijsfun/gdtv-live-proxy:latest

# 全代理兜底模式：m3u8 和 TS/key 都由服务端代理，最稳定但消耗服务器带宽
docker run -d -p 5678:5678 -e gmode=proxy lijsfun/gdtv-live-proxy:latest

# 低资源模式：跳过启动预热并关闭 TS 预加载
docker run -d -p 5678:5678 -e gwarmup=false -e gpreload=false lijsfun/gdtv-live-proxy:latest
```

## 工作原理

### direct302 模式

```
播放器 → http://<IP>:5678/gdws
         ↓
服务端获取真实 m3u8 地址
         ↓
302 Location: 真实 m3u8
         ↓
播放器直连荔枝网/CDN 请求 m3u8 和 TS
```

这是最省服务器资源的模式，视频流量完全不经过本服务。缺点是如果官方 m3u8/token 过期，部分播放器可能需要重新打开频道才能恢复。

### hybrid 模式（默认推荐）

```
播放器 → http://<IP>:5678/gdws
         ↓
服务端获取 m3u8 → 改写 ts/key URL → 返回给播放器
         ↓
播放器请求 ts/key → http://<IP>:5678/redirect/gdws/编码URL
         ↓
缓存命中：服务端返回预加载片段
缓存未命中：302 重定向到 CDN，播放器直连 CDN
```

这是稳定性和资源消耗比较均衡的模式，视频主体流量仍然由播放器直连 CDN。

### proxy 模式

```
播放器 → http://<IP>:5678/gdws
         ↓
服务端获取 m3u8 → 改写 ts/key URL → 返回给播放器
         ↓
播放器请求 ts/key → http://<IP>:5678/proxy/gdws/编码URL
         ↓
服务端请求 CDN 并把内容返回给播放器
```

这是兼容性最强的兜底模式，但会消耗本服务器带宽，不建议多人或长期公开使用。

### 关键特性

1. **direct302** - 频道接口直接跳转到最新真实 m3u8，服务器资源消耗最低
2. **m3u8 改写** - hybrid/proxy 模式下，ts/key URL 替换为固定服务 URL
3. **TS 重定向** - hybrid 模式默认让播放器直连 CDN，显著降低服务器带宽占用
4. **TS 全代理** - proxy 模式由服务端转发 ts/key，兼容性更强但消耗带宽
5. **TS 预加载** - 缓存命中时由服务端直接返回片段，缓存有上限并会自动清理
6. **自动刷新** - m3u8 缓存约 10 秒，流地址缓存 2 小时，失败时自动重新获取
7. **双策略获取** - API 优先，Puppeteer 模拟浏览器降级
8. **安全校验** - `/redirect` 和 `/proxy` 只允许访问配置的域名后缀，避免开放跳转/代理滥用

## 技术架构

- **Node.js** - 服务端运行环境
- **Puppeteer** - 模拟浏览器获取直播流（降级方案）
- **HLS 协议** - HTTP Live Streaming 流媒体协议
- **多播放模式** - direct302 / hybrid / proxy

## 镜像大小说明

Docker 镜像约 280MB，主要包含：
- Chromium 浏览器（~200MB）- Puppeteer 降级方案必需
- Node.js + 依赖（~30MB）
- 系统库（~50MB）

Chromium 作为降级方案，当荔枝网 API 签名失效时，通过模拟浏览器获取直播流，确保服务稳定性。

## 常见问题

### Q: 播放一段时间后停止？

A: 本项目会自动刷新 m3u8/流地址，并通过 Hybrid 模式降低 token 过期影响。如果仍有问题，请检查：
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