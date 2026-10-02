import { WhatsAppIcon } from "../../components/WhatsAppIcon";
import { Clock, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { whatsappReserveUrl } from "../../lib/contact";
import { Price } from "../../lib/currency";
import { priceLabel } from "../../lib/format";
import type { TourSummary } from "../../types/api";

export function PackageCard({ tour }: { tour: TourSummary }) {
  return (
    <article className="package-card">
      <Link to={`/experiences/${tour.slug}`} className="package-image" aria-label={`View ${tour.title}`}>
        <img src={tour.heroImage} alt="" loading="lazy" width="400" height="260" />
        {tour.cardNote && <span className="package-ribbon">{tour.cardNote}</span>}
      </Link>
      <div className="package-body">
        <div className="package-heading">
          <h3>
            <Link to={`/experiences/${tour.slug}`}>{tour.title}</Link>
          </h3>
          <p className="package-price">
            <strong>{tour.pricingType === "CUSTOM" ? "Rate" : <Price cents={tour.basePriceCents} />}</strong>
            <span>{tour.pricingType === "CUSTOM" ? "on request" : priceLabel(tour.pricingType)}</span>
          </p>
        </div>
        <p className="package-meta">
          <Clock aria-hidden="true" />
          {tour.duration}
        </p>
        <p className="package-meta package-trust">
          <Star aria-hidden="true" />
          Trusted by TripAdvisor travelers
        </p>
        <div className="package-actions">
          <Link className="button button-primary" to={`/experiences/${tour.slug}`}>
            More Information
          </Link>
          <Link className="button button-navy" to={`/book/${tour.slug}`}>
            Book Online
          </Link>
        </div>
        <a className="package-whatsapp" href={whatsappReserveUrl(tour.title)} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon aria-hidden="true" />
          Reserve on WhatsApp
        </a>
      </div>
    </article>
  );
}
