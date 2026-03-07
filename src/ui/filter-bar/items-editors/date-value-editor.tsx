import { FieldKind } from "@/logical/field";
import { DateOperatorKind } from "@/logical/operator";
import { Input } from "@/ui/baseui/input";

import type { FilterValueEditorProps } from "./shared";
import {
  FILTER_ITEM_EDITOR_CONTROL_CLASS,
  FILTER_ITEM_EDITOR_ROOT_CLASS,
  FILTER_ITEM_EDITOR_SPLIT_CLASS,
  getToday,
  updateTupleValue,
} from "./shared";

export function DateValueEditor<FieldId extends string>({
  item,
  onChange,
}: FilterValueEditorProps<FieldId, typeof FieldKind.date>) {
  if (item.operator === DateOperatorKind.lastNDays || item.operator === DateOperatorKind.nextNDays) {
    return (
      <div className={FILTER_ITEM_EDITOR_ROOT_CLASS}>
        <Input
          className={FILTER_ITEM_EDITOR_CONTROL_CLASS}
          type="number"
          min="1"
          value={typeof item.value === "number" ? String(item.value) : "7"}
          onChange={(event) => onChange(Number(event.currentTarget.value || 1))}
        />
      </div>
    );
  }

  if (item.operator === DateOperatorKind.between || item.operator === DateOperatorKind.notBetween) {
    const tuple = Array.isArray(item.value) ? item.value : [getToday(), getToday()];

    return (
      <div className={FILTER_ITEM_EDITOR_ROOT_CLASS}>
        <div className={FILTER_ITEM_EDITOR_SPLIT_CLASS}>
          <Input
            className={FILTER_ITEM_EDITOR_CONTROL_CLASS}
            type="date"
            value={tuple[0] ?? getToday()}
            onChange={(event) => onChange(updateTupleValue(tuple, 0, event.currentTarget.value))}
          />
          <Input
            className={`${FILTER_ITEM_EDITOR_CONTROL_CLASS} border-l`}
            type="date"
            value={tuple[1] ?? getToday()}
            onChange={(event) => onChange(updateTupleValue(tuple, 1, event.currentTarget.value))}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={FILTER_ITEM_EDITOR_ROOT_CLASS}>
      <Input
        className={FILTER_ITEM_EDITOR_CONTROL_CLASS}
        type="date"
        value={typeof item.value === "string" ? item.value : getToday()}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  );
}
