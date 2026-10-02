# Codex Implementation Audit — SL Tours Platform

Review date: 2026-09-30
Reviewer: Claude (Opus 5.5), acting as principal reviewer
Scope: every file Codex added or changed (all currently **uncommitted** on `main`)

Companion documents:
- [FEATURE_VERIFICATION_MATRIX.md](FEATURE_VERIFICATION_MATRIX.md)
- [REMEDIATION_PLAN.md](REMEDIATION_PLAN.md)

---

## Executive Summary

Codex built a **foundation** next to the legacy static site. It is not a finished platform.

| Area | What exists |
|---|---|
| Backend | Spring Boot 3.3.5 / Java 21, ~35 source files, 8 endpoints, 2 Flyway migrations (schema + seed) |
| Frontend | React 18 + Vite + TanStack Query + react-hook-form/zod, 11 routes, ~1 000 lines TSX, 933 lines CSS |
| Infra | `docker-compose.yml`, `docker-compose.dev.yml`, two Dockerfiles, nginx reverse proxy |
| Docs | 21 Markdown files (~720 lines) |
| Tests | Before review: 1 frontend + 3 backend unit tests. No DB, HTTP or security tests |

**What works:** the tour catalogue, tour detail, booking-request creation and trip-planning-request creation. All four read from or write to PostgreSQL through the API, and the server calculates the booking total itself. Docker builds and starts from an empty machine, and Flyway rebuilds the schema from nothing.

**What doesn't work, or is fake:**
- The operations bookings table and status update were **broken at runtime** (HTTP 500). The status update still wrote to the database while reporting failure. Fixed during this review.
- "My Trip" is a **hard-coded Java string response** with no authentication and no link to any booking.
- The dashboard's "active guides/vehicles" counts are the literals `3` and `4`. Every booking shows guide/vehicle "Unassigned" even when the database has an assignment.
- Quotes, payments, guides, drivers, vehicles, notifications and trips exist **only as tables and seed rows**. No entity, endpoint or UI uses them.
- The 13-item operations sidebar is anchor links to sections that don't exist.

The documentation is mostly honest that this is a foundation (see `docs/product/PRODUCT_REQUIREMENTS.md` "Not Yet Production Complete"). The UI isn't: it presents My Trip and Operations as working features.

**Production readiness: blocking.** See the last section.

---

## Method and Evidence

Everything below was checked by running it, not by reading claims.

1. **Git:** Codex's work is 100% untracked (`?? apps/ docs/ docker-compose*.yml …`, `M README.md`). There are no Codex commits, so the review is of the working tree.
2. **Clean start:** `docker compose down -v` (the DB held only seed rows plus two Codex smoke-test bookings, which I checked before deleting), `cp .env.example .env`, `docker compose build --no-cache`, `docker compose up`.
3. **Checks:** `tsc -b`, `vitest run`, `vite build`, `mvn test`, `npm audit`.
4. **API probing** with curl: auth, validation, pricing manipulation, malformed input, CORS, rate limiting.
5. **Visual review:** headless Chrome screenshots at 390 px and 1440 px of every public page.
6. **Business-fact check:** seed data compared against the live legacy `index.html` / `our_tours.html`.

### Tooling available and used
Docker 29.8 + Compose 5.5, OpenJDK 21, Maven 3.8.7, Node 20.20, headless Google Chrome, psql (via the container).
Not available: Playwright (not installed in the repo), Testcontainers (not in pom), ESLint (the `lint` script only runs `tsc`), OWASP dependency-check. Canva and Google Drive MCP connectors need authorisation and weren't needed.

---

## Verified Strengths

These were confirmed at runtime, not just read:

