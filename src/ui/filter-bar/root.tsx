import { useState, type ReactNode } from "react";
import { type EnumFieldKind } from "@/logical/field";
import type { FieldBuilder } from "@/ui/builder";
import { getUIFieldFromBuilder } from "@/ui/builder";
import {
  FilterBarContextProvider,
  type FilterBarValueType,
} from "@/ui/filter-bar/context";

interface FilterBarRootProps<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  fields: FieldBuilder<FieldId, Kind>[];
  children?: ReactNode;
  iconMapping?: boolean | Partial<Record<EnumFieldKind, ReactNode>>;
}

export function FilterBarRoot<FieldId extends string, Kind extends EnumFieldKind>({
  fields,
  children,
}: FilterBarRootProps<FieldId, Kind>) {
  const uiFields = fields.map((field) => getUIFieldFromBuilder(field));
  const [values, setValues] = useState<FilterBarValueType>([])
  return (
    <FilterBarContextProvider value={{
      uiFields,
      values,
      setValues
    }}>
      {children}
    </FilterBarContextProvider>
  );
}
