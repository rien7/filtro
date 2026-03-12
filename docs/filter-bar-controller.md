# FilterBar Controller

`FilterBar.Root` still edits one thing: active `FilterBarValue[]`.

If your page needs to separate:

- The filters currently being edited
- The filters that are already applied to data fetching, URL state, or a store

use `useFilterBarController()`.

## Design Boundary

The controller is not a `FilterBar.Root` prop and it is not stored inside the filter bar context.

The responsibility split is:

- `FilterBar.Root`: edits active `FilterBarValue[]`
- `useFilterBarController()`: coordinates draft and applied values
- `filtro/nuqs`, routers, or external stores: consume applied values

`FilterBar.Root` still accepts:

```ts
value?: FilterBarValueType;
onChange?: (
  nextValue: FilterBarValueType,
  meta?: FilterBarChangeMeta,
) => void;
defaultValue?: FilterBarValueType;
```

Important: this controller works with meaningful active values only.
Incomplete row drafts inside `FilterBar` remain internal until they become valid active values or are removed.

## Hook API

```ts
import type { FilterBarApplyMeta, FilterBarChangeMeta } from 'filtro'
import {
  useFilterBarController
} from 'filtro'

type UseFilterBarControllerOptions = {
  defaultValue?: FilterBarValueType
  appliedValue?: FilterBarValueType
  onAppliedChange?: (
    nextValue: FilterBarValueType,
    meta: FilterBarApplyMeta,
  ) => void
  applyMode?: 'auto' | 'manual'
  debounceMs?: number
}

type FilterBarController = {
  draftValue: FilterBarValueType
  onDraftChange: (
    nextValue: FilterBarValueType,
    meta?: FilterBarChangeMeta,
  ) => void
  appliedValue: FilterBarValueType
  apply: () => void
  clear: () => void
  discardChanges: () => void
  isDirty: boolean
}
```

Meaning:

- `draftValue`: the current editable active values
- `onDraftChange`: pass this to `FilterBar.Root`
- `appliedValue`: the currently committed values
- `apply()`: promote `draftValue` to `appliedValue`
- `clear()`: reset the draft to `[]`
- `discardChanges()`: reset the draft back to the current applied value
- `isDirty`: whether `draftValue` differs from `appliedValue`

## Common Usage

```tsx
import { FilterBar, filtro, useFilterBarController } from 'filtro'

const fields = [
  filtro.string('keyword').label('Keyword'),
  filtro.select('status').label('Status').options([
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ]),
]

export function Filters() {
  const filters = useFilterBarController({
    defaultValue: [],
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

      <div className="flex gap-2">
        <button type="button" onClick={filters.apply} disabled={!filters.isDirty}>
          Apply
        </button>
        <button type="button" onClick={filters.clear}>
          Clear draft
        </button>
        <button type="button" onClick={filters.discardChanges} disabled={!filters.isDirty}>
          Discard changes
        </button>
      </div>
    </>
  )
}
```

## Auto Apply

With `applyMode: "manual"`, the controller never auto-applies.

With `applyMode: "auto"`, the controller uses `FilterBarChangeMeta` to decide whether to apply immediately, debounce, or skip.

Current built-in rules:

- `clear` -> skip
- `remove` -> apply
- `add` with `completeness === "incomplete"` -> skip
- `add` with `completeness === "complete"` -> apply
- `operator` with `completeness === "incomplete"` -> skip
- `operator` with `completeness === "complete"` -> apply
- `value` with `completeness === "incomplete"` -> skip
- `value` with `valueChangeKind === "typing"` and `completeness === "complete"` -> debounce
- `value` with `valueChangeKind === "selected"` and `completeness === "complete"` -> apply

`debounceMs` only affects auto-applied typing changes.

## `FilterBarChangeMeta`

`onChange(nextValue, meta)` reports what changed.
It does not encode apply policy.

```ts
type FilterBarChangeMeta<FieldId extends string = string>
  = | { action: 'clear' }
    | { action: 'remove', fieldId: FieldId }
    | {
      action: 'add'
      fieldId: FieldId
      completeness: 'complete' | 'incomplete'
    }
    | {
      action: 'operator'
      fieldId: FieldId
      completeness: 'complete' | 'incomplete'
    }
    | {
      action: 'value'
      fieldId: FieldId
      valueChangeKind: 'typing' | 'selected'
      completeness: 'complete' | 'incomplete'
    }
```

Examples:

- `FilterBar.Clear` emits `{ action: "clear" }`
- Removing a row emits `{ action: "remove", fieldId }`
- Built-in text and number typing emits `valueChangeKind: "typing"`
- Built-in select, boolean, and discrete date selection emits `valueChangeKind: "selected"`

## Pairing With `filtro/nuqs`

Use the controller between the filter bar and the URL layer:

- `FilterBar.Root` edits the draft channel
- `filtro/nuqs` owns the applied channel

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
  )
}
```

## Synchronization Rules

Current behavior:

- External `appliedValue` is authoritative
- When external `appliedValue` changes, the controller resets `draftValue` to match it
- After that sync, `isDirty` becomes `false`
- `defaultValue` is only used during initialization
- `appliedValue` wins over `defaultValue` during initialization

## Current Non-Goals

Not supported in this version:

- Externally controlled incomplete row drafts
- `controller={...}` passed directly into `FilterBar.Root`
- Custom auto-apply decision functions
- Storing the controller inside `FilterBar` context
