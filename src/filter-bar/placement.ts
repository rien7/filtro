import type {
  FilterBarFieldDisplay,
  FilterBarSuggestedDisplay,
  UIFieldForKind,
} from '@/filter-bar/types'
import type { EnumFieldKind } from '@/logical/field'

export function getFieldDisplay<FieldId extends string, Kind extends EnumFieldKind>(
  field: UIFieldForKind<FieldId, Kind>,
): FilterBarFieldDisplay<Kind> {
  const display = field.display as FilterBarFieldDisplay<Kind> | undefined
  return display ?? { kind: 'default' }
}

export function isPinnedField<FieldId extends string, Kind extends EnumFieldKind>(
  field: UIFieldForKind<FieldId, Kind>,
) {
  return getFieldDisplay(field).kind === 'pinned'
}

export function isSuggestedField<FieldId extends string, Kind extends EnumFieldKind>(
  field: UIFieldForKind<FieldId, Kind>,
) {
  return getFieldDisplay(field).kind === 'suggested'
}

export function getSuggestedDisplay<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  field: UIFieldForKind<FieldId, Kind>,
): FilterBarSuggestedDisplay<Kind> | null {
  if (!isSuggestedField(field)) {
    return null
  }

  const display = getFieldDisplay(field)

  if (display.kind !== 'suggested') {
    return null
  }

  return {
    removeBehavior: 'back-to-suggestion',
    showInMenu: true,
    ...display,
    kind: 'suggested',
  }
}
