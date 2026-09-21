interface NavbarProps {
  currentPage: string;
  role: "admin" | "cashier" | "viewer";
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const navLinks = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "menu", label: "Menu", icon: "🍽️" },
  { id: "cashier", label: "Kasir", icon: "🧾" },
  { id: "expenses", label: "Pengeluaran", icon: "💸" },
  { id: "account", label: "Akun", icon: "👤" },
];

export default function Navbar({ currentPage, role, onNavigate, onLogout }: NavbarProps) {
  return (
    <>
      <nav className="bg-white border-b-2 border-orange-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-lg shadow-md group-hover:scale-105 transition-transform">
              S
            </div>
            <span
              className="font-black text-xl tracking-tight text-orange-500"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              seruni
            </span>
          </button>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {(role === "cashier" ? navLinks.filter((link) => link.id === "cashier") : role === "viewer" ? navLinks.filter((link) => link.id === "dashboard") : navLinks).map((link) => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  currentPage === link.id
                    ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                    : "text-gray-500 hover:bg-orange-50 hover:text-orange-500"
                }`}
                style={{ fontFamily: "Nunito, sans-serif" }}
              >
                <span>{link.icon}</span>
                {link.label}
              </button>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {role !== "cashier" && <button
              onClick={() => onNavigate("account")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-orange-50 hover:text-orange-500 transition-all"
              style={{ fontFamily: "Nunito, sans-serif" }}
              title="Akun"
            >
              <span>🔑</span>
              <span className="hidden md:inline">Akun</span>
            </button>}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              <span>🚪</span>
              <span className="hidden md:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden border-t border-orange-100 flex overflow-x-auto">
          {(role === "cashier" ? navLinks.filter((link) => link.id === "cashier") : role === "viewer" ? navLinks.filter((link) => link.id === "dashboard") : navLinks).map((link) => (
            <button
              key={link.id}
              onClick={() => onNavigate(link.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-bold transition-all ${
                currentPage === link.id
                  ? "text-orange-500 border-t-2 border-orange-500"
                  : "text-gray-400 border-t-2 border-transparent"
              }`}
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
