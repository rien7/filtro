import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
  type ReactNode,
} from "react";

import type { EnumFieldKind } from "@/logical/field";
import { cn } from "@/lib/utils";

export type FilterBarThemeClassNameSlot =
  | "contentRoot"
  | "pinnedItemsRoot"
  | "suggestedItemsRoot"
  | "suggestionButton"
  | "suggestionAdd"
  | "activeItemsRoot"
  | "emptyState"
  | "rowRoot"
  | "row"
  | "rowField"
  | "rowFieldText"
  | "rowOperator"
  | "rowOperatorTrigger"
  | "rowOperatorText"
  | "rowValue"
  | "rowError"
  | "rowRemoveButton"
  | "triggerMenuContent"
  | "triggerMenuSeparator"
  | "triggerGroupLabel"
  | "triggerFieldItem"
  | "triggerSubmenuTrigger"
  | "triggerSubmenuContent"
  | "triggerEmptyItem"
  | "viewsRoot"
  | "viewsList"
  | "viewsButton"
  | "viewsButtonActive"
  | "viewsOverflowTrigger"
  | "viewsMenuContent"
  | "viewsEmptyItem"
  | "viewsItem"
  | "saveViewContent"
  | "saveViewForm"
  | "saveViewInput"
  | "saveViewSubmit"
  | "selectTrigger"
  | "selectContent"
  | "selectItem"
  | "selectSearchInput"
  | "selectSeparator"
  | "editorRoot"
  | "editorFieldset"
  | "editorControl"
  | "editorSplit"
  | "booleanTrueButton"
  | "booleanFalseButton";

export type FilterBarPrimitiveClassNameSlot =
  | "button"
  | "input"
  | "segmentedControl"
  | "segmentedControlIndicator"
  | "segmentedControlItem"
  | "segmentedControlItemText"
  | "selectPositioner"
  | "selectTrigger"
  | "selectTriggerText"
  | "selectIcon"
  | "selectContent"
  | "selectItem"
  | "selectItemIndicator"
  | "selectSearchInput"
  | "selectSeparator"
  | "dropdownMenuPositioner"
  | "dropdownMenuContent"
  | "dropdownMenuLabel"
  | "dropdownMenuItem"
  | "dropdownMenuSubTrigger"
  | "dropdownMenuSubmenuIndicator"
  | "dropdownMenuSubContent"
  | "dropdownMenuCheckboxItem"
  | "dropdownMenuCheckboxItemIndicator"
  | "dropdownMenuRadioItem"
  | "dropdownMenuRadioItemIndicator"
  | "dropdownMenuSeparator"
  | "separator"
  | "switch"
  | "switchThumb"
  | "buttonGroup"
  | "buttonGroupText"
  | "buttonGroupSeparator";

const primitiveDataSlots = {
  button: "button",
  input: "input",
  segmentedControl: "segmented-control",
  segmentedControlIndicator: "segmented-control-indicator",
  segmentedControlItem: "segmented-control-item",
  segmentedControlItemText: "segmented-control-item-text",
  selectPositioner: "select-positioner",
  selectTrigger: "select-trigger",
  selectTriggerText: "select-trigger-text",
  selectIcon: "select-icon",
  selectContent: "select-content",
  selectItem: "select-item",
  selectItemIndicator: "select-item-indicator",
  selectSearchInput: "select-search-input",
  selectSeparator: "select-separator",
  dropdownMenuPositioner: "dropdown-menu-positioner",
  dropdownMenuContent: "dropdown-menu-content",
  dropdownMenuLabel: "dropdown-menu-label",
  dropdownMenuItem: "dropdown-menu-item",
  dropdownMenuSubTrigger: "dropdown-menu-sub-trigger",
  dropdownMenuSubmenuIndicator: "dropdown-menu-submenu-indicator",
  dropdownMenuSubContent: "dropdown-menu-sub-content",
  dropdownMenuCheckboxItem: "dropdown-menu-checkbox-item",
  dropdownMenuCheckboxItemIndicator: "dropdown-menu-checkbox-item-indicator",
  dropdownMenuRadioItem: "dropdown-menu-radio-item",
  dropdownMenuRadioItemIndicator: "dropdown-menu-radio-item-indicator",
  dropdownMenuSeparator: "dropdown-menu-separator",
  separator: "separator",
  switch: "switch",
  switchThumb: "switch-thumb",
  buttonGroup: "button-group",
  buttonGroupText: "button-group-text",
  buttonGroupSeparator: "button-group-separator",
} satisfies Record<FilterBarPrimitiveClassNameSlot, string>;

export interface FilterBarThemeTexts {
  emptyState: string;
  searchFieldsPlaceholder: string;
  searchOptionsPlaceholder: string;
  loadingOptions: string;
  failedToLoadOptions: string;
  noOptions: string;
  noMatchingFields: string;
  noSavedViews: string;
  viewsTriggerFallback: string;
  moreViews: string;
  saveViewTriggerFallback: string;
  exitView: string;
  saveViewNamePlaceholder: string;
  saveViewSubmit: string;
  booleanTrueFallback: string;
  booleanFalseFallback: string;
  removeLabelFallback: string;
}

