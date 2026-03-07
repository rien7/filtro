import { type EnumFieldKind } from "@/logical/field";
import { type OperatorKindFor } from "@/logical/operator";
import { Button } from "@/ui/baseui/button";
import {
  ButtonGroup,
  ButtonGroupText,
} from "@/ui/baseui/button-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/baseui/select";
import type { FilterBarValue } from "@/ui/filter-bar/context";
import { isEmptyOperator, normalizeValueForOperator } from "@/ui/filter-bar/state";
import { filterBarThemeSlot, useFilterBarTheme } from "@/ui/filter-bar/theme";
import { getFieldAllowedOperators, hasFieldFixedOperator } from "@/ui/filter-bar/value";
import { cn } from "@/ui/lib/utils";
import type { UIFieldForKind } from "@/ui/types";

import { OPERATOR_LABELS } from "./items.constants";
import { FilterValueEditor } from "./items.value-editor";

export function FilterItemRow<FieldId extends string, Kind extends EnumFieldKind>({
  field,
  item,
  onUpdate,
  onRemove,
}: {
  field: UIFieldForKind<FieldId, Kind>;
  item: FilterBarValue<FieldId, Kind>;
  onUpdate: (updater: (current: FilterBarValue<FieldId, Kind>) => FilterBarValue<FieldId, Kind>) => void;
  onRemove: () => void;
}) {
  const theme = useFilterBarTheme();
  const allowedOperators = getFieldAllowedOperators(field);
  const hasLockedOperator = hasFieldFixedOperator(field);
  const hasMultipleOperators = allowedOperators.length > 1;

  return (
    <ButtonGroup
      data-theme-slot={filterBarThemeSlot("row")}
      unstyled={theme.unstyledPrimitives}
      className={theme.classNames.row}
    >
      <ButtonGroupText
        data-theme-slot={filterBarThemeSlot("rowField")}
        unstyled={theme.unstyledPrimitives}
        className={cn(
          theme.classNames.rowField,
          hasLockedOperator ? "border-r" : null,
        )}
      >
        <span
          data-theme-slot={filterBarThemeSlot("rowFieldText")}
          className={theme.classNames.rowFieldText}
        >
          {field.label ?? field.id}
        </span>
      </ButtonGroupText>

      {hasMultipleOperators ? (
        <Select<string>
          value={item.operator}
          onValueChange={(nextOperator) =>
            onUpdate((current) => ({
              ...current,
              operator: nextOperator as typeof current.operator,
              allowOperators: [...allowedOperators] as typeof current.allowOperators,
              value: normalizeValueForOperator({
                field,
                operator: nextOperator as OperatorKindFor<typeof field.kind>,
                previousValue: current.value as never,
              }) as typeof current.value,
            }))
          }
        >
          <SelectTrigger
            data-theme-slot={filterBarThemeSlot("selectTrigger", "rowOperatorTrigger")}
            unstyled={theme.unstyledPrimitives}
            className={cn(
              theme.classNames.selectTrigger,
              theme.classNames.rowOperatorTrigger,
            )}
            render={<Button unstyled={theme.unstyledPrimitives} variant="outline" />}
          >
            <SelectValue>
              {(value) => OPERATOR_LABELS[String(value)] ?? String(value ?? "")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            data-theme-slot={filterBarThemeSlot("selectContent")}
            unstyled={theme.unstyledPrimitives}
            className={theme.classNames.selectContent}
          >
            {allowedOperators.map((operator) => (
              <SelectItem
                key={operator}
                value={operator}
                data-theme-slot={filterBarThemeSlot("selectItem")}
                unstyled={theme.unstyledPrimitives}
                className={theme.classNames.selectItem}
              >
                {OPERATOR_LABELS[operator] ?? operator}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : hasLockedOperator ? null : (
        <ButtonGroupText
          data-theme-slot={filterBarThemeSlot("rowOperatorText")}
          unstyled={theme.unstyledPrimitives}
          className={theme.classNames.rowOperatorText}
        >
          <span>{OPERATOR_LABELS[item.operator] ?? item.operator}</span>
        </ButtonGroupText>
      )}

      {isEmptyOperator(item.operator) ? null : (
        <>
          <div
            data-slot="button-group-text"
            data-theme-slot={filterBarThemeSlot("rowValue")}
            className={theme.classNames.rowValue}
          >
            <FilterValueEditor
              field={field}
              item={item}
              onChange={(value) =>
                onUpdate((current) => ({
                  ...current,
                  value,
                }))
              }
            />
          </div>
        </>
      )}

      <Button
        data-theme-slot={filterBarThemeSlot("rowRemoveButton")}
        unstyled={theme.unstyledPrimitives}
        variant="outline"
        size="lg"
        aria-label={`Remove ${field.label ?? field.id} filter`}
        onClick={onRemove}
        className={theme.classNames.rowRemoveButton}
      >
        {theme.icons.remove ?? theme.texts.removeLabelFallback}
      </Button>
    </ButtonGroup>
  );
}
