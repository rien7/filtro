import type { KeyboardEvent } from 'react'

import type { UIFieldForKind } from '@/filter-bar/types'
import type { EnumFieldKind } from '@/logical/field'

function getFieldAccessibleName<FieldId extends string, Kind extends EnumFieldKind>(
  field: UIFieldForKind<FieldId, Kind>,
) {
  return field.label ?? field.id
}

export function getFilterRowAriaLabel<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(field: UIFieldForKind<FieldId, Kind>) {
  return `${getFieldAccessibleName(field)} filter`
}

export function getFilterValueAriaLabel<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  field: UIFieldForKind<FieldId, Kind>,
  detail = 'value',
) {
  return `${getFieldAccessibleName(field)} ${detail}`
}

export function stopCompositeInputKeyDownPropagation(
  event: KeyboardEvent<HTMLInputElement>,
) {
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowUp':
    case 'PageDown':
    case 'PageUp':
    case 'Enter':
    case 'Escape':
    case 'Tab':
      return
    default:
      event.stopPropagation()
  }
}
