import type { FilterBarChangeMeta } from '@/filter-bar/change'
import type { FilterBarValueType } from '@/filter-bar/context'
import {
  sanitizeFilterBarDraftValue,
  sanitizeFilterBarValue,
} from '@/filter-bar/core/value-sanitize'
import {
  getSuggestedDisplay,
  isPinnedField,
  isSuggestedField,
} from '@/filter-bar/placement'
import {
  normalizeValueForOperator,
  removeFilterBarValue,
  upsertFilterBarValue,
} from '@/filter-bar/state'
import type { UIFieldForKind } from '@/filter-bar/types'
import type { EnumFieldKind } from '@/logical/field'
import type { OperatorKindFor } from '@/logical/operator'

import type { DisplayFilterBarRowSource } from './display-rows'

export function applyDisplayRowUpdate<
  FieldId extends string,
  Kind extends EnumFieldKind,
>({
  action,
  field,
  nextItem,
  source,
  draftValues,
  values,
}: {
  action: Extract<FilterBarChangeMeta<FieldId>, { action: 'operator' | 'value' }>['action']
  field: UIFieldForKind<FieldId, Kind>
  nextItem: FilterBarValueType<FieldId, Kind>[number]
  source: DisplayFilterBarRowSource
  draftValues: FilterBarValueType<FieldId, Kind>
  values: FilterBarValueType<FieldId, Kind>
}) {
  const draftItem = sanitizeFilterBarDraftValue(field as never, nextItem as never)
  const activeItem = sanitizeFilterBarValue(field as never, nextItem as never)

  if (activeItem) {
    return {
      nextValues: upsertFilterBarValue(values, activeItem as FilterBarValueType<FieldId, Kind>[number]),
      nextDraftValues: removeFilterBarValue(draftValues, field.id) as FilterBarValueType<FieldId, Kind>,
      dismissedSuggestion: false,
    }
  }

  const nextValues = removeFilterBarValue(values, field.id) as FilterBarValueType<FieldId, Kind>
  const shouldKeepDraft
    = source === 'draft'
      || isPinnedField(field)
      || action === 'operator'

  if (!shouldKeepDraft || !draftItem) {
    return {
      nextValues,
      nextDraftValues: removeFilterBarValue(draftValues, field.id) as FilterBarValueType<FieldId, Kind>,
      dismissedSuggestion:
        source === 'active'
        && action === 'value'
        && isSuggestedField(field)
        && getSuggestedDisplay(field)?.removeBehavior === 'back-to-menu',
    }
  }

  return {
    nextValues,
    nextDraftValues: upsertFilterBarValue(
      draftValues,
      draftItem as FilterBarValueType<FieldId, Kind>[number],
    ) as FilterBarValueType<FieldId, Kind>,
    dismissedSuggestion: false,
  }
}

export function clearDisplayRowValue<
  FieldId extends string,
  Kind extends EnumFieldKind,
>({
  field,
  item,
  source,
  draftValues,
  values,
}: {
  field: UIFieldForKind<FieldId, Kind>
  item: FilterBarValueType<FieldId, Kind>[number]
  source: DisplayFilterBarRowSource
  draftValues: FilterBarValueType<FieldId, Kind>
  values: FilterBarValueType<FieldId, Kind>
}) {
  const nextItem = {
    ...item,
    value: normalizeValueForOperator({
      field,
      operator: item.operator as OperatorKindFor<Kind>,
      previousValue: null,
    }) as typeof item.value,
  }

  return applyDisplayRowUpdate({
    action: 'value',
    field,
    nextItem,
    source,
    draftValues,
    values,
  })
}

export function removeDisplayRow<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  field: UIFieldForKind<FieldId, Kind>,
  values: FilterBarValueType<FieldId, Kind>,
  draftValues: FilterBarValueType<FieldId, Kind>,
) {
  return {
    nextValues: removeFilterBarValue(values, field.id) as FilterBarValueType<FieldId, Kind>,
    nextDraftValues: removeFilterBarValue(draftValues, field.id) as FilterBarValueType<FieldId, Kind>,
    dismissedSuggestion:
      isSuggestedField(field)
      && getSuggestedDisplay(field)?.removeBehavior === 'back-to-menu',
  }
}
