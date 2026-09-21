import { useState } from "react";
import { useAuthViewModel } from "../viewmodels/useAuthViewModel";

interface LandingProps {
  onLogin: (role?: string) => void;
  onForgotPassword: () => void;
}

export default function Landing({ onLogin, onForgotPassword }: LandingProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const { loading, error, authenticate } = useAuthViewModel();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const role = await authenticate(username, password);
    if (role) {
      onLogin(typeof role === "string" ? role : undefined);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row"
      style={{ background: "#fffbf5", fontFamily: "Poppins, sans-serif" }}
    >
      {/* Left: Brand Panel */}
      <div className="flex-1 bg-orange-500 relative overflow-hidden flex flex-col justify-between p-10 min-h-[340px] md:min-h-screen">
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-yellow-400 opacity-30" />
        <div className="absolute bottom-10 -right-12 w-80 h-80 rounded-full bg-orange-700 opacity-20" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-green-400 opacity-20" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 font-black text-2xl shadow">
              S
            </div>
            <span
              className="text-white font-black text-3xl tracking-tight"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              seruni
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <p className="text-white/70 text-sm font-medium uppercase tracking-widest">
            Manajemen Usaha
          </p>
          <h1
            className="text-white font-black text-4xl md:text-5xl leading-tight"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            Segar, Manis,<br />& Terkelola 🍊
          </h1>
          <p className="text-white/80 text-base leading-relaxed max-w-xs">
            Catat pemasukan, kelola menu, dan pantau penjualan harianmu dalam satu tempat.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {["🥭 Jus Buah", "🍫 Pop Ice", "🍔 Burger"].map((m) => (
              <span
                key={m}
                className="bg-white/20 text-white text-sm font-semibold px-3 py-1 rounded-full"
                style={{ fontFamily: "Nunito, sans-serif" }}
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex gap-6">
          {[
            { label: "Menu Tersedia", val: "10+" },
            { label: "Kategori", val: "3" },
          ].map(({ label, val }) => (
            <div key={label}>
              <p
                className="text-white font-black text-2xl"
                style={{ fontFamily: "Nunito, sans-serif" }}
              >
                {val}
              </p>
              <p className="text-white/60 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Login Panel */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <h2
              className="text-3xl font-black text-gray-800"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              Selamat Datang 👋
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Masuk ke dashboard admin seruni
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors bg-white pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-orange-200 hover:shadow-lg active:scale-95 disabled:opacity-60"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              {loading ? "Masuk..." : "Masuk ke Dashboard →"}
            </button>

            <button
              type="button"
              onClick={onForgotPassword}
              className="w-full text-sm font-semibold text-orange-500 hover:text-orange-600 underline-offset-4 hover:underline transition-all"
            >
              Lupa password?
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
