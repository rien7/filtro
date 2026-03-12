import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'

import {
  getFilterBarPrimitiveDataSlot,
  useFilterBarPrimitiveClassName,
} from '@/filter-bar/theme'

import { Separator } from './separator'

function ButtonGroup({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<'div'> & {
  orientation?: 'horizontal' | 'vertical'
}) {
  const resolvedClassName = useFilterBarPrimitiveClassName('buttonGroup', className) as string
  const slot = getFilterBarPrimitiveDataSlot('buttonGroup')

  return (
    <div
      role="group"
      data-slot={slot}
      data-orientation={orientation}
      className={resolvedClassName}
      {...props}
    />
  )
}

function ButtonGroupText({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>) {
  const resolvedClassName = useFilterBarPrimitiveClassName('buttonGroupText', className) as string
  const slot = getFilterBarPrimitiveDataSlot('buttonGroupText')

  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: resolvedClassName,
      },
      props,
    ),
    render,
    state: {
      slot,
    },
  })
}

function ButtonGroupSeparator({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof Separator>) {
  const resolvedClassName = useFilterBarPrimitiveClassName('buttonGroupSeparator', className)
  const slot = getFilterBarPrimitiveDataSlot('buttonGroupSeparator')

  return (
    <Separator
      data-slot={slot}
      orientation={orientation}
      className={resolvedClassName}
      {...props}
    />
  )
}

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
}
