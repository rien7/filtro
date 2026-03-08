# FilterBar Options

`select` / `multiSelect` 字段现在支持三种 options 来源：

- 静态数组：最简单，适合固定字典
- async loader：适合直接请求远程 options
- `useOptions` hook：适合 TanStack Query、SWR、自建 store、复杂缓存逻辑

这三种方式都服务于当前这套“扁平 FilterBar”实现，不是未来规划里的嵌套 builder。

## 1. 静态数组

静态 options 仍然是最直接的方式：

```tsx
import { filtro } from "filtro";

const fields = [
  filtro.select("status")
    .label("Status")
    .options([
      { label: "Open", value: "open" },
      { label: "Closed", value: "closed" },
      { label: "Pending", value: "pending" },
    ]),
];
```

特点：

- 不发请求
- `status` 始终是 `SelectOptionsStatus.success`
- 搜索默认在前端本地过滤
- `loadOptions("open" | "render")` 对静态数组没有实际差异

适用场景：

- 状态枚举
- 布尔扩展选项
- 体量小且稳定的业务字典

## 2. Async Loader

如果只想把远程请求接进来，不想引入额外数据层，继续用 `.options(async ...)` 即可：

```tsx
import { filtro } from "filtro";

const fields = [
  filtro.select("owner")
    .label("Owner")
    .placeholder("Search owner")
    .options(async ({ query, signal }) => {
      const response = await fetch(
        `/api/owners?q=${encodeURIComponent(query)}`,
        { signal },
      );

      if (!response.ok) {
        throw new Error("Failed to load owners");
      }

      return (await response.json()) as Array<{ label: string; value: string }>;
    })
    .loadOptions("open"),
];
```

当前行为：

- `query` 是当前搜索框输入
- `signal` 会在请求切换或 UI 关闭时中止旧请求
- 结果会按 `field.id + query` 做内部缓存
- 已加载过的 option label 会被内部记住，用于已选值回填

适用场景：

- 你只需要远程请求，不想引入 Query / store
- 字段自己的请求逻辑比较简单
- 你接受由 `filtro` 管理这层 options 缓存

## 3. `useOptions` Hook

如果你已经有自己的数据层，或者需要更复杂的状态编排，推荐用 `.useOptions(...)`。

这是一个“通用 options source 接口”，不是专门为 TanStack Query 定制的 API。

```tsx
import { filtro, SelectOptionsStatus, type UseSelectOptions } from "filtro";
import { useMemo } from "react";

const useReviewerOptions: UseSelectOptions<"reviewer", "select"> = ({
  normalizedQuery,
  selectedValues,
  shouldLoad,
}) => {
  const allOptions = useMemo(() => [
    { label: "Alice Johnson", value: "alice" },
    { label: "Ben Carter", value: "ben" },
    { label: "Chris Wong", value: "chris" },
  ], []);

  const options = useMemo(() => {
    if (!shouldLoad) {
      return [];
    }

    return allOptions.filter((option) => {
      const haystack = `${option.label} ${option.value}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [allOptions, normalizedQuery, shouldLoad]);

  const selectedOptions = useMemo(
    () => allOptions.filter((option) => selectedValues.includes(option.value)),
    [allOptions, selectedValues],
  );

  return {
    options,
    selectedOptions,
    status: shouldLoad
      ? SelectOptionsStatus.success
      : SelectOptionsStatus.idle,
  };
};

const fields = [
  filtro.select("reviewer")
    .label("Reviewer")
    .useOptions(useReviewerOptions)
    .loadOptions("open"),
];
```

适用场景：

- 你想接 TanStack Query / SWR
- 你有自己的全局缓存或 store
- 需要返回额外的 `selectedOptions`
- 需要精确控制 `status` / `error`

## 4. `useOptions` 的输入参数

`useOptions` 会收到一份上下文对象：

```ts
type SelectOptionsSourceContext = {
  field: SelectUIField;
  open: boolean;
  query: string;
  normalizedQuery: string;
  selectedValues: string[];
  shouldLoad: boolean;
};
```

各字段含义：

- `field`: 当前字段定义本身
- `open`: 下拉当前是否打开
- `query`: 搜索框原始输入
- `normalizedQuery`: 当前内部标准化后的查询值，等于 `query.trim().toLowerCase()`
- `selectedValues`: 当前已选的 value 列表
- `shouldLoad`: 当前是否应该开始加载

`shouldLoad` 的规则：

- `loadOptions("render")` 时，一进入页面就是 `true`
- `loadOptions("open")` 时，只有打开下拉后才会变成 `true`
- 如果没显式设置 `loadOptions(...)`，当前默认行为等同于 `"open"`

对自定义 source 来说，最重要的是优先根据 `shouldLoad` 决定是否真正发请求。

## 5. `useOptions` 的返回值

`useOptions` 需要返回：

```ts
type SelectOptionsSourceResult = {
  options: SelectOption[];
  status: SelectOptionsStatus;
  error?: Error | null;
  selectedOptions?: FlattenedSelectOption[];
};
```

各字段含义：

- `options`: 当前 query 下应该显示的 options
- `status`: 当前加载状态
- `error`: 加载失败时的错误对象
- `selectedOptions`: 可选，用于补回当前 query 不在结果集里的已选项 label

`selectedOptions` 很有用，尤其是远程搜索场景：

- 当前 query 可能只返回一小段结果
- 但用户已经选中的值仍然需要显示正确 label
- 如果你能从外部缓存或 store 里拿到已选项，建议显式返回它们

如果不返回 `selectedOptions`，`filtro` 仍然会回退到内部已见过的 option 缓存。

## 6. `SelectOptionsStatus`

`options` 状态现在导出为 `as const` 常量：

```ts
import { SelectOptionsStatus } from "filtro";

