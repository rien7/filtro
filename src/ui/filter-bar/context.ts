import type { EnumFieldKind, OperatorKindFor, OperatorValueFor } from "@/logical";
import type { UIFieldForKind } from "@/ui/types";
import { createContext, useContext, type Dispatch, type SetStateAction } from "react";

export interface FilterBarValue<
  FieldId extends string,
  Kind extends EnumFieldKind,
  Op extends OperatorKindFor<Kind> = OperatorKindFor<Kind>
> {
  fieldId: FieldId,
  kind: Kind,
  operator: Op
  allowOperators: Op[]
  value: OperatorValueFor<Kind, Op> | null
}

export type FilterBarValueType<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind
  > = Array<Kind extends EnumFieldKind ? FilterBarValue<FieldId, Kind> : never>

export interface FilterBarContextType<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind
> {
  uiFields: UIFieldForKind<FieldId, Kind>[],
  values: FilterBarValueType,
  setValues: Dispatch<SetStateAction<FilterBarValueType>> | null,
}

const FilterBarContext = createContext<FilterBarContextType>({
  uiFields: [],
  values: [],
  setValues: null
})

export const useFilterBar = () => useContext(FilterBarContext)
export const FilterBarContextProvider = FilterBarContext.Provider
