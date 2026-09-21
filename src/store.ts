export type Category = "Jus Buah" | "Pop Ice" | "Burger";

export interface MenuItem {
  id: string;
  name: string;
  category: Category;
  price: number;
  emoji: string;
  stock: number;
}

export interface SaleItem {
  menuItemId: string;
  name: string;
  qty: number;
  price: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
}

const KEYS = {
  menu: "seruni_menu",
  sales: "seruni_sales",
  expenses: "seruni_expenses",
};

const defaultMenu: MenuItem[] = [
  { id: "m1", name: "Jus Alpukat", category: "Jus Buah", price: 10000, emoji: "🥑", stock: 25 },
  { id: "m2", name: "Jus Mangga", category: "Jus Buah", price: 8000, emoji: "🥭", stock: 30 },
  { id: "m3", name: "Jus Jeruk", category: "Jus Buah", price: 8000, emoji: "🍊", stock: 20 },
  { id: "m4", name: "Jus Semangka", category: "Jus Buah", price: 9000, emoji: "🍉", stock: 18 },
  { id: "m5", name: "Jus Jambu", category: "Jus Buah", price: 8000, emoji: "🍓", stock: 15 },
  { id: "m6", name: "Pop Ice Coklat", category: "Pop Ice", price: 6000, emoji: "🍫", stock: 40 },
  { id: "m7", name: "Pop Ice Taro", category: "Pop Ice", price: 6000, emoji: "🫐", stock: 35 },
  { id: "m8", name: "Pop Ice Melon", category: "Pop Ice", price: 6000, emoji: "🍈", stock: 32 },
  { id: "m9", name: "Burger Biasa", category: "Burger", price: 15000, emoji: "🍔", stock: 12 },
  { id: "m10", name: "Burger Special", category: "Burger", price: 20000, emoji: "🍔", stock: 10 },
];

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getMenu(): MenuItem[] {
  return load<MenuItem[]>(KEYS.menu, defaultMenu);
}
export function saveMenu(items: MenuItem[]) {
  save(KEYS.menu, items);
}

export function getSales(): Sale[] {
  return load<Sale[]>(KEYS.sales, []);
}
export function saveSales(sales: Sale[]) {
  save(KEYS.sales, sales);
}

export function getExpenses(): Expense[] {
  return load<Expense[]>(KEYS.expenses, []);
}
export function saveExpenses(expenses: Expense[]) {
  save(KEYS.expenses, expenses);
}

export function localDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? date.getFullYear();
  const month = parts.find((part) => part.type === "month")?.value ?? String(date.getMonth() + 1).padStart(2, "0");
  const day = parts.find((part) => part.type === "day")?.value ?? String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function today(): string {
  return localDateString();
}

export function formatRupiah(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Aggregate sales by date
export function salesByDate(sales: Sale[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const s of sales) {
    map[s.date] = (map[s.date] ?? 0) + s.total;
  }
  return map;
}

export function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return localDateString(d);
  });
}

export function getLast4Weeks(): { label: string; start: string; end: string }[] {
  return Array.from({ length: 4 }, (_, i) => {
    const end = new Date();
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return {
      label: `W${4 - i}`,
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  }).reverse();
}

export function getLast6Months(): { label: string; month: string }[] {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      label: d.toLocaleString("id-ID", { month: "short" }),
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    };
  });
}
