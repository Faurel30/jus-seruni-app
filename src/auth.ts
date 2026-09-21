const PASS_KEY = "seruni_password";
const DEFAULT_PASS = "12345678";

export const ADMIN_USER = "admin";

export function getPassword(): string {
  return localStorage.getItem(PASS_KEY) ?? DEFAULT_PASS;
}

export function setPassword(newPass: string) {
  localStorage.setItem(PASS_KEY, newPass);
}

export function checkLogin(username: string, password: string): boolean {
  return username === ADMIN_USER && password === getPassword();
}
