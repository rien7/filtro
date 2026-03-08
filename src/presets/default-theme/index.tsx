import {
  CalendarIcon,
  CheckSquareIcon,
  HashIcon,
  ListChecksIcon,
  ToggleLeftIcon,
  TypeIcon,
  X,
} from "lucide-react";

import { headlessFilterBarTheme, type FilterBarTheme } from "@/filter-bar/theme";
import { FieldKind } from "@/logical/field";

export * from "@/filter-bar/internal/primitives/baseui/button";
export * from "@/filter-bar/internal/primitives/baseui/button-group";
export * from "@/filter-bar/internal/primitives/baseui/dropdown-menu";
export * from "@/filter-bar/internal/primitives/baseui/input";
export * from "@/filter-bar/internal/primitives/baseui/select";
export * from "@/filter-bar/internal/primitives/baseui/separator";
export * from "@/filter-bar/internal/primitives/baseui/switch";

export const defaultFilterBarTheme: FilterBarTheme = {
  ...headlessFilterBarTheme,
  unstyledPrimitives: false,
  classNames: {
    itemsRoot: "flex flex-row flex-wrap gap-3",
    emptyState:
      "text-muted-foreground flex min-h-24 items-center justify-center rounded-2xl border border-dashed px-4 text-sm",
    rowRoot: "flex min-w-0 flex-col gap-1",
    row: "min-h-9 md:flex-nowrap",
    rowField: "h-full bg-background border-r-0 select-none border-border",
    rowFieldText: "block truncate text-sm font-medium",
    rowOperatorTrigger:
      "h-full w-fit shadow-none font-normal !border-l text-muted-foreground",
    rowOperatorText:
      "h-full w-fit select-none bg-background px-3 py-2 font-normal !border-l text-muted-foreground",
    rowValue:
      "flex min-w-0 grow overflow-visible border border-border bg-background border-r-0",
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
    editorRoot: "flex w-full min-w-0 flex-col justify-center",
    editorFieldset: "flex min-h-9 w-full min-w-0 items-stretch",
    editorControl:
      "h-full min-h-0 w-full rounded-none border-0 px-3 py-0 shadow-none hover:bg-muted focus-visible:ring-0",
    editorSplit:
      "grid min-h-9 min-w-0 w-full grid-cols-2 items-stretch [&>*]:h-full [&>*+*]:border-l",
    rowError: "px-3 py-1 text-[11px] leading-4 text-destructive",
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
