import http from "node:http"
import https from "node:https"
import crypto from "node:crypto"
import fs from "node:fs"
import { execSync } from "node:child_process"
import { host, pass, port } from "./config.js"
import { channels, getChannelById, getGroups } from "./channels.js"

// 颜色输出
const log = {
  ok: (msg) => console.log("\x1b[32m" + msg + "\x1b[0m"),
  err: (msg) => console.log("\x1b[31m" + msg + "\x1b[0m"),
  info: (msg) => console.log("\x1b[35m" + msg + "\x1b[0m"),
  warn: (msg) => console.log("\x1b[33m" + msg + "\x1b[0m"),
  dbg: (msg) => console.log("\x1b[36m" + msg + "\x1b[0m"),
}

// === 配置 ===
const API_BASE = "https://gdtv-api.gdtv.cn/api/tv/v2/tvChannel/"
const CACHE_TTL = 2 * 60 * 60 * 1000  // 2小时缓存（m3u8的t_token有效期约2-3小时）
const M3U8_CACHE_TTL = 5 * 1000        // m3u8内容缓存5秒（直播流片段更新快）
const TIMEOUT = 15000

// === 签名常量 ===
const CA_KEY = "89541443007807288657755311869534"
const CA_SECRET = "df946ae0c35311e9a53e6fa3ca3b3e7f"

// === 缓存 ===
const streamUrlCache = {}   // pk -> { url, valTime }  流地址缓存
const m3u8Cache = {}        // pk -> { content, baseUrl, valTime }  m3u8内容缓存

// === Puppeteer 实例 ===
let browser = null
let browserLaunching = false

/**
 * HTTP/HTTPS GET 请求
 */
function httpGet(urlStr, headers, timeoutMs) {
  return new Promise(function(resolve, reject) {
    var u = new URL(urlStr)
    var mod = u.protocol === "https:" ? https : http
    var opts = {
      hostname: u.hostname,
      port: u.port || (u.protocol === "https:" ? 443 : 80),
      path: u.pathname + u.search,
      method: "GET",
      headers: headers || {},
      timeout: timeoutMs || 8000,
    }
    var req = mod.get(opts, function(res) {
      // 处理重定向
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        var location = res.headers.location
        // 相对路径转绝对路径
        if (location.startsWith("/")) {
          location = u.protocol + "//" + u.host + location
        }
        httpGet(location, headers, timeoutMs).then(resolve).catch(reject)
        return
      }
      var chunks = []
      res.on("data", function(c) { chunks.push(c) })
      res.on("end", function() {
        var body = Buffer.concat(chunks)
        resolve({ status: res.statusCode, headers: res.headers, body: body })
      })
      res.on("error", reject)
    })
    req.on("error", reject)
    req.on("timeout", function() { req.destroy(); reject(new Error("timeout")) })
  })
}

// ==================== 方案1: 直接调API（HMAC-SHA256签名）====================

function generateSignature(method, url, timestamp) {
  var stringToSign = method + url + timestamp + CA_SECRET
  return crypto.createHmac("sha256", CA_SECRET).update(stringToSign).digest("base64")
}

function generateNode() {
  var deviceId = crypto.randomUUID().replace(/-/g, "")
  var nodeObj = { d: deviceId, t: Date.now(), p: "web_pc", v: "1.0.0" }
  return Buffer.from(JSON.stringify(nodeObj)).toString("base64")
}

async function fetchViaAPI(pk, name) {
  var apiUrl = API_BASE + pk
  var timestamp = Date.now().toString()
  var node = generateNode()
  var signature = generateSignature("GET", apiUrl, timestamp)

  var headers = {
    "x-itouchtv-ca-key": CA_KEY,
    "x-itouchtv-ca-signature": signature,
    "x-itouchtv-ca-timestamp": timestamp,
    "x-itouchtv-client": "WEB_PC",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.gdtv.cn/",
    "Accept": "application/json",
  }

  var fullUrl = apiUrl + "?tvChannelPk=" + pk + "&node=" + encodeURIComponent(node)
  var resp = await httpGet(fullUrl, headers, 8000)
  var body = resp.body.toString("utf-8")

  if (resp.status !== 200) {
    throw new Error("API HTTP " + resp.status + ": " + body.substring(0, 100))
  }

  var data = JSON.parse(body)
  if (data.errorCode) {
    throw new Error("API错误: " + (data.errorMessage || data.errorCode))
  }
  if (!data.playUrl) {
    throw new Error("无playUrl字段")
  }

  var playInfo = typeof data.playUrl === "string" ? JSON.parse(data.playUrl) : data.playUrl
  var streamUrl = playInfo.hd || playInfo.sd || Object.values(playInfo)[0]
  if (!streamUrl) throw new Error("playUrl中无有效流地址")

  return streamUrl
}

