import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  FilterBarApplyMeta,
  FilterBarApplyMode,
  FilterBarChangeMeta,
} from '@/filter-bar/change'
import type { FilterBarValueType } from '@/filter-bar/context'
import { areFilterBarValuesEqual } from '@/filter-bar/core/equality'
import type { EnumFieldKind } from '@/logical/field'

type ApplyDecision = 'apply' | 'skip' | 'debounce'

export interface UseFilterBarControllerOptions<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  defaultValue?: FilterBarValueType<FieldId, Kind>
  appliedValue?: FilterBarValueType<FieldId, Kind>
  onAppliedChange?: (
    nextValue: FilterBarValueType<FieldId, Kind>,
    meta: FilterBarApplyMeta<FieldId>,
  ) => void
  applyMode?: FilterBarApplyMode
  debounceMs?: number
}

export interface FilterBarController<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  draftValue: FilterBarValueType<FieldId, Kind>
  onDraftChange: (
    nextValue: FilterBarValueType<FieldId, Kind>,
    meta?: FilterBarChangeMeta<FieldId>,
  ) => void
  appliedValue: FilterBarValueType<FieldId, Kind>
  apply: () => void
  clear: () => void
  discardChanges: () => void
  isDirty: boolean
}

function resolveApplyDecision<FieldId extends string>(
  meta: FilterBarChangeMeta<FieldId> | undefined,
): ApplyDecision {
  if (!meta) {
    return 'skip'
  }

  switch (meta.action) {
    case 'clear':
      return 'skip'
    case 'remove':
      return 'apply'
    case 'add':
    case 'operator':
      return meta.completeness === 'complete' ? 'apply' : 'skip'
    case 'value':
      if (meta.completeness === 'incomplete') {
        return 'skip'
      }

      return meta.valueChangeKind === 'typing' ? 'debounce' : 'apply'
    default:
      return 'skip'
  }
}

export function useFilterBarController<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
>({
  defaultValue = [] as FilterBarValueType<FieldId, Kind>,
  appliedValue: controlledAppliedValue,
  onAppliedChange,
  applyMode = 'manual',
  debounceMs = 300,
}: UseFilterBarControllerOptions<FieldId, Kind> = {}): FilterBarController<FieldId, Kind> {
  const isAppliedControlled = controlledAppliedValue !== undefined
  const [uncontrolledAppliedValue, setUncontrolledAppliedValue] = useState<
    FilterBarValueType<FieldId, Kind>
  >(() => controlledAppliedValue ?? defaultValue)
  const [draftValue, setDraftValue] = useState<FilterBarValueType<FieldId, Kind>>(
    () => controlledAppliedValue ?? defaultValue,
  )
  const appliedValue = isAppliedControlled
    ? (controlledAppliedValue ?? defaultValue)
    : uncontrolledAppliedValue
  const appliedValueRef = useRef(appliedValue)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearPendingApply = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
  }, [])

  const commitAppliedValue = useCallback(
    (
      nextValue: FilterBarValueType<FieldId, Kind>,
      meta: FilterBarApplyMeta<FieldId>,
    ) => {
      const currentAppliedValue = appliedValueRef.current

      if (areFilterBarValuesEqual(currentAppliedValue, nextValue)) {
        return
      }

      if (!isAppliedControlled) {
        setUncontrolledAppliedValue(nextValue)
      }

      onAppliedChange?.(nextValue, meta)
    },
    [isAppliedControlled, onAppliedChange],
  )

  useEffect(() => {
    if (areFilterBarValuesEqual(appliedValueRef.current, appliedValue)) {
      return
    }

    appliedValueRef.current = appliedValue
    clearPendingApply()
    setDraftValue(appliedValue)
  }, [appliedValue, clearPendingApply])

  useEffect(() => {
    return () => {
      clearPendingApply()
    }
  }, [clearPendingApply])

  const apply = useCallback(() => {
    clearPendingApply()
    commitAppliedValue(draftValue, {
      source: 'apply',
      change: null,
    })
  }, [clearPendingApply, commitAppliedValue, draftValue])

  const clear = useCallback(() => {
    clearPendingApply()
    setDraftValue([])
  }, [clearPendingApply])

  const discardChanges = useCallback(() => {
    clearPendingApply()
    setDraftValue(appliedValueRef.current)
  }, [clearPendingApply])

  const onDraftChange = useCallback(
    (
      nextValue: FilterBarValueType<FieldId, Kind>,
      meta?: FilterBarChangeMeta<FieldId>,
    ) => {
      clearPendingApply()
      setDraftValue(nextValue)

      if (applyMode !== 'auto') {
        return
      }

      const decision = resolveApplyDecision(meta)

      if (decision === 'skip') {
        return
      }

      if (decision === 'apply') {
        commitAppliedValue(nextValue, {
          source: 'auto',
          change: meta ?? null,
        })
        return
      }

      debounceTimerRef.current = setTimeout(() => {
        commitAppliedValue(nextValue, {
          source: 'auto',
          change: meta ?? null,
        })
        debounceTimerRef.current = null
      }, debounceMs)
    },
    [applyMode, clearPendingApply, commitAppliedValue, debounceMs],
  )

  return {
    draftValue,
    onDraftChange,
    appliedValue,
    apply,
    clear,
    discardChanges,
    isDirty: !areFilterBarValuesEqual(draftValue, appliedValue),
  }
}
