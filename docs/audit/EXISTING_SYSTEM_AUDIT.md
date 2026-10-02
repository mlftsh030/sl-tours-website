# Existing System Audit

## 1. Existing Architecture

The original project is a static HTML/CSS/JavaScript website deployed like a GitHub Pages site. It has flat root HTML pages, legacy theme/plugin assets, jQuery, and uploaded image folders. There was no backend, database, package manager, build pipeline, formal tests, Docker environment, or API.

## 2. Existing Pages

- `index.html`: homepage with slider, featured tours, structured data, and contact/social links.
- `our_tours.html`: tour listing and pricing with external ActivityBridge booking links and a WhatsApp private tour popup.
- `about-us.html`: business positioning and service descriptions.
- `gallery.html`: photo gallery.
- `contact.html`: contact details and EmailJS/WhatsApp form behavior.
- `404.html`: static not found page.
- `private.html`: empty placeholder.

## 3. Existing Features

- Static tour catalogue and prices.
- Phone, email, WhatsApp, social, and Google review links.
- SEO metadata and some JSON-LD on the homepage.
- Responsive legacy theme behavior.
- Existing image assets for Cape Point, Winelands, City, Township, Garden Route, Airport Transfer, Safari, private tours, and brand logo.

## 4. Existing Components

The site uses copied theme sections rather than reusable application components. Navigation, footer, top bar, and contact content are duplicated across pages.

## 5. Existing Strengths

- Real business identity and contact details.
- Useful Cape Town tourism imagery.
- Search-oriented page titles/descriptions.
- Existing prices and tour names that can seed the database.
- Low operational complexity for static hosting.

## 6. Existing Weaknesses

- Pricing and tour details are hardcoded in multiple pages.
- No booking domain, customer records, trip portal, staff operations, or database source of truth.
- Large legacy plugin surface for simple site behavior.
- No automated tests or local reproducible environment.
- Inline scripts and style-heavy markup make maintenance difficult.

## 7. Technical Debt

- Duplicated headers, footers, social links, contact links, and scripts.
- Legacy jQuery/theme plugins are not aligned with a modern typed application.
- `private.html` is empty.
- Some assets have mismatched extensions or empty files, such as `upload/search-bg-top.jpg`.

## 8. Security Concerns

- `contact.html` embeds an EmailJS public key and third-party script directly.
- Inline scripts require unsafe CSP choices.
- External booking links move conversion outside SL Tours control.
- No server-side validation or rate limiting.
- No authentication, role model, or ownership checks.

## 9. UX Concerns

- The site is visually dated and theme-driven.
- Booking actions are inconsistent between external booking, popup, and WhatsApp.
- Visitors cannot progress through a clear date/guest/details/review journey.
- Staff have no operational dashboard.

## 10. Mobile Concerns

- Mobile navigation is inherited from a legacy theme.
- Tables/cards and large hero text risk cramped experiences.
- Contact and booking actions are not presented as a single streamlined mobile workflow.

## 11. Accessibility Concerns

- Heavy icon usage lacks consistent accessible names.
- Inline visual styling makes contrast/focus auditing harder.
- Repeated navigation and popup behavior need keyboard review.

## 12. SEO Concerns

- Existing metadata is useful but URL structure uses `.html` pages.
- Tour detail pages do not have clean individual routes.
- Sitemap/robots were not part of an application build.

## 13. Recommended Reusable Code

- Reuse contact details, social links, SEO copy, brand name, logo, and high-quality tour images.
- Reuse existing tour names and baseline prices as seed data.

## 14. Recommended Code To Replace

- Replace duplicated page markup, jQuery plugins, inline scripts, EmailJS integration, external booking links, and hardcoded pricing.

## 15. Migration Risks

- Existing indexed URLs need redirects from `.html` routes to the new routes.
- External ActivityBridge links may still be business-critical until the new booking flow is production-approved.
- Image licensing/source should be confirmed before long-term commercial use.
- Contact form delivery must be moved to a production email/notification provider before launch.
