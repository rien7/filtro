import { useEffect, useState } from "react";

import { FieldKind } from "@/logical/field";
import { NumberOperatorKind } from "@/logical/operator";
import { Input } from "@/ui/baseui/input";
import { validateFieldValue } from "@/ui/filter-bar/validation";
import { filterBarThemeSlot, useFilterBarTheme } from "@/ui/filter-bar/theme";

import type { FilterValueEditorProps } from "./shared";

export function NumberValueEditor<FieldId extends string>({
  field,
  item,
  onChange,
  onValidationChange,
  errorDescriptionId,
}: FilterValueEditorProps<FieldId, typeof FieldKind.number>) {
  const theme = useFilterBarTheme();
  const [error, setError] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(() => item.value !== null);
  const [singleDraft, setSingleDraft] = useState(() =>
    typeof item.value === "number" ? String(item.value) : "",
  );
  const [rangeDraft, setRangeDraft] = useState<[string, string]>(() =>
    Array.isArray(item.value)
      ? [
          typeof item.value[0] === "number" ? String(item.value[0]) : "",
          typeof item.value[1] === "number" ? String(item.value[1]) : "",
        ]
      : ["", ""],
  );

  useEffect(() => {
    if (
      item.operator === NumberOperatorKind.between ||
      item.operator === NumberOperatorKind.notBetween
    ) {
      setRangeDraft(
        Array.isArray(item.value)
          ? [
              typeof item.value[0] === "number" ? String(item.value[0]) : "",
              typeof item.value[1] === "number" ? String(item.value[1]) : "",
            ]
          : ["", ""],
      );

      const nextError =
        hasInteracted || item.value !== null
          ? validateCurrentValue(item.value)
          : null;

      setError(nextError);
      return;
    }

    setSingleDraft(typeof item.value === "number" ? String(item.value) : "");
    const nextError =
      hasInteracted || item.value !== null
        ? validateCurrentValue(item.value)
        : null;

    setError(nextError);
  }, [field, item.operator, item.value]);

  useEffect(() => {
    onValidationChange?.(error);
  }, [error, onValidationChange]);

  function commitSingleDraft(nextDraft: string) {
    setHasInteracted(true);
    setSingleDraft(nextDraft);

    if (!nextDraft) {
      const nextError = validateFieldValue({
        field,
        op: item.operator,
        value: null as never,
      });

      setError(nextError);
      onChange(null);
      return;
    }

    const nextValue = Number(nextDraft);

    if (!Number.isFinite(nextValue)) {
      setError("Enter a valid number.");
      return;
    }

    const nextError = validateFieldValue({
      field,
      op: item.operator,
      value: nextValue as never,
    });

    setError(nextError);

    if (!nextError) {
      onChange(nextValue);
    }
  }

  function commitRangeDraft(index: 0 | 1, nextDraft: string) {
    setHasInteracted(true);
    setRangeDraft((currentDraft) => {
      const nextRangeDraft = [...currentDraft] as [string, string];
      nextRangeDraft[index] = nextDraft;

      const [startDraft, endDraft] = nextRangeDraft;

      if (!startDraft && !endDraft) {
        const nextError = validateFieldValue({
          field,
          op: item.operator,
          value: null as never,
        });

        setError(nextError);
        onChange(null);
        return nextRangeDraft;
      }

      if (!startDraft || !endDraft) {
        setError("Complete both numbers.");
        return nextRangeDraft;
      }

      const startValue = Number(startDraft);
      const endValue = Number(endDraft);

      if (!Number.isFinite(startValue) || !Number.isFinite(endValue)) {
        setError("Enter valid numbers.");
        return nextRangeDraft;
      }

      const nextValue = [startValue, endValue] as [number, number];
      const nextError = validateFieldValue({
        field,
        op: item.operator,
        value: nextValue as never,
      });

      setError(nextError);

      if (!nextError) {
        onChange(nextValue);
      }

      return nextRangeDraft;
    });
  }

  if (
    item.operator === NumberOperatorKind.between ||
    item.operator === NumberOperatorKind.notBetween
  ) {
    return (
      <div
        data-theme-slot={filterBarThemeSlot("editorRoot")}
        className={theme.classNames.editorRoot}
      >
        <div
          data-theme-slot={filterBarThemeSlot("editorFieldset")}
          className={theme.classNames.editorFieldset}
        >
          <div
            data-theme-slot={filterBarThemeSlot("editorSplit")}
            className={theme.classNames.editorSplit}
          >
            <Input
              data-theme-slot={filterBarThemeSlot("editorControl")}
              unstyled={theme.unstyledPrimitives}
              className={theme.classNames.editorControl}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorDescriptionId : undefined}
              type="number"
              value={rangeDraft[0]}
              placeholder="Min"
              onChange={(event) => commitRangeDraft(0, event.currentTarget.value)}
            />
            <Input
              data-theme-slot={filterBarThemeSlot("editorControl")}
              unstyled={theme.unstyledPrimitives}
              className={theme.classNames.editorControl}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorDescriptionId : undefined}
              type="number"
              value={rangeDraft[1]}
              placeholder="Max"
              onChange={(event) => commitRangeDraft(1, event.currentTarget.value)}
            />
          </div>
        </div>
      </div>
    );
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
          type="number"
          value={singleDraft}
          placeholder={field.placeholder ?? "Enter a number"}
          onChange={(event) => commitSingleDraft(event.currentTarget.value)}
        />
      </div>
    </div>
  );

  function validateCurrentValue(value: typeof item.value) {
    return validateFieldValue({
      field,
      op: item.operator as never,
      value: value as never,
    });
  }
}
