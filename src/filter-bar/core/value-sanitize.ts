import type { FieldDefinition } from '@/filter-bar/builder'
import type { FilterBarValue, FilterBarValueType } from '@/filter-bar/context'
import { resolveFilterBarFields } from '@/filter-bar/core/field-resolution'
import {
  getFieldAllowedOperators,
  isEmptyOperator,
} from '@/filter-bar/core/operator'
import type { UIFieldForKind } from '@/filter-bar/types'
import type { EnumFieldKind } from '@/logical/field'
import { FieldKind } from '@/logical/field'
import {
  DateOperatorKind,
  NumberOperatorKind,
} from '@/logical/operator'

function isUIFieldArray<FieldId extends string, Kind extends EnumFieldKind>(
  fields: FieldDefinition<FieldId, Kind>[] | UIFieldForKind<FieldId, Kind>[],
): fields is UIFieldForKind<FieldId, Kind>[] {
  const firstField = fields[0]
  return firstField !== undefined && 'kind' in firstField
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isStringPair(value: unknown): value is [string, string] {
  return (
    Array.isArray(value)
    && value.length === 2
    && typeof value[0] === 'string'
    && typeof value[1] === 'string'
  )
}

function isNumberPair(value: unknown): value is [number, number] {
  return (
    Array.isArray(value)
    && value.length === 2
    && isFiniteNumber(value[0])
    && isFiniteNumber(value[1])
  )
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(entry => typeof entry === 'string')
}

function cloneFilterValue(value: FilterBarValue<string, EnumFieldKind>['value']) {
  if (Array.isArray(value)) {
    return [...value]
  }

  return value
}

export function isMeaningfulFilterBarValue(
  value: FilterBarValue<string, EnumFieldKind>,
) {
  if (isEmptyOperator(value.operator)) {
    return true
  }

  switch (value.kind) {
    case FieldKind.string:
    case FieldKind.select:
      return typeof value.value === 'string' && value.value.length > 0
    case FieldKind.number:
      if (
        value.operator === NumberOperatorKind.between
        || value.operator === NumberOperatorKind.notBetween
      ) {
        return Array.isArray(value.value)
          && value.value.length === 2
          && typeof value.value[0] === 'number'
          && typeof value.value[1] === 'number'
      }

      return typeof value.value === 'number'
    case FieldKind.date:
      if (
        value.operator === DateOperatorKind.lastNDays
        || value.operator === DateOperatorKind.nextNDays
      ) {
        return typeof value.value === 'number'
      }

      if (
        value.operator === DateOperatorKind.between
        || value.operator === DateOperatorKind.notBetween
      ) {
        return Array.isArray(value.value)
          && value.value.length === 2
          && typeof value.value[0] === 'string'
          && value.value[0].length > 0
          && typeof value.value[1] === 'string'
          && value.value[1].length > 0
      }

      return typeof value.value === 'string' && value.value.length > 0
    case FieldKind.multiSelect:
      return Array.isArray(value.value) && value.value.length > 0
    case FieldKind.boolean:
      return typeof value.value === 'boolean'
    default:
      return false
  }
}

function isValueCompatible(
  field: UIFieldForKind<string, EnumFieldKind>,
  operator: string,
  value: unknown,
): boolean {
  if (isEmptyOperator(operator)) {
    return value === null || value === undefined
  }

  if (value === null || value === undefined) {
    return true
  }

  switch (field.kind) {
    case FieldKind.string:
    case FieldKind.select:
      return typeof value === 'string'
    case FieldKind.number:
      if (
        operator === NumberOperatorKind.between
        || operator === NumberOperatorKind.notBetween
      ) {
        return isNumberPair(value)
      }
      return isFiniteNumber(value)
    case FieldKind.date:
      if (
        operator === DateOperatorKind.between
        || operator === DateOperatorKind.notBetween
      ) {
        return isStringPair(value)
      }
      if (
        operator === DateOperatorKind.lastNDays
        || operator === DateOperatorKind.nextNDays
      ) {
        return isFiniteNumber(value)
      }
      return typeof value === 'string'
    case FieldKind.multiSelect:
      return isStringArray(value)
    case FieldKind.boolean:
      return typeof value === 'boolean'
    default:
      return false
  }
}

export function sanitizeFilterBarDraftValue<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  field: UIFieldForKind<FieldId, Kind>,
  input: FilterBarValue<FieldId, Kind>,
): FilterBarValue<FieldId, Kind> | null {
  const allowedOperators = getFieldAllowedOperators(field)
  const operator = allowedOperators.find(candidate => candidate === input.operator)

  if (
    operator === undefined
    || input.fieldId !== field.id
    || input.kind !== field.kind
  ) {
    return null
  }

  if (isEmptyOperator(operator)) {
    return {
      fieldId: field.id,
      kind: field.kind,
      operator,
      allowOperators: allowedOperators,
      value: null,
    } as FilterBarValue<FieldId, Kind>
  }

  if (
    !isValueCompatible(
      field as UIFieldForKind<string, EnumFieldKind>,
      operator,
      input.value,
    )
  ) {
    return null
  }

  return {
    fieldId: field.id,
    kind: field.kind,
    operator,
    allowOperators: allowedOperators,
    value: cloneFilterValue(input.value) as FilterBarValue<FieldId, Kind>['value'],
  } as FilterBarValue<FieldId, Kind>
}

