import { FieldKind } from "@/logical/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSearchInput,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/ui/baseui/select";
import { useSelectableFieldOptions } from "@/ui/filter-bar/select-options";
import { SelectOptionLabel } from "@/ui/filter-bar/select-option-content";
import { filterBarThemeSlot, useFilterBarTheme } from "@/ui/filter-bar/theme";
import { cn } from "@/ui/lib/utils";
import { SelectOptionsStatus } from "@/ui/types";

import type { FilterValueEditorProps } from "./shared";
import { getOptionLabel } from "./shared";

export function SelectValueEditor<FieldId extends string>({
  field,
  item,
  onChange,
}: FilterValueEditorProps<FieldId, typeof FieldKind.select>) {
  const theme = useFilterBarTheme();
  const currentValue = item.value as string | null;
  const {
    displayOptions,
    error,
    handleOpenChange,
    isSearchEnabled,
    open,
    query,
    selectedOptions,
    setQuery,
    status,
    visibleOptions,
  } = useSelectableFieldOptions(field, {
    selectedValues: typeof currentValue === "string" ? [currentValue] : [],
  });
  const value = typeof currentValue === "string" ? currentValue : null;

  return (
    <div
      data-theme-slot={filterBarThemeSlot("editorRoot")}
      className={theme.classNames.editorRoot}
    >
      <Select<string>
        open={open}
        value={value}
        onOpenChange={handleOpenChange}
        onValueChange={onChange}
      >
        <SelectTrigger
          data-theme-slot={filterBarThemeSlot("selectTrigger", "editorControl")}
          unstyled={theme.unstyledPrimitives}
          className={cn(
            theme.classNames.selectTrigger,
            theme.classNames.editorControl,
          )}
        >
          <SelectValue>
            {(selectedValue) =>
              getOptionLabel(
                typeof selectedValue === "string" ? selectedValue : value,
                displayOptions,
              ) ??
              field.placeholder ??
              "Select an option"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          data-theme-slot={filterBarThemeSlot("selectContent")}
          unstyled={theme.unstyledPrimitives}
          className={theme.classNames.selectContent}
        >
          {isSearchEnabled ? (
            <>
              <SelectSearchInput
                data-theme-slot={filterBarThemeSlot("selectSearchInput")}
                unstyled={theme.unstyledPrimitives}
                value={query}
                className={theme.classNames.selectSearchInput}
                placeholder={theme.texts.searchOptionsPlaceholder}
                onChange={(event) => setQuery(event.currentTarget.value)}
                onKeyDown={(event) => event.stopPropagation()}
              />
              <SelectSeparator
                data-theme-slot={filterBarThemeSlot("selectSeparator")}
                unstyled={theme.unstyledPrimitives}
                className={theme.classNames.selectSeparator}
              />
            </>
          ) : null}
          {status === SelectOptionsStatus.loading ? (
            <SelectItem
              disabled
              value="__loading__"
              data-theme-slot={filterBarThemeSlot("selectItem")}
              unstyled={theme.unstyledPrimitives}
              className={theme.classNames.selectItem}
            >
              {theme.texts.loadingOptions}
            </SelectItem>
          ) : status === SelectOptionsStatus.error ? (
            <SelectItem
              disabled
              value="__error__"
              data-theme-slot={filterBarThemeSlot("selectItem")}
              unstyled={theme.unstyledPrimitives}
              className={theme.classNames.selectItem}
            >
              {error?.message ?? theme.texts.failedToLoadOptions}
            </SelectItem>
          ) : visibleOptions.length > 0 ? (
            visibleOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                data-theme-slot={filterBarThemeSlot("selectItem")}
                unstyled={theme.unstyledPrimitives}
                className={theme.classNames.selectItem}
              >
                <SelectOptionLabel option={option} />
              </SelectItem>
            ))
          ) : (
            <SelectItem
              disabled
              value="__empty__"
              data-theme-slot={filterBarThemeSlot("selectItem")}
              unstyled={theme.unstyledPrimitives}
              className={theme.classNames.selectItem}
            >
              {theme.texts.noOptions}
            </SelectItem>
          )}
          {selectedOptions
            .filter((option) => !visibleOptions.some((entry) => entry.value === option.value))
            .map((option) => (
              <SelectItem
                key={`${option.value}__hidden`}
                value={option.value}
                data-theme-slot={filterBarThemeSlot("selectItem")}
                unstyled={theme.unstyledPrimitives}
                className={cn(theme.classNames.selectItem, "hidden")}
              >
                <SelectOptionLabel option={option} />
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}
