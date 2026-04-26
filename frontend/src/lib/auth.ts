// Auth client for the FastAPI backend.
// Endpoints:
//   POST /auth/register  — { email, password } → user object (no token)
//   POST /auth/login     — { email, password } → { access_token, token_type }
//
// Note: backend does not expose /auth/me, so we cache the email locally.

import { apiFetch, setToken, getToken } from "./api";

export type User = {
  email: string;
  name?: string;
  id?: string;
};

const USER_KEY = "nerosense.user";

export function getUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function setUser(u: User | null) {
  if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
  else localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export async function login(email: string, password: string): Promise<User> {
  const res = await apiFetch<{ access_token: string; token_type?: string }>(
    "/auth/login",
    {
      method: "POST",
      body: { email, password },
      noAuth: true,
    }
  );

  setToken(res.access_token);
  const user: User = { email };
  setUser(user);
  return user;
}

export async function register(
  email: string,
  password: string,
  name?: string
): Promise<User> {
  await apiFetch<User>("/auth/register", {
    method: "POST",
    body: { email, password, name },
    noAuth: true,
  });

  // Backend returns the user but no token — log in to get one
  return login(email, password);
}

export function logout() {
  setToken(null);
  setUser(null);
}
