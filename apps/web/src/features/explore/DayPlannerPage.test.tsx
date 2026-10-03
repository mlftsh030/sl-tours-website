import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CurrencyProvider } from "../../lib/currency";
import { DayPlannerPage } from "./DayPlannerPage";
import { ExplorePage } from "./ExplorePage";

const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
const card = (slug: string, category: string, extra = {}) => ({ slug, title: slug, category, area: "WATERFRONT", areaLabel: "V&A Waterfront", summary: "Summary",
  durationMinutes: 90, priceStatus: "VERIFIED", fromPriceCents: 28000, fromPriceLabel: "Adult", heroImage: null, heroImageAlt: null, indoor: true,
  weatherDependent: false, lastVerifiedOn: "2026-10-03", ...extra });
const wrap = (ui: React.ReactNode, path = "/") => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
  <CurrencyProvider><MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter></CurrencyProvider></QueryClientProvider>);
afterEach(() => vi.unstubAllGlobals());

describe("Explore Cape Town", () => {
  it("lists activities and filters by category without inventing prices", async () => {
    vi.stubGlobal("fetch", vi.fn((url: string) => url.includes("/api/v1/activities") ? json([card("ice-rink", "ICE_SKATING"),
      card("karting", "GO_KARTING", { priceStatus: "NOT_PUBLISHED", fromPriceCents: null })]) : url.includes("frankfurter") ? json({ rates: {} }) : Promise.reject(new Error(url))));
    wrap(<ExplorePage />, "/explore");
    expect(await screen.findByRole("link", { name: "karting" })).toBeInTheDocument();
    expect(screen.getByText("not published")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ice skating" }));
    expect(screen.queryByRole("link", { name: "karting" })).not.toBeInTheDocument();
    expect(screen.getByText("1 activity")).toBeInTheDocument();
  });

  it("sends the travellers, residency and budget, and shows unknown costs as unverified", async () => {
    const bodies: Array<Record<string, unknown>> = [];
    vi.stubGlobal("fetch", vi.fn((url: string, options?: RequestInit) => {
      if (url.endsWith("/csrf")) return json({ token: "t", headerName: "X-CSRF-TOKEN" });
      if (url.includes("/api/v1/activities")) return json([card("aquarium", "WILDLIFE")]);
      if (url.endsWith("/api/v1/itineraries")) {
        bodies.push(JSON.parse(String(options?.body)));
        return json({ date: "2026-11-02", travellers: "2 adults, children aged 4, 9", transport: [], food: [],
          stops: [{ order: 1, type: "ACTIVITY", slug: "cape-point", title: "Cape Point", area: "CAPE_POINT", areaLabel: "Cape Point", start: "10:00:00", end: "13:00:00",
            travelMinutes: 90, notes: [], costs: [{ label: "Admission", quantity: 4, unitAmountCents: null, amountCents: null, kind: "UNKNOWN",
              detail: "Published prices end on 2026-10-31; prices for 2026-11-02 are not verified yet", sourceUrl: null, verifiedOn: null }] }],
          totals: { verifiedCents: 0, assumptionCents: 0, estimatedCents: 0, knownTotalCents: 0, unknownItems: 1 }, budgetCents: 250000,
          verdict: "CANNOT_CONFIRM", verdictMessage: "We can't confirm this fits your budget.", assumptions: ["Travel times are planning estimates"],
          exclusions: ["food and drinks"], warnings: [], skipped: [] });
      }
      return Promise.reject(new Error(url));
    }));
    wrap(<DayPlannerPage />, "/explore/plan?include=aquarium");
    expect(await screen.findByText(/Your plan will include aquarium/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/Children's ages/), "4, 9");
    await userEvent.type(screen.getByLabelText(/Total budget/), "2500");
    await userEvent.selectOptions(screen.getByLabelText("Travellers are"), "SA_RESIDENT");
    await userEvent.click(screen.getByRole("button", { name: "Plan my day" }));
    expect(await screen.findByText("We can't confirm this fits your budget.")).toBeInTheDocument();
    expect(screen.getByText("Not verified")).toBeInTheDocument();
    expect(screen.getByText(/not verified yet/)).toBeInTheDocument();
    expect(bodies[0]).toMatchObject({ adults: 2, childAges: [4, 9], residency: "SA_RESIDENT", budgetCents: 250000, foodPerPersonCents: null, mustInclude: ["aquarium"] });
  });
});
