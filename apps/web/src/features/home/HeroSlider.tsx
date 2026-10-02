import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSiteImages } from "../../lib/useSiteImages";

interface Slide { image: string; title: string; subtitle: string; text: string; alt?: string }

const builtInSlides: Slide[] = [
  {
    image: "/assets/home/slider-1.jpg",
    title: "Exceptional",
    subtitle: "Holiday in Cape Town",
    text: "With SL Tours where we offer excellent opportunities to explore South Africa"
  },
  {
    image: "/assets/home/slider-3.jpg",
    title: "Get your free entrance fee and",
    subtitle: "Lunch",
    text: "For Cape Town City tours"
  },
  {
    image: "/assets/home/slider-2.jpg",
    title: "Claim your Free Wine Tasting",
    subtitle: "with our Winelands Tours",
    text: ""
  }
];

const SLIDE_INTERVAL_MS = 6000;

function prefersReducedMotion() {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HeroSlider() {
  const managed = useSiteImages("HOME_HERO");
  // Built-in slides stay until an administrator activates replacement images.
  const slides: Slide[] = managed.length
    ? managed.map(image => ({ image: image.url, title: image.title ?? "", subtitle: image.subtitle ?? "", text: image.body ?? "", alt: image.altText }))
    : builtInSlides;
  const [current, setActive] = useState(0);
  const active = current % slides.length;
  const [paused, setPaused] = useState(prefersReducedMotion);

  useEffect(() => {
    if (paused) {
      return;
    }
    const timer = window.setTimeout(() => setActive((index) => (index + 1) % slides.length), SLIDE_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [active, paused, slides.length]);

  const go = (offset: number) => setActive((index) => (index + offset + slides.length) % slides.length);

  return (
    <section
      className="hero-slider"
      aria-roledescription="carousel"
      aria-label="SL Tours highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(prefersReducedMotion())}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(prefersReducedMotion())}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.image}
          className={index === active ? "hero-slide hero-slide-active" : "hero-slide"}
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${slides.length}`}
          aria-hidden={index !== active}
        >
          <div className="hero-slide-image" style={{ backgroundImage: `url(${slide.image})` }}
            {...(slide.alt ? { role: "img", "aria-label": slide.alt } : { "aria-hidden": true })} />
          <div className="hero-slide-content">
            {index === 0 ? <h1>{slide.title}</h1> : <p className="hero-slide-title">{slide.title}</p>}
            <p className="hero-slide-subtitle">{slide.subtitle}</p>
            {slide.text && <p className="hero-slide-text">{slide.text}</p>}
            <Link className="button button-navy" to="/experiences" tabIndex={index === active ? 0 : -1}>
              Learn More
            </Link>
          </div>
        </div>
      ))}
      <button
        className="slider-arrow slider-arrow-prev"
        type="button"
        onClick={() => go(-1)}
        aria-label="Previous slide"
      >
        <ChevronLeft aria-hidden="true" />
      </button>
      <button className="slider-arrow slider-arrow-next" type="button" onClick={() => go(1)} aria-label="Next slide">
        <ChevronRight aria-hidden="true" />
      </button>
      <div className="slider-dots">
        {slides.map((slide, index) => (
          <button
            key={slide.image}
            type="button"
            className={index === active ? "slider-dot slider-dot-active" : "slider-dot"}
            onClick={() => setActive(index)}
            aria-label={`Show slide ${index + 1}`}
            aria-current={index === active}
          />
        ))}
      </div>
    </section>
  );
}
