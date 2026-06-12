# 宝宝成长记录

一个用于记录宝宝日常成长的本地 Web 应用。项目基于 React、TypeScript、Vite 和 Tailwind CSS 构建，数据默认保存在浏览器 IndexedDB 中，适合记录日记、照片、身高体重、睡眠、疫苗和成长里程碑。

## 功能特性

- 今日记录入口：快速新增日记、照片、身高体重、睡眠、疫苗和里程碑。
- 时间线：按时间倒序查看全部记录，并支持按记录类型筛选。
- 数据页：展示成长曲线、睡眠概览和疫苗记录。
- 宝宝档案：维护宝宝昵称、生日，并支持导出 JSON 备份。
- 本地存储：使用 IndexedDB 持久化宝宝档案、记录和媒体资源。
- 测试覆盖：包含组件、状态、服务、存储和日期工具相关测试。

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Lucide React
- Vitest + Testing Library
- IndexedDB

## 快速开始

### 环境要求

- Node.js 22 或兼容版本
- pnpm

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

Vite 会启动本地开发服务，终端会显示可访问的本地地址。

### 构建生产版本

```bash
pnpm build
```

### 运行测试

```bash
pnpm test
```

### 运行完整校验

```bash
pnpm verify
```

该命令会依次执行生产构建和测试。

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动 Vite 开发服务器 |
| `pnpm build` | 执行 TypeScript 构建检查并打包 |
| `pnpm test` | 运行 Vitest 测试 |
| `pnpm test:watch` | 以 watch 模式运行测试 |
| `pnpm lint` | 运行 ESLint |
| `pnpm verify` | 构建并运行测试 |

## 项目结构

```text
.
├── docs/                  # 需求和实现计划文档
├── src/
│   ├── components/        # 页面组件、布局组件和记录卡片
│   ├── domain/            # 领域类型和记录类型元信息
│   ├── lib/               # 通用工具函数
│   ├── pages/             # 首页、时间线、数据页、档案页
│   ├── services/          # 记录处理、媒体处理、导出等服务
│   ├── state/             # 应用状态 Hook
│   ├── storage/           # IndexedDB 封装和仓储层
│   ├── App.tsx            # 应用入口组件
│   └── main.tsx           # React 挂载入口
├── index.html
├── package.json
├── tailwind.config.ts
└── vite.config.ts
```

## 数据说明

应用会在浏览器中创建本地 IndexedDB 数据库，并保存以下信息：

- 宝宝档案：昵称、生日、性别、头像等基础信息。
- 成长记录：日记、照片、身高体重、睡眠、疫苗、里程碑。
- 媒体资源：目前用于保存图片类型媒体。

档案页的「导出 JSON」会生成 `baby-growth-backup.json`，其中包含宝宝档案、成长记录和媒体数量统计。导出内容用于备份记录数据，不会自动上传到远程服务。

## 记录类型

| 类型 | 内容 |
| --- | --- |
| 日记 | 文本形式的日常记录 |
| 照片 | 图片资源及照片说明 |
| 身高体重 | 身高、体重、头围 |
| 睡眠 | 开始时间、结束时间、睡眠质量和备注 |
| 疫苗 | 疫苗名称、剂次、计划日期、完成日期和地点 |
| 里程碑 | 里程碑分类和描述 |

## 开发建议

- 修改记录类型时，同步更新 `src/domain/types.ts` 和 `src/domain/recordMeta.ts`。
- 修改 IndexedDB 结构时，检查 `src/storage/indexedDb.ts` 和 `src/storage/repository.ts` 的迁移与读写逻辑。
- UI 行为变更后，优先补充或更新对应组件测试。
- 提交前建议运行 `pnpm verify`。
