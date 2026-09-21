import { useState } from "react";
import { requestPasswordReset } from "../repositories/authRepository";

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export default function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await requestPasswordReset(email);
      setMessage(result.message || "Instruksi reset password telah dikirim.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim permintaan reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#fffbf5", fontFamily: "Poppins, sans-serif" }}
    >
      <div className="w-full max-w-md rounded-3xl bg-white border-2 border-orange-100 shadow-xl p-6 sm:p-8">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-100 text-2xl">🔐</div>
          <h1
            className="mt-4 text-3xl font-black text-gray-800"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            Lupa Password
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Masukkan email yang terdaftar untuk menerima instruksi reset password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@seruni.test"
              required
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors bg-white"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-orange-200 hover:shadow-lg active:scale-95 disabled:opacity-60"
          >
            {loading ? "Mengirim..." : "Kirim Instruksi"}
          </button>

          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full text-sm font-semibold text-gray-600 hover:text-orange-500 transition-colors"
          >
            ← Kembali ke login
          </button>
        </form>
      </div>
    </div>
  );
}
