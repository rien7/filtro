import { type EnumFieldKind } from "@/logical/field";
import { type OperatorKindFor } from "@/logical/operator";
import { Button } from "@/ui/baseui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
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
import type { UIFieldForKind } from "@/ui/types";
import { X } from "lucide-react";

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
  const operatorLabel = OPERATOR_LABELS[item.operator] ?? item.operator;
  const hasMultipleOperators = field.allowedOperators.length > 1;

  return (
    <ButtonGroup className="h-9 md:flex-nowrap">
      <ButtonGroupText className="h-full bg-background border-r-0 select-none">
        <span className="block truncate text-sm font-medium">
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
              allowOperators: [...field.allowedOperators] as typeof current.allowOperators,
              value: normalizeValueForOperator({
                field,
                operator: nextOperator as OperatorKindFor<typeof field.kind>,
                previousValue: current.value as never,
              }) as typeof current.value,
            }))
          }
        >
          <SelectTrigger
            className="h-full w-fit shadow-none font-normal !border-l text-muted-foreground"
            render={<Button variant="outline" />}
          >
            <SelectValue>
              {(value) => OPERATOR_LABELS[String(value)] ?? String(value ?? "")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {field.allowedOperators.map((operator) => (
              <SelectItem key={operator} value={operator}>
                {OPERATOR_LABELS[operator] ?? operator}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
          <ButtonGroupText className="h-full select-none w-fit bg-background px-3 py-2 font-normal !border-l text-muted-foreground">
          <span className="block whitespace-nowrap">{operatorLabel}</span>
        </ButtonGroupText>
      )}

      {isEmptyOperator(item.operator) ? null : (
        <>
          <div
            data-slot="button-group-text"
            className="flex h-full min-w-0 grow overflow-hidden border border-border bg-background border-r-0"
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
        variant="outline"
        size="lg"
        aria-label={`Remove ${field.label ?? field.id} filter`}
        onClick={onRemove}
        className="h-full min-h-0 px-2.5 !border-l hover:bg-destructive/20 hover:text-destructive focus-visible:border-destructive/40 hover:border-destructive/30"
      >
        <X className="size-4" />
      </Button>
    </ButtonGroup>
  );
}
