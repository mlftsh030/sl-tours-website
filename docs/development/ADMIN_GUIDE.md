# Administration and customer accounts

## Open administration

With `docker compose up -d --build`, open http://localhost:8080/operations. You will be sent to the staff sign-in screen. Use `SLTOURS_ADMIN_USERNAME` and `SLTOURS_ADMIN_PASSWORD` from your local `.env`.

The example account is `admin@sltours.local` / `change-me-in-env`, allowed only with the `dev` profile. Docker Compose defaults to local development with HTTP session cookies. No credentials are embedded in frontend bundles. HTTP Basic and `VITE_OPERATIONS_BASIC_AUTH` are no longer supported.

The bootstrap administrator is stored in `user_accounts` with a BCrypt hash. Its password is synchronized from the configured environment secret at API startup. Public registration always creates a `CUSTOMER` account and cannot grant staff privileges.

## Tour catalogue

- Open **Tours & prices**, then **Add tour** or **Edit tour**.
- Prices are entered in ZAR and stored as integer cents. Set per-person, per-trip, or custom-quote pricing.
- New tours default to **Draft**. **Active** tours appear in the public catalogue and accept bookings. **Archived** tours are hidden while existing bookings remain available to staff.
- Set the tour description, category, duration, guest limits, featured flag, display order, SEO text, and itinerary/inclusion lists.
- Image paths must refer to existing raster assets under `/assets/`. Uploads and external image URLs are not enabled.
- Changed prices apply to new requests. Existing bookings retain their original total.
- Another administrator's intervening save produces HTTP 409. Reload the list, reopen the editor, and apply the intended change to the current version.

## Bookings and customers

**Bookings** provides a paginated list, status filters, and a review panel with contact information, pickup details, notes, and totals. Staff can advance a status or cancel a booking. Terminal bookings cannot be reopened; cancelled/completed bookings may be marked refunded. A refund status is an operational record, not a payment-provider refund.

**Customers** shows guest contacts and registered customer accounts, booking totals, last sign-in, and active sessions on this API instance. An active session indicates an unexpired server session, not that the browser tab is currently open. Closing a tab does not log out; sessions expire after 30 minutes without user activity (`SLTOURS_IDLE_TIMEOUT`). Background refreshes, such as this list's 30-second refresh, do not count as activity, so an unattended screen is signed out.

Customer contact summaries group booking contact email addresses for staff convenience; that grouping never grants a customer access to those bookings. Emails on guest requests are unverified.

## Enquiries inbox

**Enquiries** lists every website enquiry: contact form messages, trip planner requests and private-trip quote requests. Search by name, email, phone, reference or message text, and filter by status or source.

- Open an enquiry to see contact details, the requested tour or private trip, date, pickup, passengers and the message.
- Statuses: New → In progress ⇄ Awaiting customer → Converted to booking, or Closed. Closed enquiries can be reopened; converted enquiries are final.
- Internal notes are append-only, show the author and time, and are never shown to customers or drivers. Adding a note moves a new enquiry to In progress.
- **Convert to booking** copies the customer's name, email and phone. Tour enquiries become tour booking requests at the current catalogue price. Private-trip enquiries become private-trip booking requests priced from the vehicle's live rate, or a manual total you enter; confirm them from **Bookings**.
- Customers only see a confirmation after the enquiry is stored. Retries of the same submission return the same reference instead of creating duplicates.

## Vehicles, restrictions and photos

**Vehicles** (staff can view; administrators edit):

- *Operational status* (Active, Out of service, Retired), *website listing* (Listed, Hidden) and bookings are independent. A listed vehicle is offered to customers only while it is operational, has no open restriction, seats the group and is free for the whole trip plus turnaround.
- *Restrictions*: staff and administrators can open a **Maintenance** or **Safety** restriction. Inspections open them automatically (safety defects at collection or return; any defect at return). An open restriction blocks collection, website availability and new assignments.
- Only an administrator can **clear** a restriction, with a note of at least 10 characters describing the repair or check. This is audited. Approving an inspection never clears a restriction.
- Photos uploaded here are public and appear on the website card; add alternative text for each. Never upload documents or registration close-ups.
- *Notes for the assigned driver* are shown to the driver on their assignment; *internal fleet notes* are never shown outside administration.

## Drivers and verification (administrators)

- **Add driver** creates the driver profile and a DRIVER sign-in with an initial password you give to the driver in person. Existing driver records without a sign-in can be given one from the driver screen. Disabling a sign-in ends the driver's active sessions.
- Upload licence, PrDP and identity documents (PDF or photo). Documents are private to administrators. Accept or reject each one; rejections need a note.
- **Verified** requires a licence number, licence and PrDP expiry dates in the future, and accepted licence and PrDP documents. Changing licence details returns the driver to Pending.
- A driver is eligible for a trip only if active, signed-in account enabled, verified, and both licence and PrDP valid on the trip date. Eligibility is checked again at assignment, collection and release.

## Trips & inspections

