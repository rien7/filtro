import type { MouseEvent, PointerEvent } from "react";

import { useFilterBar } from "@/filter-bar/context";
import {
  resolveSuggestionFields,
} from "@/filter-bar/display";
import {
  Select,
  SelectTrigger,
  SelectValue,
} from "@/filter-bar/internal/primitives/baseui/select";
import { ButtonGroup, ButtonGroupText } from "@/filter-bar/internal/primitives/baseui/button-group";
import { getOperatorLabel } from "@/filter-bar/items.constants";
import {
  FilterItemFieldSegment,
  FilterItemOperatorTextSegment,
  FilterItemValueSegment,
} from "@/filter-bar/items.parts";
import { FilterValueEditor } from "@/filter-bar/items.value-editor";
import { getSuggestedDisplay } from "@/filter-bar/placement";
import {
  createFilterBarValue,
  getFilterBarValueCompleteness,
  isEmptyOperator,
  upsertFilterBarValue,
} from "@/filter-bar/state";
import { filterBarThemeSlot, useFilterBarTheme } from "@/filter-bar/theme";
import { cn } from "@/lib/utils";
import {
  getFieldAllowedOperators,
  hasFieldFixedOperator,
  sanitizeFilterBarValue,
} from "@/filter-bar/value";

function suppressSuggestionPointerDown(event: PointerEvent<HTMLElement>) {
  event.preventDefault();
  event.stopPropagation();
}

function renderSuggestionFieldContent(fieldLabel: string, fieldTextClassName?: string) {
  return (
    <span
      data-theme-slot={filterBarThemeSlot("rowFieldText")}
      className={fieldTextClassName}
    >
      {fieldLabel}
    </span>
  );
}

export function FilterBarSuggestedItems({
  className,
}: {
  className?: string;
}) {
  const {
    changeDismissedSuggestionFieldIds,
    changeDraftValues,
    changeValues,
    clearActiveView,
    dismissedSuggestionFieldIds,
    draftValues,
    uiFields,
    values,
  } = useFilterBar();
  const theme = useFilterBarTheme();
  const fields = resolveSuggestionFields(
    uiFields,
    values,
    draftValues,
    dismissedSuggestionFieldIds,
  );

  if (!fields.length) {
    return null;
  }

  return (
    <div
      data-theme-slot={filterBarThemeSlot("suggestedItemsRoot")}
      className={cn(theme.classNames.suggestedItemsRoot, className)}
    >
      {fields.map((field) => {
        const suggestion = getSuggestedDisplay(field);
        const nextValue = createFilterBarValue(field as never, suggestion?.seed as never);
        const allowedOperators = getFieldAllowedOperators(field as never);
        const hasLockedOperator = hasFieldFixedOperator(field as never);
        const hasMultipleOperators = allowedOperators.length > 1;
        const showOperator = nextValue && !hasLockedOperator;
        const showValue = nextValue && !isEmptyOperator(nextValue.operator);
        const fieldLabel = field.label ?? field.id;

        const activateSuggestion = () => {
          if (!nextValue) {
            return;
          }

          const activeValue = sanitizeFilterBarValue(field as never, nextValue as never);

          clearActiveView?.();
          changeDismissedSuggestionFieldIds?.((previous) =>
            previous.filter((fieldId) => fieldId !== field.id),
          );

          if (!activeValue) {
            changeDraftValues?.((previous) =>
              upsertFilterBarValue(previous, nextValue as never),
            );
            return;
          }

          changeDraftValues?.((previous) =>
            previous.filter((entry) => entry.fieldId !== field.id),
          );
          changeValues?.(
            (previous) => upsertFilterBarValue(previous, activeValue as never),
            {
              action: "add",
              fieldId: field.id,
              completeness: getFilterBarValueCompleteness(activeValue as never),
            },
          );
        };

        const handleSuggestionClickCapture = (event: MouseEvent<HTMLElement>) => {
          event.preventDefault();
          event.stopPropagation();
          activateSuggestion();
        };

        return (
          <div
            key={field.id}
            data-theme-slot={filterBarThemeSlot("suggestionButton")}
            data-area="suggestion"
            className={theme.classNames.suggestionButton}
            onClick={activateSuggestion}
          >
            <ButtonGroup
              data-theme-slot={filterBarThemeSlot("row")}
              data-area="suggestion"
              className={theme.classNames.row}
              onPointerDownCapture={suppressSuggestionPointerDown}
              onClickCapture={handleSuggestionClickCapture}
            >
              <FilterItemFieldSegment area="suggestion" field={field as never}>
                {renderSuggestionFieldContent(fieldLabel, theme.classNames.rowFieldText)}
              </FilterItemFieldSegment>
              {showOperator ? (
                hasMultipleOperators ? (
                  <Select<string> value={nextValue.operator} onValueChange={() => undefined}>
                    <SelectTrigger
                      data-area="suggestion"
                      data-theme-slot={filterBarThemeSlot("selectTrigger", "rowOperator", "rowOperatorTrigger")}
                      className={cn(
                        theme.classNames.selectTrigger,
                        theme.classNames.rowOperator,
                        theme.classNames.rowOperatorTrigger,
                      )}
                    >
                      <SelectValue>
                        {(value) => getOperatorLabel(String(value ?? ""))}
                      </SelectValue>
                    </SelectTrigger>
                  </Select>
                ) : (
                  <FilterItemOperatorTextSegment area="suggestion" operator={nextValue.operator} />
                )
              ) : null}
              {showValue ? (
                <FilterItemValueSegment
                  area="suggestion"
                  className="min-w-0"
                >
                  <FilterValueEditor
                    field={field as never}
                    item={nextValue as never}
                    onChange={() => undefined}
                    onValidationChange={undefined}
                    errorDescriptionId={undefined}
                  />
                </FilterItemValueSegment>
              ) : null}
              <ButtonGroupText
                data-area="suggestion"
                data-suggestion-add
                data-theme-slot={filterBarThemeSlot("suggestionAdd")}
                aria-hidden="true"
                className={theme.classNames.suggestionAdd}
              >
                {theme.icons.add ?? theme.texts.addLabelFallback}
              </ButtonGroupText>
            </ButtonGroup>
          </div>
        );
      })}
    </div>
  );
}
