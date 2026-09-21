import { useMemo, useState } from "react";
import { formatRupiah } from "../store";
import type { Category, MenuItem } from "../models/types";
import { useMenuViewModel } from "../viewmodels/useMenuViewModel";

const DEFAULT_CATEGORIES: Category[] = ["Jus Buah", "Pop Ice", "Burger"];

const CATEGORY_META: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  "Jus Buah": { icon: "🥤", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  "Pop Ice": { icon: "🧊", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  "Burger": { icon: "🍔", color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
};

const EMOJIS = ["🥑", "🥭", "🍊", "🍉", "🍓", "🍇", "🫐", "🍈", "🍋", "🍍", "🥝", "🍌", "🍫", "🧊", "🍔", "🌮", "🥪", "🍕"];

const emptyForm = { name: "", category: "Jus Buah" as Category, price: "", emoji: "🥤", stock: "10" };

export default function MenuManagement() {
  const { items, filtered, filterCat, setFilterCat, addItem, updateItem, deleteItem } = useMenuViewModel();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("seruni_menu_categories");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const categories = useMemo(
    () => Array.from(new Set([...DEFAULT_CATEGORIES, ...customCategories, ...items.map((item) => item.category)])),
    [customCategories, items],
  );

  function addCategory() {
    const category = newCategory.trim();
    if (!category || categories.some((item) => item.toLowerCase() === category.toLowerCase())) return;
    const next = [...customCategories, category];
    setCustomCategories(next);
    localStorage.setItem("seruni_menu_categories", JSON.stringify(next));
    setForm((current) => ({ ...current, category }));
    setNewCategory("");
  }

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(item: MenuItem) {
    setEditId(item.id);
    setForm({ name: item.name, category: item.category, price: String(item.price), emoji: item.emoji, stock: String(item.stock) });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const price = parseInt(form.price, 10);
    const stock = parseInt(form.stock, 10);
    if (!form.name.trim() || isNaN(price) || price <= 0 || isNaN(stock) || stock < 0) return;

    if (editId) {
      updateItem(editId, {
        name: form.name.trim(),
        category: form.category,
        price,
        emoji: form.emoji,
        stock,
      });
    } else {
      addItem({
        name: form.name.trim(),
        category: form.category,
        price,
        emoji: form.emoji,
        stock,
      });
    }
    setShowForm(false);
  }

  function confirmDelete() {
    if (!deleteId) return;
    deleteItem(deleteId);
    setDeleteId(null);
  }

  return (
    <div className="min-h-screen" style={{ background: "#fffbf5", fontFamily: "Poppins, sans-serif" }}>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>
              Manajemen Menu 🍽️
            </h1>
            <p className="text-gray-500 text-sm">{items.length} menu tersedia</p>
          </div>
          <button
            onClick={openAdd}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-orange-200 transition-all active:scale-95 flex items-center gap-2"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            <span>+</span> Tambah Menu
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {(["Semua", ...categories] as (Category | "Semua")[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${
                filterCat === cat
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-white border-2 border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-500"
              }`}
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              {cat !== "Semua" && (CATEGORY_META[cat] ?? { icon: "🏷️" }).icon + " "}
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">🍽️</p>
            <p className="text-sm">Belum ada menu. Tambahkan sekarang!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map((item) => {
              const meta = CATEGORY_META[item.category] ?? { icon: "🏷️", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" };
              return (
                <div
                  key={item.id}
                  className="bg-white border-2 border-gray-100 rounded-2xl p-4 flex flex-col gap-3 hover:border-orange-200 transition-all group"
                >
                  <div className={`w-12 h-12 ${meta.bg} ${meta.border} border-2 rounded-xl flex items-center justify-center text-2xl`}>
                    {item.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm leading-tight">{item.name}</p>
                    <span className={`text-xs font-semibold ${meta.color} ${meta.bg} px-2 py-0.5 rounded-lg mt-1 inline-block`}>
                      {item.category}
                    </span>
                    <p className="text-orange-500 font-black text-base mt-1" style={{ fontFamily: "Nunito, sans-serif" }}>
                      {formatRupiah(item.price)}
                    </p>
                    <p className={`text-[11px] font-bold mt-1 ${item.stock <= 5 ? "text-red-500" : "text-gray-500"}`}>
                      Stok: {item.stock}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(item)}
                      className="flex-1 text-xs font-bold py-1.5 rounded-xl bg-gray-50 text-gray-500 hover:bg-orange-50 hover:text-orange-500 border border-gray-200 transition-all"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="flex-1 text-xs font-bold py-1.5 rounded-xl bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-500 border border-gray-200 transition-all"
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-black text-gray-800 mb-5" style={{ fontFamily: "Nunito, sans-serif" }}>
              {editId ? "✏️ Edit Menu" : "➕ Tambah Menu"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Emoji Picker */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih Ikon</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                      className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center border-2 transition-all ${
                        form.emoji === e ? "border-orange-400 bg-orange-50 scale-110" : "border-gray-200 hover:border-orange-300"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Menu</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="contoh: Jus Alpukat"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }}
                    placeholder="Kategori baru, mis. Snack"
                    className="min-w-0 flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400"
                  />
                  <button type="button" onClick={addCategory} className="shrink-0 px-3 py-2 rounded-xl bg-orange-50 text-orange-600 text-xs font-bold hover:bg-orange-100">
                    + Kategori
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">Kategori baru akan tersimpan dan dapat dipilih saat menambah menu berikutnya.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Harga (Rp)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="contoh: 10000"
                  required
                  min={0}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stok Awal</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                  placeholder="contoh: 25"
                  required
                  min={0}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-md shadow-orange-200 transition-all"
                >
                  {editId ? "Simpan Perubahan" : "Tambahkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
            <p className="text-5xl">🗑️</p>
            <h2 className="text-lg font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>
              Hapus Menu?
            </h2>
            <p className="text-sm text-gray-500">Menu ini akan dihapus secara permanen.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold shadow-md"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
