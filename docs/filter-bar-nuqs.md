# FilterBar With `nuqs`

`FilterBar` supports controlled mode, so URL synchronization lives in an optional adapter entrypoint instead of inside the core package:

- The root package keeps shipping `FilterBar`
- Apps that need URL state install `nuqs`
- `filtro/nuqs` bridges `FilterBarValue[]` and query state

This keeps the package decoupled from any single router or framework adapter.

## Installation

```bash
pnpm add filtro nuqs
```

`nuqs` is an optional peer dependency.

## Add a `NuqsAdapter`

`filtro/nuqs` does not install the adapter for you.
The host app must wrap itself with the correct `nuqs` adapter.

React SPA / Vite example:

```tsx
import { NuqsAdapter } from 'nuqs/adapters/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NuqsAdapter>
      <App />
    </NuqsAdapter>
  </StrictMode>,
)
```

For Next.js, Remix, React Router, and other runtimes, use the official `nuqs` adapter for that environment.

Reference:

- [nuqs adapters](https://nuqs.dev/docs/adapters)

## Basic Usage

`useNuqsFilterBarState()` maps the URL query string to controlled `value` and `onChange` props for `FilterBar.Root`.

```tsx
import { FilterBar, filtro } from 'filtro'
import { useNuqsFilterBarState } from 'filtro/nuqs'

const fields = [
  filtro.string('keyword').label('Keyword'),
  filtro.number('amount').label('Amount'),
  filtro.select('status').label('Status').options([
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ]),
  filtro.multiSelect('tags').label('Tags').options([
    { label: 'VIP', value: 'vip' },
    { label: 'Trial', value: 'trial' },
  ]),
]

export function Filters() {
  const filterState = useNuqsFilterBarState({
    fields,
    prefix: 'demo_',
    history: 'replace',
    shallow: true,
  })

  return (
    <FilterBar.Root
      fields={fields}
      value={filterState.value}
      onChange={filterState.onChange}
    >
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

Result:

- Initial render reads filters from the URL
- Filter edits write back to the query string
- Browser back/forward updates the `FilterBar`

Important: just like any controlled `FilterBar`, this controls active `FilterBarValue[]` only.
Incomplete row drafts remain internal to `FilterBar`.

## `FilterBar.Root` Controlled Mode

Uncontrolled:

```tsx
<FilterBar.Root fields={fields}>...</FilterBar.Root>
```

Controlled:

```tsx
<FilterBar.Root fields={fields} value={value} onChange={setValue}>
  ...
</FilterBar.Root>
```

In controlled mode:

- The active value array comes from outside
- Meaningful active changes flow through `onChange`
- `defaultValue` only matters in uncontrolled mode

`filtro/nuqs` is just one external state adapter that happens to use the URL.

## Hook API

```ts
useNuqsFilterBarState({
  fields,
  prefix?: string,
  history?: "push" | "replace",
  shallow?: boolean,
})
```

Return value:

```ts
{
  value: FilterBarValueType;
  onChange: (nextValue: FilterBarValueType) => void;
}
```

Arguments:

- `fields`: the same field definitions passed to `FilterBar.Root`
- `prefix`: prefixes all query keys so multiple filter bars can coexist
- `history`: passed through to `nuqs/useQueryStates`
- `shallow`: passed through to `nuqs/useQueryStates`

## Pairing With `useFilterBarController()`

If you want users to edit first and only write to the URL on Apply, let `nuqs` own the applied channel and put the controller in front of it:

```tsx
import { FilterBar, filtro, useFilterBarController } from 'filtro'
import { useNuqsFilterBarState } from 'filtro/nuqs'

const fields = [
  filtro.string('keyword').label('Keyword'),
  filtro.select('status').label('Status').options([
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ]),
]

export function UrlBackedFilters() {
  const urlState = useNuqsFilterBarState({
    fields,
    history: 'replace',
  })

  const filters = useFilterBarController({
    appliedValue: urlState.value,
    onAppliedChange: urlState.onChange,
    applyMode: 'manual',
  })

  return (
    <>
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
    </>
  )
}
```

Recommended default: `history: "replace"`.

## Default Query Key Rules

The adapter does not store the whole filter bar in one JSON blob.
It generates per-field query keys.

If the field id is `status` and the prefix is `demo_`:

- Value key: `demo_status`
- Operator key: `demo_statusOp`
- Range start key: `demo_statusFrom`
- Range end key: `demo_statusTo`

Encoding rules:

- Fixed-operator fields: do not write `${fieldId}Op`
- String and select: value in `${fieldId}`, operator in `${fieldId}Op`
- Number:
  - Single-value operators use `${fieldId}`
  - `between` / `notBetween` use `${fieldId}From` and `${fieldId}To`
- Date:
  - Single-value operators use `${fieldId}`
  - `between` / `notBetween` use `${fieldId}From` and `${fieldId}To`
  - `lastNDays` / `nextNDays` also use `${fieldId}`
- Multi-select: value in `${fieldId}` with `nuqs` array parsing
- Boolean: value in `${fieldId}`
- Empty operators `isEmpty` and `isNotEmpty`: only `${fieldId}Op` is written

## Invalid URL Handling

`filtro/nuqs` sanitizes query state against the current field definitions before handing it to `FilterBar`.

These cases are dropped:

- The field id no longer exists
- The operator is not allowed for the field
- The value shape does not match the operator
- Only one side of a range is present

That means:

- Old shared URLs degrade safely
- Field or operator changes do not poison the UI
- Old operator keys are ignored when a field becomes fixed-operator

## Advanced Usage: Build Parsers Only

If you already own your `useQueryStates` setup, use the parser generator directly:

```tsx
import { createFilterBarNuqsParsers } from 'filtro/nuqs'
import { useQueryStates } from 'nuqs'

const parsers = createFilterBarNuqsParsers(fields, { prefix: 'orders_' })

function Example() {
  const [query, setQuery] = useQueryStates(parsers, {
    history: 'push',
    shallow: false,
  })

  return <pre>{JSON.stringify(query, null, 2)}</pre>
}
```

Use this when:

- Filters need to share a query state object with pagination or sorting
- You want to read or write the query keys outside `FilterBar`
- You want finer control over `nuqs` composition

## Current Scope

This adapter follows the current flat `FilterBar` model:

- One condition per field
- No duplicate field conditions
- No nested `AND` / `OR` groups
- No `FilterRoot` output

If the state model evolves into nested groups or a true builder, the URL encoding should be redesigned instead of stretched further.
