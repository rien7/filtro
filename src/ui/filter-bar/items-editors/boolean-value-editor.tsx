import { FieldKind } from "@/logical/field";
import { Button } from "@/ui/baseui/button";

import type { FilterValueEditorProps } from "./shared";
import {
  FILTER_ITEM_EDITOR_ROOT_CLASS,
  FILTER_ITEM_EDITOR_SPLIT_CLASS,
} from "./shared";

export function BooleanValueEditor<FieldId extends string>({
  item,
  onChange,
}: FilterValueEditorProps<FieldId, typeof FieldKind.boolean>) {
  return (
    <div className={FILTER_ITEM_EDITOR_ROOT_CLASS}>
      <div className={FILTER_ITEM_EDITOR_SPLIT_CLASS}>
        <Button
          type="button"
          variant={item.value === true ? "secondary" : "ghost"}
          className="h-full min-h-0 rounded-none border-0 shadow-none"
          aria-pressed={item.value === true}
          onClick={() => onChange(true)}
        >
          True
        </Button>
        <Button
          type="button"
          variant={item.value === false ? "secondary" : "ghost"}
          className="h-full min-h-0 rounded-none border-0 border-l shadow-none"
          aria-pressed={item.value === false}
          onClick={() => onChange(false)}
        >
          False
        </Button>
      </div>
    </div>
  );
}
