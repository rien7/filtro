import { FieldKind } from "@/logical/field";
import { DateOperatorKind } from "@/logical/operator";
import { Input } from "@/ui/baseui/input";
import { filterBarThemeSlot, useFilterBarTheme } from "@/ui/filter-bar/theme";

import type { FilterValueEditorProps } from "./shared";
import { getToday, updateTupleValue } from "./shared";

export function DateValueEditor<FieldId extends string>({
  item,
  onChange,
}: FilterValueEditorProps<FieldId, typeof FieldKind.date>) {
  const theme = useFilterBarTheme();

  if (
    item.operator === DateOperatorKind.lastNDays ||
    item.operator === DateOperatorKind.nextNDays
  ) {
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
          min="1"
          value={typeof item.value === "number" ? String(item.value) : "7"}
          onChange={(event) => onChange(Number(event.currentTarget.value || 1))}
        />
      </div>
    );
  }

  if (
    item.operator === DateOperatorKind.between ||
    item.operator === DateOperatorKind.notBetween
  ) {
    const tuple = Array.isArray(item.value) ? item.value : [getToday(), getToday()];

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
            type="date"
            value={tuple[0] ?? getToday()}
            onChange={(event) =>
              onChange(updateTupleValue(tuple, 0, event.currentTarget.value))
            }
          />
          <Input
            data-theme-slot={filterBarThemeSlot("editorControl")}
            unstyled={theme.unstyledPrimitives}
            className={theme.classNames.editorControl}
            type="date"
            value={tuple[1] ?? getToday()}
            onChange={(event) =>
              onChange(updateTupleValue(tuple, 1, event.currentTarget.value))
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
        type="date"
        value={typeof item.value === "string" ? item.value : getToday()}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  );
}
