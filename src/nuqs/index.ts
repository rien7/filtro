import { useCallback, useMemo } from "react";
import { FieldKind, type EnumFieldKind } from "@/logical/field";
import type { FieldDefinition } from "@/ui/builder";
import type { FilterBarValueType } from "@/ui/filter-bar/context";
import {
  areFilterBarValuesEqual,
  deserializeFilterBarValue,
  getFieldAllowedOperators,
  getFilterBarQueryKeys,
  resolveFilterBarFields,
  sanitizeFilterBarValues,
  serializeFilterBarValue,
  type FilterBarQueryState,
} from "@/ui/filter-bar/value";
import {
  type ParserMap,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsFloat,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

export type FilterBarNuqsParsers = ParserMap;

export interface CreateFilterBarNuqsParsersOptions {
  prefix?: string;
}

export interface UseNuqsFilterBarStateOptions<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> extends CreateFilterBarNuqsParsersOptions {
  fields: FieldDefinition<FieldId, Kind>[];
  history?: "push" | "replace";
  shallow?: boolean;
}

export function createFilterBarNuqsParsers<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  fields: FieldDefinition<FieldId, Kind>[],
  { prefix = "" }: CreateFilterBarNuqsParsersOptions = {},
): FilterBarNuqsParsers {
  const { uiFields } = resolveFilterBarFields(fields);
  const parsers: FilterBarNuqsParsers = {};

  for (const field of uiFields) {
    const keys = getFilterBarQueryKeys(field.id, prefix);
    const allowedOperators = getFieldAllowedOperators(field);

    parsers[keys.operator] = parseAsStringLiteral(allowedOperators as readonly string[]);

    switch (field.kind) {
      case FieldKind.boolean:
        parsers[keys.value] = parseAsBoolean;
        break;
      case FieldKind.number:
        parsers[keys.value] = parseAsFloat;
        parsers[keys.from] = parseAsFloat;
        parsers[keys.to] = parseAsFloat;
        break;
      case FieldKind.multiSelect:
        parsers[keys.value] = parseAsArrayOf(parseAsString);
        break;
      case FieldKind.date:
        parsers[keys.value] = parseAsString;
        parsers[keys.from] = parseAsString;
        parsers[keys.to] = parseAsString;
        break;
      default:
        parsers[keys.value] = parseAsString;
        break;
    }
  }

  return parsers;
}

export function useNuqsFilterBarState<
  FieldId extends string,
  Kind extends EnumFieldKind,
>({
  fields,
  prefix = "",
  history = "replace",
  shallow = true,
}: UseNuqsFilterBarStateOptions<FieldId, Kind>) {
  const { uiFields } = useMemo(() => resolveFilterBarFields(fields), [fields]);
  const parsers = useMemo(
    () => createFilterBarNuqsParsers(fields, { prefix }),
    [fields, prefix],
  );
  const [queryState, setQueryState] = useQueryStates(parsers, {
    history,
    shallow,
  });

  const value = useMemo(() => {
    const nextValues = uiFields.flatMap((field) => {
      const nextValue = deserializeFilterBarValue(
        field,
        queryState as FilterBarQueryState,
        { prefix },
      );

      return nextValue ? [nextValue] : [];
    });

    return sanitizeFilterBarValues(uiFields, nextValues);
  }, [prefix, queryState, uiFields]);

  const onValueChange = useCallback(
    (nextValue: FilterBarValueType<FieldId, Kind>) => {
      const sanitizedValues = sanitizeFilterBarValues(uiFields, nextValue);

      if (areFilterBarValuesEqual(value, sanitizedValues)) {
        return;
      }

      const queryUpdate: Record<string, string | number | boolean | string[] | null> = {};

      for (const field of uiFields) {
        Object.assign(queryUpdate, serializeFilterBarValue(field, null, { prefix }));
      }

      for (const item of sanitizedValues) {
        const field = uiFields.find((entry) => entry.id === item.fieldId);

        if (!field) {
          continue;
        }

        Object.assign(
          queryUpdate,
          serializeFilterBarValue(field, item as never, { prefix }),
        );
      }

      void setQueryState(queryUpdate);
    },
    [prefix, setQueryState, uiFields, value],
  );

  return {
    onValueChange,
    value,
  };
}
