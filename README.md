# 👶 宝宝成长记录

一款专为新手爸妈设计的宝宝日常记录应用，帮助追踪宝宝的喂养、睡眠、换尿布等日常活动。

## ✨ 功能特点

- 🍼 **喂养记录** — 亲喂（左/右侧时长）、瓶喂（母乳/配方奶量）
- 🧷 **尿布记录** — 大小便类型、颜色、量，支持拍照
- 😴 **睡眠记录** — 入睡/醒来时间、睡觉方向
- 🧴 **护理记录** — 洗脸、洗澡、口腔清洁等日常护理打卡
- 💊 **补剂药物** — AD、D3、铁、益生菌等每日服用打卡
- 🎓 **早教锻炼** — 按类别记录训练时长和内容
- 📝 **今日小记** — 体温、疫苗接种、备注
- 📊 **每日统计** — 自动汇总各项数据
- 📅 **历史回顾** — 按日期查看历史记录
- 🔄 **跨设备同步** — 通过"家庭码"登录，多设备共享数据
- 📤📥 **数据导入导出** — JSON 格式备份与恢复

## 🏗️ 技术架构

```
┌─────────────────────────────┐
│         前端 (Vite + TS)     │
│   SPA · Hash Router · 移动优先  │
├─────────────────────────────┤
│           Nginx              │
│   静态文件 + /api 反向代理     │
├─────────────────────────────┤
│      后端 (Express + TS)     │
│        REST API · 端口 3001   │
├─────────────────────────────┤
│       SQLite (better-sqlite3) │
│        持久化存储              │
└─────────────────────────────┘
```

- **前端**: TypeScript + Vite，手写 CSS，移动端优先响应式设计
- **后端**: Express 5 + better-sqlite3，RESTful API
- **部署**: Docker 多阶段构建 (Nginx + Node)

## 🚀 快速开始

### 本地开发

```bash
# 1. 安装前端依赖
npm install

# 2. 安装后端依赖
cd server && npm install && cd ..

# 3. 启动后端 API（终端 1）
cd server
npm run dev

# 4. 启动前端（终端 2）
npm run dev
```

前端：`http://localhost:5173` | 后端 API 通过 Vite 代理到 `http://localhost:3001`

### Docker 部署

```bash
docker-compose up --build -d
```

服务启动在 `http://localhost:80`，数据持久化在 Docker 卷 `baby_data` 中。

## 📁 项目结构

```
baby_growth_journey/
├── src/                    # 前端源码
│   ├── main.ts             # 入口 + 路由注册
│   ├── api.ts              # API 请求封装
│   ├── router.ts           # Hash 路由器
│   ├── utils.ts            # 工具函数
│   ├── style.css           # 全局样式
│   └── pages/              # 页面组件
│       ├── home.ts         # 首页（统计 + 记录汇总）
│       ├── login.ts        # 家庭码登录
│       ├── feeding.ts      # 喂养记录
│       ├── diaper.ts       # 尿布记录
│       ├── sleep.ts        # 睡眠记录
│       ├── education.ts    # 早教锻炼
│       ├── supplement.ts   # 补剂药物
│       ├── care.ts         # 护理记录
│       └── dailyNote.ts    # 今日小记
├── server/                 # 后端源码
│   ├── src/
│   │   ├── index.ts        # Express 入口
│   │   ├── db.ts           # SQLite 初始化
│   │   └── routes.ts       # API 路由
│   └── package.json
├── Dockerfile              # 多阶段构建
├── docker-compose.yml      # 容器编排
├── nginx.conf              # Nginx 配置
└── vite.config.ts          # Vite 开发配置
```

## 📜 许可证

MIT
