import { useEffect, useState } from "react";
import { changePassword, getProfile, updateProfile } from "../repositories/authRepository";

export default function Account() {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [lastPasswordChangedAt, setLastPasswordChangedAt] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getProfile();
        setUsername(profile.username);
        setFullName(profile.fullName || "");
        setEmail(profile.email || "");
        setLastPasswordChangedAt(profile.lastPasswordChangedAt ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat profil.");
      }
    }

    void loadProfile();
  }, []);

  function formatDate(dateValue: string | null) {
    if (!dateValue) {
      return "Belum pernah diubah";
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return "Belum pernah diubah";
    }

    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingEmail(true);
    setMessage("");
    setError("");

    const trimmedEmail = email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      setError("Email belum diisi. Silakan masukkan email agar akun Anda lengkap.");
      setSavingEmail(false);
      return;
    }

    if (!emailPattern.test(trimmedEmail)) {
      setError("Format email tidak valid. Contoh: nama@email.com");
      setSavingEmail(false);
      return;
    }

    try {
      const result = await updateProfile(trimmedEmail, fullName.trim());
      setMessage(result.message || "Profil berhasil disimpan.");
      setFullName(result.fullName || fullName.trim());
      setEmail(trimmedEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan profil.");
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPassword(true);
    setMessage("");
    setError("");

    if (newPassword.length < 6) {
      setError("Password baru minimal 6 karakter.");
      setSavingPassword(false);
      return;
    }

    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError("Password baru harus mengandung huruf dan angka.");
      setSavingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      setSavingPassword(false);
      return;
    }

    try {
      const result = await changePassword(oldPassword, newPassword);
      setMessage(result.message || "Password berhasil diubah.");
      setLastPasswordChangedAt(new Date().toISOString());
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengganti password.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div>
        <h1 className="text-2xl font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>
          Pengaturan Akun
        </h1>
        <p className="text-gray-500 text-sm mt-1">Kelola profil, email, dan password akun Anda.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">{message}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-gray-100 rounded-3xl p-6">
          <h2 className="text-lg font-black text-gray-800 mb-5" style={{ fontFamily: "Nunito, sans-serif" }}>
            Informasi Akun
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
              <input
                value={username}
                disabled
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-100 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors bg-white"
              />
              {!email.trim() && (
                <p className="mt-2 text-xs text-amber-600">⚠️ Email belum diisi. Lengkapi email agar akun lebih siap dipakai.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={savingEmail}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-orange-200 disabled:opacity-60"
            >
              {savingEmail ? "Menyimpan..." : "Simpan Profil"}
            </button>
          </form>
        </div>

        <div className="bg-white border-2 border-gray-100 rounded-3xl p-6">
          <h2 className="text-lg font-black text-gray-800 mb-5" style={{ fontFamily: "Nunito, sans-serif" }}>
            Ganti Password
          </h2>

          <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700">
            <strong>Aturan:</strong> minimal 6 karakter, kombinasi huruf dan angka.
          </div>

          <div className="mb-4 text-sm text-gray-600">
            Terakhir diubah: <span className="font-semibold text-gray-700">{formatDate(lastPasswordChangedAt)}</span>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password Lama</label>
              <div className="relative">
                <input
                  type={showOld ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan password lama"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 pr-10 bg-white"
                />
                <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showOld ? "🙈" : "👁️"}</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password Baru</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 pr-10 bg-white"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showNew ? "🙈" : "👁️"}</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Konfirmasi Password Baru</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 pr-10 bg-white"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showConfirm ? "🙈" : "👁️"}</button>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded-xl transition-all shadow-md disabled:opacity-60"
            >
              {savingPassword ? "Mengubah..." : "Ubah Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
