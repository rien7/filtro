# filtro

`filtro` is a React filter bar library for building flat, reusable filtering UIs.

## Status

This repository is a work in progress.

The current package is usable, but the public surface is still settling and the scope is intentionally narrow.
The implemented UI is a flat `FilterBar`, not a nested filter builder.

Current constraints:

- One active condition per field
- No repeated conditions for the same field
- No nested `AND` / `OR` groups in the UI
- No visual AST editor

The logical layer exports AST types such as `FilterCondition`, `FilterGroup`, and `FilterRoot`, but the current `FilterBar` does not edit nested groups.
Use `valuesToFilterRoot()` and `filterRootToValues()` when you need to bridge the flat UI state with the flat `AND` subset of the AST.

## Package Entrypoints

- `filtro`: logical types, the field builder API, `FilterBar`, and theme helpers
- `filtro/default-theme`: the optional default preset and preset-owned styled wrappers such as `Button`
- `filtro/default-theme.css`: the precompiled stylesheet for the default preset
- `filtro/nuqs`: optional URL synchronization helpers

## Installation

```bash
pnpm add filtro react react-dom
```

Optional:

- `pnpm add nuqs` if you want URL synchronization

## Quick Start

### Base `FilterBar`

```tsx
import { FilterBar, filtro } from 'filtro'

const fields = [
  filtro.group('Basic', [
    filtro.string('keyword').label('Keyword'),
    filtro.number('amount').label('Amount'),
  ]),
  filtro.group('Status', [
    filtro.select('status').label('Status').options([
      { label: 'Open', value: 'open' },
      { label: 'Closed', value: 'closed' },
    ]),
  ]),
]

export function Example() {
  return (
    <FilterBar.Root fields={fields}>
      <div className="toolbar">
        <FilterBar.Trigger render={<button type="button" />}>
          Add Filter
        </FilterBar.Trigger>
        <FilterBar.Clear render={<button type="button" />}>
          Clear
        </FilterBar.Clear>
      </div>
      <FilterBar.ActiveItems />
    </FilterBar.Root>
  )
}
```

### Optional Default Preset

```tsx
import 'filtro/default-theme.css'

import { FilterBar, filtro } from 'filtro'
import { Button, defaultFilterBarTheme } from 'filtro/default-theme'

const fields = [
  filtro.group('Basic', [
    filtro.string('keyword').label('Keyword'),
    filtro.date('createdAt').label('Created At'),
  ]),
  filtro.group('Attributes', [
    filtro.select('status').label('Status').options([
      { label: 'Open', value: 'open' },
      { label: 'Closed', value: 'closed' },
      { label: 'Pending', value: 'pending' },
    ]),
    filtro.boolean('archived').label('Archived').options([
      { label: 'Archived', value: true },
      { label: 'Not Archived', value: false },
    ]),
  ]),
]

export function StyledExample() {
  return (
    <FilterBar.Root
      fields={fields}
      theme={defaultFilterBarTheme}
      viewsStorageKey="demo:filters"
    >
      <div className="flex flex-wrap gap-2">
        <FilterBar.Views render={<Button variant="outline" />}>
          Views
        </FilterBar.Views>
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
      <FilterBar.Content>
        <FilterBar.PinnedItems />
        <FilterBar.ActiveItems />
        <FilterBar.SuggestedItems />
      </FilterBar.Content>
    </FilterBar.Root>
  )
}
```

## Main Features

- Typed field kinds: `string`, `number`, `date`, `select`, `multiSelect`, `boolean`
- Typed operator-to-value mapping per field kind
- Builder API with strong TypeScript inference
- Grouped field definitions for trigger menus
- Flat active state as `FilterBarValue[]`
- Flat value <-> AST conversion helpers
- Controlled and uncontrolled `FilterBar.Root`
- Optional `useFilterBarController()` for draft/applied coordination
- Pinned fields and suggested fields
- Built-in editors for all current field kinds
- Custom value editors with `.render(...)`
- Field validation with `.validate(...)`
- Safe-parse-compatible schema validation with `.zod(...)`
- Static options, async option loaders, and `.useOptions(...)`
- Searchable select and multi-select menus
- Multi-select value label rendering and max-selection limits
- Saved views backed by `localStorage`
- Optional URL sync with `nuqs`

## Keyboard and Accessibility

The current `FilterBar` supports the basic keyboard and screen-reader paths needed for day-to-day use:

- Search inputs inside trigger menus and option pickers keep text entry behavior while still allowing `ArrowUp`, `ArrowDown`, `Enter`, `Escape`, `Tab`, `PageUp`, and `PageDown` to reach the surrounding menu/select primitive.
- Suggested filters are keyboard reachable and can be activated with `Enter` or `Space`.
- Active, pinned, and suggested regions expose list semantics, and each rendered row exposes an accessible filter name.
- Built-in value editors expose explicit labels for text, number, date, select, and multi-select controls instead of relying on placeholders alone.
- Validation errors are announced as alerts, and the empty state is exposed as a status message.

