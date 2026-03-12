import type { SetStateAction } from 'react'
import { createContext, useContext } from 'react'

import type { FilterBarChangeMeta } from '@/filter-bar/change'
import type { UIFieldEntry, UIFieldForKind } from '@/filter-bar/types'
import type { EnumFieldKind, OperatorKindFor, OperatorValueFor } from '@/logical'

export interface FilterBarValue<
  FieldId extends string,
  Kind extends EnumFieldKind,
  Op extends OperatorKindFor<Kind> = OperatorKindFor<Kind>,
> {
  fieldId: FieldId
  kind: Kind
  operator: Op
  allowOperators: Op[]
  value: OperatorValueFor<Kind, Op> | null
}

export type FilterBarValueType<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> = Array<Kind extends EnumFieldKind ? FilterBarValue<FieldId, Kind> : never>

export interface FilterBarSavedView<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  id: string
  name: string
  values: FilterBarValueType<FieldId, Kind>
  createdAt: string
  updatedAt: string
}

export type FilterBarSavedViewType<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> = Array<FilterBarSavedView<FieldId, Kind>>

export interface FilterBarContextType<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  uiFieldEntries: UIFieldEntry<FieldId, Kind>[]
  uiFields: UIFieldForKind<FieldId, Kind>[]
  values: FilterBarValueType<FieldId, Kind>
  draftValues: FilterBarValueType<FieldId, Kind>
  savedViews: FilterBarSavedViewType<FieldId, Kind>
  activeView: FilterBarSavedView<FieldId, Kind> | null
  dismissedSuggestionFieldIds: FieldId[]
  changeValues: ((
    nextState: SetStateAction<FilterBarValueType<FieldId, Kind>>,
    meta: FilterBarChangeMeta<FieldId>,
  ) => void) | null
  changeDraftValues: ((
    nextState: SetStateAction<FilterBarValueType<FieldId, Kind>>,
  ) => void) | null
  changeDismissedSuggestionFieldIds: ((
    nextState: SetStateAction<FieldId[]>,
  ) => void) | null
  saveView: ((name: string) => FilterBarSavedView<FieldId, Kind> | null) | null
  applyView: ((viewId: string) => void) | null
  deleteView: ((viewId: string) => void) | null
  clearActiveView: (() => void) | null
}

const FilterBarContext = createContext<FilterBarContextType>({
  uiFieldEntries: [],
  uiFields: [],
  values: [],
  draftValues: [],
  savedViews: [],
  activeView: null,
  dismissedSuggestionFieldIds: [],
  changeValues: null,
  changeDraftValues: null,
  changeDismissedSuggestionFieldIds: null,
  saveView: null,
  applyView: null,
  deleteView: null,
  clearActiveView: null,
})

export const useFilterBar = () => useContext(FilterBarContext)
export const FilterBarContextProvider = FilterBarContext.Provider
