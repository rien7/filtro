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

import type { FilterValueEditorProps } from "./shared";
import {
  FILTER_ITEM_EDITOR_CONTROL_CLASS,
  FILTER_ITEM_EDITOR_ROOT_CLASS,
  getOptionLabel,
} from "./shared";

export function SelectValueEditor<FieldId extends string>({
  field,
  item,
  onChange,
}: FilterValueEditorProps<FieldId, typeof FieldKind.select>) {
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
    <div className={FILTER_ITEM_EDITOR_ROOT_CLASS}>
      <Select<string>
        open={open}
        value={value}
        onOpenChange={handleOpenChange}
        onValueChange={onChange}
      >
        <SelectTrigger className={FILTER_ITEM_EDITOR_CONTROL_CLASS}>
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
        <SelectContent>
          {isSearchEnabled ? (
            <>
              <SelectSearchInput
                value={query}
                placeholder="Search options..."
                onChange={(event) => setQuery(event.currentTarget.value)}
                onKeyDown={(event) => event.stopPropagation()}
              />
              <SelectSeparator />
            </>
          ) : null}
          {status === "loading" ? (
            <SelectItem disabled value="__loading__">
              Loading options...
            </SelectItem>
          ) : status === "error" ? (
            <SelectItem disabled value="__error__">
              {error?.message ?? "Failed to load options"}
            </SelectItem>
          ) : visibleOptions.length > 0 ? (
            visibleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))
          ) : (
            <SelectItem disabled value="__empty__">
              No options
            </SelectItem>
          )}
          {selectedOptions
            .filter((option) => !visibleOptions.some((entry) => entry.value === option.value))
            .map((option) => (
              <SelectItem key={`${option.value}__hidden`} value={option.value} className="hidden">
                {option.label}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}
