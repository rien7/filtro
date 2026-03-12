import { getOptionLabel } from '@/filter-bar/components/items/editors/shared'
import type { FilterBarValue } from '@/filter-bar/context'
import { useSelectableFieldOptions } from '@/filter-bar/select-options'
import { isEmptyOperator } from '@/filter-bar/state'
import { useFilterBarTheme } from '@/filter-bar/theme'
import type { UIFieldForKind } from '@/filter-bar/types'
import type { EnumFieldKind } from '@/logical/field'
import { FieldKind } from '@/logical/field'

export function FilterValuePreview<
  FieldId extends string,
  Kind extends EnumFieldKind,
>({
  field,
  item,
}: {
  field: UIFieldForKind<FieldId, Kind>
  item: FilterBarValue<FieldId, Kind>
}) {
  const theme = useFilterBarTheme()

  if (isEmptyOperator(item.operator)) {
    return null
  }

  switch (field.kind) {
    case FieldKind.string:
      return typeof item.value === 'string' && item.value.length > 0
        ? item.value
        : field.placeholder ?? 'Type a value'
    case FieldKind.number:
      if (Array.isArray(item.value)) {
        return item.value.every(entry => typeof entry === 'number')
          ? item.value.join(' - ')
          : field.placeholder ?? 'Enter a number'
      }

      return typeof item.value === 'number'
        ? String(item.value)
        : field.placeholder ?? 'Enter a number'
    case FieldKind.date:
      if (Array.isArray(item.value)) {
        return item.value.every(entry => typeof entry === 'string' && entry.length > 0)
          ? item.value.join(' - ')
          : field.placeholder ?? 'Select a date'
      }

      if (typeof item.value === 'number') {
        return String(item.value)
      }

      return typeof item.value === 'string' && item.value.length > 0
        ? item.value
        : field.placeholder ?? 'Select a date'
    case FieldKind.select:
      return (
        <SelectValuePreview
          field={field as UIFieldForKind<FieldId, typeof FieldKind.select>}
          item={item as unknown as FilterBarValue<FieldId, typeof FieldKind.select>}
        />
      )
    case FieldKind.multiSelect:
      return (
        <MultiSelectValuePreview
          field={field as UIFieldForKind<FieldId, typeof FieldKind.multiSelect>}
          item={item as unknown as FilterBarValue<FieldId, typeof FieldKind.multiSelect>}
        />
      )
    case FieldKind.boolean: {
      const trueLabel = field.options?.[0].label ?? theme.texts.booleanTrueFallback
      const falseLabel = field.options?.[1].label ?? theme.texts.booleanFalseFallback

      return typeof item.value === 'boolean'
        ? (item.value ? trueLabel : falseLabel)
        : field.placeholder ?? `${trueLabel} / ${falseLabel}`
    }
  }

  return null
}

function SelectValuePreview<FieldId extends string>({
  field,
  item,
}: {
  field: UIFieldForKind<FieldId, typeof FieldKind.select>
  item: FilterBarValue<FieldId, typeof FieldKind.select>
}) {
  const value = typeof item.value === 'string' ? item.value : null
  const { displayOptions } = useSelectableFieldOptions(field, {
    selectedValues: value ? [value] : [],
  })

  return getOptionLabel(value, displayOptions) ?? field.placeholder ?? 'Select an option'
}

function MultiSelectValuePreview<FieldId extends string>({
  field,
  item,
}: {
  field: UIFieldForKind<FieldId, typeof FieldKind.multiSelect>
  item: FilterBarValue<FieldId, typeof FieldKind.multiSelect>
}) {
  const value = Array.isArray(item.value) ? item.value : []
  const { selectedOptions } = useSelectableFieldOptions(field, {
    selectedValues: value,
  })
  const selectedLabel = selectedOptions.length > 0
    ? value.map((selectedValue) => {
        return selectedOptions.find(option => option.value === selectedValue)?.label ?? selectedValue
      }).join(', ')
    : field.placeholder || 'Select options'

  return field.renderValueLabel?.(value) ?? selectedLabel
}
