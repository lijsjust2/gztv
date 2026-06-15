// 本地运行端口号
const port = process.env.gport || 5678
// 公网/自定义访问地址
const host = process.env.ghost || ""
// 访问密码 大小写字母和数字 添加后访问格式 http://ip:port/密码/...
const pass = process.env.gpass || ""

export { port, host, pass }
