# FilterBar Field `render`

`FilterBar` lets a field replace its entire value editor with `.render(...)`.

This is not a small style hook.
It fully takes over the value-editor slot for that field while still reusing the surrounding row structure.

Good fit:

- A field needs a custom interaction model
- You want a custom popover, calendar, slider, or compound control
- You still want `FilterBar` to handle the field label, operator UI, and remove button

Not a good fit:

- You only want to restyle a small piece of the default editor
- You want separate hooks for trigger, popup, and popup content while keeping the rest of the built-in editor

## Minimal Usage

```tsx
import { filtro } from 'filtro'

const fields = [
  filtro.string('keyword')
    .label('Keyword')
    .render(({ value, onChange, validate }) => {
      const currentValue = typeof value === 'string' ? value : ''
      const error = validate(currentValue)

      return (
        <>
          <input
            value={currentValue}
            onChange={event =>
              onChange(event.currentTarget.value, {
                valueChangeKind: 'typing',
              })}
          />
          {error ? <div>{error}</div> : null}
        </>
      )
    }),
]
```

`render` receives:

- `op`: the current operator
- `value`: the current value for that operator, or `null`
- `onChange`: writes the next value back into the row
- `validate`: runs the field's current `.validate()` and `.zod()` rules against a value

## What `.render(...)` Replaces

A filter row still has these parts:

- Field label
- Operator segment
- Value editor
- Remove button

`.render(...)` only replaces the value editor.

That means:

- The field label is still rendered by `FilterBar`
- Operator switching is still rendered by `FilterBar`
- The remove button is still rendered by `FilterBar`
- Only the value-editor area is replaced

Implementation entrypoint:

- [src/filter-bar/items.value-editor.tsx](https://github.com/rien7/filtro/blob/main/src/filter-bar/items.value-editor.tsx)

When `field.render` exists, `FilterBar` skips the built-in editors such as `StringValueEditor`, `DateValueEditor`, `SelectValueEditor`, and `MultiSelectValueEditor`.

## Playground Date Example

The playground includes a custom date field called `Release Window`:

- [playground/playground-app.tsx](https://github.com/rien7/filtro/blob/main/playground/playground-app.tsx)
- [playground/calendar-date-editor.tsx](https://github.com/rien7/filtro/blob/main/playground/calendar-date-editor.tsx)

```tsx
filtro.date('releaseWindow')
  .label('Release Window')
  .render(({ op, value, onChange }) => (
    <PlaygroundCalendarDateEditor
      op={op}
      value={value}
      onChange={onChange}
    />
  ))
```

That example keeps the field's operator set, but swaps the built-in date inputs for a custom calendar-based value editor.

## Value Shape Still Depends on Operator

For fields such as `date` and `number`, the value shape changes with the operator.

For `date`:

- `eq`, `before`, `after` -> `string`
- `between`, `notBetween` -> `[string, string]`
- `lastNDays`, `nextNDays` -> `number`

Your custom editor should branch on `op` before deciding how to render and parse.

## `valueChangeKind`

With a custom render function, the library cannot infer whether a change came from typing or a discrete selection.

Pass it explicitly:

- Text or numeric typing -> `{ valueChangeKind: "typing" }`
- Date picks, select changes, toggles, button actions -> `{ valueChangeKind: "selected" }`

If you omit it, the current implementation treats the change as `"selected"`.

This matters if you later use `useFilterBarController({ applyMode: "auto" })`, because typing changes are debounced while discrete selections apply immediately.

## Validation and Raw Input

`validate` only checks the final value shape against the current field rules.

It does not manage:

- Raw input state
- Touched state
- Parsing timing
- Invalid intermediate input

Built-in editors handle those concerns internally.
A custom `render` function must handle them itself if it wants to preserve invalid intermediate input.

Minimal number example:

```tsx
import { useEffect, useState } from 'react'

filtro.number('amount').render(({ value, onChange, validate }) => {
  const [draft, setDraft] = useState(
    typeof value === 'number' ? String(value) : '',
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDraft(typeof value === 'number' ? String(value) : '')
  }, [value])

  function commit(nextDraft: string) {
    setDraft(nextDraft)

    if (!nextDraft) {
      const nextError = validate(null)
      setError(nextError)
      onChange(null, { valueChangeKind: 'typing' })
      return
    }

    const nextValue = Number(nextDraft)

    if (!Number.isFinite(nextValue)) {
      setError('Enter a valid number')
      return
    }

    const nextError = validate(nextValue)
    setError(nextError)

    if (!nextError) {
      onChange(nextValue, { valueChangeKind: 'typing' })
    }
  }

  return (
    <>
      <input
        value={draft}
        onChange={event => commit(event.currentTarget.value)}
      />
      {error ? <div>{error}</div> : null}
    </>
  )
})
```

Key rule: do not call `onChange()` with an illegal value shape.

## When To Use It

- Use `.render(...)` when one field truly needs a different interaction pattern
- Prefer keeping row-level behavior in `FilterBar`
- Branch on `op` before reading or writing values
- Keep your own draft state if you need to preserve invalid input

If the requirement becomes "open up the built-in editor into smaller customizable sub-slots", that is a different API shape and should be designed as such instead of overloading `.render(...)`.
