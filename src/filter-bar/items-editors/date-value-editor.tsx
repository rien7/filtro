import { useEffect, useState } from "react";

import { FieldKind } from "@/logical/field";
import { DateOperatorKind } from "@/logical/operator";
import { Input } from "@/filter-bar/internal/primitives/baseui/input";
import { validateFieldValue } from "@/filter-bar/validation";
import { filterBarThemeSlot, useFilterBarTheme } from "@/filter-bar/theme";

import type { FilterValueEditorProps } from "./shared";

export function DateValueEditor<FieldId extends string>({
  field,
  item,
  onChange,
  onValidationChange,
  errorDescriptionId,
}: FilterValueEditorProps<FieldId, typeof FieldKind.date>) {
  const theme = useFilterBarTheme();
  const [error, setError] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(() => item.value !== null);
  const [singleDraft, setSingleDraft] = useState(() =>
    typeof item.value === "string" ? item.value : "",
  );
  const [rangeDraft, setRangeDraft] = useState<[string, string]>(() =>
    Array.isArray(item.value)
      ? [
          typeof item.value[0] === "string" ? item.value[0] : "",
          typeof item.value[1] === "string" ? item.value[1] : "",
        ]
      : ["", ""],
  );
  const [relativeDraft, setRelativeDraft] = useState(() =>
    typeof item.value === "number" ? String(item.value) : "",
  );

  useEffect(() => {
    if (
      item.operator === DateOperatorKind.lastNDays ||
      item.operator === DateOperatorKind.nextNDays
    ) {
      setRelativeDraft(typeof item.value === "number" ? String(item.value) : "");
      const nextError =
        hasInteracted || item.value !== null
          ? validateCurrentValue(item.value)
          : null;

      setError(nextError);
      return;
    }

    if (
      item.operator === DateOperatorKind.between ||
      item.operator === DateOperatorKind.notBetween
    ) {
      setRangeDraft(
        Array.isArray(item.value)
          ? [
              typeof item.value[0] === "string" ? item.value[0] : "",
              typeof item.value[1] === "string" ? item.value[1] : "",
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

    setSingleDraft(typeof item.value === "string" ? item.value : "");
    const nextError =
      hasInteracted || item.value !== null
        ? validateCurrentValue(item.value)
        : null;

    setError(nextError);
  }, [field, item.operator, item.value]);

  useEffect(() => {
    onValidationChange?.(error);
  }, [error, onValidationChange]);

  function commitRelativeDraft(nextDraft: string) {
    setHasInteracted(true);
    setRelativeDraft(nextDraft);

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

    if (!Number.isFinite(nextValue) || nextValue < 1) {
      setError("Enter a whole number greater than 0.");
      return;
    }

    const normalizedValue = Math.max(1, Math.floor(nextValue));
    const nextError = validateFieldValue({
      field,
      op: item.operator,
      value: normalizedValue as never,
    });

    setError(nextError);

    if (!nextError) {
      onChange(normalizedValue);
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
        setError("Complete both dates.");
        return nextRangeDraft;
      }

      if (!isValidDateInput(startDraft) || !isValidDateInput(endDraft)) {
        setError("Enter valid dates.");
        return nextRangeDraft;
      }

      const nextValue = [startDraft, endDraft] as [string, string];
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

    if (!isValidDateInput(nextDraft)) {
      setError("Enter a valid date.");
      return;
    }

    const nextError = validateFieldValue({
      field,
      op: item.operator,
      value: nextDraft as never,
    });

    setError(nextError);

    if (!nextError) {
      onChange(nextDraft);
    }
  }

  if (
    item.operator === DateOperatorKind.lastNDays ||
    item.operator === DateOperatorKind.nextNDays
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
          <Input
            data-theme-slot={filterBarThemeSlot("editorControl")}
            unstyled={theme.unstyledPrimitives}
            className={theme.classNames.editorControl}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorDescriptionId : undefined}
            type="number"
            min="1"
            value={relativeDraft}
            onChange={(event) => commitRelativeDraft(event.currentTarget.value)}
          />
        </div>
      </div>
    );
  }

  if (
    item.operator === DateOperatorKind.between ||
    item.operator === DateOperatorKind.notBetween
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
              type="date"
              value={rangeDraft[0]}
              onChange={(event) => commitRangeDraft(0, event.currentTarget.value)}
            />
            <Input
              data-theme-slot={filterBarThemeSlot("editorControl")}
              unstyled={theme.unstyledPrimitives}
              className={theme.classNames.editorControl}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorDescriptionId : undefined}
              type="date"
              value={rangeDraft[1]}
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
          type="date"
          value={singleDraft}
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

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [yearPart = "", monthPart = "", dayPart = ""] = value.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
