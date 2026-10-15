# SL Tours: the original tourism website

A static website built for **SL Tours**, a Cape Town tourism business, as part of my work through **Tlokwa Digital
Solutions**. It gives visitors a place to explore tours, understand the business and start an enquiry.

This was the first stage of a longer client relationship that later led to a separate booking and operations platform.

[SL Tours website](https://sl-tours.com/) · [Booking and operations platform repository](https://github.com/mlftsh030/SL-Tours-management-system)

## How the work started

My work with SL Tours began in **November 2024**, when the business had no online presence. The first need was to help
people find the business, see what it offered and get in touch. I worked on its website, SEO and Google Business
Profile as part of establishing that presence.

The website needed to make sense to someone planning a trip to Cape Town. Visitors needed clear tour information,
photographs, service details and a direct way to ask questions. The aim was to support the way SL Tours already worked,
including conversations through WhatsApp and bookings through an external provider.

The client relationship started in November 2024. The original development repository's earliest static-site commit
is from December 2024. This repository presents the static website separately from the later application.

## What this repository contains

| Area | Implementation |
|---|---|
| Home | Introduction to SL Tours, tour highlights, imagery and review links |
| About | Business information and service context |
| Tours | Tour descriptions, displayed prices and links to ActivityBridge booking pages |
| Private trips | Information for visitors interested in private travel |
| Gallery | Images presenting the tourism experience |
| Contact | Contact details and a form that prepares a WhatsApp enquiry |
| Shared interactions | Mobile navigation, sliders, language selection and currency conversion scripts |

The enquiry form collects the visitor's details and opens WhatsApp with a prepared message. **The visitor still needs
to send it.** Despite the function name `sendEmail`, the current [contact form code](contact.html) does not send email
or save the enquiry to an application database.

## My contribution

I took responsibility for understanding the client's needs, adapting the website's layout and content, integrating the
contact and booking routes, adding search metadata, and deploying and maintaining the site.

The implementation uses an existing **Travel Tour/GoodLayers template and plugin assets**. My contribution was adapting
and integrating them for SL Tours, together with project-specific content, styling and scripts. The underlying theme,
jQuery and third-party plugins are not my original work.

Work on the Google Business Profile formed part of the wider client engagement. The repository contains Google review
links and a Search Console verification tag; it does not independently record every profile-management activity or
prove an improvement in search rankings.

## Technical decisions

| Decision | Why it suited this stage | Trade-off |
|---|---|---|
| Static HTML, CSS and JavaScript | The initial need was to present the business and help visitors make contact without operating an application server | Tour details, prices and repeated layouts need manual updates |
| Adapt an existing tourism template | Provided established page layouts and tourism-focused visual components to customise for the client | Inherited markup, styles and plugins increase maintenance work |
| WhatsApp enquiries | Let visitors begin a conversation through a channel the business used | No shared enquiry inbox, delivery confirmation or structured follow-up record in this site |
| External booking links | Kept the website separate from the booking provider's workflow | Booking availability and completion depend on the external service |
| Static hosting | A small deployment surface without a custom backend or database | Staff cannot update content through an administration portal |
| HTML search metadata | Makes page descriptions, canonical addresses and social previews available in the initial document | Search performance still depends on content, indexing and factors outside the code |

### Technology used

- HTML and CSS, including Travel Tour/GoodLayers styles.
- JavaScript, jQuery and bundled interface plugins.
- Project scripts for language selection, currency conversion and tour interactions.
- External services for booking, reviews, translation and exchange-rate data.
- A GitHub Actions workflow configured to build with Jekyll and publish to GitHub Pages.

There is no Node build process, Java backend or application database in this repository. The presence of a publishing
workflow does not establish which revision is currently served on the client domain.

## Search visibility and customer trust

The [homepage](index.html) includes:

- A page title and description focused on Cape Town tours and transfers.
- A canonical link using the correct domain, `https://sl-tours.com/`.
- Open Graph metadata for link previews.
- JSON-LD structured data.
- A Google Search Console verification tag.
- Google review and TripAdvisor links, alongside a third-party reviews widget.

These are implementation details, not evidence of ranking gains, verified review totals or increased bookings. This
README does not claim measured traffic, revenue or conversion improvements.

## Project structure

| Path | Purpose |
|---|---|
| [index.html](index.html) | Homepage |
| [about-us.html](about-us.html) | About page |
| [our_tours.html](our_tours.html) | Tour catalogue and booking links |
| [private.html](private.html) | Private-trip page |
| [gallery.html](gallery.html) | Gallery |
| [contact.html](contact.html) | Contact page and WhatsApp form |
| [404.html](404.html) | Static missing-page document; actual HTTP status depends on hosting |
| [css/](css/) | Shared and customised styles |
| [js/](js/) | Browser scripts and jQuery |
| [plugins/](plugins/) | Bundled theme and interface plugins |
| [images/](images/) and [upload/](upload/) | Static image assets; `upload/` is not a runtime upload service |
| [Publishing workflow](.github/workflows/jekyll-gh-pages.yml) | Jekyll build and GitHub Pages deployment configuration |

## Preview locally

Requires Python 3. Run this from the repository root:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open [http://localhost:8000](http://localhost:8000). Stop the server with `Ctrl+C`.

This serves the static files only. External widgets need their services to be reachable. Booking and WhatsApp links
point to real services, so use them carefully during review and avoid sending test enquiries to the client.

## Checks before publishing

This repository does not include an automated application test suite. The GitHub Pages workflow builds and publishes
the site; it does not verify enquiry delivery, accessibility or a completed booking.

For a website release, check:

1. Navigation, tour information and contact details on desktop and phone layouts.
2. Tour prices and booking destinations against the client's approved information.
3. Keyboard navigation, form labels, readable text and image alternatives.
4. WhatsApp message preparation without sending an unsolicited test message.
5. Titles, descriptions, canonical addresses and social previews on the pages being changed.
6. Image loading and third-party behaviour when scripts fail or are blocked.
7. The deployed page and missing-page HTTP status after publishing.

These are review steps, not a claim that every check has passed for this snapshot.

## Limits and the next stage

This website presents information and connects visitors to external services. It does not manage customer accounts,
invoices, fleet assignments, driver inspections or referral commissions. Changes to tours and prices require editing
the static files, and conversations need to be followed up outside the website.

As I continued working with Mr Liso, the discussions moved into those daily operations. Preparing invoices by hand was
repetitive, and referrals needed a clearer record. That feedback led to the separate
[SL Tours management system](https://github.com/mlftsh030/SL-Tours-management-system), built with React, Java/Spring Boot
and PostgreSQL.

The two repositories show different stages of the same client relationship: establishing an online presence, then
building software around the work behind it. The management platform's features are not part of this static site.

## What I learned

The website gave me experience turning client conversations into a usable public site, working with an existing
template and maintaining information across several pages. It also showed me where a static site stops helping:
customers can find the business, but the enquiries and operational work still need to be managed afterwards.

That distinction shaped the next project and how I want to grow Tlokwa Digital Solutions: understand the client's work,
start with what they need, and let later requirements come from that relationship.

## Attribution

Client website work by **[Tshidiso Molefe](https://github.com/mlftsh030)** through Tlokwa Digital Solutions for SL Tours.
Theme, plugin, font and image rights remain with their respective owners. Public access to this repository should not
be treated as permission to reuse the client's branding or third-party assets.
