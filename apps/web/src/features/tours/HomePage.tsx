import { useDocumentTitle } from "../../lib/useDocumentTitle";
import { AboutIntro } from "../home/AboutIntro";
import { ContactBand } from "../home/ContactBand";
import { CustomerReviews } from "../home/CustomerReviews";
import { GalleryStrip } from "../home/GalleryStrip";
import { HeroSlider } from "../home/HeroSlider";
import { PrivateTripsSection } from "../home/PrivateTripsSection";
import { ThingsToDoFeature } from "../home/ThingsToDoFeature";
import { TourPackages } from "../home/TourPackages";

/** Home: introduces every main section in the order of the navigation, each with a link to its full page. */
export function HomePage() {
  useDocumentTitle(
    "SL Tours Cape Town | Guided Day Trips, Safaris & Transfers",
    "Book Cape Town tours and transfers with local guides. Explore Cape Point, Winelands, Garden Route, safaris, and private tour options with SL Tours."
  );
  return (
    <>
      <HeroSlider />
      <AboutIntro />
      <TourPackages />
      <PrivateTripsSection />
      <ThingsToDoFeature />
      <GalleryStrip />
      <CustomerReviews />
      <ContactBand />
    </>
  );
}
