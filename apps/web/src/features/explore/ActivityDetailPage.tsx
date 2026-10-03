import { AssistantLauncher } from "../assistant/AssistantLauncher";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Clock, CloudSun, ExternalLink, HelpCircle, MapPin, ShieldCheck } from "lucide-react";
import { ErrorState, LoadingState } from "../../components/StateBlocks";
import { formatAmount } from "../../lib/format";
import { useDocumentTitle } from "../../lib/useDocumentTitle";
import { getActivity, listActivities } from "./exploreApi";
import { ActivityCardView } from "./ActivityCardView";
import { categoryIcons } from "./categoryVisuals";
import { categoryLabels, dayList, hhmm, minutesLabel, monthDay, priceStatusText, residencyLabels, shortDate } from "./exploreLabels";
import type { ActivityPage, PublicPrice } from "../../types/api";

const unitLabel = { PER_PERSON: "per person", PER_VEHICLE: "per vehicle", PER_GROUP: "per group", PER_ITEM: "each" } as const;

function priceWhen(p: PublicPrice) {
  const parts = [];
  if (p.daysOfWeek) parts.push(dayList(p.daysOfWeek));
  if (p.timeFrom) parts.push(`${hhmm(p.timeFrom)}-${hhmm(p.timeTo)} sessions`);
  if (p.residency !== "ANY") parts.push(residencyLabels[p.residency]);
  return parts.join(" · ");
}

