import { FilterBarRoot } from "./root";
import { FilterItems } from "./items";
import { FilterBarTrigger } from "./trigger";
import { FilterBarClear } from "@/ui/filter-bar/clear";
import { FilterBarSaveView } from "./save-view";
import { FilterBarThemeProvider } from "./theme";
import { FilterBarViews } from "./views";

export const FilterBar = Object.assign({}, {
  Root: FilterBarRoot,
  Items: FilterItems,
  Trigger: FilterBarTrigger,
  Clear: FilterBarClear,
  SaveView: FilterBarSaveView,
  Views: FilterBarViews,
  ThemeProvider: FilterBarThemeProvider,
});

export { FilterBarRoot } from "./root";
export { FilterItems } from "./items";
export { FilterBarTrigger } from "./trigger";
export { FilterBarSaveView } from "./save-view";
export { FilterBarViews } from "./views";
export {
  defaultFilterBarTheme,
  headlessFilterBarTheme,
  FilterBarThemeProvider,
  mergeFilterBarTheme,
  useFilterBarTheme,
} from "./theme";
export type {
  FilterBarContextType,
  FilterBarSavedView,
  FilterBarSavedViewType,
  FilterBarValue,
  FilterBarValueType,
} from "./context";
export type {
  FilterBarTheme,
  FilterBarThemeClassNameSlot,
  FilterBarThemeIcons,
  FilterBarThemeInput,
  FilterBarThemeTexts,
} from "./theme";
export {
  FilterBarContextProvider,
  useFilterBar,
} from "./context";
export {
  areFilterBarValuesEqual,
  deserializeFilterBarValue,
  getFilterBarQueryKeys,
  isEmptyOperator,
  isFilterBarValueEqual,
  resolveFilterBarFields,
  sanitizeFilterBarValue,
  sanitizeFilterBarValues,
  serializeFilterBarValue,
} from "./value";
export type {
  FilterBarQueryKeys,
  FilterBarQueryState,
  FilterBarQueryStatePrimitive,
  ResolvedFilterBarFields,
  SerializedFilterBarValue,
} from "./value";
