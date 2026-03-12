# filtro 极简 API 设计方案

> 像 Sonner 一样，2 行代码即可运行，复杂需求再逐层解锁

---

## 一、设计哲学

![[
git-worktree-workflow]]
Sonner 成功的核心不是功能多，而是**零阻力入门**。
用户打开文档，30 秒内就能让 toast 弹出来。
filtro 目前的问题恰恰相反——用户面对的是六个概念（builder、Root、Trigger、ActiveItems、theme、nuqs），还没开始写业务逻辑就已经认知过载了。

极简 API 的核心原则是**分层暴露（Progressive Disclosure）**：

- **层 1**：默认可用。
  不传任何配置，组件就能渲染出可交互的过滤条。
- **层 2**：常见场景一个 prop 搞定。
  想要 URL 同步？
  加 `syncUrl`。
  想要保存视图？
  加 `storageKey`。
- **层 3**：高级用法保持现有 API。`FilterBar.Root` + 组合模式 + 主题定制，一个都不少。

---

## 二、目标 API 形态

### 2.1 最简使用（Level 1）

参照 Sonner：`import { Toaster } from "sonner"` + `<Toaster />`，filtro 的极简版应该是：

```tsx
import { Filtro, filtro } from 'filtro'

const fields = [
  filtro.string('keyword').label('关键词'),
  filtro.select('status').label('状态').options([
    { label: '开启', value: 'open' },
    { label: '关闭', value: 'closed' },
  ]),
]

export function MyPage() {
  return (
    <Filtro
      fields={fields}
      onChange={filters => console.log(filters)}
    />
  )
}
```

这就是全部。
不需要 import CSS，不需要配置 theme，不需要手动组合子组件。

### 2.2 常见进阶（Level 2）

每个常见场景对应一个 prop，不需要阅读子文档。

```tsx
<Filtro
  fields={fields}
  onChange={handleChange}

  // URL 同步（需要 nuqs 已安装）
  syncUrl

  // 本地保存视图
  storageKey="my-app:filters"

  // 默认激活的过滤条件
  defaultValue={[{ fieldId: 'status', operator: 'eq', value: 'open' }]}

  // 手动应用模式（点 Apply 后才触发 onChange）
  applyMode="manual"

  // 主题
  theme="default" // 或 "minimal" | "none"
/>
```

### 2.3 完全控制（Level 3）

需要自定义布局、嵌套子组件、精细主题控制时，使用现有的组合 API，与目前 README 保持一致。

```tsx
// 现有 API 保持不变，<Filtro> 只是它的语法糖
<FilterBar.Root fields={fields} theme={myTheme}>
  <div className="toolbar">
    <FilterBar.Trigger render={<Button />}>Add Filter</FilterBar.Trigger>
    <FilterBar.Clear render={<Button />}>Clear</FilterBar.Clear>
  </div>
  <FilterBar.ActiveItems />
</FilterBar.Root>
```

---

## 三、实现路径

整体策略：`<Filtro>` 是一个薄封装层，**不改变任何现有内部逻辑**，只是把组合 API 的"胶水代码"内化到库里。

### Step 1：新建 `src/filtro/index.tsx`

这是极简组件的唯一入口文件，不修改任何现有代码。
对外导出 `<Filtro>` 组件和 `FiltroProps` 类型。

### Step 2：定义 `FiltroProps` 接口

收集所有一体化 prop，内部映射到 `FilterBar.Root` 的 props。
所有 prop 均为可选，组件开箱即可渲染。

```ts
export interface FiltroProps<TFields extends FieldDefinition[] = FieldDefinition[]> {
  // ─── 必需 ────────────────────────────────────────────────────
  fields: TFields

  // ─── 状态 ────────────────────────────────────────────────────
  value?: FilterBarValueType<InferFieldId<TFields>>
  defaultValue?: FilterBarValueType<InferFieldId<TFields>>
  onChange?: (value: FilterBarValueType<InferFieldId<TFields>>) => void

  // ─── 功能开关 ─────────────────────────────────────────────────
  syncUrl?: boolean // URL 同步，需要安装 nuqs
  storageKey?: string // localStorage 保存视图
  applyMode?: 'auto' | 'manual' // auto = 实时，manual = 点 Apply

  // ─── 外观 ─────────────────────────────────────────────────────
  theme?: 'default' | 'minimal' | 'none'
  className?: string

  // ─── 文案定制 ─────────────────────────────────────────────────
  labels?: {
    addFilter?: string // 默认 "Add Filter"
    clear?: string // 默认 "Clear"
    apply?: string // 默认 "Apply"（applyMode=manual 时显示）
    saveView?: string // 默认 "Save View"（有 storageKey 时显示）
    views?: string // 默认 "Views"（有 storageKey 时显示）
  }
}
```

### Step 3：组件实现骨架

