import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useSession } from "../auth/useSession";
import { signOut } from "../auth/authApi";
import { request } from "../../lib/api";
import { ErrorState, LoadingState } from "../../components/StateBlocks";
import { Pagination } from "../operations/Pagination";
import { formatAmount as formatMoney } from "../../lib/format";
import { useDocumentTitle } from "../../lib/useDocumentTitle";
import type { BookingResponse, PageResult } from "../../types/api";
export function MyTripPage() {
  useDocumentTitle("My bookings | SL Tours");
  const session = useSession(); const client = useQueryClient(); const navigate = useNavigate();
  const [page, setPage] = useState(0); const [error, setError] = useState(""); const [pending, setPending] = useState(false);
  const bookings = useQuery({ queryKey: ["account", "bookings", page], queryFn: () => request<PageResult<BookingResponse>>(`/api/v1/account/bookings?page=${page}`), enabled: session.data?.role === "CUSTOMER", retry: false });
  async function logout() { setPending(true); try { await signOut(); client.clear(); navigate("/login"); } catch (err) { setError((err as Error).message); } finally { setPending(false); } }
  if (session.isLoading) return <LoadingState label="Checking your session" />;
  if (session.isError) return <ErrorState message={session.error.message} />;
  if (!session.data?.authenticated) return <Navigate to="/login?next=%2Faccount" replace />;
  if (session.data.role !== "CUSTOMER") return <Navigate to={session.data.role === "DRIVER" ? "/driver" : session.data.role === "PARTNER" ? "/partner" : "/operations"} replace />;
  return <main className="account-page section"><div className="admin-heading"><a href="/">SL Tours · Back to website</a><button className="button button-secondary" onClick={logout} disabled={pending}>Sign out</button></div>
    <p className="eyebrow">Your account</p><h1>Hello, {session.data.name}</h1><p>Your booking requests and their current status.</p>
    {error && <ErrorState message={error} />}{bookings.isLoading && <LoadingState label="Loading your bookings" />}{bookings.isError && <ErrorState message={bookings.error.message} />}
    {bookings.data && <><div className="account-bookings">{bookings.data.content.map(booking => <article className="form-surface" key={booking.reference}><span className="admin-badge">{booking.status.replace(/_/g, " ")}</span><h2>{booking.tourTitle}</h2><p>{booking.reference}</p><dl className="admin-detail-grid"><div><dt>Travel date</dt><dd>{booking.travelDate}</dd></div><div><dt>Guests</dt><dd>{booking.guests}</dd></div><div><dt>Booking total</dt><dd>{formatMoney(booking.totalAmountCents)}</dd></div><div><dt>Paid</dt><dd>{formatMoney(booking.amountPaidCents)}</dd></div></dl></article>)}</div>{!bookings.data.content.length && <div className="form-surface"><h2>Your next adventure starts here</h2><p>Bookings made while signed in will appear here. Contact SL Tours for help with earlier guest bookings.</p><a href="/experiences" className="button button-primary">Explore tours</a></div>}<Pagination page={page} totalPages={bookings.data.totalPages} totalElements={bookings.data.totalElements} onPage={setPage} /></>}
  </main>;
}
