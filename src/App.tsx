import { useEffect, useState } from "react";
import Landing from "./pages/Landing";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import MenuManagement from "./pages/MenuManagement";
import Cashier from "./pages/Cashier";
import Expenses from "./pages/Expenses";
import Account from "./pages/Account";
import Navbar from "./components/Navbar";
import { clearAuthSession, getStoredRole, isAuthenticated, setAuthenticated } from "./repositories/authRepository";

type Page = "dashboard" | "menu" | "cashier" | "expenses" | "account";
type Role = "admin" | "cashier" | "viewer";
type AuthView = "login" | "forgot";

export default function App() {
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [authView, setAuthView] = useState<AuthView>("login");
  const [page, setPage] = useState<Page>("dashboard");
  const [role, setRole] = useState<Role>(() => getStoredRole());
  const [viewerNotice, setViewerNotice] = useState(false);

  const canAccessPage = (nextPage: Page) => {
    if (role === "cashier") return nextPage === "cashier";
    return role !== "viewer" || nextPage === "dashboard";
  };

  useEffect(() => {
    const synced = isAuthenticated();
    setAuthed(synced);
    if (!synced) {
      setAuthView("login");
      setPage("dashboard");
      setViewerNotice(false);
      return;
    }

    const currentRole = getStoredRole();
    setRole(currentRole);
    if (currentRole === "cashier" && page !== "cashier") {
      setPage("cashier");
      setViewerNotice(false);
    } else if (currentRole === "viewer" && page !== "dashboard") {
      setPage("dashboard");
      setViewerNotice(false);
    }
  }, [page]);

  function handleLogin(nextRole?: string) {
    const currentRole = (nextRole as Role | undefined) ?? getStoredRole();
    setRole(currentRole);
    setAuthed(true);
    setPage(currentRole === "cashier" ? "cashier" : "dashboard");
    setAuthView("login");
  }

  function handleNavigate(nextPage: Page) {
    if (!canAccessPage(nextPage)) {
      setViewerNotice(true);
      setPage(role === "cashier" ? "cashier" : "dashboard");
      return;
    }

    setPage(nextPage);
  }

  function handleLogout() {
    clearAuthSession();
    setAuthenticated(false);
    setRole("admin");
    setAuthed(false);
    setViewerNotice(false);
    setAuthView("login");
    setPage("dashboard");
  }

  if (!authed) {
    if (authView === "forgot") {
      return <ForgotPassword onBackToLogin={() => setAuthView("login")} />;
    }

    return <Landing onLogin={handleLogin} onForgotPassword={() => setAuthView("forgot")} />;
  }

  return (
    <div className="min-h-screen" style={{ background: "#fffbf5" }}>
      <Navbar currentPage={page} role={role} onNavigate={handleNavigate} onLogout={handleLogout} />
      {page === "dashboard" && role !== "cashier" && <Dashboard />}
      {page === "menu" && role === "admin" && <MenuManagement />}
      {page === "cashier" && role !== "viewer" && <Cashier canCancel={role === "admin"} />}
      {page === "expenses" && role === "admin" && <Expenses />}
      {page === "account" && role === "admin" && <Account />}

      {viewerNotice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl text-center">
            <div className="text-4xl mb-3">👁️</div>
            <h3 className="text-xl font-black text-gray-800 mb-2" style={{ fontFamily: "Nunito, sans-serif" }}>
              Akses dibatasi
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              {role === "cashier"
                ? "Akun kasir hanya dapat memproses transaksi. Menu, laporan, pengeluaran, dan pengaturan akun dikelola owner."
                : "Akun ini hanya bisa melihat data. Fitur menu, kasir, dan pengeluaran tidak tersedia."}
            </p>
            <button
              onClick={() => setViewerNotice(false)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl"
            >
              Oke
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
