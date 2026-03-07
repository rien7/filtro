# FilterBar With nuqs

`FilterBar` 现在支持受控模式，因此 URL 同步不再靠内部插件机制，而是通过一个可选的状态适配器子入口完成：

- 主包继续只提供 `FilterBar` 本身
- 需要 URL query state 的项目额外安装 `nuqs`
- 然后从 `filtro/nuqs` 接入 `useNuqsFilterBarState`

这套设计的目标是：

- 不使用 URL 同步的人不需要安装 `nuqs`
- `filtro` 不绑定具体 router 或 framework adapter
- `FilterBar` 仍然保持当前的一字段一条件模型

## 1. 安装

```bash
pnpm add filtro nuqs
```

`nuqs` 是 `filtro` 的可选 peer dependency。

如果你的应用已经装了 `filtro`，只在需要 URL 同步时再补装 `nuqs` 即可。

## 2. 先给应用挂 `NuqsAdapter`

`filtro/nuqs` 不会自动包裹 adapter，宿主应用需要按自己的框架接官方 adapter。

React SPA / Vite 示例：

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { NuqsAdapter } from "nuqs/adapters/react";

import { App } from "./app";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NuqsAdapter>
      <App />
    </NuqsAdapter>
  </StrictMode>,
);
```

Next.js、Remix、React Router 等其它运行时请直接使用 `nuqs` 官方对应 adapter。

参考：

- [nuqs adapters](https://nuqs.dev/docs/adapters)

## 3. 最短用法

`useNuqsFilterBarState` 会把 URL query string 映射成 `FilterBar.Root` 的受控 `value` / `onValueChange`。

```tsx
import { FilterBar, filtro } from "filtro";
import { useNuqsFilterBarState } from "filtro/nuqs";

const fields = [
  filtro.string("keyword").label("Keyword"),
  filtro.number("amount").label("Amount"),
  filtro.select("status").label("Status").options([
    { label: "Open", value: "open" },
    { label: "Closed", value: "closed" },
  ]),
  filtro.multiSelect("tags").label("Tags").options([
    { label: "VIP", value: "vip" },
    { label: "Trial", value: "trial" },
  ]),
];

export function Filters() {
  const filterState = useNuqsFilterBarState({
    fields,
    prefix: "demo_",
    history: "replace",
    shallow: true,
  });

  return (
    <FilterBar.Root
      fields={fields}
      value={filterState.value}
      onValueChange={filterState.onValueChange}
    >
      <FilterBar.Trigger render={<button type="button" />}>
        Add Filter
      </FilterBar.Trigger>
      <FilterBar.Clear render={<button type="button" />}>
        Clear
      </FilterBar.Clear>
      <FilterBar.Items />
    </FilterBar.Root>
  );
}
```

效果：

- 首次渲染从 URL 恢复筛选状态
- 用户修改筛选时自动写回 query string
- 浏览器前进 / 后退会反向更新 `FilterBar`

## 4. `FilterBar.Root` 的受控模式

为了支持这类外部状态源，`FilterBar.Root` 现在有两种模式：

### 非受控

```tsx
<FilterBar.Root fields={fields}>...</FilterBar.Root>
```

- 内部自己维护状态
- 行为和旧版本一致

### 受控

```tsx
<FilterBar.Root
  fields={fields}
  value={value}
  onValueChange={setValue}
>
  ...
</FilterBar.Root>
```

- 外部提供当前值
- 内部所有增删改都只走 `onValueChange`
- `defaultValue` 只在非受控模式下生效

`filtro/nuqs` 本质上只是一个把 URL 变成 `value/onValueChange` 的适配器。

## 5. Hook API

### `useNuqsFilterBarState`

```ts
useNuqsFilterBarState({
  fields,
  prefix?: string,
  history?: "push" | "replace",
  shallow?: boolean,
})
```

返回值：

```ts
{
  value: FilterBarValueType
  onValueChange: (nextValue: FilterBarValueType) => void
}
```

参数说明：

- `fields`: 传给 `FilterBar.Root` 的同一组字段定义
- `prefix`: query key 前缀，避免页面上多个 `FilterBar` 互相冲突
- `history`: 透传给 `nuqs/useQueryStates`
- `shallow`: 透传给 `nuqs/useQueryStates`

## 6. 默认 query key 规则

`filtro/nuqs` 默认不是把整个筛选写进一个 JSON 参数，而是按字段拆开成多组 key。

假设字段 id 是 `status`，前缀是 `demo_`：

- 值 key: `demo_status`
- operator key: `demo_statusOp`
- 区间起点 key: `demo_statusFrom`
- 区间终点 key: `demo_statusTo`

不同字段的编码规则：

- 固定 operator 字段
  - 不写 `${fieldId}Op`
  - 直接使用字段定义上的固定 operator 解析 value
- `string`
  - 值写到 `${fieldId}`
  - operator 写到 `${fieldId}Op`
- `select`
  - 同 `string`
- `number`
  - 单值 operator 写到 `${fieldId}`
  - `between/notBetween` 写到 `${fieldId}From` 和 `${fieldId}To`
- `date`
  - 单值 operator 写到 `${fieldId}`
  - `between/notBetween` 写到 `${fieldId}From` 和 `${fieldId}To`
  - `lastNDays/nextNDays` 写到 `${fieldId}`
- `multiSelect`
  - 值写到 `${fieldId}`
  - 使用 `nuqs` 的数组 parser
- `boolean`
  - 值写到 `${fieldId}`

空值 operator：

- `isEmpty`
- `isNotEmpty`

这两种情况下只写 `${fieldId}Op`，不会再写 value key。

## 7. 非法 URL 的处理方式

`filtro/nuqs` 会先按字段定义做清洗，再把结果喂给 `FilterBar`。

以下情况会被直接忽略：

- query 中的字段在当前 `fields` 里不存在
- operator 不在字段的 `allowedOperators` 里
- value 类型和 operator 不匹配
- 区间值只传了一半

这意味着：

- 分享旧 URL 到新版本页面时，失效条件会被自动丢弃
- 字段或 operator 配置变化后，不会把非法状态塞回 UI
- 字段改成固定 operator 后，旧的 `${fieldId}Op` 会被忽略，当前值按固定 operator 解释

## 8. 高级用法：自己接 `useQueryStates`

如果你已经有自己的 query state 组织方式，可以只用 parser 生成器：

```tsx
import { useMemo } from "react";
import { useQueryStates } from "nuqs";

import { createFilterBarNuqsParsers } from "filtro/nuqs";

const parsers = createFilterBarNuqsParsers(fields, { prefix: "orders_" });

function Example() {
  const [query, setQuery] = useQueryStates(parsers, {
    history: "push",
    shallow: false,
  });

  return <pre>{JSON.stringify(query, null, 2)}</pre>;
}
```

这个 API 适合：

- 你想把筛选和分页共用同一个 `useQueryStates`
- 你想在 `FilterBar` 之外直接读写这些 query key
- 你需要更细粒度地组合 `nuqs` parser

## 9. 当前约束

这个适配器遵循当前 `FilterBar` 的模型，不会扩展成更复杂的 AST。

当前限制：

- 一字段最多只有一条条件
- 不支持同字段重复条件
- 不支持 AND / OR 分组
- 不输出 `FilterRoot` AST

如果后面要做嵌套 group/filter builder，不应该直接往这套 query 编码上硬扩展，而应该重新设计状态模型。
