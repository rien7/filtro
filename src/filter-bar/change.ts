export type FilterBarCompleteness = 'complete' | 'incomplete'

export type FilterBarValueChangeKind = 'typing' | 'selected'

export type FilterBarChangeMeta<FieldId extends string = string>
  = | {
    action: 'clear'
  }
  | {
    action: 'remove'
    fieldId: FieldId
  }
  | {
    action: 'add'
    fieldId: FieldId
    completeness: FilterBarCompleteness
  }
  | {
    action: 'operator'
    fieldId: FieldId
    completeness: FilterBarCompleteness
  }
  | {
    action: 'value'
    fieldId: FieldId
    valueChangeKind: FilterBarValueChangeKind
    completeness: FilterBarCompleteness
  }

export type FilterBarApplyMode = 'auto' | 'manual'

export interface FilterBarApplyMeta<FieldId extends string = string> {
  source: 'apply' | 'auto'
  change: FilterBarChangeMeta<FieldId> | null
}