- **The server owns the price.** `POST /api/v1/bookings` ignores client-sent `totalAmountCents`, `status` and `amountPaidCents` (tested: sent `totalAmountCents:1`, `status:CONFIRMED`, and got a 420 000-cent `ENQUIRY`). DTOs are records with no mass-assignment path.
- **Money is integer cents** everywhere (`int` in Java, `integer` with `>= 0` checks in SQL). No floating-point arithmetic.
- **Flyway works from an empty database.** `ddl-auto: validate` passes, so the entities match the migrations.
- **Entities are never serialised directly.** Every endpoint returns a DTO record.
- **`open-in-view: false`**, the correct setting. It is also what exposed the ops bug below.
- **Booking references** use `SecureRandom` over an unambiguous 32-character alphabet (≈1 billion combinations a year).
- **Admin chain** is stateless HTTP Basic with BCrypt, and wrong or missing credentials get 401.
- **Validation** on booking: past dates, 0/61 guests and per-tour min/max are rejected with readable 400s.
- **Seed prices match the live site** (Cape Point R2 100, Winelands R1 800, City R900, Township R950, Garden Route R6 500, Aquila R3 500, Airport R1 300 per trip).
- **TypeScript `strict: true`**, zero `any`, zero `@ts-ignore`. The only non-null assertion is the standard `getElementById("root")!`.
- **Frontend states:** loading, error and empty states exist for every query.
- **Docs are candid** about security gaps (THREAT_MODEL, SECURITY_MODEL, DEPLOYMENT all list missing ownership checks, rate limiting and HTTPS).

---

## Critical Problems

Only issues that block real use or corrupt data are listed here.

| ID | Severity | Status | Summary |
|---|---|---|---|
| OPS-001 | CRITICAL | **Fixed** | Ops bookings list always returned 500 (`LazyInitializationException`) |
| OPS-002 | CRITICAL | **Fixed** | Status PATCH committed the change, then returned 500 |
| TRIP-001 | HIGH | Open | My Trip is a hard-coded, unauthenticated fake |
| BIZ-001 | HIGH | Open | Minimum group size of 5 from the live site was lost (seed has 1) |
| SEC-001 | HIGH | **Fixed** | Ops Basic-auth credential could be inlined into the public JS bundle |

---

## Functional Problems

```text
ID: OPS-001
Severity: CRITICAL (BLOCKER)
Area: Operations API
File: apps/api/src/main/java/com/sltours/operations/controller/OperationsController.java (original)
Description: GET /api/v1/admin/bookings called booking.getTour().getTitle() on a LAZY
  association from a controller with no transaction, with open-in-view disabled.
Evidence: HTTP 500 at runtime; log shows
  "LazyInitializationException: could not initialize proxy [Tour#1000…0001] - no Session".
Why it matters: The operations screen's only table could never load. Codex's smoke test
  checked /admin/dashboard but not /admin/bookings.
How to reproduce: curl -u admin@sltours.local:change-me-in-env localhost:8081/api/v1/admin/bookings
Fix applied: New OperationsService with @Transactional(readOnly = true); repository
  methods use @EntityGraph("tour"), so there's also no N+1.
Confidence: Verified (runtime 500 before, 200 after)
```

```text
ID: OPS-002
Severity: CRITICAL (BLOCKER, data integrity)
Area: Operations API
Description: PATCH /bookings/{ref}/status called repository.save() (its own transaction,
  committed) and then hit the same lazy-load failure while building the response.
Evidence: PATCH {"status":"REFUNDED"} returned 500; SELECT afterwards showed
  status = REFUNDED.
Why it matters: Staff see "failed", retry or give up, and the booking has already
  changed. There is also no audit trail of who changed it.
Fix applied: The whole read-modify-respond now runs in one @Transactional service method.
Confidence: Verified
```

```text
ID: OPS-003
Severity: HIGH (IMPORTANT)
Area: Operations domain
Description: Any status can be set from any status (e.g. ENQUIRY → REFUNDED, COMPLETED → ENQUIRY).
  No state machine, no reason, no actor recorded.
Recommended fix: Explicit allowed-transition map in the service, and a booking_status_history
  table (who, when, from, to, reason).
Confidence: Verified
```

