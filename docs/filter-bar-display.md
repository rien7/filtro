# FilterBar Field Display

`FilterBar` supports three display modes:

- `default`
- `suggested`
- `pinned`

These modes only control how fields appear in the UI.
They do not introduce new filtering semantics.

The underlying rules stay the same:

- Active state is still `FilterBarValue[]`
- `logical` stays free of display concerns
- Duplicate field conditions and nested groups are still unsupported

## Builder API

Display mode is declared as field metadata:

```tsx
import { filtro } from 'filtro'

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
  filtro.boolean('archived')
    .label('Archived')
    .options([
      { label: 'Archived', value: true },
      { label: 'Not Archived', value: false },
    ]),
]
```

Available methods:

- `.pin()`
- `.suggest(config?)`

If neither is used, the field stays in the default trigger-menu flow.

## Recommended Rendering Structure

If you use pinned or suggested fields, render the full content region explicitly:

```tsx
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

Responsibilities:

- `FilterBar.Content`: shared container for the filter content area
- `FilterBar.PinnedItems`: always renders pinned fields, even when they have no active value
- `FilterBar.ActiveItems`: renders active rows plus active suggested rows
- `FilterBar.SuggestedItems`: renders inactive suggestion entries

Rules to keep in mind:

- If a field uses `.pin()`, render `FilterBar.PinnedItems`
- If a suggestion uses `showInMenu: false`, render `FilterBar.SuggestedItems`
- Otherwise the field may not be visible anywhere

## Active Value Semantics

Display mode does not change what counts as an active value.

`FilterBarValue[]` only stores meaningful active conditions:

- `string`: `""` is removed
- `multiSelect`: `[]` is removed
- Other field kinds: `null` is removed
- `isEmpty` and `isNotEmpty` remain valid active conditions

That means:

- Clearing a pinned field removes its active value, but the row stays visible
- Clearing a suggested field removes its active value and then follows `removeBehavior`

## Runtime Area Attributes

The current implementation exposes UI placement through `data-area`:

- Pinned row: `data-area="pinned"`
- Active row: `data-area="active"`
- Suggestion entry: `data-area="suggestion"`

This describes where an element is rendered right now.
It does not expose older placement concepts such as row source or historical status.

## Suggestion Configuration

`.suggest()` supports three knobs:

```tsx
filtro.string('keyword')
  .label('Keyword')
  .suggest({
    seed: {
      operator: 'contains',
      value: '',
    },
    removeBehavior: 'back-to-suggestion',
    showInMenu: true,
  })
```

Meaning:

- `seed`: the initial operator and value used when the suggestion is activated
- `removeBehavior: "back-to-suggestion"`: clearing or removing the row sends it back to the suggestion area
- `removeBehavior: "back-to-menu"`: clearing or removing the row hides the suggestion entry and leaves only the trigger-menu entry
- `showInMenu: true`: keep the field in `FilterBar.Trigger` even while it is inactive
- `showInMenu: false`: expose the field only through the suggestion area while inactive

If the seed does not produce a meaningful active value, the field first enters internal draft row state instead of immediately entering active `values`.

## Clear and Remove Behavior

- Removing a default row removes it from active values
- Removing a suggested row removes it from active values, then follows `removeBehavior`
- Pinned rows do not render a remove button
- Clearing a pinned row resets its value but keeps the row on screen
- `FilterBar.Clear` clears active values and active drafts

After `FilterBar.Clear`:

- Pinned rows stay visible in their empty state
- Suggestions reappear, unless they are configured to go back to the menu only

## Current Scope

This display system intentionally stays narrow:

- No extra select or multi-select display variants
- No chips, segment, or expandable row variants
- No changes to the flat `FilterBarValue[]` state model

Related docs:

- [docs/filter-bar-styling.md](https://github.com/rien7/filtro/blob/main/docs/filter-bar-styling.md)
- [docs/filter-bar-controller.md](https://github.com/rien7/filtro/blob/main/docs/filter-bar-controller.md)
- [README.md](https://github.com/rien7/filtro/blob/main/README.md)
