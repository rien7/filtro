'use client'

import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import { CheckIcon, ChevronRightIcon } from 'lucide-react'
import * as React from 'react'

import {
  getFilterBarPrimitiveDataSlot,
  useFilterBarPrimitiveClassName,
} from '@/filter-bar/theme'

function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props) {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
}

function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

function DropdownMenuContent({
  align = 'start',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 4,
  className,
  ...props
}: MenuPrimitive.Popup.Props
  & Pick<
    MenuPrimitive.Positioner.Props,
    'align' | 'alignOffset' | 'side' | 'sideOffset'
  >) {
  const positionerClassName = useFilterBarPrimitiveClassName('dropdownMenuPositioner')
  const popupClassName = useFilterBarPrimitiveClassName('dropdownMenuContent', className)
  const positionerSlot = getFilterBarPrimitiveDataSlot('dropdownMenuPositioner')
  const contentSlot = getFilterBarPrimitiveDataSlot('dropdownMenuContent')

  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        data-slot={positionerSlot}
        className={positionerClassName}
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot={contentSlot}
          className={popupClassName}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}

function DropdownMenuLabel({
  className,
  ...props
}: MenuPrimitive.GroupLabel.Props) {
  const resolvedClassName = useFilterBarPrimitiveClassName('dropdownMenuLabel', className)
  const slot = getFilterBarPrimitiveDataSlot('dropdownMenuLabel')

  return (
    <MenuPrimitive.GroupLabel
      data-slot={slot}
      className={resolvedClassName}
      {...props}
    />
  )
}

function DropdownMenuItem({
  className,
  ...props
}: MenuPrimitive.Item.Props) {
  const resolvedClassName = useFilterBarPrimitiveClassName('dropdownMenuItem', className)
  const slot = getFilterBarPrimitiveDataSlot('dropdownMenuItem')

  return (
    <MenuPrimitive.Item
      data-slot={slot}
      className={resolvedClassName}
      {...props}
    />
  )
}

function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  children,
  submenuIndicator,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & {
  submenuIndicator?: React.ReactNode
}) {
  const resolvedClassName = useFilterBarPrimitiveClassName('dropdownMenuSubTrigger', className)
  const indicatorClassName = useFilterBarPrimitiveClassName('dropdownMenuSubmenuIndicator')
  const triggerSlot = getFilterBarPrimitiveDataSlot('dropdownMenuSubTrigger')
  const indicatorSlot = getFilterBarPrimitiveDataSlot('dropdownMenuSubmenuIndicator')

  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot={triggerSlot}
      className={resolvedClassName}
      {...props}
    >
      {children}
      {submenuIndicator ?? (
        <ChevronRightIcon
          data-slot={indicatorSlot}
          className={indicatorClassName}
        />
      )}
    </MenuPrimitive.SubmenuTrigger>
  )
}

function DropdownMenuSubContent({
  align = 'start',
  alignOffset = -3,
  side = 'right',
  sideOffset = 0,
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  const resolvedClassName = useFilterBarPrimitiveClassName('dropdownMenuSubContent', className)
  const slot = getFilterBarPrimitiveDataSlot('dropdownMenuSubContent')

  return (
    <DropdownMenuContent
      data-slot={slot}
      className={resolvedClassName}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  indicator,
  ...props
}: MenuPrimitive.CheckboxItem.Props & {
  indicator?: React.ReactNode
}) {
  const resolvedClassName = useFilterBarPrimitiveClassName('dropdownMenuCheckboxItem', className)
  const indicatorClassName = useFilterBarPrimitiveClassName('dropdownMenuCheckboxItemIndicator')
  const itemSlot = getFilterBarPrimitiveDataSlot('dropdownMenuCheckboxItem')
  const indicatorSlot = getFilterBarPrimitiveDataSlot('dropdownMenuCheckboxItemIndicator')

  return (
    <MenuPrimitive.CheckboxItem
      data-slot={itemSlot}
      className={resolvedClassName}
      checked={checked}
      {...props}
    >
      {indicator ?? (
        <span
          data-slot={indicatorSlot}
          className={indicatorClassName}
        >
          <MenuPrimitive.CheckboxItemIndicator>
            <CheckIcon />
          </MenuPrimitive.CheckboxItemIndicator>
        </span>
      )}
      {children}
    </MenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
  return (
    <MenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  indicator,
  ...props
}: MenuPrimitive.RadioItem.Props & {
  indicator?: React.ReactNode
}) {
  const resolvedClassName = useFilterBarPrimitiveClassName('dropdownMenuRadioItem', className)
  const indicatorClassName = useFilterBarPrimitiveClassName('dropdownMenuRadioItemIndicator')
  const itemSlot = getFilterBarPrimitiveDataSlot('dropdownMenuRadioItem')
  const indicatorSlot = getFilterBarPrimitiveDataSlot('dropdownMenuRadioItemIndicator')

  return (
    <MenuPrimitive.RadioItem
      data-slot={itemSlot}
      className={resolvedClassName}
      {...props}
    >
      {indicator ?? (
        <span
          data-slot={indicatorSlot}
          className={indicatorClassName}
        >
          <MenuPrimitive.RadioItemIndicator>
            <CheckIcon />
          </MenuPrimitive.RadioItemIndicator>
        </span>
      )}
      {children}
    </MenuPrimitive.RadioItem>
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  const resolvedClassName = useFilterBarPrimitiveClassName('dropdownMenuSeparator', className)
  const slot = getFilterBarPrimitiveDataSlot('dropdownMenuSeparator')

  return (
    <MenuPrimitive.Separator
      data-slot={slot}
      className={resolvedClassName}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
}
