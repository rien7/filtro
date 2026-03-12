import type { FilterBarValue, FilterBarValueType } from '@/filter-bar/context'
import type { EnumFieldKind } from '@/logical/field'

export function isFilterBarValueEqual(
  left: FilterBarValue<string, EnumFieldKind>,
  right: FilterBarValue<string, EnumFieldKind>,
) {
  if (
    left.fieldId !== right.fieldId
    || left.kind !== right.kind
    || left.operator !== right.operator
    || left.allowOperators.length !== right.allowOperators.length
  ) {
    return false
  }

  for (let index = 0; index < left.allowOperators.length; index += 1) {
    if (left.allowOperators[index] !== right.allowOperators[index]) {
      return false
    }
  }

  if (Array.isArray(left.value) || Array.isArray(right.value)) {
    if (!Array.isArray(left.value) || !Array.isArray(right.value)) {
      return false
    }

    const leftArray = left.value as readonly unknown[]
    const rightArray = right.value as readonly unknown[]

    if (leftArray.length !== rightArray.length) {
      return false
    }

    return leftArray.every((entry, index) => entry === rightArray[index])
  }

  return left.value === right.value
}

export function areFilterBarValuesEqual<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  left: FilterBarValueType<FieldId, Kind>,
  right: FilterBarValueType<FieldId, Kind>,
) {
  if (left.length !== right.length) {
    return false
  }

  return left.every((entry, index) => {
    const nextEntry = right[index]
    return (
      nextEntry !== undefined
      && isFilterBarValueEqual(
        entry as FilterBarValue<string, EnumFieldKind>,
        nextEntry as FilterBarValue<string, EnumFieldKind>,
      )
    )
  })
}
