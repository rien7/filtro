import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { flattenSelectOptions } from "@/ui/filter-bar/state";
import {
  SelectOptionsStatus,
  type FlattenedSelectOption,
  type SelectKind,
  type SelectOption,
  type SelectOptionLoader,
  type SelectOptionsSourceContext,
  type SelectOptionsSourceResult,
  type SelectUIField,
  type UseSelectOptions,
} from "@/ui/types";

const resolvedOptionsCache = new Map<string, SelectOption[]>();
const knownOptionsCache = new Map<string, Map<string, FlattenedSelectOption>>();

function getOptionsCacheKey(fieldId: string, query: string) {
  return `${fieldId}::${query}`;
}

function rememberKnownOptions(fieldId: string, options: SelectOption[]) {
  rememberFlattenedKnownOptions(fieldId, flattenSelectOptions(options));
}

function rememberFlattenedKnownOptions(
  fieldId: string,
  options: FlattenedSelectOption[],
) {
  const cachedOptions = knownOptionsCache.get(fieldId) ?? new Map<string, FlattenedSelectOption>();

  for (const option of options) {
    cachedOptions.set(option.value, option);
  }

  knownOptionsCache.set(fieldId, cachedOptions);
}

function isAsyncOptionsLoader<FieldId extends string, Kind extends SelectKind>(
  field: SelectUIField<FieldId, Kind>,
): field is SelectUIField<FieldId, Kind> & { options: SelectOptionLoader } {
  return typeof field.options === "function";
}

function getStaticOptions<FieldId extends string, Kind extends SelectKind>(
  field: SelectUIField<FieldId, Kind>,
) {
  return Array.isArray(field.options) ? field.options : [];
}

async function resolveOptionsLoader<FieldId extends string, Kind extends SelectKind>(
  field: SelectUIField<FieldId, Kind> & { options: SelectOptionLoader },
  query: string,
  signal?: AbortSignal,
) {
  const cacheKey = getOptionsCacheKey(field.id, query);
  const cachedOptions = resolvedOptionsCache.get(cacheKey);
  if (cachedOptions) {
    return cachedOptions;
  }

  const nextOptions = await field.options(signal ? { query, signal } : { query });
  resolvedOptionsCache.set(cacheKey, nextOptions);
  rememberKnownOptions(field.id, nextOptions);
  return nextOptions;
}

function useBuiltInSelectOptions<
  FieldId extends string,
  Kind extends SelectKind,
>(
  context: SelectOptionsSourceContext<FieldId, Kind>,
): SelectOptionsSourceResult {
  const {
    field,
    normalizedQuery,
    shouldLoad,
  } = context;
  const cacheKey = getOptionsCacheKey(field.id, normalizedQuery);
  const isAsync = isAsyncOptionsLoader(field);
  const [options, setOptions] = useState<SelectOption[]>(() => {
    if (!isAsync) {
      return filterSelectOptions(getStaticOptions(field), normalizedQuery);
    }

    return resolvedOptionsCache.get(cacheKey) ?? [];
  });
  const [status, setStatus] = useState<SelectOptionsStatus>(() => {
    if (!isAsync) {
      return SelectOptionsStatus.success;
    }

    return resolvedOptionsCache.has(cacheKey)
      ? SelectOptionsStatus.success
      : SelectOptionsStatus.idle;
  });
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isAsync) {
      const staticOptions = getStaticOptions(field);
      rememberKnownOptions(field.id, staticOptions);
      setOptions(filterSelectOptions(staticOptions, normalizedQuery));
      setStatus(SelectOptionsStatus.success);
      setError(null);
      return;
    }

    const cachedOptions = resolvedOptionsCache.get(cacheKey);
    if (cachedOptions) {
      rememberKnownOptions(field.id, cachedOptions);
      setOptions(cachedOptions);
      setStatus(SelectOptionsStatus.success);
      setError(null);
      return;
    }

    if (!shouldLoad) {
      setOptions([]);
      setStatus(SelectOptionsStatus.idle);
      setError(null);
      return;
    }

    const controller = new AbortController();
    let active = true;

    setOptions([]);
    setStatus(SelectOptionsStatus.loading);
    setError(null);

    void resolveOptionsLoader(field, normalizedQuery, controller.signal)
      .then((nextOptions) => {
        if (!active) {
          return;
        }

        setOptions(nextOptions);
        setStatus(SelectOptionsStatus.success);
        setError(null);
      })
      .catch((caughtError) => {
        if (!active || controller.signal.aborted) {
          return;
        }

        const nextError = caughtError instanceof Error
          ? caughtError
          : new Error("Failed to load options");
        setOptions([]);
        setStatus(SelectOptionsStatus.error);
        setError(nextError);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [cacheKey, field, isAsync, normalizedQuery, shouldLoad]);

  return useMemo(() => ({
    error,
    options,
    status,
  }), [error, options, status]);
}

