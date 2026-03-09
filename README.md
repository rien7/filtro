# filtro

`filtro` is a React filter bar library for building flat, reusable filtering UIs.

This repository is a component library, not a full application.

Today it is organized around five runtime layers:

- `logical`: pure typed field kinds, operators, and AST types
- `filter-bar`: the current flat `FilterBar` component system
- `filter-bar/internal/primitives/baseui`: internal Base UI wrappers used by the current `FilterBar` implementation
- `default-theme`: the optional default visual preset and precompiled stylesheet
- `nuqs`: optional URL synchronization helpers

## Status

The current UI is a flat filter bar.

- One active condition per field
- No repeated conditions for the same field
- No nested AND/OR groups in the UI
- No visual AST editor

The logical layer exports AST types such as `FilterCondition`, `FilterGroup`, and `FilterRoot`, but the current `FilterBar` does not edit nested groups.

## Package Entrypoints

- `filtro`: logical types, builder API, `FilterBar`, and the theme slot contract
- `filtro/default-theme`: `defaultFilterBarTheme` and preset-owned styled wrappers such as `Button`
- `filtro/nuqs`: optional URL query synchronization helpers
- `filtro/default-theme.css`: precompiled default theme stylesheet

## Installation

```bash
pnpm add filtro react react-dom
```

Optional:

- `pnpm add nuqs` if you want URL synchronization

## Quick Start

### Base FilterBar

```tsx
import { FilterBar, filtro } from "filtro";

const fields = [
  filtro.group("Basic", [
    filtro.string("keyword").label("Keyword"),
    filtro.number("amount").label("Amount"),
  ]),
  filtro.group("Status", [
    filtro.select("status").label("Status").options([
      { label: "Open", value: "open" },
      { label: "Closed", value: "closed" },
    ]),
  ]),
];

export function BaseExample() {
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
  );
}
```

### Default Theme Preset

```tsx
import "filtro/default-theme.css";
import { FilterBar, filtro } from "filtro";
import { Button, defaultFilterBarTheme } from "filtro/default-theme";

const fields = [
  filtro.group("Basic", [
    filtro.string("keyword").label("Keyword"),
    filtro.date("createdAt").label("Created At"),
  ]),
  filtro.group("Attributes", [
    filtro.select("status").label("Status").options([
      { label: "Open", value: "open" },
      { label: "Closed", value: "closed" },
      { label: "Pending", value: "pending" },
    ]),
    filtro.boolean("archived").label("Archived").options([
      { label: "Archived", value: true },
      { label: "Not Archived", value: false },
    ]),
  ]),
];

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
      <FilterBar.ActiveItems />
    </FilterBar.Root>
  );
}
```

## Main Features

- Typed field kinds: `string`, `number`, `date`, `select`, `multiSelect`, `boolean`
- Typed operator-to-value mapping per field kind
- Builder API with strong TypeScript inference
- Grouped field definitions for trigger menus
- Uncontrolled and controlled `FilterBar.Root`
- Optional `useFilterBarController()` for draft/applied workflows
- Built-in row editors for all current field kinds
- Custom field value editors via `.render(...)`
- Field-level validation via `.validate(...)`
- Schema-style validation via `.zod(...)`
- Field display metadata with `.pin()` and `.suggest()`
- Optional `FilterBar.Content` regions for pinned, active, and suggested items
- Static select options
- Async option loading with request cancellation and caching
- Custom option sources via `.useOptions(...)`
- Searchable select and multi-select menus
- Multi-select value labels and max selection limits
- Saved views backed by `localStorage`
- Optional URL query sync with `nuqs`

## Architecture

### `logical`