// ==================== 方案2: Puppeteer模拟浏览器 ====================

async function launchBrowser() {
  if (browser) return browser
  if (browserLaunching) {
    await new Promise(function(r) { setTimeout(r, 2000) })
    return browser
  }

  browserLaunching = true
  try {
    var chromePath = findChrome()
    if (!chromePath) throw new Error("未找到Chrome浏览器")

    var puppeteer = (await import("puppeteer-core")).default
    browser = await puppeteer.launch({
      headless: "new",
      executablePath: chromePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    })

    browser.on("disconnected", function() { browser = null })
    log.ok("[Puppeteer] 浏览器启动成功")
    return browser
  } catch (e) {
    browser = null
    throw e
  } finally {
    browserLaunching = false
  }
}

function findChrome() {
  if (process.platform === "win32") {
    var paths = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      (process.env.LOCALAPPDATA || "") + "\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    ]
    for (var p of paths) {
      try { fs.statSync(p); return p } catch(e) {}
    }
  }
  var linuxPaths = ["/usr/bin/chromium-browser", "/usr/bin/chromium", "/usr/bin/google-chrome", "/usr/bin/microsoft-edge"]
  for (var lp of linuxPaths) {
    try { fs.statSync(lp); return lp } catch(e) {}
  }
  return null
}

async function fetchViaPuppeteer(pk, name) {
  var b = await launchBrowser()
  var page = null
  try {
    page = await b.newPage()
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

    var playUrlPromise = new Promise(function(resolve, reject) {
      var timer = setTimeout(function() { reject(new Error("Puppeteer超时")) }, TIMEOUT)
      var found = false

      page.on("response", async function(response) {
        if (found) return
        var url = response.url()
        if (url.indexOf("/api/tv/v2/tvChannel/" + pk) !== -1 && response.request().method() === "GET") {
          try {
            var text = await response.text()
            if (!text) return
            found = true
            clearTimeout(timer)
            var data = JSON.parse(text)
            if (data.playUrl) {
              var playInfo = typeof data.playUrl === "string" ? JSON.parse(data.playUrl) : data.playUrl
              var streamUrl = playInfo.hd || playInfo.sd || Object.values(playInfo)[0]
              resolve(streamUrl)
            } else {
              reject(new Error("Puppeteer: 无playUrl"))
            }
          } catch(e) {
            // response.text()失败（preflight等），跳过
          }
        }
      })
    })

    await page.goto("https://www.gdtv.cn/tvChannelDetail/" + pk, { waitUntil: "networkidle2", timeout: TIMEOUT })
    var streamUrl = await playUrlPromise
    return streamUrl

  } finally {
    if (page) {
      try { await page.close() } catch(e) {}
    }
  }
}

// ==================== 核心：获取频道流地址 ====================

async function getStreamUrl(pk, name) {
  // 检查缓存
  if (streamUrlCache[pk]) {
    var remaining = streamUrlCache[pk].valTime - Date.now()
    if (remaining > 0) {
      log.dbg("[Cache HIT] " + name + " (剩余" + Math.round(remaining / 60000) + "分钟)")
      return streamUrlCache[pk].url
    }
  }

  log.warn("[Fetch] " + name + " (pk=" + pk + ")")
  var t0 = Date.now()

  try {
    var streamUrl = await fetchViaAPI(pk, name)
    var sec = ((Date.now() - t0) / 1000).toFixed(1)
    log.ok("[API] " + name + " (" + sec + "s)")
    streamUrlCache[pk] = { url: streamUrl, valTime: Date.now() + CACHE_TTL }
    return streamUrl

  } catch (apiErr) {
    log.warn("[API失败] " + name + ": " + apiErr.message + " -> 尝试Puppeteer")

    try {
      var streamUrl = await fetchViaPuppeteer(pk, name)
      var sec = ((Date.now() - t0) / 1000).toFixed(1)
      log.ok("[Puppeteer] " + name + " (" + sec + "s)")
      streamUrlCache[pk] = { url: streamUrl, valTime: Date.now() + CACHE_TTL }
      return streamUrl

    } catch (pptrErr) {
      var sec = ((Date.now() - t0) / 1000).toFixed(1)
      if (streamUrlCache[pk] && streamUrlCache[pk].url) {
        log.err("[FAIL] " + name + " (" + sec + "s): " + pptrErr.message + " -> 使用旧缓存")
        return streamUrlCache[pk].url
      }
      log.err("[FAIL] " + name + " (" + sec + "s): " + pptrErr.message)
      throw pptrErr
    }
  }
}

