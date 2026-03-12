'use client'

import { Input as InputPrimitive } from '@base-ui/react/input'
import * as React from 'react'

import {
  getFilterBarPrimitiveDataSlot,
  useFilterBarPrimitiveClassName,
} from '@/filter-bar/theme'

function Input({
  className,
  type = 'text',
  ...props
}: React.ComponentProps<typeof InputPrimitive>) {
  const resolvedClassName = useFilterBarPrimitiveClassName('input', className)
  const slot = getFilterBarPrimitiveDataSlot('input')

  return (
    <InputPrimitive
      data-slot={slot}
      type={type}
      className={resolvedClassName}
      {...props}
    />
  )
}

export { Input }
