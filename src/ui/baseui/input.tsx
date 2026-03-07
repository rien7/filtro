"use client"

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "../lib/utils.js"

function Input({
  className,
  type = "text",
  unstyled = false,
  ...props
}: React.ComponentProps<typeof InputPrimitive> & {
  unstyled?: boolean;
}) {
  return (
    <InputPrimitive
      data-slot="input"
      type={type}
      className={cn(
        !unstyled &&
          "border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex h-9 w-full min-w-0 rounded-lg border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