## Builder API

Use the `filtro` singleton to declare fields:

```tsx
const fields = [
  filtro.string('keyword').label('Keyword'),
  filtro.number('amount').label('Amount'),
  filtro.date('createdAt').label('Created At'),
  filtro.select('status').label('Status').options([
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ]),
  filtro.group('Metadata', [
    filtro.multiSelect('tags').label('Tags').options([
      { label: 'VIP', value: 'vip' },
      { label: 'Trial', value: 'trial' },
    ]),
  ]),
]
```

Common builder methods:

- `.label()`
- `.icon()`
- `.description()`
- `.placeholder()`
- `.pin()`
- `.suggest()`
- `.operator()`
- `.fixedOperator()`
- `.render()`
- `.validate()`
- `.zod()`

Select and multi-select methods:

- `.options()`
- `.useOptions()`
- `.loadOptions()`
- `.searchable()`

Multi-select extras:

- `.renderValueLabel()`
- `.maxSelections()`

Boolean fields require explicit options:

```tsx
filtro.boolean('archived').options([
  { label: 'Archived', value: true },
  { label: 'Not Archived', value: false },
])
```

Operator behavior:

- No `.operator(...)`: keep all operators for that field kind
- `.operator("eq")`: restrict to one operator, but still render operator text
- `.operator(["eq", "contains"] as const, { default: "contains" })`: keep a subset and set the initial operator
- `.operator({ default: "contains" })`: keep all operators and set the initial operator
- `.fixedOperator("eq")`: lock the operator and hide the operator segment

## Display Modes

Fields can appear in three UI modes:

- `default`: shown from `FilterBar.Trigger`
- `pinned`: always rendered by `FilterBar.PinnedItems`
- `suggested`: rendered by `FilterBar.SuggestedItems` until activated or dismissed

Example:

```tsx
const fields = [
  filtro.select('status')
    .label('Status')
    .pin()
    .options([
      { label: 'Open', value: 'open' },
      { label: 'Closed', value: 'closed' },
    ]),
  filtro.string('keyword')
    .label('Keyword')
    .suggest({
      seed: {
        operator: 'contains',
        value: '',
      },
    }),
]
```

`FilterBarValue[]` still stores only meaningful active conditions:

- `string`: `""` is removed
- `multiSelect`: `[]` is removed
- Other field kinds: `null` is removed
- Empty operators such as `isEmpty` and `isNotEmpty` stay active

## Controlled Usage and `useFilterBarController`

`FilterBar.Root` edits flat active values as `FilterBarValue[]`.

Controlled usage:

```tsx
const [value, setValue] = useState([])

<FilterBar.Root fields={fields} value={value} onChange={setValue}>
  <FilterBar.Trigger render={<button type="button" />}>
    Add Filter
  </FilterBar.Trigger>
  <FilterBar.Clear render={<button type="button" />}>
    Clear
  </FilterBar.Clear>
  <FilterBar.ActiveItems />
</FilterBar.Root>
```

`onChange` is called as:

```ts
onChange?: (
  nextValue: FilterBarValueType,
  meta?: FilterBarChangeMeta,
) => void;
```

Important: controlled mode only controls meaningful active values.
Incomplete row drafts still live inside `FilterBar` until they become valid active values or are removed.

If you need separate draft and applied filters, use `useFilterBarController()`:

```tsx
const filters = useFilterBarController({
  defaultValue: [],
  applyMode: "manual",
});

<FilterBar.Root
  fields={fields}
  value={filters.draftValue}
  onChange={filters.onDraftChange}
>
  <FilterBar.Trigger render={<button type="button" />}>
    Add Filter
  </FilterBar.Trigger>
  <FilterBar.Clear render={<button type="button" />}>
    Clear
  </FilterBar.Clear>
  <FilterBar.ActiveItems />
</FilterBar.Root>

<button type="button" onClick={filters.apply} disabled={!filters.isDirty}>
  Apply
</button>
```

## Flat Value / AST Conversion

The current `FilterBar` state is still `FilterBarValue[]`, but the package also exports logical AST types.
Use these helpers when you want to compile a flat `FilterBar` value into a `FilterRoot`, or hydrate a flat `FilterBar` from an AST value you already store elsewhere:

