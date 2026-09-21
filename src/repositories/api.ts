const API_BASE_URL = "http://localhost:4000/api";

export function getAuthToken(): string {
  return sessionStorage.getItem("seruni_token") ?? "";
}

export function saveAuthToken(token: string) {
  sessionStorage.setItem("seruni_token", token);
}

export function clearAuthToken() {
  sessionStorage.removeItem("seruni_token");
}

export function clearAuthSession() {
  clearAuthToken();
  sessionStorage.removeItem("seruni_auth");
  sessionStorage.removeItem("seruni_role");
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers ?? {});

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let payload: T | null = null;

  if (text) {
    const trimmed = text.trim();
    const contentType = response.headers.get("content-type") ?? "";

    if (trimmed && (contentType.includes("application/json") || trimmed.startsWith("{") || trimmed.startsWith("["))) {
      try {
        payload = JSON.parse(trimmed) as T;
      } catch {
        throw new Error("Respons API tidak valid. Pastikan backend sedang berjalan dan merespons format JSON.");
      }
    } else {
      throw new Error("Respons API tidak valid. Pastikan backend sedang berjalan di http://localhost:4000.");
    }
  }

  if (!response.ok) {
    const hasValidToken = Boolean(getAuthToken());
    if (response.status === 401 && hasValidToken) {
      clearAuthSession();
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }

    throw new Error((payload as { message?: string } | null)?.message ?? "Permintaan gagal.");
  }

  return payload as T;
}
