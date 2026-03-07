import {
  CalendarIcon,
  CheckSquareIcon,
  HashIcon,
  ListChecksIcon,
  ToggleLeftIcon,
  TypeIcon,
  X,
} from "lucide-react";
import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
  type ReactNode,
} from "react";

import { FieldKind, type EnumFieldKind } from "@/logical/field";

export type FilterBarThemeClassNameSlot =
  | "itemsRoot"
  | "emptyState"
  | "row"
  | "rowField"
  | "rowFieldText"
  | "rowOperatorTrigger"
  | "rowOperatorText"
  | "rowValue"
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
  | "editorControl"
  | "editorSplit"
  | "booleanTrueButton"
  | "booleanFalseButton";

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
  unstyledPrimitives: boolean;
  classNames: Partial<Record<FilterBarThemeClassNameSlot, string>>;
  texts: FilterBarThemeTexts;
  icons: FilterBarThemeIcons;
}

export type FilterBarThemeInput = Partial<
  Omit<FilterBarTheme, "texts" | "icons" | "classNames">
> & {
  classNames?: Partial<Record<FilterBarThemeClassNameSlot, string>>;
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
  unstyledPrimitives: true,
  classNames: {},
  texts: defaultTexts,
  icons: {
    fieldKinds: {},
  },
};

export const defaultFilterBarTheme: FilterBarTheme = {
  ...headlessFilterBarTheme,
  unstyledPrimitives: false,
  classNames: {
    itemsRoot: "flex flex-row flex-wrap gap-3",
    emptyState:
      "text-muted-foreground flex min-h-24 items-center justify-center rounded-2xl border border-dashed px-4 text-sm",
    row: "h-9 md:flex-nowrap",
    rowField: "h-full bg-background border-r-0 select-none border-border",
    rowFieldText: "block truncate text-sm font-medium",
    rowOperatorTrigger:
      "h-full w-fit shadow-none font-normal !border-l text-muted-foreground",
    rowOperatorText:
      "h-full w-fit select-none bg-background px-3 py-2 font-normal !border-l text-muted-foreground",
    rowValue:
      "flex h-full min-w-0 grow overflow-hidden border border-border bg-background border-r-0",
    rowRemoveButton:
      "h-full min-h-0 px-2.5 !border-l hover:bg-destructive/20 hover:text-destructive focus-visible:border-destructive/40 hover:border-destructive/30",
    triggerMenuContent: "min-w-48",
    viewsRoot: "relative flex w-full flex-wrap items-start gap-2",
    viewsList: "flex flex-wrap gap-2",
    viewsButton:
      "max-w-48 truncate border-border bg-background text-muted-foreground hover:text-foreground",
    viewsButtonActive:
      "border-primary/30 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
    viewsOverflowTrigger: "border-dashed",
    viewsMenuContent: "min-w-48",
    viewsItem: "justify-between",
    saveViewContent: "min-w-64 p-2",
    saveViewForm: "flex flex-col gap-2",
    saveViewInput: "w-full",
    saveViewSubmit: "w-full",
    editorRoot: "flex h-full w-full min-w-0 items-stretch",
    editorControl:
      "h-full min-h-0 w-full rounded-none border-0 px-3 py-0 shadow-none hover:bg-muted focus-visible:ring-0",
    editorSplit:
      "grid h-full min-w-0 w-full grid-cols-2 items-stretch [&>*]:h-full [&>*+*]:border-l",
    booleanTrueButton: "h-full min-h-0 rounded-none border-0 shadow-none",
    booleanFalseButton: "h-full min-h-0 rounded-none border-0 border-l shadow-none",
  },
  icons: {
    remove: <X className="size-4" />,
    fieldKinds: {
      [FieldKind.string]: <TypeIcon />,
      [FieldKind.number]: <HashIcon />,
      [FieldKind.date]: <CalendarIcon />,
      [FieldKind.select]: <CheckSquareIcon />,
      [FieldKind.multiSelect]: <ListChecksIcon />,
      [FieldKind.boolean]: <ToggleLeftIcon />,
    },
  },
};

export function mergeFilterBarTheme(
  baseTheme: FilterBarTheme,
  overrideTheme?: FilterBarThemeInput | null,
): FilterBarTheme {
  if (!overrideTheme) {
    return baseTheme;
  }

  return {
    unstyledPrimitives:
      overrideTheme.unstyledPrimitives ?? baseTheme.unstyledPrimitives,
    classNames: {
      ...baseTheme.classNames,
      ...overrideTheme.classNames,
    },
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
