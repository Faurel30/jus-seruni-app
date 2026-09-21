import { apiFetch } from "./api";
import type { MenuItem } from "../models/types";

export async function getMenu(): Promise<MenuItem[]> {
  const data = await apiFetch<MenuItem[]>("/menu");
  return data.map((item) => ({
    ...item,
    id: String(item.id),
  }));
}

export async function saveMenu(items: MenuItem[]) {
  return items;
}

export async function createMenu(payload: Omit<MenuItem, "id">) {
  return apiFetch<MenuItem>("/menu", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      price: Number(payload.price),
      stock: Number(payload.stock),
    }),
  });
}

export async function updateMenu(id: string, payload: Partial<MenuItem>) {
  return apiFetch<MenuItem>(`/menu/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      ...payload,
      price: Number(payload.price),
      stock: Number(payload.stock),
    }),
  });
}

export async function deleteMenu(id: string) {
  return apiFetch<{ success: boolean; id: string }>(`/menu/${id}`, {
    method: "DELETE",
  });
}
