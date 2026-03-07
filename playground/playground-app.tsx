import { useMemo } from "react";
import { FilterBar, filtro } from "../src/ui/index";
import { Button } from "../src/ui/baseui/button";
import { Filter } from "lucide-react";

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
      filtro.boolean("archived").meta({ label: "Archived" }).options([
        { label: "已归档", value: true },
        { label: '未归档', value: false }
      ]),
    ],
    [],
  );

  return (
    <main className="playground">
      <h1>Filtro UI Playground</h1>
      <p className="sub">Use this page to debug src/ui components with HMR.</p>
      <section className="card">
        <FilterBar.Root fields={fields}>
          <span className="grid grid-cols-[auto_auto] items-center w-fit gap-2">
            <FilterBar.Trigger iconMapping render={<Button variant="outline" />}>
              <span className="grid grid-cols-[auto_1fr] gap-1.5 items-center">
                <Filter />
                Filter
              </span>
            </FilterBar.Trigger>
            <FilterBar.Clear render={<Button variant="outline" />}>
              Clear
            </FilterBar.Clear>
          </span>
          <FilterBar.Items className="mt-2" />
        </FilterBar.Root>
      </section>
    </main>
  );
}
