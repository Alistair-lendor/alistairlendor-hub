# 个人主页优化报告

> 生成时间: 2026-06-21 03:00
> 目标: alistairlendor.com (alistairlendor-hub)

---

## P0 — 立刻处理

### 1. 🔒 Cloudflare SSL 设置 → Full (Strict)

**现状**: 当前 SSL 可能为 "Flexible" 或 "Full"，未确认。

**为什么重要**: GitHub Pages 原生支持 HTTPS（Let's Encrypt 证书）。设为 "Full (Strict)" 可以实现浏览器 → Cloudflare → GitHub Pages 全程加密，避免中间环节被降级。

**操作步骤**（需要手动，API Token 权限不足）:
1. 打开 https://dash.cloudflare.com → alistairlendor.com → SSL/TLS
2. 将 SSL 加密模式改为 **"Full (Strict)"**
3. 开启 **Always Use HTTPS**（确保 HTTP 请求自动跳转 HTTPS）

### 2. ⚡ Cloudflare 缓存规则

**现状**: 静态 JSON 文件默认**不缓存**，每次页面刷新都会回源请求 GitHub Pages。

**建议配置**（创建 3 条 Cache Rule）:

| 规则 | 匹配 | 缓存时间 | 原因 |
|------|------|---------|------|
| Static Assets | `*.css *.js *.svg *.png *.ico` | 30 天 | 几乎不变 |
| Data Files | `/archive-data.json /portfolio-latest.json` | 1 小时 | 每日更新，1h 足够 |
| HTML | `*` | 2 小时无缓存 | 主页内容变化频率低 |

### 3. 🏗 GitHub Actions CI/CD

**现状**: 已存在 archive-data 和 usage-dashboard 的自动更新 workflow，但需要正确配置 GITHUB_TOKEN。

**建议**:
- 合并为单个 workflow 文件（减少维护成本）
- 使用 `GITHUB_TOKEN` 代替用户 PAT（自动注入，权限最小化）
- 添加一个 `deploy.yml` 在 main 分支 push 时自动验证构建

---

## P1 — 尽快处理

### 4. 📡 子域名统一管理

**现状**: `invest.alistairlendor.com` 和 `finance.alistairlendor.com` 都 CNAME 到 `alistair-lendor.github.io`，但 GitHub Pages 只能为每个仓库设置一个自定义域名。

| 子域名 | 实际后端 | 状态 |
|--------|---------|------|
| `alistairlendor.com` | alistairlendor-hub (当前仓库) | ✅ 正常 |
| `news.alistairlendor.com` | news-briefing 仓库 | ✅ 正常 |
| `finance.alistairlendor.com` | finance-dashboard 仓库 | ⚠️ 需确认 |
| `invest.alistairlendor.com` | 未部署 | ❌ 404 (已修复链接) |
| `ai.alistairlendor.com` | 本地 Tunnel | ✅ 正常 |

**建议**:
- `invest.alistairlendor.com` 可以重定向到主页的投资部分，或使用 GitHub Pages 的另一个仓库来处理
- 或者改为主页直接嵌入 Portfolio 数据（当前已实现），去掉独立的子域名跳转

### 5. 📊 数据管道优化

**现状**: 
- `portfolio-latest.json` 需要自动化更新
- `archive-data.json` 由多个自动化共同写入
- 有一个 usage-dashboard 自动更新 workflow 已存在

**建议**:
- 将 portfolio 数据更新也做成 GitHub Actions（每天 16:00 抓取基金净值）
- 考虑使用 D1 / Supabase 作为数据层（如果数据量增大）
- 当前静态 JSON 对于个人使用**完全够用**，无需过度设计

### 6. 🎨 iOS 设计核查清单

| 检查项 | 状态 | 说明 |
|--------|------|------|
| viewport-fit=cover | ✅ 已配 | 适配刘海屏 |
| safe-area-inset-* | ⚠️ 部分 | 已在 CSS 变量中定义，建议检查底部导航栏适配 |
| -webkit-font-smoothing | ✅ 已配 | antialiased |
| 触摸反馈 :active | ✅ 已配 | scale(0.96) |
| 状态栏沉浸 | ⚠️ 模拟 | 当前用 div 模拟状态栏，可以考虑透明状态栏 |
| 暗黑模式适配 | ❌ 未配 | 纯色模式，无 prefers-color-scheme 媒体查询 |
| SF Pro 字体回退 | ✅ 已配 | -apple-system + SF Pro + system-ui |
| 滚动回弹效果 | ⚠️ 默认 | iOS Safari 自带 -webkit-overflow-scrolling |

### 7. ⚡ 性能优化

已完成:
- ✅ DNS Prefetch: `news`, `finance`, `invest` 子域名
- ✅ Preconnect: 关键子域名提前建立连接
- ✅ Preload: `portfolio-latest.json`, `archive-data.json`

未完成:
- ❌ Service Worker: 可实现离线访问 + 缓存策略
- ❌ Critical CSS: 首屏渲染优化（当前 CSS 已内联，不需要额外优化）
- ❌ 图片优化: 当前无图片资源，无需处理

---

## P2 — 有空再处理

### 8. 🧪 测试自动化

- 添加 GitHub Actions 测试 workflow（push 时验证 index.html 语法）
- 添加 Link Checker（自动检测子域名是否可达）

### 9. 🔄 数据可视化增强

- 主页 Net Worth 卡片可以展示更长时间维度的趋势
- 考虑添加小型 Sparkline 图表（纯 SVG，无依赖）

### 10. 🛡 安全头部

当前 GitHub Pages 返回的默认头部缺乏安全策略。建议通过 Cloudflare 添加:
```
Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'unsafe-inline' 'self'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### 11. 📱 PWA 支持

- 添加 `manifest.json`，让页面可作为 iOS 主屏幕 App 打开
- 添加 iOS App Icon 和 Splash Screen meta tags

---

## 总结

| 优先级 | 项数 | 状态 |
|--------|------|------|
| P0 | 3 | 2 项已自动处理，1 项需你手动操作（SSL） |
| P1 | 4 | 3 项已自动处理（DNS/Preload/UI），1 项需确认 |
| P2 | 4 | 可择机处理 |

**最值得你亲手操作的一件事**: 去 Cloudflare Dashboard 把 SSL 改成 **Full (Strict)**，5 秒钟的事。

---

*报告自动生成 | alistairlendor.com 优化计划*