Located in [`src/logical`](https://github.com/rien7/filtro/tree/main/src/logical).

This layer defines:

- field kinds
- operator definitions
- operator value typing
- AST types

It is framework-agnostic and does not depend on React.

### `filter-bar`

Located in [`src/filter-bar`](https://github.com/rien7/filtro/tree/main/src/filter-bar).

This layer contains:

- builder API
- UI field types
- `FilterBar.Root / Trigger / Content / ActiveItems / PinnedItems / SuggestedItems / Clear / SaveView / Views`
- current flat condition state model
- theme slot contract and helpers
- primitive slot contract for the Base UI wrappers used by `FilterBar`
- internal Base UI-backed primitives used by the implementation

`FilterBar` ships with internal Base UI wrappers and slot hooks by default. The optional default preset adds both slot-level and primitive-level styling on top, but it is still a concrete React UI implementation. It is not a pure primitive-agnostic core, and it is not the future nested builder described in planning docs.

### `filter-bar/internal/primitives/baseui`

Located in [`src/filter-bar/internal/primitives/baseui`](https://github.com/rien7/filtro/tree/main/src/filter-bar/internal/primitives/baseui).

This layer contains the internal wrappers that the current `FilterBar` implementation needs:

- `Button`
- `SegmentedControl`
- `Input`
- `Select`
- `DropdownMenu`
- `ButtonGroup`

These wrappers stay thin and mainly expose structure plus Base UI `data-slot`s. They are implementation details of the current `FilterBar`, not the same thing as the default theme preset.

### `default-theme`

Located in [`src/presets/default-theme`](https://github.com/rien7/filtro/tree/main/src/presets/default-theme).

This layer contains:

- `defaultFilterBarTheme`
- preset primitive class mappings keyed by camelCase slot names for Base UI `data-slot`s
- the precompiled `filtro/default-theme.css` stylesheet
- convenience re-exports of the styled wrappers used by the default preset

This is where preset-level sugar such as `Button` variants and sizes lives. The internal `filter-bar/internal/primitives/baseui` wrappers stay thin, while `filtro/default-theme` owns the default visual opinion.

It is optional. If you only want the base FilterBar implementation without the preset layer, you do not need this preset.

### `nuqs`

Located in [`src/nuqs`](https://github.com/rien7/filtro/tree/main/src/nuqs).

This layer contains optional helpers for syncing `FilterBarValue[]` with the URL query string.

## Builder API

Use the `filtro` singleton to declare fields:

```tsx
const fields = [
  filtro.string("keyword").label("Keyword"),
  filtro.number("amount").label("Amount"),
  filtro.date("createdAt").label("Created At"),
  filtro.select("status").label("Status").options([
    { label: "Open", value: "open" },
    { label: "Closed", value: "closed" },
  ]),
  filtro.group("Metadata", [
    filtro.multiSelect("tags").label("Tags").options([
      { label: "VIP", value: "vip" },
      { label: "Trial", value: "trial" },
    ]),
  ]),
];
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

Select-specific methods:

- `.options()`
- `.useOptions()`
- `.loadOptions()`
- `.searchable()`

Multi-select extras:

- `.renderValueLabel()`
- `.maxSelections()`

Boolean extras:

- `.options()`

Operator behavior:

- no `.operator(...)`: keep all operators for that field kind
- `.operator("eq")`: restrict to one allowed operator but still render operator text
- `.operator(["eq", "contains"] as const, { default: "contains" })`: keep a subset and pick the initial operator
- `.operator({ default: "contains" })`: keep all operators and pick the initial operator
- `.fixedOperator("eq")`: lock the operator and hide the operator segment

## Field Display

Fields can stay in the trigger menu by default, render as a persistent pinned row, or render as a suggestion entry.

```tsx
const fields = [
  filtro.select("status")
    .label("Status")
    .pin()
    .options([
      { label: "Open", value: "open" },
      { label: "Closed", value: "closed" },
    ]),
  filtro.string("keyword")
    .label("Keyword")
    .suggest({
      seed: {
        operator: "contains",
        value: "",
      },
    }),
];

<FilterBar.Root fields={fields}>
  <div className="toolbar">
    <FilterBar.Trigger render={<button type="button" />}>
      Add Filter
    </FilterBar.Trigger>
    <FilterBar.Clear render={<button type="button" />}>
      Clear
    </FilterBar.Clear>
  </div>
  <FilterBar.Content>
    <FilterBar.PinnedItems />
    <FilterBar.ActiveItems />
    <FilterBar.SuggestedItems />
  </FilterBar.Content>
</FilterBar.Root>
```

Behavior:

- `default`: only shown through `FilterBar.Trigger`
- `pinned`: always rendered by `FilterBar.PinnedItems`, even when no active value exists
- `suggested`: rendered by `FilterBar.SuggestedItems` until it is clicked

If a field uses `.pin()`, render `FilterBar.PinnedItems`. If a suggestion uses `showInMenu: false`, render `FilterBar.SuggestedItems`, or that field may not be visible anywhere.

`FilterBarValue[]` still only stores active conditions. Empty values are automatically removed from active state:

- `string`: `""` is treated as absent
- `multiSelect`: `[]` is treated as absent
- other field kinds: `null` is treated as absent
- empty operators such as `isEmpty` remain valid active conditions

## Current State Model

`FilterBar` currently stores flat values as `FilterBarValue[]`.

Important constraints:

- Each field appears at most once
- Duplicate conditions for the same field are not supported
- The UI does not emit `FilterRoot`
- Nested groups are not supported

The helper exports around this model include:

- `resolveFilterBarFields`
- `sanitizeFilterBarDraftValue`
- `sanitizeFilterBarDraftValues`
- `sanitizeFilterBarValue`
- `sanitizeFilterBarValues`
- `serializeFilterBarValue`
- `deserializeFilterBarValue`

## Controlled And Controller

`FilterBar.Root` remains a controlled/uncontrolled editor.

Controlled usage:

```tsx
const [value, setValue] = useState<FilterBarValueType>([]);

<FilterBar.Root
  fields={fields}
  value={value}
  onChange={(nextValue) => setValue(nextValue)}
>
  <FilterBar.Trigger render={<button type="button" />}>
    Add Filter
  </FilterBar.Trigger>
  <FilterBar.Clear render={<button type="button" />}>
    Clear
  </FilterBar.Clear>
  <FilterBar.ActiveItems />
</FilterBar.Root>
```

If the page needs separate draft and applied filters, use `useFilterBarController()`:

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

`FilterBar.Root` now calls controlled `onChange` as:

```ts
onChange?: (
  nextValue: FilterBarValueType,
  meta?: FilterBarChangeMeta,
) => void;
```

The extra `meta` describes what changed. `useFilterBarController()` uses it to drive automatic apply behavior.

## Styling Notes

`defaultFilterBarTheme` is in `filtro/default-theme`, not in the root entry.

```tsx
import "filtro/default-theme.css";
import { FilterBar } from "filtro";
import { defaultFilterBarTheme } from "filtro/default-theme";
```

`filtro/default-theme.css` is a precompiled stylesheet. That means:

- It is optional
- It is only needed for the default visual preset
- It can be imported directly by the consuming app without a Tailwind build step

If you do not want that dependency, use `filtro` alone and provide your own slot and primitive styles.

`FilterBarTheme` now has two styling surfaces:

- `classNames` for `FilterBar`'s own `data-theme-slot`s
- `primitiveClassNames` for the internal Base UI wrappers' camelCase slot keys, which map to Base UI `data-slot`s

For example, `primitiveClassNames.selectTrigger` targets the internal primitive that renders `data-slot="select-trigger"`.

Theme overrides are merged slot by slot with `cn`/`twMerge`, so later theme entries and explicit `className` props win on conflicts.

## Boundary Rules

- `src/logical` stays pure domain and type logic. Do not put React there.
- `src/filter-bar` is the current product implementation for a flat filter bar.
- `src/filter-bar/internal/primitives/baseui` belongs to the implementation layer, not the preset layer.
- `src/presets/default-theme` is optional visual infrastructure, not the owner of `FilterBar` runtime behavior.
- If the requirement becomes nested groups, repeated conditions, AST editing, or a more generic filter builder, treat that as a new phase instead of stretching the current `FilterBarValue[]` model.

## Repository Layout

- [`src/index.ts`](https://github.com/rien7/filtro/blob/main/src/index.ts): root package entry
- [`src/logical`](https://github.com/rien7/filtro/tree/main/src/logical): typed logical layer
- [`src/filter-bar`](https://github.com/rien7/filtro/tree/main/src/filter-bar): current flat FilterBar implementation
- [`src/filter-bar/internal/primitives/baseui`](https://github.com/rien7/filtro/tree/main/src/filter-bar/internal/primitives/baseui): internal Base UI wrappers used by FilterBar
- [`src/presets/default-theme`](https://github.com/rien7/filtro/tree/main/src/presets/default-theme): optional default preset
- [`src/nuqs/index.ts`](https://github.com/rien7/filtro/blob/main/src/nuqs/index.ts): URL sync helpers
- [`playground`](https://github.com/rien7/filtro/tree/main/playground): local demo app

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

The playground imports the source tree directly, so it is the fastest way to inspect behavior while changing the library.

## Additional Docs

- [`docs/filter-bar-controller.md`](https://github.com/rien7/filtro/blob/main/docs/filter-bar-controller.md)
- [`docs/filter-bar-nuqs.md`](https://github.com/rien7/filtro/blob/main/docs/filter-bar-nuqs.md)
- [`docs/filter-bar-display.md`](https://github.com/rien7/filtro/blob/main/docs/filter-bar-display.md)
- [`docs/filter-bar-render.md`](https://github.com/rien7/filtro/blob/main/docs/filter-bar-render.md)
- [`docs/filter-bar-validation.md`](https://github.com/rien7/filtro/blob/main/docs/filter-bar-validation.md)
- [`docs/filter-bar-styling.md`](https://github.com/rien7/filtro/blob/main/docs/filter-bar-styling.md)
- [`docs/filter-bar-views.md`](https://github.com/rien7/filtro/blob/main/docs/filter-bar-views.md)
- [`docs/filter-bar-options.md`](https://github.com/rien7/filtro/blob/main/docs/filter-bar-options.md)
