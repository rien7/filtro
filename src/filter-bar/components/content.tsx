import type { HTMLAttributes } from 'react'

import { filterBarThemeSlot, useFilterBarTheme } from '@/filter-bar/theme'
import { cn } from '@/lib/utils'

export function FilterBarContent({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const theme = useFilterBarTheme()

  return (
    <div
      data-theme-slot={filterBarThemeSlot('contentRoot')}
      className={cn(theme.classNames.contentRoot, className)}
      {...props}
    >
      {children}
    </div>
  )
}
