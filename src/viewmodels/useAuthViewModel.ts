import { useState } from "react";
import { login, setAuthenticated, isAuthenticated } from "../repositories/authRepository";

export function useAuthViewModel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function authenticate(username: string, password: string) {
    setLoading(true);
    setError("");

    try {
      const data = await login(username, password);
      setAuthenticated(true);
      setLoading(false);
      return data.user.role || "admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Username atau password salah.");
      setLoading(false);
      return false;
    }
  }

  function logout() {
    setAuthenticated(false);
  }

  return {
    loading,
    error,
    authenticate,
    logout,
    isAuthenticated: isAuthenticated(),
  };
}
