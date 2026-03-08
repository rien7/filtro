# filtro

`filtro` is a React filter bar component library for building flat, reusable filtering UIs.

It combines:

- a typed logical layer for fields, operators, and filter AST types
- a builder API for declaring UI fields
- a `FilterBar` component system for adding, editing, and clearing conditions
- optional URL synchronization via `filtro/nuqs`
- an optional default theme on top of a headless core

This repository is a component library, not a full application.

## Status

The current implementation is a **flat filter bar**:

- one active condition per field
- no repeated conditions for the same field
- no nested AND/OR groups in the UI
- no visual AST editor

The logical layer exports AST types such as `FilterCondition`, `FilterGroup`, and `FilterRoot`, but the current `FilterBar` UI does **not** edit nested groups.

## Features

- Typed field kinds: `string`, `number`, `date`, `select`, `multiSelect`, `boolean`
- Typed operator/value mapping per field kind
- Builder API with strong TypeScript inference
- Grouped field definitions for trigger menus
- Flat condition state managed by `FilterBar.Root`
- Uncontrolled and controlled `FilterBar` usage
- Built-in row editors for string, number, date, select, multi-select, and boolean values
- Custom per-field value editor rendering via `.render(...)`
- Field-level validation via `.validate(...)`
- Schema-based validation via `.zod(...)` with any `safeParse()`-compatible schema
- Static select options
- Async option loading with request cancellation and caching
- Custom option sources via `.useOptions(...)`
- Searchable select and multi-select menus
- Multi-select value labels and max selection limits
- Saved views backed by `localStorage`
- Headless mode by default
- Optional default theme and exported Base UI wrappers
- Utility helpers for sanitizing, serializing, and deserializing filter values
- Optional URL query sync with `nuqs`
- Vite playground for local UI debugging

## Installation

```bash
pnpm add filtro
```

Optional peer dependencies:

- `react`
- `react-dom`
- `nuqs` if you want URL synchronization

## Quick Start

```tsx
import "filtro/ui.css";
import { Button, defaultFilterBarTheme, FilterBar, filtro } from "filtro";

const fields = [
  filtro.group("Basic", [
    filtro.string("keyword")
      .label("Keyword")
      .placeholder("Search name or email"),
    filtro.number("amount").label("Amount"),
    filtro.date("createdAt").label("Created At"),
  ]),
  filtro.group("Attributes", [
    filtro.select("status").label("Status").options([
      { label: "Open", value: "open" },
      { label: "Closed", value: "closed" },
      { label: "Pending", value: "pending" },
    ]),
    filtro.multiSelect("tags").label("Tags").options([
      { label: "VIP", value: "vip" },
      { label: "Trial", value: "trial" },
      { label: "Churn Risk", value: "churn-risk" },
    ]),
    filtro.boolean("archived").label("Archived").options([
      { label: "Archived", value: true },
      { label: "Not Archived", value: false },
    ]),
  ]),
];

export function Example() {
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

## Core Concepts

### 1. Logical Layer

The logical layer lives in `src/logical` and exports:

- field kinds
- operator definitions
- operator-to-value typing
- AST types

This layer is framework-agnostic and does not depend on React.

### 2. Builder API

Use the `filtro` singleton to define fields:

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

Supported builder methods include:

- Common: `.label()`, `.icon()`, `.description()`, `.placeholder()`, `.operator()`, `.render()`, `.validate()`, `.zod()`
- `select` / `multiSelect`: `.options()`, `.useOptions()`, `.loadOptions()`, `.searchable()`
- `multiSelect`: `.renderValueLabel()`, `.maxSelections()`
- `boolean`: `.options()`

### 3. FilterBar Components

The main UI API is:

- `FilterBar.Root`
- `FilterBar.Trigger`
- `FilterBar.Items`
- `FilterBar.Clear`
- `FilterBar.SaveView`
- `FilterBar.Views`
- `FilterBar.ThemeProvider`

`FilterBar.Root` resolves field definitions, owns or receives state, and provides context to the rest of the UI.

## Field Kinds And Operators

### String

Operators:

- `eq`
- `startsWith`
- `endsWith`
- `contains`
- `notContains`
- `isEmpty`
- `isNotEmpty`

### Number

Operators:

- `eq`
- `gt`
- `lt`
- `gte`
- `lte`
- `between`
- `notBetween`
- `isEmpty`
- `isNotEmpty`

### Date

Operators:

- `eq`
- `before`
- `after`
- `between`
- `notBetween`
- `lastNDays`
- `nextNDays`
- `isEmpty`
- `isNotEmpty`

### Select

Operators:

- `eq`
- `neq`
- `isEmpty`
- `isNotEmpty`

### MultiSelect

Operators:

- `hasAny`
- `hasAll`
- `hasNone`
- `isEmpty`
- `isNotEmpty`

### Boolean

Operators:

- `eq`

## State Model

The current UI state shape is `FilterBarValue[]`.

Important constraints:

- each field appears at most once
- duplicate conditions for the same field are not supported
- the current UI does not output `FilterRoot`
- nested condition groups are not supported

The library exports helpers such as:

- `resolveFilterBarFields`
- `sanitizeFilterBarValue`
- `sanitizeFilterBarValues`
- `serializeFilterBarValue`
- `deserializeFilterBarValue`
- `areFilterBarValuesEqual`
- `getFilterBarQueryKeys`

## Select And Multi-Select Options

`select` and `multiSelect` support three option strategies.

### Static Options

```tsx
filtro.select("status").options([
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
]);
```

### Async Loader

```tsx
filtro.select("owner")
  .options(async ({ query, signal }) => {
    const response = await fetch(`/api/owners?q=${encodeURIComponent(query)}`, {
      signal,
    });

    return (await response.json()) as Array<{ label: string; value: string }>;
  })
  .loadOptions("open");
