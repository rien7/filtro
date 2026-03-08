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
import {
  hasSelectOptionIcon,
  SelectOptionIconStack,
  SelectOptionLabel,
} from "@/ui/filter-bar/select-option-content";
import { filterBarThemeSlot, useFilterBarTheme } from "@/ui/filter-bar/theme";
import { cn } from "@/ui/lib/utils";
import { SelectOptionsStatus } from "@/ui/types";

import type { FilterValueEditorProps } from "./shared";

export function MultiSelectValueEditor<FieldId extends string>({
  field,
  item,
  onChange,
}: FilterValueEditorProps<FieldId, typeof FieldKind.multiSelect>) {
  const theme = useFilterBarTheme();
  const currentValue = item.value as string[] | null;
  const value = Array.isArray(currentValue) ? currentValue : [];
  const maxSelections = field.maxSelections;
  const {
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
    selectedValues: value,
  });
  const selectedLabel = selectedOptions.length > 0
    ? value.map((selectedValue) => {
        return selectedOptions.find((option) => option.value === selectedValue)?.label ?? selectedValue;
      }).join(", ")
    : field.placeholder || "Select options";
  const selectedOptionsWithIcons = selectedOptions.filter(hasSelectOptionIcon);
  const limitReached = maxSelections !== undefined && value.length >= maxSelections;

  return (
    <div
      data-theme-slot={filterBarThemeSlot("editorRoot")}
      className={theme.classNames.editorRoot}
    >
      <Select<string, true>
        multiple
        open={open}
        value={value}
        onOpenChange={handleOpenChange}
        onValueChange={(nextValue) => {
          if (!Array.isArray(nextValue)) {
            return;
          }

          if (maxSelections === undefined || nextValue.length <= maxSelections) {
            onChange(nextValue);
            return;
          }

          onChange(nextValue.slice(0, maxSelections));
        }}
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
            {(selectedValue) => {
              const selectedValues = Array.isArray(selectedValue) ? selectedValue : value;
              const renderedLabel =
                field.renderValueLabel?.(selectedValues) ?? selectedLabel;

              return (
                <span className="flex min-w-0 items-center gap-2">
                  <SelectOptionIconStack options={selectedOptionsWithIcons} />
                  <span className="truncate">{renderedLabel}</span>
                </span>
              );
            }}
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
                disabled={limitReached && !value.includes(option.value)}
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
