import { FieldKind } from "@/logical/field";
import { Input } from "@/ui/baseui/input";

import type { FilterValueEditorProps } from "./shared";
import {
  FILTER_ITEM_EDITOR_CONTROL_CLASS,
  FILTER_ITEM_EDITOR_ROOT_CLASS,
} from "./shared";

export function StringValueEditor<FieldId extends string>({
  field,
  item,
  onChange,
}: FilterValueEditorProps<FieldId, typeof FieldKind.string>) {
  return (
    <div className={FILTER_ITEM_EDITOR_ROOT_CLASS}>
      <Input
        className={FILTER_ITEM_EDITOR_CONTROL_CLASS}
        value={typeof item.value === "string" ? item.value : ""}
        placeholder={field.placeholder ?? "Type a value"}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  );
}
