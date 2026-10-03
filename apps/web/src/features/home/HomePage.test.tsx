import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CurrencyProvider, CurrencySelect, Price } from "../../lib/currency";
import type { TourSummary } from "../../types/api";
import { HomePage } from "../tours/HomePage";

const capePoint: TourSummary = {
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
  tags: ["nature"]
};

function jsonResponse(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } })
  );
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("frankfurter")) {
        return jsonResponse({ rates: { USD: 0.055, EUR: 0.05, GBP: 0.043 } });
      }
      if (url.includes("/api/v1/tours")) {
        return jsonResponse([capePoint]);
      }
      if (url.includes("/api/v1/private-trips/vehicles")) {
        return jsonResponse({ vehicles: [
          { id: "v1", name: "Hyundai H1", category: "VAN", capacity: 8, luggageCapacity: null, amenities: ["Air conditioning"], description: null,
            imageUrl: null, imageAlt: "Hyundai H1", hourlyRateCents: 65000, minimumMinutes: 180, sampleRate: false, quote: null, quoteOnlyReason: null },
          { id: "v2", name: "Toyota Quantum", category: "MINIBUS", capacity: 13, luggageCapacity: 10, amenities: [], description: null,
            imageUrl: "/api/v1/public/media/q", imageAlt: "Toyota Quantum outside the office", hourlyRateCents: 95000, minimumMinutes: 180, sampleRate: false,
            quote: null, quoteOnlyReason: null }],
          disclosures: { billingIncrementMinutes: 60, includedKmPerHour: null, excessKmRateCents: null, overtimeHourlyRateCents: null, fees: [], sampleRatesShown: false } });
      }
      if (url.includes("/api/v1/activities")) {
        return jsonResponse([{ slug: "cape-point", title: "Cape Point", category: "NATURE", area: "CAPE_POINT", areaLabel: "Cape Point",
          summary: "The south-western tip.", durationMinutes: 180, priceStatus: "VERIFIED", fromPriceCents: 11000, fromPriceLabel: "Adult", heroImage: null,
          heroImageAlt: null, indoor: false, weatherDependent: true, lastVerifiedOn: "2026-10-03" }]);
      }
      return Promise.reject(new Error(`Unexpected request ${url}`));
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderWithProviders(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CurrencyProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </CurrencyProvider>
    </QueryClientProvider>
  );
}

describe("HomePage", () => {
  it("introduces every main section in navigation order with a link to its page", async () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByRole("heading", { level: 1, name: "Exceptional" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Book a tour" })[0]).toHaveAttribute("href", "/experiences");
    const order = ["Cape Town tours with a local team", "Featured tours", "Your own vehicle and driver", "Plan your own days out",
      "Pictures taken on tour", "Tell us about your trip"].map(name => screen.getByRole("heading", { name }));
    for (let i = 1; i < order.length; i++) expect(order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("link", { name: "About SL Tours" })).toHaveAttribute("href", "/about");
    expect(screen.getByRole("link", { name: "View all tours" })).toHaveAttribute("href", "/experiences");
    expect(screen.getByRole("link", { name: "Book a private trip" })).toHaveAttribute("href", "/book-private-trip");
    expect(screen.getAllByRole("link", { name: "View Things to Do in Cape Town" })[0]).toHaveAttribute("href", "/explore");
    expect(screen.getByRole("link", { name: "View the gallery" })).toHaveAttribute("href", "/gallery");
    expect(screen.getByRole("link", { name: "Send an enquiry" })).toHaveAttribute("href", "/contact");
    expect(screen.getByRole("link", { name: "Rate us on Google" })).toHaveAttribute("href", "https://g.page/r/CRyeNopih97yEAE/review");

    const card = (await screen.findByRole("heading", { name: "Cape Peninsula Journey" })).closest("article");
    const inCard = within(card as HTMLElement);
    expect(inCard.getByText("Included: Entrance fees, toll fee and coffee.")).toBeInTheDocument();
    expect(card?.textContent?.replace(/\s+/g, " ")).toContain("R 2 100");
    expect(inCard.getByRole("link", { name: "Book Online" })).toHaveAttribute("href", "/book/cape-peninsula-journey");
    const whatsapp = inCard.getByRole("link", { name: "Reserve on WhatsApp" }).getAttribute("href") ?? "";
    expect(decodeURIComponent(whatsapp)).toContain("I would like to reserve Cape Peninsula Journey");
    expect(await screen.findByRole("heading", { name: "Cape Point" })).toBeInTheDocument();
  });

  it("shows vehicles from the fleet records with accessible controls, and carries the chosen vehicle into the booking flow", async () => {
    renderWithProviders(<HomePage />);
    const show = await screen.findByRole("region", { name: "Vehicles for private trips" });
    const slides = within(show);
    expect(slides.getByRole("heading", { name: "Hyundai H1" })).toBeVisible();
    expect(slides.getByText("Up to 8 passengers")).toBeInTheDocument();
    expect(slides.getByText("Air conditioning")).toBeInTheDocument();
    expect(slides.getByText("Photo to follow")).toBeInTheDocument();
    expect(slides.getAllByText(/Availability is confirmed for your trip/)[0]).toBeInTheDocument();
    expect(show.textContent).not.toMatch(/R\s?650/); // no prices on the homepage slides
    expect(slides.getByRole("link", { name: "Book / Enquire about the Hyundai H1" })).toHaveAttribute("href", "/book-private-trip?vehicle=v1");
    expect(slides.getByText("1 of 2")).toBeInTheDocument();
    await userEvent.click(slides.getByRole("button", { name: "Next vehicle" }));
    expect(slides.getByText("2 of 2")).toBeInTheDocument();
    expect(slides.getByRole("img", { name: "Toyota Quantum outside the office" })).toBeInTheDocument();
    expect(slides.getByRole("link", { name: "Book / Enquire about the Toyota Quantum" })).toHaveAttribute("href", "/book-private-trip?vehicle=v2");
    slides.getByRole("button", { name: "Previous vehicle" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(slides.getByText("1 of 2")).toBeInTheDocument();
    await userEvent.click(slides.getByRole("button", { name: "Show Toyota Quantum" }));
    expect(slides.getByRole("button", { name: "Show Toyota Quantum" })).toHaveAttribute("aria-current", "true");
  });
});

describe("currency conversion", () => {
  it("converts ZAR prices with live rates and remembers the choice", async () => {
    renderWithProviders(
      <>
        <CurrencySelect />
        <Price cents={210000} />
      </>
    );

    expect(document.body.textContent?.replace(/\s+/g, " ")).toContain("R 2 100");

    await userEvent.selectOptions(screen.getByLabelText("Currency"), "USD");

    const converted = await screen.findByText("≈ $116");
    expect(converted).toHaveAttribute("title", expect.stringContaining("approx., live rate"));
    expect(localStorage.getItem("slToursSelectedCurrency")).toBe("USD");
  });
});
