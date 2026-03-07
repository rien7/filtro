import type { EnumFieldKind } from "@/logical/field";
import type { FilterBarValue } from "@/ui/filter-bar/context";
import type { UIFieldForKind } from "@/ui/types";

export interface FilterValueEditorProps<
  FieldId extends string,
  Kind extends EnumFieldKind,
> {
  field: UIFieldForKind<FieldId, Kind>;
  item: FilterBarValue<FieldId, Kind>;
  onChange: (value: FilterBarValue<FieldId, Kind>["value"]) => void;
}

export const FILTER_ITEM_EDITOR_ROOT_CLASS = "flex h-full w-full min-w-0 items-stretch";

export const FILTER_ITEM_EDITOR_CONTROL_CLASS =
  "h-full min-h-0 w-full rounded-none border-0 px-3 py-0 shadow-none hover:bg-muted focus-visible:ring-0";

export const FILTER_ITEM_EDITOR_SPLIT_CLASS =
  "grid h-full min-w-0 w-full grid-cols-2 items-stretch [&>*]:h-full";

export function updateTupleValue<T>(value: T[] | null, index: number, nextValue: T) {
  const nextTuple = value ? [...value] : [];
  nextTuple[index] = nextValue;
  return nextTuple as [T, T];
}

export function stringifyArrayValue(value: string[]) {
  return value.join(", ");
}

export function getOptionLabel(
  value: string | null | undefined,
  options: Array<{ label: string; value: string }>,
) {
  if (!value) {
    return null;
  }

  return options.find((option) => option.value === value)?.label ?? value;
}

export function getOptionLabels(values: string[], options: Array<{ label: string; value: string }>) {
  return values
    .map((entry) => getOptionLabel(entry, options) ?? entry)
    .join(", ");
}

export function getToday() {
  return new Date().toISOString().slice(0, 10);
}
