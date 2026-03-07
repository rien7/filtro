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
  getOptionLabel,
} from "./shared";

export function SelectValueEditor<FieldId extends string>({
  field,
  item,
  onChange,
}: FilterValueEditorProps<FieldId, typeof FieldKind.select>) {
  const currentValue = item.value as string | null;

  if (!isStaticSelectField(field)) {
    return (
      <div className={FILTER_ITEM_EDITOR_ROOT_CLASS}>
        <Input
          className={FILTER_ITEM_EDITOR_CONTROL_CLASS}
          value={currentValue ?? ""}
          placeholder={field.placeholder ?? "Enter a value"}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      </div>
    );
  }

  const options = flattenSelectOptions(field.options);
  const value = typeof currentValue === "string" ? currentValue : null;

  return (
    <div className={FILTER_ITEM_EDITOR_ROOT_CLASS}>
      <Select<string> value={value} onValueChange={onChange}>
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
