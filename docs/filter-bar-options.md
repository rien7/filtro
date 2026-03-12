# FilterBar Options

`select` and `multiSelect` fields support three option sources:

- Static arrays
- Async loaders via `.options(async ...)`
- Custom hooks via `.useOptions(...)`

All three serve the current flat `FilterBar` implementation.

## Static Arrays

Static options are the simplest path:

```tsx
import { filtro } from 'filtro'

const fields = [
  filtro.select('status')
    .label('Status')
    .options([
      { label: 'Open', value: 'open' },
      { label: 'Closed', value: 'closed' },
      { label: 'Pending', value: 'pending' },
    ]),
]
```

Current behavior:

- No requests
- Status is always `SelectOptionsStatus.success`
- Search is filtered locally in the browser
- `loadOptions("open")` and `loadOptions("render")` do not materially change static arrays

## Async Loader

If you want direct async fetching without another data layer, pass an async loader to `.options(...)`:

```tsx
import { filtro } from 'filtro'

const fields = [
  filtro.select('owner')
    .label('Owner')
    .placeholder('Search owner')
    .options(async ({ query, signal }) => {
      const response = await fetch(
        `/api/owners?q=${encodeURIComponent(query)}`,
        { signal },
      )

      if (!response.ok) {
        throw new Error('Failed to load owners')
      }

      return (await response.json()) as Array<{ label: string, value: string }>
    })
    .loadOptions('open'),
]
```

Current behavior:

- `query` is the normalized query, not the raw input
- The query is trimmed and lowercased before it reaches the loader
- `signal` aborts previous requests when the query changes or the UI closes
- Results are cached by `field.id + normalizedQuery`
- Seen option labels are remembered so selected values can still render a label later

## `useOptions`

If you already have your own data layer, prefer `.useOptions(...)`.

This is a general option-source hook, not a TanStack Query-specific API.

```tsx
import type { UseSelectOptions } from 'filtro'
import { filtro, SelectOptionsStatus } from 'filtro'
import { useMemo } from 'react'

const useReviewerOptions: UseSelectOptions<'reviewer', 'select'> = ({
  normalizedQuery,
  selectedValues,
  shouldLoad,
}) => {
  const allOptions = useMemo(() => [
    { label: 'Alice Johnson', value: 'alice' },
    { label: 'Ben Carter', value: 'ben' },
    { label: 'Chris Wong', value: 'chris' },
  ], [])

  const options = useMemo(() => {
    if (!shouldLoad) {
      return []
    }

    return allOptions.filter((option) => {
      const haystack = `${option.label} ${option.value}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [allOptions, normalizedQuery, shouldLoad])

  const selectedOptions = useMemo(
    () => allOptions.filter(option => selectedValues.includes(option.value)),
    [allOptions, selectedValues],
  )

  return {
    options,
    selectedOptions,
    status: shouldLoad
      ? SelectOptionsStatus.success
      : SelectOptionsStatus.idle,
  }
}

const fields = [
  filtro.select('reviewer')
    .label('Reviewer')
    .useOptions(useReviewerOptions)
    .loadOptions('open'),
]
```

This is the right choice when:

- You already use TanStack Query, SWR, or a store
- You need custom caching or error handling
- You want to provide `selectedOptions` explicitly

## `useOptions` Input

`useOptions` receives:

```ts
type SelectOptionsSourceContext = {
  field: SelectUIField
  open: boolean
  query: string
  normalizedQuery: string
  selectedValues: string[]
  shouldLoad: boolean
}
```

Meaning:

- `field`: the current field definition
- `open`: whether the popup is open
- `query`: the raw deferred search string, or `""` when search is disabled
- `normalizedQuery`: `query.trim().toLowerCase()`
- `selectedValues`: the currently selected values
- `shouldLoad`: whether the field should actively load options right now

`shouldLoad` rules:

- `loadOptions("render")` -> load immediately
- `loadOptions("open")` -> load only after the popup opens
- No explicit `loadOptions(...)` -> behaves like `"open"`

## `useOptions` Return Value

`useOptions` must return:

```ts
type SelectOptionsSourceResult = {
  options: SelectOption[]
  status: SelectOptionsStatus
  error?: Error | null
  selectedOptions?: FlattenedSelectOption[]
}
```

Why `selectedOptions` matters:

- Remote search results may not include the already selected values
- The UI still needs the correct labels for those values
- If you can resolve them from your cache or store, return them explicitly

If you do not return `selectedOptions`, `filtro` falls back to its internal known-option cache.

## `SelectOptionsStatus`

Use the exported constant instead of hand-written strings:

```ts
import { SelectOptionsStatus } from 'filtro'

SelectOptionsStatus.idle
SelectOptionsStatus.loading
SelectOptionsStatus.success
SelectOptionsStatus.error
```

## `.options()` vs `.useOptions()`

One field should have one option source.

Builder behavior:

- Calling `.options(...)` clears any previous `.useOptions(...)`
- Calling `.useOptions(...)` clears any previous `.options(...)`

The last declaration wins.

## `loadOptions(...)`

`loadOptions` decides when loading is allowed to start.

```tsx
filtro.select('owner')
  .options(async ({ query }) => fetchOwners(query))
  .loadOptions('open')
```

Allowed values:

- `"open"`: wait until the popup opens
- `"render"`: allow loading immediately on render

Guidelines:

- Remote search endpoints: usually `"open"`
- Small remote dictionaries that should be warm immediately: `"render"`
- Static arrays: usually no need to set it

## `searchable(...)`

`searchable()` toggles the search box:

```tsx
filtro.select('status')
  .options([
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ])
  .searchable(false)
```

Default: `true`.

When `false`:

- The search input is hidden
- Static arrays are no longer filtered by a query
- Async loaders receive `query === ""`
- `useOptions` receives `query === ""` and `normalizedQuery === ""`

## TanStack Query Pattern

TanStack Query belongs in `useOptions`, not inside `.options(async ...)`, because hooks must stay in valid hook boundaries.

```tsx
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { UseSelectOptions } from 'filtro'
import {
  filtro,
  SelectOptionsStatus
} from 'filtro'
import { useMemo } from 'react'

const useOwnerOptions: UseSelectOptions<'owner', 'select'> = ({
  field,
  normalizedQuery,
  selectedValues,
  shouldLoad,
}) => {
  const ownersQuery = useQuery({
    queryKey: ['filtro', 'options', field.id, normalizedQuery],
    queryFn: async ({ signal }) => {
      const response = await fetch(
        `/api/owners?q=${encodeURIComponent(normalizedQuery)}`,
        { signal },
      )

      if (!response.ok) {
        throw new Error('Failed to load owners')
      }

      return (await response.json()) as Array<{ label: string, value: string }>
    },
    enabled: shouldLoad,
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })

  const selectedOptions = useMemo(() => {
    const allOptions = ownersQuery.data ?? []
    return allOptions.filter(option => selectedValues.includes(option.value))
  }, [ownersQuery.data, selectedValues])

  return {
    options: ownersQuery.data ?? [],
    selectedOptions,
    status: ownersQuery.isPending
      ? SelectOptionsStatus.loading
      : ownersQuery.isError
        ? SelectOptionsStatus.error
        : SelectOptionsStatus.success,
    error: ownersQuery.error ?? null,
  }
}
```

## Which Source To Pick

- Fixed dictionaries: static `.options([...])`
- Simple remote fetches: `.options(async ({ query, signal }) => ...)`
- Query libraries, stores, or custom caches: `.useOptions(...)`
