import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { type EnumFieldKind } from "@/logical/field";
import type { FieldDefinition } from "@/ui/builder";
import {
  FilterBarContextProvider,
  type FilterBarContextType,
  type FilterBarSavedView,
  type FilterBarSavedViewType,
  type FilterBarValueType,
} from "@/ui/filter-bar/context";
import {
  areFilterBarValuesEqual,
  resolveFilterBarFields,
  sanitizeFilterBarValues,
} from "@/ui/filter-bar/value";
import {
  FilterBarThemeProvider,
  type FilterBarThemeInput,
} from "@/ui/filter-bar/theme";

const FILTER_BAR_VIEWS_STORAGE_VERSION = 1;

interface PersistedFilterBarViews<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  version: number;
  views: FilterBarSavedViewType<FieldId, Kind>;
}

function createSavedViewId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `view-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function resolveViewsStorageKey<FieldId extends string, Kind extends EnumFieldKind>(
  uiFields: FilterBarContextType<FieldId, Kind>["uiFields"],
  overrideKey?: string,
) {
  if (overrideKey) {
    return overrideKey;
  }

  const fieldFingerprint = uiFields
    .map((field) => `${String(field.id)}:${field.kind}`)
    .join("|");

  return `filtro:views:${fieldFingerprint}`;
}

function sanitizeSavedViews<FieldId extends string, Kind extends EnumFieldKind>(
  uiFields: FilterBarContextType<FieldId, Kind>["uiFields"],
  input: unknown,
) {
  if (!Array.isArray(input)) {
    return [] as FilterBarSavedViewType<FieldId, Kind>;
  }

  const nextViews: FilterBarSavedViewType<FieldId, Kind> = [];

  for (const entry of input) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const candidate = entry as Partial<FilterBarSavedView<FieldId, Kind>>;
    const id = typeof candidate.id === "string" ? candidate.id : "";
    const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
    const values = sanitizeFilterBarValues(uiFields, candidate.values);

    if (!id || !name || values.length === 0) {
      continue;
    }

    const now = new Date().toISOString();

    nextViews.push({
      id,
      name,
      values,
      createdAt:
        typeof candidate.createdAt === "string" ? candidate.createdAt : now,
      updatedAt:
        typeof candidate.updatedAt === "string" ? candidate.updatedAt : now,
    });
  }

  return nextViews;
}

function readSavedViews<FieldId extends string, Kind extends EnumFieldKind>(
  storageKey: string,
  uiFields: FilterBarContextType<FieldId, Kind>["uiFields"],
) {
  if (typeof window === "undefined") {
    return [] as FilterBarSavedViewType<FieldId, Kind>;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) {
      return [] as FilterBarSavedViewType<FieldId, Kind>;
    }

    const parsedValue = JSON.parse(rawValue) as PersistedFilterBarViews<FieldId, Kind>;

    if (parsedValue?.version !== FILTER_BAR_VIEWS_STORAGE_VERSION) {
      return [] as FilterBarSavedViewType<FieldId, Kind>;
    }

    return sanitizeSavedViews(uiFields, parsedValue.views);
  } catch {
    return [] as FilterBarSavedViewType<FieldId, Kind>;
  }
}

function persistSavedViews<FieldId extends string, Kind extends EnumFieldKind>(
  storageKey: string,
  views: FilterBarSavedViewType<FieldId, Kind>,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (views.length === 0) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    const payload: PersistedFilterBarViews<FieldId, Kind> = {
      version: FILTER_BAR_VIEWS_STORAGE_VERSION,
      views,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch {
    // Ignore storage failures so the filter bar keeps working in private mode or quota errors.
  }
}

export interface FilterBarRootProps<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  fields: FieldDefinition<FieldId, Kind>[];
  children?: ReactNode;
  iconMapping?: boolean | Partial<Record<EnumFieldKind, ReactNode>>;
  theme?: FilterBarThemeInput | null;
  value?: FilterBarValueType<FieldId, Kind>;
  defaultValue?: FilterBarValueType<FieldId, Kind>;
  onValueChange?: (nextValue: FilterBarValueType<FieldId, Kind>) => void;
  viewsStorageKey?: string;
}

export function FilterBarRoot<FieldId extends string, Kind extends EnumFieldKind>({
  fields,
  children,
  theme,
  value,
  defaultValue,
  onValueChange,
  viewsStorageKey,
}: FilterBarRootProps<FieldId, Kind>) {
  const { uiFieldEntries, uiFields } = useMemo(
    () => resolveFilterBarFields(fields),
    [fields],
  );
  const [uncontrolledValues, setUncontrolledValues] = useState<FilterBarValueType<FieldId, Kind>>(
    () => sanitizeFilterBarValues(uiFields, defaultValue ?? []),
  );
  const isControlled = value !== undefined;
  const controlledValues = useMemo(
    () => sanitizeFilterBarValues(uiFields, value ?? []),
    [uiFields, value],
  );
  const values = isControlled ? controlledValues : uncontrolledValues;
  const storageKey = useMemo(
    () => resolveViewsStorageKey(uiFields, viewsStorageKey),
    [uiFields, viewsStorageKey],
  );
  const [savedViews, setSavedViews] = useState<FilterBarSavedViewType<FieldId, Kind>>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [pendingViewId, setPendingViewId] = useState<string | null>(null);

  useEffect(() => {
    if (isControlled) {
      return;
    }

    setUncontrolledValues((previous) => {
      const sanitizedValues = sanitizeFilterBarValues(uiFields, previous);
      return areFilterBarValuesEqual(previous, sanitizedValues) ? previous : sanitizedValues;
    });
  }, [isControlled, uiFields]);

  useEffect(() => {
    const nextViews = readSavedViews(storageKey, uiFields);

    setSavedViews(nextViews);
    setActiveViewId(null);
    setPendingViewId(null);
  }, [storageKey, uiFields]);

  useEffect(() => {
    persistSavedViews(storageKey, savedViews);
  }, [savedViews, storageKey]);

  const activeView = useMemo(
    () => savedViews.find((viewEntry) => viewEntry.id === activeViewId) ?? null,
    [activeViewId, savedViews],
  );
  const pendingView = useMemo(
    () => savedViews.find((viewEntry) => viewEntry.id === pendingViewId) ?? null,
    [pendingViewId, savedViews],
  );

  useEffect(() => {
    if (pendingViewId) {
      if (!pendingView) {
        setPendingViewId(null);
        return;
      }

      if (areFilterBarValuesEqual(values, pendingView.values)) {
        setActiveViewId(pendingView.id);
        setPendingViewId(null);
      }

      return;
    }

    if (activeViewId && !activeView) {
      setActiveViewId(null);
      return;
    }

    if (activeView && !areFilterBarValuesEqual(values, activeView.values)) {
      setActiveViewId(null);
    }
  }, [activeView, activeViewId, pendingView, pendingViewId, values]);

  const setValues = useCallback<Dispatch<SetStateAction<FilterBarValueType<FieldId, Kind>>>>(
    (nextState) => {
      if (isControlled) {
        const resolvedValue =
          typeof nextState === "function" ? nextState(controlledValues) : nextState;
        const sanitizedValues = sanitizeFilterBarValues(uiFields, resolvedValue);

        if (!onValueChange || areFilterBarValuesEqual(controlledValues, sanitizedValues)) {
          return;
        }

        onValueChange(sanitizedValues);
        return;
      }

      setUncontrolledValues((previous) => {
        const resolvedValue =
          typeof nextState === "function" ? nextState(previous) : nextState;
        const sanitizedValues = sanitizeFilterBarValues(uiFields, resolvedValue);

        if (areFilterBarValuesEqual(previous, sanitizedValues)) {
          return previous;
        }

        onValueChange?.(sanitizedValues);
        return sanitizedValues;
      });
    },
    [controlledValues, isControlled, onValueChange, uiFields],
  );

  const saveView = useCallback((name: string) => {
    const trimmedName = name.trim();
    const sanitizedValues = sanitizeFilterBarValues(uiFields, values);

    if (!trimmedName || sanitizedValues.length === 0) {
      return null;
    }

    const timestamp = new Date().toISOString();
    const nextView: FilterBarSavedView<FieldId, Kind> = {
      id: createSavedViewId(),
      name: trimmedName,
      values: sanitizedValues,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setSavedViews((previous) => [...previous, nextView]);
    return nextView;
  }, [uiFields, values]);

  const clearActiveView = useCallback(() => {
    setActiveViewId(null);
    setPendingViewId(null);
  }, []);

  const applyView = useCallback((viewId: string) => {
    const nextView = savedViews.find((viewEntry) => viewEntry.id === viewId);

    if (!nextView) {
      return;
    }

    setActiveViewId(null);
    setPendingViewId(viewId);
    setValues(nextView.values);
  }, [savedViews, setValues]);

  const deleteView = useCallback((viewId: string) => {
    setSavedViews((previous) => previous.filter((viewEntry) => viewEntry.id !== viewId));
    setActiveViewId((previous) => (previous === viewId ? null : previous));
    setPendingViewId((previous) => (previous === viewId ? null : previous));
  }, []);

  return (
    <FilterBarThemeProvider theme={theme}>
      <FilterBarContextProvider
        value={{
          uiFieldEntries,
          uiFields,
          values,
          savedViews,
          activeView,
          setValues,
          saveView,
          applyView,
          deleteView,
          clearActiveView,
        } as unknown as FilterBarContextType}
      >
        {children}
      </FilterBarContextProvider>
    </FilterBarThemeProvider>
  );
}
