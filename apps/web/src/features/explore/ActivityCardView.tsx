import { CalendarPlus, Clock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Price } from "../../lib/currency";
import type { ActivityCard } from "../../types/api";
import { CategoryTile } from "./categoryVisuals";
import { categoryLabels, minutesLabel, priceStatusText, shortDate } from "./exploreLabels";

/** Activity card, matching the tour package cards: photo or category tile, title, price, essentials and two clear actions. */
export function ActivityCardView({ activity }: { activity: ActivityCard }) {
  const details = `/explore/${activity.slug}`;
  return (
    <article className="package-card activity-card">
      <Link to={details} className="package-image activity-card-image" tabIndex={-1} aria-hidden="true">
        {activity.heroImage ? <img src={activity.heroImage} alt="" loading="lazy" width="400" height="260" />
          : <CategoryTile category={activity.category} label={activity.areaLabel} />}
        <span className="package-ribbon">{categoryLabels[activity.category]}</span>
      </Link>
      <div className="package-body">
        <div className="package-heading">
          <h3><Link to={details}>{activity.title}</Link></h3>
          <p className="package-price">
            {activity.priceStatus === "FREE" ? <strong>Free</strong>
              : activity.fromPriceCents != null ? <><span>from</span><strong><Price cents={activity.fromPriceCents} /></strong><span>per adult</span></>
              : <><strong>Price</strong><span>{activity.priceStatus === "NOT_PUBLISHED" ? "not published" : "set at booking"}</span></>}
          </p>
        </div>
        <p className="activity-card-summary">{activity.summary}</p>
        <p className="activity-card-meta">
          <span><MapPin aria-hidden="true" />{activity.areaLabel}</span>
          <span><Clock aria-hidden="true" />About {minutesLabel(activity.durationMinutes)}{activity.indoor ? " · indoors" : ""}</span>
        </p>
        <p className="activity-card-check">{priceStatusText[activity.priceStatus]}{activity.lastVerifiedOn ? ` · checked ${shortDate(activity.lastVerifiedOn)}` : ""}</p>
        <div className="package-actions activity-card-actions">
          <Link className="button button-primary" to={details} aria-label={`View details: ${activity.title}`}>View details</Link>
          <Link className="button button-quiet" to={`/explore/plan?include=${activity.slug}`} aria-label={`Plan a day with ${activity.title}`}>
            <CalendarPlus aria-hidden="true" />Plan a day</Link>
        </div>
      </div>
    </article>
  );
}
