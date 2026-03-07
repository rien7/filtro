import { FieldKind } from "@/logical/field";
import { NumberOperatorKind } from "@/logical/operator";
import { Input } from "@/ui/baseui/input";

import type { FilterValueEditorProps } from "./shared";
import {
  FILTER_ITEM_EDITOR_CONTROL_CLASS,
  FILTER_ITEM_EDITOR_ROOT_CLASS,
  FILTER_ITEM_EDITOR_SPLIT_CLASS,
  updateTupleValue,
} from "./shared";

export function NumberValueEditor<FieldId extends string>({
  field,
  item,
  onChange,
}: FilterValueEditorProps<FieldId, typeof FieldKind.number>) {
  if (item.operator === NumberOperatorKind.between || item.operator === NumberOperatorKind.notBetween) {
    const tuple = Array.isArray(item.value) ? item.value : [0, 0];

    return (
      <div className={FILTER_ITEM_EDITOR_ROOT_CLASS}>
        <div className={FILTER_ITEM_EDITOR_SPLIT_CLASS}>
          <Input
            className={FILTER_ITEM_EDITOR_CONTROL_CLASS}
            type="number"
            value={String(tuple[0] ?? 0)}
            placeholder="Min"
            onChange={(event) => onChange(updateTupleValue(tuple, 0, Number(event.currentTarget.value || 0)))}
          />
          <Input
            className={`${FILTER_ITEM_EDITOR_CONTROL_CLASS} border-l`}
            type="number"
            value={String(tuple[1] ?? 0)}
            placeholder="Max"
            onChange={(event) => onChange(updateTupleValue(tuple, 1, Number(event.currentTarget.value || 0)))}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={FILTER_ITEM_EDITOR_ROOT_CLASS}>
      <Input
        className={FILTER_ITEM_EDITOR_CONTROL_CLASS}
        type="number"
        value={typeof item.value === "number" ? String(item.value) : "0"}
        placeholder={field.placeholder ?? "Enter a number"}
        onChange={(event) => onChange(Number(event.currentTarget.value || 0))}
      />
    </div>
  );
}
