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

- `filtro`: logical types, builder API, `FilterBar`, and the unstyled theme contract
- `filtro/default-theme`: `defaultFilterBarTheme` and styled Base UI wrappers such as `Button`
- `filtro/nuqs`: optional URL query synchronization helpers
- `filtro/default-theme.css`: precompiled default theme stylesheet

## Installation

```bash
pnpm add filtro react react-dom
```

Optional:

- `pnpm add nuqs` if you want URL synchronization

## Quick Start

### Unstyled

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

export function UnstyledExample() {
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

Located in [`src/logical`](/Users/rien7/Developer/filtro/src/logical).

This layer defines:

- field kinds
- operator definitions
- operator value typing
- AST types

It is framework-agnostic and does not depend on React.

### `filter-bar`

Located in [`src/filter-bar`](/Users/rien7/Developer/filtro/src/filter-bar).

This layer contains:

- builder API
- UI field types
- `FilterBar.Root / Trigger / Items / Clear / SaveView / Views`
- current flat condition state model
- theme slot contract and helpers
- internal Base UI-backed primitives used by the implementation

`FilterBar` is unstyled by default, but it is still a concrete React UI implementation. It is not a pure primitive-agnostic core, and it is not the future nested builder described in planning docs.

### `filter-bar/internal/primitives/baseui`

Located in [`src/filter-bar/internal/primitives/baseui`](/Users/rien7/Developer/filtro/src/filter-bar/internal/primitives/baseui).

This layer contains the internal wrappers that the current `FilterBar` implementation needs:

- `Button`
- `Input`
- `Select`
- `DropdownMenu`
- `ButtonGroup`

These are implementation details of the current `FilterBar`. They are not the same thing as the default theme preset.

### `default-theme`

Located in [`src/presets/default-theme`](/Users/rien7/Developer/filtro/src/presets/default-theme).

This layer contains:

- `defaultFilterBarTheme`
- the precompiled `filtro/default-theme.css` stylesheet
- convenience re-exports of the styled wrappers used by the default preset

It is optional. If you only want the unstyled behavior, you do not need this preset.

### `nuqs`

Located in [`src/nuqs`](/Users/rien7/Developer/filtro/src/nuqs).

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

If you do not want that dependency, use the unstyled API and provide your own styles.

## Boundary Rules

- `src/logical` stays pure domain and type logic. Do not put React there.
- `src/filter-bar` is the current product implementation for a flat filter bar.
- `src/filter-bar/internal/primitives/baseui` belongs to the implementation layer, not the preset layer.
- `src/presets/default-theme` is optional visual infrastructure, not the owner of `FilterBar` runtime behavior.
- If the requirement becomes nested groups, repeated conditions, AST editing, or a more generic filter builder, treat that as a new phase instead of stretching the current `FilterBarValue[]` model.

## Repository Layout

- [`src/index.ts`](/Users/rien7/Developer/filtro/src/index.ts): root package entry
- [`src/logical`](/Users/rien7/Developer/filtro/src/logical): typed logical layer
- [`src/filter-bar`](/Users/rien7/Developer/filtro/src/filter-bar): current flat FilterBar implementation
- [`src/filter-bar/internal/primitives/baseui`](/Users/rien7/Developer/filtro/src/filter-bar/internal/primitives/baseui): internal Base UI wrappers used by FilterBar
- [`src/presets/default-theme`](/Users/rien7/Developer/filtro/src/presets/default-theme): optional default preset
- [`src/nuqs/index.ts`](/Users/rien7/Developer/filtro/src/nuqs/index.ts): URL sync helpers
- [`playground`](/Users/rien7/Developer/filtro/playground): local demo app

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

- [`docs/filter-bar-styling.md`](/Users/rien7/Developer/filtro/docs/filter-bar-styling.md)
- [`docs/filter-bar-views.md`](/Users/rien7/Developer/filtro/docs/filter-bar-views.md)
- [`docs/filter-bar-options.md`](/Users/rien7/Developer/filtro/docs/filter-bar-options.md)
- [`docs/filter-bar-validation.md`](/Users/rien7/Developer/filtro/docs/filter-bar-validation.md)
- [`docs/filter-bar-render.md`](/Users/rien7/Developer/filtro/docs/filter-bar-render.md)
- [`docs/filter-bar-nuqs.md`](/Users/rien7/Developer/filtro/docs/filter-bar-nuqs.md)
