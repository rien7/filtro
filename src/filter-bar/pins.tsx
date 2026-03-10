import { useFilterBar } from "@/filter-bar/context";
import {
  applyDisplayRowUpdate,
  clearDisplayRowValue,
  removeDisplayRow,
  resolveDisplayRows,
} from "@/filter-bar/display";
import { isFilterBarValueEqual } from "@/filter-bar/value";
import { filterBarThemeSlot, useFilterBarTheme } from "@/filter-bar/theme";
import { cn } from "@/lib/utils";

import { FilterItemRow } from "./items.row";

export function FilterBarPinnedItems({
  className,
}: {
  className?: string;
}) {
  const {
    changeDismissedSuggestionFieldIds,
    changeDraftValues,
    changeValues,
    draftValues,
    uiFields,
    values,
  } = useFilterBar();
  const theme = useFilterBarTheme();
  const rows = resolveDisplayRows(uiFields, values, draftValues, { area: "pinned" });

  if (!rows.length) {
    return null;
  }

  return (
    <div
      data-theme-slot={filterBarThemeSlot("pinnedItemsRoot")}
      className={cn(theme.classNames.pinnedItemsRoot, className)}
    >
      {rows.map((row) => {
        const clearedRowResult = clearDisplayRowValue({
          field: row.field,
          item: row.item,
          source: row.source,
          draftValues,
          values,
        });
        const clearedItem = clearedRowResult.nextDraftValues.find(
          (entry) => entry.fieldId === row.field.id,
        );
        const clearDisabled = row.source === "draft" && Boolean(
          clearedItem &&
          isFilterBarValueEqual(
            row.item as never,
            clearedItem as never,
          ),
        );

        return (
          <FilterItemRow
            key={row.field.id}
            field={row.field as never}
            item={row.item as never}
            removable={false}
            clearable
            clearDisabled={clearDisabled}
            area="pinned"
            onUpdate={(updater, meta) => {
              const nextItem = updater(row.item as never) as typeof row.item;
              const result = applyDisplayRowUpdate({
                action: meta.action,
                currentItem: row.item,
                field: row.field,
                nextItem,
                source: row.source,
                draftValues,
                values,
              });

              changeDraftValues?.(result.nextDraftValues);

              if (result.dismissedSuggestion !== undefined) {
                changeDismissedSuggestionFieldIds?.((previous) => {
                  const nextFieldIds = new Set(previous);

                  if (result.dismissedSuggestion) {
                    nextFieldIds.add(row.field.id);
                  } else {
                    nextFieldIds.delete(row.field.id);
                  }

                  return [...nextFieldIds];
                });
              }

              if (result.nextValues !== values) {
                changeValues?.(
                  result.nextValues,
                  meta.action === "value"
                    ? {
                        action: "value",
                        fieldId: row.field.id,
                        completeness: meta.completeness,
                        valueChangeKind: meta.valueChangeKind ?? "selected",
                      }
                    : {
                        action: "operator",
                        fieldId: row.field.id,
                        completeness: meta.completeness,
                      },
                );
              }
            }}
            onClear={() => {
              changeDraftValues?.(clearedRowResult.nextDraftValues);

              if (clearedRowResult.nextValues !== values) {
                changeValues?.(clearedRowResult.nextValues, {
                  action: "remove",
                  fieldId: row.field.id,
                });
              }
            }}
            onRemove={() => {
              const result = removeDisplayRow(row.field, values, draftValues);

              changeDraftValues?.(result.nextDraftValues);
              changeDismissedSuggestionFieldIds?.((previous) => {
                const nextFieldIds = new Set(previous);

                if (result.dismissedSuggestion) {
                  nextFieldIds.add(row.field.id);
                } else {
                  nextFieldIds.delete(row.field.id);
                }

                return [...nextFieldIds];
              });

              if (result.nextValues !== values) {
                changeValues?.(result.nextValues, {
                  action: "remove",
                  fieldId: row.field.id,
                });
              }
            }}
          />
        );
      })}
    </div>
  );
}
