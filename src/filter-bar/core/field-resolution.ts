import type { FieldDefinition } from '@/filter-bar/builder'
import { getUIFieldFromBuilder, isFieldGroupDefinition } from '@/filter-bar/builder'
import type { UIFieldEntry, UIFieldForKind } from '@/filter-bar/types'
import type { EnumFieldKind } from '@/logical/field'

export interface ResolvedFilterBarFields<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  uiFieldEntries: UIFieldEntry<FieldId, Kind>[]
  uiFields: UIFieldForKind<FieldId, Kind>[]
}

export function resolveFilterBarFields<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  fields: FieldDefinition<FieldId, Kind>[],
): ResolvedFilterBarFields<FieldId, Kind> {
  const uiFieldEntries = fields.map((field) => {
    if (isFieldGroupDefinition(field)) {
      return {
        label: field.label,
        fields: field.fields.map(groupField => getUIFieldFromBuilder(groupField)),
      }
    }

    return getUIFieldFromBuilder(field)
  }) as UIFieldEntry<FieldId, Kind>[]
  const uiFields = uiFieldEntries.flatMap(entry =>
    'fields' in entry ? entry.fields : [entry])

  return {
    uiFieldEntries,
    uiFields,
  }
}
