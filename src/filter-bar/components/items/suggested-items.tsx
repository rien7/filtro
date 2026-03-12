import type { KeyboardEvent } from 'react'

import { getFilterRowAriaLabel } from '@/filter-bar/accessibility'
import {
  FilterItemFieldSegment,
  FilterItemOperatorTextSegment,
  FilterItemValueSegment,
} from '@/filter-bar/components/items/parts'
import { FilterValuePreview } from '@/filter-bar/components/items/value-preview'
import { useFilterBar } from '@/filter-bar/context'
import { hasFieldFixedOperator } from '@/filter-bar/core/operator'
import { sanitizeFilterBarValue } from '@/filter-bar/core/value-sanitize'
import { ButtonGroup, ButtonGroupText } from '@/filter-bar/internal/primitives/baseui/button-group'
import { getSuggestedDisplay } from '@/filter-bar/placement'
import {
  createFilterBarValue,
  getFilterBarValueCompleteness,
  isEmptyOperator,
  upsertFilterBarValue,
} from '@/filter-bar/state'
import { resolveSuggestionFields } from '@/filter-bar/state/display-rows'
import { filterBarThemeSlot, useFilterBarTheme } from '@/filter-bar/theme'
import { cn } from '@/lib/utils'

function renderSuggestionFieldContent(fieldLabel: string, fieldTextClassName?: string) {
  return (
    <span
      data-theme-slot={filterBarThemeSlot('rowFieldText')}
      className={fieldTextClassName}
    >
      {fieldLabel}
    </span>
  )
}

function handleSuggestionKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
  onActivate: () => void,
) {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return
  }

  event.preventDefault()
  onActivate()
}

export function FilterBarSuggestedItems({
  className,
}: {
  className?: string
}) {
  const {
    changeDismissedSuggestionFieldIds,
    changeDraftValues,
    changeValues,
    clearActiveView,
    dismissedSuggestionFieldIds,
    draftValues,
    uiFields,
    values,
  } = useFilterBar()
  const theme = useFilterBarTheme()
  const fields = resolveSuggestionFields(
    uiFields,
    values,
    draftValues,
    dismissedSuggestionFieldIds,
  )

  if (!fields.length) {
    return null
  }

  return (
    <div
      role="list"
      aria-label="Suggested filters"
      data-theme-slot={filterBarThemeSlot('suggestedItemsRoot')}
      className={cn(theme.classNames.suggestedItemsRoot, className)}
    >
      {fields.map((field) => {
        const suggestion = getSuggestedDisplay(field)
        const nextValue = createFilterBarValue(field as never, suggestion?.seed as never)
        const hasLockedOperator = hasFieldFixedOperator(field as never)
        const showOperator = nextValue && !hasLockedOperator
        const showValue = nextValue && !isEmptyOperator(nextValue.operator)
        const fieldLabel = field.label ?? field.id

        const activateSuggestion = () => {
          if (!nextValue) {
            return
          }

          const activeValue = sanitizeFilterBarValue(field as never, nextValue as never)

          clearActiveView?.()
          changeDismissedSuggestionFieldIds?.(previous =>
            previous.filter(fieldId => fieldId !== field.id))

          if (!activeValue) {
            changeDraftValues?.(previous =>
              upsertFilterBarValue(previous, nextValue as never))
            return
          }

          changeDraftValues?.(previous =>
            previous.filter(entry => entry.fieldId !== field.id))
          changeValues?.(
            previous => upsertFilterBarValue(previous, activeValue as never),
            {
              action: 'add',
              fieldId: field.id,
              completeness: getFilterBarValueCompleteness(activeValue as never),
            },
          )
        }

        return (
          <div
            role="listitem"
            key={field.id}
          >
            <div
              role="button"
              tabIndex={0}
              data-theme-slot={filterBarThemeSlot('suggestionButton')}
              data-area="suggestion"
              aria-label={`Add suggested ${getFilterRowAriaLabel(field as never)}`}
              className={theme.classNames.suggestionButton}
              onClick={activateSuggestion}
              onKeyDown={event => handleSuggestionKeyDown(event, activateSuggestion)}
            >
              <ButtonGroup
                data-theme-slot={filterBarThemeSlot('row')}
                data-area="suggestion"
                className={theme.classNames.row}
              >
                <FilterItemFieldSegment area="suggestion" field={field as never}>
                  {renderSuggestionFieldContent(fieldLabel, theme.classNames.rowFieldText)}
                </FilterItemFieldSegment>
                {showOperator
                  ? (
                      <FilterItemOperatorTextSegment area="suggestion" operator={nextValue.operator} />
                    )
                  : null}
                {showValue
                  ? (
                      <FilterItemValueSegment
                        area="suggestion"
                        className="min-w-0"
                      >
                        <span className="block truncate px-3 py-2 text-left text-sm">
                          <FilterValuePreview
                            field={field as never}
                            item={nextValue as never}
                          />
                        </span>
                      </FilterItemValueSegment>
                    )
                  : null}
                <ButtonGroupText
                  data-area="suggestion"
                  data-suggestion-add
                  data-theme-slot={filterBarThemeSlot('suggestionAdd')}
                  aria-hidden="true"
                  className={theme.classNames.suggestionAdd}
                >
                  {theme.icons.add ?? theme.texts.addLabelFallback}
                </ButtonGroupText>
              </ButtonGroup>
            </div>
          </div>
        )
      })}
    </div>
  )
}
