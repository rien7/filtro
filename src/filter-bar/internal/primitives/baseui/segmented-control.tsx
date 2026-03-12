'use client'

import { mergeProps } from '@base-ui/react/merge-props'
import { Radio as RadioPrimitive } from '@base-ui/react/radio'
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group'
import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'

import {
  getFilterBarPrimitiveDataSlot,
  useFilterBarPrimitiveClassName,
} from '@/filter-bar/theme'

type SegmentedControlIndicatorLayout = {
  x: number
  y: number
  width: number
  height: number
}

interface SegmentedControlContextValue<Value = unknown> {
  currentValue: Value | undefined
  indicatorLayout: SegmentedControlIndicatorLayout | null
  registerItem: (value: Value, node: HTMLElement | null) => void
}

const SegmentedControlContext
  = React.createContext<SegmentedControlContextValue<any> | null>(null)

const useIsomorphicLayoutEffect
  = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

function useSegmentedControlContext<Value>(componentName: string) {
  const context = React.useContext(SegmentedControlContext)

  if (!context) {
    throw new Error(`${componentName} must be used within <SegmentedControl />.`)
  }

  return context as SegmentedControlContextValue<Value>
}

function areIndicatorLayoutsEqual(
  first: SegmentedControlIndicatorLayout | null,
  second: SegmentedControlIndicatorLayout | null,
) {
  if (first === second) {
    return true
  }

  if (!first || !second) {
    return false
  }

  return (
    first.x === second.x
    && first.y === second.y
    && first.width === second.width
    && first.height === second.height
  )
}

function SegmentedControl<Value>({
  className,
  defaultValue,
  onValueChange,
  value,
  ...props
}: RadioGroupPrimitive.Props<Value>) {
  const resolvedClassName = useFilterBarPrimitiveClassName('segmentedControl', className)
  const slot = getFilterBarPrimitiveDataSlot('segmentedControl')
  const rootRef = React.useRef<HTMLElement | null>(null)
  const itemRefs = React.useRef(new Map<Value, HTMLElement>())
  const animationFrameRef = React.useRef<number | null>(null)
  const [itemRegistryVersion, setItemRegistryVersion] = React.useState(0)
  const [indicatorLayout, setIndicatorLayout]
    = React.useState<SegmentedControlIndicatorLayout | null>(null)
  const isControlled = value !== undefined
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const currentValue = isControlled ? value : uncontrolledValue

  const measureIndicator = React.useCallback(() => {
    animationFrameRef.current = null

    if (currentValue === undefined) {
      setIndicatorLayout(previous => (previous ? null : previous))
      return
    }

    const rootNode = rootRef.current
    const activeItem = itemRefs.current.get(currentValue)

    if (!rootNode || !activeItem) {
      setIndicatorLayout(previous => (previous ? null : previous))
      return
    }

    const rootRect = rootNode.getBoundingClientRect()
    const itemRect = activeItem.getBoundingClientRect()
    const nextLayout = {
      x: itemRect.left - rootRect.left,
      y: itemRect.top - rootRect.top,
      width: itemRect.width,
      height: itemRect.height,
    }

    setIndicatorLayout(previous =>
      areIndicatorLayoutsEqual(previous, nextLayout) ? previous : nextLayout)
  }, [currentValue])

  const cancelScheduledMeasurement = React.useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  const scheduleMeasurement = React.useCallback(() => {
    cancelScheduledMeasurement()

    if (typeof window === 'undefined') {
      measureIndicator()
      return
    }

    animationFrameRef.current = window.requestAnimationFrame(measureIndicator)
  }, [cancelScheduledMeasurement, measureIndicator])

  const handleValueChange = React.useCallback(
    (nextValue: Value, eventDetails: RadioGroupPrimitive.ChangeEventDetails) => {
      if (!isControlled) {
        setUncontrolledValue(nextValue)
      }

      onValueChange?.(nextValue, eventDetails)
    },
    [isControlled, onValueChange],
  )

  const registerItem = React.useCallback((itemValue: Value, node: HTMLElement | null) => {
    const previousNode = itemRefs.current.get(itemValue)

    if (node) {
      if (previousNode === node) {
        return
      }

      itemRefs.current.set(itemValue, node)
    }
    else if (previousNode) {
      itemRefs.current.delete(itemValue)
    }
    else {
      return
    }

    setItemRegistryVersion(previous => previous + 1)
  }, [])

  const setRootNode = React.useCallback(
    (node: HTMLElement | null) => {
      rootRef.current = node
      scheduleMeasurement()
    },
    [scheduleMeasurement],
  )

  useIsomorphicLayoutEffect(() => {
    scheduleMeasurement()

    return cancelScheduledMeasurement
  }, [cancelScheduledMeasurement, currentValue, itemRegistryVersion, scheduleMeasurement])

  useIsomorphicLayoutEffect(() => {
    const rootNode = rootRef.current

    if (!rootNode) {
      return undefined
    }

    const activeItem
      = currentValue === undefined ? null : itemRefs.current.get(currentValue)

    if (typeof ResizeObserver === 'undefined') {
      if (typeof window === 'undefined') {
        return undefined
      }

      const handleResize = () => {
        scheduleMeasurement()
      }

      window.addEventListener('resize', handleResize)
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }

    const observer = new ResizeObserver(() => {
      scheduleMeasurement()
    })

    observer.observe(rootNode)

    if (activeItem) {
      observer.observe(activeItem)
    }

    return () => {
      observer.disconnect()
    }
  }, [currentValue, itemRegistryVersion, scheduleMeasurement])

  const contextValue = React.useMemo(
    () => ({
      currentValue,
      indicatorLayout,
      registerItem,
    }),
    [currentValue, indicatorLayout, registerItem],
  )

  return (
    <SegmentedControlContext.Provider value={contextValue}>
      <RadioGroupPrimitive
        data-slot={slot}
        className={resolvedClassName}
        ref={setRootNode}
        value={currentValue}
        onValueChange={handleValueChange}
        {...props}
      />
    </SegmentedControlContext.Provider>
  )
}

