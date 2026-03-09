import { useId, useState } from "react";

import { type EnumFieldKind } from "@/logical/field";
import { type OperatorKindFor } from "@/logical/operator";
import { Button } from "@/filter-bar/internal/primitives/baseui/button";
import {
  ButtonGroup,
} from "@/filter-bar/internal/primitives/baseui/button-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/filter-bar/internal/primitives/baseui/select";
import type { FilterBarValue } from "@/filter-bar/context";
import {
  getFilterBarValueCompleteness,
  isEmptyOperator,
  normalizeValueForOperator,
} from "@/filter-bar/state";
import { filterBarThemeSlot, useFilterBarTheme } from "@/filter-bar/theme";
import { getFieldAllowedOperators, hasFieldFixedOperator } from "@/filter-bar/value";
import { cn } from "@/lib/utils";
import type { UIFieldForKind } from "@/filter-bar/types";

import { getOperatorLabel } from "./items.constants";
import {
  FilterItemFieldSegment,
  FilterItemOperatorTextSegment,
  FilterItemValueSegment,
} from "./items.parts";
import { FilterValueEditor } from "./items.value-editor";

export function FilterItemRow<FieldId extends string, Kind extends EnumFieldKind>({
  field,
  item,
  onUpdate,
  onRemove,
  removable = true,
  area = "active",
}: {
  field: UIFieldForKind<FieldId, Kind>;
  item: FilterBarValue<FieldId, Kind>;
  onUpdate: (
    updater: (current: FilterBarValue<FieldId, Kind>) => FilterBarValue<FieldId, Kind>,
    meta: {
      action: "operator" | "value";
      completeness: "complete" | "incomplete";
      valueChangeKind?: "typing" | "selected";
    },
  ) => void;
  onRemove: () => void;
  removable?: boolean;
  area?: "active" | "pinned";
}) {
  const theme = useFilterBarTheme();
  const errorId = useId();
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const allowedOperators = getFieldAllowedOperators(field);
  const hasLockedOperator = hasFieldFixedOperator(field);
  const hasMultipleOperators = allowedOperators.length > 1;
  const hidesValueEditor = isEmptyOperator(item.operator);
  const shouldRoundFieldRight = !removable && hidesValueEditor && hasLockedOperator;
  const shouldRoundOperatorRight = !removable && hidesValueEditor && !hasLockedOperator;
  const shouldRoundValueRight = !removable && !hidesValueEditor;

  return (
    <div
      data-removable={removable}
      data-has-locked-operator={hasLockedOperator}
      data-hides-value-editor={hidesValueEditor}
      data-theme-slot={filterBarThemeSlot("rowRoot")}
      data-area={area}
      className={theme.classNames.rowRoot}
    >
      <ButtonGroup
        data-removable={removable}
        data-has-locked-operator={hasLockedOperator}
        data-hides-value-editor={hidesValueEditor}
        data-theme-slot={filterBarThemeSlot("row")}
        data-area={area}
        className={theme.classNames.row}
      >
        <FilterItemFieldSegment
          area={area}
          field={field}
          showTrailingBorder={hasLockedOperator}
          roundRight={shouldRoundFieldRight}
        />

        {hasMultipleOperators ? (
          <Select<string>
            value={item.operator}
            onValueChange={(nextOperator) => {
              const nextItem = {
                ...item,
                operator: nextOperator as typeof item.operator,
                allowOperators: [...allowedOperators] as typeof item.allowOperators,
                value: normalizeValueForOperator({
                  field,
                  operator: nextOperator as OperatorKindFor<typeof field.kind>,
                  previousValue: item.value as never,
                }) as typeof item.value,
              };

              onUpdate(
                () => nextItem,
                {
                  action: "operator",
                  completeness: getFilterBarValueCompleteness(
                    nextItem as FilterBarValue<string, EnumFieldKind>,
                  ),
                },
              );
            }}
          >
            <SelectTrigger
              data-area={area}
              data-round-right={shouldRoundOperatorRight}
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
            <SelectContent
              data-theme-slot={filterBarThemeSlot("selectContent")}
              className={theme.classNames.selectContent}
            >
              {allowedOperators.map((operator) => (
                <SelectItem
                  key={operator}
                  value={operator}
                  data-theme-slot={filterBarThemeSlot("selectItem")}
                  className={theme.classNames.selectItem}
                >
                  {getOperatorLabel(operator)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : hasLockedOperator ? null : (
          <FilterItemOperatorTextSegment
            area={area}
            operator={item.operator}
            roundRight={shouldRoundOperatorRight}
          />
        )}

        {isEmptyOperator(item.operator) ? null : (
          <FilterItemValueSegment area={area} roundRight={shouldRoundValueRight}>
            <FilterValueEditor
              field={field}
              item={item}
              onChange={(value, options) => {
                const nextItem = {
                  ...item,
                  value,
                };

                onUpdate(
                  () => nextItem,
                  {
                    action: "value",
                    valueChangeKind: options?.valueChangeKind ?? "selected",
                    completeness: getFilterBarValueCompleteness(
                      nextItem as FilterBarValue<string, EnumFieldKind>,
                    ),
                  },
                );
              }}
              onValidationChange={setValidationMessage}
              errorDescriptionId={errorId}
            />
          </FilterItemValueSegment>
        )}

        {removable ? (
          <Button
            data-theme-slot={filterBarThemeSlot("rowRemoveButton")}
            data-area={area}
            aria-label={`Remove ${field.label ?? field.id} filter`}
            onClick={onRemove}
            className={theme.classNames.rowRemoveButton}
          >
            {theme.icons.remove ?? theme.texts.removeLabelFallback}
          </Button>
        ) : null}
      </ButtonGroup>

      {validationMessage ? (
        <div
          id={errorId}
          data-theme-slot={filterBarThemeSlot("rowError")}
          className={theme.classNames.rowError}
        >
          {validationMessage}
        </div>
      ) : null}
    </div>
  );
}
