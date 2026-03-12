import type { ReactNode, SetStateAction } from 'react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import type { FieldDefinition } from '@/filter-bar/builder'
import type { FilterBarChangeMeta } from '@/filter-bar/change'
import type { FilterBarContextType, FilterBarSavedViewType, FilterBarValueType } from '@/filter-bar/context'
import {
  FilterBarContextProvider,
} from '@/filter-bar/context'
import {
  areFilterBarValuesEqual,
} from '@/filter-bar/core/equality'
import {
  resolveFilterBarFields,
} from '@/filter-bar/core/field-resolution'
import {
  sanitizeFilterBarDraftValues,
  sanitizeFilterBarValues,
} from '@/filter-bar/core/value-sanitize'
import { isSuggestedField } from '@/filter-bar/placement'
import {
  createSavedViewId,
  persistSavedViews,
  readSavedViews,
  resolveViewsStorageKey,
} from '@/filter-bar/state/view-storage'
import type { FilterBarThemeInput } from '@/filter-bar/theme'
import {
  FilterBarThemeProvider,
} from '@/filter-bar/theme'
import type { EnumFieldKind } from '@/logical/field'

export interface FilterBarRootProps<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  fields: FieldDefinition<FieldId, Kind>[]
  children?: ReactNode
  iconMapping?: boolean | Partial<Record<EnumFieldKind, ReactNode>>
  theme?: FilterBarThemeInput | null
  value?: FilterBarValueType<FieldId, Kind>
  defaultValue?: FilterBarValueType<FieldId, Kind>
  onChange?: (
    nextValue: FilterBarValueType<FieldId, Kind>,
    meta?: FilterBarChangeMeta<FieldId>,
  ) => void
  viewsStorageKey?: string
}