function SegmentedControlIndicator({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div', { active: boolean }>) {
  const resolvedClassName = useFilterBarPrimitiveClassName(
    'segmentedControlIndicator',
    className,
  ) as string
  const slot = getFilterBarPrimitiveDataSlot('segmentedControlIndicator')
  const { indicatorLayout } = useSegmentedControlContext('SegmentedControlIndicator')
  const active = indicatorLayout !== null

  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        'aria-hidden': true,
        'className': resolvedClassName,
        'style': {
          transform: active
            ? `translate3d(${indicatorLayout.x}px, ${indicatorLayout.y}px, 0)`
            : 'translate3d(0, 0, 0)',
          width: active ? indicatorLayout.width : 0,
          height: active ? indicatorLayout.height : 0,
          opacity: active ? 1 : 0,
        },
      },
      props,
    ),
    render,
    state: {
      active,
      slot,
    },
  })
}

function SegmentedControlItem<Value>({
  className,
  value,
  ...props
}: RadioPrimitive.Root.Props<Value>) {
  const resolvedClassName = useFilterBarPrimitiveClassName(
    'segmentedControlItem',
    className,
  )
  const slot = getFilterBarPrimitiveDataSlot('segmentedControlItem')
  const { registerItem } = useSegmentedControlContext<Value>('SegmentedControlItem')

  const setItemNode = React.useCallback(
    (node: HTMLElement | null) => {
      registerItem(value, node)
    },
    [registerItem, value],
  )

  return (
    <RadioPrimitive.Root
      data-slot={slot}
      className={resolvedClassName}
      ref={setItemNode}
      value={value}
      {...props}
    />
  )
}

function SegmentedControlItemText({
  className,
  render,
  ...props
}: useRender.ComponentProps<'span'>) {
  const resolvedClassName = useFilterBarPrimitiveClassName(
    'segmentedControlItemText',
    className,
  ) as string
  const slot = getFilterBarPrimitiveDataSlot('segmentedControlItemText')

  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
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

export {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
  SegmentedControlItemText,
}
