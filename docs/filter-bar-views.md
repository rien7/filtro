# FilterBar Saved Views

`FilterBar` 现在支持把当前已激活的筛选项保存成 view，并在后续直接切换。

这套能力仍然遵循当前 `FilterBar` 的扁平模型：

- view 保存的是当前 `FilterBarValue[]`
- 一字段最多只有一条条件
- 不支持 AND / OR 分组
- 不输出嵌套 AST

## 1. 最短用法

```tsx
import "filtro/ui.css";
import {
  Button,
  defaultFilterBarTheme,
  FilterBar,
  filtro,
} from "filtro";

const fields = [
  filtro.string("keyword").label("Keyword"),
  filtro.select("status").label("Status").options([
    { label: "Open", value: "open" },
    { label: "Closed", value: "closed" },
  ]),
];

export function FilterBarWithViews() {
  return (
    <FilterBar.Root
      fields={fields}
      theme={defaultFilterBarTheme}
      viewsStorageKey="orders:filters"
    >
      <div className="flex flex-wrap gap-2">
        <FilterBar.Views
          maxVisibleRows={1}
          render={<Button variant="outline" />}
        />
        <FilterBar.SaveView render={<Button variant="outline" />}>
          Save View
        </FilterBar.SaveView>
        <FilterBar.Trigger iconMapping render={<Button variant="outline" />}>
          Add Filter
        </FilterBar.Trigger>
        <FilterBar.Clear render={<Button variant="outline" />}>
          Clear
        </FilterBar.Clear>
      </div>
      <FilterBar.Items />
    </FilterBar.Root>
  );
}
```

## 2. 组件职责

### `FilterBar.SaveView`

负责把当前已激活筛选保存成 view。

行为：

- 只有当当前激活的筛选项数量大于 `0` 时才可点击
- 点击后弹出一个输入框，让用户输入 view 名称
- 保存成功后写入浏览器本地存储

### `FilterBar.Views`

负责展示和切换已经保存的 view。

行为：

- 默认直接在外层渲染 view 按钮，而不是先缩在 menu 里
- 点击某个 view 按钮会应用该 view
- 点击当前已选中的 view 按钮会退出当前 view
- 如果 view 太多，超出的部分才进入 overflow menu

## 3. 外显数量控制

`FilterBar.Views` 支持两种溢出策略，可以单独使用，也可以同时使用：

### `maxVisibleCount`

限制外层最多展示多少个 view。

```tsx
<FilterBar.Views
  maxVisibleCount={4}
  render={<Button variant="outline" />}
/>
```

当保存的 view 超过 `4` 个时：

- 前 `4` 个继续显示在外层
- 剩余的 view 进入 overflow menu

### `maxVisibleRows`

限制外层最多展示多少行。

```tsx
<FilterBar.Views
  maxVisibleRows={2}
  render={<Button variant="outline" />}
/>
```

组件会根据当前容器宽度计算哪些按钮还能留在外层，超过最大行数的部分进入 overflow menu。

如果同时传了 `maxVisibleCount` 和 `maxVisibleRows`：

- 先按 `maxVisibleCount` 截断外层候选集
- 再按 `maxVisibleRows` 计算最终留在外层的数量
- 其余 view 全部进入 overflow menu

## 4. view 激活后的筛选交互

view 激活时，`FilterBar.Trigger` 的字段选择行为和普通模式不同：

- 所有字段都仍然可选
- 包括已经存在于当前 view 中的字段
- 一旦用户再次从 `Trigger` 选择任意筛选项，就会自动退出当前 view

这意味着 view 更像是“已保存的筛选快照”，而不是不可变 preset。

## 5. 本地存储

view 默认保存在浏览器 `localStorage` 中。

`FilterBar.Root` 支持：

```tsx
<FilterBar.Root
  fields={fields}
  viewsStorageKey="orders:filters"
>
  ...
</FilterBar.Root>
```

建议：

- 同一页面上如果存在多个 `FilterBar`，显式传入不同的 `viewsStorageKey`
- 如果不传，组件会根据字段定义自动生成一个 storage key

本地存储里保存的是已经过 `sanitizeFilterBarValues` 清洗的数据。

因此：

- 无效字段会被丢弃
- 已不存在的 operator 会被丢弃
- value 类型不匹配的 view 条件也会被丢弃

## 6. 样式定制

`FilterBar.Views` 新增了这些 theme slot：

- `viewsRoot`
- `viewsList`
- `viewsButton`
- `viewsButtonActive`
- `viewsOverflowTrigger`
- `viewsMenuContent`
- `viewsEmptyItem`
- `viewsItem`

新增可覆盖文案：

- `noSavedViews`
- `viewsTriggerFallback`
- `moreViews`
- `saveViewTriggerFallback`
- `exitView`
- `saveViewNamePlaceholder`
- `saveViewSubmit`

默认主题下：

- 外显 view 会根据是否激活自动切换样式
- overflow trigger 默认显示为 `More`

## 7. 当前约束

当前实现没有提供：

- view 重命名
- view 排序
- view 删除入口
- 跨浏览器 / 跨账号同步

如果后面要做更复杂的“查询视图管理”，应该把它当成新一层能力设计，而不是继续往当前 `FilterBarValue[]` 上硬扩展。
