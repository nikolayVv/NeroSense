// Central API client for the FastAPI backend.
// Default uses Vite dev proxy:
//   /api/v1 -> http://localhost:8000
//
// Optional override via `.env.local`:
//   VITE_API_BASE_URL=http://localhost:8000/api/v1

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "/api/v1";

const TOKEN_KEY = "nerosense.token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function formatApiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;

  const record = data as Record<string, unknown>;
  const detail = record.detail;
  if (typeof detail === "string" && detail.trim()) return detail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const message = (item as Record<string, unknown>).msg;
        return typeof message === "string" && message.trim() ? message : null;
      })
      .filter(Boolean) as string[];

    if (messages.length > 0) return messages.join("; ");
  }

  const message = record.message;
  if (typeof message === "string" && message.trim()) return message;

  return fallback;
}

type RequestOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: Record<string, string>;
  rawBody?: BodyInit;
  noAuth?: boolean;
};

export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers: Record<string, string> = { ...(opts.headers || {}) };

  if (!opts.noAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let body: BodyInit | undefined = opts.rawBody;
  if (body === undefined && opts.body !== undefined) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(url, { ...opts, headers, body });
  } catch {
    throw new ApiError(0, `Network error reaching ${url}. Is the backend running and CORS configured?`);
  }

  if (res.status === 401) setToken(null);

  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const fallback = res.statusText || "Request failed";
    const msg = formatApiErrorMessage(data, fallback);
    throw new ApiError(res.status, msg, data);
  }

  return data as T;
}
