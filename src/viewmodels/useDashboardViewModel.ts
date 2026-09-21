import { useEffect, useMemo, useState } from "react";
import { getExpenses } from "../repositories/expenseRepository";
import { getSales } from "../repositories/saleRepository";
import type { Expense, Sale } from "../models/types";
import { formatRupiah, today, getLast7Days, getLast4Weeks, getLast6Months } from "../store";

export function useDashboardViewModel() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    async function load() {
      const [salesData, expenseData] = await Promise.all([getSales(), getExpenses()]);
      setSales(salesData);
      setExpenses(expenseData);
    }
    void load();
  }, []);

  const todayStr = today();
  const todaySales = sales.filter((sale) => sale.date === todayStr);
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const todayOrders = todaySales.length;
  const todayExpensesTotal = expenses.filter((expense) => expense.date === todayStr).reduce((sum, expense) => sum + expense.amount, 0);
  const todayProfit = todayRevenue - todayExpensesTotal;

  const chartData = useMemo(() => getLast7Days().map((date) => ({
    label: new Date(date).toLocaleDateString("id-ID", { weekday: "short" }),
    pemasukan: sales.filter((sale) => sale.date === date).reduce((sum, sale) => sum + sale.total, 0),
    pengeluaran: expenses.filter((expense) => expense.date === date).reduce((sum, expense) => sum + expense.amount, 0),
  })), [sales, expenses]);

  const recentSales = [...sales].sort((a, b) => Number(b.timestamp ?? 0) - Number(a.timestamp ?? 0)).slice(0, 5);
  const topProduct = useMemo(() => {
    const counts: Record<string, number> = {};
    sales.forEach((sale) => sale.items.forEach((item) => { counts[item.name] = (counts[item.name] ?? 0) + item.qty; }));
    const [name, qty] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? ["-", 0];
    return { name, qty };
  }, [sales]);

  return { sales, expenses, todayStr, todayRevenue, todayOrders, todayExpensesTotal, todayProfit, chartData, recentSales, topProduct, formatRupiah, getLast7Days, getLast4Weeks, getLast6Months };
}
