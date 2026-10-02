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
  it("shows live-site sections and API-backed tour packages", async () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByRole("heading", { level: 1, name: "Exceptional" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cape Town Tours With a Local Team" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Why Book With Us?" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Rate us on Google" })).toHaveAttribute(
      "href",
      "https://g.page/r/CRyeNopih97yEAE/review"
    );

    const card = (await screen.findByRole("heading", { name: "Cape Peninsula Journey" })).closest("article");
    expect(card).not.toBeNull();
    const inCard = within(card as HTMLElement);
    expect(inCard.getByText("Included: Entrance fees, toll fee and coffee.")).toBeInTheDocument();
    expect(card?.textContent?.replace(/\s+/g, " ")).toContain("R 2 100");
    expect(inCard.getByRole("link", { name: "Book Online" })).toHaveAttribute("href", "/book/cape-peninsula-journey");
    const whatsapp = inCard.getByRole("link", { name: "Reserve on WhatsApp" }).getAttribute("href") ?? "";
    expect(decodeURIComponent(whatsapp)).toContain("I would like to reserve Cape Peninsula Journey");
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
