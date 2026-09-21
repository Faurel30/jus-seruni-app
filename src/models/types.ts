export type Category = string;

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
  date: string;
  timestamp: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}
