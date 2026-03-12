import type { MenuTrigger } from '@base-ui/react'
import type { ReactNode } from 'react'
import { Fragment, useDeferredValue, useMemo, useState } from 'react'

import { stopCompositeInputKeyDownPropagation } from '@/filter-bar/accessibility'
import type { FilterBarValueType } from '@/filter-bar/context'
import { useFilterBar } from '@/filter-bar/context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/filter-bar/internal/primitives/baseui/dropdown-menu'
import { SelectSearchInput, SelectSeparator } from '@/filter-bar/internal/primitives/baseui/select'
import { SelectOptionLabel } from '@/filter-bar/select-option-content'
import { useSelectableFieldOptions } from '@/filter-bar/select-options'
import {
  createFilterBarValue,
  getFilterBarValueCompleteness,
  upsertFilterBarValue,
} from '@/filter-bar/state'
import { shouldShowFieldInTrigger } from '@/filter-bar/state/display-rows'
import type { FilterBarTheme } from '@/filter-bar/theme'
import {
  filterBarThemeSlot,
  useFilterBarTheme,
} from '@/filter-bar/theme'
import type {
  SelectKind,
  SelectOption,
  SelectUIField,
  UIFieldEntry,
  UIFieldForKind,
} from '@/filter-bar/types'
import { SelectOptionsStatus } from '@/filter-bar/types'
import type { EnumFieldKind } from '@/logical/field'
import { FieldKind } from '@/logical/field'

function isSelectionKind<FieldId extends string, Kind extends EnumFieldKind>(
  field: UIFieldForKind<FieldId, Kind>,
): field is Extract<
  UIFieldForKind<FieldId, Kind>,
  SelectUIField<FieldId, SelectKind>
> {
  return field.kind === FieldKind.select || field.kind === FieldKind.multiSelect
}

function resolveIconMapping(
  mapping: boolean | Partial<Record<EnumFieldKind, ReactNode>>,
  themeFieldKinds: Partial<Record<EnumFieldKind, ReactNode>> | undefined,
): Partial<Record<EnumFieldKind, ReactNode>> | null {
  if (mapping === true) {
    return themeFieldKinds ?? null
  }

  if (mapping && typeof mapping === 'object') {
    return mapping
  }

  return null
}

function renderFieldIcon(
  field: { icon?: ReactNode, kind: EnumFieldKind },
  defaultIconMapping: Partial<Record<EnumFieldKind, ReactNode>> | null,
): ReactNode {
  if (field.icon !== undefined) {
    return field.icon
  }

  if (!defaultIconMapping) {
    return null
  }

  return defaultIconMapping[field.kind] ?? null
}

function matchesFieldQuery<FieldId extends string, Kind extends EnumFieldKind>(
  field: UIFieldForKind<FieldId, Kind>,
  query: string,
) {
  if (!query) {
    return true
  }

  const haystack = `${field.label ?? ''} ${field.id}`.toLowerCase()
  return haystack.includes(query)
}

