import { useMemo, useState } from "react";
import { Filter } from "lucide-react";

import {
  Button,
  defaultFilterBarTheme,
  FilterBar,
  filtro,
  type FilterBarThemeInput,
} from "../src/ui/index";

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

function DemoAvatar({
  initials,
  tone,
}: {
  initials: string;
  tone: "amber" | "emerald" | "sky" | "rose";
}) {
  return (
    <span className={`demo-option-icon demo-option-icon-${tone}`} aria-hidden="true">
      {initials}
    </span>
  );
}

type DemoView = "headless" | "default" | "both";

function DemoCard({
  title,
  description,
  fields,
  theme,
  styled,
}: {
  title: string;
  description: string;
  fields: ReturnType<typeof useFiltroFields>;
  theme?: FilterBarThemeInput | null;
  styled: boolean;
}) {
  return (
    <section className="demo-card">
      <div className="demo-card-header">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <FilterBar.Root fields={fields} theme={theme}>
        <div className="demo-toolbar">
          <FilterBar.Trigger
            iconMapping={styled}
            render={
              styled ? (
                <Button variant="outline" />
              ) : (
                <button type="button" className="demo-button" />
              )
            }
          >
            <span className="demo-trigger-content">
              {styled ? <Filter /> : null}
              Add Filter
            </span>
          </FilterBar.Trigger>
          <FilterBar.Clear
            render={
              styled ? (
                <Button variant="outline" />
              ) : (
                <button type="button" className="demo-button" />
              )
            }
          >
            Clear
          </FilterBar.Clear>
        </div>
        <FilterBar.Items className="demo-items" />
      </FilterBar.Root>
    </section>
  );
}

function useFiltroFields() {
  return useMemo(
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
        filtro.multiSelect("tags")
          .meta({ label: "Tags" })
          .renderValueLabel((values) => `${values.length} tags`)
          .options([
            { label: "VIP", value: "vip" },
            { label: "Trial", value: "trial" },
            { label: "Churn Risk", value: "churn-risk" },
          ]),
        filtro.multiSelect("reviewers")
          .meta({ label: "Reviewers", placeholder: "Pick up to 3 reviewers" })
          .maxSelections(3)
          .options([
            {
              label: "Alice Johnson",
              value: "alice",
              icon: <DemoAvatar initials="AJ" tone="amber" />,
            },
            {
              label: "Ben Carter",
              value: "ben",
              icon: <DemoAvatar initials="BC" tone="emerald" />,
            },
            {
              label: "Chris Wong",
              value: "chris",
              icon: <DemoAvatar initials="CW" tone="sky" />,
            },
            {
              label: "Diana Ross",
              value: "diana",
              icon: <DemoAvatar initials="DR" tone="rose" />,
            },
          ])
          .renderValueLabel((options) => `${options.length} reviewers`),
        filtro.boolean("archived").meta({ label: "Archived" }).options([
          { label: "Archived", value: true },
          { label: "Not Archived", value: false },
        ]),
      ]),
    ],
    [],
  );
}

export function PlaygroundApp() {
  const fields = useFiltroFields();
  const [view, setView] = useState<DemoView>("both");
  const showHeadless = view === "headless" || view === "both";
  const showDefault = view === "default" || view === "both";

  return (
    <main className="playground">
      <h1>Filtro UI Playground</h1>
      <p className="sub">
        Compare the headless FilterBar with the default themed preset and use
        this page to debug the UI with HMR.
      </p>

      <div className="view-switcher" role="group" aria-label="Choose playground view">
        <button
          type="button"
          className={view === "headless" ? "switch-button active" : "switch-button"}
          onClick={() => setView("headless")}
        >
          Headless Only
        </button>
        <button
          type="button"
          className={view === "default" ? "switch-button active" : "switch-button"}
          onClick={() => setView("default")}
        >
          Default Theme Only
        </button>
        <button
          type="button"
          className={view === "both" ? "switch-button active" : "switch-button"}
          onClick={() => setView("both")}
        >
          Show Both
        </button>
      </div>

      <section className="card">
        <div className={view === "both" ? "demo-grid" : "demo-stack"}>
          {showHeadless ? (
            <DemoCard
              title="Headless"
              description="No FilterBar theme preset. Internal controls render with no visual classes."
              fields={fields}
              styled={false}
            />
          ) : null}
          {showDefault ? (
            <DemoCard
              title="Default Theme"
              description="Uses defaultFilterBarTheme and the exported styled Button primitive."
              fields={fields}
              theme={defaultFilterBarTheme}
              styled
            />
          ) : null}
        </div>
      </section>
    </main>
  );
}
