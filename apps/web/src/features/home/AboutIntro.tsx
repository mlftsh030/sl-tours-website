import { Link } from "react-router-dom";
import { SectionHeading } from "./SectionHeading";

const reasons = [
  { icon: "/assets/home/icon-10.png", text: "Knowledgeable, friendly local guides" },
  { icon: "/assets/home/icon-11.png", text: "Clean, safe and comfortable vehicles" },
  { icon: "/assets/home/icon-12.png", text: "Reliable and always on time" }
];

/** Short About section; copy is condensed from the About page. */
export function AboutIntro() {
  return <section className="home-section home-about" aria-labelledby="home-about-title">
    <div className="home-inner home-about-grid">
      <figure className="home-about-photo">
        <img src="/assets/home/owner.jpg" alt="Lisolethu Nkcaza, owner and guide of SL Tours" width="480" height="640" loading="lazy" />
      </figure>
      <div>
        <SectionHeading id="home-about-title" eyebrow="About SL Tours" title="Cape Town tours with a local team"
          lead="SL Tours is a proudly Black-owned, Cape Town-based tour company. Our guides know the routes, the history and the best places to stop, and we shape every day around your plans." />
        <ul className="home-reasons">
          {reasons.map(r => <li key={r.text}><img src={r.icon} alt="" width="36" height="36" loading="lazy" />{r.text}</li>)}
        </ul>
        <div className="home-actions">
          <Link className="button button-navy" to="/about">About SL Tours</Link>
          <Link className="button button-quiet" to="/contact">Talk to us</Link>
        </div>
      </div>
    </div>
  </section>;
}
