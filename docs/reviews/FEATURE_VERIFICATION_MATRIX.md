# Feature Verification Matrix

Review date: 2026-09-30. See [CODEX_IMPLEMENTATION_AUDIT.md](CODEX_IMPLEMENTATION_AUDIT.md) for the finding IDs.

"Runtime verified" means exercised against the Docker stack built from scratch. "Mobile checked" means a headless Chrome screenshot at 390 px (plus 1440 px desktop).

| Feature | Implementation | Runtime verified | Tests | Security checked | Mobile checked | Status |
|---|---|---|---|---|---|---|
| Tour listing (`GET /tours`) | Yes | Yes | Mapper unit + MockMvc open-access | Yes (public, read-only) | Yes | Verified working |
| Tour filtering (category/featured) | Yes | Yes (bad enum now 400) | MockMvc bad-enum | Yes | Yes | Working with concerns: client-side substring filter |
| Tour detail | Yes | Yes | None | Yes | Yes | Working with concerns: blurry hero, itinerary time parsing, content ≠ live site (BIZ-002) |
| Booking request | Yes | Yes (price manipulation, dates, guests, malformed JSON) | Service unit (price, guest range) + MockMvc malformed | Partial: no rate limit | Yes | Working with concerns: min group size wrong (BIZ-001), no availability, no notification |
| Booking confirmation page | Yes | Code only | None | N/A | No | Working with concerns: links to fake My Trip |
| Plan My Trip | Yes | Yes | MockMvc blank-item rejection | Partial: no rate limit | Yes | Working with concerns: free-text enums, no trip-length limit |
| My Trip / customer portal | Hard-coded | Yes (returns fixed "Sarah" data, no auth) | None | Yes (no auth, no ownership) | Yes | Broken (fake) |
| Operations dashboard metrics | Partial | Yes | MockMvc auth | Yes | No (Basic-auth popup blocked the screenshot) | Partially implemented: guides/vehicles literals 3/4 |
| Operations bookings table | Yes | Yes (was 500, now 200) | MockMvc auth only | Yes | No | Working with concerns (fixed OPS-001) |
| Booking status update | Yes (API only, no UI) | Yes (was 500 + silent write, now 200) | MockMvc 401 | Yes | N/A | Working with concerns: no transition rules or audit |
| Ops auth (HTTP Basic) | Yes | Yes | MockMvc 401/200 | Yes | N/A | Working with concerns: single env-var user, default password accepted |
| Customer auth | No | — | — | — | — | Not implemented |
| Guides / drivers / vehicles | Tables + seed only | — | — | — | — | Not implemented |
| Assignments | Table + 1 seed row, never read | Yes (ops shows "Unassigned") | — | — | — | Not implemented |
| Quotes | Tables + seed only | — | — | — | — | Not implemented |
| Payments | Table + seed only | — | — | — | — | Not implemented |
| Notifications / email / WhatsApp | Table only | — | — | — | — | Not implemented |
| Reporting | Revenue sum only | Yes | — | — | — | Partially implemented: metric definition wrong (OPS-005) |
| Flyway migrations | Yes | Yes (empty DB → V2, `validate` passes) | None automated | N/A | N/A | Verified working |
| Docker (`docker-compose.yml`) | Yes | Yes (clean build + up) | — | Partial (root, exposed DB) | N/A | Working with concerns |
| Docker dev (`docker-compose.dev.yml`) | Yes | Not run; broken by inspection (proxy → own container) | — | — | — | Broken (by inspection, not runtime) |
| SEO (titles/meta/sitemap) | Client-side only | Yes (index.html static) | — | — | — | Partially implemented: weaker than legacy site |
| Responsive layout (public pages) | Yes | 390/1440 screenshots | — | — | Yes (390) | Working with concerns: 320/768/1024 not checked |
| Accessibility | Partial | Code inspection | — | — | — | Partially implemented: modal focus, error linking |
| Swagger / OpenAPI | Yes | Yes (302 → UI, 8 paths) | — | Public | N/A | Verified working: documents the fake endpoint too |
