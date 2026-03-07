import { useState } from "react";
import { FieldKind } from "@/logical/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/baseui/select";
import { useSelectOptions } from "@/ui/filter-bar/select-options";
import { flattenSelectOptions } from "@/ui/filter-bar/state";

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
  const [open, setOpen] = useState(false);
  const shouldLoadOnRender = field.optionsLoadMode === "render";
  const { error, isAsync, load, options: resolvedOptions, status } = useSelectOptions(
    field,
    shouldLoadOnRender,
  );
  const options = flattenSelectOptions(
    isAsync ? resolvedOptions : (Array.isArray(field.options) ? field.options : []),
  );
  const value = typeof currentValue === "string" ? currentValue : null;

  return (
    <div className={FILTER_ITEM_EDITOR_ROOT_CLASS}>
      <Select<string>
        open={open}
        value={value}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (nextOpen && isAsync && !shouldLoadOnRender && status === "idle") {
            void load();
          }
        }}
        onValueChange={onChange}
      >
        <SelectTrigger className={FILTER_ITEM_EDITOR_CONTROL_CLASS}>
          <SelectValue>
            {(selectedValue) =>
              getOptionLabel(
                typeof selectedValue === "string" ? selectedValue : value,
                options,
              ) ??
              field.placeholder ??
              "Select an option"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {status === "loading" ? (
            <SelectItem disabled value="__loading__">
              Loading options...
            </SelectItem>
          ) : status === "error" ? (
            <SelectItem disabled value="__error__">
              {error?.message ?? "Failed to load options"}
            </SelectItem>
          ) : options.length > 0 ? (
            options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))
          ) : (
            <SelectItem disabled value="__empty__">
              No options
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
