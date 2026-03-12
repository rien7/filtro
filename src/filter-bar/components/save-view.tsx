import type { MenuTrigger } from '@base-ui/react'
import { useEffect, useState } from 'react'

import { stopCompositeInputKeyDownPropagation } from '@/filter-bar/accessibility'
import { useFilterBar } from '@/filter-bar/context'
import { Button } from '@/filter-bar/internal/primitives/baseui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/filter-bar/internal/primitives/baseui/dropdown-menu'
import { Input } from '@/filter-bar/internal/primitives/baseui/input'
import { filterBarThemeSlot, useFilterBarTheme } from '@/filter-bar/theme'
import { cn } from '@/lib/utils'

export function FilterBarSaveView({
  children,
  disabled,
  ...props
}: MenuTrigger.Props) {
  const { saveView, values } = useFilterBar()
  const theme = useFilterBarTheme()
  const [name, setName] = useState('')
  const [open, setOpen] = useState(false)
  const isDisabled = Boolean(disabled) || values.length === 0

  useEffect(() => {
    if (!open) {
      setName('')
    }
  }, [open])

  const handleSave = () => {
    const nextView = saveView?.(name)

    if (!nextView) {
      return
    }

    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger {...props} disabled={isDisabled}>
        {children ?? theme.texts.saveViewTriggerFallback}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        data-theme-slot={filterBarThemeSlot('saveViewContent')}
        className={theme.classNames.saveViewContent}
      >
        <form
          className={cn(theme.classNames.saveViewForm)}
          onSubmit={(event) => {
            event.preventDefault()
            handleSave()
          }}
        >
          <Input
            autoFocus
            data-theme-slot={filterBarThemeSlot('saveViewInput')}
            className={theme.classNames.saveViewInput}
            value={name}
            aria-label={theme.texts.saveViewNamePlaceholder}
            placeholder={theme.texts.saveViewNamePlaceholder}
            onChange={event => setName(event.currentTarget.value)}
            onKeyDown={stopCompositeInputKeyDownPropagation}
          />
          <Button
            type="submit"
            data-theme-slot={filterBarThemeSlot('saveViewSubmit')}
            className={theme.classNames.saveViewSubmit}
            disabled={name.trim().length === 0}
          >
            {theme.texts.saveViewSubmit}
          </Button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
