import { useState, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Briefcase, Car, Check, ChevronLeft, ChevronRight, UsersRound } from "lucide-react";
import { ErrorState, LoadingState } from "../../components/StateBlocks";
import { listFleet } from "./privateTripApi";

const categoryLabels: Record<string, string> = { SEDAN: "Sedan", SUV: "SUV", VAN: "Van", LUXURY_VAN: "Luxury van", MINIBUS: "Minibus", COACH: "Coach" };

/**
 * Vehicles customers can request for private trips, from the published fleet records. Shows only what the records say
 * (photo, name, category, seats, luggage, amenities); prices and availability are worked out for a date in the booking
 * flow. Manual navigation only, so there is no motion to pause.
 */
export function VehicleSlideshow() {
  const fleet = useQuery({ queryKey: ["private-trips", "fleet"], queryFn: listFleet });
  const [index, setIndex] = useState(0);
  if (fleet.isLoading) return <LoadingState label="Loading vehicles" />;
  if (fleet.isError) return <ErrorState message="Vehicles could not be loaded. You can still request a private trip." />;
  const vehicles = fleet.data?.vehicles ?? [];
  if (vehicles.length === 0) return <div className="form-surface vehicle-show-empty">
    <p>Our vehicles are being listed. Tell us how many people are travelling and we will suggest the right vehicle.</p>
    <Link className="button button-primary" to="/book-private-trip">Enquire about a private trip</Link>
  </div>;
  const active = Math.min(index, vehicles.length - 1);
  const go = (to: number) => setIndex((to + vehicles.length) % vehicles.length);
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); go(active - 1); }
    if (event.key === "ArrowRight") { event.preventDefault(); go(active + 1); }
  };
  return <div className="vehicle-show" role="region" aria-roledescription="carousel" aria-label="Vehicles for private trips" onKeyDown={onKey}>
    <div className="vehicle-show-viewport">
      {vehicles.map((v, i) => <article key={v.id} className={`vehicle-slide${i === active ? " is-active" : ""}`} role="group" aria-roledescription="slide"
        aria-label={`${i + 1} of ${vehicles.length}: ${v.name}`} aria-hidden={i !== active}>
        <div className="vehicle-slide-image">
          {v.imageUrl ? <img src={v.imageUrl} alt={v.imageAlt} loading="lazy" width="720" height="450" />
            : <div className="vehicle-slide-placeholder"><Car aria-hidden="true" /><span>Photo to follow</span></div>}
        </div>
        <div className="vehicle-slide-body">
          <p className="eyebrow">{categoryLabels[v.category] ?? v.category}</p>
          <h3>{v.name}</h3>
          <ul className="vehicle-card-specs">
            <li><UsersRound aria-hidden="true" />Up to {v.capacity} passengers</li>
            {v.luggageCapacity != null && <li><Briefcase aria-hidden="true" />{v.luggageCapacity} large bags</li>}
          </ul>
          {v.amenities.length > 0 && <ul className="vehicle-slide-features">{v.amenities.map(a => <li key={a}><Check aria-hidden="true" />{a}</li>)}</ul>}
          {v.description && <p className="vehicle-slide-description">{v.description}</p>}
          <p className="vehicle-slide-note">Choose your date and time to see the price. Availability is confirmed for your trip before it is booked.</p>
          <Link className="button button-primary" to={`/book-private-trip?vehicle=${encodeURIComponent(v.id)}`} tabIndex={i === active ? undefined : -1}>
            Book / Enquire<span className="sr-only"> about the {v.name}</span></Link>
        </div>
      </article>)}
    </div>
    {vehicles.length > 1 && <div className="vehicle-show-controls">
      <button type="button" className="slider-arrow-inline" onClick={() => go(active - 1)} aria-label="Previous vehicle"><ChevronLeft aria-hidden="true" /></button>
      <div className="vehicle-show-dots" role="group" aria-label="Choose a vehicle">
        {vehicles.map((v, i) => <button key={v.id} type="button" className={`slider-dot${i === active ? " slider-dot-active" : ""}`}
          aria-label={`Show ${v.name}`} aria-current={i === active ? "true" : undefined} onClick={() => go(i)} />)}
      </div>
      <p className="vehicle-show-position" aria-live="polite">{active + 1} of {vehicles.length}</p>
      <button type="button" className="slider-arrow-inline" onClick={() => go(active + 1)} aria-label="Next vehicle"><ChevronRight aria-hidden="true" /></button>
    </div>}
  </div>;
}
