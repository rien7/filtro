# AGENTS.md

## 项目概览

`filtro` 是一个基于 React 的筛选 UI 组件库，不是完整业务应用。

当前仓库聚焦的是一套可复用的扁平 `FilterBar`，而不是未来规划里的嵌套 filter builder。

它现在提供：

- typed logical layer：字段种类、操作符、AST 类型
- builder API：声明 UI 字段
- `FilterBar` 组件体系：添加、编辑、清空条件
- optional default theme preset：默认样式和 styled primitive
- `nuqs` URL 同步
- Vite playground

需要特别区分：

- [`src/logical`](https://github.com/rien7/filtro/tree/main/src/logical) 是纯逻辑层
- [`src/filter-bar`](https://github.com/rien7/filtro/tree/main/src/filter-bar) 是当前真实的扁平 FilterBar 实现
- [`src/presets/default-theme`](https://github.com/rien7/filtro/tree/main/src/presets/default-theme) 是可选默认样式层
- `docs/filter-ui-plan.md` 如果后续出现，属于未来规划，不代表当前实现已经具备

## 技术栈

- React 19
- TypeScript 5
- Vite 7
- `@base-ui/react`
- Tailwind CSS 4
- `tsdown`
- `pnpm`

## 常用命令

- 安装依赖：`pnpm install`
- 类型检查：`pnpm run typecheck`
- 测试：`pnpm test`
- 构建库产物：`pnpm run build`
- 启动 playground：`pnpm run dev:ui`
- 构建 playground：`pnpm run build:ui`
- 预览 playground：`pnpm run preview:ui`

## 当前目录结构

- [`src/index.ts`](https://github.com/rien7/filtro/blob/main/src/index.ts): 根入口，导出 `logical` 和 `filter-bar`
- [`src/logical`](https://github.com/rien7/filtro/tree/main/src/logical): 领域层，定义字段种类、操作符和值类型、AST
- [`src/filter-bar/builder.ts`](https://github.com/rien7/filtro/blob/main/src/filter-bar/builder.ts): `filtro.string/number/select/...` builder API
- [`src/filter-bar/types.ts`](https://github.com/rien7/filtro/blob/main/src/filter-bar/types.ts): UI 字段类型、选项加载类型、自定义 render 类型
- [`src/filter-bar`](https://github.com/rien7/filtro/tree/main/src/filter-bar): `FilterBar.Root/Trigger/Items/Clear/SaveView/Views` 及其状态逻辑
- [`src/filter-bar/internal/primitives/baseui`](https://github.com/rien7/filtro/tree/main/src/filter-bar/internal/primitives/baseui): 当前 `FilterBar` 实现依赖的内部 Base UI 包装件
- [`src/presets/default-theme/index.tsx`](https://github.com/rien7/filtro/blob/main/src/presets/default-theme/index.tsx): `defaultFilterBarTheme` 和默认 preset 导出
- [`src/presets/default-theme/styles.css`](https://github.com/rien7/filtro/blob/main/src/presets/default-theme/styles.css): 默认主题样式源文件
- [`src/nuqs/index.ts`](https://github.com/rien7/filtro/blob/main/src/nuqs/index.ts): URL 同步
- [`playground`](https://github.com/rien7/filtro/tree/main/playground): 本地调试页面
- [`playground/internal/calendar.tsx`](https://github.com/rien7/filtro/blob/main/playground/internal/calendar.tsx): playground 专用日历包装件

## 当前实现的核心模型

### 1. 逻辑层

[`src/logical/field.ts`](https://github.com/rien7/filtro/blob/main/src/logical/field.ts) 定义字段种类：

- `string`
- `number`
- `date`
- `select`
- `multiSelect`
- `boolean`

[`src/logical/operator.ts`](https://github.com/rien7/filtro/blob/main/src/logical/operator.ts) 为每种字段定义允许的 operator 和对应 value 类型。

[`src/logical/ast.ts`](https://github.com/rien7/filtro/blob/main/src/logical/ast.ts) 定义 `FilterCondition`、`FilterGroup`、`FilterRoot` 等 AST 类型，但当前 `FilterBar` UI 不编辑嵌套 AST。

### 2. 字段声明方式

通过 [`src/filter-bar/builder.ts`](https://github.com/rien7/filtro/blob/main/src/filter-bar/builder.ts) 导出的单例 `filtro` 构建字段：

```ts
filtro.string("keyword").label("Keyword")
filtro.select("status").options([
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
])
filtro.group("Basic", [/* fields */])
```

关键事实：

- builder 内部用 `WeakMap` 关联 builder 实例和最终 `UIField`
- `allowedOperators` 默认来自 `operatorsForKind`
- `select` / `multiSelect` 支持静态 options 和异步 loader
- `boolean` 依赖显式 options
- 字段可以注入自定义 `render`

### 3. UI 结构

当前公开组件主要来自 [`src/filter-bar/index.ts`](https://github.com/rien7/filtro/blob/main/src/filter-bar/index.ts)：

- `FilterBar.Root`
- `FilterBar.Trigger`
- `FilterBar.Items`
- `FilterBar.Clear`
- `FilterBar.SaveView`
- `FilterBar.Views`

运行机制：

- `Root` 接收字段定义，展开成 `uiFieldEntries` 与 `uiFields`
- `Trigger` 负责添加筛选项，并避免重复添加同一字段
- `Items` 渲染当前激活的条件行
- 每一行由 [`src/filter-bar/items.row.tsx`](https://github.com/rien7/filtro/blob/main/src/filter-bar/items.row.tsx) 负责 field/operator/value/remove
- 值编辑器按字段种类分发到 [`src/filter-bar/items-editors`](https://github.com/rien7/filtro/tree/main/src/filter-bar/items-editors)

### 4. 状态管理

[`src/filter-bar/context.ts`](https://github.com/rien7/filtro/blob/main/src/filter-bar/context.ts) 中的 `values` 是当前唯一状态源。

注意当前状态形态：

- 是 `FilterBarValue[]`
- 每个字段最多出现一次
- 不支持同字段重复条件
- 不支持 AND/OR 分组
- 不直接输出 `FilterRoot`

如果需求变成复杂过滤器、分组、AST 输出，不要继续在当前 `FilterBarValue[]` 上硬扩展。

## 主题和样式边界

- `filtro` 根入口不导出默认样式 preset
- `defaultFilterBarTheme` 和 styled primitives 从 [`src/presets/default-theme/index.tsx`](https://github.com/rien7/filtro/blob/main/src/presets/default-theme/index.tsx) 暴露
- [`src/filter-bar/theme.tsx`](https://github.com/rien7/filtro/blob/main/src/filter-bar/theme.tsx) 只负责 theme slot contract、merge 和 provider
- [`src/presets/default-theme/styles.css`](https://github.com/rien7/filtro/blob/main/src/presets/default-theme/styles.css) 是默认主题样式源文件

当前默认样式仍然依赖 Tailwind CSS v4 编译链路。

## 修改建议

### 适合直接修改的区域

- 新增字段种类相关 UI：优先看 [`src/filter-bar/items.value-editor.tsx`](https://github.com/rien7/filtro/blob/main/src/filter-bar/items.value-editor.tsx)、[`src/filter-bar/items-editors`](https://github.com/rien7/filtro/tree/main/src/filter-bar/items-editors)、[`src/filter-bar/types.ts`](https://github.com/rien7/filtro/blob/main/src/filter-bar/types.ts)
- 新增或调整操作符：同步修改 [`src/logical/operator.ts`](https://github.com/rien7/filtro/blob/main/src/logical/operator.ts) 与 [`src/filter-bar/items.constants.ts`](https://github.com/rien7/filtro/blob/main/src/filter-bar/items.constants.ts)
- 调整字段声明 API：修改 [`src/filter-bar/builder.ts`](https://github.com/rien7/filtro/blob/main/src/filter-bar/builder.ts)
- 调整交互或布局：修改 [`src/filter-bar`](https://github.com/rien7/filtro/tree/main/src/filter-bar)
- 调整默认视觉：修改 [`src/presets/default-theme/index.tsx`](https://github.com/rien7/filtro/blob/main/src/presets/default-theme/index.tsx) 和 [`src/presets/default-theme/styles.css`](https://github.com/rien7/filtro/blob/main/src/presets/default-theme/styles.css)
- 调整 playground 专用日期 UI：修改 [`playground/calendar-date-editor.tsx`](https://github.com/rien7/filtro/blob/main/playground/calendar-date-editor.tsx) 和 [`playground/internal/calendar.tsx`](https://github.com/rien7/filtro/blob/main/playground/internal/calendar.tsx)

### 修改时的约束

- 先确认改的是当前实现，不要把未来规划能力误认为已经存在
- `logical` 层保持纯类型/领域定义，不要引入 React
- builder 是对外 API，改签名要考虑类型推导和兼容性
- `FilterBar.Root` 已支持 uncontrolled 和 controlled 用法，涉及状态时要同时考虑两条路径
- `select` 异步选项逻辑已经存在，相关改动先检查 [`src/filter-bar/select-options.ts`](https://github.com/rien7/filtro/blob/main/src/filter-bar/select-options.ts)
- `dist` 和 `dist-playground` 不是主要修改目标

## 当前已知状态

- `README.md` 已存在，并描述了新的入口结构
- 测试脚本当前等同于类型检查，没有独立单测
- playground 是理解行为的最快入口，参考 [`playground/playground-app.tsx`](https://github.com/rien7/filtro/blob/main/playground/playground-app.tsx)
- 路径别名 `@/*` 指向 `src/*`

## 给后续代理的工作方式

1. 先看 [`package.json`](https://github.com/rien7/filtro/blob/main/package.json) 和 [`README.md`](https://github.com/rien7/filtro/blob/main/README.md)，确认新的对外入口和默认主题子入口。
2. 涉及字段、操作符和值类型时，先从 [`src/logical`](https://github.com/rien7/filtro/tree/main/src/logical) 开始。
3. 涉及 `FilterBar` 交互时，优先顺着 `Root -> Trigger -> Items -> items-editors` 这条链路阅读。
4. 涉及默认视觉时，把它视为 preset 层问题，优先看 [`src/presets/default-theme`](https://github.com/rien7/filtro/tree/main/src/presets/default-theme)。
5. 如果需求已经是复杂过滤器 / 分组 / AST 输出 / framework-agnostic core，把它视为新阶段能力，不要直接给当前 `FilterBar` 打补丁。
