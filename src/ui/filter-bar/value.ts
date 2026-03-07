import { FieldKind, type EnumFieldKind } from "@/logical/field";
import {
  DateOperatorKind,
  EmptyOperatorKind,
  NumberOperatorKind,
  type OperatorKindFor,
} from "@/logical/operator";
import type { FieldDefinition } from "@/ui/builder";
import { getUIFieldFromBuilder, isFieldGroupDefinition } from "@/ui/builder";
import type { FilterBarValue, FilterBarValueType } from "@/ui/filter-bar/context";
import type { UIFieldEntry, UIFieldForKind } from "@/ui/types";

export interface ResolvedFilterBarFields<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  uiFieldEntries: UIFieldEntry<FieldId, Kind>[];
  uiFields: UIFieldForKind<FieldId, Kind>[];
}

export type FilterBarQueryStatePrimitive = string | number | boolean | string[] | null;
export type FilterBarQueryState = Record<string, FilterBarQueryStatePrimitive | undefined>;
export type SerializedFilterBarValue = Record<string, FilterBarQueryStatePrimitive>;

export interface FilterBarQueryKeys {
  value: string;
  operator: string;
  from: string;
  to: string;
}

const EMPTY_OPERATORS = new Set<string>([
  EmptyOperatorKind.isEmpty,
  EmptyOperatorKind.isNotEmpty,
]);

function isUIFieldArray<FieldId extends string, Kind extends EnumFieldKind>(
  fields: FieldDefinition<FieldId, Kind>[] | UIFieldForKind<FieldId, Kind>[],
): fields is UIFieldForKind<FieldId, Kind>[] {
  const firstField = fields[0];
  return firstField !== undefined && "kind" in firstField;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringPair(value: unknown): value is [string, string] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "string" &&
    typeof value[1] === "string"
  );
}

function isNumberPair(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    isFiniteNumber(value[0]) &&
    isFiniteNumber(value[1])
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function cloneFilterValue(value: FilterBarValue<string, EnumFieldKind>["value"]) {
  if (Array.isArray(value)) {
    return [...value];
  }

  return value;
}

export function getFieldAllowedOperators<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(field: UIFieldForKind<FieldId, Kind>): OperatorKindFor<Kind>[] {
  if (field.fixedOperator !== undefined) {
    return [field.fixedOperator] as OperatorKindFor<Kind>[];
  }

  return [...field.allowedOperators] as OperatorKindFor<Kind>[];
}

export function hasFieldFixedOperator<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(field: UIFieldForKind<FieldId, Kind>) {
  return field.fixedOperator !== undefined;
}

function isValueCompatible(
  field: UIFieldForKind<string, EnumFieldKind>,
  operator: string,
  value: unknown,
): boolean {
  if (EMPTY_OPERATORS.has(operator)) {
    return value === null || value === undefined;
  }

  switch (field.kind) {
    case FieldKind.string:
    case FieldKind.select:
      return typeof value === "string";
    case FieldKind.number:
      if (
        operator === NumberOperatorKind.between ||
        operator === NumberOperatorKind.notBetween
      ) {
        return isNumberPair(value);
      }
      return isFiniteNumber(value);
    case FieldKind.date:
      if (
        operator === DateOperatorKind.between ||
        operator === DateOperatorKind.notBetween
      ) {
        return isStringPair(value);
      }
      if (
        operator === DateOperatorKind.lastNDays ||
        operator === DateOperatorKind.nextNDays
      ) {
        return isFiniteNumber(value);
      }
      return typeof value === "string";
    case FieldKind.multiSelect:
      return isStringArray(value);
    case FieldKind.boolean:
      return typeof value === "boolean";
    default:
      return false;
  }
}

function resolveFieldValue(
  field: UIFieldForKind<string, EnumFieldKind>,
  operator: string,
  value: FilterBarQueryStatePrimitive | undefined,
  rangeStart: FilterBarQueryStatePrimitive | undefined,
  rangeEnd: FilterBarQueryStatePrimitive | undefined,
) {
  if (EMPTY_OPERATORS.has(operator)) {
    return null;
  }

  switch (field.kind) {
    case FieldKind.string:
    case FieldKind.select:
      return typeof value === "string" ? value : null;
    case FieldKind.number:
      if (
        operator === NumberOperatorKind.between ||
        operator === NumberOperatorKind.notBetween
      ) {
        return isFiniteNumber(rangeStart) && isFiniteNumber(rangeEnd)
          ? [rangeStart, rangeEnd]
          : null;
      }
      return isFiniteNumber(value) ? value : null;
    case FieldKind.date:
      if (
        operator === DateOperatorKind.between ||
        operator === DateOperatorKind.notBetween
      ) {
        return typeof rangeStart === "string" && typeof rangeEnd === "string"
          ? [rangeStart, rangeEnd]
          : null;
      }
      if (
        operator === DateOperatorKind.lastNDays ||
        operator === DateOperatorKind.nextNDays
      ) {
        return isFiniteNumber(value) ? value : null;
      }
      return typeof value === "string" ? value : null;
    case FieldKind.multiSelect:
      return isStringArray(value) ? value : null;
    case FieldKind.boolean:
      return typeof value === "boolean" ? value : null;
    default:
      return null;
  }
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
        fields: field.fields.map((groupField) => getUIFieldFromBuilder(groupField)),
      };
    }

    return getUIFieldFromBuilder(field);
  }) as UIFieldEntry<FieldId, Kind>[];
  const uiFields = uiFieldEntries.flatMap((entry) =>
    "fields" in entry ? entry.fields : [entry],
  );

  return {
    uiFieldEntries,
    uiFields,
  };
}

