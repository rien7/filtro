import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import type {
  FlattenedSelectOption,
  SelectKind,
  SelectOption,
  SelectOptionLoader,
  SelectUIField,
} from "@/ui/types";
import { flattenSelectOptions } from "@/ui/filter-bar/state";

type SelectOptionsStatus = "idle" | "loading" | "success" | "error";

const resolvedOptionsCache = new Map<string, SelectOption[]>();
const pendingOptionsCache = new Map<string, Promise<SelectOption[]>>();
const knownOptionsCache = new Map<string, Map<string, FlattenedSelectOption>>();

function getOptionsCacheKey(fieldId: string, query: string) {
  return `${fieldId}::${query}`;
}

function rememberKnownOptions(fieldId: string, options: SelectOption[]) {
  const nextOptions = flattenSelectOptions(options);
  const cachedOptions = knownOptionsCache.get(fieldId) ?? new Map<string, FlattenedSelectOption>();

  for (const option of nextOptions) {
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
) {
  const cacheKey = getOptionsCacheKey(field.id, query);
  const cachedOptions = resolvedOptionsCache.get(cacheKey);
  if (cachedOptions) {
    return cachedOptions;
  }

  const pendingOptions = pendingOptionsCache.get(cacheKey);
  if (pendingOptions) {
    return pendingOptions;
  }

  const nextRequest = field.options({ query })
    .then((options) => {
      resolvedOptionsCache.set(cacheKey, options);
      rememberKnownOptions(field.id, options);
      pendingOptionsCache.delete(cacheKey);
      return options;
    })
    .catch((error) => {
      pendingOptionsCache.delete(cacheKey);
      throw error;
    });

  pendingOptionsCache.set(cacheKey, nextRequest);
  return nextRequest;
}

export function useSelectOptions<FieldId extends string, Kind extends SelectKind>(
  field: SelectUIField<FieldId, Kind>,
  {
    query = "",
    shouldLoadOnRender = false,
  }: {
    query?: string;
    shouldLoadOnRender?: boolean;
  } = {},
) {
  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = getOptionsCacheKey(field.id, normalizedQuery);
  const isAsync = isAsyncOptionsLoader(field);
  const [status, setStatus] = useState<SelectOptionsStatus>(() => {
    if (!isAsync) {
      return "success";
    }

    return resolvedOptionsCache.has(cacheKey) ? "success" : "idle";
  });
  const [options, setOptions] = useState<SelectOption[]>(() => {
    if (!isAsync) {
      return getStaticOptions(field);
    }

    return resolvedOptionsCache.get(cacheKey) ?? [];
  });
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isAsync) {
      const staticOptions = getStaticOptions(field);
      rememberKnownOptions(field.id, staticOptions);
      setOptions(staticOptions);
      setStatus("success");
      setError(null);
      return;
    }

    const cachedOptions = resolvedOptionsCache.get(cacheKey);
    if (cachedOptions) {
      setOptions(cachedOptions);
      setStatus("success");
      setError(null);
      return;
    }

    setOptions([]);
    setStatus("idle");
    setError(null);
  }, [cacheKey, field, isAsync]);

  const load = useCallback(async () => {
    if (!isAsync) {
      const staticOptions = getStaticOptions(field);
      rememberKnownOptions(field.id, staticOptions);
      return staticOptions;
    }

    const cachedOptions = resolvedOptionsCache.get(cacheKey);
    if (cachedOptions) {
      setOptions(cachedOptions);
      setStatus("success");
      setError(null);
      return cachedOptions;
    }

    setStatus("loading");
    setError(null);

    try {
      const nextOptions = await resolveOptionsLoader(field, normalizedQuery);
      setOptions(nextOptions);
      setStatus("success");
      return nextOptions;
    } catch (caughtError) {
      const nextError = caughtError instanceof Error ? caughtError : new Error("Failed to load options");
      setError(nextError);
      setStatus("error");
      throw nextError;
    }
  }, [cacheKey, field, isAsync, normalizedQuery]);

  useEffect(() => {
    if (!shouldLoadOnRender || !isAsync) {
      return;
    }

    void load();
  }, [isAsync, load, shouldLoadOnRender]);

  return useMemo(() => ({
    error,
    isAsync,
    load,
    options,
    status,
  }), [error, isAsync, load, options, status]);
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
  const shouldLoadOnRender = field.optionsLoadMode === "render";
  const { error, isAsync, load, options, status } = useSelectOptions(field, {
    query: deferredQuery,
    shouldLoadOnRender,
  });
  const visibleTreeOptions = useMemo(
    () =>
      isAsync
        ? options
        : filterSelectOptions(Array.isArray(field.options) ? field.options : [], deferredQuery),
    [deferredQuery, field.options, isAsync, options],
  );
  const visibleOptions = useMemo(
    () => flattenSelectOptions(visibleTreeOptions),
    [visibleTreeOptions],
  );
  const selectedOptions = useMemo(
    () => getKnownSelectedOptions(field.id, selectedValues),
    [field.id, selectedValues],
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

  useEffect(() => {
    if (!open || !isAsync || shouldLoadOnRender) {
      return;
    }

    void load();
  }, [deferredQuery, isAsync, load, open, shouldLoadOnRender]);

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
      isAsync,
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
      isAsync,
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
