import type { EnumFieldKind } from "../logical/field.js";
import type { UIFieldForKind } from "./types.js";

export interface FieldGroup<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  name: string;
  items: UIFieldForKind<FieldId, Kind>[];
}

export function groupField({ groups }: { groups: FieldGroup[] }) {
  return groups;
}
