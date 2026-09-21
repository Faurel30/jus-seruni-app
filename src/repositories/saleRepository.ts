import { apiFetch } from "./api";
import type { Sale } from "../models/types";

export async function getSales(): Promise<Sale[]> {
  return apiFetch<Sale[]>("/sales");
}

export async function createSale(payload: {
  items: Array<{ menuItemId: string; name: string; qty: number; price: number }>;
  total: number;
  date?: string;
}) {
  return apiFetch<Sale & { items: Array<{ menuItemId?: number; menuId?: number; name: string; qty: number; price: number }> }>("/sales", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      items: payload.items.map((item) => ({
        ...item,
        menuItemId: Number(item.menuItemId),
      })),
    }),
  });
}
