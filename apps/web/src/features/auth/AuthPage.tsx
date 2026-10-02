import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { signIn, register } from "./authApi";
import { ErrorState } from "../../components/StateBlocks";
import { useDocumentTitle } from "../../lib/useDocumentTitle";
import { IDLE_NOTICE_KEY } from "./useIdleSignOut";

function takeIdleNotice() {
  try {
    const shown = window.sessionStorage.getItem(IDLE_NOTICE_KEY) === "1";
    window.sessionStorage.removeItem(IDLE_NOTICE_KEY);
    return shown;
  } catch { return false; }
}

export function AuthPage({ registration = false }: { registration?: boolean }) {
  useDocumentTitle(registration ? "Create account | SL Tours" : "Sign in | SL Tours");
  const [params] = useSearchParams();
  const admin = params.get("admin") === "1";
  const navigate = useNavigate();
  const client = useQueryClient();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [idleNotice] = useState(takeIdleNotice);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")); const password = String(form.get("password"));
    try {
      if (registration) await register(String(form.get("name")), email, password);
      const session = await signIn(email, password);
      client.clear(); client.setQueryData(["session"], session);
      if (admin && session.role !== "ADMIN" && session.role !== "STAFF") {
        navigate(session.role === "DRIVER" ? "/driver" : "/operations", { replace: true }); return;
      }
      const next = params.get("next");
      const home = session.role === "CUSTOMER" ? "/account" : session.role === "DRIVER" ? "/driver" : "/operations";
      const destination = next && /^\/(?:book\/|book-private-trip(?:\/|$)|account(?:\/|$)|operations(?:\/|$)|driver(?:\/|$))/.test(next) ? next : home;
      if (destination.startsWith("/book/")) window.location.assign(destination);
      else navigate(destination, { replace: true });
    } catch (err) { setError((err as Error).message); } finally { setPending(false); }
  }
  return (
    <main className="auth-page">
      <a href="/" className="auth-brand"><img src="/assets/logo.png" alt="SL Tours home" width="64" height="64" /></a>
      <form className="form-surface auth-card" onSubmit={submit}>
        <p className="eyebrow">{admin ? "SL Tours administration" : "Your SL Tours account"}</p>
        <h1>{registration ? "Create your account" : "Welcome back"}</h1>
        <p>{registration ? "Save your bookings and follow their status." : "Sign in to continue."}</p>
        {idleNotice && <p className="form-note" role="status">You were signed out after 30 minutes of inactivity.</p>}
        {registration && <label>Name<input name="name" autoComplete="name" required maxLength={160} /></label>}
        <label>Email<input name="email" type="email" autoComplete="username" required maxLength={180} /></label>
        <label>Password<input name="password" type="password" autoComplete={registration ? "new-password" : "current-password"} required minLength={registration ? 12 : undefined} maxLength={64} /></label>
        {registration && <small>Use at least 12 characters. Passwords are case-sensitive.</small>}
        {error && <ErrorState message={error} />}
        <button type="submit" className="button button-primary" disabled={pending}>{pending ? "Please wait…" : registration ? "Create account" : "Sign in"}</button>
        {!admin && <p>{registration ? "Already have an account? " : "New to SL Tours? "}<Link to={`${registration ? "/login" : "/register"}${params.toString() ? `?${params.toString()}` : ""}`}>{registration ? "Sign in" : "Create an account"}</Link></p>}
        <a href="/">Back to website</a>
      </form>
    </main>
  );
}
