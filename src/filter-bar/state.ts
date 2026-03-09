import { FieldKind, type EnumFieldKind } from "@/logical/field";
import {
  DateOperatorKind,
  NumberOperatorKind,
  type OperatorKindFor,
} from "@/logical/operator";
import type { FilterBarCompleteness } from "@/filter-bar/change";
import type { FilterBarValue, FilterBarValueType } from "@/filter-bar/context";
import {
  getFieldAllowedOperators,
  getFieldDefaultOperator,
  isEmptyOperator,
} from "@/filter-bar/value";
import type {
  FlattenedSelectOption,
  SelectKind,
  SelectOption,
  SelectUIField,
  UIFieldForKind,
} from "@/filter-bar/types";

export interface FilterBarValueSeed<Kind extends EnumFieldKind = EnumFieldKind> {
  operator?: OperatorKindFor<Kind>;
  value?: FilterBarValue<string, Kind>["value"];
}

export function flattenSelectOptions(
  options: SelectOption[],
  path: string[] = [],
): FlattenedSelectOption[] {
  return options.flatMap((option) => {
    const nextPath = [...path, option.label];
    if (!option.children?.length) {
      const { children: _children, ...resolvedOption } = option;
      return [{ ...resolvedOption, label: nextPath.join(" / ") }];
    }

    return flattenSelectOptions(option.children, nextPath);
  });
}

export function isStaticSelectField<FieldId extends string, Kind extends SelectKind>(
  field: SelectUIField<FieldId, Kind>,
): field is SelectUIField<FieldId, Kind> & { options: SelectOption[] } {
  return Array.isArray(field.options);
}

export function normalizeValueForOperator<FieldId extends string, Kind extends EnumFieldKind>({
  field,
  operator,
  previousValue,
}: {
  field: UIFieldForKind<FieldId, Kind>;
  operator: OperatorKindFor<Kind>;
  previousValue: FilterBarValue<FieldId, Kind>["value"];
}) {
  if (isEmptyOperator(operator)) {
    return null;
  }

  switch (field.kind) {
    case FieldKind.string:
      return typeof previousValue === "string" ? previousValue : "";
    case FieldKind.number:
      if (operator === NumberOperatorKind.between || operator === NumberOperatorKind.notBetween) {
        return Array.isArray(previousValue) ? previousValue : null;
      }
      return typeof previousValue === "number" ? previousValue : null;
    case FieldKind.date:
      if (operator === DateOperatorKind.lastNDays || operator === DateOperatorKind.nextNDays) {
        return typeof previousValue === "number" ? previousValue : null;
      }
      if (operator === DateOperatorKind.between || operator === DateOperatorKind.notBetween) {
        return Array.isArray(previousValue)
          ? previousValue
          : null;
      }
      return typeof previousValue === "string" ? previousValue : null;
    case FieldKind.select: {
      if (Array.isArray(previousValue)) return previousValue[0] ?? null;
      return typeof previousValue === "string" ? previousValue : null;
    }
    case FieldKind.multiSelect: {
      if (Array.isArray(previousValue)) return previousValue;
      if (typeof previousValue === "string") return [previousValue];
      return [];
    }
    case FieldKind.boolean:
      return typeof previousValue === "boolean" ? previousValue : null;
    default:
      return previousValue;
  }
}

export function createFilterBarValue<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  field: UIFieldForKind<FieldId, Kind>,
  seed?: FilterBarValueSeed<Kind>,
) {
  const allowedOperators = getFieldAllowedOperators(field);
  const operator = seed?.operator && allowedOperators.includes(seed.operator)
    ? seed.operator
    : getFieldDefaultOperator(field);

  if (operator === undefined) {
    return null;
  }

  return {
    fieldId: field.id,
    kind: field.kind,
    operator,
    allowOperators: allowedOperators,
    value: normalizeValueForOperator({
      field: field as UIFieldForKind<FieldId, typeof field.kind>,
      operator: operator as OperatorKindFor<typeof field.kind>,
      previousValue: (seed?.value ?? null) as FilterBarValue<FieldId, typeof field.kind>["value"],
    }),
  } as FilterBarValue<FieldId, typeof field.kind>;
}

export function getFilterBarValueCompleteness(
  value: FilterBarValue<string, EnumFieldKind>,
): FilterBarCompleteness {
  if (isEmptyOperator(value.operator)) {
    return "complete";
  }

  switch (value.kind) {
    case FieldKind.string:
    case FieldKind.select:
      return typeof value.value === "string" && value.value.length > 0
        ? "complete"
        : "incomplete";
    case FieldKind.number:
      if (
        value.operator === NumberOperatorKind.between ||
        value.operator === NumberOperatorKind.notBetween
      ) {
        return Array.isArray(value.value) &&
          value.value.length === 2 &&
          typeof value.value[0] === "number" &&
          typeof value.value[1] === "number"
          ? "complete"
          : "incomplete";
      }

      return typeof value.value === "number" ? "complete" : "incomplete";
    case FieldKind.date:
      if (
        value.operator === DateOperatorKind.lastNDays ||
        value.operator === DateOperatorKind.nextNDays
      ) {
        return typeof value.value === "number" ? "complete" : "incomplete";
      }

      if (
        value.operator === DateOperatorKind.between ||
        value.operator === DateOperatorKind.notBetween
      ) {
        return Array.isArray(value.value) &&
          value.value.length === 2 &&
          typeof value.value[0] === "string" &&
          value.value[0].length > 0 &&
          typeof value.value[1] === "string" &&
          value.value[1].length > 0
          ? "complete"
          : "incomplete";
      }

      return typeof value.value === "string" && value.value.length > 0
        ? "complete"
        : "incomplete";
    case FieldKind.multiSelect:
      return Array.isArray(value.value) && value.value.length > 0
        ? "complete"
        : "incomplete";
    case FieldKind.boolean:
      return typeof value.value === "boolean" ? "complete" : "incomplete";
    default:
      return "incomplete";
  }
}

export function upsertFilterBarValue<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  values: FilterBarValueType<FieldId, Kind>,
  nextValue: FilterBarValueType<FieldId, Kind>[number],
) {
  const currentIndex = values.findIndex((value) => value.fieldId === nextValue.fieldId);

  if (currentIndex === -1) {
    return [...values, nextValue];
  }

  const nextValues = [...values];
  nextValues[currentIndex] = nextValue;
  return nextValues;
}

export function removeFilterBarValue<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  values: FilterBarValueType<FieldId, Kind>,
  fieldId: string,
) {
  const nextValues = values.filter((value) => value.fieldId !== fieldId);
  return nextValues.length === values.length ? values : nextValues;
}

export { isEmptyOperator };
