'use client'

import { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import * as React from 'react'

import {
  getFilterBarPrimitiveDataSlot,
  useFilterBarPrimitiveClassName,
} from '@/filter-bar/theme'

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  const rootClassName = useFilterBarPrimitiveClassName('switch', className)
  const thumbClassName = useFilterBarPrimitiveClassName('switchThumb')
  const rootSlot = getFilterBarPrimitiveDataSlot('switch')
  const thumbSlot = getFilterBarPrimitiveDataSlot('switchThumb')

  return (
    <SwitchPrimitive.Root
      data-slot={rootSlot}
      className={rootClassName}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot={thumbSlot}
        className={thumbClassName}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
