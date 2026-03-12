import type { MenuTrigger } from '@base-ui/react'
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useFilterBar } from '@/filter-bar/context'
import { Button } from '@/filter-bar/internal/primitives/baseui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/filter-bar/internal/primitives/baseui/dropdown-menu'
import { filterBarThemeSlot, useFilterBarTheme } from '@/filter-bar/theme'
import { cn } from '@/lib/utils'

const useIsomorphicLayoutEffect
  = typeof window === 'undefined' ? useEffect : useLayoutEffect

function countItemsWithinRows(container: HTMLElement, maxRows: number) {
  const items = [...container.querySelectorAll<HTMLElement>('[data-filtro-view-measure-item=\'true\']')]

  if (items.length === 0 || maxRows < 1) {
    return 0
  }

  let currentRowTop: number | null = null
  let rowIndex = -1
  let visibleCount = 0

  for (const item of items) {
    if (currentRowTop === null || Math.abs(item.offsetTop - currentRowTop) > 1) {
      currentRowTop = item.offsetTop
      rowIndex += 1
    }

    if (rowIndex >= maxRows) {
      break
    }

    visibleCount += 1
  }

  return visibleCount
}

function ViewMeasureButton({ label }: { label: string }) {
  const theme = useFilterBarTheme()

  return (
    <Button
      tabIndex={-1}
      aria-hidden="true"
      className={theme.classNames.viewsButton}
    >
      {label}
    </Button>
  )
}

export interface FilterBarViewsProps extends MenuTrigger.Props {
  maxVisibleCount?: number
  maxVisibleRows?: number
  className?: string
}