SelectOptionsStatus.idle;
SelectOptionsStatus.loading;
SelectOptionsStatus.success;
SelectOptionsStatus.error;
```

建议统一使用这个常量，而不是手写 `"loading"` 这种裸字符串。

## 7. `options()` 和 `useOptions()` 的关系

同一个字段只应该有一个 options 数据源。

当前 builder 的行为是：

- 调用 `.options(...)` 时，会清掉之前设置的 `.useOptions(...)`
- 调用 `.useOptions(...)` 时，会清掉之前设置的 `.options(...)`

也就是说，最后一次声明的来源生效。

## 8. `loadOptions(...)`

`loadOptions` 用来控制什么时候允许开始加载。

```tsx
filtro.select("owner")
  .options(async ({ query }) => fetchOwners(query))
  .loadOptions("open");
```

可选值：

- `"open"`: 打开下拉后才开始加载
- `"render"`: 组件一渲染就可以加载

使用建议：

- 远程搜索型接口：优先 `"open"`
- 首屏必须立即可用的小型远程字典：可以 `"render"`
- 静态数组：可设可不设，通常没必要

## 9. `searchable(...)`

`searchable()` 用来控制是否显示搜索框。

```tsx
filtro.select("status")
  .options([
    { label: "Open", value: "open" },
    { label: "Closed", value: "closed" },
  ])
  .searchable(false);
```

当前默认值是 `true`。

影响：

- `false` 时不渲染搜索框
- 静态数组不会做 query 过滤
- async loader / `useOptions` 收到的 `query` 会始终是空字符串

## 10. TanStack Query 最佳接法

TanStack Query 的最佳使用方式是放进 `useOptions`，而不是塞进 `.options(async ...)`。

原因：

- `useQuery` 必须运行在合法的 hook 边界
- `useOptions` 本身就是为外部数据层准备的 hook 接口
- `status` / `error` / `options` 都可以直接由 Query 派生

示例：

```tsx
import {
  SelectOptionsStatus,
  filtro,
  type UseSelectOptions,
} from "filtro";
import {
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";
import { useMemo } from "react";

const useOwnerOptions: UseSelectOptions<"owner", "select"> = ({
  field,
  normalizedQuery,
  selectedValues,
  shouldLoad,
}) => {
  const ownersQuery = useQuery({
    queryKey: ["filtro", "options", field.id, normalizedQuery],
    queryFn: async ({ signal }) => {
      const response = await fetch(
        `/api/owners?q=${encodeURIComponent(normalizedQuery)}`,
        { signal },
      );

      if (!response.ok) {
        throw new Error("Failed to load owners");
      }

      return (await response.json()) as Array<{ label: string; value: string }>;
    },
    enabled: shouldLoad,
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });

  const selectedOptions = useMemo(() => {
    const allOptions = ownersQuery.data ?? [];
    return allOptions.filter((option) => selectedValues.includes(option.value));
  }, [ownersQuery.data, selectedValues]);

  return {
    options: ownersQuery.data ?? [],
    selectedOptions,
    status: ownersQuery.isPending
      ? SelectOptionsStatus.loading
      : ownersQuery.isError
        ? SelectOptionsStatus.error
        : SelectOptionsStatus.success,
    error: ownersQuery.error ?? null,
  };
};

const fields = [
  filtro.select("owner")
    .label("Owner")
    .useOptions(useOwnerOptions)
    .loadOptions("open"),
];
```

实践建议：

- `queryKey` 带上 `field.id + normalizedQuery`
- 用 `enabled: shouldLoad`
- 用 Query 自己的 `signal`
- 用 `placeholderData: keepPreviousData` 减少搜索切换时的闪空
- 如果当前结果集不一定包含已选值，显式返回 `selectedOptions`

## 11. 什么时候选哪一种

- 固定字典：用静态 `.options([...])`
- 轻量远程请求：用 `.options(async ({ query, signal }) => ...)`
- 需要接 Query / store / 自定义缓存：用 `.useOptions(...)`

如果你已经有成熟的数据层，优先 `useOptions`。  
如果你只是想快速把一个接口接进来，async loader 足够简单。
