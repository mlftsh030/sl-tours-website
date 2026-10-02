import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listTours } from "../../lib/api";
import { useDocumentTitle } from "../../lib/useDocumentTitle";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateBlocks";
import { PageBanner } from "../../components/PageBanner";
import { PackageCard } from "./PackageCard";

const filters = [
  { value: "all", label: "All tours" },
  { value: "full day", label: "Full day" },
  { value: "half day", label: "Half day" },
  { value: "private", label: "Private" },
  { value: "culture", label: "Culture" },
  { value: "nature", label: "Nature" },
  { value: "wine", label: "Wine" },
  { value: "wildlife", label: "Wildlife" },
  { value: "transfer", label: "Transfers" }
];

const banners = {
  all: {
    title: "Our Tours",
    subtitle: "Day trips, safaris, and journeys with a local team",
    image: "/assets/gallery/16.jpg"
  },
  private: {
    title: "Private Tours",
    subtitle: "Tailor-made days at your own pace, with no waiting for other guests",
    image: "/assets/gallery/27.jpg"
  },
  transfer: {
    title: "Transfers",
    subtitle: "Reliable airport and private transfers across Cape Town",
    image: "/assets/gallery/1.jpg"
  }
};

export function ExperiencesPage({ focus }: { focus?: "private" | "transfer" }) {
  const banner = banners[focus ?? "all"];
  useDocumentTitle(`${banner.title} | SL Tours Cape Town`);
  const [filter, setFilter] = useState<string>(focus ?? "all");
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const setQuery = (value: string) => setSearchParams(value ? { q: value } : {}, { replace: true });
  const tours = useQuery({ queryKey: ["tours"], queryFn: () => listTours() });

  const filteredTours = useMemo(() => {
    return (tours.data ?? []).filter((tour) => {
      const haystack = [tour.title, tour.shortDescription, tour.category, ...tour.tags].join(" ").toLowerCase();
      const matchesQuery = haystack.includes(query.toLowerCase());
      const matchesFilter = filter === "all" || tour.tags.includes(filter) || tour.category.toLowerCase() === filter;
      return matchesQuery && matchesFilter;
    });
  }, [filter, query, tours.data]);

  return (
    <>
      <PageBanner title={banner.title} subtitle={banner.subtitle} image={banner.image} />
      <section className="section tours-section">
        {focus === "private" && (
          <aside className="private-trip-cta">
            <div>
              <p className="eyebrow">By the hour</p>
              <h2>Need a vehicle and driver for your own plans?</h2>
              <p>Book a Private Trip: choose your time, see the available vehicles and the full price before you request.</p>
            </div>
            <Link className="button button-primary" to="/book-private-trip">Book a Private Trip</Link>
          </aside>
        )}
        <div className="tours-toolbar">
          <div className="filter-row" role="group" aria-label="Filter tours">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                className={filter === item.value ? "chip chip-active" : "chip"}
                aria-pressed={filter === item.value}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="search-control">
            <Search aria-hidden="true" />
            <span className="sr-only">Search tours</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tours"
            />
          </label>
        </div>
        {tours.isLoading && <LoadingState label="Loading tours" />}
        {tours.isError && <ErrorState message={(tours.error as Error).message} />}
        {tours.data && (
          <p className="result-count" aria-live="polite">
            {filteredTours.length} {filteredTours.length === 1 ? "tour" : "tours"}
          </p>
        )}
        {tours.data && filteredTours.length === 0 && <EmptyState message="No tours match these filters." />}
        <div className="package-grid">
          {filteredTours.map((tour) => (
            <PackageCard key={tour.slug} tour={tour} />
          ))}
        </div>
      </section>
    </>
  );
}
