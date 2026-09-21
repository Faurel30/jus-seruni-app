import { useEffect, useState } from "react";
import { getMenu } from "../repositories/menuRepository";
import { createSale, getSales } from "../repositories/saleRepository";
import { formatRupiah, today } from "../store";
import type { Category, MenuItem, Sale } from "../models/types";

const CATEGORY_TABS: (Category | "Semua")[] = ["Semua", "Jus Buah", "Pop Ice", "Burger"];

export default function Cashier({ canCancel = false }: { canCancel?: boolean }) {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [catFilter, setCatFilter] = useState<Category | "Semua">("Semua");
  const [sales, setSales] = useState<Sale[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const todayStr = today();

  useEffect(() => {
    async function loadData() {
      const [menuData, salesData] = await Promise.all([getMenu(), getSales()]);
      setMenu(menuData);
      setSales(salesData);
    }

    void loadData();
  }, []);

  const todaySales = sales.filter((s) => s.date === todayStr);

  function addToCart(item: MenuItem) {
    if (item.stock <= 0) return;
    setCart((c) => {
      const currentQty = c[item.id] ?? 0;
      if (currentQty >= item.stock) {
        window.alert(`Stok ${item.name} tersisa ${item.stock}.`);
        return c;
      }
      return { ...c, [item.id]: currentQty + 1 };
    });
  }

  function removeFromCart(itemId: string) {
    setCart((c) => {
      const next = { ...c };
      if ((next[itemId] ?? 0) <= 1) delete next[itemId];
      else next[itemId] -= 1;
      return next;
    });
  }

  function clearCart() {
    setCart({});
  }

  async function confirmCancel() {
    if (!cancelId) return;

    try {
      const response = await fetch(`http://localhost:4000/api/sales/${cancelId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("seruni_token") ?? ""}`,
        },
      });

      if (!response.ok) {
        throw new Error("Gagal membatalkan transaksi");
      }

      setSales((current) => current.filter((s) => s.id !== cancelId));
      setCancelId(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Gagal membatalkan transaksi.");
    }
  }

  const cancelTarget = sales.find((s) => s.id === cancelId);

  const cartItems: { item: MenuItem; qty: number }[] = Object.entries(cart)
    .map(([id, qty]) => ({ item: menu.find((m) => m.id === id)!, qty }))
    .filter((e) => e.item);

  const total = cartItems.reduce((a, { item, qty }) => a + item.price * qty, 0);

  async function confirmOrder() {
    if (cartItems.length === 0 || isSubmitting) return;

    const invalidItem = cartItems.find(({ item, qty }) => !Number.isInteger(qty) || qty <= 0 || qty > item.stock);
    if (invalidItem) {
      window.alert(`Kuantitas ${invalidItem.item.name} tidak valid atau melebihi stok tersedia.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const sale = await createSale({
        items: cartItems.map(({ item, qty }) => ({
          menuItemId: item.id,
          name: item.name,
          qty,
          price: item.price,
        })),
        total,
        date: todayStr,
      });

      const refreshedMenu = await getMenu();
      setMenu(refreshedMenu);
      setSales((current) => [sale, ...current]);
      setLastSale(sale);
      setCart({});
      setConfirmed(true);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Gagal menyimpan transaksi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function printReceipt() {
    window.print();
  }

  const filtered = catFilter === "Semua" ? menu : menu.filter((m) => m.category === catFilter);

  return (
    <div className="min-h-screen" style={{ background: "#fffbf5", fontFamily: "Poppins, sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-gray-800 mb-1" style={{ fontFamily: "Nunito, sans-serif" }}>
          Kasir 🧾
        </h1>
        <p className="text-gray-500 text-sm mb-6">Pilih menu untuk ditambah ke pesanan</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Menu */}
          <div className="lg:col-span-2 space-y-4">
            {/* Category Tabs */}
            <div className="flex gap-2 flex-wrap">
              {CATEGORY_TABS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat)}
                  className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${
                    catFilter === cat
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-white border-2 border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-500"
                  }`}
                  style={{ fontFamily: "Nunito, sans-serif" }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map((item) => {
                const inCart = cart[item.id] ?? 0;
                const isOutOfStock = item.stock <= 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    disabled={isOutOfStock}
                    className={`bg-white border-2 rounded-2xl p-4 text-left transition-all active:scale-95 relative ${
                      inCart > 0
                        ? "border-orange-400 shadow-md shadow-orange-100"
                        : "border-gray-100 hover:border-orange-200"
                    } ${isOutOfStock ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {inCart > 0 && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-black" style={{ fontFamily: "Nunito, sans-serif" }}>
                        {inCart}
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-x-2 bottom-2 text-center text-[10px] font-bold text-red-500 bg-red-50 rounded-full py-1">
                        Stok habis
                      </div>
                    )}
                    <p className="text-3xl mb-2">{item.emoji}</p>
                    <p className="font-bold text-gray-800 text-sm leading-tight">{item.name}</p>
                    <p className="text-orange-500 font-black text-sm mt-1" style={{ fontFamily: "Nunito, sans-serif" }}>
                      {formatRupiah(item.price)}
                    </p>
                    <p className={`text-[11px] font-bold mt-1 ${item.stock <= 5 ? "text-red-500" : "text-gray-500"}`}>
                      Stok: {item.stock}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Cart + Today's Sales */}
          <div className="space-y-4">
            {/* Cart */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 sticky top-24">
              <h2 className="text-base font-black text-gray-800 mb-4" style={{ fontFamily: "Nunito, sans-serif" }}>
                🛒 Pesanan
              </h2>

              {cartItems.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-3xl mb-1">🛒</p>
                  <p className="text-xs">Keranjang kosong</p>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {cartItems.map(({ item, qty }) => (
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700 truncate">{item.emoji} {item.name}</p>
                        <p className="text-xs text-gray-400">{formatRupiah(item.price)} × {qty}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-6 h-6 rounded-full bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 text-sm font-bold flex items-center justify-center transition-all"
                        >
                          −
                        </button>
                        <span className="text-sm font-black w-5 text-center" style={{ fontFamily: "Nunito, sans-serif" }}>{qty}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-6 h-6 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-600 text-sm font-bold flex items-center justify-center transition-all"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t-2 border-dashed border-gray-100 pt-3 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-600">Total</span>
                  <span className="text-lg font-black text-orange-500" style={{ fontFamily: "Nunito, sans-serif" }}>
                    {formatRupiah(total)}
                  </span>
                </div>
                <button
                  onClick={confirmOrder}
                  disabled={cartItems.length === 0 || isSubmitting}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-md shadow-green-200 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontFamily: "Nunito, sans-serif" }}
                >
                  {isSubmitting ? "Menyimpan..." : "✅ Konfirmasi Pesanan"}
                </button>
                {cartItems.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="w-full text-xs text-gray-400 hover:text-red-400 transition-colors"
                  >
                    Bersihkan keranjang
                  </button>
                )}
              </div>
            </div>

            {/* Today's Sales Summary */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-5">
              <h2 className="text-base font-black text-gray-800 mb-1" style={{ fontFamily: "Nunito, sans-serif" }}>
                📋 Riwayat Transaksi
              </h2>
              <p className="text-xs text-gray-400 mb-3">Hari ini: {todaySales.length} transaksi · {formatRupiah(todaySales.reduce((a, s) => a + s.total, 0))}</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {sales.length === 0 ? (
                  <p className="text-center text-gray-400 text-xs py-4">Belum ada riwayat transaksi</p>
                ) : (
                  sales.map((s) => (
                    <div key={s.id} className="bg-gray-50 rounded-xl px-3 py-2 group relative">
                      <p className="text-xs font-semibold text-gray-700 truncate pr-6">
                        {s.items.map((i) => `${i.name}×${i.qty}`).join(", ")}
                      </p>
                      <div className="flex justify-between mt-0.5">
                        <span className="text-xs text-gray-400">
                          {new Date(s.timestamp).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="text-xs font-black text-orange-500" style={{ fontFamily: "Nunito, sans-serif" }}>
                          {formatRupiah(s.total)}
                        </span>
                      </div>
                      {canCancel && <button
                        onClick={() => setCancelId(s.id)}
                        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gray-200 hover:bg-red-100 text-gray-400 hover:text-red-500 text-xs font-black flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                        title="Batalkan transaksi"
                      >
                        ×
                      </button>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Sale Confirm Modal */}
      {cancelId && cancelTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="text-center">
              <p className="text-4xl mb-2">⚠️</p>
              <h2 className="text-lg font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>
                Batalkan Transaksi?
              </h2>
              <p className="text-sm text-gray-500 mt-1">Transaksi ini akan dihapus dari penjualan hari ini.</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 space-y-1">
              {cancelTarget.items.map((i) => (
                <div key={i.menuItemId} className="flex justify-between text-sm">
                  <span className="text-gray-600">{i.name} × {i.qty}</span>
                  <span className="font-semibold text-gray-700">{formatRupiah(i.price * i.qty)}</span>
                </div>
              ))}
              <div className="border-t border-red-200 pt-2 flex justify-between font-black text-sm" style={{ fontFamily: "Nunito, sans-serif" }}>
                <span className="text-gray-700">Total</span>
                <span className="text-red-500">{formatRupiah(cancelTarget.total)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelId(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
              >
                Tidak, Kembali
              </button>
              <button
                onClick={confirmCancel}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold shadow-md shadow-red-200 transition-all"
                style={{ fontFamily: "Nunito, sans-serif" }}
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Success Modal */}
      {confirmed && lastSale && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div id="receipt" className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-4xl">
              ✅
            </div>
            <h2 className="text-xl font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>
              Nota Transaksi
            </h2>
            <p className="text-xs text-gray-400 -mt-3">#{lastSale.id} · {new Date(lastSale.timestamp).toLocaleString("id-ID")}</p>
            <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-1">
              {lastSale.items.map((i) => (
                <div key={i.menuItemId} className="flex justify-between text-sm">
                  <span className="text-gray-600">{i.name} × {i.qty}</span>
                  <span className="font-semibold text-gray-700">{formatRupiah(i.price * i.qty)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 flex justify-between font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>
                <span>Total</span>
                <span className="text-orange-500">{formatRupiah(lastSale.total)}</span>
              </div>
            </div>
            <div className="flex gap-3 print:hidden">
              <button onClick={printReceipt} className="flex-1 border-2 border-orange-200 text-orange-600 hover:bg-orange-50 font-bold py-3 rounded-xl transition-all" style={{ fontFamily: "Nunito, sans-serif" }}>
                Cetak Nota
              </button>
              <button onClick={() => setConfirmed(false)} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md shadow-orange-200 transition-all" style={{ fontFamily: "Nunito, sans-serif" }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
