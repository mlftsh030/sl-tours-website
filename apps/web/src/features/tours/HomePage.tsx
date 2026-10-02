import { CalendarHeart, Plane, Route } from "lucide-react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../../lib/useDocumentTitle";
import { CustomerReviews } from "../home/CustomerReviews";
import { GalleryStrip } from "../home/GalleryStrip";
import { HeroSlider } from "../home/HeroSlider";
import { TourPackages } from "../home/TourPackages";

const reasons = [
  { icon: "/assets/home/icon-10.png", text: "Our guides are knowledgeable and friendly" },
  { icon: "/assets/home/icon-11.png", text: "We have clean and safe Vehicles" },
  { icon: "/assets/home/icon-12.png", text: "We are reliable and always on time" }
];

export function HomePage() {
  useDocumentTitle(
    "SL Tours Cape Town | Guided Day Trips, Safaris & Transfers",
    "Book Cape Town tours and transfers with local guides. Explore Cape Point, Winelands, Garden Route, safaris, and private tour options with SL Tours."
  );

  return (
    <>
      <HeroSlider />

      <section className="intro-section" aria-labelledby="intro-title">
        <h2 id="intro-title">Cape Town Tours With a Local Team</h2>
        <p>
          SL Tours is a Cape Town-based tour operator offering guided day trips, Winelands wine tastings, Garden Route
          excursions, safaris, and airport transfers. Every tour is run by local guides who know the routes, the history,
          and the best spots to stop along the way. Whether you're visiting for a few days or exploring the Western Cape
          over a longer trip, we tailor each outing around your schedule and interests, using clean, well-maintained
          vehicles and drivers who show up on time. Browse our most requested packages below, or get in touch to build a
          custom itinerary.
        </p>
      </section>

      <TourPackages />

      <CustomerReviews />

      <GalleryStrip />

      <section className="planning-band" aria-labelledby="planning-title">
        <div className="planning-inner">
          <div>
            <p className="eyebrow">Plan Your Cape Town Journey</p>
            <h2 id="planning-title">Not sure which tours fit? Tell us your dates and interests.</h2>
            <p>
              Share your arrival and departure dates, who is travelling, and what you enjoy. SL Tours will shape a tailored
              plan with tours, transfers, and a quote.
            </p>
          </div>
          <ul className="planning-points">
            <li>
              <CalendarHeart aria-hidden="true" />
              Day tours around your schedule
            </li>
            <li>
              <Plane aria-hidden="true" />
              Airport transfers and private drivers
            </li>
            <li>
              <Route aria-hidden="true" />
              Multi-day Garden Route and safari trips
            </li>
          </ul>
          <div className="planning-actions">
            <Link className="button button-primary" to="/plan-my-trip">
              Plan My Trip
            </Link>
            <Link className="button button-quiet" to="/private-tours">
              Private Tours
            </Link>
          </div>
        </div>
      </section>

      <section className="why-band" aria-labelledby="why-title">
        <div className="why-label">
          <h2 id="why-title">Why Book With Us?</h2>
        </div>
        {reasons.map((reason) => (
          <div key={reason.text} className="why-item">
            <img src={reason.icon} alt="" width="40" height="40" loading="lazy" />
            <p>{reason.text}</p>
          </div>
        ))}
      </section>
    </>
  );
}
