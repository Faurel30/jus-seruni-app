import { apiFetch, clearAuthToken, getAuthToken, saveAuthToken } from "./api";

export const AUTH_KEY = "seruni_auth";

interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    fullName: string;
    role?: "admin" | "cashier" | "viewer";
  };
}

interface ProfileResponse {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: "admin" | "cashier" | "viewer";
  lastPasswordChangedAt?: string | null;
}

export async function login(username: string, password: string) {
  const data = await apiFetch<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  saveAuthToken(data.token);
  sessionStorage.setItem(AUTH_KEY, "1");
  sessionStorage.setItem("seruni_role", data.user.role || "admin");
  return data;
}

export function getStoredRole(): "admin" | "cashier" | "viewer" {
  const role = sessionStorage.getItem("seruni_role");
  return role === "viewer" || role === "cashier" || role === "admin" ? role : "admin";
}

export async function requestPasswordReset(email: string) {
  return apiFetch<{ message: string; token?: string }>('/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function getProfile() {
  return apiFetch<ProfileResponse>('/profile');
}

export async function updateProfile(email: string, fullName?: string) {
  return apiFetch<{ message: string; email?: string; fullName?: string }>('/profile', {
    method: 'PUT',
    body: JSON.stringify({ email, fullName }),
  });
}

export async function changePassword(oldPassword: string, newPassword: string) {
  return apiFetch<{ message: string }>('/profile/password', {
    method: 'PUT',
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}

export function getStoredPassword() {
  return "";
}

export function updatePassword(_newPassword: string) {
  return undefined;
}

export function clearAuthSession() {
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem("seruni_role");
  clearAuthToken();
}

export function setAuthenticated(value: boolean) {
  if (value) {
    sessionStorage.setItem(AUTH_KEY, "1");
    return;
  }

  clearAuthSession();
}

export function isAuthenticated() {
  return sessionStorage.getItem(AUTH_KEY) === "1" && Boolean(getAuthToken());
}