```

Built-in async behavior includes:

- loading on open or on render
- request cancellation via `AbortController`
- per-field and per-query caching
- remembered selected option labels for round-tripping

### Custom Hook Source

```tsx
filtro.select("reviewer").useOptions(({ normalizedQuery, selectedValues, shouldLoad }) => {
  if (!shouldLoad) {
    return { options: [], status: "idle" };
  }

  const options = allReviewers.filter((option) =>
    option.label.toLowerCase().includes(normalizedQuery),
  );

  return {
    options,
    selectedOptions: allReviewers.filter((option) =>
      selectedValues.includes(option.value),
    ),
    status: "success",
  };
});
```

## Validation

Two validation entry points are supported:

- `.validate(fn)`
- `.zod(schemaOrFactory)`

Validation rules run at the field level and can depend on the active operator.

```tsx
filtro.number("amount").validate(({ op, value }) => {
  if (value == null) return null;

  if (op === "between" || op === "notBetween") {
    return value[0] <= value[1] ? null : "Min must be less than or equal to max";
  }

  return value >= 0 ? null : "Amount must be zero or greater";
});
```

`.zod(...)` does not require a hard dependency on `zod`; it accepts any schema object with a compatible `safeParse()` API.

## Custom Value Editors

You can replace the built-in value editor for a specific field with `.render(...)`.

```tsx
filtro.date("releaseWindow").render(({ op, value, onChange, validate }) => {
  return (
    <CustomDateEditor
      op={op}
      value={value}
      onChange={onChange}
      validate={validate}
    />
  );
});
```

`render(...)` only replaces the value editor area. The row shell, field label, operator selector, and remove action remain managed by `FilterBar`.

## Headless And Themed Usage

`FilterBar` is headless by default.

- No `theme`: structure and behavior only
- `defaultFilterBarTheme`: enables the packaged visual preset
- `mergeFilterBarTheme(...)`: extend the default preset without rewriting it

Theme inputs support:

- `unstyledPrimitives`
- `classNames`
- `texts`
- `icons`

Every themeable node also exposes a `data-theme-slot` attribute for targeted styling.

### CSS Note

Import `filtro/ui.css` only if you want the default theme or its CSS tokens.

The exported stylesheet is currently a Tailwind CSS v4 source file, not precompiled CSS. Consumers need a compatible Tailwind v4 pipeline for the packaged theme to work as-is.

## Saved Views

`FilterBar` can save the current flat filter state as named views.

Components:

- `FilterBar.SaveView`
- `FilterBar.Views`

Behavior:

- saved views are persisted in `localStorage`
- views store sanitized `FilterBarValue[]`
- active views can be applied and exited
- overflow handling is supported with `maxVisibleCount` and `maxVisibleRows`

`FilterBar.Root` accepts `viewsStorageKey` so multiple filter bars on the same page can persist independently.

## Controlled Mode

`FilterBar.Root` supports both uncontrolled and controlled usage.

### Uncontrolled

```tsx
<FilterBar.Root fields={fields} />
```

### Controlled

```tsx
<FilterBar.Root
  fields={fields}
  value={value}
  onValueChange={setValue}
/>
```

`defaultValue` only applies in uncontrolled mode.

## URL Sync With `nuqs`

Install `nuqs` only if you need URL query state synchronization:

```bash
pnpm add filtro nuqs
```

Then use `filtro/nuqs`:

```tsx
import { FilterBar, filtro } from "filtro";
import { useNuqsFilterBarState } from "filtro/nuqs";

const fields = [
  filtro.string("keyword").label("Keyword"),
  filtro.select("status").label("Status").options([
    { label: "Open", value: "open" },
    { label: "Closed", value: "closed" },
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

The `nuqs` integration provides:

- parsing from URL query state into `FilterBarValue[]`
- serialization back into field-specific query keys
- sanitization of invalid or outdated query values
- browser back/forward compatibility through controlled state

## Exported UI Primitives

The package also exports a small set of wrappers around `@base-ui/react`, including:

- `Button`
- `ButtonGroup`
- `DropdownMenu`
- `Input`
- `Select`
- `Switch`

These are used by the default `FilterBar` implementation and can also be reused by consumers.

## Playground

A Vite playground is included for local development and UI debugging.

It demonstrates:

- headless usage
- default themed usage
- async options
- custom date rendering
- validation behavior
- saved views
- `nuqs` URL synchronization

## Development

```bash
pnpm install
pnpm run typecheck
pnpm run build
pnpm run dev:ui
```

Other commands:

- `pnpm test` runs the same check as `pnpm run typecheck`
- `pnpm run build:ui` builds the playground
- `pnpm run preview:ui` previews the playground build

## Current Limitations

- Flat filter state only
- One condition per field
- No repeated conditions on the same field
- No AND/OR group editing in the current UI
- No AST editor UI
- Saved views do not currently support rename, sorting, delete UI, or cloud sync
- The default theme depends on a Tailwind CSS v4-compatible consumer pipeline

## Repository Structure

- `src/logical`: domain model and filter typing
- `src/ui`: builder API, filter bar, theme system, and primitives
- `src/nuqs`: optional URL-sync adapter
- `playground`: local demo application
- `docs`: focused notes about options, validation, styling, rendering, views, and `nuqs`

## License

ISC
