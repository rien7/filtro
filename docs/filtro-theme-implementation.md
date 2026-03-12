# Filtro Theme Integration Plan

## Status

Draft implementation note for the new high-level `<Filtro>` API.

This document narrows the earlier minimal API proposal around one specific question:

- Make the official default preset the default look for `<Filtro>`
- Still allow users to replace the overall theme intentionally

It does **not** change the current `FilterBar.Root` contract.

## Current Constraints

The current codebase has four relevant boundaries:

1. `FilterBar.Root` is still the headless-first public primitive.
   - Root accepts a `theme` input and passes it into `FilterBarThemeProvider`.
   - The root package and docs currently describe the default preset as optional.

2. The existing theme system is merge-based, not replace-based.
   - `mergeFilterBarTheme()` appends slot classes and merges texts/icons.
   - If a default preset becomes the implicit base, `theme` stops meaning "my whole theme" and instead means "override the built-in preset".

3. The default preset CSS is currently global.
   - `src/presets/default-theme/styles.css` writes tokens to `:root` and `.dark`.
   - Auto-loading that stylesheet would affect host app tokens, not just filtro.

4. The package does not currently have an all-in-one styled root entry.
   - `filtro` exports the logical layer and `FilterBar`.
   - `filtro/default-theme.css` is a separate precompiled stylesheet entry.

## Decision Summary

The safe design is:

- Keep `FilterBar.Root` headless by default.
- Add a new high-level `<Filtro>` wrapper that defaults to the official preset.
- Keep `FilterBar.Root theme={...}` semantics unchanged: merge-only.
- Use a separate baseline selector in `<Filtro>` so "extend the default preset" and "replace it entirely" are different actions.

Recommended v1 rule:

- `<Filtro>` defaults to `preset="default"`
- Passing `theme` extends the selected preset
- Replacing the overall theme is done by switching to `preset="headless"` and supplying a custom theme/CSS

This avoids introducing a confusing `themeMode="replace"` API before it is actually needed.

## Proposed API

```tsx
import { Filtro, filtro } from 'filtro'

const fields = [
  filtro.string('keyword').label('Keyword'),
  filtro.select('status').label('Status').options([
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ]),
]

export function Example() {
  return <Filtro fields={fields} />
}
```

### Props

```ts
type FiltroPreset = 'default' | 'headless'

type FiltroProps<TFields extends FieldDefinition[] = FieldDefinition[]> = {
  fields: TFields
  value?: FilterBarValueType<InferFieldId<TFields>>
  defaultValue?: FilterBarValueType<InferFieldId<TFields>>
  onChange?: (value: FilterBarValueType<InferFieldId<TFields>>) => void

  preset?: FiltroPreset
  theme?: FilterBarThemeInput

  storageKey?: string
  applyMode?: 'auto' | 'manual'
  labels?: {
    addFilter?: string
    clear?: string
    apply?: string
    saveView?: string
    views?: string
  }
}
```

### Semantics

- `preset="default"`: use `defaultFilterBarTheme` as the base theme
- `preset="headless"`: use `headlessFilterBarTheme` as the base theme
- `theme`: merge onto the selected base theme

Examples:

```tsx
// Official preset by default
<Filtro fields={fields} />

// Small overrides on top of the official preset
<Filtro fields={fields} theme={{ texts: { emptyState: "No filters yet" } }} />

// Intentional full replacement path
<Filtro fields={fields} preset="headless" theme={myTheme} />
```

This is the key API distinction: `theme` is an override layer, while `preset` selects the base.

## Why Not Reuse `theme="default" | "none"`?

That shape overloads one prop with two unrelated meanings:

- preset selection
- theme object override

It also hides the real contract problem: once a default preset is implicit, `theme` can no longer mean full replacement.

Using `preset` keeps the boundary explicit.

## CSS Strategy

### Phase 1

Do not auto-inject CSS.

For `<Filtro preset="default" />`, continue to require:

```tsx
import 'filtro/default-theme.css'
```

