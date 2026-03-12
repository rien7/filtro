import type { ComponentProps } from 'react'

import { useFilterBar } from '@/filter-bar/context'
import { Button } from '@/filter-bar/internal/primitives/baseui/button'
import { resolveDismissedSuggestionFieldIdsForClear } from '@/filter-bar/state/display-rows'

export function FilterBarClear({ children, ...props }: ComponentProps<typeof Button>) {
  const {
    changeDismissedSuggestionFieldIds,
    changeDraftValues,
    changeValues,
    clearActiveView,
    dismissedSuggestionFieldIds,
    uiFields,
    values,
  } = useFilterBar()
  const handleButtonClick = () => {
    clearActiveView?.()
    changeDraftValues?.([])
    changeDismissedSuggestionFieldIds?.(
      resolveDismissedSuggestionFieldIdsForClear(
        uiFields,
        values,
        dismissedSuggestionFieldIds,
      ),
    )
    changeValues?.([], { action: 'clear' })
  }
  return (
    <Button {...props} onClick={handleButtonClick}>
      {children}
    </Button>
  )
}
