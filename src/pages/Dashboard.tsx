import { useState } from "react";
import { formatRupiah } from "../store";
import { useDashboardViewModel } from "../viewmodels/useDashboardViewModel";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Period = "harian" | "mingguan" | "bulanan";

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>("harian");
  const { sales, expenses, todayRevenue, todayOrders, todayExpensesTotal, todayProfit, chartData, recentSales, topProduct, todayStr } = useDashboardViewModel();

  const periodChartData = (() => {
    if (period === "harian") return chartData;
    if (period === "mingguan") {
      return Array.from({ length: 4 }, (_, i) => {
        const end = new Date();
        end.setDate(end.getDate() - i * 7);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        const label = `W${4 - i}`;
        const pemasukan = sales
          .filter((sale) => sale.date >= start.toISOString().split("T")[0] && sale.date <= end.toISOString().split("T")[0])
          .reduce((sum, sale) => sum + sale.total, 0);
        const pengeluaran = expenses
          .filter((expense) => expense.date >= start.toISOString().split("T")[0] && expense.date <= end.toISOString().split("T")[0])
          .reduce((sum, expense) => sum + expense.amount, 0);
        return { label, pemasukan, pengeluaran };
      }).reverse();
    }

    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("id-ID", { month: "short" });
      const pemasukan = sales.filter((sale) => sale.date.startsWith(month)).reduce((sum, sale) => sum + sale.total, 0);
      const pengeluaran = expenses.filter((expense) => expense.date.startsWith(month)).reduce((sum, expense) => sum + expense.amount, 0);
      return { label, pemasukan, pengeluaran };
    });
  })();

  const stats = [
    {
      label: "Omset Hari Ini",
      value: formatRupiah(todayRevenue),
      icon: "💰",
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-600",
      sub: `${todayOrders} transaksi`,
    },
    {
      label: "Pengeluaran Hari Ini",
      value: formatRupiah(todayExpensesTotal),
      icon: "💸",
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-500",
      sub: "total pengeluaran",
    },
    {
      label: "Keuntungan Hari Ini",
      value: formatRupiah(todayProfit),
      icon: todayProfit >= 0 ? "📈" : "📉",
      bg: todayProfit >= 0 ? "bg-green-50" : "bg-red-50",
      border: todayProfit >= 0 ? "border-green-200" : "border-red-200",
      text: todayProfit >= 0 ? "text-green-600" : "text-red-500",
      sub: "pemasukan - pengeluaran",
    },
    {
      label: "Total Transaksi",
      value: todayOrders.toString(),
      icon: "🧾",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-700",
      sub: "pesanan hari ini",
    },
  ];

  const periodLabels: Record<Period, string> = {
    harian: "7 Hari Terakhir",
    mingguan: "4 Minggu Terakhir",
    bulanan: "6 Bulan Terakhir",
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "#fffbf5", fontFamily: "Poppins, sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-black text-gray-800"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              Dashboard 📊
            </h1>
            <p className="text-gray-500 text-sm">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-orange-200">
            🟢 Buka
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`${s.bg} border-2 ${s.border} rounded-2xl p-4 space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{s.icon}</span>
              </div>
              <p
                className={`text-xl font-black ${s.text}`}
                style={{ fontFamily: "Nunito, sans-serif" }}
              >
                {s.value}
              </p>
              <div>
                <p className="text-xs font-semibold text-gray-700">{s.label}</p>
                <p className="text-xs text-gray-400">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2
              className="text-lg font-black text-gray-800"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              Tren {periodLabels[period]}
            </h2>
            <div className="flex gap-2">
              {(["harian", "mingguan", "bulanan"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                    period === p
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-500"
                  }`}
                  style={{ fontFamily: "Nunito, sans-serif" }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={periodChartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v, name) => [
                  formatRupiah(Number(v) || 0),
                  name === "pemasukan" ? "Pemasukan" : "Pengeluaran",
                ]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "2px solid #fed7aa",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="pemasukan" fill="#f97316" radius={[6, 6, 0, 0]} name="pemasukan" />
              <Bar dataKey="pengeluaran" fill="#fca5a5" radius={[6, 6, 0, 0]} name="pengeluaran" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-orange-500 inline-block" /> Pemasukan
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-300 inline-block" /> Pengeluaran
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-5">
            <p className="text-xs font-bold uppercase text-gray-400">Produk Terlaris</p>
            <p className="text-xl font-black text-gray-800 mt-2" style={{ fontFamily: "Nunito, sans-serif" }}>
              {topProduct.name}
            </p>
            <p className="text-sm text-gray-500 mt-1">Terjual {topProduct.qty} pcs</p>
          </div>
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-5">
            <p className="text-xs font-bold uppercase text-gray-400">Catatan Penting</p>
            <p className="text-sm text-gray-600 mt-2">
              {sales.length === 0
                ? "Belum ada transaksi yang tercatat."
                : `Total transaksi tersimpan: ${sales.length}`}
            </p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
          <h2
            className="text-lg font-black text-gray-800 mb-4"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            Transaksi Terbaru
          </h2>
          {recentSales.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">🧾</p>
              <p className="text-sm">Belum ada transaksi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSales.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      {s.items.map((i) => `${i.name} x${i.qty}`).join(", ")}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(s.timestamp).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {s.date}
                    </p>
                  </div>
                  <span
                    className="text-orange-600 font-black text-sm"
                    style={{ fontFamily: "Nunito, sans-serif" }}
                  >
                    {formatRupiah(s.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
