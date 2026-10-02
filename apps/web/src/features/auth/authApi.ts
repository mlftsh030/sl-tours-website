import { request } from "../../lib/api";
import type { Session } from "../../types/api";
export const getSession = () => request<Session>("/api/v1/auth/me");
export async function signIn(email: string, password: string) {
  await request<void>("/api/v1/auth/login", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: email, password }).toString()
  });
  return getSession();
}
export const signOut = () => request<void>("/api/v1/auth/logout", { method: "POST" });
export const register = (name: string, email: string, password: string) => request<void>("/api/v1/auth/register", {
  method: "POST", body: JSON.stringify({ name, email, password })
});
