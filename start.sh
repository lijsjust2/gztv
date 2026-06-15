#!/bin/bash
set -e

echo "============================================"
echo "  GDTV Live Proxy - 启动脚本 (Linux)"
echo "============================================"
echo ""

# 检查 node
if ! command -v node &>/dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装"
    exit 1
fi

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "[信息] 首次运行，正在安装依赖..."
    npm install
fi

# 检查 Chrome/Chromium
if command -v google-chrome &>/dev/null || command -v chromium-browser &>/dev/null || command -v chromium &>/dev/null; then
    echo "[OK] Chrome/Chromium 已检测到"
else
    echo "[警告] 未检测到 Chrome/Chromium"
    echo "       请安装: apt-get install chromium-browser 或设置 CHROME_PATH"
    echo ""
fi

echo "[启动] 服务正在运行..."
echo "        M3U地址: http://localhost:${gport:-5678}/m3u"
echo "        按 Ctrl+C 停止服务"
echo ""
exec node app.js