// ==================== 核心：获取并改写m3u8内容 ====================

async function getM3U8Content(pk, name, channelId, proxyBase) {
  // 检查m3u8内容缓存（5秒）
  if (m3u8Cache[pk]) {
    var remaining = m3u8Cache[pk].valTime - Date.now()
    if (remaining > 0) {
      log.dbg("[M3U8 Cache] " + name)
      return m3u8Cache[pk]
    }
  }

  var streamUrl = await getStreamUrl(pk, name)

  // 获取m3u8内容
  log.dbg("[M3U8 Fetch] " + name + " -> " + streamUrl.substring(0, 80) + "...")
  var resp = await httpGet(streamUrl, {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "*/*",
  }, 8000)

  if (resp.status !== 200) {
    // 流地址可能过期，清除缓存重试
    delete streamUrlCache[pk]
    streamUrl = await getStreamUrl(pk, name)
    resp = await httpGet(streamUrl, {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "*/*",
    }, 8000)
    if (resp.status !== 200) {
      throw new Error("m3u8获取失败: HTTP " + resp.status)
    }
  }

  var content = resp.body.toString("utf-8")

  // 判断是否是master playlist（包含其他m3u8引用）
  // 如果是，需要获取子m3u8的内容
  if (content.indexOf("#EXT-X-STREAM-INF") !== -1) {
    // master playlist，选择最高码率
    var baseUrl = streamUrl.substring(0, streamUrl.lastIndexOf("/") + 1)
    var lines = content.split("\n")
    var bestUrl = null
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].indexOf("#EXT-X-STREAM-INF") !== -1 && i + 1 < lines.length) {
        var subPath = lines[i + 1].trim()
        if (subPath && !subPath.startsWith("#")) {
          // 相对路径转绝对路径
          if (subPath.startsWith("http")) {
            bestUrl = subPath
          } else {
            bestUrl = baseUrl + subPath
          }
        }
      }
    }
    if (bestUrl) {
      log.dbg("[Master] " + name + " -> 子流: " + bestUrl.substring(0, 80) + "...")
      resp = await httpGet(bestUrl, {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "*/*",
      }, 8000)
      if (resp.status === 200) {
        content = resp.body.toString("utf-8")
        streamUrl = bestUrl  // 更新baseUrl
      }
    }
  }

  // 改写m3u8内容：将ts片段URL替换为代理URL
  var baseUrl = streamUrl.substring(0, streamUrl.lastIndexOf("/") + 1)
  var rewritten = rewriteM3U8(content, baseUrl, channelId, proxyBase)

  var result = { content: rewritten, baseUrl: baseUrl }
  m3u8Cache[pk] = { content: rewritten, baseUrl: baseUrl, valTime: Date.now() + M3U8_CACHE_TTL }
  return result
}

/**
 * 改写m3u8内容，将ts片段URL替换为代理URL
 * 例如: gdws_00001.ts?txSecret=xxx&txTime=yyy
 *   -> /ts/gdws/gdws_00001.ts?txSecret=xxx&txTime=yyy
 */
function rewriteM3U8(content, baseUrl, channelId, proxyBase) {
  var lines = content.split("\n")
  var result = []

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i]

    // 跳过注释行和空行
    if (line.startsWith("#") || line.trim() === "") {
      // 处理 #EXT-X-KEY 中的URI
      if (line.indexOf('URI="') !== -1) {
        line = rewriteURIInKey(line, baseUrl, channelId, proxyBase)
      }
      result.push(line)
      continue
    }

    // ts片段URL
    var tsUrl = line.trim()
    if (tsUrl.startsWith("http")) {
      // 绝对URL
      result.push(proxyBase + "/ts/" + channelId + "/" + encodeURIComponent(tsUrl))
    } else {
      // 相对URL，拼接baseUrl后编码
      var fullUrl = baseUrl + tsUrl
      result.push(proxyBase + "/ts/" + channelId + "/" + encodeURIComponent(fullUrl))
    }
  }

  return result.join("\n")
}

