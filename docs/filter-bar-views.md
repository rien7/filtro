# FilterBar Saved Views

`FilterBar` can save the current active filters as named views and reapply them later.

This feature still follows the current flat model:

- A view stores `FilterBarValue[]`
- A field can appear at most once
- No nested `AND` / `OR` groups
- No nested AST editor

## Basic Usage

```tsx
import 'filtro/default-theme.css'

import { FilterBar, filtro } from 'filtro'
import { Button, defaultFilterBarTheme } from 'filtro/default-theme'

const fields = [
  filtro.string('keyword').label('Keyword'),
  filtro.select('status').label('Status').options([
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ]),
]

export function FilterBarWithViews() {
  return (
    <FilterBar.Root
      fields={fields}
      theme={defaultFilterBarTheme}
      viewsStorageKey="orders:filters"
    >
      <div className="flex flex-wrap gap-2">
        <FilterBar.Views
          maxVisibleRows={1}
          render={<Button variant="outline" />}
        >
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
  )
}
```

## Component Responsibilities

`FilterBar.SaveView`:

- Disabled when there are no active values
- Opens a small form to enter a view name
- Saves the current active `FilterBarValue[]` into local storage

`FilterBar.Views`:

- Renders visible saved views as buttons
- Applies a view when a saved view button is clicked
- Exits the current view when the active button is clicked again
- Moves overflowed views into a dropdown menu

If there are no saved views at all, `FilterBar.Views` returns `null`.

## Visible Count and Overflow

`FilterBar.Views` supports two independent overflow strategies:

### `maxVisibleCount`

```tsx
<FilterBar.Views
  maxVisibleCount={4}
  render={<Button variant="outline" />}
>
  Views
</FilterBar.Views>
```

When there are more than `4` saved views:

- The first `4` stay visible
- The rest move into the overflow menu

### `maxVisibleRows`

```tsx
<FilterBar.Views
  maxVisibleRows={2}
  render={<Button variant="outline" />}
>
  Views
</FilterBar.Views>
```

The component measures the wrapped button layout and keeps only the views that fit within the allowed number of rows.
The rest move into the overflow menu.

If both are provided:

- First cap by `maxVisibleCount`
- Then apply the row limit
- Everything else overflows

## Behavior While a View Is Active

When a saved view is active:

- `FilterBar.Trigger` allows all fields to be selected again
- That includes fields already present in the active view
- Selecting any new field exits the active view mode first

So a saved view behaves like a reusable snapshot, not a locked preset.

## Storage Model

Saved views are stored in browser `localStorage`.

```tsx
<FilterBar.Root fields={fields} viewsStorageKey="orders:filters">
  ...
</FilterBar.Root>
```

Recommendations:

- If a page has multiple filter bars, give them different `viewsStorageKey` values
- If you do not provide a key, `FilterBar.Root` builds one from the field definitions

Stored values are sanitized before use.
Invalid rows are dropped if:

- The field no longer exists
- The operator is no longer allowed
- The value shape no longer matches the operator

## Theme Hooks

Saved-view UI uses these theme slots:

- `viewsRoot`
- `viewsList`
- `viewsButton`
- `viewsOverflowTrigger`
- `viewsMenuContent`
- `viewsEmptyItem`
- `viewsItem`
- `saveViewContent`
- `saveViewForm`
- `saveViewInput`
- `saveViewSubmit`

Notes about the current implementation:

- `viewsButtonActive` exists in the theme type but is not currently wired to a separate built-in element
- `viewsTriggerFallback` exists in the theme text type but is not currently consumed by `FilterBar.Views`
- The overflow label falls back to `theme.texts.moreViews` when no children are provided

## Current Scope

The current implementation does not provide:

- View renaming
- View sorting
- A built-in delete UI
- Cross-device or account sync

If view management grows beyond simple saved filter snapshots, it should become a separate feature layer instead of expanding the current `FilterBarValue[]` model.