export function sanitizeFilterBarValue<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  field: UIFieldForKind<FieldId, Kind>,
  input: FilterBarValue<FieldId, Kind>,
): FilterBarValue<FieldId, Kind> | null {
  const draftValue = sanitizeFilterBarDraftValue(field, input)

  if (!draftValue) {
    return null
  }

  return isMeaningfulFilterBarValue(
    draftValue as unknown as FilterBarValue<string, EnumFieldKind>,
  )
    ? draftValue
    : null
}

function sanitizeFilterBarValueList<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  uiFields: UIFieldForKind<FieldId, Kind>[],
  input: ReadonlyArray<FilterBarValue<FieldId, Kind>>,
  sanitizeValue: (
    field: UIFieldForKind<FieldId, Kind>,
    entry: FilterBarValue<FieldId, Kind>,
  ) => FilterBarValue<FieldId, Kind> | null,
) {
  const fieldMap = new Map(uiFields.map(field => [field.id, field] as const))
  const nextValues: FilterBarValueType<FieldId, Kind> = []

  for (const entry of input) {
    const field = fieldMap.get(entry.fieldId)

    if (!field) {
      continue
    }

    const sanitizedValue = sanitizeValue(
      field as UIFieldForKind<FieldId, Kind>,
      entry as FilterBarValue<FieldId, Kind>,
    )

    if (!sanitizedValue) {
      continue
    }

    const existingIndex = nextValues.findIndex(value => value.fieldId === sanitizedValue.fieldId)

    if (existingIndex === -1) {
      nextValues.push(sanitizedValue as FilterBarValueType<FieldId, Kind>[number])
      continue
    }

    nextValues[existingIndex] = sanitizedValue as FilterBarValueType<FieldId, Kind>[number]
  }

  return nextValues
}

export function sanitizeFilterBarValues<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  fields: FieldDefinition<FieldId, Kind>[] | UIFieldForKind<FieldId, Kind>[],
  input: ReadonlyArray<FilterBarValue<FieldId, Kind>> | null | undefined,
): FilterBarValueType<FieldId, Kind> {
  if (!input?.length) {
    return []
  }

  const uiFields = isUIFieldArray(fields) ? fields : resolveFilterBarFields(fields).uiFields

  return sanitizeFilterBarValueList(uiFields, input, sanitizeFilterBarValue)
}

export function sanitizeFilterBarDraftValues<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  fields: FieldDefinition<FieldId, Kind>[] | UIFieldForKind<FieldId, Kind>[],
  input: ReadonlyArray<FilterBarValue<FieldId, Kind>> | null | undefined,
): FilterBarValueType<FieldId, Kind> {
  if (!input?.length) {
    return []
  }

  const uiFields = isUIFieldArray(fields) ? fields : resolveFilterBarFields(fields).uiFields

  return sanitizeFilterBarValueList(uiFields, input, sanitizeFilterBarDraftValue)
}