function useResolvedSelectOptionsSource<
  FieldId extends string,
  Kind extends SelectKind,
>(
  field: SelectUIField<FieldId, Kind>,
  context: SelectOptionsSourceContext<FieldId, Kind>,
) {
  const source = field.useOptions ?? useBuiltInSelectOptions;
  return source(context);
}

export function useSelectableFieldOptions<
  FieldId extends string,
  Kind extends SelectKind,
>(
  field: SelectUIField<FieldId, Kind>,
  {
    selectedValues = [],
  }: {
    selectedValues?: string[];
  } = {},
) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const isSearchEnabled = field.optionsSearchable ?? true;
  const deferredQuery = useDeferredValue(isSearchEnabled ? query : "");
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const shouldLoad = field.optionsLoadMode === "render" || open;
  const {
    error,
    options: visibleTreeOptions,
    selectedOptions: controlledSelectedOptions,
    status,
  } = useResolvedSelectOptionsSource(field, {
    field,
    normalizedQuery,
    open,
    query: deferredQuery,
    selectedValues,
    shouldLoad,
  });
  const visibleOptions = useMemo(
    () => flattenSelectOptions(visibleTreeOptions),
    [visibleTreeOptions],
  );

  useEffect(() => {
    rememberKnownOptions(field.id, visibleTreeOptions);
  }, [field.id, visibleTreeOptions]);

  useEffect(() => {
    if (!controlledSelectedOptions?.length) {
      return;
    }

    rememberFlattenedKnownOptions(field.id, controlledSelectedOptions);
  }, [controlledSelectedOptions, field.id]);

  const selectedOptions = useMemo(
    () => controlledSelectedOptions ?? getKnownSelectedOptions(field.id, selectedValues),
    [controlledSelectedOptions, field.id, selectedValues],
  );
  const displayOptions = useMemo(() => {
    const nextOptions = [...visibleOptions];

    for (const option of selectedOptions) {
      if (!nextOptions.some((entry) => entry.value === option.value)) {
        nextOptions.push(option);
      }
    }

    return nextOptions;
  }, [selectedOptions, visibleOptions]);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
    }
  }, []);

  return useMemo(
    () => ({
      displayOptions,
      error,
      handleOpenChange,
      isSearchEnabled,
      open,
      query,
      selectedOptions,
      setQuery,
      status,
      visibleOptions,
      visibleTreeOptions,
    }),
    [
      displayOptions,
      error,
      handleOpenChange,
      isSearchEnabled,
      open,
      query,
      selectedOptions,
      status,
      visibleOptions,
      visibleTreeOptions,
    ],
  );
}

export function filterSelectOptions(options: SelectOption[], query: string): SelectOption[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return options;
  }

  return options.flatMap((option) => {
    const matchesOption = `${option.label} ${option.value}`.toLowerCase().includes(normalizedQuery);
    const nextChildren = option.children ? filterSelectOptions(option.children, normalizedQuery) : [];

    if (matchesOption) {
      return [{ ...option }];
    }

    if (nextChildren.length > 0) {
      return [{ ...option, children: nextChildren }];
    }

    return [];
  });
}

export function getKnownSelectedOptions(
  fieldId: string,
  selectedValues: string[],
) {
  const cachedOptions = knownOptionsCache.get(fieldId);
  if (!cachedOptions || selectedValues.length === 0) {
    return [];
  }

  const nextOptions: FlattenedSelectOption[] = [];

  for (const value of selectedValues) {
    const cachedOption = cachedOptions.get(value);
    if (!cachedOption) {
      continue;
    }

    nextOptions.push(cachedOption);
  }

  return nextOptions;
}
