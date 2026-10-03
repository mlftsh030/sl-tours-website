import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../../components/StateBlocks";
import { ActivityCardView } from "../explore/ActivityCardView";
import { listActivities } from "../explore/exploreApi";
import { SectionHeading } from "./SectionHeading";

/** Well-known Cape Town highlights, shown first when they are published. */
const featured = ["table-mountain-aerial-cableway", "cape-point", "boulders-penguin-colony", "kirstenbosch-national-botanical-garden",
  "chapmans-peak-drive", "two-oceans-aquarium"];

export function ThingsToDoFeature() {
  const activities = useQuery({ queryKey: ["activities"], queryFn: () => listActivities({}) });
  const picks = (activities.data ?? []).filter(a => featured.includes(a.slug)).sort((a, b) => featured.indexOf(a.slug) - featured.indexOf(b.slug)).slice(0, 3);
  return <section className="home-section home-things" aria-labelledby="home-things-title">
    <div className="home-inner">
      <SectionHeading id="home-things-title" eyebrow="Things to do in Cape Town" title="Plan your own days out"
        lead="Prices and opening hours checked against official sources, and a day planner that shows every cost."
        link="/explore" linkLabel="View Things to Do in Cape Town" />
      {activities.isLoading && <LoadingState label="Loading things to do" />}
      {activities.isError && <ErrorState message="Things to do could not be loaded. Please try again later." />}
      {picks.length > 0 && <div className="home-things-grid">{picks.map(a => <ActivityCardView key={a.slug} activity={a} />)}</div>}
      <div className="home-actions home-actions-center">
        <Link className="button button-primary" to="/explore">View Things to Do in Cape Town</Link>
        <Link className="button button-quiet" to="/explore/plan">Plan a day</Link>
      </div>
    </div>
  </section>;
}
