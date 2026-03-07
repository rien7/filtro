import { useCallback, useEffect, useMemo, useState } from "react";
import type { SelectKind, SelectOption, SelectOptionLoader, SelectUIField } from "@/ui/types";

type SelectOptionsStatus = "idle" | "loading" | "success" | "error";

const resolvedOptionsCache = new Map<string, SelectOption[]>();
const pendingOptionsCache = new Map<string, Promise<SelectOption[]>>();

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
) {
  const cachedOptions = resolvedOptionsCache.get(field.id);
  if (cachedOptions) {
    return cachedOptions;
  }

  const pendingOptions = pendingOptionsCache.get(field.id);
  if (pendingOptions) {
    return pendingOptions;
  }

  const nextRequest = field.options({ query: "" })
    .then((options) => {
      resolvedOptionsCache.set(field.id, options);
      pendingOptionsCache.delete(field.id);
      return options;
    })
    .catch((error) => {
      pendingOptionsCache.delete(field.id);
      throw error;
    });

  pendingOptionsCache.set(field.id, nextRequest);
  return nextRequest;
}

export function useSelectOptions<FieldId extends string, Kind extends SelectKind>(
  field: SelectUIField<FieldId, Kind>,
  shouldLoadOnRender = false,
) {
  const isAsync = isAsyncOptionsLoader(field);
  const [status, setStatus] = useState<SelectOptionsStatus>(() => {
    if (!isAsync) {
      return "success";
    }

    return resolvedOptionsCache.has(field.id) ? "success" : "idle";
  });
  const [options, setOptions] = useState<SelectOption[]>(() => {
    if (!isAsync) {
      return getStaticOptions(field);
    }

    return resolvedOptionsCache.get(field.id) ?? [];
  });
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isAsync) {
      setOptions(getStaticOptions(field));
      setStatus("success");
      setError(null);
      return;
    }

    const cachedOptions = resolvedOptionsCache.get(field.id);
    if (cachedOptions) {
      setOptions(cachedOptions);
      setStatus("success");
      setError(null);
      return;
    }

    setOptions([]);
    setStatus("idle");
    setError(null);
  }, [field, isAsync]);

  const load = useCallback(async () => {
    if (!isAsync) {
      return getStaticOptions(field);
    }

    const cachedOptions = resolvedOptionsCache.get(field.id);
    if (cachedOptions) {
      setOptions(cachedOptions);
      setStatus("success");
      setError(null);
      return cachedOptions;
    }

    setStatus("loading");
    setError(null);

    try {
      const nextOptions = await resolveOptionsLoader(field);
      setOptions(nextOptions);
      setStatus("success");
      return nextOptions;
    } catch (caughtError) {
      const nextError = caughtError instanceof Error ? caughtError : new Error("Failed to load options");
      setError(nextError);
      setStatus("error");
      throw nextError;
    }
  }, [field, isAsync]);

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
