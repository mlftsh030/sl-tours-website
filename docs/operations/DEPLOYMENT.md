# Deployment

## Recommended Shape

- Serve `apps/web` build through Nginx or a static hosting platform.
- Run `apps/api` as a single Spring Boot service.
- Use managed PostgreSQL for production.
- Run Flyway migrations during API deployment.
- Store secrets in the hosting platform, not in Git.

## Database prerequisites for V9

Migration V9 adds PostgreSQL exclusion constraints that prevent double-booking vehicles and drivers. They need the
`btree_gist` extension. Before the first deployment that includes V9:

1. **Check availability** on the target server:
   `select name, default_version, installed_version from pg_available_extensions where name = 'btree_gist';`
   No row means the extension is not installed on that server (managed providers: check their supported-extensions list).
2. **Check permission** for the role Flyway uses. Either that role has `CREATE` on the database (e.g. it owns the
   database), or an administrator runs `create extension if not exists btree_gist;` in the application database
   beforehand. The migration's `if not exists` then succeeds without needing the privilege.
3. **Check for overlapping legacy assignments**, which would stop the constraint from being created. Earlier versions had
   no way to create assignments, so only rows inserted by hand could conflict:

   ```sql
   select a.id, b.id from assignments a join assignments b on a.id < b.id
    join bookings ba on ba.id = a.booking_id join bookings bb on bb.id = b.booking_id
   where a.status <> 'CANCELLED' and b.status <> 'CANCELLED' and ba.travel_date = bb.travel_date
     and (a.vehicle_id = b.vehicle_id or a.driver_id = b.driver_id);
   ```
   Resolve any rows returned before migrating.

## Production configuration

- Run with `SPRING_PROFILES_ACTIVE=production` and `SESSION_COOKIE_SECURE=true` behind HTTPS.
- The API refuses to start if the `dev`/`test` profile is combined with `production`/`prod`, or if
  `sltours.pricing.allow-sample-rates` is enabled outside `dev`/`test`. Demo driver sign-ins exist only in the `dev` profile.
- `docker-compose.yml` defaults to the `dev` profile for local use; set the variables above for any shared deployment.
- Mount the `media-data` volume and back it up with the database ([Media Storage](MEDIA_STORAGE.md)).
- Migration V2 (from before this work) inserts demo catalogue/booking/driver/vehicle rows in every environment. Review or
  remove them for production; they include no sign-in accounts, and the demo vehicles stay hidden from the website.

## Required Production Work

- Configure HTTPS and secure headers.
- Configure real CORS origins.
- Add backup/restore process for PostgreSQL.
- Add structured log aggregation.
- Add error monitoring.
- Add rate limiting and WAF/reverse proxy protections.

## Current Local Deployment

`docker compose up --build` starts web, API, and PostgreSQL locally.
