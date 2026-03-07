import { FilterBarRoot } from "./root";
import { FilterItems } from "./items";
import { FilterBarTrigger } from "./trigger";
import { FilterBarClear } from "@/ui/filter-bar/clear";
import { FilterBarThemeProvider } from "./theme";

export const FilterBar = Object.assign({}, {
  Root: FilterBarRoot,
  Items: FilterItems,
  Trigger: FilterBarTrigger,
  Clear: FilterBarClear,
  ThemeProvider: FilterBarThemeProvider,
});

export { FilterBarRoot } from "./root";
export { FilterItems } from "./items";
export { FilterBarTrigger } from "./trigger";
export {
  defaultFilterBarTheme,
  headlessFilterBarTheme,
  FilterBarThemeProvider,
  mergeFilterBarTheme,
  useFilterBarTheme,
} from "./theme";
export type {
  FilterBarContextType,
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
