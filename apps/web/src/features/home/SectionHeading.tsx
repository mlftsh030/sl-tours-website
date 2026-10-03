import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

/** Shared heading for homepage sections: eyebrow, title, short lead and a link to the full page. */
export function SectionHeading({ id, eyebrow, title, lead, link, linkLabel, tone = "light" }: {
  id: string; eyebrow: string; title: string; lead?: string; link?: string; linkLabel?: string; tone?: "light" | "dark";
}) {
  return <div className={`home-heading home-heading-${tone}`}>
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      {lead && <p className="home-heading-lead">{lead}</p>}
    </div>
    {link && linkLabel && <Link className="home-heading-link" to={link}>{linkLabel}<ArrowRight aria-hidden="true" /></Link>}
  </div>;
}
