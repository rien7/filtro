import { type EnumFieldKind } from "@/logical/field";
import { type FilterBarValue, useFilterBar } from "@/ui/filter-bar/context";
import { removeFilterBarValue } from "@/ui/filter-bar/state";
import { filterBarThemeSlot, useFilterBarTheme } from "@/ui/filter-bar/theme";
import { cn } from "@/ui/lib/utils";
import type { UIFieldForKind } from "@/ui/types";

import { FilterItemRow } from "./items.row";

export function FilterItems({
  className,
}: {
  className?: string;
}) {
  const { uiFields, values, setValues } = useFilterBar();
  const theme = useFilterBarTheme();
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
        data-theme-slot={filterBarThemeSlot("emptyState")}
        className={cn(
          theme.classNames.emptyState,
          className,
        )}
      >
        {theme.texts.emptyState}
      </div>
    );
  }

  return (
    <div
      data-theme-slot={filterBarThemeSlot("itemsRoot")}
      className={cn(theme.classNames.itemsRoot, className)}
    >
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
