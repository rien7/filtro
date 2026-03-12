import { FilterItemRow } from '@/filter-bar/components/items/row'
import { useFilterBar } from '@/filter-bar/context'
import {
  resolveDisplayRows,
  resolveSuggestionFields,
} from '@/filter-bar/state/display-rows'
import {
  applyDisplayRowUpdate,
  removeDisplayRow,
} from '@/filter-bar/state/row-actions'
import { filterBarThemeSlot, useFilterBarTheme } from '@/filter-bar/theme'
import { cn } from '@/lib/utils'

export function FilterBarActiveItems({
  className,
}: {
  className?: string
}) {
  const {
    changeDismissedSuggestionFieldIds,
    changeDraftValues,
    changeValues,
    dismissedSuggestionFieldIds,
    draftValues,
    uiFields,
    values,
  } = useFilterBar()
  const theme = useFilterBarTheme()
  const rows = resolveDisplayRows(uiFields, values, draftValues)
  const pinnedRows = resolveDisplayRows(uiFields, values, draftValues, { area: 'pinned' })
  const suggestionFields = resolveSuggestionFields(uiFields, values, draftValues, dismissedSuggestionFieldIds)

  const updateItem = ({
    field,
    item,
    source,
    updater,
    meta,
  }: {
    field: (typeof rows)[number]['field']
    item: (typeof rows)[number]['item']
    source: (typeof rows)[number]['source']
    updater: (current: typeof item) => typeof item
    meta: {
      completeness: 'complete' | 'incomplete'
      valueChangeKind?: 'typing' | 'selected'
      action: 'operator' | 'value'
    }
  }) => {
    const nextItem = updater(item)
    const result = applyDisplayRowUpdate({
      action: meta.action,
      field,
      nextItem,
      source,
      draftValues,
      values,
    })

    changeDraftValues?.(result.nextDraftValues)

    if (result.dismissedSuggestion !== undefined) {
      changeDismissedSuggestionFieldIds?.((previous) => {
        const nextFieldIds = new Set(previous)

        if (result.dismissedSuggestion) {
          nextFieldIds.add(field.id)
        }
        else {
          nextFieldIds.delete(field.id)
        }

        return [...nextFieldIds]
      })
    }

    if (result.nextValues !== values) {
      changeValues?.(
        result.nextValues,
        meta.action === 'value'
          ? {
              action: 'value',
              fieldId: field.id,
              completeness: meta.completeness,
              valueChangeKind: meta.valueChangeKind ?? 'selected',
            }
          : {
              action: 'operator',
              fieldId: field.id,
              completeness: meta.completeness,
            },
      )
    }
  }

  const removeItem = (row: (typeof rows)[number]) => {
    const result = removeDisplayRow(row.field, values, draftValues)

    changeDraftValues?.(result.nextDraftValues)
    changeDismissedSuggestionFieldIds?.((previous) => {
      const nextFieldIds = new Set(previous)

      if (result.dismissedSuggestion) {
        nextFieldIds.add(row.field.id)
      }
      else {
        nextFieldIds.delete(row.field.id)
      }

      return [...nextFieldIds]
    })

    if (result.nextValues !== values) {
      changeValues?.(result.nextValues, {
        action: 'remove',
        fieldId: row.field.id,
      })
    }
  }

  if (!rows.length) {
    if (pinnedRows.length > 0 || suggestionFields.length > 0) {
      return null
    }

    return (
      <div
        role="status"
        aria-live="polite"
        data-theme-slot={filterBarThemeSlot('emptyState')}
        className={cn(
          theme.classNames.emptyState,
          className,
        )}
      >
        {theme.texts.emptyState}
      </div>
    )
  }

  return (
    <div
      role="list"
      aria-label="Active filters"
      data-theme-slot={filterBarThemeSlot('activeItemsRoot')}
      className={cn(theme.classNames.activeItemsRoot, className)}
    >
      {rows.map(row => (
        <FilterItemRow
          key={row.field.id}
          field={row.field as never}
          item={row.item as never}
          area="active"
          onUpdate={(updater, meta) =>
            updateItem({
              field: row.field as never,
              item: row.item as never,
              source: row.source,
              updater: updater as never,
              meta,
            })}
          onRemove={() => removeItem(row)}
        />
      ))}
    </div>
  )
}
