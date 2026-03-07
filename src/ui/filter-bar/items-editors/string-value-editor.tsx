import { FieldKind } from "@/logical/field";
import { Input } from "@/ui/baseui/input";
import { filterBarThemeSlot, useFilterBarTheme } from "@/ui/filter-bar/theme";

import type { FilterValueEditorProps } from "./shared";

export function StringValueEditor<FieldId extends string>({
  field,
  item,
  onChange,
}: FilterValueEditorProps<FieldId, typeof FieldKind.string>) {
  const theme = useFilterBarTheme();

  return (
    <div
      data-theme-slot={filterBarThemeSlot("editorRoot")}
      className={theme.classNames.editorRoot}
    >
      <Input
        data-theme-slot={filterBarThemeSlot("editorControl")}
        unstyled={theme.unstyledPrimitives}
        className={theme.classNames.editorControl}
        value={typeof item.value === "string" ? item.value : ""}
        placeholder={field.placeholder ?? "Type a value"}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  );
}
