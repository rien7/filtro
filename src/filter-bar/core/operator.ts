import type { UIFieldForKind } from '@/filter-bar/types'
import type { EnumFieldKind } from '@/logical/field'
import type { OperatorKindFor } from '@/logical/operator'
import { EmptyOperatorKind } from '@/logical/operator'

const EMPTY_OPERATORS = new Set<string>([
  EmptyOperatorKind.isEmpty,
  EmptyOperatorKind.isNotEmpty,
])

export function isEmptyOperator(operator: string) {
  return EMPTY_OPERATORS.has(operator)
}

export function getFieldAllowedOperators<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(field: UIFieldForKind<FieldId, Kind>): OperatorKindFor<Kind>[] {
  if (field.fixedOperator !== undefined) {
    return [field.fixedOperator] as OperatorKindFor<Kind>[]
  }

  return [...field.allowedOperators] as OperatorKindFor<Kind>[]
}

export function getFieldDefaultOperator<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(field: UIFieldForKind<FieldId, Kind>) {
  const allowedOperators = getFieldAllowedOperators(field)
  const defaultSelectedOperator = field.defaultSelectedOperator

  if (defaultSelectedOperator !== undefined) {
    const resolvedDefaultOperator = allowedOperators.find(operator =>
      operator === defaultSelectedOperator)

    if (resolvedDefaultOperator !== undefined) {
      return resolvedDefaultOperator
    }
  }

  return allowedOperators[0]
}

export function hasFieldFixedOperator<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(field: UIFieldForKind<FieldId, Kind>) {
  return field.fixedOperator !== undefined
}
