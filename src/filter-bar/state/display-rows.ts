import type { FilterBarValueType } from '@/filter-bar/context'
import {
  getSuggestedDisplay,
  isPinnedField,
  isSuggestedField,
} from '@/filter-bar/placement'
import { createFilterBarValue } from '@/filter-bar/state'
import type { UIFieldForKind } from '@/filter-bar/types'
import type { EnumFieldKind } from '@/logical/field'

export type DisplayFilterBarRowSource = 'active' | 'draft'

export interface DisplayFilterBarRow<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  field: UIFieldForKind<FieldId, Kind>
  item: FilterBarValueType<FieldId, Kind>[number]
  source: DisplayFilterBarRowSource
}

interface ResolveDisplayRowsOptions {
  area?: 'active' | 'pinned'
  dismissedSuggestionFieldIds?: string[]
}

function getRowItem<FieldId extends string, Kind extends EnumFieldKind>(
  field: UIFieldForKind<FieldId, Kind>,
  valuesByFieldId: Map<FieldId, FilterBarValueType<FieldId, Kind>[number]>,
  draftsByFieldId: Map<FieldId, FilterBarValueType<FieldId, Kind>[number]>,
) {
  const activeItem = valuesByFieldId.get(field.id)

  if (activeItem) {
    return { item: activeItem, source: 'active' as const }
  }

  const draftItem = draftsByFieldId.get(field.id)

  if (draftItem) {
    return { item: draftItem, source: 'draft' as const }
  }

  const placeholderItem = createFilterBarValue(field as never)

  if (!placeholderItem) {
    return null
  }

  return {
    item: placeholderItem as FilterBarValueType<FieldId, Kind>[number],
    source: 'draft' as const,
  }
}

export function resolveDisplayRows<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  uiFields: UIFieldForKind<FieldId, Kind>[],
  values: FilterBarValueType<FieldId, Kind>,
  draftValues: FilterBarValueType<FieldId, Kind>,
  options: ResolveDisplayRowsOptions = {},
) {
  const area = options.area ?? 'active'
  const valuesByFieldId = new Map(values.map(entry => [entry.fieldId, entry] as const))
  const draftsByFieldId = new Map(draftValues.map(entry => [entry.fieldId, entry] as const))
  const dismissedFieldIds = new Set(options.dismissedSuggestionFieldIds ?? [])
  const rows: DisplayFilterBarRow<FieldId, Kind>[] = []

  for (const field of uiFields) {
    const pinned = isPinnedField(field)
    const suggested = isSuggestedField(field)

    if (area === 'pinned' && !pinned) {
      continue
    }

    if (area === 'active' && pinned) {
      continue
    }

    const rowItem = getRowItem(field, valuesByFieldId, draftsByFieldId)

    if (!rowItem) {
      continue
    }

    if (
      area === 'active'
      && rowItem.source === 'draft'
      && !draftsByFieldId.has(field.id)
    ) {
      continue
    }

    if (
      area === 'active'
      && rowItem.source === 'active'
      && suggested
      && dismissedFieldIds.has(field.id)
    ) {
      continue
    }

    rows.push({
      field,
      item: rowItem.item,
      source: rowItem.source,
    })
  }

  return rows
}

export function resolveSuggestionFields<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  uiFields: UIFieldForKind<FieldId, Kind>[],
  values: FilterBarValueType<FieldId, Kind>,
  draftValues: FilterBarValueType<FieldId, Kind>,
  dismissedSuggestionFieldIds: FieldId[],
) {
  const unavailableFieldIds = new Set([
    ...values.map(entry => entry.fieldId),
    ...draftValues.map(entry => entry.fieldId),
  ])
  const dismissedFieldIds = new Set(dismissedSuggestionFieldIds)

  return uiFields.filter((field) => {
    if (!isSuggestedField(field)) {
      return false
    }

    if (unavailableFieldIds.has(field.id)) {
      return false
    }

    return !dismissedFieldIds.has(field.id)
  })
}

export function resolveDismissedSuggestionFieldIdsForClear<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  uiFields: UIFieldForKind<FieldId, Kind>[],
  values: FilterBarValueType<FieldId, Kind>,
  dismissedSuggestionFieldIds: FieldId[],
) {
  const suggestionFieldMap = new Map(uiFields.map(field => [field.id, field] as const))
  const nextFieldIds = new Set(dismissedSuggestionFieldIds)

  for (const value of values) {
    const field = suggestionFieldMap.get(value.fieldId)

    if (!field || !isSuggestedField(field)) {
      continue
    }

    const suggestion = getSuggestedDisplay(field)

    if (suggestion?.removeBehavior === 'back-to-menu') {
      nextFieldIds.add(field.id)
    }
    else {
      nextFieldIds.delete(field.id)
    }
  }

  return [...nextFieldIds]
}

export function shouldShowFieldInTrigger<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  field: UIFieldForKind<FieldId, Kind>,
) {
  if (isPinnedField(field)) {
    return false
  }

  if (!isSuggestedField(field)) {
    return true
  }

  return getSuggestedDisplay(field)?.showInMenu !== false
}