function renderSelectOption<FieldId extends string, Kind extends SelectKind>({
  field,
  option,
  keyPath,
  onSelect,
  theme,
}: {
  field: SelectUIField<FieldId, Kind>
  option: SelectOption
  keyPath: string
  onSelect: (field: SelectUIField<FieldId, Kind>, value: string) => void
  theme: FilterBarTheme
}): ReactNode {
  const hasChildren = !!option.children?.length

  if (!hasChildren) {
    return (
      <DropdownMenuItem
        key={keyPath}
        onClick={() => onSelect(field, option.value)}
        data-theme-slot={filterBarThemeSlot('triggerFieldItem')}
        className={theme.classNames.triggerFieldItem}
      >
        <SelectOptionLabel option={option} />
      </DropdownMenuItem>
    )
  }

  return (
    <DropdownMenuSub key={keyPath}>
      <DropdownMenuSubTrigger
        data-theme-slot={filterBarThemeSlot('triggerSubmenuTrigger')}
        className={theme.classNames.triggerSubmenuTrigger}
      >
        <SelectOptionLabel option={option} />
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent
          data-theme-slot={filterBarThemeSlot('triggerSubmenuContent')}
          className={theme.classNames.triggerSubmenuContent}
        >
          {option.children?.map((child, index) =>
            renderSelectOption({
              field,
              option: child,
              keyPath: `${keyPath}.${index}`,
              onSelect,
              theme,
            }))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  )
}

function TriggerSelectionField<FieldId extends string, Kind extends SelectKind>({
  field,
  handleSelectField,
  resolvedIconMapping,
}: {
  field: SelectUIField<FieldId, Kind>
  handleSelectField: (field: SelectUIField<FieldId, Kind>, value: string) => void
  resolvedIconMapping: Partial<Record<EnumFieldKind, ReactNode>> | null
}) {
  const theme = useFilterBarTheme()
  const {
    error,
    handleOpenChange,
    isSearchEnabled,
    open,
    query,
    setQuery,
    status,
    visibleTreeOptions,
  } = useSelectableFieldOptions(field)

  return (
    <DropdownMenuSub key={field.id} open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuSubTrigger
        data-theme-slot={filterBarThemeSlot('triggerSubmenuTrigger')}
        className={theme.classNames.triggerSubmenuTrigger}
      >
        {renderFieldIcon(field, resolvedIconMapping)}
        {field.label ?? field.id}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent
          data-theme-slot={filterBarThemeSlot('triggerSubmenuContent')}
          className={theme.classNames.triggerSubmenuContent}
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
                <DropdownMenuItem
                  disabled
                  data-theme-slot={filterBarThemeSlot('triggerEmptyItem')}
                  className={theme.classNames.triggerEmptyItem}
                >
                  {theme.texts.loadingOptions}
                </DropdownMenuItem>
              )
            : status === SelectOptionsStatus.error
              ? (
                  <DropdownMenuItem
                    disabled
                    data-theme-slot={filterBarThemeSlot('triggerEmptyItem')}
                    className={theme.classNames.triggerEmptyItem}
                  >
                    {error?.message ?? theme.texts.failedToLoadOptions}
                  </DropdownMenuItem>
                )
              : visibleTreeOptions.length > 0
                ? (
                    visibleTreeOptions.map((option, index) =>
                      renderSelectOption({
                        field,
                        option,
                        keyPath: `${String(field.id)}.${index}`,
                        onSelect: handleSelectField,
                        theme,
                      }))
                  )
                : (
                    <DropdownMenuItem
                      disabled
                      data-theme-slot={filterBarThemeSlot('triggerEmptyItem')}
                      className={theme.classNames.triggerEmptyItem}
                    >
                      {theme.texts.noOptions}
                    </DropdownMenuItem>
                  )}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  )
}

function renderFieldEntry<FieldId extends string, Kind extends EnumFieldKind>(
  uiField: UIFieldForKind<FieldId, Kind>,
  resolvedIconMapping: Partial<Record<EnumFieldKind, ReactNode>> | null,
  theme: FilterBarTheme,
  handleSelectField: <SelectedFieldId extends string, SelectedKind extends SelectKind>(
    field: SelectUIField<SelectedFieldId, SelectedKind>,
    value: string,
  ) => void,
  handleSelectValue: (field: UIFieldForKind<FieldId, Kind>) => void,
) {
  return isSelectionKind(uiField)
    ? (
        <TriggerSelectionField
          field={uiField}
          handleSelectField={handleSelectField}
          resolvedIconMapping={resolvedIconMapping}
        />
      )
    : (
        <DropdownMenuItem
          key={uiField.id}
          onClick={() => handleSelectValue(uiField)}
          data-theme-slot={filterBarThemeSlot('triggerFieldItem')}
          className={theme.classNames.triggerFieldItem}
        >
          {renderFieldIcon(uiField, resolvedIconMapping)}
          {uiField.label ?? uiField.id}
        </DropdownMenuItem>
      )
}