/**
 * 改写 #EXT-X-KEY 中的 URI
 */
function rewriteURIInKey(line, baseUrl, channelId, proxyBase) {
  return line.replace(/URI="([^"]+)"/, function(match, uri) {
    var fullUrl = uri.startsWith("http") ? uri : baseUrl + uri
    return 'URI="' + proxyBase + "/ts/" + channelId + "/" + encodeURIComponent(fullUrl) + '"'
  })
}

// ==================== HTTP 服务 ====================

var server = http.createServer(async function(req, res) {
  var method = req.method
  var url = req.url
  var headers = req.headers

  if (url.indexOf("/.well-known") === 0 || url === "/favicon.ico") {
    res.writeHead(204)
    res.end()
    return
  }

  // 密码认证
  if (pass !== "") {
    var parts = url.split("/")
    if (parts[1] !== pass) {
      log.err("身份认证失败")
      res.writeHead(200, { "Content-Type": "application/json;charset=UTF-8" })
      res.end("身份认证失败")
      return
    }
    if (parts.length > 2) {
      url = "/" + parts.slice(2).join("/")
    } else {
      url = "/"
    }
  }

  if (method === "HEAD") { res.writeHead(200); res.end(); return }
  if (method !== "GET") {
    res.writeHead(405, { "Content-Type": "application/json;charset=UTF-8" })
    res.end("Method Not Allowed")
    return
  }

  // 构建代理基地址
  var proxyBase = "http://" + headers.host
  if (host !== "" && (headers["x-real-ip"] || headers["x-forwarded-for"] || host.indexOf(headers.host) !== -1)) {
    proxyBase = host
  }
  if (pass !== "") proxyBase = proxyBase + "/" + pass

  log.info("请求地址: " + url)

  // --- M3U / TXT / 首页 ---
  if (url === "/m3u" || url === "/" || url === "/txt") {
    var content = buildM3U(proxyBase, url === "/txt")
    // 根路径和txt用text/plain显示，m3u用audio/x-mpegurl
    var ct = (url === "/" || url === "/txt") ? "text/plain;charset=UTF-8" : "audio/x-mpegurl; charset=utf-8"
    res.setHeader("Content-Type", ct)
    if (url === "/m3u") res.setHeader("content-disposition", 'inline; filename="gdtv_live.m3u"')
    res.writeHead(200)
    res.end(content)
    return
  }

  // --- API ---
  if (url === "/api/channels") {
    res.setHeader("Content-Type", "application/json;charset=UTF-8")
    res.writeHead(200)
    var list = channels.map(function(ch) {
      return { id: ch.id, name: ch.name, group: ch.group, pk: ch.pk, logo: ch.logo, url: proxyBase + "/" + ch.id }
    })
    res.end(JSON.stringify(list, null, 2))
    return
  }

  // --- TS片段代理 ---
  if (url.indexOf("/ts/") === 0) {
    await handleTSProxy(url, res)
    return
  }

  // --- 频道m3u8代理 ---
  var channelId = url.split("/")[1]
  if (!channelId) { res.writeHead(404); res.end("Not found"); return }

  var channel = getChannelById(channelId)
  if (!channel) {
    log.err("频道不存在: " + channelId)
    res.writeHead(404, { "Content-Type": "application/json;charset=UTF-8" })
    res.end("频道不存在: " + channelId)
    return
  }

  try {
    var m3u8Result = await getM3U8Content(channel.pk, channel.name, channel.id, proxyBase)

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8")
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
    res.writeHead(200)
    res.end(m3u8Result.content)
    log.ok("[M3U8] " + channel.name + " (" + m3u8Result.content.length + " bytes)")

  } catch (err) {
    log.err("[Error] " + channel.name + ": " + err.message)
    res.writeHead(502, { "Content-Type": "application/json;charset=UTF-8" })
    res.end(JSON.stringify({ error: "获取直播流失败", channel: channel.name, msg: err.message }, null, 2))
  }
})

// ==================== TS片段代理 ====================

