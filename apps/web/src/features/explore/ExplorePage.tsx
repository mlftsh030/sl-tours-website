import { AssistantLauncher } from "../assistant/AssistantLauncher";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { PageBanner } from "../../components/PageBanner";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateBlocks";
import { useDocumentTitle } from "../../lib/useDocumentTitle";
import { listActivities } from "./exploreApi";
import { ActivityCardView } from "./ActivityCardView";
import { areaLabels, categoryLabels } from "./exploreLabels";
import type { ActivityArea, ActivityCategory } from "../../types/api";

export function ExplorePage() {
  useDocumentTitle("Explore Cape Town | Activities, Prices and Opening Hours | SL Tours",
    "Things to do in Cape Town, from Table Mountain and Boulders Beach to ice skating and go-karting, with prices and hours checked against official sources.");
  const [params, setParams] = useSearchParams();
  const category = (params.get("category") ?? "") as ActivityCategory | "";
  const area = (params.get("area") ?? "") as ActivityArea | "";
  const [query, setQuery] = useState(params.get("q") ?? "");
  const activities = useQuery({ queryKey: ["activities"], queryFn: () => listActivities({}) });
  const update = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); setParams(next, { replace: true }); };
  const visible = useMemo(() => (activities.data ?? []).filter(a => (!category || a.category === category) && (!area || a.area === area)
    && (!query.trim() || `${a.title} ${a.summary}`.toLowerCase().includes(query.trim().toLowerCase()))), [activities.data, category, area, query]);
  const categoriesPresent = [...new Set((activities.data ?? []).map(a => a.category))];
  return (
    <>
      <PageBanner title="Explore Cape Town" subtitle="Things to do, with prices and opening hours checked against official sources" image="/assets/gallery/41.jpg" />
      <section className="section tours-section">
        <aside className="private-trip-cta">
          <div>
            <p className="eyebrow">Day planner</p>
            <h2>Put a day together</h2>
            <p>Choose your interests and who is travelling. We order the stops sensibly, check opening times and show every cost and assumption.</p>
          </div>
          <div className="explore-cta-actions">
            <Link className="button button-primary" to="/explore/plan">Plan a day</Link>
            <AssistantLauncher />
          </div>
        </aside>
        <div className="tours-toolbar">
          <div className="filter-row" role="group" aria-label="Filter by category">
            <button type="button" className={!category ? "chip chip-active" : "chip"} aria-pressed={!category} onClick={() => update("category", "")}>All</button>
            {(Object.keys(categoryLabels) as ActivityCategory[]).filter(c => categoriesPresent.includes(c)).map(c =>
              <button key={c} type="button" className={category === c ? "chip chip-active" : "chip"} aria-pressed={category === c}
                onClick={() => update("category", c)}>{categoryLabels[c]}</button>)}
          </div>
          <div className="explore-filters">
            <label className="explore-area"><span className="sr-only">Area</span>
              <select value={area} onChange={event => update("area", event.target.value)}>
                <option value="">All areas</option>{(Object.keys(areaLabels) as ActivityArea[]).map(a => <option key={a} value={a}>{areaLabels[a]}</option>)}
              </select></label>
            <label className="search-control"><Search aria-hidden="true" /><span className="sr-only">Search activities</span>
              <input type="search" value={query} onChange={event => { setQuery(event.target.value); update("q", event.target.value); }} placeholder="Search activities" /></label>
          </div>
        </div>
        {activities.isLoading && <LoadingState label="Loading activities" />}
        {activities.isError && <ErrorState message={activities.error.message} />}
        {activities.data && <p className="result-count" aria-live="polite">{visible.length} {visible.length === 1 ? "activity" : "activities"}</p>}
        {activities.data && visible.length === 0 && <EmptyState message="No activities match these filters." />}
        <div className="package-grid">{visible.map(a => <ActivityCardView key={a.slug} activity={a} />)}</div>
        <p className="form-note explore-note">Prices and hours are taken from each operator's or authority's official website on the date shown on each page.
          They can change without notice, so check before you go.</p>
      </section>
    </>
  );
}
