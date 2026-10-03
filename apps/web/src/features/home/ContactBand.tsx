import { Mail, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { contact } from "../../lib/contact";

/** Closing contact section with one clear enquiry action. */
export function ContactBand() {
  return <section className="home-contact" aria-labelledby="home-contact-title">
    <div className="home-inner home-contact-grid">
      <div>
        <p className="eyebrow">Contact us</p>
        <h2 id="home-contact-title">Tell us about your trip</h2>
        <p>Send us your dates, group and interests and we will reply with options and a quote. Not sure yet? Plan My Trip helps you put it together.</p>
        <div className="home-actions">
          <Link className="button button-primary" to="/contact">Send an enquiry</Link>
          <Link className="button button-quiet button-on-dark" to="/plan-my-trip">Plan My Trip</Link>
        </div>
      </div>
      <ul className="home-contact-list">
        <li><Phone aria-hidden="true" /><a href={contact.phoneHref}>{contact.phoneDisplay}</a></li>
        <li><Mail aria-hidden="true" /><a href={`mailto:${contact.email}`}>{contact.email}</a></li>
        <li><MessageCircle aria-hidden="true" /><a href={contact.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp SL Tours</a></li>
      </ul>
    </div>
  </section>;
}
