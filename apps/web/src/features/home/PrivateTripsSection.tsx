import { Link } from "react-router-dom";
import { VehicleSlideshow } from "../private-trips/VehicleSlideshow";
import { SectionHeading } from "./SectionHeading";

/** Private trips: a vehicle and driver by the hour, with the fleet slideshow. */
export function PrivateTripsSection() {
  return <section className="home-section home-private" aria-labelledby="home-private-title">
    <div className="home-inner">
      <SectionHeading id="home-private-title" eyebrow="Private trips" title="Your own vehicle and driver"
        lead="Hire a vehicle with a professional SL Tours driver by the hour and go where you like, from airport transfers to a full day on the Peninsula."
        link="/book-private-trip" linkLabel="Book a private trip" />
      <VehicleSlideshow />
      <p className="home-private-links">Prefer a guided day? See <Link to="/private-tours">private tours</Link> and <Link to="/transfers">airport transfers</Link>.</p>
    </div>
  </section>;
}
