"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { CheckIcon, ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "./input"

function Select<Value, Multiple extends boolean | undefined = false>(
  props: SelectPrimitive.Root.Props<Value, Multiple>,
) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectTrigger({
  className,
  children,
  showIcon = false,
  icon,
  unstyled = false,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  showIcon?: boolean;
  icon?: React.ReactNode;
  unstyled?: boolean;
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        !unstyled &&
          "border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 data-[popup-open]:border-ring",
        className,
      )}
      {...props}
    >
      <span className={cn(!unstyled && "truncate")}>{children}</span>
      {showIcon && (icon ?? (!unstyled ? (
        <SelectPrimitive.Icon className="text-muted-foreground shrink-0">
          <ChevronDownIcon className="size-4" />
        </SelectPrimitive.Icon>
      ) : null))}
    </SelectPrimitive.Trigger>
  )
}

function SelectValue(props: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectContent({
  align = "start",
  className,
  children,
  sideOffset = 6,
  unstyled = false,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Popup> &
  Pick<React.ComponentProps<typeof SelectPrimitive.Positioner>, "align" | "sideOffset"> & {
    unstyled?: boolean;
  }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        className={cn(!unstyled && "isolate z-50 outline-none")}
        align={align}
        sideOffset={sideOffset}
        alignItemWithTrigger={false}
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            !unstyled &&
            "filtro-popup-motion ring-foreground/10 bg-popover text-popover-foreground rounded-lg p-1 shadow-md ring-1 z-50 max-h-(--available-height) min-w-[var(--anchor-width)] origin-(--transform-origin) overflow-x-hidden overflow-y-auto outline-none data-closed:overflow-hidden",
            className,
          )}
          {...props}
        >
          <SelectPrimitive.List className="outline-none">
            {children}
          </SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({
  className,
  children,
  indicator,
  unstyled = false,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item> & {
  indicator?: React.ReactNode;
  unstyled?: boolean;
}) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        !unstyled &&
          "focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm relative flex cursor-default items-center outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {indicator ?? (!unstyled ? (
        <span className="absolute right-2 flex size-4 items-center justify-center">
          <SelectPrimitive.ItemIndicator>
            <CheckIcon className="size-4" />
          </SelectPrimitive.ItemIndicator>
        </span>
      ) : null)}
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSearchInput({
  className,
  unstyled = false,
  ...props
}: React.ComponentProps<typeof Input> & {
  unstyled?: boolean;
}) {
  return (
    <Input
      unstyled={unstyled}
      className={cn(
        !unstyled &&
          "h-8 border-0 bg-transparent px-1.5 shadow-none focus:ring-0 focus-visible:ring-0",
        className,
      )}
      {...props}
    />
  )
}

function SelectSeparator({
  className,
  unstyled = false,
  ...props
}: React.ComponentProps<"div"> & {
  unstyled?: boolean;
}) {
  return (
    <div
      className={cn(!unstyled && "bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

export {
  Select,
  SelectContent,
  SelectItem,
  SelectSearchInput,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
