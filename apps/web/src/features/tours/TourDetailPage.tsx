import { WhatsAppIcon } from "../../components/WhatsAppIcon";
import { CheckCircle2, Clock, HelpCircle, MapPin, UsersRound, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { getTour } from "../../lib/api";
import { whatsappReserveUrl } from "../../lib/contact";
import { Price } from "../../lib/currency";
import { priceLabel } from "../../lib/format";
import { useDocumentTitle } from "../../lib/useDocumentTitle";
import { ErrorState, LoadingState } from "../../components/StateBlocks";

export function TourDetailPage() {
  const { slug = "" } = useParams();
  const tour = useQuery({ queryKey: ["tour", slug], queryFn: () => getTour(slug), enabled: Boolean(slug) });
  useDocumentTitle(tour.data?.seoTitle ?? "Experience | SL Tours", tour.data?.seoDescription);

  if (tour.isLoading) {
    return <LoadingState label="Loading experience" />;
  }

  if (tour.isError || !tour.data) {
    return <ErrorState message={(tour.error as Error)?.message ?? "Experience not found"} />;
  }

  const detail = tour.data;
  return (
    <>
      <section
        className="detail-hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(5, 30, 98, .88) 0%, rgba(5, 30, 98, .6) 45%, rgba(5, 30, 98, .15) 100%), url(${detail.bannerImage ?? detail.heroImage})`
        }}
      >
        <div>
          <p className="eyebrow">{detail.category.replace("_", " ")}</p>
          <h1>{detail.title}</h1>
          <p>{detail.shortDescription}</p>
          <div className="detail-meta">
            <span>
              <Clock aria-hidden="true" />
              {detail.duration}
            </span>
            <span>
              <MapPin aria-hidden="true" />
              <Price cents={detail.basePriceCents} /> {priceLabel(detail.pricingType)}
            </span>
          </div>
          <Link className="button button-primary" to={`/book/${detail.slug}`}>
            Book Experience
          </Link>
        </div>
      </section>
      <section className="section detail-grid">
        <article>
          <p className="eyebrow">Overview</p>
          <h2>{detail.title}</h2>
          <p>{detail.fullDescription}</p>
          <h3>Highlights</h3>
          <ul className="check-list">
            {detail.highlights.map((item) => (
              <li key={item}>
                <CheckCircle2 aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <h3>Itinerary</h3>
          <div className="timeline">
            {detail.itinerary.map((item) => {
              const match = /^(\d{1,2}:\d{2})\s+(.*)$/.exec(item);
              return (
                <div key={item}>
                  <strong>{match ? match[1] : "•"}</strong>
                  <span>{match ? match[2] : item}</span>
                </div>
              );
            })}
          </div>
        </article>
        <aside className="booking-panel detail-panel">
          <p className="detail-price">
            <strong>
              {detail.pricingType === "CUSTOM" ? "Rate on request" : <Price cents={detail.basePriceCents} />}
            </strong>
            {detail.pricingType !== "CUSTOM" && <span>{priceLabel(detail.pricingType)}</span>}
          </p>
          <p className="detail-guests">
            <UsersRound aria-hidden="true" />
            {detail.minimumGuests > 1 ? `Minimum ${detail.minimumGuests} guests` : "From 1 guest"}, up to{" "}
            {detail.maximumGuests}
          </p>
          <div className="detail-actions">
            <Link className="button button-primary" to={`/book/${detail.slug}`}>
              Book Online
            </Link>
            <a
              className="button button-whatsapp"
              href={whatsappReserveUrl(detail.title)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon aria-hidden="true" />
              Reserve on WhatsApp
            </a>
          </div>
          {detail.included.length > 0 && (
            <>
              <h3>Included</h3>
              <ul className="inclusion-list">
                {detail.included.map((item) => (
                  <li key={item}>
                    <CheckCircle2 aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </>
          )}
          {detail.excluded.length > 0 && (
            <>
              <h3>Excluded</h3>
              <ul className="inclusion-list exclusion-list">
                {detail.excluded.map((item) => (
                  <li key={item}>
                    <XCircle aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="form-note">
            Cancellation terms and final inclusions are confirmed with your booking or quotation.
          </p>
        </aside>
      </section>
      {detail.faqs.length > 0 && (
        <section className="section faq-section">
          <p className="eyebrow">Questions</p>
          <div className="faq-grid">
            {detail.faqs.map((item) => (
              <div key={item}>
                <HelpCircle aria-hidden="true" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
