# AGENTS.md

## 项目概览

`filtro` 是一个基于 React 的筛选 UI 组件库，不是完整业务应用。

当前仓库已经实现的是一个可复用的 `FilterBar` 组件体系，提供：

- 逻辑字段与操作符定义
- 基于 builder 的字段声明 API
- 基于 React Context 的筛选状态管理
- 一套默认的筛选项触发器、行编辑器和值编辑器
- 一个 Vite playground 用于本地调试 UI

需要特别区分：

- `src/logical/*` 和 `src/ui/*` 是当前真实实现
- [`docs/filter-ui-plan.md`](https://github.com/rien7/filtro/blob/main/docs/filter-ui-plan.md) 是未来架构规划，不代表当前代码已经具备该能力

当前 UI 形态是“扁平 filter bar”，不是文档规划里的嵌套 group/filter builder。

## 技术栈

- React 19
- TypeScript 5
- Vite 7
- `@base-ui/react`
- Tailwind CSS 4
- `tsdown` 用于库打包
- `pnpm` 作为包管理器

## 常用命令

- 安装依赖：`pnpm install`
- 类型检查：`pnpm run typecheck`
- 测试：`pnpm test`
- 构建库产物：`pnpm run build`
- 启动 playground：`pnpm run dev:ui`
- 构建 playground：`pnpm run build:ui`
- 预览 playground：`pnpm run preview:ui`

当前已确认 `pnpm run typecheck` 通过。

## 目录结构

- [`src/index.ts`](https://github.com/rien7/filtro/blob/main/src/index.ts): 包入口，导出 logical 和 ui 两层 API
- [`src/logical`](https://github.com/rien7/filtro/tree/main/src/logical): 领域层，定义字段种类、操作符和值类型、AST 类型
- [`src/ui/builder.ts`](https://github.com/rien7/filtro/blob/main/src/filter-bar/builder.ts): `filtro.string/number/select/...` builder API
- [`src/ui/types.ts`](https://github.com/rien7/filtro/blob/main/src/filter-bar/types.ts): UI 字段类型、选项加载类型、自定义 render 类型
- [`src/ui/filter-bar`](https://github.com/rien7/filtro/tree/main/src/filter-bar): `FilterBar.Root/Trigger/Items/Clear` 及状态逻辑
- [`src/ui/baseui`](https://github.com/rien7/filtro/tree/main/src/filter-bar/internal/primitives/baseui): 对 `@base-ui/react` 的轻封装
- [`src/index.css`](https://github.com/rien7/filtro/blob/main/src/presets/default-theme/styles.css): 对外导出的样式入口
- [`playground`](https://github.com/rien7/filtro/tree/main/playground): 本地调试页面
- [`vite.config.ts`](https://github.com/rien7/filtro/blob/main/vite.config.ts): playground 的 Vite 配置
- [`docs/filter-ui-plan.md`](https://github.com/rien7/filtro/blob/main/docs/filter-ui-plan.md): 后续更大范围的 filter builder 规划

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

[`src/logical/ast.ts`](https://github.com/rien7/filtro/blob/main/src/logical/ast.ts) 定义了 `FilterCondition`、`FilterGroup`、`FilterRoot` 等 AST 类型，但当前 `FilterBar` UI 并没有真正编辑嵌套 AST，只维护一组平铺条件。

### 2. 字段声明方式

通过 [`src/ui/builder.ts`](https://github.com/rien7/filtro/blob/main/src/filter-bar/builder.ts) 暴露的单例 `filtro` 构建字段：

```ts
filtro.string("keyword").meta({ label: "Keyword" })
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
- 字段可以注入自定义 `render`，替换默认值编辑器

### 3. UI 结构

当前公开组件主要来自 [`src/ui/filter-bar/index.ts`](https://github.com/rien7/filtro/blob/main/src/filter-bar/index.ts)：

- `FilterBar.Root`
- `FilterBar.Trigger`
- `FilterBar.Items`
- `FilterBar.Clear`

运行机制：

- `Root` 接收字段定义，展开成 `uiFieldEntries` 与 `uiFields`
- `Trigger` 负责添加筛选项，并避免重复添加同一字段
- `Items` 渲染当前激活的条件行
- 每一行由 [`src/ui/filter-bar/items.row.tsx`](https://github.com/rien7/filtro/blob/main/src/filter-bar/items.row.tsx) 负责 field/operator/value/remove
- 值编辑器按字段种类分发到 `items-editors/*`

### 4. 状态管理

[`src/ui/filter-bar/context.ts`](https://github.com/rien7/filtro/blob/main/src/filter-bar/context.ts) 中的 `values` 是当前唯一状态源。

注意当前状态形态：

- 是 `FilterBarValue[]`
- 每个字段最多出现一次
- 不支持同字段重复条件
- 不支持 AND/OR 分组
- 不直接输出 `FilterRoot`

如果要实现复杂筛选编辑器，不要在当前 `FilterBarValue[]` 上硬扩展，优先重新审视 [`docs/filter-ui-plan.md`](https://github.com/rien7/filtro/blob/main/docs/filter-ui-plan.md) 中的分层设计。

## 修改建议

### 适合直接修改的区域

- 新增字段种类相关 UI：优先看 [`src/ui/filter-bar/items.value-editor.tsx`](https://github.com/rien7/filtro/blob/main/src/filter-bar/items.value-editor.tsx)、[`src/ui/filter-bar/items-editors`](https://github.com/rien7/filtro/tree/main/src/filter-bar/items-editors) 和 [`src/ui/types.ts`](https://github.com/rien7/filtro/blob/main/src/filter-bar/types.ts)
- 新增或调整操作符：同步修改 [`src/logical/operator.ts`](https://github.com/rien7/filtro/blob/main/src/logical/operator.ts) 与 [`src/ui/filter-bar/items.constants.ts`](https://github.com/rien7/filtro/blob/main/src/filter-bar/items.constants.ts)
- 调整字段声明 API：修改 [`src/ui/builder.ts`](https://github.com/rien7/filtro/blob/main/src/filter-bar/builder.ts)
- 调整交互或布局：修改 [`src/ui/filter-bar`](https://github.com/rien7/filtro/tree/main/src/filter-bar) 和 [`src/index.css`](https://github.com/rien7/filtro/blob/main/src/presets/default-theme/styles.css)

### 修改时的约束

- 先确认改的是“当前实现”还是“未来规划”，不要混淆
- `logical` 层保持纯类型/领域定义，不要引入 React 依赖
- `builder` 是对外 API，改签名要考虑类型推导和向后兼容
- `FilterBar.Root` 当前是内部持有状态的 uncontrolled 组件；如果要引入受控模式，需要同步设计 context 和外部回调
- `select` 异步选项逻辑已经存在，相关改动先检查 [`src/ui/filter-bar/select-options.ts`](https://github.com/rien7/filtro/blob/main/src/filter-bar/select-options.ts)
- `dist` 和 `dist-playground` 是构建产物，不应作为主要修改目标

## 当前已知状态

- 没有 README，仓库说明主要依赖代码结构和 `docs/filter-ui-plan.md`
- 测试脚本当前等同于类型检查，没有独立单测
- playground 是理解行为的最快入口，参考 [`playground/playground-app.tsx`](https://github.com/rien7/filtro/blob/main/playground/playground-app.tsx)
- 代码中路径别名统一使用 `@` 指向 `src`

## 给后续代理的工作方式

1. 先看 [`package.json`](https://github.com/rien7/filtro/blob/main/package.json) 和 [`playground/playground-app.tsx`](https://github.com/rien7/filtro/blob/main/playground/playground-app.tsx)，确认当前对外使用方式。
2. 涉及字段、操作符和值类型时，先从 [`src/logical`](https://github.com/rien7/filtro/tree/main/src/logical) 开始，不要先改 UI。
3. 涉及筛选条交互时，优先顺着 `FilterBar.Root -> Trigger -> Items -> items-editors` 这条链路阅读。
4. 如果需求是“复杂过滤器 / 分组 / AST 输出 / 校验器 / framework-agnostic core”，先把它视为新阶段能力，而不是给现有 `FilterBar` 打补丁。
