import { useEffect, useState } from "react";

import { FieldKind } from "@/logical/field";
import { Input } from "@/ui/baseui/input";
import { validateFieldValue } from "@/ui/filter-bar/validation";
import { filterBarThemeSlot, useFilterBarTheme } from "@/ui/filter-bar/theme";

import type { FilterValueEditorProps } from "./shared";

export function StringValueEditor<FieldId extends string>({
  field,
  item,
  onChange,
  onValidationChange,
  errorDescriptionId,
}: FilterValueEditorProps<FieldId, typeof FieldKind.string>) {
  const theme = useFilterBarTheme();
  const [draft, setDraft] = useState(() =>
    typeof item.value === "string" ? item.value : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(() => item.value !== null);

  useEffect(() => {
    setDraft(typeof item.value === "string" ? item.value : "");

    const nextError =
      hasInteracted || item.value !== null
        ? validateFieldValue({
            field,
            op: item.operator,
            value: item.value,
          })
        : null;

    setError(nextError);
  }, [field, item.operator, item.value]);

  useEffect(() => {
    onValidationChange?.(error);
  }, [error, onValidationChange]);

  function commitDraft(nextDraft: string) {
    setHasInteracted(true);
    setDraft(nextDraft);

    if (!nextDraft) {
      const nextError = validateFieldValue({
        field,
        op: item.operator,
        value: null,
      });

      setError(nextError);
      onChange(null);
      return;
    }

    const nextError = validateFieldValue({
      field,
      op: item.operator,
      value: nextDraft,
    });

    setError(nextError);

    if (!nextError) {
      onChange(nextDraft);
    }
  }

  return (
    <div
      data-theme-slot={filterBarThemeSlot("editorRoot")}
      className={theme.classNames.editorRoot}
    >
      <div
        data-theme-slot={filterBarThemeSlot("editorFieldset")}
        className={theme.classNames.editorFieldset}
      >
        <Input
          data-theme-slot={filterBarThemeSlot("editorControl")}
          unstyled={theme.unstyledPrimitives}
          className={theme.classNames.editorControl}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorDescriptionId : undefined}
          value={draft}
          placeholder={field.placeholder ?? "Type a value"}
          onChange={(event) => commitDraft(event.currentTarget.value)}
        />
      </div>
    </div>
  );
}
