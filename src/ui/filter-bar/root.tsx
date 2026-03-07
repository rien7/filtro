import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { type EnumFieldKind } from "@/logical/field";
import type { FieldDefinition } from "@/ui/builder";
import {
  FilterBarContextProvider,
  type FilterBarContextType,
  type FilterBarValueType,
} from "@/ui/filter-bar/context";
import {
  areFilterBarValuesEqual,
  resolveFilterBarFields,
  sanitizeFilterBarValues,
} from "@/ui/filter-bar/value";
import {
  FilterBarThemeProvider,
  type FilterBarThemeInput,
} from "@/ui/filter-bar/theme";

export interface FilterBarRootProps<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  fields: FieldDefinition<FieldId, Kind>[];
  children?: ReactNode;
  iconMapping?: boolean | Partial<Record<EnumFieldKind, ReactNode>>;
  theme?: FilterBarThemeInput | null;
  value?: FilterBarValueType<FieldId, Kind>;
  defaultValue?: FilterBarValueType<FieldId, Kind>;
  onValueChange?: (nextValue: FilterBarValueType<FieldId, Kind>) => void;
}

export function FilterBarRoot<FieldId extends string, Kind extends EnumFieldKind>({
  fields,
  children,
  theme,
  value,
  defaultValue,
  onValueChange,
}: FilterBarRootProps<FieldId, Kind>) {
  const { uiFieldEntries, uiFields } = useMemo(
    () => resolveFilterBarFields(fields),
    [fields],
  );
  const [uncontrolledValues, setUncontrolledValues] = useState<FilterBarValueType<FieldId, Kind>>(
    () => sanitizeFilterBarValues(uiFields, defaultValue ?? []),
  );
  const isControlled = value !== undefined;
  const controlledValues = useMemo(
    () => sanitizeFilterBarValues(uiFields, value ?? []),
    [uiFields, value],
  );
  const values = isControlled ? controlledValues : uncontrolledValues;

  useEffect(() => {
    if (isControlled) {
      return;
    }

    setUncontrolledValues((previous) => {
      const sanitizedValues = sanitizeFilterBarValues(uiFields, previous);
      return areFilterBarValuesEqual(previous, sanitizedValues) ? previous : sanitizedValues;
    });
  }, [isControlled, uiFields]);

  const setValues = useCallback<Dispatch<SetStateAction<FilterBarValueType<FieldId, Kind>>>>(
    (nextState) => {
      if (isControlled) {
        const resolvedValue =
          typeof nextState === "function" ? nextState(controlledValues) : nextState;
        const sanitizedValues = sanitizeFilterBarValues(uiFields, resolvedValue);

        if (!onValueChange || areFilterBarValuesEqual(controlledValues, sanitizedValues)) {
          return;
        }

        onValueChange(sanitizedValues);
        return;
      }

      setUncontrolledValues((previous) => {
        const resolvedValue =
          typeof nextState === "function" ? nextState(previous) : nextState;
        const sanitizedValues = sanitizeFilterBarValues(uiFields, resolvedValue);

        if (areFilterBarValuesEqual(previous, sanitizedValues)) {
          return previous;
        }

        onValueChange?.(sanitizedValues);
        return sanitizedValues;
      });
    },
    [controlledValues, isControlled, onValueChange, uiFields],
  );

  return (
    <FilterBarThemeProvider theme={theme}>
      <FilterBarContextProvider
        value={{
          uiFieldEntries,
          uiFields,
          values,
          setValues,
        } as unknown as FilterBarContextType}
      >
        {children}
      </FilterBarContextProvider>
    </FilterBarThemeProvider>
  );
}
