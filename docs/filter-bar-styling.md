# FilterBar Styling and Themes

`FilterBar` is always the same concrete React UI implementation.
Styling only changes whether you add the optional `filtro/default-theme` preset on top.

That means:

- Without a `theme`, you still get the full `FilterBar` structure and behavior
- To use the official preset, import `defaultFilterBarTheme` from `filtro/default-theme`
- To reuse the preset CSS tokens and styles, also import `filtro/default-theme.css`

The default stylesheet is precompiled static CSS.

## Base Usage

```tsx
import { FilterBar, filtro } from 'filtro'

const fields = [
  filtro.string('keyword').label('Keyword'),
  filtro.select('status').label('Status').options([
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ]),
]

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
  )
}
```

In this mode you can style the UI yourself through:

- `render={<... />}` on triggers and buttons
- `className`
- `theme.classNames`
- `theme.primitiveClassNames`

## Enable the Default Preset

```tsx
import 'filtro/default-theme.css'

import { FilterBar, filtro } from 'filtro'
import { Button, defaultFilterBarTheme } from 'filtro/default-theme'

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
  )
}
```

`defaultFilterBarTheme` does two things:

- Adds default class names to `FilterBar`'s own `data-theme-slot` elements
- Adds default class names to the internal Base UI primitive wrappers via their `data-slot` mappings

## Partial Overrides

Use `mergeFilterBarTheme()` to extend a base theme incrementally:

```tsx
import 'filtro/default-theme.css'

import { FilterBar, mergeFilterBarTheme } from 'filtro'
import { defaultFilterBarTheme } from 'filtro/default-theme'

const compactTheme = mergeFilterBarTheme(defaultFilterBarTheme, {
  classNames: {
    activeItemsRoot: 'flex flex-wrap gap-2',
    row: 'h-8',
    rowRemoveButton: 'h-full min-h-0 px-2 !border-l text-red-600',
    selectContent: 'rounded-md border shadow-lg',
  },
  primitiveClassNames: {
    selectTrigger: 'h-8 rounded-md',
    dropdownMenuItem: 'text-xs',
  },
})
```

## Theme Surfaces

`theme` has two styling surfaces:

- `classNames`: targets `FilterBar`'s `data-theme-slot` attributes
- `primitiveClassNames`: targets internal primitive wrappers by camelCase slot name

Examples:

- `classNames.rowValue` targets `data-theme-slot~="rowValue"`
- `primitiveClassNames.selectTrigger` targets the primitive that renders `data-slot="select-trigger"`

Theme values are merged slot by slot with `cn` and `twMerge`, so later theme inputs and explicit `className` props win on conflicts.

## `data-theme-slot`

Each themeable `FilterBar` DOM node exposes a `data-theme-slot` attribute.

Some nodes carry multiple slots, so the value is a space-separated token list:

```css
[data-theme-slot~="rowRemoveButton"] {
  color: red;
}

[data-theme-slot~="editorControl"] {
  min-height: 2rem;
}
```

## Theme Text and Icon Fields

`texts` currently includes:

- `emptyState`
- `searchFieldsPlaceholder`
- `searchOptionsPlaceholder`
- `loadingOptions`
- `failedToLoadOptions`
- `noOptions`
- `noMatchingFields`
- `noSavedViews`
- `moreViews`
- `saveViewTriggerFallback`
- `exitView`
- `saveViewNamePlaceholder`
- `saveViewSubmit`
- `booleanTrueFallback`
- `booleanFalseFallback`
- `removeLabelFallback`

Also exposed in the type but not currently consumed by the built-in UI:

- `viewsTriggerFallback`

`icons` currently includes:

- `remove`
- `fieldKinds`

`fieldKinds` is used when `FilterBar.Trigger` receives `iconMapping={true}`.

## `classNames` Slots

Current `classNames` slot keys:

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

Exposed in the theme type but not currently wired to a distinct built-in element:

- `viewsButtonActive`

## `primitiveClassNames` Slots

Current primitive slots:

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

These keys are camelCase in the theme API, but the rendered DOM still uses kebab-case `data-slot` values.

## When You Need `default-theme.css`

Import `filtro/default-theme.css` only if:

- You use `defaultFilterBarTheme`
- You want to reuse the preset's current visual tokens and utility classes

If you fully style the base `FilterBar` yourself, you do not need that CSS file.