export interface FilterBarThemeIcons {
  remove?: ReactNode;
  fieldKinds?: Partial<Record<EnumFieldKind, ReactNode>>;
}

export interface FilterBarTheme {
  classNames: Partial<Record<FilterBarThemeClassNameSlot, string>>;
  primitiveClassNames: Partial<Record<FilterBarPrimitiveClassNameSlot, string>>;
  texts: FilterBarThemeTexts;
  icons: FilterBarThemeIcons;
}

export type FilterBarThemeInput = Partial<
  Omit<FilterBarTheme, "texts" | "icons" | "classNames">
> & {
  classNames?: Partial<Record<FilterBarThemeClassNameSlot, string>>;
  primitiveClassNames?: Partial<Record<FilterBarPrimitiveClassNameSlot, string>>;
  texts?: Partial<FilterBarThemeTexts>;
  icons?: Partial<FilterBarThemeIcons> & {
    fieldKinds?: Partial<Record<EnumFieldKind, ReactNode>>;
  };
};

const defaultTexts: FilterBarThemeTexts = {
  emptyState: "Add a filter to start building conditions.",
  searchFieldsPlaceholder: "Search fields...",
  searchOptionsPlaceholder: "Search options...",
  loadingOptions: "Loading options...",
  failedToLoadOptions: "Failed to load options",
  noOptions: "No options",
  noMatchingFields: "No matching fields",
  noSavedViews: "No saved views",
  viewsTriggerFallback: "Views",
  moreViews: "More",
  saveViewTriggerFallback: "Save View",
  exitView: "Exit view",
  saveViewNamePlaceholder: "Enter a view name",
  saveViewSubmit: "Save",
  booleanTrueFallback: "True",
  booleanFalseFallback: "False",
  removeLabelFallback: "Remove",
};

export const headlessFilterBarTheme: FilterBarTheme = {
  classNames: {},
  primitiveClassNames: {},
  texts: defaultTexts,
  icons: {
    fieldKinds: {},
  },
};

function mergeClassNameSlots<Slot extends string>(
  baseClassNames: Partial<Record<Slot, string>>,
  overrideClassNames?: Partial<Record<Slot, string>>,
) {
  if (!overrideClassNames) {
    return baseClassNames;
  }

  const mergedClassNames: Partial<Record<Slot, string>> = {
    ...baseClassNames,
  };

  for (const [slot, className] of Object.entries(overrideClassNames) as Array<
    [Slot, string | undefined]
  >) {
    mergedClassNames[slot] = cn(baseClassNames[slot], className);
  }

  return mergedClassNames;
}

export function mergeFilterBarTheme(
  baseTheme: FilterBarTheme,
  overrideTheme?: FilterBarThemeInput | null,
): FilterBarTheme {
  if (!overrideTheme) {
    return baseTheme;
  }

  return {
    classNames: mergeClassNameSlots(
      baseTheme.classNames,
      overrideTheme.classNames,
    ),
    primitiveClassNames: mergeClassNameSlots(
      baseTheme.primitiveClassNames,
      overrideTheme.primitiveClassNames,
    ),
    texts: {
      ...baseTheme.texts,
      ...overrideTheme.texts,
    },
    icons: {
      ...baseTheme.icons,
      ...overrideTheme.icons,
      fieldKinds: {
        ...baseTheme.icons.fieldKinds,
        ...overrideTheme.icons?.fieldKinds,
      },
    },
  };
}

export function filterBarThemeSlot(
  ...slots: Array<FilterBarThemeClassNameSlot | null | undefined | false>
) {
  return slots
    .filter((slot): slot is FilterBarThemeClassNameSlot => Boolean(slot))
    .join(" ");
}

export function getFilterBarPrimitiveDataSlot(
  slot: FilterBarPrimitiveClassNameSlot,
) {
  return primitiveDataSlots[slot];
}

const FilterBarThemeContext = createContext<FilterBarTheme>(headlessFilterBarTheme);

export function FilterBarThemeProvider({
  children,
  theme,
}: PropsWithChildren<{
  theme?: FilterBarThemeInput | null | undefined;
}>) {
  const parentTheme = useContext(FilterBarThemeContext);
  const value = useMemo(
    () => mergeFilterBarTheme(parentTheme, theme),
    [parentTheme, theme],
  );

  return (
    <FilterBarThemeContext.Provider value={value}>
      {children}
    </FilterBarThemeContext.Provider>
  );
}

export function useFilterBarTheme() {
  return useContext(FilterBarThemeContext);
}

export function useFilterBarPrimitiveClassName(
  slot: FilterBarPrimitiveClassNameSlot,
): string;
export function useFilterBarPrimitiveClassName<State>(
  slot: FilterBarPrimitiveClassNameSlot,
  className: string | null | false | undefined | ((state: State) => string | undefined),
): string | ((state: State) => string | undefined);
export function useFilterBarPrimitiveClassName<State>(
  slot: FilterBarPrimitiveClassNameSlot,
  className?: string | null | false | ((state: State) => string | undefined),
) {
  const theme = useFilterBarTheme();

  if (typeof className === "function") {
    return (state: State) => cn(theme.primitiveClassNames[slot], className(state));
  }

  return cn(theme.primitiveClassNames[slot], className);
}
