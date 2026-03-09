# FilterBar Styling And Themes

`FilterBar` 始终是当前这套具体的 React UI 实现。区别只在于你是否叠加 `filtro/default-theme` 这个可选视觉 preset。

这意味着：

- 不传 `theme` 时，你拿到的是 base FilterBar: 交互、状态、结构和内部 Base UI wrapper 都在，但没有 preset 视觉层。
- 想使用官方默认样式，需要从 `filtro/default-theme` 引入 `defaultFilterBarTheme`。
- 想继续复用这套默认 token 和预编译 CSS，需要同时引入 `filtro/default-theme.css`。

当前这份 `default-theme.css` 是预编译后的静态 CSS，可以直接在消费端引入。

这次 display 相关扩展遵循同一条规则：

- 组件层只输出结构、状态和 `data-theme-slot` / `data-area`
- `pinned` / `suggestion` 的视觉差异放在 preset 的 classNames 和 CSS 选择器里
- 不把视觉判断重新写回 `FilterBar` 组件逻辑

## 1. Base FilterBar 用法

```tsx
import { FilterBar, filtro } from "filtro";

const fields = [
  filtro.string("keyword").label("Keyword"),
  filtro.select("status").label("Status").options([
    { label: "Open", value: "open" },
    { label: "Closed", value: "closed" },
  ]),
];

export function BaseExample() {
  return (
    <FilterBar.Root fields={fields}>
      <FilterBar.Trigger render={<button type="button" />}>
        Add Filter
      </FilterBar.Trigger>
      <FilterBar.Clear render={<button type="button" />}>
        Clear
      </FilterBar.Clear>
      <FilterBar.ActiveItems />
    </FilterBar.Root>
  );
}
```

这种模式下不需要 `filtro/default-theme`。你可以直接给 render props、`className` 和自定义 theme slot 提供自己的样式。

## 2. 启用默认主题

```tsx
import "filtro/default-theme.css";
import { FilterBar, filtro } from "filtro";
import { Button, defaultFilterBarTheme } from "filtro/default-theme";

export function DefaultThemeExample() {
  return (
    <FilterBar.Root fields={fields} theme={defaultFilterBarTheme}>
      <FilterBar.Trigger iconMapping render={<Button variant="outline" />}>
        Add Filter
      </FilterBar.Trigger>
      <FilterBar.Clear render={<Button variant="outline" />}>
        Clear
      </FilterBar.Clear>
      <FilterBar.ActiveItems />
    </FilterBar.Root>
  );
}
```

`defaultFilterBarTheme` 做了两件事：

- 给 `FilterBar` 自己的 `data-theme-slot` 注入默认布局 class。
- 给内部 Base UI wrapper 的 `data-slot` 注入默认 primitive class。

## 3. 只改一部分样式

使用 `mergeFilterBarTheme` 从默认主题增量覆盖即可。

```tsx
import "filtro/default-theme.css";
import { FilterBar, mergeFilterBarTheme } from "filtro";
import { defaultFilterBarTheme } from "filtro/default-theme";

const compactTheme = mergeFilterBarTheme(defaultFilterBarTheme, {
  classNames: {
    activeItemsRoot: "flex flex-wrap gap-2",
    row: "h-8",
    rowRemoveButton: "h-full min-h-0 px-2 !border-l text-red-600",
    selectContent: "rounded-md border shadow-lg",
  },
  primitiveClassNames: {
    selectTrigger: "h-8 rounded-md",
    dropdownMenuItem: "text-xs",
  },
});

export function CompactExample() {
  return <FilterBar.Root fields={fields} theme={compactTheme}>...</FilterBar.Root>;
}
```

`theme` 有两层样式面：

- `classNames`
  - 对应 `FilterBar` 自己输出的 `data-theme-slot`
- `primitiveClassNames`
  - 对应内部 Base UI wrapper 的 camelCase slot key
  - 最终会映射到 DOM 上的 kebab-case `data-slot`

例如：

- `classNames.rowValue` 会命中 `data-theme-slot~="rowValue"`
- `primitiveClassNames.selectTrigger` 会命中 `data-slot="select-trigger"`

这两层都会按 slot 用 `cn` / `twMerge` 合并，所以：

- 后传入的 theme 会覆盖前面的冲突 class
- 组件实例上的显式 `className` 仍然可以覆盖 theme

每个可主题化的 FilterBar DOM 节点还会带一个 `data-theme-slot` 属性，值和 `FilterBarThemeClassNameSlot` 完全对齐。

当一个节点同时承载多个 slot 时，这个属性会是空格分隔的 token 列表，例如：

```css
[data-theme-slot~="rowRemoveButton"] {
  color: red;
}

[data-theme-slot~="editorControl"] {
  min-height: 2rem;
}
```

