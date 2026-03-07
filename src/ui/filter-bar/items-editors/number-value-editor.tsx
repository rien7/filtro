import { FieldKind } from "@/logical/field";
import { NumberOperatorKind } from "@/logical/operator";
import { Input } from "@/ui/baseui/input";
import { filterBarThemeSlot, useFilterBarTheme } from "@/ui/filter-bar/theme";

import type { FilterValueEditorProps } from "./shared";
import { updateTupleValue } from "./shared";

export function NumberValueEditor<FieldId extends string>({
  field,
  item,
  onChange,
}: FilterValueEditorProps<FieldId, typeof FieldKind.number>) {
  const theme = useFilterBarTheme();

  if (
    item.operator === NumberOperatorKind.between ||
    item.operator === NumberOperatorKind.notBetween
  ) {
    const tuple = Array.isArray(item.value) ? item.value : [0, 0];

    return (
      <div
        data-theme-slot={filterBarThemeSlot("editorRoot")}
        className={theme.classNames.editorRoot}
      >
        <div
          data-theme-slot={filterBarThemeSlot("editorSplit")}
          className={theme.classNames.editorSplit}
        >
          <Input
            data-theme-slot={filterBarThemeSlot("editorControl")}
            unstyled={theme.unstyledPrimitives}
            className={theme.classNames.editorControl}
            type="number"
            value={String(tuple[0] ?? 0)}
            placeholder="Min"
            onChange={(event) =>
              onChange(updateTupleValue(tuple, 0, Number(event.currentTarget.value || 0)))
            }
          />
          <Input
            data-theme-slot={filterBarThemeSlot("editorControl")}
            unstyled={theme.unstyledPrimitives}
            className={theme.classNames.editorControl}
            type="number"
            value={String(tuple[1] ?? 0)}
            placeholder="Max"
            onChange={(event) =>
              onChange(updateTupleValue(tuple, 1, Number(event.currentTarget.value || 0)))
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div
      data-theme-slot={filterBarThemeSlot("editorRoot")}
      className={theme.classNames.editorRoot}
    >
      <Input
        data-theme-slot={filterBarThemeSlot("editorControl")}
        unstyled={theme.unstyledPrimitives}
        className={theme.classNames.editorControl}
        type="number"
        value={typeof item.value === "number" ? String(item.value) : "0"}
        placeholder={field.placeholder ?? "Enter a number"}
        onChange={(event) => onChange(Number(event.currentTarget.value || 0))}
      />
    </div>
  );
}