```text
ID: OPS-004
Severity: MEDIUM (IMPORTANT)
Area: Operations — fake data
Files: OperationsService (activeGuides=3, activeVehicles=4); toOperationsBooking ("Unassigned")
Description: The dashboard counts are literals. Guide/vehicle are always "Unassigned" even
  though seed booking SLT-2026-A1B2C3 has an assignment row (Amina / Mercedes V-Class).
Why it matters: Staff would trust wrong numbers. This is fake data on a production path.
Recommended fix: Count the guides/vehicles tables; join assignments. Until then, remove the
  tiles rather than show invented numbers.
```

```text
ID: OPS-005
Severity: MEDIUM
Area: Reporting correctness
Description: "Pipeline"/revenue = SUM(total) over every status except CANCELLED, so it
  includes REFUNDED, ENQUIRY (unconfirmed requests) and CUSTOM (R0) bookings.
Evidence: 30 spam ENQUIRY bookings added R39 000 to "revenue".
Recommended fix: Define the metrics with the business: confirmed revenue, outstanding
  balance, open pipeline.
```

```text
ID: OPS-006
Severity: LOW
Area: Time zones
Description: "Tours today" used LocalDate.now() in a UTC container, so between 00:00 and 02:00
  SAST it counted yesterday.
Fix applied: LocalDate.now(ZoneId.of("Africa/Johannesburg")).
```

```text
ID: TRIP-001
Severity: HIGH (BLOCKER for launch)
Area: Customer portal
File: apps/api/src/main/java/com/sltours/trips/model/CustomerTripController.java
Description: GET /api/v1/my-trip/current returns a hard-coded "Hello, Sarah" itinerary to
  anyone, with no authentication. It isn't linked to any booking or trips row. The
  controller sits in a `model` package. After booking, the confirmation page sends real
  customers to it ("View Demo Trip Portal").
Why it matters: A paying customer would see someone else's (fictional) trip. The real
  trips / trip_days / itinerary_items tables are unused.
Recommended fix: Hide the My Trip nav and CTA until a real portal exists (tokenised link
  emailed per booking, looked up by token hash, as the unused secure_portal_token_hash
  column intends).
Confidence: Verified
```

```text
ID: BIZ-001
Severity: HIGH (IMPORTANT, business rule regression)
Area: Tours / seed data
Files: apps/api/src/main/resources/db/migration/V2__seed_development_data.sql
Description: Commit 4e83578 "Fix: Minimum of 4 to 5 pax" set "Minimum Guests: 5" on five
  tours on the live site. The seed has minimum_guests = 1 on all tours except Garden Route (2).
Evidence: POST a 1-guest Cape Peninsula booking → 201 Created.
Why it matters: The API accepts bookings the business doesn't operate.
Recommended fix: Confirm the real minimums with the owner, then add a V3 migration
  (don't edit V2, which has already been applied).
Not fixed: this is a business decision.
```

```text
ID: BIZ-002
Severity: MEDIUM
Area: Content accuracy
Description: Seeded inclusions contradict the live site:
  - Cape Point: live says "Entrance fees and lunch" included; seed EXCLUDES "Lunch unless
    arranged" and "Optional entrance fees".
  - Winelands: live says "Wine tastings at two farms" included; seed excludes tasting fees.
  - Garden Route: live says "Accommodation and meals" included; seed doesn't mention them.
  - West Coast tour (R2 900 pp on live site) is missing entirely.
  - Seed quote SLQ-2026-0041 prices "Winelands Escape" at 210 000 cents (the Peninsula price);
    My Trip shows "SLT-Q-2026-0041", a different reference format.
Why it matters: Wrong inclusions become customer disputes.
Recommended fix: Owner signs off the catalogue content; add a V3 migration.
```

