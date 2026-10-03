import { Clock, Compass, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Price } from "../../lib/currency";
import type { ActivityCard } from "../../types/api";
import { categoryLabels, minutesLabel, priceStatusText } from "./exploreLabels";

/** Activity card in the style of the existing tour package cards. */
export function ActivityCardView({ activity }: { activity: ActivityCard }) {
  return (
    <article className="package-card activity-card">
      <Link to={`/explore/${activity.slug}`} className="package-image" aria-label={`View ${activity.title}`}>
        {activity.heroImage ? <img src={activity.heroImage} alt="" loading="lazy" width="400" height="260" />
          : <span className="activity-card-placeholder" aria-hidden="true"><Compass /></span>}
        <span className="package-ribbon">{categoryLabels[activity.category]}</span>
      </Link>
      <div className="package-body">
        <div className="package-heading">
          <h3><Link to={`/explore/${activity.slug}`}>{activity.title}</Link></h3>
          <p className="package-price">
            {activity.priceStatus === "FREE" ? <strong>Free</strong>
              : activity.fromPriceCents != null ? <><strong><Price cents={activity.fromPriceCents} /></strong><span>from, per adult</span></>
              : <><strong>Price</strong><span>{activity.priceStatus === "NOT_PUBLISHED" ? "not published" : "at booking"}</span></>}
          </p>
        </div>
        <p className="activity-card-summary">{activity.summary}</p>
        <p className="package-meta"><MapPin aria-hidden="true" />{activity.areaLabel}</p>
        <p className="package-meta"><Clock aria-hidden="true" />About {minutesLabel(activity.durationMinutes)}{activity.indoor ? " · indoors" : ""}</p>
        <p className="activity-card-check">{priceStatusText[activity.priceStatus]}</p>
        <div className="package-actions">
          <Link className="button button-primary" to={`/explore/${activity.slug}`}>Details & prices</Link>
          <Link className="button button-navy" to={`/explore/plan?include=${activity.slug}`}>Plan a day</Link>
        </div>
      </div>
    </article>
  );
}
