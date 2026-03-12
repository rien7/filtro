'use client'

import { Select as SelectPrimitive } from '@base-ui/react/select'
import { CheckIcon, ChevronDownIcon } from 'lucide-react'
import * as React from 'react'

import {
  getFilterBarPrimitiveDataSlot,
  useFilterBarPrimitiveClassName,
} from '@/filter-bar/theme'

import { Input } from './input'

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
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  showIcon?: boolean
  icon?: React.ReactNode
}) {
  const resolvedClassName = useFilterBarPrimitiveClassName('selectTrigger', className)
  const textClassName = useFilterBarPrimitiveClassName('selectTriggerText')
  const iconClassName = useFilterBarPrimitiveClassName('selectIcon')
  const triggerSlot = getFilterBarPrimitiveDataSlot('selectTrigger')
  const triggerTextSlot = getFilterBarPrimitiveDataSlot('selectTriggerText')
  const iconSlot = getFilterBarPrimitiveDataSlot('selectIcon')

  return (
    <SelectPrimitive.Trigger
      data-slot={triggerSlot}
      data-show-icon={showIcon}
      className={resolvedClassName}
      {...props}
    >
      <span data-slot={triggerTextSlot} className={textClassName}>
        {children}
      </span>
      {showIcon && (icon ?? (
        <SelectPrimitive.Icon data-slot={iconSlot} className={iconClassName}>
          <ChevronDownIcon className="size-4" />
        </SelectPrimitive.Icon>
      ))}
    </SelectPrimitive.Trigger>
  )
}

function SelectValue(props: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectContent({
  align = 'start',
  className,
  children,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Popup>
  & Pick<React.ComponentProps<typeof SelectPrimitive.Positioner>, 'align' | 'sideOffset'>) {
  const positionerClassName = useFilterBarPrimitiveClassName('selectPositioner')
  const popupClassName = useFilterBarPrimitiveClassName('selectContent', className)
  const positionerSlot = getFilterBarPrimitiveDataSlot('selectPositioner')
  const contentSlot = getFilterBarPrimitiveDataSlot('selectContent')

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        data-slot={positionerSlot}
        className={positionerClassName}
        align={align}
        sideOffset={sideOffset}
        alignItemWithTrigger={false}
      >
        <SelectPrimitive.Popup
          data-slot={contentSlot}
          className={popupClassName}
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
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item> & {
  indicator?: React.ReactNode
}) {
  const resolvedClassName = useFilterBarPrimitiveClassName('selectItem', className)
  const indicatorClassName = useFilterBarPrimitiveClassName('selectItemIndicator')
  const itemSlot = getFilterBarPrimitiveDataSlot('selectItem')
  const itemIndicatorSlot = getFilterBarPrimitiveDataSlot('selectItemIndicator')

  return (
    <SelectPrimitive.Item
      data-slot={itemSlot}
      className={resolvedClassName}
      {...props}
    >
      {indicator ?? (
        <span
          data-slot={itemIndicatorSlot}
          className={indicatorClassName}
        >
          <SelectPrimitive.ItemIndicator>
            <CheckIcon className="size-4" />
          </SelectPrimitive.ItemIndicator>
        </span>
      )}
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSearchInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  const resolvedClassName = useFilterBarPrimitiveClassName('selectSearchInput', className)
  const slot = getFilterBarPrimitiveDataSlot('selectSearchInput')

  return (
    <Input
      data-slot={slot}
      className={resolvedClassName}
      {...props}
    />
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const resolvedClassName = useFilterBarPrimitiveClassName('selectSeparator', className) as string
  const slot = getFilterBarPrimitiveDataSlot('selectSeparator')

  return (
    <div
      data-slot={slot}
      className={resolvedClassName}
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
