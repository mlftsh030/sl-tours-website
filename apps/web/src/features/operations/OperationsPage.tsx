import { Link, NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, LayoutDashboard, Map, BookOpen, Users, LogOut, Inbox, Car, IdCard, ClipboardCheck, BadgeDollarSign, Images } from "lucide-react";
import { useSession } from "../auth/useSession";
import { signOut } from "../auth/authApi";
import { LoadingState, ErrorState } from "../../components/StateBlocks";
import { DashboardPanel } from "./DashboardPanel";
import { ToursPanel } from "./ToursPanel";
import { BookingsPanel } from "./BookingsPanel";
import { CustomersPanel } from "./CustomersPanel";
import { EnquiriesPanel } from "./EnquiriesPanel";
import { VehiclesPanel } from "./VehiclesPanel";
import { DriversPanel } from "./DriversPanel";
import { AssignmentsPanel } from "./AssignmentsPanel";
import { PricingPanel } from "./PricingPanel";
import { SiteImagesPanel } from "./SiteImagesPanel";
import { useDocumentTitle } from "../../lib/useDocumentTitle";
import { useAdminLayout } from "./useAdminLayout";

export function OperationsPage() {
  useDocumentTitle("Administration | SL Tours");
  const session = useSession();
  const client = useQueryClient(); const navigate = useNavigate();
  const [error, setError] = useState(""); const [pending, setPending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  // Callback ref: the main area only exists once the session check has finished.
  const [main, setMain] = useState<HTMLElement | null>(null);
  useAdminLayout(main);
  useEffect(() => setMenuOpen(false), [pathname]);
  async function logout() {
    setPending(true); setError("");
    try { await signOut(); client.clear(); navigate("/login?admin=1", { replace: true }); }
    catch (err) { setError((err as Error).message); } finally { setPending(false); }
  }
  if (session.isLoading) return <LoadingState label="Checking your session" />;
  if (session.isError) return <ErrorState message={session.error.message} />;
  if (!session.data?.authenticated) return <Navigate to="/login?admin=1" replace />;
  if (session.data.role === "DRIVER") return <Navigate to="/driver" replace />;
  if (session.data.role !== "ADMIN" && session.data.role !== "STAFF") return <main className="auth-page"><div className="form-surface"><h1>Staff access required</h1><p>This account does not have permission to access administration.</p><Link to="/account">My bookings</Link><button className="button button-secondary" onClick={logout} disabled={pending}>Sign out</button>{error && <ErrorState message={error} />}</div></main>;
  const isAdmin = session.data.role === "ADMIN";
  const links = [
    { to: "/operations", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/operations/enquiries", label: "Enquiries", icon: Inbox },
    { to: "/operations/bookings", label: "Bookings", icon: BookOpen },
    { to: "/operations/trips", label: "Trips & inspections", icon: ClipboardCheck },
    { to: "/operations/vehicles", label: "Vehicles", icon: Car },
    ...(isAdmin ? [{ to: "/operations/drivers", label: "Drivers", icon: IdCard }] : []),
    { to: "/operations/tours", label: "Tours & prices", icon: Map },
    { to: "/operations/pricing", label: "Private-trip rates", icon: BadgeDollarSign },
    ...(isAdmin ? [{ to: "/operations/site-images", label: "Website images", icon: Images }] : []),
    { to: "/operations/customers", label: "Customers", icon: Users }
  ];
  return <div className="admin-shell">
    <aside className={`admin-sidebar${menuOpen ? " is-open" : ""}`}>
      <Link className="admin-brand" to="/operations"><img src="/assets/logo.png" width="44" height="44" alt="" /><span>SL Tours<strong>Administration</strong></span></Link>
      <button className="admin-menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="admin-nav" onClick={() => setMenuOpen(open => !open)}>
        <Menu aria-hidden="true" />{links.find(l => l.end ? pathname === l.to : pathname.startsWith(l.to))?.label ?? "Menu"}
      </button>
      <nav id="admin-nav" aria-label="Administration">{links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end}><Icon aria-hidden="true" />{label}</NavLink>)}</nav>
      <div className="admin-sidebar-bottom"><a href="/">View website</a><button onClick={logout} disabled={pending}><LogOut aria-hidden="true" />{pending ? "Signing out…" : "Sign out"}</button></div>
    </aside>
    <main className="admin-main" ref={setMain}>
      <header className="admin-topline"><span>Operations workspace</span><span>{session.data.name} · {session.data.role}</span></header>
      {error && <ErrorState message={error} />}
      <Routes>
        <Route index element={<DashboardPanel />} />
        <Route path="tours" element={<ToursPanel canEdit={isAdmin} />} />
        <Route path="bookings" element={<BookingsPanel isAdmin={isAdmin} />} />
        <Route path="trips" element={<AssignmentsPanel isAdmin={isAdmin} />} />
        <Route path="vehicles" element={<VehiclesPanel isAdmin={isAdmin} />} />
        <Route path="pricing" element={<PricingPanel isAdmin={isAdmin} />} />
        {isAdmin && <Route path="drivers" element={<DriversPanel />} />}
        {isAdmin && <Route path="site-images" element={<SiteImagesPanel />} />}
        <Route path="customers" element={<CustomersPanel />} />
        <Route path="enquiries" element={<EnquiriesPanel />} />
        <Route path="*" element={<Navigate to="/operations" replace />} />
      </Routes>
    </main>
  </div>;
}
