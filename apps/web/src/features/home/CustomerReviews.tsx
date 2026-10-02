import { useEffect, useState } from "react";
import { contact } from "../../lib/contact";

const ELFSIGHT_SCRIPT = "https://static.elfsight.com/platform/platform.js";
const ELFSIGHT_APP_CLASS = "elfsight-app-a7526722-da34-4ca8-bb16-bb263f4611d4";

function loadElfsight() {
  if (document.querySelector(`script[src="${ELFSIGHT_SCRIPT}"]`)) {
    return;
  }
  const script = document.createElement("script");
  script.src = ELFSIGHT_SCRIPT;
  script.async = true;
  document.body.appendChild(script);
}

export function CustomerReviews() {
  useEffect(loadElfsight, []);
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="reviews-band" aria-label="Customer reviews">
      <div className="reviews-inner">
        {/* The Elfsight Google Reviews widget renders its own "What Our Customers Say" heading. */}
        <div id="reviews-widget" className={expanded ? "reviews-widget" : "reviews-widget reviews-widget-collapsed"}>
          <div className={ELFSIGHT_APP_CLASS} data-elfsight-app-lazy />
        </div>
        <button
          className="button button-quiet reviews-toggle"
          type="button"
          aria-expanded={expanded}
          aria-controls="reviews-widget"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show fewer reviews" : "Show all reviews"}
        </button>
        <noscript>
          <p>
            Read our reviews on <a href={contact.googleReview}>Google</a> and{" "}
            <a href={contact.tripadvisorReview}>Tripadvisor</a>.
          </p>
        </noscript>
        <div className="rate-actions">
          <a
            className="button button-primary"
            href={contact.tripadvisorReview}
            target="_blank"
            rel="noopener noreferrer"
          >
            Rate us on Tripadvisor
          </a>
          <a className="button button-navy" href={contact.googleReview} target="_blank" rel="noopener noreferrer">
            Rate us on Google
          </a>
        </div>
      </div>
    </section>
  );
}
