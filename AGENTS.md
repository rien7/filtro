# AGENTS.md

## Project Overview

`filtro` is a React filter UI component library, not a full product application.

This repository currently focuses on a reusable flat `FilterBar`, not the future nested filter-builder direction that may appear in planning notes.

What exists today:

- A typed logical layer for field kinds, operators, and AST types
- A builder API for declaring UI fields
- A flat `FilterBar` component system for adding, editing, and clearing conditions
- An optional default visual preset
- Optional `nuqs` URL synchronization helpers
- A Vite playground

Keep these boundaries clear:

- [src/logical](https://github.com/rien7/filtro/tree/main/src/logical) is the pure logical layer
- [src/filter-bar](https://github.com/rien7/filtro/tree/main/src/filter-bar) is the real flat `FilterBar` implementation
- [src/presets/default-theme](https://github.com/rien7/filtro/tree/main/src/presets/default-theme) is the optional styling preset
- `docs/filter-ui-plan.md`, if it appears later, should be treated as planning rather than current implementation

## Tech Stack

- React 19
- TypeScript 5
- Vite 7
- `@base-ui/react`
- Tailwind CSS 4
- `tsdown`
- `pnpm`

## Common Commands

- Install dependencies: `pnpm install`
- Type-check: `pnpm run typecheck`
- Test: `pnpm test`
- Build the library: `pnpm run build`
- Build only the default theme CSS: `pnpm run build:css`
- Start the playground: `pnpm run dev:ui`
- Build the playground: `pnpm run build:ui`
- Preview the playground: `pnpm run preview:ui`

## Current Directory Structure

- [src/index.ts](https://github.com/rien7/filtro/blob/main/src/index.ts): root entrypoint, re-exports `logical` and `filter-bar`
- [src/logical](https://github.com/rien7/filtro/tree/main/src/logical): domain layer for field kinds, operators, values, and AST types
- [src/filter-bar/builder.ts](https://github.com/rien7/filtro/blob/main/src/filter-bar/builder.ts): `filtro.string/number/select/...` builder API
- [src/filter-bar/types.ts](https://github.com/rien7/filtro/blob/main/src/filter-bar/types.ts): UI field types, option-loading types, and custom render types
- [src/filter-bar](https://github.com/rien7/filtro/tree/main/src/filter-bar): `FilterBar.Root`, `Trigger`, `Content`, `PinnedItems`, `SuggestedItems`, `ActiveItems`, `Clear`, `SaveView`, and `Views`
- [src/filter-bar/internal/primitives/baseui](https://github.com/rien7/filtro/tree/main/src/filter-bar/internal/primitives/baseui): internal Base UI wrappers used by the current implementation
- [src/presets/default-theme/index.tsx](https://github.com/rien7/filtro/blob/main/src/presets/default-theme/index.tsx): `defaultFilterBarTheme` and preset exports
- [src/presets/default-theme/style-entry.ts](https://github.com/rien7/filtro/blob/main/src/presets/default-theme/style-entry.ts): CSS build entry for the default theme
- [src/presets/default-theme/styles.css](https://github.com/rien7/filtro/blob/main/src/presets/default-theme/styles.css): default theme source styles
- [scripts/build-default-theme-css.mjs](https://github.com/rien7/filtro/blob/main/scripts/build-default-theme-css.mjs): emits `dist/default-theme.css`
- [src/nuqs/index.ts](https://github.com/rien7/filtro/blob/main/src/nuqs/index.ts): URL sync helpers
- [playground](https://github.com/rien7/filtro/tree/main/playground): local playground
- [playground/internal/calendar.tsx](https://github.com/rien7/filtro/blob/main/playground/internal/calendar.tsx): playground-only calendar wrapper

## Core Model

### 1. Logical Layer

[src/logical/field.ts](https://github.com/rien7/filtro/blob/main/src/logical/field.ts) defines the current field kinds:

- `string`
- `number`
- `date`
- `select`
- `multiSelect`
- `boolean`

[src/logical/operator.ts](https://github.com/rien7/filtro/blob/main/src/logical/operator.ts) defines the allowed operators and typed value shapes for each field kind.

[src/logical/ast.ts](https://github.com/rien7/filtro/blob/main/src/logical/ast.ts) defines `FilterCondition`, `FilterGroup`, `FilterRoot`, and related AST types, but the current UI does not edit nested groups.

### 2. Field Declaration

Fields are declared through the singleton exported from [src/filter-bar/builder.ts](https://github.com/rien7/filtro/blob/main/src/filter-bar/builder.ts):

```ts
filtro.string('keyword').label('Keyword')
filtro.select('status').options([
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' },
])
filtro.group('Basic', [/* fields */])
```

Important implementation details:

- Builder instances are associated with final `UIField` objects through a `WeakMap`
- `allowedOperators` default to `operatorsForKind`
- `select` and `multiSelect` support static arrays and async loaders
- `boolean` requires explicit options
- Fields can inject a custom value editor through `.render(...)`

### 3. UI Structure

Current public components come from [src/filter-bar/index.ts](https://github.com/rien7/filtro/blob/main/src/filter-bar/index.ts):

- `FilterBar.Root`
- `FilterBar.Trigger`
- `FilterBar.Content`
- `FilterBar.PinnedItems`
- `FilterBar.SuggestedItems`
- `FilterBar.ActiveItems`
- `FilterBar.Clear`
- `FilterBar.SaveView`
- `FilterBar.Views`

High-level flow:

- `Root` resolves the field definitions into `uiFieldEntries` and `uiFields`
- `Trigger` adds new rows and prevents duplicate fields in normal mode
- `PinnedItems`, `SuggestedItems`, and `ActiveItems` render the current display regions
- Each active or pinned row is rendered by [src/filter-bar/items.row.tsx](https://github.com/rien7/filtro/blob/main/src/filter-bar/items.row.tsx)
- Value editors are dispatched from [src/filter-bar/items.value-editor.tsx](https://github.com/rien7/filtro/blob/main/src/filter-bar/items.value-editor.tsx) into [src/filter-bar/items-editors](https://github.com/rien7/filtro/tree/main/src/filter-bar/items-editors)

### 4. State Model

The only external active state is still `FilterBarValue[]`, defined around [src/filter-bar/context.ts](https://github.com/rien7/filtro/blob/main/src/filter-bar/context.ts).

Current characteristics:

- Each field can appear at most once
- Duplicate field conditions are not supported
- Nested `AND` / `OR` groups are not supported
- `FilterBar` does not emit `FilterRoot`
- Incomplete row drafts can exist internally, but they are not part of the external `FilterBarValue[]`

If the product requirement becomes a true builder with repeated conditions, groups, or AST output, do not keep stretching this flat state model.

## Theme and Styling Boundaries

- The root `filtro` entry does not export the default preset
- `defaultFilterBarTheme` and the styled wrappers live in [src/presets/default-theme/index.tsx](https://github.com/rien7/filtro/blob/main/src/presets/default-theme/index.tsx)
- [src/filter-bar/theme.tsx](https://github.com/rien7/filtro/blob/main/src/filter-bar/theme.tsx) only defines the theme contract, merge logic, and provider
- [src/presets/default-theme/styles.css](https://github.com/rien7/filtro/blob/main/src/presets/default-theme/styles.css) is the source stylesheet for the preset

The preset source styles use Tailwind CSS v4, but package builds emit precompiled CSS for consumers.

## Recommended Modification Areas

### Good places to edit directly

- New field-kind UI: start from [src/filter-bar/items.value-editor.tsx](https://github.com/rien7/filtro/blob/main/src/filter-bar/items.value-editor.tsx), [src/filter-bar/items-editors](https://github.com/rien7/filtro/tree/main/src/filter-bar/items-editors), and [src/filter-bar/types.ts](https://github.com/rien7/filtro/blob/main/src/filter-bar/types.ts)
- Operator changes: update both [src/logical/operator.ts](https://github.com/rien7/filtro/blob/main/src/logical/operator.ts) and [src/filter-bar/items.constants.ts](https://github.com/rien7/filtro/blob/main/src/filter-bar/items.constants.ts)
- Builder API changes: edit [src/filter-bar/builder.ts](https://github.com/rien7/filtro/blob/main/src/filter-bar/builder.ts)
- Interaction or layout changes: edit [src/filter-bar](https://github.com/rien7/filtro/tree/main/src/filter-bar)
- Default visuals: edit [src/presets/default-theme/index.tsx](https://github.com/rien7/filtro/blob/main/src/presets/default-theme/index.tsx) and [src/presets/default-theme/styles.css](https://github.com/rien7/filtro/blob/main/src/presets/default-theme/styles.css)
- Playground-specific date UI: edit [playground/calendar-date-editor.tsx](https://github.com/rien7/filtro/blob/main/playground/calendar-date-editor.tsx) and [playground/internal/calendar.tsx](https://github.com/rien7/filtro/blob/main/playground/internal/calendar.tsx)

### Constraints while editing

- Confirm you are working on the current implementation, not on future planning ideas
- Keep the `logical` layer React-free
- The builder is public API, so signature changes must preserve type inference and compatibility
- `FilterBar.Root` supports both controlled and uncontrolled usage; any state change must consider both paths
- Select async-option behavior already exists; check [src/filter-bar/select-options.ts](https://github.com/rien7/filtro/blob/main/src/filter-bar/select-options.ts) before changing it
- `dist` and `dist-playground` are outputs, not primary edit targets

## Current Known State

- `README.md` exists and describes the current entrypoints and default-theme subpath
- The `test` script currently runs the type-checker only; there are no separate unit tests yet
- The playground is still the fastest way to understand behavior, especially [playground/playground-app.tsx](https://github.com/rien7/filtro/blob/main/playground/playground-app.tsx)
- The path alias `@/*` maps to `src/*`

## Workflow For Future Agents

1. Read [package.json](https://github.com/rien7/filtro/blob/main/package.json) and [README.md](https://github.com/rien7/filtro/blob/main/README.md) first to confirm the public entrypoints and package structure.
2. For anything involving fields, operators, or value shapes, start from [src/logical](https://github.com/rien7/filtro/tree/main/src/logical).
3. For `FilterBar` interaction changes, follow the chain `Root -> Trigger -> display regions -> items-editors`.
4. For visual changes, treat them as preset-layer work first and start in [src/presets/default-theme](https://github.com/rien7/filtro/tree/main/src/presets/default-theme).
5. If the requirement is now complex filtering, nested groups, AST output, or a framework-agnostic core, treat it as a new phase instead of patching the current flat `FilterBar`.

## Skills

A skill is a local instruction set stored in a `SKILL.md` file.
The following skills are available in this repository context.

### Available skills

- `adapt`: Adapt designs across screen sizes, devices, or contexts.
  File: `~/.agents/skills/adapt/SKILL.md`
- `animate`: Add purposeful motion and micro-interactions.
  File: `~/.agents/skills/animate/SKILL.md`
- `audit`: Audit interface quality across accessibility, performance, theming, and responsive design.
  File: `~/.agents/skills/audit/SKILL.md`
- `bolder`: Make safe designs more visually interesting.
  File: `~/.agents/skills/bolder/SKILL.md`
- `clarify`: Improve unclear product copy and labels.
  File: `~/.agents/skills/clarify/SKILL.md`
- `colorize`: Add strategic color to bland interfaces.
  File: `~/.agents/skills/colorize/SKILL.md`
- `critique`: Evaluate UX and visual design quality.
  File: `~/.agents/skills/critique/SKILL.md`
- `delight`: Add personality and delight.
  File: `~/.agents/skills/delight/SKILL.md`
- `distill`: Simplify and remove unnecessary complexity.
  File: `~/.agents/skills/distill/SKILL.md`
- `extract`: Pull reusable design tokens and patterns into the system.
  File: `~/.agents/skills/extract/SKILL.md`
- `find-skills`: Discover or install additional skills.
  File: `~/.agents/skills/find-skills/SKILL.md`
- `frontend-design`: Build distinctive production-grade frontend interfaces.
  File: `~/.agents/skills/frontend-design/SKILL.md`
- `harden`: Improve resilience, edge cases, and robustness.
  File: `~/.agents/skills/harden/SKILL.md`
- `normalize`: Align work with the existing design system.
  File: `~/.agents/skills/normalize/SKILL.md`
- `onboard`: Improve onboarding, empty states, and first-run flows.
  File: `~/.agents/skills/onboard/SKILL.md`
- `optimize`: Improve UI performance.
  File: `~/.agents/skills/optimize/SKILL.md`
- `playwright`: Use a real browser from the terminal for UI tasks.
  File: `~/.codex/skills/playwright/SKILL.md`
- `polish`: Final quality pass before shipping.
  File: `~/.agents/skills/polish/SKILL.md`
- `quieter`: Tone down overly aggressive designs.
  File: `~/.agents/skills/quieter/SKILL.md`
- `teach-impeccable`: One-time project design setup.
  File: `~/.agents/skills/teach-impeccable/SKILL.md`
- `skill-creator`: Create or update a Codex skill.
  File: `~/.codex/skills/.system/skill-creator/SKILL.md`
- `skill-installer`: Install skills from curated sources or repositories.
  File: `~/.codex/skills/.system/skill-installer/SKILL.md`

### How to use skills

- Discovery: the list above is the skills available in this session
- Trigger rule: if a user names a skill, or the task clearly matches a skill, use it for that turn
- Missing skill: if a named skill cannot be read, say so briefly and continue with the best fallback

Practical workflow:

1. After deciding to use a skill, open its `SKILL.md` and read only what is necessary.
2. Resolve relative paths from the skill directory first.
3. If the skill points to additional references, load only the specific files you need.
4. Prefer existing scripts and templates when the skill provides them.
5. Keep context small and avoid loading unnecessary references.

If a skill cannot be applied cleanly, state the issue briefly, choose the next best approach, and continue.