This is less magical, but it matches the current package distribution and avoids runtime URL guessing or document-level `<link>` injection.

### Phase 2

If zero-config styled usage is still desired after `<Filtro>` lands, first scope the default preset stylesheet so it only affects filtro-owned DOM.

That means:

- stop writing tokens directly to global `:root` and `.dark`
- introduce a filtro-owned scope selector
- ensure the scoped tokens still support dark mode and nested host themes

Only after that should automatic style inclusion be reconsidered.

## Recommended Implementation

### Phase 1: Add `<Filtro>` Without Changing Root Contracts

Goal:

- New high-level wrapper
- Default visual preset for the wrapper
- Keep all existing exports and `FilterBar.Root` behavior intact

Code shape:

```tsx
const baseTheme
  = preset === 'headless' ? headlessFilterBarTheme : defaultFilterBarTheme

const resolvedTheme = mergeFilterBarTheme(baseTheme, theme)
```

Layout responsibilities inside `<Filtro>`:

- Render the common toolbar layout
- Render `Views` and `SaveView` when `storageKey` exists
- Render `Trigger`, `Clear`, `PinnedItems`, `ActiveItems`, `SuggestedItems`
- Use `useFilterBarController()` only for wrapper-managed draft/apply behavior

Important:

- `<Filtro>` should own its own DOM wrapper if it wants a `className`
- Do not pass `className` to `FilterBar.Root`

Files:

- New: `src/filtro/index.tsx`
- New: `src/filtro/types.ts` if prop types need separation
- Update: `src/index.ts`
- Update: `README.md`
- Update: `docs/filter-bar-styling.md`
- Update or replace: `docs/filtro-minimal-api-design.md`

### Phase 2: Scope Default Theme CSS

Goal:

- Make the official preset safe to embed by default in a wrapper API

Required changes:

- Add a stable wrapper attribute or class for scoped styling
- Rewrite `src/presets/default-theme/styles.css` token declarations to live under that scope
- Verify primitive popups and portals still receive the right tokens

This phase is structural.
It should not be hidden inside a "small DX tweak" PR.

### Phase 3: Optional Styled Convenience Entry

Only if Phase 2 succeeds cleanly:

- consider a convenience styled entry or side-effect import path
- keep the existing explicit CSS entry working

This should be additive, not a rewrite of the root `filtro` export contract.

## Non-Goals

These items should stay out of the first implementation:

- Replacing `exports["."]` with a new `<Filtro>`-only entry
- Moving the current API to `filtro/core`
- Runtime auto-detection of `nuqs`
- Runtime `<link href="filtro/default-theme.css">` injection
- Claiming that current `theme` already supports complete replacement

## Risks

1. CSS scope leakage
   - The current preset stylesheet mutates global tokens.

2. Theme contract confusion
   - If `preset` and `theme` are not separated, users will assume `theme` means full replacement.

3. Wrapper drift
   - `<Filtro>` must remain a convenience layer over the existing flat `FilterBar`, not a second architecture.

4. Portal styling regressions
   - Scoped tokens must still reach dropdowns, menus, and other overlay content.

## Acceptance Criteria

Phase 1 is complete when:

- `FilterBar.Root` remains usable exactly as today
- `Filtro` is exported from `filtro` as an additive API
- `Filtro` defaults to the official preset theme object
- `preset="headless"` cleanly disables that preset baseline
- `theme` still works as an additive override layer
- Docs clearly state that default preset CSS remains an explicit import in v1

Phase 2 is complete when:

- The default preset stylesheet no longer depends on global `:root` and `.dark`
- Styled `<Filtro>` usage can be embedded without altering unrelated host tokens

## Recommendation

Ship this in two steps, not one:

1. Add `<Filtro>` with `preset="default" | "headless"` and keep CSS import explicit.
2. Rework CSS scoping before attempting any automatic styled-by-default behavior.

That sequence delivers a much simpler top-level API now, without making misleading promises about theme replacement or stylesheet loading.
