import { FieldKind } from "@/logical/field";
import { Input } from "@/ui/baseui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/baseui/select";
import { flattenSelectOptions, isStaticSelectField } from "@/ui/filter-bar/state";

import type { FilterValueEditorProps } from "./shared";
import {
  FILTER_ITEM_EDITOR_CONTROL_CLASS,
  FILTER_ITEM_EDITOR_ROOT_CLASS,
  getOptionLabels,
  stringifyArrayValue,
} from "./shared";

export function MultiSelectValueEditor<FieldId extends string>({
  field,
  item,
  onChange,
}: FilterValueEditorProps<FieldId, typeof FieldKind.multiSelect>) {
  const currentValue = item.value as string[] | null;
  const value = Array.isArray(currentValue) ? currentValue : [];

  if (!isStaticSelectField(field)) {
    return (
      <div className={FILTER_ITEM_EDITOR_ROOT_CLASS}>
        <Input
          className={FILTER_ITEM_EDITOR_CONTROL_CLASS}
          value={stringifyArrayValue(value)}
          placeholder={field.placeholder ?? "Enter comma-separated values"}
          onChange={(event) =>
            onChange(
              event.currentTarget.value
                .split(",")
                .map((part) => part.trim())
                .filter(Boolean),
            )
          }
        />
      </div>
    );
  }

  const options = flattenSelectOptions(field.options);

  return (
    <div className={FILTER_ITEM_EDITOR_ROOT_CLASS}>
      <Select<string, true> multiple value={value} onValueChange={onChange}>
        <SelectTrigger className={FILTER_ITEM_EDITOR_CONTROL_CLASS}>
          <SelectValue>
            {(selectedValue) =>
              getOptionLabels(
                Array.isArray(selectedValue) ? selectedValue : value,
                options,
              ) ||
              field.placeholder ||
              "Select options"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
