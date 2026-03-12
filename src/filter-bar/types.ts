import type { ReactNode } from 'react'

import type {
  EnumFieldKind,
  FieldKind,
  LogicalFieldBase,
} from '../logical/field'
import type { OperatorKindFor, OperatorValueFor } from '../logical/operator'
import type { FilterBarValueChangeKind } from './change'

export const FilterBarFieldDisplayKind = {
  default: 'default',
  pinned: 'pinned',
  suggested: 'suggested',
} as const

// eslint-disable-next-line ts/no-redeclare
export type FilterBarFieldDisplayKind
  = (typeof FilterBarFieldDisplayKind)[keyof typeof FilterBarFieldDisplayKind]

export const FilterBarSuggestionRemoveBehavior = {
  backToSuggestion: 'back-to-suggestion',
  backToMenu: 'back-to-menu',
} as const

// eslint-disable-next-line ts/no-redeclare
export type FilterBarSuggestionRemoveBehavior
  = (typeof FilterBarSuggestionRemoveBehavior)[keyof typeof FilterBarSuggestionRemoveBehavior]

export interface FilterBarSuggestionSeed<Kind extends EnumFieldKind = EnumFieldKind> {
  operator?: OperatorKindFor<Kind>
  value?: OperatorValueFor<Kind, OperatorKindFor<Kind>> | null
}

export interface FilterBarSuggestedDisplay<
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  kind: 'suggested'
  seed?: FilterBarSuggestionSeed<Kind>
  removeBehavior?: FilterBarSuggestionRemoveBehavior
  showInMenu?: boolean
}

export interface FilterBarDefaultDisplay {
  kind: 'default'
}

export interface FilterBarPinnedDisplay {
  kind: 'pinned'
}

export type FilterBarFieldDisplay<
  Kind extends EnumFieldKind = EnumFieldKind,
>
  = | FilterBarDefaultDisplay
    | FilterBarPinnedDisplay
    | FilterBarSuggestedDisplay<Kind>

export type UIFieldRender = <
  Kind extends EnumFieldKind,
  Op extends OperatorKindFor<Kind>,
>({
  op,
  value,
  onChange,
}: {
  op: Op
  value: OperatorValueFor<Kind, Op> | null
  onChange: (
    value: OperatorValueFor<Kind, Op> | null,
    options?: { valueChangeKind?: FilterBarValueChangeKind },
  ) => void
  validate: (value: OperatorValueFor<Kind, Op> | null) => string | null
}) => ReactNode

export type UIFieldValidationResult = string | null | undefined

export type UIFieldValidator = <
  Kind extends EnumFieldKind,
  Op extends OperatorKindFor<Kind>,
>({
  op,
  value,
}: {
  op: Op
  value: OperatorValueFor<Kind, Op> | null
}) => UIFieldValidationResult

export interface SafeParseIssue {
  message?: string
}

export interface SafeParseSuccess<T = unknown> {
  success: true
  data: T
}

export interface SafeParseFailure {
  success: false
  error: {
    issues?: SafeParseIssue[]
    message?: string
  }
}

export interface SafeParseSchema<T = unknown> {
  safeParse: (input: unknown) => SafeParseSuccess<T> | SafeParseFailure
}

export type SafeParseSchemaResolver<
  Kind extends EnumFieldKind = EnumFieldKind,
>
  = | SafeParseSchema
    | ((context: { op: OperatorKindFor<Kind> }) => SafeParseSchema)

export interface UIFieldBase<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> extends LogicalFieldBase<FieldId, Kind> {
  label?: string
  icon?: ReactNode
  description?: string
  placeholder?: string
  render?: UIFieldRender
  validators?: UIFieldValidator[]
  display?: FilterBarFieldDisplay<Kind>
}

export interface SelectOption {
  label: string
  value: string
  icon?: ReactNode
  prefix?: ReactNode
  children?: SelectOption[]
}

export type FlattenedSelectOption = Omit<SelectOption, 'children'>

export const SelectOptionsStatus = {
  idle: 'idle',
  loading: 'loading',
  success: 'success',
  error: 'error',
} as const

// eslint-disable-next-line ts/no-redeclare
export type SelectOptionsStatus = (typeof SelectOptionsStatus)[keyof typeof SelectOptionsStatus]

export type SelectOptionsLoadMode = 'render' | 'open'

export type SelectOptionLoader = ({
  query,
  signal,
}: {
  query: string
  signal?: AbortSignal
}) => Promise<SelectOption[]>

export interface SelectOptionsSourceContext<
  FieldId extends string = string,
  Kind extends SelectKind = SelectKind,
> {
  field: SelectUIField<FieldId, Kind>
  open: boolean
  query: string
  normalizedQuery: string
  selectedValues: string[]
  shouldLoad: boolean
}

export interface SelectOptionsSourceResult {
  options: SelectOption[]
  status: SelectOptionsStatus
  error?: Error | null
  selectedOptions?: FlattenedSelectOption[]
}

export type UseSelectOptions<
  FieldId extends string = string,
  Kind extends SelectKind = SelectKind,
> = (
  context: SelectOptionsSourceContext<FieldId, Kind>,
) => SelectOptionsSourceResult

export type SelectOptions = SelectOption[] | SelectOptionLoader
export type BooleanOptions = [{ label: string, value: true }, { label: string, value: false }]

export type SelectKind
  = | typeof FieldKind.select
    | typeof FieldKind.multiSelect
export type BooleanKind = typeof FieldKind.boolean
export type MultiSelectValueLabelRenderer = (values: string[]) => ReactNode

export interface SelectUIField<
  FieldId extends string = string,
  Kind extends SelectKind = SelectKind,
> extends UIFieldBase<FieldId, Kind> {
  options?: SelectOptions
  useOptions?: UseSelectOptions<FieldId, Kind>
  optionsLoadMode?: SelectOptionsLoadMode
  optionsSearchable?: boolean
  renderValueLabel?: MultiSelectValueLabelRenderer
  maxSelections?: number
}

export interface BooleanUIField<
  FieldId extends string = string,
  Kind extends BooleanKind = BooleanKind,
> extends UIFieldBase<FieldId, Kind> {
  options?: BooleanOptions
}

export interface UIFieldGroup<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  label: string
  fields: UIFieldForKind<FieldId, Kind>[]
}

export type UIFieldForKind<
  FieldId extends string,
  Kind extends EnumFieldKind,
> = Kind extends SelectKind
  ? SelectUIField<FieldId, Kind>
  : Kind extends BooleanKind
    ? BooleanUIField<FieldId, Kind>
    : UIFieldBase<FieldId, Kind>

export type UIFieldEntry<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> = UIFieldForKind<FieldId, Kind> | UIFieldGroup<FieldId, Kind>