export function FilterBarTrigger({
  iconMapping = false,
  children,
  ...props
}: MenuTrigger.Props & {
  iconMapping: Partial<Record<EnumFieldKind, ReactNode>> | boolean
}) {
  const {
    activeView,
    changeDismissedSuggestionFieldIds,
    changeDraftValues,
    changeValues,
    clearActiveView,
    draftValues,
    uiFieldEntries,
    values,
  } = useFilterBar()
  const theme = useFilterBarTheme()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const resolvedIconMapping = resolveIconMapping(iconMapping, theme.icons.fieldKinds)
  const normalizedQuery = deferredQuery.trim().toLowerCase()
  const allowActiveFields = activeView !== null
  const availableEntries = useMemo(() => {
    const activeFieldIds = new Set([
      ...values.map(value => value.fieldId),
      ...draftValues.map(value => value.fieldId),
    ])
    const nextEntries: UIFieldEntry[] = []

    for (const entry of uiFieldEntries) {
      if ('fields' in entry) {
        const availableFields = entry.fields.filter(
          uiField =>
            shouldShowFieldInTrigger(uiField)
            && (allowActiveFields || !activeFieldIds.has(uiField.id)),
        )
        if (availableFields.length === 0) {
          continue
        }

        if (!normalizedQuery) {
          nextEntries.push({ ...entry, fields: availableFields })
          continue
        }

        const groupMatches = entry.label.toLowerCase().includes(normalizedQuery)
        const filteredFields = groupMatches
          ? availableFields
          : availableFields.filter(uiField =>
              matchesFieldQuery(uiField, normalizedQuery))

        if (filteredFields.length > 0) {
          nextEntries.push({ ...entry, fields: filteredFields })
        }

        continue
      }

      if (
        !shouldShowFieldInTrigger(entry)
        || (!allowActiveFields && activeFieldIds.has(entry.id))
        || !matchesFieldQuery(entry, normalizedQuery)
      ) {
        continue
      }

      nextEntries.push(entry)
    }

    return nextEntries
  }, [allowActiveFields, normalizedQuery, uiFieldEntries, values])

  const handleSelectField = <FieldId extends string, Kind extends SelectKind>(
    field: SelectUIField<FieldId, Kind>,
    value: string,
  ) => {
    const nextValue = createFilterBarValue(field as never, { value } as never)

    if (!nextValue) {
      return
    }

    clearActiveView?.()
    changeDismissedSuggestionFieldIds?.(previous =>
      previous.filter(fieldId => fieldId !== field.id))
    changeValues?.(
      prev => upsertFilterBarValue(prev, nextValue as unknown as FilterBarValueType[number]),
      {
        action: 'add',
        fieldId: field.id,
        completeness: getFilterBarValueCompleteness(nextValue as never),
      },
    )
  }

  const handleSelectValue = (uiField: UIFieldForKind<string, EnumFieldKind>) => {
    if (isSelectionKind(uiField)) {
      return
    }

    const nextValue = createFilterBarValue(uiField)

    if (!nextValue) {
      return
    }

    clearActiveView?.()
    changeDismissedSuggestionFieldIds?.(previous =>
      previous.filter(fieldId => fieldId !== uiField.id))

    if (getFilterBarValueCompleteness(nextValue as never) === 'incomplete') {
      changeDraftValues?.(previous =>
        upsertFilterBarValue(previous, nextValue as unknown as FilterBarValueType[number]))
      return
    }

    changeValues?.(
      prev => upsertFilterBarValue(prev, nextValue as unknown as FilterBarValueType[number]),
      {
        action: 'add',
        fieldId: uiField.id,
        completeness: getFilterBarValueCompleteness(nextValue as never),
      },
    )
  }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setQuery('')
        }
      }}
    >
      <DropdownMenuTrigger {...props}>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        data-theme-slot={filterBarThemeSlot('triggerMenuContent')}
        className={theme.classNames.triggerMenuContent}
      >
        <SelectSearchInput
          data-theme-slot={filterBarThemeSlot('selectSearchInput')}
          value={query}
          aria-label={theme.texts.searchFieldsPlaceholder}
          className={theme.classNames.selectSearchInput}
          placeholder={theme.texts.searchFieldsPlaceholder}
          onChange={event => setQuery(event.currentTarget.value)}
          onKeyDown={stopCompositeInputKeyDownPropagation}
        />
        <SelectSeparator
          data-theme-slot={filterBarThemeSlot('triggerMenuSeparator')}
          className={theme.classNames.triggerMenuSeparator}
        />
        {availableEntries.map((entry, index) => (
          <Fragment key={'fields' in entry ? `group:${entry.label}` : `field:${entry.id}`}>
            {index > 0
              ? (
                  <DropdownMenuSeparator
                    data-theme-slot={filterBarThemeSlot('triggerMenuSeparator')}
                    className={theme.classNames.triggerMenuSeparator}
                  />
                )
              : null}
            {'fields' in entry
              ? (
                  <DropdownMenuGroup>
                    <DropdownMenuLabel
                      data-theme-slot={filterBarThemeSlot('triggerGroupLabel')}
                      className={theme.classNames.triggerGroupLabel}
                    >
                      {entry.label}
                    </DropdownMenuLabel>
                    {entry.fields.map(uiField =>
                      renderFieldEntry(
                        uiField,
                        resolvedIconMapping,
                        theme,
                        handleSelectField,
                        handleSelectValue,
                      ))}
                  </DropdownMenuGroup>
                )
              : (
                  renderFieldEntry(
                    entry,
                    resolvedIconMapping,
                    theme,
                    handleSelectField,
                    handleSelectValue,
                  )
                )}
          </Fragment>
        ))}
        {availableEntries.length === 0
          ? (
              <DropdownMenuItem
                disabled
                data-theme-slot={filterBarThemeSlot('triggerEmptyItem')}
                className={theme.classNames.triggerEmptyItem}
              >
                {theme.texts.noMatchingFields}
              </DropdownMenuItem>
            )
          : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
