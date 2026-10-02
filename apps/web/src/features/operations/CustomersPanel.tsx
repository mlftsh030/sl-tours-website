import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listAdminCustomers } from "./operationsApi";
import { Pagination } from "./Pagination";
import { LoadingState, ErrorState } from "../../components/StateBlocks";
import { formatAmount as formatMoney } from "../../lib/format";
export function CustomersPanel() {
  const [page, setPage] = useState(0);
  const data = useQuery({ queryKey: ["admin", "customers", page], queryFn: () => listAdminCustomers(page), retry: false, refetchInterval: 30_000 });
  return <section><div className="admin-heading"><div><p className="eyebrow">People</p><h1>Customers</h1><p>Guest bookings and registered customers. Active sessions refresh every 30 seconds.</p></div></div>
    {data.isLoading && <LoadingState label="Loading customers" />}{data.isError && <ErrorState message={data.error.message} />}
    {data.data && <><div className="admin-table-wrap"><table><thead><tr><th>Customer</th><th>Contact</th><th>Account</th><th>Bookings</th><th>Booking value</th><th>Last sign-in</th><th>Active sessions</th></tr></thead><tbody>{data.data.content.map(customer => <tr key={customer.email}><td>{customer.name}</td><td><a href={`mailto:${customer.email}`}>{customer.email}</a><small>{customer.phone}</small></td><td><span className="admin-badge">{customer.registered ? "Registered" : "Guest"}</span></td><td>{customer.bookingCount}</td><td>{formatMoney(customer.totalAmountCents)}</td><td>{customer.lastLoginAt ? new Date(customer.lastLoginAt).toLocaleString() : "Never"}</td><td>{customer.activeSessions > 0 ? `${customer.activeSessions} active` : "Signed out"}</td></tr>)}</tbody></table>{!data.data.content.length && <p className="admin-empty">No customers yet.</p>}</div><Pagination page={page} totalPages={data.data.totalPages} totalElements={data.data.totalElements} onPage={setPage} /></>}
  </section>;
}