```tsx
export function Filtro<TFields extends FieldDefinition[]>({
  fields,
  value,
  defaultValue,
  onChange,
  syncUrl = false,
  storageKey,
  applyMode = 'auto',
  theme = 'default',
  className,
  labels = {},
}: FiltroProps<TFields>) {
  // 1. 解析 theme
  const resolvedTheme = useTheme(theme)

  // 2. applyMode=manual 时接入 controller
  const controller = applyMode === 'manual'
    ? useFilterBarController({ defaultValue, applyMode: 'manual' })
    : null

  // 3. syncUrl 时接入 nuqs（异步检测）
  const urlProps = useNuqsSync(syncUrl, fields)

  // 4. 组合 FilterBar.Root 的 props
  const rootProps = {
    fields,
    theme: resolvedTheme,
    viewsStorageKey: storageKey,
    value: controller?.draftValue ?? value,
    onChange: controller?.onDraftChange ?? onChange,
    ...urlProps,
  }

  return (
    <FilterBar.Root {...rootProps} className={className}>
      <FiltroToolbar labels={labels} storageKey={storageKey} />
      <FilterBar.Content>
        <FilterBar.PinnedItems />
        <FilterBar.ActiveItems />
        <FilterBar.SuggestedItems />
      </FilterBar.Content>
      {applyMode === 'manual' && (
        <button
          onClick={controller!.apply}
          disabled={!controller!.isDirty}
        >
          {labels.apply ?? 'Apply'}
        </button>
      )}
    </FilterBar.Root>
  )
}
```

### Step 4：`useTheme` 钩子（处理 CSS 的动态加载）

主题 CSS 的加载是最棘手的部分。
由于 `filtro/default-theme.css` 是预编译的静态文件，需要在客户端条件加载，避免强制要求用户手动 import。

```ts
function useTheme(theme: FiltroProps['theme']) {
  useEffect(() => {
    if (theme === 'none')
      return

    // 检查是否已经加载过
    const id = 'filtro-theme-css'
    if (document.getElementById(id))
      return

    // 动态注入 <link>
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = theme === 'default'
      ? 'filtro/default-theme.css' // bundler 处理路径
      : 'filtro/minimal-theme.css'
    document.head.appendChild(link)
  }, [theme])

  return theme === 'none'
    ? headlessFilterBarTheme
    : defaultFilterBarTheme
}
```

> **注意**：更优雅的方式是通过 bundler 的 CSS-in-JS 或 side-effect import，但动态 link 注入兼容性最好，是最安全的降级策略。

### Step 5：更新 `package.json` exports

新增 `"filtro"` 入口指向 `src/filtro/index.tsx`，保持所有现有 entrypoint 不变。

```json
{
  "exports": {
    ".": "./src/filtro/index.tsx", // 新入口（极简 API）
    "./core": "./src/filter-bar/index.ts", // 原有完整 API（新增别名）
    "./default-theme": "...", // 不变
    "./default-theme.css": "...", // 不变
    "./nuqs": "..." // 不变
  }
}
```

---

## 四、新旧 API 使用量对比

**现在（用户需要写的代码）：**

```tsx
import 'filtro/default-theme.css'

import { FilterBar, filtro } from 'filtro'
import { Button, defaultFilterBarTheme } from 'filtro/default-theme'

const fields = [ /* ... */ ]

export function Example() {
  return (
    <FilterBar.Root
      fields={fields}
      theme={defaultFilterBarTheme}
      viewsStorageKey="demo:filters"
    >
      <div className="flex gap-2">
        <FilterBar.Views render={<Button variant="outline" />}>
          Views
        </FilterBar.Views>
        <FilterBar.SaveView render={<Button variant="outline" />}>
          Save View
        </FilterBar.SaveView>
        <FilterBar.Trigger render={<Button variant="outline" />}>
          Add Filter
        </FilterBar.Trigger>
        <FilterBar.Clear render={<Button variant="outline" />}>
          Clear
        </FilterBar.Clear>
      </div>
      <FilterBar.Content>
        <FilterBar.PinnedItems />
        <FilterBar.ActiveItems />
        <FilterBar.SuggestedItems />
      </FilterBar.Content>
    </FilterBar.Root>
  )
}
```

**目标（用户只需写这些）：**

```tsx
import { Filtro, filtro } from 'filtro'

const fields = [ /* ... */ ]

export function Example() {
  return (
    <Filtro
      fields={fields}
      storageKey="demo:filters"
      onChange={handleChange}
    />
  )
}
```

代码量从 **25 行 → 8 行**，概念数量从 **6 个 → 1 个**。

---

## 五、同步需要补充的配套功能

极简 API 只是入口，以下功能是让库真正"好用"的关键，需要同步规划。

### 5.1 Active Filter Count Badge

Trigger 按钮上显示当前已激活的过滤条件数量，用户一眼就能知道"有 3 个过滤条件正在生效"。

```tsx
// 效果：[Add Filter (3)]
// 实现：FilterBar.Trigger 内部读取 context 中的 activeValues.length

// 作为 prop 暴露：
<FilterBar.Trigger showCount render={<Button />}>
  Add Filter
</FilterBar.Trigger>

// 极简 API 中直接开启：
<Filtro fields={fields} showCount onChange={handleChange} />
```

### 5.2 Active Items 折叠（Overflow 处理）

当激活的过滤条件超过容器宽度时，折叠成 `+3 more` 的形式。
目前没有这个机制，多条件场景下 UI 会溢出。

