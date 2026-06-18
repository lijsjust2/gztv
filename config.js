// 本地运行端口号
const port = process.env.gport || 5678;
// 公网/自定义访问地址
const host = process.env.ghost || "";
// 访问密码 大小写字母和数字 添加后访问格式 http://ip:port/密码/...
const pass = process.env.gpass || "";
// 播放模式：direct302(频道直接302到真实m3u8) / hybrid(m3u8代理+TS 302) / proxy(m3u8+TS全代理)
const validModes = new Set(["direct302", "hybrid", "proxy"]);
const mode = validModes.has(process.env.gmode) ? process.env.gmode : "hybrid";
// 是否启动时预热所有频道流地址，默认开启
const warmupEnabled = process.env.gwarmup !== "false";
// 是否启用 TS 预加载/后台预加载，默认开启
const preloadEnabled = process.env.gpreload !== "false";
// 后台预加载空闲停止时间，单位分钟
const preloadIdleMinutes = parseInt(
  process.env.gpreloadIdleMinutes || "10",
  10,
);
// TS 预加载缓存最大数量，避免长期运行内存增长
const maxTsCache = parseInt(process.env.gmaxTsCache || "200", 10);
// 允许 /redirect 跳转的目标域名后缀，逗号分隔
const allowedRedirectHosts = (
  process.env.gallowedHosts || "gdtv.cn,itouchtv.cn"
)
  .split(",")
  .map(function (host) {
    return host.trim();
  })
  .filter(Boolean);
// 调试日志开关
const debug = process.env.gdebug === "true";

export {
  port,
  host,
  pass,
  mode,
  warmupEnabled,
  preloadEnabled,
  preloadIdleMinutes,
  maxTsCache,
  allowedRedirectHosts,
  debug,
};