```text
ID: BOOK-001
Severity: MEDIUM
Area: Booking UX / pricing display
File: apps/web/src/features/booking/BookingPage.tsx
Description: The summary panel showed the estimated TOTAL (e.g. R 4 200 for 2 guests)
  labelled "per person".
Fix applied: Shows "R 2 100 per person" plus a separate "Estimated total R 4 200"
  (hidden for CUSTOM).
```

```text
ID: BOOK-002
Severity: MEDIUM
Area: Booking
Description:
  - The frontend zod schema doesn't enforce the tour's min/max (only the HTML max attribute),
    so the user only learns about it from a server error.
  - Pricing logic is duplicated in BookingPage.tsx (estimate) and BookingService.calculateTotal.
    Acceptable as a display estimate because the server response is authoritative, but the
    two must be kept in sync, or an /quote-preview endpoint added.
  - No availability or capacity model: 30 identical bookings for the same date are accepted.
  - No idempotency key: a double submit is prevented only by the disabled button while pending.
  - The "1 Date 2 Guests 3 Details 4 Review" stepper is just a text label; there is no review step.
  - The date defaults to tomorrow, computed in the browser's local time, not SAST.
  - int cents: overflow happens at ~R21.4 million per booking. Fine for tours; use long
    for quote totals.
```

```text
ID: PLAN-001
Severity: LOW (partly fixed)
Area: Trip planner
Description: `interests: [null]` was accepted (201) and saved with ZERO interests (Hibernate
  drops null collection elements), bypassing @NotEmpty. A request with 500 interests and a
  5-year trip was also accepted.
Fix applied: @NotBlank on elements, @Size(max = 20) on lists.
Open: no maximum trip length; groupType/interests/services are free text, not the enum set
  the UI offers; the frontend doesn't check departure >= arrival.
```

---

## Security Findings

```text
ID: SEC-001
Severity: HIGH
Status: Fixed
Area: Credentials exposure
File: apps/web/src/lib/api.ts, .env.example
Description: VITE_OPERATIONS_BASIC_AUTH (base64 "user:password") is read with import.meta.env,
  and Vite inlines it into the public JS bundle. .env.example tells developers how to set it.
  Anyone who built the site with it set would ship the admin password to every visitor.
Fix applied: Only read when import.meta.env.DEV. Verified: building with the variable set
  gives 0 occurrences in dist/.
Remaining: the operations UI still has no real login (see SEC-004).
```

```text
ID: SEC-002
Severity: MEDIUM
Status: Fixed
Area: Error handling / information
Description: Any error on a public endpoint (malformed JSON, number overflow) was forwarded to
  /error, which fell into the default chain requiring authentication, so the client got
  401 with an empty body.
Evidence: POST /api/v1/bookings '{bad' → 401.
Fix applied: /error permitted; explicit HttpMessageNotReadableException and
  MethodArgumentTypeMismatchException handlers return 400 JSON. That also stops
  "No enum constant com.sltours.tours.model.TourCategory.FOO" leaking class names.
```

```text
ID: SEC-003
Severity: MEDIUM
Area: Abuse / POPIA
Description: No rate limiting, CAPTCHA or honeypot on the public POST endpoints.
  30 bookings in about 1 second all returned 201. Each stores name, email and phone.
Why it matters: Spam fills the operations queue and database with junk personal data.
Recommended fix: Per-IP rate limit at nginx (limit_req) plus a honeypot field; later bucket4j.
```

```text
ID: SEC-004
Severity: MEDIUM (HIGH before any shared deployment)
Area: Authentication
Description: One in-memory admin user from environment variables; both ADMIN and STAFF roles
  on one account; HTTP Basic; no lockout or brute-force protection; no logout; no audit.
  The default password "change-me-in-env" works if .env isn't edited, and nothing refuses
  to start with the default. The browser shows a native Basic-auth popup on /operations
  (WWW-Authenticate header), which is poor UX and hung headless screenshots.
Recommended fix: Fail startup when the password is the default outside a dev profile.
  Then a users table + form login/session or OIDC.
```

