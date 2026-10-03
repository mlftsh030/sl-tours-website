# Cape Town Planning Assistant

An optional chat on the Explore pages and the day planner ("Ask our Cape Town assistant"). It helps a visitor describe their
day, then explains options calculated by the existing planner. The day planner remains fully usable without it.

## Status and fallback

| `SLTOURS_ASSISTANT_PROVIDER` | Behaviour |
|---|---|
| `none` (default) | Chat disabled. The button is hidden; visitors use the day planner. |
| `anthropic` | Live chat, **only** when credentials and all four spending controls are set. Otherwise it stays disabled and the API logs why. |
| `mock` | Development mock with scripted keyword rules, labelled "Development mock" in the panel. Refused at startup outside the `dev`/`test` profiles. |

When the provider fails, times out, or a limit is reached, the visitor sees a short message, the options already calculated,
and a link to the day planner pre-filled with the details collected so far.

## Configuration required for live chat

| Variable | Purpose |
|---|---|
| `SLTOURS_ASSISTANT_PROVIDER=anthropic` | Enable the Anthropic adapter. |
| `SLTOURS_ASSISTANT_API_KEY` | Server-side API key (never sent to the browser). Store it in the hosting platform's secrets. |
| `SLTOURS_ASSISTANT_MODEL` | Model id (default `claude-sonnet-5-5`). |
| `SLTOURS_ASSISTANT_INPUT_USD_PER_MTOK`, `SLTOURS_ASSISTANT_OUTPUT_USD_PER_MTOK` | Token prices for the chosen model, from the provider's current price list. Not built in, so they cannot go stale silently. |
| `SLTOURS_ASSISTANT_DAILY_LIMIT_USD`, `SLTOURS_ASSISTANT_MONTHLY_LIMIT_USD` | Spending caps (business decision). |

Optional limits (defaults in brackets): request timeout (20 s), whole-turn timeout (45 s), output tokens per reply (900), tool
rounds per turn (6), message length (1000 characters), turns per conversation (20), messages per session per hour (30), per
network address per hour (60), active conversations (500), idle timeout (30 min), model requests per day (2000). See
`apps/api/src/main/resources/application.yml` (`sltours.assistant`).

Spending is checked before every model request using daily aggregate counters (`assistant_usage_days`). A single in-flight
request can take spending slightly past a cap; the next request is refused. Also set a spend limit in the provider console.

## How answers stay grounded

- **Backend does the work.** Prices, eligibility, opening hours, routing, budget verdicts and SL Tours vehicle availability
  come from `ItineraryService`. The model only chooses which approved tool to call and explains the result.
- **Approved tools only:** `update_trip_details`, `search_activities`, `get_activity`, `plan_options`, `swap_activity`,
  `offer_enquiry`. They read published catalogue views and the planner; none can reach bookings, drivers, vehicles,
  inspections, admin notes or other customers. All tool inputs are validated on the server.
- **Untrusted text.** Visitor messages and catalogue text are treated as data. Tool results say so, and the system prompt tells
  the model to ignore instructions inside them.
- **Reply checks** (`ReplyGuard`). Before a reply is shown, every rand amount and clock time in it must appear in structured
  tool results or in the visitor's own details. Free-text catalogue fields (summaries, notes, questions) do not count, so a
  planted figure cannot be laundered through them. Discount wording not present in the catalogue's structured fields, and
  claims of bookings, availability or a sent enquiry, also fail. A failing reply is replaced with a description built from the
  planner's results, and the replacement is counted (`replies_replaced`).
- **Plans are rendered from planner data.** Option cards show the planner's own cost lines with labels (published price,
  assumption, estimate, not verified, not included), sources and check dates, whatever the model writes.
- **Enquiries need confirmation.** The model can only open a form. The plan reaches the enquiries inbox (source
  "Planning assistant") only when the visitor fills it in and ticks the confirmation. The enquiry text is generated from the
  planner result, not from the model's wording, and states that nothing is booked.

## Retention and training

- Conversations are held **in memory only**, bound to the visitor's session, and deleted when the visitor closes the panel,
  after the idle timeout, or on restart. Message content is never written to the database or to logs.
- The database stores only daily aggregates (requests, tokens, cost, replaced replies, provider failures).
- A plan the visitor chooses to send becomes an ordinary enquiry and follows the enquiry retention policy.
- SL Tours does not use conversations for training. The provider receives the conversation to generate replies. Under
  Anthropic's commercial API terms, inputs and outputs are not used for model training by default. Confirm the account's
  data-retention settings (and any zero-data-retention arrangement) before going live, and update the privacy notice.

## Limits of this implementation

- In-memory conversations and per-process rate limits suit one API instance. Scaling out needs a shared store and edge rate limiting.
- The development mock is keyword-based. It validates the integration (tool loop, limits, checks, enquiry flow), not
  language quality. Off-topic and injection handling by a live model depends on the system prompt and must be evaluated with
  real credentials before launch.
- The reply checks cover figures, times, discounts and commitments. They cannot detect every wrong statement (for example a
  misdescribed activity), which is why plans are always shown from planner data.
