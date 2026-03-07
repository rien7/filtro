import { useEffect, useMemo } from "react";
import { FieldKind } from "../src/logical/field";
import type { FilterBarValueType } from "../src/ui/filter-bar/context";
import { useFilterBar } from "../src/ui/filter-bar/context";
import { createFilterBarValue } from "../src/ui/filter-bar/state";
import { FilterBar, filtro } from "../src/ui/index";
import { Button } from "../src/ui/baseui/button";
import { Filter } from "lucide-react";

function PlaygroundSeedFilters() {
  const { uiFields, values, setValues } = useFilterBar();

  useEffect(() => {
    if (!setValues || Object.keys(values).length > 0 || uiFields.length === 0) {
      return;
    }

    const nextValues = uiFields.reduce((accumulator, field) => {
      const nextValue =
        field.kind === FieldKind.select
          ? createFilterBarValue(field, "open")
          : field.kind === FieldKind.multiSelect
            ? createFilterBarValue(field, "vip")
            : createFilterBarValue(field as never);

      if (nextValue) {
        accumulator[field.id] = nextValue;
      }

      return accumulator;
    }, {} as FilterBarValueType);

    setValues(nextValues);
  }, [setValues, uiFields, values]);

  return null;
}

export function PlaygroundApp() {
  const fields = useMemo(
    () => [
      filtro.string("keyword")
        .meta({ label: "Keyword", placeholder: "Search name or email" }),
      filtro.number("amount")
        .meta({ label: "Amount", placeholder: "Enter amount" }),
      filtro.date("createdAt")
        .meta({ label: "Created At" }),
      filtro.select("status").meta({ label: "Status" }).options([
        { label: "Open", value: "open" },
        { label: "Closed", value: "closed" },
        { label: "Pending", value: "pending" },
      ]),
      filtro.multiSelect("tags").meta({ label: "Tags" }).options([
        { label: "VIP", value: "vip" },
        { label: "Trial", value: "trial" },
        { label: "Churn Risk", value: "churn-risk" },
      ]),
      filtro.boolean("archived").meta({ label: "Archived" }),
    ],
    [],
  );

  return (
    <main className="playground">
      <h1>Filtro UI Playground</h1>
      <p className="sub">Use this page to debug src/ui components with HMR.</p>
      <section className="card">
        <FilterBar.Root fields={fields}>
          <PlaygroundSeedFilters />
          <FilterBar.Trigger iconMapping render={<Button variant="outline" />}>
            <span className="grid grid-cols-[auto_1fr] gap-1.5 items-center">
              <Filter />
              Filter
            </span>
          </FilterBar.Trigger>
          <div className="mt-4">
            <FilterBar.Items />
          </div>
        </FilterBar.Root>
      </section>
    </main>
  );
}