export function isEmptyOperator(operator: string) {
  return EMPTY_OPERATORS.has(operator);
}

export function getFilterBarQueryKeys(fieldId: string, prefix = ""): FilterBarQueryKeys {
  const baseKey = `${prefix}${fieldId}`;

  return {
    value: baseKey,
    operator: `${baseKey}Op`,
    from: `${baseKey}From`,
    to: `${baseKey}To`,
  };
}

export function isFilterBarValueEqual(
  left: FilterBarValue<string, EnumFieldKind>,
  right: FilterBarValue<string, EnumFieldKind>,
) {
  if (
    left.fieldId !== right.fieldId ||
    left.kind !== right.kind ||
    left.operator !== right.operator ||
    left.allowOperators.length !== right.allowOperators.length
  ) {
    return false;
  }

  for (let index = 0; index < left.allowOperators.length; index += 1) {
    if (left.allowOperators[index] !== right.allowOperators[index]) {
      return false;
    }
  }

  if (Array.isArray(left.value) || Array.isArray(right.value)) {
    if (!Array.isArray(left.value) || !Array.isArray(right.value)) {
      return false;
    }

    const leftArray = left.value as readonly unknown[];
    const rightArray = right.value as readonly unknown[];

    if (leftArray.length !== rightArray.length) {
      return false;
    }

    return leftArray.every((entry, index) => entry === rightArray[index]);
  }

  return left.value === right.value;
}

export function areFilterBarValuesEqual<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  left: FilterBarValueType<FieldId, Kind>,
  right: FilterBarValueType<FieldId, Kind>,
) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((entry, index) => {
    const nextEntry = right[index];
    return (
      nextEntry !== undefined &&
      isFilterBarValueEqual(
        entry as FilterBarValue<string, EnumFieldKind>,
        nextEntry as FilterBarValue<string, EnumFieldKind>,
      )
    );
  });
}

export function sanitizeFilterBarValue<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  field: UIFieldForKind<FieldId, Kind>,
  input: FilterBarValue<FieldId, Kind>,
): FilterBarValue<FieldId, Kind> | null {
  const allowedOperators = getFieldAllowedOperators(field);
  const operator = allowedOperators.find((candidate) => candidate === input.operator);

  if (
    operator === undefined ||
    input.fieldId !== field.id ||
    input.kind !== field.kind
  ) {
    return null;
  }

  if (isEmptyOperator(operator)) {
    return {
      fieldId: field.id,
      kind: field.kind,
      operator,
      allowOperators: allowedOperators,
      value: null,
    } as FilterBarValue<FieldId, Kind>;
  }

  if (
    !isValueCompatible(
      field as UIFieldForKind<string, EnumFieldKind>,
      operator,
      input.value,
    )
  ) {
    return null;
  }

  return {
    fieldId: field.id,
    kind: field.kind,
    operator,
    allowOperators: allowedOperators,
    value: cloneFilterValue(input.value) as FilterBarValue<FieldId, Kind>["value"],
  } as FilterBarValue<FieldId, Kind>;
}

