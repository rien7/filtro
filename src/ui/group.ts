import type { EnumFieldKind } from "../logical/field.js";
import type { AnyFieldBuilder, FieldGroupDefinition } from "./builder.js";

export type FieldGroup<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> = FieldGroupDefinition<FieldId, Kind>;

export function groupField<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
>(
  label: string,
  fields: AnyFieldBuilder<FieldId, Kind>[],
): FieldGroup<FieldId, Kind> {
  return {
    label,
    fields,
  };
}
