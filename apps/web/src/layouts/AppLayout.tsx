import { applyReferral } from "../lib/referral";
import { WhatsAppIcon } from "../components/WhatsAppIcon";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LanguageSelector } from "../components/LanguageSelector";
import { SocialLinks } from "../components/SocialLinks";
import { contact } from "../lib/contact";
import { CurrencySelect } from "../lib/currency";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/experiences", label: "Our Tours" },
  { to: "/private-tours", label: "Private Tours" },
  { to: "/transfers", label: "Transfers" },
  { to: "/plan-my-trip", label: "Plan My Trip" },
  { to: "/gallery", label: "Gallery" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact Us" }
];

const whyChooseUs = [
  "Our guides are knowledgeable and friendly",
  "We have clean and safe Vehicles",
  "We are reliable and always on time",
  "Happiness of our Guests is our priority"
];

function SearchForm({ onDone }: { onDone?: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/experiences?q=${encodeURIComponent(trimmed)}` : "/experiences");
    onDone?.();
  }

  return (
    <form className="header-search" role="search" onSubmit={submit}>
      <label>
        <span className="sr-only">Search tours</span>
        <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tours..." />
      </label>
      <button className="icon-button" type="submit" aria-label="Search">
        <Search aria-hidden="true" />
      </button>
    </form>
  );
}

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const { pathname, search } = useLocation();
  // Partner referral links (?ref=CODE): validate and keep the code for later bookings and enquiries.
  useEffect(() => {
    const code = new URLSearchParams(search).get("ref");
    if (code && /^[A-Za-z0-9]{4,20}$/.test(code)) applyReferral(code, "LINK").catch(() => undefined);
  }, [search]);
  const overlay = pathname === "/";

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    closeButton.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className={overlay ? "site-header site-header-overlay" : "site-header"}>
        <div className="top-bar">
          <div className="top-bar-inner">
            <div className="top-bar-contact">
              <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </div>
            <div className="top-bar-tools">
              <CurrencySelect className="currency-select" />
              <LanguageSelector />
              <SocialLinks className="social-links top-bar-social" />
            </div>
          </div>
        </div>
        <div className="nav-bar">
          <NavLink to="/" className="brand" aria-label="SL Tours home">
            <img src="/assets/logo.png" alt="" width="56" height="56" />
          </NavLink>
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === "/"}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            <button
              className="icon-button"
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              aria-expanded={searchOpen}
              aria-label="Search tours"
            >
              <Search aria-hidden="true" />
            </button>
            <a className="text-link desktop-only" href="/account">
              My Trip
            </a>
            <NavLink className="button button-primary desktop-only" to="/experiences">
              Book Now
            </NavLink>
            <button className="icon-button mobile-only" type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <Menu aria-hidden="true" />
            </button>
          </div>
        </div>
        {searchOpen && <SearchForm onDone={() => setSearchOpen(false)} />}
        {menuOpen && (
          <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Mobile navigation">
            <div className="mobile-menu-header">
              <img src="/assets/logo.png" alt="SL Tours" width="48" height="48" />
              <button ref={closeButton} className="icon-button" type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Mobile navigation links">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === "/"} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </NavLink>
              ))}
              <a href="/account">My Trip</a>
              <a href="/operations">Operations</a>
            </nav>
            <a className="button button-primary" href={contact.whatsapp} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon aria-hidden="true" />
              WhatsApp SL Tours
            </a>
          </div>
        )}
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/assets/logo.png" alt="SL Tours" width="72" height="72" />
            <p>SL Tours offers excellent opportunities to explore South Africa.</p>
            <a className="footer-awards" href={contact.tripadvisorReview} target="_blank" rel="noopener noreferrer">
              <img src="/assets/home/award-2.svg" alt="Tripadvisor" width="140" height="30" loading="lazy" />
              <img src="/assets/home/award-1.svg" alt="SL Tours on Tripadvisor" width="65" height="65" loading="lazy" />
            </a>
          </div>
          <div>
            <h2>Why choose us</h2>
            <ul className="footer-list">
              {whyChooseUs.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Explore</h2>
            <ul className="footer-list">
              <li>
                <Link to="/experiences">Our Tours</Link>
              </li>
              <li>
                <Link to="/explore">Explore Cape Town</Link>
              </li>
              <li>
                <Link to="/book-private-trip">Book a Private Trip</Link>
              </li>
              <li>
                <Link to="/plan-my-trip">Plan My Trip</Link>
              </li>
              <li>
                <Link to="/partner-with-us">Partner with us</Link>
              </li>
              <li>
                <a href="/account">My Trip</a>
              </li>
              <li>
                <a href="/operations">Operations</a>
              </li>
            </ul>
          </div>
          <div>
            <h2>Contact Info</h2>
            <ul className="footer-list footer-contact">
              <li>Serving : {contact.serviceArea}</li>
              <li>
                Phone : <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
              </li>
              <li>
                Email : <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </li>
            </ul>
            <SocialLinks className="social-links footer-social" />
          </div>
        </div>
        <p className="copyright">Copyright {new Date().getFullYear()} SL tours, All Rights Reserved</p>
      </footer>
      <a className="whatsapp-float" href={contact.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Chat with SL Tours on WhatsApp">
        <WhatsAppIcon aria-hidden="true" />
      </a>
    </div>
  );
}
