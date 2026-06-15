@echo off
chcp 65001 >nul
echo ============================================
echo   GDTV Live Proxy - 启动脚本
echo ============================================
echo.

:: 检查 node 是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装: https://nodejs.org/
    pause
    exit /b 1
)

:: 检查依赖是否已安装
if not exist "node_modules" (
    echo [信息] 首次运行，正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo.
)

:: 检查 Chrome 是否存在（Puppeteer 需要）
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    echo [OK] Chrome 已检测到
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    echo [OK] Chrome 已检测到
) else (
    echo [警告] 未检测到 Chrome 浏览器，Puppeteer 可能无法工作
    echo         请安装 Chrome 或设置 CHROME_PATH 环境变量
    echo.
)

echo [启动] 服务正在运行...
echo         M3U地址: http://localhost:%gport:5678%/m3u
echo         按 Ctrl+C 停止服务
echo.
node app.js
pause
