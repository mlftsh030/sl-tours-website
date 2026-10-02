# Remediation Plan

Review date: 2026-09-30. Finding IDs refer to [CODEX_IMPLEMENTATION_AUDIT.md](CODEX_IMPLEMENTATION_AUDIT.md).

## Done during review

| ID | Fix | Verified by |
|---|---|---|
| OPS-001 / OPS-002 | Transactional `OperationsService`, `@EntityGraph` | Runtime 200s; DB state matches the response |
| SEC-001 | Ops credential only read in dev builds | `dist/` grep = 0 |
| SEC-002 | `/error` permitted; 400 handlers | `ApiSecurityTest`, runtime curl |
| PLAN-001 (partial) | List element validation | `ApiSecurityTest` |
| BOOK-001 | Unit price vs estimated total | Visual/typecheck |
| OPS-006 | SAST "today" | Code |
| BIZ-001 / BIZ-002 | `V3__align_catalogue_with_live_site.sql` uses the live `our_tours.html` as the source: 5-guest minimums, inclusions/exclusions, durations, West Coast tour, corrected seed quote. `V4__tour_display_order.sql` restores the live homepage order | 1-guest Cape Point booking → 400; API returns the live inclusions |

---

## P0: Must fix before anyone outside the team sees it

| Issue | Files | Solution | Depends on | Verify |
|---|---|---|---|---|
| TRIP-001 fake My Trip shown to customers | `CustomerTripController.java`, `AppLayout.tsx`, `BookingPage.tsx`, `App.tsx` | Remove the nav link, CTA and route (or put them behind a feature flag) until a real portal exists; delete the hard-coded endpoint | — | `/my-trip` not linked; `GET /api/v1/my-trip/current` → 404 |
| Live-site self-contradictions | homepage slider, `V3` card note | Owner decides: the slider promises lunch on City tours and the old homepage card promised lunch on Cape Point, but `our_tours.html` lists neither. Kept the slider copy verbatim; the Cape Point card follows `our_tours.html` | **Owner decision** | Copy review |
| SEC-004 default admin password accepted | `SecurityConfig.java` | Fail startup if the password is `change-me-in-env` unless a `dev` profile is active | — | Startup test |
| OPS-004 invented dashboard numbers | `OperationsService.java`, `OperationsPage.tsx` | Remove the literal 3/4 and "Unassigned", or back them with real queries | — | Numbers match `SELECT count(*)` |

## P1: Must fix before production

| Issue | Files | Solution | Depends on | Verify |
|---|---|---|---|---|
| P1-TEST-1 no persistence tests | `pom.xml`, `src/test` | Add Testcontainers Postgres; `@SpringBootTest` covering Flyway + booking create + ops list/patch | Docker in CI | Test fails if OPS-001 is reintroduced |
| OPS-003 no status transitions or audit | bookings module, V3 migration | Transition map + `booking_status_history` (actor, from, to, reason) | Auth user identity | Illegal transition → 409 |
| SEC-003 spam / no rate limit | `nginx.conf`, forms | `limit_req` on `POST /api/`; honeypot field | — | 31st request/min → 429 |
| SEC-004 real staff auth | security | Users table + form login/session (or OIDC); remove Basic popup; lockout | — | Auth tests |
| Notifications | new module | Email staff and customer on booking/planner submit; otherwise requests go unnoticed | Email provider | Mail sent in test with a fake SMTP server |
| SEO parity with legacy | web | Prerender/SSG public routes (e.g. vite-plugin-ssr or static prerender), per-page canonical/OG, real 404, `noindex` on `/operations` and `/my-trip`, legacy `.html` → new URL redirects | — | `curl` shows the per-page `<title>` without JS |
| Deployment hardening | compose, Dockerfiles, nginx | Non-root users, `.dockerignore`, healthchecks, stop publishing 5432/8081, security headers + CSP, TLS at the proxy | Hosting choice | `docker inspect`, header check |
| BOOK-002 availability/idempotency | bookings | Capacity per tour/date; idempotency key header | Business rules | Duplicate submit → the same booking |
| POPIA basics | forms, API | Privacy notice + consent, retention job, deletion path | Owner/legal input | — |
| README truth | `README.md` | State clearly that the legacy static site is what's deployed; label the platform as in development | — | Review |

## P2: Important engineering improvements

- Fix or delete `docker-compose.dev.yml` (the Vite proxy must target `http://api:8080`, and the port collides with the main compose file).
- Replace the `mvnw` shim with the real Maven wrapper.
- Frontend zod: enforce the tour's min/max guests; planner departure ≥ arrival; link errors with `aria-describedby`.
- Mobile menu: focus trap, Escape to close, scroll lock. Fix `role="list"` on the filter row.
- Structure FAQs as question/answer and itinerary items as time/text in the schema, not parsed strings.
- Merge the duplicated reference generators into `shared`.
- Move `CustomerTripController` out of `trips/model`.
- Reconsider the speculative tables before building on them: one `staff_member` with guide/driver roles; CHECK constraints on quotes/payments; a booking end date for multi-day tours.
- Add ESLint; ignore the emitted `vite.config.js`/`.d.ts` (set `noEmit` on the node tsconfig).
- Upgrade vitest to clear the dev-only critical/high audit findings.
- Playwright: visitor → tour → booking confirmation; planner submit; ops login → bookings.

## P3: Polish

- Higher-resolution detail hero images; `srcset`.
- Customer-facing copy: remove internal "platform"/"staff workflows" language from About/Experiences; restore the owner story and review links (TripAdvisor/Google) from the legacy site.
- A real multi-step booking with a review step, or drop the "1 Date 2 Guests…" label.
- Responsive checks at 320/768/1024 px.