## 4. 可覆盖的主题字段

### `texts`

可替换这些文案：

- `emptyState`
- `searchFieldsPlaceholder`
- `searchOptionsPlaceholder`
- `loadingOptions`
- `failedToLoadOptions`
- `noOptions`
- `noMatchingFields`
- `noSavedViews`
- `viewsTriggerFallback`
- `moreViews`
- `saveViewTriggerFallback`
- `exitView`
- `saveViewNamePlaceholder`
- `saveViewSubmit`
- `booleanTrueFallback`
- `booleanFalseFallback`
- `removeLabelFallback`

### `icons`

- `remove`
- `fieldKinds`

`fieldKinds` 会在 `FilterBar.Trigger` 传入 `iconMapping={true}` 时作为默认字段图标映射。

### `classNames`

目前支持这些 slot：

- `contentRoot`
- `pinnedItemsRoot`
- `suggestedItemsRoot`
- `suggestionButton`
- `suggestionAdd`
- `activeItemsRoot`
- `emptyState`
- `rowRoot`
- `row`
- `rowField`
- `rowFieldText`
- `rowOperator`
- `rowOperatorTrigger`
- `rowOperatorText`
- `rowValue`
- `rowError`
- `rowRemoveButton`
- `triggerMenuContent`
- `triggerMenuSeparator`
- `triggerGroupLabel`
- `triggerFieldItem`
- `triggerSubmenuTrigger`
- `triggerSubmenuContent`
- `triggerEmptyItem`
- `viewsRoot`
- `viewsList`
- `viewsButton`
- `viewsButtonActive`
- `viewsOverflowTrigger`
- `viewsMenuContent`
- `viewsEmptyItem`
- `viewsItem`
- `saveViewContent`
- `saveViewForm`
- `saveViewInput`
- `saveViewSubmit`
- `selectTrigger`
- `selectContent`
- `selectItem`
- `selectSearchInput`
- `selectSeparator`
- `editorRoot`
- `editorFieldset`
- `editorControl`
- `editorSplit`
- `booleanTrueButton`
- `booleanFalseButton`

其中新增的 display 相关 slot 分别对应：

- `contentRoot`
  - `FilterBar.Content` 的外层容器
- `pinnedItemsRoot`
  - `FilterBar.PinnedItems` 的外层容器
- `suggestedItemsRoot`
  - `FilterBar.SuggestedItems` 的外层容器
- `activeItemsRoot`
  - `FilterBar.ActiveItems` 的外层容器

### `primitiveClassNames`

目前支持这些 camelCase slot：

- `button`
- `input`
- `segmentedControl`
- `segmentedControlIndicator`
- `segmentedControlItem`
- `segmentedControlItemText`
- `selectPositioner`
- `selectTrigger`
- `selectTriggerText`
- `selectIcon`
- `selectContent`
- `selectItem`
- `selectItemIndicator`
- `selectSearchInput`
- `selectSeparator`
- `dropdownMenuPositioner`
- `dropdownMenuContent`
- `dropdownMenuLabel`
- `dropdownMenuItem`
- `dropdownMenuSubTrigger`
- `dropdownMenuSubmenuIndicator`
- `dropdownMenuSubContent`
- `dropdownMenuCheckboxItem`
- `dropdownMenuCheckboxItemIndicator`
- `dropdownMenuRadioItem`
- `dropdownMenuRadioItemIndicator`
- `dropdownMenuSeparator`
- `separator`
- `switch`
- `switchThumb`
- `buttonGroup`
- `buttonGroupText`
- `buttonGroupSeparator`

这些 key 只在 theme API 中使用 camelCase。真正渲染到 DOM 上的仍然是 Base UI 风格的 kebab-case `data-slot`。

## 5. 什么时候需要 `default-theme.css`

只有在你使用默认主题 preset，或者想复用库里现在这套 `background / border / accent / destructive` token 时，才需要引入 `filtro/default-theme.css`。

如果你只使用 base FilterBar，并且自己提供所有样式，可以不引入这个 CSS 文件。

## 6. 设计建议

- 想保留现有视觉风格时，用 `defaultFilterBarTheme` 作为 base，再增量覆盖。
- 想接入自己的 design system 时，先决定是否需要 `default-theme.css`，然后分别从 `classNames` 和 `primitiveClassNames` 接管。
- preset 里的 `Button` / `Input` 这类 convenience wrapper 属于 `filtro/default-theme`，不要把它们和内部 `filter-bar/internal/primitives/baseui` wrapper 混为一层。
- 如果后面需要更深层的结构替换，再继续往 render props / 自定义 editor 方向扩展，不要把更多视觉 class 重新写回 `FilterBar` 组件内部。