export function sanitizeFilterBarValues<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  fields: FieldDefinition<FieldId, Kind>[] | UIFieldForKind<FieldId, Kind>[],
  input: ReadonlyArray<FilterBarValue<FieldId, Kind>> | null | undefined,
): FilterBarValueType<FieldId, Kind> {
  if (!input?.length) {
    return [];
  }

  const uiFields = isUIFieldArray(fields) ? fields : resolveFilterBarFields(fields).uiFields;
  const fieldMap = new Map(uiFields.map((field) => [field.id, field] as const));
  const nextValues: FilterBarValueType<FieldId, Kind> = [];

  for (const entry of input) {
    const field = fieldMap.get(entry.fieldId);

    if (!field) {
      continue;
    }

    const sanitizedValue = sanitizeFilterBarValue(
      field as UIFieldForKind<FieldId, Kind>,
      entry as FilterBarValue<FieldId, Kind>,
    );

    if (!sanitizedValue) {
      continue;
    }

    const existingIndex = nextValues.findIndex((value) => value.fieldId === sanitizedValue.fieldId);

    if (existingIndex === -1) {
      nextValues.push(sanitizedValue as FilterBarValueType<FieldId, Kind>[number]);
      continue;
    }

    nextValues[existingIndex] = sanitizedValue as FilterBarValueType<FieldId, Kind>[number];
  }

  return nextValues;
}

export function serializeFilterBarValue<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  field: UIFieldForKind<FieldId, Kind>,
  input: FilterBarValue<FieldId, Kind> | null | undefined,
  { prefix = "" }: { prefix?: string } = {},
): SerializedFilterBarValue {
  const keys = getFilterBarQueryKeys(field.id, prefix);
  const hasFixedOperator = hasFieldFixedOperator(field);
  const serialized: SerializedFilterBarValue = {
    [keys.value]: null,
    [keys.from]: null,
    [keys.to]: null,
  };
  serialized[keys.operator] = null;
  const value = input ? sanitizeFilterBarValue(field, input) : null;

  if (!value) {
    return serialized;
  }

  if (!hasFixedOperator) {
    serialized[keys.operator] = value.operator;
  }

  if (isEmptyOperator(value.operator)) {
    return serialized;
  }

  switch (field.kind) {
    case FieldKind.number:
      if (
        value.operator === NumberOperatorKind.between ||
        value.operator === NumberOperatorKind.notBetween
      ) {
        const rangeValue = value.value as [number, number];
        serialized[keys.from] = rangeValue[0];
        serialized[keys.to] = rangeValue[1];
        return serialized;
      }

      serialized[keys.value] = value.value as number;
      return serialized;
    case FieldKind.date:
      if (
        value.operator === DateOperatorKind.between ||
        value.operator === DateOperatorKind.notBetween
      ) {
        const rangeValue = value.value as [string, string];
        serialized[keys.from] = rangeValue[0];
        serialized[keys.to] = rangeValue[1];
        return serialized;
      }

      serialized[keys.value] = value.value as string | number;
      return serialized;
    default:
      serialized[keys.value] = value.value as FilterBarQueryStatePrimitive;
      return serialized;
  }
}

export function deserializeFilterBarValue<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  field: UIFieldForKind<FieldId, Kind>,
  queryState: FilterBarQueryState,
  { prefix = "" }: { prefix?: string } = {},
): FilterBarValue<FieldId, Kind> | null {
  const keys = getFilterBarQueryKeys(field.id, prefix);
  const operator = field.fixedOperator ?? queryState[keys.operator];

  if (typeof operator !== "string") {
    return null;
  }

  const parsedValue = resolveFieldValue(
    field as UIFieldForKind<string, EnumFieldKind>,
    operator,
    queryState[keys.value],
    queryState[keys.from],
    queryState[keys.to],
  );

  return sanitizeFilterBarValue(field, {
    fieldId: field.id,
    kind: field.kind,
    operator: operator as FilterBarValue<FieldId, Kind>["operator"],
    allowOperators: getFieldAllowedOperators(field) as FilterBarValue<FieldId, Kind>["allowOperators"],
    value: parsedValue as FilterBarValue<FieldId, Kind>["value"],
  } as FilterBarValue<FieldId, Kind>);
}
