import type { EnumFieldKind, OperatorKindFor, OperatorValueFor } from "@/logical";
import type { UIFieldEntry, UIFieldForKind } from "@/ui/types";
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

export interface FilterBarSavedView<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  id: string,
  name: string,
  values: FilterBarValueType<FieldId, Kind>,
  createdAt: string,
  updatedAt: string,
}

export type FilterBarSavedViewType<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> = Array<FilterBarSavedView<FieldId, Kind>>

export interface FilterBarContextType<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind
> {
  uiFieldEntries: UIFieldEntry<FieldId, Kind>[],
  uiFields: UIFieldForKind<FieldId, Kind>[],
  values: FilterBarValueType<FieldId, Kind>,
  savedViews: FilterBarSavedViewType<FieldId, Kind>,
  activeView: FilterBarSavedView<FieldId, Kind> | null,
  setValues: Dispatch<SetStateAction<FilterBarValueType<FieldId, Kind>>> | null,
  saveView: ((name: string) => FilterBarSavedView<FieldId, Kind> | null) | null,
  applyView: ((viewId: string) => void) | null,
  deleteView: ((viewId: string) => void) | null,
  clearActiveView: (() => void) | null,
}

const FilterBarContext = createContext<FilterBarContextType>({
  uiFieldEntries: [],
  uiFields: [],
  values: [],
  savedViews: [],
  activeView: null,
  setValues: null,
  saveView: null,
  applyView: null,
  deleteView: null,
  clearActiveView: null,
})

export const useFilterBar = () => useContext(FilterBarContext)
export const FilterBarContextProvider = FilterBarContext.Provider
