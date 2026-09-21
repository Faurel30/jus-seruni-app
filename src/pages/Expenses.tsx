import { useEffect, useState } from "react";
import { createExpense, deleteExpense, getExpenses, updateExpense } from "../repositories/expenseRepository";
import { formatRupiah, today } from "../store";
import type { Expense } from "../models/types";

const EXPENSE_CATEGORIES = ["Bahan Baku", "Kemasan", "Operasional", "Gaji", "Lainnya"];

const CAT_META: Record<string, { icon: string; color: string; bg: string }> = {
  "Bahan Baku": { icon: "🥑", color: "text-green-700", bg: "bg-green-50" },
  "Kemasan": { icon: "🧴", color: "text-blue-700", bg: "bg-blue-50" },
  "Operasional": { icon: "⚡", color: "text-yellow-700", bg: "bg-yellow-50" },
  "Gaji": { icon: "💼", color: "text-purple-700", bg: "bg-purple-50" },
  "Lainnya": { icon: "📦", color: "text-gray-700", bg: "bg-gray-50" },
};

const emptyForm = { description: "", amount: "", category: "Bahan Baku", date: today() };

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>("Semua");
  const todayStr = today();

  useEffect(() => {
    async function loadExpenses() {
      const data = await getExpenses();
      setExpenses(data);
    }

    void loadExpenses();
  }, []);

  function openAdd() {
    setEditId(null);
    setForm({ ...emptyForm, date: todayStr });
    setShowForm(true);
  }

  function openEdit(exp: Expense) {
    setEditId(exp.id);
    setForm({ description: exp.description, amount: String(exp.amount), category: exp.category, date: exp.date });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseInt(form.amount, 10);
    if (!form.description.trim() || Number.isNaN(amount) || amount <= 0) return;

    try {
      if (editId) {
        const updated = await updateExpense(editId, {
          description: form.description.trim(),
          amount,
          category: form.category,
          date: form.date,
        });

        setExpenses((current) => current.map((x) => (x.id === editId ? updated : x)));
      } else {
        const created = await createExpense({
          description: form.description.trim(),
          amount,
          category: form.category,
          date: form.date,
        });

        setExpenses((current) => [created, ...current]);
      }

      setShowForm(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Gagal menyimpan pengeluaran.");
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;

    try {
      await deleteExpense(deleteId);
      setExpenses((current) => current.filter((x) => x.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Gagal menghapus pengeluaran.");
    }
  }

  const filtered = filterCat === "Semua" ? expenses : expenses.filter((x) => x.category === filterCat);
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date) || b.amount - a.amount);

  const todayTotal = expenses.filter((x) => x.date === todayStr).reduce((a, x) => a + x.amount, 0);
  const monthTotal = expenses.filter((x) => x.date.startsWith(todayStr.slice(0, 7))).reduce((a, x) => a + x.amount, 0);
  const allTotal = expenses.reduce((a, x) => a + x.amount, 0);

  return (
    <div className="min-h-screen" style={{ background: "#fffbf5", fontFamily: "Poppins, sans-serif" }}>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>
              Pengeluaran 💸
            </h1>
            <p className="text-gray-500 text-sm">Catat semua pengeluaran operasional</p>
          </div>
          <button
            onClick={openAdd}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-orange-200 transition-all active:scale-95 flex items-center gap-2"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            <span>+</span> Tambah
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Hari Ini", val: todayTotal, icon: "📅", color: "text-red-500", bg: "bg-red-50", border: "border-red-200" },
            { label: "Bulan Ini", val: monthTotal, icon: "📆", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
            { label: "Total", val: allTotal, icon: "📊", color: "text-gray-700", bg: "bg-gray-50", border: "border-gray-200" },
          ].map(({ label, val, icon, color, bg, border }) => (
            <div key={label} className={`${bg} border-2 ${border} rounded-2xl p-4`}>
              <span className="text-xl">{icon}</span>
              <p className={`text-lg font-black mt-1 ${color}`} style={{ fontFamily: "Nunito, sans-serif" }}>
                {formatRupiah(val)}
              </p>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {["Semua", ...EXPENSE_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterCat === cat
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-white border-2 border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-500"
              }`}
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              {cat !== "Semua" && CAT_META[cat]?.icon + " "}{cat}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden">
          {sorted.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-5xl mb-3">💸</p>
              <p className="text-sm">Belum ada catatan pengeluaran</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {sorted.map((exp) => {
                const meta = CAT_META[exp.category] ?? CAT_META["Lainnya"];
                return (
                  <div key={exp.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center text-xl flex-shrink-0`}>
                        {meta.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{exp.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${meta.bg} ${meta.color}`}>
                            {exp.category}
                          </span>
                          <span className="text-xs text-gray-400">{exp.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-red-500" style={{ fontFamily: "Nunito, sans-serif" }}>
                        −{formatRupiah(exp.amount)}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(exp)}
                          className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-all"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setDeleteId(exp.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                          title="Hapus"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-black text-gray-800 mb-5" style={{ fontFamily: "Nunito, sans-serif" }}>
              {editId ? "✏️ Edit Pengeluaran" : "➕ Tambah Pengeluaran"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Keterangan</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="contoh: Beli cup plastik 100pcs"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jumlah (Rp)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="contoh: 25000"
                  required
                  min={0}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tanggal</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-md shadow-orange-200"
                >
                  {editId ? "Simpan" : "Tambahkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
            <p className="text-5xl">🗑️</p>
            <h2 className="text-lg font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>Hapus Pengeluaran?</h2>
            <p className="text-sm text-gray-500">Data ini akan dihapus permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-500">
                Batal
              </button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold shadow-md">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
