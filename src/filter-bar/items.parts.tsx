import type { ReactNode } from "react";

import {
  ButtonGroupText,
} from "@/filter-bar/internal/primitives/baseui/button-group";
import { filterBarThemeSlot, useFilterBarTheme } from "@/filter-bar/theme";
import type { UIFieldForKind } from "@/filter-bar/types";
import type { EnumFieldKind } from "@/logical/field";
import { cn } from "@/lib/utils";

import { getOperatorLabel } from "./items.constants";

export function FilterItemFieldSegment<
  FieldId extends string,
  Kind extends EnumFieldKind,
>({
  area = "active",
  field,
  children,
  className,
  showTrailingBorder = false,
  roundRight = false,
}: {
  area?: "active" | "pinned" | "suggestion";
  field: UIFieldForKind<FieldId, Kind>;
  children?: ReactNode;
  className?: string;
  showTrailingBorder?: boolean;
  roundRight?: boolean;
}) {
  const theme = useFilterBarTheme();

  return (
    <ButtonGroupText
      data-area={area}
      data-has-trailing-border={showTrailingBorder}
      data-round-right={roundRight}
      data-theme-slot={filterBarThemeSlot("rowField")}
      className={cn(
        theme.classNames.rowField,
        className,
      )}
    >
      {children ?? (
        <span
          data-theme-slot={filterBarThemeSlot("rowFieldText")}
          className={theme.classNames.rowFieldText}
        >
          {field.label ?? field.id}
        </span>
      )}
    </ButtonGroupText>
  );
}

export function FilterItemOperatorTextSegment({
  area = "active",
  operator,
  children,
  className,
  roundRight = false,
}: {
  area?: "active" | "pinned" | "suggestion";
  operator: string;
  children?: ReactNode;
  className?: string;
  roundRight?: boolean;
}) {
  const theme = useFilterBarTheme();

  return (
    <ButtonGroupText
      data-area={area}
      data-round-right={roundRight}
      data-theme-slot={filterBarThemeSlot("rowOperator", "rowOperatorText")}
      className={cn(
        theme.classNames.rowOperator,
        theme.classNames.rowOperatorText,
        className,
      )}
    >
      {children ?? <span>{getOperatorLabel(operator)}</span>}
    </ButtonGroupText>
  );
}

export function FilterItemValueSegment({
  area = "active",
  children,
  className,
  roundRight = false,
}: {
  area?: "active" | "pinned" | "suggestion";
  children: ReactNode;
  className?: string;
  roundRight?: boolean;
}) {
  const theme = useFilterBarTheme();

  return (
    <div
      data-slot="button-group-text"
      data-round-right={roundRight}
      data-theme-slot={filterBarThemeSlot("rowValue")}
      data-area={area}
      className={cn(
        theme.classNames.rowValue,
        className,
      )}
    >
      {children}
    </div>
  );
}
