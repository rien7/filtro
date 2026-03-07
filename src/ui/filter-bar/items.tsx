import { type EnumFieldKind } from "@/logical/field";
import { type FilterBarValue, useFilterBar } from "@/ui/filter-bar/context";
import { removeFilterBarValue } from "@/ui/filter-bar/state";
import { cn } from "@/ui/lib/utils";
import type { UIFieldForKind } from "@/ui/types";

import { FilterItemRow } from "./items.row";

export function FilterItems({
  className,
}: {
  className?: string;
}) {
  const { uiFields, values, setValues } = useFilterBar();
  const fieldById = new Map(uiFields.map((field) => [field.id, field] as const));
  const activeItems = values.flatMap((item) => {
    const field = fieldById.get(item.fieldId);

    if (!field) {
      return [];
    }

    return [{ field, item }];
  });

  const updateItem = <FieldId extends string, Kind extends EnumFieldKind>(
    field: UIFieldForKind<FieldId, Kind>,
    updater: (
      current: FilterBarValue<FieldId, Kind>,
    ) => FilterBarValue<FieldId, Kind>,
  ) => {
    setValues?.((previous) => {
      const currentIndex = previous.findIndex((value) => value.fieldId === field.id);
      const item = previous[currentIndex];

      if (currentIndex === -1 || item === undefined) {
        return previous;
      }

      const nextValues = [...previous];
      nextValues[currentIndex] = updater(
        item as unknown as FilterBarValue<FieldId, Kind>,
      ) as (typeof previous)[number];
      return nextValues;
    });
  };

  const removeItem = (fieldId: string) => {
    setValues?.((previous) => removeFilterBarValue(previous, fieldId));
  };

  if (!activeItems.length) {
    return (
      <div
        className={cn(
          "text-muted-foreground flex min-h-24 items-center justify-center rounded-2xl border border-dashed px-4 text-sm",
          className,
        )}
      >
        Add a filter to start building conditions.
      </div>
    );
  }

  return (
    <div className={cn("flex flex-row flex-wrap gap-3", className)}>
      {activeItems.map(({ field, item }) => (
        <FilterItemRow
          key={field.id}
          field={field as never}
          item={item as never}
          onUpdate={(updater) => updateItem(field as never, updater)}
          onRemove={() => removeItem(field.id)}
        />
      ))}
    </div>
  );
}
