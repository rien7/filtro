'use client'

import { Separator as SeparatorPrimitive } from '@base-ui/react/separator'

import {
  getFilterBarPrimitiveDataSlot,
  useFilterBarPrimitiveClassName,
} from '@/filter-bar/theme'

function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: SeparatorPrimitive.Props) {
  const resolvedClassName = useFilterBarPrimitiveClassName('separator', className)
  const slot = getFilterBarPrimitiveDataSlot('separator')

  return (
    <SeparatorPrimitive
      data-slot={slot}
      orientation={orientation}
      className={resolvedClassName}
      {...props}
    />
  )
}

export { Separator }
