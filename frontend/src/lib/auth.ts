// Mock auth — UI prototype only. Stores a user record in localStorage.
// NOT secure. Replace with real auth (Lovable Cloud) before production.

export type MockUser = {
  email: string;
  name: string;
  loggedInAt: string;
};

const KEY = "nerosense.user";

export function getUser(): MockUser | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MockUser) : null;
  } catch {
    return null;
  }
}

export function login(email: string, name?: string): MockUser {
  const user: MockUser = {
    email,
    name: name || email.split("@")[0],
    loggedInAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify(user));
  return user;
}

export function logout() {
  localStorage.removeItem(KEY);
}
