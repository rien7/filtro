# FilterBar Styling And Themes

`FilterBar` 现在默认以 headless 模式运行，默认视觉 preset 通过 `filtro/default-theme` 单独提供。

这意味着：

- 不传 `theme` 时，`FilterBar` 只保留交互、状态和结构，不附带内部视觉样式。
- 想使用官方默认样式，需要从 `filtro/default-theme` 引入 `defaultFilterBarTheme`。
- 想继续用默认配色 token，需要同时引入 `filtro/default-theme.css`。

当前这份 `default-theme.css` 是预编译后的静态 CSS，可以直接在消费端引入。

## 1. Headless 用法

```tsx
import { FilterBar, filtro } from "filtro";

const fields = [
  filtro.string("keyword").label("Keyword"),
  filtro.select("status").label("Status").options([
    { label: "Open", value: "open" },
    { label: "Closed", value: "closed" },
  ]),
];

export function HeadlessExample() {
  return (
    <FilterBar.Root fields={fields}>
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

这种模式下，默认 preset 内部的 primitive 会走 `unstyled` 分支，FilterBar 自己的 row / empty state / menu 也不会再附带默认 class。

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
      <FilterBar.Items />
    </FilterBar.Root>
  );
}
```

`defaultFilterBarTheme` 做了两件事：

- 打开默认 preset primitive 的默认样式。
- 给 FilterBar 自己的 slot 注入当前这套默认布局 class。

## 3. 只改一部分样式

使用 `mergeFilterBarTheme` 从默认主题增量覆盖即可。

```tsx
import "filtro/default-theme.css";
import { FilterBar, mergeFilterBarTheme } from "filtro";
import { defaultFilterBarTheme } from "filtro/default-theme";

const compactTheme = mergeFilterBarTheme(defaultFilterBarTheme, {
  classNames: {
    itemsRoot: "flex flex-wrap gap-2",
    row: "h-8",
    rowRemoveButton: "h-full min-h-0 px-2 !border-l text-red-600",
    selectContent: "rounded-md border shadow-lg",
  },
});

export function CompactExample() {
  return <FilterBar.Root fields={fields} theme={compactTheme}>...</FilterBar.Root>;
}
```

`theme` 是按层 merge 的：

- `unstyledPrimitives`
- `classNames`
- `texts`
- `icons`

每个可主题化的 DOM 节点还会带一个 `data-theme-slot` 属性，值和 `FilterBarThemeClassNameSlot` 完全对齐。

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

### `unstyledPrimitives`

- `true`: 内部 primitive 不附带默认视觉样式。
- `false`: 内部 primitive 使用默认 preset 的样式。

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

- `itemsRoot`
- `emptyState`
- `rowRoot`
- `row`
- `rowField`
- `rowFieldText`
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

## 5. 什么时候需要 `default-theme.css`

只有在你使用默认主题 preset，或者想复用库里现在这套 `background / border / accent / destructive` token 时，才需要引入 `filtro/default-theme.css`。

如果你完全按 headless 模式使用，并且自己提供所有样式，可以不引入这个 CSS 文件。

## 6. 设计建议

- 想保留现有视觉风格时，用 `defaultFilterBarTheme` 作为 base，再增量覆盖。
- 想接入自己的 design system 时，优先保持 `unstyledPrimitives: true`，然后从 `classNames` 开始接管。
- 如果后面需要更深层的结构替换，再继续往 `components`/render slot 方向扩展，不要把更多视觉 class 重新写回 `FilterBar` 组件内部。
