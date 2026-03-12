import type { FieldDefinition } from '@/filter-bar/builder'
import type { FilterBarValue, FilterBarValueType } from '@/filter-bar/context'
import { resolveFilterBarFields } from '@/filter-bar/core/field-resolution'
import { getFieldAllowedOperators } from '@/filter-bar/core/operator'
import { sanitizeFilterBarValue } from '@/filter-bar/core/value-sanitize'
import type { UIFieldForKind } from '@/filter-bar/types'
import type { FilterRoot } from '@/logical/ast'
import { FilterAstNode, FilterRelation } from '@/logical/ast'
import type { EnumFieldKind } from '@/logical/field'

function cloneAstValue(value: FilterBarValue<string, EnumFieldKind>['value']) {
  if (Array.isArray(value)) {
    return [...value]
  }

  return value
}

function isUIFieldArray<FieldId extends string, Kind extends EnumFieldKind>(
  fields: FieldDefinition<FieldId, Kind>[] | UIFieldForKind<FieldId, Kind>[],
): fields is UIFieldForKind<FieldId, Kind>[] {
  const firstField = fields[0]
  return firstField !== undefined && 'kind' in firstField
}

export function valuesToFilterRoot<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  values: ReadonlyArray<FilterBarValue<FieldId, Kind>>,
): FilterRoot<FieldId> {
  return {
    type: FilterAstNode.Group,
    relation: FilterRelation.AND,
    children: values.map(entry => ({
      type: FilterAstNode.Condition,
      field: entry.fieldId,
      kind: entry.kind,
      operator: entry.operator,
      value: cloneAstValue(
        entry.value as FilterBarValue<string, EnumFieldKind>['value'],
      ),
    })) as FilterRoot<FieldId>['children'],
  }
}

export function filterRootToValues<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  fields: FieldDefinition<FieldId, Kind>[] | UIFieldForKind<FieldId, Kind>[],
  root: FilterRoot<FieldId>,
): FilterBarValueType<FieldId, Kind> | null {
  if (root.type !== FilterAstNode.Group || root.relation !== FilterRelation.AND) {
    return null
  }

  const uiFields = isUIFieldArray(fields) ? fields : resolveFilterBarFields(fields).uiFields
  const fieldMap = new Map(uiFields.map(field => [field.id, field] as const))
  const seenFieldIds = new Set<FieldId>()
  const nextValues: FilterBarValueType<FieldId, Kind> = []

  for (const node of root.children) {
    if (node.type !== FilterAstNode.Condition || seenFieldIds.has(node.field)) {
      return null
    }

    const field = fieldMap.get(node.field)

    if (!field || field.kind !== node.kind) {
      return null
    }

    seenFieldIds.add(node.field)

    const nextValue = sanitizeFilterBarValue(
      field as UIFieldForKind<FieldId, Kind>,
      {
        fieldId: field.id,
        kind: field.kind,
        operator: node.operator as FilterBarValue<FieldId, Kind>['operator'],
        allowOperators: getFieldAllowedOperators(
          field as UIFieldForKind<FieldId, Kind>,
        ) as FilterBarValue<FieldId, Kind>['allowOperators'],
        value: cloneAstValue(
          node.value as FilterBarValue<string, EnumFieldKind>['value'],
        ) as FilterBarValue<FieldId, Kind>['value'],
      } as FilterBarValue<FieldId, Kind>,
    )

    if (!nextValue) {
      return null
    }

    nextValues.push(nextValue as FilterBarValueType<FieldId, Kind>[number])
  }

  return nextValues
}