```tsx
// FilterBar.ActiveItems 增加 maxVisible prop
<FilterBar.ActiveItems maxVisible={4} />
// 超过 4 个时显示：[status: open] [keyword: abc] [+3 more ▾]
// 点击 "+3 more" 展开一个 popover 显示剩余条件
```

### 5.3 Date Range 支持

实际业务中 date range（从 A 到 B）是最常见的日期过滤场景。
目前 `filtro.date()` 只支持单个日期，需要补充 `between` operator 和对应的双选 UI。

```ts
filtro.date('createdAt').label('创建时间')
// 应该支持的 operator：
// 'between' → 渲染两个日期选择器（from / to），value: { from: Date, to: Date }
// 'before'  → 单日期，value: Date
// 'after'   → 单日期，value: Date
// 'is'      → 单日期，精确匹配，value: Date
```

### 5.4 键盘导航与 Accessibility

目前文档中完全缺失这部分。
作为高频交互组件，键盘操作是必须的，否则无法通过企业客户的 a11y 审查。

| 场景              | 期望的键盘行为                                     |
| ----------------- | -------------------------------------------------- |
| 打开 Trigger 菜单 | `Enter` / `Space` 打开；`Escape` 关闭              |
| 菜单内导航        | `↑↓` 移动焦点；`Enter` 选中                        |
| Active item 操作  | `Tab` 聚焦到每个 chip；`Delete` / `Backspace` 移除 |
| Operator 切换     | 点击后 `↑↓` 选择；`Enter` 确认                     |
| 清除所有          | `Ctrl+Shift+Delete`（可配置）                      |

---

## 六、实施优先级路线图

### Phase 0 · 基础：发布到 npm + 在线 Demo

- 发布 beta 版本到 npm（哪怕 `0.1.0-beta.1`）
- 搭建 Starlight 或 Nextra 文档站，部署到 Vercel
- 在线 Playground 嵌入文档首页（Stackblitz 或自建）
- 这是让任何人能"看到"和"试用"的前提

### Phase 1 · 核心：实现极简 `<Filtro>` 组件

- 新建 `src/filtro/index.tsx`，实现 `FiltroProps` 接口
- 实现 `useTheme` 钩子，自动加载 CSS
- 处理 `applyMode` 和 `storageKey` 的内部映射
- 更新 `package.json exports`，新增 `"filtro"` 入口
- 补充 `showCount`（active filter badge）功能

### Phase 2 · 完善：补充高频缺失功能

- Active Items overflow：`maxVisible` + `"+N more"` popover
- Date range：`between` operator + 双选 UI
- 键盘导航基础支持（Trigger 菜单 + Active chip 删除）
- `syncUrl` prop：检测 nuqs 并自动接入

### Phase 3 · 增长：生态与体验

- 移动端 bottom sheet 模式（小屏幕自动切换）
- ARIA 属性完整支持（`role`、`aria-label`、`aria-expanded`）
- 更多 theme 预设（`minimal`、`compact`）
- Next.js App Router、Remix 的最佳实践文档

---

## 七、建议的文件结构

```
src/
├── logical/               # 现有，不动
├── filter-bar/            # 现有，不动
├── presets/
│   ├── default-theme/     # 现有，不动
│   └── minimal-theme/     # 新增（可选）
├── nuqs/                  # 现有，不动
└── filtro/                # 新增：极简 API 层
    ├── index.tsx          # <Filtro> 组件主入口
    ├── use-theme.ts       # CSS 动态加载钩子
    ├── use-nuqs-sync.ts   # nuqs 检测与接入
    ├── filtro-toolbar.tsx # 默认工具栏布局
    └── types.ts           # FiltroProps 接口
```

---

## 八、常见问题

**Q：极简 API 会不会限制扩展性？**

不会。`<Filtro>` 是 `<FilterBar.Root>` 的语法糖，不引入任何新的状态模型。
所有 `FilterBar.*` 子组件仍然可以在 `FilterBar.Root` 模式下自由使用。
两套 API 完全共存，用户按需选择。

**Q：`theme="default"` 会强制引入 Tailwind 吗？**

不会。`default-theme.css` 是预编译的静态 CSS 文件，消费者不需要 Tailwind 构建步骤，直接加载即可，和现有设计保持一致。

**Q：`syncUrl` 在不使用 nuqs 的项目里会报错吗？**

不会。`useNuqsSync` 内部通过 dynamic import 检测 nuqs 是否存在。
如果未安装，会在开发模式下打印一条 `console.warn`，生产环境静默降级（不做 URL 同步）。

**Q：`FiltroProps` 的 TypeScript 类型推导复杂吗？**

使用 `FiltroProps<TFields>` 泛型后，TypeScript 可以自动推导出 `value` 和 `onChange` 的字段 ID 类型，用户不需要手动标注泛型参数。
这和现有的 `FilterBar.Root` 泛型推导方式一致。

---

> 核心思路：不改一行现有逻辑，只在外面加一层薄薄的 `Filtro` 壳。
让新用户 2 行代码跑起来，让老用户继续用组合 API。