```text
ID: SEC-005
Severity: LOW
Area: Transport / headers
Description: nginx sends no CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy or
  HSTS. The legacy site had a CSP (commit f86369b). No TLS setup. Postgres port 5432 and the
  API port 8081 are published on 0.0.0.0 in the "production" compose file.
```

```text
ID: SEC-006
Severity: LOW
Area: Container hardening
Description: Both the API (eclipse-temurin JRE) and nginx run as root. The API image is
  568 MB. There's no .dockerignore (web context copies node_modules/dist, 5.3 MB). No
  healthcheck on api or web; web depends_on api without a health condition.
```

```text
ID: SEC-007
Severity: INFO
Area: CORS
Description: Verified: an unlisted origin gets no Access-Control-Allow-Origin. allowCredentials
  is true, which isn't needed for Basic auth from the same origin through nginx.
```

**Authorization / IDOR:** the only role-protected surface is `/api/v1/admin/**`, and anonymous or wrong-password requests get 401 (now covered by tests). There are no customer, guide or driver roles, so the privilege-escalation scenarios in the brief (GUIDE edits booking, customer A sees customer B) **can't be tested because those actors don't exist**. My Trip avoids IDOR only by not being connected to any data.

**Searched for:** `password|secret|token|jwt|apiKey|credential`. Only the dev defaults in `.env.example`, `application.yml` and the compose files (`sltours/sltours`, `change-me-in-env`). No real secrets are committed. `.env` is git-ignored.

---

## POPIA Engineering Notes (not legal advice)

- Bookings store name, email, phone, country and free-text notes (which may hold health or child information) with no retention policy or deletion path.
- `customers` has `email UNIQUE`, but bookings never link to it (`customer_id` is always null for new bookings), so the same person is duplicated across bookings.
- There's no consent or privacy-notice checkbox on either form.
- The seed contains real-looking phone numbers for "demo" guides (`+27 67 100 000x`). Confirm these aren't real people's numbers.
- There's no audit of staff access to customer data.

---

## Architecture Findings

- **The modular monolith shape is reasonable** (`tours`, `bookings`, `tripplanner`, `operations`, `trips`, `shared`), and not over-engineered. No accidental microservices.
- **The schema is far ahead of the code.** 11 of 20 tables (customers, guides, drivers, vehicles, assignments, quotes, quote_items, payments, trips, trip_days, itinerary_items, notifications, review_requests) have no entity. This is speculative design: it will be migrated before it's used, and in places it already conflicts with the domain:
  - `assignments` has guide_id + driver_id as separate tables, while the seed shows "Sipho Mokoena" as both a guide and a driver (two rows, two IDs). A person who is both needs one `staff_member` with roles.
  - `payments` can reference a booking *or* a quote with no CHECK that exactly one is set.
  - `quotes` has no CHECK that total = subtotal − discount + tax, and quote_items has no line_total = qty × unit check.
  - Booking vs trip: a multi-day Garden Route "booking" is one row with one `travel_date`; there's no end date.
- **The operations controller called the repository directly** (fixed; now goes through a service).
- **`CustomerTripController` and `CustomerTripResponse` live in `trips/model`.** The package is wrong.
- **Duplicated reference generator** in `BookingReferenceGenerator` and `TripPlanningService`.
- **Tour detail loads 7 lazy element collections**, so 8 queries per detail view. Acceptable at this size.
- **Mixed string lists for FAQs:** "Question? Answer." stored in one string; the UI can't separate question from answer.

## Frontend Findings

