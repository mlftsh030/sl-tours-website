import { AssistantLauncher } from "../assistant/AssistantLauncher";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarRange, ListChecks, Search, ShieldCheck } from "lucide-react";
import { PageBanner } from "../../components/PageBanner";
import { EmptyState, ErrorState } from "../../components/StateBlocks";
import { useDocumentTitle } from "../../lib/useDocumentTitle";
import { listActivities } from "./exploreApi";
import { ActivityCardView } from "./ActivityCardView";
import { areaLabels, categoryLabels } from "./exploreLabels";
import type { ActivityArea, ActivityCategory } from "../../types/api";

export function ExplorePage() {
  useDocumentTitle("Things to Do in Cape Town | Activities, Prices and Opening Hours | SL Tours",
    "Things to do in Cape Town, from Table Mountain and Boulders Beach to ice skating and go-karting, with prices and hours checked against official sources.");
  const [params, setParams] = useSearchParams();
  const category = (params.get("category") ?? "") as ActivityCategory | "";
  const area = (params.get("area") ?? "") as ActivityArea | "";
  const [query, setQuery] = useState(params.get("q") ?? "");
  const activities = useQuery({ queryKey: ["activities"], queryFn: () => listActivities({}) });
  const update = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); setParams(next, { replace: true }); };
  const clear = () => { setQuery(""); setParams(new URLSearchParams(), { replace: true }); };
  const filtered = Boolean(category || area || query.trim());
  const visible = useMemo(() => (activities.data ?? []).filter(a => (!category || a.category === category) && (!area || a.area === area)
    && (!query.trim() || `${a.title} ${a.summary} ${a.areaLabel}`.toLowerCase().includes(query.trim().toLowerCase()))), [activities.data, category, area, query]);
  const categoriesPresent = [...new Set((activities.data ?? []).map(a => a.category))];
  const areasPresent = [...new Set((activities.data ?? []).map(a => a.area))];
  return (
    <>
      <PageBanner title="Things to Do in Cape Town" subtitle="Ideas for your days out, with prices and opening hours checked against official sources" image="/assets/gallery/41.jpg" />
      <section className="section explore-page">
        <div className="explore-intro">
          <ol className="explore-steps" aria-label="How it works">
            <li><ListChecks aria-hidden="true" /><div><strong>Browse</strong><span>Filter by interest or area to find things you will enjoy.</span></div></li>
            <li><ShieldCheck aria-hidden="true" /><div><strong>Check the details</strong><span>Prices, hours and age rules, with the official source and the date we checked.</span></div></li>
            <li><CalendarRange aria-hidden="true" /><div><strong>Plan a day</strong><span>We order the stops, check opening times and show every cost.</span></div></li>
          </ol>
          <div className="explore-intro-actions">
            <Link className="button button-primary" to="/explore/plan">Plan a day</Link>
            <AssistantLauncher />
          </div>
        </div>

        <div className="explore-toolbar" role="search" aria-label="Filter things to do">
          <div className="filter-row" role="group" aria-label="Filter by interest">
            <button type="button" className={!category ? "chip chip-active" : "chip"} aria-pressed={!category} onClick={() => update("category", "")}>All</button>
            {(Object.keys(categoryLabels) as ActivityCategory[]).filter(c => categoriesPresent.includes(c)).map(c =>
              <button key={c} type="button" className={category === c ? "chip chip-active" : "chip"} aria-pressed={category === c}
                onClick={() => update("category", category === c ? "" : c)}>{categoryLabels[c]}</button>)}
          </div>
          <div className="explore-filters">
            <label className="explore-area"><span className="sr-only">Area</span>
              <select value={area} onChange={event => update("area", event.target.value)}>
                <option value="">All areas</option>{(Object.keys(areaLabels) as ActivityArea[]).filter(a => areasPresent.includes(a) || a === area)
                  .map(a => <option key={a} value={a}>{areaLabels[a]}</option>)}
              </select></label>
            <label className="search-control"><Search aria-hidden="true" /><span className="sr-only">Search activities</span>
              <input type="search" value={query} onChange={event => { setQuery(event.target.value); update("q", event.target.value); }} placeholder="Search activities" /></label>
          </div>
        </div>

        {activities.isError && <div className="explore-state"><ErrorState message="Things to do could not be loaded right now." />
          <button className="button button-secondary" type="button" onClick={() => activities.refetch()}>Try again</button></div>}
        {activities.isLoading && <div className="package-grid" aria-busy="true" aria-label="Loading activities">
          {[0, 1, 2].map(i => <div key={i} className="package-card activity-card activity-skeleton" aria-hidden="true"><span /><span /><span /><span /></div>)}</div>}
        {activities.data && <div className="explore-results-bar">
          <p className="result-count" aria-live="polite">{visible.length} {visible.length === 1 ? "activity" : "activities"}{filtered ? " match your filters" : ""}</p>
          {filtered && <button type="button" className="text-link" onClick={clear}>Clear filters</button>}
        </div>}
        {activities.data && visible.length === 0 && <div className="explore-state"><EmptyState message="No activities match these filters." />
          <button className="button button-secondary" type="button" onClick={clear}>Show all activities</button></div>}
        <div className="package-grid explore-grid">{visible.map(a => <ActivityCardView key={a.slug} activity={a} />)}</div>
        <p className="form-note explore-note">Prices and hours come from each operator's or authority's official website on the date shown. They can change without
          notice, so check before you go. SL Tours is not the operator unless a page says otherwise.</p>
      </section>
    </>
  );
}
