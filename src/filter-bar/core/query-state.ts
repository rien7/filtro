import type { FilterBarValue } from '@/filter-bar/context'
import {
  getFieldAllowedOperators,
  getFieldDefaultOperator,
  hasFieldFixedOperator,
  isEmptyOperator,
} from '@/filter-bar/core/operator'
import { sanitizeFilterBarValue } from '@/filter-bar/core/value-sanitize'
import type { UIFieldForKind } from '@/filter-bar/types'
import type { EnumFieldKind } from '@/logical/field'
import { FieldKind } from '@/logical/field'
import {
  DateOperatorKind,
  NumberOperatorKind,
} from '@/logical/operator'

export type FilterBarQueryStatePrimitive = string | number | boolean | string[] | null
export type FilterBarQueryState = Record<string, FilterBarQueryStatePrimitive | undefined>
export type SerializedFilterBarValue = Record<string, FilterBarQueryStatePrimitive>

export interface FilterBarQueryKeys {
  value: string
  operator: string
  from: string
  to: string
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(entry => typeof entry === 'string')
}

function resolveFieldValue(
  field: UIFieldForKind<string, EnumFieldKind>,
  operator: string,
  value: FilterBarQueryStatePrimitive | undefined,
  rangeStart: FilterBarQueryStatePrimitive | undefined,
  rangeEnd: FilterBarQueryStatePrimitive | undefined,
) {
  if (isEmptyOperator(operator)) {
    return null
  }

  switch (field.kind) {
    case FieldKind.string:
    case FieldKind.select:
      return typeof value === 'string' ? value : null
    case FieldKind.number:
      if (
        operator === NumberOperatorKind.between
        || operator === NumberOperatorKind.notBetween
      ) {
        return isFiniteNumber(rangeStart) && isFiniteNumber(rangeEnd)
          ? [rangeStart, rangeEnd]
          : null
      }
      return isFiniteNumber(value) ? value : null
    case FieldKind.date:
      if (
        operator === DateOperatorKind.between
        || operator === DateOperatorKind.notBetween
      ) {
        return typeof rangeStart === 'string' && typeof rangeEnd === 'string'
          ? [rangeStart, rangeEnd]
          : null
      }
      if (
        operator === DateOperatorKind.lastNDays
        || operator === DateOperatorKind.nextNDays
      ) {
        return isFiniteNumber(value) ? value : null
      }
      return typeof value === 'string' ? value : null
    case FieldKind.multiSelect:
      return isStringArray(value) ? value : null
    case FieldKind.boolean:
      return typeof value === 'boolean' ? value : null
    default:
      return null
  }
}

export function getFilterBarQueryKeys(fieldId: string, prefix = ''): FilterBarQueryKeys {
  const baseKey = `${prefix}${fieldId}`

  return {
    value: baseKey,
    operator: `${baseKey}Op`,
    from: `${baseKey}From`,
    to: `${baseKey}To`,
  }
}

export function serializeFilterBarValue<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  field: UIFieldForKind<FieldId, Kind>,
  input: FilterBarValue<FieldId, Kind> | null | undefined,
  { prefix = '' }: { prefix?: string } = {},
): SerializedFilterBarValue {
  const keys = getFilterBarQueryKeys(field.id, prefix)
  const hasFixedOperator = hasFieldFixedOperator(field)
  const serialized: SerializedFilterBarValue = {
    [keys.value]: null,
    [keys.from]: null,
    [keys.to]: null,
  }
  serialized[keys.operator] = null
  const value = input ? sanitizeFilterBarValue(field, input) : null

  if (!value) {
    return serialized
  }

  if (!hasFixedOperator) {
    serialized[keys.operator] = value.operator
  }

  if (isEmptyOperator(value.operator)) {
    return serialized
  }

  switch (field.kind) {
    case FieldKind.number:
      if (
        value.operator === NumberOperatorKind.between
        || value.operator === NumberOperatorKind.notBetween
      ) {
        const rangeValue = value.value as [number, number]
        serialized[keys.from] = rangeValue[0]
        serialized[keys.to] = rangeValue[1]
        return serialized
      }

      serialized[keys.value] = value.value as number
      return serialized
    case FieldKind.date:
      if (
        value.operator === DateOperatorKind.between
        || value.operator === DateOperatorKind.notBetween
      ) {
        const rangeValue = value.value as [string, string]
        serialized[keys.from] = rangeValue[0]
        serialized[keys.to] = rangeValue[1]
        return serialized
      }

      serialized[keys.value] = value.value as string | number
      return serialized
    default:
      serialized[keys.value] = value.value as FilterBarQueryStatePrimitive
      return serialized
  }
}

export function deserializeFilterBarValue<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  field: UIFieldForKind<FieldId, Kind>,
  queryState: FilterBarQueryState,
  { prefix = '' }: { prefix?: string } = {},
): FilterBarValue<FieldId, Kind> | null {
  const keys = getFilterBarQueryKeys(field.id, prefix)
  const queryOperator = queryState[keys.operator]
  const operator = field.fixedOperator
    ?? (typeof queryOperator === 'string'
      ? queryOperator
      : getFieldDefaultOperator(field))

  if (typeof operator !== 'string') {
    return null
  }

  const parsedValue = resolveFieldValue(
    field as UIFieldForKind<string, EnumFieldKind>,
    operator,
    queryState[keys.value],
    queryState[keys.from],
    queryState[keys.to],
  )

  return sanitizeFilterBarValue(field, {
    fieldId: field.id,
    kind: field.kind,
    operator: operator as FilterBarValue<FieldId, Kind>['operator'],
    allowOperators: getFieldAllowedOperators(field) as FilterBarValue<FieldId, Kind>['allowOperators'],
    value: parsedValue as FilterBarValue<FieldId, Kind>['value'],
  } as FilterBarValue<FieldId, Kind>)
}
