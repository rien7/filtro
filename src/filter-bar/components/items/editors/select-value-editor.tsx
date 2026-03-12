import {
  getFilterValueAriaLabel,
  stopCompositeInputKeyDownPropagation,
} from '@/filter-bar/accessibility'
import type { FilterValueEditorProps } from '@/filter-bar/components/items/editors/shared'
import {
  getOptionLabel,
} from '@/filter-bar/components/items/editors/shared'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSearchInput,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/filter-bar/internal/primitives/baseui/select'
import { SelectOptionLabel } from '@/filter-bar/select-option-content'
import { useSelectableFieldOptions } from '@/filter-bar/select-options'
import { filterBarThemeSlot, useFilterBarTheme } from '@/filter-bar/theme'
import { SelectOptionsStatus } from '@/filter-bar/types'
import { cn } from '@/lib/utils'
import type { FieldKind } from '@/logical/field'

export function SelectValueEditor<FieldId extends string>({
  field,
  item,
  onChange,
}: FilterValueEditorProps<FieldId, typeof FieldKind.select>) {
  const theme = useFilterBarTheme()
  const currentValue = item.value as string | null
  const {
    displayOptions,
    error,
    handleOpenChange,
    isSearchEnabled,
    open,
    query,
    selectedOptions,
    setQuery,
    status,
    visibleOptions,
  } = useSelectableFieldOptions(field, {
    selectedValues: typeof currentValue === 'string' ? [currentValue] : [],
  })
  const value = typeof currentValue === 'string' ? currentValue : null

  return (
    <div
      data-theme-slot={filterBarThemeSlot('editorRoot')}
      className={theme.classNames.editorRoot}
    >
      <Select<string>
        open={open}
        value={value}
        onOpenChange={handleOpenChange}
        onValueChange={nextValue => onChange(nextValue, { valueChangeKind: 'selected' })}
      >
        <SelectTrigger
          data-theme-slot={filterBarThemeSlot('selectTrigger', 'editorControl')}
          aria-label={getFilterValueAriaLabel(field)}
          className={cn(
            theme.classNames.selectTrigger,
            theme.classNames.editorControl,
          )}
        >
          <SelectValue>
            {selectedValue =>
              getOptionLabel(
                typeof selectedValue === 'string' ? selectedValue : value,
                displayOptions,
              )
              ?? field.placeholder
              ?? 'Select an option'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          data-theme-slot={filterBarThemeSlot('selectContent')}
          className={theme.classNames.selectContent}
        >
          {isSearchEnabled
            ? (
                <>
                  <SelectSearchInput
                    data-theme-slot={filterBarThemeSlot('selectSearchInput')}
                    value={query}
                    aria-label={theme.texts.searchOptionsPlaceholder}
                    className={theme.classNames.selectSearchInput}
                    placeholder={theme.texts.searchOptionsPlaceholder}
                    onChange={event => setQuery(event.currentTarget.value)}
                    onKeyDown={stopCompositeInputKeyDownPropagation}
                  />
                  <SelectSeparator
                    data-theme-slot={filterBarThemeSlot('selectSeparator')}
                    className={theme.classNames.selectSeparator}
                  />
                </>
              )
            : null}
          {status === SelectOptionsStatus.loading
            ? (
                <SelectItem
                  disabled
                  value="__loading__"
                  data-theme-slot={filterBarThemeSlot('selectItem')}
                  className={theme.classNames.selectItem}
                >
                  {theme.texts.loadingOptions}
                </SelectItem>
              )
            : status === SelectOptionsStatus.error
              ? (
                  <SelectItem
                    disabled
                    value="__error__"
                    data-theme-slot={filterBarThemeSlot('selectItem')}
                    className={theme.classNames.selectItem}
                  >
                    {error?.message ?? theme.texts.failedToLoadOptions}
                  </SelectItem>
                )
              : visibleOptions.length > 0
                ? (
                    visibleOptions.map(option => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        data-theme-slot={filterBarThemeSlot('selectItem')}
                        className={theme.classNames.selectItem}
                      >
                        <SelectOptionLabel option={option} />
                      </SelectItem>
                    ))
                  )
                : (
                    <SelectItem
                      disabled
                      value="__empty__"
                      data-theme-slot={filterBarThemeSlot('selectItem')}
                      className={theme.classNames.selectItem}
                    >
                      {theme.texts.noOptions}
                    </SelectItem>
                  )}
          {selectedOptions
            .filter(option => !visibleOptions.some(entry => entry.value === option.value))
            .map(option => (
              <SelectItem
                key={`${option.value}__hidden`}
                value={option.value}
                data-theme-slot={filterBarThemeSlot('selectItem')}
                className={cn(theme.classNames.selectItem, 'hidden')}
              >
                <SelectOptionLabel option={option} />
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  )
}
