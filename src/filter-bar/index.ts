import { FilterBarClear } from './components/clear'
import { FilterBarContent } from './components/content'
import { FilterBarActiveItems } from './components/items/active-items'
import { FilterBarPinnedItems } from './components/items/pinned-items'
import { FilterBarSuggestedItems } from './components/items/suggested-items'
import { FilterBarRoot } from './components/root'
import { FilterBarSaveView } from './components/save-view'
import { FilterBarTrigger } from './components/trigger'
import { FilterBarViews } from './components/views'
import { FilterBarThemeProvider, headlessFilterBarTheme } from './theme'

export const FilterBar = {...{
  Root: FilterBarRoot,
  Content: FilterBarContent,
  PinnedItems: FilterBarPinnedItems,
  SuggestedItems: FilterBarSuggestedItems,
  ActiveItems: FilterBarActiveItems,
  Trigger: FilterBarTrigger,
  Clear: FilterBarClear,
  SaveView: FilterBarSaveView,
  Views: FilterBarViews,
  ThemeProvider: FilterBarThemeProvider,
  headlessTheme: headlessFilterBarTheme,
}}

export {
  filterRootToValues,
  valuesToFilterRoot,
} from './ast'
export {
  type AnyFieldBuilder,
  type BaseFieldBuilder,
  type BooleanFieldBuilder,
  type FieldBuilder,
  type FieldDefinition,
  type FieldGroupDefinition,
  filtro,
  type SelectFieldBuilder,
} from './builder'
export type {
  FilterBarApplyMeta,
  FilterBarApplyMode,
  FilterBarChangeMeta,
  FilterBarCompleteness,
  FilterBarValueChangeKind,
} from './change'
export { FilterBarContent } from './components/content'
export { FilterBarActiveItems } from './components/items/active-items'
export { FilterBarPinnedItems } from './components/items/pinned-items'
export { FilterBarSuggestedItems } from './components/items/suggested-items'
export { FilterBarRoot } from './components/root'
export { FilterBarSaveView } from './components/save-view'
export { FilterBarTrigger } from './components/trigger'
export { FilterBarViews } from './components/views'
export type {
  FilterBarContextType,
  FilterBarSavedView,
  FilterBarSavedViewType,
  FilterBarValue,
  FilterBarValueType,
} from './context'
export {
  FilterBarContextProvider,
  useFilterBar,
} from './context'
export type {
  FilterBarController,
  UseFilterBarControllerOptions,
} from './controller'
export { useFilterBarController } from './controller'
export { type FieldGroup, groupField } from './group'
export type {
  FilterBarPrimitiveClassNameSlot,
  FilterBarTheme,
  FilterBarThemeClassNameSlot,
  FilterBarThemeIcons,
  FilterBarThemeInput,
  FilterBarThemeTexts,
} from './theme'
export {
  FilterBarThemeProvider,
  getFilterBarPrimitiveDataSlot,
  headlessFilterBarTheme,
  mergeFilterBarTheme,
  useFilterBarPrimitiveClassName,
  useFilterBarTheme,
} from './theme'
export * from './types'
export type {
  FilterBarQueryKeys,
  FilterBarQueryState,
  FilterBarQueryStatePrimitive,
  ResolvedFilterBarFields,
  SerializedFilterBarValue,
} from './value'
export {
  areFilterBarValuesEqual,
  deserializeFilterBarValue,
  getFilterBarQueryKeys,
  isEmptyOperator,
  isFilterBarValueEqual,
  resolveFilterBarFields,
  sanitizeFilterBarDraftValue,
  sanitizeFilterBarDraftValues,
  sanitizeFilterBarValue,
  sanitizeFilterBarValues,
  serializeFilterBarValue,
} from './value'