export function ActivityDetailPage() {
  const { slug = "" } = useParams();
  const activity = useQuery({ queryKey: ["activity", slug], queryFn: () => getActivity(slug), retry: false });
  const all = useQuery({ queryKey: ["activities"], queryFn: () => listActivities({}) });
  useDocumentTitle(activity.data?.seoTitle ?? "Things to Do in Cape Town | SL Tours", activity.data?.seoDescription);
  if (activity.isLoading) return <LoadingState label="Loading activity" />;
  if (activity.isError || !activity.data) return <section className="section explore-state"><ErrorState message="This activity could not be found. It may have been removed or renamed." />
    <Link className="button button-secondary" to="/explore">Back to Things to Do in Cape Town</Link></section>;
  const a: ActivityPage = activity.data;
  const current = a.prices.filter(p => p.currentlyEffective);
  const upcoming = a.prices.filter(p => !p.currentlyEffective);
  // Nearby ideas: same area first, then same interest.
  const others = (all.data ?? []).filter(o => o.slug !== a.slug);
  const nearby = [...others.filter(o => o.area === a.area), ...others.filter(o => o.area !== a.area && o.category === a.category)].slice(0, 3);
  const Icon = categoryIcons[a.category];
  return (
    <>
      <section className={`detail-hero${a.heroImage ? "" : " detail-hero-plain"}`} style={a.heroImage ? { backgroundImage: `linear-gradient(90deg, rgba(5, 30, 98, .88) 0%, rgba(5, 30, 98, .6) 45%, rgba(5, 30, 98, .15) 100%), url(${a.heroImage})` } : undefined}>
        {!a.heroImage && <Icon className="detail-hero-icon" aria-hidden="true" />}
        <div>
          <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/explore">Things to Do in Cape Town</Link><span aria-hidden="true">/</span>
            <span aria-current="page">{a.title}</span></nav>
          <p className="eyebrow">{categoryLabels[a.category]}</p>
          <h1>{a.title}</h1>
          <p>{a.summary}</p>
          <div className="detail-meta">
            <span><MapPin aria-hidden="true" />{a.areaLabel}</span>
            <span><Clock aria-hidden="true" />About {minutesLabel(a.durationMinutes)}</span>
            {a.weatherDependent && <span><CloudSun aria-hidden="true" />Weather dependent</span>}
          </div>
          <Link className="button button-primary" to={`/explore/plan?include=${a.slug}`}>Plan a day with this</Link>
        </div>
      </section>
      <section className="section detail-grid">
        <article>
          <h2>About this experience</h2>
          <p>{a.description}</p>
          <h3>Opening times</h3>
          {a.scheduleType === "SCHEDULE_VARIES" && <p>Times change daily. Check the operator's schedule before you go.</p>}
          {a.scheduleType === "ALWAYS_OPEN" && <p>No fixed opening hours.</p>}
          {a.hours.length > 0 && <div className="admin-table-wrap activity-table"><table>
            <thead><tr><th>{a.scheduleType === "SESSIONS" ? "Session" : "Hours"}</th><th>Days</th><th>Season</th></tr></thead>
            <tbody>{a.hours.map((h, i) => <tr key={i}>
              <td data-label={a.scheduleType === "SESSIONS" ? "Session" : "Hours"}>{hhmm(h.opens)}-{hhmm(h.closes)}{h.lastEntry && <small>Last entry {hhmm(h.lastEntry)}</small>}{h.notes && <small>{h.notes}</small>}
                {h.caution && <small className="activity-caution">Not confirmed: {h.caution}</small>}</td>
              <td data-label="Days">{dayList(h.daysOfWeek)}</td>
              <td data-label="Season">{h.seasonStart ? `${h.seasonLabel ? `${h.seasonLabel}: ` : ""}${monthDay(h.seasonStart)} - ${monthDay(h.seasonEnd!)}` : "All year"}</td>
            </tr>)}</tbody></table></div>}
          <h3>Prices</h3>
          <p className="activity-check"><ShieldCheck aria-hidden="true" />{priceStatusText[a.priceStatus]}{a.lastVerifiedOn ? `, last checked ${shortDate(a.lastVerifiedOn)}` : ""}.</p>
          {current.length > 0 && <PriceTable prices={current} />}
          {upcoming.length > 0 && <><h4>Announced prices</h4><PriceTable prices={upcoming} /></>}
          {a.extras.length > 0 && <><h4>Additional costs</h4><ul className="activity-extras">{a.extras.map(x =>
            <li key={x.label}><strong>{x.label}</strong>: {formatAmount(x.amountCents)} {unitLabel[x.unit]} {x.mandatory ? "(required)" : "(optional)"}{x.conditions && <small>{x.conditions}</small>}
            {x.caution && <small className="activity-caution">Not confirmed: {x.caution}</small>}</li>)}</ul></>}
          {(a.minAge != null || a.accompanimentRule || a.participationRules !== "KNOWN") && <><h3>Who can take part</h3><ul className="activity-extras">
            {a.minAge != null && <li>Minimum age {a.minAge}</li>}{a.accompanimentRule && <li>{a.accompanimentRule}</li>}
            {a.participationRules !== "KNOWN" && <li className="activity-caution">{a.participationRules === "UNKNOWN"
              ? "Age, height or other limits are not published" : "Limits are only partly published"}{a.participationNote ? `: ${a.participationNote.replace(/\.\s*$/, "")}` : ""}.
              Check with the operator before you go.</li>}</ul></>}
        </article>
        <aside className="booking-panel detail-panel">
          {a.address && <p className="detail-guests"><MapPin aria-hidden="true" />{a.address}</p>}
          {a.bookingNotes && <p>{a.bookingNotes}</p>}
          {a.officialUrl && <a className="button button-secondary" href={a.officialUrl} target="_blank" rel="noopener noreferrer"><ExternalLink aria-hidden="true" />Official website</a>}
          <Link className="button button-primary" to={`/explore/plan?include=${a.slug}`}>Plan a day with this</Link>
          <AssistantLauncher />
          <h3>Sources</h3>
          <ul className="activity-sources">{a.sources.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.publisher}</a>
            <small>{s.covers}. Checked {shortDate(s.accessedOn)}.</small></li>)}</ul>
          {a.supplierName ? <p className="form-note partner-disclosure">This experience is provided by {a.supplierName}, an SL Tours supplier partner.
            SL Tours has a commercial relationship with this supplier. Prices and times can change; confirm before you go.</p>
          : <p className="form-note">SL Tours is not the operator of this activity. Prices and times can change; confirm with the operator before you go.</p>}
        </aside>
      </section>
      {a.faqs.length > 0 && <section className="section faq-section">
        <p className="eyebrow">Questions</p>
        <div className="faq-grid">{a.faqs.map(f => <div key={f.question}><HelpCircle aria-hidden="true" /><p><strong>{f.question}</strong><br />{f.answer}</p></div>)}</div>
      </section>}
      <section className="section explore-next" aria-labelledby="explore-next-title">
        <div className="home-heading">
          <div><p className="eyebrow">Keep exploring</p><h2 id="explore-next-title">More things to do{nearby.some(o => o.area === a.area) ? ` near ${a.areaLabel}` : ""}</h2></div>
          <Link className="home-heading-link" to="/explore">All things to do</Link>
        </div>
        {nearby.length > 0 && <div className="package-grid explore-grid">{nearby.map(o => <ActivityCardView key={o.slug} activity={o} />)}</div>}
        <div className="explore-next-cta">
          <p>Combine {a.title} with other stops and see the whole day's timings and costs.</p>
          <Link className="button button-primary" to={`/explore/plan?include=${a.slug}`}>Plan a day with this</Link>
        </div>
      </section>
    </>
  );
}

function PriceTable({ prices }: { prices: PublicPrice[] }) {
  return <div className="admin-table-wrap activity-table"><table>
    <thead><tr><th>Ticket</th><th>Price</th><th>Valid</th></tr></thead>
    <tbody>{prices.map((p, i) => <tr key={i}>
      <td data-label="Ticket">{p.label}{priceWhen(p) && <small>{priceWhen(p)}</small>}{p.conditions && <small>{p.conditions}</small>}
        {p.caution && <small className="activity-caution">Not confirmed: {p.caution}</small>}</td>
      <td data-label="Price">{p.amountCents === 0 ? "Free" : formatAmount(p.amountCents)} <small>{unitLabel[p.unit]}</small></td>
      <td data-label="Valid">{p.effectiveFrom || p.effectiveTo ? `${p.effectiveFrom ? shortDate(p.effectiveFrom) : ""} - ${p.effectiveTo ? shortDate(p.effectiveTo) : "until changed"}` : "Until changed"}
        {p.sourceUrl && <small><a href={p.sourceUrl} target="_blank" rel="noopener noreferrer">{p.sourcePublisher ?? "Source"}</a>, checked {shortDate(p.verifiedOn)}</small>}</td>
    </tr>)}</tbody></table></div>;
}
