import { useMemo, useState } from "react";
import { Filter, LayoutGrid, Save } from "lucide-react";

import {
  Button,
  defaultFilterBarTheme,
  FilterBar,
  filtro,
  type FilterBarThemeInput,
} from "../src/ui/index";
import { useNuqsFilterBarState } from "../src/nuqs/index";

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
  storageKey,
  theme,
  styled,
}: {
  title: string;
  description: string;
  fields: ReturnType<typeof useFiltroFields>;
  storageKey: string;
  theme?: FilterBarThemeInput | null;
  styled: boolean;
}) {
  return (
    <section className="demo-card">
      <div className="demo-card-header">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <FilterBar.Root fields={fields} theme={theme} viewsStorageKey={storageKey}>
        <div className="demo-toolbar">
          <FilterBar.Views
            render={
              styled ? (
                <Button variant="outline" />
              ) : (
                <button type="button" className="demo-button" />
              )
            }
          >
            <span className="demo-trigger-content">
              {styled ? <LayoutGrid /> : null}
              Views
            </span>
          </FilterBar.Views>
          <FilterBar.SaveView
            render={
              styled ? (
                <Button variant="outline" />
              ) : (
                <button type="button" className="demo-button" />
              )
            }
          >
            <span className="demo-trigger-content">
              {styled ? <Save /> : null}
              Save View
            </span>
          </FilterBar.SaveView>
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

function NuqsDemoCard({
  fields,
  storageKey,
}: {
  fields: ReturnType<typeof useFiltroFields>;
  storageKey: string;
}) {
  const { onValueChange, value } = useNuqsFilterBarState({
    fields,
  });
  const currentSearch = typeof window === "undefined" ? "" : window.location.search;

  return (
    <section className="demo-card demo-card-accent">
      <div className="demo-card-header">
        <h2>nuqs URL Sync</h2>
        <p>
          This FilterBar is controlled by <code>filtro/nuqs</code>. Add, edit, clear,
          refresh, and use browser back/forward to verify URL round-tripping.
        </p>
      </div>
      <div className="demo-url-preview">{currentSearch || "?demo_=..."}</div>
      <FilterBar.Root
        fields={fields}
        theme={defaultFilterBarTheme}
        value={value}
        onValueChange={onValueChange}
        viewsStorageKey={storageKey}
      >
        <div className="demo-toolbar">
          <FilterBar.Views render={<Button variant="outline" />}>
            <span className="demo-trigger-content">
              <LayoutGrid />
              Views
            </span>
          </FilterBar.Views>
          <FilterBar.SaveView render={<Button variant="outline" />}>
            <span className="demo-trigger-content">
              <Save />
              Save View
            </span>
          </FilterBar.SaveView>
          <FilterBar.Trigger iconMapping render={<Button variant="outline" />}>
            <span className="demo-trigger-content">
              <Filter />
              Add Filter
            </span>
          </FilterBar.Trigger>
          <FilterBar.Clear render={<Button variant="outline" />}>
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
          .label("Keyword")
          .placeholder("Search name or email")
          .operator((ops) => ops),
        filtro.number("amount")
          .label("Amount")
          .placeholder("Enter amount")
          .operator((ops) => ops),
        filtro.date("createdAt")
          .label("Created At")
          .operator((ops) => ops),
      ]),
      filtro.group("Attributes", [
        filtro.select("status").label("Status").options([
          { label: "Open", value: "open" },
          { label: "Closed", value: "closed" },
          { label: "Pending", value: "pending" },
        ]),
        filtro.select("owner")
          .label("Owner")
          .placeholder("Async options after 5s")
          .options(async () => loadAsyncOwners())
          .loadOptions("open"),
        filtro.multiSelect("tags")
          .label("Tags")
          .renderValueLabel((values) => `${values.length} tags`)
          .options([
            { label: "VIP", value: "vip" },
            { label: "Trial", value: "trial" },
            { label: "Churn Risk", value: "churn-risk" },
          ]),
        filtro.multiSelect("reviewers")
          .label("Reviewers")
          .placeholder("Pick up to 3 reviewers")
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
        filtro.boolean("archived").label("Archived").options([
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
              storageKey="playground:headless"
              styled={false}
            />
          ) : null}
          {showDefault ? (
            <DemoCard
              title="Default Theme"
              description="Uses defaultFilterBarTheme and the exported styled Button primitive."
              fields={fields}
              storageKey="playground:default-theme"
              theme={defaultFilterBarTheme}
              styled
            />
          ) : null}
        </div>
      </section>

      <section className="card demo-card-group">
        <NuqsDemoCard fields={fields} storageKey="playground:nuqs" />
      </section>
    </main>
  );
}
