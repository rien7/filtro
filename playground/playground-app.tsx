import { useMemo } from "react";
import { FilterBar, filtro } from "../src/ui/index";
import { Button } from "../src/ui/baseui/button";
import { Filter } from "lucide-react";

function loadAsyncOwners() {
  return new Promise<Array<{ label: string; value: string }>>((resolve) => {
    window.setTimeout(() => {
      resolve([
        { label: "Alice Johnson", value: "alice" },
        { label: "Ben Carter", value: "ben" },
        { label: "Chris Wong", value: "chris" },
      ]);
    }, 5000);
  });
}

export function PlaygroundApp() {
  const fields = useMemo(
    () => [
      filtro.group("Basic", [
        filtro.string("keyword")
          .meta({ label: "Keyword", placeholder: "Search name or email" }),
        filtro.number("amount")
          .meta({ label: "Amount", placeholder: "Enter amount" }),
        filtro.date("createdAt")
          .meta({ label: "Created At" }),
      ]),
      filtro.group("Attributes", [
        filtro.select("status").meta({ label: "Status" }).options([
          { label: "Open", value: "open" },
          { label: "Closed", value: "closed" },
          { label: "Pending", value: "pending" },
        ]),
        filtro.select("owner")
          .meta({ label: "Owner", placeholder: "Async options after 5s" })
          .options(async () => loadAsyncOwners())
          .loadOptions("open"),
        filtro.multiSelect("tags").meta({ label: "Tags" }).options([
          { label: "VIP", value: "vip" },
          { label: "Trial", value: "trial" },
          { label: "Churn Risk", value: "churn-risk" },
        ]),
        filtro.boolean("archived").meta({ label: "Archived" }).options([
          { label: "Archived", value: true },
          { label: "Not Archived", value: false },
        ]),
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
