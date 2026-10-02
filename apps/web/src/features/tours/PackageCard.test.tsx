import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PackageCard } from "./PackageCard";
import type { TourSummary } from "../../types/api";

const tour: TourSummary = {
  slug: "cape-peninsula-journey",
  title: "Cape Peninsula Journey",
  shortDescription: "Cape Point, penguins, and coastal villages.",
  duration: "Full day",
  basePriceCents: 210000,
  pricingType: "PER_PERSON",
  category: "PENINSULA",
  featured: true,
  heroImage: "/assets/cape-point-tour.jpg",
  cardNote: "Included: Entrance fees, toll fee and coffee.",
  tags: ["nature", "full day", "private friendly"]
};

function renderCard(value: TourSummary) {
  render(
    <MemoryRouter>
      <PackageCard tour={value} />
    </MemoryRouter>
  );
}

describe("PackageCard", () => {
  it("renders tour pricing and booking links", () => {
    renderCard(tour);

    expect(screen.getByRole("heading", { name: "Cape Peninsula Journey" })).toBeInTheDocument();
    expect(document.body.textContent?.replace(/\s+/g, " ")).toContain("R 2 100per person");
    expect(screen.getByRole("link", { name: "Book Online" })).toHaveAttribute("href", "/book/cape-peninsula-journey");
    expect(screen.getByRole("link", { name: "More Information" })).toHaveAttribute("href", "/experiences/cape-peninsula-journey");
  });

  it("shows custom tours as rate on request instead of a zero price", () => {
    renderCard({ ...tour, slug: "private-custom-tour", title: "Private Custom Tour", pricingType: "CUSTOM", basePriceCents: 0 });

    expect(document.body.textContent).toContain("Rateon request");
    expect(document.body.textContent).not.toContain("R 0");
  });
});