async function handleTSProxy(url, res) {
  // URL格式: /ts/频道id/编码后的原始URL
  // 例如: /ts/gdws/https%3A%2F%2Ftcdn.itouchtv.cn%2Flive%2Fgdws_00001.ts%3FtxSecret%3Dxxx%26txTime%3Dyyy
  var pathParts = url.split("/")
  // pathParts[0] = "", [1] = "ts", [2] = channelId, [3...] = encoded URL
  if (pathParts.length < 4) {
    res.writeHead(400)
    res.end("Invalid TS URL")
    return
  }

  var channelId = pathParts[2]
  var encodedUrl = pathParts.slice(3).join("/")  // 以防编码后的URL中有/
  var realUrl = decodeURIComponent(encodedUrl)

  log.dbg("[TS] " + channelId + " -> " + realUrl.substring(0, 80) + "...")

  try {
    var resp = await httpGet(realUrl, {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "*/*",
      "Referer": "https://www.gdtv.cn/",
    }, 10000)

    if (resp.status !== 200) {
      log.err("[TS FAIL] " + channelId + " HTTP " + resp.status)
      res.writeHead(resp.status)
      res.end()
      return
    }

    // 透传内容类型
    var ct = resp.headers["content-type"] || "video/mp2t"
    res.setHeader("Content-Type", ct)
    res.setHeader("Cache-Control", "max-age=3600")
    res.writeHead(200)
    res.end(resp.body)

  } catch (err) {
    log.err("[TS Error] " + channelId + ": " + err.message)
    res.writeHead(502)
    res.end()
  }
}

// ==================== 生成M3U ====================

function buildM3U(proxyBase, txtMode) {
  var lines = []
  var groups = getGroups()

  if (!txtMode) {
    lines.push('#EXTM3U x-tvg-url="" catchup="append" catchup-source="?playbackbegin=${(b)yyyyMMddHHmmss}&playbackend=${(e)yyyyMMddHHmmss}"')
    lines.push("")
  }

  for (var gi = 0; gi < groups.length; gi++) {
    var g = groups[gi]
    var gchs = channels.filter(function(ch) { return ch.group === g })
    for (var ci = 0; ci < gchs.length; ci++) {
      var ch = gchs[ci]
      if (txtMode) {
        lines.push(ch.name + "," + proxyBase + "/" + ch.id)
      } else {
        var logoPart = ch.logo ? ' tvg-logo="' + ch.logo + '"' : ''
        lines.push('#EXTINF:-1 tvg-id="' + ch.id + '" tvg-name="' + ch.name + '"' + logoPart + ' group-title="' + g + '",' + ch.name)
        lines.push(proxyBase + "/" + ch.id)
        lines.push("")
      }
    }
  }

  return lines.join("\n")
}

// ==================== 预热：启动时预先获取所有频道流地址 ====================

async function warmup() {
  log.warn("开始预热频道流地址...")
  var t0 = Date.now()
  var success = 0
  var failed = 0

  // 并行预热，每批5个频道
  var batchSize = 5
  for (var i = 0; i < channels.length; i += batchSize) {
    var batch = channels.slice(i, i + batchSize)
    var results = await Promise.allSettled(batch.map(function(ch) {
      return getStreamUrl(ch.pk, ch.name)
    }))
    for (var j = 0; j < results.length; j++) {
      if (results[j].status === "fulfilled") {
        success++
      } else {
        log.err("[预热失败] " + batch[j].name + ": " + results[j].reason.message)
        failed++
      }
    }
  }

  var sec = ((Date.now() - t0) / 1000).toFixed(1)
  log.ok("预热完成: " + success + " 成功, " + failed + " 失败, 耗时 " + sec + " 秒")
}

// ==================== 启动 ====================

server.listen(port, async function() {
  var sep = "========================================================"
  log.ok(sep)
  log.ok("  GDTV Live Proxy v6.0")
  log.ok("  Full Proxy Mode - m3u8 + ts proxy")
  log.ok(sep)
  log.ok("")
  log.ok("  Local: http://localhost:" + port + (pass ? "/" + pass : ""))
  log.ok("  M3U:   http://localhost:" + port + (pass ? "/" + pass : "") + "/m3u")
  log.ok("  TXT:   http://localhost:" + port + (pass ? "/" + pass : "") + "/txt")
  log.ok("  API:   http://localhost:" + port + (pass ? "/" + pass : "") + "/api/channels")
  log.ok("")
  log.ok("  Flow: Player -> Proxy(m3u8) -> CDN")
  log.ok("        Player -> Proxy(ts)   -> CDN")
  log.ok("  Cache: StreamURL 2h | M3U8 5s")
  log.ok("  Strategy: API first, Puppeteer fallback")
  if (host) log.ok("  Public: " + host + (pass ? "/" + pass : ""))
  log.ok(sep)

  // 启动后预热所有频道
  await warmup()
})
