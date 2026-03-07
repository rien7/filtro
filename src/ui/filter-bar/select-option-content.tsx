import type { ReactNode } from "react";

import { cn } from "@/ui/lib/utils";
import type { FlattenedSelectOption, SelectOption } from "@/ui/types";

type OptionVisual = Pick<SelectOption, "icon" | "prefix">;

export function getSelectOptionLeadingVisual(option: OptionVisual): ReactNode {
  return option.icon ?? option.prefix ?? null;
}

export function hasSelectOptionIcon(
  option: Pick<SelectOption, "icon"> | Pick<FlattenedSelectOption, "icon">,
) {
  return option.icon !== undefined && option.icon !== null;
}

export function SelectOptionLabel({
  option,
  className,
}: {
  option: Pick<SelectOption, "label" | "icon" | "prefix">;
  className?: string;
}) {
  const leadingVisual = getSelectOptionLeadingVisual(option);

  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      {leadingVisual ? (
        <span className="inline-flex shrink-0 items-center justify-center">
          {leadingVisual}
        </span>
      ) : null}
      <span className="truncate">{option.label}</span>
    </span>
  );
}

export function SelectOptionIconStack({
  options,
  maxVisible = 3,
  className,
}: {
  options: Array<Pick<FlattenedSelectOption, "value" | "icon">>;
  maxVisible?: number;
  className?: string;
}) {
  const visibleOptions = options.filter(hasSelectOptionIcon).slice(0, maxVisible);
  const overflowCount = Math.max(0, options.filter(hasSelectOptionIcon).length - visibleOptions.length);

  if (visibleOptions.length === 0) {
    return null;
  }

  return (
    <span className={cn("inline-flex items-center", className)}>
      {visibleOptions.map((option, index) => (
        <span
          key={option.value}
          className="relative inline-flex shrink-0 items-center justify-center"
          style={{
            marginLeft: index === 0 ? 0 : "-0.5rem",
            zIndex: visibleOptions.length - index,
          }}
        >
          {option.icon}
        </span>
      ))}
      {overflowCount > 0 ? (
        <span className="text-muted-foreground ml-1 shrink-0 text-xs">
          +{overflowCount}
        </span>
      ) : null}
    </span>
  );
}