export function FilterBarViews({
  children,
  className,
  maxVisibleCount,
  maxVisibleRows,
  ...triggerProps
}: FilterBarViewsProps) {
  const { activeView, applyView, clearActiveView, savedViews } = useFilterBar()
  const theme = useFilterBarTheme()
  const [open, setOpen] = useState(false)
  const [rowLimitedCount, setRowLimitedCount] = useState<number | null>(null)
  const measureWithoutOverflowRef = useRef<HTMLDivElement | null>(null)
  const measureWithOverflowRef = useRef<HTMLDivElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const cappedViews = useMemo(() => {
    if (maxVisibleCount === undefined) {
      return savedViews
    }

    return savedViews.slice(0, Math.max(0, maxVisibleCount))
  }, [maxVisibleCount, savedViews])
  const hiddenByCount = savedViews.length - cappedViews.length

  useIsomorphicLayoutEffect(() => {
    if (maxVisibleRows === undefined) {
      setRowLimitedCount(null)
      return
    }

    const withoutOverflow = measureWithoutOverflowRef.current

    if (!withoutOverflow) {
      return
    }

    const visibleWithoutOverflow = countItemsWithinRows(withoutOverflow, maxVisibleRows)
    const hasOverflow = visibleWithoutOverflow < cappedViews.length || hiddenByCount > 0

    if (!hasOverflow) {
      setRowLimitedCount(cappedViews.length)
      return
    }

    const withOverflow = measureWithOverflowRef.current

    if (!withOverflow) {
      setRowLimitedCount(visibleWithoutOverflow)
      return
    }

    setRowLimitedCount(countItemsWithinRows(withOverflow, maxVisibleRows))
  }, [cappedViews, hiddenByCount, maxVisibleRows])

  useEffect(() => {
    if (maxVisibleRows === undefined || typeof ResizeObserver === 'undefined') {
      return
    }

    const root = rootRef.current

    if (!root) {
      return
    }

    const observer = new ResizeObserver(() => {
      const withoutOverflow = measureWithoutOverflowRef.current

      if (!withoutOverflow) {
        return
      }

      const visibleWithoutOverflow = countItemsWithinRows(withoutOverflow, maxVisibleRows)
      const hasOverflow = visibleWithoutOverflow < cappedViews.length || hiddenByCount > 0

      if (!hasOverflow) {
        setRowLimitedCount(cappedViews.length)
        return
      }

      const withOverflow = measureWithOverflowRef.current
      setRowLimitedCount(
        withOverflow
          ? countItemsWithinRows(withOverflow, maxVisibleRows)
          : visibleWithoutOverflow,
      )
    })

    observer.observe(root)
    return () => observer.disconnect()
  }, [cappedViews.length, hiddenByCount, maxVisibleRows])

  const visibleCount = rowLimitedCount === null ? cappedViews.length : rowLimitedCount
  const visibleViews = cappedViews.slice(0, visibleCount)
  const overflowViews = savedViews.slice(visibleViews.length)
  const hasOverflow = overflowViews.length > 0

  if (savedViews.length === 0) {
    return null
  }

  const overflowLabel = children ?? theme.texts.moreViews

  return (
    <div
      ref={rootRef}
      data-theme-slot={filterBarThemeSlot('viewsRoot')}
      className={cn(theme.classNames.viewsRoot, className)}
    >
      <div
        role="group"
        aria-label="Saved views"
        data-theme-slot={filterBarThemeSlot('viewsList')}
        className={theme.classNames.viewsList}
      >
        {visibleViews.map((viewEntry) => {
          const isActive = activeView?.id === viewEntry.id

          return (
            <Button
              key={viewEntry.id}
              data-active={isActive}
              aria-pressed={isActive}
              data-theme-slot={filterBarThemeSlot('viewsButton')}
              className={theme.classNames.viewsButton}
              onClick={() => {
                if (isActive) {
                  clearActiveView?.()
                  return
                }

                applyView?.(viewEntry.id)
              }}
            >
              {viewEntry.name}
            </Button>
          )
        })}
      </div>

      {hasOverflow
        ? (
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger
                {...triggerProps}
                data-theme-slot={filterBarThemeSlot('viewsOverflowTrigger')}
                className={theme.classNames.viewsOverflowTrigger}
              >
                <span>{overflowLabel}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                data-theme-slot={filterBarThemeSlot('viewsMenuContent')}
                className={theme.classNames.viewsMenuContent}
              >
                {activeView
                  ? (
                      <>
                        <DropdownMenuItem
                          data-theme-slot={filterBarThemeSlot('viewsItem')}
                          className={theme.classNames.viewsItem}
                          onClick={() => {
                            clearActiveView?.()
                            setOpen(false)
                          }}
                        >
                          {theme.texts.exitView}
                        </DropdownMenuItem>
                        {overflowViews.length > 0
                          ? (
                              <DropdownMenuSeparator />
                            )
                          : null}
                      </>
                    )
                  : null}

                {overflowViews.length > 0
                  ? (
                      <DropdownMenuRadioGroup value={activeView?.id ?? ''}>
                        {overflowViews.map(viewEntry => (
                          <DropdownMenuRadioItem
                            key={viewEntry.id}
                            value={viewEntry.id}
                            data-theme-slot={filterBarThemeSlot('viewsItem')}
                            className={theme.classNames.viewsItem}
                            onClick={() => {
                              applyView?.(viewEntry.id)
                              setOpen(false)
                            }}
                          >
                            {viewEntry.name}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    )
                  : (
                      <DropdownMenuItem
                        disabled
                        data-theme-slot={filterBarThemeSlot('viewsEmptyItem')}
                        className={theme.classNames.viewsEmptyItem}
                      >
                        {theme.texts.noSavedViews}
                      </DropdownMenuItem>
                    )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        : null}

      {maxVisibleRows !== undefined
        ? (
            <>
              <div
                ref={measureWithoutOverflowRef}
                aria-hidden="true"
                className="pointer-events-none absolute -z-10 flex w-full flex-wrap gap-2 opacity-0"
              >
                {cappedViews.map(viewEntry => (
                  <div key={`measure:${viewEntry.id}`} data-filtro-view-measure-item="true">
                    <ViewMeasureButton label={viewEntry.name} />
                  </div>
                ))}
              </div>
              <div
                ref={measureWithOverflowRef}
                aria-hidden="true"
                className="pointer-events-none absolute -z-10 flex w-full flex-wrap gap-2 opacity-0"
              >
                {cappedViews.map(viewEntry => (
                  <div key={`measure-overflow:${viewEntry.id}`} data-filtro-view-measure-item="true">
                    <ViewMeasureButton label={viewEntry.name} />
                  </div>
                ))}
                <ViewMeasureButton label={theme.texts.moreViews} />
              </div>
            </>
          )
        : null}
    </div>
  )
}