```tsx
import type { FilterBarValueType, FilterRoot } from 'filtro'
import {
  FilterBar,
  filterRootToValues,
  filtro,
  valuesToFilterRoot
} from 'filtro'

type FieldId = 'keyword' | 'status'

const fields = [
  filtro.string('keyword').label('Keyword'),
  filtro.select('status').label('Status').options([
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ]),
]

export function Example() {
  const [value, setValue] = useState<FilterBarValueType<FieldId>>([])

  const filter = valuesToFilterRoot(value)

  function restore(saved: FilterRoot<FieldId>) {
    const restored = filterRootToValues(fields, saved)

    if (!restored) {
      return
    }

    setValue(restored)
  }

  return (
    <FilterBar.Root fields={fields} value={value} onChange={setValue}>
      <FilterBar.Trigger render={<button type="button" />}>
        Add Filter
      </FilterBar.Trigger>
      <FilterBar.ActiveItems />
    </FilterBar.Root>
  )
}
```

`valuesToFilterRoot()` always returns a flat root group with relation `and`.

`filterRootToValues()` returns `null` when the AST cannot be represented by the current flat `FilterBar` model.
That includes cases such as:

- Nested groups
- Duplicate conditions for the same field
- Conditions that reference unknown fields
- Conditions whose kind, operator, or value do not match the current field definition

Empty operators such as `isEmpty` and `isNotEmpty` are encoded in the AST with `value: null`.

## Styling

The root package does not ship a visual preset by default.

To use the official preset:

```tsx
import 'filtro/default-theme.css'

import { defaultFilterBarTheme } from 'filtro/default-theme'
```

The stylesheet is precompiled, so consuming apps do not need a Tailwind build step to use it.

Theme customization has two surfaces:

- `classNames`: targets `FilterBar`'s own `data-theme-slot` attributes
- `primitiveClassNames`: targets the internal Base UI wrappers by camelCase slot name

Theme helpers exported from `filtro`:

- `headlessFilterBarTheme`
- `mergeFilterBarTheme`
- `FilterBar.ThemeProvider`
- `useFilterBarTheme`

## Architecture

### `logical`

Located in [src/logical](https://github.com/rien7/filtro/tree/main/src/logical).

This layer defines field kinds, operator/value typing, and AST types.
It is framework-agnostic and does not depend on React.

### `filter-bar`

Located in [src/filter-bar](https://github.com/rien7/filtro/tree/main/src/filter-bar).

This layer contains the current flat `FilterBar` implementation, the builder API, theme contracts, and the current `FilterBarValue[]` state model.

### `filter-bar/internal/primitives/baseui`

Located in [src/filter-bar/internal/primitives/baseui](https://github.com/rien7/filtro/tree/main/src/filter-bar/internal/primitives/baseui).

These are thin internal wrappers around Base UI primitives used by the current `FilterBar` implementation.

### `default-theme`

Located in [src/presets/default-theme](https://github.com/rien7/filtro/tree/main/src/presets/default-theme).

This layer owns the optional default visual opinion, preset class mappings, and the precompiled `filtro/default-theme.css` stylesheet.

### `nuqs`

Located in [src/nuqs](https://github.com/rien7/filtro/tree/main/src/nuqs).

This layer provides optional helpers for syncing `FilterBarValue[]` to the URL query string.

## Boundary Rules

- `src/logical` stays pure domain logic.
  Do not put React there.
- `src/filter-bar` is the current flat `FilterBar` product.
- `src/filter-bar/internal/primitives/baseui` is implementation detail, not the preset layer.
- `src/presets/default-theme` is optional visual infrastructure, not the owner of runtime behavior.
- If the requirement becomes nested groups, repeated conditions, AST editing, or a more generic builder core, treat that as a new phase instead of stretching the current `FilterBarValue[]` model.

## Local Development

Install dependencies:

```bash
pnpm install
```

Useful commands:

- `pnpm run typecheck`
- `pnpm test`
- `pnpm run build`
- `pnpm run build:css`
- `pnpm run dev:ui`
- `pnpm run build:ui`
- `pnpm run preview:ui`

The playground imports the source tree directly, so it is the fastest way to inspect behavior while changing the library.

## Additional Docs

- [docs/filter-bar-controller.md](https://github.com/rien7/filtro/blob/main/docs/filter-bar-controller.md)
- [docs/filter-bar-display.md](https://github.com/rien7/filtro/blob/main/docs/filter-bar-display.md)
- [docs/filter-bar-nuqs.md](https://github.com/rien7/filtro/blob/main/docs/filter-bar-nuqs.md)
- [docs/filter-bar-options.md](https://github.com/rien7/filtro/blob/main/docs/filter-bar-options.md)
- [docs/filter-bar-render.md](https://github.com/rien7/filtro/blob/main/docs/filter-bar-render.md)
- [docs/filter-bar-styling.md](https://github.com/rien7/filtro/blob/main/docs/filter-bar-styling.md)
- [docs/filter-bar-validation.md](https://github.com/rien7/filtro/blob/main/docs/filter-bar-validation.md)
- [docs/filter-bar-views.md](https://github.com/rien7/filtro/blob/main/docs/filter-bar-views.md)
