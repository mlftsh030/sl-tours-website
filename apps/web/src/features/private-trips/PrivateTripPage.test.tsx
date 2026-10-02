import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PrivateTripPage } from "./PrivateTripPage";
import type { VehicleCard } from "../../types/api";

const quote = (total: number) => ({ hourlyRateCents: 65000, rateSource: "CATEGORY", sampleRate: true, requestedMinutes: 240, minimumMinutes: 180,
  billableMinutes: 240, incrementMinutes: 60, minimumApplied: false, roundedUp: false, baseCents: total, fees: [], feesCents: 0, totalCents: total });
const van = (total: number): VehicleCard => ({ id: "v-1", name: "Toyota Quantum", category: "VAN", capacity: 7, luggageCapacity: 6, amenities: ["Air conditioning"],
  description: null, imageUrl: null, imageAlt: "Toyota Quantum", hourlyRateCents: 65000, minimumMinutes: 180, sampleRate: true, quote: quote(total) as VehicleCard["quote"], quoteOnlyReason: null });
const disclosures = { billingIncrementMinutes: 60, includedKmPerHour: null, excessKmRateCents: null, overtimeHourlyRateCents: null, fees: [], sampleRatesShown: true };
const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

afterEach(() => vi.unstubAllGlobals());

describe("Book a Private Trip", () => {
  it("prices on the server, refreshes after a price change and only confirms a stored request", async () => {
    let searchTotal = 260000;
    const submitted: Array<Record<string, unknown>> = [];
    vi.stubGlobal("fetch", vi.fn((url: string, options?: RequestInit) => {
      if (url.endsWith("/csrf")) return json({ token: "t", headerName: "X-CSRF-TOKEN" });
      if (url.includes("/api/v1/auth/me")) return json({ authenticated: false, email: null, name: null, role: null });
      if (url.includes("/private-trips/vehicles")) return json({ vehicles: [van(0)], disclosures });
      if (url.includes("/private-trips/availability")) return json({ startsAt: "", endsAt: "", durationMinutes: 240, passengers: 2, vehicles: [van(searchTotal)], disclosures });
      if (url.includes("/private-trips/requests")) {
        const body = JSON.parse(String(options?.body)); submitted.push(body);
        if (body.expectedTotalCents !== 280000) { searchTotal = 280000; return json({ message: "The price has changed since you started." }, 409); }
        return json({ reference: "SLT-2026-PRIV01", status: "ENQUIRY", message: "Request received. This is not yet a confirmed booking.", quote: quote(280000),
          startsAt: "2026-11-01T07:00:00Z", endsAt: "2026-11-01T11:00:00Z", vehicleName: "Toyota Quantum", duplicate: false }, 201);
      }
      return Promise.reject(new Error(`Unexpected ${url}`));
    }));
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><PrivateTripPage /></MemoryRouter></QueryClientProvider>);

    expect(await screen.findByText("Sample rate · development only")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Pickup location"), "Camps Bay");
    await userEvent.type(screen.getByLabelText("Destination or planned itinerary"), "Cape Point");
    await userEvent.click(screen.getByRole("button", { name: "Show available vehicles" }));
    await userEvent.click(await screen.findByRole("button", { name: "Choose this vehicle" }));
    expect(screen.getByText(/This is a booking request/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Name"), "Lerato");
    await userEvent.type(screen.getByLabelText("Email"), "lerato@example.com");
    await userEvent.type(screen.getByLabelText("Mobile number"), "+27 82 111 2222");
    await userEvent.click(screen.getByRole("button", { name: "Request this trip" }));
    expect(await screen.findByText(/price has changed/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("R 2 800,00").length).toBeGreaterThan(0));
    await userEvent.click(screen.getByRole("button", { name: "Request this trip" }));
    expect(await screen.findByText("SLT-2026-PRIV01")).toBeInTheDocument();
    expect(screen.getByText(/not yet a confirmed booking/)).toBeInTheDocument();
    expect(submitted).toHaveLength(2);
    expect(submitted[0].idempotencyKey).toBe(submitted[1].idempotencyKey);
    expect(submitted[1]).toMatchObject({ vehicleId: "v-1", durationMinutes: 240, pickupLocation: "Camps Bay", expectedTotalCents: 280000 });
  });
});