- The structure is clean and feature-oriented, and the components are small (largest 165 lines).
- `useDocumentTitle` mutates `<meta>` client-side only. There's no SSR or prerender, so crawlers without JS see the same title and description on every URL, and there's no canonical or per-page OG. That is a **real SEO regression** against the legacy static pages, which rank today. `/operations` and `/my-trip` aren't `noindex`, and `robots.txt` allows everything.
- The sitemap lists `/private-tours` and `/transfers`, which are the same list with a pre-selected filter chip (duplicate content). It doesn't list tour detail URLs.
- Any unknown route redirects to `/` (`<Navigate>`), so there are no real 404s (the legacy site added a 404 page in f86369b). Legacy URLs like `/our_tours.html` silently land on the new homepage. No redirect map.
- The `private-tours` / `transfers` filter state is `useState(focus)`, so navigating directly between them likely keeps the old filter because React reuses the same component instance at that tree position (inferred from code, not runtime-verified).
- The filter "wine" matches via haystack substring, which works, but "private" also matches "private friendly" tags.
- `TourDetailPage` itinerary splits on the first space to get the time, so "Driver confirms pickup details" shows "Driver" as a time.
- The detail hero uses the 800-ish px card image stretched full width (visibly blurry at 1440 px).
- The mobile menu has `role="dialog" aria-modal` but no focus trap, no Escape handling, and no body scroll lock.
- The filter row has `role="list"` with `<button>` children (no listitems), which is invalid ARIA.
- Form errors aren't linked to inputs (`aria-describedby`/`aria-invalid` missing). The planner shows no errors for dates or adults.
- `tsc -b` with a composite `tsconfig.node.json` emits `vite.config.js` and `vite.config.d.ts` into the source tree. They're stale-able duplicates and should be ignored or set to `noEmit`.
- `npm run lint` is just `tsc`; there's no ESLint.
- `npm audit` (including dev dependencies): 5 vulnerabilities (1 critical, 1 high) in the vitest/vite-node chain. Production dependencies are clean.

### Design
Photography is real SL Tours material, the palette is warm (orange CTA on navy), and the hero reads as Cape Town. That's good. Against the brief's "not generic SaaS" bar, though, the inner pages look template-like: uniform white cards, a "Tour discovery built for real trip decisions" headline (product-speak, not traveller-speak), and an About page that talks about "the platform… giving staff operational detail". Customer copy shouldn't describe internal software. The About page drops the owner story the legacy site added (commits 8f3e3a7 and bdd5102). There are no reviews or TripAdvisor/Google proof, which the legacy site links.

