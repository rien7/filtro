import { useEffect } from "react";

import { FieldKind, type EnumFieldKind } from "@/logical/field";
import type { FilterBarValue } from "@/ui/filter-bar/context";
import { validateFieldValue } from "@/ui/filter-bar/validation";
import { isEmptyOperator } from "@/ui/filter-bar/state";
import type { UIFieldForKind } from "@/ui/types";

import { BooleanValueEditor } from "./items-editors/boolean-value-editor";
import { DateValueEditor } from "./items-editors/date-value-editor";
import { MultiSelectValueEditor } from "./items-editors/multi-select-value-editor";
import { NumberValueEditor } from "./items-editors/number-value-editor";
import { SelectValueEditor } from "./items-editors/select-value-editor";
import { StringValueEditor } from "./items-editors/string-value-editor";

export function FilterValueEditor<FieldId extends string, Kind extends EnumFieldKind>({
  field,
  item,
  onChange,
  onValidationChange,
  errorDescriptionId,
}: {
  field: UIFieldForKind<FieldId, Kind>;
  item: FilterBarValue<FieldId, Kind>;
  onChange: (value: FilterBarValue<FieldId, Kind>["value"]) => void;
  onValidationChange: ((message: string | null) => void) | undefined;
  errorDescriptionId: string | undefined;
}) {
  useEffect(() => {
    if (field.render || isEmptyOperator(item.operator)) {
      onValidationChange?.(null);
    }
  }, [field.render, item.operator, onValidationChange]);

  if (isEmptyOperator(item.operator)) {
    return null;
  }

  if (field.render) {
    return field.render({
      op: item.operator as never,
      value: item.value as never,
      onChange: (value) => onChange(value as FilterBarValue<FieldId, Kind>["value"]),
      validate: (value) =>
        validateFieldValue({
          field,
          op: item.operator as never,
          value: value as never,
        }),
    });
  }

  switch (field.kind) {
    case FieldKind.string:
      return (
        <StringValueEditor
          field={field as UIFieldForKind<FieldId, typeof FieldKind.string>}
          item={item as unknown as FilterBarValue<FieldId, typeof FieldKind.string>}
          onChange={onChange as (value: FilterBarValue<FieldId, typeof FieldKind.string>["value"]) => void}
          onValidationChange={onValidationChange}
          errorDescriptionId={errorDescriptionId}
        />
      );
    case FieldKind.number:
      return (
        <NumberValueEditor
          field={field as UIFieldForKind<FieldId, typeof FieldKind.number>}
          item={item as unknown as FilterBarValue<FieldId, typeof FieldKind.number>}
          onChange={onChange as (value: FilterBarValue<FieldId, typeof FieldKind.number>["value"]) => void}
          onValidationChange={onValidationChange}
          errorDescriptionId={errorDescriptionId}
        />
      );
    case FieldKind.date:
      return (
        <DateValueEditor
          field={field as UIFieldForKind<FieldId, typeof FieldKind.date>}
          item={item as unknown as FilterBarValue<FieldId, typeof FieldKind.date>}
          onChange={onChange as (value: FilterBarValue<FieldId, typeof FieldKind.date>["value"]) => void}
          onValidationChange={onValidationChange}
          errorDescriptionId={errorDescriptionId}
        />
      );
    case FieldKind.select:
      return (
        <SelectValueEditor
          field={field as UIFieldForKind<FieldId, typeof FieldKind.select>}
          item={item as unknown as FilterBarValue<FieldId, typeof FieldKind.select>}
          onChange={onChange as (value: FilterBarValue<FieldId, typeof FieldKind.select>["value"]) => void}
          onValidationChange={undefined}
          errorDescriptionId={undefined}
        />
      );
    case FieldKind.multiSelect:
      return (
        <MultiSelectValueEditor
          field={field as UIFieldForKind<FieldId, typeof FieldKind.multiSelect>}
          item={item as unknown as FilterBarValue<FieldId, typeof FieldKind.multiSelect>}
          onChange={onChange as (value: FilterBarValue<FieldId, typeof FieldKind.multiSelect>["value"]) => void}
          onValidationChange={undefined}
          errorDescriptionId={undefined}
        />
      );
    case FieldKind.boolean:
      return (
        <BooleanValueEditor
          field={field as UIFieldForKind<FieldId, typeof FieldKind.boolean>}
          item={item as unknown as FilterBarValue<FieldId, typeof FieldKind.boolean>}
          onChange={onChange as (value: FilterBarValue<FieldId, typeof FieldKind.boolean>["value"]) => void}
          onValidationChange={undefined}
          errorDescriptionId={undefined}
        />
      );
    default:
      return null;
  }
}