- **Awaiting review** lists submitted inspections; safety defects are highlighted.
- Open an assignment to compare collection and return side by side: odometer, fuel, checklist, photos and the collection selfie, plus distance travelled and *newly reported defects*.
- Collection approval policy: `SLTOURS_COLLECTION_APPROVAL_REQUIRED` (default `true`). When true, a collection without safety defects waits here and **Approve & release vehicle** releases it. When false, it is released immediately and stays listed for review. Safety defects are never released.
- Approval is blocked while the vehicle has an open restriction, the vehicle is out of service, or the driver is no longer eligible.
- **Reject** (with a note) asks the driver to redo the inspection. A released collection cannot be rejected; open a restriction instead.
- Approving a return closes the assignment. Any restriction opened by the return stays open until cleared from **Vehicles**.
- Change an assignment's vehicle or driver, or cancel it, while the vehicle has not been released. Changing either supersedes (rejects) the pending collection inspection.

## Private trips

- Customers request hourly private trips at `/book-private-trip`. A request appears in **Bookings** as type *Private trip*, status *Enquiry*, with the exact price breakdown it was quoted.
- **Confirm booking** (administrators) picks a vehicle and an eligible driver. Availability, restrictions and eligibility are checked again, and the database refuses overlapping vehicle or driver assignments even if two administrators confirm at the same moment. Private trips cannot be confirmed through the plain status dropdown.
- Tour bookings get a vehicle and driver with **Assign vehicle & driver** on the booking.
- Cancelling or refunding a booking cancels its assignments that have not been released. A vehicle that is out must be returned first.

## Private-trip rates (administrators edit)

- Base price = hourly rate × billable hours. Billable time is the requested time, raised to the minimum and rounded up to the billing increment (default whole hours).
- Category rates seeded by the migration are **samples** for development and are never shown as live prices in production. Saving a rate makes it live. A vehicle-specific rate overrides its category. A blank rate means "priced on request".
- Rules: turnaround minutes (default 60) between trips for vehicles and drivers, rounding increment, optional overtime rate, optional included distance with an excess-km rate. Unset rules are disclosed as "by arrangement".
- Additional fees (once per trip or per billable hour) are listed to customers before they submit and included in the backend total.
- Changes apply to new requests only; submitted requests keep their stored quote.

## Website images (administrators)

- **Homepage slider**: the built-in slides stay live until you activate at least one uploaded image. Active images replace the slider, in order, with optional headline text.
- **Gallery**: active uploads appear first; all existing gallery photos remain.
- Uploads start hidden. Alternative text is required.

## Customer accounts

Customers can register at `/register`, sign in at `/login`, and view their bookings at `/account`. The **My Trip** link opens this account page.

A booking made during an authenticated customer session is linked to that account's UUID, using the account's name and email from the server. A guest cannot claim an existing account by typing its email. Customer history queries use the authenticated account ID, never an ID or email supplied by the browser. Earlier guest bookings are not automatically attached to a new account.

## Local development

For a separately launched API, enable local HTTP explicitly:

```bash
SPRING_PROFILES_ACTIVE=dev SESSION_COOKIE_SECURE=false npm run api:run
npm run web:dev
```

Configure PostgreSQL datasource variables for that API process. Vite defaults to an API at `http://localhost:8080`; override `API_PROXY_TARGET` when needed. The development Docker configuration uses `http://api:8080` from its web container.

## Deployment boundary

For a shared or production deployment, set `SPRING_PROFILES_ACTIVE=production`, `SESSION_COOKIE_SECURE=true`, and strong administrator/database secrets. Terminate HTTPS at a trusted edge; expose the API only to trusted proxies. Nginx overwrites client forwarding headers, and the Docker API debug port binds to loopback.

Authentication has CSRF protection, HttpOnly/SameSite session cookies, session-ID rotation, server-side logout, BCrypt hashing, per-process and Nginx sign-in limits, and role checks. Tour/status changes create audit events in the same database transaction. Private HTML responses have a restrictive CSP and no-store caching. Public-to-private links perform document navigation to isolate public translation scripts.

Before a broader commercial account rollout, integrate verified email, password recovery, and MFA/SSO for staff. Horizontal deployments need shared session storage and shared rate limits; the local session registry and application limiter are instance-local. Configure deployment-specific HTTPS, backup, retention, and monitoring policies. Payment-provider and email integrations are separate from these workflows.

## Driver portal

Drivers sign in at `/login` and land on `/driver`. See [Driver Guide](DRIVER_GUIDE.md).

## Verification

```bash
npm run web:build
npm run web:test
mvn -f apps/api/pom.xml test
docker compose up -d --build api web
```

Automated checks cover CSRF on login/logout/writes, role permissions, session creation/invalidation, pagination validation, password hashing and Unicode length limits, customer ownership, safe image paths, stale updates, booking prices, and status transitions. Browser smoke checks were also run against Docker/PostgreSQL for draft creation, publishing, price changes, customer registration/history, booking review, active sessions, logout, and mobile layout. Temporary smoke records were removed afterward.
