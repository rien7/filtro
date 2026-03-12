'use client'

import { Button as ButtonPrimitive } from '@base-ui/react/button'

import {
  getFilterBarPrimitiveDataSlot,
  useFilterBarPrimitiveClassName,
} from '@/filter-bar/theme'

function Button({
  className,
  ...props
}: ButtonPrimitive.Props) {
  const resolvedClassName = useFilterBarPrimitiveClassName('button', className)
  const slot = getFilterBarPrimitiveDataSlot('button')

  return (
    <ButtonPrimitive
      data-slot={slot}
      className={resolvedClassName}
      {...props}
    />
  )
}

export { Button }
