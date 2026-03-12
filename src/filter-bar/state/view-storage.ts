import type {
  FilterBarContextType,
  FilterBarSavedView,
  FilterBarSavedViewType,
} from '@/filter-bar/context'
import { sanitizeFilterBarValues } from '@/filter-bar/core/value-sanitize'
import type { EnumFieldKind } from '@/logical/field'

const FILTER_BAR_VIEWS_STORAGE_VERSION = 1

interface PersistedFilterBarViews<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  version: number
  views: FilterBarSavedViewType<FieldId, Kind>
}

export function createSavedViewId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `view-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function resolveViewsStorageKey<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  uiFields: FilterBarContextType<FieldId, Kind>['uiFields'],
  overrideKey?: string,
) {
  if (overrideKey) {
    return overrideKey
  }

  const fieldFingerprint = uiFields
    .map(field => `${String(field.id)}:${field.kind}`)
    .join('|')

  return `filtro:views:${fieldFingerprint}`
}

export function sanitizeSavedViews<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  uiFields: FilterBarContextType<FieldId, Kind>['uiFields'],
  input: unknown,
) {
  if (!Array.isArray(input)) {
    return [] as FilterBarSavedViewType<FieldId, Kind>
  }

  const nextViews: FilterBarSavedViewType<FieldId, Kind> = []

  for (const entry of input) {
    if (!entry || typeof entry !== 'object') {
      continue
    }

    const candidate = entry as Partial<FilterBarSavedView<FieldId, Kind>>
    const id = typeof candidate.id === 'string' ? candidate.id : ''
    const name = typeof candidate.name === 'string' ? candidate.name.trim() : ''
    const values = sanitizeFilterBarValues(uiFields, candidate.values)

    if (!id || !name || values.length === 0) {
      continue
    }

    const now = new Date().toISOString()

    nextViews.push({
      id,
      name,
      values,
      createdAt:
        typeof candidate.createdAt === 'string' ? candidate.createdAt : now,
      updatedAt:
        typeof candidate.updatedAt === 'string' ? candidate.updatedAt : now,
    })
  }

  return nextViews
}

export function readSavedViews<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  storageKey: string,
  uiFields: FilterBarContextType<FieldId, Kind>['uiFields'],
) {
  if (typeof window === 'undefined') {
    return [] as FilterBarSavedViewType<FieldId, Kind>
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey)

    if (!rawValue) {
      return [] as FilterBarSavedViewType<FieldId, Kind>
    }

    const parsedValue = JSON.parse(rawValue) as PersistedFilterBarViews<FieldId, Kind>

    if (parsedValue?.version !== FILTER_BAR_VIEWS_STORAGE_VERSION) {
      return [] as FilterBarSavedViewType<FieldId, Kind>
    }

    return sanitizeSavedViews(uiFields, parsedValue.views)
  }
  catch {
    return [] as FilterBarSavedViewType<FieldId, Kind>
  }
}

export function persistSavedViews<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  storageKey: string,
  views: FilterBarSavedViewType<FieldId, Kind>,
) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (views.length === 0) {
      window.localStorage.removeItem(storageKey)
      return
    }

    const payload: PersistedFilterBarViews<FieldId, Kind> = {
      version: FILTER_BAR_VIEWS_STORAGE_VERSION,
      views,
    }

    window.localStorage.setItem(storageKey, JSON.stringify(payload))
  }
  catch {
    // Ignore storage failures so the filter bar keeps working in private mode or quota errors.
  }
}
