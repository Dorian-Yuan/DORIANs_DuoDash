# DuoDash（GitHub Pages 版）

多邻国（Duolingo）学习数据仪表盘，直观展示你的 XP 趋势、连胜记录、成就进度与分享卡片。本仓库为 [scavin/duodash](https://github.com/scavin/duodash) 的静态化改造版：**数据由 GitHub Actions 定时抓取并生成快照，站点纯静态托管在 GitHub Pages，无需任何自建后端**。

线上地址：<https://dorian-yuan.github.io/dorians_duodash/>　|　大屏模式：<https://dorian-yuan.github.io/dorians_duodash/kiosk/>

## 功能特性

- **今日概览**：显示今日 XP、课程数、连胜天数和学习分钟数
- **趋势图表**：最近 7 天 XP 和学习时长面积图，显示周期内总量汇总
- **年度热力图**：全年学习热力图，支持年份切换；宽屏显示全年，窄屏按宽度自动切换为半年或季度视图
- **成就系统**：20 个徽章，覆盖连胜、单日 XP、累计天数、总 XP 四个维度
- **课程管理**：展示所有学习中的语言课程及 XP 分布
- **分享卡片**：生成连胜成就、经验突破、本周报告三种卡片（PNG 导出）
- **本地缓存**：命中缓存时立即渲染，后台静默刷新；跨天后自动失效
- **深色模式**：自动跟随系统外观偏好切换，无需手动设置
- **大屏模式**：独立链接 `/kiosk` 提供触屏优先的全屏翻页视图，5 屏依次展示核心数据、年度热力图、近 7 天趋势、语言分布与学习奖项
- **响应式**：适配桌面、平板、移动端

## 架构说明

```
┌─────────────────┐   cron: 北京时间 07:00 / 12:00 / 18:00
│ GitHub Actions  │ ────────────────────────────────┐
└─────────────────┘                                  │
        │ 读取 Secrets（DUOLINGO_USERNAME / DUOLINGO_JWT）
        ▼                                            │
  scripts/snapshot.ts ── 调用 Duolingo API ──► public/snapshot.json
        │                                            │
        ▼ npm run build                              │
  静态站点（dist）◄────────────────────────────────────┘
        │
        ▼ actions/deploy-pages
  GitHub Pages（纯静态，前端直接 fetch snapshot.json 渲染）
```

- 数据源为 Duolingo 非官方接口（见下文 [数据来源](#数据来源)），凭据以 GitHub Actions Secrets 形式存储，不进入代码仓库
- 快照按固定时区（默认 `Asia/Shanghai`）聚合生成，前端直接读取展示
- 定时任务失败（如 JWT 过期）时，工作流会自动在本仓库创建 issue 提醒

## 项目结构

```
duodash/
├── .github/workflows/deploy.yml   # 定时抓取 + 构建 + 部署 GitHub Pages
├── scripts/
│   └── snapshot.ts                # 抓取 Duolingo 数据并生成 public/snapshot.json
├── public/
│   ├── snapshot.json              # 数据快照（由 Actions 生成，不入库）
│   └── ...                        # 静态资源
└── src/
    ├── components/
    │   ├── DuoDashApp.tsx         # 根组件，管理数据流与演示模式
    │   ├── icons.tsx              # 通用图标封装
    │   ├── achievements/          # 成就徽章展示与进度详情
    │   ├── charts/                # 面积趋势图 / 年度热力图
    │   ├── dashboard/             # 仪表盘各模块（概览、课程、头部等）
    │   └── share/                 # 分享弹窗与卡片模板（PNG 导出）
    ├── hooks/
    │   ├── useDashboardData.ts    # 读取 snapshot.json、缓存、演示模式
    │   ├── useAchievementStats.ts # 成就数据计算
    │   ├── useChartDimensions.ts  # 图表尺寸响应
    │   ├── useUserDataCache.ts    # localStorage 缓存读写
    │   └── useViewportObserver.ts # 视口进入检测
    ├── pages/
    │   ├── index.astro            # 标准仪表盘
    │   └── kiosk.astro            # 大屏翻页视图
    ├── services/
    │   ├── duolingoService.ts     # Duolingo 原始数据转换
    │   ├── duolingoResolvers.ts   # 各字段解析逻辑
    │   ├── historyBuilder.ts      # 每日 / 周 / 年历史数据构建
    │   └── todayStatsResolver.ts  # 今日 XP / 课程数 / 连胜状态解析
    ├── styles/                    # 全局样式与多邻国色板
    ├── types.ts                   # 全局类型定义
    └── utils/                     # 时区处理 / 演示数据等
├── astro.config.mjs               # 静态构建配置（base 指向仓库路径）
└── package.json
```

## 环境要求

- Node.js 18+
- npm

## 本地开发

```bash
git clone https://github.com/Dorian-Yuan/DORIANs_DuoDash.git
cd DORIANs_DuoDash
npm install
```

```bash
npm run dev      # 开发模式，默认 http://localhost:4321/dorians_duodash/
npm run build    # 静态构建，输出到 dist/
npm run preview  # 预览构建产物
```

> 未配置账号时，首页会显示引导界面，点击「预览演示数据」可直接体验完整功能。

## 生成本地快照（可选）

本地调试真实数据时，创建 `.env.local`（已被 `.gitignore` 忽略，不会提交）：

```env
DUOLINGO_USERNAME=your_duolingo_username
DUOLINGO_JWT=your_jwt_token_here
SNAPSHOT_TIMEZONE=Asia/Shanghai
```

然后执行：

```bash
npm run snapshot   # 生成 public/snapshot.json
npm run dev        # 或 build + preview 查看效果
```

## 环境变量

| 变量名 | 必填 | 说明 |
| :--- | :--: | :--- |
| `DUOLINGO_USERNAME` | ✅ | Duolingo 用户名（GitHub Actions Secret） |
| `DUOLINGO_JWT` | ✅ | Duolingo JWT Token（GitHub Actions Secret） |
| `SNAPSHOT_TIMEZONE` | 可选 | 快照聚合时区，默认 `Asia/Shanghai` |

## 部署与数据更新

站点由 GitHub Actions 工作流（`.github/workflows/deploy.yml`）全自动维护：

1. **推送触发**：任何推送到 `main` 分支的代码变更都会自动构建部署（数据快照同步刷新或回退到线上最新快照）
2. **定时触发**：每天北京时间 **07:00 / 12:00 / 18:00**（cron `0 23,4,10 * * *` UTC）拉取最新数据并部署。注意 GitHub 定时任务存在排队延迟（可能数分钟至 1 小时），准点性无法保证
3. **拉取数据**：`npm run snapshot` 调用 Duolingo API 生成 `snapshot.json`
4. **手动触发**：仓库 Actions 页面 → `Update Data & Deploy` → Run workflow

### 配置 Secrets（一次性）

仓库 Settings → **Secrets and variables → Actions**，添加：

| Secret 名 | 值 |
| :--- | :--- |
| `DUOLINGO_USERNAME` | 多邻国用户名 |
| `DUOLINGO_JWT` | 见下方「获取 JWT Token」 |

## 获取 JWT Token

1. 登录 [Duolingo 官网](https://www.duolingo.com/)
2. 按 F12 打开开发者工具 → 控制台，执行：

```js
document.cookie.match(/jwt_token=([^;]+)/)?.[1]
```

3. 将输出值填入 GitHub Actions Secret 的 `DUOLINGO_JWT`

> JWT Token 会定期过期（通常约 30 天或登出/清除 Cookie 后失效）。过期后定时任务会失败并自动在仓库创建 issue 提醒，重新获取并更新 Secret，再手动触发一次工作流即可。

## 界面模式

### 深色模式

自动跟随系统外观偏好（`prefers-color-scheme`）在浅色 / 深色之间切换，无需任何配置。图表、热力图与主界面均已适配（分享卡片保持固定浅色，以保证导出图片一致）。

### 大屏模式（Kiosk）

| 视图 | 链接 |
| :--- | :--- |
| 标准仪表盘 | `/` |
| 大屏翻页视图 | `/kiosk` |

触屏优先设计，5 屏全屏铺满，左右滑动切换（横向 scroll-snap，原生手势）：

| 屏 | 内容 |
| :-- | :--- |
| 1 · 核心成绩 | 用户名 + 8 个大数字瓦片（连胜、总经验、今日经验、近 7 天经验 / 分钟、宝石、段位、语言课程），进入时数字滚动递增 |
| 2 · 年度轨迹 | 全年学习热力图 |
| 3 · 最近 7 天 | XP 与学习时长双面积图 |
| 4 · 语言分布 | 各语言课程及 XP 占比 |
| 5 · 学习奖项 | 成就徽章墙 |

- 数字与图表随视口自动放大，适合平板、手机或常驻墙面显示
- 尊重系统「减少动态效果」偏好，开启后自动关闭数字滚动动画

## 数据来源

通过以下 Duolingo 非官方接口获取数据：

| 接口 | 用途 |
| --- | --- |
| `GET /2017-06-30/users?username={username}` | 解析用户 ID |
| `GET /2023-05-23/users/{id}` | 用户主数据（连胜、XP、段位、全部课程） |
| `GET /2017-06-30/users/{id}/xp_summaries?startDate=1970-01-01` | 完整学习历史（每日 XP、实际学习时长） |

### 缓存策略

| 层 | 策略 |
| --- | --- |
| 快照 | GitHub Actions 每天 3 次刷新 `snapshot.json`，重新部署后生效 |
| 客户端 | `localStorage`，命中时立即渲染，后台静默刷新；跨天后自动失效 |

## 常见问题

**JWT Token 过期**  
定时任务失败并出现自动创建的 issue 时，重新执行控制台命令获取新 Token，更新 GitHub Actions Secret `DUOLINGO_JWT`，然后手动触发一次工作流。

**数据更新不及时**  
数据每天只在 07:00 / 12:00 / 18:00（北京时间）刷新三次，期间页面展示的是最近一次快照。可手动触发工作流立即更新。

**日期 / 热力图显示偏移**  
所有日期按快照生成时区（`Asia/Shanghai`）聚合计算，与浏览者所在时区无关。

**经验值与 App 不一致**  
已删除 / 重置的课程不再返回数据，且非官方 API 与 App 内部计算逻辑存在差异，属于正常现象。

## 许可证

[MIT License](LICENSE)

## 致谢

- [scavin/duodash](https://github.com/scavin/duodash) — 原项目
- [Duolingo](https://www.duolingo.com/) — 数据来源
- [Astro](https://astro.build/) — Web 框架
- [Recharts](https://recharts.org/) — 图表库
- [Tailwind CSS](https://tailwindcss.com/) — CSS 框架
- [snapdom](https://github.com/zumerlab/snapdom) — 分享卡片截图

---

> 本项目为非官方第三方工具，与 Duolingo Inc. 无关。使用需遵守 [Duolingo 服务条款](https://www.duolingo.com/terms)
