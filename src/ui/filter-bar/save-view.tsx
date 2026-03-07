import { useEffect, useState } from "react";

import type { MenuTrigger } from "@base-ui/react";

import { Button } from "@/ui/baseui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/ui/baseui/dropdown-menu";
import { Input } from "@/ui/baseui/input";
import { useFilterBar } from "@/ui/filter-bar/context";
import { filterBarThemeSlot, useFilterBarTheme } from "@/ui/filter-bar/theme";
import { cn } from "@/ui/lib/utils";

export function FilterBarSaveView({
  children,
  disabled,
  ...props
}: MenuTrigger.Props) {
  const { saveView, values } = useFilterBar();
  const theme = useFilterBarTheme();
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const isDisabled = Boolean(disabled) || values.length === 0;

  useEffect(() => {
    if (!open) {
      setName("");
    }
  }, [open]);

  const handleSave = () => {
    const nextView = saveView?.(name);

    if (!nextView) {
      return;
    }

    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger {...props} disabled={isDisabled}>
        {children ?? theme.texts.saveViewTriggerFallback}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        data-theme-slot={filterBarThemeSlot("saveViewContent")}
        unstyled={theme.unstyledPrimitives}
        className={theme.classNames.saveViewContent}
      >
        <form
          className={cn(theme.classNames.saveViewForm)}
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          <Input
            autoFocus
            data-theme-slot={filterBarThemeSlot("saveViewInput")}
            unstyled={theme.unstyledPrimitives}
            className={theme.classNames.saveViewInput}
            value={name}
            placeholder={theme.texts.saveViewNamePlaceholder}
            onChange={(event) => setName(event.currentTarget.value)}
            onKeyDown={(event) => event.stopPropagation()}
          />
          <Button
            type="submit"
            variant="outline"
            data-theme-slot={filterBarThemeSlot("saveViewSubmit")}
            unstyled={theme.unstyledPrimitives}
            className={theme.classNames.saveViewSubmit}
            disabled={name.trim().length === 0}
          >
            {theme.texts.saveViewSubmit}
          </Button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