## Backend Findings
Covered above. In short: sound layering for tours and bookings; the ops layer was broken (fixed); no transition rules; unused schema; no integration tests; `mvnw` is a 2-line shim calling the system `mvn` (not the real Maven wrapper, so the pinned Maven version isn't guaranteed).

## DevOps Findings

- `docker compose up --build` from scratch: **works** (about 60 s build, API healthy in about 10 s, Flyway V1 and V2 apply).
- **`docker-compose.dev.yml` is broken for its stated purpose:** the web container's Vite proxy targets `localhost:8080`, which inside the container is the web container itself, not the API. It also maps API `8080:8080`, which conflicts with the main compose file's web port. It wasn't verified by Codex (its docs only describe the main file).
- There's no production/dev separation: the "production" compose file publishes the DB, uses default passwords, and has no TLS.
- No healthchecks for api or web, no restart policy, no log or backup setup.
- README: the local-dev instructions say Vite proxies to `localhost:8080`, which is correct only when running `mvn spring-boot:run` (8080) *and* no Docker web container holds 8080.

## Testing Findings

| Before review | After review |
|---|---|
| Frontend: 1 test (TourCard renders price + link) | unchanged |
| Backend: 3 unit tests with mocks (price calc, guest range, mapper) | +5 MockMvc security/validation tests (8 total) |
| DB/Flyway/JPA integration: none | none (see P1-TEST-1) |
| E2E: none (TESTING_GUIDE honestly lists Playwright as "next") | none |

The existing tests are meaningful but thin. `BookingServiceTest` does check the real calculation. Nothing tested the HTTP layer, security or persistence, which is exactly where OPS-001, OPS-002 and SEC-002 lived. **A single integration test against Postgres would have caught OPS-001.**

## Documentation Findings

- Accurate: the security, threat-model and deployment docs are honest about gaps.
- Inaccurate or misleading:
  - README "Seed Data … quote, and payment" suggests these features exist; they are rows only.
  - README "OpenAPI-ready … operations UI": the ops UI can't show bookings (before the fix) and has 12 dead nav links.
  - README "Swagger UI: http://localhost:8081/swagger-ui" works (302 → UI). OpenAPI lists all 8 paths, including the fake `/my-trip/current`.
  - `docs/development/CLAUDE_CAPABILITIES.md` is a Codex capability list, mislabelled.
  - The dev compose file is undocumented and broken.
  - README (previously describing the live static site) was **rewritten** to describe the new platform while the static site is still what's deployed via GitHub Pages (`.github/workflows/jekyll-gh-pages.yml`). Anyone reading the README now gets the wrong idea of what's live.

---

## Fixed During Review

| Finding | Change | Verification |
|---|---|---|
| OPS-001, OPS-002 | `operations/service/OperationsService.java` (new, transactional); controller delegates; `@EntityGraph("tour")` on list queries | Runtime: list 500 → 200; PATCH 500 → 200; missing ref → 404 |
| OPS-006 | "Today" computed in Africa/Johannesburg | Code review |
| SEC-001 | `api.ts` reads the ops credential only in `import.meta.env.DEV` | Built with the variable set → 0 matches in `dist/` |
| SEC-002 | `/error` permitted; 400 handlers for unreadable body and type mismatch | Runtime: `{bad` 401 → 400; `ApiSecurityTest` |
| PLAN-001 (partial) | `@NotBlank` elements, `@Size(max=20)` lists | `ApiSecurityTest.tripPlannerRejectsBlankListItems` |
| BOOK-001 | Booking panel shows unit price and a separate estimated total | typecheck + visual |
| Tests | `apps/api/src/test/java/com/sltours/config/ApiSecurityTest.java` (5 tests: anonymous/wrong password 401, staff 200, public catalogue open, malformed → 400, planner blanks rejected) | `mvn test`: 8/8 pass |

Regression after the fixes: `tsc -b` ✅, `vitest` 1/1 ✅, `vite build` ✅, `mvn test` 8/8 ✅, `docker compose up --build` ✅, re-probed endpoints ✅.

## Remaining Work
See [REMEDIATION_PLAN.md](REMEDIATION_PLAN.md).

---

## Production Readiness

| Area | Classification | Why |
|---|---|---|
| Tour catalogue (read) | Verified with concerns | Works end to end from the DB; content contradicts the live site (BIZ-002); SEO weaker than legacy |
| Booking request | Verified with concerns | Server-priced and validated; wrong minimum group size (BIZ-001), no rate limit, no availability, no customer notification (nobody is emailed, so staff must poll) |
| Plan My Trip | Verified with concerns | Persists; weak value constraints; no notification to staff |
| Operations | Needs work | Now loads; fake counts, no assignments, no transitions, 12 dead nav links, no real login |
| My Trip | Blocking production | Hard-coded fake shown to real customers |
| Quotes / payments / guides / drivers / vehicles / notifications | Not implemented | Tables only |
| Authentication / authorization | Blocking production | One env-var Basic-auth user; no customer auth; default password accepted |
| Database | Verified with concerns | Migrations clean; missing integrity checks on quotes/payments; speculative tables |
| DevOps | Needs work | Compose works locally; no TLS, root containers, DB port exposed, dev compose broken |
| Tests | Needs work | 9 tests total, no integration or E2E tests |
| Documentation | Verified with concerns | Mostly honest; README now misdescribes what's live |
| Accessibility | Needs work | Basics present (skip link, labels, alt); modal, focus and error linking missing |

**Bottom line:** keep the legacy static site live. The new platform is a reasonable foundation for tours and booking requests, but it shouldn't replace the live site until the P0/P1 items are done and the owner has approved the tour content.