export function FilterBarRoot<FieldId extends string, Kind extends EnumFieldKind>({
  fields,
  children,
  theme,
  value,
  defaultValue,
  onChange,
  viewsStorageKey,
}: FilterBarRootProps<FieldId, Kind>) {
  const { uiFieldEntries, uiFields } = useMemo(
    () => resolveFilterBarFields(fields),
    [fields],
  )
  const [uncontrolledValues, setUncontrolledValues] = useState<FilterBarValueType<FieldId, Kind>>(
    () => sanitizeFilterBarValues(uiFields, defaultValue ?? []),
  )
  const [draftValues, setDraftValues] = useState<FilterBarValueType<FieldId, Kind>>([])
  const isControlled = value !== undefined
  const controlledValues = useMemo(
    () => sanitizeFilterBarValues(uiFields, value ?? []),
    [uiFields, value],
  )
  const values = isControlled ? controlledValues : uncontrolledValues
  const storageKey = useMemo(
    () => resolveViewsStorageKey(uiFields, viewsStorageKey),
    [uiFields, viewsStorageKey],
  )
  const [savedViews, setSavedViews] = useState<FilterBarSavedViewType<FieldId, Kind>>([])
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [pendingViewId, setPendingViewId] = useState<string | null>(null)
  const [dismissedSuggestionFieldIds, setDismissedSuggestionFieldIds] = useState<FieldId[]>([])

  useEffect(() => {
    if (isControlled) {
      return
    }

    setUncontrolledValues((previous) => {
      const sanitizedValues = sanitizeFilterBarValues(uiFields, previous)
      return areFilterBarValuesEqual(previous, sanitizedValues) ? previous : sanitizedValues
    })
  }, [isControlled, uiFields])

  useEffect(() => {
    setDraftValues((previous) => {
      const activeFieldIds = new Set(values.map(entry => entry.fieldId))
      const sanitizedValues = sanitizeFilterBarDraftValues(uiFields, previous).filter(
        entry => !activeFieldIds.has(entry.fieldId),
      ) as FilterBarValueType<FieldId, Kind>

      return areFilterBarValuesEqual(previous, sanitizedValues)
        ? previous
        : sanitizedValues
    })
  }, [uiFields, values])

  useEffect(() => {
    const nextViews = readSavedViews(storageKey, uiFields)

    setSavedViews(nextViews)
    setActiveViewId(null)
    setPendingViewId(null)
  }, [storageKey, uiFields])

  useEffect(() => {
    persistSavedViews(storageKey, savedViews)
  }, [savedViews, storageKey])

  useEffect(() => {
    const suggestionFieldIds = new Set(
      uiFields
        .filter(field => isSuggestedField(field))
        .map(field => field.id),
    )

    setDismissedSuggestionFieldIds((previous) => {
      const nextFieldIds = previous.filter(fieldId => suggestionFieldIds.has(fieldId))
      return previous.length === nextFieldIds.length ? previous : nextFieldIds
    })
  }, [uiFields])

  const activeView = useMemo(
    () => savedViews.find(viewEntry => viewEntry.id === activeViewId) ?? null,
    [activeViewId, savedViews],
  )
  const pendingView = useMemo(
    () => savedViews.find(viewEntry => viewEntry.id === pendingViewId) ?? null,
    [pendingViewId, savedViews],
  )

  useEffect(() => {
    if (pendingViewId) {
      if (!pendingView) {
        setPendingViewId(null)
        return
      }

      if (areFilterBarValuesEqual(values, pendingView.values)) {
        setActiveViewId(pendingView.id)
        setPendingViewId(null)
      }

      return
    }

    if (activeViewId && !activeView) {
      setActiveViewId(null)
      return
    }

    if (activeView && !areFilterBarValuesEqual(values, activeView.values)) {
      setActiveViewId(null)
    }
  }, [activeView, activeViewId, pendingView, pendingViewId, values])

  const updateValues = useCallback(
    (
      nextState: SetStateAction<FilterBarValueType<FieldId, Kind>>,
      meta?: FilterBarChangeMeta<FieldId>,
    ) => {
      if (isControlled) {
        const resolvedValue
          = typeof nextState === 'function' ? nextState(controlledValues) : nextState
        const sanitizedValues = sanitizeFilterBarValues(uiFields, resolvedValue)

        if (!onChange || areFilterBarValuesEqual(controlledValues, sanitizedValues)) {
          return
        }

        onChange(sanitizedValues, meta)
        return
      }

      setUncontrolledValues((previous) => {
        const resolvedValue
          = typeof nextState === 'function' ? nextState(previous) : nextState
        const sanitizedValues = sanitizeFilterBarValues(uiFields, resolvedValue)

        if (areFilterBarValuesEqual(previous, sanitizedValues)) {
          return previous
        }

        onChange?.(sanitizedValues, meta)
        return sanitizedValues
      })
    },
    [controlledValues, isControlled, onChange, uiFields],
  )

  const changeValues = useCallback(
    (
      nextState: SetStateAction<FilterBarValueType<FieldId, Kind>>,
      meta: FilterBarChangeMeta<FieldId>,
    ) => {
      updateValues(nextState, meta)
    },
    [updateValues],
  )

  const changeDraftValues = useCallback(
    (nextState: SetStateAction<FilterBarValueType<FieldId, Kind>>) => {
      setDraftValues((previous) => {
        const resolvedValue
          = typeof nextState === 'function' ? nextState(previous) : nextState
        const sanitizedValues = sanitizeFilterBarDraftValues(uiFields, resolvedValue)

        return areFilterBarValuesEqual(previous, sanitizedValues)
          ? previous
          : sanitizedValues
      })
    },
    [uiFields],
  )

  const saveView = useCallback((name: string) => {
    const trimmedName = name.trim()
    const sanitizedValues = sanitizeFilterBarValues(uiFields, values)

    if (!trimmedName || sanitizedValues.length === 0) {
      return null
    }

    const timestamp = new Date().toISOString()
    const nextView = {
      id: createSavedViewId(),
      name: trimmedName,
      values: sanitizedValues,
      createdAt: timestamp,
      updatedAt: timestamp,
    } satisfies FilterBarSavedViewType<FieldId, Kind>[number]

    setSavedViews(previous => [...previous, nextView])
    return nextView
  }, [uiFields, values])

  const clearActiveView = useCallback(() => {
    setActiveViewId(null)
    setPendingViewId(null)
  }, [])

  const applyView = useCallback((viewId: string) => {
    const nextView = savedViews.find(viewEntry => viewEntry.id === viewId)

    if (!nextView) {
      return
    }

    setActiveViewId(null)
    setPendingViewId(viewId)
    updateValues(nextView.values)
  }, [savedViews, updateValues])

  const deleteView = useCallback((viewId: string) => {
    setSavedViews(previous => previous.filter(viewEntry => viewEntry.id !== viewId))
    setActiveViewId(previous => (previous === viewId ? null : previous))
    setPendingViewId(previous => (previous === viewId ? null : previous))
  }, [])

  return (
    <FilterBarThemeProvider theme={theme}>
      <FilterBarContextProvider
        value={{
          uiFieldEntries,
          uiFields,
          values,
          draftValues,
          savedViews,
          activeView,
          dismissedSuggestionFieldIds,
          changeValues,
          changeDraftValues,
          changeDismissedSuggestionFieldIds: setDismissedSuggestionFieldIds,
          saveView,
          applyView,
          deleteView,
          clearActiveView,
        } as unknown as FilterBarContextType}
      >
        {children}
      </FilterBarContextProvider>
    </FilterBarThemeProvider>
  )
}
