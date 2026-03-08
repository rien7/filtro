# filtro

`filtro` is a React filter bar library for building flat, reusable filtering UIs.

It is organized around three layers:

- `logical`: typed field kinds, operators, and AST types
- `filter-bar`: the current flat `FilterBar` component system
- `default-theme`: an optional visual preset and styled primitives

This repository is a component library, not a full application.

## Status

The current UI is a flat filter bar.

- One active condition per field
- No repeated conditions for the same field
- No nested AND/OR groups in the UI
- No visual AST editor

The logical layer exports AST types such as `FilterCondition`, `FilterGroup`, and `FilterRoot`, but the current `FilterBar` does not edit nested groups.

## Package Entrypoints

- `filtro`: logical types, builder API, `FilterBar`, headless theme contract
- `filtro/default-theme`: `defaultFilterBarTheme` and styled Base UI wrappers such as `Button`
- `filtro/nuqs`: optional URL query synchronization helpers
- `filtro/default-theme.css`: explicit default theme stylesheet entry

## Installation

```bash
pnpm add filtro react react-dom
```

Optional:

- `pnpm add nuqs` if you want URL synchronization

## Quick Start

### Headless

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

export function HeadlessExample() {
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
      <FilterBar.Items />
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
      <FilterBar.Items />
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
- Built-in row editors for all current field kinds
- Custom field value editors via `.render(...)`
- Field-level validation via `.validate(...)`
- Schema-style validation via `.zod(...)`
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
- `FilterBar.Root / Trigger / Items / Clear / SaveView / Views`
- current flat condition state model
- theme slot contract and helpers

This is the current product shape. It is not the future nested builder described in planning docs.

### `default-theme`

Located in [`src/presets/default-theme`](https://github.com/rien7/filtro/tree/main/src/presets/default-theme).

This layer contains:

- `defaultFilterBarTheme`
- styled wrappers around `@base-ui/react`
- the source stylesheet that is precompiled to `filtro/default-theme.css` during build

It is optional. If you only want the headless behavior, you do not need this preset.

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
- `.operator()`
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

## Current State Model

`FilterBar` currently stores flat values as `FilterBarValue[]`.

Important constraints:

- Each field appears at most once
- Duplicate conditions for the same field are not supported
- The UI does not emit `FilterRoot`
- Nested groups are not supported

The helper exports around this model include:

- `resolveFilterBarFields`
- `sanitizeFilterBarValue`
- `sanitizeFilterBarValues`
- `serializeFilterBarValue`
- `deserializeFilterBarValue`

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

If you do not want that dependency, use the headless API and provide your own styles.

## Repository Layout

- [`src/index.ts`](https://github.com/rien7/filtro/blob/main/src/index.ts): root package entry
- [`src/logical`](https://github.com/rien7/filtro/tree/main/src/logical): typed logical layer
- [`src/filter-bar`](https://github.com/rien7/filtro/tree/main/src/filter-bar): current flat FilterBar implementation
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
- `pnpm run dev:ui`
- `pnpm run build:ui`

The playground imports the source tree directly, so it is the fastest way to inspect behavior while changing the library.

## Additional Docs

- [`docs/filter-bar-styling.md`](https://github.com/rien7/filtro/blob/main/docs/filter-bar-styling.md)
- [`docs/filter-bar-views.md`](https://github.com/rien7/filtro/blob/main/docs/filter-bar-views.md)
- [`docs/filter-bar-options.md`](https://github.com/rien7/filtro/blob/main/docs/filter-bar-options.md)
- [`docs/filter-bar-validation.md`](https://github.com/rien7/filtro/blob/main/docs/filter-bar-validation.md)
- [`docs/filter-bar-render.md`](https://github.com/rien7/filtro/blob/main/docs/filter-bar-render.md)
- [`docs/filter-bar-nuqs.md`](https://github.com/rien7/filtro/blob/main/docs/filter-bar-nuqs.md)
