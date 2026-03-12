# FilterBar Validation

`FilterBar` exposes two validation hooks on field builders:

- `.validate(fn)`
- `.zod(schemaOrFactory)`

They are available on all current field builders:

- `filtro.string(...)`
- `filtro.number(...)`
- `filtro.date(...)`
- `filtro.select(...)`
- `filtro.multiSelect(...)`
- `filtro.boolean(...)`

This doc focuses on:

- When to use `.validate(...)`
- When to use `.zod(...)`
- How built-in editors handle parsing
- What custom `.render(...)` editors must do themselves

## Basic Usage

```tsx
import { filtro } from 'filtro'

const fields = [
  filtro.string('keyword')
    .label('Keyword')
    .validate(({ value }) => {
      if (!value)
        return null
      return value.length >= 3 ? null : 'Use at least 3 characters'
    }),

  filtro.number('amount')
    .label('Amount')
    .validate(({ op, value }) => {
      if (value == null)
        return null

      if (op === 'between' || op === 'notBetween') {
        return value[0] <= value[1]
          ? null
          : 'Min must be less than or equal to max'
      }

      return value >= 0 ? null : 'Amount must be greater than or equal to 0'
    }),
]
```

Validation contract:

- Return `null` or `undefined` for success
- Return a string for failure

Built-in string, number, and date editors render the error below the row.

## `.validate(fn)`

Use `.validate(...)` for business rules.

Signature:

```ts
validate(({ op, value }) => string | null | undefined)
```

Parameters:

- `op`: the current operator
- `value`: the committed value shape for that operator, or `null`

Examples:

```tsx
filtro.string('title')
  .label('Title')
  .validate(({ value }) => {
    if (!value)
      return null
    return value.trim().length >= 5 ? null : 'Use at least 5 characters'
  })
```

```tsx
filtro.number('price')
  .label('Price')
  .validate(({ op, value }) => {
    if (value == null)
      return null

    if (op === 'between' || op === 'notBetween') {
      return value[0] <= value[1] ? null : 'Min must be less than max'
    }

    return value >= 0 ? null : 'Price must be non-negative'
  })
```

```tsx
filtro.date('createdAt')
  .label('Created At')
  .validate(({ op, value }) => {
    if (value == null)
      return null

    if (op === 'between' || op === 'notBetween') {
      return value[0] <= value[1] ? null : 'Start date must be before end date'
    }

    if (op === 'lastNDays' || op === 'nextNDays') {
      return value > 0 ? null : 'Days must be greater than 0'
    }

    return value >= '2024-01-01' ? null : 'Date must be on or after 2024-01-01'
  })
```

Current typed API note:

- A builder only exposes `.validate()` once
- A builder only exposes `.zod()` once
- If you need multiple rules, compose them inside one function or combine one `.validate()` with one `.zod()`

Validators still run in declaration order, and the first error wins.

## `.zod(...)`

If your app already uses `zod`, `.zod(...)` is often the easiest path.

```tsx
import { filtro } from 'filtro'
import { z } from 'zod'

const fields = [
  filtro.string('email')
    .label('Email')
    .zod(z.string().email('Please enter a valid email address')),
]
```

`filtro` does not depend on `zod` directly.
It only expects a `safeParse()`-compatible schema object.

Current behavior:

- `value === null` passes without error
- `safeParse()` success passes
- On failure, the first issue message wins
- If no usable message exists, the fallback is `"Invalid value"`

For fields with one fixed value shape:

```tsx
filtro.number('amount')
  .fixedOperator('eq')
  .zod(z.number().min(0))
```

For fields whose value shape changes with the operator:

```tsx
filtro.number('amount').zod(({ op }) => {
  if (op === 'between' || op === 'notBetween') {
    return z.tuple([
      z.number().min(0),
      z.number().min(0),
    ])
  }

  return z.number().min(0)
})
```

```tsx
filtro.date('createdAt').zod(({ op }) => {
  if (op === 'between' || op === 'notBetween') {
    return z.tuple([
      z.string().min(1),
      z.string().min(1),
    ])
  }

  if (op === 'lastNDays' || op === 'nextNDays') {
    return z.number().int().min(1)
  }

  return z.string().min(1)
})
```

## No Public `.parse(...)`

There is currently no public `.parse(...)` builder API.

This does not exist:

```tsx
// Not supported
filtro.number("amount").parse(...)
```

Current design:

- Public field-level validation is `.validate(...)` and `.zod(...)`
- Built-in number and date editors handle raw input and parsing internally
- Only valid values or `null` enter `FilterBarValue[]`

## Built-in Editor Parsing

Built-in editors parse before writing values.

`string`:

- Input stays a string
- Validation runs against the committed string or `null`

`number`:

- `""` becomes `null`
- Valid numeric text becomes a number
- Invalid intermediate states such as `"-"` stay local to the input
- Invalid intermediate states do not enter `FilterBarValue[]`

`date`:

- `""` becomes `null`
- Valid date strings are committed
- Invalid date input stays local to the editor
- `between` / `notBetween` require both ends
- `lastNDays` / `nextNDays` require numbers

That is why validators receive committed values instead of raw strings.

## Custom `.render(...)` Editors

If you replace the value editor with `.render(...)`, you are responsible for:

- Raw input state
- Parsing
- Invalid intermediate values
- When `onChange()` should be called

Example:

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

Rules:

- Do not call `onChange()` with an illegal value shape
- If you want to preserve invalid input, keep local draft state yourself
- Pass `valueChangeKind: "typing"` for continuous typing
- Pass `valueChangeKind: "selected"` for discrete actions

## Current Scope

This validation model still serves the current flat `FilterBar`:

- `logical` stays pure type and domain code
- `FilterBarValue[]` remains the external state model
- Invalid raw input never enters URL sync or saved views
- There is still no public `.parse(...)` builder API
